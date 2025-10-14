import { ReactNode } from 'react'

export type Column<T> = {
  header: string
  key?: keyof T
  render?: (row: T) => ReactNode
  className?: string
  headerClassName?: string
}

export default function DataTable<T>({
  rows,
  columns,
}: {
  rows: T[]
  columns: Column<T>[]
}) {
  return (
    <div className="overflow-x-auto bg-white dark:bg-zinc-800 rounded-2xl shadow">
      <table className="w-full text-sm">
        <thead className="bg-gray-50 dark:bg-zinc-700 text-black dark:text-white">
          <tr>
            {columns.map((c, idx) => (
              <th
                key={idx}
                className={`text-left px-4 py-2 font-semibold ${c.headerClassName || ''}`}
              >
                {c.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((r, i) => (
            <tr key={i} className="border-t border-gray-200 dark:border-zinc-700">
              {columns.map((c, j) => (
                <td key={j} className={`px-4 py-2 dark:text-white ${c.className || ''}`}>
                  {c.render
                    ? c.render(r)
                    : c.key
                    ? (r[c.key] as unknown as ReactNode)
                    : null}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
