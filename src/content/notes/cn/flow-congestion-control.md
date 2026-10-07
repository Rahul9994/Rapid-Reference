**Flow control** stops a fast sender from overwhelming a slow **receiver**. **Congestion control** stops senders from overwhelming the **network**. TCP does both with windows: send at most `min(rwnd, cwnd)` unacknowledged bytes.

| | Flow control | Congestion control |
|---|---|---|
| Protects | the receiver's buffer | routers/links in the network |
| Signal | receiver advertises **rwnd** (window size field) | inferred from **loss** (timeouts, duplicate ACKs), delay, or ECN marks |
| Scope | end-to-end, between two hosts | network-wide, shared fairly among flows |
| Mechanism | sliding window | slow start, congestion avoidance (AIMD), fast recovery |

## Sliding window (flow control)

The sender may have up to **window size** bytes "in flight" (sent but unacknowledged). As ACKs arrive, the window slides forward.

```diagram Sender's view of the byte stream
 [ sent & ACKed | sent, not ACKed | can send now | can't send yet ]
                 └──────── window (≤ rwnd) ──────┘
```

- If the receiver's buffer fills, it advertises **rwnd = 0** → the sender pauses and sends periodic **window probes** (persist timer) until space opens.
- **Window scaling** (TCP option) multiplies the 16-bit window to support high bandwidth-delay paths (up to ~1 GB).

To keep a link fully used, the window must be at least the **bandwidth-delay product**: e.g. 100 Mbps × 50 ms = 5,000,000 bits ≈ **625 KB**.

## ARQ protocols (Automatic Repeat reQuest)

Data-link and transport protocols recover from loss with ARQ:

### Stop-and-Wait

Send one frame, wait for its ACK, then send the next.

- Simple; uses 1-bit sequence numbers.
- **Efficiency** = 1 / (1 + 2a), where **a = propagation delay / transmission delay**.
- Example: transmission 1 ms, propagation 10 ms → a = 10 → efficiency = 1/21 ≈ **4.8%**. Terrible on long links.

### Go-Back-N (GBN)

- Sender window size **N** (up to 2ᵏ − 1 with k-bit sequence numbers); receiver window = 1.
- Receiver accepts only **in-order** frames and sends cumulative ACKs; out-of-order frames are discarded.
- On a timeout/loss of frame i, the sender **retransmits frame i and everything after it**.

### Selective Repeat (SR)

- Sender and receiver windows of size up to **2ᵏ⁻¹**.
- Receiver **buffers** out-of-order frames and ACKs each individually.
- Only the **missing** frames are retransmitted.

| | Stop-and-Wait | Go-Back-N | Selective Repeat |
|---|---|---|---|
| Sender window | 1 | N ≤ 2ᵏ − 1 | ≤ 2ᵏ⁻¹ |
| Receiver window | 1 | 1 | ≤ 2ᵏ⁻¹ |
| Out-of-order frames | — | discarded | buffered |
| Retransmission on loss | that frame | that frame **and all after it** | **only** the lost frame |
| ACKs | per frame | cumulative | individual |
| Efficiency (lossy links) | low | medium | high |
| Complexity | simple | moderate | highest (buffers, sorting) |

Efficiency with window W (no losses): min(1, W / (1 + 2a)).

## TCP congestion control

The sender keeps a **congestion window (cwnd)**, measured in MSS-sized segments.

### Phases

1. **Slow start**: cwnd starts small (typically 10 MSS today; classically 1) and **doubles every RTT** (each ACK adds 1 MSS) — exponential growth until it reaches **ssthresh** or loss occurs.
2. **Congestion avoidance**: above ssthresh, increase cwnd by **about 1 MSS per RTT** — linear growth (**additive increase**).
3. **On loss**:
   - **Timeout** (severe): ssthresh = cwnd / 2, cwnd = 1 MSS, restart slow start.
   - **3 duplicate ACKs** (mild): **fast retransmit** the missing segment and **fast recovery** — ssthresh = cwnd / 2, cwnd = ssthresh (+3), continue in congestion avoidance (**multiplicative decrease**).

```diagram TCP Reno cwnd over time (sawtooth)
 cwnd
  │            /|         /|
  │           / |        / |       ← additive increase (linear)
  │      _   /  |       /  |
  │     / \ /   |  ___ /   |___    ← halve on 3 dup ACKs (multiplicative decrease)
  │    /   ·    | /        |
  │   /         |/         |
  │  / slow start
  └──────────────────────────────── time (RTTs)
```

**AIMD** (additive increase, multiplicative decrease) converges to a **fair** share of bandwidth among competing flows.

### Worked example (classic exam style)

cwnd starts at 1 MSS, ssthresh = 8, no losses:

| RTT | 1 | 2 | 3 | 4 | 5 | 6 | 7 |
|---|---|---|---|---|---|---|---|
| cwnd (MSS) | 1 | 2 | 4 | 8 | 9 | 10 | 11 |
| phase | slow start | slow start | slow start | → avoidance | avoidance | avoidance | avoidance |

If a timeout happens at cwnd = 12: ssthresh becomes 6, cwnd resets to 1, and slow start begins again.

### TCP variants

| Variant | Idea |
|---|---|
| Tahoe | on any loss: cwnd = 1, slow start (no fast recovery) |
| Reno | adds fast recovery for 3 duplicate ACKs |
| NewReno | better handling of multiple losses in one window |
| **CUBIC** | cubic growth function, independent of RTT — default on Linux, Windows, macOS |
| **BBR** | models bottleneck bandwidth and RTT instead of reacting to loss (Google) |

**ECN (Explicit Congestion Notification)**: routers mark packets instead of dropping them; the receiver echoes the mark and the sender slows down without losing data.

## Congestion control in routers (queue management)

- **Drop-tail**: drop arriving packets when the queue is full (can cause global synchronisation and bufferbloat).
- **RED / AQM (CoDel, FQ-CoDel)**: drop or mark packets early and probabilistically to keep queues short and latency low.
- Traffic shaping: **leaky bucket** (constant output rate) and **token bucket** (allows bursts up to the bucket size).

> [!INTERVIEW]
> - Flow vs congestion control.
> - Stop-and-Wait vs Go-Back-N vs Selective Repeat (window sizes, retransmission behaviour).
> - Slow start, congestion avoidance, fast retransmit/recovery; what happens on timeout vs 3 duplicate ACKs.
> - What is AIMD and why does it lead to fairness?
> - Efficiency of stop-and-wait: 1 / (1 + 2a).

> [!REMEMBER]
> Send ≤ min(rwnd, cwnd). Receiver window = flow control; cwnd = congestion control. Slow start doubles per RTT until ssthresh, then +1 MSS per RTT. Timeout → cwnd = 1; 3 dup ACKs → halve. GBN resends everything after a loss, SR only the lost frame.
