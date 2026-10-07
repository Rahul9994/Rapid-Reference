The networking questions you're most likely to face, with structured answers. Start with the famous one.

## "What happens when you type google.com into the browser and press Enter?"

A strong answer walks down the stack in order:

1. **URL parsing** — the browser determines the scheme (HTTPS), host (`google.com`), path. HSTS preload may force HTTPS.
2. **DNS resolution** — browser cache → OS cache / hosts file → recursive resolver → (root → `.com` TLD → Google's authoritative servers) → returns an IP. Results cached by TTL.
3. **ARP / next hop** — the OS sees the IP isn't local, so it sends frames to the **default gateway**, using ARP to find the gateway's MAC.
4. **TCP handshake** — SYN, SYN-ACK, ACK to port 443 (or a QUIC handshake over UDP for HTTP/3).
5. **TLS handshake** — negotiate TLS 1.3, verify Google's certificate chain, derive session keys via ECDHE.
6. **HTTP request** — `GET / HTTP/2` with headers (Host, cookies, Accept-Encoding).
7. **Routing across the internet** — packets hop through home router (NAT), ISP routers (BGP between autonomous systems), likely to a nearby Google edge server/CDN via anycast.
8. **Server processing** — load balancer → web servers → backend services/databases → response.
9. **HTTP response** — status 200 with HTML (compressed), cache headers.
10. **Rendering** — the browser parses HTML, builds the DOM/CSSOM, fetches CSS/JS/images (more requests, reusing the connection), executes JavaScript, lays out and paints the page.
11. **Connection reuse / close** — keep-alive for later requests; eventually FIN/ACK teardown.

## Layers and devices

| Question | Answer |
|---|---|
| OSI layers in order? | Physical, Data link, Network, Transport, Session, Presentation, Application |
| TCP/IP layers? | Link, Internet, Transport, Application |
| Hub vs switch vs router? | L1 repeat-to-all / L2 forward by MAC / L3 route by IP |
| Collision vs broadcast domain? | switches split collision domains; routers (and VLANs) split broadcast domains |
| MAC vs IP? | L2 hardware address (local, per hop) vs L3 logical address (end to end) |
| What does ARP do? | resolves an IP to a MAC on the local network |

## Addressing

| Question | Answer |
|---|---|
| Private IPv4 ranges? | 10.0.0.0/8, 172.16.0.0/12, 192.168.0.0/16 |
| Usable hosts in /24, /26, /30? | 254, 62, 2 |
| What is a subnet mask? | bits marking the network part of an address |
| What is CIDR? | classless prefixes (/n) replacing class A/B/C; enables aggregation |
| Why IPv6? | IPv4 exhaustion; also no NAT needed, simpler header, autoconfiguration |
| Loopback address? | 127.0.0.1 (IPv4), ::1 (IPv6) |
| What is NAT / PAT? | translating private addresses to a public one; PAT uses ports to share one IP |
| What is DHCP? | automatic IP configuration via DORA (UDP 67/68) |

## Transport

| Question | Answer |
|---|---|
| TCP vs UDP? | reliable ordered stream with handshake vs fast connectionless datagrams |
| Why 3-way handshake? | both sides must exchange and confirm initial sequence numbers |
| What is TIME_WAIT? | final state after active close (2×MSL) to absorb delayed segments |
| Flow vs congestion control? | protect the receiver (rwnd) vs protect the network (cwnd) |
| Slow start? | cwnd doubles each RTT until ssthresh, then grows linearly |
| What happens on packet loss? | timeout → cwnd = 1; 3 duplicate ACKs → fast retransmit, halve cwnd |
| Port numbers for HTTP, HTTPS, DNS, SSH, SMTP? | 80, 443, 53, 22, 25 |
| What is a socket? | endpoint = IP + port (+ protocol) used by applications |

## Application layer

| Question | Answer |
|---|---|
| How does DNS resolution work? | recursive resolver queries root → TLD → authoritative; cached by TTL |
| A vs CNAME vs MX? | name→IPv4 / alias / mail server |
| Why does DNS use UDP? | small, fast exchanges; TCP for big responses and zone transfers |
| HTTP methods and idempotency? | GET/PUT/DELETE idempotent; POST not; PATCH not guaranteed |
| 301 vs 302 vs 304? | permanent redirect / temporary redirect / not modified (use cache) |
| 401 vs 403? | not authenticated vs authenticated but forbidden |
| HTTP vs HTTPS? | HTTPS = HTTP over TLS: encryption, integrity, server authentication |
| HTTP/1.1 vs 2 vs 3? | keep-alive / multiplexing over one TCP connection / QUIC over UDP |
| Cookies vs sessions vs JWT? | client-stored data / server-side state keyed by cookie / signed self-contained token |
| What is CORS? | browser policy allowing cross-origin reads only if the server permits |

## Security

| Question | Answer |
|---|---|
| Symmetric vs asymmetric encryption? | one shared key (fast) vs public/private key pair (key exchange, signatures) |
| How does TLS establish keys? | ECDHE key exchange authenticated with the server certificate |
| What is a certificate authority? | trusted entity that signs certificates binding domains to public keys |
| Firewall types? | packet filter, stateful, application/proxy, NGFW, WAF |
| DoS vs DDoS? | single source vs many distributed sources |
| What's a man-in-the-middle attack? | attacker intercepts/modifies traffic; prevented by authenticated encryption |
| Hashing vs encryption? | one-way fingerprint vs reversible with a key |

## Troubleshooting toolkit

| Tool | Use |
|---|---|
| `ping` | reachability and RTT (ICMP echo) |
| `traceroute` / `tracert` | path and per-hop latency (TTL expiry) |
| `nslookup` / `dig` | DNS queries |
| `ipconfig` / `ip addr` | interface addresses |
| `netstat` / `ss` | open ports and connection states |
| `curl -v` | HTTP requests with headers and TLS details |
| `tcpdump` / Wireshark | packet capture and analysis |
| `nmap` | port scanning (only on networks you're authorised to test) |

> [!INTERVIEW]
> **"A website is slow — how do you investigate?"**
> Check DNS time, TCP/TLS handshake time and time-to-first-byte (browser dev tools or `curl -w`), look for packet loss/latency with ping/traceroute, check server load and database queries, verify caching/CDN headers, compression, payload sizes and the number of requests.

> [!INTERVIEW]
> **"Two machines on the same switch can't talk. What do you check?"**
> Physical link/LEDs → correct VLAN membership → IP addresses and masks on the same subnet → ARP table entries → host firewalls → duplicate IPs.

> [!REMEMBER]
> Be ready to narrate the full "type a URL" journey (DNS → ARP → TCP → TLS → HTTP → render), compare TCP vs UDP, subnet quickly, explain DNS and HTTP status codes, and describe how TLS keeps traffic safe.
