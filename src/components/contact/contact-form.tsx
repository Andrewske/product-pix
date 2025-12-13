'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { AlertBox } from '@/components/ui/alert-box';
import { contactFormSchema, ContactFormData } from '@/lib/validation/contact';

type FieldErrors = {
  name?: string;
  email?: string;
  message?: string;
};

export function ContactForm(): React.ReactElement {
  const [formData, setFormData] = useState<ContactFormData>({
    name: '',
    email: '',
    message: '',
  });
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleBlur = (field: keyof ContactFormData) => {
    const parsed = contactFormSchema.shape[field].safeParse(formData[field]);
    if (!parsed.success) {
      setFieldErrors(prev => ({
        ...prev,
        [field]: parsed.error.issues[0].message,
      }));
    } else {
      setFieldErrors(prev => ({
        ...prev,
        [field]: undefined,
      }));
    }
  };

  const handleChange = (field: keyof ContactFormData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    // Clear field error when user starts typing
    if (fieldErrors[field]) {
      setFieldErrors(prev => ({
        ...prev,
        [field]: undefined,
      }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    // Validate entire form
    const parsed = contactFormSchema.safeParse(formData);
    if (!parsed.success) {
      const errors: FieldErrors = {};
      parsed.error.issues.forEach(issue => {
        const field = issue.path[0] as keyof ContactFormData;
        errors[field] = issue.message;
      });
      setFieldErrors(errors);
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      const result = await response.json();

      if (!response.ok) {
        if (response.status === 400 && result.details) {
          // Handle validation errors from server
          const errors: FieldErrors = {};
          result.details.forEach((issue: { path: (string | number)[]; message: string }) => {
            const field = issue.path[0] as keyof ContactFormData;
            errors[field] = issue.message;
          });
          setFieldErrors(errors);
        } else if (response.status === 429) {
          setError('Too many requests. Please try again later.');
        } else {
          setError(result.error || 'Failed to send message');
        }
        return;
      }

      setSubmitted(true);
      setFormData({ name: '', email: '', message: '' });
      setFieldErrors({});
    } catch {
      setError('Failed to send message. Please check your connection and try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (submitted) {
    return (
      <div className="text-center py-8">
        <div className="bg-success/10 border border-success/20 text-success px-4 py-3 rounded-lg mb-4">
          <h3 className="font-medium">Message sent!</h3>
          <p className="text-sm mt-1">
            Thank you for contacting us. We&apos;ll get back to you within 24 hours.
          </p>
        </div>
        <Button
          variant="outline"
          onClick={() => {
            setSubmitted(false);
            setFormData({ name: '', email: '', message: '' });
            setFieldErrors({});
            setError(null);
          }}
          className="w-full"
        >
          Send another message
        </Button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="name">Name</Label>
           <Input
             id="name"
             type="text"
             value={formData.name}
             onChange={(e) => handleChange('name', e.target.value)}
             onBlur={() => handleBlur('name')}
             placeholder="Your name"
             required
             disabled={isSubmitting}
             {...(fieldErrors.name && { 'aria-invalid': true })}
           />
          {fieldErrors.name && (
            <p className="text-sm text-destructive">{fieldErrors.name}</p>
          )}
        </div>
        <div className="space-y-2">
          <Label htmlFor="email">Email</Label>
           <Input
             id="email"
             type="email"
             value={formData.email}
             onChange={(e) => handleChange('email', e.target.value)}
             onBlur={() => handleBlur('email')}
             placeholder="your@email.com"
             required
             disabled={isSubmitting}
             {...(fieldErrors.email && { 'aria-invalid': true })}
           />
          {fieldErrors.email && (
            <p className="text-sm text-destructive">{fieldErrors.email}</p>
          )}
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="message">Message</Label>
         <Textarea
           id="message"
           value={formData.message}
           onChange={(e) => handleChange('message', e.target.value)}
           onBlur={() => handleBlur('message')}
           placeholder="How can we help you?"
           rows={5}
           required
           disabled={isSubmitting}
           {...(fieldErrors.message && { 'aria-invalid': true })}
         />
        {fieldErrors.message && (
          <p className="text-sm text-destructive">{fieldErrors.message}</p>
        )}
      </div>

      {error && (
        <AlertBox variant="error">
          {error}
        </AlertBox>
      )}

      <Button
        type="submit"
        variant="accent"
        disabled={isSubmitting}
        className="w-full"
      >
        {isSubmitting ? 'Sending...' : 'Send Message'}
      </Button>
    </form>
  );
}