The I/O subsystem connects the CPU to devices — disks, network cards, keyboards — and hides their differences behind uniform interfaces. Disk scheduling decides the order in which pending disk requests are served.

## I/O hardware basics

- Devices connect through **ports** and **buses** (PCIe, USB, SATA) and are run by **device controllers**.
- The OS talks to controllers through **registers** (status, control, data-in, data-out), accessed via special I/O instructions or **memory-mapped I/O**.
- **Device drivers** are kernel modules that translate generic requests into device-specific commands.

## Three ways to do I/O

| Technique | How it works | CPU cost | Best for |
|---|---|---|---|
| **Programmed I/O (polling)** | CPU repeatedly checks a status bit (busy-wait) | high — wastes cycles | very fast devices, very short waits |
| **Interrupt-driven I/O** | device raises an interrupt when ready; CPU does other work meanwhile | an interrupt per word/block | keyboards, moderate-rate devices |
| **DMA (Direct Memory Access)** | a DMA controller transfers a whole block between device and memory, interrupting once at the end | minimal | disks, network cards, bulk transfers |

```diagram DMA transfer
 CPU: "copy 64 KB from disk to address X, tell me when done" ──► DMA controller
 DMA controller ⇄ disk controller ⇄ memory   (CPU free to run other processes)
 DMA controller ──► interrupt ──► CPU: "transfer complete"
```

## Kernel I/O subsystem services

| Service | What it does |
|---|---|
| **Buffering** | temporary memory area to cope with speed mismatch (double buffering lets one buffer fill while the other is processed) |
| **Caching** | keep copies of frequently used data in faster memory (page cache) |
| **Spooling** | queue output for a device that can serve only one job at a time (printers) |
| **I/O scheduling** | reorder requests to improve efficiency (disk scheduling) |
| Device reservation | exclusive access to a device |
| Error handling | retries, error codes |

**Blocking vs non-blocking vs asynchronous I/O**: blocking suspends the caller until done; non-blocking returns immediately with whatever is available; asynchronous returns at once and notifies later (callbacks, `asyncio`, io_uring).

## Disk structure and access time

```diagram Magnetic disk geometry
 platters → surfaces → tracks (concentric circles) → sectors
 a cylinder = the same track position on every surface
 read/write heads move together on an actuator arm
```

**Access time = seek time + rotational latency + transfer time**

- **Seek time** — move the head to the right track (the dominant cost; what disk scheduling minimises).
- **Rotational latency** — wait for the sector to rotate under the head (average = half a rotation; at 7200 RPM ≈ 4.17 ms).
- **Transfer time** — actually reading the bits.

> [!NOTE]
> SSDs have no moving parts, so seek-based scheduling barely matters; they use simple FIFO-like schedulers (Linux `none`/`mq-deadline`) and care about wear-levelling and write amplification instead.

## Disk scheduling algorithms

We'll use a classic example: cylinders **0–199**, head at **53**, request queue

`98, 183, 37, 122, 14, 124, 65, 67`

### FCFS

Serve in arrival order: 53 → 98 → 183 → 37 → 122 → 14 → 124 → 65 → 67.
Total head movement = 45 + 85 + 146 + 85 + 108 + 110 + 59 + 2 = **640 cylinders**. Fair but inefficient.

### SSTF — Shortest Seek Time First

Always go to the closest pending request: 53 → 65 → 67 → 37 → 14 → 98 → 122 → 124 → 183.
Total = 12 + 2 + 30 + 23 + 84 + 24 + 2 + 59 = **236**. Efficient, but can **starve** far requests.

### SCAN (elevator)

Move in one direction serving requests, go to the **end** of the disk, then reverse. Head moving toward 0:
53 → 37 → 14 → **0** → 65 → 67 → 98 → 122 → 124 → 183.
Total = (53 − 0) + (183 − 0) = **236**.

### C-SCAN (circular SCAN)

Move in one direction to the end, **jump back** to the other end without serving, continue in the same direction. Moving toward 199:
53 → 65 → 67 → 98 → 122 → 124 → 183 → **199** → (jump) **0** → 14 → 37.
Total = (199 − 53) + (199 − 0) + (37 − 0) = 146 + 199 + 37 = **382** (counting the return jump; some textbooks exclude it → 183). Gives more **uniform waiting times**.

### LOOK and C-LOOK

Like SCAN/C-SCAN, but the head only goes as far as the **last request** in each direction, not the disk end.

- LOOK (toward 0 first): 53 → 37 → 14 → 65 → 67 → 98 → 122 → 124 → 183. Total = (53 − 14) + (183 − 14) = **208**.
- C-LOOK (toward 199): 53 → 65 → … → 183 → jump to 14 → 37. Total = (183 − 53) + (183 − 14) + (37 − 14) = 130 + 169 + 23 = **322** (with the jump counted).

```python
def total_movement(head, order):
    moves, pos = 0, head
    for cyl in order:
        moves += abs(cyl - pos)
        pos = cyl
    return moves

reqs, head = [98, 183, 37, 122, 14, 124, 65, 67], 53

def sstf(head, reqs):
    pending, pos, order = reqs[:], head, []
    while pending:
        nxt = min(pending, key=lambda c: abs(c - pos))
        order.append(nxt); pending.remove(nxt); pos = nxt
    return order

print(total_movement(head, reqs))                                   # FCFS
print(total_movement(head, sstf(head, reqs)))                       # SSTF
print(total_movement(head, [37, 14, 0, 65, 67, 98, 122, 124, 183])) # SCAN toward 0
print(total_movement(head, [37, 14, 65, 67, 98, 122, 124, 183]))    # LOOK toward 0
```

```output
640
236
236
208
```

### Comparison

| Algorithm | Total (example) | Starvation | Notes |
|---|---|---|---|
| FCFS | 640 | no | fair, slow |
| SSTF | 236 | **yes** | greedy, like SJF |
| SCAN | 236 | no | elevator; edge cylinders wait longer |
| C-SCAN | 382 (183 without jump) | no | uniform wait times |
| LOOK | 208 | no | SCAN without visiting the ends |
| C-LOOK | 322 (153 without jump) | no | common in practice |

## RAID (quick reference)

| Level | Technique | Fault tolerance | Notes |
|---|---|---|---|
| RAID 0 | striping | none | fastest, any disk failure loses data |
| RAID 1 | mirroring | 1 disk (per mirror) | 50% capacity |
| RAID 5 | striping + distributed parity | 1 disk | good balance |
| RAID 6 | double parity | 2 disks | safer for big arrays |
| RAID 10 | mirrors, then stripes | 1 per mirror pair | fast + redundant |

> [!INTERVIEW]
> - *Polling vs interrupts vs DMA?* — Busy-wait vs event notification vs bulk transfer without the CPU.
> - *Buffering vs caching vs spooling?* — Speed-mismatch holding area vs copy of data for reuse vs queueing output for an exclusive device.
> - *Which disk scheduling algorithm starves?* — SSTF.
> - *SCAN vs LOOK?* — LOOK reverses at the last request instead of the disk end.

> [!REMEMBER]
> Access time = seek + rotation + transfer; scheduling attacks seek time. FCFS fair, SSTF fast but starves, SCAN/C-SCAN sweep, LOOK/C-LOOK sweep only as far as needed. DMA frees the CPU for bulk I/O.
