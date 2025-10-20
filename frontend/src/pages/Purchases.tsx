import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { FormEvent, useMemo, useState } from 'react'

import DataTable from '../components/DataTable'
import Loading from '../components/Loading'
import {
  createPurchase,
  getProducts,
  getPurchases,
  getSuppliers,
  // new API helpers you added
  getPurchaseDetail,
  updatePurchase,
  cancelPurchase,
} from '../lib/api'
import type { Product, Purchase, Supplier } from '../lib/types'

// Local detail type to avoid touching shared types file
type PurchaseDetail = {
  id: number
  supplier_id: number
  supplier_name: string
  total: number
  created_at: string
  is_edit_locked: boolean
  items: {
    product_id: number
    product_name: string
    qty: number
    unit_cost: number
    subtotal: number
    // optional, if your backend returns it
    sold_qty?: number
  }[]
}

// Extend list type to optionally carry lock flag if your list endpoint provides it
type PurchaseWithLock = Purchase & { is_edit_locked?: boolean }

export default function Purchases() {
  const queryClient = useQueryClient()

  // -------- Queries (list) --------
  const {
    data: purchases,
    isLoading: purchasesLoading,
    isError: purchasesError,
  } = useQuery<PurchaseWithLock[]>({
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

  // -------- Create form state --------
  const [supplierId, setSupplierId] = useState<number | ''>('')
  const [productId, setProductId] = useState<number | ''>('')
  const [qty, setQty] = useState(1)
  const [unitCost, setUnitCost] = useState(0)

  const {
    mutate: createMutate,
    isPending: isCreating,
    isSuccess: createSuccess,
    data: created,
  } = useMutation({
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
    createMutate({
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

  const canSubmit =
    supplierId !== '' && productId !== '' && qty > 0 && unitCost > 0

  // -------- Edit dialog state / actions --------
  const [editingId, setEditingId] = useState<number | null>(null)
  const [detail, setDetail] = useState<PurchaseDetail | null>(null)
  const [editSupplierId, setEditSupplierId] = useState<number | ''>('')
  const [savingEdit, setSavingEdit] = useState(false)
  const [cancelingId, setCancelingId] = useState<number | null>(null)

  const openEdit = async (rowId: number) => {
    try {
      const d = await getPurchaseDetail(rowId)
      if (d.is_edit_locked) {
        // Hard lock: do not open dialog at all
        alert('Editing is locked because some of the purchased stock has already been sold.')
        return
      }
      setDetail(d)
      setEditSupplierId(d.supplier_id)
      setEditingId(rowId)
    } catch {
      alert('Failed to load purchase details')
    }
  }

  const saveEdit = async () => {
    if (!editingId || !detail) return
    if (detail.is_edit_locked) {
      alert('Editing is locked for this purchase.')
      return
    }
    setSavingEdit(true)
    try {
      await updatePurchase(editingId, {
        supplier_id: editSupplierId || undefined,
        // If you later add line-item editing, send `items` here
      })
      // Refresh lists & close
      await queryClient.invalidateQueries({ queryKey: ['purchases'] })
      setEditingId(null)
      setDetail(null)
    } catch (e: any) {
      const msg =
        e?.response?.data?.detail ||
        e?.message ||
        'Update failed'
      alert(msg)
    } finally {
      setSavingEdit(false)
    }
  }

  const onCancelPurchase = async (rowId: number) => {
    if (!confirm('Cancel (void) this purchase? Stock will be rolled back if possible.')) return
    setCancelingId(rowId)
    try {
      await cancelPurchase(rowId)
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['purchases'] }),
        queryClient.invalidateQueries({ queryKey: ['products'] }),
      ])
    } catch (e: any) {
      const msg =
        e?.response?.data?.detail ||
        e?.message ||
        'Cancel failed'
      alert(msg)
    } finally {
      setCancelingId(null)
    }
  }

  // -------- Rows for table --------
  const rows: PurchaseWithLock[] = useMemo(
    () => purchases ?? [],
    [purchases],
  )

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <h1 className="text-2xl font-bold">Purchases</h1>
        <p className="text-gray-600 dark:text-gray-400">
          Record stock coming in from suppliers and track purchase history.
        </p>
      </div>

      {/* Create form */}
      <form
        onSubmit={handleSubmit}
        className="bg-white dark:bg-zinc-800 rounded-2xl shadow p-4 grid gap-3 max-w-xl"
      >
        <h2 className="font-semibold text-lg">Record Purchase</h2>
        <label className="text-sm grid gap-1">
          Supplier
          <select
            value={supplierId}
            onChange={(e) =>
              setSupplierId(e.target.value ? Number(e.target.value) : '')
            }
            className="w-full border dark:border-zinc-600 rounded-lg px-3 py-2 bg-white dark:bg-zinc-700"
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
            className="w-full border dark:border-zinc-600 rounded-lg px-3 py-2 bg-white dark:bg-zinc-700"
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
            className="w-full border bg-gray-50 dark:bg-zinc-700 rounded-lg px-3 py-2"
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
            className="w-full border bg-gray-50 dark:bg-zinc-700 rounded-lg px-3 py-2"
          />
        </label>
        <button
          type="submit"
          disabled={!canSubmit || isCreating}
          className="justify-self-start bg-black text-white rounded-xl px-4 py-2 disabled:opacity-50"
        >
          {isCreating ? 'Saving...' : 'Save Purchase'}
        </button>
        {createSuccess && created && (
          <div className="text-green-600 dark:text-green-400 text-sm">
            Purchase saved. Total N$ {created.total?.toFixed?.(2) ?? created.total}
          </div>
        )}
        {suppliers?.length === 0 && (
          <div className="text-yellow-600 dark:text-yellow-400 text-sm">
            Add a supplier before recording purchases.
          </div>
        )}
        {products?.length === 0 && (
          <div className="text-yellow-600 dark:text-yellow-400 text-sm">
            Add a product before recording purchases.
          </div>
        )}
      </form>

      {/* History */}
      <section className="space-y-3">
        <h2 className="font-semibold text-lg">Purchase History</h2>
        {purchasesLoading && <Loading />}
        {purchasesError && (
          <div className="text-red-600 dark:text-red-400">Unable to load purchases right now.</div>
        )}
        {!purchasesLoading && !purchasesError && rows.length === 0 && (
          <div className="text-gray-600 dark:text-gray-400">
            No purchases recorded yet. Add one using the form above.
          </div>
        )}
        {!purchasesLoading && !purchasesError && rows.length > 0 && (
          <DataTable<PurchaseWithLock>
            rows={rows}
            columns={[
              { key: 'id', header: 'ID' },
              { key: 'supplier_name', header: 'Supplier' },
              {
                header: 'Qty/Products',
                render: (r: PurchaseWithLock) => (
                  <div className="space-y-1">
                    {r.products && r.products.length > 0 ? (
                      r.products.map((product: any, idx: number) => (
                        <div key={idx} className="text-sm">
                          <span className="font-medium">{product.qty} × {product.name}</span>
                          <span className="text-gray-500 ml-2">
                            (N${Number(product.unit_cost).toFixed(2)})
                          </span>
                        </div>
                      ))
                    ) : (
                      <span className="text-gray-400 text-sm">No products</span>
                    )}
                  </div>
                ),
              },
              {
                header: 'Total',
                render: (r: PurchaseWithLock) => `N$ ${Number(r.total).toFixed(2)}`,
              },
              {
                header: 'Date',
                render: (r: PurchaseWithLock) => new Date(r.created_at).toLocaleString(),
              },
              {
                header: 'Actions',
                render: (r: PurchaseWithLock) => {
                  const locked = !!r.is_edit_locked
                  return (
                    <div className="flex gap-2">
                      <button
                        onClick={() => openEdit(r.id)}
                        disabled={locked}
                        title={locked ? 'Editing locked: items from this purchase have already been sold' : 'Edit purchase'}
                        className={`px-3 py-1 rounded-lg ${locked ? 'bg-gray-200 text-gray-500 cursor-not-allowed' : 'bg-gray-200 dark:bg-zinc-700'}`}
                      >
                        {locked ? 'Locked' : 'Edit'}
                      </button>
                      <button
                        onClick={() => onCancelPurchase(r.id)}
                        disabled={cancelingId === r.id}
                        className="px-3 py-1 rounded-lg bg-red-600 text-white disabled:opacity-60"
                      >
                        {cancelingId === r.id ? 'Canceling…' : 'Cancel'}
                      </button>
                    </div>
                  )
                },
              },
            ]}
          />
        )}
      </section>

      {/* Edit dialog (supplier only for now) */}
      {editingId && detail && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-zinc-800 rounded-2xl shadow p-4 w-[420px] space-y-3">
            <h3 className="font-semibold text-lg">Edit Purchase #{detail.id}</h3>

            <div className="text-sm text-gray-600 dark:text-gray-400">
              Supplier change only. Editing items will be available if the purchase remains unlocked.
            </div>

            <label className="text-sm grid gap-1">
              Supplier
              <select
                value={editSupplierId}
                onChange={(e) => setEditSupplierId(e.target.value ? Number(e.target.value) : '')}
                className="w-full border dark:border-zinc-600 rounded-lg px-3 py-2 bg-white dark:bg-zinc-700"
              >
                {(suppliers || []).map((s) => (
                  <option key={s.id} value={s.id}>{s.name}</option>
                ))}
              </select>
            </label>

            <div className="flex gap-2 justify-end pt-1">
              <button
                onClick={() => { setEditingId(null); setDetail(null); }}
                className="px-3 py-1 rounded-lg"
              >
                Close
              </button>
              <button
                onClick={saveEdit}
                disabled={savingEdit}
                className="px-4 py-1.5 rounded-lg bg-black text-white disabled:opacity-60"
              >
                {savingEdit ? 'Saving…' : 'Save'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
