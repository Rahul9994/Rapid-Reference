**Concurrency control** lets many transactions run at the same time while preserving isolation — the result must look as if they ran one by one.

## Problems without concurrency control

| Problem | What happens | Example |
|---|---|---|
| **Lost update** (W–W) | two transactions read the same value and both write; one update is lost | two clerks set stock from 10 to 9 — two sales recorded, stock should be 8 |
| **Dirty read** (W–R uncommitted) | reading data written by a transaction that later aborts | T2 reads T1's uncommitted balance; T1 rolls back |
| **Non-repeatable read** (R–W) | reading the same row twice gives different values because another transaction updated it | price changes between two reads |
| **Phantom read** | re-running a range query returns new/missing rows inserted or deleted by others | `COUNT(*) WHERE dept = 10` changes mid-transaction |
| Incorrect summary | an aggregate reads some values before and some after another transaction's updates | total balance computed while transfers run |

## Isolation levels (SQL standard)

| Level | Dirty read | Non-repeatable read | Phantom read |
|---|---|---|---|
| **Read Uncommitted** | possible | possible | possible |
| **Read Committed** | ✗ prevented | possible | possible |
| **Repeatable Read** | ✗ | ✗ | possible (by the standard) |
| **Serializable** | ✗ | ✗ | ✗ |

```sql
SET TRANSACTION ISOLATION LEVEL REPEATABLE READ;
```

Defaults: **PostgreSQL, Oracle, SQL Server → Read Committed**; **MySQL InnoDB → Repeatable Read** (which, with next-key locks, also prevents most phantoms). Higher isolation = fewer anomalies, less concurrency.

> [!NOTE]
> Snapshot-based Repeatable Read can still allow **write skew** (two transactions each read overlapping data and write disjoint rows, breaking an invariant like "at least one doctor on call"). Only Serializable (e.g. PostgreSQL's SSI) prevents it.

## Lock-based protocols

### Lock modes

| Lock | Allows | Compatible with |
|---|---|---|
| **Shared (S)** — read lock | reading | other S locks |
| **Exclusive (X)** — write lock | reading and writing | nothing |

| Requested ↓ / Held → | S | X |
|---|---|---|
| S | ✅ grant | ❌ wait |
| X | ❌ wait | ❌ wait |

### Two-Phase Locking (2PL)

Each transaction has:
1. **Growing phase** — acquires locks, releases none.
2. **Shrinking phase** — releases locks, acquires none.

The point where it holds all its locks is the **lock point**. **2PL guarantees conflict serializability** (equivalent serial order = order of lock points).

```diagram Number of locks held under 2PL
 locks
   │        ┌──────┐   ← lock point
   │      ┌─┘      └─┐
   │    ┌─┘          └─┐
   │  ┌─┘   growing    └─┐  shrinking
   └──┴──────────────────┴──► time
```

| Variant | Rule | Gives |
|---|---|---|
| Basic 2PL | growing then shrinking | serializability (but cascading aborts and deadlocks possible) |
| **Strict 2PL** | hold all **X** locks until commit/abort | strict, cascadeless schedules (most common) |
| **Rigorous 2PL** | hold **all** locks until commit/abort | serialization order = commit order |
| Conservative 2PL | acquire all locks before starting | no deadlocks (but needs to know all items upfront) |

> [!WARNING]
> 2PL (except conservative) can **deadlock**: T1 locks A then waits for B; T2 locks B then waits for A.

### Lock granularity and intention locks

Locks can be taken at different granularities: database → table → page → row. **Multiple-granularity locking** uses **intention locks** (IS, IX, SIX) on ancestors so the DBMS can quickly tell whether a table-level lock conflicts with existing row locks. **Lock escalation** converts many row locks into one table lock to save memory.

## Deadlock handling in databases

| Technique | How |
|---|---|
| **Detection** | build a wait-for graph; on a cycle, abort a victim (most DBMSs do this) |
| **Timeouts** | abort transactions waiting too long |
| **Wait-Die** (non-preemptive) | older txn waits for younger; **younger requesting from older dies** (restarts with the same timestamp) |
| **Wound-Wait** (preemptive) | older txn **wounds** (aborts) the younger holder; younger waits for older |

Using the original timestamp on restart guarantees no starvation in both schemes.

## Timestamp ordering (TO) protocol

Each transaction gets a timestamp TS(T) at start. Each item Q keeps **W-TS(Q)** and **R-TS(Q)** (largest timestamps that wrote/read it).

| Operation by T | Rule |
|---|---|
| read(Q) | if TS(T) < W-TS(Q) → **abort** T (would read a value overwritten by a younger txn); else read and set R-TS(Q) = max(R-TS(Q), TS(T)) |
| write(Q) | if TS(T) < R-TS(Q) or TS(T) < W-TS(Q) → **abort** T; else write and set W-TS(Q) = TS(T) |

- Guarantees conflict serializability in **timestamp order**; deadlock-free (no waiting).
- Can cause starvation of long transactions and cascading rollbacks (fixed by strict TO).
- **Thomas' write rule**: if TS(T) < W-TS(Q) on a write, simply **ignore** the obsolete write instead of aborting (allows some view-serializable schedules).

## Optimistic (validation-based) concurrency control

Assume conflicts are rare:
1. **Read phase** — work on private copies.
2. **Validation phase** — check for conflicts with concurrent committed transactions.
3. **Write phase** — if valid, apply changes; otherwise abort and retry.

Great for read-heavy workloads with low contention. Applications often implement it with a **version column**:

```sql
UPDATE products
SET stock = stock - 1, version = version + 1
WHERE id = 42 AND version = 7;     -- 0 rows updated → someone else changed it → retry
```

## MVCC — Multi-Version Concurrency Control

Instead of overwriting, writers create **new versions** of rows; each transaction reads a consistent **snapshot** as of its start (or statement start).

- **Readers never block writers, writers never block readers.**
- Old versions are cleaned up later (PostgreSQL `VACUUM`, InnoDB purge threads using undo logs).
- Used by PostgreSQL, MySQL InnoDB, Oracle, SQL Server (snapshot isolation), SQLite (WAL mode).

## Pessimistic vs optimistic

| | Pessimistic (locking) | Optimistic (validation / versions) |
|---|---|---|
| Assumes | conflicts are common | conflicts are rare |
| Cost | lock overhead, blocking, deadlocks | wasted work on abort/retry |
| Best for | high contention, short transactions | read-heavy, low contention |

`SELECT ... FOR UPDATE` takes row locks explicitly (pessimistic) — e.g. booking the last seat.

> [!INTERVIEW]
> - Dirty read vs non-repeatable read vs phantom read, and which isolation level prevents each.
> - Explain 2PL and why strict 2PL is used in practice.
> - Shared vs exclusive locks and their compatibility.
> - Wait-die vs wound-wait.
> - How MVCC lets readers and writers not block each other.

> [!REMEMBER]
> Anomalies: lost update, dirty read, non-repeatable read, phantom. Isolation: RU < RC < RR < Serializable. 2PL = grow then shrink → serializable; strict 2PL avoids cascading aborts. MVCC gives snapshots without read locks.
