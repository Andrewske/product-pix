# Settings Page Implementation Plan

## Overview

Add a comprehensive Settings page with user dropdown menu in the header, enabling users to manage their account, view billing details, and track credit history.

**Key Features:**
- User dropdown menu replacing standalone sign-out button
- Settings page with 3 tabs: Account, Billing, Credits
- OAuth-aware password management (set vs. change password)
- Credit transaction history display

## Architecture Decisions

- **Tab navigation with URL sync**: Use client-side tabs with `?tab=` query param for deep linking without full page reloads. Settings is auth-only so no SEO benefit from sub-routes.
- **shadcn/ui components**: Add Radix UI primitives (dropdown-menu, avatar, tabs) following existing button.tsx pattern with `forwardRef`, `cn()`, variant props.
- **Password handling**: OAuth users (Google) get inline "Set Password" form; email users get "Send Reset Email" button. Detect via `user.app_metadata.provider`.
- **Server actions for credit history**: Create authenticated server action using server Supabase client (not admin) to fetch user's own transactions with RLS.

## Implementation Tasks

### Phase 1: Dependencies & UI Components

- [x] Install Radix UI dependencies
  - Command: `bun add @radix-ui/react-dropdown-menu @radix-ui/react-avatar @radix-ui/react-tabs`
  - Acceptance: Dependencies appear in package.json

- [x] Create dropdown-menu.tsx component
  - Files: `src/components/ui/dropdown-menu.tsx` (new)
  - Pattern: Follow button.tsx - use `forwardRef`, `cn()` utility, export sub-components
  - Export: DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator
  - Acceptance: Component renders without errors, supports all sub-components

- [x] Create avatar.tsx component
  - Files: `src/components/ui/avatar.tsx` (new)
  - Pattern: Follow button.tsx - use `forwardRef`, `cn()` utility
  - Export: Avatar, AvatarImage, AvatarFallback
  - Acceptance: Avatar displays fallback text when no image provided

- [x] Create tabs.tsx component
  - Files: `src/components/ui/tabs.tsx` (new)
  - Pattern: Follow button.tsx - use `forwardRef`, `cn()` utility
  - Export: Tabs, TabsList, TabsTrigger, TabsContent
  - Acceptance: Tabs switch content, support controlled `value` prop

### Phase 2: Header User Menu

- [x] Create user-menu.tsx component
  - Files: `src/components/layout/user-menu.tsx` (new)
  - Props: `user: User`, `profile: DbUser | null`
  - Features:
    - Avatar trigger showing user initial (first letter of email)
    - Dropdown content: email label, credits display, Settings link, Billing link (→ /settings?tab=billing), Sign out button
    - Use lucide-react icons: Settings, CreditCard, LogOut
  - Imports: DropdownMenu components, Avatar, Button, Link from next/link, signOut from @/lib/auth
  - Acceptance: Dropdown opens/closes, all links navigate correctly, sign out works

- [x] Update header.tsx to use UserMenu
  - Files: `src/components/layout/header.tsx` (modify)
  - Changes:
    - Remove standalone credits Badge
    - Remove standalone "Sign out" Button
    - Add `<UserMenu user={user} profile={profile} />` in authenticated nav
    - Keep Gallery, Generate, Batches links unchanged
  - Acceptance: Header shows dropdown when authenticated, old sign-out button removed

### Phase 3: Settings Page Structure

- [x] Create main settings page
  - Files: `src/app/settings/page.tsx` (new)
  - Type: Server component
  - Features:
    - Call `requireAuth()` for protection
    - Page container: `max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8`
    - Inner container: `max-w-4xl mx-auto`
    - Title: "Settings" as h1
    - Render `<SettingsTabs />` wrapped in Suspense (required for useSearchParams)
  - Acceptance: Page loads at /settings, redirects to /login if unauthenticated

- [x] Create settings-tabs.tsx component
  - Files: `src/components/settings/settings-tabs.tsx` (new)
  - Type: Client component ('use client')
  - Features:
    - Use `useSearchParams()` to read current tab from URL
    - Use `useRouter()` to update URL on tab change
    - Default tab: 'account'
    - Valid tabs: 'account' | 'billing' | 'credits'
    - Tab change: `router.push('/settings?tab=${value}', { scroll: false })`
  - Renders: `<AccountTab />`, `<BillingTab />`, `<CreditsTab />`
  - Acceptance: Tabs switch without page reload, URL updates, back button works

### Phase 4: Tab Content Components

- [x] Create account-tab.tsx component
  - Files: `src/components/settings/account-tab.tsx` (new)
  - Type: Client component ('use client')
  - Features:
    - Display user email (read-only) in Card
    - Detect auth provider: check `user.app_metadata?.provider` or `user.identities?.[0]?.provider`
    - **If provider is 'google'**: Show "Set Password" card with inline form (password + confirm), call `updatePassword()` on submit
    - **If provider is 'email'**: Show "Change Password" card with button that calls `resetPassword(user.email)`, show success message after
    - Loading and error states for both flows
  - Imports: useUserProfile, resetPassword, updatePassword from @/lib/auth, Card components, Button, Input
  - Acceptance: Email displays, correct password UI shows based on provider, both flows work

- [x] Create billing-tab.tsx component
  - Files: `src/components/settings/billing-tab.tsx` (new)
  - Type: Client component (for consistency, though could be server)
  - Features:
    - Import and render `<SubscriptionStatus />`
    - Import and render `<PurchaseHistory />`
    - Wrap in `<div className="space-y-6">`
  - Imports: SubscriptionStatus from @/components/billing/subscription-status, PurchaseHistory from @/components/billing/purchase-history
  - Acceptance: Shows existing billing components without changes

- [x] Create credits-tab.tsx component
  - Files: `src/components/settings/credits-tab.tsx` (new)
  - Type: Client component ('use client')
  - Features:
    - Fetch credit history on mount via server action `fetchCreditHistory()`
    - Display in Card with title "Credit History" and description
    - Each transaction row shows:
      - Badge for transaction_type (variant based on type: default for purchase/subscription/bonus, secondary for generation, outline for refund)
      - Description text
      - Amount with +/- prefix and color (green for positive, muted for negative)
      - Balance after transaction
      - Date formatted with toLocaleString()
    - Loading skeleton while fetching
    - Empty state if no transactions
  - Imports: Card components, Badge, fetchCreditHistory server action
  - Acceptance: Transactions display with correct formatting, loading state works

- [x] Add fetchCreditHistory server action
  - Files: `src/lib/db/billing.ts` (modify - add new export)
  - Type: Server action ('use server')
  - Implementation:
    ```typescript
    'use server';
    import { createClient } from '@/lib/supabase/server';
    import type { CreditTransaction } from '@/types';

    export async function fetchCreditHistory(limit = 50): Promise<CreditTransaction[]> {
      const supabase = await createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return [];

      const { data, error } = await supabase
        .from('credit_transactions')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(limit);

      if (error || !data) return [];
      return data;
    }
    ```
  - Note: Uses server client (not admin) so RLS applies automatically
  - Acceptance: Returns user's transactions, empty array if not authenticated

- [x] Create settings components barrel export
  - Files: `src/components/settings/index.ts` (new)
  - Exports: settings-tabs, account-tab, billing-tab, credits-tab
  - Acceptance: Components importable from @/components/settings

### Phase 5: Password Reset Page

- [x] Create reset-password page
  - Files: `src/app/auth/reset-password/page.tsx` (new)
  - Type: Client component ('use client')
  - Features:
    - Form with: new password input, confirm password input, submit button
    - Validation: passwords must match, minimum 8 characters
    - Call `updatePassword(password)` on submit
    - Success state: show message, redirect to /settings after 2 seconds
    - Error state: show error message
    - Centered layout: `max-w-md mx-auto mt-16 px-4`
  - Imports: updatePassword from @/lib/auth, Card components, Button, Input, useRouter
  - Acceptance: Form validates, updates password, redirects on success

### Phase 6: Cleanup & Integration

- [x] Update existing billing page to redirect
  - Files: `src/app/settings/billing/page.tsx` (modify)
  - Change: Replace content with redirect to `/settings?tab=billing`
  - Implementation:
    ```typescript
    import { redirect } from 'next/navigation';
    export default function BillingPage() {
      redirect('/settings?tab=billing');
    }
    ```
  - Acceptance: /settings/billing redirects to /settings?tab=billing

- [x] Update layout barrel exports if needed
  - Files: `src/components/layout/index.ts` (modify if exists)
  - Add: export for user-menu
  - Acceptance: UserMenu importable from @/components/layout

## Acceptance Criteria

- [x] All TypeScript compiles without errors (`bun run build`)
- [x] User dropdown menu appears in header when authenticated
- [x] Dropdown contains: email, credits, Settings link, Billing link, Sign out
- [x] Settings page loads at /settings with Account tab by default
- [x] Tab switching updates URL without page reload
- [x] Direct URL access (/settings?tab=credits) loads correct tab
- [x] OAuth users see "Set Password" inline form
- [x] Email users see "Send Reset Email" button
- [x] Password reset email flow works end-to-end
- [x] Credit history displays all transaction types with correct formatting
- [x] /settings/billing redirects to /settings?tab=billing
- [x] Mobile layout is responsive and usable

## Files to Create

| File | Type | Description |
|------|------|-------------|
| `src/components/ui/dropdown-menu.tsx` | New | Radix dropdown menu component |
| `src/components/ui/avatar.tsx` | New | Radix avatar component |
| `src/components/ui/tabs.tsx` | New | Radix tabs component |
| `src/components/layout/user-menu.tsx` | New | User dropdown for header |
| `src/components/settings/settings-tabs.tsx` | New | Tab container with URL sync |
| `src/components/settings/account-tab.tsx` | New | Account settings content |
| `src/components/settings/billing-tab.tsx` | New | Billing settings wrapper |
| `src/components/settings/credits-tab.tsx` | New | Credit history display |
| `src/components/settings/index.ts` | New | Barrel export |
| `src/app/settings/page.tsx` | New | Main settings page |
| `src/app/auth/reset-password/page.tsx` | New | Password update form |

## Files to Modify

| File | Changes |
|------|---------|
| `src/components/layout/header.tsx` | Replace sign-out button with UserMenu |
| `src/lib/db/billing.ts` | Add fetchCreditHistory server action |
| `src/app/settings/billing/page.tsx` | Change to redirect |

## Dependencies

**New npm packages:**
- `@radix-ui/react-dropdown-menu` - Dropdown menu primitive
- `@radix-ui/react-avatar` - Avatar primitive
- `@radix-ui/react-tabs` - Tabs primitive

**Existing dependencies used:**
- `lucide-react` - Icons (Settings, CreditCard, LogOut)
- `next/navigation` - useRouter, useSearchParams, redirect
- `@/lib/auth` - signOut, resetPassword, updatePassword, useUserProfile
- `@/lib/supabase/server` - createClient for server actions

## Task Dependencies

```
Phase 1 (UI Components) → Phase 2 (Header Menu) → Phase 3 (Settings Page)
                                                          ↓
                                                   Phase 4 (Tab Content)
                                                          ↓
                                                   Phase 5 (Reset Page)
                                                          ↓
                                                   Phase 6 (Cleanup)
```

- Phase 2 depends on Phase 1 (needs dropdown-menu, avatar components)
- Phase 3 depends on Phase 1 (needs tabs component)
- Phase 4 depends on Phase 3 (settings-tabs imports tab components)
- Phase 5 can run in parallel with Phase 4
- Phase 6 runs last (cleanup and integration)
