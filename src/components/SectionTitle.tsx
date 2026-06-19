export function SectionTitle({
  title,
  subtitle
}: {
  title: string
  subtitle?: string
}) {
  return (
    <div className="mb-4">
      <h2 className="text-lg font-bold text-industrial-800">{title}</h2>
      {subtitle && (
        <p className="text-xs text-industrial-400 mt-0.5">{subtitle}</p>
      )}
    </div>
  )
}
