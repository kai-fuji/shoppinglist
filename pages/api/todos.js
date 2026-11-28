// pages/api/todos.js - やることリスト API
import {
  getTodos,
  addTodo,
  updateTodo,
  deleteTodo,
  deleteCompletedTodos
} from '../../lib/db'

export default async function handler(req, res) {
  try {
    // =========================
    // GET: 全件取得
    // =========================
    if (req.method === 'GET') {
      const todos = await getTodos()
      return res.status(200).json(todos)
    }

    // =========================
    // POST: 追加
    // =========================
    if (req.method === 'POST') {
      const { title, memo, due_date } = req.body
      if (!title || !title.trim()) {
        return res.status(400).json({ error: 'タイトルが必要です' })
      }
      await addTodo(title.trim(), memo || '', due_date || '')
      return res.status(200).json({ message: '追加しました' })
    }

    // =========================
    // PUT: 更新（完了チェック・編集）
    // =========================
    if (req.method === 'PUT') {
      const { id, ...fields } = req.body
      if (!id) {
        return res.status(400).json({ error: 'idが必要です' })
      }
      if (fields.completed !== undefined) {
        fields.completed = fields.completed ? 1 : 0
      }
      await updateTodo(id, fields)
      return res.status(200).json({ message: '更新しました' })
    }

    // =========================
    // DELETE: 削除
    // =========================
    if (req.method === 'DELETE') {
      const url = new URL(req.url, 'http://localhost')
      const id = url.searchParams.get('id')
      const completed = url.searchParams.get('completed')

      if (id) {
        await deleteTodo(Number(id))
      } else if (completed === '1') {
        await deleteCompletedTodos()
      } else {
        return res.status(400).json({ error: 'id, completed のいずれかが必要です' })
      }
      return res.status(200).json({ message: '削除しました' })
    }

    return res.status(405).json({ error: 'Method Not Allowed' })
  } catch (error) {
    console.error('Todos API Error:', error)
    return res.status(500).json({ error: 'サーバーエラー', detail: error.message })
  }
}
