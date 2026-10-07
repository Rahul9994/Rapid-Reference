**UDP (User Datagram Protocol)** is a minimal, connectionless transport protocol: it adds ports and a checksum to IP and sends independent **datagrams** — no handshake, no retransmission, no ordering.

## UDP header (only 8 bytes)

```diagram UDP header
 0                 16                31
 ┌─────────────────┬─────────────────┐
 │ Source port     │ Destination port│
 ├─────────────────┼─────────────────┤
 │ Length          │ Checksum        │
 └─────────────────┴─────────────────┘
 then: data
```

Compare with TCP's 20–60-byte header.

## TCP vs UDP

| | TCP | UDP |
|---|---|---|
| Connection | connection-oriented (handshake) | connectionless |
| Reliability | guaranteed delivery, retransmissions | best effort — packets may be lost |
| Ordering | in order | no ordering |
| Duplicates | removed | possible |
| Flow / congestion control | yes | no (app must handle) |
| Data unit | byte stream (no boundaries) | **datagrams** (message boundaries preserved) |
| Header | 20–60 bytes | 8 bytes |
| Speed / latency | higher overhead | low latency, low overhead |
| Broadcast / multicast | no | **yes** |
| Typical uses | web (HTTP/1.1, HTTP/2), email, SSH, file transfer, databases | DNS, DHCP, VoIP, video calls, live streaming, online games, NTP, SNMP, QUIC/HTTP/3 |

## When to choose UDP

- **Real-time** data where late data is useless (voice, video, gaming): retransmitting an old frame is worse than skipping it.
- **Small request/response** exchanges (DNS): a handshake would double the latency.
- **Broadcast/multicast** (DHCP discover, service discovery, IPTV).
- Building **custom reliability** on top: QUIC (HTTP/3) implements reliability, congestion control and encryption over UDP, avoiding TCP's head-of-line blocking and enabling faster evolution in user space.

## Reliability over UDP (if you need it)

Applications add their own:
- sequence numbers (detect loss/reordering)
- acknowledgements and retransmissions (or forward error correction)
- jitter buffers (smooth playback in VoIP)
- rate control to avoid congesting the network

## UDP in Python

```python
import socket

# Receiver
server = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)
server.bind(("127.0.0.1", 0))                  # 0 → let the OS choose a free port
addr = server.getsockname()

# Sender — no connect(), no handshake
client = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)
client.sendto(b"ping", addr)

data, sender = server.recvfrom(1024)           # one whole datagram per call
print(data, sender[0])
server.sendto(b"pong", sender)
print(client.recvfrom(1024)[0])

client.close(); server.close()
```

```output
b'ping' 127.0.0.1
b'pong'
```

> [!NOTE]
> A single `recvfrom` returns exactly **one datagram** (message boundaries are preserved), unlike TCP where one `recv` may return part of a message or several messages glued together.

## Limits

- Maximum UDP payload: 65,507 bytes over IPv4 (65,535 − 8 UDP − 20 IP), but datagrams larger than the path MTU get **fragmented**, and losing any fragment loses the whole datagram — keep datagrams ≲ 1,200–1,400 bytes in practice.
- The checksum is optional in IPv4 (0 = unused) but **mandatory in IPv6**.

> [!INTERVIEW]
> - TCP vs UDP (table above) and real examples of each.
> - Why does DNS use UDP? — Small, fast single exchanges; TCP for large responses.
> - Why do video calls and games use UDP? — Low latency; stale retransmitted data is useless.
> - What is QUIC? — A reliable, encrypted, multiplexed transport over UDP used by HTTP/3.

> [!REMEMBER]
> UDP = ports + checksum on top of IP: fast, connectionless, unordered, unreliable, message-preserving, supports broadcast/multicast. Choose it for real-time, tiny request/response, or when building your own reliability (QUIC).
