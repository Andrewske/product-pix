import type { MDXComponents } from 'mdx/types'
import Link from 'next/link'
import { cn } from '@/lib/utils'
import { Callout, Steps, Step, ImageFrame } from '@/components/help/mdx'

// Styled MDX components for help documentation
const components: MDXComponents = {
  // Custom help documentation components
  Callout,
  Steps,
  Step,
  ImageFrame,
  // Standard HTML element overrides
  h1: ({ children, className, ...props }) => (
    <h1
      className={cn(
        'scroll-m-20 text-3xl font-bold tracking-tight text-foreground lg:text-4xl',
        className
      )}
      {...props}
    >
      {children}
    </h1>
  ),
  h2: ({ children, className, ...props }) => (
    <h2
      className={cn(
        'scroll-m-20 border-b border-border pb-2 text-2xl font-semibold tracking-tight text-foreground first:mt-0 mt-10',
        className
      )}
      {...props}
    >
      {children}
    </h2>
  ),
  h3: ({ children, className, ...props }) => (
    <h3
      className={cn(
        'scroll-m-20 text-xl font-semibold tracking-tight text-foreground mt-8',
        className
      )}
      {...props}
    >
      {children}
    </h3>
  ),
  h4: ({ children, className, ...props }) => (
    <h4
      className={cn(
        'scroll-m-20 text-lg font-semibold tracking-tight text-foreground mt-6',
        className
      )}
      {...props}
    >
      {children}
    </h4>
  ),
  p: ({ children, className, ...props }) => (
    <p
      className={cn('leading-7 text-foreground/90 [&:not(:first-child)]:mt-4', className)}
      {...props}
    >
      {children}
    </p>
  ),
  a: ({ href, children, className, ...props }) => {
    const isExternal = href?.startsWith('http')
    if (isExternal) {
      return (
        <a
          href={href}
          className={cn(
            'font-medium text-accent underline underline-offset-4 hover:text-accent/80 transition-colors',
            className
          )}
          target="_blank"
          rel="noopener noreferrer"
          {...props}
        >
          {children}
        </a>
      )
    }
    return (
      <Link
        href={href ?? '#'}
        className={cn(
          'font-medium text-accent underline underline-offset-4 hover:text-accent/80 transition-colors',
          className
        )}
        {...props}
      >
        {children}
      </Link>
    )
  },
  ul: ({ children, className, ...props }) => (
    <ul className={cn('my-4 ml-6 list-disc text-foreground/90 [&>li]:mt-2', className)} {...props}>
      {children}
    </ul>
  ),
  ol: ({ children, className, ...props }) => (
    <ol
      className={cn('my-4 ml-6 list-decimal text-foreground/90 [&>li]:mt-2', className)}
      {...props}
    >
      {children}
    </ol>
  ),
  li: ({ children, className, ...props }) => (
    <li className={cn('leading-7', className)} {...props}>
      {children}
    </li>
  ),
  blockquote: ({ children, className, ...props }) => (
    <blockquote
      className={cn('mt-6 border-l-2 border-accent pl-6 italic text-muted-foreground', className)}
      {...props}
    >
      {children}
    </blockquote>
  ),
  code: ({ children, className, ...props }) => (
    <code
      className={cn(
        'relative rounded bg-muted px-[0.3rem] py-[0.2rem] font-mono text-sm text-foreground',
        className
      )}
      {...props}
    >
      {children}
    </code>
  ),
  pre: ({ children, className, ...props }) => (
    <pre
      className={cn(
        'my-4 overflow-x-auto rounded-lg border border-border bg-muted p-4 font-mono text-sm',
        className
      )}
      {...props}
    >
      {children}
    </pre>
  ),
  table: ({ children, className, ...props }) => (
    <div className="my-6 w-full overflow-y-auto">
      <table className={cn('w-full border-collapse text-sm', className)} {...props}>
        {children}
      </table>
    </div>
  ),
  thead: ({ children, className, ...props }) => (
    <thead className={cn('border-b border-border', className)} {...props}>
      {children}
    </thead>
  ),
  tbody: ({ children, className, ...props }) => (
    <tbody className={cn('[&_tr:last-child]:border-0', className)} {...props}>
      {children}
    </tbody>
  ),
  tr: ({ children, className, ...props }) => (
    <tr
      className={cn('border-b border-border transition-colors hover:bg-muted/50', className)}
      {...props}
    >
      {children}
    </tr>
  ),
  th: ({ children, className, ...props }) => (
    <th
      className={cn(
        'h-10 px-4 text-left align-middle font-medium text-muted-foreground',
        className
      )}
      {...props}
    >
      {children}
    </th>
  ),
  td: ({ children, className, ...props }) => (
    <td className={cn('p-4 align-middle text-foreground', className)} {...props}>
      {children}
    </td>
  ),
  hr: ({ className, ...props }) => (
    <hr className={cn('my-8 border-border', className)} {...props} />
  ),
  strong: ({ children, className, ...props }) => (
    <strong className={cn('font-semibold text-foreground', className)} {...props}>
      {children}
    </strong>
  ),
  em: ({ children, className, ...props }) => (
    <em className={cn('italic', className)} {...props}>
      {children}
    </em>
  ),
}

export function useMDXComponents(
  otherComponents?: MDXComponents
): MDXComponents {
  return {
    ...components,
    ...otherComponents,
  }
}
