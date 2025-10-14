import { useMemo, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { getProducts, getEmployees, createSaleCredit } from '../lib/api'
import type { Product, Employee } from '../lib/types'

type Line = { product_id: number | ''; qty: number; unit_price: number }

export default function Sales() {
  const qc = useQueryClient()
  const { data: products = [] } = useQuery<Product[]>({ queryKey: ['products'], queryFn: getProducts })
  const { data: employees = [] } = useQuery<Employee[]>({ queryKey: ['employees'], queryFn: getEmployees })

  const [payment, setPayment] = useState<'cash' | 'credit'>('credit')
  const [employeeId, setEmployeeId] = useState<number | ''>('')
  const [lines, setLines] = useState<Line[]>([{ product_id: '', qty: 1, unit_price: 0 }])

  const total = useMemo(
    () => lines.reduce((s, l) => s + (Number(l.qty) || 0) * (Number(l.unit_price) || 0), 0),
    [lines]
  )

  const mutateSale = useMutation({
    mutationFn: () =>
      createSaleCredit({
        employee_id: payment === 'credit' ? Number(employeeId) : null,
        payment_method: payment,
        items: lines
          .filter((l) => l.product_id !== '')
          .map((l) => ({ product_id: Number(l.product_id), qty: Number(l.qty), unit_price: Number(l.unit_price) })),
      }),
    onSuccess: () => {
      setLines([{ product_id: '', qty: 1, unit_price: 0 }])
      if (payment === 'credit') setEmployeeId('')
      qc.invalidateQueries({ queryKey: ['products'] })
      qc.invalidateQueries({ queryKey: ['summary'] })
      qc.invalidateQueries({ queryKey: ['credit'] })
      alert('Sale recorded ✔')
    },
  })

  const setProduct = (idx: number, pid: number | '') => {
    const p = products.find((pp) => pp.id === Number(pid))
    setLines((prev) => prev.map((l, i) => (i === idx ? { ...l, product_id: pid, unit_price: p ? p.price : 0 } : l)))
  }
  const onChangeLine = (idx: number, patch: Partial<Line>) =>
    setLines((prev) => prev.map((l, i) => (i === idx ? { ...l, ...patch } : l)))
  const addRow = () => setLines((prev) => [...prev, { product_id: '', qty: 1, unit_price: 0 }])
  const removeRow = (idx: number) => setLines((prev) => prev.filter((_, i) => i !== idx))

  const canSubmit =
    lines.some((l) => l.product_id !== '' && l.qty > 0) &&
    (payment === 'cash' || (payment === 'credit' && employeeId !== ''))

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">Sales</h1>

      <div className="bg-white dark:bg-zinc-800 rounded-2xl shadow p-4 space-y-3">
        <div className="flex flex-wrap gap-4 items-end">
          <label className="text-sm">
            Payment
            <select className="border bg-gray-50 dark:bg-zinc-700 rounded p-2 ml-2" value={payment} onChange={(e) => setPayment(e.target.value as any)}>
              <option value="cash">Cash</option>
              <option value="credit">Credit</option>
            </select>
          </label>

          {payment === 'credit' && (
            <label className="text-sm">
              Employee
              <select
                className="border rounded bg-gray-50 dark:bg-zinc-700 p-2 ml-2"
                value={employeeId}
                onChange={(e) => setEmployeeId(e.target.value ? Number(e.target.value) : '')}
              >
                <option value="">Select employee…</option>
                {employees.map((emp) => (
                  <option key={emp.id} value={emp.id}>
                    {emp.name}
                  </option>
                ))}
              </select>
            </label>
          )}

          <div className="ml-auto font-semibold">Total: N$ {total.toFixed(2)}</div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 dark:bg-zinc-700">
              <tr>
                <th className="text-left px-3 py-2">Product</th>
                <th className="text-left px-3 py-2">Qty</th>
                <th className="text-left px-3 py-2">Unit Price</th>
                <th className="text-left px-3 py-2">Subtotal</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {lines.map((l, idx) => {
                const subtotal = (Number(l.qty) || 0) * (Number(l.unit_price) || 0)
                return (
                  <tr key={idx} className="border-t border-gray-200 dark:border-zinc-700">
                    <td className="px-3 py-2">
                      <select
                        className="border bg-gray-50 dark:bg-zinc-700 rounded p-2"
                        value={l.product_id}
                        onChange={(e) => setProduct(idx, e.target.value ? Number(e.target.value) : '')}
                      >
                        <option value="">Select…</option>
                        {products.map((p) => (
                          <option key={p.id} value={p.id}>
                            {p.name} ({p.sku})
                          </option>
                        ))}
                      </select>
                    </td>
                    <td className="px-3 py-2">
                      <input
                        type="number"
                        min={0}
                        step="0.01"
                        className="w-24 border bg-gray-50 dark:bg-zinc-700 rounded p-2"
                        value={l.qty}
                        onChange={(e) => onChangeLine(idx, { qty: Number(e.target.value) })}
                      />
                    </td>
                    <td className="px-3 py-2">
                      <input
                        type="number"
                        min={0}
                        step="0.01"
                        className="w-28 border bg-gray-50 dark:bg-zinc-700 rounded p-2"
                        value={l.unit_price}
                        onChange={(e) => onChangeLine(idx, { unit_price: Number(e.target.value) })}
                      />
                    </td>
                    <td className="px-3 py-2">{subtotal.toFixed(2)}</td>
                    <td className="px-3 py-2">
                      <button className="text-red-600 dark:text-red-400" onClick={() => removeRow(idx)}>
                        Remove
                      </button>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>

        <div className="flex items-center gap-3">
          <button onClick={addRow} className="rounded-xl px-4 py-2 bg-gray-200 dark:bg-zinc-700">
            + Add Line
          </button>
          <button
            className="rounded-xl px-4 py-2 bg-black text-white disabled:opacity-50 ml-auto"
            disabled={!canSubmit || mutateSale.isPending}
            onClick={() => mutateSale.mutate()}
          >
            Save Sale
          </button>
        </div>
      </div>
    </div>
  )
}
