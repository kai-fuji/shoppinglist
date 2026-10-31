// pages/api/items.js - 買い物リスト API
import {
  getShoppingItems,
  addShoppingItem,
  updateShoppingItem,
  deleteShoppingItem,
  deletePurchasedItems,
  deleteAllShoppingItems
} from '../../lib/db'

export default async function handler(req, res) {
  try {
    // =========================
    // GET: 全件取得
    // =========================
    if (req.method === 'GET') {
      const items = await getShoppingItems()
      return res.status(200).json(items)
    }

    // =========================
    // POST: 追加（単品 or 複数）
    // =========================
    if (req.method === 'POST') {
      const body = req.body
      const list = Array.isArray(body) ? body : [body]

      for (const item of list) {
        if (!item.name || !item.name.trim()) continue
        await addShoppingItem(
          item.name.trim(),
          item.store || '',
          item.category || '',
          item.memo || ''
        )
      }
      return res.status(200).json({ message: '追加しました' })
    }

    // =========================
    // PUT: 更新（購入済みチェック・編集）
    // =========================
    if (req.method === 'PUT') {
      const { id, ...fields } = req.body
      if (!id) {
        return res.status(400).json({ error: 'idが必要です' })
      }
      await updateShoppingItem(id, fields)
      return res.status(200).json({ message: '更新しました' })
    }

    // =========================
    // DELETE: 削除
    // =========================
    if (req.method === 'DELETE') {
      const url = new URL(req.url, 'http://localhost')
      const id = url.searchParams.get('id')
      const purchased = url.searchParams.get('purchased')
      const all = url.searchParams.get('all')

      if (id) {
        await deleteShoppingItem(Number(id))
      } else if (purchased === '1') {
        // 購入済みの履歴を削除
        await deletePurchasedItems()
      } else if (all === '1') {
        // 全データ削除
        await deleteAllShoppingItems()
      } else {
        return res.status(400).json({ error: 'id, purchased, all のいずれかが必要です' })
      }
      return res.status(200).json({ message: '削除しました' })
    }

    return res.status(405).json({ error: 'Method Not Allowed' })
  } catch (error) {
    console.error('Items API Error:', error)
    return res.status(500).json({ error: 'サーバーエラー', detail: error.message })
  }
}
