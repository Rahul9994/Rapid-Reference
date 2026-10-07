**Normalization** organises tables to reduce redundancy and eliminate update anomalies by decomposing them according to functional dependencies.

## The problem: anomalies

Unnormalized table `StudentCourse(roll, name, course, instructor, instructor_phone)`:

| roll | name | course | instructor | instructor_phone |
|---|---|---|---|---|
| 1 | Ada | DBMS | Dr. Rao | 98xxxx11 |
| 1 | Ada | OS | Dr. Iyer | 98xxxx22 |
| 2 | Alan | DBMS | Dr. Rao | 98xxxx11 |

| Anomaly | Example |
|---|---|
| **Insertion** | can't add a new instructor until some student takes their course |
| **Update** | changing Dr. Rao's phone requires updating many rows (miss one → inconsistent) |
| **Deletion** | deleting Alan's only enrollment might lose information about a course/instructor |
| Redundancy | Dr. Rao's phone is stored repeatedly |

## Normal forms at a glance

| NF | Condition (in addition to the previous NF) | Removes |
|---|---|---|
| **1NF** | atomic values; no repeating groups | multi-valued cells |
| **2NF** | no **partial dependency** of a non-prime attribute on part of a candidate key | partial dependencies |
| **3NF** | no **transitive dependency** of a non-prime attribute on a key | transitive dependencies |
| **BCNF** | for every non-trivial FD X → Y, **X is a super key** | all FD-based anomalies |
| 4NF | no non-trivial multivalued dependency unless X is a super key | independent multivalued facts |
| 5NF (PJNF) | no non-trivial join dependency not implied by keys | join dependencies |

Each higher form implies the lower ones: 5NF ⊂ 4NF ⊂ BCNF ⊂ 3NF ⊂ 2NF ⊂ 1NF.

## 1NF — atomic values

❌ Not in 1NF:

| roll | name | phones |
|---|---|---|
| 1 | Ada | 111, 222 |

✅ 1NF — one value per cell (or move phones to a separate table):

| roll | name | phone |
|---|---|---|
| 1 | Ada | 111 |
| 1 | Ada | 222 |

## 2NF — no partial dependencies

`Enrollment(roll, course, name, grade)` with key **(roll, course)** and FDs: `roll → name`, `(roll, course) → grade`.

`name` depends only on `roll` — **part** of the key → violates 2NF.

✅ Decompose:
- `Student(roll, name)`
- `Enrollment(roll, course, grade)`

> [!NOTE]
> A table whose candidate keys are all single attributes is automatically in 2NF.

## 3NF — no transitive dependencies

`Student(roll, name, dept, hod)` with key `roll` and FDs `roll → dept`, `dept → hod`.

`roll → dept → hod` is transitive (`hod` depends on the non-key `dept`) → violates 3NF.

✅ Decompose:
- `Student(roll, name, dept)`
- `Department(dept, hod)`

**Formal 3NF test**: for every non-trivial FD X → A, either **X is a super key** or **A is a prime attribute**.

## BCNF — every determinant is a super key

`TeachCourse(student, course, instructor)` with FDs:
- `(student, course) → instructor`
- `instructor → course` (each instructor teaches one course)

Candidate keys: (student, course) and (student, instructor). All attributes are prime → it's in **3NF**. But `instructor → course` has a determinant that is **not a super key** → violates **BCNF**.

✅ Decompose into `InstructorCourse(instructor, course)` and `StudentInstructor(student, instructor)`. Lossless — but the FD `(student, course) → instructor` is **no longer preserved** in a single table.

> [!IMPORTANT]
> **3NF** decomposition can always be both **lossless** and **dependency-preserving**. **BCNF** decomposition is always lossless but may lose dependency preservation. That's the classic trade-off.

## 4NF — multivalued dependencies

`CourseInfo(course, teacher, book)` where teachers and books for a course are independent:

| course | teacher | book |
|---|---|---|
| DBMS | Rao | Korth |
| DBMS | Rao | Navathe |
| DBMS | Iyer | Korth |
| DBMS | Iyer | Navathe |

`course →→ teacher` and `course →→ book` → every teacher × book combination must be stored. ✅ Split into `CourseTeacher(course, teacher)` and `CourseBook(course, book)`.

## 5NF — join dependencies

A table is in 5NF if it can't be decomposed further into smaller tables without loss, except via candidate keys. Typical example: `(agent, company, product)` where a cyclic business rule makes the three pairwise projections reconstruct the table exactly. Rare in practice.

## Properties of a good decomposition

| Property | Meaning | Test |
|---|---|---|
| **Lossless join** | joining the parts gives back exactly the original (no spurious rows) | R → R1, R2 is lossless if (R1 ∩ R2) → R1 or (R1 ∩ R2) → R2 |
| **Dependency preservation** | every FD can be checked within a single decomposed table | union of projected FDs is equivalent to F |

Example: R(A, B, C) with A → B. Decompose into R1(A, B), R2(A, C): R1 ∩ R2 = A, and A → B means A → R1 ✅ lossless.

## Step-by-step normalization example

R(A, B, C, D, E) with F = {A → B, B → C, AD → E}

1. Candidate key: AD (A, D never on the right; AD⁺ = ABCDE).
2. **2NF?** A → B is a partial dependency (A ⊂ AD, B non-prime) ✗.
   → R1(A, B, C) with A → B, B → C; R2(A, D, E) with AD → E.
3. **3NF?** In R1, A → B → C is transitive ✗.
   → R11(A, B), R12(B, C).
4. Result: **(A, B), (B, C), (A, D, E)** — all in BCNF, lossless and dependency-preserving.

## Denormalization

Sometimes we deliberately **add redundancy** (duplicate columns, precomputed totals, summary tables) to speed up read-heavy workloads and avoid expensive joins — common in analytics and NoSQL. Cost: more storage and harder writes/consistency.

> [!INTERVIEW]
> - Explain 1NF, 2NF, 3NF, BCNF with one example each.
> - 3NF vs BCNF: 3NF allows X → A when A is prime; BCNF requires X to be a super key.
> - Lossless join test and dependency preservation.
> - When would you denormalize? — Read-heavy systems where joins are a bottleneck.

> [!REMEMBER]
> 1NF atomic → 2NF no partial deps → 3NF no transitive deps → BCNF every determinant is a super key. Decompose losslessly; 3NF can always preserve dependencies, BCNF can't always.
