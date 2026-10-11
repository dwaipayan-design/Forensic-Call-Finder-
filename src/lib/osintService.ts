/**
 * OSINT Telecommunication Number Lookup Service
 * Performs authentic local ITU-T E.164 validation via libphonenumber-js,
 * real live DNS-over-HTTPS (DoH) ENUM lookups (RFC 3761 e164.arpa),
 * and public numbering plan registry queries.
 *
 * NOTE: Ordinary web and Android client applications do not have access to
 * private carrier HLR/VLR subscriber registers or SS7/MAP signalling infrastructure.
 * This service never fabricates subscriber presence, MSC nodes, or carrier status.
 */

import parsePhoneNumberFromString, { CountryCode as LibCountryCode, NumberType } from 'libphonenumber-js';

export interface PhoneValidationResult {
  rawInput: string;
  formattedE164: string | null;
  formattedNational: string | null;
  formattedInternational: string | null;
  rfc3966Uri: string | null;
  countryIso: string | null;
  countryCallingCode: string | null;
  isValid: boolean;
  isPossible: boolean;
  numberType: string;
}

export interface DnsEnumResult {
  queryDomain: string;
  resolver: string;
  httpStatus: number;
  dnsStatusCode: number;
  dnsStatusName: string;
  hasNaptr: boolean;
  naptrRecords: string[];
  latencyMs: number;
  source: string;
  summary: string;
}

export interface PublicRegistryResult {
  queried: boolean;
  source: string;
  title?: string;
  snippet?: string;
  prefix?: string;
  summary: string;
}

export interface OsintLookupEvent {
  level: 'info' | 'success' | 'warning' | 'error';
  message: string;
  timestamp: string;
}

export interface OsintCompleteResult {
  timestamp: string;
  validation: PhoneValidationResult;
  dnsEnum: DnsEnumResult;
  publicRegistry: PublicRegistryResult;
  events: OsintLookupEvent[];
}

export class OsintService {
  /**
   * Validate and parse a phone number using genuine libphonenumber-js
   */
  static validatePhoneNumber(
    inputNumber: string,
    defaultCountryIso?: string
  ): { result: PhoneValidationResult; event: OsintLookupEvent } {
    const now = new Date().toTimeString().split(' ')[0];
    const cleaned = inputNumber.trim();

    try {
      const parsed = parsePhoneNumberFromString(
        cleaned,
        (defaultCountryIso?.toUpperCase() as LibCountryCode) || undefined
      );

      if (!parsed) {
        return {
          result: {
            rawInput: inputNumber,
            formattedE164: null,
            formattedNational: null,
            formattedInternational: null,
            rfc3966Uri: null,
            countryIso: null,
            countryCallingCode: null,
            isValid: false,
            isPossible: false,
            numberType: 'INVALID',
          },
          event: {
            level: 'error',
            message: `[Local Validation] Unable to parse "${inputNumber}" - input contains no valid dialable digits or unrecognized country prefix.`,
            timestamp: now,
          },
        };
      }

      const isValid = parsed.isValid();
      const isPossible = parsed.isPossible();
      const numType = parsed.getType() || (isValid ? 'FIXED_OR_MOBILE' : 'UNKNOWN');

      return {
        result: {
          rawInput: inputNumber,
          formattedE164: parsed.format('E.164'),
          formattedNational: parsed.formatNational(),
          formattedInternational: parsed.formatInternational(),
          rfc3966Uri: parsed.getURI(),
          countryIso: parsed.country || null,
          countryCallingCode: parsed.countryCallingCode ? `+${parsed.countryCallingCode}` : null,
          isValid,
          isPossible,
          numberType: numType,
        },
        event: {
          level: isValid ? 'success' : isPossible ? 'warning' : 'error',
          message: isValid
            ? `[Local Validation] Successfully validated ITU-T E.164: ${parsed.format('E.164')} (Type: ${numType}, Region: ${parsed.country || 'International'})`
            : isPossible
            ? `[Local Validation] Possible number length but unallocated ITU range for region ${parsed.country || 'Unknown'}`
            : `[Local Validation] Invalid number format for region ${parsed.country || 'Unknown'}`,
          timestamp: now,
        },
      };
    } catch (err: any) {
      return {
        result: {
          rawInput: inputNumber,
          formattedE164: null,
          formattedNational: null,
          formattedInternational: null,
          rfc3966Uri: null,
          countryIso: null,
          countryCallingCode: null,
          isValid: false,
          isPossible: false,
          numberType: 'ERROR',
        },
        event: {
          level: 'error',
          message: `[Local Validation] Error processing number: ${err?.message || 'Parser exception'}`,
          timestamp: now,
        },
      };
    }
  }

  /**
   * Perform authentic DNS-over-HTTPS RFC 3761 ENUM query
   */
  static async queryDnsOverHttpsEnum(
    e164Number: string,
    onLog?: (event: OsintLookupEvent) => void
  ): Promise<DnsEnumResult> {
    const now = () => new Date().toTimeString().split(' ')[0];
    const digitsOnly = e164Number.replace(/\D/g, '');

    // Reverse digits for RFC 3761 ENUM domain e.g. 1.0.5.5.5.1.4.1.e164.arpa
    const reversed = digitsOnly.split('').reverse().join('.');
    const domain = `${reversed}.e164.arpa`;

    onLog?.({
      level: 'info',
      message: `[DoH ENUM] Formatted RFC 3761 domain: ${domain}`,
      timestamp: now(),
    });

    onLog?.({
      level: 'info',
      message: `[DoH ENUM] Dispatching live NAPTR query to Cloudflare DoH (1.1.1.1)...`,
      timestamp: now(),
    });

    const startTime = performance.now();
    let resolver = 'Cloudflare 1.1.1.1 (DoH)';
    let url = `https://cloudflare-dns.com/dns-query?name=${encodeURIComponent(domain)}&type=NAPTR`;

    try {
      let res = await fetch(url, {
        headers: { Accept: 'application/dns-json' },
      });

      // If Cloudflare returns non-200, try Google DNS
      if (!res.ok) {
        resolver = 'Google 8.8.8.8 (DoH)';
        url = `https://dns.google/resolve?name=${encodeURIComponent(domain)}&type=NAPTR`;
        res = await fetch(url);
      }

      const latencyMs = Math.round(performance.now() - startTime);

      if (res.ok) {
        const data = await res.json();
        const dnsStatus = data.Status;
        const dnsStatusMap: Record<number, string> = {
          0: 'NOERROR (Zone Exists)',
          1: 'FORMERR (Format Error)',
          2: 'SERVFAIL (Server Failure)',
          3: 'NXDOMAIN (Domain Non-Existent in Root)',
          4: 'NOTIMP (Not Implemented)',
          5: 'REFUSED (Query Refused)',
        };
        const statusName = dnsStatusMap[dnsStatus] || `RCODE ${dnsStatus}`;

        const naptrRecords: string[] = [];
        if (data.Answer && Array.isArray(data.Answer)) {
          for (const ans of data.Answer) {
            if (ans.data) naptrRecords.push(String(ans.data));
          }
        }

        const hasNaptr = naptrRecords.length > 0;
        const summary = hasNaptr
          ? `Found ${naptrRecords.length} NAPTR routing record(s) in e164.arpa root`
          : dnsStatus === 3
          ? `NXDOMAIN: Number is not published in public Tier-1 e164.arpa registry`
          : `NOERROR returned with 0 NAPTR records`;

        onLog?.({
          level: hasNaptr ? 'success' : 'info',
          message: `[DoH ENUM] Resolver ${resolver} answered with Status ${dnsStatus} [${statusName}] in ${latencyMs}ms.`,
          timestamp: now(),
        });

        if (hasNaptr) {
          naptrRecords.forEach((rec, i) => {
            onLog?.({
              level: 'success',
              message: `[DoH ENUM] Record #${i + 1}: ${rec}`,
              timestamp: now(),
            });
          });
        } else {
          onLog?.({
            level: 'info',
            message: `[DoH ENUM] Result: ${summary}. (Standard behavior for unlisted consumer numbers)`,
            timestamp: now(),
          });
        }

        return {
          queryDomain: domain,
          resolver,
          httpStatus: res.status,
          dnsStatusCode: dnsStatus,
          dnsStatusName: statusName,
          hasNaptr,
          naptrRecords,
          latencyMs,
          source: `${resolver} over HTTPS`,
          summary,
        };
      } else {
        const latencyMs = Math.round(performance.now() - startTime);
        onLog?.({
          level: 'warning',
          message: `[DoH ENUM] Server responded with HTTP status ${res.status}.`,
          timestamp: now(),
        });

        return {
          queryDomain: domain,
          resolver,
          httpStatus: res.status,
          dnsStatusCode: -1,
          dnsStatusName: `HTTP ${res.status}`,
          hasNaptr: false,
          naptrRecords: [],
          latencyMs,
          source: resolver,
          summary: `HTTP ${res.status} returned by public resolver`,
        };
      }
    } catch (err: any) {
      const latencyMs = Math.round(performance.now() - startTime);
      onLog?.({
        level: 'warning',
        message: `[DoH ENUM] Network error querying resolver: ${err?.message || 'Connection failure'}`,
        timestamp: now(),
      });

      return {
        queryDomain: domain,
        resolver,
        httpStatus: 0,
        dnsStatusCode: -1,
        dnsStatusName: 'Network Error',
        hasNaptr: false,
        naptrRecords: [],
        latencyMs,
        source: resolver,
        summary: `Query failed: ${err?.message || 'Network unreachable'}`,
      };
    }
  }

  /**
   * Query public Wikipedia MediaWiki search API for documented national numbering plans
   */
  static async queryPublicNumberingRegistry(
    countryCallingCode: string,
    nationalDigits: string,
    onLog?: (event: OsintLookupEvent) => void
  ): Promise<PublicRegistryResult> {
    const now = () => new Date().toTimeString().split(' ')[0];
    const digits = nationalDigits.replace(/\D/g, '');

    // Formulate search query based on national prefix
    let searchQuery = '';
    let prefix = '';

    if (countryCallingCode === '+1' && digits.length >= 3) {
      prefix = digits.substring(0, 3);
      searchQuery = `Area code ${prefix}`;
    } else if (countryCallingCode === '+44' && digits.length >= 3) {
      prefix = digits.substring(0, 4);
      searchQuery = `Telephone numbers in the United Kingdom ${prefix}`;
    } else if (countryCallingCode === '+91' && digits.length >= 4) {
      prefix = digits.substring(0, 4);
      searchQuery = `Mobile telephone numbering in India ${prefix}`;
    } else if (countryCallingCode === '+61' && digits.length >= 2) {
      prefix = digits.substring(0, 2);
      searchQuery = `Telephone numbers in Australia ${prefix}`;
    } else if (digits.length >= 3) {
      prefix = digits.substring(0, 3);
      searchQuery = `Telephone numbers country calling code ${countryCallingCode}`;
    } else {
      return {
        queried: false,
        source: 'Wikipedia MediaWiki Public API',
        summary: 'Insufficient digits to perform national numbering plan prefix lookup.',
      };
    }

    onLog?.({
      level: 'info',
      message: `[Public Registry] Querying Wikipedia MediaWiki for national numbering plan: "${searchQuery}"...`,
      timestamp: now(),
    });

    try {
      const wikiUrl = `https://en.wikipedia.org/w/api.php?action=query&list=search&srsearch=${encodeURIComponent(
        searchQuery
      )}&format=json&origin=*`;

      const res = await fetch(wikiUrl);
      if (res.ok) {
        const data = await res.json();
        if (data.query?.search && data.query.search.length > 0) {
          const topHit = data.query.search[0];
          const cleanSnippet = topHit.snippet.replace(/<[^>]*>?/gm, '');

          onLog?.({
            level: 'success',
            message: `[Public Registry] Match found in Wikipedia directory: "${topHit.title}"`,
            timestamp: now(),
          });
          onLog?.({
            level: 'info',
            message: `[Public Registry] Excerpt: "${cleanSnippet.substring(0, 120)}..."`,
            timestamp: now(),
          });

          return {
            queried: true,
            source: 'Wikipedia Public Directory (MediaWiki API)',
            title: topHit.title,
            snippet: cleanSnippet,
            prefix,
            summary: `Prefix ${prefix} matched: "${topHit.title}"`,
          };
        } else {
          onLog?.({
            level: 'info',
            message: `[Public Registry] No public Wikipedia directory page found for query: "${searchQuery}".`,
            timestamp: now(),
          });

          return {
            queried: true,
            source: 'Wikipedia Public Directory (MediaWiki API)',
            prefix,
            summary: `No public Wikipedia numbering plan page returned for prefix ${prefix}.`,
          };
        }
      } else {
        onLog?.({
          level: 'warning',
          message: `[Public Registry] HTTP ${res.status} returned by Wikipedia API.`,
          timestamp: now(),
        });

        return {
          queried: true,
          source: 'Wikipedia Public Directory (MediaWiki API)',
          summary: `HTTP ${res.status} returned by public registry.`,
        };
      }
    } catch (err: any) {
      onLog?.({
        level: 'warning',
        message: `[Public Registry] Failed to connect to Wikipedia API: ${err?.message || 'Network error'}`,
        timestamp: now(),
      });

      return {
        queried: true,
        source: 'Wikipedia Public Directory (MediaWiki API)',
        summary: `Connection error querying public directory: ${err?.message || 'Network error'}`,
      };
    }
  }

  /**
   * Execute full genuine OSINT pipeline
   */
  static async runLookup(
    rawInput: string,
    selectedCountryIso: string,
    onLogEvent: (event: OsintLookupEvent) => void
  ): Promise<OsintCompleteResult> {
    const now = () => new Date().toTimeString().split(' ')[0];
    const events: OsintLookupEvent[] = [];

    const logAndRecord = (event: OsintLookupEvent) => {
      events.push(event);
      onLogEvent(event);
    };

    // Step 1: Initialize
    logAndRecord({
      level: 'info',
      message: `[Pipeline] Initiating genuine phone lookup sequence for input: "${rawInput}" (Region: ${selectedCountryIso})...`,
      timestamp: now(),
    });

    // Step 2: Local Validation using libphonenumber-js
    const { result: validation, event: valEvent } = this.validatePhoneNumber(
      rawInput,
      selectedCountryIso
    );
    logAndRecord(valEvent);

    if (!validation.isPossible && !validation.isValid) {
      logAndRecord({
        level: 'error',
        message: `[Pipeline] Aborting remote lookups: Input is not a possible phone number for region ${selectedCountryIso}.`,
        timestamp: now(),
      });

      return {
        timestamp: new Date().toISOString(),
        validation,
        dnsEnum: {
          queryDomain: 'N/A',
          resolver: 'N/A',
          httpStatus: 0,
          dnsStatusCode: -1,
          dnsStatusName: 'Skipped',
          hasNaptr: false,
          naptrRecords: [],
          latencyMs: 0,
          source: 'N/A',
          summary: 'Skipped due to invalid number format',
        },
        publicRegistry: {
          queried: false,
          source: 'N/A',
          summary: 'Skipped due to invalid number format',
        },
        events,
      };
    }

    // Step 3: Live DNS-over-HTTPS ENUM Query
    const e164 = validation.formattedE164 || rawInput;
    const dnsEnum = await this.queryDnsOverHttpsEnum(e164, logAndRecord);

    // Step 4: Public Numbering Plan Query
    const callingCode = validation.countryCallingCode || '';
    const nationalDigits = validation.formattedNational || rawInput;
    const publicRegistry = await this.queryPublicNumberingRegistry(
      callingCode,
      nationalDigits,
      logAndRecord
    );

    // Step 5: Final Statement with Honest Disclaimers
    logAndRecord({
      level: 'info',
      message: `[Pipeline] Carrier Subscriber Status: Requires private carrier HLR/VLR interconnect (not accessible in public client apps).`,
      timestamp: now(),
    });

    logAndRecord({
      level: 'success',
      message: `[Pipeline] Lookup pipeline complete. Verified metadata recorded.`,
      timestamp: now(),
    });

    return {
      timestamp: new Date().toISOString(),
      validation,
      dnsEnum,
      publicRegistry,
      events,
    };
  }
}
