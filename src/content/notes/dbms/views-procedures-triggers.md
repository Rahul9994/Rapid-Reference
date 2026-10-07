Views, stored procedures, functions and triggers move logic **into the database**: views give named, reusable queries; procedures and functions package logic; triggers react automatically to data changes.

## Views

A **view** is a stored query that behaves like a virtual table.

```sql
CREATE VIEW engineering_staff AS
SELECT e.emp_id, e.name, e.salary
FROM employees e
JOIN departments d ON d.dept_id = e.dept_id
WHERE d.dept_name = 'Engineering';

SELECT name FROM engineering_staff WHERE salary > 70000;   -- query it like a table
DROP VIEW engineering_staff;
```

### Why use views

| Benefit | Example |
|---|---|
| **Simplicity** | hide complex joins behind a simple name |
| **Security** | expose only some columns/rows (`GRANT SELECT ON public_profile TO app`) |
| **Logical data independence** | change base tables while keeping the view's interface |
| Consistency | one definition of "active customer" used everywhere |

### Updatable views

Simple views (single table, no aggregates/DISTINCT/GROUP BY, includes the key) can usually accept `INSERT/UPDATE/DELETE`. Add `WITH CHECK OPTION` to reject changes that would make a row disappear from the view:

```sql
CREATE VIEW well_paid AS
SELECT emp_id, name, salary FROM employees WHERE salary > 70000
WITH CHECK OPTION;

UPDATE well_paid SET salary = 50000 WHERE emp_id = 1;   -- ❌ rejected: row would leave the view
```

### Materialized views

A **materialized view** stores the query result physically — fast reads, but data can be stale until refreshed.

```sql
CREATE MATERIALIZED VIEW dept_salary_stats AS          -- PostgreSQL / Oracle
SELECT dept_id, COUNT(*) AS n, AVG(salary) AS avg_salary
FROM employees GROUP BY dept_id;

REFRESH MATERIALIZED VIEW dept_salary_stats;
```

| | View | Materialized view |
|---|---|---|
| Storage | only the definition | stores the result |
| Freshness | always current | stale until refreshed |
| Read speed | runs the query each time | fast (precomputed) |
| Use | abstraction, security | dashboards, expensive aggregations |

## Stored procedures

A **stored procedure** is a named, precompiled block of SQL + control flow stored in the database and executed with `CALL`/`EXEC`.

```sql
-- PostgreSQL (PL/pgSQL)
CREATE OR REPLACE PROCEDURE transfer(src INT, dst INT, amount NUMERIC)
LANGUAGE plpgsql
AS $$
BEGIN
    IF amount <= 0 THEN
        RAISE EXCEPTION 'amount must be positive';
    END IF;
    UPDATE accounts SET balance = balance - amount WHERE id = src;
    UPDATE accounts SET balance = balance + amount WHERE id = dst;
    COMMIT;
END;
$$;

CALL transfer(1, 2, 500);
```

```sql
-- MySQL
DELIMITER //
CREATE PROCEDURE raise_salary(IN p_dept INT, IN p_pct DECIMAL(5,2))
BEGIN
    UPDATE employees SET salary = salary * (1 + p_pct / 100) WHERE dept_id = p_dept;
END //
DELIMITER ;

CALL raise_salary(20, 5);
```

| ✅ Pros | ❌ Cons |
|---|---|
| fewer network round trips | logic split between app and DB |
| reusable, centrally maintained | harder to version, test and debug |
| security: grant EXECUTE without table access | vendor-specific languages (lock-in) |
| precompiled/cached plans | can become a scaling bottleneck |

## Functions (user-defined functions)

| | Stored procedure | Function |
|---|---|---|
| Returns | zero or more values via OUT params/result sets | **must return** a value (scalar or table) |
| Used in SQL expressions | ❌ (called with CALL/EXEC) | ✅ (`SELECT fn(x)`) |
| Transaction control | can usually COMMIT/ROLLBACK | usually can't |
| Side effects | allowed | typically discouraged/restricted |

```sql
CREATE FUNCTION annual_salary(monthly INT) RETURNS INT
LANGUAGE sql IMMUTABLE
AS $$ SELECT monthly * 12 $$;

SELECT name, annual_salary(salary) FROM employees;
```

## Triggers

A **trigger** runs automatically **BEFORE** or **AFTER** an `INSERT`, `UPDATE` or `DELETE` (or `INSTEAD OF` on views), either once per **row** or once per **statement**.

```sql
-- Audit every salary change (PostgreSQL)
CREATE TABLE salary_audit (
    emp_id INT, old_salary INT, new_salary INT,
    changed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE OR REPLACE FUNCTION log_salary_change() RETURNS trigger
LANGUAGE plpgsql AS $$
BEGIN
    IF NEW.salary <> OLD.salary THEN
        INSERT INTO salary_audit (emp_id, old_salary, new_salary)
        VALUES (OLD.emp_id, OLD.salary, NEW.salary);
    END IF;
    RETURN NEW;
END;
$$;

CREATE TRIGGER trg_salary_audit
AFTER UPDATE OF salary ON employees
FOR EACH ROW EXECUTE FUNCTION log_salary_change();
```

`OLD` and `NEW` refer to the row before and after the change.

Working example in SQLite (runnable from Python):

```python
import sqlite3

con = sqlite3.connect(":memory:")
con.executescript("""
CREATE TABLE employees (emp_id INTEGER PRIMARY KEY, name TEXT, salary INT);
CREATE TABLE salary_audit (emp_id INT, old_salary INT, new_salary INT);
CREATE TRIGGER trg_salary_audit AFTER UPDATE OF salary ON employees
FOR EACH ROW WHEN NEW.salary <> OLD.salary
BEGIN
    INSERT INTO salary_audit VALUES (OLD.emp_id, OLD.salary, NEW.salary);
END;
INSERT INTO employees VALUES (1, 'Asha', 90000);
UPDATE employees SET salary = 99000 WHERE emp_id = 1;
""")
print(con.execute("SELECT * FROM salary_audit").fetchall())
```

```output
[(1, 90000, 99000)]
```

### Typical uses

- Auditing / history tables
- Enforcing complex business rules across tables
- Maintaining derived data (counters, `updated_at` timestamps)
- `INSTEAD OF` triggers to make complex views updatable

> [!WARNING]
> Triggers are invisible side effects: they make debugging harder, can cascade (trigger fires trigger), and slow bulk writes. Prefer constraints for simple rules and keep triggers small.

## Cursors (brief)

A **cursor** iterates over a query result row by row inside procedural code. It's useful for complex per-row logic but usually slower than set-based SQL — prefer a single `UPDATE … FROM` / `MERGE` when possible.

> [!INTERVIEW]
> - View vs table; view vs materialized view.
> - Stored procedure vs function.
> - BEFORE vs AFTER triggers; row-level vs statement-level; what OLD/NEW mean.
> - Pros and cons of putting business logic in the database.

> [!REMEMBER]
> Views = saved queries (security + simplicity); materialized views = cached results. Procedures run with CALL and can manage transactions; functions return values usable in SQL. Triggers fire on DML events — powerful, but keep them minimal.
