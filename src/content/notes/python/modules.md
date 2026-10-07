A **module** is a `.py` file; a **package** is a directory of modules. Imports let you split code into reusable pieces and pull in the standard library or third-party code.

## Import forms

```python
import math                       # access as math.sqrt
import numpy as np                # alias (third-party example)
from math import sqrt, pi         # import specific names
from collections import *         # import everything public — avoid in real code
from os import path as osp        # alias a single name

print(math.sqrt(16), sqrt(25), pi)
```

> [!WARNING]
> `from module import *` pollutes your namespace and can silently shadow names (e.g. a module defining `open` or `sum`). Prefer explicit imports.

## How Python finds modules

When you `import x`, Python searches, in order:

1. Already-imported modules in `sys.modules` (imports are **cached** — a module's top-level code runs only once).
2. Built-in modules.
3. Directories in `sys.path`: the script's directory, `PYTHONPATH`, then site-packages.

```python
import sys
print(sys.path[:3])
print("math" in sys.modules)
```

> [!WARNING]
> Naming your own file `random.py` or `math.py` shadows the standard library module — `import random` will import *your* file.

## `if __name__ == "__main__":`

Each module has a `__name__`. It equals `"__main__"` when the file is run directly, and the module's name when imported.

```python
# geometry.py
def area(r):
    return 3.14159 * r * r

if __name__ == "__main__":       # runs only with `python geometry.py`
    print(area(2))               # not executed on `import geometry`
```

## Packages

```diagram A typical package layout
 myproject/
 ├── main.py
 └── shapes/
     ├── __init__.py        ← makes 'shapes' a regular package; runs on import
     ├── circle.py
     └── polygons/
         ├── __init__.py
         └── square.py
```

```python
# main.py
from shapes.circle import area                 # absolute import
from shapes.polygons import square

# inside shapes/polygons/square.py
from ..circle import area                      # relative import (within packages only)
```

`__init__.py` can re-export names for a cleaner API:

```python
# shapes/__init__.py
from .circle import area
__all__ = ["area"]          # what `from shapes import *` exposes
```

## Reloading during development

```python
import importlib
import geometry
importlib.reload(geometry)    # re-execute after editing (REPL/notebooks)
```

## pip and virtual environments

```bash
python -m venv .venv                # create an isolated environment
source .venv/bin/activate           # macOS/Linux
.venv\Scripts\activate              # Windows
python -m pip install requests      # install into the venv
python -m pip freeze > requirements.txt
python -m pip install -r requirements.txt
```

Why venvs? Each project gets its own dependency versions, avoiding "works on my machine" conflicts.

## Standard library highlights

| Module | Use it for |
|---|---|
| `collections` | `deque`, `Counter`, `defaultdict`, `OrderedDict`, `namedtuple` |
| `heapq` | priority queues (min-heap) |
| `bisect` | binary search on sorted lists |
| `itertools` | permutations, combinations, product, accumulate, groupby |
| `functools` | `lru_cache`, `cache`, `reduce`, `partial`, `cmp_to_key` |
| `math` | `gcd`, `lcm`, `comb`, `perm`, `isqrt`, `inf` |
| `sys` | `stdin`, `setrecursionlimit`, `argv`, `maxsize` |
| `os`, `pathlib`, `shutil` | files and directories |
| `re` | regular expressions |
| `json`, `csv` | data formats |
| `datetime`, `time` | dates and timing |
| `random` | random numbers, `shuffle`, `choice`, `sample` |
| `typing`, `dataclasses`, `enum`, `abc` | modelling and type hints |
| `threading`, `multiprocessing`, `asyncio` | concurrency |
| `unittest`, `doctest` | testing |

```python
from math import comb, gcd, isqrt
print(comb(5, 2), gcd(12, 18), isqrt(50))   # 10 6 7
```

> [!INTERVIEW]
> - Module code runs once on first import; later imports reuse `sys.modules`.
> - `__name__ == "__main__"` distinguishes "run as script" from "imported".
> - A package is a directory with `__init__.py` (namespace packages can omit it in Python 3.3+).
> - Circular imports are solved by moving imports inside functions or restructuring shared code into a third module.

> [!REMEMBER]
> Explicit imports, `__main__` guard for scripts, one venv per project, and know your standard library — `collections`, `heapq`, `bisect`, `itertools`, `functools` cover most DSA needs.
