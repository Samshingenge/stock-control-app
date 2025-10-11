import { useMemo, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  getProducts,
  createProduct,
  updateProduct,
  deleteProduct,
  type ProductCreate,
  type ProductUpdate,
} from '../lib/api'
import type { Product } from '../lib/types'

const normalizeSku = (raw: string) =>
  raw
    .trim()
    .replace(/\s+/g, '-') // spaces -> hyphens
    .replace(/[^A-Za-z0-9-]/g, '') // safe chars
    .toUpperCase()

export default function Inventory() {
  const qc = useQueryClient()

  // -----------------------------
  // Data
  // -----------------------------
  const { data: products = [], isLoading, isError, error } = useQuery({
    queryKey: ['products'],
    queryFn: getProducts,
  })

  // -----------------------------
  // Add Product form state
  // -----------------------------
  const [newProd, setNewProd] = useState<ProductCreate>({
    name: '',
    sku: '',
    unit: '',
    price: NaN,
    cost_price: NaN,
    stock_qty: undefined,
    reorder_level: 5,
  })

  const createMut = useMutation({
    mutationFn: createProduct,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['products'] })
      setNewProd({
        name: '',
        sku: '',
        unit: '',
        price: NaN,
        cost_price: NaN,
        stock_qty: undefined,
        reorder_level: 5,
      })
    },
    onError: (e: any) => {
      alert(e?.response?.data?.detail ?? 'Failed to add product')
    },
  })

  // -----------------------------
  // Edit Product form state
  // -----------------------------
  const [editing, setEditing] = useState<Product | null>(null)
  const [editDraft, setEditDraft] = useState<ProductUpdate>({})

  const startEdit = (p: Product) => {
    setEditing(p)
    setEditDraft({
      name: p.name,
      sku: p.sku, // make SKU editable
      unit: p.unit,
      price: p.price,
      cost_price: p.cost_price,
      stock_qty: p.stock_qty,
      reorder_level: p.reorder_level,
    })
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const cancelEdit = () => {
    setEditing(null)
    setEditDraft({})
  }

  const updateMut = useMutation({
    mutationFn: (payload: { id: number; data: ProductUpdate }) =>
      updateProduct(payload.id, payload.data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['products'] })
      cancelEdit()
    },
    onError: (e: any) => {
      alert(e?.response?.data?.detail ?? 'Failed to update product')
    },
  })

  // -----------------------------
  // Delete
  // -----------------------------
  const delMut = useMutation({
    mutationFn: (id: number) => deleteProduct(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['products'] }),
    onError: (e: any) => {
      alert(e?.response?.data?.detail ?? 'Delete failed')
    },
  })

  // -----------------------------
  // Derived helpers
  // -----------------------------
  const lowStockIds = useMemo(
    () => new Set(products.filter(p => p.stock_qty <= p.reorder_level).map(p => p.id)),
    [products],
  )

  // -----------------------------
  // Handlers
  // -----------------------------
  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault()
    if (!newProd.name || !newProd.sku || !newProd.unit) {
      alert('Name, SKU and Unit are required.')
      return
    }
    createMut.mutate({
      ...newProd,
      sku: normalizeSku(newProd.sku),
      price: Number(newProd.price),
      cost_price: Number(newProd.cost_price),
      stock_qty:
        newProd.stock_qty === undefined || newProd.stock_qty === null || isNaN(Number(newProd.stock_qty))
          ? undefined
          : Number(newProd.stock_qty),
      reorder_level: Number(newProd.reorder_level ?? 0),
    })
  }

  const handleUpdate = (e: React.FormEvent) => {
    e.preventDefault()
    if (!editing) return
    const payload: ProductUpdate = {
      ...editDraft,
      sku: normalizeSku((editDraft.sku ?? editing!.sku) as string),
      price: editDraft.price !== undefined ? Number(editDraft.price) : undefined,
      cost_price: editDraft.cost_price !== undefined ? Number(editDraft.cost_price) : undefined,
      stock_qty: editDraft.stock_qty !== undefined ? Number(editDraft.stock_qty) : undefined,
      reorder_level: editDraft.reorder_level !== undefined ? Number(editDraft.reorder_level) : undefined,
    }
    updateMut.mutate({ id: editing!.id, data: payload })
  }

  const confirmDelete = (p: Product) => {
    if (!confirm(`Delete product "${p.name}" (SKU: ${p.sku})?`)) return
    delMut.mutate(p.id)
  }

  // -----------------------------
  // UI
  // -----------------------------
  return (
    <div className="p-6 space-y-6">
      <section className="bg-white rounded-2xl shadow p-4 md:p-6">
        <h2 className="text-xl font-semibold mb-4">Add Product</h2>
        <form onSubmit={handleCreate} className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Input
            label="Name"
            value={newProd.name}
            onChange={(v) => setNewProd((s) => ({ ...s, name: v }))}
            placeholder="Rice 1kg"
          />
          <Input
            label="SKU"
            value={newProd.sku}
            onChange={(v) => setNewProd((s) => ({ ...s, sku: v }))}
            placeholder="RICE-1KG"
          />
          <Input
            label="Unit"
            value={newProd.unit}
            onChange={(v) => setNewProd((s) => ({ ...s, unit: v }))}
            placeholder="bag / bottle / pack"
          />
          <Input
            label="Price (N$)"
            type="number"
            value={isNaN(newProd.price) ? '' : String(newProd.price)}
            onChange={(v) => setNewProd((s) => ({ ...s, price: Number(v) }))}
          />
          <Input
            label="Cost Price (N$)"
            type="number"
            value={isNaN(newProd.cost_price) ? '' : String(newProd.cost_price)}
            onChange={(v) => setNewProd((s) => ({ ...s, cost_price: Number(v) }))}
          />
          <Input
            label="Stock Qty"
            type="number"
            value={
              newProd.stock_qty === undefined || newProd.stock_qty === null
                ? ''
                : String(newProd.stock_qty)
            }
            onChange={(v) =>
              setNewProd((s) => ({
                ...s,
                stock_qty: v === '' ? undefined : Number(v),
              }))
            }
          />
          <Input
            label="Reorder Level"
            type="number"
            value={String(newProd.reorder_level ?? '')}
            onChange={(v) => setNewProd((s) => ({ ...s, reorder_level: Number(v) }))}
          />

          <div className="md:col-span-3 flex gap-3">
            <button
              type="submit"
              className="px-4 py-2 rounded-xl bg-black text-white disabled:opacity-50"
              disabled={createMut.isPending}
            >
              {createMut.isPending ? 'Saving…' : 'Save Product'}
            </button>
          </div>
        </form>
      </section>

      {editing && (
        <section className="bg-white rounded-2xl shadow p-4 md:p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold">
              Edit Product — {editing.name}
            </h2>
            <button
              onClick={cancelEdit}
              className="text-sm text-gray-500 hover:underline"
            >
              Cancel
            </button>
          </div>

          <form onSubmit={handleUpdate} className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Input
              label="Name"
              value={editDraft.name ?? ''}
              onChange={(v) => setEditDraft((s) => ({ ...s, name: v }))}
            />
            {/* 🔧 SKU is now editable */}
            <Input
              label="SKU"
              value={editDraft.sku ?? ''}
              onChange={(v) => setEditDraft((s) => ({ ...s, sku: v }))}
              placeholder="FLOUR-2KG"
            />
            <Input
              label="Unit"
              value={editDraft.unit ?? ''}
              onChange={(v) => setEditDraft((s) => ({ ...s, unit: v }))}
            />
            <Input
              label="Price (N$)"
              type="number"
              value={
                editDraft.price === undefined || editDraft.price === null
                  ? ''
                  : String(editDraft.price)
              }
              onChange={(v) => setEditDraft((s) => ({ ...s, price: Number(v) }))}
            />
            <Input
              label="Cost Price (N$)"
              type="number"
              value={
                editDraft.cost_price === undefined || editDraft.cost_price === null
                  ? ''
                  : String(editDraft.cost_price)
              }
              onChange={(v) => setEditDraft((s) => ({ ...s, cost_price: Number(v) }))}
            />
            <Input
              label="Stock Qty"
              type="number"
              value={
                editDraft.stock_qty === undefined || editDraft.stock_qty === null
                  ? ''
                  : String(editDraft.stock_qty)
              }
              onChange={(v) => setEditDraft((s) => ({ ...s, stock_qty: Number(v) }))}
            />
            <Input
              label="Reorder Level"
              type="number"
              value={
                editDraft.reorder_level === undefined || editDraft.reorder_level === null
                  ? ''
                  : String(editDraft.reorder_level)
              }
              onChange={(v) =>
                setEditDraft((s) => ({ ...s, reorder_level: Number(v) }))
              }
            />

            <div className="md:col-span-3 flex gap-3">
              <button
                type="submit"
                className="px-4 py-2 rounded-xl bg-black text-white disabled:opacity-50"
                disabled={updateMut.isPending}
              >
                {updateMut.isPending ? 'Saving…' : 'Save Changes'}
              </button>
              <button
                type="button"
                onClick={cancelEdit}
                className="px-4 py-2 rounded-xl bg-gray-100"
              >
                Cancel
              </button>
            </div>
          </form>
        </section>
      )}

      <section className="bg-white rounded-2xl shadow">
        <div className="p-4 md:p-6">
          <h2 className="text-xl font-semibold mb-4">Products</h2>

          {isLoading && <div>Loading…</div>}
          {isError && (
            <div className="text-red-600">
              Failed to load products: {String((error as any)?.message || '')}
            </div>
          )}

          {!isLoading && !isError && (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-50">
                  <tr>
                    <Th>Name</Th>
                    <Th>SKU</Th>
                    <Th>Unit</Th>
                    <Th className="text-right">Price</Th>
                    <Th className="text-right">Cost</Th>
                    <Th className="text-right">Stock</Th>
                    <Th className="text-right">Reorder</Th>
                    <Th>Actions</Th>
                  </tr>
                </thead>
                <tbody>
                  {products.map((p) => (
                    <tr key={p.id} className="border-t">
                      <Td>{p.name}</Td>
                      <Td>{p.sku}</Td>
                      <Td>{p.unit}</Td>
                      <Td className="text-right">{p.price.toFixed(2)}</Td>
                      <Td className="text-right">{p.cost_price.toFixed(2)}</Td>
                      <Td className={`text-right ${lowStockIds.has(p.id) ? 'text-orange-600 font-medium' : ''}`}>
                        {p.stock_qty}
                      </Td>
                      <Td className="text-right">{p.reorder_level}</Td>
                      <Td>
                        <div className="flex gap-2">
                          <button
                            onClick={() => startEdit(p)}
                            className="px-3 py-1 rounded-lg bg-gray-100 hover:bg-gray-200"
                          >
                            Edit
                          </button>
                          <button
                            onClick={() => confirmDelete(p)}
                            className="px-3 py-1 rounded-lg bg-red-50 text-red-700 hover:bg-red-100 disabled:opacity-50"
                            disabled={delMut.isPending}
                          >
                            Delete
                          </button>
                        </div>
                      </Td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </section>
    </div>
  )
}

/* ---------------- UI bits ---------------- */
function Input({
  label,
  value,
  onChange,
  type = 'text',
  placeholder,
}: {
  label: string
  value: string | number
  onChange: (v: string) => void
  type?: string
  placeholder?: string
}) {
  return (
    <label className="flex flex-col gap-1">
      <span className="text-sm text-gray-700">{label}</span>
      <input
        className="border rounded-xl px-3 py-2 outline-none focus:ring-2 ring-black/10"
        value={value as any}
        onChange={(e) => onChange(e.target.value)}
        type={type}
        placeholder={placeholder}
      />
    </label>
  )
}

function Th({
  children,
  className = '',
}: {
  children: React.ReactNode
  className?: string
}) {
  return (
    <th className={`text-left px-4 py-2 font-semibold ${className}`}>{children}</th>
  )
}
function Td({
  children,
  className = '',
}: {
  children: React.ReactNode
  className?: string
}) {
  return <td className={`px-4 py-2 ${className}`}>{children}</td>
}
