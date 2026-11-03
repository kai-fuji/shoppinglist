// pages/api/push.js - プッシュ通知 API（VAPID 公開鍵の取得・購読の登録/更新/解除）
import {
  savePushSubscription,
  updatePushSubscriptionTime,
  deletePushSubscription,
} from '../../lib/db'
import { ensurePushScheduler, getVapidKeys } from '../../lib/push'

// この API モジュールが読み込まれた時点でリマインダースケジューラを開始
ensurePushScheduler()

export default async function handler(req, res) {
  try {
    // =========================
    // GET: VAPID 公開鍵
    // =========================
    if (req.method === 'GET') {
      const keys = await getVapidKeys()
      if (!keys) {
        return res.status(500).json({
          error: 'web-push が未インストールです。npm install を実行してください。',
        })
      }
      return res.status(200).json({ publicKey: keys.publicKey })
    }

    // =========================
    // POST: 購読の登録
    // =========================
    if (req.method === 'POST') {
      const { subscription, time } = req.body || {}
      if (!subscription || !subscription.endpoint || !subscription.keys) {
        return res.status(400).json({ error: 'subscription が必要です' })
      }
      await savePushSubscription(subscription, time || '18:00')
      return res.status(200).json({ message: 'プッシュ通知を登録しました' })
    }

    // =========================
    // PUT: 通知時刻の更新
    // =========================
    if (req.method === 'PUT') {
      const { endpoint, time } = req.body || {}
      if (!endpoint || !time) {
        return res.status(400).json({ error: 'endpoint と time が必要です' })
      }
      await updatePushSubscriptionTime(endpoint, time)
      return res.status(200).json({ message: '通知時刻を更新しました' })
    }

    // =========================
    // DELETE: 購読の解除
    // =========================
    if (req.method === 'DELETE') {
      const { endpoint } = req.body || {}
      if (!endpoint) {
        return res.status(400).json({ error: 'endpoint が必要です' })
      }
      await deletePushSubscription(endpoint)
      return res.status(200).json({ message: 'プッシュ通知を解除しました' })
    }

    return res.status(405).json({ error: 'Method Not Allowed' })
  } catch (error) {
    console.error('Push API Error:', error)
    return res.status(500).json({ error: 'サーバーエラー', detail: error.message })
  }
}