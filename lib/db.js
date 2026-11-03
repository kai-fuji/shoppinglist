// lib/db.js - SQLite データベース層 (@libsql/client 版)
import { createClient } from '@libsql/client'
import path from 'path'

let db = null

export async function getDb() {
  if (db) return db

  const tursoUrl = process.env.TURSO_DATABASE_URL
  const tursoToken = process.env.TURSO_AUTH_TOKEN

  if (tursoUrl && tursoToken) {
    console.log('✅ Using Turso database')

    db = createClient({
      url: tursoUrl,
      authToken: tursoToken,
      connectionTimeout: 30000,
      requestTimeout: 30000
    })
  } else {
    const dbPath = path.join(process.cwd(), 'shopping.db')
    console.log('✅ Using local SQLite:', dbPath)

    db = createClient({
      url: `file:${dbPath}`
    })
  }

  await initializeTables()
  return db
}

async function initializeTables() {
  // 買い物リスト
  await db.execute(`
    CREATE TABLE IF NOT EXISTS shopping_items (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      store TEXT DEFAULT '',
      category TEXT DEFAULT '',
      memo TEXT DEFAULT '',
      purchased INTEGER DEFAULT 0,
      purchased_date TEXT,
      created_at TEXT DEFAULT (datetime('now', 'localtime'))
    )
  `)

  // 定期購入品
  await db.execute(`
    CREATE TABLE IF NOT EXISTS recurring_items (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      store TEXT DEFAULT '',
      category TEXT DEFAULT '',
      memo TEXT DEFAULT '',
      created_at TEXT DEFAULT (datetime('now', 'localtime'))
    )
  `)

  // アプリ設定（購入先・カテゴリーのマスター）
  await db.execute(`
    CREATE TABLE IF NOT EXISTS app_settings (
      key TEXT PRIMARY KEY,
      value TEXT
    )
  `)

  // デフォルトの購入先・カテゴリーを登録（初回のみ）
  const res = await db.execute("SELECT COUNT(*) AS c FROM app_settings WHERE key = 'stores'")
  if (Number(res.rows[0].c) === 0) {
    await db.execute({
      sql: "INSERT INTO app_settings (key, value) VALUES ('stores', ?)",
      args: [JSON.stringify(['イオン', '業務スーパー', 'KOHYO', '西松屋', 'ダイコク', 'ミック', '100均', 'その他'])]
    })
  }

  const res2 = await db.execute("SELECT COUNT(*) AS c FROM app_settings WHERE key = 'categories'")
  if (Number(res2.rows[0].c) === 0) {
    await db.execute({
      sql: "INSERT INTO app_settings (key, value) VALUES ('categories', ?)",
      args: [JSON.stringify(['野菜・果物', '肉・魚', '豆腐・納豆・卵', '調味料・食品', '日用品・医薬品', '家・生活用品', 'その他'])]
    })
  }
}

// ========================================
// Shopping Items CRUD
// ========================================

export async function getShoppingItems() {
  const db = await getDb()
  const result = await db.execute('SELECT * FROM shopping_items ORDER BY purchased ASC, id ASC')
  return result.rows || []
}

export async function addShoppingItem(name, store = '', category = '', memo = '') {
  const db = await getDb()
  await db.execute({
    sql: 'INSERT INTO shopping_items (name, store, category, memo) VALUES (?, ?, ?, ?)',
    args: [name, store, category, memo]
  })
}

export async function updateShoppingItem(id, fields) {
  const db = await getDb()
  const allowed = ['name', 'store', 'category', 'memo', 'purchased', 'purchased_date']
  const sets = []
  const args = []
  for (const key of allowed) {
    if (fields[key] !== undefined) {
      sets.push(`${key} = ?`)
      args.push(fields[key])
    }
  }
  if (sets.length === 0) return
  args.push(id)
  await db.execute({
    sql: `UPDATE shopping_items SET ${sets.join(', ')} WHERE id = ?`,
    args
  })
}

export async function deleteShoppingItem(id) {
  const db = await getDb()
  await db.execute({
    sql: 'DELETE FROM shopping_items WHERE id = ?',
    args: [id]
  })
}

export async function deletePurchasedItems() {
  const db = await getDb()
  await db.execute('DELETE FROM shopping_items WHERE purchased = 1')
}

export async function deleteAllShoppingItems() {
  const db = await getDb()
  await db.execute('DELETE FROM shopping_items')
}

// ========================================
// Recurring Items CRUD
// ========================================

export async function getRecurringItems() {
  const db = await getDb()
  const result = await db.execute('SELECT * FROM recurring_items ORDER BY id ASC')
  return result.rows || []
}

export async function addRecurringItem(name, store = '', category = '', memo = '') {
  const db = await getDb()
  await db.execute({
    sql: 'INSERT INTO recurring_items (name, store, category, memo) VALUES (?, ?, ?, ?)',
    args: [name, store, category, memo]
  })
}

export async function updateRecurringItem(id, name, store, category, memo) {
  const db = await getDb()
  await db.execute({
    sql: 'UPDATE recurring_items SET name = ?, store = ?, category = ?, memo = ? WHERE id = ?',
    args: [name, store, category, memo, id]
  })
}

export async function deleteRecurringItem(id) {
  const db = await getDb()
  await db.execute({
    sql: 'DELETE FROM recurring_items WHERE id = ?',
    args: [id]
  })
}

// ========================================
// App Settings
// ========================================

export async function getSettings() {
  const db = await getDb()
  const result = await db.execute('SELECT key, value FROM app_settings')
  const settings = {}
  for (const row of result.rows || []) {
    try {
      settings[row.key] = JSON.parse(row.value)
    } catch {
      settings[row.key] = row.value
    }
  }
  return settings
}

export async function updateSetting(key, value) {
  const db = await getDb()
  await db.execute({
    sql: `INSERT INTO app_settings (key, value) VALUES (?, ?)
          ON CONFLICT(key) DO UPDATE SET value = excluded.value`,
    args: [key, JSON.stringify(value)]
  })
}
