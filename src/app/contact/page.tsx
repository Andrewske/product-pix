import type { Metadata } from 'next'
import { PageContainer } from '@/components/layout/page-container'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { ContactForm } from '@/components/contact/contact-form'

export const metadata: Metadata = {
  title: 'Contact | ProductPix',
  description: 'Get in touch with ProductPix support'
}

export default function ContactPage(): React.ReactElement {
  return (
    <PageContainer>
      <div className="max-w-2xl mx-auto">
        <div className="text-center mb-12">
          <h1 className="text-3xl font-bold font-display mb-2">Get in Touch</h1>
          <p className="text-xl text-muted-foreground max-w-xl mx-auto">
            Have a question or need help? We&apos;d love to hear from you.
          </p>
        </div>

        <Card variant="control">
          <CardHeader>
            <CardTitle className="font-display">Send us a message</CardTitle>
            <CardDescription>We typically respond within 24 hours</CardDescription>
          </CardHeader>
          <CardContent>
            <ContactForm />
          </CardContent>
        </Card>

        <div className="mt-8 text-center text-muted-foreground">
          <p>Or email us directly at</p>
          <a
            href="mailto:support@productpix.ai"
            className="text-accent hover:underline font-medium"
          >
            support@productpix.ai
          </a>
        </div>
      </div>
    </PageContainer>
  );
}