A **thread** is the smallest unit of CPU scheduling — a single sequence of execution inside a process. Threads of the same process share its memory and resources, making them lighter than processes but harder to get right.

## What threads share and don't share

```diagram One process, three threads
 ┌──────────────────── Process ────────────────────┐
 │ Shared: code, data (globals), heap, open files,  │
 │         signal handlers, working directory       │
 │ ┌──────────┐   ┌──────────┐   ┌──────────┐       │
 │ │ Thread 1 │   │ Thread 2 │   │ Thread 3 │       │
 │ │ stack    │   │ stack    │   │ stack    │       │
 │ │ registers│   │ registers│   │ registers│       │
 │ │ PC       │   │ PC       │   │ PC       │       │
 │ └──────────┘   └──────────┘   └──────────┘       │
 └──────────────────────────────────────────────────┘
```

| Private per thread | Shared by all threads of a process |
|---|---|
| thread ID, program counter, registers, **stack**, thread-local storage | code, global data, **heap**, open files, address space |

## Process vs thread

| | Process | Thread |
|---|---|---|
| Memory | separate address space | shares the process's address space |
| Creation cost | high | low |
| Context switch | expensive (switch page tables, flush TLB) | cheaper (same address space) |
| Communication | IPC (pipes, sockets, shared memory) | direct via shared variables |
| Fault isolation | a crash stays in that process | a crash can take down all threads |
| Synchronization need | low | high — shared data races |

## Benefits of multithreading

1. **Responsiveness** — UI stays responsive while a worker thread does I/O.
2. **Resource sharing** — threads share memory naturally.
3. **Economy** — cheaper to create and switch than processes.
4. **Scalability** — threads can run in parallel on multiple cores.

**Concurrency** = making progress on multiple tasks over the same period (may interleave on one core). **Parallelism** = executing multiple tasks at the same instant (needs multiple cores).

## User-level vs kernel-level threads

| | User-level threads (ULT) | Kernel-level threads (KLT) |
|---|---|---|
| Managed by | a user-space library | the OS kernel |
| Kernel aware? | no — sees one process | yes |
| Switching | very fast (no syscall) | slower (kernel involvement) |
| Blocking syscall | blocks **all** threads of the process | blocks only that thread |
| Multi-core parallelism | ❌ (one kernel entity) | ✅ |

### Multithreading models

| Model | Mapping | Notes |
|---|---|---|
| Many-to-one | many ULTs → 1 KLT | no parallelism; one blocking call blocks all |
| One-to-one | 1 ULT → 1 KLT | true parallelism; thread creation costs a kernel thread (Linux, Windows) |
| Many-to-many | M ULTs → N KLTs | flexible; complex to implement |
| Two-level | many-to-many + optional binding | variant |

## Thread lifecycle

New → Runnable/Ready → Running → Blocked/Waiting → Terminated (mirrors process states).

## Python threads and the GIL

CPython has a **Global Interpreter Lock (GIL)**: only one thread executes Python bytecode at a time per interpreter.

| Workload | Best Python tool | Why |
|---|---|---|
| I/O-bound (network, disk) | `threading`, `asyncio` | the GIL is released while waiting on I/O |
| CPU-bound (pure Python loops) | `multiprocessing`, `concurrent.futures.ProcessPoolExecutor` | separate processes → separate GILs → real parallelism |
| CPU-bound in C extensions (NumPy) | threads may work | many C extensions release the GIL |

```python
import threading
from concurrent.futures import ThreadPoolExecutor

counter = 0
lock = threading.Lock()

def increment(times):
    global counter
    for _ in range(times):
        with lock:              # without the lock, `counter += 1` can lose updates
            counter += 1

threads = [threading.Thread(target=increment, args=(100_000,)) for _ in range(4)]
for t in threads:
    t.start()
for t in threads:
    t.join()
print(counter)                  # 400000

with ThreadPoolExecutor(max_workers=4) as pool:      # thread pool for I/O tasks
    print(list(pool.map(lambda x: x * 2, range(5))))  # [0, 2, 4, 6, 8]
```

> [!NOTE]
> Free-threaded CPython builds (PEP 703, experimental from Python 3.13) can run without the GIL — but the standard build still has it, and interviewers expect you to know the GIL's implications.

## Thread pools

Creating a thread per task is wasteful. A **thread pool** keeps a fixed set of worker threads that pull tasks from a queue — bounded resource usage and lower latency. Web servers and `ThreadPoolExecutor` use this pattern.

## Common threading problems

- **Race conditions** — unsynchronised access to shared data.
- **Deadlocks** — threads waiting on each other's locks.
- **Starvation** — a thread never gets the resource/CPU.
- **Thread-safety** — prefer immutable data, thread-local storage, queues (`queue.Queue`) and locks.

> [!INTERVIEW]
> - *Process vs thread?* — Separate vs shared address space; threads are lighter but need synchronization.
> - *What do threads share?* — Code, data, heap, files; each has its own stack, registers and PC.
> - *What is the GIL?* — A CPython mutex allowing one thread to run Python bytecode at a time; use processes for CPU-bound parallelism.
> - *Concurrency vs parallelism?* — Interleaving vs truly simultaneous execution.

> [!REMEMBER]
> Threads share memory, not stacks. Kernel threads give parallelism; user threads are fast but block together. In CPython: threads for I/O, processes for CPU.
