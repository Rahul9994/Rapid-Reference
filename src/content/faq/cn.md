## What happens when you type a URL into a browser?

1. The browser parses the URL and checks caches.
2. **DNS** resolves the domain to an IP (browser/OS cache → recursive resolver → root → TLD → authoritative server).
3. The OS sends frames to the default gateway (MAC found via **ARP**).
4. A **TCP** 3-way handshake (or QUIC over UDP) opens a connection to port 443.
5. A **TLS** handshake verifies the server's certificate and establishes encryption keys.
6. The browser sends an **HTTP** request; packets are routed across the internet.
7. The server responds; the browser parses HTML, fetches CSS/JS/images, executes scripts and renders the page.

## What are the layers of the OSI model?

From bottom to top: **Physical** (bits), **Data Link** (frames, MAC), **Network** (packets, IP, routing), **Transport** (segments, TCP/UDP, ports), **Session** (sessions), **Presentation** (encoding, encryption, compression), **Application** (HTTP, DNS, SMTP). Mnemonic: *Please Do Not Throw Sausage Pizza Away*.

## What is the difference between TCP and UDP?

**TCP** is connection-oriented and reliable: handshake, ordered delivery, retransmissions, flow and congestion control — used for web, email, file transfer. **UDP** is connectionless and best-effort with an 8-byte header and no ordering or retransmission — faster, used for DNS, VoIP, video calls, gaming and QUIC.

## Explain the TCP three-way handshake.

1. Client → server: **SYN** with initial sequence number x.
2. Server → client: **SYN-ACK** with its sequence number y and ack = x + 1.
3. Client → server: **ACK** with ack = y + 1.

Three messages are needed so both sides choose and confirm each other's sequence numbers. Closing uses FIN/ACK in each direction (four-way).

## How does DNS work?

DNS translates domain names into IP addresses using a hierarchy: a **recursive resolver** queries a **root** server, which refers it to the **TLD** server (e.g. `.com`), which refers it to the domain's **authoritative** server, which returns the record (A/AAAA). Answers are cached according to their TTL. DNS mainly uses UDP port 53.

## What is the difference between HTTP and HTTPS?

HTTPS is HTTP over **TLS**: it encrypts traffic (confidentiality), detects tampering (integrity) and authenticates the server with a certificate signed by a trusted CA. HTTP sends everything in plaintext on port 80; HTTPS uses port 443.

## What is the difference between a hub, a switch and a router?

A **hub** (Layer 1) repeats every signal to all ports — one shared collision domain. A **switch** (Layer 2) learns MAC addresses and forwards frames only to the right port. A **router** (Layer 3) forwards packets between different networks using IP addresses and routing tables, separating broadcast domains.

## What is the difference between an IP address and a MAC address?

An **IP address** (Layer 3) is a logical, hierarchical address used to route packets across networks end to end; it's assigned by configuration or DHCP. A **MAC address** (Layer 2) is a 48-bit hardware address used for delivery on the local link; it changes at every hop. ARP maps IPs to MACs.

## What is subnetting? How many hosts are in a /26?

Subnetting splits a network into smaller ones by extending the network prefix. A /26 has 32 − 26 = 6 host bits → 2⁶ = 64 addresses, minus the network and broadcast addresses = **62 usable hosts**.

## What is NAT?

Network Address Translation rewrites private IP addresses into a public one at the network edge. With **PAT** (NAT overload), many devices share one public IP, distinguished by port numbers in the router's translation table. It conserves IPv4 addresses but breaks unsolicited inbound connections.

## What is DHCP and how does it work?

DHCP automatically assigns IP configuration (address, mask, gateway, DNS, lease time) using the **DORA** exchange: **Discover** (broadcast), **Offer**, **Request**, **Acknowledge**. It runs over UDP ports 67 (server) and 68 (client).

## What are common HTTP status codes?

**200** OK, **201** Created, **204** No Content, **301** Moved Permanently, **302** Found (temporary redirect), **304** Not Modified, **400** Bad Request, **401** Unauthorized (not authenticated), **403** Forbidden, **404** Not Found, **429** Too Many Requests, **500** Internal Server Error, **502** Bad Gateway, **503** Service Unavailable, **504** Gateway Timeout.

## What is the difference between GET and POST?

**GET** retrieves data, sends parameters in the URL, is safe, idempotent, cacheable and bookmarkable. **POST** submits data in the request body to create or process something; it isn't idempotent or cached by default and is used for forms, uploads and non-repeatable actions.

## What is flow control vs congestion control?

**Flow control** prevents the sender from overwhelming the **receiver** — the receiver advertises its window (rwnd). **Congestion control** prevents senders from overwhelming the **network** — TCP adjusts its congestion window (cwnd) using slow start, AIMD, fast retransmit and fast recovery. The sender transmits at most min(rwnd, cwnd).

## What is ARP?

The Address Resolution Protocol finds the MAC address for an IP address on the local network: a host broadcasts "Who has 10.0.0.9?", the owner replies with its MAC, and the result is cached. ARP has no authentication, which enables ARP-spoofing attacks.

## What is a firewall?

A system that filters network traffic according to rules. **Packet filters** check headers statelessly, **stateful firewalls** track connections and allow replies automatically, **application-level/proxy firewalls and WAFs** inspect application data. Best practice: default-deny with explicit allow rules.

## What is latency vs bandwidth vs throughput?

**Bandwidth** is the maximum capacity of a link (bits per second). **Throughput** is the actual data rate achieved. **Latency** is the delay for data to travel from source to destination (transmission + propagation + queuing + processing). A high-bandwidth link can still have high latency.

## What is a socket?

An endpoint for communication identified by an IP address and port (plus protocol). Servers create a socket, `bind` it to a port, `listen`, and `accept` connections (each returning a new socket); clients `connect`. Stream sockets use TCP, datagram sockets use UDP.
