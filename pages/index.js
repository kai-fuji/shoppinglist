// pages/index.js - 買い物リスト（メイン画面）
import { useState, useEffect, useCallback, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  BellIcon,
  PencilIcon,
  AppleIcon,
  CheckIcon,
  ChevronDownIcon,
  ChevronUpIcon,
  LinkIcon,
  MemoIcon,
  TrashIcon,
} from '../components/Icons'
import { itemEmoji } from '../lib/emoji'

const todayStr = () => {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

export default function ShoppingList() {
  const [items, setItems] = useState([])
  const [stores, setStores] = useState([])
  const [categories, setCategories] = useState([])
  const [storeFilter, setStoreFilter] = useState('すべて')
  const [groupByStore, setGroupByStore] = useState(true) // 売り順
  const [todayOpen, setTodayOpen] = useState(false)
  const [collapsedStores, setCollapsedStores] = useState({})

  // 追加シート
  const [showSheet, setShowSheet] = useState(false)
  const [sheetItems, setSheetItems] = useState([]) // 今回の入力セッションで追加した商品
  const [sheetName, setSheetName] = useState('')
  const [sheetStore, setSheetStore] = useState('')
  const [sheetCategory, setSheetCategory] = useState('')
  const [sheetMemo, setSheetMemo] = useState('')
  const [showMemo, setShowMemo] = useState(false)
  // 購入アニメーション中の商品ID（取り消し線を表示している間）
  const [completingIds, setCompletingIds] = useState([])
  // 通知設定
  const [showNotifSheet, setShowNotifSheet] = useState(false)
  const [notifEnabled, setNotifEnabled] = useState(false)
  const [notifTime, setNotifTime] = useState('18:00')
  // プッシュ通知（アプリを閉じていても届く方）
  const [pushEnabled, setPushEnabled] = useState(false)

  // データ取得
  const fetchItems = useCallback(async () => {
    try {
      const res = await fetch('/api/items')
      const json = await res.json()
      setItems(Array.isArray(json) ? json : [])
    } catch (e) {
      console.error('Error fetching items:', e)
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

  // 通知設定の読み込み（localStorage）
  useEffect(() => {
    try {
      const saved = JSON.parse(localStorage.getItem('shopping-notif') || '{}')
      if (saved.enabled) setNotifEnabled(true)
      if (saved.time) setNotifTime(saved.time)
    } catch (e) {
      // 破損時はデフォルト値を使用
    }
  }, [])

  // 通知設定の保存
  useEffect(() => {
    localStorage.setItem(
      'shopping-notif',
      JSON.stringify({ enabled: notifEnabled, time: notifTime })
    )
  }, [notifEnabled, notifTime])

  // サービスワーカー登録（プッシュ通知用）
  useEffect(() => {
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('/sw.js').catch(() => {})
    }
  }, [])

  // 既にプッシュ購読済みかどうかを確認
  useEffect(() => {
    if ('serviceWorker' in navigator && 'PushManager' in window) {
      navigator.serviceWorker
        .ready
        .then((reg) => reg.pushManager.getSubscription())
        .then((sub) => setPushEnabled(!!sub))
        .catch(() => {})
    }
  }, [])

  // リマインダー：指定時刻に1日1回だけ通知
  useEffect(() => {
    if (!notifEnabled) return
    const tick = () => {
      const now = new Date()
      const hhmm = `${String(now.getHours()).padStart(2, '0')}:${String(
        now.getMinutes()
      ).padStart(2, '0')}`
      const today = todayStr()
      if (
        hhmm === notifTime &&
        !pushEnabled &&
        localStorage.getItem('shopping-notif-last') !== today
      ) {
        localStorage.setItem('shopping-notif-last', today)
        const count = items.filter((i) => !i.purchased).length
        if (
          typeof Notification !== 'undefined' &&
          Notification.permission === 'granted' &&
          count > 0
        ) {
          new Notification('お買い物リスト', {
            body: `未購入のアイテムが${count}件あります 🛒`,
          })
        }
      }
    }
    tick()
    const timer = setInterval(tick, 20000)
    return () => clearInterval(timer)
  }, [notifEnabled, notifTime, items, pushEnabled])

  // 通知オン/オフ（初回オン時にブラウザへ許可を要求）
  const toggleNotif = async () => {
    if (!notifEnabled) {
      if (typeof Notification === 'undefined') {
        alert('このブラウザは通知に対応していません')
        return
      }
      const perm = await Notification.requestPermission()
      if (perm !== 'granted') {
        alert('通知が許可されませんでした。ブラウザの設定で許可してください')
        return
      }
    }
    setNotifEnabled(!notifEnabled)
  }

  // ===== プッシュ通知（アプリを閉じていても届く） =====
  const urlBase64ToUint8Array = (base64String) => {
    const padding = '='.repeat((4 - (base64String.length % 4)) % 4)
    const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/')
    const raw = window.atob(base64)
    const arr = new Uint8Array(raw.length)
    for (let i = 0; i < raw.length; i++) arr[i] = raw.charCodeAt(i)
    return arr
  }

  const togglePush = async () => {
    try {
      if (!pushEnabled) {
        const reg = await navigator.serviceWorker.ready
        const keyRes = await fetch('/api/push')
        const { publicKey, error } = await keyRes.json()
        if (!publicKey) {
          alert(error || 'プッシュ通知を有効にできませんでした')
          return
        }
        const sub = await reg.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: urlBase64ToUint8Array(publicKey),
        })
        await fetch('/api/push', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ subscription: sub.toJSON(), time: notifTime }),
        })
        setPushEnabled(true)
      } else {
        const reg = await navigator.serviceWorker.ready
        const sub = await reg.pushManager.getSubscription()
        if (sub) {
          await fetch('/api/push', {
            method: 'DELETE',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ endpoint: sub.endpoint }),
          })
          sub.unsubscribe()
        }
        setPushEnabled(false)
      }
    } catch (e) {
      alert(
        'プッシュ通知を有効にできませんでした。HTTPSでアクセスしているか、通知が許可されているかご確認ください'
      )
    }
  }

  const updatePushTime = async (time) => {
    try {
      const reg = await navigator.serviceWorker.ready
      const sub = await reg.pushManager.getSubscription()
      if (!sub) return
      await fetch('/api/push', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ endpoint: sub.endpoint, time }),
      })
    } catch (e) {
      // 失敗してもアプリ内通知は継続
    }
  }

  // ===== 派生データ =====
  const activeItems = useMemo(() => items.filter((i) => !i.purchased), [items])
  const todayPurchased = useMemo(
    () => items.filter((i) => i.purchased && i.purchased_date === todayStr()),
    [items]
  )

  const filteredItems = useMemo(() => {
    if (storeFilter === 'すべて') return activeItems
    if (storeFilter === '未設定') return activeItems.filter((i) => !i.store)
    return activeItems.filter((i) => i.store === storeFilter)
  }, [activeItems, storeFilter])

  // 売り順：購入先 → カテゴリーでグループ化
  const grouped = useMemo(() => {
    if (!groupByStore) return null
    const storeOrder = stores.filter((s) => filteredItems.some((i) => i.store === s))
    const hasNoStore = filteredItems.some((i) => !i.store)
    const storeList = [...storeOrder, ...(hasNoStore ? ['未設定'] : [])]

    return storeList.map((store) => {
      const storeItems =
        store === '未設定'
          ? filteredItems.filter((i) => !i.store)
          : filteredItems.filter((i) => i.store === store)

      const catOrder = categories.filter((c) => storeItems.some((i) => i.category === c))
      const hasNoCat = storeItems.some((i) => !i.category)
      const catList = [...catOrder, ...(hasNoCat ? ['未分類'] : [])]

      const catGroups = catList.map((cat) => ({
        category: cat,
        items:
          cat === '未分類'
            ? storeItems.filter((i) => !i.category)
            : storeItems.filter((i) => i.category === cat),
      }))

      return { store, catGroups }
    })
  }, [groupByStore, filteredItems, stores, categories])

  // ===== アクション =====
  const markPurchased = async (item) => {
    try {
      await fetch('/api/items', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: item.id,
          purchased: true,
          purchased_date: todayStr(),
        }),
      })
      fetchItems()
    } catch (e) {
      console.error('Error marking purchased:', e)
    }
  }

  const unmarkPurchased = async (item) => {
    try {
      await fetch('/api/items', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: item.id,
          purchased: false,
          purchased_date: null,
        }),
      })
      fetchItems()
    } catch (e) {
      console.error('Error unmarking purchased:', e)
    }
  }

  // 購入チェック：取り消し線アニメーションを見せてからリストから消す
  const togglePurchased = (item) => {
    if (item.purchased) {
      // 「今日買ったもの」からのチェック外しは即時
      unmarkPurchased(item)
      return
    }
    if (completingIds.includes(item.id)) return
    setCompletingIds((prev) => [...prev, item.id])
    setTimeout(() => {
      markPurchased(item)
      setCompletingIds((prev) => prev.filter((id) => id !== item.id))
    }, 650)
  }

  const deleteItem = async (id) => {
    try {
      await fetch(`/api/items?id=${id}`, { method: 'DELETE' })
      fetchItems()
    } catch (e) {
      console.error('Error deleting item:', e)
    }
  }

  const openSheet = () => {
    setSheetName('')
    setSheetStore('')
    setSheetCategory('')
    setSheetMemo('')
    setShowMemo(false)
    setShowSheet(true)
  }

  const addFromSheet = async () => {
    const name = sheetName.trim()
    if (!name) return
    try {
      await fetch('/api/items', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, store: sheetStore, category: sheetCategory, memo: sheetMemo }),
      })
      // 追加済みリストを更新して表示
      const listRes = await fetch('/api/items')
      const list = await listRes.json()
      setSheetItems(list.filter((i) => !i.purchased).slice(-20))
      setSheetName('')
      setSheetMemo('')
      setShowMemo(false)
      fetchItems()
    } catch (e) {
      console.error('Error adding item:', e)
    }
  }

  const undoSheetItem = async (id) => {
    await deleteItem(id)
    setSheetItems((prev) => prev.filter((i) => i.id !== id))
  }

  const searchWeb = () => {
    const query = filteredItems.map((i) => i.name).join(' ')
    if (!query) return
    window.open(`https://www.google.com/search?tbm=shop&q=${encodeURIComponent(query)}`, '_blank')
  }

  const toggleStoreCollapse = (store) => {
    setCollapsedStores((prev) => ({ ...prev, [store]: !prev[store] }))
  }

  // ===== 商品行 =====
  const ItemRow = ({ item }) => {
    const completing = completingIds.includes(item.id)
    return (
      <motion.div
        initial={{ opacity: 0, height: 0 }}
        animate={{ opacity: 1, height: 'auto' }}
        exit={{ opacity: 0, height: 0 }}
        transition={{ duration: 0.25 }}
        className="overflow-hidden"
      >
        <div className="flex items-center gap-3 py-3 px-1 border-b border-line last:border-0">
          <div className="w-10 h-10 rounded-xl bg-bg-card-soft flex items-center justify-center text-xl flex-shrink-0">
            {itemEmoji(item.category, item.name)}
          </div>
          <div className="flex-1 min-w-0">
            <div
              className={`font-medium text-text-primary truncate ${
                completing ? 'strike' : ''
              }`}
            >
              {item.name}
            </div>
            {item.memo && (
              <div className="text-xs text-text-secondary truncate">📝 {item.memo}</div>
            )}
          </div>
          <button
            onClick={() => deleteItem(item.id)}
            className="text-text-secondary hover:text-accent transition-colors flex-shrink-0 p-1"
            aria-label={`${item.name}を削除`}
          >
            <TrashIcon size={18} />
          </button>
          <button
            className={`check-circle ${completing ? 'checked' : ''}`}
            onClick={() => togglePurchased(item)}
            aria-label="購入済みにする"
          >
            {completing && <CheckIcon size={14} />}
          </button>
        </div>
      </motion.div>
    )
  }

  return (
    <div>
      {/* ヘッダー */}
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-2xl font-bold text-text-primary">買い物リスト</h1>
        <button
          onClick={() => setShowNotifSheet(true)}
          className="text-text-primary relative"
          aria-label="通知設定"
        >
          <BellIcon size={22} />
          {notifEnabled && (
            <span className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full bg-accent" />
          )}
        </button>
      </div>

      {/* 購入先フィルター */}
      <div className="flex items-center gap-3 mb-4">
        <span className="text-sm text-text-secondary flex-shrink-0">購入先</span>
        <div className="flex gap-2 overflow-x-auto no-scrollbar py-1">
          {['すべて', ...stores, '未設定'].map((s) => (
            <button
              key={s}
              onClick={() => setStoreFilter(s)}
              className={`chip ${storeFilter === s ? 'chip-active' : ''}`}
            >
              {s}
            </button>
          ))}
        </div>
      </div>

      {/* 売り順トグル */}
      <div className="flex justify-end items-center gap-2 mb-3">
        <span className="text-sm text-text-secondary">売り順</span>
        <button
          className={`switch ${groupByStore ? 'on' : ''}`}
          onClick={() => setGroupByStore(!groupByStore)}
          aria-label="売り順"
        >
          <span className="switch-knob" />
        </button>
      </div>

      {/* ネットで探すバー */}
      {filteredItems.length > 0 && (
        <div className="card flex items-center justify-between px-4 py-3 mb-4">
          <div className="flex items-center gap-2 text-text-primary">
            <LinkIcon size={18} />
            <span className="font-medium">ネットで探す</span>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-sm text-text-secondary">{filteredItems.length}件</span>
            <button
              onClick={searchWeb}
              className="text-sm font-medium text-text-primary border border-line rounded-full px-4 py-1.5 hover:bg-bg-card-soft transition-colors"
            >
              すべて見る
            </button>
          </div>
        </div>
      )}

      {/* 空の状態 */}
      {filteredItems.length === 0 && (
        <div className="text-center py-16">
          <div className="flex justify-center mb-4 text-text-primary">
            <AppleIcon size={56} strokeWidth={1.5} />
          </div>
          <h3 className="text-lg font-bold text-text-primary mb-2">今回買う物を入れましょう</h3>
          <p className="text-sm text-text-secondary leading-relaxed">
            定期購入品から「リストへ」を押した品もここに入ります。
          </p>
        </div>
      )}

      {/* 商品リスト（売り順グループ化） */}
      {grouped && grouped.map(({ store, catGroups }) => (
        <div key={store} className="mb-5">
          <button
            onClick={() => toggleStoreCollapse(store)}
            className="flex items-center gap-2 mb-2 text-text-primary"
          >
            <span className="text-lg font-bold">{store === '未設定' ? '購入先未設定' : store}</span>
            {collapsedStores[store] ? <ChevronDownIcon size={18} /> : <ChevronUpIcon size={18} />}
          </button>

          <AnimatePresence initial={false}>
            {!collapsedStores[store] && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="overflow-hidden"
              >
                {catGroups.map(({ category, items: catItems }) => (
                  <div key={category} className="mb-3">
                    <div className="text-sm text-text-secondary px-1 mb-1">
                      {category === '未分類' ? 'カテゴリー未設定' : category}
                    </div>
                    <div className="card px-3">
                      <AnimatePresence initial={false}>
                        {catItems.map((item) => (
                          <ItemRow key={item.id} item={item} />
                        ))}
                      </AnimatePresence>
                    </div>
                  </div>
                ))}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      ))}

      {/* 商品リスト（フラット表示） */}
      {!groupByStore && filteredItems.length > 0 && (
        <div className="card px-3 mb-5">
          <AnimatePresence initial={false}>
            {filteredItems.map((item) => (
              <ItemRow key={item.id} item={item} />
            ))}
          </AnimatePresence>
        </div>
      )}

      {/* 今日買ったもの */}
      {todayPurchased.length > 0 && (
        <div className="mb-6">
          <button
            onClick={() => setTodayOpen(!todayOpen)}
            className={`w-full flex items-center justify-between px-4 py-3 rounded-2xl transition-colors ${
              todayOpen ? 'bg-success-soft' : 'bg-success'
            }`}
          >
            <span className={`font-bold ${todayOpen ? 'text-success' : 'text-white'}`}>
              ✓ 今日買ったもの {todayPurchased.length}件
            </span>
            {todayOpen ? (
              <ChevronUpIcon size={18} className="text-success" />
            ) : (
              <ChevronDownIcon size={18} className="text-white" />
            )}
          </button>

          <AnimatePresence initial={false}>
            {todayOpen && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="overflow-hidden"
              >
                <div className="card px-3 mt-2">
                  {todayPurchased.map((item) => (
                    <div key={item.id} className="flex items-center gap-3 py-3 px-1 border-b border-line last:border-0">
                      <div className="w-10 h-10 rounded-xl bg-bg-card-soft flex items-center justify-center text-xl flex-shrink-0">
                        {itemEmoji(item.category, item.name)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="font-medium text-text-primary truncate">{item.name}</div>
                      </div>
                      <button
                        onClick={() => togglePurchased(item)}
                        className="check-circle checked"
                        aria-label="購入済みを取り消す"
                      >
                        <CheckIcon size={14} />
                      </button>
                    </div>
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      )}

      {/* 下部の追加ボタン（下部タブナビと重ならない位置に固定） */}
      <div
        className="fixed left-0 right-0 z-30 pointer-events-none"
        style={{ bottom: 'calc(6.5rem + env(safe-area-inset-bottom))' }}
      >
        <div className="max-w-md mx-auto flex justify-center px-4">
          <button
            onClick={openSheet}
            className="pointer-events-auto btn-brand flex items-center gap-2 px-6 py-3 shadow-float"
          >
            <PencilIcon size={18} />
            入力して追加
          </button>
        </div>
      </div>

      {/* 追加シート */}
      <AnimatePresence>
        {showSheet && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="sheet-overlay"
              onClick={() => setShowSheet(false)}
            />
            <motion.div
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'tween', duration: 0.25 }}
              className="sheet"
            >
              <div className="px-4 pt-4">
                {/* シートヘッダー */}
                <div className="flex justify-between items-center mb-3">
                  <button onClick={() => setShowSheet(false)} className="chip">
                    閉じる
                  </button>
                  <span className="text-sm text-text-secondary font-medium">
                    入力して追加 {sheetItems.length}品入れました
                  </span>
                  <div className="w-16" />
                </div>

                {/* 今回追加した商品 */}
                {sheetItems.length > 0 && (
                  <div className="card px-3 mb-4 max-h-56 overflow-y-auto">
                    {sheetItems.map((item) => (
                      <div key={item.id} className="flex items-center gap-3 py-2.5 border-b border-line last:border-0">
                        <div className="w-9 h-9 rounded-lg bg-bg-card-soft flex items-center justify-center text-lg flex-shrink-0">
                          {itemEmoji(item.category, item.name)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="font-medium text-text-primary truncate">{item.name}</div>
                          <div className="text-xs text-text-secondary">{item.store || '未設定'}</div>
                        </div>
                        <button
                          onClick={() => undoSheetItem(item.id)}
                          className="text-sm text-text-secondary border border-line rounded-full px-3 py-1 hover:bg-bg-card-soft"
                        >
                          取り消す
                        </button>
                      </div>
                    ))}
                  </div>
                )}

                {/* 購入先チップ */}
                <div className="flex items-center gap-3 mb-3">
                  <span className="text-sm text-text-secondary flex-shrink-0">購入先</span>
                  <div className="flex gap-2 overflow-x-auto no-scrollbar py-1">
                    {[...stores, '未設定'].map((s) => (
                      <button
                        key={s}
                        onClick={() => setSheetStore(s === '未設定' ? '' : s)}
                        className={`chip ${
                          (s === '未設定' && !sheetStore) || sheetStore === s ? 'chip-active' : ''
                        }`}
                      >
                        {s}
                      </button>
                    ))}
                  </div>
                </div>

                {/* カテゴリーチップ */}
                <div className="flex items-center gap-3 mb-3">
                  <span className="text-sm text-text-secondary flex-shrink-0">分類</span>
                  <div className="flex gap-2 overflow-x-auto no-scrollbar py-1">
                    {categories.map((c) => (
                      <button
                        key={c}
                        onClick={() => setSheetCategory(sheetCategory === c ? '' : c)}
                        className={`chip chip-sm ${sheetCategory === c ? 'chip-active' : ''}`}
                      >
                        {c}
                      </button>
                    ))}
                  </div>
                </div>

                {/* 商品名入力 */}
                <div className="flex items-center gap-2 mb-3">
                  <div className="flex-1">
                    <input
                      type="text"
                      value={sheetName}
                      onChange={(e) => setSheetName(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && addFromSheet()}
                      placeholder="商品名"
                      autoFocus
                      className="text-input"
                    />
                  </div>
                  <button
                    onClick={() => setShowMemo(!showMemo)}
                    className={`flex items-center gap-1 border-2 border-text-primary rounded-full px-4 py-2.5 text-sm font-bold transition-colors ${
                      showMemo ? 'bg-text-primary text-white' : 'text-text-primary bg-transparent'
                    }`}
                  >
                    <MemoIcon size={16} />
                    メモ
                  </button>
                  <button
                    onClick={addFromSheet}
                    disabled={!sheetName.trim()}
                    className="btn-brand px-5 py-2.5 text-sm"
                  >
                    追加
                  </button>
                </div>

                {/* メモ入力 */}
                <AnimatePresence>
                  {showMemo && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      className="overflow-hidden"
                    >
                      <input
                        type="text"
                        value={sheetMemo}
                        onChange={(e) => setSheetMemo(e.target.value)}
                        placeholder="メモ（例：2個、特売など）"
                        className="text-input mb-3"
                      />
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* 通知設定シート */}
      <AnimatePresence>
        {showNotifSheet && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="sheet-overlay"
              onClick={() => setShowNotifSheet(false)}
            />
            <motion.div
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'tween', duration: 0.25 }}
              className="sheet"
            >
              <div className="px-4 pt-4">
                <div className="flex justify-between items-center mb-4">
                  <h2 className="text-lg font-bold text-text-primary">通知設定</h2>
                  <button onClick={() => setShowNotifSheet(false)} className="chip">
                    閉じる
                  </button>
                </div>

                <div className="card p-4 mb-3">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <div className="font-bold text-text-primary">お買い物リマインダー</div>
                      <div className="text-xs text-text-secondary mt-1">
                        指定した時刻に、未購入アイテム数を通知します
                      </div>
                    </div>
                    <button
                      className={`switch ${notifEnabled ? 'on' : ''}`}
                      onClick={toggleNotif}
                      aria-label="通知のオンオフ"
                    >
                      <span className="switch-knob" />
                    </button>
                  </div>

                  <div className="flex items-center justify-between mt-4">
                    <span className="text-sm text-text-secondary">通知時刻</span>
                    <input
                      type="time"
                      value={notifTime}
                      onChange={(e) => {
                        setNotifTime(e.target.value)
                        if (pushEnabled) updatePushTime(e.target.value)
                      }}
                      disabled={!notifEnabled && !pushEnabled}
                      className="text-input w-32 text-center"
                    />
                  </div>
                </div>

                <div className="card p-4 mb-3">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <div className="font-bold text-text-primary">プッシュ通知（閉じていてもOK）</div>
                      <div className="text-xs text-text-secondary mt-1">
                        上と同じ時刻に、ホーム画面のアプリへ通知します
                      </div>
                    </div>
                    <button
                      className={`switch ${pushEnabled ? 'on' : ''}`}
                      onClick={togglePush}
                      aria-label="プッシュ通知のオンオフ"
                    >
                      <span className="switch-knob" />
                    </button>
                  </div>
                </div>

                <p className="text-xs text-text-secondary leading-relaxed px-1 pb-2">
                  ※ 上のリマインダーはアプリを開いている間、下のプッシュ通知はアプリを閉じていても届きます（アプリのサーバー（PC）が起動している間に送信されます）。プッシュ通知には HTTPS 接続が必要です。
                </p>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  )
}
