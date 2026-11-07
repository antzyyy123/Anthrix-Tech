# The Six Commands: Golden Path Workflow

> **From PHINMA AI Builder Workshop**
> *Run them in this order. Each one leaves a file the next one reads.*

```
1  /grill-with-docs   Interrogates your problem
2  /pitch             Writes your three minute pitch
3  /to-spec           Writes the spec
4  /to-tickets        Breaks it into tickets
5  /implement         Builds one ticket
6  /code-review       Checks it is correct and safe
```

---

## The Six Commands Pipeline

### 1. `/grill-with-docs` — Interrogates your problem
- **Purpose:** Systematically interrogate requirements, identify edge cases, uncover contradictions, and challenge assumptions against reference documents and project briefs.
- **What it reads:** Project brief, reference materials, open questions.
- **What it leaves:** `docs/grill/ANSWERS.md` and an updated `docs/OPEN-QUESTIONS.md`.
- **Rule:** Ask ONE question at a time. Do not batch. Push back on vague or untestable answers.

---

### 2. `/pitch` — Writes your three minute pitch
- **Purpose:** Synthesizes the core value proposition, stakeholder alignment, and day-one ROI into a crisp, persuasive 3-minute executive pitch.
- **What it reads:** `docs/grill/ANSWERS.md`.
- **What it leaves:** `docs/pitch/PITCH.md` (1-page executive summary & pitch script).
- **Rule:** Connect every feature to a real operational pain, time saved, or compliance risk eliminated.

---

### 3. `/to-spec` — Writes the spec
- **Purpose:** Synthesizes verified answers into formal technical and product specifications.
- **What it reads:** `docs/grill/ANSWERS.md`, `docs/decisions/ARB-LOG.md`, reference schemas.
- **What it leaves:**
  - `docs/spec/TRD-v1.md` (Technical Requirements Document)
  - `docs/spec/PRODUCT-SPEC-v1.md` (Product & UX Specification)
- **Rule:** Never overwrite an approved spec in-place; changes create `v2`, `v3`. Unverified claims stay cataloged as Gaps.

---

### 4. `/to-tickets` — Breaks it into tickets
- **Purpose:** Decomposes the approved specification into atomic, verifiable, sequentially ordered implementation tickets.
- **What it reads:** Latest approved `TRD` and `PRODUCT-SPEC`.
- **What it leaves:** `docs/tickets/T-001.md` onward, `STATUS.md`, and `DEPENDENCY-GRAPH.md`.
- **Rule:** Every ticket must have testable acceptance criteria (concrete input -> expected output) and explicit dependencies. No circular dependencies.

---

### 5. `/implement [ticket-id]` — Builds one ticket
- **Purpose:** Test-driven implementation of a single ticket with deterministic gate checks.
- **What it reads:** The target ticket file and relevant spec sections.
- **What it leaves:** Production code and automated test files. Updates `docs/tickets/STATUS.md`.
- **Rule:** Write tests FIRST, then implementation. Synthetic data only. 3-stage gate: extraction, static linter/invariant check, test execution. Maximum 3 retry attempts before escalating.

---

### 6. `/code-review` (or `/harden`) — Checks it is correct and safe
- **Purpose:** Rigorous security, database integrity, and adversarial verification.
- **What it reads:** Implemented code and tests.
- **What it leaves:** `docs/harden/REPORT.md` (attack results, verified invariant logs, fix tickets `T-3xx`).
- **Rule:** Test authorization bypass, SQL injection, input fuzzing, audit log immutability, session tampering, and network boundary enforcement. All attacks must be blocked and logged.
