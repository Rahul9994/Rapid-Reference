A **socket** is an endpoint for network communication — the programming interface between an application and the transport layer. A connection is identified by `(protocol, local IP, local port, remote IP, remote port)`.

## Socket types

| Type | Constant | Transport | Semantics |
|---|---|---|---|
| Stream socket | `SOCK_STREAM` | TCP | reliable, ordered byte stream, connection-oriented |
| Datagram socket | `SOCK_DGRAM` | UDP | independent messages, connectionless |
| Raw socket | `SOCK_RAW` | IP directly | custom protocols, ping (needs privileges) |

Address families: `AF_INET` (IPv4), `AF_INET6` (IPv6), `AF_UNIX` (local inter-process sockets).

## The TCP socket lifecycle

```diagram Server and client system calls
 Server                                  Client
 socket()                                socket()
 bind(host, port)                           │
 listen(backlog)                            │
 accept()  ◄──── 3-way handshake ─────── connect(host, port)
    │ returns a NEW socket for this client
 recv() / send()  ◄═════ data ═════►  send() / recv()
 close()          ◄── FIN / ACK ───►  close()
```

- `bind` — attach the socket to a local address/port.
- `listen` — mark it passive; `backlog` = queue length for pending connections.
- `accept` — block until a client connects; returns a **new connected socket** (the listening socket keeps listening).
- `connect` — (client) perform the 3-way handshake.

## A TCP echo server and client in Python

```python
import socket
import threading

def handle(conn, addr):
    with conn:
        while data := conn.recv(1024):        # b"" means the client closed the connection
            conn.sendall(data.upper())

def serve(server):
    while True:
        conn, addr = server.accept()          # new socket per client
        threading.Thread(target=handle, args=(conn, addr), daemon=True).start()

server = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
server.setsockopt(socket.SOL_SOCKET, socket.SO_REUSEADDR, 1)   # allow quick restarts (TIME_WAIT)
server.bind(("127.0.0.1", 0))                 # port 0 → OS picks a free port
server.listen()
port = server.getsockname()[1]
threading.Thread(target=serve, args=(server,), daemon=True).start()

with socket.create_connection(("127.0.0.1", port)) as client:
    client.sendall(b"hello sockets")
    print(client.recv(1024))
```

```output
b'HELLO SOCKETS'
```

## Message framing (TCP is a stream!)

TCP doesn't preserve message boundaries: two `send()` calls may arrive in one `recv()`, and one large message may arrive in several pieces. Frame messages yourself:

```python
import struct

def send_msg(sock, payload: bytes):
    sock.sendall(struct.pack("!I", len(payload)) + payload)    # 4-byte big-endian length prefix

def recv_exact(sock, n):
    buf = b""
    while len(buf) < n:
        chunk = sock.recv(n - len(buf))
        if not chunk:
            raise ConnectionError("socket closed mid-message")
        buf += chunk
    return buf

def recv_msg(sock) -> bytes:
    (length,) = struct.unpack("!I", recv_exact(sock, 4))
    return recv_exact(sock, length)
```

Alternatives: delimiter-based framing (newline-terminated lines, like HTTP headers), or higher-level protocols (HTTP, WebSocket, gRPC).

> [!WARNING]
> `sock.send()` may send only part of the data — use `sendall()`. `sock.recv(n)` returns **up to** n bytes — loop until you have what you need.

## UDP sockets

```python
import socket

srv = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)
srv.bind(("127.0.0.1", 0))
cli = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)
cli.sendto(b"hi", srv.getsockname())        # no connect/accept needed
msg, addr = srv.recvfrom(2048)              # one datagram per call
print(msg)                                  # b'hi'
```

## Handling many clients

| Model | How | Trade-off |
|---|---|---|
| Iterative | handle one client at a time | simple, but one slow client blocks everyone |
| Thread / process per client | spawn a worker per connection | easy; heavy at thousands of connections |
| Thread pool | fixed workers + queue | bounded resources |
| **I/O multiplexing / event loop** | `select`, `poll`, `epoll` (Linux), `kqueue` (BSD/macOS), IOCP (Windows) — one thread watches many sockets | scales to tens of thousands of connections (Nginx, Node.js, `asyncio`) |

### asyncio echo server

```python
import asyncio

async def handle(reader, writer):
    while data := await reader.read(1024):
        writer.write(data.upper())
        await writer.drain()
    writer.close()
    await writer.wait_closed()

async def main():
    server = await asyncio.start_server(handle, "127.0.0.1", 8888)
    async with server:
        await server.serve_forever()

# asyncio.run(main())
```

## Useful socket options

| Option | Purpose |
|---|---|
| `SO_REUSEADDR` | rebind a port still in TIME_WAIT (server restarts) |
| `SO_KEEPALIVE` | detect dead peers on idle connections |
| `TCP_NODELAY` | disable Nagle's algorithm for low-latency small messages |
| `SO_RCVBUF` / `SO_SNDBUF` | buffer sizes |
| `settimeout(seconds)` | avoid blocking forever |
| `setblocking(False)` | non-blocking mode for event loops |

## Ports and binding notes

- Binding to `0.0.0.0` (or `""`) listens on **all** interfaces; `127.0.0.1` only on loopback.
- Ports < 1024 usually need administrator privileges.
- "Address already in use" → another process holds the port, or the previous socket is in TIME_WAIT (use `SO_REUSEADDR`).

## WebSockets (bonus)

HTTP is request/response; **WebSocket** upgrades an HTTP connection (`101 Switching Protocols`) into a persistent, full-duplex message channel over TCP — used for chat, live dashboards and multiplayer games.

> [!INTERVIEW]
> - Explain socket → bind → listen → accept (server) and socket → connect (client).
> - Why does `accept()` return a new socket?
> - TCP is a byte stream — how do you frame messages?
> - How would you design a server for 10,000 concurrent connections? — Event-driven I/O (epoll/asyncio) or a thread pool, with non-blocking sockets.

> [!REMEMBER]
> Sockets are the app's door to TCP/UDP. Servers bind + listen + accept (new socket per client); clients connect. Use `sendall`, loop on `recv`, and frame messages with length prefixes. Scale with event loops.
