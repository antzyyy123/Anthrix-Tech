# STATUS.md — Project status

Anthrix — Static website with contact form
Version: 1.0

## Project (pivoted from Flask/Lost & Found)

This is a static website only. The contact form is the sole functional element.
No backend, no database, no server-side rendering.

## Files

| File | Purpose |
|------|---------|
| index.html | Home page |
| services.html | Services (capstone, websites, side services) |
| work.html | Work / portfolio |
| contact.html | Contact page with functional form |
| styles.css | All styles |
| script.js | Nav toggle + contact form validation & submission |

## Contact form fields

- Name (required)
- Email (required, email format)
- Project (required)
- Budget (optional select)
- Time line (optional select)
- What are you building? (required textarea)

## Form submission

- Client-side validation on all required fields
- POST JSON to `/api/contact` (or the form's `action` attribute)
- Success/error messages shown inline
- On static hosting, wire `/api/contact` to your form backend (Formspree, Netlify Forms, or custom endpoint)

## Notes

- Previous Flask/Lost & Found implementation (app.py, models.py, tests/, instance/, uploads/) has been removed &mdash; this site is static only.
