// pages/index.js - 買い物リスト（メイン画面）
import { useState, useEffect, useCallback, useMemo, memo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  PencilIcon,
  AppleIcon,
  CheckIcon,
  ChevronDownIcon,
  ChevronUpIcon,
  MemoIcon,
  TrashIcon,
} from '../components/Icons'
import { itemEmoji, itemImage } from '../lib/emoji'

const todayStr = () => {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

// ===== 商品行 =====
// 親コンポーネントの中で定義すると再描画のたびに全行がアンマウント→再マウントされ、
// framer-motion の height:0→auto アニメが毎回再生されてリストが一瞬縮み、
// スクロールが上に戻る・ガタつく原因になるため、外に出してメモ化する
const ItemRow = memo(function ItemRow({ item, completing, onToggle, onDelete, onEdit }) {
  return (
    <motion.div
      initial={{ opacity: 0, height: 0 }}
      animate={{ opacity: 1, height: 'auto' }}
      exit={{ opacity: 0, height: 0 }}
      transition={{ duration: 0.25 }}
      className="overflow-hidden"
    >
      <div className="flex items-center gap-3 py-3 px-1 border-b border-line last:border-0">
        <div className="w-10 h-10 rounded-xl bg-bg-card-soft flex items-center justify-center text-xl flex-shrink-0 overflow-hidden">
          {itemImage(item.name) ? (
            <img src={itemImage(item.name)} alt="" className="w-full h-full object-cover" />
          ) : (
            itemEmoji(item.category, item.name)
          )}
        </div>
        <button onClick={() => onEdit(item)} className="flex-1 min-w-0 text-left">
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
        </button>
        <button
          onClick={() => onDelete(item.id)}
          className="text-text-secondary hover:text-accent transition-colors flex-shrink-0 p-1"
          aria-label={`${item.name}を削除`}
        >
          <TrashIcon size={18} />
        </button>
        <button
          className={`check-circle ${completing ? 'checked' : ''}`}
          onClick={() => onToggle(item)}
          aria-label="購入済みにする"
        >
          {completing && <CheckIcon size={14} />}
        </button>
      </div>
    </motion.div>
  )
})

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

  // 編集シート（追加シートと同じ見た目で、既存値を入れて開く）
  const [editingItem, setEditingItem] = useState(null)
  const [editName, setEditName] = useState('')
  const [editStore, setEditStore] = useState('')
  const [editCategory, setEditCategory] = useState('')
  const [editMemo, setEditMemo] = useState('')
  const [showEditMemo, setShowEditMemo] = useState(false)
  const [toast, setToast] = useState('')

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
  const markPurchased = useCallback(async (item) => {
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
  }, [fetchItems])

  const unmarkPurchased = useCallback(async (item) => {
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
  }, [fetchItems])

  // 購入チェック：取り消し線アニメーションを見せてからリストから消す
  const togglePurchased = useCallback(
    (item) => {
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
    },
    [completingIds, markPurchased, unmarkPurchased]
  )

  const deleteItem = useCallback(
    async (id) => {
      try {
        await fetch(`/api/items?id=${id}`, { method: 'DELETE' })
        fetchItems()
      } catch (e) {
        console.error('Error deleting item:', e)
      }
    },
    [fetchItems]
  )

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
      // 再取得は1回だけにまとめる（二重fetchでリストが二度再描画されるのを防ぐ）
      const listRes = await fetch('/api/items')
      const list = await listRes.json()
      const listArr = Array.isArray(list) ? list : []
      setItems(listArr)
      setSheetItems(listArr.filter((i) => !i.purchased).slice(-20))
      setSheetName('')
      setSheetMemo('')
      setShowMemo(false)
    } catch (e) {
      console.error('Error adding item:', e)
    }
  }

  const undoSheetItem = async (id) => {
    await deleteItem(id)
    setSheetItems((prev) => prev.filter((i) => i.id !== id))
  }

  const showToast = (msg) => {
    setToast(msg)
    setTimeout(() => setToast(''), 2000)
  }

  const openEditSheet = (item) => {
    setEditingItem(item)
    setEditName(item.name)
    setEditStore(item.store || '')
    setEditCategory(item.category || '')
    setEditMemo(item.memo || '')
    setShowEditMemo(!!item.memo)
  }

  const saveEdit = async () => {
    const name = editName.trim()
    if (!name || !editingItem) return
    try {
      await fetch('/api/items', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: editingItem.id,
          name,
          store: editStore,
          category: editCategory,
          memo: editMemo,
        }),
      })
      setEditingItem(null)
      fetchItems()
      showToast('更新しました')
    } catch (e) {
      console.error('Error updating item:', e)
    }
  }

  const toggleStoreCollapse = (store) => {
    setCollapsedStores((prev) => ({ ...prev, [store]: !prev[store] }))
  }

  return (
    <div>
      {/* ヘッダー */}
      <div className="mb-4">
        <h1 className="text-2xl font-bold text-text-primary">買い物リスト</h1>
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
                          <ItemRow
                            key={item.id}
                            item={item}
                            completing={completingIds.includes(item.id)}
                            onToggle={togglePurchased}
                            onDelete={deleteItem}
                            onEdit={openEditSheet}
                          />
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
              <ItemRow
                key={item.id}
                item={item}
                completing={completingIds.includes(item.id)}
                onToggle={togglePurchased}
                onDelete={deleteItem}
                onEdit={openEditSheet}
              />
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
                      <div className="w-10 h-10 rounded-xl bg-bg-card-soft flex items-center justify-center text-xl flex-shrink-0 overflow-hidden">
                        {itemImage(item.name) ? (
                          <img src={itemImage(item.name)} alt="" className="w-full h-full object-cover" />
                        ) : (
                          itemEmoji(item.category, item.name)
                        )}
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
                        <div className="w-9 h-9 rounded-lg bg-bg-card-soft flex items-center justify-center text-lg flex-shrink-0 overflow-hidden">
                          {itemImage(item.name) ? (
                            <img src={itemImage(item.name)} alt="" className="w-full h-full object-cover" />
                          ) : (
                            itemEmoji(item.category, item.name)
                          )}
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

      {/* 編集シート（追加シートと同じ部品・見た目） */}
      <AnimatePresence>
        {editingItem && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="sheet-overlay"
              onClick={() => setEditingItem(null)}
            />
            <motion.div
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'tween', duration: 0.25 }}
              className="sheet"
            >
              <div className="px-4 pt-4">
                <div className="flex justify-between items-center mb-3">
                  <button onClick={() => setEditingItem(null)} className="chip">
                    閉じる
                  </button>
                  <span className="text-sm text-text-secondary font-medium">
                    商品を編集
                  </span>
                  <div className="w-16" />
                </div>

                {/* 購入先チップ */}
                <div className="flex items-center gap-3 mb-3">
                  <span className="text-sm text-text-secondary flex-shrink-0">購入先</span>
                  <div className="flex gap-2 overflow-x-auto no-scrollbar py-1">
                    {[...stores, '未設定'].map((s) => (
                      <button
                        key={s}
                        onClick={() => setEditStore(s === '未設定' ? '' : s)}
                        className={`chip ${
                          (s === '未設定' && !editStore) || editStore === s ? 'chip-active' : ''
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
                        onClick={() => setEditCategory(editCategory === c ? '' : c)}
                        className={`chip chip-sm ${editCategory === c ? 'chip-active' : ''}`}
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
                      value={editName}
                      onChange={(e) => setEditName(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && saveEdit()}
                      placeholder="商品名"
                      autoFocus
                      className="text-input"
                    />
                  </div>
                  <button
                    onClick={() => setShowEditMemo(!showEditMemo)}
                    className={`flex items-center gap-1 border-2 border-text-primary rounded-full px-4 py-2.5 text-sm font-bold transition-colors ${
                      showEditMemo ? 'bg-text-primary text-white' : 'text-text-primary bg-transparent'
                    }`}
                  >
                    <MemoIcon size={16} />
                    メモ
                  </button>
                  <button
                    onClick={saveEdit}
                    disabled={!editName.trim()}
                    className="btn-brand px-5 py-2.5 text-sm"
                  >
                    保存
                  </button>
                </div>

                {/* メモ入力 */}
                <AnimatePresence>
                  {showEditMemo && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      className="overflow-hidden"
                    >
                      <input
                        type="text"
                        value={editMemo}
                        onChange={(e) => setEditMemo(e.target.value)}
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

      {/* トースト */}
      {toast && <div className="toast">{toast}</div>}

    </div>
  )
}
