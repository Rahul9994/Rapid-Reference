A **Database Management System (DBMS)** is software that stores, retrieves and manages data reliably for many concurrent users — handling consistency, security, concurrency and recovery so applications don't have to.

## Data, database, DBMS

| Term | Meaning |
|---|---|
| Data | raw facts (`"Ada"`, `36`) |
| Information | processed, meaningful data ("Ada is 36") |
| Database | an organised collection of related data |
| DBMS | software to define, manipulate, control and protect the database (MySQL, PostgreSQL, Oracle, SQL Server, SQLite, MongoDB) |
| Database system | database + DBMS + applications |

## Why not just use files?

| Problem with file systems | How a DBMS solves it |
|---|---|
| Data redundancy & inconsistency | centralised data, normalization, constraints |
| Difficult data access (new program per query) | declarative query language (SQL) |
| Data isolation (scattered formats) | uniform data model |
| Integrity problems (rules buried in code) | declared constraints (CHECK, FOREIGN KEY) |
| Atomicity problems (half-done updates on crash) | transactions with ACID guarantees |
| Concurrent access anomalies | concurrency control (locks, MVCC) |
| Security problems | users, roles, privileges (GRANT/REVOKE) |

## Three-schema architecture (ANSI/SPARC)

```diagram Three levels of abstraction
 ┌───────────────────────────────────────────┐
 │ External level — views for each user group │  e.g. "HR sees name, salary"
 ├───────────────────────────────────────────┤
 │ Conceptual (logical) level — whole schema  │  tables, columns, keys, constraints
 ├───────────────────────────────────────────┤
 │ Internal (physical) level — storage        │  files, pages, indexes, B+ trees
 └───────────────────────────────────────────┘
```

- **Schema**: the structure (design) — changes rarely.
- **Instance**: the data in the database at a moment — changes constantly.

## Data independence

| Type | Meaning | Example |
|---|---|---|
| **Physical** data independence | change the internal level without changing the conceptual schema | add an index, move to SSDs, change file organisation |
| **Logical** data independence | change the conceptual schema without changing external views/apps | add a column, split a table (behind a view) |

Logical independence is harder to achieve than physical independence.

## Data models

| Model | Structure | Examples |
|---|---|---|
| Hierarchical | tree (parent–child) | IBM IMS, XML-like data |
| Network | graph of records | CODASYL |
| **Relational** | tables (relations) of rows and columns | PostgreSQL, MySQL, Oracle |
| Entity–Relationship | conceptual design model | used for design, then mapped to tables |
| Object / object-relational | objects with methods; relational + objects | PostgreSQL extensions |
| NoSQL | document, key-value, column-family, graph | MongoDB, Redis, Cassandra, Neo4j |

## Database languages

| Language | Purpose | Commands |
|---|---|---|
| **DDL** — Data Definition | define/modify structure | `CREATE`, `ALTER`, `DROP`, `TRUNCATE`, `RENAME` |
| **DML** — Data Manipulation | query and change data | `SELECT`, `INSERT`, `UPDATE`, `DELETE`, `MERGE` |
| **DCL** — Data Control | permissions | `GRANT`, `REVOKE` |
| **TCL** — Transaction Control | manage transactions | `COMMIT`, `ROLLBACK`, `SAVEPOINT` |

(Some texts list `SELECT` separately as **DQL**.)

## DBMS architecture tiers

| Tier | Layout | Example |
|---|---|---|
| 1-tier | user works directly on the DBMS | local SQLite file, DB admin console |
| 2-tier | client app ↔ database server | desktop app using JDBC/ODBC |
| 3-tier | client ↔ application server ↔ database | web apps (browser → API → DB) |

## Components of a DBMS

- **Query processor**: parser, optimizer (chooses the execution plan), executor.
- **Storage manager**: buffer manager, file manager, transaction manager, authorization/integrity manager.
- **Data dictionary (catalog)**: metadata about tables, columns, constraints, indexes, users.

## Database users

| User | Role |
|---|---|
| DBA (Database Administrator) | schema definition, storage, security, backup/recovery, performance tuning |
| Application programmers | write programs that use the database |
| Sophisticated users | write queries directly (analysts) |
| Naive (end) users | use applications/forms |

> [!INTERVIEW]
> - *DBMS vs file system?* — Redundancy control, integrity, concurrency, recovery, security, query language.
> - *Three-schema architecture?* — External, conceptual, internal levels; enables data independence.
> - *Physical vs logical data independence?* — Change storage without changing the schema vs change the schema without breaking views/apps.
> - *DDL vs DML vs DCL vs TCL?* — Structure, data, permissions, transactions.

> [!REMEMBER]
> A DBMS adds integrity, concurrency, recovery and security on top of storage. Three levels (external / conceptual / internal) give logical and physical data independence. SQL splits into DDL, DML, DCL and TCL.
