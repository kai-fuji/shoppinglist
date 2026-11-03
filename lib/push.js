// lib/push.js - Web Push (VAPID) 送信・スケジューラ
import {
  getSettings,
  updateSetting,
  getShoppingItems,
  getPushSubscriptions,
  updatePushSubscriptionSent,
  deletePushSubscription,
} from './db'

let _webpush = null // null: 未ロード / false: 未インストール / オブジェクト: 利用可

// web-push を optional で読み込む（未インストールでもアプリ全体は動く）
async function loadWebPush() {
  if (_webpush !== null) return _webpush
  try {
    // webpackIgnore でバンドル時の静的解決を回避し、実行時に node_modules から解決
    const mod = await import(/* webpackIgnore: true */ 'web-push')
    _webpush = mod.default || mod
  } catch (e) {
    console.warn('[push] web-push が未インストールです。npm install 後にプッシュ通知が有効になります。')
    _webpush = false
  }
  return _webpush
}

// VAPID 鍵ペア（初回自動生成して app_settings に保存）
export async function getVapidKeys() {
  const webpush = await loadWebPush()
  if (!webpush) return null
  const settings = await getSettings()
  if (settings.vapid && settings.vapid.publicKey && settings.vapid.privateKey) {
    return settings.vapid
  }
  const keys = webpush.generateVAPIDKeys()
  await updateSetting('vapid', keys)
  console.log('[push] VAPID 鍵を生成しました')
  return keys
}

const hhmmNow = () => {
  const d = new Date()
  return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`
}

const dateStr = () => {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

// サーバー起動中に毎分チェックし、各端末の設定時刻にプッシュ通知を送る
export function ensurePushScheduler() {
  if (globalThis.__shoppingPushScheduler) return
  globalThis.__shoppingPushScheduler = true

  loadWebPush().then((webpush) => {
    if (!webpush) return

    const tick = async () => {
      try {
        const subs = await getPushSubscriptions()
        if (!subs || subs.length === 0) return
        const targets = subs.filter((s) => s.remind_time === hhmmNow())
        if (targets.length === 0) return

        const keys = await getVapidKeys()
        webpush.setVapidDetails('mailto:shopping-list@localhost', keys.publicKey, keys.privateKey)

        const today = dateStr()
        const items = await getShoppingItems()
        const count = items.filter((i) => !Number(i.purchased)).length
        const body =
          count > 0 ? `未購入のアイテムが${count}件あります 🛒` : 'お買い物リストを確認しましょう 🛒'

        for (const s of targets) {
          if (s.last_sent_date === today) continue
          try {
            await webpush.sendNotification(
              { endpoint: s.endpoint, keys: { p256dh: s.p256dh, auth: s.auth } },
              JSON.stringify({ title: 'お買い物リスト', body })
            )
            await updatePushSubscriptionSent(s.id, today)
          } catch (e) {
            // 404/410 は購読期限切れ → 削除
            if (e && (e.statusCode === 404 || e.statusCode === 410)) {
              await deletePushSubscription(s.endpoint)
            } else {
              console.error('[push] send error:', e.message)
            }
          }
        }
      } catch (e) {
        console.error('[push] scheduler error:', e.message)
      }
    }

    setInterval(tick, 30000)
    tick()
  })
}