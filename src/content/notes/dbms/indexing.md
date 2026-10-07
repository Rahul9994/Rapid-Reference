An **index** is an auxiliary data structure that lets the database find rows without scanning the whole table — like a book's index. It speeds up reads at the cost of extra storage and slower writes.

## Why indexes matter

Without an index, `SELECT * FROM users WHERE email = 'ada@x.com'` must check every row: a **full table scan**, O(n) disk pages. With a B+ tree index on `email`, it's O(log n) — typically 3–4 page reads even for millions of rows.

```sql
CREATE INDEX idx_users_email ON users (email);
CREATE UNIQUE INDEX uq_users_username ON users (username);
CREATE INDEX idx_orders_cust_date ON orders (customer_id, order_date);   -- composite
DROP INDEX idx_users_email;                                               -- syntax varies by DBMS
```

## Types of indexes

### By ordering

| Type | Description |
|---|---|
| **Ordered (tree) index** | entries sorted by key (B+ tree) — supports equality, ranges, ORDER BY, prefix LIKE |
| **Hash index** | hash(key) → bucket — O(1) equality lookups only; no ranges or sorting |

### Primary / clustered vs secondary / non-clustered

| | Clustered (primary) index | Non-clustered (secondary) index |
|---|---|---|
| Data order | table rows are **physically stored in key order** | separate structure pointing to rows |
| Per table | **one** | many |
| Leaf contains | the actual rows (InnoDB) | key + row pointer / primary key |
| Range scans | very fast (sequential) | may need many random lookups |
| Example | InnoDB primary key, SQL Server clustered index | index on `email` |

In MySQL InnoDB, secondary index leaves store the **primary key**, so a lookup goes secondary index → primary key → clustered index (a "bookmark lookup"). Keep primary keys short!

### Dense vs sparse

| Dense index | Sparse index |
|---|---|
| an entry for **every** search-key value / record | an entry for **some** values (e.g. one per data block) |
| faster lookup, more space | less space; requires the file to be **sorted** on the key |

```diagram Sparse index on a sorted file (one entry per block)
 Index            Data blocks
 [10] ──────────► [10 | 12 | 15]
 [20] ──────────► [20 | 22 | 27]
 [30] ──────────► [30 | 31 | 38]
 Search 22: largest index key ≤ 22 is 20 → scan that block
```

### Single-level vs multilevel

When the index itself is too large, build an index on the index → a **multilevel index**. A B+ tree is a balanced, dynamic multilevel index.

## Composite indexes and the leftmost-prefix rule

An index on `(customer_id, order_date)` is sorted by `customer_id`, then by `order_date`.

| Query predicate | Uses the index? |
|---|---|
| `customer_id = 5` | ✅ |
| `customer_id = 5 AND order_date > '2026-01-01'` | ✅ (equality on the first column, range on the second) |
| `order_date > '2026-01-01'` only | ❌ (usually — the leading column is missing) |
| `customer_id > 5 AND order_date = '2026-01-01'` | partially (range on the first column stops further use) |

Put **equality columns first**, then range/sort columns. Column order matters.

## Covering indexes

If an index contains every column a query needs, the DBMS answers from the index alone (an **index-only scan**) without touching the table:

```sql
CREATE INDEX idx_cover ON orders (customer_id, order_date, total);
SELECT order_date, total FROM orders WHERE customer_id = 5;   -- served entirely by the index
-- PostgreSQL / SQL Server can also INCLUDE non-key columns: CREATE INDEX ... (customer_id) INCLUDE (total);
```

## When indexes are NOT used (or hurt)

- Functions on the column: `WHERE LOWER(email) = 'x'` (fix: an **expression/functional index** or store normalised data).
- Leading wildcard: `WHERE name LIKE '%son'`.
- Implicit type conversions: comparing a VARCHAR column with a number.
- Low-selectivity columns (e.g. `gender`, `is_active`) — scanning may be cheaper; consider **partial indexes** (`WHERE is_active`).
- Small tables — a full scan is cheap.
- `OR` across different columns (may need separate indexes / union).

## Costs of indexes

| Benefit | Cost |
|---|---|
| fast lookups, joins, ORDER BY, GROUP BY | extra storage |
| enforce uniqueness | slower `INSERT`/`UPDATE`/`DELETE` (every index must be maintained) |
| index-only scans | more work for the optimizer; fragmentation over time |

Index the columns used in `WHERE`, `JOIN ON`, `ORDER BY` and `GROUP BY` of frequent queries — and **measure**.

## Reading query plans

```sql
EXPLAIN ANALYZE
SELECT * FROM orders WHERE customer_id = 5 ORDER BY order_date DESC LIMIT 10;
```

Look for: `Seq Scan` (full scan) vs `Index Scan` / `Index Only Scan`, estimated vs actual rows, and expensive sorts.

```python
import sqlite3

con = sqlite3.connect(":memory:")
con.execute("CREATE TABLE users (id INTEGER PRIMARY KEY, email TEXT)")
plan = lambda: con.execute("EXPLAIN QUERY PLAN SELECT id FROM users WHERE email = 'a@x'").fetchall()[0][-1]
print(plan())
con.execute("CREATE INDEX idx_email ON users (email)")
print(plan())
```

```output
SCAN users
SEARCH users USING COVERING INDEX idx_email (email=?)
```

## Other index types

| Index | Use case |
|---|---|
| Bitmap index | low-cardinality columns in data warehouses (Oracle) |
| Full-text (inverted) index | searching words in text (`MATCH … AGAINST`, `tsvector`) |
| Spatial (R-tree, GiST) | geographic queries |
| GIN | JSONB, arrays, full-text in PostgreSQL |
| LSM trees | write-heavy stores (Cassandra, RocksDB) |

> [!INTERVIEW]
> - Clustered vs non-clustered index (one per table vs many; data order vs pointer structure).
> - Dense vs sparse index.
> - Why B+ trees instead of hash indexes or binary trees? — Range queries + few disk reads (high fan-out).
> - Composite index column order and the leftmost-prefix rule.
> - Downsides of over-indexing — slower writes and more storage.

> [!REMEMBER]
> Indexes trade write speed and space for read speed. B+ tree for ranges/sorting, hash for equality. One clustered index per table. Composite indexes follow the leftmost prefix. Verify with EXPLAIN.
