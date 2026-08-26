# Repository instructions

## Scope

This repository is a personal, non-commercial, zero-cash-cost portfolio project. Preserve the architecture and contracts in docs unless a change is documented with an ADR.

## Required reading before implementation

1. README.md
2. docs/01-product-requirements.md
3. docs/02-requirements.md
4. docs/03-architecture.md
5. docs/04-command-specification.md
6. docs/05-api-data-policy.md
7. docs/06-security-operations.md
8. docs/07-test-strategy.md
9. docs/09-luna-handoff.md

Do not implement until docs/09-luna-handoff.md contains the exact line:

LUNA HANDOFF: READY

## Guardrails

- Do not crawl, scrape, automate, or reverse engineer Maple.GG or Maplescouter.
- Use Nexon Open API for MapleStory data and project-owned formulas for calculations.
- Treat Maple.GG and Maplescouter as outbound links only unless written permission is added to the repository.
- Never commit API keys, tokens, chat logs, Kakao identifiers, or personal data.
- Do not deploy, register external accounts, or write production secrets without explicit user approval.
- Keep the phone script thin. Business rules belong in the backend.
- Ignore non-command chat messages and minimize logged data.
- Stock output is informational only. Do not add trading, recommendations, price targets, or return guarantees.
- Use strict TypeScript and automated tests. A feature is incomplete until the relevant acceptance tests pass.
- Update README and affected specifications when behavior changes.

## Git and delivery

- Keep commits focused and written in English.
- Do not claim deployment or phone verification without observed evidence.
- Do not add a permissive or commercial-use license without user approval.

