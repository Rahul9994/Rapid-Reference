## What is the difference between compiled and interpreted languages?

A **compiled** language is translated ahead of time into machine code (C, C++, Rust) — fast execution, platform-specific binaries. An **interpreted** language is executed by an interpreter at run time (Python, JavaScript), often after compiling to bytecode — more portable and flexible, usually slower. Many runtimes mix both with JIT compilation (Java, JavaScript V8, PyPy).

## What is the difference between stack and heap memory?

The **stack** stores function call frames and local variables; allocation is automatic and fast (LIFO), size is limited, and memory is freed when the function returns. The **heap** stores dynamically allocated objects with flexible lifetimes; allocation is slower and managed manually (C) or by a garbage collector (Python, Java). Deep recursion overflows the stack; leaks happen on the heap.

## What is REST? What makes an API RESTful?

REST is an architectural style for web APIs: resources identified by URLs, manipulated with standard HTTP methods (GET, POST, PUT, PATCH, DELETE), stateless requests, cacheable responses, a uniform interface and representations such as JSON. Good RESTful APIs use proper status codes and nouns for resources (`/users/42`) rather than verbs.

## What is the difference between authentication and authorization?

**Authentication** verifies **who** you are (password, OTP, biometrics, OAuth login). **Authorization** decides **what** you're allowed to do (roles, permissions, access control lists). Authentication comes first; a 401 means unauthenticated, a 403 means authenticated but not authorized.

## What is Git? Explain merge vs rebase.

Git is a distributed version control system that tracks changes as commits in a DAG. **Merge** combines branches by creating a merge commit, preserving the true history. **Rebase** replays your commits on top of another branch, producing a linear history but rewriting commit IDs — never rebase commits others have already pulled.

## What is the difference between concurrency and parallelism?

**Concurrency** is about structuring a program to handle multiple tasks that make progress over overlapping time periods (they may interleave on one core). **Parallelism** is executing multiple tasks literally at the same time on multiple cores. Async I/O is concurrency; multiprocessing on 8 cores is parallelism.

## What is caching and where is it used?

Storing copies of frequently accessed data in a faster layer to reduce latency and load: CPU caches, browser caches, CDNs, DNS caches, application caches (Redis, Memcached), database buffer pools. Key concerns: hit ratio, eviction policy (LRU, LFU, TTL) and **invalidation** — keeping cached data consistent with the source.

## What is the difference between SQL injection and XSS?

**SQL injection** inserts malicious SQL through unsanitised input into a database query (prevent with parameterised queries/ORMs and least-privilege DB users). **XSS (cross-site scripting)** injects malicious JavaScript into pages viewed by other users (prevent with output encoding, Content Security Policy and HttpOnly cookies).

## What is a load balancer?

A component that distributes incoming requests across multiple servers to improve availability and scalability. Algorithms include round robin, least connections and IP hash; it performs health checks and removes failing servers. Layer 4 balancers route by IP/port; Layer 7 balancers route by HTTP content (paths, headers).

## Monolith vs microservices?

A **monolith** is a single deployable application — simpler to build, test and deploy at first, but harder to scale teams and components independently. **Microservices** split the system into small, independently deployable services communicating over the network — enabling independent scaling and team autonomy at the cost of distributed-systems complexity (network failures, data consistency, observability).

## What is the difference between a process, a program and an application?

A **program** is passive code stored on disk. A **process** is a running instance of a program with its own memory and resources. An **application** is a user-facing software product that may consist of one or many programs/processes (e.g. a browser runs many processes).

## What is Big-O of common operations on Python data structures?

List index O(1), append O(1) amortized, insert/pop at front O(n), membership O(n). Dict/set get, set, delete and membership O(1) average. Heap push/pop O(log n). Sorting O(n log n). Knowing these lets you avoid hidden O(n²) code (like `x in list` inside a loop).

## How would you design a URL shortener?

Requirements: create short codes, redirect quickly, handle huge read volume. Generate a unique ID (counter or random) and encode it in Base62 (7 characters ≈ 3.5 trillion codes); store code → URL in a key-value store or SQL table with an index; serve redirects with **301/302**, caching hot codes in Redis/CDN; add rate limiting, custom aliases, expiry and analytics asynchronously. Discuss collisions, sharding by code and read replicas.

## What are unit, integration and end-to-end tests?

**Unit tests** check small pieces (functions, classes) in isolation, using mocks for dependencies — fast and numerous. **Integration tests** check that components work together (API + database). **End-to-end tests** exercise the whole system as a user would (browser automation) — slower and fewer. Together they form the "testing pyramid".
