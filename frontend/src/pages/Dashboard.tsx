import { useQuery } from '@tanstack/react-query'

import CardStat from '../components/CardStat'
import DataTable from '../components/DataTable'
import { getCreditSummary, getDashboard, getLowStock } from '../lib/api'

export default function Dashboard() {
  const { data: summary } = useQuery({
    queryKey: ['summary'],
    queryFn: getDashboard,
  })
  const { data: low } = useQuery({
    queryKey: ['low'],
    queryFn: getLowStock,
  })
  const { data: credit } = useQuery({
    queryKey: ['credit'],
    queryFn: getCreditSummary,
  })

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Dashboard</h1>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <CardStat title="Products" value={summary?.total_products ?? '…'} />
        <CardStat title="Low Stock" value={summary?.low_stock_count ?? '…'} />
        <CardStat
          title="Stock Value"
          value={`N$ ${summary?.total_stock_value?.toFixed?.(2) ?? '…'}`}
        />
        <CardStat
          title="Outstanding Credit"
          value={`N$ ${summary?.outstanding_credit?.toFixed?.(2) ?? '…'}`}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <section className="space-y-2">
          <h2 className="font-semibold">Low Stock</h2>
          <DataTable
            rows={low || []}
            columns={[
              { key: 'name', header: 'Product' },
              { key: 'sku', header: 'SKU' },
              { key: 'stock_qty', header: 'Qty' },
              { key: 'reorder_level', header: 'Reorder @' },
            ]}
          />
        </section>

        <section className="space-y-2">
          <h2 className="font-semibold">Top Debtors (Employees)</h2>
          <DataTable
            rows={(credit || []).slice(0, 10)}
            columns={[
              { key: 'employee_name', header: 'Employee' },
              { key: 'balance', header: 'Balance (N$)' },
            ]}
          />
        </section>
      </div>
    </div>
  )
}
