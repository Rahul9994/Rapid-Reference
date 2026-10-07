A `str` is an immutable sequence of Unicode characters. String questions are everywhere in interviews — palindromes, anagrams, parsing — so the method toolbox below is worth memorising.

## Creating strings

```python
a = 'single'
b = "double"
c = """triple-quoted
spans lines"""
raw = r"C:\new\table"         # raw: backslashes are literal (great for regex)
path = "C:\\new"               # escaped backslash
print(len("héllo"), "ab" * 3)  # 5 ababab
```

Common escapes: `\n` newline, `\t` tab, `\\` backslash, `\'` quote, `\u00e9` Unicode.

## Indexing, slicing and immutability

```python
s = "interview"
print(s[0], s[-1], s[2:5], s[::-1])   # i w ter weivretni
# s[0] = "I"  → TypeError: 'str' object does not support item assignment
s = "I" + s[1:]                         # build a new string instead
print(s)                                # Interview
```

## Essential methods

| Method | Example | Result |
|---|---|---|
| `lower()`, `upper()` | `"Ab".lower()` | `'ab'` |
| `strip()`, `lstrip()`, `rstrip()` | `"  hi \n".strip()` | `'hi'` |
| `split(sep=None)` | `"a b  c".split()` | `['a', 'b', 'c']` |
| `split(",")` | `"a,,b".split(",")` | `['a', '', 'b']` |
| `join(it)` | `"-".join(["a", "b"])` | `'a-b'` |
| `replace(a, b)` | `"aaa".replace("a", "b", 2)` | `'bba'` |
| `find(x)` / `index(x)` | `"hello".find("l")` | `2` (`-1` / ValueError if absent) |
| `rfind(x)` | `"hello".rfind("l")` | `3` |
| `count(x)` | `"banana".count("an")` | `2` (non-overlapping) |
| `startswith`, `endswith` | `"file.py".endswith((".py", ".pyw"))` | `True` |
| `isalpha`, `isdigit`, `isalnum`, `isspace` | `"a1".isalnum()` | `True` |
| `title()`, `capitalize()`, `swapcase()` | `"hi there".title()` | `'Hi There'` |
| `zfill(n)` | `"7".zfill(3)` | `'007'` |
| `center`, `ljust`, `rjust` | `"x".center(5, "*")` | `'**x**'` |

## Building strings efficiently

Strings are immutable, so `+=` in a loop may copy the whole string each time — potentially **O(n²)**.

```python
# ❌ potentially quadratic
out = ""
for i in range(5):
    out += str(i)

# ✅ linear
parts = []
for i in range(5):
    parts.append(str(i))
out = "".join(parts)

# ✅ even shorter
out = "".join(str(i) for i in range(5))
print(out)   # 01234
```

> [!NOTE]
> CPython sometimes optimises `s += t` in place when the string has no other references, but don't rely on it — `"".join` is the guaranteed-linear idiom.

## Characters and code points

```python
print(ord("a"), chr(98))            # 97 b
print(ord("c") - ord("a"))          # 2 — letter index
print(chr(ord("a") + 25))           # z

import string
print(string.ascii_lowercase)       # abcdefghijklmnopqrstuvwxyz
print(string.digits, string.punctuation[:5])
```

Frequency array for lowercase letters:

```python
def freq26(s):
    f = [0] * 26
    for ch in s:
        f[ord(ch) - ord("a")] += 1
    return f
```

## Comparing and sorting strings

```python
print("apple" < "banana", "Zebra" < "apple")   # True True (uppercase < lowercase)
print(sorted("dcba"))                           # ['a', 'b', 'c', 'd']
print("".join(sorted("listen")) == "".join(sorted("silent")))   # anagrams → True
print("Hello".casefold() == "hello")            # robust case-insensitive compare
```

## Classic string snippets

```python
def is_palindrome(s):
    cleaned = [c.lower() for c in s if c.isalnum()]
    return cleaned == cleaned[::-1]

print(is_palindrome("A man, a plan, a canal: Panama"))   # True

def reverse_words(s):
    return " ".join(reversed(s.split()))

print(reverse_words("  the sky   is blue "))   # 'blue is sky the'

def compress(s):                                 # "aaabcc" → "a3b1c2"
    from itertools import groupby
    return "".join(f"{ch}{len(list(g))}" for ch, g in groupby(s))

print(compress("aaabcc"))
```

Two-pointer palindrome check without extra memory:

```python
def is_pal(s):
    i, j = 0, len(s) - 1
    while i < j:
        if s[i] != s[j]:
            return False
        i += 1
        j -= 1
    return True
```

## Formatting recap

```python
name, pi = "Ada", 3.14159
print(f"{name!r} {pi:.3f} {42:08b} {7:>3}|")   # 'Ada' 3.142 00101010   7|
```

## Complexity cheatsheet

| Operation | Time |
|---|---|
| `s[i]`, `len(s)` | O(1) |
| slicing `s[i:j]` | O(j − i) |
| `x in s` (substring) | O(n·m) worst, fast in practice |
| `s + t` | O(len(s) + len(t)) |
| `"".join(parts)` | O(total length) |
| `s.split()`, `s.replace()`, `s.lower()` | O(n) |
| `sorted(s)` | O(n log n) |

> [!WARNING]
> - `s.split(" ")` vs `s.split()`: the first keeps empty strings for repeated spaces.
> - `str.replace` returns a new string — `s.replace("a", "b")` alone does nothing to `s`.
> - `"abc".find("z")` returns `-1`, which is a valid *index* (last char) if used blindly!

> [!INTERVIEW]
> - Strings are immutable → use a list of chars or `"".join` to build them.
> - `isalnum()`, `lower()`, two pointers → most palindrome questions.
> - `Counter(s)` or a 26-length array → most anagram questions.

> [!REMEMBER]
> Immutable, so build with `join`; slice with `[::-1]` to reverse; use `ord/chr` for letter math; prefer `split()` without arguments; `find` returns −1, `index` raises.
