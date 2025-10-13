import { FormEvent, useMemo, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  getEmployees,
  createEmployee,
  getCreditSummary,
  addCreditPayment,
  updateEmployee,
  deleteEmployee,
} from '../lib/api'
import type { Employee } from '../lib/types'
import Loading from '../components/Loading'

type Row = Employee & { balance: number }

export default function Employees() {
  const qc = useQueryClient()

  // Queries
  const {
    data: employees,
    isLoading: empLoading,
    isError: empError,
  } = useQuery<Employee[]>({ queryKey: ['employees'], queryFn: getEmployees })

  const { data: credit } = useQuery<
    { employee_id: number; employee_name: string; balance: number }[]
  >({
    queryKey: ['credit'],
    queryFn: getCreditSummary,
  })

  // Balance lookup
  const balanceById = useMemo(() => {
    const m = new Map<number, number>()
    ;(credit || []).forEach((c) => m.set(c.employee_id, c.balance))
    return m
  }, [credit])

  const rows: Row[] = useMemo(
    () =>
      (employees || []).map((e) => ({
        ...e,
        balance: balanceById.get(e.id) ?? 0,
      })),
    [employees, balanceById]
  )

  // New employee form
  const [name, setName] = useState('')
  const [phone, setPhone] = useState('')

  const addEmp = useMutation({
    mutationFn: () =>
      createEmployee({
        name: name.trim(),
        phone: phone.trim() ? phone.trim() : undefined,
      }),
    onSuccess: () => {
      setName('')
      setPhone('')
      qc.invalidateQueries({ queryKey: ['employees'] })
    },
  })

  const submitNew = (e: FormEvent) => {
    e.preventDefault()
    if (!name.trim()) return
    addEmp.mutate()
  }

  // Inline payments
  const [pay, setPay] = useState<Record<number, number>>({})

  const recordPay = useMutation({
    mutationFn: ({ id, amount }: { id: number; amount: number }) =>
      addCreditPayment(id, amount),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['credit'] })
    },
  })

  const setAmount = (id: number, val: number) =>
    setPay((prev) => ({ ...prev, [id]: val }))

  // Inline edit state
  const [edit, setEdit] = useState<Record<number, { name: string; phone: string }>>(
    {}
  )

  const startEdit = (e: Employee) =>
    setEdit((prev) => ({ ...prev, [e.id]: { name: e.name, phone: e.phone || '' } }))

  const cancelEdit = (id: number) =>
    setEdit((prev) => {
      const next = { ...prev }
      delete next[id]
      return next
    })

  const updateEmp = useMutation({
    mutationFn: ({ id, data }: { id: number; data: { name?: string; phone?: string | null } }) =>
      updateEmployee(id, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['employees'] })
      qc.invalidateQueries({ queryKey: ['credit'] })
      setEdit({})
    },
  })

  const delEmp = useMutation({
    mutationFn: (id: number) => deleteEmployee(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['employees'] })
      qc.invalidateQueries({ queryKey: ['credit'] })
    },
  })

  const saveEdit = (e: Employee) => {
    const curr = edit[e.id]
    if (!curr) return
    const newName = curr.name.trim()
    const newPhoneRaw = curr.phone.trim()
    const payload: { name?: string; phone?: string | null } = {}

    if (newName && newName !== e.name) payload.name = newName
    if (newPhoneRaw !== (e.phone || '')) payload.phone = newPhoneRaw || null

    // No changes? Just close editor.
    if (Object.keys(payload).length === 0) {
      cancelEdit(e.id)
      return
    }

    updateEmp.mutate({ id: e.id, data: payload })
  }

  return (
    <div className="space-y-6">
      <div className="space-y-1">
        <h1 className="text-2xl font-bold">Employees</h1>
        <p className="text-gray-600">
          List &amp; manage employees. Record credit payments inline.
        </p>
      </div>

      {/* Add Employee */}
      <form onSubmit={submitNew} className="bg-white rounded-2xl shadow p-4 grid gap-3 max-w-lg">
        <h2 className="font-semibold text-lg">Add Employee</h2>

        <label className="text-sm grid gap-1">
          Name
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full border rounded-lg px-3 py-2"
            placeholder="Jane Doe"
          />
        </label>

        <label className="text-sm grid gap-1">
          Phone (optional)
          <input
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            className="w-full border rounded-lg px-3 py-2"
            placeholder="+264-81-000-0000"
          />
        </label>

        <button
          type="submit"
          disabled={!name.trim() || addEmp.isPending}
          className="justify-self-start bg-black text-white rounded-xl px-4 py-2 disabled:opacity-50"
        >
          {addEmp.isPending ? 'Saving…' : 'Save Employee'}
        </button>
      </form>

      {/* List */}
      <section className="space-y-3">
        <h2 className="font-semibold text-lg">Employee List</h2>

        {empLoading && <Loading />}
        {empError && <div className="text-red-600">Unable to load employees right now.</div>}

        {!empLoading && !empError && rows.length === 0 && (
          <div className="text-gray-600">No employees yet. Add your first employee above.</div>
        )}

        {!empLoading && !empError && rows.length > 0 && (
          <div className="overflow-x-auto bg-white rounded-2xl shadow">
            <table className="w-full text-sm">
              <thead className="bg-gray-50">
                <tr>
                  <th className="text-left px-4 py-2">ID</th>
                  <th className="text-left px-4 py-2">Name</th>
                  <th className="text-left px-4 py-2">Phone</th>
                  <th className="text-left px-4 py-2">Credit Balance (N$)</th>
                  <th className="text-left px-4 py-2">Record Payment</th>
                  <th className="text-left px-4 py-2">Actions</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((e) => (
                  <tr key={e.id} className="border-t">
                    <td className="px-4 py-2">{e.id}</td>

                    {/* Name (editable) */}
                    <td className="px-4 py-2">
                      {edit[e.id] ? (
                        <input
                          value={edit[e.id].name}
                          onChange={(ev) =>
                            setEdit((prev) => ({ ...prev, [e.id]: { ...prev[e.id], name: ev.target.value } }))
                          }
                          className="border rounded px-2 py-1 w-48"
                        />
                      ) : (
                        e.name
                      )}
                    </td>

                    {/* Phone (editable) */}
                    <td className="px-4 py-2">
                      {edit[e.id] ? (
                        <input
                          value={edit[e.id].phone}
                          onChange={(ev) =>
                            setEdit((prev) => ({ ...prev, [e.id]: { ...prev[e.id], phone: ev.target.value } }))
                          }
                          className="border rounded px-2 py-1 w-48"
                          placeholder="+264-81-000-0000"
                        />
                      ) : (
                        e.phone || '—'
                      )}
                    </td>

                    {/* Balance */}
                    <td className={`px-4 py-2 ${e.balance > 0 ? 'text-red-600' : 'text-green-700'}`}>
                      {e.balance.toFixed(2)}
                    </td>

                    {/* Record payment */}
                    <td className="px-4 py-2">
                      <div className="flex items-center gap-2">
                        <input
                          type="number"
                          min={0.01}
                          step="0.01"
                          className="border rounded p-2 w-28"
                          value={pay[e.id] ?? 0}
                          onChange={(ev) => setAmount(e.id, Number(ev.target.value))}
                        />
                        <button
                          className="bg-black text-white rounded-lg px-3 py-2 disabled:opacity-50"
                          disabled={!(pay[e.id] > 0) || recordPay.isPending}
                          onClick={() => recordPay.mutate({ id: e.id, amount: Number(pay[e.id]) })}
                        >
                          Pay
                        </button>
                      </div>
                    </td>

                    {/* Actions */}
                    <td className="px-4 py-2">
                      {edit[e.id] ? (
                        <div className="flex items-center gap-2">
                          <button
                            className="bg-black text-white rounded-lg px-3 py-1 disabled:opacity-50"
                            disabled={updateEmp.isPending}
                            onClick={() => saveEdit(e)}
                          >
                            {updateEmp.isPending ? 'Saving…' : 'Save'}
                          </button>
                          <button
                            className="border rounded-lg px-3 py-1"
                            onClick={() => cancelEdit(e.id)}
                          >
                            Cancel
                          </button>
                        </div>
                      ) : (
                        <div className="flex items-center gap-2">
                          <button
                            className="border rounded-lg px-3 py-1"
                            onClick={() => startEdit(e)}
                          >
                            Edit
                          </button>
                          <button
                            className="text-white bg-red-600 rounded-lg px-3 py-1 disabled:opacity-50"
                            disabled={delEmp.isPending}
                            onClick={() => {
                              if (confirm(`Delete ${e.name}? This cannot be undone.`)) {
                                delEmp.mutate(e.id)
                              }
                            }}
                          >
                            {delEmp.isPending ? 'Deleting…' : 'Delete'}
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  )
}
