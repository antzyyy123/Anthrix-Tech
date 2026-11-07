# TRD-v1 — Technical Requirements Document

Anthrix Lost & Found — Web App Case Study
Version: 1.0
Status: Draft (pending approval)

## 1. Overview

**Product:** Anthrix Lost & Found — a persistent, searchable, claim-verified item registry.
**Service line:** Internal demo / Work-page case study (not paid client build, not capstone).
**Platform:** Responsive web application (mobile-first, usable one-handed on cheap Android on mobile data).
**Deployment:** Stack chosen by what Anthrix operations can actually run (SQLite single-file or Postgres with managed host).

## 2. Functional requirements

### FR-01: User registration & authentication
- Users register with email + password. No anonymous posting.
- Account required to report or claim an item.
- Password reset via email.

### FR-02: Report a found item
- Max 4 taps: category → photo → location pin → description.
- Photo upload failure → item saved as draft with "retry upload" button; draft not lost.
- Location = pin on map + optional free-text note.
- Item appears in feed within 10 seconds of submit.
- Consent checkbox required: "I consent to Anthrix storing my name, photo, and contact for item matching."

### FR-03: Browse & search items
- Search/filter by category, location, date range.
- Items displayed in feed; expired items (past 90 days) hidden.

### FR-04: Claim an item
- User taps "Claim" → uploads proof photo → admin notified within 5 minutes.
- Claim blocked without proof photo.
- Item locked from other claims while a claim is pending.

### FR-05: Admin claim verification
- Admin = Anthrix operations staff (paid part-time, ~5 hrs/week).
- Turnaround commitment: 24 hours.
- While pending: claimer sees "Pending verification — we'll contact you within 24h."
- Admin inspects: proof photo vs. item photo, claimer contact details, timing/location consistency.
- Admin can approve or reject; claimer notified either way.

### FR-06: Reunion resolution
- Admin marks item "Returned" → both parties get in-app + email notification.
- Immutable audit log entry written for every state change.

### FR-07: Privacy & data retention (RA 10173)
- Privacy notice linked at footer.
- Consent checkbox on every post.
- Retention: 90 days, then auto-delete item record and photos.
- User can request deletion anytime.
- No health information collected.

### FR-08: Audit log
- Immutable append-only log of: item reported, claim submitted, claim approved/rejected, item returned, item deleted, user deletion request.
- Log entries cannot be modified or deleted by any user including admin.

## 3. Non-functional requirements

### NFR-01: Performance
- Item appears in feed within 10 seconds of submit.
- Page load < 3 seconds on 3G / cheap Android.
- Search results < 2 seconds.

### NFR-02: Availability
- Admin verification queue staffed 24-hour turnaround (business days).
- Unstaffed queue = broken feature; do not launch without staffing commitment.

### NFR-03: Security
- Passwords hashed (bcrypt or equivalent).
- Proof photos and item photos stored with access control (not publicly guessable URLs).
- Authorization: only item reporter and admin can modify an item; only claimer and admin can modify a claim.
- SQL injection, input fuzzing, session tampering, authorization bypass all blocked.

### NFR-04: Accessibility
- Usable one-handed on mobile.
- Theme toggle (light/dark) respecting system preference or manual selection.
- WCAG AA contrast minimums.

### NFR-05: Observability
- Audit log immutable and queryable.
- Error logging for failed uploads, failed notifications, failed deletions.

## 4. Data model (summary)

**User:** id, email, password_hash, name, created_at, deleted_at
**Item:** id, reporter_id, category, title, description, photo_url, location_lat, location_lng, location_note, status (draft/listed/claimed/returned/deleted), created_at, updated_at, deleted_at
**Claim:** id, item_id, claimer_id, proof_photo_url, status (pending/approved/rejected), admin_notes, created_at, resolved_at, resolved_by
**AuditLog:** id, actor_id, action, entity_type, entity_id, before, after, created_at (immutable)
**ConsentRecord:** id, user_id, version, created_at

## 5. Out of scope

- Native mobile app (web app only; must still work on mobile browser).
- Health information tracking.
- Payment processing.
- Multi-school / multi-organization tenancy (single Anthrix deployment).

## 6. Gaps (unverified claims)

- G-01: Transparent SVG logo not yet provided by brand doc.
- G-02: Simplified favicon icon not yet decided.
- G-03: Feature-section content not yet written.
- G-04: Four Get-in-touch card details still "to be provided."
- G-05: Email notification provider and cost not yet selected.
- G-06: Map tile provider and free-tier limits not yet confirmed.
- G-07: Proof-photo storage (S3-compatible vs. local filesystem) and cost at 100 photos/week not yet confirmed.
- G-08: Admin dashboard build vs. email-only fallback for MVP not yet decided.
- G-09: RA 10173 Data Protection Officer (internal vs. external) not yet determined.
- G-10: Breach notification process not yet defined.

## 7. Success metrics

- 25 items reunited within 6 weeks of launch (demo day target).
- < 5 items reunited or zero repeat users after month 1 → shut it down.
