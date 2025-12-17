interface SectionHeaderProps {
  title: string
  description?: string
  centered?: boolean
}

export function SectionHeader({
  title,
  description,
  centered = true
}: SectionHeaderProps) {
  return (
    <div className={centered ? "text-center mb-24" : "mb-12"}>
      <h2 className="text-4xl font-bold mb-6 tracking-tight font-display">
        {title}
      </h2>
      {description && (
        <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
          {description}
        </p>
      )}
    </div>
  )
}
