**SQL (Structured Query Language)** is the standard language for relational databases. You describe *what* data you want; the optimizer decides *how* to get it.

## Sample schema used in these notes

```sql
CREATE TABLE departments (
    dept_id   INT PRIMARY KEY,
    dept_name VARCHAR(50) NOT NULL
);

CREATE TABLE employees (
    emp_id     INT PRIMARY KEY,
    name       VARCHAR(50) NOT NULL,
    dept_id    INT REFERENCES departments(dept_id),
    salary     INT NOT NULL,
    manager_id INT REFERENCES employees(emp_id)
);

INSERT INTO departments VALUES (10, 'Engineering'), (20, 'Sales'), (30, 'HR');
INSERT INTO employees VALUES
    (1, 'Asha',  10, 90000, NULL),
    (2, 'Ravi',  10, 60000, 1),
    (3, 'Meera', 20, 75000, 1),
    (4, 'Karan', 20, 75000, 3),
    (5, 'Zoya',  NULL, 50000, 3);
```

## Command categories

| Category | Commands |
|---|---|
| DDL | `CREATE`, `ALTER`, `DROP`, `TRUNCATE`, `RENAME` |
| DML | `INSERT`, `UPDATE`, `DELETE`, `MERGE` |
| DQL | `SELECT` |
| DCL | `GRANT`, `REVOKE` |
| TCL | `COMMIT`, `ROLLBACK`, `SAVEPOINT`, `SET TRANSACTION` |

## SELECT anatomy and logical order

```sql
SELECT   dept_id, COUNT(*) AS headcount       -- 5. pick / compute columns
FROM     employees                            -- 1. source tables (and JOINs)
WHERE    salary > 55000                       -- 2. filter rows
GROUP BY dept_id                              -- 3. form groups
HAVING   COUNT(*) >= 2                        -- 4. filter groups
ORDER BY headcount DESC                       -- 6. sort
LIMIT    10;                                  -- 7. limit rows
```

**Logical execution order**: `FROM → JOIN → WHERE → GROUP BY → HAVING → SELECT → DISTINCT → ORDER BY → LIMIT/OFFSET`

That's why you **can't use a SELECT alias in WHERE** (it doesn't exist yet), but you **can** use it in ORDER BY.

## Filtering with WHERE

```sql
SELECT name, salary FROM employees WHERE salary BETWEEN 60000 AND 80000;   -- inclusive
SELECT name FROM employees WHERE dept_id IN (10, 30);
SELECT name FROM employees WHERE name LIKE 'K%';          -- % any sequence, _ one character
SELECT name FROM employees WHERE dept_id IS NULL;          -- never "= NULL"
SELECT name FROM employees WHERE salary > 60000 AND (dept_id = 10 OR manager_id = 3);
```

| Operator | Meaning |
|---|---|
| `=`, `<>` / `!=`, `<`, `>`, `<=`, `>=` | comparison |
| `BETWEEN a AND b` | a ≤ x ≤ b |
| `IN (…)`, `NOT IN (…)` | membership (beware NULLs in NOT IN) |
| `LIKE 'pattern'` | `%` = any string, `_` = exactly one char |
| `IS NULL`, `IS NOT NULL` | NULL checks |
| `AND`, `OR`, `NOT` | logic (`AND` binds tighter than `OR`) |

## Sorting, distinct and limiting

```sql
SELECT DISTINCT dept_id FROM employees;                         -- unique values (NULL counts once)
SELECT name, salary FROM employees ORDER BY salary DESC, name ASC;
SELECT name FROM employees ORDER BY salary DESC LIMIT 2 OFFSET 1;   -- MySQL / PostgreSQL / SQLite
-- SQL Server: SELECT TOP 2 ...   |   Standard / Oracle 12c+: FETCH FIRST 2 ROWS ONLY
```

## Inserting, updating, deleting

```sql
INSERT INTO employees (emp_id, name, dept_id, salary) VALUES (6, 'Dev', 30, 55000);

UPDATE employees SET salary = salary * 1.10 WHERE dept_id = 20;   -- always double-check the WHERE!

DELETE FROM employees WHERE emp_id = 6;
```

> [!WARNING]
> `UPDATE` or `DELETE` without `WHERE` changes **every row**. Run the `WHERE` as a `SELECT` first, or work inside a transaction you can `ROLLBACK`.

## DELETE vs TRUNCATE vs DROP

| | DELETE | TRUNCATE | DROP |
|---|---|---|---|
| Type | DML | DDL | DDL |
| Removes | selected rows (`WHERE` allowed) | all rows | the whole table (data + structure + indexes) |
| Speed | slower (row by row, logged) | fast (deallocates pages) | fast |
| Triggers fire | yes | no (usually) | no |
| Rollback | yes (inside a transaction) | depends on DBMS (yes in PostgreSQL/SQL Server; implicit commit in MySQL/Oracle) | depends on DBMS |
| Identity / auto-increment | not reset | reset (usually) | gone |

## Altering tables

```sql
ALTER TABLE employees ADD COLUMN email VARCHAR(100);
ALTER TABLE employees RENAME COLUMN name TO full_name;     -- PostgreSQL / MySQL 8 / SQLite
ALTER TABLE employees DROP COLUMN email;
```

## Useful expressions and functions

```sql
SELECT name,
       salary * 12                                AS annual,
       UPPER(name)                                AS shout,
       LENGTH(name)                               AS len,          -- LEN() in SQL Server
       COALESCE(dept_id, 0)                       AS dept,         -- first non-NULL
       CASE WHEN salary >= 75000 THEN 'senior'
            WHEN salary >= 60000 THEN 'mid'
            ELSE 'junior' END                     AS band
FROM employees;
```

| name | annual | shout | len | dept | band |
|---|---|---|---|---|---|
| Asha | 1080000 | ASHA | 4 | 10 | senior |
| Ravi | 720000 | RAVI | 4 | 10 | mid |
| Meera | 900000 | MEERA | 5 | 20 | senior |
| Karan | 900000 | KARAN | 5 | 20 | senior |
| Zoya | 600000 | ZOYA | 4 | 0 | junior |

Other common functions: `CONCAT`/`||`, `SUBSTRING`, `TRIM`, `REPLACE`, `ROUND`, `ABS`, `CAST(x AS type)`, `NOW()`/`CURRENT_DATE`, `EXTRACT(YEAR FROM d)`, `NULLIF(a, b)`.

## Set operations

```sql
SELECT dept_id FROM departments
EXCEPT                              -- MINUS in Oracle
SELECT dept_id FROM employees;      -- departments without employees → 30
```

| Operator | Result | Duplicates |
|---|---|---|
| `UNION` | rows from either query | removed |
| `UNION ALL` | rows from either query | kept (faster) |
| `INTERSECT` | rows in both | removed |
| `EXCEPT` / `MINUS` | rows in first, not second | removed |

Both queries must have the same number of columns with compatible types.

## Views and transactions (preview)

```sql
CREATE VIEW high_earners AS SELECT name, salary FROM employees WHERE salary > 70000;

BEGIN;
UPDATE accounts SET balance = balance - 100 WHERE id = 1;
UPDATE accounts SET balance = balance + 100 WHERE id = 2;
COMMIT;            -- or ROLLBACK on error
```

## Running SQL from Python

```python
import sqlite3

con = sqlite3.connect(":memory:")
con.execute("CREATE TABLE t (id INTEGER PRIMARY KEY, name TEXT)")
con.executemany("INSERT INTO t (name) VALUES (?)", [("Ada",), ("Alan",)])   # parameterised → no SQL injection
print(con.execute("SELECT id, name FROM t WHERE name LIKE ?", ("A%",)).fetchall())
con.close()
```

```output
[(1, 'Ada'), (2, 'Alan')]
```

> [!WARNING]
> Never build SQL with string formatting (`f"... WHERE name = '{user}'"`) — that's how **SQL injection** happens. Always use placeholders.

> [!INTERVIEW]
> - Logical order of a SELECT: FROM → WHERE → GROUP BY → HAVING → SELECT → ORDER BY → LIMIT.
> - DELETE vs TRUNCATE vs DROP.
> - `UNION` vs `UNION ALL`.
> - Why `WHERE col = NULL` never matches — use `IS NULL`.

> [!REMEMBER]
> Write SELECTs in the order SELECT-FROM-WHERE-GROUP BY-HAVING-ORDER BY-LIMIT, but think in execution order FROM → WHERE → GROUP BY → HAVING → SELECT → ORDER BY. Always parameterise queries.
