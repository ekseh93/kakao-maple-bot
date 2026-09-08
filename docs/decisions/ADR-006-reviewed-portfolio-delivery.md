# ADR-006: Reviewed integration and verifiable portfolio evidence

Status: Accepted

Date: 2026-09-08

Tracking: [Issue #10](https://github.com/ekseh93/kakao-maple-bot/issues/10)

## Context

PR #9 established a review workflow. Later changes accumulated outside main, and recent CI stopped at formatting before other checks ran. Public explanations must distinguish the reviewed baseline, work in progress, and historical deployment records.

## Decision

- Use short-lived `codex/issue-N-description` branches and PRs into main.
- Require a PR without requiring a second human approver for this solo repository. Retain required `verify`, conversation resolution, and no force pushes/deletions.
- Run quality, security, and test/build suites independently. Keep `verify` as a stable aggregate gate that fails on any failed, cancelled, or skipped suite.
- Keep CodeRabbit advisory; respond to material findings with evidence.
- Import the existing follow-up snapshot and sanitize it before the integration commit, without rewriting old branches or inventing historical Issue-to-PR activity.
- Present AI-assisted contribution scope, execution-local caches, relay credentials, and verification limitations explicitly.
- Keep AWS deployment separate from CI and merge. This decision grants no deployment or secret-change authority.

## Consequences

- A format failure no longer hides the independent test/build and security results.
- Parallel jobs duplicate installation but use the dependency cache and have bounded timeouts.
- No paid review tier or new runtime service is required.
- Configurable private responses require private deployment configuration; they default to disabled.
- Old branch history is not sanitized by this integration. Removing historical personal data requires a separate history-cleanup decision.
