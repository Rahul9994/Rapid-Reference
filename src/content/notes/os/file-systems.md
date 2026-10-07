A **file system** organises data on storage into files and directories, maps them to disk blocks, and enforces naming, protection and reliability.

## Files

A file is a named collection of related data. The OS tracks its **attributes**:

| Attribute | Example |
|---|---|
| Name, identifier | `report.pdf`, inode number 1234 |
| Type | regular, directory, symlink, device |
| Location | pointer(s) to data blocks |
| Size | bytes / blocks |
| Protection | owner/group/other permissions, ACLs |
| Timestamps | created, modified, accessed |

**File operations**: create, open, read, write, seek (reposition), close, delete, truncate.

The OS keeps an **open-file table** (system-wide) and a per-process table of **file descriptors** pointing into it (holding the current file offset, access mode, open count).

### Access methods

| Method | Description | Example |
|---|---|---|
| Sequential | read/write in order | logs, tapes, streaming |
| Direct (random) | jump to any block | databases |
| Indexed | an index points to records | ISAM, B-tree indexes |

## Directory structures

| Structure | Description | Problem it solves / has |
|---|---|---|
| Single-level | one directory for all files | name collisions, no grouping |
| Two-level | one directory per user | isolates users, no subfolders |
| **Tree** | hierarchical directories with absolute/relative paths | the common structure |
| Acyclic graph | allows shared subdirectories/files via **links** | sharing; deletion needs reference counts |
| General graph | links may create cycles | needs cycle handling / garbage collection |

**Hard link**: another directory entry pointing to the same inode (same file; file deleted when link count reaches 0; can't cross file systems or link directories). **Soft (symbolic) link**: a small file containing a path (can dangle if the target is removed; can cross file systems).

## Allocation methods

How are a file's blocks placed on disk?

### 1. Contiguous allocation

Each file occupies consecutive blocks; the directory stores (start, length).

- ✅ Fast sequential and direct access (`block = start + i`).
- ❌ External fragmentation; files can't grow easily; need to know size in advance.

### 2. Linked allocation

Each block stores a pointer to the next block; the directory stores the first (and last) block.

- ✅ No external fragmentation; files grow easily.
- ❌ Only sequential access is efficient; pointers waste space; one broken pointer loses the rest.
- **FAT (File Allocation Table)** keeps all the "next" pointers in a table at the start of the disk (cached in memory) → faster random access. Used by FAT32, exFAT.

### 3. Indexed allocation

Each file has an **index block** containing pointers to all its data blocks.

- ✅ Direct access, no external fragmentation.
- ❌ Index block overhead; large files need multi-level or linked index blocks.

### UNIX inode (combined scheme)

```diagram Inode block pointers (classic UNIX/ext2)
 inode
 ├── metadata (mode, owner, size, timestamps, link count)
 ├── 12 direct pointers ───────────────► data blocks
 ├── single indirect ──► block of pointers ──► data blocks
 ├── double indirect ──► pointers → pointers ──► data blocks
 └── triple indirect ──► three levels ──► data blocks
```

With 4 KB blocks and 4-byte pointers (1024 pointers per block), maximum file size ≈ 12 × 4 KB + 1024 × 4 KB + 1024² × 4 KB + 1024³ × 4 KB ≈ **4 TB** — small files need no indirection, huge files remain possible.

> [!NOTE]
> The inode stores everything about a file **except its name** — names live in directory entries that map name → inode number. That's why hard links work.

## Free-space management

| Method | Idea | Trade-off |
|---|---|---|
| **Bit vector (bitmap)** | 1 bit per block (1 = free) | compact; easy to find contiguous runs; must be cached |
| Linked list | free blocks chained together | no extra space; slow traversal |
| Grouping | first free block stores addresses of n free blocks | faster than a simple list |
| Counting | store (start, count) runs of free blocks | great when free space is contiguous |

## Reliability: journaling

A crash in the middle of an update (e.g. creating a file touches the directory, inode and bitmap) can leave the file system inconsistent.

- **fsck / chkdsk** scans and repairs (slow on large disks).
- **Journaling** (ext4, NTFS, XFS, APFS): write the intended changes to a **log (journal)** first, then apply them. After a crash, replay or discard incomplete transactions — same idea as a database's write-ahead log.
- **Copy-on-write file systems** (ZFS, Btrfs): never overwrite in place; write new blocks and atomically switch pointers; enables snapshots.

## Common file systems

| File system | Used by | Notes |
|---|---|---|
| FAT32 / exFAT | USB drives, SD cards | simple, widely compatible; FAT32 max file 4 GB |
| NTFS | Windows | journaling, ACLs, compression |
| ext4 | Linux | journaling, extents |
| APFS | macOS / iOS | copy-on-write, snapshots, encryption |
| XFS, Btrfs, ZFS | servers | large files, snapshots, checksums |

## Virtual File System (VFS)

The kernel's VFS layer exposes one interface (`open`, `read`, `write`…) and dispatches to the specific file system — so programs work the same on ext4, NFS or a USB stick.

> [!INTERVIEW]
> - *Contiguous vs linked vs indexed allocation?* — fast but fragmented / flexible but sequential / direct access with index overhead.
> - *What's in an inode?* — Metadata and block pointers, not the filename.
> - *Hard vs soft link?* — Same inode vs path pointer.
> - *Why journaling?* — Fast, consistent crash recovery via a write-ahead log.

> [!REMEMBER]
> Directories map names → inodes; inodes map files → blocks (direct + indirect pointers). Bitmaps track free blocks. Journaling makes crashes recoverable. VFS hides file-system differences.
