**TCP (Transmission Control Protocol)** provides a **reliable, ordered, error-checked byte stream** between two processes over an unreliable IP network. Web, email, SSH, databases and file transfer all use TCP.

## TCP's guarantees and features

| Feature | How |
|---|---|
| Connection-oriented | 3-way handshake before data, 4-way teardown after |
| Reliable delivery | sequence numbers, acknowledgements, retransmissions |
| In-order delivery | receiver reorders segments by sequence number |
| Error detection | 16-bit checksum on header + data |
| Flow control | receiver-advertised **window** (rwnd) |
| Congestion control | sender-side **cwnd** (slow start, AIMD) |
| Full-duplex | both directions simultaneously |
| Byte stream | no message boundaries — the app must frame messages |

## TCP segment header

```diagram TCP header (20 bytes without options)
 0                   16                  31
 ┌───────────────────┬────────────────────┐
 │ Source port (16)  │ Destination port   │
 ├───────────────────┴────────────────────┤
 │ Sequence number (32)                   │
 ├────────────────────────────────────────┤
 │ Acknowledgement number (32)            │
 ├──────┬──────┬────────┬─────────────────┤
 │ HLen │ Rsvd │ Flags  │ Window size (16)│
 ├──────┴──────┴────────┼─────────────────┤
 │ Checksum (16)        │ Urgent ptr (16) │
 ├──────────────────────┴─────────────────┤
 │ Options (MSS, window scale, SACK, TS)  │
 └────────────────────────────────────────┘
```

| Flag | Meaning |
|---|---|
| **SYN** | synchronise sequence numbers (open) |
| **ACK** | acknowledgement field is valid |
| **FIN** | sender has finished sending (close one direction) |
| **RST** | abort / reset the connection |
| PSH | push data to the application immediately |
| URG | urgent pointer is valid |
| ECE / CWR | explicit congestion notification |

## Three-way handshake

```diagram Opening a TCP connection
 Client                                     Server (LISTEN)
   │ ── SYN, seq = x ─────────────────────────► │   SYN_RCVD
   │ ◄── SYN + ACK, seq = y, ack = x + 1 ────── │
   │ ── ACK, ack = y + 1 ─────────────────────► │   ESTABLISHED
 ESTABLISHED
```

Why three steps? Both sides must choose and **confirm** each other's initial sequence numbers (ISNs). Two messages wouldn't let the server know the client received its ISN; random ISNs also protect against old duplicate segments and spoofing.

**SYN flood attack**: attackers send many SYNs without completing the handshake, filling the server's half-open queue. Defences: **SYN cookies**, rate limiting, larger backlogs.

## Connection termination (four-way)

```diagram Closing a TCP connection
 Client (active close)                         Server
   │ ── FIN, seq = u ────────────────────────────► │  CLOSE_WAIT
 FIN_WAIT_1                                        │
   │ ◄── ACK, ack = u + 1 ──────────────────────── │
 FIN_WAIT_2                                        │  (server may still send data)
   │ ◄── FIN, seq = v ──────────────────────────── │  LAST_ACK
   │ ── ACK, ack = v + 1 ────────────────────────► │  CLOSED
 TIME_WAIT (2 × MSL) → CLOSED
```

- Each direction is closed separately (**half-close**), hence four messages (the middle ACK and FIN can be combined → 3).
- **TIME_WAIT** (2 × Maximum Segment Lifetime) ensures the final ACK can be retransmitted and old duplicate segments die out before the same port pair is reused.

## Reliability mechanics

- **Sequence numbers** count **bytes**, not segments. If a segment carries bytes 1000–1499, the receiver replies **ACK 1500** ("next byte I expect").
- **Cumulative ACKs**: ACK n confirms all bytes before n.
- **Retransmission timeout (RTO)**: computed from smoothed RTT and its variance; doubles after each timeout (exponential back-off).
- **Fast retransmit**: 3 duplicate ACKs → resend the missing segment without waiting for the timeout.
- **SACK** (selective acknowledgement) option reports non-contiguous received blocks so only missing data is resent.
- **Nagle's algorithm** combines small writes into fuller segments; **delayed ACKs** batch acknowledgements (their interaction can add latency — `TCP_NODELAY` disables Nagle for interactive apps).

## MSS and MTU

- **MTU** — largest IP packet on a link (Ethernet: 1500 bytes).
- **MSS** — largest TCP payload: MTU − IP header (20) − TCP header (20) = **1460** bytes on Ethernet (IPv4).

## TCP state machine (main states)

`CLOSED → LISTEN → SYN_RCVD → ESTABLISHED → CLOSE_WAIT → LAST_ACK → CLOSED` (server side)
`CLOSED → SYN_SENT → ESTABLISHED → FIN_WAIT_1 → FIN_WAIT_2 → TIME_WAIT → CLOSED` (client side)

```bash
netstat -an | grep 443        # see connection states (ss -tan on Linux)
```

## Head-of-line blocking

Because TCP delivers bytes in order, one lost segment stalls delivery of everything behind it — even data belonging to other HTTP/2 streams. QUIC (HTTP/3) solves this with independent streams over UDP.

> [!INTERVIEW]
> - Explain the 3-way handshake and why it needs three messages.
> - Explain the 4-way teardown and TIME_WAIT.
> - How does TCP guarantee reliability and ordering? — Sequence numbers, ACKs, retransmission, checksums.
> - What is a SYN flood and how do SYN cookies help?
> - MSS vs MTU.

> [!REMEMBER]
> SYN → SYN-ACK → ACK to open; FIN/ACK each way to close; TIME_WAIT protects against stragglers. Sequence numbers count bytes, ACKs are cumulative, 3 duplicate ACKs trigger fast retransmit. Flow control = receiver window; congestion control = cwnd.
