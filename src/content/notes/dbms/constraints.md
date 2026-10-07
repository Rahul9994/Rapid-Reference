**Constraints** are rules the DBMS enforces on data, so invalid data can't enter the database no matter which application writes it.

## Types of constraints

| Constraint | Ensures | Example |
|---|---|---|
| `NOT NULL` | a column always has a value | `name VARCHAR(50) NOT NULL` |
| `UNIQUE` | no duplicate values (NULLs usually allowed) | `email VARCHAR(100) UNIQUE` |
| `PRIMARY KEY` | unique + not null row identifier | `id INT PRIMARY KEY` |
| `FOREIGN KEY` | values exist in the referenced table | `REFERENCES dept(dept_id)` |
| `CHECK` | a boolean condition holds for every row | `CHECK (salary > 0)` |
| `DEFAULT` | value used when none is supplied | `status VARCHAR(10) DEFAULT 'active'` |

Plus database-level integrity categories: **domain**, **entity**, **referential**, and **user-defined / business** constraints (via CHECK, triggers or assertions).

## Defining constraints

```sql
CREATE TABLE employee (
    emp_id     INT          PRIMARY KEY,
    name       VARCHAR(80)  NOT NULL,
    email      VARCHAR(120) UNIQUE,
    age        INT          CHECK (age BETWEEN 18 AND 65),
    salary     DECIMAL(10,2) NOT NULL CHECK (salary > 0),
    status     VARCHAR(10)  DEFAULT 'active'
                            CHECK (status IN ('active', 'on_leave', 'exited')),
    dept_id    INT,
    manager_id INT,
    hired_on   DATE         DEFAULT CURRENT_DATE,
    CONSTRAINT fk_emp_dept    FOREIGN KEY (dept_id)    REFERENCES department(dept_id),
    CONSTRAINT fk_emp_manager FOREIGN KEY (manager_id) REFERENCES employee(emp_id),
    CONSTRAINT chk_not_own_manager CHECK (manager_id IS NULL OR manager_id <> emp_id)
);
```

Naming constraints (`CONSTRAINT fk_emp_dept ...`) makes errors readable and lets you drop them later.

## Column-level vs table-level

- **Column-level**: written next to the column; applies to that column.
- **Table-level**: written after the columns; required for multi-column constraints:

```sql
CREATE TABLE enrollment (
    student_id INT,
    course_id  INT,
    semester   VARCHAR(10),
    PRIMARY KEY (student_id, course_id, semester),        -- composite PK
    UNIQUE (student_id, semester, course_id)
);
```

## Adding and removing constraints later

```sql
ALTER TABLE employee ADD CONSTRAINT uq_emp_email UNIQUE (email);
ALTER TABLE employee ADD CONSTRAINT chk_salary CHECK (salary <= 10000000);
ALTER TABLE employee DROP CONSTRAINT chk_salary;           -- PostgreSQL / SQL Server / Oracle
ALTER TABLE employee ALTER COLUMN name SET NOT NULL;       -- PostgreSQL syntax
-- MySQL: ALTER TABLE employee MODIFY name VARCHAR(80) NOT NULL;
```

## NULL semantics (important!)

`NULL` means "unknown / missing", not zero or empty string. SQL uses **three-valued logic** (TRUE, FALSE, UNKNOWN):

| Expression | Result |
|---|---|
| `NULL = NULL` | UNKNOWN (not TRUE!) |
| `NULL <> 5` | UNKNOWN |
| `NULL AND FALSE` | FALSE |
| `NULL AND TRUE` | UNKNOWN |
| `NULL OR TRUE` | TRUE |
| `NOT (NULL = 1)` | UNKNOWN |

- `WHERE` keeps only rows where the condition is **TRUE** → UNKNOWN rows are filtered out.
- `CHECK` **passes** when the condition is TRUE **or UNKNOWN** → `CHECK (age > 18)` accepts NULL ages unless the column is also NOT NULL.
- Test with `IS NULL` / `IS NOT NULL`; replace with `COALESCE(col, default)`.

```sql
SELECT name, COALESCE(phone, 'n/a') AS phone
FROM employee
WHERE manager_id IS NULL;              -- top-level managers
```

> [!WARNING]
> `WHERE dept_id NOT IN (SELECT dept_id FROM x)` returns **no rows** if the subquery yields any NULL (because `val <> NULL` is UNKNOWN). Use `NOT EXISTS` instead.

## Deferrable constraints

Some DBMSs (PostgreSQL, Oracle) let you check constraints at **commit** instead of per statement — useful for circular foreign keys:

```sql
ALTER TABLE a ADD CONSTRAINT fk_ab FOREIGN KEY (b_id) REFERENCES b(id)
    DEFERRABLE INITIALLY DEFERRED;
```

## Constraints vs triggers vs application checks

| Approach | Pros | Cons |
|---|---|---|
| Declarative constraints | fast, always enforced, self-documenting | limited to row-level rules |
| Triggers | arbitrary logic (cross-table rules) | hidden side effects, harder to debug |
| Application code | flexible, user-friendly messages | bypassed by other clients / bugs |

Best practice: enforce invariants in the database **and** validate in the app for good UX.

> [!INTERVIEW]
> - List the SQL constraints: NOT NULL, UNIQUE, PRIMARY KEY, FOREIGN KEY, CHECK, DEFAULT.
> - *Does UNIQUE allow NULL?* — Yes in most DBMSs (multiple NULLs in PostgreSQL/MySQL; one in SQL Server).
> - *Why does `NULL = NULL` not return true?* — Three-valued logic: comparisons with NULL are UNKNOWN.
> - *Entity vs referential integrity?* — PK not null vs FK points to an existing row.

> [!REMEMBER]
> Declare rules in the schema: NOT NULL, UNIQUE, PK, FK, CHECK, DEFAULT. NULL is unknown — use IS NULL, COALESCE and NOT EXISTS. CHECK passes on UNKNOWN, WHERE drops it.
