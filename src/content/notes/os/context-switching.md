A **context switch** is the act of saving the state of the currently running process (or thread) and restoring the state of another so the CPU can run it. It's what makes multitasking possible — and it's pure overhead.

## What gets saved and restored

The **context** lives in the PCB (or thread control block):

- Program counter and CPU registers (general-purpose, stack pointer, flags)
- Process state and scheduling information
- Memory-management information (page-table base register, e.g. CR3 on x86)
- Open file / I/O status (by reference)

```diagram Context switch from P0 to P1
 P0 running ──► interrupt / system call
                 save P0 state into PCB0
                 [scheduler picks P1]
                 load P1 state from PCB1
 P1 running ──► ... later, interrupt
                 save P1 state into PCB1
                 load P0 state from PCB0
 P0 resumes exactly where it left off
```

## When does a context switch happen?

| Trigger | Type |
|---|---|
| Time slice (quantum) expires — timer interrupt | involuntary / preemptive |
| A higher-priority process becomes ready | involuntary / preemptive |
| Process blocks on I/O, a lock or `sleep()` | voluntary |
| Process terminates | voluntary |
| Process yields the CPU (`sched_yield`) | voluntary |

## Why it's expensive

1. **Direct cost** — saving/restoring registers and running the scheduler (typically microseconds).
2. **Address-space switch** (process → process) — change page tables; the **TLB** may be flushed (unless tagged with ASIDs/PCIDs).
3. **Indirect cost** — CPU caches and branch predictors are now "cold" for the new process, causing misses for a while.

| Switch type | Cost | Why |
|---|---|---|
| Thread → thread (same process) | lower | same address space, no page-table change |
| Process → process | higher | page tables change, TLB/cache effects |
| User-level thread switch | lowest | no kernel involvement at all |

## Mode switch ≠ context switch

| Mode switch | Context switch |
|---|---|
| user mode → kernel mode (and back) for the **same** process | CPU moves from one process/thread to **another** |
| happens on every system call/interrupt | happens only when the scheduler picks a different task |
| cheaper | more expensive (includes at least one mode switch) |

## Trade-off with time quantum

In Round Robin scheduling, a **small quantum** gives better responsiveness but more context switches (more overhead); a **large quantum** reduces overhead but behaves like FCFS. A rule of thumb: most CPU bursts (~80%) should finish within one quantum, and the quantum should be much larger than the switch cost.

## Reducing context-switch overhead

- Use threads instead of processes for tightly cooperating tasks.
- Use asynchronous I/O / event loops (`asyncio`) to serve many connections with few threads.
- Thread pools — avoid creating threads per request.
- CPU affinity — keep a thread on the same core to keep caches warm.

> [!INTERVIEW]
> - *What is saved in a context switch?* — PC, registers, stack pointer, process state, memory-management info — in the PCB.
> - *Why is it overhead?* — No useful work is done during the switch; plus cache/TLB pollution afterwards.
> - *Thread vs process switch?* — Thread switches within a process avoid changing the address space, so they're cheaper.

> [!REMEMBER]
> Context switch = save PCB of old, load PCB of new. Triggered by timer interrupts, blocking, preemption or exit. Costs: direct save/restore + cold caches/TLB. Mode switch is not a context switch.
