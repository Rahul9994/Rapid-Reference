The **OSI (Open Systems Interconnection) model** is a 7-layer reference model that splits network communication into layers, each with a clear job and interface to the layers above and below.

## The seven layers

| # | Layer | Responsibility | PDU | Protocols / examples | Devices |
|---|---|---|---|---|---|
| 7 | **Application** | network services for applications | Data | HTTP, HTTPS, FTP, SMTP, DNS, SSH | gateways, proxies |
| 6 | **Presentation** | translation, encryption, compression | Data | TLS/SSL (conceptually), JPEG, ASCII/UTF-8 | — |
| 5 | **Session** | establish, manage, terminate sessions; checkpoints | Data | NetBIOS, RPC, session tokens | — |
| 4 | **Transport** | process-to-process delivery, reliability, flow control, segmentation | **Segment** (TCP) / Datagram (UDP) | TCP, UDP, QUIC | firewalls, load balancers (L4) |
| 3 | **Network** | logical addressing (IP), routing between networks | **Packet** | IPv4, IPv6, ICMP, OSPF, BGP | routers, L3 switches |
| 2 | **Data Link** | node-to-node delivery, MAC addressing, framing, error detection | **Frame** | Ethernet, Wi-Fi (802.11), ARP*, PPP | switches, bridges, NICs |
| 1 | **Physical** | transmit raw bits over the medium | **Bits** | cables, fibre, radio, voltages, RJ45 | hubs, repeaters, modems |

\*ARP is often placed between layers 2 and 3.

**Mnemonics**
- Top → bottom: **A**ll **P**eople **S**eem **T**o **N**eed **D**ata **P**rocessing
- Bottom → top: **P**lease **D**o **N**ot **T**hrow **S**ausage **P**izza **A**way

## Encapsulation and decapsulation

Each layer adds its own **header** (and the data link layer also a **trailer**) on the way down; the receiver strips them on the way up.

```diagram Encapsulation as data travels down the sender's stack
 Application   [            Data            ]
 Transport     [TCP hdr][      Data         ]                ← segment
 Network       [IP hdr][TCP hdr][   Data    ]                ← packet
 Data link     [Eth hdr][IP hdr][TCP hdr][Data][Eth trailer] ← frame
 Physical      0101100101010110100101010101011101...         ← bits
```

Peer layers communicate **logically** (TCP talks to TCP), but data physically moves only at layer 1.

## Layer details

### 1. Physical layer

- Bit representation (encoding), voltage levels, data rate, cable/connector specs.
- Transmission media: guided (twisted pair, coaxial, fibre) and unguided (radio, microwave, infrared).
- Line coding (NRZ, Manchester), modulation, multiplexing (FDM, TDM, WDM).

### 2. Data link layer

- **Framing**: marks the start/end of frames.
- **Physical (MAC) addressing**: 48-bit MAC addresses.
- **Error detection**: CRC, checksums, parity (some links also correct errors).
- **Flow control** between adjacent nodes; **media access control** (CSMA/CD for classic Ethernet, CSMA/CA for Wi-Fi).
- Sub-layers: **LLC** (logical link control) and **MAC** (media access control).

### 3. Network layer

- **Logical addressing** (IP addresses), **routing** (choosing paths), **forwarding** (moving packets to the next hop).
- Fragmentation (IPv4), TTL to stop looping packets, ICMP for errors (`ping`, `traceroute`).

### 4. Transport layer

- **Port numbers** identify processes (process-to-process delivery).
- **Segmentation & reassembly**, **connection management**, **reliability** (acknowledgements, retransmission), **flow control**, **congestion control** (TCP).

### 5. Session layer

- Opens, maintains and closes sessions (dialogue control: half/full duplex), adds **synchronisation checkpoints** so long transfers can resume.

### 6. Presentation layer

- **Translation** between data formats (character encodings, serialisation), **encryption/decryption**, **compression**.

### 7. Application layer

- Interfaces used by applications: web (HTTP), email (SMTP/IMAP/POP3), file transfer (FTP/SFTP), name resolution (DNS), remote login (SSH).

## Which layer handles what? (quick test)

| Concern | Layer |
|---|---|
| Choosing the best path across networks | Network (3) |
| Retransmitting a lost segment | Transport (4) |
| MAC address lookup in a switch | Data link (2) |
| Converting text to UTF-8 / encrypting data | Presentation (6) |
| Voltage levels on a cable | Physical (1) |
| Resolving a domain name | Application (7) — DNS |
| Port numbers | Transport (4) |

## OSI vs TCP/IP

OSI is a **reference model** (great for teaching and troubleshooting); the internet actually runs on the **TCP/IP model**, which merges layers 5–7 into one Application layer and layers 1–2 into Link (see *TCP/IP Model*).

> [!INTERVIEW]
> - Name the 7 layers in order with one protocol each.
> - PDU names: bits, frames, packets, segments, data.
> - Which layer does a router / switch / hub work at? — 3 / 2 / 1.
> - Encapsulation: each layer wraps the data with its header.

> [!REMEMBER]
> Physical → Data link → Network → Transport → Session → Presentation → Application. Bits, frames, packets, segments, data. MAC at L2, IP at L3, ports at L4.
