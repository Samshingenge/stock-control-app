import { useMemo } from 'react'
import { useQuery } from '@tanstack/react-query'

import CardStat from '../components/CardStat'
import DataTable from '../components/DataTable'
import { getCreditSummary, getDashboard, getLowStock } from '../lib/api'
import type { CreditSummary, Product } from '../lib/types'

const fmtCurrency = (n: number | undefined) =>
  typeof n === 'number' ? `N$ ${n.toFixed(2)}` : 'N$ …'

export default function Dashboard() {
  // Keep summary in case you still want it for Products/Stock Value
  const { data: summary } = useQuery({
    queryKey: ['summary'],
    queryFn: getDashboard,
  })

  // Lists used for cards + tables
  const { data: low } = useQuery({
    queryKey: ['low'],
    queryFn: getLowStock,
  })
  const { data: credit } = useQuery({
    queryKey: ['credit'],
    queryFn: getCreditSummary,
  })

  // Low stock table & count
  const lowSorted = useMemo<Product[]>(
    () =>
      [...(low || [])].sort(
        (a, b) =>
          (b.reorder_level - b.stock_qty) - (a.reorder_level - a.stock_qty) ||
          a.name.localeCompare(b.name),
      ),
    [low],
  )
  const lowCount = low?.length ?? 0

  // Debtors (ALL with balance > 0), totals, and top 10 for table
  const allDebtors = useMemo<CreditSummary[]>(
    () =>
      (credit || [])
        .filter((c) => (c?.balance ?? 0) > 0)
        .sort((a, b) => b.balance - a.balance),
    [credit],
  )
  const topDebtors = useMemo<CreditSummary[]>(
    () => allDebtors.slice(0, 10),
    [allDebtors],
  )
  const totalOutstandingAll = useMemo(
    () => allDebtors.reduce((acc, d) => acc + (d.balance || 0), 0),
    [allDebtors],
  )

  // Cards:
  // - Products, Stock Value can still use summary if present.
  // - Low Stock & Outstanding Credit now come directly from lists to avoid "…".
  const cardProducts = summary?.total_products
  const cardStockValue =
    typeof summary?.total_stock_value === 'number'
      ? summary!.total_stock_value
      : undefined

  // These two **ignore summary** and use lists:
  const cardLowStock = low ? String(lowCount) : '…'
  const cardOutstanding = credit ? fmtCurrency(totalOutstandingAll) : fmtCurrency(undefined)

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Dashboard</h1>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <CardStat title="Products" value={cardProducts ?? '…'} />
        <CardStat title="Low Stock" value={cardLowStock} />
        <CardStat title="Stock Value" value={fmtCurrency(cardStockValue)} />
        <CardStat title="Outstanding Credit" value={cardOutstanding} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Low Stock */}
        <section className="space-y-2">
          <h2 className="font-semibold">Low Stock</h2>
          <DataTable
            rows={lowSorted}
            columns={[
              { key: 'name', header: 'Product' },
              { key: 'sku', header: 'SKU' },
              {
                header: 'Qty',
                headerClassName: 'text-right',
                className: 'text-right',
                render: (p: Product) => {
                  const cls =
                    p.stock_qty <= 0
                      ? 'text-red-600 font-semibold'
                      : 'text-orange-600 font-medium'
                  return <span className={cls}>{p.stock_qty}</span>
                },
              },
              {
                key: 'reorder_level',
                header: 'Reorder @',
                headerClassName: 'text-right',
                className: 'text-right',
              },
              {
                header: 'Status',
                render: (p: Product) => (
                  <span
                    className={
                      p.stock_qty <= 0
                        ? 'inline-block text-xs px-2 py-0.5 rounded-full bg-red-100 text-red-700'
                        : 'inline-block text-xs px-2 py-0.5 rounded-full bg-orange-100 text-orange-700'
                    }
                  >
                    {p.stock_qty <= 0 ? 'Out of stock' : 'Low'}
                  </span>
                ),
              },
            ]}
          />
          <div className="text-xs text-gray-500 mt-1">
            Total low items: <span className="font-medium">{lowCount}</span>
          </div>
          {lowSorted.length === 0 && (
            <div className="text-sm text-gray-500 italic mt-1">
              All items healthy 🎉
            </div>
          )}
        </section>

        {/* Outstanding Credit (Top Debtors) */}
        <section className="space-y-2">
          <h2 className="font-semibold">Top Debtors (Employees)</h2>
          <DataTable
            rows={topDebtors}
            columns={[
              { key: 'employee_name', header: 'Employee' },
              {
                header: 'Balance (N$)',
                headerClassName: 'text-right',
                className: 'text-right',
                render: (r: CreditSummary) => (
                  <span className="text-red-600 font-medium">
                    {`N$ ${r.balance.toFixed(2)}`}
                  </span>
                ),
              },
            ]}
          />
          <div className="text-xs text-gray-500 mt-1">
            Total outstanding (all {allDebtors.length} debtors):{' '}
            <span className="font-medium">{`N$ ${totalOutstandingAll.toFixed(2)}`}</span>
          </div>
          {allDebtors.length === 0 && (
            <div className="text-sm text-gray-500 italic mt-1">
              No active debts — all cleared 🎉
            </div>
          )}
        </section>
      </div>
    </div>
  )
}
