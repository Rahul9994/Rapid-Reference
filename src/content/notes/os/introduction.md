An **operating system (OS)** is the software layer that manages hardware resources and provides services to programs. It makes a shared, messy machine look like a clean, private one to every application.

## What an OS does

| Role | Meaning | Examples |
|---|---|---|
| **Resource manager** | allocates CPU time, memory, disk and devices fairly and efficiently | scheduler, memory manager |
| **Extended machine (abstraction)** | hides hardware details behind simple interfaces | files instead of disk sectors, processes instead of raw CPU |
| **Protection & security** | isolates programs and users from each other | memory protection, permissions |
| **Convenience** | provides services: I/O, networking, UI | system calls, shells, GUIs |

```diagram Layered view of a computer system
 ┌──────────────────────────────────────┐
 │  Users                               │
 ├──────────────────────────────────────┤
 │  Applications (browser, IDE, games)  │
 ├──────────────────────────────────────┤
 │  System programs / libraries (libc)  │
 ├──────────────────────────────────────┤
 │  Operating system kernel             │ ← system call interface
 ├──────────────────────────────────────┤
 │  Hardware (CPU, memory, I/O devices) │
 └──────────────────────────────────────┘
```

## Kernel, shell and user space

- **Kernel**: the core of the OS that runs in privileged mode — scheduling, memory management, device drivers, file systems, IPC.
- **Shell**: a user program (bash, PowerShell) that interprets commands and asks the kernel to run programs.
- **User space**: where applications run with restricted privileges.

## Dual-mode operation (user mode vs kernel mode)

The CPU has a **mode bit**:

| | User mode | Kernel mode |
|---|---|---|
| Who runs | applications | OS kernel |
| Privileged instructions (I/O, change page tables, disable interrupts) | ❌ forbidden | ✅ allowed |
| Memory access | own address space only | all memory |
| How to switch in | — | system call, interrupt, exception (trap) |

```diagram Mode switch on a system call
 user program ── read() ──► trap (mode bit = 0, kernel) ──► kernel does I/O
       ▲                                                        │
       └────────────── return from trap (mode bit = 1) ◄────────┘
```

Why? A buggy or malicious program must not be able to crash the machine or read other programs' memory.

## Kernel architectures

| Type | Idea | Pros | Cons | Examples |
|---|---|---|---|---|
| **Monolithic** | everything (FS, drivers, scheduler) in one kernel address space | fast — direct function calls | a driver bug can crash everything; large | Linux, traditional UNIX |
| **Microkernel** | minimal kernel (IPC, scheduling, basic memory); services run in user space | reliable, modular, secure | message-passing overhead | MINIX 3, QNX, seL4 |
| **Hybrid** | monolithic core with some microkernel ideas | balance of speed and modularity | complexity | Windows NT, macOS (XNU) |
| **Modular** | monolithic + loadable kernel modules | extend without reboot | modules still run in kernel mode | Linux (LKMs) |

## Types of operating systems

| Type | Key idea | Example use |
|---|---|---|
| Batch | jobs grouped and run without interaction | early mainframes, payroll |
| Multiprogramming | several programs in memory; CPU switches when one waits for I/O | improves CPU utilisation |
| Time-sharing (multitasking) | rapid switching gives each user the illusion of a dedicated machine | desktops, servers |
| Multiprocessing | multiple CPUs/cores share memory | modern PCs (SMP) |
| Distributed | multiple machines appear as one system | clusters, cloud |
| Real-time (RTOS) | guaranteed deadlines — **hard** (must never miss) or **soft** (occasional misses tolerable) | airbags, pacemakers (hard); video streaming (soft) |
| Embedded / mobile | constrained resources, power-aware | Android, IoT firmware |

> [!NOTE]
> **Multiprogramming** is about keeping the CPU busy (switch on I/O wait). **Multitasking/time-sharing** adds frequent timer-driven switching for responsiveness. **Multiprocessing** means more than one CPU. **Multithreading** means multiple threads inside one process.

## Booting (how the OS starts)

1. Power on → firmware (**BIOS/UEFI**) runs the power-on self-test (POST).
2. Firmware finds a boot device and loads the **bootloader** (e.g. GRUB, Windows Boot Manager).
3. Bootloader loads the **kernel** into memory and jumps to it.
4. Kernel initialises hardware, memory management, drivers, mounts the root file system.
5. Kernel starts the first user process (`init`/`systemd` on Linux), which starts services and the login screen.

## Interrupts and traps

- **Interrupt**: asynchronous signal from hardware (keyboard, timer, disk done).
- **Trap / exception**: synchronous event caused by the running instruction (system call, divide by zero, page fault).
- The CPU saves state, jumps to a handler via the **interrupt vector table**, then resumes.
- The **timer interrupt** is what lets the OS take the CPU back from a running program (preemption).

> [!INTERVIEW]
> - *What is an OS?* — A resource manager and abstraction layer between hardware and applications.
> - *Why dual mode?* — Protection: privileged instructions only in kernel mode; user code enters the kernel only through controlled entry points (system calls/traps).
> - *Monolithic vs microkernel?* — Speed vs isolation/reliability.
> - *Hard vs soft real-time?* — Missing a deadline is a failure vs a degradation.

> [!REMEMBER]
> OS = resource manager + abstraction + protection. Kernel runs in privileged mode; apps reach it through system calls. Timer interrupts enable preemptive multitasking. Linux is monolithic (with modules); microkernels push services to user space.
