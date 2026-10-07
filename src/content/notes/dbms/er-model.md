The **Entity–Relationship (ER) model** is a high-level, conceptual way to design a database before creating tables: identify the *things* (entities), their *properties* (attributes) and how they're *connected* (relationships).

## Entities and entity sets

- **Entity**: a distinguishable real-world object (a particular student, course, order).
- **Entity set**: a collection of similar entities (all students) → becomes a **table**.
- **Strong entity**: has its own primary key.
- **Weak entity**: can't be identified by its own attributes; depends on an **owner (identifying) entity** via an **identifying relationship**. It has a **partial key (discriminator)**.

> Example: `Dependent(name)` of an `Employee` — dependents are identified by (employee id, dependent name).

## Attributes

| Type | Meaning | Example | ER notation |
|---|---|---|---|
| Simple (atomic) | can't be divided | `age` | oval |
| Composite | made of sub-parts | `name → first, last` | oval with child ovals |
| Single-valued | one value per entity | `dob` | oval |
| **Multivalued** | several values | `phone_numbers` | double oval |
| **Derived** | computed from others | `age` from `dob` | dashed oval |
| Key | uniquely identifies an entity | `student_id` | underlined |
| Stored | physically stored | `dob` | oval |

## Relationships

A **relationship** associates entities: `Student` *enrolls in* `Course`. Relationships can have their own attributes (`grade`, `enrolled_on`).

- **Degree**: number of participating entity sets — unary (recursive, e.g. employee *manages* employee), **binary** (most common), ternary.
- **Role names** clarify recursive relationships (manager / subordinate).

### Cardinality (mapping constraints)

| Cardinality | Meaning | Example |
|---|---|---|
| One-to-one (1:1) | each A relates to at most one B and vice versa | person – passport |
| One-to-many (1:N) | one A relates to many B; each B to one A | department – employees |
| Many-to-one (N:1) | reverse of 1:N | employees – department |
| Many-to-many (M:N) | many A ↔ many B | students – courses |

### Participation

| Type | Meaning | Notation |
|---|---|---|
| **Total** | every entity must participate | double line |
| **Partial** | participation is optional | single line |

Example: every `Loan` must belong to a `Branch` (total), but not every `Customer` has a loan (partial).

```diagram University ER sketch (Chen-style)
 [Student] ──< enrolls >── [Course] ──< taught_by >── [Instructor]
   ID (key)      grade        code (key)                  ID (key)
   name          (rel. attr)  title                        name
   {phones}                   credits
   (age) derived

 [Department] ═══< works_in >─── [Instructor]
   (each instructor works in exactly one department — total participation)
```

## Mapping ER diagrams to tables

| ER construct | Relational mapping |
|---|---|
| Strong entity | table with its attributes; key → PRIMARY KEY |
| Composite attribute | one column per component (`first_name`, `last_name`) |
| Multivalued attribute | **separate table** (`student_phone(student_id, phone)`) |
| Derived attribute | usually not stored (computed in queries/views) |
| Weak entity | table with owner's key + partial key as PRIMARY KEY; FK to owner (`ON DELETE CASCADE`) |
| 1:1 relationship | FK on either side (prefer the total-participation side), UNIQUE |
| 1:N relationship | FK on the **N side** (employee.dept_id) |
| M:N relationship | **junction table** with both FKs as a composite PK + relationship attributes |
| Recursive relationship | FK referencing the same table (`employee.manager_id`) |

```sql
CREATE TABLE student (
    student_id INT PRIMARY KEY,
    first_name VARCHAR(50) NOT NULL,
    last_name  VARCHAR(50),
    dob        DATE
);

CREATE TABLE student_phone (                 -- multivalued attribute
    student_id INT REFERENCES student(student_id) ON DELETE CASCADE,
    phone      VARCHAR(15),
    PRIMARY KEY (student_id, phone)
);

CREATE TABLE course (
    code    VARCHAR(10) PRIMARY KEY,
    title   VARCHAR(100) NOT NULL,
    credits INT CHECK (credits > 0)
);

CREATE TABLE enrollment (                    -- M:N relationship with an attribute
    student_id INT REFERENCES student(student_id),
    code       VARCHAR(10) REFERENCES course(code),
    grade      CHAR(2),
    PRIMARY KEY (student_id, code)
);
```

## Extended ER (EER) features

- **Specialization** (top-down): `Employee` → `Engineer`, `Manager` (subclasses with extra attributes).
- **Generalization** (bottom-up): `Car`, `Truck` → `Vehicle`.
- Constraints: **disjoint** vs **overlapping**; **total** vs **partial** specialization.
- **Aggregation**: treat a relationship as an entity to relate it to another (e.g. `works_on(employee, project)` *monitored by* `manager`).

Mapping options for specialization: one table per class with FKs to the superclass, one table per subclass only, or a single table with a type discriminator column.

> [!INTERVIEW]
> - *Weak entity?* — No full key of its own; identified through an owner entity + partial key.
> - *How do you map an M:N relationship?* — A junction table whose PK combines both foreign keys.
> - *Where does the FK go in 1:N?* — On the "many" side.
> - *Total vs partial participation?* — Mandatory vs optional participation in a relationship.

> [!REMEMBER]
> Entities → tables, attributes → columns, multivalued → separate table, 1:N → FK on the N side, M:N → junction table. Weak entities borrow their owner's key.
