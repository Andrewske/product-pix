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
      {/* Studio Spotlight Background Style */}

      {/* 1. Technical Grid Pattern */}
      <div 
        className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)] pointer-events-none" 
      />

      {/* 2. The Spotlight - Primary Glow behind text */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[1000px] h-[600px] opacity-20 pointer-events-none">
        <div className="absolute inset-0 bg-gradient-to-b from-primary/30 to-transparent blur-[100px]" />
      </div>

      {/* 3. Subtle Noise Texture (retained for premium feel) */}
      <div 
        className="absolute inset-0 opacity-[0.03] pointer-events-none mix-blend-overlay"
        style={{ 
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.8' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")`
        }} 
      />

      {/* 4. Vignette to fade grid at edges */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,transparent_0%,var(--color-background)_100%)] pointer-events-none" />

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
