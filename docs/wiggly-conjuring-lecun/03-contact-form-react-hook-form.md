# Contact Form → React Hook Form + shadcn Form Migration

## Files to Modify/Create
- `src/components/contact/contact-form.tsx` (modify)
- `src/lib/validations/contact.ts` (new - Zod schema)

## Implementation Details

**Current State:** Manual useState per field with manual error handling (same pattern as auth forms).

**Migration:**

### Step 1: Create Zod Validation Schema
Create `src/lib/validations/contact.ts`:
```tsx
import { z } from 'zod';

export const contactSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  email: z.string().email('Invalid email address'),
  subject: z.string().min(1, 'Subject is required'),
  message: z.string().min(10, 'Message must be at least 10 characters'),
});

export type ContactFormData = z.infer<typeof contactSchema>;
```

### Step 2: Migrate contact-form.tsx
Apply same pattern as auth forms:
```tsx
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { contactSchema, type ContactFormData } from '@/lib/validations/contact';

const form = useForm<ContactFormData>({
  resolver: zodResolver(contactSchema),
  defaultValues: { name: '', email: '', subject: '', message: '' },
});
```

Use Textarea component for message field with FormControl wrapper.

## Acceptance Criteria
- [ ] All fields validate correctly (name required, email format, subject required, message min length)
- [ ] Field-level error messages display via FormMessage
- [ ] Form submission calls existing contact API handler
- [ ] Success/error states preserved
- [ ] Loading state during submission maintained

## Dependencies
- Task 02 (establishes Form pattern, can reuse validation patterns)
