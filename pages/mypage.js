// pages/mypage.js - マイページ（購入先・カテゴリーの管理、アプリ設定）
import { useState, useEffect, useCallback } from 'react'
import { StoreIcon, TagIcon, GearIcon, PlusIcon, CloseIcon } from '../components/Icons'

export default function MyPage() {
  const [stores, setStores] = useState([])
  const [categories, setCategories] = useState([])
  const [newStore, setNewStore] = useState('')
  const [newCategory, setNewCategory] = useState('')
  const [toast, setToast] = useState('')

  const fetchSettings = useCallback(async () => {
    try {
      const res = await fetch('/api/settings')
      const json = await res.json()
      setStores(json.stores || [])
      setCategories(json.categories || [])
    } catch (e) {
      console.error('Error fetching settings:', e)
    }
  }, [])

  useEffect(() => {
    fetchSettings()
  }, [fetchSettings])

  const showToast = (msg) => {
    setToast(msg)
    setTimeout(() => setToast(''), 2000)
  }

  const saveSetting = async (key, value, msg) => {
    try {
      await fetch('/api/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ key, value }),
      })
      fetchSettings()
      showToast(msg)
    } catch (e) {
      console.error('Error saving setting:', e)
    }
  }

  const addStore = () => {
    const name = newStore.trim()
    if (!name || stores.includes(name)) return
    saveSetting('stores', [...stores, name], `「${name}」を追加しました`)
    setNewStore('')
  }

  const removeStore = (name) => {
    if (!confirm(`購入先「${name}」を削除しますか？（商品の購入先は未設定になります）`)) return
    saveSetting('stores', stores.filter((s) => s !== name), `「${name}」を削除しました`)
  }

  const addCategory = () => {
    const name = newCategory.trim()
    if (!name || categories.includes(name)) return
    saveSetting('categories', [...categories, name], `「${name}」を追加しました`)
    setNewCategory('')
  }

  const removeCategory = (name) => {
    if (!confirm(`分類「${name}」を削除しますか？`)) return
    saveSetting('categories', categories.filter((c) => c !== name), `「${name}」を削除しました`)
  }

  const clearPurchased = async () => {
    if (!confirm('購入済みの履歴をすべて削除しますか？')) return
    try {
      await fetch('/api/items?purchased=1', { method: 'DELETE' })
      showToast('購入済みの履歴を削除しました')
    } catch (e) {
      console.error('Error clearing purchased:', e)
    }
  }

  const clearAll = async () => {
    if (!confirm('買い物リストの全データ（未購入含む）を削除しますか？')) return
    if (!confirm('本当に削除しますか？この操作は取り消せません。')) return
    try {
      await fetch('/api/items?all=1', { method: 'DELETE' })
      showToast('全データを削除しました')
    } catch (e) {
      console.error('Error clearing all items:', e)
    }
  }

  return (
    <div>
      {/* ヘッダー */}
      <h1 className="text-2xl font-bold text-text-primary mb-4">マイページ</h1>

      {/* 購入先の管理 */}
      <div className="card p-4 mb-4">
        <div className="flex items-center gap-2 mb-3 text-text-primary">
          <StoreIcon size={18} />
          <h2 className="font-bold">購入先の管理</h2>
        </div>
        <div className="flex flex-wrap gap-2 mb-3">
          {stores.map((s) => (
            <span key={s} className="chip chip-active">
              {s}
              <button
                onClick={() => removeStore(s)}
                className="ml-2 text-text-secondary hover:text-accent"
                aria-label={`${s}を削除`}
              >
                <CloseIcon size={14} />
              </button>
            </span>
          ))}
          {stores.length === 0 && (
            <span className="text-sm text-text-secondary">購入先が登録されていません</span>
          )}
        </div>
        <div className="flex gap-2">
          <input
            type="text"
            value={newStore}
            onChange={(e) => setNewStore(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && addStore()}
            placeholder="新しい購入先（例：コストコ）"
            className="text-input flex-1"
          />
          <button
            onClick={addStore}
            disabled={!newStore.trim()}
            className="btn-brand px-4 flex items-center"
          >
            <PlusIcon size={18} />
          </button>
        </div>
      </div>

      {/* カテゴリーの管理 */}
      <div className="card p-4 mb-4">
        <div className="flex items-center gap-2 mb-3 text-text-primary">
          <TagIcon size={18} />
          <h2 className="font-bold">商品カテゴリーの管理</h2>
        </div>
        <div className="flex flex-wrap gap-2 mb-3">
          {categories.map((c) => (
            <span key={c} className="chip chip-active">
              {c}
              <button
                onClick={() => removeCategory(c)}
                className="ml-2 text-text-secondary hover:text-accent"
                aria-label={`${c}を削除`}
              >
                <CloseIcon size={14} />
              </button>
            </span>
          ))}
          {categories.length === 0 && (
            <span className="text-sm text-text-secondary">カテゴリーが登録されていません</span>
          )}
        </div>
        <div className="flex gap-2">
          <input
            type="text"
            value={newCategory}
            onChange={(e) => setNewCategory(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && addCategory()}
            placeholder="新しいカテゴリー（例：冷凍食品）"
            className="text-input flex-1"
          />
          <button
            onClick={addCategory}
            disabled={!newCategory.trim()}
            className="btn-brand px-4 flex items-center"
          >
            <PlusIcon size={18} />
          </button>
        </div>
      </div>

      {/* アプリ設定 */}
      <div className="card p-4 mb-4">
        <div className="flex items-center gap-2 mb-3 text-text-primary">
          <GearIcon size={18} />
          <h2 className="font-bold">アプリ設定</h2>
        </div>
        <div className="divide-y divide-line">
          <button
            onClick={clearPurchased}
            className="w-full flex justify-between items-center py-3 text-left"
          >
            <span className="text-text-primary">購入済みの履歴を削除</span>
            <span className="text-sm text-text-secondary">実行 →</span>
          </button>
          <button
            onClick={clearAll}
            className="w-full flex justify-between items-center py-3 text-left"
          >
            <span className="text-accent">買い物リストの全データを削除</span>
            <span className="text-sm text-text-secondary">実行 →</span>
          </button>
        </div>
      </div>

      <p className="text-center text-xs text-text-secondary pb-4">
        買い物リストアプリ
      </p>

      {/* トースト */}
      {toast && <div className="toast">{toast}</div>}
    </div>
  )
}
