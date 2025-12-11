import type { LegalSection } from '@/components/legal/legal-page-template';

const CONTACT_EMAIL = 'privacy@productpix.ai';

export const privacySections: LegalSection[] = [
  {
    id: 'introduction',
    title: '1. Introduction',
    level: 2,
    content: (
      <>
        <p className="mb-4">
          This Privacy Policy explains how ProductPix collects, uses, and protects your
          information when you use our AI product photo generation service.
        </p>
        <p>
          We believe in transparency. This policy is written in plain English so you
          can actually understand what happens with your data.
        </p>
      </>
    ),
  },
  {
    id: 'information-collected',
    title: '2. Information We Collect',
    level: 2,
    content: null,
  },
  {
    id: 'account-information',
    title: 'Account Information',
    level: 3,
    content: (
      <ul className="list-disc list-inside space-y-2 ml-4 mb-4">
        <li><strong>Email address</strong> — Required to create your account</li>
        <li><strong>Name</strong> — Optional, helps us personalize your experience</li>
      </ul>
    ),
  },
  {
    id: 'payment-information',
    title: 'Payment Information',
    level: 3,
    content: (
      <p className="mb-4">
        Payments are processed by Stripe. <strong>We never see or store your credit
        card details.</strong> Stripe handles all payment information securely.
      </p>
    ),
  },
  {
    id: 'content-uploaded',
    title: 'Content You Upload',
    level: 3,
    content: (
      <ul className="list-disc list-inside space-y-2 ml-4 mb-4">
        <li><strong>Uploaded images</strong> — Product photos you upload for processing.
        These are deleted after we generate your new images.</li>
        <li><strong>Generated images</strong> — The photos we create for you. These are
        stored for 30 days so you can access them.</li>
      </ul>
    ),
  },
  {
    id: 'usage-data',
    title: 'Usage Data',
    level: 3,
    content: (
      <p>
        We collect anonymized data about how you use ProductPix — things like which
        features you use and how often. This helps us improve the service for everyone.
      </p>
    ),
  },
  {
    id: 'how-we-use',
    title: '3. How We Use Your Information',
    level: 2,
    content: (
      <>
        <p className="mb-4">We use your information to:</p>
        <ul className="list-disc list-inside space-y-2 ml-4">
          <li><strong>Provide the service</strong> — Process your images and generate new photos</li>
          <li><strong>Process payments</strong> — Handle credit purchases and refunds</li>
          <li><strong>Improve our AI</strong> — Use images internally to test and improve our
          prompts (never for marketing without your permission)</li>
          <li><strong>Send service updates</strong> — Important notifications about your account</li>
          <li><strong>Analytics</strong> — Understand usage patterns to make ProductPix better</li>
          <li><strong>Marketing</strong> — Only if you opt-in to cookies/tracking</li>
        </ul>
      </>
    ),
  },
  {
    id: 'cookies',
    title: '4. Cookies & Tracking',
    level: 2,
    content: null,
  },
  {
    id: 'essential-cookies',
    title: 'Essential Cookies (Always On)',
    level: 3,
    content: (
      <p className="mb-4">
        We use essential cookies for things like keeping you logged in and making
        the site work properly. These can&apos;t be disabled.
      </p>
    ),
  },
  {
    id: 'analytics-cookies',
    title: 'Analytics & Marketing Cookies (Opt-In Only)',
    level: 3,
    content: (
      <>
        <p className="mb-4">
          We&apos;ll ask for your permission before using any tracking for:
        </p>
        <ul className="list-disc list-inside space-y-2 ml-4 mb-4">
          <li>Analytics to understand how people use ProductPix</li>
          <li>Facebook Pixel for advertising (if you consent)</li>
        </ul>
        <p>
          <strong>You&apos;re in control.</strong> You can accept or decline these cookies
          when you first visit, and you can change your choice anytime in your
          account settings.
        </p>
      </>
    ),
  },
  {
    id: 'third-parties',
    title: '5. Third-Party Services',
    level: 2,
    content: (
      <>
        <p className="mb-4">
          We use trusted services to run ProductPix. Here&apos;s who has access to what:
        </p>

        <div className="overflow-x-auto mb-4">
          <table className="w-full border-collapse">
            <thead>
              <tr className="border-b border-border">
                <th className="text-left py-3 pr-4 font-semibold">Service</th>
                <th className="text-left py-3 pr-4 font-semibold">Purpose</th>
                <th className="text-left py-3 font-semibold">Data Shared</th>
              </tr>
            </thead>
            <tbody className="text-foreground/80">
              <tr className="border-b border-border/50">
                <td className="py-3 pr-4"><strong>Stripe</strong></td>
                <td className="py-3 pr-4">Payment processing</td>
                <td className="py-3">Payment info (they store it, not us)</td>
              </tr>
              <tr className="border-b border-border/50">
                <td className="py-3 pr-4"><strong>Supabase</strong></td>
                <td className="py-3 pr-4">Database & authentication</td>
                <td className="py-3">Account data, usage data</td>
              </tr>
              <tr className="border-b border-border/50">
                <td className="py-3 pr-4"><strong>Cloudflare R2</strong></td>
                <td className="py-3 pr-4">Image storage</td>
                <td className="py-3">Your uploaded & generated images</td>
              </tr>
              <tr className="border-b border-border/50">
                <td className="py-3 pr-4"><strong>Google (Gemini)</strong></td>
                <td className="py-3 pr-4">AI image generation</td>
                <td className="py-3">Images sent for processing</td>
              </tr>
              <tr>
                <td className="py-3 pr-4"><strong>Facebook</strong></td>
                <td className="py-3 pr-4">Advertising (if opted-in)</td>
                <td className="py-3">Anonymized usage data</td>
              </tr>
            </tbody>
          </table>
        </div>

        <p>
          Each of these services has their own privacy policy. We only share what&apos;s
          necessary for them to provide their service.
        </p>
      </>
    ),
  },
  {
    id: 'data-retention',
    title: '6. Data Retention',
    level: 2,
    content: (
      <>
        <p className="mb-4">Here&apos;s how long we keep different types of data:</p>
        <ul className="list-disc list-inside space-y-2 ml-4">
          <li><strong>Uploaded images</strong> — Deleted immediately after processing</li>
          <li><strong>Generated images</strong> — 30 days, then automatically deleted</li>
          <li><strong>Account data</strong> — Until you delete your account</li>
          <li><strong>Anonymized usage data</strong> — Kept indefinitely (contains no
          personally identifiable information)</li>
        </ul>
      </>
    ),
  },
  {
    id: 'your-rights',
    title: '7. Your Rights',
    level: 2,
    content: (
      <>
        <p className="mb-4">You have control over your data:</p>
        <ul className="list-disc list-inside space-y-2 ml-4 mb-4">
          <li><strong>Access</strong> — See what data we have about you</li>
          <li><strong>Delete</strong> — Delete your account anytime from settings
          (this removes your personal data)</li>
          <li><strong>Opt-out</strong> — Decline or revoke marketing cookies anytime</li>
          <li><strong>Export</strong> — Request a copy of your data by contacting us</li>
        </ul>
        <p>
          To exercise any of these rights, use your account settings or email us at{' '}
          <a href={`mailto:${CONTACT_EMAIL}`} className="text-accent hover:underline">
            {CONTACT_EMAIL}
          </a>
        </p>
      </>
    ),
  },
  {
    id: 'security',
    title: '8. Data Security',
    level: 2,
    content: (
      <>
        <p className="mb-4">We take security seriously:</p>
        <ul className="list-disc list-inside space-y-2 ml-4 mb-4">
          <li>All data is encrypted in transit (HTTPS)</li>
          <li>We use secure, enterprise-grade cloud infrastructure</li>
          <li>We never store your payment card details</li>
          <li>Access to data is limited to those who need it</li>
        </ul>
        <p>
          No system is 100% secure, but we follow industry best practices to protect
          your information.
        </p>
      </>
    ),
  },
  {
    id: 'children',
    title: '9. Children&apos;s Privacy',
    level: 2,
    content: (
      <p>
        ProductPix is not intended for anyone under 18 years old. We do not
        knowingly collect information from children. If you believe a child has
        provided us with personal information, please contact us and we&apos;ll delete it.
      </p>
    ),
  },
  {
    id: 'changes',
    title: '10. Changes to This Policy',
    level: 2,
    content: (
      <>
        <p className="mb-4">
          We may update this Privacy Policy from time to time. If we make significant
          changes, we&apos;ll notify you by email or through the service.
        </p>
        <p>
          The &quot;Last updated&quot; date at the top shows when this policy was last revised.
        </p>
      </>
    ),
  },
  {
    id: 'contact',
    title: '11. Contact Us',
    level: 2,
    content: (
      <p>
        Questions about this Privacy Policy? We&apos;re happy to help. Email us at{' '}
        <a href={`mailto:${CONTACT_EMAIL}`} className="text-accent hover:underline">
          {CONTACT_EMAIL}
        </a>
      </p>
    ),
  },
];

export const privacyFooterLinks = [
  { href: '/terms', label: 'Terms of Service' },
];

export const privacyLastUpdated = 'December 11, 2025';