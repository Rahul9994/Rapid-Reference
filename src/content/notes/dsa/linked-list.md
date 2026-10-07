A linked list is a chain of nodes where each node stores a value and a pointer to the next node. It trades O(1) random access for O(1) insertion/deletion at a known position — and it's an interview favourite because pointer manipulation reveals careful thinking.

## Concept

```diagram Singly linked list
 head
  │
  ▼
 [3|•]──►[7|•]──►[1|•]──►[9|None]
```

```python
class ListNode:
    __slots__ = ("val", "next")
    def __init__(self, val=0, next=None):
        self.val = val
        self.next = next

def build(values):
    dummy = tail = ListNode()
    for v in values:
        tail.next = ListNode(v)
        tail = tail.next
    return dummy.next

def to_list(head):
    out = []
    while head:
        out.append(head.val)
        head = head.next
    return out

print(to_list(build([3, 7, 1, 9])))   # [3, 7, 1, 9]
```

| Operation | Array | Linked list |
|---|---|---|
| Access k-th element | O(1) | O(k) |
| Insert/delete at head | O(n) | O(1) |
| Insert/delete after a known node | O(n) | O(1) |
| Search | O(n) | O(n) |
| Memory | contiguous | extra pointer per node |

## Core intuition

- Draw boxes and arrows. Before rewiring, **save** what you'd otherwise lose (`nxt = cur.next`).
- A **dummy (sentinel) node** before the head removes special cases for inserting/deleting the head.
- **Fast & slow pointers** find middles, detect cycles and locate the n-th node from the end in one pass.

## Important patterns

### 1. Insert and delete

```python
def insert_at_head(head, val):
    return ListNode(val, head)

def delete_value(head, target):
    dummy = ListNode(0, head)
    prev = dummy
    while prev.next:
        if prev.next.val == target:
            prev.next = prev.next.next      # unlink
            break
        prev = prev.next
    return dummy.next

def insert_at(head, k, val):               # insert so the new node is at index k
    dummy = ListNode(0, head)
    prev = dummy
    for _ in range(k):
        if not prev.next:
            break
        prev = prev.next
    prev.next = ListNode(val, prev.next)
    return dummy.next

print(to_list(delete_value(build([1, 2, 3]), 1)), to_list(insert_at(build([1, 3]), 1, 2)))   # [2, 3] [1, 2, 3]
```

### 2. Reverse a linked list (iterative and recursive)

```python
def reverse(head):
    prev, cur = None, head
    while cur:
        nxt = cur.next      # save
        cur.next = prev     # reverse the pointer
        prev, cur = cur, nxt
    return prev

def reverse_rec(head):
    if not head or not head.next:
        return head
    new_head = reverse_rec(head.next)
    head.next.next = head   # the next node points back to me
    head.next = None
    return new_head

print(to_list(reverse(build([1, 2, 3, 4]))), to_list(reverse_rec(build([1, 2, 3]))))   # [4, 3, 2, 1] [3, 2, 1]
```

```diagram One reversal step
 prev   cur   nxt                   prev   cur
  ▼      ▼     ▼                     ▼      ▼
 None   [1]──►[2]──►[3]    ⇒    None◄──[1]  [2]──►[3]
```

### 3. Middle node (fast & slow)

```python
def middle(head):
    slow = fast = head
    while fast and fast.next:
        slow = slow.next
        fast = fast.next.next
    return slow            # for even length: the second middle

print(middle(build([1, 2, 3, 4, 5])).val, middle(build([1, 2, 3, 4])).val)   # 3 3
```

### 4. Cycle detection and cycle start (Floyd)

```python
def detect_cycle(head):
    slow = fast = head
    while fast and fast.next:
        slow, fast = slow.next, fast.next.next
        if slow is fast:                 # they met inside the cycle
            slow = head
            while slow is not fast:      # move both one step: they meet at the start
                slow, fast = slow.next, fast.next
            return slow
    return None
```

Why it works: if the distance from head to the cycle start is `a`, the meeting point is `b` steps into the cycle, and the cycle length is `L`, then `2(a + b) = a + b + kL` → `a = kL − b`. Walking `a` steps from the head and from the meeting point lands both at the start.

### 5. Remove the N-th node from the end (one pass)

```python
def remove_nth_from_end(head, n):
    dummy = ListNode(0, head)
    fast = slow = dummy
    for _ in range(n + 1):
        fast = fast.next                 # gap of n nodes
    while fast:
        fast, slow = fast.next, slow.next
    slow.next = slow.next.next
    return dummy.next

print(to_list(remove_nth_from_end(build([1, 2, 3, 4, 5]), 2)))   # [1, 2, 3, 5]
```

### 6. Merge two sorted lists

```python
def merge_two(a, b):
    dummy = tail = ListNode()
    while a and b:
        if a.val <= b.val:
            tail.next, a = a, a.next
        else:
            tail.next, b = b, b.next
        tail = tail.next
    tail.next = a or b
    return dummy.next

print(to_list(merge_two(build([1, 3, 5]), build([2, 4]))))   # [1, 2, 3, 4, 5]
```

### 7. Palindrome linked list (O(1) extra space)

```python
def is_palindrome(head):
    slow = fast = head
    while fast and fast.next:
        slow, fast = slow.next, fast.next.next
    second = reverse(slow)                # reverse the second half
    first, p = head, second
    ok = True
    while p:
        if first.val != p.val:
            ok = False
            break
        first, p = first.next, p.next
    reverse(second)                       # restore (good manners)
    return ok

print(is_palindrome(build([1, 2, 2, 1])), is_palindrome(build([1, 2, 3])))   # True False
```

### 8. Add two numbers (digits in reverse order)

```python
def add_two_numbers(l1, l2):
    dummy = tail = ListNode()
    carry = 0
    while l1 or l2 or carry:
        s = carry + (l1.val if l1 else 0) + (l2.val if l2 else 0)
        carry, digit = divmod(s, 10)
        tail.next = ListNode(digit)
        tail = tail.next
        l1 = l1.next if l1 else None
        l2 = l2.next if l2 else None
    return dummy.next

print(to_list(add_two_numbers(build([2, 4, 3]), build([5, 6, 4]))))   # [7, 0, 8] (342 + 465 = 807)
```

### 9. Intersection of two lists

```python
def get_intersection(a, b):
    p, q = a, b
    while p is not q:
        p = p.next if p else b      # switch lists at the end: both walk len(a) + len(b)
        q = q.next if q else a
    return p                        # the meeting node, or None
```

### 10. Reverse nodes in k-group

```python
def reverse_k_group(head, k):
    dummy = ListNode(0, head)
    group_prev = dummy
    while True:
        kth = group_prev
        for _ in range(k):
            kth = kth.next
            if not kth:
                return dummy.next          # fewer than k nodes left
        group_next = kth.next
        prev, cur = group_next, group_prev.next
        while cur is not group_next:       # reverse this group
            cur.next, prev, cur = prev, cur, cur.next
        first = group_prev.next
        group_prev.next = kth
        group_prev = first

print(to_list(reverse_k_group(build([1, 2, 3, 4, 5]), 2)))   # [2, 1, 4, 3, 5]
```

### 11. Sort a linked list (merge sort)

```python
def sort_list(head):
    if not head or not head.next:
        return head
    slow, fast = head, head.next          # split: slow stops at the end of the first half
    while fast and fast.next:
        slow, fast = slow.next, fast.next.next
    mid, slow.next = slow.next, None
    return merge_two(sort_list(head), sort_list(mid))

print(to_list(sort_list(build([4, 2, 1, 3]))))   # [1, 2, 3, 4]
```

## Complexity

| Problem | Time | Space |
|---|---|---|
| Traverse / search / length | O(n) | O(1) |
| Reverse (iterative / recursive) | O(n) | O(1) / O(n) |
| Middle, cycle detection, N-th from end | O(n) | O(1) |
| Merge two sorted lists | O(n + m) | O(1) |
| Sort list (merge sort) | O(n log n) | O(log n) recursion |

## Common interview variations

- Reverse list, reverse between positions, reverse in k-groups
- Detect cycle, cycle start, length of loop
- Odd-even list, segregate 0s/1s/2s, add 1 to a number represented as a list
- Rotate list by k, delete middle node, flatten a multilevel list
- Copy list with random pointer (interleave copies, or hash map)

> [!WARNING]
> Typical mistakes:
> - Losing the rest of the list by overwriting `cur.next` before saving it.
> - Not handling empty lists, single nodes, or removing the head — use a dummy node.
> - Comparing nodes with `==` when you mean identity — use `is`.
> - Infinite loops after creating an accidental cycle (forgetting `head.next = None`).

> [!REMEMBER]
> Dummy node for head edge cases, save `next` before rewiring, fast/slow for middle/cycle/N-th from end, reverse with `prev, cur` — draw it before you code it.
