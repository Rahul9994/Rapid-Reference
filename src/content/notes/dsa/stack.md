A stack is LIFO — last in, first out. In Python a plain `list` is a perfect stack (`append` / `pop` are O(1)). Stacks model nesting, undo history and "the most recent unresolved thing" — which is why the **monotonic stack** pattern is so powerful.

## Concept

```diagram Push and pop happen at the same end (the top)
 push 1, push 2, push 3        pop → 3
 │ 3 │ ← top                  │   │
 │ 2 │                        │ 2 │ ← top
 │ 1 │                        │ 1 │
 └───┘                        └───┘
```

```python
stack = []
stack.append(1)        # push
stack.append(2)
top = stack[-1]        # peek → 2
stack.pop()            # pop → 2
print(stack, not stack)   # [1] False  (empty check)
```

## Core intuition

Use a stack whenever the problem has a **"match with the most recent unmatched item"** structure: brackets, function calls, undo, or "next greater element" (each element waits until something resolves it).

## Important patterns

### 1. Valid parentheses

```python
def is_valid(s):
    pairs = {")": "(", "]": "[", "}": "{"}
    stack = []
    for ch in s:
        if ch in pairs:
            if not stack or stack.pop() != pairs[ch]:
                return False
        else:
            stack.append(ch)
    return not stack

print(is_valid("({[]})"), is_valid("(]"), is_valid("(("))   # True False False
```

### 2. Min stack (O(1) getMin)

```python
class MinStack:
    def __init__(self):
        self.stack = []                    # (value, min so far)

    def push(self, x):
        cur_min = min(x, self.stack[-1][1]) if self.stack else x
        self.stack.append((x, cur_min))

    def pop(self):
        return self.stack.pop()[0]

    def top(self):
        return self.stack[-1][0]

    def get_min(self):
        return self.stack[-1][1]

ms = MinStack()
for x in (5, 3, 7):
    ms.push(x)
print(ms.get_min()); ms.pop(); ms.pop(); print(ms.get_min())   # 3 then 5
```

### 3. Monotonic stack — next greater element

Keep a stack of indices whose next-greater hasn't been found yet; values on the stack are **decreasing**.

```python
def next_greater(nums):
    res = [-1] * len(nums)
    stack = []                              # indices
    for i, x in enumerate(nums):
        while stack and nums[stack[-1]] < x:
            res[stack.pop()] = x            # x resolves everyone smaller
        stack.append(i)
    return res

print(next_greater([4, 5, 2, 10, 8]))      # [5, 10, 10, -1, -1]
```

Variants:
- **Circular array**: loop `i` over `range(2n)` and use `nums[i % n]`.
- **Previous smaller**: scan left to right, pop while `stack top >= x`; the remaining top is the answer.
- **Daily temperatures**: store `i − popped_index` instead of the value.

```python
def daily_temperatures(t):
    res, stack = [0] * len(t), []
    for i, x in enumerate(t):
        while stack and t[stack[-1]] < x:
            j = stack.pop()
            res[j] = i - j
        stack.append(i)
    return res

print(daily_temperatures([73, 74, 75, 71, 69, 72, 76, 73]))   # [1, 1, 4, 2, 1, 1, 0, 0]
```

### 4. Largest rectangle in a histogram

```python
def largest_rectangle(heights):
    stack, best = [], 0                      # indices with increasing heights
    for i, h in enumerate(heights + [0]):    # sentinel 0 flushes the stack
        while stack and heights[stack[-1]] > h:
            height = heights[stack.pop()]
            left = stack[-1] if stack else -1
            best = max(best, height * (i - left - 1))
        stack.append(i)
    return best

print(largest_rectangle([2, 1, 5, 6, 2, 3]))   # 10
```

Maximal rectangle in a binary matrix = this applied to each row's running column heights.

### 5. Sum of subarray minimums (contribution technique)

Each element is the minimum of `left × right` subarrays, where `left`/`right` come from previous-smaller and next-smaller boundaries.

```python
def sum_subarray_mins(arr, mod=10**9 + 7):
    n = len(arr)
    left, right, stack = [0] * n, [0] * n, []
    for i in range(n):                       # previous strictly smaller
        while stack and arr[stack[-1]] > arr[i]:
            stack.pop()
        left[i] = i - stack[-1] if stack else i + 1
        stack.append(i)
    stack = []
    for i in range(n - 1, -1, -1):           # next smaller or equal (avoid double count)
        while stack and arr[stack[-1]] >= arr[i]:
            stack.pop()
        right[i] = stack[-1] - i if stack else n - i
        stack.append(i)
    return sum(a * l * r for a, l, r in zip(arr, left, right)) % mod

print(sum_subarray_mins([3, 1, 2, 4]))   # 17
```

### 6. Asteroid collision

```python
def asteroid_collision(asteroids):
    stack = []
    for a in asteroids:
        alive = True
        while alive and a < 0 and stack and stack[-1] > 0:
            if stack[-1] < -a:
                stack.pop()                  # top explodes, keep checking
            elif stack[-1] == -a:
                stack.pop(); alive = False   # both explode
            else:
                alive = False                # incoming explodes
        if alive:
            stack.append(a)
    return stack

print(asteroid_collision([5, 10, -5]), asteroid_collision([8, -8]), asteroid_collision([10, 2, -5]))
```

```output
[5, 10] [] [10]
```

### 7. Remove K digits (smallest number)

```python
def remove_k_digits(num, k):
    stack = []
    for d in num:
        while k and stack and stack[-1] > d:
            stack.pop(); k -= 1
        stack.append(d)
    stack = stack[:-k] if k else stack
    return "".join(stack).lstrip("0") or "0"

print(remove_k_digits("1432219", 3))   # 1219
```

### 8. Expressions: infix → postfix and evaluation

```python
def infix_to_postfix(expr):
    prec = {"+": 1, "-": 1, "*": 2, "/": 2, "^": 3}
    out, ops = [], []
    for ch in expr.replace(" ", ""):
        if ch.isalnum():
            out.append(ch)
        elif ch == "(":
            ops.append(ch)
        elif ch == ")":
            while ops[-1] != "(":
                out.append(ops.pop())
            ops.pop()
        else:
            while ops and ops[-1] != "(" and (prec[ops[-1]] > prec[ch] or (prec[ops[-1]] == prec[ch] and ch != "^")):
                out.append(ops.pop())
            ops.append(ch)
    while ops:
        out.append(ops.pop())
    return "".join(out)

def eval_postfix(tokens):
    st = []
    for t in tokens:
        if t in "+-*/":
            b, a = st.pop(), st.pop()
            st.append({"+": a + b, "-": a - b, "*": a * b, "/": int(a / b)}[t])
        else:
            st.append(int(t))
    return st[0]

print(infix_to_postfix("a+b*(c^d-e)^(f+g*h)-i"))   # abcd^e-fgh*+^*+i-
print(eval_postfix(["2", "1", "+", "3", "*"]))     # 9
```

`^` is right-associative, so equal precedence doesn't pop for it.

## Complexity

| Problem | Time | Space |
|---|---|---|
| push / pop / peek | O(1) | — |
| Valid parentheses | O(n) | O(n) |
| Monotonic stack problems | O(n) — each index pushed and popped once | O(n) |
| Min stack operations | O(1) | O(n) |

## Common interview variations

- Implement a stack using queues / a queue using stacks
- Next greater element I/II, next smaller, previous smaller, stock span
- Largest rectangle in histogram, maximal rectangle, trapping rain water
- Sum of subarray minimums/ranges, remove K digits, asteroid collision
- Infix/prefix/postfix conversions, evaluate reverse Polish notation, basic calculator
- Celebrity problem

> [!WARNING]
> Typical mistakes:
> - Popping from an empty stack — check `if stack` first.
> - Storing values when you need indices (widths/distances need indices).
> - Strict vs non-strict comparisons in monotonic stacks → wrong handling of duplicates.
> - Forgetting the final flush (use a sentinel like `heights + [0]`).

> [!REMEMBER]
> "Nearest greater/smaller" → monotonic stack of indices, O(n). Brackets and expressions → stack. Track extra info per entry (like the running min) for O(1) queries.
