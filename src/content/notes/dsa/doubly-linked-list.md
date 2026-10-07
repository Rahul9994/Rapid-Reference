A doubly linked list (DLL) gives every node a `prev` and a `next` pointer. That makes deletion of a known node O(1) and enables traversal in both directions — the key ingredient of an LRU cache.

## Concept

```diagram Doubly linked list with sentinel head and tail
 [HEAD] ⇄ [10] ⇄ [20] ⇄ [30] ⇄ [TAIL]
   prev/next pointers in both directions
```

```python
class DNode:
    __slots__ = ("val", "prev", "next")
    def __init__(self, val=0, prev=None, next=None):
        self.val, self.prev, self.next = val, prev, next
```

| Operation | Singly LL | Doubly LL |
|---|---|---|
| Delete a node given only the node | O(n) (need prev) | **O(1)** |
| Insert before a given node | O(n) | **O(1)** |
| Traverse backwards | ✗ | ✓ |
| Memory per node | 1 pointer | 2 pointers |

## Core intuition

Every insertion or deletion updates **four links at most**. With sentinel `head` and `tail` nodes you never have to check for `None` neighbours.

## Important patterns

### 1. A DLL with sentinels

```python
class DoublyLinkedList:
    def __init__(self):
        self.head, self.tail = DNode(), DNode()
        self.head.next, self.tail.prev = self.tail, self.head
        self.size = 0

    def _insert_between(self, node, left, right):
        node.prev, node.next = left, right
        left.next = right.prev = node
        self.size += 1
        return node

    def push_front(self, val):
        return self._insert_between(DNode(val), self.head, self.head.next)

    def push_back(self, val):
        return self._insert_between(DNode(val), self.tail.prev, self.tail)

    def remove(self, node):                  # O(1) — no search needed
        node.prev.next = node.next
        node.next.prev = node.prev
        self.size -= 1
        return node.val

    def pop_front(self):
        return None if self.size == 0 else self.remove(self.head.next)

    def pop_back(self):
        return None if self.size == 0 else self.remove(self.tail.prev)

    def __iter__(self):
        cur = self.head.next
        while cur is not self.tail:
            yield cur.val
            cur = cur.next

dll = DoublyLinkedList()
for v in (2, 3):
    dll.push_back(v)
first = dll.push_front(1)
dll.remove(first)
print(list(dll), dll.pop_back(), list(dll))   # [2, 3] 3 [2]
```

### 2. Reverse a DLL

Swap `prev` and `next` for every node:

```python
def reverse_dll(head):
    cur, new_head = head, None
    while cur:
        cur.prev, cur.next = cur.next, cur.prev
        new_head = cur
        cur = cur.prev            # old next
    return new_head
```

### 3. Delete all occurrences of a key

```python
def delete_all(head, key):
    cur = head
    while cur:
        nxt = cur.next
        if cur.val == key:
            if cur.prev:
                cur.prev.next = cur.next
            else:
                head = cur.next           # deleting the head
            if cur.next:
                cur.next.prev = cur.prev
        cur = nxt
    return head
```

### 4. Pairs with a given sum in a sorted DLL (two pointers from both ends)

```python
def pairs_with_sum(head, tail, target):
    res, l, r = [], head, tail
    while l and r and l is not r and r.next is not l:
        s = l.val + r.val
        if s == target:
            res.append((l.val, r.val))
            l, r = l.next, r.prev
        elif s < target:
            l = l.next
        else:
            r = r.prev
    return res
```

### 5. LRU cache — hash map + DLL (O(1) get/put)

```python
class LRUCache:
    def __init__(self, capacity):
        self.cap = capacity
        self.map = {}                              # key → node
        self.head, self.tail = DNode(), DNode()    # head ⇄ ... ⇄ tail (MRU at the front)
        self.head.next, self.tail.prev = self.tail, self.head

    def _unlink(self, node):
        node.prev.next, node.next.prev = node.next, node.prev

    def _push_front(self, node):
        node.prev, node.next = self.head, self.head.next
        self.head.next.prev = node
        self.head.next = node

    def get(self, key):
        if key not in self.map:
            return -1
        node = self.map[key]
        self._unlink(node)
        self._push_front(node)                     # mark as most recently used
        return node.val[1]

    def put(self, key, value):
        if key in self.map:
            self._unlink(self.map[key])
        node = DNode((key, value))
        self.map[key] = node
        self._push_front(node)
        if len(self.map) > self.cap:
            lru = self.tail.prev                   # least recently used
            self._unlink(lru)
            del self.map[lru.val[0]]

cache = LRUCache(2)
cache.put(1, 1); cache.put(2, 2)
print(cache.get(1))      # 1   (order now: 1, 2)
cache.put(3, 3)          # evicts key 2
print(cache.get(2), cache.get(3))   # -1 3
```

> [!TIP]
> In Python interviews you can mention `collections.OrderedDict` (`move_to_end`, `popitem(last=False)`) gives an LRU cache in a few lines — but be ready to implement the DLL version.

## Complexity

| Operation | Time | Space |
|---|---|---|
| Insert / delete at ends or at a known node | O(1) | O(1) |
| Search by value | O(n) | O(1) |
| Reverse | O(n) | O(1) |
| LRU get / put | O(1) | O(capacity) |

## Common interview variations

- Insert/delete at head, tail, k-th position, before a value
- Reverse a DLL, remove duplicates from a sorted DLL
- Find pairs with given sum in a sorted DLL
- LRU cache, LFU cache (frequency buckets of DLLs)
- Browser history / text editor cursor (two stacks or a DLL)

> [!WARNING]
> Typical mistakes:
> - Updating only `next` and forgetting `prev` (or vice versa).
> - Losing the head when deleting the first node (sentinels avoid this).
> - In LRU, forgetting to remove the evicted key from the hash map.

> [!REMEMBER]
> DLL = O(1) removal of a known node. Sentinel head/tail remove edge cases. LRU cache = dict (key → node) + DLL ordered by recency.
