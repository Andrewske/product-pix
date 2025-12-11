import type { Metadata } from 'next'
import { LegalPageTemplate } from '@/components/legal'
import { termsSections, termsFooterLinks, termsLastUpdated } from '@/data/legal/terms-content'

export const metadata: Metadata = {
  title: 'Terms of Service | ProductPix',
  description: 'Terms of Service for ProductPix - AI product photo generator'
}

export default function TermsPage(): React.ReactElement {
  return (
    <LegalPageTemplate
      title="Terms of Service"
      sections={termsSections}
      footerLinks={termsFooterLinks}
      lastUpdated={termsLastUpdated}
    />
  )
}
