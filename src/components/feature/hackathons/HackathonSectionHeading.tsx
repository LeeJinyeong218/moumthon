export default function HackathonSectionHeading({
  icon: Icon,
  children,
}: {
  icon: React.ElementType
  children: React.ReactNode
}) {
  return (
    <div className="flex items-center gap-2.5 mb-6 pb-4 border-b border-border">
      <div className="p-1.5 rounded-md bg-primary-50">
        <Icon size={16} className="text-primary-600" />
      </div>
      <h2 className="text-lg font-bold text-foreground">{children}</h2>
    </div>
  )
}
