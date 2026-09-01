## Problem

<!-- Link the issue and explain the user or engineering impact. Use `Closes #N` when this PR fully resolves it. -->

Closes #

## Changes

-

## Design decisions and trade-offs

<!-- Explain important boundaries: thin relay, provider isolation, privacy, cost, and rejected alternatives. -->

## Verification

### Repository

- [ ] `pnpm format:check`
- [ ] `pnpm policy:check`
- [ ] `pnpm phone:check`
- [ ] `pnpm audit`
- [ ] `pnpm lint`
- [ ] `pnpm typecheck`
- [ ] `pnpm test`
- [ ] `pnpm build`
- [ ] `pnpm lambda:dry-run`

### Runtime evidence

- AWS observation: Not applicable / <!-- endpoint, status, timestamp; never include credentials -->
- Android/KakaoTalk E2E: Not observed / User-confirmed / Independently observed

## Review response

<!-- Summarize material human or automated review comments and how each was handled. AI review is advisory; deterministic CI and author judgment remain authoritative. -->

## Risk and rollback

- Security/privacy impact:
- Cost impact:
- Provider-policy impact:
- Rollback or disable path:

## Documentation

- [ ] README, command specification, operations, troubleshooting, or change log was updated where relevant.
- [ ] No secret, real room name, user identifier, or private chat content is included.
- [ ] Claims distinguish repository evidence, AWS-observed evidence, and user-device confirmation.
