/** @type {import('tailwindcss').Config} */
/** ショッピングリストアプリ - クリーム×テラコッタのライトテーマ */
module.exports = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        // 背景色
        'bg-primary': '#F6F1E8',      // クリーム背景
        'bg-card': '#FFFFFF',         // カード背景
        'bg-card-soft': '#FBF8F1',    // 薄いカード背景

        // アクセント - テラコッタ（メインボタン）
        'accent': {
          DEFAULT: '#A8432B',
          dark: '#8F3620',
          soft: '#F3E3DC',
        },

        // テキスト
        'text-primary': '#3B2F27',    // 濃い茶（メインテキスト）
        'text-secondary': '#8A7F73',  // グレー（サブテキスト）

        // ボーダー
        'line': '#E7DFD2',

        // 成功（購入済み）
        'success': {
          DEFAULT: '#3E7C4F',
          soft: '#E4EFE2',
        },
      },
      boxShadow: {
        'card': '0 2px 12px rgba(59, 47, 39, 0.06)',
        'float': '0 6px 24px rgba(59, 47, 39, 0.18)',
        'sheet': '0 -8px 32px rgba(59, 47, 39, 0.18)',
      },
      borderRadius: {
        'card': '20px',
        'pill': '9999px',
      },
      fontFamily: {
        sans: ['-apple-system', 'BlinkMacSystemFont', 'Helvetica Neue', 'Noto Sans JP', 'Arial', 'sans-serif'],
      },
      spacing: {
        'safe-bottom': 'env(safe-area-inset-bottom)',
      },
    },
  },
  plugins: [],
}
