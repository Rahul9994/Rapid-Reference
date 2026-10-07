A **trie** (prefix tree) stores strings character by character so that all words sharing a prefix share a path. Prefix lookups cost O(length of the prefix) — independent of how many words are stored.

## Concept

```diagram Trie containing: app, apple, apt, bat
            (root)
           /      \
          a        b
          |        |
          p        a
         / \       |
        p   t*     t*
        |
        *          * = end of a word
        l          app* is marked at the second p
        |
        e*
```

Each node holds:
- `children`: map from character → child node
- `end`: whether a word ends here (optionally a count, or the word itself)
- optional `prefix_count`: how many words pass through this node

## Core intuition

Comparing strings one at a time is slow when you have many queries about **prefixes**. A trie answers "does any word start with `pre`?" by walking `len(pre)` edges.

## Important patterns

### 1. Basic trie: insert, search, starts_with

```python
class TrieNode:
    __slots__ = ("children", "end")
    def __init__(self):
        self.children = {}
        self.end = False

class Trie:
    def __init__(self):
        self.root = TrieNode()

    def insert(self, word):
        node = self.root
        for ch in word:
            node = node.children.setdefault(ch, TrieNode())
        node.end = True

    def _walk(self, s):
        node = self.root
        for ch in s:
            node = node.children.get(ch)
            if node is None:
                return None
        return node

    def search(self, word):
        node = self._walk(word)
        return node is not None and node.end

    def starts_with(self, prefix):
        return self._walk(prefix) is not None

t = Trie()
for w in ["app", "apple", "apt", "bat"]:
    t.insert(w)
print(t.search("app"), t.search("ap"), t.starts_with("ap"), t.starts_with("c"))   # True False True False
```

### 2. Counting words and prefixes (with erase)

```python
class CountNode:
    __slots__ = ("children", "end_count", "prefix_count")
    def __init__(self):
        self.children, self.end_count, self.prefix_count = {}, 0, 0

class CountingTrie:
    def __init__(self):
        self.root = CountNode()

    def insert(self, word):
        node = self.root
        for ch in word:
            node = node.children.setdefault(ch, CountNode())
            node.prefix_count += 1
        node.end_count += 1

    def count_equal(self, word):
        node = self.root
        for ch in word:
            if ch not in node.children:
                return 0
            node = node.children[ch]
        return node.end_count

    def count_prefix(self, prefix):
        node = self.root
        for ch in prefix:
            if ch not in node.children:
                return 0
            node = node.children[ch]
        return node.prefix_count

    def erase(self, word):                    # assumes the word exists
        node = self.root
        for ch in word:
            node = node.children[ch]
            node.prefix_count -= 1
        node.end_count -= 1

ct = CountingTrie()
for w in ["apple", "apple", "apps"]:
    ct.insert(w)
print(ct.count_equal("apple"), ct.count_prefix("app"))   # 2 3
ct.erase("apple")
print(ct.count_equal("apple"), ct.count_prefix("app"))   # 1 2
```

### 3. Longest word with all prefixes present

```python
def longest_complete_word(words):
    t = Trie()
    for w in words:
        t.insert(w)
    def all_prefixes(w):
        node = t.root
        for ch in w:
            node = node.children[ch]
            if not node.end:
                return False
        return True
    best = ""
    for w in words:
        if all_prefixes(w) and (len(w) > len(best) or (len(w) == len(best) and w < best)):
            best = w
    return best

print(longest_complete_word(["n", "ni", "nin", "ninj", "ninja", "ninga"]))   # ninja
```

### 4. Count distinct substrings

Insert every suffix; each new node is a new distinct substring.

```python
def count_distinct_substrings(s):
    root, count = {}, 0
    for i in range(len(s)):
        node = root
        for ch in s[i:]:
            if ch not in node:
                node[ch] = {}
                count += 1
            node = node[ch]
    return count + 1                 # + empty string (as in the Striver formulation)

print(count_distinct_substrings("abab"))   # 8 → a, b, ab, ba, aba, bab, abab + ""
```

### 5. Maximum XOR of two numbers (bitwise trie)

Store numbers bit by bit from the most significant bit; greedily walk the **opposite** bit to maximise XOR.

```python
def find_maximum_xor(nums, bits=31):
    root = {}
    for x in nums:
        node = root
        for b in range(bits, -1, -1):
            node = node.setdefault((x >> b) & 1, {})
    best = 0
    for x in nums:
        node, cur = root, 0
        for b in range(bits, -1, -1):
            bit = (x >> b) & 1
            want = 1 - bit
            if want in node:
                cur |= 1 << b
                node = node[want]
            else:
                node = node[bit]
        best = max(best, cur)
    return best

print(find_maximum_xor([3, 10, 5, 25, 2, 8]))   # 28 → 5 ^ 25
```

### 6. Autocomplete (collect words under a prefix)

```python
def autocomplete(trie, prefix, limit=5):
    node = trie._walk(prefix)
    out = []
    def dfs(n, path):
        if len(out) >= limit:
            return
        if n.end:
            out.append(prefix + path)
        for ch in sorted(n.children):
            dfs(n.children[ch], path + ch)
    if node:
        dfs(node, "")
    return out

print(autocomplete(t, "ap"))   # ['app', 'apple', 'apt']
```

### 7. Word search II (trie + grid backtracking)

Insert all words, then DFS from each cell, following trie edges — this prunes paths that match no word's prefix.

```python
def find_words(board, words):
    root = {}
    for w in words:
        node = root
        for ch in w:
            node = node.setdefault(ch, {})
        node["$"] = w
    R, C, found = len(board), len(board[0]), set()
    def dfs(r, c, node):
        ch = board[r][c]
        nxt = node.get(ch)
        if not nxt:
            return
        if "$" in nxt:
            found.add(nxt["$"])
        board[r][c] = "#"
        for nr, nc in ((r + 1, c), (r - 1, c), (r, c + 1), (r, c - 1)):
            if 0 <= nr < R and 0 <= nc < C and board[nr][nc] != "#":
                dfs(nr, nc, nxt)
        board[r][c] = ch
    for r in range(R):
        for c in range(C):
            dfs(r, c, root)
    return sorted(found)

board = [list("oaan"), list("etae"), list("ihkr"), list("iflv")]
print(find_words(board, ["oath", "pea", "eat", "rain"]))   # ['eat', 'oath']
```

## Complexity

| Operation | Time | Space |
|---|---|---|
| insert / search / starts_with | O(L) | O(L) new nodes per insert (worst) |
| Build from N words | O(total characters) | O(total characters) |
| Distinct substrings (naive) | O(n²) | O(n²) |
| Max XOR | O(n · bits) | O(n · bits) |

## Common interview variations

- Implement Trie I (insert/search/startsWith) and II (count/erase)
- Longest word with all prefixes, replace words, map sum pairs
- Number of distinct substrings
- Maximum XOR of two numbers, maximum XOR with an element ≤ m (offline + sort)
- Word search II, design search autocomplete, word dictionary with `.` wildcards

> [!WARNING]
> Typical mistakes:
> - Forgetting the end-of-word flag: `search("ap")` returns True just because the path exists.
> - Using a 26-slot array with uppercase/other characters.
> - Recursion depth on very long strings — iterative loops are safer.
> - In bitwise tries, inconsistent bit widths for different numbers.

> [!REMEMBER]
> Trie = shared prefixes. Node = children map + end flag (+ counts). Prefix queries cost O(L). Bitwise trie + greedy opposite bit = maximum XOR.
