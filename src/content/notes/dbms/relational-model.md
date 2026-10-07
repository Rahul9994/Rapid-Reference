The **relational model** (E. F. Codd, 1970) represents data as **relations** — tables of rows and columns — and manipulates them with a small set of mathematical operators. SQL is built on it.

## Terminology

| Relational term | Everyday term |
|---|---|
| Relation | table |
| Tuple | row / record |
| Attribute | column / field |
| Domain | set of allowed values for an attribute (e.g. integers 0–120) |
| Degree (arity) | number of attributes (columns) |
| Cardinality | number of tuples (rows) |
| Relation schema | `Employee(emp_id, name, dept_id, salary)` |
| Relation instance | the current set of tuples |

## Properties of relations

- Each cell holds an **atomic** value (first normal form).
- Each attribute has a distinct name; values come from its domain.
- **No duplicate tuples** (a relation is a *set*; SQL tables are *multisets* unless constrained).
- The order of rows and columns doesn't matter.

## Integrity constraints

| Constraint | Rule |
|---|---|
| Domain constraint | values must come from the attribute's domain/type |
| Key constraint | candidate keys must be unique |
| **Entity integrity** | primary key attributes can't be NULL |
| **Referential integrity** | a foreign key value must match an existing primary key in the referenced table (or be NULL) |

## Relational algebra

A **procedural** query language: each operator takes relations and returns a relation, so operators compose.

### Fundamental operators

| Operator | Symbol | Meaning | SQL equivalent |
|---|---|---|---|
| Selection | σ<sub>condition</sub>(R) | rows that satisfy a condition | `WHERE` |
| Projection | π<sub>attributes</sub>(R) | chosen columns (removes duplicates) | `SELECT DISTINCT cols` |
| Union | R ∪ S | rows in either (union-compatible) | `UNION` |
| Set difference | R − S | rows in R not in S | `EXCEPT` / `MINUS` |
| Cartesian product | R × S | every combination of rows | `CROSS JOIN` |
| Rename | ρ<sub>new</sub>(R) | rename relation/attributes | `AS` |

### Derived operators

| Operator | Symbol | Meaning |
|---|---|---|
| Intersection | R ∩ S | rows in both = R − (R − S) |
| Natural join | R ⋈ S | combine rows equal on all common attributes |
| Theta join | R ⋈<sub>θ</sub> S | σ<sub>θ</sub>(R × S) |
| Equi-join | R ⋈<sub>R.a = S.b</sub> S | theta join with equality |
| Left/right/full outer join | ⟕ ⟖ ⟗ | keep unmatched rows, pad with NULL |
| Division | R ÷ S | values in R related to **all** values in S |

**Union compatibility**: same number of attributes with compatible domains.

### Examples

Schema: `Employee(eid, name, dept, salary)`, `Dept(dept, location)`

| Query | Relational algebra |
|---|---|
| Employees earning > 50,000 | σ<sub>salary > 50000</sub>(Employee) |
| Names of all employees | π<sub>name</sub>(Employee) |
| Names of employees in Pune | π<sub>name</sub>(σ<sub>location = 'Pune'</sub>(Employee ⋈ Dept)) |
| Departments with no employees | π<sub>dept</sub>(Dept) − π<sub>dept</sub>(Employee) |

```sql
-- Names of employees located in Pune
SELECT e.name
FROM employee e
JOIN dept d ON d.dept = e.dept
WHERE d.location = 'Pune';
```

### Division example

`Enrolled(student, course)` ÷ `Required(course)` → students enrolled in **every** required course.

```sql
-- "students for whom no required course is missing" (double NOT EXISTS)
SELECT DISTINCT e.student
FROM enrolled e
WHERE NOT EXISTS (
    SELECT r.course FROM required r
    WHERE NOT EXISTS (
        SELECT 1 FROM enrolled e2
        WHERE e2.student = e.student AND e2.course = r.course
    )
);

-- equivalent with counting
SELECT student
FROM enrolled
WHERE course IN (SELECT course FROM required)
GROUP BY student
HAVING COUNT(DISTINCT course) = (SELECT COUNT(*) FROM required);
```

## Relational calculus (non-procedural)

- **Tuple relational calculus (TRC)**: `{ t | t ∈ Employee ∧ t.salary > 50000 }`
- **Domain relational calculus (DRC)**: `{ ⟨n⟩ | ∃ e, d, s (⟨e, n, d, s⟩ ∈ Employee ∧ s > 50000) }`

Relational algebra says **how** to compute; relational calculus says **what** to compute. SQL is mostly declarative (calculus-like) but its semantics map to algebra. A language as expressive as relational algebra is called **relationally complete**.

## Codd's rules (highlights)

Codd proposed 12 (+1) rules for a truly relational DBMS. Key ideas: all data represented as values in tables (information rule), guaranteed access via table + key + column, systematic NULL handling, a relational catalog, a comprehensive data sublanguage, view updating, and physical/logical data independence.

> [!INTERVIEW]
> - *Relation, tuple, attribute, degree, cardinality?* — Table, row, column, #columns, #rows.
> - *Entity vs referential integrity?* — PK not NULL vs FK must reference an existing key.
> - *Selection vs projection?* — Filter rows (σ) vs pick columns (π).
> - *Division is used for?* — "for all" queries (students who took every course).

> [!REMEMBER]
> Relations are sets of tuples. σ filters rows, π picks columns, ⋈ combines tables, ∪ / − / ∩ need union-compatible relations, ÷ answers "for all" questions. SQL is the practical face of this algebra.
