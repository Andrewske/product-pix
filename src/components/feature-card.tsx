import { Card } from "@/components/ui/card"
import { AspectRatio } from "@/components/ui/aspect-ratio"
import { Badge } from "@/components/ui/badge"
import { ArrowUpRight, ImageIcon } from "lucide-react"
import Image from "next/image"

interface FeatureCardProps {
  title: string
  description: string
  imageSrc?: string
  imageAlt?: string
  badge?: string
}

export function FeatureCard({
  title,
  description,
  imageSrc,
  imageAlt = "",
  badge
}: FeatureCardProps) {
  return (
    <div className="group cursor-pointer">
      <Card className="rounded-2xl overflow-hidden mb-6 relative hover:border-primary/50 transition-colors">
        <AspectRatio ratio={4/5}>
          {imageSrc ? (
            <Image
              src={imageSrc}
              alt={imageAlt}
              fill
              className="object-cover"
            />
          ) : (
            <div className="flex items-center justify-center h-full bg-muted/20">
              <ImageIcon className="w-12 h-12 text-muted-foreground/20" />
            </div>
          )}
        </AspectRatio>
        {badge && (
          <Badge
            variant="outline"
            className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity bg-background/80 backdrop-blur"
          >
            {badge} <ArrowUpRight className="w-3 h-3 ml-1" />
          </Badge>
        )}
      </Card>
      <h3 className="text-lg font-semibold mb-1 group-hover:text-primary transition-colors">
        {title}
      </h3>
      <p className="text-sm text-muted-foreground">{description}</p>
    </div>
  )
}
