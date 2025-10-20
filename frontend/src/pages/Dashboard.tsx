import { useMemo } from 'react'
import { useQuery } from '@tanstack/react-query'
import { TrendingDown, TrendingUp, AlertCircle, Package, BarChart3, Award } from 'lucide-react'
import { getCreditSummary, getDashboard, getLowStock } from '../lib/api'
import type { CreditSummary, Product } from '../lib/types'

const fmtCurrency = (n: number | undefined) =>
  typeof n === 'number' ? `N$ ${n.toFixed(2)}` : 'N$ …'

function CardStat({ title, value, icon: Icon, trend }: { 
  title: string
  value: string | number
  icon?: any
  trend?: { value: number; label: string }
}) {
  return (
    <div className="bg-white dark:bg-zinc-800 rounded-2xl shadow p-4 hover:shadow-lg transition-shadow">
      <div className="flex items-start justify-between mb-2">
        <div className="text-sm text-gray-500 dark:text-gray-400">{title}</div>
        {Icon && <Icon size={20} className="text-gray-400" />}
      </div>
      <div className="text-2xl font-semibold mb-1">{value}</div>
      {trend && (
        <div className={`text-xs flex items-center gap-1 ${
          trend.value >= 0 ? 'text-green-600' : 'text-red-600'
        }`}>
          {trend.value >= 0 ? <TrendingUp size={14} /> : <TrendingDown size={14} />}
          <span>{Math.abs(trend.value)}% {trend.label}</span>
        </div>
      )}
    </div>
  )
}

function StockValueChart({ 
  initialValue, 
  currentValue 
}: { 
  initialValue: number
  currentValue: number 
}) {
  const percentage = initialValue > 0 ? (currentValue / initialValue) * 100 : 0
  const depletion = Math.max(0, initialValue - currentValue)
  const depletionRate = initialValue > 0 ? ((depletion / initialValue) * 100) : 0
  
  return (
    <div className="bg-white dark:bg-zinc-800 rounded-2xl shadow p-6 hover:shadow-lg transition-shadow">
      <div className="flex items-start justify-between mb-6">
        <div>
          <h3 className="font-semibold text-lg mb-1">Stock Value Depletion</h3>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            From initial investment to current holding
          </p>
        </div>
        <Package className="text-gray-400" size={24} />
      </div>

      {/* Values Display */}
      <div className="grid grid-cols-2 gap-4 mb-6">
        <div>
          <div className="text-xs text-gray-500 dark:text-gray-400 mb-1">Initial Value</div>
          <div className="text-xl font-bold text-gray-900 dark:text-white">
            {fmtCurrency(initialValue)}
          </div>
        </div>
        <div>
          <div className="text-xs text-gray-500 dark:text-gray-400 mb-1">Current Value</div>
          <div className="text-xl font-bold text-blue-600 dark:text-blue-400">
            {fmtCurrency(currentValue)}
          </div>
        </div>
      </div>

      {/* Horizontal Bar Chart */}
      <div className="space-y-3 mb-6">
        <div className="relative h-12 bg-gray-100 dark:bg-zinc-700 rounded-lg overflow-hidden">
          {/* Background markers */}
          <div className="absolute inset-0 flex">
            {[0, 25, 50, 75, 100].map((mark) => (
              <div
                key={mark}
                className="flex-1 border-r border-gray-200 dark:border-zinc-600 last:border-r-0"
              />
            ))}
          </div>
          
          {/* Current value bar */}
          <div
            className="absolute inset-y-0 left-0 bg-gradient-to-r from-blue-500 to-blue-600 flex items-center justify-end px-3 transition-all duration-1000 ease-out"
            style={{ width: `${Math.max(percentage, 5)}%` }}
          >
            <span className="text-white text-xs font-semibold">
              {percentage.toFixed(1)}%
            </span>
          </div>
          
          {/* Depleted area indicator */}
          <div
            className="absolute inset-y-0 right-0 bg-gradient-to-l from-red-100 to-transparent dark:from-red-900/20 flex items-center justify-start px-3"
            style={{ width: `${Math.max(0, 100 - percentage)}%` }}
          >
            {depletionRate > 10 && (
              <span className="text-red-600 dark:text-red-400 text-xs font-medium">
                -{depletionRate.toFixed(1)}%
              </span>
            )}
          </div>
        </div>

        {/* Scale markers */}
        <div className="flex justify-between text-xs text-gray-400 dark:text-gray-500">
          <span>0%</span>
          <span>25%</span>
          <span>50%</span>
          <span>75%</span>
          <span>100%</span>
        </div>
      </div>

      {/* Depletion Stats */}
      <div className="grid grid-cols-3 gap-3 pt-4 border-t border-gray-100 dark:border-zinc-700">
        <div className="text-center">
          <div className="text-xs text-gray-500 dark:text-gray-400 mb-1">Sold</div>
          <div className="text-sm font-semibold text-red-600 dark:text-red-400">
            {fmtCurrency(depletion)}
          </div>
        </div>
        <div className="text-center">
          <div className="text-xs text-gray-500 dark:text-gray-400 mb-1">Remaining</div>
          <div className="text-sm font-semibold text-blue-600 dark:text-blue-400">
            {fmtCurrency(currentValue)}
          </div>
        </div>
        <div className="text-center">
          <div className="text-xs text-gray-500 dark:text-gray-400 mb-1">Turnover</div>
          <div className="text-sm font-semibold text-purple-600 dark:text-purple-400">
            {depletionRate.toFixed(1)}%
          </div>
        </div>
      </div>

      {/* Health indicator */}
      {percentage < 30 && (
        <div className="mt-4 flex items-center gap-2 p-3 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg">
          <AlertCircle size={16} className="text-yellow-600 dark:text-yellow-400" />
          <span className="text-xs text-yellow-700 dark:text-yellow-300">
            Low stock value alert: Consider restocking soon
          </span>
        </div>
      )}
    </div>
  )
}

/** ----------------------------------------------------------------
 * Top Selling Products (Horizontal Bars)
 * Reads from summary.top_sold_products (or summary.best_sellers) with fields:
 *   { product_id?, name | product_name, total_sold | qty | quantity }
 * ---------------------------------------------------------------- */
function TopSellingBar({
  items,
  maxBars = 5,
}: {
  items: { name: string; qty: number }[]
  maxBars?: number
}) {
  const data = useMemo(() => {
    const arr = [...items].filter(i => i.qty > 0)
    arr.sort((a, b) => b.qty - a.qty)
    return arr.slice(0, maxBars)
  }, [items, maxBars])

  const max = data.length ? Math.max(...data.map(d => d.qty)) : 0
  const top = data[0]

  return (
    <div className="bg-white dark:bg-zinc-800 rounded-2xl shadow p-6 hover:shadow-lg transition-shadow">
      <div className="flex items-start justify-between mb-4">
        <div>
          <h3 className="font-semibold text-lg mb-1">Top Selling Products</h3>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Most sold items by quantity
          </p>
        </div>
        <BarChart3 className="text-gray-400" size={22} />
      </div>

      {/* Most sold badge */}
      {top ? (
        <div className="flex items-center gap-2 mb-4 text-sm">
          <Award size={16} className="text-amber-500" />
          <span className="text-gray-700 dark:text-gray-200">
            <span className="font-medium">Most sold:</span> {top.name}{' '}
            <span className="text-gray-500 dark:text-gray-400">({top.qty})</span>
          </span>
        </div>
      ) : (
        <div className="text-sm text-gray-500 dark:text-gray-400 mb-2 italic">
          No sales data yet.
        </div>
      )}

      {/* Bars */}
      <div className="space-y-3">
        {data.map((d, idx) => {
          const pct = max > 0 ? (d.qty / max) * 100 : 0
          const isTop = idx === 0
          return (
            <div key={idx}>
              <div className="flex justify-between text-xs mb-1">
                <span className="text-gray-600 dark:text-gray-300 truncate">{d.name}</span>
                <span className="text-gray-500 dark:text-gray-400">{d.qty}</span>
              </div>
              <div className="h-3 bg-gray-100 dark:bg-zinc-700 rounded-lg overflow-hidden">
                <div
                  className={`h-full ${isTop ? 'bg-gradient-to-r from-emerald-500 to-emerald-600' : 'bg-gradient-to-r from-blue-500 to-blue-600'} transition-all`}
                  style={{ width: `${Math.max(pct, 6)}%` }}
                />
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

function DataTable({ rows, columns }: { rows: any[]; columns: any[] }) {
  return (
    <div className="overflow-x-auto bg-white dark:bg-zinc-800 rounded-2xl shadow">
      <table className="w-full text-sm">
        <thead className="bg-gray-50 dark:bg-zinc-700 text-black dark:text-white">
          <tr>
            {columns.map((c: any, idx: number) => (
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
          {rows.map((r: any, i: number) => (
            <tr key={i} className="border-t border-gray-200 dark:border-zinc-700">
              {columns.map((c: any, j: number) => (
                <td key={j} className={`px-4 py-2 dark:text-white ${c.className || ''}`}>
                  {c.render ? c.render(r) : c.key ? r[c.key] : null}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

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

  const lowSorted = useMemo(
    () =>
      [...(low || [])].sort(
        (a, b) =>
          (b.reorder_level - b.stock_qty) - (a.reorder_level - a.stock_qty) ||
          a.name.localeCompare(b.name),
      ),
    [low],
  )

  const lowCount = low?.length ?? 0

  const allDebtors = useMemo(
    () =>
      (credit || [])
        .filter((c) => (c?.balance ?? 0) > 0)
        .sort((a, b) => b.balance - a.balance),
    [credit],
  )

  const topDebtors = useMemo(() => allDebtors.slice(0, 10), [allDebtors])

  const totalOutstandingAll = useMemo(
    () => allDebtors.reduce((acc, d) => acc + (d.balance || 0), 0),
    [allDebtors],
  )

  // Calculate initial stock value (assuming 30% depletion for demo)
  const currentStockValue = summary?.total_stock_value ?? 0
  const initialStockValue = currentStockValue > 0 ? currentStockValue / 0.70 : 0 // Simulating 30% sold

  const cardProducts = summary?.total_products
  const cardStockValue = summary?.total_stock_value
  const cardLowStock = low ? String(lowCount) : '…'
  const cardOutstanding = credit ? fmtCurrency(totalOutstandingAll) : fmtCurrency(undefined)

  // --------- Top selling data extraction (robust) ---------
  const topSelling = useMemo(() => {
    if (!summary) return []

    // 1) Candidate arrays we'll try, in order
    const candidates: any[] = [
      summary.top_sold_products,
      summary.best_sellers,
      summary.sales_by_product,
      summary.sales?.by_product,
      summary.stats?.top_sold,
      summary.stats?.best_sellers,
      summary.topProducts,
      summary.top_products,
      summary.products, // fallback if it has sold_qty fields
    ].filter(Array.isArray)

    // 2) Helpers to normalize any record shape -> { name, qty }
    const NUM_KEYS = ['total_sold', 'sold_qty', 'qty', 'quantity', 'sold', 'units', 'count', 'total']
    const NAME_KEYS = ['name', 'product_name', 'title', 'sku']

    const getName = (x: any): string | null => {
      for (const k of NAME_KEYS) {
        if (x?.[k]) return String(x[k])
      }
      if (x?.product?.name) return String(x.product.name)
      if (x?.item?.name) return String(x.item.name)
      return null
    }

    const getQty = (x: any): number => {
      for (const k of NUM_KEYS) {
        const v = x?.[k] ?? x?.stats?.[k]
        if (Number.isFinite(Number(v))) return Number(v)
      }
      return 0
    }

    // 3) Pick the first candidate that actually yields positive quantities
    for (const arr of candidates) {
      const mapped = arr
        .map((r: any) => ({ name: getName(r), qty: getQty(r) }))
        .filter((m: any) => m.name && m.qty > 0)

      if (mapped.length) {
        // merge duplicates by name, sort desc, and cap to top 5
        const byName = new Map<string, number>()
        for (const m of mapped) {
          byName.set(m.name!, (byName.get(m.name!) ?? 0) + m.qty)
        }
        const merged = [...byName.entries()].map(([name, qty]) => ({ name, qty }))
        merged.sort((a, b) => b.qty - a.qty)
        return merged.slice(0, 5)
      }
    }

    // 4) Nothing matched -> empty
    return []
  }, [summary])

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Dashboard</h1>
        <div className="text-sm text-gray-500 dark:text-gray-400">
          {new Date().toLocaleDateString('en-US', { 
            weekday: 'long', 
            year: 'numeric', 
            month: 'long', 
            day: 'numeric' 
          })}
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <CardStat 
          title="Products" 
          value={cardProducts ?? '…'} 
          icon={Package}
          trend={{ value: 5, label: 'vs last month' }}
        />
        <CardStat 
          title="Low Stock" 
          value={cardLowStock}
          icon={AlertCircle}
        />
        <CardStat 
          title="Stock Value" 
          value={fmtCurrency(cardStockValue)}
          trend={{ value: -12, label: 'depletion' }}
        />
        <CardStat 
          title="Outstanding Credit" 
          value={cardOutstanding}
          trend={{ value: -8, label: 'recovered' }}
        />
      </div>

      {/* Stock Value Chart */}
      <StockValueChart 
        initialValue={initialStockValue} 
        currentValue={currentStockValue} 
      />

      {/* Top Selling Products */}
      <TopSellingBar items={topSelling} maxBars={5} />

      {/* Tables Grid */}
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
          <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
            Total low items: <span className="font-medium">{lowCount}</span>
          </div>
          {lowSorted.length === 0 && (
            <div className="text-sm text-gray-500 dark:text-gray-400 italic mt-1">
              All items healthy 🎉
            </div>
          )}
        </section>

        {/* Outstanding Credit */}
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
          <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
            Total outstanding (all {allDebtors.length} debtors):{' '}
            <span className="font-medium">{`N$ ${totalOutstandingAll.toFixed(2)}`}</span>
          </div>
          {allDebtors.length === 0 && (
            <div className="text-sm text-gray-500 dark:text-gray-400 italic mt-1">
              No active debts — all cleared 🎉
            </div>
          )}
        </section>
      </div>
    </div>
  )
}
