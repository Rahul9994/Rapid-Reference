**Segmentation** divides a program into variable-sized logical units — code, data, stack, heap, functions — matching how programmers think about memory, rather than fixed-size pages.

## The idea

```diagram A program seen as segments
 Segment 0: main code     (size 1000)
 Segment 1: library code  (size 400)
 Segment 2: global data   (size 400)
 Segment 3: heap          (size 1100)
 Segment 4: stack         (size 1000)
```

A logical address is a pair **⟨segment number s, offset d⟩**.

## Segment table

Each entry has:

| Field | Meaning |
|---|---|
| **Base** | starting physical address of the segment |
| **Limit** | length of the segment |
| Protection bits | read / write / execute permissions |
| Valid bit | segment exists |

Translation: if `d < limit[s]` then physical = `base[s] + d`, otherwise trap (segmentation fault).

```diagram Segmentation hardware
 ⟨s, d⟩ ──► segment table[s] = (base, limit)
                  │
             d < limit ? ── no ──► trap: segmentation fault
                  │ yes
                  ▼
            physical = base + d
```

### Worked example

| Segment | Base | Limit |
|---|---|---|
| 0 | 1400 | 1000 |
| 1 | 6300 | 400 |
| 2 | 4300 | 400 |
| 3 | 3200 | 1100 |
| 4 | 4700 | 1000 |

```python
segment_table = {0: (1400, 1000), 1: (6300, 400), 2: (4300, 400), 3: (3200, 1100), 4: (4700, 1000)}

def translate(s, d):
    base, limit = segment_table[s]
    if d >= limit:
        return "segmentation fault"
    return base + d

print(translate(2, 53), translate(3, 852), translate(0, 1222))
```

```output
4353 4052 segmentation fault
```

## Advantages and disadvantages

| ✅ Advantages | ❌ Disadvantages |
|---|---|
| matches the logical structure of programs | **external fragmentation** (variable-size segments) |
| natural protection per segment (code read-only, stack no-exec) | allocation is harder (first/best fit, compaction) |
| easy sharing of whole segments (e.g. a library's code) | segments can be large → swapping whole segments is expensive |
| no internal fragmentation | |

## Paging vs segmentation

| | Paging | Segmentation |
|---|---|---|
| Unit size | fixed (pages) | variable (segments) |
| Visible to programmer | no | yes (logical units) |
| Fragmentation | internal | external |
| Address | page number + offset | segment number + offset |
| Table | page table (frame numbers) | segment table (base + limit) |
| Sharing/protection granularity | per page | per logical unit |

## Segmentation with paging

Combine both: the logical address selects a **segment**, and each segment is itself **paged**. You get logical units for protection/sharing and fixed-size frames to avoid external fragmentation.

```diagram Segmented paging
 ⟨s, d⟩ → segment table[s] gives the segment's page table
 d is split into ⟨p, offset⟩ → page table gives frame f
 physical = f × page_size + offset
```

Historically used by Intel x86 (32-bit protected mode) and MULTICS. In 64-bit x86 (long mode), segmentation is mostly disabled (flat model) and paging does the work — but the concept remains a classic exam question.

> [!INTERVIEW]
> - Segmentation = variable-size logical units; paging = fixed-size physical blocks.
> - Segment fault: offset ≥ limit (or invalid segment/permission).
> - Segmentation suffers external fragmentation; paging suffers internal fragmentation.
> - Segmented paging combines logical organisation with fragmentation-free allocation.

> [!REMEMBER]
> Address = ⟨segment, offset⟩; check offset < limit, then base + offset. Great for protection/sharing, bad for fragmentation — so real systems page the segments (or just use paging).
