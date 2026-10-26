import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { polyfillCountryFlagEmojis } from 'country-flag-emoji-polyfill'
import flagFontUrl from 'country-flag-emoji-polyfill/dist/TwemojiCountryFlags.woff2?url'
import './index.css'
import App from './App.tsx'

// Windows など国旗の絵文字を表示できない環境では、国旗用のフォントを読み込む（同梱のフォントを使用）
polyfillCountryFlagEmojis('Twemoji Country Flags', flagFontUrl)

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
