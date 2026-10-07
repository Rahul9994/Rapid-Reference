A **deadlock** is a state where a set of processes are each waiting for a resource held by another process in the set — so none of them can ever proceed.

```diagram Two-process deadlock
 P1 holds R1, wants R2
 P2 holds R2, wants R1

   P1 ──requests──► R2
   ▲                 │
 holds             holds
   │                 ▼
   R1 ◄──requests── P2
```

## The four necessary (Coffman) conditions

A deadlock can occur **only if all four hold simultaneously**:

| Condition | Meaning |
|---|---|
| **Mutual exclusion** | at least one resource is non-shareable |
| **Hold and wait** | a process holds resources while waiting for others |
| **No preemption** | resources can't be forcibly taken away |
| **Circular wait** | a cycle P1 → P2 → … → Pn → P1 of waiting |

Break any one → no deadlock.

## Resource Allocation Graph (RAG)

- Process nodes (circles), resource nodes (squares, with dots for instances).
- **Request edge** P → R, **assignment edge** R → P.

| Resource instances | Cycle in RAG means… |
|---|---|
| single instance per resource | **deadlock** (necessary and sufficient) |
| multiple instances | **possible** deadlock (necessary, not sufficient) |

For single-instance resources, collapse the RAG into a **wait-for graph** (P → P) and detect cycles with DFS in O(V + E).

## Four ways to handle deadlocks

| Strategy | Idea | Cost |
|---|---|---|
| **Prevention** | design the system so one Coffman condition can never hold | low utilisation, restrictive |
| **Avoidance** | grant a request only if the system stays in a *safe state* (Banker's) | needs advance knowledge of maximum needs |
| **Detection & recovery** | let deadlocks happen, detect them periodically, then recover | detection overhead + recovery losses |
| **Ignorance (ostrich)** | assume deadlocks are rare; reboot if they happen | used by most general-purpose OSes for many resources |

### Prevention — attack a condition

| Condition | How to break it | Drawback |
|---|---|---|
| Mutual exclusion | make resources shareable (read-only files, spooling) | impossible for many resources (locks, printers) |
| Hold and wait | request all resources at once, or release everything before requesting more | low utilisation, starvation |
| No preemption | if a request fails, release held resources (or preempt others) | only works for resources whose state can be saved (CPU, memory) |
| Circular wait | impose a **global ordering**; always request in increasing order | must know the order; the most practical technique |

> [!TIP]
> In real code (and interviews), the go-to prevention is **lock ordering**: every thread acquires locks in the same global order (e.g. by account id when transferring money).

```python
import threading

def transfer(a, b, amount):
    first, second = (a, b) if a.id < b.id else (b, a)   # global order → no circular wait
    with first.lock:
        with second.lock:
            a.balance -= amount
            b.balance += amount
```

### Avoidance — the Banker's algorithm

Each process declares its **maximum** need. A state is **safe** if there is some order (a *safe sequence*) in which every process can obtain its maximum and finish.

- Safe state → no deadlock.
- Unsafe state → deadlock **possible** (not certain).

Data structures (n processes, m resource types): `Available[m]`, `Max[n][m]`, `Allocation[n][m]`, `Need = Max − Allocation`.

**Worked example** (resources A, B, C; total = 10, 5, 7):

| Process | Allocation (A B C) | Max (A B C) | Need (A B C) |
|---|---|---|---|
| P0 | 0 1 0 | 7 5 3 | 7 4 3 |
| P1 | 2 0 0 | 3 2 2 | 1 2 2 |
| P2 | 3 0 2 | 9 0 2 | 6 0 0 |
| P3 | 2 1 1 | 2 2 2 | 0 1 1 |
| P4 | 0 0 2 | 4 3 3 | 4 3 1 |

Available = total − allocated = (10, 5, 7) − (7, 2, 5) = **(3, 3, 2)**.

```python
def is_safe(available, allocation, need):
    work, finished, order = available[:], [False] * len(need), []
    progress = True
    while progress:
        progress = False
        for i, (alloc, nd) in enumerate(zip(allocation, need)):
            if not finished[i] and all(n <= w for n, w in zip(nd, work)):
                work = [w + a for w, a in zip(work, alloc)]   # Pi finishes, releases resources
                finished[i] = True
                order.append(f"P{i}")
                progress = True
    return all(finished), order

allocation = [[0, 1, 0], [2, 0, 0], [3, 0, 2], [2, 1, 1], [0, 0, 2]]
maximum = [[7, 5, 3], [3, 2, 2], [9, 0, 2], [2, 2, 2], [4, 3, 3]]
need = [[m - a for m, a in zip(mx, al)] for mx, al in zip(maximum, allocation)]
print(is_safe([3, 3, 2], allocation, need))
```

```output
(True, ['P1', 'P3', 'P4', 'P0', 'P2'])
```

The system is safe; one safe sequence is ⟨P1, P3, P4, P0, P2⟩ (others exist, e.g. ⟨P1, P3, P4, P2, P0⟩).

**Resource request algorithm**: when Pi requests `Request`, check `Request ≤ Need[i]` and `Request ≤ Available`, *pretend* to allocate, run the safety check, and only grant if the resulting state is safe.

### Detection and recovery

- Detection: wait-for graph cycle detection (single instances) or a Banker's-like algorithm using current requests (multiple instances).
- Recovery options:
  - **Abort processes** — all deadlocked ones, or one at a time until the cycle breaks (choose victims by priority, progress, resources held).
  - **Preempt resources** — take resources from a victim and **roll it back** to a safe checkpoint; avoid starving the same victim repeatedly.

## Deadlock vs starvation vs livelock

| | Deadlock | Starvation | Livelock |
|---|---|---|---|
| Processes | blocked, waiting forever | one keeps waiting while others progress | active but making no progress |
| Cause | circular wait | unfair scheduling / priorities | overly polite retry logic |
| Fix | prevention / avoidance / recovery | aging, fair queues | randomised back-off |

> [!INTERVIEW]
> - Name and explain the four Coffman conditions.
> - Safe vs unsafe state: unsafe means deadlock is possible, not guaranteed.
> - Why don't general OSes use the Banker's algorithm? — Processes rarely know their maximum needs, and the check is costly.
> - Most practical prevention: lock ordering (break circular wait).

> [!REMEMBER]
> All four conditions needed. Prevent (break one), avoid (Banker's safe state), detect & recover (abort/preempt), or ignore. Single-instance RAG cycle = deadlock; multi-instance cycle = maybe.
