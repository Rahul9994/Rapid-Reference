Python has two loops: `for` (iterate over any iterable) and `while` (repeat while a condition holds). Mastering `range`, `enumerate`, `zip` and loop `else` makes your solutions shorter and less bug-prone.

## `for` loops iterate over iterables

```python
for ch in "abc":
    print(ch, end=" ")        # a b c

for key in {"x": 1, "y": 2}:  # iterating a dict gives keys
    print(key, end=" ")       # x y
```

### `range(start, stop, step)`

`stop` is **exclusive**. `range` is lazy — it doesn't build a list.

```python
print(list(range(5)))          # [0, 1, 2, 3, 4]
print(list(range(2, 10, 3)))   # [2, 5, 8]
print(list(range(5, 0, -1)))   # [5, 4, 3, 2, 1]
print(list(range(10, 0, -3)))  # [10, 7, 4, 1]
```

| Need | Write |
|---|---|
| indices 0..n-1 | `range(n)` |
| 1..n inclusive | `range(1, n + 1)` |
| n-1 down to 0 | `range(n - 1, -1, -1)` |
| every other index | `range(0, n, 2)` |

## `enumerate` and `zip`

```python
fruits = ["apple", "banana", "cherry"]

for i, fruit in enumerate(fruits):
    print(i, fruit)

for i, fruit in enumerate(fruits, start=1):   # 1-based numbering
    print(i, fruit)

names = ["Ada", "Alan"]
years = [1815, 1912]
for name, year in zip(names, years):
    print(name, year)
```

- `zip` stops at the **shortest** iterable. Use `itertools.zip_longest` to pad, or `zip(a, b, strict=True)` (3.10+) to raise on mismatch.
- `zip(*matrix)` transposes a matrix: `list(zip(*[[1, 2], [3, 4]])) == [(1, 3), (2, 4)]`.

## Iterating in reverse and sorted

```python
nums = [3, 1, 2]
for x in reversed(nums):      # no copy, works on sequences
    print(x, end=" ")         # 2 1 3
for x in sorted(nums):        # new sorted list
    print(x, end=" ")         # 1 2 3
```

## `while` loops

```python
n = 12
steps = 0
while n != 1:                 # Collatz sequence
    n = n // 2 if n % 2 == 0 else 3 * n + 1
    steps += 1
print(steps)                  # 9
```

Python has no `do-while`. Emulate it with `while True` + `break`:

```python
while True:
    cmd = input("> ")
    if cmd == "quit":
        break
```

## `break`, `continue` and `pass`

```python
for x in range(10):
    if x == 7:
        break        # exit the loop entirely
    if x % 2:
        continue     # skip to the next iteration
    print(x, end=" ")  # 0 2 4 6
```

## The loop `else` clause

A loop's `else` runs **only if the loop finished without `break`**. Perfect for search loops:

```python
def is_prime(n):
    if n < 2:
        return False
    for d in range(2, int(n ** 0.5) + 1):
        if n % d == 0:
            break
    else:
        return True     # no divisor found
    return False

print([p for p in range(20) if is_prime(p)])
```

```output
[2, 3, 5, 7, 11, 13, 17, 19]
```

## Nested loops and breaking out

```python
grid = [[1, 2], [3, 4], [5, 6]]
target = 4

found = None
for r, row in enumerate(grid):
    for c, val in enumerate(row):
        if val == target:
            found = (r, c)
            break
    if found:
        break
print(found)   # (1, 1)
```

Cleaner: put the search in a function and `return`.

## Modifying collections while looping

> [!WARNING]
> Never add/remove items from a list (or dict/set) while iterating over it — items get skipped, or you get `RuntimeError: dictionary changed size during iteration`.

```python
nums = [1, 2, 2, 3]
# ❌ for x in nums: if x == 2: nums.remove(x)
nums = [x for x in nums if x != 2]       # ✅ build a new list

d = {"a": 1, "b": 0}
for k in list(d):                        # ✅ iterate over a snapshot of keys
    if d[k] == 0:
        del d[k]
```

## Performance notes

- Prefer built-ins over manual loops: `sum(nums)`, `max(nums)`, `any(...)`, `"".join(parts)`.
- Comprehensions are usually faster than `append` in a loop.
- Hoist repeated attribute lookups out of hot loops: `append = result.append`.

```python
total = sum(x * x for x in range(1, 11))     # 385
```

> [!INTERVIEW]
> - `for ... else` runs `else` when no `break` happened.
> - `range` is lazy and supports `len`, indexing and `in` in O(1).
> - Use `enumerate` instead of `range(len(seq))` when you need both index and value.

> [!REMEMBER]
> `range` excludes `stop`; `enumerate` gives (index, value); `zip` stops at the shortest; loop `else` means "didn't break"; never mutate what you're iterating over.
