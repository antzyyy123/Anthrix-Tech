# PRODUCT-SPEC-v1 — Product & UX Specification

Anthrix Lost & Found — Web App Case Study
Version: 1.0
Status: Draft (pending approval)

## 1. Product vision

A persistent, searchable, claim-verified lost-and-found registry that outlives a Facebook post. Built for students, small businesses, and local offices who lose things and need a reliable way to get them back.

## 2. Target user

**Primary:** Maria Santos, 22, accountancy student — anxious, actively searching, needs fast search and proof of ownership.
**Secondary:** The finder — wants to do the right thing with minimal effort.

## 3. Core user flows

### Flow A: Report a found item
1. User logs in.
2. Taps "Report Item."
3. Selects category (dropdown).
4. Takes or uploads photo.
5. Drops pin on map (or types optional note).
6. Writes description.
7. Checks consent box.
8. Taps "Submit."
- Photo upload fails → draft saved, "retry upload" shown.
- Item appears in feed within 10 seconds.
- Max 4 taps to core submission (category, photo, location, description).

### Flow B: Search for a lost item
1. User logs in.
2. Opens feed or search page.
3. Filters by category, location, date range.
4. Scans results; taps an item to view details.
5. If match, taps "Claim."

### Flow C: Claim an item
1. User taps "Claim" on item detail.
2. Uploads proof photo (ID badge serial, distinguishing mark).
3. Submits claim.
4. Sees: "Pending verification — we'll contact you within 24h."
5. Item locked from other claims while pending.
6. Admin approves or rejects within 24 hours.
7. User notified in-app + email.

### Flow D: Admin verifies claim
1. Admin opens claim queue.
2. Reviews proof photo vs. item photo, claimer contact, timing/location.
3. Taps "Approve" or "Reject" (adds notes if reject).
4. Both parties notified; audit log entry written.

### Flow E: Reunite
1. Admin marks item "Returned."
2. Reporter and claimer get in-app + email notification.
3. Audit log entry written (immutable).

## 4. Screen inventory

| Screen | Purpose | Key elements |
|--------|---------|--------------|
| Login / Register | Auth | email, password, consent link |
| Feed | Browse items | search bar, category/location/date filters, item cards |
| Item detail | View + claim | photos, location map, description, "Claim" button |
| Report item | Create item | category, photo upload, map pin, description, consent checkbox, submit |
| Drafts | Retry failed uploads | list of drafts, "retry upload" per draft |
| Claim queue (admin) | Verify claims | claim list, proof photo, approve/reject buttons |
| Profile | Account + deletion | email, consent history, "request deletion" |
| Privacy notice | Legal | RA 10173 summary, retention, deletion rights |
| Notifications | In-app alerts | claim updates, reunion notices |

## 5. UI requirements

### Theme
- Brand palette from Anthrix brand doc.
- Theme toggle (light/dark), default follows system preference.
- Footer pattern per brand doc (transparent SVG logo, simplified favicon — pending brand assets).

### Mobile
- Usable one-handed on cheap Android on mobile data.
- Touch targets ≥ 44px.
- Map pin interaction works on touch.

### Accessibility
- WCAG AA contrast.
- Focus states visible.
- Screen-reader labels on icons and buttons.

## 6. Content requirements

### Item card (feed)
- Thumbnail photo
- Category badge
- Location (pin + note)
- Date posted
- Status tag (listed/claimed/returned)

### Item detail
- Full photo gallery
- Location on map
- Full description
- Reporter contact (only after claim approved, or via platform)
- "Claim" button (hidden if already claimed)

### Consent copy
- "I consent to Anthrix storing my name, photo, and contact for item matching." (required checkbox)

### Pending claim copy
- "Pending verification — we'll contact you within 24h."

### Deletion
- "Request deletion: your item record and photos will be removed within 90 days."

## 7. Out of scope

- Native mobile apps (iOS/Android).
- In-app messaging between users (all contact via admin or platform-mediated email).
- Payments, donations, or rewards for returned items.
- Health or sensitive personal information tracking.

## 8. Open questions (blocking UI finalization)

- Q-01: Transparent SVG logo — brand doc pending.
- Q-02: Simplified favicon icon — not yet decided.
- Q-03: Feature-section content for Work page — not yet written.
- Q-04: Four Get-in-touch card details — "to be provided."
- Q-05: Theme toggle default (system vs. manual).
- Q-06: Map tile provider (free tier, attribution).
- Q-07: Proof-photo storage location and display sizing.
