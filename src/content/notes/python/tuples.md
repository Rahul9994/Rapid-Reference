A `tuple` is an ordered, **immutable** sequence. Use it for fixed records — coordinates, (key, value) pairs, multiple return values — and anywhere you need a hashable sequence.

## Creating tuples

```python
point = (3, 4)
also_tuple = 3, 4             # parentheses are optional — the comma makes the tuple
single = (5,)                 # trailing comma required!
not_tuple = (5)               # just the int 5
empty = ()
from_list = tuple([1, 2, 3])

print(type(single), type(not_tuple))   # <class 'tuple'> <class 'int'>
```

## Accessing elements

Indexing and slicing work exactly like lists:

```python
t = ("a", "b", "c", "d")
print(t[0], t[-1], t[1:3])   # a d ('b', 'c')
print(t.index("c"), t.count("a"), len(t))   # 2 1 4
```

Tuples have only two methods: `count` and `index`.

## Immutability (and its limits)

```python
t = (1, 2, 3)
# t[0] = 10        → TypeError: 'tuple' object does not support item assignment

nested = (1, [2, 3])
nested[1].append(4)   # allowed: the list inside is mutable
print(nested)         # (1, [2, 3, 4])
```

> [!NOTE]
> A tuple is immutable in the sense that its **references** can't change. If it holds a mutable object, that object can still be modified — and the tuple becomes unhashable.

## Packing and unpacking

```python
person = ("Ada", 36, "London")   # packing
name, age, city = person          # unpacking
print(name, age, city)

a, b = 1, 2
a, b = b, a                       # swap via pack/unpack

head, *tail = (1, 2, 3, 4)        # extended unpacking → tail is a LIST
print(head, tail)                 # 1 [2, 3, 4]

for i, (x, y) in enumerate([(0, 1), (2, 3)]):   # nested unpacking
    print(i, x, y)
```

Functions return multiple values as a tuple:

```python
def min_max(nums):
    return min(nums), max(nums)

lo, hi = min_max([4, 1, 9])
print(lo, hi)   # 1 9
```

## Tuples are hashable → dict keys & set members

```python
grid_cost = {(0, 0): 1, (0, 1): 5}
print(grid_cost[(0, 1)])          # 5

visited = set()
visited.add((2, 3))               # common in BFS on grids
print((2, 3) in visited)          # True
```

Tuples compare **lexicographically**, which is why heaps of tuples work:

```python
import heapq
pq = [(2, "b"), (1, "z"), (1, "a")]
heapq.heapify(pq)
print(heapq.heappop(pq))   # (1, 'a') — ties broken by the 2nd element
```

> [!TIP]
> If ties in a heap could reach non-comparable objects (like nodes), add a counter as a tiebreaker: `(priority, count, node)`.

## namedtuple: readable records

```python
from collections import namedtuple

Point = namedtuple("Point", ["x", "y"])
p = Point(3, 4)
print(p.x, p[1], p)          # 3 4 Point(x=3, y=4)
print(p._replace(x=10))      # Point(x=10, y=4) — returns a new tuple
x, y = p                     # still unpacks like a tuple
```

`typing.NamedTuple` gives the same with type hints:

```python
from typing import NamedTuple

class Edge(NamedTuple):
    u: int
    v: int
    w: int = 1

e = Edge(1, 2)
print(e, e.w)   # Edge(u=1, v=2, w=1) 1
```

## List vs tuple

| | `list` | `tuple` |
|---|---|---|
| Mutable | Yes | No |
| Hashable | No | Yes (if items are hashable) |
| Syntax | `[1, 2]` | `(1, 2)` or `1, 2` |
| Methods | many | `count`, `index` |
| Memory | slightly more (over-allocation) | slightly less |
| Typical use | homogeneous, changing collection | fixed record / heterogeneous fields |

```python
import sys
print(sys.getsizeof([1, 2, 3]), sys.getsizeof((1, 2, 3)))   # e.g. 88 64 (exact sizes vary by version)
```

> [!WARNING]
> - `(5)` is an int. A one-element tuple needs a comma: `(5,)`.
> - `t += (4,)` doesn't modify `t` — it creates a new tuple and rebinds the name.

> [!INTERVIEW]
> - Tuples are immutable and hashable, so they can be dict keys / set elements; lists cannot.
> - Tuple unpacking enables swaps and multiple return values.
> - Tuples compare element by element — handy for sorting and heaps.

> [!REMEMBER]
> The comma makes the tuple. Use tuples for fixed records, as dict/set keys (grid coordinates!), and as heap entries; use `namedtuple` when fields deserve names.
