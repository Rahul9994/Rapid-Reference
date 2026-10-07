## What is a DBMS and how is it better than a file system?

Software for storing and managing data with a query language, integrity constraints, concurrency control, crash recovery and security. Compared with plain files it avoids redundancy and inconsistency, enforces rules, supports concurrent users safely (ACID transactions), and lets you query data declaratively with SQL.

## What are ACID properties?

- **Atomicity** — a transaction happens completely or not at all.
- **Consistency** — it moves the database from one valid state to another.
- **Isolation** — concurrent transactions behave as if executed serially.
- **Durability** — committed changes survive crashes.

Example: a bank transfer must debit and credit together, never just one.

## Explain the different types of keys.

**Super key**: any attribute set that uniquely identifies rows. **Candidate key**: a minimal super key. **Primary key**: the chosen candidate key (unique, not null). **Alternate key**: other candidate keys. **Foreign key**: references a key in another table. **Composite key**: a key made of multiple columns.

## What is normalization? Explain 1NF, 2NF, 3NF and BCNF.

Organising tables to reduce redundancy and update anomalies.
- **1NF**: atomic values, no repeating groups.
- **2NF**: 1NF + no non-key attribute depends on only **part** of a composite key.
- **3NF**: 2NF + no non-key attribute depends on another non-key attribute (no transitive dependencies).
- **BCNF**: for every functional dependency X → Y, X is a super key.

## What is the difference between DELETE, TRUNCATE and DROP?

**DELETE** is DML: it removes selected rows (WHERE allowed), is logged row by row, fires triggers and can be rolled back. **TRUNCATE** removes all rows quickly by deallocating pages, keeps the table structure and usually resets identity counters. **DROP** removes the table itself — data, structure, indexes and constraints. Whether TRUNCATE/DROP can be rolled back depends on the database (PostgreSQL: yes inside a transaction; MySQL: implicit commit).

## What is the difference between WHERE and HAVING?

`WHERE` filters **rows before** grouping and can't use aggregate functions; `HAVING` filters **groups after** `GROUP BY` and typically uses aggregates.

```sql
SELECT dept_id, AVG(salary) FROM employees
WHERE active = TRUE
GROUP BY dept_id
HAVING AVG(salary) > 60000;
```

## Explain the different types of joins.

**INNER JOIN** returns only matching rows. **LEFT JOIN** returns all rows from the left table plus matches (NULLs otherwise); **RIGHT JOIN** the reverse; **FULL OUTER JOIN** all rows from both. **CROSS JOIN** returns the Cartesian product. A **SELF JOIN** joins a table with itself (employee–manager).

## How do you find the second highest salary?

```sql
-- Subquery
SELECT MAX(salary) FROM employees
WHERE salary < (SELECT MAX(salary) FROM employees);

-- Window function (generalises to the Nth highest)
SELECT DISTINCT salary FROM (
  SELECT salary, DENSE_RANK() OVER (ORDER BY salary DESC) AS r FROM employees
) t WHERE r = 2;
```

## What is an index? Clustered vs non-clustered?

An index is a data structure (usually a **B+ tree**) that speeds up lookups at the cost of extra storage and slower writes. A **clustered** index determines the physical order of the table's rows (only one per table, e.g. InnoDB's primary key). A **non-clustered** index is a separate structure with pointers to rows (many per table).

## What are transaction isolation levels?

From weakest to strongest: **Read Uncommitted** (dirty reads possible), **Read Committed** (no dirty reads), **Repeatable Read** (no non-repeatable reads), **Serializable** (no phantoms — equivalent to serial execution). Higher levels reduce anomalies but also concurrency.

## What are dirty reads, non-repeatable reads and phantom reads?

- **Dirty read**: reading data written by a transaction that hasn't committed (and may roll back).
- **Non-repeatable read**: reading the same row twice gives different values because another transaction updated it in between.
- **Phantom read**: re-running a query returns new or missing rows because another transaction inserted/deleted matching rows.

## What is a view?

A virtual table defined by a stored query. Views simplify complex queries, restrict access to specific rows/columns for security, and provide logical data independence. A **materialized view** stores the result physically and must be refreshed.

## What is a stored procedure? How is it different from a function?

A stored procedure is a precompiled set of SQL statements stored in the database and executed with `CALL`/`EXEC`; it can have IN/OUT parameters and usually manage transactions. A function must return a value and can be used inside SQL expressions (`SELECT fn(col)`), generally without side effects.

## What is a trigger?

A procedure that runs automatically **before** or **after** an INSERT, UPDATE or DELETE on a table (per row or per statement). Used for auditing, enforcing complex rules and maintaining derived data — but they add hidden side effects, so keep them small.

## What is a deadlock in databases and how is it handled?

Two transactions each hold a lock the other needs, so both wait forever. DBMSs detect cycles in a wait-for graph (or use timeouts) and abort one transaction (the victim) to break the cycle; applications should retry. Prevention: access tables/rows in a consistent order and keep transactions short.

## SQL vs NoSQL databases?

SQL databases use tables with fixed schemas, strong ACID transactions, joins and SQL — great for structured, relational data. NoSQL databases (document, key-value, wide-column, graph) offer flexible schemas and easy horizontal scaling, often with eventual consistency — great for massive scale, evolving data and high write throughput.

## What is the CAP theorem?

In a distributed data store, when a network **partition** occurs you must choose between **consistency** (every read sees the latest write) and **availability** (every request gets a response). Systems are therefore CP or AP during partitions; when there's no partition you can have both (PACELC adds the latency vs consistency trade-off).

## What is a foreign key constraint and what are ON DELETE options?

A foreign key ensures values in a child table exist in the parent table's key (referential integrity). On deleting/updating the parent: **RESTRICT/NO ACTION** blocks it, **CASCADE** propagates it to children, **SET NULL** clears the reference, **SET DEFAULT** sets the default value.
