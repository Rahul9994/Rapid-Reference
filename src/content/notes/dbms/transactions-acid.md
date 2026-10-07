A **transaction** is a sequence of operations that forms a single logical unit of work — like transferring money: debit one account, credit another. Either both happen or neither does.

## ACID properties

| Property | Guarantee | Ensured by |
|---|---|---|
| **Atomicity** | all operations succeed or none do ("all or nothing") | undo logs / rollback |
| **Consistency** | a transaction takes the database from one valid state to another (constraints hold) | constraints + correct application logic |
| **Isolation** | concurrent transactions don't see each other's intermediate states; result equals some serial order | concurrency control (locks, MVCC) |
| **Durability** | once committed, changes survive crashes | write-ahead log, flushing to stable storage |

```sql
BEGIN;                                                   -- START TRANSACTION in MySQL
UPDATE accounts SET balance = balance - 500 WHERE id = 'A';
UPDATE accounts SET balance = balance + 500 WHERE id = 'B';
-- if anything fails: ROLLBACK;
COMMIT;
```

```python
import sqlite3

con = sqlite3.connect(":memory:")
con.execute("CREATE TABLE accounts (id TEXT PRIMARY KEY, balance INT CHECK (balance >= 0))")
con.executemany("INSERT INTO accounts VALUES (?, ?)", [("A", 300), ("B", 100)])
con.commit()

def transfer(src, dst, amount):
    try:
        with con:                       # commits on success, rolls back on exception
            con.execute("UPDATE accounts SET balance = balance + ? WHERE id = ?", (amount, dst))
            con.execute("UPDATE accounts SET balance = balance - ? WHERE id = ?", (amount, src))
    except sqlite3.IntegrityError:
        print("transfer failed, rolled back")

transfer("A", "B", 500)                 # violates CHECK → atomic rollback (B's credit is undone)
print(con.execute("SELECT * FROM accounts").fetchall())
```

```output
transfer failed, rolled back
[('A', 300), ('B', 100)]
```

## Transaction states

```diagram Transaction state diagram
 [Active] ──last statement──► [Partially committed] ──write log to disk──► [Committed]
    │                                  │
    │ error                            │ failure
    ▼                                  ▼
 [Failed] ─────────rollback──────────► [Aborted]  → restart or kill
```

| State | Meaning |
|---|---|
| Active | executing operations |
| Partially committed | last operation done, not yet durable |
| Committed | changes durable |
| Failed | can't proceed normally |
| Aborted | rolled back; database restored to the state before the transaction |

## Schedules

A **schedule** is the interleaved order of operations (read R, write W, commit C) from concurrent transactions.

- **Serial schedule**: transactions run one after another — always correct, no concurrency.
- **Concurrent schedule**: operations interleave — better throughput, but must be **serializable**.

### Conflicting operations

Two operations **conflict** if they belong to different transactions, access the **same item**, and **at least one is a write**: R–W, W–R, W–W.

### Conflict serializability

A schedule is **conflict serializable** if it can be turned into a serial schedule by swapping adjacent non-conflicting operations.

**Test — precedence graph**: draw an edge Ti → Tj for each conflicting pair where Ti's operation comes first. The schedule is conflict serializable **iff the graph has no cycle**; a topological order gives an equivalent serial schedule.

```diagram Example: S = R1(A) W1(A) R2(A) W2(A) R1(B) W1(B) R2(B) W2(B)
 Conflicts on A: W1(A) before R2(A) → T1 → T2
 Conflicts on B: W1(B) before R2(B) → T1 → T2
 Graph: T1 → T2 (no cycle) → conflict serializable, equivalent to T1, T2
```

```python
from itertools import combinations

def is_conflict_serializable(schedule):
    """schedule: list of (txn, op, item), e.g. (1, 'R', 'A')."""
    edges = set()
    for (i, a), (j, b) in combinations(enumerate(schedule), 2):
        if a[0] != b[0] and a[2] == b[2] and "W" in (a[1], b[1]):
            edges.add((a[0], b[0]))          # earlier txn → later txn
    nodes = {t for t, _, _ in schedule}
    indeg = {n: 0 for n in nodes}
    for _, v in edges:
        indeg[v] += 1
    order, ready = [], [n for n in nodes if indeg[n] == 0]
    while ready:                              # Kahn's algorithm for cycle detection
        u = ready.pop()
        order.append(u)
        for x, y in edges:
            if x == u:
                indeg[y] -= 1
                if indeg[y] == 0:
                    ready.append(y)
    return len(order) == len(nodes), sorted(edges)

s1 = [(1, "R", "A"), (1, "W", "A"), (2, "R", "A"), (2, "W", "A")]
s2 = [(1, "R", "A"), (2, "W", "A"), (1, "W", "A")]          # T1 → T2 and T2 → T1
print(is_conflict_serializable(s1), is_conflict_serializable(s2))
```

```output
(True, [(1, 2)]) (False, [(1, 2), (2, 1)])
```

### View serializability

A weaker condition: same initial reads, same reads-from relationships, same final writes as some serial schedule. Every conflict-serializable schedule is view serializable, but not vice versa (blind writes). Testing view serializability is NP-complete, so DBMSs enforce conflict serializability.

## Recoverability

| Schedule | Rule | Problem it prevents |
|---|---|---|
| **Recoverable** | if Tj reads data written by Ti, Ti commits **before** Tj commits | committing based on data that might be rolled back |
| **Cascadeless** | transactions read only **committed** data | cascading rollbacks (one abort forces many) |
| **Strict** | no read **or write** of an item until the last transaction that wrote it commits/aborts | simplifies recovery (undo by restoring before-images) |

Strict ⊂ cascadeless ⊂ recoverable. Strict two-phase locking produces strict schedules.

> [!INTERVIEW]
> - Explain ACID with the bank-transfer example.
> - Conflicting operations: different transactions, same item, at least one write.
> - Test serializability with a precedence graph (cycle ⇒ not conflict serializable).
> - Recoverable vs cascadeless schedules.

> [!REMEMBER]
> ACID = all-or-nothing, valid states, isolation as if serial, survives crashes. Serializable = equivalent to some serial order; check with a precedence graph. Read only committed data to avoid cascading rollbacks.
