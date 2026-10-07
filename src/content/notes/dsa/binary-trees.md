A binary tree is a hierarchy where each node has at most two children. Nearly every tree problem is a traversal plus a small amount of work per node — the art is deciding **what each recursive call returns**.

## Concept

```diagram Binary tree terminology
              1          ← root (depth 0)
            /   \
           2     3       ← internal nodes
          / \     \
         4   5     6     ← leaves (no children)

 height = 2 (edges on the longest root→leaf path)
 subtree rooted at 2 = {2, 4, 5}
```

```python
class TreeNode:
    __slots__ = ("val", "left", "right")
    def __init__(self, val=0, left=None, right=None):
        self.val, self.left, self.right = val, left, right

def build_tree(values):
    """Build from level order with None for missing nodes, e.g. [1, 2, 3, None, 5]."""
    if not values or values[0] is None:
        return None
    root = TreeNode(values[0])
    queue, i = [root], 1
    for node in queue:                       # a list may grow while a for-loop walks it
        if i >= len(values):
            break
        if values[i] is not None:
            node.left = TreeNode(values[i])
            queue.append(node.left)
        i += 1
        if i < len(values) and values[i] is not None:
            node.right = TreeNode(values[i])
            queue.append(node.right)
        i += 1
    return root

root = build_tree([1, 2, 3, 4, 5, None, 6])
```

| Type | Property |
|---|---|
| Full | every node has 0 or 2 children |
| Complete | all levels full except possibly the last, filled left to right (heaps) |
| Perfect | all internal nodes have 2 children, all leaves at the same depth: 2^(h+1) − 1 nodes |
| Balanced | heights of subtrees differ by at most 1 everywhere → height O(log n) |
| Degenerate | each node has one child → behaves like a linked list (height n − 1) |

## Core intuition

Ask: **what information does a node need from its children?** Then write a post-order function that returns exactly that (height, sum, whether balanced, …). If information flows from parent to child (depth, path so far), pass it as an argument (pre-order).

## Important patterns

### 1. DFS traversals (recursive)

```python
def preorder(node):   # root, left, right
    return [node.val] + preorder(node.left) + preorder(node.right) if node else []

def inorder(node):    # left, root, right
    return inorder(node.left) + [node.val] + inorder(node.right) if node else []

def postorder(node):  # left, right, root
    return postorder(node.left) + postorder(node.right) + [node.val] if node else []

print(preorder(root), inorder(root), postorder(root))
```

```output
[1, 2, 4, 5, 3, 6] [4, 2, 5, 1, 3, 6] [4, 5, 2, 6, 3, 1]
```

> [!TIP]
> List concatenation is fine for explanation, but in interviews append to a shared result list to stay O(n).

### 2. Iterative traversals with a stack

```python
def inorder_iter(root):
    res, stack, cur = [], [], root
    while cur or stack:
        while cur:                 # go as left as possible
            stack.append(cur)
            cur = cur.left
        cur = stack.pop()
        res.append(cur.val)
        cur = cur.right
    return res

def preorder_iter(root):
    res, stack = [], [root] if root else []
    while stack:
        node = stack.pop()
        res.append(node.val)
        if node.right: stack.append(node.right)   # right first so left is processed first
        if node.left: stack.append(node.left)
    return res

def postorder_iter(root):              # reverse of (root, right, left)
    res, stack = [], [root] if root else []
    while stack:
        node = stack.pop()
        res.append(node.val)
        if node.left: stack.append(node.left)
        if node.right: stack.append(node.right)
    return res[::-1]

print(inorder_iter(root), preorder_iter(root), postorder_iter(root))
```

### 3. Level order (BFS)

```python
from collections import deque

def level_order(root):
    if not root:
        return []
    res, q = [], deque([root])
    while q:
        level = []
        for _ in range(len(q)):
            node = q.popleft()
            level.append(node.val)
            if node.left: q.append(node.left)
            if node.right: q.append(node.right)
        res.append(level)
    return res

print(level_order(root))   # [[1], [2, 3], [4, 5, 6]]
```

Zigzag order: reverse every other level. Right side view: last node of each level.

### 4. Height, balance and diameter (post-order returns)

```python
def height(node):
    return 0 if not node else 1 + max(height(node.left), height(node.right))   # nodes on longest path

def is_balanced(root):
    def h(node):                      # returns height, or -1 if unbalanced
        if not node:
            return 0
        lh, rh = h(node.left), h(node.right)
        if lh == -1 or rh == -1 or abs(lh - rh) > 1:
            return -1
        return 1 + max(lh, rh)
    return h(root) != -1

def diameter(root):                   # longest path in EDGES between any two nodes
    best = 0
    def h(node):
        nonlocal best
        if not node:
            return 0
        lh, rh = h(node.left), h(node.right)
        best = max(best, lh + rh)     # path through this node
        return 1 + max(lh, rh)
    h(root)
    return best

print(height(root), is_balanced(root), diameter(root))   # 3 True 4
```

### 5. Maximum path sum (same template)

```python
def max_path_sum(root):
    best = float("-inf")
    def gain(node):
        nonlocal best
        if not node:
            return 0
        left = max(gain(node.left), 0)     # ignore negative branches
        right = max(gain(node.right), 0)
        best = max(best, node.val + left + right)
        return node.val + max(left, right) # a path can extend only one side upward
    gain(root)
    return best

print(max_path_sum(build_tree([-10, 9, 20, None, None, 15, 7])))   # 42
```

### 6. Same tree / symmetric tree

```python
def same(a, b):
    if not a or not b:
        return a is b
    return a.val == b.val and same(a.left, b.left) and same(a.right, b.right)

def symmetric(root):
    def mirror(a, b):
        if not a or not b:
            return a is b
        return a.val == b.val and mirror(a.left, b.right) and mirror(a.right, b.left)
    return mirror(root.left, root.right) if root else True

print(symmetric(build_tree([1, 2, 2, 3, 4, 4, 3])))   # True
```

### 7. Lowest common ancestor

```python
def lca(root, p, q):
    if not root or root.val in (p, q):
        return root
    left, right = lca(root.left, p, q), lca(root.right, p, q)
    if left and right:
        return root            # p and q are in different subtrees
    return left or right

print(lca(root, 4, 5).val, lca(root, 4, 6).val)   # 2 1
```

### 8. Views and vertical order (coordinates)

```python
from collections import defaultdict, deque

def vertical_order(root):
    cols = defaultdict(list)
    q = deque([(root, 0, 0)])                 # node, row, col
    while q:
        node, r, c = q.popleft()
        if node:
            cols[c].append((r, node.val))
            q.append((node.left, r + 1, c - 1))
            q.append((node.right, r + 1, c + 1))
    return [[v for _, v in sorted(cols[c])] for c in sorted(cols)]

def top_view(root):
    first = {}
    q = deque([(root, 0)])
    while q:
        node, c = q.popleft()
        if node:
            first.setdefault(c, node.val)      # first node seen in BFS for each column
            q.append((node.left, c - 1))
            q.append((node.right, c + 1))
    return [first[c] for c in sorted(first)]

print(vertical_order(root), top_view(root))   # [[4], [2], [1, 5], [3], [6]] [4, 2, 1, 3, 6]
```

Bottom view: overwrite instead of `setdefault`. Left view: first node of each level.

### 9. Root-to-leaf paths and path sum

```python
def root_to_leaf_paths(root):
    res, path = [], []
    def dfs(node):
        if not node:
            return
        path.append(node.val)
        if not node.left and not node.right:
            res.append(path[:])
        dfs(node.left); dfs(node.right)
        path.pop()
    dfs(root)
    return res

print(root_to_leaf_paths(root))   # [[1, 2, 4], [1, 2, 5], [1, 3, 6]]
```

### 10. Construct a tree from inorder + preorder

```python
def build_from_pre_in(preorder, inorder):
    index = {v: i for i, v in enumerate(inorder)}
    pre = iter(preorder)
    def go(lo, hi):                      # inorder range [lo, hi]
        if lo > hi:
            return None
        val = next(pre)
        node = TreeNode(val)
        mid = index[val]
        node.left = go(lo, mid - 1)
        node.right = go(mid + 1, hi)
        return node
    return go(0, len(inorder) - 1)

t = build_from_pre_in([3, 9, 20, 15, 7], [9, 3, 15, 20, 7])
print(level_order(t))   # [[3], [9, 20], [15, 7]]
```

### 11. Serialize / deserialize

```python
def serialize(root):
    out = []
    def dfs(node):
        if not node:
            out.append("#")
            return
        out.append(str(node.val))
        dfs(node.left); dfs(node.right)
    dfs(root)
    return ",".join(out)

def deserialize(data):
    vals = iter(data.split(","))
    def build():
        v = next(vals)
        if v == "#":
            return None
        node = TreeNode(int(v))
        node.left, node.right = build(), build()
        return node
    return build()

print(serialize(deserialize(serialize(root))) == serialize(root))   # True
```

### 12. Morris inorder traversal (O(1) space)

```python
def morris_inorder(root):
    res, cur = [], root
    while cur:
        if not cur.left:
            res.append(cur.val)
            cur = cur.right
        else:
            pred = cur.left
            while pred.right and pred.right is not cur:
                pred = pred.right
            if not pred.right:
                pred.right = cur          # thread back to cur
                cur = cur.left
            else:
                pred.right = None         # remove the thread
                res.append(cur.val)
                cur = cur.right
    return res

print(morris_inorder(root))   # [4, 2, 5, 1, 3, 6]
```

## Complexity

| Problem | Time | Space |
|---|---|---|
| Any full traversal | O(n) | O(h) recursion (h = height; O(n) worst, O(log n) balanced) |
| Level order | O(n) | O(w), w = max width |
| Height / diameter / balanced / LCA | O(n) | O(h) |
| Build from traversals (with index map) | O(n) | O(n) |
| Morris traversal | O(n) | O(1) |

## Common interview variations

- Traversals (all three in one pass), level order, zigzag, boundary traversal
- Height, diameter, balanced check, max path sum, same/symmetric tree
- Left/right/top/bottom views, vertical order
- LCA, distance between nodes, nodes at distance K, time to burn the tree
- Children-sum property, count nodes in a complete tree in O(log² n)
- Construct from traversals, serialize/deserialize, flatten to a linked list

> [!WARNING]
> Typical mistakes:
> - Height defined in nodes vs edges — be explicit.
> - Recomputing height inside another recursion (O(n²)) — return it from the same post-order pass.
> - Forgetting the `None` base case.
> - Python recursion limit on skewed trees with 10⁴+ nodes — use iterative traversals.

> [!REMEMBER]
> Decide what each call returns (height, gain, found-node) and compute global answers on the side. Pre-order passes info down, post-order brings info up, BFS handles levels and views.
