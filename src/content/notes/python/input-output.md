Reading input and printing output correctly — and quickly — matters in online assessments where large inputs can make a correct solution time out.

## Reading input with `input()`

`input()` reads one line from standard input and **always returns a `str`** (without the trailing newline).

```python
name = input("Your name: ")
age = int(input("Age: "))          # convert explicitly
print(f"{name} is {age}")
```

### Common input patterns

```python
# Two integers on one line: "3 7"
a, b = map(int, input().split())

# A list of integers: "1 2 3 4"
nums = list(map(int, input().split()))

# n lines, each an integer
n = int(input())
values = [int(input()) for _ in range(n)]

# A grid of n rows
grid = [list(map(int, input().split())) for _ in range(n)]

# Characters of a string
chars = list(input().strip())
```

> [!WARNING]
> `input().split()` splits on any whitespace; `input().split(" ")` splits on single spaces and produces empty strings for double spaces. Prefer the no-argument version.

## Fast input for competitive programming

`input()` is slow for 10⁵+ lines. Use `sys.stdin`:

```python
import sys
input = sys.stdin.readline          # shadows built-in: much faster

n = int(input())
arr = list(map(int, input().split()))
s = input().strip()                 # readline keeps '\n' — strip it!
```

Read everything at once for maximum speed:

```python
import sys

def main():
    data = sys.stdin.buffer.read().split()
    n = int(data[0])
    nums = list(map(int, data[1:1 + n]))
    print(sum(nums))

main()
```

> [!TIP]
> Wrapping code in `main()` also helps: local variable lookups are faster than global ones in CPython.

## Printing with `print()`

Signature: `print(*objects, sep=' ', end='\n', file=sys.stdout, flush=False)`

```python
print("a", "b", "c")                 # a b c
print("a", "b", "c", sep="-")        # a-b-c
print("no newline", end="")
print(" ← continued")
print(*[1, 2, 3])                    # unpack: 1 2 3
print(*[1, 2, 3], sep="\n")          # one per line
```

```output
a b c
a-b-c
no newline ← continued
1 2 3
1
2
3
```

### Fast output

Many `print` calls are slow. Build one string and print once:

```python
import sys
results = [str(x * x) for x in range(5)]
sys.stdout.write("\n".join(results) + "\n")
```

## String formatting

### f-strings (preferred, Python 3.6+)

```python
name, score, ratio = "Ada", 97, 0.91234
print(f"{name} scored {score}")
print(f"{ratio:.2f}")        # 0.91 — 2 decimal places
print(f"{ratio:.1%}")        # 91.2% — percentage
print(f"{score:5d}|")        # '   97|' — width 5
print(f"{name:<6}|{name:>6}|{name:^7}|")   # align left/right/center
print(f"{1234567:,}")        # 1,234,567
print(f"{255:b} {255:x} {255:o}")          # binary hex octal
print(f"{score=}")           # self-documenting: score=97 (3.8+)
```

```output
Ada scored 97
0.91
91.2%
   97|
Ada   |   Ada|  Ada  |
1,234,567
11111111 ff 377
score=97
```

### Other styles (you'll see them in older code)

```python
print("{} + {} = {}".format(2, 3, 5))
print("%s is %d years" % ("Ada", 36))
```

## Reading and writing files (preview)

```python
with open("data.txt") as f:
    for line in f:
        print(line.rstrip())
```

See **Python › File Handling** for modes, encodings and JSON/CSV.

> [!INTERVIEW]
> - `input()` always returns a string — convert with `int()`, `float()` or `map`.
> - For big inputs use `sys.stdin.readline` or `sys.stdin.buffer.read()`.
> - `print(*lst)` prints elements separated by spaces.

> [!REMEMBER]
> Read with `map(int, input().split())`, speed up with `sys.stdin`, format with f-strings (`{x:.2f}`, `{x:>5}`), and batch output with `"\n".join(...)`.
