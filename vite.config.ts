import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'
import { VitePWA } from 'vite-plugin-pwa'

// https://vite.dev/config/
export default defineConfig(({ command, isPreview }) => ({
  plugins: [
    react(),
    // ホーム画面への追加（マニフェスト）とオフライン対応（Service Worker）
    VitePWA({
      // 新しい版を公開したら、次に開いたときに自動で切り替える
      registerType: 'autoUpdate',
      includeAssets: ['favicon.svg', 'icons/apple-touch-icon.png'],
      manifest: {
        name: 'trip-record｜旅行の記録',
        short_name: 'trip-record',
        description: '行った都道府県・国を地図に塗って記録する旅行記録アプリ',
        lang: 'ja',
        display: 'standalone',
        background_color: '#f7f6f2',
        theme_color: '#e8735a',
        icons: [
          { src: 'icons/icon-192.png', sizes: '192x192', type: 'image/png' },
          { src: 'icons/icon-512.png', sizes: '512x512', type: 'image/png' },
          {
            src: 'icons/icon-maskable-512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'maskable',
          },
        ],
      },
      workbox: {
        // 地図データ（JS に同梱）や国旗フォントも含め、アプリ一式を端末に保存する
        globPatterns: ['**/*.{js,css,html,svg,png,woff2}'],
        // SNS 共有用の画像はアプリの動作に不要なので端末には保存しない
        globIgnores: ['og-image.png'],
      },
    }),
  ],
  // GitHub Pages は https://<ユーザー名>.github.io/trip-record/ で公開されるため、
  // 本番ビルドとそのプレビューでは配信パスをリポジトリ名に合わせる（開発サーバーは / のまま）
  base: command === 'build' || isPreview ? '/trip-record/' : '/',
}))
