A high-yield revision sheet for Operating Systems interviews. Each line links a question to the one-sentence answer interviewers expect — dig into the detailed topic pages for depth.

## Fundamentals

| Question | Crisp answer |
|---|---|
| What is an OS? | Software that manages hardware resources and provides services/abstractions to programs. |
| Kernel vs OS? | The kernel is the privileged core (scheduling, memory, drivers); the OS also includes shells, libraries and utilities. |
| User vs kernel mode? | A CPU mode bit restricts privileged instructions to the kernel; user code enters via system calls/interrupts. |
| Monolithic vs microkernel? | All services in kernel space (fast) vs minimal kernel with user-space services (isolated, more IPC). |
| What is a system call? | A trap into the kernel to request a privileged service (open, read, fork…). |
| Interrupt vs trap? | Interrupt = asynchronous hardware event; trap = synchronous, caused by the running instruction (syscall, fault). |
| What happens at boot? | Firmware (BIOS/UEFI) → bootloader → kernel init → first process (init/systemd). |

## Processes and threads

| Question | Crisp answer |
|---|---|
| Process vs program? | Running instance (with state) vs passive code on disk. |
| Process vs thread? | Separate address spaces vs threads sharing one address space (own stack/registers). |
| What's in a PCB? | PID, state, PC, registers, scheduling info, memory maps, open files. |
| Process states? | New, ready, running, waiting, terminated. |
| Context switch? | Saving one task's state and loading another's — pure overhead, includes cache/TLB costs. |
| Zombie vs orphan? | Finished but not reaped by the parent vs still running after the parent died (adopted by PID 1). |
| fork() returns? | 0 in the child, child's PID in the parent, −1 on failure; n forks → 2ⁿ processes. |
| User vs kernel threads? | Library-managed (fast, block together) vs kernel-managed (parallel, slower to switch). |
| Concurrency vs parallelism? | Interleaved progress vs simultaneous execution on multiple cores. |
| Python GIL? | One thread runs Python bytecode at a time; use processes for CPU-bound parallelism. |

## Scheduling

| Question | Crisp answer |
|---|---|
| Preemptive vs non-preemptive? | OS can take the CPU away vs process keeps it until it blocks/ends. |
| Which algorithm minimises average waiting time? | SJF (SRTF if preemptive). |
| Convoy effect? | Short jobs stuck behind a long one in FCFS. |
| Starvation & fix? | Low-priority jobs never run; fix with aging. |
| Round-robin quantum trade-off? | Small = responsive but many switches; large = degenerates to FCFS. |
| MLFQ? | Multiple queues; jobs move down when they use full quanta, favouring interactive jobs. |
| Formulas | TAT = CT − AT, WT = TAT − BT, RT = first run − AT. |

## Synchronization and deadlock

| Question | Crisp answer |
|---|---|
| Race condition? | Result depends on the interleaving of concurrent accesses to shared data. |
| Critical-section requirements? | Mutual exclusion, progress, bounded waiting. |
| Mutex vs semaphore? | Lock with ownership vs counter for signalling/limiting N resources. |
| Spinlock? | Busy-waiting lock; good only for very short waits on multiprocessors. |
| Monitor? | Language construct: shared data + procedures with implicit mutual exclusion and condition variables. |
| Deadlock conditions? | Mutual exclusion, hold and wait, no preemption, circular wait — all four needed. |
| Prevention vs avoidance? | Make a condition impossible vs only grant requests that keep the system safe (Banker's). |
| Safe state? | There exists an order in which all processes can finish. Unsafe ≠ deadlocked. |
| Practical deadlock prevention? | Global lock ordering. |
| Livelock? | Processes keep reacting to each other without progress. |
| Priority inversion & fix? | High-priority task blocked by a low-priority lock holder; priority inheritance. |

## Memory

| Question | Crisp answer |
|---|---|
| Logical vs physical address? | CPU-generated vs real RAM address; MMU translates. |
| Internal vs external fragmentation? | Waste inside allocated blocks vs scattered free holes. |
| Paging vs segmentation? | Fixed-size pages (internal frag.) vs variable logical segments (external frag.). |
| TLB? | Cache of page-table translations; EAT = h(t + m) + (1 − h)(t + 2m). |
| Virtual memory? | Each process gets a large private address space backed by RAM + disk. |
| Page fault? | Access to a page not in RAM → trap → load from disk → restart instruction. |
| Demand paging? | Load pages only when first accessed. |
| Thrashing? | More time paging than executing; fix with working sets/PFF or fewer processes. |
| Belady's anomaly? | FIFO can fault more with more frames; LRU/OPT can't. |
| Best replacement policy? | Optimal (theoretical); LRU approximations (Clock) in practice. |
| Copy-on-write? | Share pages after fork; copy only when written. |

## Storage and I/O

| Question | Crisp answer |
|---|---|
| Inode? | File metadata + block pointers (not the name). |
| Hard vs soft link? | Another name for the same inode vs a file containing a path. |
| Allocation methods? | Contiguous (fast, fragmented), linked (flexible, sequential), indexed (direct, overhead). |
| Journaling? | Log changes before applying them for fast crash recovery. |
| Polling vs interrupt vs DMA? | Busy-wait vs event notification vs device-to-memory bulk transfer. |
| Disk scheduling that starves? | SSTF. |
| SCAN vs C-SCAN? | Elevator back and forth vs one direction with a jump back (uniform waits). |
| Spooling? | Buffering jobs for an exclusive device such as a printer. |

## Classic scenario questions

> [!INTERVIEW]
> **"What happens when you run a program?"**
> The shell calls `fork()` to create a child, the child calls `exec()` to load the program; the loader maps the executable's code/data, sets up the stack and heap, links shared libraries; the process becomes ready, the scheduler dispatches it, and pages are loaded on demand via page faults.

> [!INTERVIEW]
> **"Why is my multithreaded Python program not faster?"**
> If it's CPU-bound, the GIL lets only one thread execute bytecode at a time — use `multiprocessing` or native extensions. If it's I/O-bound, threads or `asyncio` do help.

> [!INTERVIEW]
> **"How would you design a thread-safe bounded queue?"**
> A circular buffer protected by a mutex, plus two condition variables (`not_full`, `not_empty`) — or semaphores `empty = N`, `full = 0`, `mutex = 1`. In Python: `queue.Queue(maxsize=N)`.

> [!REMEMBER]
> If you can explain processes vs threads, scheduling formulas, the four deadlock conditions, paging + TLB + page faults, thrashing, and the producer–consumer solution clearly, you've covered the majority of OS interview questions.
