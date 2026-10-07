## What is time complexity and why does it matter?

Time complexity describes how running time grows with input size n, expressed asymptotically (Big-O) by dropping constants and lower-order terms. It lets you compare algorithms independent of hardware and predict whether a solution will fit the constraints (≈10⁷–10⁸ simple operations per second; Python is at the lower end).

## Array vs linked list?

| | Array | Linked list |
|---|---|---|
| Access by index | O(1) | O(n) |
| Insert/delete at front | O(n) | O(1) |
| Memory | contiguous, cache-friendly | extra pointer per node, scattered |
| Size | fixed (dynamic arrays resize) | grows easily |

Arrays win for random access and iteration speed; linked lists for frequent insertions/deletions at known positions.

## Stack vs queue?

A **stack** is LIFO (last in, first out): push/pop at the top — used for recursion, undo, parentheses matching, DFS. A **queue** is FIFO: enqueue at the rear, dequeue at the front — used for BFS, scheduling, buffering. In Python use a `list` for stacks and `collections.deque` for queues.

## How does a hash map work?

A hash function maps each key to a bucket index; values are stored there. Collisions are handled by **chaining** (lists per bucket) or **open addressing** (probing). With a good hash function and resizing to keep the load factor low, get/put/delete are **O(1) average**, O(n) worst case.

## When would you use BFS vs DFS?

**BFS** explores level by level with a queue — use it for **shortest paths in unweighted graphs**, minimum steps, and level-order processing. **DFS** goes deep with a stack/recursion — use it for connectivity, cycle detection, topological sorting, backtracking and path enumeration. BFS uses O(width) memory, DFS O(depth).

## Why does Dijkstra fail with negative edges?

Dijkstra **finalises** a node when it's popped from the priority queue, assuming no later path can be shorter because all remaining edges are non-negative. A negative edge can make a path through a not-yet-processed node cheaper, contradicting that assumption. Use **Bellman-Ford** (O(V·E), also detects negative cycles) for graphs with negative weights.

## What is dynamic programming?

Solving a problem by combining solutions to **overlapping subproblems** with **optimal substructure**, computing each subproblem once. Two styles: **memoization** (top-down recursion + cache) and **tabulation** (bottom-up table). Recipe: define the state, the transition, base cases, the evaluation order and the answer.

## Greedy vs dynamic programming?

Greedy makes the locally best choice and never revisits it — fast, but correct only when the greedy-choice property holds (activity selection, Huffman, MST). DP considers all choices via subproblems — slower but correct whenever optimal substructure holds (0/1 knapsack, coin change with arbitrary coins).

## Explain the two-pointer technique.

Use two indices that move through the data in a coordinated way to avoid a nested loop — e.g. from both ends of a **sorted** array to find a pair sum (move left if the sum is too small, right if too big), or a slow/fast pair to remove duplicates in place or detect cycles. It usually turns O(n²) into O(n).

## What is the sliding window technique?

Maintain a contiguous window `[left, right]` and update its state incrementally as it moves — expand `right`, shrink `left` while the window is invalid. Works when the validity condition is monotonic (e.g. "at most k distinct", "sum ≤ k" with non-negative numbers). Each element enters and leaves once → O(n).

## How does binary search work and what are its requirements?

It repeatedly halves a search range by comparing the middle element (or a predicate) with the target — O(log n). It requires a **monotonic** property: sorted data, or a yes/no condition that flips once (enabling "binary search on the answer", e.g. minimum capacity to ship packages in D days).

## How do you detect a cycle in a linked list?

**Floyd's tortoise and hare**: move `slow` one step and `fast` two steps; if they meet, there's a cycle. To find the cycle's start, reset one pointer to the head and move both one step at a time — they meet at the start. O(n) time, O(1) space.

## What is a heap and where is it used?

A complete binary tree stored in an array with the heap property (parent ≤ children for a min-heap). Peek O(1), push/pop O(log n), heapify O(n). Used for priority queues, top-K problems, merging K sorted lists, running medians, Dijkstra and Prim. Python's `heapq` is a min-heap.

## Quick sort vs merge sort?

| | Quick sort | Merge sort |
|---|---|---|
| Average / worst time | O(n log n) / O(n²) | O(n log n) / O(n log n) |
| Extra space | O(log n) stack | O(n) |
| Stable | no | yes |
| In practice | very fast, in-place, cache-friendly | predictable; best for linked lists and external sorting |

A random pivot makes quicksort's worst case extremely unlikely.

## What is a balanced binary tree and why does it matter?

A tree where the heights of left and right subtrees differ by a bounded amount at every node (AVL: at most 1), keeping height O(log n). It matters because BST operations cost O(height) — an unbalanced BST built from sorted input degrades to a linked list with O(n) operations.

## What is memoization? Give an example.

Caching the results of function calls so repeated calls with the same arguments return instantly. Naive Fibonacci is O(2ⁿ); with memoization it's O(n):

```python
from functools import cache
@cache
def fib(n):
    return n if n < 2 else fib(n - 1) + fib(n - 2)
```

## What is a Trie and when is it useful?

A prefix tree where each edge is a character and paths spell words. Insert/search/prefix queries cost O(length of the word), independent of the number of stored words — ideal for autocomplete, spell-check, prefix counting, word search on grids, and (bitwise tries) maximum-XOR problems.

## How would you find the kth largest element in an array?

Options: sort and index — O(n log n); keep a **min-heap of size k** — O(n log k); **quickselect** — O(n) average. In Python: `heapq.nlargest(k, nums)[-1]`. Mention the trade-offs and pick based on constraints.
