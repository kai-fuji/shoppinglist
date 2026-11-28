// pages/todos.js - やることリスト
import { useState, useEffect, useCallback, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { PlusIcon, TrashIcon, CloseIcon, CheckIcon, TodoIcon } from '../components/Icons'

const todayStr = () => {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

const formatDue = (due) => {
  if (!due) return ''
  const [, m, d] = due.split('-')
  return `${Number(m)}/${Number(d)}`
}

export default function Todos() {
  const [todos, setTodos] = useState([])
  const [showForm, setShowForm] = useState(false)
  const [editingId, setEditingId] = useState(null)
  const [toast, setToast] = useState('')

  const [form, setForm] = useState({ title: '', memo: '', due_date: '' })

  const fetchTodos = useCallback(async () => {
    try {
      const res = await fetch('/api/todos')
      const json = await res.json()
      setTodos(Array.isArray(json) ? json : [])
    } catch (e) {
      console.error('Error fetching todos:', e)
    }
  }, [])

  useEffect(() => {
    fetchTodos()
  }, [fetchTodos])

  const showToast = (msg) => {
    setToast(msg)
    setTimeout(() => setToast(''), 2000)
  }

  const openAddForm = () => {
    setEditingId(null)
    setForm({ title: '', memo: '', due_date: '' })
    setShowForm(true)
  }

  const openEditForm = (todo) => {
    setEditingId(todo.id)
    setForm({ title: todo.title, memo: todo.memo || '', due_date: todo.due_date || '' })
    setShowForm(true)
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!form.title.trim()) return
    try {
      await fetch('/api/todos', {
        method: editingId ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editingId ? { id: editingId, ...form } : form),
      })
      setShowForm(false)
      fetchTodos()
      showToast(editingId ? '更新しました' : '追加しました')
    } catch (err) {
      console.error('Error saving todo:', err)
    }
  }

  const toggleCompleted = async (todo) => {
    try {
      await fetch('/api/todos', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: todo.id, completed: !todo.completed }),
      })
      fetchTodos()
    } catch (err) {
      console.error('Error toggling todo:', err)
    }
  }

  const handleDelete = async (id) => {
    if (!confirm('このやることを削除しますか？')) return
    try {
      await fetch(`/api/todos?id=${id}`, { method: 'DELETE' })
      fetchTodos()
      showToast('削除しました')
    } catch (err) {
      console.error('Error deleting todo:', err)
    }
  }

  const clearCompleted = async () => {
    if (!confirm('完了したやることをすべて削除しますか？')) return
    try {
      await fetch('/api/todos?completed=1', { method: 'DELETE' })
      fetchTodos()
      showToast('完了分を削除しました')
    } catch (err) {
      console.error('Error clearing completed todos:', err)
    }
  }

  const activeTodos = useMemo(() => todos.filter((t) => !t.completed), [todos])
  const completedTodos = useMemo(() => todos.filter((t) => t.completed), [todos])
  const today = todayStr()

  const renderRow = (todo, index) => {
    const overdue = todo.due_date && !todo.completed && todo.due_date < today
    return (
      <motion.div
        key={todo.id}
        initial={{ opacity: 0, x: -10 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ delay: index * 0.03 }}
        className="flex items-center gap-3 py-3 border-b border-line last:border-0"
      >
        <button
          className={`check-circle ${todo.completed ? 'checked' : ''}`}
          onClick={() => toggleCompleted(todo)}
          aria-label={todo.completed ? '未完了に戻す' : '完了にする'}
        >
          {todo.completed ? <CheckIcon size={14} /> : null}
        </button>
        <button onClick={() => openEditForm(todo)} className="flex-1 min-w-0 text-left">
          <div
            className={`font-medium text-text-primary truncate ${
              todo.completed ? 'strike' : ''
            }`}
          >
            {todo.title}
          </div>
          <div className="text-xs text-text-secondary truncate">
            {todo.due_date && (
              <span className={overdue ? 'text-accent font-bold' : ''}>
                期限 {formatDue(todo.due_date)}{overdue ? '（過ぎています）' : ''}
              </span>
            )}
            {todo.due_date && todo.memo ? ' ・ ' : ''}
            {todo.memo || ''}
          </div>
        </button>
        <button
          onClick={() => handleDelete(todo.id)}
          className="text-text-secondary hover:text-accent p-2 flex-shrink-0"
          aria-label="削除"
        >
          <TrashIcon size={18} />
        </button>
      </motion.div>
    )
  }

  return (
    <div>
      {/* ヘッダー */}
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-2xl font-bold text-text-primary">やること</h1>
        <button
          onClick={() => (showForm ? setShowForm(false) : openAddForm())}
          className="flex items-center gap-1 btn-brand px-4 py-2.5 text-sm"
        >
          {showForm ? <CloseIcon size={16} /> : <PlusIcon size={16} />}
          {showForm ? '閉じる' : '追加'}
        </button>
      </div>

      <p className="text-sm text-text-secondary mb-4">
        買い物以外の用事もここにメモしておけます。行をタップすると編集できます。
      </p>

      {/* 登録・編集フォーム */}
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
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
                placeholder="やること"
                required
                className="text-input"
              />

              <div>
                <div className="text-sm text-text-secondary mb-1">期限（任意）</div>
                <input
                  type="date"
                  value={form.due_date}
                  onChange={(e) => setForm({ ...form, due_date: e.target.value })}
                  className="text-input"
                />
              </div>

              <input
                type="text"
                value={form.memo}
                onChange={(e) => setForm({ ...form, memo: e.target.value })}
                placeholder="メモ（任意）"
                className="text-input"
              />

              <button type="submit" className="btn-brand w-full py-3">
                {editingId ? '更新する' : '追加する'}
              </button>
            </form>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 空の状態 */}
      {todos.length === 0 && !showForm && (
        <div className="card text-center py-12">
          <div className="flex justify-center mb-3 text-text-secondary">
            <TodoIcon size={48} />
          </div>
          <h3 className="text-lg font-bold text-text-primary mb-1">やることはまだありません</h3>
          <p className="text-sm text-text-secondary">「追加」から用事を登録しましょう</p>
        </div>
      )}

      {/* 未完了リスト */}
      {activeTodos.length > 0 && (
        <div className="card px-3 mb-5">
          {activeTodos.map((todo, i) => renderRow(todo, i))}
        </div>
      )}

      {/* 完了リスト */}
      {completedTodos.length > 0 && (
        <div className="mb-6">
          <div className="flex items-center justify-between px-1 mb-2">
            <span className="text-sm font-bold text-text-secondary">
              完了したもの {completedTodos.length}件
            </span>
            <button
              onClick={clearCompleted}
              className="text-sm text-text-secondary border border-line rounded-full px-3 py-1 bg-bg-card"
            >
              完了分を消す
            </button>
          </div>
          <div className="card px-3">
            {completedTodos.map((todo, i) => renderRow(todo, i))}
          </div>
        </div>
      )}

      {/* トースト */}
      {toast && <div className="toast">{toast}</div>}
    </div>
  )
}
