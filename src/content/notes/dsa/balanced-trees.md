A plain BST degrades to O(n) when keys arrive in sorted order. **Self-balancing** BSTs restore O(log n) by rearranging nodes with **rotations** after inserts and deletes. You'll rarely code one in an interview, but you're expected to explain how they work.

## Concept

```diagram Why balance matters — inserting 1, 2, 3, 4 in order
 Plain BST (height 3)          Balanced (height 2)
 1                                  2
  \                               /   \
   2                             1     3
    \                                   \
     3                                   4
      \
       4
```

| Tree | Balance rule | Height bound | Used in |
|---|---|---|---|
| **AVL** | balance factor between −1 and +1 at every node | ≈ 1.44 log₂ n | read-heavy in-memory indexes |
| **Red-Black** | colouring rules (no red-red, equal black height) | ≤ 2 log₂(n + 1) | Java `TreeMap`, C++ `std::map`, Linux scheduler |
| **B / B+ tree** | multi-way nodes, all leaves at the same depth | log_m n | databases, file systems |
| Treap / Splay / Skip list | randomisation or amortisation | expected / amortized O(log n) | specialised uses |

## Core intuition

Balance factor `bf = height(left) − height(right)`. After an insertion, walk back up; the first node with `|bf| = 2` is fixed with one or two **rotations**, which preserve the BST ordering while reducing height.

## Rotations

```diagram Right rotation at y (fixes a left-heavy node)
        y                     x
       / \                  /   \
      x   T3     ──►       T1    y
     / \                        / \
    T1  T2                     T2  T3
 Inorder stays T1 x T2 y T3 — the BST property is preserved.
```

### The four AVL cases

| Case | Imbalance at node z | Fix |
|---|---|---|
| LL | inserted into left subtree of left child | right-rotate(z) |
| RR | inserted into right subtree of right child | left-rotate(z) |
| LR | inserted into right subtree of left child | left-rotate(z.left), then right-rotate(z) |
| RL | inserted into left subtree of right child | right-rotate(z.right), then left-rotate(z) |

## Python implementation: AVL insert

```python
class AVLNode:
    def __init__(self, key):
        self.key = key
        self.left = self.right = None
        self.height = 1

def h(node):
    return node.height if node else 0

def update(node):
    node.height = 1 + max(h(node.left), h(node.right))

def balance_factor(node):
    return h(node.left) - h(node.right)

def rotate_right(y):
    x = y.left
    y.left = x.right
    x.right = y
    update(y); update(x)
    return x

def rotate_left(x):
    y = x.right
    x.right = y.left
    y.left = x
    update(x); update(y)
    return y

def avl_insert(node, key):
    if not node:
        return AVLNode(key)
    if key < node.key:
        node.left = avl_insert(node.left, key)
    elif key > node.key:
        node.right = avl_insert(node.right, key)
    else:
        return node                                  # no duplicates
    update(node)
    bf = balance_factor(node)
    if bf > 1 and key < node.left.key:               # LL
        return rotate_right(node)
    if bf < -1 and key > node.right.key:             # RR
        return rotate_left(node)
    if bf > 1 and key > node.left.key:               # LR
        node.left = rotate_left(node.left)
        return rotate_right(node)
    if bf < -1 and key < node.right.key:             # RL
        node.right = rotate_right(node.right)
        return rotate_left(node)
    return node

def inorder(n):
    return inorder(n.left) + [n.key] + inorder(n.right) if n else []

root = None
for k in range(1, 8):            # sorted input — worst case for a plain BST
    root = avl_insert(root, k)
print(inorder(root), root.key, root.height)   # [1, 2, 3, 4, 5, 6, 7] 4 3
```

Seven sorted inserts produce a **perfect** tree of height 3 rooted at 4, instead of a height-7 chain.

## Red-Black trees in one minute

Rules:

1. Every node is red or black; the root is black.
2. Red nodes have black children (no two reds in a row).
3. Every root-to-null path has the same number of black nodes.

These guarantee the longest path is at most twice the shortest → height ≤ 2 log₂(n + 1). Inserts fix violations with **recolouring** plus at most **2 rotations**; deletes need at most 3 rotations. AVL trees are more strictly balanced (faster lookups), red-black trees do less rebalancing work (faster updates).

## Sorted containers in Python

Python has no built-in balanced BST. Options in interviews and real code:

| Need | Use |
|---|---|
| Sorted list with insert/delete and rank queries | `bisect` on a list (O(n) insert) or third-party `sortedcontainers.SortedList` (≈ O(log n)) |
| Min/max with insert/delete | `heapq` (+ lazy deletion) |
| Ordered map | dict + sorted keys, or `SortedDict` |

```python
import bisect

class SimpleSortedList:
    def __init__(self):
        self.a = []

    def add(self, x):
        bisect.insort(self.a, x)              # O(n) shift, fast in practice

    def remove(self, x):
        i = bisect.bisect_left(self.a, x)
        if i < len(self.a) and self.a[i] == x:
            self.a.pop(i)

    def rank(self, x):                        # number of elements < x
        return bisect.bisect_left(self.a, x)

s = SimpleSortedList()
for x in [5, 1, 4]:
    s.add(x)
print(s.a, s.rank(4))   # [1, 4, 5] 1
```

## Complexity

| Operation | AVL / Red-Black |
|---|---|
| search | O(log n) |
| insert / delete | O(log n) (O(1) rotations for RB, O(log n) for AVL delete) |
| min / max / successor | O(log n) |
| inorder | O(n) |
| space | O(n) |

## Common interview variations

- "What happens if you insert sorted data into a BST?" → degenerates to O(n)
- Explain rotations; identify LL/RR/LR/RL cases on a small example
- AVL vs Red-Black trade-offs
- Check if a binary tree is height-balanced (O(n) post-order)
- Why databases use B+ trees instead of binary trees (disk pages, fan-out)

> [!WARNING]
> Typical mistakes:
> - Forgetting to update heights bottom-up after a rotation (update the lower node first).
> - Mixing up LR vs RL — decide by the path from the unbalanced node to the inserted key.
> - Claiming Python's `dict` is a balanced tree — it's a hash table (unordered by key).

> [!REMEMBER]
> Balanced BSTs keep height O(log n) via rotations. AVL: |bf| ≤ 1, four rotation cases. Red-Black: colour rules, fewer rotations. Databases use B+ trees for high fan-out on disk.
