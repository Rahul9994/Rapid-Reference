**Switching** is how data moves from input to output across a network: either along a reserved path (circuit switching) or hop by hop in independent pieces (packet switching). On LANs, **Ethernet switches** forward frames using MAC addresses.

## Circuit vs packet vs message switching

| | Circuit switching | Packet switching | Message switching |
|---|---|---|---|
| Path | dedicated end-to-end circuit set up first | each packet forwarded independently (datagram) or along a virtual circuit | whole message stored and forwarded |
| Resources | reserved for the whole call (even when idle) | shared on demand (statistical multiplexing) | shared |
| Phases | setup → transfer → teardown | none (datagram) | none |
| Delay | setup delay, then constant | variable (queuing) | high |
| Efficiency | low for bursty data | high | medium |
| Order | in order | may arrive out of order (datagram) | in order |
| Example | traditional telephone (PSTN) | the internet (IP) | old telegraph/email relays |

### Datagram vs virtual-circuit packet switching

| Datagram | Virtual circuit |
|---|---|
| no connection setup; every packet carries the full destination address | setup creates a path; packets carry a short VC identifier |
| packets may take different routes | all packets follow the same route, in order |
| robust to router failure | failure breaks the circuit |
| IP | ATM, Frame Relay, MPLS (similar ideas) |

## How an Ethernet switch works

A switch maintains a **MAC address table** (CAM table): MAC → port.

1. **Learning**: when a frame arrives, record (source MAC → incoming port).
2. **Forwarding**: look up the destination MAC; send the frame **only** out of that port.
3. **Flooding**: if the destination is unknown (or broadcast/multicast), send the frame out of every port except the incoming one.
4. **Filtering**: if the destination is on the incoming port, drop it.
5. **Aging**: entries expire after a timeout (often 300 s) so moved devices are relearned.

```diagram Switch learning
 Port 1: PC-A (MAC aa)   Port 2: PC-B (MAC bb)   Port 3: PC-C (MAC cc)

 A → B (first frame):  learn aa@1; bb unknown → flood to ports 2, 3
 B → A (reply):        learn bb@2; aa known @1 → forward only to port 1
 Table: aa → 1, bb → 2
```

### Switching methods

| Method | Behaviour | Latency | Error checking |
|---|---|---|---|
| Store-and-forward | receive the whole frame, check CRC, then forward | highest | full (drops bad frames) |
| Cut-through | forward after reading the destination MAC | lowest | none |
| Fragment-free | forward after the first 64 bytes (where collisions show up) | middle | partial |

### Switch vs hub vs router

| | Hub | Switch | Router |
|---|---|---|---|
| Layer | 1 | 2 | 3 |
| Forwards based on | nothing — repeats to all | MAC address | IP address |
| Collision domains | 1 for all ports | 1 per port | 1 per port |
| Broadcast domains | 1 | 1 (per VLAN) | 1 per interface |
| Duplex | half | full | full |

## VLANs (Virtual LANs)

A **VLAN** splits one physical switch into multiple logical LANs (separate broadcast domains) — e.g. VLAN 10 = Engineering, VLAN 20 = Guests.

- **Access port**: belongs to one VLAN (connects end devices).
- **Trunk port**: carries many VLANs between switches, tagging frames with **IEEE 802.1Q** tags (12-bit VLAN ID → up to 4094 VLANs).
- Traffic between VLANs needs a **router** or **layer-3 switch** (inter-VLAN routing).

Benefits: security isolation, smaller broadcast domains, flexible grouping independent of physical location.

## Loops and the Spanning Tree Protocol (STP)

Redundant links between switches create **loops**; broadcasts circulate forever (**broadcast storm**) and MAC tables flap.

**STP (IEEE 802.1D)** builds a loop-free tree:
1. Elect a **root bridge** (lowest bridge ID = priority + MAC).
2. Each switch picks its **root port** (lowest-cost path to the root).
3. Each segment picks a **designated port**.
4. All other ports are **blocked** (they become active only if a link fails).

Faster variants: **RSTP** (802.1w, convergence in seconds), **MSTP** (per-VLAN-group trees).

## Layer-3 switches

Switch hardware that can also route between VLANs/subnets at wire speed — common in campus networks. Routers still handle WAN links, NAT, VPNs and complex policies.

> [!INTERVIEW]
> - Circuit vs packet switching (dedicated path vs shared, independent packets).
> - How a switch learns MAC addresses; what it does with an unknown destination (flood).
> - Hub vs switch vs router (layer, domains).
> - What is a VLAN; why is a router needed between VLANs?
> - Why STP exists (prevent loops / broadcast storms).

> [!REMEMBER]
> Internet = packet switching. Switches learn source MACs, forward known destinations, flood unknown ones, and age entries out. VLANs split broadcast domains (802.1Q tags on trunks). STP blocks redundant links to stop loops.
