Network security protects the **confidentiality**, **integrity** and **availability** (the **CIA triad**) of data and services. Firewalls, proxies, VPNs and encryption are the core defensive tools.

## Firewalls

A **firewall** enforces rules about which traffic may pass between networks (or into a host).

| Type | Works at | Decides using | Notes |
|---|---|---|---|
| **Packet-filtering** (stateless) | L3/L4 | each packet's IPs, ports, protocol | fast, but no context — must allow return traffic explicitly |
| **Stateful inspection** | L3/L4 | packet + **connection state table** | allows replies to established connections automatically; the common default |
| **Application-level gateway / proxy firewall** | L7 | application content (HTTP methods, URLs) | deep inspection, slower |
| **Next-generation firewall (NGFW)** | L3–L7 | apps, users, IPS signatures, TLS inspection | enterprise edge |
| **Web Application Firewall (WAF)** | L7 (HTTP) | requests vs attack patterns (SQLi, XSS) | protects web apps |
| Host-based firewall | on a machine | per-process/port rules | Windows Defender Firewall, iptables/nftables, ufw |

### Example rule set (stateful)

| # | Direction | Source | Destination | Port | Action |
|---|---|---|---|---|---|
| 1 | inbound | any | web server | TCP 443 | allow |
| 2 | inbound | office VPN range | admin server | TCP 22 | allow |
| 3 | outbound | internal | any | any | allow (replies tracked) |
| 4 | any | any | any | any | **deny** (default deny) |

Rules are evaluated **top-down**; the first match wins. Best practice: **default deny**, least privilege, log denied traffic.

```bash
# Linux ufw examples
sudo ufw default deny incoming
sudo ufw allow 443/tcp
sudo ufw allow from 10.8.0.0/24 to any port 22 proto tcp
```

## DMZ (demilitarised zone)

A separate network segment for public-facing servers (web, mail), isolated by firewalls from the internal LAN — if a public server is compromised, the attacker still can't reach internal systems directly.

```diagram Typical DMZ layout
 Internet ──[ outer firewall ]── DMZ (web, mail, DNS) ──[ inner firewall ]── Internal LAN
```

## Proxies

| | Forward proxy | Reverse proxy |
|---|---|---|
| Sits in front of | clients | servers |
| Hides | the client from the server | the servers from the client |
| Uses | content filtering, caching, anonymity, corporate egress control | load balancing, TLS termination, caching, WAF, DDoS shielding |
| Examples | Squid, corporate web proxy | Nginx, HAProxy, Cloudflare |

## VPNs

A **VPN** creates an encrypted tunnel over a public network.

- **Site-to-site** (connect office networks) vs **remote access** (users to a network).
- Protocols: **IPsec** (network layer; AH for integrity, ESP for encryption; tunnel vs transport mode), **TLS-based** (OpenVPN, SSL VPNs), **WireGuard** (modern, simple, fast).

## IDS vs IPS

| IDS (Intrusion Detection System) | IPS (Intrusion Prevention System) |
|---|---|
| monitors and **alerts** | sits inline and **blocks** |
| passive (copy of traffic) | active |
| signature-based or anomaly-based | same detection methods |

## Common attacks and defences

| Attack | Description | Defences |
|---|---|---|
| **DoS / DDoS** | flood a target to exhaust bandwidth or resources | rate limiting, CDNs/scrubbing services, anycast, autoscaling |
| **SYN flood** | half-open TCP connections exhaust the backlog | SYN cookies, firewalls |
| **Man-in-the-middle (MITM)** | attacker intercepts/modifies traffic | TLS with certificate validation, HSTS, VPNs |
| **ARP spoofing** | fake ARP replies redirect LAN traffic | Dynamic ARP Inspection, static entries, encryption |
| **DNS spoofing / cache poisoning** | forged DNS answers | DNSSEC, randomised ports/IDs, DoH/DoT |
| **IP spoofing** | forged source addresses | ingress/egress filtering (BCP 38) |
| **Phishing / social engineering** | trick users into revealing credentials | training, MFA, email authentication (SPF, DKIM, DMARC) |
| **Port scanning** | discover open services (nmap) | close unused ports, firewalls, IDS alerts |
| **Packet sniffing** | capture unencrypted traffic | encryption everywhere |
| **SQL injection / XSS / CSRF** | web application attacks | parameterised queries, output encoding, CSP, CSRF tokens, SameSite cookies, WAF |
| **Replay attack** | resend captured valid messages | nonces, timestamps, sequence numbers |

## Cryptography essentials

| Concept | Purpose | Examples |
|---|---|---|
| Symmetric encryption | fast bulk confidentiality | AES, ChaCha20 |
| Asymmetric encryption | key exchange, encryption to a public key | RSA, ECC |
| Hash function | integrity / fingerprints (one-way) | SHA-256, SHA-3 |
| MAC / HMAC | integrity + authenticity with a shared key | HMAC-SHA256 |
| Digital signature | authenticity + integrity + non-repudiation | RSA-PSS, ECDSA, Ed25519 |
| Password hashing | slow, salted hashes for stored passwords | bcrypt, scrypt, Argon2 |

```python
import hashlib, hmac, secrets

digest = hashlib.sha256(b"hello").hexdigest()
key = secrets.token_bytes(32)
tag = hmac.new(key, b"amount=100", hashlib.sha256).hexdigest()
print(digest[:16], len(tag), hmac.compare_digest(tag, tag))   # 2cf24dba5fb0a30e 64 True
```

> [!WARNING]
> Never store passwords with plain SHA-256 or MD5 — they're fast to brute-force. Use a salted, deliberately slow algorithm (bcrypt / scrypt / Argon2, or `hashlib.scrypt`).

## Zero trust (modern approach)

"Never trust, always verify": authenticate and authorise every request based on identity and device posture, regardless of network location; micro-segment networks; enforce least privilege; assume breach.

> [!INTERVIEW]
> - Stateless vs stateful firewall; what a WAF does.
> - Forward vs reverse proxy.
> - IDS vs IPS.
> - How TLS prevents man-in-the-middle attacks.
> - What is a DDoS and how do you mitigate it?
> - Hashing vs encryption vs encoding.

> [!REMEMBER]
> Default deny + least privilege. Stateful firewalls track connections; WAFs inspect HTTP; reverse proxies front servers; VPNs tunnel securely; IDS alerts, IPS blocks. Encrypt everything in transit and hash passwords with slow, salted algorithms.
