// components/Layout.js - 下部3タブナビ（定期購入品 / 買い物リスト / マイページ）
import { useRouter } from 'next/router'
import { motion } from 'framer-motion'
import { SwapIcon, CartIcon, UserIcon } from './Icons'

export default function Layout({ children }) {
  const router = useRouter()

  const tabs = [
    { path: '/recurring', icon: SwapIcon, label: '定期購入品' },
    { path: '/', icon: CartIcon, label: '買い物リスト', center: true },
    { path: '/mypage', icon: UserIcon, label: 'マイページ' },
  ]

  return (
    <div className="min-h-screen bg-bg-primary">
      <main className="max-w-md mx-auto px-4 pt-5 pb-32">
        {children}
      </main>

      {/* 下部ナビゲーション */}
      <nav
        className="fixed bottom-0 left-0 right-0 z-40 border-t border-line bg-bg-primary"
        style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
      >
        <div className="max-w-md mx-auto flex justify-around items-end px-2 pt-2 pb-2">
          {tabs.map((tab) => {
            const isActive = router.pathname === tab.path
            const Icon = tab.icon

            if (tab.center) {
              // 中央：大きめの円形ハイライト付き
              return (
                <button
                  key={tab.path}
                  onClick={() => router.push(tab.path)}
                  className="flex flex-col items-center gap-1 w-24"
                >
                  <div
                    className={`flex items-center justify-center w-14 h-14 rounded-full transition-colors ${
                      isActive ? 'bg-accent-soft' : 'bg-transparent'
                    }`}
                  >
                    <div className={isActive ? 'text-accent' : 'text-text-secondary'}>
                      <Icon size={26} />
                    </div>
                  </div>
                  <span
                    className={`text-[11px] leading-tight ${
                      isActive ? 'font-bold text-accent' : 'text-text-secondary'
                    }`}
                  >
                    {tab.label}
                  </span>
                </button>
              )
            }

            return (
              <button
                key={tab.path}
                onClick={() => router.push(tab.path)}
                className="flex flex-col items-center gap-1 w-24 pt-2"
              >
                <motion.div
                  animate={{ scale: isActive ? 1.1 : 1 }}
                  className={isActive ? 'text-accent' : 'text-text-secondary'}
                >
                  <Icon size={22} />
                </motion.div>
                <span
                  className={`text-[11px] leading-tight ${
                    isActive ? 'font-bold text-accent' : 'text-text-secondary'
                  }`}
                >
                  {tab.label}
                </span>
              </button>
            )
          })}
        </div>
      </nav>
    </div>
  )
}
