Regular expressions describe text patterns. Python's `re` module handles validation, extraction and substitution — useful in parsing questions and practical coding rounds.

## The core functions

```python
import re

text = "Order #42 shipped on 2026-10-07, order #7 pending"

print(re.search(r"#(\d+)", text).group(1))    # '42' — first match anywhere
print(re.match(r"Order", text) is not None)    # True — match only at the START
print(re.fullmatch(r"\d{4}", "2026"))          # whole string must match
print(re.findall(r"#(\d+)", text))             # ['42', '7'] — all matches (groups)
print(re.sub(r"#\d+", "#<id>", text))          # replace
print(re.split(r"[,\s]+", "a, b  c,d"))        # ['a', 'b', 'c', 'd']
```

| Function | Returns |
|---|---|
| `re.search(p, s)` | first `Match` anywhere, or `None` |
| `re.match(p, s)` | `Match` only at the beginning, or `None` |
| `re.fullmatch(p, s)` | `Match` if the entire string matches |
| `re.findall(p, s)` | list of strings (or tuples of groups) |
| `re.finditer(p, s)` | iterator of `Match` objects |
| `re.sub(p, repl, s)` | new string with replacements |
| `re.split(p, s)` | list split by the pattern |
| `re.compile(p)` | reusable `Pattern` object |

> [!TIP]
> Always use **raw strings** (`r"\d+"`) for patterns so backslashes reach the regex engine untouched.

## Pattern syntax cheatsheet

| Token | Matches |
|---|---|
| `.` | any char except newline |
| `\d` / `\D` | digit / non-digit |
| `\w` / `\W` | word char `[A-Za-z0-9_]` (plus Unicode letters) / non-word |
| `\s` / `\S` | whitespace / non-whitespace |
| `[abc]`, `[a-z]`, `[^0-9]` | character class, range, negation |
| `^` / `$` | start / end of string (or line with `re.M`) |
| `\b` | word boundary |
| `*`, `+`, `?` | 0+, 1+, 0 or 1 |
| `{n}`, `{n,}`, `{n,m}` | exact / at least / range repeats |
| `a\|b` | alternation |
| `( … )` | capturing group |
| `(?: … )` | non-capturing group |
| `(?P<name> … )` | named group |
| `(?= … )`, `(?! … )` | lookahead / negative lookahead |
| `(?<= … )`, `(?<! … )` | lookbehind / negative lookbehind |

## Groups

```python
m = re.search(r"(?P<year>\d{4})-(?P<month>\d{2})-(?P<day>\d{2})", "due 2026-10-07")
print(m.group(0))            # '2026-10-07' — whole match
print(m.group(1), m["month"], m.group("day"))   # 2026 10 07
print(m.groupdict())         # {'year': '2026', 'month': '10', 'day': '07'}
print(m.span())              # (4, 14)
```

With multiple groups, `findall` returns tuples:

```python
pairs = re.findall(r"(\w+)=(\d+)", "a=1, b=22, c=333")
print(pairs)                 # [('a', '1'), ('b', '22'), ('c', '333')]
print(dict(pairs))
```

## Greedy vs lazy quantifiers

```python
html = "<b>bold</b> and <i>italic</i>"
print(re.findall(r"<.*>", html))    # greedy: ['<b>bold</b> and <i>italic</i>']
print(re.findall(r"<.*?>", html))   # lazy:   ['<b>', '</b>', '<i>', '</i>']
```

Add `?` after a quantifier (`*?`, `+?`, `??`, `{n,m}?`) to match as little as possible.

## Flags

```python
print(re.findall(r"^python", "Python\npython", re.IGNORECASE | re.MULTILINE))   # ['Python', 'python']
pattern = re.compile(r"""
    (\d{3})   # area code
    [-.\s]?
    (\d{4})   # number
""", re.VERBOSE)
print(pattern.findall("call 555-1234 or 555 9876"))   # [('555', '1234'), ('555', '9876')]
```

| Flag | Effect |
|---|---|
| `re.I` / `re.IGNORECASE` | case-insensitive |
| `re.M` / `re.MULTILINE` | `^`/`$` match at every line |
| `re.S` / `re.DOTALL` | `.` also matches newline |
| `re.X` / `re.VERBOSE` | allow whitespace and comments in the pattern |

## Substitution with functions and backreferences

```python
print(re.sub(r"(\w+) (\w+)", r"\2 \1", "hello world"))      # 'world hello'
print(re.sub(r"\d+", lambda m: str(int(m.group()) * 2), "3 apples, 10 pears"))
# '6 apples, 20 pears'

def snake_case(name):
    return re.sub(r"(?<!^)(?=[A-Z])", "_", name).lower()

print(snake_case("RapidReferenceApp"))   # rapid_reference_app
```

## Practical validators

```python
EMAIL = re.compile(r"^[\w.+-]+@[\w-]+(\.[\w-]+)+$")
PHONE_IN = re.compile(r"^(?:\+91[-\s]?)?[6-9]\d{9}$")
STRONG_PW = re.compile(r"^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^\w\s]).{8,}$")
HEX_COLOR = re.compile(r"^#(?:[0-9a-fA-F]{3}){1,2}$")

print(bool(EMAIL.match("ada@example.com")))     # True
print(bool(PHONE_IN.match("+91 9876543210")))   # True
print(bool(STRONG_PW.match("Passw0rd!")))       # True
print(bool(HEX_COLOR.match("#1a2B3c")))         # True
```

> [!NOTE]
> These validators are practical approximations. Fully RFC-compliant email validation via regex is impractical — real systems send a confirmation email.

> [!WARNING]
> - `re.match` only checks the **start** of the string — use `re.search` to find a pattern anywhere, or `re.fullmatch` to validate the whole string.
> - Forgetting to escape special characters: match a literal dot with `\.` (or use `re.escape(user_text)`).
> - Nested quantifiers like `(a+)+$` can cause catastrophic backtracking on long non-matching inputs.

> [!INTERVIEW]
> - Know `search` vs `match` vs `fullmatch`.
> - Greedy (`.*`) vs lazy (`.*?`) quantifiers.
> - `findall` returns group contents when the pattern has groups.
> - Compile patterns that are reused in a loop.

> [!REMEMBER]
> Raw strings, `search` to find, `fullmatch` to validate, `findall`/`finditer` to extract, `sub` to transform; `?` makes quantifiers lazy; named groups make code readable.
