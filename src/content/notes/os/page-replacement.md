When a page fault occurs and no frame is free, the OS must evict a **victim** page. The page-replacement algorithm decides which one — and a good choice can cut page faults dramatically.

## Concept

- A **page hit**: the referenced page is already in a frame.
- A **page fault (miss)**: it isn't, so it must be loaded (possibly evicting another page).
- Goal: **minimise page faults** for a given number of frames.
- Dirty pages must be written back before eviction (the dirty bit avoids writing clean pages).

We'll trace each algorithm on the classic reference string with **3 frames**:

`7 0 1 2 0 3 0 4 2 3 0 3 2 1 2 0 1 7 0 1` (20 references)

## FIFO — First In, First Out

Evict the page that has been in memory the **longest**.

```diagram FIFO, 3 frames (F = fault)
 ref:    7  0  1  2  0  3  0  4  2  3  0  3  2  1  2  0  1  7  0  1
 f1:     7  7  7  2  2  2  2  4  4  4  0  0  0  0  0  0  0  7  7  7
 f2:        0  0  0  0  3  3  3  2  2  2  2  2  1  1  1  1  1  0  0
 f3:           1  1  1  1  0  0  0  3  3  3  3  3  2  2  2  2  2  1
 fault:  F  F  F  F     F  F  F  F  F  F        F  F        F  F  F
```

**15 page faults.** Simple, but evicts pages regardless of how heavily they're used.

### Belady's anomaly

For FIFO, **more frames can cause more faults**. Reference string `1 2 3 4 1 2 5 1 2 3 4 5`:
- 3 frames → **9 faults**
- 4 frames → **10 faults**

LRU and Optimal are *stack algorithms* and never exhibit Belady's anomaly.

## Optimal (OPT / MIN / Belady's algorithm)

Evict the page that **won't be used for the longest time in the future**.

```diagram Optimal, 3 frames
 ref:    7  0  1  2  0  3  0  4  2  3  0  3  2  1  2  0  1  7  0  1
 f1:     7  7  7  2  2  2  2  2  2  2  2  2  2  2  2  2  2  7  7  7
 f2:        0  0  0  0  0  0  4  4  4  0  0  0  0  0  0  0  0  0  0
 f3:           1  1  1  3  3  3  3  3  3  3  3  1  1  1  1  1  1  1
 fault:  F  F  F  F     F     F        F        F           F
```

**9 page faults** — the minimum possible. Not implementable (requires knowing the future), but used as a **benchmark** to compare real algorithms.

## LRU — Least Recently Used

Evict the page that **hasn't been used for the longest time** (use the past to predict the future).

```diagram LRU, 3 frames
 ref:    7  0  1  2  0  3  0  4  2  3  0  3  2  1  2  0  1  7  0  1
 f1:     7  7  7  2  2  2  2  4  4  4  0  0  0  1  1  1  1  1  1  1
 f2:        0  0  0  0  0  0  0  0  3  3  3  3  3  3  0  0  0  0  0
 f3:           1  1  1  3  3  3  2  2  2  2  2  2  2  2  2  7  7  7
 fault:  F  F  F  F     F     F  F  F  F        F     F     F
```

**12 page faults.** Usually close to optimal, but exact LRU needs hardware support:

- **Counters**: timestamp each access; evict the smallest (search cost).
- **Stack**: move a page to the top on every reference (doubly linked list + hash map — the LRU cache data structure).

## LRU approximations (used in practice)

| Algorithm | Idea |
|---|---|
| Reference bit | hardware sets the bit on access; OS periodically clears it |
| **Second chance (Clock)** | FIFO, but if the victim's reference bit is 1, clear it and move on (give it a second chance) |
| Enhanced second chance | consider (reference, dirty) pairs: prefer (0, 0) → (0, 1) → (1, 0) → (1, 1) |
| Aging | shift reference bits into a counter periodically |

## Counting algorithms

- **LFU** (least frequently used): evict the page with the smallest use count — suffers when a page was heavily used early but not anymore.
- **MFU** (most frequently used): evict the most used, assuming the least-used page was just brought in. Both are uncommon.

## Simulator

```python
def simulate(refs, frames, algo):
    mem, faults = [], 0
    for i, page in enumerate(refs):
        if page in mem:
            if algo == "LRU":                 # move to most-recently-used position
                mem.remove(page)
                mem.append(page)
            continue
        faults += 1
        if len(mem) == frames:
            if algo in ("FIFO", "LRU"):
                mem.pop(0)                    # oldest arrival / least recently used
            else:                             # OPT: farthest next use (or never used again)
                future = refs[i + 1:]
                victim = max(mem, key=lambda p: future.index(p) if p in future else float("inf"))
                mem.remove(victim)
        mem.append(page)
    return faults

refs = [7, 0, 1, 2, 0, 3, 0, 4, 2, 3, 0, 3, 2, 1, 2, 0, 1, 7, 0, 1]
print({a: simulate(refs, 3, a) for a in ("FIFO", "LRU", "OPT")})

belady = [1, 2, 3, 4, 1, 2, 5, 1, 2, 3, 4, 5]
print(simulate(belady, 3, "FIFO"), simulate(belady, 4, "FIFO"))
```

```output
{'FIFO': 15, 'LRU': 12, 'OPT': 9}
9 10
```

## Comparison

| Algorithm | Faults (example) | Implementable | Belady's anomaly | Notes |
|---|---|---|---|---|
| FIFO | 15 | ✅ easy | ✅ yes | ignores usage |
| Optimal | 9 | ❌ needs future | ❌ no | benchmark |
| LRU | 12 | ⚠ costly exactly | ❌ no | good approximation of OPT |
| Clock | ≈ LRU | ✅ cheap | possible | used by real OSes |

> [!INTERVIEW]
> - Trace FIFO/LRU/OPT on a reference string (draw the frame table!).
> - Belady's anomaly: FIFO can fault more with more frames; LRU and OPT can't (stack property).
> - Why isn't OPT used? — It needs future knowledge; it's a yardstick.
> - Real systems approximate LRU with reference bits (Clock / second chance).

> [!REMEMBER]
> FIFO = oldest out, OPT = farthest future use out (minimum faults), LRU = least recently used out. Draw one column per reference, mark faults, and count. FIFO alone suffers Belady's anomaly.
