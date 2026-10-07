Processes have separate address spaces, so they can't simply read each other's variables. **Inter-Process Communication (IPC)** mechanisms let cooperating processes exchange data and coordinate.

## Why processes cooperate

- **Information sharing** — several processes need the same data.
- **Computation speed-up** — split work across processes/cores.
- **Modularity** — build systems from separate services.
- **Convenience** — a user runs an editor, compiler and printer at once.

## The two fundamental models

```diagram Shared memory vs message passing
 Shared memory                         Message passing
 ┌─────────┐   ┌─────────┐             ┌─────────┐          ┌─────────┐
 │   P1    │   │   P2    │             │   P1    │          │   P2    │
 └────┬────┘   └────┬────┘             └────┬────┘          └────▲────┘
      │  read/write │                       │ send(m)            │ receive(m)
      ▼             ▼                       ▼                    │
 ┌──────────────────────────┐          ┌──────────────────────────┐
 │   shared memory region   │          │   kernel (message queue) │
 └──────────────────────────┘          └──────────────────────────┘
```

| | Shared memory | Message passing |
|---|---|---|
| Speed | fastest — no kernel involvement after setup | slower — system call per message |
| Synchronization | programmer's job (semaphores, mutexes) | built into send/receive |
| Best for | large data, same machine | small messages, distributed systems |
| Risk | race conditions | fewer, but overhead |

## IPC mechanisms

| Mechanism | Direction | Related processes only? | Notes |
|---|---|---|---|
| **Anonymous pipe** | one-way byte stream | yes (parent–child) | `ls \| grep py` in a shell |
| **Named pipe (FIFO)** | one-way (or two FIFOs) | no | appears as a file in the file system |
| **Message queue** | message-oriented | no | kernel-managed queue of typed messages |
| **Shared memory** | any | no | fastest; needs separate synchronization |
| **Semaphores** | synchronization only | no | coordinate access, no data transfer |
| **Signals** | notification | no | async events: `SIGINT`, `SIGKILL`, `SIGTERM` |
| **Sockets** | bidirectional | no | works across machines (TCP/UDP) or locally (UNIX domain) |
| **Memory-mapped files** | any | no | map a file into several address spaces |
| **RPC** | request/response | no | call a function in another process/machine |

## Message passing details

- **Direct** communication: `send(P, msg)`, `receive(Q, msg)` — processes name each other.
- **Indirect** communication: via **mailboxes/ports** shared by processes.
- **Blocking (synchronous)** vs **non-blocking (asynchronous)** send and receive.
- **Buffering**: zero capacity (rendezvous), bounded, or unbounded queue.

## Pipes in Python

```python
import multiprocessing as mp

def child(conn):
    msg = conn.recv()               # blocks until the parent sends
    conn.send(msg.upper())
    conn.close()

if __name__ == "__main__":
    parent_conn, child_conn = mp.Pipe()     # duplex pipe between two processes
    p = mp.Process(target=child, args=(child_conn,))
    p.start()
    parent_conn.send("hello from parent")
    print(parent_conn.recv())               # HELLO FROM PARENT
    p.join()
```

## Message queues in Python

```python
import multiprocessing as mp

def worker(q_in, q_out):
    for n in iter(q_in.get, None):          # stop at the sentinel None
        q_out.put(n * n)

if __name__ == "__main__":
    q_in, q_out = mp.Queue(), mp.Queue()
    p = mp.Process(target=worker, args=(q_in, q_out))
    p.start()
    for n in range(5):
        q_in.put(n)
    q_in.put(None)
    print([q_out.get() for _ in range(5)])  # [0, 1, 4, 9, 16]
    p.join()
```

## Shared memory in Python

```python
from multiprocessing import Process, Value, Array, Lock

def add(counter, lock):
    for _ in range(10_000):
        with lock:                     # shared memory still needs synchronization
            counter.value += 1

if __name__ == "__main__":
    counter, lock = Value("i", 0), Lock()
    procs = [Process(target=add, args=(counter, lock)) for _ in range(4)]
    for p in procs: p.start()
    for p in procs: p.join()
    print(counter.value)              # 40000
```

`multiprocessing.shared_memory.SharedMemory` (3.8+) shares raw buffers (e.g. NumPy arrays) between processes without copying.

## Signals

```python
import signal, time

def handler(signum, frame):
    print("caught", signal.Signals(signum).name)

signal.signal(signal.SIGINT, handler)   # Ctrl+C now calls handler instead of raising KeyboardInterrupt
```

- `SIGKILL` and `SIGSTOP` can't be caught or ignored.
- `SIGTERM` asks politely; `SIGKILL` forces termination.

## Sockets

The most general IPC: processes on the same or different machines communicate through endpoints identified by (IP address, port). See **Computer Networks › Sockets** for full TCP/UDP examples.

> [!INTERVIEW]
> - *Two IPC models?* — Shared memory (fast, manual sync) and message passing (simpler, kernel-mediated).
> - *Pipe vs FIFO?* — Anonymous pipes need a common ancestor; named pipes have a file-system name.
> - *Fastest IPC?* — Shared memory (after setup there are no system calls per access).
> - *Signals?* — Asynchronous notifications; SIGKILL/SIGSTOP can't be handled.

> [!REMEMBER]
> Shared memory = fast but synchronise yourself; message passing = easier and works across machines. Pipes for parent–child streams, queues for messages, sockets for networks, signals for events.
