**Network Address Translation (NAT)** rewrites IP addresses (and often ports) in packet headers as they pass through a router, letting many devices with **private** addresses share one or a few **public** addresses.

## Why NAT exists

- IPv4 has only ~4.3 billion addresses — not enough for every device.
- Private ranges (10/8, 172.16/12, 192.168/16) can be reused in every home and office.
- Side effect: devices behind NAT aren't directly reachable from the internet (a basic, but not a real, security layer).

## How it works (PAT / NAT overload)

```diagram Port Address Translation on a home router (public IP 203.0.113.7)
 Inside (private)                    NAT table                         Outside (public)
 192.168.1.10:51000 ──► rewrite ──► 203.0.113.7:40001 ──────────────► 93.184.216.34:443
 192.168.1.11:51000 ──► rewrite ──► 203.0.113.7:40002 ──────────────► 93.184.216.34:443

 Reply to 203.0.113.7:40002 ──► lookup ──► 192.168.1.11:51000
```

| Inside local | Inside global | Destination |
|---|---|---|
| 192.168.1.10:51000 | 203.0.113.7:40001 | 93.184.216.34:443 |
| 192.168.1.11:51000 | 203.0.113.7:40002 | 93.184.216.34:443 |

The router rewrites the **source IP and port** on the way out and the **destination IP and port** on the way back, updating checksums.

## Types of NAT

| Type | Mapping | Use case |
|---|---|---|
| **Static NAT** | one private IP ↔ one public IP (permanent) | publish an internal server |
| **Dynamic NAT** | private IPs ↔ a pool of public IPs (first come, first served) | organisations with several public IPs |
| **PAT / NAT overload / NAPT** | many private IPs ↔ **one** public IP, distinguished by **ports** | every home router |
| Port forwarding (DNAT) | public IP:port → specific private IP:port | host a game server/website at home |
| CGNAT (carrier-grade) | ISP-level NAT using 100.64.0.0/10 | ISPs short of IPv4 addresses |

With PAT, one public IP can support roughly 64K simultaneous connections per destination (port space).

## NAT terminology (Cisco-style)

| Term | Meaning |
|---|---|
| Inside local | private address of the internal host |
| Inside global | public address representing the internal host |
| Outside global | real public address of the external host |
| Outside local | address of the external host as seen from inside (usually same as outside global) |

## Problems NAT causes

- **Breaks end-to-end connectivity**: outside hosts can't initiate connections inward without port forwarding.
- **Peer-to-peer and VoIP** need traversal techniques: **STUN** (discover your public mapping), **TURN** (relay), **ICE** (try both), UPnP / NAT-PMP for automatic port forwarding.
- Protocols that embed IPs in payloads (active FTP, SIP) need **ALGs** (application-level gateways).
- IPsec AH breaks (it authenticates headers that NAT changes); NAT-T encapsulates IPsec in UDP.
- Extra state in routers; logging/tracing who used an IP needs NAT logs.

## NAT vs IPv6

IPv6's vast address space removes the need for NAT — every device can have a globally unique address, with firewalls (not NAT) providing protection. NAT64 exists only to let IPv6-only clients reach IPv4 servers.

> [!INTERVIEW]
> - What is NAT and why is it used? — Shares public IPs; conserves IPv4.
> - Static vs dynamic NAT vs PAT.
> - How does a reply find the right internal device with PAT? — The NAT table maps the public port back to the private IP:port.
> - Is NAT a firewall? — No; it hides addresses as a side effect, but a firewall enforces policy.

> [!REMEMBER]
> NAT rewrites addresses at the network edge. PAT multiplexes many private hosts behind one public IP using ports. It saves IPv4 space but breaks inbound/peer-to-peer connectivity — IPv6 makes it unnecessary.
