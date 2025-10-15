import type { ChangeEvent } from 'react'
import { useEffect, useRef, useState } from 'react'

type AppSettings = {
  storeName: string
  currencySymbol: string
  decimalPlaces: number
  theme: 'system' | 'light' | 'dark'
  confirmDeletes: boolean
}

const SETTINGS_KEY = 'app.settings'
const DEFAULTS: AppSettings = {
  storeName: 'My Store',
  currencySymbol: 'N$',
  decimalPlaces: 2,
  theme: 'system',
  confirmDeletes: true,
}

const clampDecimals = (value: number) => Math.min(4, Math.max(0, value))
const normalizeTheme = (theme: unknown): AppSettings['theme'] =>
  theme === 'light' || theme === 'dark' || theme === 'system' ? theme : DEFAULTS.theme

function loadSettings(): AppSettings {
  if (typeof window === 'undefined') {
    return DEFAULTS
  }
  try {
    const raw = window.localStorage.getItem(SETTINGS_KEY)
    if (!raw) return DEFAULTS
    const parsed = JSON.parse(raw)
    return {
      ...DEFAULTS,
      ...parsed,
      decimalPlaces: clampDecimals(
        Number.isFinite(Number(parsed.decimalPlaces))
          ? Number(parsed.decimalPlaces)
          : DEFAULTS.decimalPlaces,
      ),
      theme: normalizeTheme(parsed.theme),
      confirmDeletes: Boolean(parsed.confirmDeletes ?? DEFAULTS.confirmDeletes),
    }
  } catch {
    return DEFAULTS
  }
}

function applyTheme(theme: AppSettings['theme']) {
  if (typeof document === 'undefined') return
  const root = document.documentElement
  const prefersDark =
    typeof window !== 'undefined' &&
    window.matchMedia?.('(prefers-color-scheme: dark)')?.matches
  const dark = theme === 'dark' || (theme === 'system' && Boolean(prefersDark))
  root.classList.toggle('dark', dark)
  root.dataset.theme = dark ? 'dark' : 'light'
}

export default function Settings() {
  const [settings, setSettings] = useState<AppSettings>(() => loadSettings())
  const [savedAt, setSavedAt] = useState<number | null>(null)
  const fileRef = useRef<HTMLInputElement>(null)

  useEffect(() => applyTheme(settings.theme), [settings.theme])

  useEffect(() => {
    if (typeof window === 'undefined') return
    if (settings.theme !== 'system') return
    const media = window.matchMedia('(prefers-color-scheme: dark)')
    const handler = () => applyTheme('system')
    media.addEventListener?.('change', handler)
    return () => media.removeEventListener?.('change', handler)
  }, [settings.theme])

  const onSave = () => {
    window.localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings))
    setSavedAt(Date.now())
  }

  const onReset = () => {
    setSettings(DEFAULTS)
    setSavedAt(null)
  }

  const onExport = () => {
    const blob = new Blob([JSON.stringify(settings, null, 2)], {
      type: 'application/json;charset=utf-8;',
    })
    const url = URL.createObjectURL(blob)
    const anchor = document.createElement('a')
    anchor.href = url
    anchor.download = 'settings.json'
    document.body.appendChild(anchor)
    anchor.click()
    anchor.remove()
    URL.revokeObjectURL(url)
  }

  const onImportClick = () => fileRef.current?.click()

  const onImportFile = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return
    try {
      const text = await file.text()
      const json = JSON.parse(text)
     setSettings((prev) => ({
        storeName: typeof json.storeName === 'string' ? json.storeName : prev.storeName,
        currencySymbol: typeof json.currencySymbol === 'string' 
          ? json.currencySymbol.slice(0, 4) 
          : prev.currencySymbol,
        decimalPlaces: clampDecimals(Number(json.decimalPlaces ?? prev.decimalPlaces)),
        theme: normalizeTheme(json.theme),
        confirmDeletes: Boolean(json.confirmDeletes ?? prev.confirmDeletes),
      }))
      setSavedAt(null)
    } catch {
      window.alert('Invalid settings file.')
    } finally {
      event.target.value = ''
    }
  }

  const apiBase = import.meta.env.VITE_API_BASE || 'http://localhost:8000'

  return (
    <div className="space-y-6">
      <div className="space-y-1">
        <h1 className="text-2xl font-bold">Settings</h1>
        <p className="text-gray-600">Configure store preferences (saved in your browser).</p>
      </div>

      <section className="bg-white dark:bg-zinc-800 rounded-2xl shadow p-4 grid gap-4 max-w-3xl">
        <h2 className="font-semibold text-lg">Store</h2>
        <label className="text-sm grid gap-1">
          Store Name
          <input
            value={settings.storeName}
            onChange={(e) => setSettings({ ...settings, storeName: e.target.value })}
            className="w-full border bg-gray-50 dark:bg-zinc-700 rounded-lg px-3 py-2"
            placeholder="My Store"
          />
        </label>
        <div className="grid sm:grid-cols-3 gap-3">
          <label className="text-sm grid gap-1">
            Currency Symbol
            <input
              value={settings.currencySymbol}
              onChange={(e) =>
                setSettings({
                  ...settings,
                  currencySymbol: e.target.value.slice(0, 4),
                })
              }
              className="w-full border bg-gray-50 dark:bg-zinc-700 rounded-lg px-3 py-2"
              placeholder="N$"
            />
          </label>
          <label className="text-sm grid gap-1">
            Decimal Places
            <input
              type="number"
              min={0}
              max={4}
              value={settings.decimalPlaces}
              onChange={(e) =>
                setSettings({
                  ...settings,
                  decimalPlaces: clampDecimals(Number(e.target.value)),
                })
              }
              className="w-full border bg-gray-50 dark:bg-zinc-700 rounded-lg px-3 py-2"
            />
          </label>
          <label className="text-sm grid gap-1">
            Confirm Deletes
            <select
              value={settings.confirmDeletes ? 'yes' : 'no'}
              onChange={(e) =>
                setSettings({
                  ...settings,
                  confirmDeletes: e.target.value === 'yes',
                })
              }
              className="w-full border rounded-lg bg-gray-50 dark:bg-zinc-700 px-3 py-2"
            >
              <option value="yes">Yes</option>
              <option value="no">No</option>
            </select>
          </label>
        </div>
      </section>

      <section className="bg-white dark:bg-zinc-800 rounded-2xl shadow p-4 grid gap-4 max-w-3xl">
        <h2 className="font-semibold text-lg">Appearance</h2>
        <label className="text-sm grid gap-1 max-w-xs">
          Theme
          <select
            value={settings.theme}
            onChange={(e) =>
              setSettings({
                ...settings,
                theme: normalizeTheme(e.target.value),
              })
            }
            className="w-full border rounded-lg bg-gray-50 dark:bg-zinc-700 px-3 py-2"
          >
            <option value="system">System</option>
            <option value="light">Light</option>
            <option value="dark">Dark</option>
          </select>
        </label>
      </section>

      <section className="bg-white dark:bg-zinc-800 rounded-2xl shadow p-4 grid gap-4 max-w-3xl">
        <h2 className="font-semibold text-lg">System</h2>
        <div className="text-sm grid gap-1">
          <span className="text-gray-600">API Base (read-only)</span>
          <code className="rounded-lg border bg-gray-50 dark:bg-zinc-700 dark:border-zinc-600 px-2 py-1 text-xs">{apiBase}</code>
        </div>

        <div className="flex flex-wrap gap-3">
          <button
            type="button"
            onClick={onSave}
            className="bg-black text-white rounded-xl px-4 py-2"
          >
            Save Settings
          </button>
          <button
            type="button"
            onClick={onReset}
            className="border border-gray-300 dark:border-zinc-600 rounded-xl px-4 py-2"
          >
            Reset to Defaults
          </button>
          <button
            type="button"
            onClick={onExport}
            className="border border-gray-300 dark:border-zinc-600 rounded-xl px-4 py-2"
          >
            Export JSON
          </button>
          <button
            type="button"
            onClick={onImportClick}
            className="border border-gray-300 dark:border-zinc-600 rounded-xl px-4 py-2"
          >
            Import JSON
          </button>
        </div>
        {savedAt && (
          <div className="text-green-600 text-sm">
            Saved {new Date(savedAt).toLocaleTimeString()}.
          </div>
        )}
        <input
          ref={fileRef}
          type="file"
          accept="application/json"
          className="hidden"
          onChange={onImportFile}
        />
      </section>
    </div>
  )
}
