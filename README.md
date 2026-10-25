# trip-record

国内・海外旅行の記録アプリです（現在は国内旅行に対応）。

## 機能

- 旅行の記録（タイトル・日程・訪れた都道府県・メモ）の追加・編集・削除
- 日本地図上で、訪れた都道府県に色が付く
- 訪問済みの都道府県数と、残りの都道府県数を表示
- 地図の都道府県をクリックすると、その県の記録だけを表示

- 記録のバックアップ（JSON ファイルへの保存と、ファイルからの復元）

記録はブラウザの localStorage に保存されます（サーバーには送信されません）。
復元時は今ある記録を消さずに統合します（同じ記録はファイルの内容で上書き、ない記録は追加）。

## 開発

```bash
npm install
npm run dev     # 開発サーバー起動
npm run build   # 本番ビルド
npm run lint    # リント
```

## 公開（GitHub Pages）

公開 URL：https://timmy-0123bot.github.io/trip-record/

`main` ブランチにプッシュすると、GitHub Actions（`.github/workflows/deploy.yml`）が
自動でビルドして GitHub Pages に公開します。

初回のみ、GitHub のリポジトリで **Settings → Pages → Build and deployment → Source** を
「GitHub Actions」に設定してください。

公開版でも、記録は各ブラウザの localStorage に保存されます（端末間では共有されません）。

## 技術構成

- Vite + React + TypeScript
- 地図描画：d3-geo / topojson-client

## 地図データ

地球地図日本（国土地理院）のデータを
[dataofjapan/land](https://github.com/dataofjapan/land) が TopoJSON 化したものを使用しています。
非営利目的での利用は出典の明記が条件です。営利目的で利用する場合は、出典の明記に加えて著作権者（地球地図日本）への利用報告が必要です。
