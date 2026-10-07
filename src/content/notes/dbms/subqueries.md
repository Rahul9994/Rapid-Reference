A **subquery** is a query nested inside another. **CTEs** (`WITH` clauses) name subqueries for readability — and **recursive CTEs** let SQL traverse hierarchies and graphs.

Data: `employees` / `departments` from *SQL Essentials*.

## Types of subqueries

| Type | Returns | Used with |
|---|---|---|
| Scalar | one value (1 row × 1 column) | `=`, `>`, in SELECT list |
| Row | one row, several columns | `(a, b) = (SELECT …)` |
| Column / multi-row | one column, many rows | `IN`, `ANY`, `ALL` |
| Table | many rows and columns | `FROM (…) AS t` (derived table) |
| **Correlated** | re-evaluated per outer row (references the outer query) | `EXISTS`, comparisons |

## Scalar subqueries

```sql
-- Employees earning more than the company average (70000) → Asha, Meera, Karan
SELECT name, salary
FROM employees
WHERE salary > (SELECT AVG(salary) FROM employees);

-- Second highest salary without window functions → 75000
SELECT MAX(salary)
FROM employees
WHERE salary < (SELECT MAX(salary) FROM employees);
```

## Multi-row subqueries: IN, ANY, ALL

```sql
SELECT name FROM employees
WHERE dept_id IN (SELECT dept_id FROM departments WHERE dept_name IN ('Sales', 'HR'));   -- Meera, Karan

SELECT name FROM employees
WHERE salary > ALL (SELECT salary FROM employees WHERE dept_id = 20);    -- > every Sales salary → Asha

SELECT name FROM employees
WHERE salary > ANY (SELECT salary FROM employees WHERE dept_id = 20);    -- > at least one → Asha
```

## Correlated subqueries

The inner query references a column of the outer row, so it runs (logically) once per row.

```sql
-- Employees earning above their own department's average → Asha
SELECT e.name, e.salary, e.dept_id
FROM employees e
WHERE e.salary > (
    SELECT AVG(e2.salary)
    FROM employees e2
    WHERE e2.dept_id = e.dept_id
);
```

## EXISTS and NOT EXISTS

`EXISTS` is true when the subquery returns at least one row — it stops at the first match.

```sql
-- Departments that have at least one employee → Engineering, Sales
SELECT d.dept_name
FROM departments d
WHERE EXISTS (SELECT 1 FROM employees e WHERE e.dept_id = d.dept_id);

-- Departments with no employees → HR
SELECT d.dept_name
FROM departments d
WHERE NOT EXISTS (SELECT 1 FROM employees e WHERE e.dept_id = d.dept_id);
```

### IN vs EXISTS vs JOIN

| | `IN` | `EXISTS` | `JOIN` |
|---|---|---|---|
| Semantics | value in a list | at least one matching row | combines rows (may duplicate) |
| NULL trap | `NOT IN` returns nothing if the list contains NULL | safe | — |
| Performance | modern optimizers often rewrite these into the same semi-join plan | | |

```sql
-- ⚠ Returns NO rows, because employees.dept_id contains a NULL (Zoya)
SELECT dept_name FROM departments WHERE dept_id NOT IN (SELECT dept_id FROM employees);
-- ✅ Use NOT EXISTS instead → HR
```

## Derived tables (subqueries in FROM)

```sql
SELECT t.dept_id, t.avg_sal
FROM (
    SELECT dept_id, AVG(salary) AS avg_sal
    FROM employees
    GROUP BY dept_id
) AS t
WHERE t.avg_sal > 60000;
```

## Common Table Expressions (CTEs)

```sql
WITH dept_stats AS (
    SELECT dept_id, AVG(salary) AS avg_sal, COUNT(*) AS n
    FROM employees
    WHERE dept_id IS NOT NULL
    GROUP BY dept_id
),
ranked AS (
    SELECT e.name, e.dept_id, e.salary,
           DENSE_RANK() OVER (PARTITION BY e.dept_id ORDER BY e.salary DESC) AS r
    FROM employees e
)
SELECT r.name, r.salary, s.avg_sal
FROM ranked r
JOIN dept_stats s ON s.dept_id = r.dept_id
WHERE r.r = 1
ORDER BY r.salary DESC, r.name;
```

| name | salary | avg_sal |
|---|---|---|
| Asha | 90000 | 75000 |
| Karan | 75000 | 75000 |
| Meera | 75000 | 75000 |

CTEs make complex queries read top-to-bottom like steps, and can be referenced multiple times.

## Recursive CTEs

A recursive CTE has an **anchor** query plus a **recursive** query that references the CTE itself, combined with `UNION ALL`.

```sql
-- Org chart: everyone under Asha with their level
WITH RECURSIVE org AS (
    SELECT emp_id, name, manager_id, 0 AS level
    FROM employees
    WHERE manager_id IS NULL                      -- anchor: the CEO
    UNION ALL
    SELECT e.emp_id, e.name, e.manager_id, org.level + 1
    FROM employees e
    JOIN org ON e.manager_id = org.emp_id         -- recursive step
)
SELECT name, level FROM org ORDER BY level, name;
```

| name | level |
|---|---|
| Asha | 0 |
| Meera | 1 |
| Ravi | 1 |
| Karan | 2 |
| Zoya | 2 |

```sql
-- Generate numbers 1..5 (handy for calendars and gaps)
WITH RECURSIVE nums(n) AS (
    SELECT 1
    UNION ALL
    SELECT n + 1 FROM nums WHERE n < 5
)
SELECT n FROM nums;
```

(SQL Server omits the `RECURSIVE` keyword. Always include a termination condition to avoid infinite recursion.)

## Subqueries in UPDATE and DELETE

```sql
-- Give a 5% raise to everyone in Sales
UPDATE employees
SET salary = salary * 1.05
WHERE dept_id = (SELECT dept_id FROM departments WHERE dept_name = 'Sales');

-- Delete employees whose department no longer exists
DELETE FROM employees e
WHERE e.dept_id IS NOT NULL
  AND NOT EXISTS (SELECT 1 FROM departments d WHERE d.dept_id = e.dept_id);
```

> [!INTERVIEW]
> - Correlated vs non-correlated subqueries.
> - EXISTS vs IN, and the `NOT IN` + NULL trap.
> - Second highest salary with a subquery (`MAX(salary) WHERE salary < MAX(salary)`).
> - Recursive CTE for hierarchies (org charts, category trees, graph paths).

> [!REMEMBER]
> Scalar subqueries return one value, IN/ANY/ALL take lists, EXISTS checks for any row, correlated subqueries run per outer row. Prefer NOT EXISTS over NOT IN. Use CTEs for readability and recursive CTEs for trees.
