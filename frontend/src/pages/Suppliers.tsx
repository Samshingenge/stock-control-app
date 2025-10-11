import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { FormEvent, useState } from 'react'

import DataTable from '../components/DataTable'
import Loading from '../components/Loading'
import { createSupplier, getSuppliers } from '../lib/api'
import type { Supplier } from '../lib/types'

type SupplierRow = { id: number; name: string; phone: string }

export default function Suppliers() {
  const queryClient = useQueryClient()
  const { data, isLoading, isError } = useQuery<Supplier[]>({
    queryKey: ['suppliers'],
    queryFn: getSuppliers,
  })

  const [name, setName] = useState('')
  const [phone, setPhone] = useState('')

  const { mutate, isPending } = useMutation({
    mutationFn: createSupplier,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['suppliers'] })
      setName('')
      setPhone('')
    },
  })

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault()
    const trimmedName = name.trim()
    if (!trimmedName) {
      return
    }
    mutate({ name: trimmedName, phone: phone.trim() || undefined })
  }

  const rows: SupplierRow[] =
    data?.map((s) => ({
      id: s.id,
      name: s.name,
      phone: s.phone?.trim?.() || '—',
    })) ?? []

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <h1 className="text-2xl font-bold">Suppliers</h1>
        <p className="text-gray-600">
          View existing suppliers and add new partners as needed.
        </p>
      </div>

      <form
        onSubmit={handleSubmit}
        className="bg-white rounded-2xl shadow p-4 grid gap-3 max-w-lg"
      >
        <h2 className="font-semibold text-lg">Add Supplier</h2>
        <label className="text-sm grid gap-1">
          Name
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full border rounded-lg px-3 py-2"
            placeholder="ABC Wholesale"
          />
        </label>
        <label className="text-sm grid gap-1">
          Phone (optional)
          <input
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            className="w-full border rounded-lg px-3 py-2"
            placeholder="+264-61-123-456"
          />
        </label>
        <button
          type="submit"
          disabled={isPending}
          className="justify-self-start bg-black text-white rounded-xl px-4 py-2 disabled:opacity-50"
        >
          {isPending ? 'Saving...' : 'Save Supplier'}
        </button>
      </form>

      <section className="space-y-3">
        <h2 className="font-semibold text-lg">Supplier List</h2>
        {isLoading && <Loading />}
        {isError && (
          <div className="text-red-600">Unable to load suppliers right now.</div>
        )}
        {!isLoading && !isError && rows.length === 0 && (
          <div className="text-gray-600">
            No suppliers yet. Add your first supplier above.
          </div>
        )}
        {!isLoading && !isError && rows.length > 0 && (
          <DataTable
            rows={rows}
            columns={[
              { key: 'name', header: 'Supplier' },
              { key: 'phone', header: 'Phone' },
            ]}
          />
        )}
      </section>
    </div>
  )
}
