# TODO — Org-Scoped Refactors

These are NOT part of the admin dashboard v1.0.0 work. Address separately.

## Org Settings Form → Two-Column Section Layout

**File:** `src/features/settings/organization/components/org-settings-form.tsx`

Current: Stacked cards with `max-w-3xl`, each card has CardHeader + CardContent with 2-col grid.

Refactor to: Two-column section layout (Stripe/Clerk style) as defined in CLAUDE.md.
- Left column: section title + description
- Right column: Card with form fields (2-col grid)
- Separator between sections
- `max-w-4xl` container
- Danger zone at bottom with `border-destructive`
