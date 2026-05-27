---
trigger: always_on
---

---
name: backend-fortress-architecture
description: Architect ironclad, zero-trust, and high-performance backend systems. Use this skill when building APIs, microservices, database layers, auth services, or cryptographic pipelines. Generates highly optimized, multi-layered defensive code that proactively mitigates vulnerabilities and rejects insecure AI boilerplate.
license: Complete terms in LICENSE.txt
---

This skill guides the creation of deep defensive, production-grade backend systems. It rejects vulnerable, "happy-path-only" AI code. Implement real working code with a Zero-Trust mindset, ensuring absolute input validation, explicit exception boundaries, strict cryptographic standards, and runtime invariant checks at every execution stage.

## Secure Architectural Thinking

Before writing a single line of execution logic, map out the data-flow boundaries and design explicit security checkposts:
- **Zero-Trust Input Boundary**: Treat all incoming data—regardless of source (HTTP, gRPC, WebSockets, or internal queues)—as highly malicious. Where and how is it sanitized and bound?
- **Defensive Layers**: If the API gateway fails, how does the service layer validate authorization? If the service layer compromises, how does the database layer enforce data isolation (e.g., Row-Level Security)?
- **Least Privilege Execution**: Does this database session, container process, or API token have access to exactly what it needs and absolutely nothing more?
- **Fail-Secure Principle**: When an exception occurs mid-flight, does the system revert to a secure, immutable state, or does it leak diagnostic traces and half-mutated data?

**CRITICAL**: Security is not a wrapper added at the end; it is baked into the type system and flow control. Code must verify identity, state, and permissions at **every single layer transition**.

## Ironclad Engineering & Security Guidelines

Focus on:
- **Strict Invariant & Runtime Schema Validation**: Validate all inputs at the edge using rigorous runtime schemas (Zod, Pydantic, TypeBox). Enforce type casting and regex constraints for string vectors. Drop unmapped fields immediately to prevent Mass Assignment/Parameter Pollution attacks.
- **Deep Authentication & Contextual Authorization**: Implement cryptographically secure token validation (e.g., short-lived JWTs with asymmetric keys, RS256/EdDSA) paired with opaque blacklisted refresh tokens. Validate user permissions (RBAC/ABAC) at the route, service *and* resource levels before executing business logic.
- **Parametrized Data Layers & Injection Defenses**: Make SQL injection structurally impossible. Write explicit, parametrized queries or strictly typed ORM statements. For dynamic queries, sanitize and strictly white-list column identifiers. Ensure multi-tenant databases isolate client data natively using Row-Level Security (RLS) or isolated logical schemas.
- **Fail-Secure Error Handling & Zero Leakage**: Wrap hazardous segments in precise `try/catch/except` structures. Log detailed structural metadata (with correlation IDs) internally, but sanitize API responses completely. Never return system paths, database exceptions, internal module names, or raw stack traces to the client.
- **Idempotency, Rate-Limiting & Anti-DoS Defenses**: Implement multi-tier rate-limiting (IP-based, Token-based, sliding window via Redis). Defend mutating API endpoints (POST/PUT/PATCH) with cryptographically random Idempotency Keys to prevent double-spending or race-condition replays. Use Optimistic Concurrency Control (OCC) to prevent data corruption under concurrent heavy load.
- **Cryptographic Excellence & Secret Isolation**: Never hardcode keys or environmental tokens. Utilize industry-standard hashing routines (Argon2id or bcrypt with adaptive work factor) for credential storage. Use AES-GCM or ChaCha20-Poly1305 for data-at-rest encryption.

NEVER use generic, high-risk AI boilerplate patterns, such as:
- Raw string interpolation or concatenation within database queries (`SELECT * FROM users WHERE id = ${id}`).
- Blind catch-all error blocks (`catch(err) { return res.status(500).json({error: err.message}) }`) that leak architecture internals.
- Trusting client-supplied metadata for authorization decisions (e.g., checking `req.body.isAdmin`).
- Storing plain-text or poorly salted credentials, or relying on weak legacy hashing functions (MD5, SHA1).

## Complete Execution Checkposts

Every generated component must satisfy this validation matrix before delivery:

| Phase | Security Checkpoint | Failure Recovery Rule |
| :--- | :--- | :--- |
| **Ingress Boundary** | Runtime type verification, schema validation, rate-limiting check. | HTTP 400 (Bad Request) or HTTP 429 (Too Many Requests). Log as `Warn`. |
| **Identity Layer** | Signature validation, token expiration verify, tenant scope extraction. | HTTP 401 (Unauthorized) or HTTP 403 (Forbidden). Log as `Warn/Error`. |
| **Service Logic** | Resource-level ownership check, business invariant verification, OCC lock check. | Explicit domain error generation. Trigger ACID transactional Rollback immediately. |
| **Persistence / IO** | Parameterized query compilation, connection pool health check, schema constraint check. | Bubble up to safe domain exceptions. Return generic HTTP 500 without internals. |
| **Egress Boundary** | DTO (Data Transfer Object) filtering, stripping confidential object graphs. | Drop properties, sanitize output schema, safe string serialization. |

Architect with zero compromises. Write beautiful, self-healing code that transforms security from an afterthought into a mathematical certainty.