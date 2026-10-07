**Recovery** brings the database back to a consistent state after a failure — guaranteeing **atomicity** (undo incomplete transactions) and **durability** (redo committed ones).

## Types of failures

| Failure | Example | Recovery approach |
|---|---|---|
| Transaction failure | logical error, constraint violation, deadlock victim | roll back that transaction (undo) |
| System crash | power loss, OS/DBMS crash — memory lost, disk intact | restart recovery from the log (undo + redo) |
| Media (disk) failure | disk head crash, corruption | restore from backup + replay archived logs |

## Storage hierarchy

- **Volatile** storage (RAM, buffers) — lost on crash.
- **Non-volatile** storage (disk, SSD) — survives crashes.
- **Stable** storage (conceptual) — never loses data, approximated with replication/RAID + remote copies.

The DBMS keeps pages in a **buffer pool**; modified ("dirty") pages are written back later. Two buffer policies matter:

| Policy | Meaning |
|---|---|
| **Steal** | a dirty page of an uncommitted transaction **may** be written to disk → needs **UNDO** |
| **No-force** | committed changes **need not** be written to disk at commit → needs **REDO** |

Most systems use **steal + no-force** (best performance) and therefore need both undo and redo — which the log provides.

## Log-based recovery

The **log** is an append-only sequence of records on stable storage:

```text
<T1 start>
<T1, A, 1000, 900>        ← (transaction, item, old value, new value)
<T1, B, 2000, 2100>
<T1 commit>
<T2 start>
<T2, C, 700, 600>
                           ← crash here
```

### Write-Ahead Logging (WAL)

1. A log record describing a change must reach stable storage **before** the changed data page is written to disk (enables undo).
2. All log records of a transaction, including `<commit>`, must be flushed **before** the commit is acknowledged (enables redo/durability).

### Undo and redo

| Operation | Uses | When |
|---|---|---|
| **UNDO(T)** | old values, scanning the log **backwards** | T has `<start>` but no `<commit>`/`<abort>` |
| **REDO(T)** | new values, scanning the log **forwards** | T has `<commit>` |

For the log above after the crash: **redo T1** (committed), **undo T2** (no commit) → C restored to 700.

### Deferred vs immediate update

| Scheme | Writes to DB | Needs |
|---|---|---|
| Deferred update | only after commit | redo only (no undo) |
| Immediate update | before commit is allowed | undo **and** redo |

## Checkpoints

Without checkpoints, recovery would have to scan the entire log. A **checkpoint**:
1. writes all log records in memory to stable storage,
2. flushes dirty buffer pages to disk,
3. writes a `<checkpoint L>` record listing active transactions L.

At recovery, start from the last checkpoint:

```diagram Recovery decisions relative to the last checkpoint and the crash
 time ─────────────|checkpoint|─────────────────────────|crash|
 T1: ──commit──                                              → nothing to do (already on disk)
 T2:        ───────────────commit──                          → REDO
 T3:                 ───────────────────commit──             → REDO
 T4:        ─────────────────────────────────────────────    → UNDO (never committed)
 T5:                              ────────────────────────   → UNDO
```

**Fuzzy checkpoints** avoid stopping all activity while flushing.

## ARIES (industry standard, overview)

ARIES (used in DB2, SQL Server, and conceptually in many others) recovers in three passes:

| Phase | What it does |
|---|---|
| **Analysis** | scan forward from the last checkpoint; rebuild the dirty-page table and the list of active ("loser") transactions |
| **Redo** | **repeat history**: reapply all logged updates (even of losers) from the earliest dirty page's LSN, so the DB is exactly as at the crash |
| **Undo** | roll back loser transactions in reverse order, writing **Compensation Log Records (CLRs)** so undo is never repeated after another crash |

Key ideas: every log record has an **LSN** (log sequence number); each page stores the LSN of its last update (pageLSN) so redo is idempotent.

## Shadow paging

An alternative to logging:
- Keep a **shadow page table** (current committed state) and a **current page table**.
- Updates go to **new copies** of pages; on commit, atomically switch the root pointer to the current table.
- Abort = discard the copies. Recovery = use the shadow table.

| ✅ Pros | ❌ Cons |
|---|---|
| no undo/redo needed; fast recovery | data fragmentation, garbage collection |
| simple | commit overhead (flush page tables); hard with concurrency |

Used conceptually by copy-on-write systems (LMDB, ZFS/Btrfs file systems); SQLite's rollback journal is a related idea.

## Backups

| Type | Content |
|---|---|
| Full backup | entire database |
| Incremental | changes since the last backup of any type |
| Differential | changes since the last full backup |
| Point-in-time recovery (PITR) | full backup + archived WAL replayed up to a timestamp |

Replication (streaming WAL to replicas) provides high availability, but is **not** a backup — a bad `DELETE` replicates too.

> [!INTERVIEW]
> - What is write-ahead logging and why is it needed?
> - Undo vs redo — which transactions get which after a crash?
> - Purpose of checkpoints.
> - Steal/no-force and why they imply undo + redo.
> - Shadow paging vs log-based recovery.

> [!REMEMBER]
> Log first, data later (WAL). After a crash: redo committed transactions, undo uncommitted ones, starting from the last checkpoint. ARIES = analysis → redo (repeat history) → undo with CLRs. Backups + archived logs handle disk failures.
