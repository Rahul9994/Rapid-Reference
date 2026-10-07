/**
 * Notes manifest. Each topic maps to a Markdown file at
 * src/content/notes/<category>/<slug>.md — add a file + an entry here to extend.
 */

export type CategoryId = 'python' | 'dsa' | 'os' | 'dbms' | 'cn'

export interface NoteTopic {
  slug: string
  title: string
  summary: string
}

export interface NoteCategory {
  id: CategoryId
  title: string
  short: string
  description: string
  hue: string
  topics: NoteTopic[]
}

export const noteCategories: NoteCategory[] = [
  {
    id: 'python',
    title: 'Python',
    short: 'Python',
    description: 'From variables to decorators — idiomatic Python with interview-ready tips.',
    hue: '#5b9dff',
    topics: [
      { slug: 'basics', title: 'Python Basics & Variables', summary: 'How Python runs, variables, names, objects and mutability.' },
      { slug: 'data-types', title: 'Data Types & Conversion', summary: 'int, float, bool, str, None, complex and type casting.' },
      { slug: 'operators', title: 'Operators', summary: 'Arithmetic, comparison, logical, bitwise, identity, walrus.' },
      { slug: 'input-output', title: 'Input & Output', summary: 'input(), print(), f-strings and fast I/O for coding rounds.' },
      { slug: 'conditionals', title: 'Conditional Statements', summary: 'if / elif / else, truthiness, ternary and match-case.' },
      { slug: 'loops', title: 'Loops', summary: 'for, while, range, enumerate, zip, break / continue / else.' },
      { slug: 'functions', title: 'Functions', summary: 'Arguments, *args/**kwargs, scope (LEGB), closures, type hints.' },
      { slug: 'recursion', title: 'Recursion', summary: 'Base cases, the call stack, recursion limits and memoization.' },
      { slug: 'lists', title: 'Lists', summary: 'Indexing, slicing, methods, copying and complexity.' },
      { slug: 'tuples', title: 'Tuples', summary: 'Immutability, packing / unpacking and namedtuple.' },
      { slug: 'sets', title: 'Sets', summary: 'Hash-based membership, set algebra and frozenset.' },
      { slug: 'dictionaries', title: 'Dictionaries', summary: 'Hash maps, iteration, defaultdict, Counter.' },
      { slug: 'strings', title: 'Strings', summary: 'Immutable text, slicing, methods, join and formatting.' },
      { slug: 'comprehensions', title: 'Comprehensions', summary: 'List, dict, set and generator comprehensions.' },
      { slug: 'functional', title: 'Lambda, map, filter, reduce', summary: 'Functional tools, sorting keys, any / all.' },
      { slug: 'exceptions', title: 'Exception Handling', summary: 'try / except / else / finally, raising and custom errors.' },
      { slug: 'file-handling', title: 'File Handling', summary: 'open(), modes, context managers, CSV, JSON, pathlib.' },
      { slug: 'oop-classes', title: 'OOP: Classes & Objects', summary: 'Classes, __init__, attributes, method types, dataclasses.' },
      { slug: 'oop-inheritance', title: 'Inheritance & Polymorphism', summary: 'super(), MRO, overriding, duck typing, ABCs.' },
      { slug: 'oop-encapsulation', title: 'Encapsulation & Magic Methods', summary: 'Name mangling, @property, dunder methods.' },
      { slug: 'modules', title: 'Modules & Packages', summary: 'Imports, __name__, packages, pip and virtual envs.' },
      { slug: 'iterators-generators', title: 'Iterators & Generators', summary: 'The iterator protocol, yield and lazy pipelines.' },
      { slug: 'decorators', title: 'Decorators', summary: 'Closures, @wraps, decorators with arguments, lru_cache.' },
      { slug: 'regex', title: 'Regular Expressions', summary: 'The re module: patterns, groups, search, sub.' },
      { slug: 'builtins-stdlib', title: 'Built-ins & Power Modules', summary: 'collections, heapq, bisect, itertools, math, functools.' },
      { slug: 'complexity', title: 'Complexity of Python Operations', summary: 'Big-O of list, dict, set, deque, heapq and str operations.' },
      { slug: 'interview-tips', title: 'Python Tips for Coding Interviews', summary: 'Idioms, templates and pitfalls to avoid under pressure.' },
    ],
  },
  {
    id: 'dsa',
    title: 'Data Structures & Algorithms',
    short: 'DSA',
    description: 'Patterns, intuition and clean Python implementations for every core topic.',
    hue: '#a78bfa',
    topics: [
      { slug: 'complexity-analysis', title: 'Complexity Analysis', summary: 'Big-O, analysing loops and recursion, amortized cost.' },
      { slug: 'arrays', title: 'Arrays', summary: 'Prefix sums, Kadane, rotations, Dutch national flag.' },
      { slug: 'strings', title: 'Strings', summary: 'Frequency maps, palindromes, anagrams, string matching.' },
      { slug: 'hashing', title: 'Hashing', summary: 'Hash maps / sets, counting, prefix-sum + hashmap tricks.' },
      { slug: 'two-pointers', title: 'Two Pointers', summary: 'Opposite ends, fast / slow, partitioning, merging.' },
      { slug: 'sliding-window', title: 'Sliding Window', summary: 'Fixed and variable windows, at-most-K counting.' },
      { slug: 'binary-search', title: 'Binary Search', summary: 'Bounds, rotated arrays and binary search on answers.' },
      { slug: 'sorting', title: 'Sorting Algorithms', summary: 'Selection, bubble, insertion, merge, quick, counting.' },
      { slug: 'recursion', title: 'Recursion', summary: 'Recursive thinking, recursion trees, subsequences.' },
      { slug: 'backtracking', title: 'Backtracking', summary: 'Choose → explore → un-choose. Subsets, permutations, N-Queens.' },
      { slug: 'linked-list', title: 'Linked Lists', summary: 'Reversal, cycle detection, merging, dummy nodes.' },
      { slug: 'doubly-linked-list', title: 'Doubly Linked Lists', summary: 'Bidirectional links, insert / delete, LRU cache.' },
      { slug: 'stack', title: 'Stack', summary: 'LIFO, parentheses, monotonic stack, expression conversion.' },
      { slug: 'queue-deque', title: 'Queue & Deque', summary: 'FIFO, circular queue, monotonic deque, sliding max.' },
      { slug: 'binary-trees', title: 'Binary Trees', summary: 'Traversals, views, height, diameter, LCA.' },
      { slug: 'bst', title: 'Binary Search Trees', summary: 'Search, insert, delete, validate, k-th smallest.' },
      { slug: 'balanced-trees', title: 'AVL & Balanced Trees', summary: 'Balance factor, rotations, red-black overview.' },
      { slug: 'heaps', title: 'Heaps & Priority Queue', summary: 'heapq, top-K, merge K lists, running median.' },
      { slug: 'greedy', title: 'Greedy', summary: 'Exchange arguments, intervals, scheduling, Huffman intuition.' },
      { slug: 'graphs', title: 'Graphs: Fundamentals', summary: 'Terminology, adjacency list / matrix, grids as graphs.' },
      { slug: 'bfs-dfs', title: 'BFS & DFS', summary: 'Traversals, components, islands, cycle detection, bipartite.' },
      { slug: 'topological-sort', title: 'Topological Sort', summary: "Kahn's algorithm, DFS order, course schedule." },
      { slug: 'shortest-path', title: 'Shortest Paths', summary: 'BFS, 0-1 BFS, Dijkstra, Bellman-Ford, Floyd-Warshall.' },
      { slug: 'mst', title: 'Minimum Spanning Tree', summary: "Prim's and Kruskal's algorithms." },
      { slug: 'dsu', title: 'Disjoint Set Union', summary: 'Union by rank / size, path compression, applications.' },
      { slug: 'dynamic-programming', title: 'Dynamic Programming', summary: 'Memoization → tabulation, knapsack, LIS, LCS, grids.' },
      { slug: 'trie', title: 'Trie', summary: 'Prefix trees, word search, XOR trie.' },
      { slug: 'bit-manipulation', title: 'Bit Manipulation', summary: 'Masks, XOR tricks, subsets with bits.' },
    ],
  },
  {
    id: 'os',
    title: 'Operating Systems',
    short: 'OS',
    description: 'Processes, scheduling, synchronization, memory and file systems — explained crisply.',
    hue: '#34d399',
    topics: [
      { slug: 'introduction', title: 'OS Fundamentals', summary: 'What an OS does, kernel, modes, kernel architectures.' },
      { slug: 'system-calls', title: 'System Calls', summary: 'User ↔ kernel boundary, fork / exec / wait.' },
      { slug: 'processes', title: 'Processes', summary: 'PCB, process states, creation, zombie and orphan.' },
      { slug: 'threads', title: 'Threads', summary: 'Threads vs processes, threading models, Python GIL.' },
      { slug: 'context-switching', title: 'Context Switching', summary: 'What is saved, cost, and when it happens.' },
      { slug: 'cpu-scheduling', title: 'CPU Scheduling', summary: 'FCFS, SJF, SRTF, Priority, Round Robin, MLFQ.' },
      { slug: 'synchronization', title: 'Process Synchronization', summary: 'Race conditions, mutex, semaphores, monitors.' },
      { slug: 'deadlocks', title: 'Deadlocks', summary: "Coffman conditions, prevention, Banker's algorithm." },
      { slug: 'ipc', title: 'Inter-Process Communication', summary: 'Shared memory, message passing, pipes, sockets.' },
      { slug: 'memory-management', title: 'Memory Management', summary: 'Address binding, allocation, fragmentation.' },
      { slug: 'paging', title: 'Paging', summary: 'Page tables, TLB, effective access time, multilevel tables.' },
      { slug: 'segmentation', title: 'Segmentation', summary: 'Segments, segment tables, segmentation with paging.' },
      { slug: 'virtual-memory', title: 'Virtual Memory', summary: 'Demand paging, page faults, thrashing, working set.' },
      { slug: 'page-replacement', title: 'Page Replacement', summary: "FIFO, Optimal, LRU and Belady's anomaly." },
      { slug: 'file-systems', title: 'File Systems', summary: 'Files, directories, allocation methods, inodes.' },
      { slug: 'io-systems', title: 'I/O & Disk Scheduling', summary: 'Interrupts, DMA, buffering, SCAN / C-SCAN / LOOK.' },
      { slug: 'interview-concepts', title: 'OS Interview Essentials', summary: 'High-yield concepts for quick revision.' },
    ],
  },
  {
    id: 'dbms',
    title: 'Database Management Systems',
    short: 'DBMS',
    description: 'Data modelling, SQL, normalization, transactions and indexing with practical queries.',
    hue: '#fbbf24',
    topics: [
      { slug: 'fundamentals', title: 'DBMS Fundamentals', summary: 'DBMS vs files, 3-schema architecture, data independence.' },
      { slug: 'er-model', title: 'ER Model', summary: 'Entities, attributes, relationships, cardinality.' },
      { slug: 'relational-model', title: 'Relational Model & Algebra', summary: 'Relations, tuples and relational algebra operators.' },
      { slug: 'keys', title: 'Keys', summary: 'Super, candidate, primary, alternate, foreign, composite.' },
      { slug: 'constraints', title: 'Constraints', summary: 'NOT NULL, UNIQUE, CHECK, DEFAULT, referential integrity.' },
      { slug: 'sql-basics', title: 'SQL Essentials', summary: 'DDL, DML, DCL, TCL, SELECT and filtering.' },
      { slug: 'joins', title: 'Joins', summary: 'INNER, LEFT, RIGHT, FULL, CROSS and SELF joins.' },
      { slug: 'aggregations', title: 'Aggregations & Window Functions', summary: 'GROUP BY, HAVING, ROW_NUMBER, RANK.' },
      { slug: 'subqueries', title: 'Subqueries & CTEs', summary: 'Scalar, correlated, EXISTS, WITH and recursive CTEs.' },
      { slug: 'functional-dependencies', title: 'Functional Dependencies', summary: "Closures, Armstrong's axioms, finding candidate keys." },
      { slug: 'normalization', title: 'Normalization', summary: '1NF → BCNF, anomalies and lossless decomposition.' },
      { slug: 'transactions-acid', title: 'Transactions & ACID', summary: 'Transaction states, schedules, serializability.' },
      { slug: 'concurrency-control', title: 'Concurrency Control & Locks', summary: '2PL, isolation levels, timestamps, MVCC.' },
      { slug: 'indexing', title: 'Indexing', summary: 'Clustered vs non-clustered, dense vs sparse, hash indexes.' },
      { slug: 'b-trees', title: 'B-Trees & B+ Trees', summary: 'Why databases use B+ trees, order, search and insert.' },
      { slug: 'views-procedures-triggers', title: 'Views, Procedures & Triggers', summary: 'Views, stored procedures, functions and triggers.' },
      { slug: 'recovery', title: 'Recovery', summary: 'Logs, WAL, checkpoints, undo / redo, shadow paging.' },
      { slug: 'interview-concepts', title: 'DBMS Interview Essentials', summary: 'SQL vs NoSQL, CAP, sharding, classic SQL questions.' },
    ],
  },
  {
    id: 'cn',
    title: 'Computer Networks',
    short: 'CN',
    description: 'From the OSI model to TLS — layered, visual notes on how the internet works.',
    hue: '#22d3ee',
    topics: [
      { slug: 'fundamentals', title: 'Networking Fundamentals', summary: 'Network types, topologies, devices and key metrics.' },
      { slug: 'osi-model', title: 'OSI Model', summary: 'Seven layers, their jobs, PDUs and protocols.' },
      { slug: 'tcp-ip-model', title: 'TCP/IP Model', summary: 'The practical 4-layer stack and encapsulation.' },
      { slug: 'ip-addressing', title: 'IP Addressing', summary: 'IPv4 classes, private ranges, CIDR and IPv6.' },
      { slug: 'subnetting', title: 'Subnetting', summary: 'Masks, network / broadcast addresses, worked examples.' },
      { slug: 'mac-arp', title: 'MAC & ARP', summary: 'Hardware addresses and resolving IP → MAC.' },
      { slug: 'switching', title: 'Switching', summary: 'Circuit vs packet switching, MAC tables, VLANs.' },
      { slug: 'routing', title: 'Routing', summary: 'Routing tables, distance vector, link state, BGP.' },
      { slug: 'nat', title: 'NAT', summary: 'Static, dynamic and PAT — sharing one public IP.' },
      { slug: 'dhcp', title: 'DHCP', summary: 'Automatic configuration with the DORA process.' },
      { slug: 'dns', title: 'DNS', summary: 'Hierarchy, resolution steps, record types, caching.' },
      { slug: 'http', title: 'HTTP', summary: 'Methods, status codes, headers, cookies, versions.' },
      { slug: 'https-tls', title: 'HTTPS & TLS', summary: 'Encryption, certificates and the TLS handshake.' },
      { slug: 'tcp', title: 'TCP', summary: 'Handshake, reliability, segments, connection teardown.' },
      { slug: 'udp', title: 'UDP', summary: 'Connectionless transport and when to prefer it.' },
      { slug: 'flow-congestion-control', title: 'Flow & Congestion Control', summary: 'Sliding windows, ARQ, slow start, AIMD.' },
      { slug: 'firewalls-security', title: 'Firewalls & Network Security', summary: 'Firewalls, proxies, VPNs and common attacks.' },
      { slug: 'sockets', title: 'Sockets', summary: 'Socket API with Python TCP / UDP examples.' },
      { slug: 'interview-questions', title: 'CN Interview Essentials', summary: 'What happens when you type a URL, and more.' },
    ],
  },
]

export const categoryById = Object.fromEntries(noteCategories.map((c) => [c.id, c])) as Record<CategoryId, NoteCategory>

export interface FlatTopic extends NoteTopic {
  key: string
  category: NoteCategory
  index: number
}

export const allTopics: FlatTopic[] = noteCategories.flatMap((category) =>
  category.topics.map((t, index) => ({ ...t, key: `${category.id}/${t.slug}`, category, index })),
)

export const topicByKey = new Map(allTopics.map((t) => [t.key, t]))

export function getTopic(categoryId: string, slug: string): FlatTopic | undefined {
  return topicByKey.get(`${categoryId}/${slug}`)
}

export function getAdjacentTopics(key: string): { prev?: FlatTopic; next?: FlatTopic } {
  const i = allTopics.findIndex((t) => t.key === key)
  return { prev: i > 0 ? allTopics[i - 1] : undefined, next: i >= 0 ? allTopics[i + 1] : undefined }
}

export const totalTopics = allTopics.length
