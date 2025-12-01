# Phase 1C: Authentication

**ProductPix.app — AI-Powered Product Photo Generator**

---

## Overview

This document covers implementing user authentication using Supabase Auth. We'll set up email/password authentication with proper session management, protected routes, and user profile creation.

### Why This Phase Matters

Authentication is the gateway to your application. It must be:

- **Secure** — Properly handle sessions, tokens, and cookies
- **Seamless** — Minimal friction for users to sign up and log in
- **Integrated** — Work with Next.js App Router and middleware

### Authentication Flow

```
User visits /login
       ↓
Enters email/password
       ↓
Supabase Auth validates → Creates session cookie
       ↓
Middleware refreshes session on each request
       ↓
Protected routes check auth status
       ↓
User profile auto-created via DB trigger
```

---

## Prerequisites

- [ ] Phase 1A completed (Supabase project configured)
- [ ] Phase 1B completed (users table with auto-creation trigger)
- [ ] Supabase clients configured (`src/lib/supabase/`)

---

## Task 1C.1: Configure Supabase Auth

**Estimated Time:** 15 minutes

### Steps

1. **Enable Email Provider**
   - Go to Supabase Dashboard → Authentication → Providers
   - Ensure "Email" is enabled
   - Configure settings:
     - Enable "Confirm email" (recommended for production)
     - Disable "Confirm email" for faster development

2. **Configure Redirect URLs**
   - Go to Authentication → URL Configuration
   - Site URL: `http://localhost:3000`
   - Redirect URLs:
     ```
     http://localhost:3000/auth/callback
     http://localhost:3000/dashboard
     ```
   - For production, add your domain URLs

3. **Configure Email Templates** (optional)
   - Go to Authentication → Email Templates
   - Customize confirmation and magic link emails with your branding

4. **Security Settings**
   - Go to Authentication → Settings
   - JWT expiry: 3600 (1 hour) — adjust as needed
   - Enable "Refresh token rotation"

### Acceptance Criteria

- [ ] Email provider enabled
- [ ] Redirect URLs configured
- [ ] Site URL set correctly

---

## Task 1C.2: Auth Middleware

**Estimated Time:** 30 minutes

**Why:** Middleware runs before every request, ensuring sessions are refreshed and protected routes are enforced.

### Steps

1. **Update middleware** (if not created in Phase 1A)
   ```typescript
   // src/middleware.ts
   import { createServerClient } from '@supabase/ssr';
   import { NextResponse, type NextRequest } from 'next/server';

   // Routes that require authentication
   const protectedRoutes = ['/dashboard', '/generate', '/settings', '/api/generate', '/api/upload'];

   // Routes only for unauthenticated users
   const authRoutes = ['/login', '/signup'];

   export async function middleware(request: NextRequest) {
     const { pathname } = request.nextUrl;

     let supabaseResponse = NextResponse.next({
       request,
     });

     const supabase = createServerClient(
       process.env.NEXT_PUBLIC_SUPABASE_URL!,
       process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
       {
         cookies: {
           getAll() {
             return request.cookies.getAll();
           },
           setAll(cookiesToSet) {
             cookiesToSet.forEach(({ name, value }) =>
               request.cookies.set(name, value)
             );
             supabaseResponse = NextResponse.next({
               request,
             });
             cookiesToSet.forEach(({ name, value, options }) =>
               supabaseResponse.cookies.set(name, value, options)
             );
           },
         },
       }
     );

     // Refresh session
     const {
       data: { user },
     } = await supabase.auth.getUser();

     // Check protected routes
     const isProtectedRoute = protectedRoutes.some((route) =>
       pathname.startsWith(route)
     );

     if (isProtectedRoute && !user) {
       const loginUrl = new URL('/login', request.url);
       loginUrl.searchParams.set('redirect', pathname);
       return NextResponse.redirect(loginUrl);
     }

     // Redirect authenticated users away from auth pages
     const isAuthRoute = authRoutes.some((route) =>
       pathname.startsWith(route)
     );

     if (isAuthRoute && user) {
       return NextResponse.redirect(new URL('/dashboard', request.url));
     }

     return supabaseResponse;
   }

   export const config = {
     matcher: [
       '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
     ],
   };
   ```

### Acceptance Criteria

- [ ] Middleware refreshes sessions
- [ ] Protected routes redirect to login
- [ ] Auth pages redirect to dashboard for logged-in users

---

## Task 1C.3: Login Page

**Estimated Time:** 45 minutes

### Steps

1. **Create login page**
   ```typescript
   // src/app/login/page.tsx
   import { LoginForm } from '@/components/forms/login-form';
   import Link from 'next/link';

   interface LoginPageProps {
     searchParams: Promise<{ redirect?: string; error?: string }>;
   }

   export default async function LoginPage({ searchParams }: LoginPageProps) {
     const { redirect, error } = await searchParams;

     return (
       <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
         <div className="max-w-md w-full space-y-8">
           <div>
             <h1 className="text-3xl font-bold text-center text-gray-900">
               ProductPix
             </h1>
             <h2 className="mt-6 text-center text-xl text-gray-600">
               Sign in to your account
             </h2>
           </div>

           {error && (
             <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
               {error === 'invalid_credentials'
                 ? 'Invalid email or password'
                 : 'An error occurred. Please try again.'}
             </div>
           )}

           <LoginForm redirectTo={redirect} />

           <p className="text-center text-sm text-gray-600">
             Don&apos;t have an account?{' '}
             <Link
               href="/signup"
               className="font-medium text-blue-600 hover:text-blue-500"
             >
               Sign up
             </Link>
           </p>
         </div>
       </div>
     );
   }
   ```

2. **Create login form component**
   ```typescript
   // src/components/forms/login-form.tsx
   'use client';

   import { useState } from 'react';
   import { useRouter } from 'next/navigation';
   import { createClient } from '@/lib/supabase/client';

   interface LoginFormProps {
     redirectTo?: string;
   }

   export function LoginForm({ redirectTo }: LoginFormProps) {
     const [email, setEmail] = useState('');
     const [password, setPassword] = useState('');
     const [loading, setLoading] = useState(false);
     const [error, setError] = useState<string | null>(null);
     const router = useRouter();

     const handleSubmit = async (e: React.FormEvent) => {
       e.preventDefault();
       setLoading(true);
       setError(null);

       const supabase = createClient();

       const { error: authError } = await supabase.auth.signInWithPassword({
         email,
         password,
       });

       if (authError) {
         setError(authError.message);
         setLoading(false);
         return;
       }

       router.push(redirectTo || '/dashboard');
       router.refresh();
     };

     return (
       <form onSubmit={handleSubmit} className="mt-8 space-y-6">
         <div className="space-y-4">
           <div>
             <label htmlFor="email" className="block text-sm font-medium text-gray-700">
               Email address
             </label>
             <input
               id="email"
               name="email"
               type="email"
               autoComplete="email"
               required
               value={email}
               onChange={(e) => setEmail(e.target.value)}
               className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
             />
           </div>

           <div>
             <label htmlFor="password" className="block text-sm font-medium text-gray-700">
               Password
             </label>
             <input
               id="password"
               name="password"
               type="password"
               autoComplete="current-password"
               required
               value={password}
               onChange={(e) => setPassword(e.target.value)}
               className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
             />
           </div>
         </div>

         {error && (
           <div className="text-red-600 text-sm">{error}</div>
         )}

         <button
           type="submit"
           disabled={loading}
           className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
         >
           {loading ? 'Signing in...' : 'Sign in'}
         </button>
       </form>
     );
   }
   ```

### Acceptance Criteria

- [ ] Login page renders correctly
- [ ] Form submits and authenticates user
- [ ] Errors displayed appropriately
- [ ] Redirects to dashboard on success

---

## Task 1C.4: Signup Page

**Estimated Time:** 30 minutes

### Steps

1. **Create signup page**
   ```typescript
   // src/app/signup/page.tsx
   import { SignupForm } from '@/components/forms/signup-form';
   import Link from 'next/link';

   export default function SignupPage() {
     return (
       <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
         <div className="max-w-md w-full space-y-8">
           <div>
             <h1 className="text-3xl font-bold text-center text-gray-900">
               ProductPix
             </h1>
             <h2 className="mt-6 text-center text-xl text-gray-600">
               Create your account
             </h2>
             <p className="mt-2 text-center text-sm text-gray-500">
               Start generating professional product photos today
             </p>
           </div>

           <SignupForm />

           <p className="text-center text-sm text-gray-600">
             Already have an account?{' '}
             <Link
               href="/login"
               className="font-medium text-blue-600 hover:text-blue-500"
             >
               Sign in
             </Link>
           </p>
         </div>
       </div>
     );
   }
   ```

2. **Create signup form component**
   ```typescript
   // src/components/forms/signup-form.tsx
   'use client';

   import { useState } from 'react';
   import { useRouter } from 'next/navigation';
   import { createClient } from '@/lib/supabase/client';

   export function SignupForm() {
     const [email, setEmail] = useState('');
     const [password, setPassword] = useState('');
     const [confirmPassword, setConfirmPassword] = useState('');
     const [loading, setLoading] = useState(false);
     const [error, setError] = useState<string | null>(null);
     const [success, setSuccess] = useState(false);
     const router = useRouter();

     const handleSubmit = async (e: React.FormEvent) => {
       e.preventDefault();
       setLoading(true);
       setError(null);

       if (password !== confirmPassword) {
         setError('Passwords do not match');
         setLoading(false);
         return;
       }

       if (password.length < 8) {
         setError('Password must be at least 8 characters');
         setLoading(false);
         return;
       }

       const supabase = createClient();

       const { error: authError } = await supabase.auth.signUp({
         email,
         password,
         options: {
           emailRedirectTo: `${window.location.origin}/auth/callback`,
         },
       });

       if (authError) {
         setError(authError.message);
         setLoading(false);
         return;
       }

       // Check if email confirmation is required
       // If not, redirect to dashboard
       setSuccess(true);
       setLoading(false);
     };

     if (success) {
       return (
         <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded">
           <h3 className="font-medium">Check your email</h3>
           <p className="text-sm mt-1">
             We&apos;ve sent you a confirmation link. Click it to activate your account.
           </p>
         </div>
       );
     }

     return (
       <form onSubmit={handleSubmit} className="mt-8 space-y-6">
         <div className="space-y-4">
           <div>
             <label htmlFor="email" className="block text-sm font-medium text-gray-700">
               Email address
             </label>
             <input
               id="email"
               name="email"
               type="email"
               autoComplete="email"
               required
               value={email}
               onChange={(e) => setEmail(e.target.value)}
               className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
             />
           </div>

           <div>
             <label htmlFor="password" className="block text-sm font-medium text-gray-700">
               Password
             </label>
             <input
               id="password"
               name="password"
               type="password"
               autoComplete="new-password"
               required
               value={password}
               onChange={(e) => setPassword(e.target.value)}
               className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
               placeholder="At least 8 characters"
             />
           </div>

           <div>
             <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700">
               Confirm password
             </label>
             <input
               id="confirmPassword"
               name="confirmPassword"
               type="password"
               autoComplete="new-password"
               required
               value={confirmPassword}
               onChange={(e) => setConfirmPassword(e.target.value)}
               className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
             />
           </div>
         </div>

         {error && (
           <div className="text-red-600 text-sm">{error}</div>
         )}

         <button
           type="submit"
           disabled={loading}
           className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
         >
           {loading ? 'Creating account...' : 'Create account'}
         </button>
       </form>
     );
   }
   ```

### Acceptance Criteria

- [ ] Signup page renders correctly
- [ ] Password validation works
- [ ] Success message shown after signup
- [ ] Error handling in place

---

## Task 1C.5: Auth Hooks

**Estimated Time:** 30 minutes

### Steps

1. **Create useUser hook**
   ```typescript
   // src/lib/auth/hooks.ts
   'use client';

   import { useEffect, useState } from 'react';
   import { User } from '@supabase/supabase-js';
   import { createClient } from '@/lib/supabase/client';
   import type { User as DbUser } from '@/types';

   export function useUser() {
     const [user, setUser] = useState<User | null>(null);
     const [loading, setLoading] = useState(true);

     useEffect(() => {
       const supabase = createClient();

       // Get initial user
       supabase.auth.getUser().then(({ data: { user } }) => {
         setUser(user);
         setLoading(false);
       });

       // Listen for auth changes
       const {
         data: { subscription },
       } = supabase.auth.onAuthStateChange((_event, session) => {
         setUser(session?.user ?? null);
       });

       return () => {
         subscription.unsubscribe();
       };
     }, []);

     return { user, loading };
   }

   export function useUserProfile() {
     const { user, loading: authLoading } = useUser();
     const [profile, setProfile] = useState<DbUser | null>(null);
     const [loading, setLoading] = useState(true);

     useEffect(() => {
       if (authLoading) return;

       if (!user) {
         setProfile(null);
         setLoading(false);
         return;
       }

       const supabase = createClient();

       supabase
         .from('users')
         .select('*')
         .eq('id', user.id)
         .single()
         .then(({ data, error }) => {
           if (error) {
             console.error('Error fetching profile:', error);
           }
           setProfile(data);
           setLoading(false);
         });
     }, [user, authLoading]);

     return { user, profile, loading: authLoading || loading };
   }

   export function useCredits() {
     const { profile, loading } = useUserProfile();
     return {
       credits: profile?.credit_balance ?? 0,
       loading,
     };
   }
   ```

2. **Create auth utility functions**
   ```typescript
   // src/lib/auth/utils.ts
   import { createClient } from '@/lib/supabase/client';

   export const signOut = async (): Promise<void> => {
     const supabase = createClient();
     await supabase.auth.signOut();
   };

   export const resetPassword = async (email: string): Promise<{ error: string | null }> => {
     const supabase = createClient();

     const { error } = await supabase.auth.resetPasswordForEmail(email, {
       redirectTo: `${window.location.origin}/auth/reset-password`,
     });

     return { error: error?.message ?? null };
   };

   export const updatePassword = async (newPassword: string): Promise<{ error: string | null }> => {
     const supabase = createClient();

     const { error } = await supabase.auth.updateUser({
       password: newPassword,
     });

     return { error: error?.message ?? null };
   };
   ```

3. **Create index export**
   ```typescript
   // src/lib/auth/index.ts
   export { useUser, useUserProfile, useCredits } from './hooks';
   export { signOut, resetPassword, updatePassword } from './utils';
   ```

### Acceptance Criteria

- [ ] useUser hook returns current auth user
- [ ] useUserProfile hook returns user profile from database
- [ ] useCredits hook returns credit balance
- [ ] Utility functions for sign out and password reset

---

## Task 1C.6: Auth Callbacks

**Estimated Time:** 20 minutes

### Steps

1. **Create auth callback route**
   ```typescript
   // src/app/auth/callback/route.ts
   import { createClient } from '@/lib/supabase/server';
   import { NextResponse } from 'next/server';

   export async function GET(request: Request) {
     const { searchParams, origin } = new URL(request.url);
     const code = searchParams.get('code');
     const next = searchParams.get('next') ?? '/dashboard';

     if (code) {
       const supabase = await createClient();
       const { error } = await supabase.auth.exchangeCodeForSession(code);

       if (!error) {
         return NextResponse.redirect(`${origin}${next}`);
       }
     }

     // Return to login with error
     return NextResponse.redirect(`${origin}/login?error=auth_callback_error`);
   }
   ```

2. **Create email confirmation handler** (optional, for custom confirmation page)
   ```typescript
   // src/app/auth/confirm/route.ts
   import { createClient } from '@/lib/supabase/server';
   import { NextResponse } from 'next/server';

   export async function GET(request: Request) {
     const { searchParams, origin } = new URL(request.url);
     const token_hash = searchParams.get('token_hash');
     const type = searchParams.get('type');
     const next = searchParams.get('next') ?? '/dashboard';

     if (token_hash && type) {
       const supabase = await createClient();
       const { error } = await supabase.auth.verifyOtp({
         type: type as 'signup' | 'recovery' | 'invite' | 'email',
         token_hash,
       });

       if (!error) {
         return NextResponse.redirect(`${origin}${next}`);
       }
     }

     return NextResponse.redirect(`${origin}/login?error=confirmation_error`);
   }
   ```

### Acceptance Criteria

- [ ] OAuth callback exchanges code for session
- [ ] Email confirmation verifies token
- [ ] Proper redirects on success/failure

---

## Task 1C.7: User Profile Creation Trigger

**Estimated Time:** 20 minutes

**Note:** This was already created in Phase 1B (migration 00003). Verify it's working.

### Steps

1. **Verify the trigger exists**
   ```sql
   -- Run in Supabase SQL Editor
   SELECT
     trigger_name,
     event_manipulation,
     action_statement
   FROM information_schema.triggers
   WHERE trigger_name = 'on_auth_user_created';
   ```

2. **Test user creation flow**
   - Sign up a new user
   - Check if record appears in `public.users` table
   - Verify `email` and `id` match auth.users

3. **Add welcome credits** (optional enhancement)
   ```sql
   -- Update the handle_new_user function to add welcome credits
   CREATE OR REPLACE FUNCTION handle_new_user()
   RETURNS TRIGGER AS $$
   BEGIN
     -- Create user profile
     INSERT INTO public.users (id, email, credit_balance)
     VALUES (NEW.id, NEW.email, 5);  -- 5 free credits

     -- Record welcome bonus transaction
     INSERT INTO public.credit_transactions (
       user_id, amount, balance_after, transaction_type, description
     )
     VALUES (
       NEW.id, 5, 5, 'bonus', 'Welcome bonus credits'
     );

     RETURN NEW;
   END;
   $$ LANGUAGE plpgsql SECURITY DEFINER;
   ```

### Acceptance Criteria

- [ ] User profile created automatically on signup
- [ ] Email correctly populated
- [ ] Welcome credits added (if implemented)

---

## Phase 1C Checklist

| Task | Status | Notes |
|------|--------|-------|
| 1C.1 Configure Supabase Auth | ⬜ | |
| 1C.2 Auth middleware | ⬜ | |
| 1C.3 Login page | ⬜ | |
| 1C.4 Signup page | ⬜ | |
| 1C.5 Auth hooks | ⬜ | |
| 1C.6 Auth callbacks | ⬜ | |
| 1C.7 User profile trigger | ⬜ | Verify from 1B |

---

## Testing Checklist

- [ ] Can create new account
- [ ] Receives confirmation email (if enabled)
- [ ] Can log in with email/password
- [ ] Session persists across page refreshes
- [ ] Protected routes redirect to login
- [ ] Login redirects to dashboard
- [ ] Sign out works correctly
- [ ] User profile created in database

---

## Next Phase

Once all tasks are complete, proceed to **Phase 1D: Image Generation Core**.
