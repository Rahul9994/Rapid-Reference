**Paging** splits a process's logical memory into fixed-size **pages** and physical memory into frames of the same size. Any page can go in any free frame, so memory no longer has to be contiguous.

## Address translation

A logical address is split into a **page number (p)** and an **offset (d)**:

```diagram Paging hardware
 logical address
 ┌────────┬────────┐        page table              physical address
 │   p    │   d    │ ──p──► [ p → frame f ] ──f──► ┌────────┬────────┐
 └────────┴────────┘                                │   f    │   d    │
                                                    └────────┴────────┘
```

- Page size = 2ⁿ bytes → the offset is the low **n** bits.
- Logical address space of 2ᵐ bytes → the page number is the high **m − n** bits.

### Worked example

Page size **4 KB** (2¹²), 32-bit logical addresses:

- Offset = 12 bits; page number = 32 − 12 = 20 bits → 2²⁰ ≈ 1 million pages.
- Logical address `0x00003A7C` → page `0x3` (= 3), offset `0xA7C`.
- If page 3 maps to frame 7, physical address = 7 × 4096 + 0xA7C = `0x7A7C`.

```python
PAGE_SIZE = 4096
page_table = {0: 5, 1: 2, 2: 9, 3: 7}

def translate(logical):
    page, offset = divmod(logical, PAGE_SIZE)       # = logical >> 12, logical & 0xFFF
    if page not in page_table:
        raise MemoryError(f"page fault on page {page}")
    return page_table[page] * PAGE_SIZE + offset

print(hex(translate(0x3A7C)))   # 0x7a7c
```

## Page table entries (PTE)

Besides the frame number, a PTE stores:

| Bit | Meaning |
|---|---|
| Valid / present | page is in memory (else → page fault) |
| Protection (R/W/X) | allowed access types |
| Dirty (modified) | page was written → must be saved before eviction |
| Referenced (accessed) | page was used recently → helps replacement algorithms |
| User/supervisor | kernel-only pages |

## Page table size problem

32-bit addresses, 4 KB pages, 4-byte PTEs → 2²⁰ entries × 4 B = **4 MB per process** just for the page table — too big to keep contiguous. Solutions:

### 1. Multilevel (hierarchical) page tables

Page the page table itself. A two-level scheme splits p into p1 (outer index) and p2 (inner index):

```diagram Two-level page table (32-bit, 4 KB pages)
 ┌──────────┬──────────┬────────────┐
 │ p1 (10)  │ p2 (10)  │ offset (12)│
 └──────────┴──────────┴────────────┘
  outer table → inner table → frame + offset
```

Only inner tables for regions actually used are allocated. x86-64 uses **4 (or 5) levels**.

### 2. Hashed page tables

Hash the virtual page number into a table of chains — common for address spaces > 32 bits.

### 3. Inverted page table

One entry per **physical frame** (not per page), storing (process id, page). Small table, but lookups require a search (sped up with hashing) and sharing pages is harder.

## TLB — Translation Lookaside Buffer

Every memory access would need an extra page-table access (or several, with multilevel tables). The **TLB** is a small, fast associative cache of recent page → frame translations.

```diagram Lookup with a TLB
 CPU ── p ──► TLB hit? ── yes ──► frame f ──► memory access
                │ no (miss)
                ▼
        walk page table in memory ──► frame f ──► update TLB ──► memory access
```

### Effective Access Time (EAT)

With TLB hit ratio **h**, TLB lookup time **t**, memory access time **m** (single-level table):

**EAT = h × (t + m) + (1 − h) × (t + 2m)**

Example: h = 0.8, t = 20 ns, m = 100 ns
- Hit: 20 + 100 = 120 ns
- Miss: 20 + 100 (page table) + 100 (data) = 220 ns
- EAT = 0.8 × 120 + 0.2 × 220 = 96 + 44 = **140 ns**

With h = 0.98: EAT = 0.98 × 120 + 0.02 × 220 = **122 ns**. High hit ratios (thanks to locality) make paging nearly free.

> [!NOTE]
> Some textbooks ignore the TLB lookup time t or assume it overlaps with memory access. Read the question's assumptions carefully.

On a context switch, the TLB must be flushed unless entries are tagged with an **ASID** (address-space identifier).

## Shared pages

Read-only code pages (e.g. a shared library, or the code of several instances of the same program) can map to the **same frames** in multiple processes — big memory savings. Copy-on-write after `fork` builds on this.

## Advantages and disadvantages

| ✅ Advantages | ❌ Disadvantages |
|---|---|
| no external fragmentation | internal fragmentation (≈ half a page per process) |
| simple allocation (any free frame) | page-table memory overhead |
| easy sharing and protection per page | extra memory access per translation (mitigated by TLB) |
| enables virtual memory / demand paging | |

## Page size trade-offs

| Smaller pages | Larger pages |
|---|---|
| less internal fragmentation | smaller page tables, fewer TLB misses (better TLB reach) |
| better locality granularity | more efficient disk I/O per page |

Common sizes: 4 KB, with **huge pages** of 2 MB / 1 GB for large-memory workloads (databases, VMs).

> [!INTERVIEW]
> - Split addresses into page number + offset; offset bits = log₂(page size).
> - Compute page-table size: entries × PTE size.
> - EAT formula with TLB hit ratio.
> - Why multilevel tables? — To avoid allocating a huge contiguous table for sparse address spaces.

> [!REMEMBER]
> Logical address = (page, offset) → (frame, offset). Page tables live in memory; the TLB caches translations. EAT = h(t + m) + (1 − h)(t + 2m). Paging kills external fragmentation but keeps internal fragmentation.
