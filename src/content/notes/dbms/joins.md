A **join** combines rows from two or more tables based on a related column. Picking the right join type — and understanding what happens to unmatched rows — is one of the most tested SQL skills.

## Sample data

**employees**

| emp_id | name | dept_id | salary | manager_id |
|---|---|---|---|---|
| 1 | Asha | 10 | 90000 | NULL |
| 2 | Ravi | 10 | 60000 | 1 |
| 3 | Meera | 20 | 75000 | 1 |
| 4 | Karan | 20 | 75000 | 3 |
| 5 | Zoya | NULL | 50000 | 3 |

**departments**

| dept_id | dept_name |
|---|---|
| 10 | Engineering |
| 20 | Sales |
| 30 | HR |

Zoya has no department; HR has no employees — perfect for seeing the differences.

```diagram Join types as Venn diagrams (E = employees, D = departments)
 INNER        LEFT          RIGHT         FULL OUTER
 ( E (█) D )  (██E█) D )    ( E (█D██)    (██E██D██)
 matches only  all E +       all D +       everything,
               matches       matches       NULL-padded
```

## INNER JOIN — only matching rows

```sql
SELECT e.name, d.dept_name
FROM employees e
INNER JOIN departments d ON e.dept_id = d.dept_id;
```

| name | dept_name |
|---|---|
| Asha | Engineering |
| Ravi | Engineering |
| Meera | Sales |
| Karan | Sales |

## LEFT (OUTER) JOIN — all rows from the left table

```sql
SELECT e.name, d.dept_name
FROM employees e
LEFT JOIN departments d ON e.dept_id = d.dept_id;
```

| name | dept_name |
|---|---|
| Asha | Engineering |
| Ravi | Engineering |
| Meera | Sales |
| Karan | Sales |
| Zoya | NULL |

**Anti-join** — rows with no match (employees without a department):

```sql
SELECT e.name
FROM employees e
LEFT JOIN departments d ON e.dept_id = d.dept_id
WHERE d.dept_id IS NULL;          -- → Zoya
```

## RIGHT (OUTER) JOIN — all rows from the right table

```sql
SELECT e.name, d.dept_name
FROM employees e
RIGHT JOIN departments d ON e.dept_id = d.dept_id;
```

| name | dept_name |
|---|---|
| Asha | Engineering |
| Ravi | Engineering |
| Meera | Sales |
| Karan | Sales |
| NULL | HR |

A right join is just a left join with the tables swapped — most people write LEFT joins consistently.

## FULL OUTER JOIN — all rows from both

```sql
SELECT e.name, d.dept_name
FROM employees e
FULL OUTER JOIN departments d ON e.dept_id = d.dept_id;
```

| name | dept_name |
|---|---|
| Asha | Engineering |
| Ravi | Engineering |
| Meera | Sales |
| Karan | Sales |
| Zoya | NULL |
| NULL | HR |

MySQL has no FULL OUTER JOIN — emulate it with `LEFT JOIN … UNION … RIGHT JOIN`.

## CROSS JOIN — Cartesian product

```sql
SELECT e.name, d.dept_name FROM employees e CROSS JOIN departments d;   -- 5 × 3 = 15 rows
```

Useful for generating combinations (all sizes × all colours, calendar × stores).

## SELF JOIN — a table joined with itself

Employee → manager:

```sql
SELECT e.name AS employee, m.name AS manager
FROM employees e
LEFT JOIN employees m ON e.manager_id = m.emp_id;
```

| employee | manager |
|---|---|
| Asha | NULL |
| Ravi | Asha |
| Meera | Asha |
| Karan | Meera |
| Zoya | Meera |

Employees earning more than their manager:

```sql
SELECT e.name
FROM employees e
JOIN employees m ON e.manager_id = m.emp_id
WHERE e.salary > m.salary;          -- → none in this data (Karan = Meera = 75000)
```

## NATURAL JOIN and USING

```sql
SELECT name, dept_name FROM employees NATURAL JOIN departments;    -- joins on ALL same-named columns
SELECT name, dept_name FROM employees JOIN departments USING (dept_id);
```

> [!WARNING]
> `NATURAL JOIN` silently changes behaviour if someone adds a column with a matching name (e.g. `created_at`) — prefer explicit `ON` or `USING`.

## ON vs WHERE with outer joins

```sql
-- Keeps ALL employees; department info only for Sales
SELECT e.name, d.dept_name
FROM employees e
LEFT JOIN departments d ON e.dept_id = d.dept_id AND d.dept_name = 'Sales';

-- Filters AFTER the join → behaves like an INNER JOIN on Sales
SELECT e.name, d.dept_name
FROM employees e
LEFT JOIN departments d ON e.dept_id = d.dept_id
WHERE d.dept_name = 'Sales';
```

Conditions on the **right table** of a LEFT JOIN belong in `ON` if you want to keep unmatched left rows.

## Joining more than two tables

```sql
SELECT s.name, c.title, en.grade
FROM enrollment en
JOIN students s ON s.student_id = en.student_id
JOIN courses  c ON c.course_id  = en.course_id
WHERE c.credits >= 3;
```

## Join algorithms (how the DBMS executes joins)

| Algorithm | How | Good when |
|---|---|---|
| Nested loop | for each outer row, scan/index-lookup inner | small inputs or an index on the inner join column |
| Hash join | build a hash table on the smaller input, probe with the other | large unsorted inputs, equality joins |
| Sort-merge join | sort both on the key, merge | inputs already sorted / range joins |

Use `EXPLAIN` (or `EXPLAIN ANALYZE`) to see which one the optimizer chose.

## Counting rows after joins

| Join | Row count |
|---|---|
| INNER | number of matching pairs |
| LEFT | ≥ rows in left table |
| RIGHT | ≥ rows in right table |
| FULL | ≥ max(left, right) |
| CROSS | left × right |

One-to-many joins **multiply** rows — be careful when aggregating after a join (double counting).

> [!INTERVIEW]
> - Difference between INNER, LEFT, RIGHT, FULL and CROSS joins (draw the Venn diagram).
> - Find rows in A with no match in B: LEFT JOIN … WHERE b.key IS NULL, or NOT EXISTS.
> - Self join use cases: employee–manager hierarchies, comparing rows within a table.
> - Filtering an outer join in WHERE vs ON.

> [!REMEMBER]
> INNER = matches only; LEFT/RIGHT = keep one side, NULL-pad the other; FULL = keep both; CROSS = all pairs; SELF = table with itself via aliases. Put right-table filters of a LEFT JOIN in ON.
