**B-trees** and **B+ trees** are balanced multi-way search trees designed for disks: each node fills a disk page and holds many keys, so the tree stays very shallow. Virtually every relational database index is a B+ tree.

## Why not a binary search tree?

Disk (or SSD) access is slow and works in **pages** (e.g. 4–16 KB). A binary tree with a million keys has height ≈ 20 → up to 20 page reads. A B+ tree with ~100–500 keys per node has height **3–4** for millions of rows — and the top levels are usually cached in memory.

| Tree | Fan-out | Height for 10⁶ keys |
|---|---|---|
| Binary search tree (balanced) | 2 | ~20 |
| B+ tree, order 100 | ~100 | ~3 |

## B-tree of order m (properties)

- Every node has at most **m children** and **m − 1 keys**.
- Every internal node (except the root) has at least **⌈m/2⌉ children**.
- The root has at least 2 children (unless it's a leaf).
- All **leaves are at the same level** → perfectly balanced.
- Keys inside a node are sorted; a node with k keys has k + 1 children separating the key ranges.
- Keys **and data pointers** are stored in internal nodes and leaves.

```diagram B-tree of order 3 (max 2 keys per node)
            [ 20 | 40 ]
          /      |      \
   [5 | 10]  [25 | 30]  [50 | 60]
```

## B+ tree (what databases use)

Differences from a B-tree:

| | B-tree | B+ tree |
|---|---|---|
| Data pointers | in internal nodes **and** leaves | **only in leaves** |
| Internal nodes | keys + data | only routing keys → more keys per page, higher fan-out |
| Leaves | not linked | **linked list** (sibling pointers) |
| Range queries | need tree traversal | find the start, then scan the linked leaves |
| Duplicate keys in tree | each key appears once | routing keys repeated in leaves |
| Search cost | may end early in an internal node | always goes to a leaf (uniform cost) |

```diagram B+ tree: routing keys above, all records in linked leaves
                 [ 30 ]
               /        \
         [ 10 | 20 ]    [ 40 | 50 ]
        /    |     \     /    |    \
 [5,8]→[10,15]→[20,25]→[30,35]→[40,45]→[50,55]
   leaves hold keys + row pointers (or rows), linked left → right
```

Range query `WHERE key BETWEEN 15 AND 42`: descend to the leaf containing 15, then follow sibling pointers until passing 42.

## Search

```python
def bplus_search(node, key):
    while not node.is_leaf:
        i = 0
        while i < len(node.keys) and key >= node.keys[i]:
            i += 1                    # child i covers keys in [keys[i-1], keys[i])
        node = node.children[i]
    return key in node.keys           # leaves hold the actual entries
```

Cost: O(log_m n) node visits; each node is one page read.

## Insertion (B+ tree)

1. Find the correct leaf and insert the key in sorted order.
2. If the leaf **overflows** (more than m − 1 keys), **split** it into two halves and **copy** the first key of the right half up into the parent.
3. If the parent overflows, split it too — for internal nodes the middle key is **moved** (not copied) up.
4. If the root splits, create a new root → the tree grows **in height at the top**, keeping all leaves at the same depth.

```diagram Inserting 25 into a full leaf (max 3 keys)
 Before:  parent [ ... 30 ... ]          leaf [10 | 20 | 28]
 Insert 25 → [10 | 20 | 25 | 28] overflows
 Split   → [10 | 20]  [25 | 28],  copy 25 up:  parent [ ... 25 | 30 ... ]
```

## Deletion (B+ tree)

1. Remove the key from its leaf.
2. If the leaf **underflows** (fewer than ⌈(m − 1)/2⌉ keys): **borrow** a key from a sibling (and update the parent's separator) or, if siblings are minimal, **merge** with a sibling and remove the separator from the parent.
3. Underflow can propagate upward; if the root ends up with one child, that child becomes the new root (the tree shrinks).

## Calculating the order (classic exam question)

Block size **B = 4096 bytes**, key size **K = 16 bytes**, child/block pointer **P = 8 bytes**.

Internal node with m children: `m·P + (m − 1)·K ≤ B` → `8m + 16(m − 1) ≤ 4096` → `24m ≤ 4112` → **m = 171**.

Leaf node with n entries (key + 8-byte record pointer) and one next-leaf pointer: `24n + 8 ≤ 4096` → **n = 170**.

How many records can each height index?

| Levels | Records reachable |
|---|---|
| 1 (root is a leaf) | 170 |
| 2 | 171 × 170 ≈ 29 thousand |
| 3 | 171² × 170 ≈ 5 million |
| 4 | 171³ × 170 ≈ 850 million |

So **100 million** records need only **4 levels** — and with the root and second level cached in memory, a lookup costs about 2 disk reads.

## Why B+ trees win for databases

- **Shallow**: few disk reads per lookup.
- **Range scans and ORDER BY**: linked leaves give sequential access.
- **High fan-out**: internal nodes store only keys + pointers.
- **Balanced** under inserts/deletes — predictable O(log n) performance.
- **Good concurrency**: latch-crabbing and B-link trees allow concurrent access.

Hash indexes beat them only for pure equality lookups; LSM trees beat them for write-heavy workloads.

> [!INTERVIEW]
> - B-tree vs B+ tree: data only in leaves + linked leaves → better range queries and fan-out.
> - Why databases don't use binary trees: height (disk reads) and poor page utilisation.
> - What happens on overflow? — split the node and push/copy a key to the parent; the tree grows at the root.
> - Compute the order of a B+ tree from block, key and pointer sizes.

> [!REMEMBER]
> B+ tree = balanced, high fan-out, all data in linked leaves. Search/insert/delete O(log_m n) page reads; splits grow the tree at the root. Order m from `m·P + (m − 1)·K ≤ block size`.
