// frontend/src/pages/Credit.tsx
import { useMemo, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

import DataTable from '../components/DataTable'
import { addCreditPayment, getCreditSummary } from '../lib/api'
import type { CreditSummary } from '../lib/types'

export default function Credit() {
  const qc = useQueryClient()

  const { data } = useQuery({
    queryKey: ['credit'],
    queryFn: getCreditSummary,
  })

  // Only show employees who still owe (balance > 0), sorted by highest debt
  const debtors = useMemo<CreditSummary[]>(
    () =>
      (data || [])
        .filter((c) => (c?.balance ?? 0) > 0)
        .sort((a, b) => b.balance - a.balance),
    [data],
  )

  // Form state
  const [employeeId, setEmployeeId] = useState<number>(debtors[0]?.employee_id ?? 1)
  const [amount, setAmount] = useState<number>(10)

  const outstandingForSelected =
    debtors.find((d) => d.employee_id === employeeId)?.balance ?? 0

  const disablePay =
    !employeeId || !amount || amount <= 0 || outstandingForSelected <= 0

  const pay = useMutation({
    mutationFn: () => addCreditPayment(employeeId, amount),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['credit'] })
    },
    onError: (e: any) => {
      const msg = e?.response?.data?.detail || 'Payment failed'
      alert(msg)
    },
  })

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">Credit</h1>

      <DataTable<CreditSummary>
        rows={debtors}
        columns={[
          { key: 'employee_id', header: 'Emp ID' },
          { key: 'employee_name', header: 'Name' },
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
      {debtors.length === 0 && (
        <div className="text-sm text-gray-500 dark:text-gray-400 italic">
          No active debts — all cleared 🎉
        </div>
      )}

      <div className="bg-white dark:bg-zinc-800 rounded-2xl shadow p-4 grid gap-2 max-w-md">
        <div className="font-semibold">Record Payment</div>

        <label className="text-sm">
          Employee ID
          <input
            type="number"
            min={1}
            step={1}
            value={employeeId}
            onChange={(e) => setEmployeeId(Number(e.target.value))}
            className="w-full border bg-gray-50 dark:bg-zinc-700 rounded p-2"
            placeholder="e.g. 4"
          />
        </label>

        <label className="text-sm">
          Amount (N$)
          <input
            type="number"
            min={0.01}
            step={0.01}
            max={outstandingForSelected > 0 ? outstandingForSelected : undefined}
            value={Number.isFinite(amount) ? amount : ''}
            onChange={(e) => setAmount(Number(e.target.value))}
            className="w-full border bg-gray-50 dark:bg-zinc-700 rounded p-2"
            placeholder={
              outstandingForSelected > 0
                ? `<= ${outstandingForSelected.toFixed(2)}`
                : 'No outstanding for this employee'
            }
          />
        </label>

        <button
          onClick={() => pay.mutate()}
          disabled={disablePay || pay.isPending}
          className="bg-black text-white rounded-xl px-4 py-2 disabled:opacity-50"
        >
          {pay.isPending ? 'Processing…' : 'Add Payment'}
        </button>

        {outstandingForSelected > 0 && (
          <div className="text-xs text-gray-500 dark:text-gray-400">
            Outstanding for employee {employeeId}: N${' '}
            {outstandingForSelected.toFixed(2)}
          </div>
        )}
      </div>
    </div>
  )
}
