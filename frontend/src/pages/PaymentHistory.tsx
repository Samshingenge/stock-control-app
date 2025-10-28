// frontend/src/pages/PaymentHistory.tsx
import { useMemo, useState } from 'react'
import { useQuery } from '@tanstack/react-query'

import DataTable from '../components/DataTable'
import { getPaymentHistory } from '../lib/api'
import type { PaymentHistory } from '../lib/types'

// Auto-refresh every 30 seconds
const REFRESH_INTERVAL = 30000

export default function PaymentHistory() {
  const { data } = useQuery({
    queryKey: ['payment-history'],
    queryFn: getPaymentHistory,
    refetchInterval: REFRESH_INTERVAL,
  })

  // Only show employees who have made payments, sorted by highest total paid
  const payers = useMemo<PaymentHistory[]>(
    () =>
      (data || [])
        .filter((p) => (p?.total_paid ?? 0) > 0)
        .sort((a, b) => b.total_paid - a.total_paid),
    [data],
  )

  // Debug logging to check if data is received
  console.log('Payment history data received:', data)
  console.log('Payers with products:', payers.map(p => ({ name: p.employee_name, products: p.products })))

  // Calculate total payments
  const totalPayments = useMemo(
    () => payers.reduce((sum, p) => sum + p.total_paid, 0),
    [payers]
  )

  return (
    <div className="space-y-4 bg-gray-50 dark:bg-zinc-800 p-6 rounded-lg">
      <h1 className="text-2xl font-bold">Payment History</h1>

      <DataTable<PaymentHistory>
        rows={payers}
        columns={[
          { key: 'employee_id', header: 'Emp ID' },
          { key: 'employee_name', header: 'Name' },
          {
            header: 'Products',
            render: (r: PaymentHistory) => (
              <div className="space-y-2">
                {r.products && r.products.length > 0 ? (
                  r.products.map((product, idx) => (
                    <div key={`${product.id}-${idx}`} className="text-sm border-b border-gray-100 pb-1 last:border-b-0">
                      <div className="font-medium">{product.name}</div>
                      <div className="text-gray-500 text-xs">
                        {product.qty} × N${product.unit_price.toFixed(2)} = N${product.subtotal.toFixed(2)}
                      </div>
                      <div className="text-gray-400 text-xs">
                        Purchased: {new Date(product.purchase_date).toLocaleDateString()}
                      </div>
                    </div>
                  ))
                ) : (
                  <span className="text-gray-400 text-sm">No products found</span>
                )}
              </div>
            ),
          },
          {
            header: 'Total Paid (N$)',
            headerClassName: 'text-right',
            className: 'text-right',
            render: (r: PaymentHistory) => {
              const totalPaid = r.total_paid;
              let colorClass = 'text-green-600 font-medium';
              if (totalPaid > 1000) {
                colorClass = 'text-green-700 font-bold bg-green-100 dark:bg-green-900 px-2 py-1 rounded';
              } else if (totalPaid > 500) {
                colorClass = 'text-green-600 font-semibold';
              }
              return (
                <span className={colorClass}>
                  {`N$ ${totalPaid.toFixed(2)}`}
                </span>
              );
            },
          },
        ]}
      />
      {payers.length === 0 && (
        <div className="text-sm text-gray-500 dark:text-gray-400 italic">
          No payment history found
        </div>
      )}

      {payers.length > 0 && (
        <div className="bg-white dark:bg-zinc-700 rounded-lg p-4 border border-gray-200 dark:border-zinc-600">
          <div className="text-lg font-semibold text-gray-800 dark:text-gray-200">
            Total Payments: <span className="text-green-600 font-bold">N$ {totalPayments.toFixed(2)}</span>
          </div>
          <div className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            Combined total from all employee payments
          </div>
        </div>
      )}
    </div>
  )
}