// pages/index.js - 買い物リスト（メイン画面）
import { useState, useEffect, useCallback, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  BellIcon,
  SlidersIcon,
  MicIcon,
  PencilIcon,
  AppleIcon,
  CheckIcon,
  ChevronDownIcon,
  ChevronUpIcon,
  LinkIcon,
  MemoIcon,
} from '../components/Icons'
import useSpeechRecognition from '../components/useSpeechRecognition'

// カテゴリーごとの表示絵文字
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

  // 音声認識（シート外の「話して追加」）
  const voiceAdd = useSpeechRecognition({
    onResult: (text) => {
      setSheetName(text)
      setShowSheet(true)
    },
  })
  // 音声認識（シート内の入力欄マイク）
  const voiceSheet = useSpeechRecognition({
    onResult: (text) => setSheetName(text),
  })

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
  const togglePurchased = async (item) => {
    try {
      const purchased = !item.purchased
      await fetch('/api/items', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: item.id,
          purchased,
          purchased_date: purchased ? todayStr() : null,
        }),
      })
      fetchItems()
    } catch (e) {
      console.error('Error toggling purchased:', e)
    }
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
  const ItemRow = ({ item }) => (
    <div className="flex items-center gap-3 py-3 px-1 border-b border-line last:border-0">
      <div className="w-10 h-10 rounded-xl bg-bg-card-soft flex items-center justify-center text-xl flex-shrink-0">
        {itemEmoji(item.category)}
      </div>
      <div className="flex-1 min-w-0">
        <div className="font-medium text-text-primary truncate">{item.name}</div>
        {item.memo && (
          <div className="text-xs text-text-secondary truncate">📝 {item.memo}</div>
        )}
      </div>
      <button
        className="check-circle"
        onClick={() => togglePurchased(item)}
        aria-label="購入済みにする"
      />
    </div>
  )

  return (
    <div>
      {/* ヘッダー */}
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-2xl font-bold text-text-primary">買い物リスト</h1>
        <div className="flex items-center gap-4 text-text-primary">
          <button aria-label="通知">
            <BellIcon size={22} />
          </button>
          <button aria-label="表示設定">
            <SlidersIcon size={22} />
          </button>
        </div>
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
                      {catItems.map((item) => (
                        <ItemRow key={item.id} item={item} />
                      ))}
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
          {filteredItems.map((item) => (
            <ItemRow key={item.id} item={item} />
          ))}
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
                        {itemEmoji(item.category)}
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

      {/* 下部の追加ボタン */}
      <div className="fixed bottom-24 left-0 right-0 z-30 pointer-events-none">
        <div className="max-w-md mx-auto flex justify-center gap-3 px-4">
          <button
            onClick={() => (voiceAdd.listening ? voiceAdd.stop() : voiceAdd.start())}
            className={`pointer-events-auto flex items-center gap-2 px-5 py-3 rounded-full border-2 font-bold shadow-float transition-all ${
              voiceAdd.listening
                ? 'bg-accent text-white border-accent'
                : 'bg-bg-card text-accent border-accent'
            }`}
          >
            <MicIcon size={18} />
            {voiceAdd.listening ? '聞いています…' : '話して追加'}
          </button>
          <button
            onClick={openSheet}
            className="pointer-events-auto btn-brand flex items-center gap-2 px-5 py-3 shadow-float"
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
                          {itemEmoji(item.category)}
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

                {/* 商品名入力 + マイク */}
                <div className="flex items-center gap-2 mb-3">
                  <div className="relative flex-1">
                    <input
                      type="text"
                      value={sheetName}
                      onChange={(e) => setSheetName(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && addFromSheet()}
                      placeholder="商品名"
                      autoFocus
                      className="text-input pr-12"
                    />
                    <button
                      onClick={() => (voiceSheet.listening ? voiceSheet.stop() : voiceSheet.start())}
                      className={`absolute right-3 top-1/2 -translate-y-1/2 ${
                        voiceSheet.listening ? 'text-accent animate-pulse' : 'text-text-secondary'
                      }`}
                      aria-label="音声入力"
                    >
                      <MicIcon size={20} />
                    </button>
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
    </div>
  )
}
