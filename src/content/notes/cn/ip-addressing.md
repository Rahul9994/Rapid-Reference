An **IP address** is a logical address that identifies a network interface on an IP network. IPv4 uses 32 bits; IPv6 uses 128 bits.

## IPv4 basics

- 32 bits written as four decimal **octets**: `192.168.1.10`.
- Total space: 2³² ≈ **4.3 billion** addresses — exhausted, which is why NAT and IPv6 exist.
- Each address = **network part** + **host part**, separated by the **subnet mask**.

```diagram 192.168.1.10/24
 binary:  11000000.10101000.00000001.00001010
 mask:    11111111.11111111.11111111.00000000   (/24 = 255.255.255.0)
          └──────── network ────────┘└─ host ─┘
 network address: 192.168.1.0     host: .10
```

## Classful addressing (historical)

| Class | First octet | Leading bits | Default mask | Networks / hosts per network | Use |
|---|---|---|---|---|---|
| A | 1–126 | 0 | /8 (255.0.0.0) | 126 / 16,777,214 | very large networks |
| B | 128–191 | 10 | /16 (255.255.0.0) | 16,384 / 65,534 | medium |
| C | 192–223 | 110 | /24 (255.255.255.0) | 2,097,152 / 254 | small |
| D | 224–239 | 1110 | — | — | multicast |
| E | 240–255 | 1111 | — | — | reserved / experimental |

127.x.x.x is reserved for **loopback** (127.0.0.1 = localhost). Classful addressing wasted addresses; it was replaced by **CIDR** in 1993.

## CIDR (Classless Inter-Domain Routing)

Write the prefix length after a slash: `10.20.0.0/14` means the first 14 bits are the network.

- Number of addresses in a block = **2^(32 − prefix)**.
- Usable hosts = **2^(32 − prefix) − 2** (network address and broadcast address are reserved) — except /31 (point-to-point links, RFC 3021) and /32 (single host).
- **Route aggregation (supernetting)**: combine contiguous blocks into one route — `192.168.0.0/24` + `192.168.1.0/24` = `192.168.0.0/23`.

| Prefix | Mask | Addresses | Usable hosts |
|---|---|---|---|
| /8 | 255.0.0.0 | 16,777,216 | 16,777,214 |
| /16 | 255.255.0.0 | 65,536 | 65,534 |
| /24 | 255.255.255.0 | 256 | 254 |
| /26 | 255.255.255.192 | 64 | 62 |
| /28 | 255.255.255.240 | 16 | 14 |
| /30 | 255.255.255.252 | 4 | 2 |
| /32 | 255.255.255.255 | 1 | 1 (host route) |

## Special and private addresses

| Range | Purpose |
|---|---|
| **10.0.0.0/8** | private (RFC 1918) |
| **172.16.0.0/12** (172.16.0.0 – 172.31.255.255) | private |
| **192.168.0.0/16** | private |
| 127.0.0.0/8 | loopback |
| 169.254.0.0/16 | link-local (APIPA — assigned when DHCP fails) |
| 100.64.0.0/10 | carrier-grade NAT (shared address space) |
| 0.0.0.0 | "this host" / default route (`0.0.0.0/0`) |
| 255.255.255.255 | limited broadcast |
| 224.0.0.0/4 | multicast |

Private addresses aren't routable on the public internet — **NAT** translates them to a public IP.

## Unicast, broadcast, multicast, anycast

| Type | Delivery | Example |
|---|---|---|
| Unicast | one-to-one | normal web traffic |
| Broadcast | one-to-all in a subnet | ARP request, DHCP discover |
| Multicast | one-to-group (subscribers) | IPTV, OSPF hello (224.0.0.5) |
| Anycast | one-to-nearest of a group | DNS root servers, CDNs |

## IPv4 header (key fields)

| Field | Purpose |
|---|---|
| Version, IHL | IPv4, header length |
| Total length | header + data (max 65,535 bytes) |
| Identification, flags, fragment offset | fragmentation and reassembly |
| **TTL** | decremented at each router; packet discarded at 0 (prevents loops; `traceroute` exploits it) |
| Protocol | payload type: 6 = TCP, 17 = UDP, 1 = ICMP |
| Header checksum | detects header corruption |
| Source / destination address | 32-bit IPs |

## IPv6

- **128-bit** addresses → 2¹²⁸ ≈ 3.4 × 10³⁸.
- Written as 8 groups of 4 hex digits: `2001:0db8:0000:0000:0000:ff00:0042:8329`.
- **Shortening rules**: drop leading zeros in each group; replace **one** run of consecutive all-zero groups with `::` → `2001:db8::ff00:42:8329`.

| Feature | IPv4 | IPv6 |
|---|---|---|
| Address size | 32 bits | 128 bits |
| Notation | dotted decimal | colon-separated hex |
| Header | variable (20–60 bytes), checksum | fixed 40 bytes, no checksum, extension headers |
| Configuration | manual / DHCP | SLAAC (auto) / DHCPv6 |
| Broadcast | yes | **no** (multicast instead) |
| Fragmentation | routers and hosts | only the source host (path MTU discovery) |
| NAT | widespread | not needed (huge space) |
| IPsec | optional | originally mandatory to support, now recommended |

Special IPv6 addresses: `::1` loopback, `fe80::/10` link-local, `fc00::/7` unique local (private-like), `2000::/3` global unicast, `ff00::/8` multicast.

Transition mechanisms: **dual stack** (run both), **tunnelling** (IPv6 inside IPv4), **translation** (NAT64/DNS64).

## Python: working with addresses

```python
import ipaddress

net = ipaddress.ip_network("192.168.1.0/26")
print(net.netmask, net.num_addresses, net.broadcast_address)
print(list(net.hosts())[:2], ipaddress.ip_address("10.4.2.1").is_private)
print(ipaddress.ip_address("2001:0db8:0000:0000:0000:ff00:0042:8329"))
```

```output
255.255.255.192 64 192.168.1.63
[IPv4Address('192.168.1.1'), IPv4Address('192.168.1.2')] True
2001:db8::ff00:42:8329
```

> [!INTERVIEW]
> - Private IPv4 ranges (10/8, 172.16/12, 192.168/16).
> - Usable hosts in a /26? — 2⁶ − 2 = 62.
> - Why IPv6? — Address exhaustion; also simpler header, no broadcast, auto-configuration.
> - What is TTL for? — Prevents packets looping forever.

> [!REMEMBER]
> IPv4 = 32 bits, network + host split by the mask. Addresses = 2^(32−prefix), usable = that − 2. Know the private ranges and loopback. IPv6 = 128 bits, `::` compresses one zero run.
