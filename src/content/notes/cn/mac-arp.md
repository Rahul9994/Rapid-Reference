A **MAC address** identifies a network interface on a local link; **ARP** finds the MAC address that belongs to an IP address on the same network. Together they bridge layer 3 (IP) and layer 2 (Ethernet/Wi-Fi).

## MAC addresses

- **48 bits**, written as 6 hex bytes: `3C:22:FB:9A:10:7E` (or `3c-22-fb-9a-10-7e`).
- First 24 bits: **OUI** (Organisationally Unique Identifier) assigned to the manufacturer; last 24 bits: device-specific.
- Burned into the NIC, but can be changed in software (MAC spoofing; phones randomise MACs per Wi-Fi network for privacy).
- `FF:FF:FF:FF:FF:FF` is the **broadcast** MAC.
- Bit 0 of the first byte: 0 = unicast, 1 = multicast. Bit 1: 0 = globally unique, 1 = locally administered.

## MAC vs IP address

| | MAC address | IP address |
|---|---|---|
| Layer | 2 (data link) | 3 (network) |
| Size | 48 bits | 32 (IPv4) / 128 (IPv6) bits |
| Assigned by | manufacturer (or locally) | network admin / DHCP |
| Scope | local link — **changes at every hop** | end-to-end — routable across networks |
| Structure | flat (OUI + device) | hierarchical (network + host) |
| Analogy | a person's name/ID | a postal address |

## Why do we need both?

Routers forward packets across networks using **IP** (hierarchical, routable). But on each physical link, frames are delivered by **MAC** (the NIC only accepts frames addressed to its MAC or broadcast). So each hop must learn the next hop's MAC → **ARP**.

## ARP — Address Resolution Protocol

```diagram ARP on a LAN: host A (10.0.0.5) wants to reach B (10.0.0.9)
 1. A checks its ARP cache — no entry for 10.0.0.9
 2. A broadcasts:  "Who has 10.0.0.9? Tell 10.0.0.5"  (dst MAC FF:FF:FF:FF:FF:FF)
 3. Every host receives it; only B replies (unicast):
                   "10.0.0.9 is at 3C:22:FB:9A:10:7E"
 4. A caches the mapping (typically for a few minutes) and sends the frame to B's MAC
```

**If the destination is on another network**, A ARPs for its **default gateway's** IP instead and sends the frame to the router's MAC; the IP packet still carries B's IP.

Inspect the cache:

```bash
arp -a                 # Windows / macOS / Linux
ip neigh show          # Linux
```

### Related mechanisms

| Mechanism | Purpose |
|---|---|
| **Gratuitous ARP** | a host announces its own IP→MAC (after boot, failover, or to detect duplicate IPs) |
| **Proxy ARP** | a router answers ARP requests on behalf of hosts on another network |
| **RARP** (obsolete) | MAC → IP (replaced by BOOTP and then DHCP) |
| **IPv6 NDP** | Neighbor Discovery Protocol replaces ARP using ICMPv6 Neighbor Solicitation/Advertisement (multicast, not broadcast) |

## ARP spoofing / poisoning

ARP has **no authentication**. An attacker can send forged ARP replies ("the gateway's IP is at *my* MAC"), redirecting traffic through their machine → **man-in-the-middle**, sniffing or denial of service.

Defences: **Dynamic ARP Inspection** on switches (validated against DHCP snooping tables), static ARP entries for critical hosts, network segmentation, and end-to-end encryption (TLS) so intercepted traffic is useless.

## Ethernet frame (with MACs)

| Field | Size |
|---|---|
| Preamble + SFD | 8 bytes |
| Destination MAC | 6 bytes |
| Source MAC | 6 bytes |
| EtherType / length | 2 bytes (0x0800 = IPv4, 0x86DD = IPv6, 0x0806 = ARP) |
| Payload | 46–1500 bytes (**MTU** = 1500) |
| FCS (CRC-32) | 4 bytes |

Frames smaller than 64 bytes are padded; jumbo frames (~9000 bytes) exist on some networks.

> [!INTERVIEW]
> - MAC vs IP address — layer, scope, assignment.
> - How ARP works (broadcast request, unicast reply, cache).
> - What MAC address does a host use to reach a server on the internet? — The default gateway's.
> - What is ARP spoofing and how do you prevent it?

> [!REMEMBER]
> IP gets you across networks, MAC gets you across one link. ARP maps IP → MAC with a broadcast request and unicast reply, then caches it. Off-subnet traffic goes to the gateway's MAC.
