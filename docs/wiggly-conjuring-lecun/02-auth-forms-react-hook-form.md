# Auth Forms → React Hook Form + shadcn Form Migration

## Files to Modify/Create
- `src/components/auth/login-form.tsx` (modify)
- `src/components/auth/signup-form.tsx` (modify)
- `src/lib/validations/auth.ts` (new - Zod schemas)

## Implementation Details

**Current State:** Manual useState per field with manual error handling:
```tsx
const [email, setEmail] = useState('');
const [password, setPassword] = useState('');
const [error, setError] = useState<string | null>(null);
```

**Migration:**

### Step 1: Create Zod Validation Schemas
Create `src/lib/validations/auth.ts`:
```tsx
import { z } from 'zod';

export const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(1, 'Password is required'),
});

export const signupSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  confirmPassword: z.string(),
}).refine(data => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ['confirmPassword'],
});

export type LoginFormData = z.infer<typeof loginSchema>;
export type SignupFormData = z.infer<typeof signupSchema>;
```

### Step 2: Migrate login-form.tsx
```tsx
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { loginSchema, type LoginFormData } from '@/lib/validations/auth';

const form = useForm<LoginFormData>({
  resolver: zodResolver(loginSchema),
  defaultValues: { email: '', password: '' },
});

<Form {...form}>
  <form onSubmit={form.handleSubmit(onSubmit)}>
    <FormField
      control={form.control}
      name="email"
      render={({ field }) => (
        <FormItem>
          <FormLabel>Email</FormLabel>
          <FormControl>
            <Input type="email" {...field} />
          </FormControl>
          <FormMessage />
        </FormItem>
      )}
    />
    {/* Similar for password */}
  </form>
</Form>
```

### Step 3: Migrate signup-form.tsx
Apply same pattern with signupSchema, including confirmPassword field.

## Acceptance Criteria
- [ ] Login form validates email format on blur/submit
- [ ] Login form shows field-level error messages via FormMessage
- [ ] Signup form validates password length (min 8 chars)
- [ ] Signup form validates password confirmation match
- [ ] Error messages display inline under each field
- [ ] Form submission still calls existing auth handlers
- [ ] Loading states preserved during submission
- [ ] All existing functionality maintained

## Dependencies
- Task 01 (establishes shadcn pattern usage)
