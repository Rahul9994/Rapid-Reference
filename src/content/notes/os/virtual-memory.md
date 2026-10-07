**Virtual memory** separates the memory a program *sees* from the physical RAM it actually uses. Programs can be larger than RAM, more programs fit in memory at once, and each process gets a private, contiguous-looking address space.

## The idea

```diagram Virtual memory backed by RAM and disk
 Process virtual address space        Physical RAM            Disk (swap / files)
 ┌────────────┐                       ┌──────────┐            ┌──────────┐
 │ page 0  ●──┼──────────────────────►│ frame 3  │            │          │
 │ page 1  ●──┼──────────────────────►│ frame 7  │            │          │
 │ page 2  ○──┼─────────── not loaded ─────────────────────► │ page 2   │
 │ page 3  ●──┼──────────────────────►│ frame 1  │            │          │
 └────────────┘                       └──────────┘            └──────────┘
   ● valid (in RAM)   ○ invalid (on disk / never loaded)
```

Benefits:
- Programs larger than physical memory can run.
- Higher degree of multiprogramming → better CPU utilisation.
- Less I/O to load/swap programs (load only what's used).
- Isolation, sharing (shared libraries), copy-on-write, memory-mapped files.

## Demand paging

Load a page **only when it's first accessed** (a "lazy swapper" / pager).

### Page fault handling

```diagram Steps when a page fault occurs
 1. CPU accesses a page whose PTE is marked invalid → trap to the OS (page fault)
 2. OS checks: invalid reference? → terminate (segmentation fault)
                valid but not in memory? → continue
 3. Find a free frame (or choose a victim with a page-replacement algorithm;
    write it to disk first if dirty)
 4. Schedule a disk read of the needed page into the frame (process blocks)
 5. Update the page table: frame number + valid bit
 6. Restart the instruction that caused the fault
```

- **Pure demand paging**: start with zero pages in memory.
- **Prefetching / prepaging**: load nearby pages in advance to exploit locality.
- **Locality of reference** (temporal + spatial) is why demand paging works: programs use a small set of pages at a time.

### Effective access time with page faults

With page-fault rate **p**, memory access time **ma** and page-fault service time **s**:

**EAT = (1 − p) × ma + p × s**

Example: ma = 200 ns, s = 8 ms = 8,000,000 ns.
- p = 0.001 → EAT ≈ 0.999 × 200 + 0.001 × 8,000,000 ≈ **8,200 ns** — a 40× slowdown!
- To keep slowdown under 10% (EAT < 220 ns): p < 2.5 × 10⁻⁶ — fewer than one fault per 400,000 accesses.

Page faults are **very** expensive; keeping the fault rate tiny is essential.

## Copy-on-write (COW)

After `fork()`, parent and child share all pages marked read-only. Only when one of them **writes** a page does the kernel copy that single page. Forking is fast, and pages never written are never copied.

## Memory-mapped files

`mmap` maps a file into the address space; reading/writing memory reads/writes the file through the page cache, with the OS handling I/O via page faults. Used for fast file I/O and shared memory.

```python
import mmap

with open("data.bin", "wb") as f:
    f.write(b"hello virtual memory")

with open("data.bin", "r+b") as f:
    with mmap.mmap(f.fileno(), 0) as mm:     # map the whole file
        print(mm[:5])                         # b'hello'
        mm[0:5] = b"HELLO"                    # writes go to the file
```

## Frame allocation

How many frames does each process get?

| Policy | Idea |
|---|---|
| Equal allocation | m frames / n processes each |
| Proportional allocation | frames ∝ process size |
| Priority allocation | more frames for higher priority |
| Global replacement | a process may take frames from others (better throughput, less predictable) |
| Local replacement | a process replaces only its own frames (more predictable) |

## Thrashing

A process is **thrashing** when it spends more time paging than executing — it doesn't have enough frames for its current locality, so every access evicts a page it will need soon.

```diagram CPU utilisation vs degree of multiprogramming
 CPU
 util │          ____
      │        /      \
      │      /          \   ← thrashing: adding processes makes it worse
      │    /              \
      │  /                  \___
      └──────────────────────────── degree of multiprogramming
```

The vicious cycle: low CPU utilisation → scheduler adds more processes → more page faults → even lower utilisation.

### Handling thrashing

1. **Working-set model** — the working set WS(Δ) is the set of pages referenced in the last Δ references. Give each process enough frames for its working set; if the total demand D = Σ WSSᵢ exceeds available frames, **suspend** a process.
2. **Page-fault frequency (PFF)** — set upper and lower bounds on a process's fault rate; too many faults → give it more frames, too few → take frames away.
3. Reduce the degree of multiprogramming; add RAM; use local replacement.

## Belady's anomaly preview

With FIFO replacement, giving a process **more frames can increase page faults**. Stack algorithms (LRU, Optimal) never suffer from it. See *Page Replacement*.

> [!INTERVIEW]
> - *What is virtual memory?* — An abstraction giving each process a large private address space backed by RAM + disk.
> - *What happens on a page fault?* — Trap, validate, get a frame (maybe evict), read the page from disk, update the PTE, restart the instruction.
> - *What is thrashing and how do you fix it?* — Excessive paging due to too few frames; working-set model, PFF, reduce multiprogramming.
> - *Copy-on-write?* — Share pages after fork; copy a page only on the first write.

> [!REMEMBER]
> Demand paging + locality makes virtual memory work. EAT = (1 − p)·ma + p·fault_time — faults are millions of times slower than memory. Thrashing happens when working sets don't fit; fix it by giving fewer processes more frames.
