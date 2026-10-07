**Routing** is choosing the path packets take between networks. Routers build **routing tables** (control plane) and use them to **forward** each packet to the next hop (data plane).

## Routing vs forwarding

| Routing (control plane) | Forwarding (data plane) |
|---|---|
| computes paths, builds the routing table | moves each packet from input to output interface |
| runs routing protocols / admin config | table lookup per packet |
| seconds to minutes | nanoseconds to microseconds (hardware) |

## The routing table

```text
Destination       Next hop        Interface   Metric
10.1.0.0/16       directly conn.  eth0        0
10.2.0.0/16       10.1.0.254      eth0        20
192.168.5.0/24    172.16.0.2      eth1        10
0.0.0.0/0         203.0.113.1     wan0        1      ← default route
```

### Longest prefix match

When several entries match, the router chooses the **most specific** (longest prefix).

```python
import ipaddress

table = [
    (ipaddress.ip_network("10.0.0.0/8"), "router A"),
    (ipaddress.ip_network("10.1.0.0/16"), "router B"),
    (ipaddress.ip_network("10.1.2.0/24"), "router C"),
    (ipaddress.ip_network("0.0.0.0/0"), "ISP (default)"),
]

def next_hop(ip):
    addr = ipaddress.ip_address(ip)
    matches = [(net, hop) for net, hop in table if addr in net]
    return max(matches, key=lambda m: m[0].prefixlen)[1]

for ip in ("10.1.2.7", "10.1.9.9", "10.200.0.1", "8.8.8.8"):
    print(ip, "→", next_hop(ip))
```

```output
10.1.2.7 → router C
10.1.9.9 → router B
10.200.0.1 → router A
8.8.8.8 → ISP (default)
```

## Static vs dynamic routing

| | Static routing | Dynamic routing |
|---|---|---|
| Configuration | manual | routers exchange information automatically |
| Adapts to failures | no | yes |
| Overhead | none | CPU, memory, bandwidth |
| Best for | small/stable networks, default routes, stub networks | large or changing networks |

## Interior vs exterior gateway protocols

- **IGP** (inside one Autonomous System, e.g. a company or ISP): RIP, OSPF, EIGRP, IS-IS.
- **EGP** (between Autonomous Systems): **BGP** — the routing protocol of the internet.

An **Autonomous System (AS)** is a network under one administrative control with a unique AS number.

## Distance-vector routing (e.g. RIP)

Each router knows only its **neighbours** and periodically shares its **distance vector** (its current best distances to every destination). Based on **Bellman-Ford**:

D_x(y) = min over neighbours v of { cost(x, v) + D_v(y) }

| Property | RIP |
|---|---|
| Metric | hop count (max 15; 16 = unreachable) |
| Updates | full table every 30 s to neighbours |
| Convergence | slow |
| Problem | **count-to-infinity** after a link failure |

**Count-to-infinity**: when a link breaks, neighbours may keep advertising stale routes to each other, increasing the metric step by step. Mitigations: **split horizon** (don't advertise a route back to the neighbour you learned it from), **poison reverse** (advertise it back with infinite cost), hold-down timers, triggered updates.

## Link-state routing (e.g. OSPF)

Each router learns the **entire topology**:
1. Discover neighbours (hello packets).
2. Flood **Link-State Advertisements (LSAs)** to all routers in the area.
3. Each router builds the same topology map (link-state database).
4. Run **Dijkstra's shortest-path-first** algorithm to compute its routing table.

| Property | OSPF |
|---|---|
| Metric | cost (typically based on bandwidth) |
| Updates | only on changes (+ periodic refresh), flooded |
| Convergence | fast |
| Scalability | hierarchical **areas** with a backbone (area 0) |

## Distance vector vs link state

| | Distance vector | Link state |
|---|---|---|
| Knowledge | neighbours' distance tables | full topology |
| Algorithm | Bellman-Ford | Dijkstra |
| Message content | entire table | only own links (LSAs) |
| Sent to | neighbours | all routers (flooding) |
| Convergence | slow, count-to-infinity possible | fast |
| Resources | low CPU/memory | higher CPU/memory |
| Examples | RIP, (EIGRP: advanced/hybrid) | OSPF, IS-IS |

## Path-vector routing: BGP

BGP routes between Autonomous Systems using **paths** (lists of AS numbers) rather than simple costs, and decisions are driven by **policy** (business relationships, preferences), not just shortest paths.

- Runs over **TCP port 179** between peers.
- **eBGP** between ASes, **iBGP** within an AS.
- The AS-path also prevents loops (a router rejects routes containing its own AS).
- Misconfigurations or hijacks can make large parts of the internet unreachable (route leaks) — RPKI helps validate origins.

## Tools

```bash
traceroute example.com       # Linux/macOS (tracert on Windows): shows each hop using TTL expiry
ping -c 4 8.8.8.8            # reachability + RTT (ICMP echo)
ip route show                # Linux routing table (route print on Windows)
```

`traceroute` sends packets with TTL = 1, 2, 3…; each router that decrements TTL to 0 replies with ICMP "Time Exceeded", revealing the path.

> [!INTERVIEW]
> - Longest prefix match.
> - Distance vector vs link state (RIP vs OSPF), count-to-infinity and split horizon.
> - IGP vs EGP; why BGP is policy-based.
> - Static vs dynamic routing; what a default route is.

> [!REMEMBER]
> Forward by longest prefix match. RIP = distance vector (Bellman-Ford, hop count, slow). OSPF = link state (Dijkstra, fast, areas). BGP = path vector between ASes, driven by policy.
