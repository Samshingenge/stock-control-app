import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { FormEvent, useMemo, useState } from 'react'

import DataTable from '../components/DataTable'
import Loading from '../components/Loading'
import {
  createPurchase,
  getProducts,
  getPurchases,
  getSuppliers,
} from '../lib/api'
import type { Product, Purchase, Supplier } from '../lib/types'

type PurchaseRow = {
  id: number
  supplier_name: string
  item_count: number
  total_display: string
  created_at_display: string
}

export default function Purchases() {
  const queryClient = useQueryClient()

  const {
    data: purchases,
    isLoading: purchasesLoading,
    isError: purchasesError,
  } = useQuery<Purchase[]>({
    queryKey: ['purchases'],
    queryFn: getPurchases,
  })

  const { data: suppliers } = useQuery<Supplier[]>({
    queryKey: ['suppliers'],
    queryFn: getSuppliers,
  })

  const { data: products } = useQuery<Product[]>({
    queryKey: ['products'],
    queryFn: getProducts,
  })

  const [supplierId, setSupplierId] = useState<number | ''>('')
  const [productId, setProductId] = useState<number | ''>('')
  const [qty, setQty] = useState(1)
  const [unitCost, setUnitCost] = useState(0)

  const { mutate, isPending, isSuccess, data: created } = useMutation({
    mutationFn: createPurchase,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['purchases'] })
      queryClient.invalidateQueries({ queryKey: ['products'] })
      setProductId('')
      setQty(1)
      setUnitCost(0)
    },
  })

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault()
    if (
      supplierId === '' ||
      productId === '' ||
      qty <= 0 ||
      unitCost <= 0 ||
      !Number.isFinite(qty) ||
      !Number.isFinite(unitCost)
    ) {
      return
    }
    mutate({
      supplier_id: Number(supplierId),
      items: [
        {
          product_id: Number(productId),
          qty: Number(qty),
          unit_cost: Number(unitCost),
        },
      ],
    })
  }

  const rows: PurchaseRow[] = useMemo(
    () =>
      purchases?.map((p) => ({
        id: p.id,
        supplier_name: p.supplier_name,
        item_count: p.item_count,
        total_display: `N$ ${p.total.toFixed(2)}`,
        created_at_display: new Date(p.created_at).toLocaleString(),
      })) ?? [],
    [purchases],
  )

  const canSubmit =
    supplierId !== '' && productId !== '' && qty > 0 && unitCost > 0

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <h1 className="text-2xl font-bold">Purchases</h1>
        <p className="text-gray-600">
          Record stock coming in from suppliers and track purchase history.
        </p>
      </div>

      <form
        onSubmit={handleSubmit}
        className="bg-white rounded-2xl shadow p-4 grid gap-3 max-w-xl"
      >
        <h2 className="font-semibold text-lg">Record Purchase</h2>
        <label className="text-sm grid gap-1">
          Supplier
          <select
            value={supplierId}
            onChange={(e) =>
              setSupplierId(e.target.value ? Number(e.target.value) : '')
            }
            className="w-full border rounded-lg px-3 py-2 bg-white"
          >
            <option value="">Select supplier</option>
            {(suppliers || []).map((s) => (
              <option key={s.id} value={s.id}>
                {s.name}
              </option>
            ))}
          </select>
        </label>
        <label className="text-sm grid gap-1">
          Product
          <select
            value={productId}
            onChange={(e) =>
              setProductId(e.target.value ? Number(e.target.value) : '')
            }
            className="w-full border rounded-lg px-3 py-2 bg-white"
          >
            <option value="">Select product</option>
            {(products || []).map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
          </select>
        </label>
        <label className="text-sm grid gap-1">
          Quantity
          <input
            type="number"
            min={0}
            step={1}
            value={qty}
            onChange={(e) => setQty(Number(e.target.value))}
            className="w-full border rounded-lg px-3 py-2"
          />
        </label>
        <label className="text-sm grid gap-1">
          Unit Cost (N$)
          <input
            type="number"
            min={0}
            step="0.01"
            value={unitCost}
            onChange={(e) => setUnitCost(Number(e.target.value))}
            className="w-full border rounded-lg px-3 py-2"
          />
        </label>
        <button
          type="submit"
          disabled={!canSubmit || isPending}
          className="justify-self-start bg-black text-white rounded-xl px-4 py-2 disabled:opacity-50"
        >
          {isPending ? 'Saving...' : 'Save Purchase'}
        </button>
        {isSuccess && created && (
          <div className="text-green-600 text-sm">
            Purchase saved. Total N$ {created.total.toFixed?.(2) ?? created.total}
          </div>
        )}
        {suppliers?.length === 0 && (
          <div className="text-yellow-600 text-sm">
            Add a supplier before recording purchases.
          </div>
        )}
        {products?.length === 0 && (
          <div className="text-yellow-600 text-sm">
            Add a product before recording purchases.
          </div>
        )}
      </form>

      <section className="space-y-3">
        <h2 className="font-semibold text-lg">Purchase History</h2>
        {purchasesLoading && <Loading />}
        {purchasesError && (
          <div className="text-red-600">Unable to load purchases right now.</div>
        )}
        {!purchasesLoading && !purchasesError && rows.length === 0 && (
          <div className="text-gray-600">
            No purchases recorded yet. Add one using the form above.
          </div>
        )}
        {!purchasesLoading && !purchasesError && rows.length > 0 && (
          <DataTable
            rows={rows}
            columns={[
              { key: 'id', header: 'ID' },
              { key: 'supplier_name', header: 'Supplier' },
              { key: 'item_count', header: 'Items' },
              { key: 'total_display', header: 'Total' },
              { key: 'created_at_display', header: 'Date' },
            ]}
          />
        )}
      </section>
    </div>
  )
}
