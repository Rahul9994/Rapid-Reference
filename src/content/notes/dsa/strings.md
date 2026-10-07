String problems are array problems over characters — plus a few string-specific tools: frequency counting, palindrome expansion and pattern matching (KMP, Z-function, rolling hash).

## Concept

- Python strings are **immutable**: convert to a list for in-place edits, build output with `"".join`.
- Character sets are often small (26 lowercase letters) → a fixed-size array works as a hash map.
- Substring = contiguous; subsequence = order preserved, gaps allowed.

## Core intuition

Most string questions reduce to one of: **count characters**, **compare two pointers**, **grow/shrink a window**, or **match a pattern efficiently**.

## Important patterns

### 1. Frequency counting (anagrams)

```python
from collections import Counter

def is_anagram(s, t):
    return len(s) == len(t) and Counter(s) == Counter(t)

def group_anagrams(words):
    groups = {}
    for w in words:
        key = tuple(sorted(w))            # or a 26-count tuple for O(k) keys
        groups.setdefault(key, []).append(w)
    return list(groups.values())

print(is_anagram("listen", "silent"))
print(group_anagrams(["eat", "tea", "tan", "ate", "nat", "bat"]))
```

```output
True
[['eat', 'tea', 'ate'], ['tan', 'nat'], ['bat']]
```

### 2. Palindromes: two pointers and expand-around-center

```python
def longest_palindrome(s):
    best = ""
    def expand(l, r):
        while l >= 0 and r < len(s) and s[l] == s[r]:
            l -= 1; r += 1
        return s[l + 1:r]
    for i in range(len(s)):
        for cand in (expand(i, i), expand(i, i + 1)):   # odd and even centres
            if len(cand) > len(best):
                best = cand
    return best

print(longest_palindrome("forgeeksskeegfor"))   # geeksskeeg
```

O(n²) time, O(1) extra space. (Manacher's algorithm does it in O(n).)

### 3. Reverse words / clean parsing

```python
def reverse_words(s):
    return " ".join(s.split()[::-1])

def my_atoi(s):
    s = s.lstrip()
    if not s:
        return 0
    sign, i = 1, 0
    if s[0] in "+-":
        sign = -1 if s[0] == "-" else 1
        i = 1
    num = 0
    while i < len(s) and s[i].isdigit():
        num = num * 10 + int(s[i])
        i += 1
    return max(-2**31, min(2**31 - 1, sign * num))   # clamp to 32-bit range

print(reverse_words("  hello   world "), my_atoi("   -42abc"))   # world hello -42
```

### 4. Longest common prefix

```python
def longest_common_prefix(strs):
    if not strs:
        return ""
    lo, hi = min(strs), max(strs)      # lexicographic extremes share the answer
    i = 0
    while i < len(lo) and lo[i] == hi[i]:
        i += 1
    return lo[:i]

print(longest_common_prefix(["flower", "flow", "flight"]))   # fl
```

### 5. Isomorphic strings / bijection maps

```python
def isomorphic(s, t):
    return len(set(s)) == len(set(t)) == len(set(zip(s, t)))

print(isomorphic("egg", "add"), isomorphic("foo", "bar"))   # True False
```

### 6. Pattern matching with KMP (O(n + m))

The **LPS** (longest proper prefix that is also a suffix) table lets us skip re-comparisons after a mismatch.

```python
def build_lps(p):
    lps = [0] * len(p)
    k = 0
    for i in range(1, len(p)):
        while k and p[i] != p[k]:
            k = lps[k - 1]
        if p[i] == p[k]:
            k += 1
        lps[i] = k
    return lps

def kmp_search(text, pat):
    lps, res, k = build_lps(pat), [], 0
    for i, ch in enumerate(text):
        while k and ch != pat[k]:
            k = lps[k - 1]
        if ch == pat[k]:
            k += 1
        if k == len(pat):
            res.append(i - k + 1)
            k = lps[k - 1]
    return res

print(build_lps("aabaaab"), kmp_search("abxabcabcaby", "abcaby"))   # [0, 1, 0, 1, 2, 2, 3] [6]
```

### 7. Z-function

`z[i]` = length of the longest substring starting at `i` that matches a prefix of `s`. Search by running it on `pattern + "$" + text`.

```python
def z_function(s):
    n = len(s)
    z = [0] * n
    l = r = 0
    for i in range(1, n):
        if i < r:
            z[i] = min(r - i, z[i - l])
        while i + z[i] < n and s[z[i]] == s[i + z[i]]:
            z[i] += 1
        if i + z[i] > r:
            l, r = i, i + z[i]
    return z

print(z_function("aabxaab"))   # [0, 1, 0, 0, 3, 1, 0]
```

### 8. Rabin–Karp (rolling hash)

```python
def rabin_karp(text, pat, base=131, mod=(1 << 61) - 1):
    n, m = len(text), len(pat)
    if m > n:
        return []
    high = pow(base, m - 1, mod)
    hp = ht = 0
    for i in range(m):
        hp = (hp * base + ord(pat[i])) % mod
        ht = (ht * base + ord(text[i])) % mod
    res = []
    for i in range(n - m + 1):
        if hp == ht and text[i:i + m] == pat:     # verify to rule out collisions
            res.append(i)
        if i + m < n:
            ht = ((ht - ord(text[i]) * high) * base + ord(text[i + m])) % mod
    return res

print(rabin_karp("ababcabab", "abab"))   # [0, 5]
```

## Complexity

| Technique | Time | Space |
|---|---|---|
| Counter / 26-array frequency | O(n) | O(1)–O(k) |
| Expand around center | O(n²) | O(1) |
| KMP | O(n + m) | O(m) |
| Z-function | O(n + m) | O(n + m) |
| Rabin–Karp | O(n + m) average | O(1) |
| Python `in` / `find` | usually fast in practice | O(1) |

## Common interview variations

- Valid anagram, group anagrams, find all anagrams in a string (sliding window)
- Longest palindromic substring / count palindromic substrings
- Longest substring without repeating characters (sliding window)
- Minimum window substring (sliding window + counts)
- Roman ↔ integer, string to integer (atoi), compare version numbers
- Repeated string match, shortest palindrome (KMP), string rotation (`b in a + a`)

> [!WARNING]
> Typical mistakes:
> - Building strings with `+=` in a loop (quadratic) instead of `"".join`.
> - Forgetting even-length palindromes (`expand(i, i + 1)`).
> - Off-by-one when slicing after expansion (`s[l + 1:r]`).
> - Not verifying substring equality after a rolling-hash match.

> [!REMEMBER]
> Counts for anagrams, expand-around-center for palindromes, sliding window for "longest/shortest substring with…", KMP/Z for exact pattern search, and `s in t + t` for rotations.
