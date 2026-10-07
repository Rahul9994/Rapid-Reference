**HTTP (HyperText Transfer Protocol)** is the application-layer protocol of the web: a client sends a **request**, a server returns a **response**. It's **stateless** — each request is independent — with state added via cookies and tokens.

## Request and response anatomy

```http
GET /api/users/42?fields=name HTTP/1.1
Host: api.example.com
Accept: application/json
Authorization: Bearer eyJhbGciOi...
User-Agent: Mozilla/5.0
```

```http
HTTP/1.1 200 OK
Content-Type: application/json
Content-Length: 27
Cache-Control: max-age=60
Set-Cookie: session=abc123; HttpOnly; Secure; SameSite=Lax

{"id": 42, "name": "Ada"}
```

| Request part | Example |
|---|---|
| Method | `GET`, `POST`, … |
| Target (path + query) | `/api/users/42?fields=name` |
| Version | `HTTP/1.1` |
| Headers | `Host`, `Accept`, `Authorization`, `Cookie` |
| Body (optional) | JSON, form data, files |

## Methods

| Method | Purpose | Safe | Idempotent | Body |
|---|---|---|---|---|
| **GET** | retrieve a resource | ✅ | ✅ | no (should not) |
| **HEAD** | GET without the body (metadata) | ✅ | ✅ | no |
| **POST** | create / submit / non-idempotent actions | ❌ | ❌ | yes |
| **PUT** | create or **replace** a resource at a URI | ❌ | ✅ | yes |
| **PATCH** | partially update | ❌ | ❌ (not guaranteed) | yes |
| **DELETE** | remove a resource | ❌ | ✅ | optional |
| **OPTIONS** | supported methods / CORS preflight | ✅ | ✅ | no |

- **Safe**: doesn't change server state.
- **Idempotent**: repeating the request has the same effect as doing it once (important for retries).

## Status codes

| Class | Meaning | Common codes |
|---|---|---|
| **1xx** Informational | continue | 100 Continue, 101 Switching Protocols (WebSocket upgrade) |
| **2xx** Success | it worked | **200 OK**, **201 Created**, 202 Accepted, **204 No Content** |
| **3xx** Redirection | go elsewhere | **301 Moved Permanently**, **302 Found**, **304 Not Modified**, 307/308 (method-preserving) |
| **4xx** Client error | your request is wrong | **400 Bad Request**, **401 Unauthorized** (not authenticated), **403 Forbidden** (not allowed), **404 Not Found**, 405 Method Not Allowed, 409 Conflict, 422 Unprocessable, **429 Too Many Requests** |
| **5xx** Server error | the server failed | **500 Internal Server Error**, **502 Bad Gateway**, **503 Service Unavailable**, **504 Gateway Timeout** |

> [!TIP]
> 401 = "who are you?" (missing/invalid credentials). 403 = "I know who you are, and you're not allowed."

## Important headers

| Header | Direction | Purpose |
|---|---|---|
| `Host` | request | which site (virtual hosting) — mandatory in HTTP/1.1 |
| `Content-Type` / `Content-Length` | both | body format and size |
| `Accept`, `Accept-Encoding` | request | preferred formats / compression (gzip, br) |
| `Authorization` | request | credentials (Basic, Bearer tokens) |
| `Cookie` / `Set-Cookie` | request / response | state management |
| `Cache-Control`, `ETag`, `Last-Modified` | response | caching and validation |
| `If-None-Match`, `If-Modified-Since` | request | conditional requests → 304 |
| `Location` | response | redirect target / created resource |
| `Connection: keep-alive` | both | reuse the TCP connection |
| `Access-Control-Allow-Origin` | response | CORS permission |
| `User-Agent`, `Referer` | request | client info / previous page |

## Statelessness, cookies and sessions

HTTP doesn't remember previous requests. To keep users logged in:

- **Cookies**: the server sets `Set-Cookie`; the browser sends `Cookie` on later requests to that domain.
  - `HttpOnly` (no JavaScript access → mitigates XSS theft), `Secure` (HTTPS only), `SameSite` (CSRF protection), `Expires`/`Max-Age`.
- **Server-side sessions**: the cookie holds a session ID; data lives on the server.
- **Tokens (e.g. JWT)**: signed, self-contained claims sent in the `Authorization` header — stateless on the server, but hard to revoke.

## Caching

- `Cache-Control: max-age=3600` → reuse for an hour without asking.
- `no-cache` → must revalidate; `no-store` → never cache; `private` / `public`.
- Validation: server returns `ETag: "v5"`; client later sends `If-None-Match: "v5"` → **304 Not Modified** with no body.

## HTTP versions

| Version | Key features |
|---|---|
| HTTP/1.0 | one request per TCP connection |
| **HTTP/1.1** | persistent connections (keep-alive), `Host` header, chunked transfer, pipelining (rarely used); suffers **head-of-line blocking** — browsers open ~6 connections per host |
| **HTTP/2** | binary framing, **multiplexing** many streams over one TCP connection, header compression (HPACK), server push (deprecated in browsers); TCP-level head-of-line blocking remains |
| **HTTP/3** | runs over **QUIC (UDP)**; streams are independent (no TCP head-of-line blocking), faster handshakes (0-RTT/1-RTT, TLS 1.3 built in), connection migration across networks |

## REST basics

**REST** is an architectural style using HTTP semantics: resources identified by URLs, manipulated with standard methods, stateless requests, cacheable responses.

| Action | Request |
|---|---|
| List users | `GET /users` |
| Get one user | `GET /users/42` |
| Create user | `POST /users` → `201 Created` + `Location: /users/43` |
| Replace user | `PUT /users/42` |
| Update fields | `PATCH /users/42` |
| Delete user | `DELETE /users/42` → `204 No Content` |

## Making requests in Python

```python
from urllib.request import Request, urlopen
import json

req = Request("https://api.github.com/repos/python/cpython", headers={"Accept": "application/json"})
with urlopen(req, timeout=10) as resp:
    print(resp.status, resp.headers["Content-Type"])
    data = json.load(resp)
    print(data["full_name"])
```

(The popular third-party `requests` library makes this even shorter: `requests.get(url).json()`.)

## CORS (Cross-Origin Resource Sharing)

Browsers block JavaScript from reading responses from a **different origin** (scheme + host + port) unless the server allows it with `Access-Control-Allow-Origin`. Non-simple requests (e.g. JSON `PUT`) trigger a **preflight** `OPTIONS` request first.

> [!INTERVIEW]
> - GET vs POST (safe/idempotent, body, caching, bookmarks, length limits in practice).
> - PUT vs PATCH vs POST.
> - Common status codes, especially 200/201/204/301/302/304/400/401/403/404/500/502/503.
> - HTTP is stateless — how are sessions maintained?
> - HTTP/1.1 vs HTTP/2 vs HTTP/3.

> [!REMEMBER]
> Request = method + URL + headers + body; response = status + headers + body. GET/PUT/DELETE are idempotent, POST isn't. 2xx success, 3xx redirect, 4xx client error, 5xx server error. Cookies/tokens add state; HTTP/2 multiplexes, HTTP/3 runs on QUIC.
