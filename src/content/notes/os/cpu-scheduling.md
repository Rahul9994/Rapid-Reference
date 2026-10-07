The CPU scheduler decides which **ready** process runs next. Scheduling algorithms trade off throughput, fairness and response time — and computing their waiting/turnaround times is a guaranteed interview and exam question.

## Key terms

| Term | Definition |
|---|---|
| Arrival time (AT) | when the process enters the ready queue |
| Burst time (BT) | CPU time it needs |
| Completion time (CT) | when it finishes |
| **Turnaround time (TAT)** | CT − AT (total time in the system) |
| **Waiting time (WT)** | TAT − BT (time spent in the ready queue) |
| **Response time (RT)** | first time it gets the CPU − AT |
| Throughput | processes completed per unit time |
| CPU utilisation | % of time the CPU is busy |

**Goals**: maximise utilisation and throughput; minimise turnaround, waiting and response time.

- **Preemptive**: the OS can take the CPU away (timer, higher-priority arrival).
- **Non-preemptive**: a process keeps the CPU until it finishes or blocks.
- The **dispatcher** performs the actual switch; its delay is the **dispatch latency**.

## FCFS — First Come, First Served

Non-preemptive; run in arrival order (a FIFO queue). Simple, but suffers from the **convoy effect**: short jobs stuck behind a long one.

**Example** (all arrive at 0): P1 = 24, P2 = 3, P3 = 3

```diagram Gantt chart — FCFS
 | P1                       | P2 | P3 |
 0                         24   27   30
```

| Process | BT | CT | TAT | WT |
|---|---|---|---|---|
| P1 | 24 | 24 | 24 | 0 |
| P2 | 3 | 27 | 27 | 24 |
| P3 | 3 | 30 | 30 | 27 |
| **Average** | | | **27** | **17** |

If the order were P2, P3, P1: waits are 0, 3, 6 → average **3**. Order matters enormously.

## SJF — Shortest Job First

Pick the process with the smallest burst. **Provably optimal average waiting time** among non-preemptive algorithms (for known bursts). Problem: burst times aren't known in advance (predicted by exponential averaging: `τₙ₊₁ = α·tₙ + (1 − α)·τₙ`), and long jobs can **starve**.

**Example**: P1 (AT 0, BT 7), P2 (AT 2, BT 4), P3 (AT 4, BT 1), P4 (AT 5, BT 4)

```diagram Gantt chart — SJF (non-preemptive)
 | P1          | P3 | P2      | P4      |
 0             7    8         12        16
```

| Process | AT | BT | CT | TAT | WT |
|---|---|---|---|---|---|
| P1 | 0 | 7 | 7 | 7 | 0 |
| P2 | 2 | 4 | 12 | 10 | 6 |
| P3 | 4 | 1 | 8 | 4 | 3 |
| P4 | 5 | 4 | 16 | 11 | 7 |
| **Average** | | | | **8** | **4** |

(At t = 7, P2 and P4 tie on burst 4; the earlier arrival, P2, goes first.)

## SRTF — Shortest Remaining Time First (preemptive SJF)

Whenever a process arrives, compare its burst with the **remaining** time of the running process and preempt if smaller.

Same processes:

```diagram Gantt chart — SRTF
 | P1  | P2 | P3 | P2   | P4      | P1             |
 0     2    4    5      7         11               16
```

- t = 2: P2 (4) < P1's remaining 5 → preempt.
- t = 4: P3 (1) < P2's remaining 2 → preempt.
- t = 5: P3 done; P2 (2) runs; P4 (4) arrives but 2 < 4.
- t = 7: P2 done; P4 (4) < P1's remaining 5.
- t = 11: P4 done; P1 finishes at 16.

| Process | CT | TAT | WT |
|---|---|---|---|
| P1 | 16 | 16 | 9 |
| P2 | 7 | 5 | 1 |
| P3 | 5 | 1 | 0 |
| P4 | 11 | 6 | 2 |
| **Average** | | **7** | **3** |

## Priority scheduling

Run the highest-priority process (often: smaller number = higher priority). Can be preemptive or not.

- **Starvation**: low-priority processes may never run.
- **Aging**: gradually increase the priority of waiting processes to prevent starvation.
- SJF is priority scheduling where priority = predicted burst.

## Round Robin (RR)

Preemptive FCFS with a **time quantum q**. Each process runs for at most q, then goes to the back of the ready queue. Great response time for time-sharing systems.

**Example** (all arrive at 0), q = 4: P1 = 24, P2 = 3, P3 = 3

```diagram Gantt chart — Round Robin, q = 4
 | P1 | P2 | P3 | P1 | P1 | P1 | P1 | P1 |
 0    4    7   10   14   18   22   26   30
```

| Process | CT | TAT | WT | RT |
|---|---|---|---|---|
| P1 | 30 | 30 | 6 | 0 |
| P2 | 7 | 7 | 4 | 4 |
| P3 | 10 | 10 | 7 | 7 |
| **Average** | | **15.67** | **5.67** | **3.67** |

- q very large → becomes FCFS. q very small → too many context switches.
- With n processes and quantum q, each waits at most (n − 1)·q before its next turn.

## Multilevel Queue (MLQ)

The ready queue is split into fixed classes (e.g. system, interactive, batch), each with its own algorithm (RR for interactive, FCFS for batch) and scheduling **between** queues by fixed priority or time slicing. Processes **don't move** between queues → starvation risk for lower queues.

## Multilevel Feedback Queue (MLFQ)

Like MLQ, but processes **move between queues** based on behaviour:

```diagram MLFQ example
 Q0: RR, q = 8   ── uses full quantum → demote ──►
 Q1: RR, q = 16  ── uses full quantum → demote ──►
 Q2: FCFS        (long CPU-bound jobs end up here)
 Periodic boost / aging moves old processes back up
```

- Short/interactive (I/O-bound) jobs stay in high-priority queues → fast response.
- CPU-bound jobs sink → don't hurt interactivity.
- Most general and most complex; used (in spirit) by real OS schedulers.

## Comparison

| Algorithm | Preemptive | Starvation | Pros | Cons |
|---|---|---|---|---|
| FCFS | No | No | simple, fair by order | convoy effect, poor average WT |
| SJF | No | Yes | optimal average WT | needs burst prediction |
| SRTF | Yes | Yes | optimal among preemptive | overhead, prediction |
| Priority | Either | Yes (fix: aging) | expresses importance | starvation |
| Round Robin | Yes | No | good response, fair | higher TAT, depends on q |
| MLQ | Either | Yes | separates classes | inflexible |
| MLFQ | Yes | Possible (fix: boosting) | adaptive | complex to tune |

Linux uses the **Completely Fair Scheduler (CFS)** for normal tasks (since 2.6.23; kernel 6.6 moved to **EEVDF**, a refinement of the same "fair share of CPU time" idea).

## Python: quick FCFS/SJF calculator

```python
def fcfs(procs):                      # procs: list of (name, arrival, burst)
    t, rows = 0, []
    for name, at, bt in sorted(procs, key=lambda p: p[1]):
        t = max(t, at) + bt
        rows.append((name, t, t - at, t - at - bt))     # CT, TAT, WT
    return rows

for row in fcfs([("P1", 0, 24), ("P2", 0, 3), ("P3", 0, 3)]):
    print(row)
```

```output
('P1', 24, 24, 0)
('P2', 27, 27, 24)
('P3', 30, 30, 27)
```

> [!INTERVIEW]
> - TAT = CT − AT; WT = TAT − BT; RT = first run − AT.
> - SJF minimises average waiting time; SRTF is its preemptive version.
> - Convoy effect (FCFS), starvation (SJF/Priority, fixed by aging), quantum trade-off (RR).
> - MLFQ favours interactive jobs by demoting CPU-hungry ones.

> [!REMEMBER]
> Draw the Gantt chart first, then compute CT → TAT → WT. FCFS is simple but convoy-prone; SJF/SRTF optimise waiting time but starve; RR is fair with good response; MLFQ adapts.
