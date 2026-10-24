# Security

Apply at every boundary and in generated code.

- Validate untrusted input (CLI args, env, files, network) once at the boundary; fail fast with actionable errors.
- Authenticate callers where required, then authorize the operation and target resource, including tenant/ownership scope. Deny missing or ambiguous authority; do not treat a valid identifier or UI-hidden action as permission.
- Never interpolate untrusted input into shell commands; use parameterized exec helpers.
- Parameterize database queries and keep untrusted values separate from executable syntax. Allowlist dynamic identifiers and destinations; use the platform's context-specific encoding rather than a generic sanitizer.
- Never put secrets in code, logs, or error messages.
- Minimize sensitive personal data in storage, telemetry, and error payloads; redact at reporting boundaries and retain only what the current contract requires.
- Keep file writes scoped to the narrowest path set; destructive operations fail closed on ambiguous scope.
- For untrusted paths, verify canonical containment and account for symlinks and check/use races; string prefixes alone do not prove containment. For untrusted URLs, restrict schemes and destinations according to the application's network trust boundary.
- Apply least privilege to tokens and permissions.
- Lock dependency resolution (lockfile) and review upgrades; no surprise installs.
