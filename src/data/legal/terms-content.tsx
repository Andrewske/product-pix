import type { LegalSection } from '@/components/legal/legal-page-template';

const CONTACT_EMAIL = 'support@productpix.ai';

export const termsSections: LegalSection[] = [
  {
    id: 'introduction',
    title: '1. Introduction',
    level: 2,
    content: (
      <>
        <p className="mb-4">
          Welcome to ProductPix. We provide an AI-powered service that generates professional
          product photos with custom backgrounds for e-commerce sellers.
        </p>
        <p>
          By using ProductPix, you agree to these Terms of Service. If you don&apos;t agree,
          please don&apos;t use our service.
        </p>
      </>
    ),
  },
  {
    id: 'eligibility',
    title: '2. Eligibility',
    level: 2,
    content: (
      <>
        <p className="mb-4">To use ProductPix, you must:</p>
        <ul className="list-disc list-inside space-y-2 ml-4">
          <li><strong>Be at least 18 years old</strong> — This is required for payment processing and to enter into this agreement.</li>
          <li><strong>Be located in the United States</strong> — We currently only serve US customers.</li>
        </ul>
      </>
    ),
  },
  {
    id: 'account',
    title: '3. Your Account',
    level: 2,
    content: (
      <>
        <p className="mb-4">
          You&apos;ll need to create an account to use ProductPix. When you do:
        </p>
        <ul className="list-disc list-inside space-y-2 ml-4">
          <li>You must provide accurate information (email address, name).</li>
          <li>You&apos;re responsible for keeping your account secure.</li>
          <li>You&apos;re responsible for all activity under your account.</li>
          <li>One account per person or business, please.</li>
        </ul>
      </>
    ),
  },
  {
    id: 'service',
    title: '4. The Service',
    level: 2,
    content: (
      <>
        <p className="mb-4">Here&apos;s what ProductPix does:</p>
        <ul className="list-disc list-inside space-y-2 ml-4 mb-4">
          <li>You upload a product photo.</li>
          <li>Our AI generates new photos with professional backgrounds.</li>
          <li>Each generation costs credits.</li>
          <li>Your generated images are available for 30 days, then automatically deleted.</li>
        </ul>
        <p>
          We&apos;re always working to improve the service, so features may change over time.
        </p>
      </>
    ),
  },
  {
    id: 'credits',
    title: '5. Credits & Payments',
    level: 2,
    content: (
      <>
        <p className="mb-4"><strong>How credits work:</strong></p>
        <ul className="list-disc list-inside space-y-2 ml-4">
          <li>You purchase credit packs upfront.</li>
          <li><strong>Credits never expire.</strong> Once you buy them, they&apos;re yours for life.</li>
          <li>Prices are displayed at the time of purchase and are in USD.</li>
          <li>Payments are processed securely through Stripe.</li>
        </ul>
      </>
    ),
  },
  {
    id: 'refunds',
    title: '6. Refunds',
    level: 2,
    content: (
      <>
        <p className="mb-4">
          We believe your money is yours. If the service isn&apos;t working for you,
          you should be able to get it back.
        </p>
      </>
    ),
  },
  {
    id: 'refunds-credit',
    title: 'Credit Refunds (for bad generations)',
    level: 3,
    content: (
      <p className="mb-4">
        If you&apos;re not happy with a generated image, you can get your credits back
        instantly — no questions asked. This is self-service in your account.
      </p>
    ),
  },
  {
    id: 'refunds-cash',
    title: 'Cash Refunds',
    level: 3,
    content: (
      <>
        <p className="mb-4">
          If you want your money back, you can request a refund directly from your
          account settings. No need to contact support. You&apos;ll have two options:
        </p>
        <ul className="list-disc list-inside space-y-2 ml-4">
          <li><strong>100% refund</strong> — Get all your money back.</li>
          <li><strong>90% refund</strong> — If you&apos;d like to help cover our payment processing
          and infrastructure costs, you can choose this option. We appreciate it, but
          there&apos;s zero pressure.</li>
        </ul>
      </>
    ),
  },
  {
    id: 'ownership',
    title: '7. Ownership & Intellectual Property',
    level: 2,
    content: null,
  },
  {
    id: 'ownership-content',
    title: 'Your Content',
    level: 3,
    content: (
      <p className="mb-4">
        <strong>You own everything you create with ProductPix.</strong> The images we
        generate for you are yours — you have full commercial rights to use them
        however you want: product listings, ads, packaging, whatever you need.
      </p>
    ),
  },
  {
    id: 'ownership-upload',
    title: 'What You Upload',
    level: 3,
    content: (
      <p className="mb-4">
        By uploading images, you confirm that you have the right to use them.
        For resellers and dropshippers: photographing products you legitimately
        own or sell is fine.
      </p>
    ),
  },
  {
    id: 'ownership-use',
    title: 'How We Use Your Images',
    level: 3,
    content: (
      <ul className="list-disc list-inside space-y-2 ml-4">
        <li><strong>Processing:</strong> We use your uploaded images to generate new photos.
        Uploaded images are deleted after processing.</li>
        <li><strong>Internal improvement:</strong> We may use your images internally to test
        and improve our AI prompts. This helps us make better photos for everyone.</li>
        <li><strong>Marketing:</strong> We will never use your images for marketing or
        promotional purposes without your explicit permission.</li>
      </ul>
    ),
  },
  {
    id: 'acceptable-use',
    title: '8. Acceptable Use',
    level: 2,
    content: (
      <>
        <p className="mb-4">
          Don&apos;t use ProductPix for anything illegal. That&apos;s it. We&apos;re a tool to
          help you create better product photos, not a platform for illegal activity.
        </p>
        <p>
          We reserve the right to terminate accounts that violate this policy.
        </p>
      </>
    ),
  },
  {
    id: 'termination',
    title: '9. Account Termination',
    level: 2,
    content: null,
  },
  {
    id: 'termination-by-you',
    title: 'By You',
    level: 3,
    content: (
      <>
        <p className="mb-4">
          You can delete your account anytime from your account settings. When you do:
        </p>
        <ul className="list-disc list-inside space-y-2 ml-4 mb-4">
          <li>Your personal data is deleted.</li>
          <li>Your uploaded and generated images are deleted.</li>
          <li>We keep anonymized usage data (no personally identifiable information)
          to improve our service.</li>
        </ul>
      </>
    ),
  },
  {
    id: 'termination-by-us',
    title: 'By Us',
    level: 3,
    content: (
      <p>
        We may terminate or suspend your account if you violate these Terms.
        We&apos;ll try to give you notice when possible.
      </p>
    ),
  },
  {
    id: 'disclaimers',
    title: '10. Disclaimers & Liability',
    level: 2,
    content: (
      <>
        <p className="mb-4">
          ProductPix is provided &quot;as is.&quot; We work hard to make it great, but we can&apos;t
          guarantee:
        </p>
        <ul className="list-disc list-inside space-y-2 ml-4 mb-4">
          <li>Specific results or outcomes.</li>
          <li>That the service will be uninterrupted or error-free.</li>
          <li>That AI-generated images will always meet your expectations (that&apos;s
          why we have easy refunds).</li>
        </ul>
        <p>
          Our liability is limited to the amount you&apos;ve paid us. We&apos;re not liable
          for indirect, incidental, or consequential damages.
        </p>
      </>
    ),
  },
  {
    id: 'changes',
    title: '11. Changes to Terms',
    level: 2,
    content: (
      <>
        <p className="mb-4">
          We may update these Terms from time to time. If we make significant changes,
          we&apos;ll notify you by email or through the service.
        </p>
        <p>
          Continuing to use ProductPix after changes means you accept the new Terms.
        </p>
      </>
    ),
  },
  {
    id: 'contact',
    title: '12. Contact',
    level: 2,
    content: (
      <p>
        Questions about these Terms? Email us at{' '}
        <a href={`mailto:${CONTACT_EMAIL}`} className="text-accent hover:underline">
          {CONTACT_EMAIL}
        </a>
      </p>
    ),
  },
];

export const termsFooterLinks = [
  { href: '/privacy', label: 'Privacy Policy' },
];

export const termsLastUpdated = 'December 11, 2025';