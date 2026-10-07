The **Domain Name System (DNS)** is the internet's phone book: it translates human-friendly names like `www.example.com` into IP addresses. It's a hierarchical, distributed and heavily cached database.

## The hierarchy

```diagram DNS namespace (read right to left)
                        . (root)
           ┌────────────┼─────────────┐
          com          org            in            ← top-level domains (TLDs)
       ┌───┴───┐        │          ┌───┴───┐
    example  google  wikipedia    co      gov       ← second-level domains
       │                           │
      www                        example            ← subdomains / hosts
 Fully qualified domain name: www.example.com.   (the trailing dot = root)
```

| Server type | Role |
|---|---|
| **Root servers** | 13 named root server identities (a–m.root-servers.net), anycast to hundreds of sites; point to TLD servers |
| **TLD servers** | handle `.com`, `.org`, `.in`, `.io`…; point to authoritative servers |
| **Authoritative servers** | hold the actual records for a domain (the zone) |
| **Recursive resolver** | does the lookup work for clients (ISP resolver, 8.8.8.8, 1.1.1.1), caches results |

## Resolution step by step

```diagram Resolving www.example.com (cold caches)
 Browser cache → OS cache / hosts file → recursive resolver
 Resolver ──► root server:          "ask the .com TLD servers at ..."         (referral)
 Resolver ──► .com TLD server:      "ask example.com's name servers at ..."   (referral)
 Resolver ──► example.com NS:       "www.example.com A 93.184.216.34"         (answer)
 Resolver ──► client: 93.184.216.34  (and caches it for the record's TTL)
```

### Recursive vs iterative queries

| Recursive | Iterative |
|---|---|
| "Give me the final answer." The server does all the work. | "Tell me what you know." The server replies with the answer or a **referral** to another server. |
| client → recursive resolver | resolver → root / TLD / authoritative servers |

## Caching and TTL

Each record has a **TTL** (time to live, in seconds). Resolvers, operating systems and browsers cache answers until the TTL expires — this keeps DNS fast and reduces load. Low TTLs allow quick changes (failover); high TTLs reduce queries.

**Negative caching** remembers "this name doesn't exist" (NXDOMAIN) too.

## Record types

| Record | Maps / purpose | Example |
|---|---|---|
| **A** | name → IPv4 | `example.com A 93.184.216.34` |
| **AAAA** | name → IPv6 | `example.com AAAA 2606:2800:220:1:...` |
| **CNAME** | alias → canonical name | `www CNAME example.com` |
| **MX** | mail servers (with priority) | `example.com MX 10 mail.example.com` |
| **NS** | authoritative name servers for a zone | `example.com NS ns1.example.net` |
| **TXT** | arbitrary text (SPF, DKIM, domain verification) | `v=spf1 include:_spf.google.com ~all` |
| **PTR** | IP → name (reverse DNS) | `34.216.184.93.in-addr.arpa PTR example.com` |
| **SOA** | start of authority: primary NS, admin, serial, timers | |
| **SRV** | service location (host + port) | `_sip._tcp.example.com SRV 10 5 5060 sip.example.com` |
| **CAA** | which CAs may issue certificates | `0 issue "letsencrypt.org"` |

> [!NOTE]
> A `CNAME` can't coexist with other records at the same name, so the zone apex (`example.com`) can't be a CNAME — providers offer ALIAS/ANAME flattening instead.

## Transport

- DNS normally uses **UDP port 53** (fast, a single request/response).
- It falls back to **TCP 53** for responses too large for UDP (truncated flag), and uses TCP for **zone transfers** (AXFR/IXFR) between primary and secondary servers.
- Encrypted DNS: **DoH** (DNS over HTTPS, port 443) and **DoT** (DNS over TLS, port 853) protect privacy from on-path observers.

## Querying DNS

```bash
nslookup example.com
dig example.com A +short
dig example.com MX
dig -x 8.8.8.8            # reverse lookup
dig +trace example.com    # follow the referrals from the root
```

```python
import socket

print(socket.gethostbyname("localhost"))        # 127.0.0.1 (resolved via the OS resolver / hosts file)
infos = socket.getaddrinfo("localhost", 443, proto=socket.IPPROTO_TCP)
print(sorted({info[4][0] for info in infos}))   # e.g. ['127.0.0.1', '::1']
```

## DNS security

| Threat | Description | Defence |
|---|---|---|
| Cache poisoning (spoofing) | attacker injects forged answers into a resolver's cache | randomised source ports and query IDs, **DNSSEC** |
| DNS hijacking | changing a domain's records or a router's DNS settings | registrar locks, MFA, secure routers |
| DDoS on DNS | overload authoritative servers | anycast, rate limiting, redundancy |
| Amplification attacks | small spoofed queries → large responses to a victim | disable open resolvers, response rate limiting |
| Privacy leaks | plaintext queries reveal browsing | DoH / DoT |

**DNSSEC** adds digital signatures (RRSIG, DNSKEY, DS records) so resolvers can verify that answers are authentic and unmodified — it provides integrity, not confidentiality.

## DNS in load balancing and CDNs

- Multiple A records → simple round-robin load distribution.
- **GeoDNS** returns the nearest servers based on the resolver's location.
- CDNs combine short TTLs, anycast and GeoDNS to route users to nearby edge servers.

> [!INTERVIEW]
> - Walk through resolving a domain from the browser cache to the authoritative server.
> - Recursive vs iterative queries.
> - A vs AAAA vs CNAME vs MX vs NS vs PTR records.
> - Why UDP? When TCP? — Small fast queries vs large responses / zone transfers.
> - What is DNS caching / TTL, and DNS cache poisoning?

> [!REMEMBER]
> Root → TLD → authoritative, with a recursive resolver doing the legwork and everything cached by TTL. A/AAAA map names to IPs, CNAME aliases, MX routes mail. UDP 53 by default, TCP 53 for big answers.
