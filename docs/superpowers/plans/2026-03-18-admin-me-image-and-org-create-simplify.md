# Admin Me ImageUrl & Organization Create Simplification — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Show profile image in admin user menu via Clerk `useUser()`, and simplify organization creation by removing `contactName`, `contactEmail`, `subscriptionPlan` from the create flow (defaulting every org to `starter`).

**Architecture:** API-first cross-repo change. API contract shrinks from 7 to 4 fields. A new `SubscriptionPlans` constants class centralizes plan strings. Frontend removes the plan dropdown from the create dialog and drops unused type fields.

**Tech Stack:** .NET 10 (API), Next.js 16 + React 19 + shadcn/ui v4 + Clerk (App)

**Spec:** `propentro-app/docs/superpowers/specs/2026-03-18-admin-me-image-and-org-create-simplify-design.md`

---

## File Map

### propentro-api (`/Users/sufyan/Documents/Projects/propentro-api`)

| Action | File | Responsibility |
|--------|------|----------------|
| Create | `src/Propentro.Domain/Constants/SubscriptionPlans.cs` | String constants for subscription plan values |
| Modify | `src/Propentro.Contracts/Admin/Organizations/CreateOrganizationRequest.cs` | Remove `ContactName`, `ContactEmail`, `SubscriptionPlan` |
| Modify | `src/Propentro.Application/Features/Admin/Organizations/Commands/CreateOrganization/CreateOrganizationCommand.cs` | Remove `ContactName`, `ContactEmail`, `SubscriptionPlan` |
| Modify | `src/Propentro.Application/Features/Admin/Organizations/Commands/CreateOrganization/CreateOrganizationHandler.cs` | Use `SubscriptionPlans.Starter`, stop reading contact/plan from request |
| Modify | `src/Propentro.Application/Features/Admin/Organizations/Commands/CreateOrganization/CreateOrganizationValidator.cs` | Remove `ContactEmail` and `SubscriptionPlan` rules |
| Modify | `src/Propentro.Api/Endpoints/Admin/AdminOrganizationEndpoints.cs` | Update `CreateAsync` to pass 4 fields |
| Modify | `tests/Propentro.Api.Tests/Features/Admin/Organizations/CreateOrganizationTests.cs` | Update request constructors (remove 3 fields) |
| Modify | `tests/Propentro.Application.Tests/Validators/CreateOrganizationValidatorTests.cs` | Remove contact/plan test cases, update `CreateValidCommand()` |

### propentro-app (`/Users/sufyan/Documents/Projects/propentro-app`)

| Action | File | Responsibility |
|--------|------|----------------|
| Modify | `src/features/admin/components/admin-user-menu.tsx` | Import `useUser()`, add `AvatarImage` |
| Modify | `eslint.config.mjs` | Add admin components to Clerk import exemption list |
| Modify | `src/features/admin/types/index.ts` | Remove `contactName`, `contactEmail`, `subscriptionPlan` from `CreateOrganizationInput` |
| Modify | `src/features/admin/organizations/validators/create-organization.schema.ts` | Remove `subscriptionPlan` from schema and defaults |
| Modify | `src/features/admin/organizations/components/create-organization-dialog.tsx` | Remove plan `Select` + unused imports |
| Modify | `messages/en.json` | Remove `labelPlan` key |

---

## Task 1: Add `SubscriptionPlans` Constants (API)

**Files:**
- Create: `propentro-api/src/Propentro.Domain/Constants/SubscriptionPlans.cs`

- [ ] **Step 1: Create the constants directory and file**

```csharp
namespace Propentro.Domain.Constants;

public static class SubscriptionPlans
{
    public const string Starter = "starter";
    public const string Pro = "pro";
    public const string Enterprise = "enterprise";
}
```

- [ ] **Step 2: Verify build**

Run: `cd /Users/sufyan/Documents/Projects/propentro-api && dotnet build Propentro.slnx`
Expected: Build succeeded

- [ ] **Step 3: Commit**

```bash
cd /Users/sufyan/Documents/Projects/propentro-api
git add src/Propentro.Domain/Constants/SubscriptionPlans.cs
git commit -m "feat: add SubscriptionPlans domain constants"
```

---

## Task 2: Simplify CreateOrganization Contract & Command (API)

**Files:**
- Modify: `propentro-api/src/Propentro.Contracts/Admin/Organizations/CreateOrganizationRequest.cs`
- Modify: `propentro-api/src/Propentro.Application/Features/Admin/Organizations/Commands/CreateOrganization/CreateOrganizationCommand.cs`

- [ ] **Step 1: Update `CreateOrganizationRequest.cs`**

Replace entire file content with:

```csharp
namespace Propentro.Contracts.Admin.Organizations;

public sealed record CreateOrganizationRequest(
    string Name,
    string Slug,
    string CurrencyCode,
    string Timezone);
```

- [ ] **Step 2: Update `CreateOrganizationCommand.cs`**

Replace entire file content with:

```csharp
using Propentro.Contracts.Admin.Organizations;

namespace Propentro.Application.Features.Admin.Organizations.Commands.CreateOrganization;

public sealed record CreateOrganizationCommand(
    string Name,
    string Slug,
    string CurrencyCode,
    string Timezone) : ICommand<AdminOrganizationResponse>;
```

**Note:** No commit yet — bundled with Task 5.

- [ ] **Step 3: Verify build (expect failures in handler/endpoint/tests — that's expected)**

Run: `cd /Users/sufyan/Documents/Projects/propentro-api && dotnet build Propentro.slnx 2>&1 | tail -20`
Expected: Build errors in handler, endpoint, validator, and tests referencing removed fields

---

## Task 3: Update Handler to Use Constants (API)

**Note:** No commit yet — bundled with Task 5.

**Files:**
- Modify: `propentro-api/src/Propentro.Application/Features/Admin/Organizations/Commands/CreateOrganization/CreateOrganizationHandler.cs`

- [ ] **Step 1: Update handler**

In `CreateOrganizationHandler.cs`, add using for constants and update the `Organization` initializer:

Add `using Propentro.Domain.Constants;` to the usings.

In the `Handle` method, change the org initialization block (lines 24-37) to:

```csharp
        var org = new Organization
        {
            Id = Guid.CreateVersion7(),
            PublicId = PublicIdGenerator.Generate(Organization.PublicIdPrefix),
            Name = request.Name,
            Slug = request.Slug,
            AuthProvider = "clerk",
            CurrencyCode = request.CurrencyCode,
            Timezone = request.Timezone,
            SubscriptionPlan = SubscriptionPlans.Starter,
            IsActive = true
        };
```

Note: `ContactName` and `ContactEmail` are removed from the initializer (they default to `null` on the entity).

- [ ] **Step 2: Verify build (expect failures in validator/endpoint/tests)**

Run: `cd /Users/sufyan/Documents/Projects/propentro-api && dotnet build Propentro.slnx 2>&1 | tail -10`
Expected: Build errors in validator and tests (endpoint should compile now)

---

## Task 4: Update Validator (API)

**Note:** No commit yet — bundled with Task 5.

**Files:**
- Modify: `propentro-api/src/Propentro.Application/Features/Admin/Organizations/Commands/CreateOrganization/CreateOrganizationValidator.cs`

- [ ] **Step 1: Update validator**

Replace entire file content with:

```csharp
using FluentValidation;

namespace Propentro.Application.Features.Admin.Organizations.Commands.CreateOrganization;

public sealed class CreateOrganizationValidator : AbstractValidator<CreateOrganizationCommand>
{
    public CreateOrganizationValidator()
    {
        RuleFor(x => x.Name).NotEmpty().MaximumLength(100);
        RuleFor(x => x.Slug).NotEmpty().MaximumLength(100)
            .Matches("^[a-z0-9-]+$").WithMessage("Slug must be lowercase alphanumeric with hyphens");
        RuleFor(x => x.CurrencyCode).NotEmpty().Length(3);
        RuleFor(x => x.Timezone).NotEmpty().MaximumLength(100);
    }
}
```

---

## Task 5: Update Endpoint Mapping (API)

**Files:**
- Modify: `propentro-api/src/Propentro.Api/Endpoints/Admin/AdminOrganizationEndpoints.cs`

- [ ] **Step 1: Update `CreateAsync` method**

Replace the `CreateAsync` method body (lines 66-76) with:

```csharp
    private static async Task<IResult> CreateAsync(
        CreateOrganizationRequest request,
        ISender sender,
        CancellationToken ct)
    {
        var command = new CreateOrganizationCommand(
            request.Name, request.Slug,
            request.CurrencyCode, request.Timezone);
        var result = await sender.Send(command, ct);
        return result.ToHttpResult();
    }
```

- [ ] **Step 2: Verify build succeeds**

Run: `cd /Users/sufyan/Documents/Projects/propentro-api && dotnet build Propentro.slnx`
Expected: Build succeeded (test projects may still fail — that's next)

- [ ] **Step 3: Commit**

```bash
cd /Users/sufyan/Documents/Projects/propentro-api
git add -A
git commit -m "feat: simplify CreateOrganization — remove contactName, contactEmail, subscriptionPlan from contract, default to starter plan"
```

---

## Task 6: Update Validator Unit Tests (API)

**Files:**
- Modify: `propentro-api/tests/Propentro.Application.Tests/Validators/CreateOrganizationValidatorTests.cs`

- [ ] **Step 1: Update `CreateValidCommand()` helper**

Change:
```csharp
private static CreateOrganizationCommand CreateValidCommand() =>
    new("Test Org", "test-org", "Contact", "contact@example.com", "EUR", "UTC", "starter");
```
To:
```csharp
private static CreateOrganizationCommand CreateValidCommand() =>
    new("Test Org", "test-org", "EUR", "UTC");
```

- [ ] **Step 2: Remove contact email and subscription plan test cases**

Delete these test methods entirely:
- `Invalid_ContactEmail_Should_Fail` (lines 52-57)
- `Null_ContactEmail_Should_Pass` (lines 59-65)
- `Invalid_SubscriptionPlan_Should_Fail` (lines 78-86)
- `Valid_SubscriptionPlan_Should_Pass` (lines 88-97)

- [ ] **Step 3: Run validator tests**

Run: `cd /Users/sufyan/Documents/Projects/propentro-api && dotnet test tests/Propentro.Application.Tests --filter "FullyQualifiedName~CreateOrganizationValidatorTests" -v n`
Expected: All remaining tests pass

---

## Task 7: Update Integration Tests (API)

**Files:**
- Modify: `propentro-api/tests/Propentro.Api.Tests/Features/Admin/Organizations/CreateOrganizationTests.cs`

- [ ] **Step 1: Update all `CreateOrganizationRequest` constructors**

In `Create_Organization_As_Admin_Succeeds`:
```csharp
var request = new CreateOrganizationRequest(
    "New Admin Org",
    "new-admin-org",
    "USD",
    "America/New_York");
```

Remove these assertions (contact fields no longer sent):
```csharp
body.ContactName.Should().Be("Jane Doe");
body.ContactEmail.Should().Be("jane@example.com");
```

Add assertion that plan defaults to starter:
```csharp
body.SubscriptionPlan.Should().Be("starter");
```
(This line already exists — keep it.)

In `Create_Organization_As_Regular_User_Returns_403`:
```csharp
var request = new CreateOrganizationRequest(
    "Forbidden Org",
    "forbidden-org",
    "EUR",
    "UTC");
```

In `Create_Organization_Unauthenticated_Returns_401`:
```csharp
var request = new CreateOrganizationRequest(
    "Anon Org",
    "anon-org",
    "GBP",
    "Europe/London");
```

In `Create_Organization_With_Empty_Name_Returns_400`:
```csharp
var request = new CreateOrganizationRequest("", "empty-name", "EUR", "UTC");
```

- [ ] **Step 2: Run all API tests**

Run: `cd /Users/sufyan/Documents/Projects/propentro-api && dotnet test Propentro.slnx -v n`
Expected: All tests pass

- [ ] **Step 3: Commit**

```bash
cd /Users/sufyan/Documents/Projects/propentro-api
git add -A
git commit -m "test: update CreateOrganization tests for simplified contract"
```

---

## Task 8: Add Profile Image to Admin User Menu (App)

**Files:**
- Modify: `propentro-app/src/features/admin/components/admin-user-menu.tsx`
- Modify: `propentro-app/eslint.config.mjs`

- [ ] **Step 1: Add admin components to ESLint Clerk exemption list**

In `eslint.config.mjs`, add `'src/features/admin/components/**'` to the exemption list (after `'src/features/select-workspace/**'`, around line 82):

```javascript
      'src/features/select-workspace/**',
      'src/features/admin/components/**',
      'src/app/**/layout.tsx',
```

This is needed because `admin-user-menu.tsx` imports from `@clerk/nextjs` (already uses `useClerk` for sign-out, now also `useUser`). Admin shell components are infrastructure-level, similar to `src/components/layout/**`.

- [ ] **Step 2: Add `useUser` import and `AvatarImage` import**

Update the Clerk import (line 3):
```tsx
import { useClerk, useUser } from '@clerk/nextjs';
```

Update the Avatar import (line 16):
```tsx
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
```

- [ ] **Step 3: Add `useUser()` call inside the component**

After `const { signOut } = useClerk();` (line 49), add:
```tsx
const { user } = useUser();
```

- [ ] **Step 4: Add `AvatarImage` to both Avatar instances**

For the trigger avatar (line 76-78), change:
```tsx
<Avatar className="size-7">
  <AvatarImage src={user?.imageUrl} alt={displayName} />
  <AvatarFallback className="text-xs">{initials}</AvatarFallback>
</Avatar>
```

For the dropdown header avatar (lines 85-88), change:
```tsx
<Avatar className="size-8 rounded-lg">
  <AvatarImage src={user?.imageUrl} alt={displayName} className="rounded-lg" />
  <AvatarFallback className="rounded-lg">
    {initials}
  </AvatarFallback>
</Avatar>
```

- [ ] **Step 5: Verify type check and lint pass**

Run: `cd /Users/sufyan/Documents/Projects/propentro-app && pnpm type:check && pnpm lint`
Expected: No errors

- [ ] **Step 6: Commit**

```bash
cd /Users/sufyan/Documents/Projects/propentro-app
git add src/features/admin/components/admin-user-menu.tsx eslint.config.mjs
git commit -m "feat: show profile image in admin user menu via Clerk useUser()"
```

---

## Task 9: Update Frontend Types (App)

**Note:** No commit yet — bundled with Task 10.

**Files:**
- Modify: `propentro-app/src/features/admin/types/index.ts`

- [ ] **Step 1: Update `CreateOrganizationInput` type**

Change (lines 32-40):
```typescript
export type CreateOrganizationInput = {
  name: string;
  slug: string;
  contactName?: string;
  contactEmail?: string;
  currencyCode: string;
  timezone: string;
  subscriptionPlan: string;
};
```
To:
```typescript
export type CreateOrganizationInput = {
  name: string;
  slug: string;
  currencyCode: string;
  timezone: string;
};
```

---

## Task 10: Update Schema & Dialog (App)

**Files:**
- Modify: `propentro-app/src/features/admin/organizations/validators/create-organization.schema.ts`
- Modify: `propentro-app/src/features/admin/organizations/components/create-organization-dialog.tsx`
- Modify: `propentro-app/messages/en.json`

- [ ] **Step 1: Update schema**

Replace entire `create-organization.schema.ts` with:

```typescript
import { z } from 'zod';

import {
  currencyCodeSchema,
  requiredString,
  slugSchema,
  timezoneSchema,
} from '@/lib/validators';

export const createOrganizationSchema = z.object({
  name: requiredString('Name').max(100),
  slug: slugSchema.max(100),
  currencyCode: currencyCodeSchema,
  timezone: timezoneSchema,
});

export type CreateOrganizationFormValues = z.input<
  typeof createOrganizationSchema
>;

export const createOrganizationDefaults: CreateOrganizationFormValues = {
  name: '',
  slug: '',
  currencyCode: '',
  timezone: '',
};
```

- [ ] **Step 2: Update create dialog**

Remove the `Select` imports (lines 20-26):
```tsx
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
```

Remove the entire subscription plan `FormField` block (lines 125-151 — from `<FormField` with `labelPlan` through the closing `</FormField>`).

- [ ] **Step 3: Remove `labelPlan` from translations**

In `messages/en.json`, remove the `"labelPlan": "Subscription Plan"` line. Keep `planStarter`, `planProfessional`, `planEnterprise`, and `planFree` — these are used in list/detail display.

- [ ] **Step 4: Verify build**

Run: `cd /Users/sufyan/Documents/Projects/propentro-app && pnpm type:check && pnpm lint`
Expected: No errors

- [ ] **Step 5: Commit**

```bash
cd /Users/sufyan/Documents/Projects/propentro-app
git add src/features/admin/types/index.ts src/features/admin/organizations/validators/create-organization.schema.ts src/features/admin/organizations/components/create-organization-dialog.tsx messages/en.json
git commit -m "feat: simplify organization create — remove plan dropdown and contact fields from create flow"
```

---

## Verification Checklist

- [ ] `cd propentro-api && dotnet test Propentro.slnx` — all tests pass
- [ ] `cd propentro-app && pnpm type:check` — no type errors
- [ ] `cd propentro-app && pnpm lint` — no lint errors
- [ ] `cd propentro-app && pnpm build` — production build succeeds
- [ ] Manual: admin user menu shows profile image from Clerk
- [ ] Manual: create organization dialog has 4 fields (name, slug, currency, timezone)
- [ ] Manual: new org created via admin panel has `subscriptionPlan: "starter"` in response
