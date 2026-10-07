A **system call** is the controlled entry point through which a user program requests a service from the kernel — reading a file, creating a process, sending data over the network.

## How a system call works

```diagram Life of read(fd, buf, n)
 1. App calls the libc wrapper read()
 2. Wrapper puts the syscall number + arguments in registers
 3. Executes a trap instruction (e.g. syscall on x86-64) → switches to kernel mode
 4. Kernel looks up the handler in the system call table
 5. Handler validates arguments, performs the I/O (may block the process)
 6. Result placed in a register; CPU returns to user mode
 7. Wrapper returns the value (or -1 and sets errno)
```

- Arguments are passed in registers (or a memory block whose address is in a register).
- The kernel **validates** every pointer and size — user programs can't be trusted.
- System calls are **expensive** relative to function calls (mode switch, cache/TLB effects), which is why libraries buffer I/O.

## API vs system call

Programs rarely call system calls directly. They use an **API** (POSIX, Win32, the C library, Python's `os` module), which wraps one or more system calls.

```python
import os

fd = os.open("demo.txt", os.O_WRONLY | os.O_CREAT | os.O_TRUNC)   # open() syscall
os.write(fd, b"hello\n")                                         # write() syscall
os.close(fd)                                                     # close() syscall
print(os.getpid())                                               # getpid() syscall
```

## Categories

| Category | Purpose | UNIX examples | Windows examples |
|---|---|---|---|
| Process control | create, terminate, wait, load programs | `fork`, `exec`, `exit`, `wait`, `kill` | `CreateProcess`, `ExitProcess`, `WaitForSingleObject` |
| File management | create, open, read, write, close | `open`, `read`, `write`, `close`, `lseek`, `unlink` | `CreateFile`, `ReadFile`, `WriteFile` |
| Device management | request/release devices, I/O control | `ioctl`, `read`, `write` | `DeviceIoControl` |
| Information maintenance | get/set time, system data, attributes | `getpid`, `alarm`, `sleep`, `stat` | `GetCurrentProcessId`, `GetSystemTime` |
| Communication | IPC and networking | `pipe`, `shmget`, `mmap`, `socket`, `send`, `recv` | `CreatePipe`, `MapViewOfFile` |
| Protection | permissions and access control | `chmod`, `chown`, `umask` | `SetFileSecurity` |

## fork, exec and wait

The UNIX way to start a program is **fork** (clone the current process) + **exec** (replace the clone's memory with a new program).

```python
import os, sys

pid = os.fork()                   # UNIX only: returns twice!
if pid == 0:
    # child process
    os.execvp("ls", ["ls", "-l"])  # replace the child with `ls`; never returns on success
    sys.exit(1)                    # only reached if exec failed
else:
    # parent process
    _, status = os.waitpid(pid, 0) # wait for the child to finish (reap it)
    print("child exited with", os.waitstatus_to_exitcode(status))
```

| Call | What it does |
|---|---|
| `fork()` | creates a child that is a copy of the parent; returns **0 in the child** and the **child's PID in the parent** (−1 on failure) |
| `exec*()` | replaces the current process image with a new program (same PID) |
| `wait()` / `waitpid()` | parent blocks until a child exits and collects its exit status |
| `exit()` | terminates the process, returns status to the parent |

> [!NOTE]
> Modern kernels implement `fork` with **copy-on-write**: parent and child share pages read-only until one writes, so forking is cheap even for large processes.

### Classic fork puzzle

```c
fork();
fork();
fork();
printf("hi\n");
```

Each `fork` doubles the number of processes → **2³ = 8** processes, so `"hi"` prints 8 times. In general, `n` sequential forks create `2ⁿ` processes (`2ⁿ − 1` children).

## Modes and performance

- A mode switch (user ↔ kernel) is **not** a context switch — the same process continues, just in kernel mode.
- Batching reduces syscalls: reading a file 1 byte at a time with `read()` is far slower than reading 64 KB blocks (buffered I/O does this for you).

> [!INTERVIEW]
> - *What is a system call?* — A request from user space to the kernel through a trap; the only legitimate way to perform privileged operations.
> - *What does fork return?* — 0 in the child, the child's PID in the parent, −1 on error.
> - *fork vs exec?* — fork duplicates the process; exec replaces the program inside the current process.
> - *How many processes do n forks create?* — 2ⁿ total.

> [!REMEMBER]
> System call = trap into kernel mode via a numbered table entry. Library APIs wrap syscalls. `fork` clones (copy-on-write), `exec` replaces, `wait` reaps, `exit` terminates.
