# One Day One Thing

AIが毎朝たった1つの「小さな体験」を提案するWebアプリ。

## プロジェクト概要

都市部在住の25〜40歳が「何をすればいいか分からない」選択疲れから解放され、日常の豊かさに気づくことを目指すアプリケーションです。

### 技術スタック

- **フレームワーク**: Next.js 15+ (App Router, TypeScript strict mode)
- **スタイリング**: TailwindCSS 3.x
- **DB・認証**: Supabase (PostgreSQL + Auth + Storage)
- **AI**: Claude API (claude-sonnet-4-20250514)
- **天気**: OpenWeather API 3.0
- **決済**: Stripe（月額480円サブスク）※50人達成後に導入
- **通知**: LINE Messaging API
- **ホスティング**: Vercel

## セットアップ手順

### 1. リポジトリのクローン

```bash
git clone <repository-url>
cd one_day_one_thing
```

### 2. 依存関係のインストール

```bash
npm install
```

### 3. 環境変数の設定

`.env.example`をコピーして`.env.local`を作成し、必要な値を設定してください。

```bash
cp .env.example .env.local
```

必須の環境変数：
- `NEXT_PUBLIC_SUPABASE_URL`: SupabaseプロジェクトURL
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`: Supabase匿名キー
- `SUPABASE_SERVICE_ROLE_KEY`: Supabaseサービスロールキー
- `ANTHROPIC_API_KEY`: Claude APIキー
- `OPENWEATHER_API_KEY`: OpenWeather APIキー

### 4. 開発サーバーの起動

```bash
npm run dev
```

http://localhost:3000 でアプリケーションにアクセスできます。

## 開発コマンド

```bash
npm run dev          # 開発サーバー起動（http://localhost:3000）
npm run build        # 本番ビルド
npm run start        # 本番サーバー起動
npm run lint         # ESLint実行
npm run type-check   # TypeScript型チェック
npm run test         # テスト全体実行（vitest）
npm run format       # Prettierでコード整形
```

## Supabaseのセットアップ

Supabaseをローカルで使用する場合：

```bash
# Supabase CLIのインストール（初回のみ）
npm install -g supabase

# ローカルSupabaseの起動
npx supabase start

# マイグレーション適用
npx supabase db push

# DB型の自動生成
npx supabase gen types typescript --local > src/types/database.ts
```

## プロジェクト構造

```
src/
├── app/                    # Next.js App Router
│   ├── (auth)/            # 認証不要ページ
│   ├── (app)/             # 認証必要ページ
│   ├── legal/             # 法的ページ
│   └── api/               # APIルート
├── components/            # Reactコンポーネント
│   ├── layout/           # レイアウトコンポーネント
│   ├── suggestion/       # 提案関連
│   ├── log/              # ログ関連
│   └── common/           # 共通コンポーネント
├── lib/                   # 外部APIクライアント
│   ├── supabase/         # Supabaseクライアント
│   ├── ai/               # Claude APIクライアント
│   ├── weather/          # OpenWeather APIクライアント
│   ├── line/             # LINE APIクライアント
│   ├── stripe/           # Stripeクライアント
│   └── utils/            # ユーティリティ関数
├── types/                 # TypeScript型定義
└── hooks/                 # カスタムフック
```

## ドキュメント

- [CLAUDE.md](.claude/CLAUDE.md) - Claude Codeへのプロジェクト指示書
- [codeguide.md](codeguide.md) - 実装ガイド
- [requirements.md](requirements.md) - 要件定義書
- [plan.md](plan.md) - プロジェクト計画

## ライセンス

Private
