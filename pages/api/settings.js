// pages/api/settings.js - アプリ設定 API（購入先・カテゴリーのマスター）
import { getSettings, updateSetting } from '../../lib/db'

const ALLOWED_KEYS = ['stores', 'categories']

export default async function handler(req, res) {
  try {
    // =========================
    // GET: 設定取得
    // =========================
    if (req.method === 'GET') {
      const settings = await getSettings()
      return res.status(200).json({
        stores: settings.stores || [],
        categories: settings.categories || []
      })
    }

    // =========================
    // PUT: 設定更新
    // =========================
    if (req.method === 'PUT') {
      const { key, value } = req.body
      if (!ALLOWED_KEYS.includes(key) || !Array.isArray(value)) {
        return res.status(400).json({ error: 'key(stores|categories)と配列のvalueが必要です' })
      }
      await updateSetting(key, value)
      return res.status(200).json({ message: '更新しました' })
    }

    return res.status(405).json({ error: 'Method Not Allowed' })
  } catch (error) {
    console.error('Settings API Error:', error)
    return res.status(500).json({ error: 'サーバーエラー', detail: error.message })
  }
}
