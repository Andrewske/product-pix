import React from 'react';
import { Body, Head, Heading, Hr, Html, Link, render, Section, Text } from 'jsx-email';
import { env } from '@/lib/env';

export interface ContactNotificationParams {
  name: string;
  email: string;
  message: string;
  submittedAt: string;
}

// Component for admin notification email
const ContactAdminNotification = ({
  name,
  email,
  message,
  submittedAt,
}: ContactNotificationParams): React.JSX.Element => {
  const formattedDate = new Date(submittedAt).toLocaleString('en-US', {
    dateStyle: 'long',
    timeStyle: 'short',
  });

  return (
    <Html lang="en">
      <Head />
      <Body
        style={{
          fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
          lineHeight: '1.6',
          color: '#333',
          maxWidth: '600px',
          margin: '0 auto',
          padding: '20px',
        }}
      >
        <Heading style={{ color: '#10b981', marginBottom: '24px' }}>
          New Contact Submission
        </Heading>

        <Section
          style={{
            backgroundColor: '#f9fafb',
            borderLeft: '4px solid #10b981',
            padding: '16px',
            marginBottom: '24px',
          }}
        >
          <Text style={{ margin: '0 0 8px 0' }}>
            <strong>From:</strong> {name}
          </Text>
          <Text style={{ margin: '0 0 8px 0' }}>
            <strong>Email:</strong>{' '}
            <Link href={`mailto:${email}`} style={{ color: '#14b8a6' }}>
              {email}
            </Link>
          </Text>
          <Text style={{ margin: '0' }}>
            <strong>Submitted:</strong> {formattedDate}
          </Text>
        </Section>

        <Heading
          as="h2"
          style={{ color: '#374151', fontSize: '18px', marginBottom: '12px' }}
        >
          Message:
        </Heading>
        <Text
          style={{
            whiteSpace: 'pre-wrap',
            backgroundColor: '#f9fafb',
            padding: '16px',
            borderRadius: '8px',
          }}
        >
          {message}
        </Text>

        <Hr style={{ borderTop: '1px solid #e5e7eb', margin: '32px 0' }} />

        <Text style={{ fontSize: '14px', color: '#6b7280', margin: '0' }}>
          Sent from ProductPix Contact Form
        </Text>
      </Body>
    </Html>
  );
};

// Component for user acknowledgment email
const ContactUserAcknowledgment = ({ name }: { name: string }): React.JSX.Element => {
  const appUrl = env.NEXT_PUBLIC_APP_URL;

  return (
    <Html lang="en">
      <Head />
      <Body
        style={{
          fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
          lineHeight: '1.6',
          color: '#333',
          maxWidth: '600px',
          margin: '0 auto',
          padding: '20px',
        }}
      >
        <Heading style={{ color: '#10b981', marginBottom: '24px' }}>
          Thanks for reaching out!
        </Heading>

        <Text>Hi {name},</Text>

        <Text>
          We&apos;ve received your message and will get back to you as soon as possible. Our
          team typically responds within 24-48 hours during business days.
        </Text>

        <Text>
          In the meantime, feel free to explore{' '}
          <Link href={appUrl} style={{ color: '#14b8a6', textDecoration: 'none' }}>
            ProductPix
          </Link>{' '}
          and create stunning product images with AI.
        </Text>

        <Text style={{ marginTop: '32px' }}>
          Best regards,
          <br />
          <strong>The ProductPix Team</strong>
        </Text>

        <Hr style={{ borderTop: '1px solid #e5e7eb', margin: '32px 0' }} />

        <Text style={{ fontSize: '14px', color: '#6b7280', margin: '0' }}>
          ProductPix - AI Product Photo Generator
          <br />
          <Link href={appUrl} style={{ color: '#14b8a6' }}>
            {appUrl}
          </Link>
        </Text>
      </Body>
    </Html>
  );
};

// Render functions that return HTML strings
export const renderContactAdminNotification = async (
  params: ContactNotificationParams
): Promise<string> => {
  return await render(<ContactAdminNotification {...params} />, {
    pretty: false,
  });
};

export const renderContactUserAcknowledgment = async (params: {
  name: string;
}): Promise<string> => {
  return await render(<ContactUserAcknowledgment {...params} />, {
    pretty: false,
  });
};