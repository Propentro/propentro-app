# Admin Me ImageUrl & Organization Create Simplification

**Date:** 2026-03-18
**Scope:** propentro-api + propentro-app (cross-repo)
**Status:** Approved

## Summary

Two focused changes to improve admin panel consistency and simplify organization creation:

1. **AdminMe ImageUrl** — Show profile image in admin user menu by reading Clerk's `imageUrl` directly in the component
2. **Organization Create Simplification** — Remove unnecessary fields from create flow, defaulting every org to `starter` plan

---

## 1. AdminMe ImageUrl

### Problem

The admin user menu (`AdminUserMenu`) only shows initials — no profile image. The regular user menu shows a Clerk-provided `imageUrl` but uses a layout-level injection pattern that mixes API and Clerk data into one type.

### Solution

Use `useUser()` from `@clerk/nextjs` directly in `AdminUserMenu` to get `imageUrl`. The component already imports `useClerk` for sign-out, so no new Clerk coupling is introduced.

### Changes

**propentro-app only (no API/DB changes):**

| File | Change |
|---|---|
| `src/features/admin/components/admin-user-menu.tsx` | Import `useUser()` from `@clerk/nextjs`. Use `user?.imageUrl` in `AvatarImage`. |

### Design Decisions

- **Why not inject in layout (like regular user)?** The layout injection pattern merges API data with Clerk data into a hybrid type — this is a workaround, not best practice. Using `useUser()` directly is simpler and doesn't pollute the `AdminMe` type.
- **Why not create a wrapper hook?** Over-engineering for a single field. The component is already coupled to Clerk.
- **AdminMe type unchanged** — `imageUrl` is not part of the API contract. It's a client-side concern from the auth provider.

---

## 2. Organization Create Simplification

### Problem

The `CreateOrganizationRequest` API contract includes `contactName`, `contactEmail`, and `subscriptionPlan` — fields that are unnecessary at creation time:

- Contact info is "enrichment" data, not required to create a functioning org
- Subscription plan should default to `starter` — admin can change it later via a dedicated action
- Extra fields slow down the create flow and create "should I fill this?" hesitation

### Solution

Remove `contactName`, `contactEmail`, and `subscriptionPlan` from the create contract. Every org starts as `starter`. Contact info is added via the existing update flow.

### Changes

**propentro-api:**

| File | Change |
|---|---|
| `src/Propentro.Contracts/Admin/Organizations/CreateOrganizationRequest.cs` | Remove `ContactName`, `ContactEmail`, `SubscriptionPlan` properties. Remaining: `Name, Slug, CurrencyCode, Timezone`. |
| `src/Propentro.Domain/Constants/SubscriptionPlans.cs` (new) | Add `public static class SubscriptionPlans` with `Starter`, `Pro`, `Enterprise` string constants. |
| `src/Propentro.Application/Features/Admin/Organizations/Commands/CreateOrganization/CreateOrganizationCommand.cs` | Remove `ContactName`, `ContactEmail`, `SubscriptionPlan` parameters from command record. |
| `src/Propentro.Api/Endpoints/Admin/AdminOrganizationEndpoints.cs` | Update `CreateAsync` mapping to pass only 4 fields to command constructor. |
| Create organization handler | Set `SubscriptionPlan = SubscriptionPlans.Starter` instead of reading from request. |
| Create organization validator | Remove validation rules for removed fields. |
| Integration tests | Update create org tests to remove contact/plan fields from request payloads. |
| `tests/Propentro.Application.Tests/Validators/CreateOrganizationValidatorTests.cs` | Remove contact email and subscription plan test cases, update `CreateValidCommand()` helper. |

**propentro-app:**

| File | Change |
|---|---|
| `src/features/admin/types/index.ts` | Remove `contactName`, `contactEmail`, `subscriptionPlan` from `CreateOrganizationInput`. |
| `src/features/admin/organizations/validators/create-organization.schema.ts` | Remove `subscriptionPlan` from schema and defaults. |
| `src/features/admin/organizations/components/create-organization-dialog.tsx` | Remove subscription plan dropdown from the form. |
| `messages/en.json` | Remove orphaned `labelPlan` key (only used in create dialog). Plan name keys stay for list/detail display. |

### What stays unchanged

- `UpdateOrganizationRequest` — contact fields remain editable via update
- `AdminOrganizationResponse` — `subscriptionPlan` stays in response (read-only display)
- `AdminOrganizationListResponse` — `subscriptionPlan` stays (list column)
- No plan change action yet — future feature

### Design Decisions

- **Why string constants, not enum?** DB uses `TEXT` + CHECK constraint, EF Core maps as string. Enum adds conversion overhead with no benefit.
- **Why `SubscriptionPlans` in Domain layer?** Domain constants are referenced by handlers across features. DB CHECK constraint (`'starter', 'pro', 'enterprise'`) is the source of truth.
- **Why not remove `subscriptionPlan` from response too?** It's still useful information to display in admin lists/detail pages. Removing from create != removing from read.

---

## Execution Notes

- This is a **cross-repo change**: API first (contract + handler + tests), then app (types + form)
- Claude Code should be run from the parent directory (`../`) to access both repos
- Changes are backwards-compatible: reducing request fields is non-breaking for existing clients
