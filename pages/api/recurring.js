// pages/api/recurring.js - 定期購入品 API
import {
  getRecurringItems,
  addRecurringItem,
  updateRecurringItem,
  deleteRecurringItem
} from '../../lib/db'

export default async function handler(req, res) {
  try {
    // =========================
    // GET: 全件取得
    // =========================
    if (req.method === 'GET') {
      const items = await getRecurringItems()
      return res.status(200).json(items)
    }

    // =========================
    // POST: 追加
    // =========================
    if (req.method === 'POST') {
      const { name, store, category, memo } = req.body
      if (!name || !name.trim()) {
        return res.status(400).json({ error: '商品名が必要です' })
      }
      await addRecurringItem(name.trim(), store || '', category || '', memo || '')
      return res.status(200).json({ message: '追加しました' })
    }

    // =========================
    // PUT: 更新
    // =========================
    if (req.method === 'PUT') {
      const { id, name, store, category, memo } = req.body
      if (!id || !name || !name.trim()) {
        return res.status(400).json({ error: 'idと商品名が必要です' })
      }
      await updateRecurringItem(id, name.trim(), store || '', category || '', memo || '')
      return res.status(200).json({ message: '更新しました' })
    }

    // =========================
    // DELETE: 削除
    // =========================
    if (req.method === 'DELETE') {
      const url = new URL(req.url, 'http://localhost')
      const id = url.searchParams.get('id')
      if (!id) {
        return res.status(400).json({ error: 'idが必要です' })
      }
      await deleteRecurringItem(Number(id))
      return res.status(200).json({ message: '削除しました' })
    }

    return res.status(405).json({ error: 'Method Not Allowed' })
  } catch (error) {
    console.error('Recurring API Error:', error)
    return res.status(500).json({ error: 'サーバーエラー', detail: error.message })
  }
}
