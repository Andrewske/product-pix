import { notFound } from 'next/navigation'
import { Metadata } from 'next'
import { getHelpPageBySlug } from '@/lib/help'
import { getHelpContent, generateHelpStaticParams } from '@/lib/help/mdx'

type PageProps = {
  params: Promise<{ slug: string[] }>
}

export async function generateStaticParams(): Promise<{ slug: string[] }[]> {
  return generateHelpStaticParams()
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params
  const slugStr = slug.join('/')
  const page = getHelpPageBySlug(slugStr)

  if (!page) {
    return {
      title: 'Not Found | ProductPix Help',
    }
  }

  return {
    title: `${page.title} | ProductPix Help`,
    description: page.description,
  }
}

export default async function HelpContentPage({ params }: PageProps): Promise<React.ReactElement> {
  const { slug } = await params
  const slugStr = slug.join('/')

  // Check if the page exists in navigation
  const navPage = getHelpPageBySlug(slugStr)
  if (!navPage) {
    notFound()
  }

  // Check if the MDX content exists
  const content = getHelpContent(slugStr)

  // If no MDX file yet, show a placeholder
  if (!content) {
    return (
      <article className="prose prose-slate dark:prose-invert max-w-none">
        <h1>{navPage.title}</h1>
        <p className="text-muted-foreground">{navPage.description}</p>
        <div className="mt-8 rounded-lg border border-border bg-muted/50 p-6">
          <p className="text-sm text-muted-foreground">
            This help article is coming soon. Check back later for detailed documentation.
          </p>
        </div>
      </article>
    )
  }

  // Dynamically import the MDX component
  try {
    const { default: MDXContent } = await import(`@/content/help/${slugStr}.mdx`)
    return (
      <article className="prose prose-slate dark:prose-invert max-w-none">
        <MDXContent />
      </article>
    )
  } catch {
    // If MDX import fails, show placeholder
    return (
      <article className="prose prose-slate dark:prose-invert max-w-none">
        <h1>{navPage.title}</h1>
        <p className="text-muted-foreground">{navPage.description}</p>
        <div className="mt-8 rounded-lg border border-border bg-muted/50 p-6">
          <p className="text-sm text-muted-foreground">
            This help article is coming soon. Check back later for detailed documentation.
          </p>
        </div>
      </article>
    )
  }
}

// Return 404 for undefined routes
export const dynamicParams = false
