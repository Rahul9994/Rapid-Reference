**HTTPS** is HTTP over **TLS** (Transport Layer Security). TLS provides **confidentiality** (encryption), **integrity** (tamper detection) and **authentication** (you're talking to the real server) — on port **443**.

## What TLS protects against

| Without TLS | With TLS |
|---|---|
| Anyone on the path (Wi-Fi, ISP) can read passwords and cookies | traffic is encrypted |
| Responses can be modified (ad/malware injection) | integrity checks (MACs/AEAD) detect tampering |
| You can be sent to a fake server | certificates prove the server's identity |

SSL is the obsolete predecessor (SSL 2.0/3.0 are broken); people still say "SSL certificate". Use **TLS 1.2 or 1.3**.

## Cryptography building blocks

| Concept | Role in TLS | Examples |
|---|---|---|
| **Symmetric encryption** | encrypts bulk data (fast; same key both sides) | AES-GCM, ChaCha20-Poly1305 |
| **Asymmetric (public-key) crypto** | key exchange and signatures (slow; public/private key pair) | RSA, ECDSA, Ed25519 |
| **Key exchange** | agree on a shared secret over an insecure channel | (EC)DHE — Diffie–Hellman ephemeral |
| **Hashing** | fingerprints, integrity, key derivation | SHA-256, SHA-384 |
| **MAC / AEAD** | authenticate each record | HMAC, AES-GCM tag |
| **Digital certificates** | bind a public key to a domain, signed by a CA | X.509 |

Asymmetric crypto is used to **establish** a session key securely; symmetric crypto then encrypts the actual data efficiently.

## Certificates and the chain of trust

A server certificate contains the domain name(s) (SAN), the server's **public key**, validity dates, and a **signature** from a Certificate Authority (CA).

```diagram Chain of trust
 Root CA certificate        (pre-installed in your OS/browser trust store, self-signed)
        │ signs
 Intermediate CA certificate
        │ signs
 Server certificate for www.example.com  ← sent by the server during the handshake
```

The client verifies: every signature in the chain, the root is trusted, the name matches the URL, the certificate isn't expired or revoked (CRL/OCSP), and (in modern browsers) it appears in **Certificate Transparency** logs.

## TLS 1.2 handshake (RSA/ECDHE, simplified)

```diagram TLS 1.2 full handshake — 2 round trips before data
 Client                                             Server
   │ ── ClientHello (versions, cipher suites, random) ──► │
   │ ◄── ServerHello (chosen suite, random) ───────────── │
   │ ◄── Certificate, ServerKeyExchange (ECDHE params,    │
   │      signed), ServerHelloDone ────────────────────── │
   │ ── ClientKeyExchange (client ECDHE share),           │
   │    ChangeCipherSpec, Finished (encrypted) ─────────► │
   │ ◄── ChangeCipherSpec, Finished (encrypted) ───────── │
   │ ═════════════ encrypted application data ══════════ │
```

Both sides derive the same **session keys** from the randoms and the shared (EC)DHE secret.

## TLS 1.3 handshake (faster, safer)

```diagram TLS 1.3 — 1 round trip (0-RTT possible on resumption)
 Client                                                  Server
   │ ── ClientHello + key share (guessing the group) ──────► │
   │ ◄── ServerHello + key share, {EncryptedExtensions,      │
   │      Certificate, CertificateVerify, Finished} ──────── │
   │ ── {Finished} + encrypted application data ───────────► │
```

| TLS 1.2 | TLS 1.3 |
|---|---|
| 2-RTT handshake | 1-RTT (0-RTT resumption, with replay caveats) |
| many legacy cipher suites (RSA key transport, CBC, SHA-1) | only modern AEAD suites; RSA key transport removed |
| forward secrecy optional | **forward secrecy mandatory** (ephemeral DH) |
| certificate sent in plaintext | most of the handshake is encrypted |

**Forward secrecy**: even if the server's private key leaks later, past sessions can't be decrypted, because each session used fresh ephemeral DH keys.

## HTTPS in the bigger picture

1. DNS resolves the name.
2. TCP 3-way handshake (or QUIC for HTTP/3, which integrates TLS 1.3).
3. TLS handshake (certificate verification, key exchange).
4. Encrypted HTTP requests/responses.

**SNI (Server Name Indication)** — the client sends the hostname in ClientHello so one IP can host many certificates (Encrypted Client Hello hides it).

**HSTS** (`Strict-Transport-Security` header) tells browsers to always use HTTPS for a domain, preventing SSL-stripping downgrade attacks.

## Inspecting TLS from Python

```python
import socket, ssl

ctx = ssl.create_default_context()                      # verifies certificates + hostname
with socket.create_connection(("www.python.org", 443), timeout=10) as raw:
    with ctx.wrap_socket(raw, server_hostname="www.python.org") as tls:
        print(tls.version())                            # e.g. TLSv1.3
        cert = tls.getpeercert()
        print(dict(x[0] for x in cert["subject"])["commonName"], cert["notAfter"])
```

> [!WARNING]
> Never disable certificate verification (`verify=False`, `CERT_NONE`) in production — it silently allows man-in-the-middle attacks.

## Common attacks and mitigations

| Attack | Mitigation |
|---|---|
| Man-in-the-middle with a fake certificate | CA validation, certificate pinning (apps), CT logs |
| SSL stripping (downgrade to HTTP) | HSTS + HSTS preload list |
| Protocol downgrade (old TLS) | disable TLS < 1.2, downgrade protection in TLS 1.3 |
| Expired/misissued certificates | automated renewal (ACME / Let's Encrypt), CAA records |

> [!INTERVIEW]
> - HTTP vs HTTPS.
> - How does the TLS handshake establish a shared key? — (EC)DHE key exchange authenticated by the server's certificate signature.
> - Why both asymmetric and symmetric encryption? — Asymmetric to agree on keys securely, symmetric for speed.
> - What does a certificate prove, and how is it verified?
> - TLS 1.2 vs 1.3; what is forward secrecy?

> [!REMEMBER]
> HTTPS = HTTP inside TLS on port 443. Certificates authenticate the server via a CA chain; ephemeral Diffie–Hellman creates session keys (forward secrecy); AES-GCM/ChaCha20 encrypt the data. TLS 1.3 = 1-RTT, encrypted handshake, modern ciphers only.
