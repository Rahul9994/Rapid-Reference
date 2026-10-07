When processes or threads share data, the final result can depend on the unpredictable order in which they run. **Synchronization** enforces an order so shared data stays consistent.

## Race condition

```python
# Two threads both run: counter += 1
# which is really three steps:
#   1. load counter into a register
#   2. add 1
#   3. store the register back
```

```diagram Lost update — both threads read 5
 Thread A: load (5) ─ add (6) ──────────────── store 6
 Thread B: ──────────── load (5) ─ add (6) ─────────── store 6
 Expected 7, got 6
```

A **race condition** occurs when the outcome depends on the timing of concurrent accesses to shared data, at least one of which is a write.

## The critical-section problem

The **critical section (CS)** is the code that accesses shared resources.

```python
while True:
    entry_section()       # ask for permission
    critical_section()    # touch shared data
    exit_section()        # release permission
    remainder_section()
```

A correct solution must satisfy:

| Requirement | Meaning |
|---|---|
| **Mutual exclusion** | at most one process in the CS at a time |
| **Progress** | if the CS is free, a process wanting it must be able to enter (no indefinite postponement by processes not interested) |
| **Bounded waiting** | there's a limit on how many times others can enter before a waiting process gets its turn (no starvation) |

## Software solution: Peterson's algorithm (two processes)

```python
flag = [False, False]   # flag[i]: process i wants to enter
turn = 0                # whose turn it is to yield

def enter(i):
    j = 1 - i
    flag[i] = True
    turn = j            # politely let the other go first
    while flag[j] and turn == j:
        pass            # busy wait
    # critical section

def leave(i):
    flag[i] = False
```

Satisfies all three requirements in theory. On modern CPUs it needs **memory barriers** because compilers/CPUs reorder loads and stores — real systems use hardware atomics instead.

## Hardware support

- **Test-and-set** and **compare-and-swap (CAS)**: atomic instructions that read and update a memory word in one indivisible step.
- **Disabling interrupts**: works on a single CPU, unsafe and impractical on multiprocessors.

```python
# Spinlock with an atomic test_and_set (pseudo-code)
def acquire(lock):
    while test_and_set(lock):   # returns old value and sets lock = True atomically
        pass                    # spin
def release(lock):
    lock = False
```

## Mutex locks

A **mutex** (mutual exclusion lock) has `acquire()` and `release()`; only the owner can release it.

- **Spinlock** — busy-waits; good when the wait is very short and on multiprocessors.
- **Blocking (sleeping) mutex** — puts the thread to sleep; better for longer waits.

## Semaphores

A **semaphore** S is an integer accessed only through two atomic operations (Dijkstra):

```python
def wait(S):        # also called P() / down()
    while S <= 0:
        ...         # block (in real implementations: sleep in S's queue)
    S -= 1

def signal(S):      # also called V() / up()
    S += 1          # wake one waiting process, if any
```

| | Binary semaphore | Counting semaphore |
|---|---|---|
| Values | 0 or 1 | 0 … N |
| Use | mutual exclusion (like a mutex) | limit access to N identical resources (connection pool, buffer slots) |

### Mutex vs semaphore

| | Mutex | Semaphore |
|---|---|---|
| Purpose | **locking** (mutual exclusion) | **signalling** and counting |
| Ownership | owner must release | any thread can signal |
| Value | locked / unlocked | integer |

## Classic synchronization problems

### 1. Producer–consumer (bounded buffer)

```python
import threading
from collections import deque

N = 5
buffer = deque()
mutex = threading.Semaphore(1)     # protects the buffer
empty = threading.Semaphore(N)     # free slots
full = threading.Semaphore(0)      # filled slots

def producer(items):
    for item in items:
        empty.acquire()            # wait for a free slot
        with mutex:
            buffer.append(item)
        full.release()             # one more filled slot

def consumer(count, out):
    for _ in range(count):
        full.acquire()             # wait for an item
        with mutex:
            out.append(buffer.popleft())
        empty.release()

out = []
p = threading.Thread(target=producer, args=(range(10),))
c = threading.Thread(target=consumer, args=(10, out))
p.start(); c.start(); p.join(); c.join()
print(out)   # [0, 1, 2, 3, 4, 5, 6, 7, 8, 9]
```

> [!WARNING]
> Order matters: acquiring `mutex` **before** `empty` in the producer can deadlock (the producer holds the mutex while waiting for space that only the consumer — now blocked on the mutex — can free).

In Python, `queue.Queue(maxsize=N)` implements this pattern for you.

### 2. Readers–writers

Many readers may read simultaneously; writers need exclusive access.

```python
import threading

rw_mutex = threading.Semaphore(1)   # exclusive access for writers
count_lock = threading.Lock()
read_count = 0

def reader():
    global read_count
    with count_lock:
        read_count += 1
        if read_count == 1:
            rw_mutex.acquire()      # first reader locks out writers
    # ... read shared data ...
    with count_lock:
        read_count -= 1
        if read_count == 0:
            rw_mutex.release()      # last reader lets writers in

def writer():
    with rw_mutex:
        pass                        # ... write shared data ...
```

This "readers-preference" version can **starve writers**; writer-preference or fair variants exist.

### 3. Dining philosophers

Five philosophers, five forks; each needs both neighbouring forks to eat. If everyone picks up their left fork first → **deadlock**.

Fixes:
- Allow at most 4 philosophers at the table (counting semaphore of 4).
- Asymmetric order: odd philosophers pick left first, even pick right first (breaks circular wait).
- Pick up both forks only if both are available (monitor solution).
- Global ordering: always pick up the lower-numbered fork first.

## Monitors and condition variables

A **monitor** is a high-level construct: shared data + procedures, where only one thread can be active inside at a time. **Condition variables** let threads wait inside the monitor until a condition holds.

```python
import threading

class BoundedBuffer:
    def __init__(self, capacity):
        self.items, self.capacity = [], capacity
        self.cond = threading.Condition()

    def put(self, x):
        with self.cond:
            while len(self.items) == self.capacity:   # always re-check in a loop
                self.cond.wait()
            self.items.append(x)
            self.cond.notify_all()

    def get(self):
        with self.cond:
            while not self.items:
                self.cond.wait()
            x = self.items.pop(0)
            self.cond.notify_all()
            return x
```

> [!NOTE]
> Always wait inside a `while` loop, not an `if` — threads can wake up spuriously or find the condition false again by the time they re-acquire the lock.

## Liveness problems

| Problem | Description |
|---|---|
| Deadlock | processes wait forever for each other's resources |
| Starvation | a process waits indefinitely while others proceed |
| Livelock | processes keep changing state in response to each other but make no progress |
| Priority inversion | a high-priority task waits for a lock held by a low-priority task that's preempted by a medium-priority one — fixed by **priority inheritance** (famous Mars Pathfinder bug) |

> [!INTERVIEW]
> - *Race condition?* — Outcome depends on interleaving of concurrent accesses to shared data.
> - *Three CS requirements?* — Mutual exclusion, progress, bounded waiting.
> - *Mutex vs semaphore?* — Locking with ownership vs counting/signalling without ownership.
> - *Producer–consumer with semaphores?* — `empty = N`, `full = 0`, `mutex = 1`; wait on `empty`/`full` before the mutex.

> [!REMEMBER]
> Protect critical sections with locks; use counting semaphores for N resources and signalling; prefer high-level tools (`Lock`, `Condition`, `queue.Queue`). Watch for deadlock, starvation and priority inversion.
