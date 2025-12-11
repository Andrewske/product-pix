import Image from 'next/image'
import { cn } from '@/lib/utils'

export type ImageFrameProps = {
  src: string
  alt: string
  caption?: string
  width?: number
  height?: number
  className?: string
}

export function ImageFrame({
  src,
  alt,
  caption,
  width = 800,
  height = 450,
  className,
}: ImageFrameProps): React.ReactElement {
  return (
    <figure className={cn('my-6', className)}>
      <div className="overflow-hidden rounded-lg border border-border bg-muted/30">
        <Image
          src={src}
          alt={alt}
          width={width}
          height={height}
          className="w-full h-auto"
          sizes="(max-width: 768px) 100vw, 800px"
        />
      </div>
      {caption && (
        <figcaption className="mt-2 text-center text-sm text-muted-foreground">
          {caption}
        </figcaption>
      )}
    </figure>
  )
}
