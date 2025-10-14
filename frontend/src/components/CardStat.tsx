export default function CardStat({
  title,
  value,
}: {
  title: string
  value: string | number
}) {
  return (
    <div className="bg-white dark:bg-zinc-800 dark:text-white rounded-2xl shadow p-4">
      <div className="text-sm text-gray-500 dark:text-gray-400">{title}</div>
      <div className="text-2xl font-semibold">{value}</div>
    </div>
  )
}
