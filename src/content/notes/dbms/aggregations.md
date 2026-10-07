Aggregate functions summarise many rows into one value; `GROUP BY` produces one summary per group; **window functions** compute per-row results over a set of related rows — without collapsing them.

Data: the `employees` / `departments` tables from *SQL Essentials* (5 employees, salaries 90000, 60000, 75000, 75000, 50000; Zoya has no department).

## Aggregate functions

| Function | Returns | NULL handling |
|---|---|---|
| `COUNT(*)` | number of rows | counts all rows |
| `COUNT(col)` | number of non-NULL values | ignores NULLs |
| `COUNT(DISTINCT col)` | number of distinct non-NULL values | ignores NULLs |
| `SUM(col)`, `AVG(col)` | total, mean | ignore NULLs (AVG divides by non-NULL count) |
| `MIN(col)`, `MAX(col)` | smallest, largest | ignore NULLs |

```sql
SELECT COUNT(*) AS rows_, COUNT(dept_id) AS with_dept, COUNT(DISTINCT dept_id) AS depts,
       SUM(salary) AS total, AVG(salary) AS avg_sal, MAX(salary) AS top
FROM employees;
```

| rows_ | with_dept | depts | total | avg_sal | top |
|---|---|---|---|---|---|
| 5 | 4 | 2 | 350000 | 70000 | 90000 |

## GROUP BY

```sql
SELECT dept_id, COUNT(*) AS headcount, AVG(salary) AS avg_salary
FROM employees
GROUP BY dept_id
ORDER BY dept_id;
```

| dept_id | headcount | avg_salary |
|---|---|---|
| NULL | 1 | 50000 |
| 10 | 2 | 75000 |
| 20 | 2 | 75000 |

(NULLs form their own group. Where NULL sorts — first or last — depends on the DBMS.)

> [!IMPORTANT]
> Every column in `SELECT` must either be in `GROUP BY` or wrapped in an aggregate. `SELECT dept_id, name, COUNT(*) ... GROUP BY dept_id` is an error in standard SQL (MySQL allows it only with `ONLY_FULL_GROUP_BY` disabled — and returns an arbitrary name).

## WHERE vs HAVING

| WHERE | HAVING |
|---|---|
| filters **rows** before grouping | filters **groups** after grouping |
| can't use aggregates | usually uses aggregates |
| faster (reduces rows early) | runs on grouped results |

```sql
SELECT d.dept_name, COUNT(*) AS headcount
FROM employees e
JOIN departments d ON d.dept_id = e.dept_id
WHERE e.salary >= 60000            -- row filter
GROUP BY d.dept_name
HAVING COUNT(*) >= 2;              -- group filter
```

| dept_name | headcount |
|---|---|
| Engineering | 2 |
| Sales | 2 |

## Conditional aggregation

```sql
SELECT COUNT(*) FILTER (WHERE salary > 70000)            AS high,     -- PostgreSQL / SQLite
       SUM(CASE WHEN salary <= 70000 THEN 1 ELSE 0 END)  AS not_high  -- portable
FROM employees;
```

| high | not_high |
|---|---|
| 3 | 2 |

## Window functions

`function() OVER (PARTITION BY … ORDER BY … [frame])` — computed per row, rows are **not** collapsed.

### Ranking

```sql
SELECT name, salary,
       ROW_NUMBER() OVER (ORDER BY salary DESC, emp_id) AS row_num,
       RANK()       OVER (ORDER BY salary DESC)         AS rnk,
       DENSE_RANK() OVER (ORDER BY salary DESC)         AS dense_rnk
FROM employees;
```

| name | salary | row_num | rnk | dense_rnk |
|---|---|---|---|---|
| Asha | 90000 | 1 | 1 | 1 |
| Meera | 75000 | 2 | 2 | 2 |
| Karan | 75000 | 3 | 2 | 2 |
| Ravi | 60000 | 4 | 4 | 3 |
| Zoya | 50000 | 5 | 5 | 4 |

| Function | Ties | Gaps after ties |
|---|---|---|
| `ROW_NUMBER()` | unique numbers (arbitrary among ties unless ordered) | — |
| `RANK()` | same rank | **yes** (1, 2, 2, 4) |
| `DENSE_RANK()` | same rank | **no** (1, 2, 2, 3) |
| `NTILE(n)` | splits rows into n buckets | — |

### Partitioned aggregates

```sql
SELECT name, dept_id, salary,
       AVG(salary) OVER (PARTITION BY dept_id)            AS dept_avg,
       salary - AVG(salary) OVER (PARTITION BY dept_id)   AS diff_from_avg,
       SUM(salary) OVER (ORDER BY emp_id)                  AS running_total
FROM employees
ORDER BY emp_id;
```

| name | dept_id | salary | dept_avg | diff_from_avg | running_total |
|---|---|---|---|---|---|
| Asha | 10 | 90000 | 75000 | 15000 | 90000 |
| Ravi | 10 | 60000 | 75000 | -15000 | 150000 |
| Meera | 20 | 75000 | 75000 | 0 | 225000 |
| Karan | 20 | 75000 | 75000 | 0 | 300000 |
| Zoya | NULL | 50000 | 50000 | 0 | 350000 |

### LAG / LEAD and frames

```sql
SELECT emp_id, salary,
       LAG(salary)  OVER (ORDER BY emp_id) AS prev_salary,
       LEAD(salary) OVER (ORDER BY emp_id) AS next_salary,
       AVG(salary)  OVER (ORDER BY emp_id ROWS BETWEEN 1 PRECEDING AND 1 FOLLOWING) AS moving_avg
FROM employees;
```

`LAG`/`LEAD` access neighbouring rows — perfect for "compare with previous day", streaks and gaps. The frame clause (`ROWS BETWEEN …`) defines moving windows.

## Classic interview queries

```sql
-- Highest salary in each department (all ties included)
SELECT name, dept_id, salary
FROM (
    SELECT e.*, DENSE_RANK() OVER (PARTITION BY dept_id ORDER BY salary DESC) AS r
    FROM employees e
) t
WHERE r = 1;

-- Nth highest distinct salary (N = 2) → 75000
SELECT DISTINCT salary
FROM (SELECT salary, DENSE_RANK() OVER (ORDER BY salary DESC) AS r FROM employees) t
WHERE r = 2;

-- Duplicate values (same salary appearing more than once) → 75000
SELECT salary, COUNT(*) AS cnt
FROM employees
GROUP BY salary
HAVING COUNT(*) > 1;

-- Departments whose average salary is above the company average → 10 and 20
SELECT dept_id, AVG(salary) AS avg_sal
FROM employees
WHERE dept_id IS NOT NULL
GROUP BY dept_id
HAVING AVG(salary) > (SELECT AVG(salary) FROM employees);
```

> [!WARNING]
> - `COUNT(col)` skips NULLs — use `COUNT(*)` to count rows.
> - `AVG` ignores NULLs; if NULL should mean 0, use `AVG(COALESCE(col, 0))`.
> - You can't filter on a window function in `WHERE` — wrap it in a subquery/CTE (or use `QUALIFY` where supported).

> [!INTERVIEW]
> - WHERE vs HAVING.
> - RANK vs DENSE_RANK vs ROW_NUMBER.
> - Second/Nth highest salary (DENSE_RANK, or `LIMIT 1 OFFSET n-1` on DISTINCT salaries).
> - GROUP BY vs window functions: collapse rows vs keep rows.

> [!REMEMBER]
> Aggregates collapse rows; GROUP BY makes groups; HAVING filters groups; window functions compute across related rows while keeping every row. COUNT(*) counts rows, COUNT(col) counts non-NULLs.
