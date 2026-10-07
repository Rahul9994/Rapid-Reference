**DHCP (Dynamic Host Configuration Protocol)** automatically gives devices an IP address and network settings when they join a network — no manual configuration needed.

## What DHCP provides

- IP address and subnet mask
- Default gateway (router)
- DNS server addresses
- **Lease time** (how long the address may be used)
- Optional: domain name, NTP servers, PXE boot server, etc.

DHCP runs over **UDP**: server port **67**, client port **68**.

## The DORA process

```diagram DHCP DORA exchange
 Client (no IP yet)                                  DHCP server
   │ ── DHCPDISCOVER  (src 0.0.0.0 → dst 255.255.255.255, broadcast) ──► │  "Any DHCP servers?"
   │ ◄── DHCPOFFER    (offers 192.168.1.23, mask, gateway, DNS, lease) ── │
   │ ── DHCPREQUEST   (broadcast: "I'll take 192.168.1.23 from server X") ► │
   │ ◄── DHCPACK      (confirms the lease) ─────────────────────────────── │
   ▼
 Client configures 192.168.1.23 (often sends a gratuitous ARP to check for conflicts)
```

| Step | Message | Sent as | Purpose |
|---|---|---|---|
| **D** | Discover | broadcast | client looks for servers |
| **O** | Offer | broadcast/unicast | server proposes an address and options |
| **R** | Request | broadcast | client accepts one offer (other servers withdraw theirs) |
| **A** | Acknowledge | broadcast/unicast | server confirms; lease starts |

Why is the Request a broadcast? So **all** servers that made offers learn which one was chosen.

## Other DHCP messages

| Message | Meaning |
|---|---|
| DHCPNAK | server rejects a request (e.g. the client moved to a different network) |
| DHCPDECLINE | client found the offered IP is already in use |
| DHCPRELEASE | client gives the address back early |
| DHCPINFORM | client has an IP but wants other options |

## Leases and renewal

- **T1 (50% of the lease)**: client unicasts a DHCPREQUEST to renew with the same server.
- **T2 (87.5% of the lease)**: if no reply, client broadcasts to any server (rebinding).
- **Lease expiry**: client must stop using the address and restart DORA.

## DHCP relay agents

DHCP Discover is a broadcast, and routers don't forward broadcasts. A **DHCP relay agent** (e.g. `ip helper-address` on a router) forwards client broadcasts as unicast to a central DHCP server on another subnet, adding the subnet info (giaddr) so the server picks the right pool.

## Allocation methods

| Method | Behaviour |
|---|---|
| Dynamic | addresses leased from a pool for a limited time (most common) |
| Automatic | permanent assignment from a pool on first use |
| Manual / static (reservation) | a specific IP always given to a specific MAC (printers, servers) |

## When DHCP fails

If no server responds, the host self-assigns a **link-local** address in **169.254.0.0/16** (APIPA on Windows) — it can talk only to other hosts on the same link. Seeing 169.254.x.x usually means "DHCP problem".

## Security concerns

- **Rogue DHCP server**: an attacker hands out their own IP as the gateway/DNS → man-in-the-middle. Defence: **DHCP snooping** on switches (only trusted ports may send offers).
- **DHCP starvation**: flood requests with fake MACs to exhaust the pool. Defence: port security, rate limiting.

## DHCPv6 and SLAAC

IPv6 hosts can configure themselves with **SLAAC** (stateless address autoconfiguration from router advertisements) and/or use **DHCPv6** (stateful addresses or extra options).

> [!INTERVIEW]
> - Explain DORA and which messages are broadcast.
> - DHCP ports: 67 (server) and 68 (client), over UDP.
> - Why can't a router forward DHCP discovers by default? — They're broadcasts; use a relay agent.
> - What does a 169.254.x.x address indicate?

> [!REMEMBER]
> DHCP = automatic IP config via Discover → Offer → Request → Ack over UDP 67/68. Leases renew at 50% and rebind at 87.5%. Relay agents cross subnets; 169.254.x.x means DHCP failed.
