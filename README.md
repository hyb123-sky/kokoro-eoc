🚀 KOKORO EOC - エンタープライズ級災害対応指揮センター

統合デプロイメント・ガイド

📋 目次

1. プロジェクト概要

2. アーキテクチャ選定の根拠

3. PDI 環境設定

4. ローカル開発環境の構築

5. ServiceNow 連携設定

6. GitHub + CI/CD デプロイ

7. 今後の実装ロードマップ

8. FAQ (よくある質問)

1. プロジェクト概要

KOKORO EOC は、企業レベルの災害対応を支援する指揮センター・アプリケーションです。

採用技術スタック

フロントエンド: React 18 + TypeScript (ユーザーインターフェース)

状態管理: Zustand + TanStack Query (スパゲッティコードの防止とキャッシュ管理)

スタイリング: Tailwind CSS (インダストリアル/サイバーパンク・スタイルの実現)

バックエンド (データ): ServiceNow PDI (インシデント、物資、人員管理)

リアルタイムデータ: Firebase/Supabase 予定 (車両トラッキング、センサーデータ)

外部 API: USGS、Open-Meteo (地震情報、気象データ)

AI: OpenAI/Claude 予定 (意思決定支援アシスタント)

デプロイ: Vercel + GitHub Actions (自動 CI/CD パイプライン)

2. アーキテクチャ選定の根拠

データフロー設計 (サイドカー・パターン)

graph TD
    App[KOKORO React App] --> TQ[TanStack Query: サーバーデータ]
    App --> ZS[Zustand: UI 状態管理]
    TQ --> SV[サービス層: services/]
    ZS --> SV
    SV --> SN[ServiceNow: マスタデータ]
    SV --> EA[外部 API: 動的・リアルタイム]
    SN --- Inc[インシデント/在庫/要員]
    EA --- Geo[地震/気象/Firebase]


設計の要点：

ServiceNow: 更新頻度の低い業務データ（マスタ、履歴）を格納。

Firebase/Supabase: GPS 軌跡やセンサーなど、高頻度なストリーミングデータを処理。

TanStack Query: 自動キャッシュと再取得により、API コストの削減と UX の向上を実現。

状態管理戦略

useAppStore(): UI状態（サイドバー、テーマ、選択項目）

useMapStore(): 地図状態（ビューポート、レイヤー、マーカー）

useNotificationStore(): 通知システム

useAICopilotStore(): AI チャット・コンテキスト

useStatsStore(): 統計データ集計

3. PDI 環境設定

ステップ 1: PDI の申請

developer.servicenow.com にアクセス。

アカウント登録・ログイン後、"Start Building" → "Request Instance" を選択。

最新バージョン (例: Washington DC) を選択。

インスタンス URL を控える: https://devXXXXX.service-now.com

ステップ 2: カスタムテーブルの作成

以下のテーブルおよびカラムを定義してください。

A. 災害リソース (u_kokoro_resource)

u_name (String 100): リソース名

u_type (Choice): 車両/医療/食料/シェルター/要員/設備

u_status (Choice): 利用可能/展開中/メンテナンス/利用不可

u_quantity (Integer): 数量

u_location (String 200): 配置場所

u_latitude/longitude (Decimal): 座標

B. 避難所施設 (u_kokoro_shelter)

u_name (String 100): 施設名

u_address (String 200): 住所

u_capacity (Integer): 収容人数

u_current_occupancy (Integer): 現在の利用者数

u_status (Choice): 開放/閉鎖/満員

ステップ 3: REST API & CORS

ユーザー作成: rest_api_explorer, itil ロールを付与。

CORS設定: System Web Services > REST > CORS Rules にて http://localhost:3000 を許可。

4. ローカル開発環境の構築

# クローン
git clone [https://github.com/YOUR_USERNAME/kokoro-eoc.git](https://github.com/YOUR_USERNAME/kokoro-eoc.git)
cd kokoro-eoc

# インストール
npm install

# 環境設定
cp .env.example .env.local
# .env.local を開き PDI 情報を入力

# 起動
npm run dev


5. ServiceNow 連携設定

構成 A: Vite プロキシ (開発環境)

vite.config.ts 設定例：

server: {
  proxy: {
    '/api/servicenow': {
      target: '[https://your-instance.service-now.com](https://your-instance.service-now.com)',
      changeOrigin: true,
      rewrite: (path) => path.replace(/^\/api\/servicenow/, '/api'),
    }
  }
}


構成 B: Vercel Serverless Functions (本番環境)

api/servicenow/[...path].ts を作成し、バックエンド経由でセキュアにリクエストを中継します。

6. GitHub + CI/CD デプロイ

GitHub: main ブランチへプッシュ。

Vercel:

ダッシュボードからプロジェクトをインポート。

SERVICENOW_INSTANCE_URL, SERVICENOW_USERNAME, SERVICENOW_PASSWORD を Environment Variables に登録。

自動ビルド: 以降、プッシュごとに自動デプロイが実行されます。

7. 今後の実装ロードマップ

短期 (1-2週): ServiceNow API への完全移行、Mapbox 統合。

中期 (3-4週): Deck.gl による 3D 可視化、Firebase リアルタイム追跡。

長期 (2ヶ月～): AI Copilot (GPT-4/Claude 3) 統合、異常検知アラート。

8. FAQ (よくある質問)

Q: 401 Unauthorized が出ます。

A: ユーザーのロール（rest_api_explorer）と認証情報の再確認を行ってください。

Q: 地図の更新頻度を下げたい。

A: useQuery の staleTime を 5分以上に設定してください。

プロジェクト構成

src/components/: 機能別UI

src/hooks/: TanStack Query等

src/stores/: Zustandストア

src/services/: APIクライアント

以上。 🚀
