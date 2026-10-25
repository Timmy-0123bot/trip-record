import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// https://vite.dev/config/
export default defineConfig(({ command, isPreview }) => ({
  plugins: [react()],
  // GitHub Pages は https://<ユーザー名>.github.io/trip-record/ で公開されるため、
  // 本番ビルドとそのプレビューでは配信パスをリポジトリ名に合わせる（開発サーバーは / のまま）
  base: command === 'build' || isPreview ? '/trip-record/' : '/',
}))
