A **functional dependency (FD)** `X → Y` says: whenever two rows agree on attributes X, they must also agree on Y. FDs are the mathematical foundation of keys and normalization.

## Definition and examples

In `Student(roll_no, name, dept, hod)`:

- `roll_no → name, dept` — a roll number determines one name and department.
- `dept → hod` — each department has one head.
- `name → roll_no` does **not** hold — two students can share a name.

X is the **determinant**, Y is the **dependent**.

| Type | Meaning | Example |
|---|---|---|
| Trivial | Y ⊆ X | `{roll_no, name} → name` |
| Non-trivial | Y ⊄ X | `roll_no → name` |
| Completely non-trivial | X ∩ Y = ∅ | `roll_no → dept` |
| Partial dependency | non-prime attribute depends on **part** of a candidate key | in R(A, B, C) with key AB: `A → C` |
| Transitive dependency | X → Y and Y → Z (Y not a key) gives X → Z | `roll_no → dept → hod` |
| Multivalued dependency (MVD) | X →→ Y: X determines a *set* of Y values independent of other attributes | `course →→ textbook` |

**Prime attribute**: part of some candidate key. **Non-prime attribute**: part of no candidate key.

## Armstrong's axioms

Sound and complete rules for deriving all FDs implied by a set F:

| Rule | Statement |
|---|---|
| **Reflexivity** | if Y ⊆ X then X → Y |
| **Augmentation** | if X → Y then XZ → YZ |
| **Transitivity** | if X → Y and Y → Z then X → Z |

Derived rules:

| Rule | Statement |
|---|---|
| Union | X → Y and X → Z ⇒ X → YZ |
| Decomposition | X → YZ ⇒ X → Y and X → Z |
| Pseudo-transitivity | X → Y and WY → Z ⇒ WX → Z |

## Attribute closure X⁺

X⁺ = all attributes functionally determined by X.

**Algorithm**: start with X; repeatedly, for each FD `A → B` with A ⊆ result, add B; stop when nothing changes.

```python
def closure(attrs, fds):
    """attrs: set of attributes; fds: list of (lhs_set, rhs_set)."""
    result = set(attrs)
    changed = True
    while changed:
        changed = False
        for lhs, rhs in fds:
            if lhs <= result and not rhs <= result:
                result |= rhs
                changed = True
    return result

fds = [({"A"}, {"B"}), ({"B"}, {"C"}), ({"C", "D"}, {"E"})]
print(sorted(closure({"A"}, fds)), sorted(closure({"A", "D"}, fds)))
```

```output
['A', 'B', 'C'] ['A', 'B', 'C', 'D', 'E']
```

Uses of closure:
- **Is X a super key?** → X⁺ contains all attributes.
- **Does X → Y follow from F?** → Y ⊆ X⁺.

## Finding candidate keys

1. Attributes appearing **only on the left** (or in no FD) must be in every key — call them the *core*.
2. Attributes appearing **only on the right** are never in a key.
3. Compute core⁺. If it's all attributes, the core is the only candidate key.
4. Otherwise, add "middle" attributes (appearing on both sides) one at a time, then in pairs…, keeping only **minimal** super keys.

**Example 1**: R(A, B, C, D, E), F = {A → B, B → C, CD → E}
- Only-left / absent from right: A, D → core = AD.
- AD⁺ = {A, D, B, C, E} = all → **candidate key: AD**.

**Example 2**: R(A, B, C, D), F = {AB → C, C → D, D → A}
- B is never on a right side → core = B. B⁺ = {B} — not enough.
- Try B + one middle attribute: AB⁺ = {A, B, C, D} ✅, BC⁺ = {B, C, D, A} ✅, BD⁺ = {B, D, A, C} ✅.
- **Candidate keys: AB, BC, BD** (all minimal). Prime attributes: A, B, C, D.

```python
from itertools import combinations

def candidate_keys(attrs, fds):
    attrs = set(attrs)
    keys = []
    for size in range(1, len(attrs) + 1):
        for combo in combinations(sorted(attrs), size):
            c = set(combo)
            if any(k <= c for k in keys):
                continue                      # not minimal
            if closure(c, fds) == attrs:
                keys.append(c)
    return ["".join(sorted(k)) for k in keys]

print(candidate_keys("ABCD", [({"A", "B"}, {"C"}), ({"C"}, {"D"}), ({"D"}, {"A"})]))   # ['AB', 'BC', 'BD']
```

## Equivalence and minimal (canonical) cover

Two FD sets F and G are **equivalent** if every FD of F follows from G and vice versa (check with closures).

A **minimal cover** is an equivalent set with:
1. single attributes on the right side (decompose),
2. no **extraneous** attributes on left sides,
3. no **redundant** FDs.

**Example**: F = {A → BC, B → C, A → B, AB → C}
1. Decompose: A → B, A → C, B → C, A → B, AB → C → remove duplicate A → B.
2. In AB → C, B is extraneous (A⁺ already contains C) → becomes A → C (duplicate).
3. A → C is redundant (A → B, B → C).
4. **Minimal cover: {A → B, B → C}**.

## Why FDs matter

- Keys are defined by FDs (a key determines every attribute).
- Normal forms are defined by which FDs are allowed (partial, transitive, non-key determinants).
- Decompositions are checked for **lossless join** and **dependency preservation** using FDs.

> [!INTERVIEW]
> - Armstrong's axioms: reflexivity, augmentation, transitivity.
> - How to test if X is a super key: compute X⁺.
> - Partial vs transitive dependency (what 2NF and 3NF remove).
> - Find all candidate keys for a given R and F.

> [!REMEMBER]
> X → Y means equal X forces equal Y. Closure X⁺ answers "what does X determine?" — use it to test keys and implied FDs. Left-only attributes are in every candidate key.
