import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useState } from 'react'

import DataTable from '../components/DataTable'
import { addCreditPayment, getCreditSummary } from '../lib/api'

export default function Credit() {
  const qc = useQueryClient()
  const { data } = useQuery({ queryKey: ['credit'], queryFn: getCreditSummary })
  const [employeeId, setEmployeeId] = useState<number>(1)
  const [amount, setAmount] = useState<number>(10)

  const pay = useMutation({
    mutationFn: () => addCreditPayment(employeeId, amount),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['credit'] }),
  })

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">Credit</h1>
      <DataTable
        rows={data || []}
        columns={[
          { key: 'employee_id', header: 'Emp ID' },
          { key: 'employee_name', header: 'Name' },
          { key: 'balance', header: 'Balance (N$)' },
        ]}
      />

      <div className="bg-white rounded-2xl shadow p-4 grid gap-2 max-w-md">
        <div className="font-semibold">Record Payment</div>
        <label className="text-sm">
          Employee ID
          <input
            value={employeeId}
            onChange={(e) => setEmployeeId(Number(e.target.value))}
            className="w-full border rounded p-2"
          />
        </label>
        <label className="text-sm">
          Amount (N$)
          <input
            value={amount}
            onChange={(e) => setAmount(Number(e.target.value))}
            className="w-full border rounded p-2"
          />
        </label>
        <button
          onClick={() => pay.mutate()}
          className="bg-black text-white rounded-xl px-4 py-2"
        >
          Add Payment
        </button>
      </div>
    </div>
  )
}
