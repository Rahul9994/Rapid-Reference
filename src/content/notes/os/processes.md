A **process** is a program in execution: code plus everything needed to run it — current activity (program counter, registers), memory (stack, heap, data) and OS resources (open files, sockets).

## Program vs process

| Program | Process |
|---|---|
| passive — a file on disk | active — loaded in memory and executing |
| one copy | many processes can run the same program |
| no state | has state, PCB, resources |

## Process memory layout

```diagram Address space of a process (low → high addresses)
 high ┌──────────────────────┐
      │ Stack                │ ← function frames, local vars (grows down)
      │          ↓           │
      │                      │
      │          ↑           │
      │ Heap                 │ ← dynamic memory: malloc / Python objects (grows up)
      ├──────────────────────┤
      │ Data (globals)       │ ← initialised + uninitialised (BSS) static data
      ├──────────────────────┤
      │ Text (code)          │ ← machine instructions, read-only
 low  └──────────────────────┘
```

## Process Control Block (PCB)

The kernel tracks each process with a **PCB** (task_struct in Linux):

| Field | Purpose |
|---|---|
| PID, parent PID | identity and hierarchy |
| Process state | new, ready, running, waiting, terminated |
| Program counter, CPU registers | to resume exactly where it stopped |
| Scheduling info | priority, queue pointers, CPU time used |
| Memory-management info | page tables / base & limit registers |
| Accounting info | CPU usage, time limits |
| I/O status | open files, allocated devices |

## Process states

```diagram Five-state process model
             admitted              scheduler dispatch
   [New] ───────────► [Ready] ──────────────────────► [Running] ──exit──► [Terminated]
                         ▲  ▲          interrupt / time slice    │
                         │  └────────────────────────────────────┤
                         │                                       │ I/O or event wait
                         │       I/O or event completes          ▼
                         └─────────────────────────────────── [Waiting]
```

| State | Meaning |
|---|---|
| New | being created |
| Ready | waiting for the CPU |
| Running | instructions executing on a CPU |
| Waiting (blocked) | waiting for I/O or an event |
| Terminated | finished; resources being reclaimed |

Some textbooks add **suspended ready / suspended blocked** states for processes swapped out to disk.

## Scheduling queues and schedulers

- **Job queue** → all processes; **ready queue** → in memory, ready to run; **device queues** → waiting for a device.

| Scheduler | Decides | Frequency |
|---|---|---|
| Long-term (job scheduler) | which jobs enter memory → controls the **degree of multiprogramming** | rare |
| Short-term (CPU scheduler) | which ready process runs next | very frequent (ms) |
| Medium-term | swap processes out/in to reduce memory pressure | occasional |

A good long-term mix balances **I/O-bound** processes (short CPU bursts, lots of waiting) and **CPU-bound** processes (long CPU bursts).

## Process creation and termination

- A parent creates children (`fork` / `CreateProcess`) → a **process tree** (Linux root: `systemd`/`init`, PID 1).
- Parent and child may run concurrently, or the parent may `wait()`.
- On termination, the process returns an exit status; the OS frees its resources.

### Zombie and orphan processes

| | Zombie | Orphan |
|---|---|---|
| What | child has **exited**, but the parent hasn't called `wait()` yet | **parent exited** while the child is still running |
| Still has | a PCB entry (PID + exit status) | everything — it's still running |
| Resolution | parent calls `wait()`; if the parent dies, init adopts and reaps it | adopted by `init`/`systemd` (PID 1), which reaps it later |
| Danger | many zombies exhaust PIDs | usually harmless (daemons are intentional orphans) |

## Cooperating processes

Processes are **independent** (no shared data) or **cooperating** (share data). Cooperation needs **IPC** — shared memory or message passing (see *Inter-Process Communication*).

## Python view

```python
import os
import multiprocessing as mp

def work(n):
    return os.getpid(), n * n

if __name__ == "__main__":                 # required on Windows/macOS (spawn start method)
    print("parent pid:", os.getpid())
    with mp.Pool(processes=2) as pool:      # separate processes → true parallelism, no GIL sharing
        print(pool.map(work, [1, 2, 3]))
```

> [!INTERVIEW]
> - *Process vs program?* — Active instance vs passive code.
> - *What is a PCB?* — Kernel data structure storing everything needed to manage and resume a process.
> - *Zombie vs orphan?* — Dead child not yet reaped vs living child whose parent died.
> - *Process states?* — New, ready, running, waiting, terminated (+ suspended variants).

> [!REMEMBER]
> Process = program + execution context. PCB holds its state. Ready ↔ running via scheduling, running → waiting on I/O. Zombies need `wait()`; orphans get adopted by PID 1.
