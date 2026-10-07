A Binary Search Tree (BST) keeps keys ordered: everything in a node's left subtree is smaller, everything in the right subtree is larger. That ordering turns search into a walk down one path — O(h).

## Concept

```diagram BST property: left < node < right (for every node)
            8
          /   \
         3     10
        / \      \
       1   6      14
          / \    /
         4   7  13

 inorder (left, root, right) → 1 3 4 6 7 8 10 13 14   ← always sorted
```

| Operation | Balanced BST | Skewed BST |
|---|---|---|
| search / insert / delete | O(log n) | O(n) |
| min / max | O(log n) | O(n) |
| inorder (sorted output) | O(n) | O(n) |

```python
class TreeNode:
    def __init__(self, val, left=None, right=None):
        self.val, self.left, self.right = val, left, right

def insert(root, val):
    if not root:
        return TreeNode(val)
    if val < root.val:
        root.left = insert(root.left, val)
    elif val > root.val:
        root.right = insert(root.right, val)
    return root                       # duplicates ignored

def inorder(node):
    return inorder(node.left) + [node.val] + inorder(node.right) if node else []

root = None
for v in [8, 3, 10, 1, 6, 14, 4, 7, 13]:
    root = insert(root, v)
print(inorder(root))   # [1, 3, 4, 6, 7, 8, 10, 13, 14]
```

## Core intuition

At each node you know **which half** can contain the answer — just like binary search. And the inorder traversal of a BST is sorted, which converts many tree questions into sorted-array questions.

## Important patterns

### 1. Search, floor and ceil (iterative)

```python
def search(root, x):
    while root and root.val != x:
        root = root.left if x < root.val else root.right
    return root

def floor_ceil(root, x):
    floor = ceil = None
    while root:
        if root.val == x:
            return x, x
        if x < root.val:
            ceil = root.val           # candidate ceiling, look for a smaller one
            root = root.left
        else:
            floor = root.val          # candidate floor, look for a larger one
            root = root.right
    return floor, ceil

print(search(root, 6).val, floor_ceil(root, 5), floor_ceil(root, 15))   # 6 (4, 6) (14, None)
```

### 2. Delete a node

```python
def delete(root, key):
    if not root:
        return None
    if key < root.val:
        root.left = delete(root.left, key)
    elif key > root.val:
        root.right = delete(root.right, key)
    else:
        if not root.left:
            return root.right             # 0 or 1 child
        if not root.right:
            return root.left
        succ = root.right                 # 2 children: replace with inorder successor
        while succ.left:
            succ = succ.left
        root.val = succ.val
        root.right = delete(root.right, succ.val)
    return root

root = delete(root, 3)
print(inorder(root))   # [1, 4, 6, 7, 8, 10, 13, 14]
```

### 3. Validate a BST (pass down bounds)

```python
def is_valid_bst(node, lo=float("-inf"), hi=float("inf")):
    if not node:
        return True
    if not (lo < node.val < hi):
        return False
    return is_valid_bst(node.left, lo, node.val) and is_valid_bst(node.right, node.val, hi)

bad = TreeNode(5, TreeNode(1), TreeNode(4, TreeNode(3), TreeNode(6)))
print(is_valid_bst(root), is_valid_bst(bad))   # True False
```

> [!WARNING]
> Checking only `left.val < node.val < right.val` is wrong — a node deep in the right subtree must also be greater than *every* ancestor it is right of. Pass bounds (or check that inorder is strictly increasing).

### 4. K-th smallest (inorder with early stop)

```python
def kth_smallest(root, k):
    stack, cur = [], root
    while cur or stack:
        while cur:
            stack.append(cur)
            cur = cur.left
        cur = stack.pop()
        k -= 1
        if k == 0:
            return cur.val
        cur = cur.right

print(kth_smallest(root, 3))   # 6
```

K-th largest: reverse inorder (right, root, left).

### 5. LCA in a BST

```python
def lca_bst(root, p, q):
    while root:
        if p < root.val and q < root.val:
            root = root.left
        elif p > root.val and q > root.val:
            root = root.right
        else:
            return root            # split point

# tree after deleting 3:  8 → (4 → 1, 6 → 7), (10 → 14 → 13)
print(lca_bst(root, 1, 7).val, lca_bst(root, 7, 13).val)   # 4 8
```

### 6. Build a BST from preorder (O(n) with an upper bound)

```python
def bst_from_preorder(preorder):
    i = 0
    def build(bound):
        nonlocal i
        if i == len(preorder) or preorder[i] > bound:
            return None
        node = TreeNode(preorder[i])
        i += 1
        node.left = build(node.val)
        node.right = build(bound)
        return node
    return build(float("inf"))

print(inorder(bst_from_preorder([8, 5, 1, 7, 10, 12])))   # [1, 5, 7, 8, 10, 12]
```

### 7. Sorted array → balanced BST

```python
def sorted_to_bst(nums, lo=0, hi=None):
    if hi is None:
        hi = len(nums) - 1
    if lo > hi:
        return None
    mid = (lo + hi) // 2
    return TreeNode(nums[mid], sorted_to_bst(nums, lo, mid - 1), sorted_to_bst(nums, mid + 1, hi))
```

### 8. BST iterator and two-sum in a BST

```python
class BSTIterator:                         # O(h) memory, amortized O(1) next()
    def __init__(self, root, reverse=False):
        self.stack, self.reverse = [], reverse
        self._push(root)

    def _push(self, node):
        while node:
            self.stack.append(node)
            node = node.right if self.reverse else node.left

    def has_next(self):
        return bool(self.stack)

    def next(self):
        node = self.stack.pop()
        self._push(node.left if self.reverse else node.right)
        return node.val

def two_sum_bst(root, k):
    lo, hi = BSTIterator(root), BSTIterator(root, reverse=True)
    a, b = lo.next(), hi.next()
    while a < b:
        if a + b == k:
            return True
        if a + b < k:
            a = lo.next()
        else:
            b = hi.next()
    return False

print(two_sum_bst(root, 17), two_sum_bst(root, 100))   # True False
```

### 9. Recover a BST with two swapped nodes

Inorder must be increasing; the swapped nodes are the first and last "drops".

```python
def recover_tree(root):
    first = second = prev = None
    def inorder_visit(node):
        nonlocal first, second, prev
        if not node:
            return
        inorder_visit(node.left)
        if prev and prev.val > node.val:
            if not first:
                first = prev
            second = node
        prev = node
        inorder_visit(node.right)
    inorder_visit(root)
    first.val, second.val = second.val, first.val
```

## Complexity

| Problem | Time | Space |
|---|---|---|
| Search / insert / delete / floor / ceil / LCA | O(h) | O(1) iterative, O(h) recursive |
| Validate, k-th smallest, recover | O(n) / O(h + k) | O(h) |
| Build from preorder / sorted array | O(n) | O(h) |
| BST iterator `next()` | O(1) amortized | O(h) |

## Common interview variations

- Search, insert, delete, floor/ceil, min/max
- Validate BST, k-th smallest/largest, LCA in BST
- Inorder successor/predecessor, BST iterator, two-sum in BST
- Construct BST from preorder, sorted array/list to BST
- Recover BST, largest BST in a binary tree (post-order returning min/max/size)

> [!WARNING]
> Typical mistakes:
> - Validating with only parent–child comparisons.
> - Forgetting to reassign `root.left = insert(...)` in recursive insert/delete.
> - Assuming O(log n) without balance — inserting sorted keys produces a linked list.

> [!REMEMBER]
> Go left if smaller, right if larger. Inorder of a BST is sorted. Validate with bounds. Delete with the inorder successor. Height decides complexity — balanced trees guarantee O(log n).
