Recursion is the foundation for trees, graphs, backtracking and dynamic programming. In DSA terms it's about defining a problem in terms of smaller subproblems and trusting the recursive call.

## Concept

```python
def solve(state):
    if is_base_case(state):
        return base_answer
    smaller = reduce(state)
    return combine(state, solve(smaller))
```

Three questions for every recursive function:

1. **What does the function return** for a given input? (Define it precisely.)
2. **What is the base case?** (Smallest input you can answer directly.)
3. **How do I build the answer** from smaller answers?

## Core intuition: the leap of faith

Don't trace every call. Assume `solve(n − 1)` is correct and only verify that you combine it correctly and that the base case is right — this is mathematical induction.

## Important patterns

### 1. Parameterised vs functional recursion

```python
# Parameterised: carry the answer down as an argument
def sum_param(i, acc):
    if i < 1:
        print(acc)
        return
    sum_param(i - 1, acc + i)

# Functional: return the answer up
def sum_func(n):
    return 0 if n == 0 else n + sum_func(n - 1)

sum_param(5, 0)
print(sum_func(5))
```

```output
15
15
```

### 2. Recursion on arrays/strings with indices (no slicing!)

```python
def reverse_in_place(a, l=0, r=None):
    if r is None:
        r = len(a) - 1
    if l >= r:
        return a
    a[l], a[r] = a[r], a[l]
    return reverse_in_place(a, l + 1, r - 1)

def is_palindrome(s, i=0):
    if i >= len(s) // 2:
        return True
    return s[i] == s[-1 - i] and is_palindrome(s, i + 1)

print(reverse_in_place([1, 2, 3, 4]), is_palindrome("madam"))   # [4, 3, 2, 1] True
```

### 3. Multiple recursive calls

```python
def fib(n):
    return n if n <= 1 else fib(n - 1) + fib(n - 2)   # O(2^n): exponential tree
```

### 4. Subsequences — pick / not pick

Every element is either included or excluded → 2ⁿ subsequences.

```python
def all_subsequences(arr):
    res = []
    def go(i, cur):
        if i == len(arr):
            res.append(cur[:])
            return
        cur.append(arr[i])     # pick
        go(i + 1, cur)
        cur.pop()              # not pick
        go(i + 1, cur)
    go(0, [])
    return res

print(all_subsequences([3, 1, 2]))
```

```output
[[3, 1, 2], [3, 1], [3, 2], [3], [1, 2], [1], [2], []]
```

### 5. Count / any / all subsequences with sum K

```python
def count_subsequences_with_sum(arr, k):
    def go(i, s):
        if i == len(arr):
            return 1 if s == k else 0
        return go(i + 1, s + arr[i]) + go(i + 1, s)    # count = pick + not pick
    return go(0, 0)

def any_subsequence_with_sum(arr, k):
    def go(i, s):
        if i == len(arr):
            return s == k
        return go(i + 1, s + arr[i]) or go(i + 1, s)   # short-circuit: stop at the first
    return go(0, 0)

print(count_subsequences_with_sum([1, 2, 1], 2), any_subsequence_with_sum([5, 9], 3))   # 2 False
```

These three templates (print all / return any / count) appear throughout the A2Z recursion section.

### 6. Generate balanced parentheses

```python
def generate_parentheses(n):
    res = []
    def go(cur, open_, close):
        if len(cur) == 2 * n:
            res.append(cur)
            return
        if open_ < n:
            go(cur + "(", open_ + 1, close)
        if close < open_:
            go(cur + ")", open_, close + 1)
    go("", 0, 0)
    return res

print(generate_parentheses(3))   # ['((()))', '(()())', '(())()', '()(())', '()()()']
```

### 7. Binary strings without consecutive 1s

```python
def binary_strings(n):
    res = []
    def go(s):
        if len(s) == n:
            res.append(s)
            return
        go(s + "0")
        if not s or s[-1] != "1":
            go(s + "1")
    go("")
    return res

print(binary_strings(3))   # ['000', '001', '010', '100', '101']
```

### 8. Fast power (divide and conquer)

```python
def my_pow(x, n):
    if n < 0:
        return 1 / my_pow(x, -n)
    if n == 0:
        return 1
    half = my_pow(x, n // 2)
    return half * half * (x if n % 2 else 1)

print(my_pow(2.0, 10), my_pow(2.0, -2))   # 1024.0 0.25
```

## Complexity

| Pattern | Time | Space (stack) |
|---|---|---|
| Linear recursion (one call, n → n−1) | O(n) | O(n) |
| Halving (n → n/2) | O(log n) | O(log n) |
| Pick / not pick on n items | O(2ⁿ · cost to record) | O(n) |
| Naive Fibonacci | O(2ⁿ) | O(n) |
| Generate parentheses | O(Catalan(n)·n) | O(n) |

## Common interview variations

- Print 1..N / N..1, sum of first N, factorial, reverse array, palindrome check
- Power set, subsequences with sum K, combination sum I/II, subset sums
- Generate parentheses, letter combinations of a phone number
- Count good numbers (fast power + mod), sort a stack / reverse a stack using recursion
- Pow(x, n), atoi using recursion

> [!WARNING]
> Typical mistakes:
> - Slicing (`arr[1:]`) in each call → hidden O(n) per call and O(n²) memory.
> - Appending the shared list `cur` instead of a copy `cur[:]`.
> - Forgetting to undo the choice (`cur.pop()`) before the "not pick" branch.
> - Deep recursion beyond Python's default limit of 1000 frames.

> [!REMEMBER]
> Define what the function returns, nail the base case, trust the smaller call. Subsequence problems = pick / not-pick; "count" sums both branches, "any" short-circuits with `or`.
