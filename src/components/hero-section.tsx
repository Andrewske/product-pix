import { Badge } from "@/components/ui/badge"
import { Sparkles } from "lucide-react"
import Image from "next/image"

interface HeroSectionProps {
  badge?: string
  title: string | React.ReactNode
  description: string | React.ReactNode
  primaryCta: React.ReactNode
  secondaryCta?: React.ReactNode
  imageSrc?: string
  imageAlt?: string
}

export function HeroSection({
  badge,
  title,
  description,
  primaryCta,
  secondaryCta,
  imageSrc,
  imageAlt = ""
}: HeroSectionProps) {
  return (
    <section className="w-full relative overflow-hidden py-32 bg-background">
      <div className="absolute inset-0 bg-gradient-to-b from-muted/50 to-background pointer-events-none" />

      <div className="max-w-6xl mx-auto px-4 relative z-10">
        <div className="text-center space-y-8">
          <div className="space-y-6">
            {badge && (
              <Badge
                variant="default"
                className="inline-flex items-center gap-2 shadow-sm"
              >
                <Sparkles className="w-4 h-4" />
                <span>{badge}</span>
              </Badge>
            )}

            <h1 className="text-6xl md:text-8xl font-bold tracking-tight leading-none text-balance font-display">
              {title}
            </h1>

            <p className="text-xl text-muted-foreground max-w-2xl mx-auto leading-relaxed font-light">
              {description}
            </p>
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-8">
            {primaryCta}
            {secondaryCta}
          </div>

          {imageSrc && (
            <div className="mt-16 flex justify-center">
              <div className="relative w-full max-w-4xl aspect-video rounded-2xl overflow-hidden border border-border/50 shadow-2xl">
                <Image
                  src={imageSrc}
                  alt={imageAlt}
                  fill
                  className="object-cover"
                  priority
                />
              </div>
            </div>
          )}
        </div>
      </div>
    </section>
  )
}
