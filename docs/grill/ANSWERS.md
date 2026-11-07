# Grill Answers — Anthrix Lost & Found (Work-Page Case Study)

## 1. What this project is to Anthrix

**Service line:** Internal demo / Work-page case study.
- Not a paid client build. Not a graded capstone.
- "Done" = ships on the Anthrix Work page with the brand palette, theme toggle, footer pattern, and all brand-doc open items resolved:
  - Transparent SVG logo
  - Simplified favicon icon
  - Decided feature-section content
  - Four Get-in-touch card details (no longer "to be provided")

## 2. The user

**One real person:** Maria Santos, 22, accountancy student at a Manila university.
- Contact: maria.santos@student.university.ph
- Lost her ID badge and USB drive in the library last month. Recovered only the USB via a chaotic Facebook group post buried under 40 comments.

## 3. The problem

**Incumbent:** Free Facebook group that already has the users' attention.
**One thing Facebook cannot do:** Persistent, searchable, claim-verified item registry with admin-mediated handoff and immutable audit log.
- Facebook posts decay in the feed. No search by category/location/date. No proof-of-ownership flow. No record that an item was returned.

**Whose pain is worst:** The person who lost the item. They are anxious and actively searching. Design for them first.

## 4. The three must-haves (pass/fail tests)

### Report item
- Max 4 taps: category → photo → location pin → description.
- Photo upload fails → item saved as draft with "retry upload" button, not lost.
- Location = pin on map + optional free-text note (not free text only).
- **Pass:** item appears in feed within 10 seconds of submit.
- **Fail:** more than 4 taps, draft lost on upload failure, location is free-text only.

### Claim item
- User taps "Claim" → uploads proof photo (e.g., ID badge serial) → admin notified.
- Claim blocked without proof photo.
- **Pass:** claim submitted with proof, admin notified within 5 minutes.
- **Fail:** claim submitted without proof, or admin not notified.

### Reunite (admin resolves claim)
- Admin marks "Returned" → both parties get in-app + email notification, audit log entry written.
- **Pass:** both parties notified, audit log immutable entry exists.
- **Fail:** one party not notified, or no audit entry.

## 5. Claim verification by admin

- **Admin:** Anthrix operations staff, paid part-time (~5 hrs/week).
- **Turnaround commitment:** 24 hours.
- **While waiting:** claimer sees "Pending verification — we'll contact you within 24h"; item stays listed but locked from other claims.
- **Unstaffed queue = broken feature.** We staff it or we don't launch.

## 6. Who can post

- Account-required (email + password). No anonymous posting.
- Determines abuse story, moderation load, and data model.

## 7. Anti-claim-fraud

- Claim requires proof photo matched against item report by admin.
- Admin inspects: proof photo vs. item photo, claimer's contact details, timing/location consistency.
- If admin can't verify, claim is rejected and claimer notified.

## 8. Out of scope

- **No mobile app yet** — accepted, but the web app must be usable one-handed on a cheap Android on mobile data. If it isn't, "no mobile app" is a broken product, not out of scope.
- **Smallest cut if two weeks behind:** Claim verification by admin falls back to email-only verification (no in-app admin dashboard). Item reporting and browsing remain.

## 9. Data, privacy, and RA 10173

- **Privacy notice:** Linked at footer.
- **Consent checkbox:** On every post — "I consent to Anthrix storing my name, photo, and contact for item matching."
- **Retention/deletion:** 90 days, then auto-delete item record and photos. User can request deletion anytime.
- **Health information:** Explicitly not collected (out of scope).
- Applies to any name, photo, contact number stored. RA 10173 (Philippine Data Privacy Act).

## 10. Maintenance after handover

- **Hosting cost / domain / backups:** Anthrix operations budget.
- **Person who gets the call at 11 p.m.:** Anthrix operations staff (same as admin).
- If this were a capstone, the honest answer would be "nobody" — but this is a Work-page case study, so Anthrix owns it.

## 11. Tech stack

- Stack chosen by what the maintainer (Anthrix operations) can actually run, not what looks best on a résumé.
- SQLite if maintainer can deploy a single-file DB; Postgres only if someone pays for and manages the host.

## 12. Proof

- **Number that proves it worked at demo day:** 25 items reunited within 6 weeks of launch.
- **Bad-idea signal:** < 5 items reunited, or zero repeat users after month 1 → shut it down.
