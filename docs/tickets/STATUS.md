# STATUS.md — Ticket implementation status

Anthrix Lost & Found — Ticket tracker
Version: 1.0

## Legend
- `pending` — not started
- `in_progress` — actively being implemented
- `blocked` — waiting on dependency or decision
- `done` — implemented, tests pass, gate checks green

## Ticket status

| Ticket | Title | Depends on | Status |
|--------|-------|------------|--------|
| T-001 | Repo & stack setup | — | done |
| T-002 | User registration & authentication | T-001 | done |
| T-003 | Report item form | T-001, T-002 | done |
| T-004 | Photo upload with draft retry | T-003 | done |
| T-005 | Location pin on map | T-003 | done |
| T-006 | Browse & search feed | T-001, T-003 | done |
| T-007 | Item detail view | T-003, T-005 | done |
| T-008 | Claim item with proof photo | T-002, T-003, T-007 | in_progress |
| T-009 | Admin claim verification queue | T-008 | pending |
| T-010 | Admin approve/reject claim | T-009 | pending |
| T-011 | Mark returned + notifications | T-010 | pending |
| T-012 | Immutable audit log | T-001, T-002 | pending |
| T-013 | Privacy: consent, retention, deletion | T-001, T-002, T-003 | pending |
| T-014 | Theme toggle & accessibility | T-001 | pending |
| T-015 | Deployment & hosting | T-001..T-014 | pending |

## Next ticket
T-008 (depends on T-002, T-003, T-007, all done)

## Blocked tickets
None yet.

## Notes
- Tickets must be implemented in dependency order; no circular dependencies exist in this graph.
- Each ticket requires tests written first (per /implement rule), then implementation, then 3-stage gate: extraction, static linter/invariant check, test execution.
- Maximum 3 retry attempts per ticket before escalating.
