The **TCP/IP model** (Internet protocol suite) is the practical architecture the internet runs on. It has 4 layers (some textbooks show 5 by splitting the link layer).

## The layers

| TCP/IP layer | OSI equivalent | Protocols | Addressing |
|---|---|---|---|
| **Application** | Application + Presentation + Session (7, 6, 5) | HTTP/HTTPS, DNS, SMTP, IMAP, FTP, SSH, DHCP | — |
| **Transport** | Transport (4) | TCP, UDP, QUIC | port numbers |
| **Internet** | Network (3) | IPv4, IPv6, ICMP, ARP*, routing protocols | IP addresses |
| **Link / Network access** | Data link + Physical (2, 1) | Ethernet, Wi-Fi, PPP | MAC addresses |

```diagram OSI vs TCP/IP mapping
 OSI (7)                         TCP/IP (4)
 ┌──────────────┐ ┐
 │ Application  │ │
 ├──────────────┤ │             ┌──────────────┐
 │ Presentation │ ├────────────►│ Application  │
 ├──────────────┤ │             └──────────────┘
 │ Session      │ ┘
 ├──────────────┤               ┌──────────────┐
 │ Transport    │──────────────►│ Transport    │
 ├──────────────┤               ├──────────────┤
 │ Network      │──────────────►│ Internet     │
 ├──────────────┤ ┐             ├──────────────┤
 │ Data link    │ ├────────────►│ Link         │
 ├──────────────┤ │             └──────────────┘
 │ Physical     │ ┘
 └──────────────┘
```

## OSI vs TCP/IP

| | OSI | TCP/IP |
|---|---|---|
| Layers | 7 | 4 (or 5) |
| Origin | ISO reference model (theory first) | developed with ARPANET (protocols first) |
| Usage | teaching, troubleshooting vocabulary | the real internet |
| Session/presentation | separate layers | folded into the application |
| Transport | connection-oriented focus | TCP (connection-oriented) and UDP (connectionless) |
| Network layer | connection-oriented and connectionless | connectionless (IP) |

## Following a web request through the stack

Your browser fetches `https://example.com`:

1. **Application**: the browser builds an HTTP request (encrypted by TLS).
2. **Transport**: TCP adds source port (e.g. 51514) and destination port **443**, sequence numbers, checksum.
3. **Internet**: IP adds source IP (your machine) and destination IP (the server, found via DNS), TTL.
4. **Link**: Ethernet/Wi-Fi adds source MAC (your NIC) and destination MAC (your **default gateway's** MAC, found via ARP) — MACs change at every hop, IPs (usually) don't.
5. Routers along the path strip the link header, look at the destination IP, choose the next hop, and re-encapsulate with new MACs.
6. The server decapsulates layer by layer and hands the HTTP request to the web server process listening on port 443.

```diagram Addresses at each hop
 Laptop ──► Home router (NAT) ──► ISP router ──► ... ──► Server
 Src IP / Dst IP:   stay the same end to end (except NAT rewrites the private source IP)
 Src MAC / Dst MAC: rewritten on every link
 Ports:             identify the processes at the two ends
```

## Ports

| Port | Protocol | Port | Protocol |
|---|---|---|---|
| 20/21 | FTP | 110 | POP3 |
| 22 | SSH / SFTP | 123 | NTP |
| 23 | Telnet | 143 | IMAP |
| 25 | SMTP | 443 | HTTPS |
| 53 | DNS (UDP & TCP) | 465 / 587 | SMTP submission |
| 67/68 | DHCP (server/client) | 993 / 995 | IMAPS / POP3S |
| 80 | HTTP | 3306 / 5432 | MySQL / PostgreSQL |

- **Well-known ports**: 0–1023, **registered**: 1024–49151, **dynamic/ephemeral**: 49152–65535.
- A connection is identified by the **5-tuple**: (protocol, source IP, source port, destination IP, destination port).

## Core protocols by layer

| Layer | Protocol | One-line purpose |
|---|---|---|
| Application | DNS | domain name → IP address |
| Application | DHCP | automatic IP configuration |
| Application | HTTP(S) | web |
| Transport | TCP | reliable, ordered byte stream |
| Transport | UDP | fast, connectionless datagrams |
| Internet | IP | addressing and routing |
| Internet | ICMP | errors and diagnostics (`ping`, `traceroute`) |
| Link | ARP | IP → MAC on a local network |
| Link | Ethernet / Wi-Fi | frames on a local link |

> [!INTERVIEW]
> - Map OSI layers to TCP/IP layers.
> - Which addresses change hop-by-hop? — MAC addresses; IP addresses stay the same (except with NAT).
> - Why did TCP/IP win? — It was implemented and deployed first, simple, and open.
> - What identifies a TCP connection? — The 5-tuple.

> [!REMEMBER]
> TCP/IP = Application, Transport, Internet, Link. Ports at transport, IPs at internet, MACs at link. MACs are rewritten per hop; IPs are end-to-end.
