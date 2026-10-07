**Keys** identify rows uniquely and link tables together. Knowing the exact differences between super, candidate, primary, alternate, composite and foreign keys is a guaranteed DBMS interview topic.

## Running example

`Student(roll_no, email, aadhaar, name, phone, dept_id)` — where `roll_no`, `email` and `aadhaar` are each unique, and `dept_id` references `Department(dept_id)`.

## Types of keys

| Key | Definition | Example |
|---|---|---|
| **Super key** | any set of attributes that uniquely identifies a row (may contain extra attributes) | `{roll_no}`, `{roll_no, name}`, `{email, phone}` |
| **Candidate key** | a **minimal** super key — remove any attribute and it's no longer unique | `{roll_no}`, `{email}`, `{aadhaar}` |
| **Primary key** | the candidate key chosen to identify rows; **unique + NOT NULL**; one per table | `roll_no` |
| **Alternate key** | candidate keys not chosen as the primary key | `email`, `aadhaar` |
| **Composite key** | a key made of two or more attributes | `(student_id, course_id)` in `Enrollment` |
| **Foreign key** | attribute(s) referencing a primary/unique key of another (or the same) table | `Student.dept_id → Department.dept_id` |
| **Unique key** | unique constraint that (in most DBMSs) allows NULL | `UNIQUE(email)` |
| **Surrogate key** | an artificial key with no business meaning | auto-increment `id`, UUID |
| **Natural key** | a key with real-world meaning | `aadhaar`, `ISBN` |
| Secondary key | attribute(s) used for searching/indexing, not necessarily unique | `name` |

```diagram Relationship between key types
 Super keys ⊇ Candidate keys (minimal super keys) ⊇ { Primary key }
 Alternate keys = Candidate keys − Primary key
```

> [!NOTE]
> Every candidate key is a super key, but not every super key is a candidate key. A table with n attributes has at most 2ⁿ − 1 super keys.

## Primary key vs unique key

| | Primary key | Unique key |
|---|---|---|
| NULLs | not allowed | allowed (usually multiple NULLs; SQL Server allows one) |
| Per table | exactly one | many |
| Purpose | the row's identity, target of foreign keys | enforce uniqueness of other columns |
| Index | clustered by default in MySQL InnoDB / SQL Server | non-clustered |

## Foreign keys and referential actions

```sql
CREATE TABLE department (
    dept_id   INT PRIMARY KEY,
    dept_name VARCHAR(50) UNIQUE NOT NULL
);

CREATE TABLE student (
    roll_no INT PRIMARY KEY,
    email   VARCHAR(100) UNIQUE NOT NULL,      -- alternate key
    aadhaar CHAR(12) UNIQUE,                   -- alternate key
    name    VARCHAR(80) NOT NULL,
    dept_id INT,
    FOREIGN KEY (dept_id) REFERENCES department(dept_id)
        ON DELETE SET NULL                     -- what happens when a department is deleted
        ON UPDATE CASCADE                      -- propagate key changes
);

CREATE TABLE enrollment (
    roll_no   INT REFERENCES student(roll_no) ON DELETE CASCADE,
    course_id VARCHAR(10),
    PRIMARY KEY (roll_no, course_id)           -- composite primary key
);
```

| Action | Effect on child rows when the parent row is deleted/updated |
|---|---|
| `RESTRICT` / `NO ACTION` | reject the operation (default) |
| `CASCADE` | delete/update the child rows too |
| `SET NULL` | set the foreign key to NULL |
| `SET DEFAULT` | set the foreign key to its default value |

A foreign key **can** be NULL (meaning "no related row") and **can** reference the same table (self-referencing, e.g. `employee.manager_id`).

## Finding candidate keys (quick method)

Given functional dependencies, compute **attribute closures** (see *Functional Dependencies*):

- Attributes that never appear on the right side of any FD **must** be in every candidate key.
- If their closure covers all attributes, they form the only candidate key; otherwise add other attributes minimally.

Example: R(A, B, C, D), FDs: A → B, B → C, C → D.
A never appears on a right side → A⁺ = {A, B, C, D} → **A is the only candidate key**.

## Surrogate vs natural keys

| Surrogate | Natural |
|---|---|
| stable, compact, never changes | meaningful, avoids an extra column |
| no business meaning (needs extra unique constraints on real identifiers) | may change (emails!) or be sensitive (Aadhaar, SSN) |
| simple joins | can be wide/composite |

Common practice: surrogate primary key + `UNIQUE` constraints on natural keys.

> [!INTERVIEW]
> - *Super vs candidate key?* — Candidate keys are minimal super keys.
> - *Primary vs unique key?* — PK: one per table, no NULLs; unique: many, NULLs allowed.
> - *Can a foreign key be NULL?* — Yes, unless declared NOT NULL.
> - *Composite key?* — Key of multiple columns, typical for junction tables.

> [!REMEMBER]
> Super ⊇ candidate (minimal) ⊇ primary; the rest are alternate. PK = unique + not null. FK enforces referential integrity with RESTRICT / CASCADE / SET NULL actions.
