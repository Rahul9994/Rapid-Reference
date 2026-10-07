**Subnetting** divides one IP network into smaller networks (subnets) by borrowing host bits for the network part. It improves address utilisation, security (segmentation) and performance (smaller broadcast domains).

## The core formulas

For a network with prefix length **p** (e.g. /26):

| Quantity | Formula |
|---|---|
| Host bits h | 32 − p |
| Addresses per subnet | 2ʰ |
| Usable hosts per subnet | 2ʰ − 2 |
| Subnets created by borrowing s bits | 2ˢ |
| **Block size** (in the "interesting" octet) | 256 − mask value in that octet |

The **network address** has all host bits 0; the **broadcast address** has all host bits 1; usable hosts lie in between.

## Mask cheat-sheet (last octet)

| Prefix | Mask | Block size | Usable hosts |
|---|---|---|---|
| /24 | 255.255.255.0 | 256 | 254 |
| /25 | 255.255.255.128 | 128 | 126 |
| /26 | 255.255.255.192 | 64 | 62 |
| /27 | 255.255.255.224 | 32 | 30 |
| /28 | 255.255.255.240 | 16 | 14 |
| /29 | 255.255.255.248 | 8 | 6 |
| /30 | 255.255.255.252 | 4 | 2 |

## Worked example 1 — find network, broadcast, range

**IP: 192.168.10.77/27**

1. /27 → mask 255.255.255.224 → block size = 256 − 224 = **32**.
2. Subnets in the last octet start at 0, 32, 64, 96, … → 77 lies in **64–95**.
3. Network address = **192.168.10.64**
4. Broadcast address = **192.168.10.95**
5. Usable range = **192.168.10.65 – 192.168.10.94** (30 hosts).

```diagram Last octet of 192.168.10.x/27
  0 ───── 31 │ 32 ───── 63 │ 64 ──[77]── 95 │ 96 ───── 127 │ ...
                             ▲ network   ▲ broadcast
```

## Worked example 2 — split a network into equal subnets

**Split 192.168.1.0/24 into 4 subnets.**

- Need 4 = 2² subnets → borrow **2 bits** → /26, block size 64, 62 hosts each.

| Subnet | Network | Usable hosts | Broadcast |
|---|---|---|---|
| 1 | 192.168.1.0/26 | .1 – .62 | .63 |
| 2 | 192.168.1.64/26 | .65 – .126 | .127 |
| 3 | 192.168.1.128/26 | .129 – .190 | .191 |
| 4 | 192.168.1.192/26 | .193 – .254 | .255 |

## Worked example 3 — choose a mask for a host requirement

**Need at least 50 hosts per subnet.** Smallest h with 2ʰ − 2 ≥ 50 → h = 6 (62 hosts) → prefix **/26**.

**Need 500 hosts?** 2⁹ − 2 = 510 ≥ 500 → h = 9 → **/23** (mask 255.255.254.0, block size 2 in the third octet).

## Worked example 4 — VLSM (Variable Length Subnet Masking)

Allocate from **10.0.0.0/24** for: Sales 100 hosts, Dev 50 hosts, HR 20 hosts, two point-to-point links (2 hosts each). **Allocate the largest first.**

| Need | Hosts | Prefix | Allocated block | Usable range | Broadcast |
|---|---|---|---|---|---|
| Sales | 100 | /25 (126) | 10.0.0.0/25 | .1 – .126 | .127 |
| Dev | 50 | /26 (62) | 10.0.0.128/26 | .129 – .190 | .191 |
| HR | 20 | /27 (30) | 10.0.0.192/27 | .193 – .222 | .223 |
| Link 1 | 2 | /30 (2) | 10.0.0.224/30 | .225 – .226 | .227 |
| Link 2 | 2 | /30 (2) | 10.0.0.228/30 | .229 – .230 | .231 |

Remaining free: 10.0.0.232 – 10.0.0.255. VLSM wastes far fewer addresses than giving every subnet the same size.

## Worked example 5 — are two hosts on the same subnet?

`172.16.45.14/20` and `172.16.50.9/20`:
- /20 → third-octet block size = 256 − 240 = 16 → ranges 32–47, 48–63, …
- 45 is in 32–47; 50 is in 48–63 → **different subnets** (172.16.32.0/20 vs 172.16.48.0/20) — they need a router to talk.

## Let Python check your work

```python
import ipaddress

iface = ipaddress.ip_interface("192.168.10.77/27")
net = iface.network
hosts = list(net.hosts())
print(net, net.broadcast_address, hosts[0], hosts[-1], len(hosts))

for sub in ipaddress.ip_network("192.168.1.0/24").subnets(new_prefix=26):
    print(sub, end="  ")
print()

a = ipaddress.ip_interface("172.16.45.14/20").network
b = ipaddress.ip_interface("172.16.50.9/20").network
print(a, b, a == b)
```

```output
192.168.10.64/27 192.168.10.95 192.168.10.65 192.168.10.94 30
192.168.1.0/26  192.168.1.64/26  192.168.1.128/26  192.168.1.192/26  
172.16.32.0/20 172.16.48.0/20 False
```

## Supernetting / route summarisation

Combine contiguous networks into one advertisement. `192.168.4.0/24` … `192.168.7.0/24` (4 networks) → `192.168.4.0/22` — the third octets 4–7 share their first 6 bits (000001xx).

```python
import ipaddress
nets = [ipaddress.ip_network(f"192.168.{i}.0/24") for i in range(4, 8)]
print(list(ipaddress.collapse_addresses(nets)))   # [IPv4Network('192.168.4.0/22')]
```

> [!TIP]
> Exam speed trick: find the "interesting" octet (where the mask isn't 255 or 0), compute the block size 256 − mask, list multiples of the block size, and locate the IP between two multiples.

> [!INTERVIEW]
> - How many usable hosts in a /28? — 14.
> - Network and broadcast of 10.1.1.130/25? — 10.1.1.128 and 10.1.1.255.
> - Why subtract 2? — Network and broadcast addresses can't be assigned to hosts.
> - What's VLSM? — Using different prefix lengths for different subnets to avoid waste.

> [!REMEMBER]
> Block size = 256 − mask octet. Network = largest multiple of the block ≤ the IP; broadcast = next multiple − 1. Hosts = 2ʰ − 2. Allocate VLSM from the largest requirement down.
