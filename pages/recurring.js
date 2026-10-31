// pages/recurring.js - 定期購入品（よく買う商品の管理）
import { useState, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { PlusIcon, TrashIcon, CloseIcon, CartIcon } from '../components/Icons'

const CATEGORY_EMOJI = {
  '野菜・果物': '🥬',
  '肉・魚': '🥩',
  '豆腐・納豆・卵': '🍳',
  '調味料・食品': '🧂',
  '日用品・医薬品': '🧴',
  '家・生活用品': '🧹',
  'その他': '🛒',
}
const itemEmoji = (category) => CATEGORY_EMOJI[category] || '🛒'

export default function Recurring() {
  const [items, setItems] = useState([])
  const [stores, setStores] = useState([])
  const [categories, setCategories] = useState([])
  const [showForm, setShowForm] = useState(false)
  const [editingId, setEditingId] = useState(null)
  const [toast, setToast] = useState('')

  const [form, setForm] = useState({ name: '', store: '', category: '', memo: '' })

  const fetchItems = useCallback(async () => {
    try {
      const res = await fetch('/api/recurring')
      const json = await res.json()
      setItems(Array.isArray(json) ? json : [])
    } catch (e) {
      console.error('Error fetching recurring items:', e)
    }
  }, [])

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
    fetchItems()
    fetchSettings()
  }, [fetchItems, fetchSettings])

  const showToast = (msg) => {
    setToast(msg)
    setTimeout(() => setToast(''), 2000)
  }

  const openAddForm = () => {
    setEditingId(null)
    setForm({ name: '', store: '', category: '', memo: '' })
    setShowForm(true)
  }

  const openEditForm = (item) => {
    setEditingId(item.id)
    setForm({ name: item.name, store: item.store || '', category: item.category || '', memo: item.memo || '' })
    setShowForm(true)
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!form.name.trim()) return
    try {
      await fetch('/api/recurring', {
        method: editingId ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editingId ? { id: editingId, ...form } : form),
      })
      setShowForm(false)
      fetchItems()
      showToast(editingId ? '更新しました' : '登録しました')
    } catch (err) {
      console.error('Error saving recurring item:', err)
    }
  }

  const handleDelete = async (id) => {
    if (!confirm('この商品を削除しますか？')) return
    try {
      await fetch(`/api/recurring?id=${id}`, { method: 'DELETE' })
      fetchItems()
      showToast('削除しました')
    } catch (err) {
      console.error('Error deleting recurring item:', err)
    }
  }

  // ワンタップで買い物リストへ追加
  const addToShoppingList = async (item) => {
    try {
      await fetch('/api/items', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: item.name, store: item.store, category: item.category, memo: item.memo }),
      })
      showToast(`「${item.name}」をリストへ追加しました`)
    } catch (err) {
      console.error('Error adding to shopping list:', err)
    }
  }

  return (
    <div>
      {/* ヘッダー */}
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-2xl font-bold text-text-primary">定期購入品</h1>
        <button
          onClick={() => (showForm ? setShowForm(false) : openAddForm())}
          className="flex items-center gap-1 btn-brand px-4 py-2.5 text-sm"
        >
          {showForm ? <CloseIcon size={16} /> : <PlusIcon size={16} />}
          {showForm ? '閉じる' : '追加'}
        </button>
      </div>

      <p className="text-sm text-text-secondary mb-4">
        よく買う商品を登録しておくと、ワンタップで買い物リストに追加できます。
      </p>

      {/* 登録フォーム */}
      <AnimatePresence>
        {showForm && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden mb-4"
          >
            <form onSubmit={handleSubmit} className="card p-4 space-y-3">
              <input
                type="text"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                placeholder="商品名"
                required
                className="text-input"
              />

              <div>
                <div className="text-sm text-text-secondary mb-1">購入先</div>
                <div className="flex gap-2 overflow-x-auto no-scrollbar py-1">
                  {['', ...stores].map((s) => (
                    <button
                      key={s || 'none'}
                      type="button"
                      onClick={() => setForm({ ...form, store: s })}
                      className={`chip chip-sm ${form.store === s ? 'chip-active' : ''}`}
                    >
                      {s || '未設定'}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <div className="text-sm text-text-secondary mb-1">分類</div>
                <div className="flex gap-2 overflow-x-auto no-scrollbar py-1">
                  {categories.map((c) => (
                    <button
                      key={c}
                      type="button"
                      onClick={() => setForm({ ...form, category: form.category === c ? '' : c })}
                      className={`chip chip-sm ${form.category === c ? 'chip-active' : ''}`}
                    >
                      {c}
                    </button>
                  ))}
                </div>
              </div>

              <input
                type="text"
                value={form.memo}
                onChange={(e) => setForm({ ...form, memo: e.target.value })}
                placeholder="メモ（任意）"
                className="text-input"
              />

              <button type="submit" className="btn-brand w-full py-3">
                {editingId ? '更新する' : '登録する'}
              </button>
            </form>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 商品一覧 */}
      {items.length === 0 && !showForm && (
        <div className="card text-center py-12">
          <div className="flex justify-center mb-3 text-text-secondary">
            <CartIcon size={48} strokeWidth={1.5} />
          </div>
          <h3 className="text-lg font-bold text-text-primary mb-1">定期購入品はまだありません</h3>
          <p className="text-sm text-text-secondary">「追加」からよく買う商品を登録しましょう</p>
        </div>
      )}

      {items.length > 0 && (
        <div className="card px-3">
          {items.map((item, index) => (
            <motion.div
              key={item.id}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.03 }}
              className="flex items-center gap-3 py-3 border-b border-line last:border-0"
            >
              <div className="w-10 h-10 rounded-xl bg-bg-card-soft flex items-center justify-center text-xl flex-shrink-0">
                {itemEmoji(item.category)}
              </div>
              <button onClick={() => openEditForm(item)} className="flex-1 min-w-0 text-left">
                <div className="font-medium text-text-primary truncate">{item.name}</div>
                <div className="text-xs text-text-secondary truncate">
                  {[item.store || '未設定', item.category].filter(Boolean).join(' ・ ')}
                  {item.memo ? ` ・ ${item.memo}` : ''}
                </div>
              </button>
              <button
                onClick={() => addToShoppingList(item)}
                className="btn-brand px-4 py-2 text-sm flex-shrink-0"
              >
                リストへ
              </button>
              <button
                onClick={() => handleDelete(item.id)}
                className="text-text-secondary hover:text-accent p-2 flex-shrink-0"
                aria-label="削除"
              >
                <TrashIcon size={18} />
              </button>
            </motion.div>
          ))}
        </div>
      )}

      {/* トースト */}
      {toast && <div className="toast">{toast}</div>}
    </div>
  )
}
