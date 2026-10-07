## What is an operating system?

Software that manages hardware resources (CPU, memory, storage, devices) and provides services and abstractions (processes, files, sockets) to applications. It acts as a **resource manager**, an **extended machine** that hides hardware complexity, and a **protection** layer between programs and users.

## What is the difference between a process and a thread?

A **process** is an independent program in execution with its own address space and resources. A **thread** is a unit of execution inside a process; threads of the same process share code, data, heap and open files, but each has its own stack, registers and program counter. Threads are cheaper to create and switch, but a bug in one thread can corrupt shared state for all of them.

## What is a context switch?

Saving the state (registers, program counter, memory-management info) of the running process/thread into its PCB and loading another's so it can run. It's pure overhead, and it also pollutes caches and the TLB. Triggered by timer interrupts, blocking I/O, higher-priority arrivals or termination.

## What is a PCB?

The **Process Control Block** — the kernel's record of a process: PID, state, program counter, CPU registers, scheduling information, memory-management information (page tables), accounting data and I/O status (open files).

## What are the states of a process?

**New → Ready → Running → Terminated**, with **Running → Waiting** on I/O or events and **Waiting → Ready** when the event completes; **Running → Ready** on preemption. Some models add suspended states for swapped-out processes.

## What are zombie and orphan processes?

A **zombie** has finished executing but still has an entry in the process table because its parent hasn't called `wait()` to collect its exit status. An **orphan** is a still-running process whose parent has exited; it gets adopted by `init`/`systemd` (PID 1), which reaps it when it finishes.

## Compare common CPU scheduling algorithms.

- **FCFS**: simple, non-preemptive; suffers the convoy effect.
- **SJF / SRTF**: minimum average waiting time; needs burst prediction; can starve long jobs.
- **Priority**: runs the most important first; starvation fixed by aging.
- **Round Robin**: time slices; good response time; performance depends on quantum size.
- **MLFQ**: multiple queues with feedback; favours interactive jobs, adapts to behaviour.

## What is a deadlock? What are the necessary conditions?

A state where a set of processes each wait for a resource held by another in the set, so none can proceed. All four **Coffman conditions** must hold: **mutual exclusion**, **hold and wait**, **no preemption** and **circular wait**. Breaking any one prevents deadlock (e.g. global lock ordering breaks circular wait).

## Deadlock prevention vs avoidance vs detection?

**Prevention** designs the system so one Coffman condition can never hold. **Avoidance** grants requests only if the system stays in a safe state (Banker's algorithm), requiring knowledge of maximum needs. **Detection & recovery** lets deadlocks happen, finds cycles in a wait-for graph, then aborts or preempts. Many general-purpose OSes simply ignore the problem for most resources (ostrich algorithm).

## What is a race condition and how do you prevent it?

When the outcome depends on the timing of concurrent accesses to shared data (at least one write). Prevent it by making the critical section mutually exclusive — mutexes, semaphores, monitors, atomic operations — or by avoiding shared mutable state (message passing, immutability).

## Mutex vs semaphore?

A **mutex** is a lock with **ownership**: only the thread that acquired it may release it; used for mutual exclusion. A **semaphore** is an integer counter with atomic `wait`/`signal`, no ownership; a **counting semaphore** limits access to N resources and is used for signalling (e.g. producer–consumer), while a binary semaphore behaves like a lock.

## What is virtual memory?

An abstraction that gives each process a large, private, contiguous address space, backed by physical RAM plus disk. Pages are loaded on demand; the MMU translates virtual to physical addresses through page tables. Benefits: programs larger than RAM, isolation, more multiprogramming, sharing and copy-on-write.

## What is paging? What is a page fault?

**Paging** divides virtual memory into fixed-size pages and physical memory into frames, mapping any page to any frame — eliminating external fragmentation. A **page fault** occurs when a process accesses a page not currently in RAM: the OS traps, finds a free frame (or evicts a victim), loads the page from disk, updates the page table and restarts the instruction.

## What is thrashing?

When processes spend more time paging than executing because they don't have enough frames for their working sets — CPU utilisation collapses. Fixes: working-set model, page-fault-frequency control, reducing the degree of multiprogramming, or adding memory.

## What is the TLB?

The **Translation Lookaside Buffer** is a small, fast cache of recent page-number → frame-number translations. A TLB hit avoids reading the page table from memory. Effective access time = h·(t + m) + (1 − h)·(t + 2m) for a single-level table.

## Explain Belady's anomaly.

With **FIFO** page replacement, increasing the number of frames can **increase** page faults for some reference strings (e.g. 1 2 3 4 1 2 5 1 2 3 4 5: 9 faults with 3 frames, 10 with 4). Stack algorithms like LRU and Optimal never show this anomaly.

## Internal vs external fragmentation?

**Internal**: wasted space inside allocated blocks because blocks are larger than requested (fixed partitions, paging). **External**: enough total free memory exists but it's split into non-contiguous holes (variable partitions, segmentation). Paging removes external fragmentation; compaction can reduce it.

## What is a system call?

A controlled entry point for user programs to request kernel services (file I/O, process creation, networking). The program executes a trap instruction, the CPU switches to kernel mode, the kernel validates and performs the request, then returns to user mode. Examples: `open`, `read`, `write`, `fork`, `exec`, `wait`.
