A **computer network** is a set of devices (nodes) connected by links so they can share data and resources. This page covers the vocabulary and building blocks you'll need for every other networking topic.

## Network types by scale

| Type | Range | Example |
|---|---|---|
| PAN — Personal Area Network | a few metres | Bluetooth earbuds, smartwatch |
| LAN — Local Area Network | a building / campus | office Ethernet, home Wi-Fi |
| MAN — Metropolitan Area Network | a city | city-wide cable or fibre network |
| WAN — Wide Area Network | countries / continents | the internet, corporate WAN links |

Other terms: **WLAN** (wireless LAN), **SAN** (storage area network), **VPN** (virtual private network over a public network).

## Topologies

| Topology | Layout | ✅ Pros | ❌ Cons |
|---|---|---|---|
| Bus | all devices on one backbone cable | cheap, simple | one cable break kills the network; collisions |
| Star | every device connects to a central switch/hub | easy to manage, failure of one link is isolated | central device is a single point of failure |
| Ring | each device connects to two neighbours | ordered access (token passing) | one failure can break the ring |
| Mesh | many/all devices interconnected | highly reliable, redundant paths | expensive; full mesh needs n(n−1)/2 links |
| Tree | hierarchy of stars | scalable | root failure affects branches |
| Hybrid | combination | flexible | complex |

```diagram Star vs full mesh (4 nodes)
     Star                      Full mesh (6 links = 4·3/2)
      A                         A ─── B
      │                         │ ╲ ╱ │
 B ── S ── C                    │  ╳  │
      │                         │ ╱ ╲ │
      D                         C ─── D
```

## Network devices

| Device | OSI layer | What it does |
|---|---|---|
| Repeater | 1 (Physical) | regenerates the signal to extend distance |
| Hub | 1 | multi-port repeater; broadcasts every frame to all ports (one collision domain) |
| Bridge | 2 (Data link) | connects two LAN segments, filters by MAC address |
| **Switch** | 2 (sometimes 3) | forwards frames only to the destination port using a MAC table; each port is its own collision domain |
| **Router** | 3 (Network) | forwards packets between networks using IP addresses and routing tables; separates broadcast domains |
| Gateway | up to 7 | translates between different protocols/architectures |
| Access point | 2 | connects wireless devices to a wired LAN |
| Modem | 1 | modulates/demodulates signals (DSL, cable) |
| Firewall | 3–7 | filters traffic by rules |
| Load balancer | 4 / 7 | spreads traffic across servers |

> [!NOTE]
> A **collision domain** is a segment where simultaneous transmissions collide (hubs share one; switches give one per port). A **broadcast domain** is where a broadcast frame reaches (routers separate them; VLANs split them on switches).

## Transmission modes

| Mode | Direction | Example |
|---|---|---|
| Simplex | one way only | keyboard → computer, TV broadcast |
| Half-duplex | both ways, one at a time | walkie-talkie, old Ethernet hubs |
| Full-duplex | both ways simultaneously | phone call, modern switched Ethernet |

## Key performance metrics

| Metric | Meaning | Unit |
|---|---|---|
| **Bandwidth** | maximum data rate of a link | bits per second (bps) |
| **Throughput** | actual achieved data rate | bps |
| **Latency (delay)** | time for data to travel from source to destination | ms |
| Jitter | variation in latency | ms |
| Packet loss | % of packets that never arrive | % |
| **RTT** | round-trip time (there and back) | ms |

### Components of delay

**Total delay = transmission + propagation + queuing + processing**

| Delay | Formula / cause |
|---|---|
| Transmission | packet size ÷ bandwidth (time to push bits onto the wire) |
| Propagation | distance ÷ signal speed (≈ 2 × 10⁸ m/s in fibre/copper) |
| Queuing | waiting in router buffers (depends on congestion) |
| Processing | header checks, routing lookup |

**Example**: 1,000-byte packet over a 10 Mbps link spanning 2,000 km.
- Transmission = 8,000 bits ÷ 10⁷ bps = **0.8 ms**
- Propagation = 2 × 10⁶ m ÷ 2 × 10⁸ m/s = **10 ms**

**Bandwidth-delay product** = bandwidth × RTT = bits "in flight" on the link — this is how large a sender's window must be to keep a link full.

## Switching techniques (overview)

- **Circuit switching**: a dedicated path for the whole session (classic telephone network).
- **Packet switching**: data split into packets routed independently (the internet).
- **Message switching**: whole messages stored and forwarded (historic).

See *Switching* for details.

## Client–server vs peer-to-peer

| | Client–server | Peer-to-peer (P2P) |
|---|---|---|
| Roles | dedicated servers serve clients | every node is both client and server |
| Examples | web, email, databases | BitTorrent, some blockchains |
| Pros | central control, security | scalability, no single point of failure |
| Cons | server bottleneck / single point of failure | harder management and security |

## Protocols and standards

A **protocol** is an agreed set of rules for communication: **syntax** (format), **semantics** (meaning) and **timing** (when/how fast). Standards bodies: IETF (RFCs — TCP/IP, HTTP), IEEE (802.3 Ethernet, 802.11 Wi-Fi), ITU, W3C.

> [!INTERVIEW]
> - Hub vs switch vs router (layer, addressing, collision/broadcast domains).
> - Bandwidth vs throughput vs latency.
> - Transmission vs propagation delay with a numeric example.
> - LAN vs MAN vs WAN; star vs mesh topology.

> [!REMEMBER]
> Hubs repeat (L1), switches forward by MAC (L2), routers route by IP (L3). Delay = transmission + propagation + queuing + processing. Bandwidth is capacity, throughput is reality, latency is time.
