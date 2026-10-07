Bit manipulation works directly on the binary representation of integers. It enables O(1) tricks, compact sets (bitmasks) and elegant solutions to "single number" style problems.

## Concept

| Operator | Name | Example (5 = 101, 3 = 011) |
|---|---|---|
| `a & b` | AND — 1 if both bits are 1 | `5 & 3 = 1` (001) |
| `a \| b` | OR — 1 if either bit is 1 | `5 \| 3 = 7` (111) |
| `a ^ b` | XOR — 1 if bits differ | `5 ^ 3 = 6` (110) |
| `~a` | NOT — flips all bits (`~a == -a - 1`) | `~5 = -6` |
| `a << k` | left shift — multiply by 2ᵏ | `5 << 1 = 10` |
| `a >> k` | right shift — floor divide by 2ᵏ | `5 >> 1 = 2` |

**Two's complement**: negative numbers are stored as `~x + 1`. Python ints are arbitrary precision, so negatives behave as if they had infinitely many leading 1 bits — mask with `& 0xFFFFFFFF` to emulate 32-bit integers.

```python
print(bin(10), bin(-10 & 0xFF), int("1010", 2), (10).bit_length())   # 0b1010 0b11110110 10 4
```

## Core intuition: XOR's properties

- `x ^ x = 0` and `x ^ 0 = x`
- Commutative and associative → order doesn't matter
- So XOR-ing a list cancels every value that appears an even number of times.

## Important patterns

### 1. Bit tricks on a single number

```python
x = 0b10110
i = 1

print((x >> i) & 1)        # check bit i → 1
print(bin(x | (1 << 0)))   # set bit 0 → 0b10111
print(bin(x & ~(1 << 1)))  # clear bit 1 → 0b10100
print(bin(x ^ (1 << 4)))   # toggle bit 4 → 0b110
print(x & 1 == 0)          # even? → True
print(bin(x & (x - 1)))    # clear the lowest set bit → 0b10100
print(bin(x & -x))         # isolate the lowest set bit → 0b10
print(x > 0 and x & (x - 1) == 0)   # power of two? → False
```

### 2. Count set bits

```python
def count_bits(n):
    count = 0
    while n:
        n &= n - 1          # Brian Kernighan: removes one set bit per iteration
        count += 1
    return count

print(count_bits(0b1011011), bin(0b1011011).count("1"), (0b1011011).bit_count())   # 5 5 5
```

Counting bits for all numbers 0..n with DP: `bits[i] = bits[i >> 1] + (i & 1)`.

```python
def count_bits_upto(n):
    bits = [0] * (n + 1)
    for i in range(1, n + 1):
        bits[i] = bits[i >> 1] + (i & 1)
    return bits

print(count_bits_upto(5))   # [0, 1, 1, 2, 1, 2]
```

### 3. Single number family

```python
from functools import reduce
from operator import xor

def single_number(nums):                 # every other number appears twice
    return reduce(xor, nums, 0)

def single_number_thrice(nums):          # every other number appears three times
    ones = twos = 0
    for x in nums:
        ones = (ones ^ x) & ~twos
        twos = (twos ^ x) & ~ones
    return ones

def two_single_numbers(nums):            # exactly two numbers appear once
    x = reduce(xor, nums, 0)             # a ^ b
    diff = x & -x                        # a bit where a and b differ
    a = b = 0
    for n in nums:
        if n & diff:
            a ^= n
        else:
            b ^= n
    return sorted([a, b])

print(single_number([4, 1, 2, 1, 2]), single_number_thrice([2, 2, 3, 2]), two_single_numbers([1, 2, 1, 3, 2, 5]))   # 4 3 [3, 5]
```

### 4. Missing number / XOR of a range

```python
def missing_number(nums):
    res = len(nums)
    for i, x in enumerate(nums):
        res ^= i ^ x
    return res

def xor_upto(n):                     # 0 ^ 1 ^ ... ^ n in O(1)
    return [n, 1, n + 1, 0][n % 4]

def xor_range(l, r):
    return xor_upto(r) ^ xor_upto(l - 1)

print(missing_number([3, 0, 1]), xor_upto(5), xor_range(3, 5))   # 2 1 2
```

### 5. Subsets with bitmasks

Each number from 0 to 2ⁿ − 1 encodes a subset: bit `i` set ⇒ include `nums[i]`.

```python
def subsets_bitmask(nums):
    n = len(nums)
    return [[nums[i] for i in range(n) if mask >> i & 1] for mask in range(1 << n)]

print(subsets_bitmask([1, 2, 3]))
```

```output
[[], [1], [2], [1, 2], [3], [1, 3], [2, 3], [1, 2, 3]]
```

Iterate all submasks of a mask: `sub = mask; while sub: ...; sub = (sub - 1) & mask`.

### 6. Swap, sign and arithmetic tricks

```python
a, b = 5, 9
a ^= b; b ^= a; a ^= b              # XOR swap (in Python, prefer a, b = b, a)
print(a, b)                         # 9 5

print((7 ^ -3) < 0)                 # opposite signs? → True
print(13 >> 1, 13 << 2)             # 6 52
```

### 7. Divide two integers without `*`, `/`, `%`

```python
def divide(dividend, divisor):
    INT_MAX, INT_MIN = 2**31 - 1, -2**31
    if dividend == INT_MIN and divisor == -1:
        return INT_MAX
    negative = (dividend < 0) != (divisor < 0)
    a, b = abs(dividend), abs(divisor)
    q = 0
    for shift in range(31, -1, -1):
        if (b << shift) <= a:           # largest multiple b·2^shift that fits
            a -= b << shift
            q |= 1 << shift
    return -q if negative else q

print(divide(10, 3), divide(7, -3))   # 3 -2
```

### 8. Reverse bits (32-bit)

```python
def reverse_bits(n):
    res = 0
    for _ in range(32):
        res = (res << 1) | (n & 1)
        n >>= 1
    return res

print(reverse_bits(0b00000010100101000001111010011100))   # 964176192
```

### 9. Minimum bit flips to convert a → b

```python
def min_bit_flips(a, b):
    return (a ^ b).bit_count()        # bits that differ (3.10+; else bin(a ^ b).count("1"))

print(min_bit_flips(10, 7))   # 3
```

### 10. Power set / sieve-style bit arrays (memory)

A Python `int` can serve as a big bitset: `visited |= 1 << i`, test with `visited >> i & 1`. For dense boolean arrays, `bytearray` is also compact.

## Complexity

| Operation | Time |
|---|---|
| AND / OR / XOR / shift on machine-size ints | O(1) |
| Count bits (Kernighan) | O(set bits) |
| Generate all subsets | O(n · 2ⁿ) |
| Single number variants | O(n), O(1) space |

## Common interview variations

- Check/set/clear/toggle the i-th bit, power of two, count set bits
- Single number I/II/III, missing number, find the duplicate (XOR)
- Power set via bitmasks, minimum bit flips, XOR of numbers in a range
- Divide two integers, sum of two integers without `+` (watch Python's infinite sign bits)
- Bitmask DP (TSP, assignment), maximum XOR (bitwise trie)

> [!WARNING]
> Typical mistakes:
> - Precedence: arithmetic binds tighter than shifts and bitwise operators — `1 << i + 1` is `1 << (i + 1)` and `x & 1 + 1` is `x & 2`. (Unlike C/Java, Python's `&` binds tighter than `==`, so `x & 1 == 0` works — but parenthesise anyway when porting code.)
> - Python's negative numbers have infinite leading ones — mask with `0xFFFFFFFF` when simulating 32-bit behaviour.
> - Confusing `^` (XOR) with exponentiation (`**`).

> [!REMEMBER]
> `x & (x−1)` clears the lowest set bit, `x & −x` isolates it, XOR cancels pairs, `1 << i` builds masks, and bitmasks enumerate subsets of small sets.
