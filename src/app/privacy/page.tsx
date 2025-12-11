import type { Metadata } from 'next'
import { LegalPageTemplate } from '@/components/legal'
import { privacySections, privacyFooterLinks, privacyLastUpdated } from '@/data/legal/privacy-content'

export const metadata: Metadata = {
  title: 'Privacy Policy | ProductPix',
  description: 'Privacy Policy for ProductPix - how we handle your data'
}

export default function PrivacyPage(): React.ReactElement {
  return (
    <LegalPageTemplate
      title="Privacy Policy"
      sections={privacySections}
      footerLinks={privacyFooterLinks}
      lastUpdated={privacyLastUpdated}
    />
  )
}
