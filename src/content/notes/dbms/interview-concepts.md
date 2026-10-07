The DBMS topics and SQL questions that come up again and again in interviews, with crisp answers and ready-to-write queries.

## Concept checklist

| Question | Crisp answer |
|---|---|
| DBMS vs RDBMS? | RDBMS stores data in related tables with keys and SQL; DBMS is the general term (could be file/hierarchical). |
| Primary vs unique vs foreign key? | Unique + not null identity / uniqueness allowing NULL / reference to another table's key. |
| DELETE vs TRUNCATE vs DROP? | Remove selected rows (logged, rollback-able) / remove all rows fast / remove the table. |
| WHERE vs HAVING? | Filter rows before grouping / filter groups after aggregation. |
| UNION vs UNION ALL? | Removes duplicates / keeps duplicates (faster). |
| INNER vs OUTER join? | Only matches / keeps unmatched rows padded with NULLs. |
| Normalization? | Decomposing tables to remove redundancy and anomalies (1NF→2NF→3NF→BCNF). |
| Denormalization? | Adding controlled redundancy to speed up reads. |
| ACID? | Atomicity, Consistency, Isolation, Durability. |
| Isolation levels? | Read Uncommitted, Read Committed, Repeatable Read, Serializable. |
| Clustered vs non-clustered index? | Table stored in index order (one per table) vs separate structure with pointers (many). |
| Why B+ trees? | Shallow (high fan-out), balanced, linked leaves for range scans. |
| View vs materialized view? | Saved query vs stored result needing refresh. |
| Procedure vs function? | Called with CALL, may manage transactions vs returns a value usable in SQL. |
| Deadlock in DBs? | Detected via wait-for graphs; a victim transaction is rolled back. |
| OLTP vs OLAP? | Many short transactional reads/writes vs large analytical queries over historical data. |

## SQL vs NoSQL

| | SQL (relational) | NoSQL |
|---|---|---|
| Data model | tables with fixed schema | document, key-value, wide-column, graph |
| Schema | schema-on-write (strict) | flexible / schema-on-read |
| Scaling | vertical first; horizontal via sharding/replicas | designed for horizontal scaling |
| Transactions | strong ACID, joins | often BASE / eventual consistency (many now offer ACID per document or more) |
| Query language | SQL | database-specific APIs/languages |
| Good for | structured data, complex queries, consistency (banking, ERP) | massive scale, flexible/evolving data, high write throughput (feeds, IoT, caching) |
| Examples | PostgreSQL, MySQL, Oracle, SQL Server | MongoDB (document), Redis (key-value), Cassandra (wide-column), Neo4j (graph) |

**BASE**: Basically Available, Soft state, Eventually consistent.

## CAP theorem

In a distributed system, when a **network Partition** happens you must choose between **Consistency** (every read sees the latest write) and **Availability** (every request gets a non-error response).

- **CP** systems: prefer consistency (e.g. HBase, MongoDB with majority writes, ZooKeeper).
- **AP** systems: prefer availability (e.g. Cassandra, DynamoDB-style, CouchDB).
- Without partitions you can have both — **PACELC** adds: Else, trade **Latency** vs **Consistency**.

## Scaling databases

| Technique | Idea | Trade-off |
|---|---|---|
| Indexing & query tuning | do less work per query | write overhead |
| Vertical scaling | bigger machine | cost ceiling |
| **Replication** | primary handles writes, replicas serve reads | replica lag (eventual consistency) |
| **Sharding (horizontal partitioning)** | split rows across servers by a shard key (hash / range / directory) | cross-shard joins/transactions are hard; resharding |
| Vertical partitioning | split columns/tables across servers | more joins |
| Caching | Redis/Memcached in front of the DB | invalidation complexity |
| Connection pooling | reuse connections | pool sizing |

## Must-know SQL queries

Schema: `employees(emp_id, name, dept_id, salary, manager_id)`, `departments(dept_id, dept_name)`.

```sql
-- 1. Second highest salary (handles ties, returns NULL if none)
SELECT MAX(salary) FROM employees
WHERE salary < (SELECT MAX(salary) FROM employees);

-- 2. Nth highest salary (N = 3) with DENSE_RANK
SELECT DISTINCT salary FROM (
    SELECT salary, DENSE_RANK() OVER (ORDER BY salary DESC) AS r FROM employees
) t WHERE r = 3;

-- 2b. Nth highest with LIMIT/OFFSET (MySQL / PostgreSQL)
SELECT DISTINCT salary FROM employees ORDER BY salary DESC LIMIT 1 OFFSET 2;

-- 3. Highest-paid employee(s) in each department
SELECT e.name, d.dept_name, e.salary
FROM employees e
JOIN departments d ON d.dept_id = e.dept_id
WHERE e.salary = (SELECT MAX(salary) FROM employees x WHERE x.dept_id = e.dept_id);

-- 4. Employees earning more than their manager
SELECT e.name
FROM employees e JOIN employees m ON e.manager_id = m.emp_id
WHERE e.salary > m.salary;

-- 5. Departments with no employees
SELECT d.dept_name FROM departments d
WHERE NOT EXISTS (SELECT 1 FROM employees e WHERE e.dept_id = d.dept_id);

-- 6. Duplicate emails
SELECT email, COUNT(*) FROM users GROUP BY email HAVING COUNT(*) > 1;

-- 7. Delete duplicates, keeping the lowest id (PostgreSQL / MySQL 8 style)
DELETE FROM users
WHERE id IN (
    SELECT id FROM (
        SELECT id, ROW_NUMBER() OVER (PARTITION BY email ORDER BY id) AS rn FROM users
    ) t WHERE rn > 1
);

-- 8. Department-wise count and average, only departments with ≥ 2 people
SELECT dept_id, COUNT(*) AS n, ROUND(AVG(salary), 2) AS avg_salary
FROM employees GROUP BY dept_id HAVING COUNT(*) >= 2;

-- 9. Running total of daily sales
SELECT sale_date, amount, SUM(amount) OVER (ORDER BY sale_date) AS running_total
FROM sales;

-- 10. Customers who ordered in consecutive months (LAG)
SELECT customer_id, order_month
FROM (
    SELECT customer_id, order_month,
           LAG(order_month) OVER (PARTITION BY customer_id ORDER BY order_month) AS prev_month
    FROM monthly_orders
) t
WHERE order_month = prev_month + 1;    -- adapt the date arithmetic to your DBMS

-- 11. Top 3 products by revenue per category
SELECT * FROM (
    SELECT category, product, revenue,
           ROW_NUMBER() OVER (PARTITION BY category ORDER BY revenue DESC) AS rn
    FROM product_revenue
) t WHERE rn <= 3;

-- 12. Pivot: count of employees per department as columns
SELECT
    SUM(CASE WHEN dept_id = 10 THEN 1 ELSE 0 END) AS engineering,
    SUM(CASE WHEN dept_id = 20 THEN 1 ELSE 0 END) AS sales
FROM employees;
```

## Scenario questions

> [!INTERVIEW]
> **"A query is slow. What do you do?"**
> Run `EXPLAIN ANALYZE`; look for full scans, bad row estimates and sorts; add or fix indexes (composite order, covering); avoid functions on indexed columns and `SELECT *`; rewrite correlated subqueries as joins if the optimizer doesn't; paginate with keyset pagination instead of large OFFSETs; update statistics; consider caching or denormalized read models.

> [!INTERVIEW]
> **"How do you prevent double booking of the last seat?"**
> Use a transaction with `SELECT … FOR UPDATE` on the seat row (pessimistic), or a unique constraint on (show_id, seat_no) plus an `INSERT` that fails on conflict, or optimistic locking with a version column — and handle the retry.

> [!INTERVIEW]
> **"How does an index make queries faster, and when would you not add one?"**
> A B+ tree turns an O(n) scan into O(log n) page reads and keeps keys sorted for ranges/ORDER BY. Skip indexes on tiny tables, low-selectivity columns, or write-heavy tables where maintenance cost outweighs the read benefit.

> [!REMEMBER]
> Know the definitions (keys, joins, normal forms, ACID, isolation levels, indexes) and be able to write: Nth highest salary, top-N per group, employees vs managers (self join), duplicates (GROUP BY … HAVING), anti-joins (NOT EXISTS) and running totals (window functions).
