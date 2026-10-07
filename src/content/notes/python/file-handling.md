Reading and writing files is a common practical interview task ("parse this log", "count words in a file"). Python makes it short — as long as you remember modes, encodings and `with`.

## Opening files

```python
f = open("data.txt", mode="r", encoding="utf-8")
content = f.read()
f.close()
```

Always prefer `with` — the file is closed automatically, even on errors:

```python
with open("data.txt", encoding="utf-8") as f:
    content = f.read()
```

### File modes

| Mode | Meaning | If file exists | If missing |
|---|---|---|---|
| `"r"` | read (default) | read from start | `FileNotFoundError` |
| `"w"` | write | **truncates** (erases!) | creates |
| `"a"` | append | writes at end | creates |
| `"x"` | exclusive create | `FileExistsError` | creates |
| `"r+"` | read + write | from start, no truncate | error |
| `"b"` suffix | binary (`"rb"`, `"wb"`) | bytes instead of str | |
| `"t"` suffix | text (default) | | |

> [!WARNING]
> Opening with `"w"` destroys existing content immediately. Use `"a"` to add, or `"x"` to avoid overwriting by accident.

## Reading

```python
with open("data.txt", encoding="utf-8") as f:
    whole = f.read()            # entire file as one string

with open("data.txt", encoding="utf-8") as f:
    first = f.readline()        # one line (keeps '\n')
    rest = f.readlines()        # list of remaining lines

with open("data.txt", encoding="utf-8") as f:
    for line in f:              # memory-efficient: one line at a time
        print(line.rstrip("\n"))
```

> [!TIP]
> Iterate over the file object for large files — it streams line by line instead of loading everything into memory.

## Writing

```python
lines = ["alpha", "beta", "gamma"]

with open("out.txt", "w", encoding="utf-8") as f:
    f.write("header\n")                       # write() does NOT add newlines
    f.writelines(line + "\n" for line in lines)
    print("via print", file=f)                # print can target a file

with open("out.txt", "a", encoding="utf-8") as f:
    f.write("appended\n")
```

## Encodings

Text mode decodes bytes using an encoding. The default depends on the OS (historically cp1252 on Windows), so always pass `encoding="utf-8"` for portable code.

```python
with open("emoji.txt", "w", encoding="utf-8") as f:
    f.write("Python 🐍")

with open("emoji.txt", "rb") as f:          # binary mode → bytes
    raw = f.read()
print(raw, raw.decode("utf-8"))
```

## File position: seek and tell

```python
with open("data.txt", "rb") as f:
    f.seek(10)          # jump to byte 10
    print(f.tell())     # 10
    chunk = f.read(5)   # read 5 bytes
```

## pathlib: modern path handling

```python
from pathlib import Path

p = Path("reports") / "2026" / "summary.txt"   # OS-independent joins
p.parent.mkdir(parents=True, exist_ok=True)
p.write_text("done\n", encoding="utf-8")
print(p.read_text(encoding="utf-8"))
print(p.name, p.stem, p.suffix, p.exists())    # summary.txt summary .txt True

for py in Path(".").glob("*.py"):              # list files by pattern
    print(py)
```

## JSON

```python
import json

data = {"name": "Ada", "skills": ["math", "code"], "active": True}

with open("user.json", "w", encoding="utf-8") as f:
    json.dump(data, f, indent=2)        # file

with open("user.json", encoding="utf-8") as f:
    loaded = json.load(f)

text = json.dumps(data)                 # string
back = json.loads(text)
print(loaded == back == data)           # True
```

JSON ↔ Python: object ↔ dict, array ↔ list, string ↔ str, number ↔ int/float, true/false ↔ True/False, null ↔ None. Tuples become lists; dict keys become strings.

## CSV

```python
import csv

rows = [["name", "score"], ["Ada", 92], ["Alan", 85]]
with open("scores.csv", "w", newline="", encoding="utf-8") as f:
    csv.writer(f).writerows(rows)

with open("scores.csv", newline="", encoding="utf-8") as f:
    for row in csv.DictReader(f):       # each row is a dict keyed by header
        print(row["name"], int(row["score"]))
```

> [!NOTE]
> Pass `newline=""` when opening CSV files so the `csv` module controls line endings (otherwise you get blank lines on Windows).

## Error handling around files

```python
def read_or_empty(path):
    try:
        with open(path, encoding="utf-8") as f:
            return f.read()
    except FileNotFoundError:
        return ""
    except PermissionError:
        raise RuntimeError(f"no permission to read {path}")
```

## Classic task: word frequency

```python
from collections import Counter
import re

def top_words(path, k=3):
    with open(path, encoding="utf-8") as f:
        words = re.findall(r"[a-z']+", f.read().lower())
    return Counter(words).most_common(k)
```

> [!INTERVIEW]
> - Use `with open(...)` so files close automatically (it calls `__exit__`).
> - `"w"` truncates, `"a"` appends, `"x"` fails if the file exists.
> - Iterate the file object to process huge files in O(1) memory.

> [!REMEMBER]
> `with` + explicit `encoding="utf-8"`, stream large files line by line, use `pathlib` for paths, `json`/`csv` modules for structured data.
