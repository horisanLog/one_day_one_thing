# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

日本語で作成してください。コメントも日本語にしてください。

## プロジェクト概要

**One Day One Thing** — AIが毎朝たった1つの「小さな体験」を提案するWebアプリ。
都市部在住の25〜40歳が「何をすればいいか分からない」選択疲れから解放され、日常の豊かさに気づくことを目指す。
副業プロジェクト（1人開発、週15-20時間）。

## 技術スタック

- **フレームワーク**: Next.js 14+ (App Router, TypeScript strict mode)
- **スタイリング**: TailwindCSS 3.x
- **DB・認証**: Supabase (PostgreSQL + Auth + Storage)
- **AI**: Claude API (claude-sonnet-4-20250514)
- **天気**: OpenWeather API 3.0
- **決済**: Stripe（月額480円サブスク）※50人達成後に導入
- **通知**: LINE Messaging API
- **ホスティング**: Vercel

## コマンド

```bash
npm run dev          # 開発サーバー起動（http://localhost:3000）
npm run build        # 本番ビルド
npm run lint         # ESLint実行
npm run type-check   # TypeScript型チェック
npm run test         # テスト全体実行（vitest）
npm run test -- path/to/file.test.ts  # 単一テスト実行
npx supabase start   # ローカルSupabase起動
npx supabase db push # マイグレーション適用
npx supabase gen types typescript --local > src/types/database.ts  # DB型自動生成
```

## アーキテクチャ

### データフロー

```
ユーザー → Next.js App Router → API Routes → Supabase (データ永続化)
                                           → Claude API (提案生成)
                                           → OpenWeather API (天気取得)
                                           → LINE Messaging API (通知配信)
```

**提案生成の流れ**: ユーザーがホーム画面にアクセス → `GET /api/suggestions/today` → DBに当日分があれば返却、なければ Claude API + OpenWeather から生成 → suggestionsテーブルに保存 → 返却

**認証フロー**: Supabase Auth (Google + メール) → JWT → Next.js middleware で認証チェック → `(app)/` グループ配下のページを保護

### ルートグループ構成

- `src/app/(auth)/` — 認証不要ページ（login, signup, reset-password）
- `src/app/(app)/` — 認証必要ページ（home, log, settings, share, report）。共通レイアウトに AuthGuard + BottomNav を配置
- `src/app/legal/` — 法的ページ（privacy, terms, tokushoho）
- `src/app/api/` — APIルート

### ディレクトリ配置ルール

- 新しいページ → `src/app/` 配下の該当グループへ
- 新しいコンポーネント → `src/components/` 配下の該当カテゴリへ。なければカテゴリを作る
- 外部APIクライアント → `src/lib/` 配下にサービス名のディレクトリを作る
- DB操作 → Supabaseクライアント経由のみ（直接SQLは書かない）
- 型定義 → `src/types/` に集約。DB型は `npx supabase gen types typescript` で自動生成
- テストファイル → 対象ファイルと同階層に `*.test.ts(x)` で配置

### DBスキーマ（主要テーブル）

- **users**: id(uuid/PK), email, nickname, area_type(urban/suburban/rural), is_premium(bool), line_user_id, line_notification_enabled
- **suggestions**: id(uuid/PK), user_id(FK), date, title, body, closing, category, context_data(jsonb)
- **experience_logs**: id(uuid/PK), user_id(FK), suggestion_id(FK), status(done/skipped), memo, photo_url
- **mood_logs**: id(uuid/PK), user_id(FK), date, mood(great/good/normal/tired/low)
- **subscriptions**: id(uuid/PK), user_id(FK/UNIQUE), stripe_subscription_id, status(active/canceled/past_due), current_period_end

全テーブルでRLS有効。ユーザーは自分のデータのみ読み書き可能。

### API一覧

| エンドポイント | メソッド | 概要 |
|:--|:--|:--|
| /api/suggestions/today | GET | 今日の提案取得（なければ生成） |
| /api/suggestions/generate | POST | 提案生成（内部用） |
| /api/logs | GET/POST | 体験ログ取得・記録 |
| /api/mood | POST | 気分記録 |
| /api/share-card | POST | シェアカード画像生成 |
| /api/settings | GET/PUT | ユーザー設定 |
| /api/reports/monthly | GET | 月次レポート（プレミアム） |
| /api/line/webhook | POST | LINE Webhookハンドラ |
| /api/cron/send-notifications | POST | 毎朝7:00 JST LINE配信（Vercel Cron） |

## コーディング規約

### 命名規則

- ファイル名: コンポーネントは `PascalCase.tsx`、それ以外は `kebab-case.ts`
- 変数・関数: `camelCase`
- 型・interface: `PascalCase`
- 定数: `UPPER_SNAKE_CASE`
- DBカラム: `snake_case`

### コンポーネント

- 関数コンポーネントのみ（classコンポーネント禁止）
- `'use client'` は必要な場合のみ明示的に記載
- propsの型はexportせず、同ファイル内で `interface Props {}` として定義
- コンポーネント1つにつき1ファイル

### エラーハンドリング

- API Routeは必ず try-catch でラップし、適切なHTTPステータスを返す
- ユーザー向けメッセージは**日本語**
- console.errorとログは**英語**
- 想定外のエラーは `{ error: "エラーが発生しました。しばらく経ってからお試しください。" }` で統一

### データアクセス

- **すべてのテーブルでRLS (Row Level Security) を有効にする**
- ユーザーは自分のデータのみ読み書き可能
- サービスロールキーはサーバーサイドAPIルートのみで使用（クライアントに露出させない）
- `NEXT_PUBLIC_` プレフィックスはクライアントに露出して良い値のみ

## 無料/プレミアムプランの境界

> **MVP期間（〜50人）**：全機能を無料で提供。Stripe決済は保留とし、プロダクト価値の検証に集中する。

| 機能 | 無料プラン | プレミアム（月額480円）※50人達成後 |
|:-----|:----------|:----------------------------------|
| 毎日の提案 | 汎用的な提案（1日1つ） | 天気・気分・履歴に基づく個人化提案 |
| 体験ログ閲覧 | 直近7日間のみ | 無制限 |
| 月次レポート | 利用不可 | 利用可 |
| ジャンル設定 | 利用不可 | 利用可 |
| シェアカードデザイン | ベーシック1種 | プレミアム3種から選択 |

**実装ルール**:
- プラン判定は `users.is_premium` フラグで行う
- APIルートでのプラン判定は早期リターンで実装（ガード節パターン）
- 無料ユーザーがプレミアム機能にアクセスした場合は、403ではなくプラン誘導UIを表示
- Stripeのwebhookで `is_premium` を更新（クライアントで直接変更しない）※50人達成後に実装

## AI提案の品質ルール

このアプリの価値は「毎朝届く提案の質」にかかっている。プロンプト作成・修正時は以下を厳守すること。

### トーン

- 温かく、優しく、詩的だが地に足がついている
- コーチが命令するのではなく、**親しい友人がそっと囁く**ような感覚
- 日本語として自然で美しい文章

### 提案の制約（すべて満たすこと）

- 30分以内、理想的には10分以内で実行可能
- ゼロコストまたはほぼ無料（「○○を買って」「○○を予約して」は禁止）
- 場所を問わない（自宅でも会社でも外でも可能）
- 説教的でない（「あなたは○○すべき」は禁止）
- 生産性用語を使わない（「最適化」「レベルアップ」「達成」は禁止）
- ブランド、商品、特定の場所を名指ししない
- 各提案に「なぜ」を含める（義務ではなく好奇心を喚起する形で）

### 出力形式

```json
{
  "title": "提案タイトル（1行）",
  "body": "本文（2〜3行）",
  "closing": "結び（1行の詩的な一文）",
  "category": "五感|探検|プチ冒険|マインドフルネス|つながり|創作|内省"
}
```

### コンテキスト変数（プロンプトに注入するもの）

- weather: 天気（OpenWeather API）
- temperature: 気温
- dayOfWeek: 曜日（平日→マイクロ体験、休日→探検系）
- season: 季節・二十四節気（日本の暦）
- mood: ユーザーの気分（任意入力: great/good/normal/tired/low）
- history: 過去の受入/スキップ履歴（直近30件のカテゴリとステータス）
- areaType: エリアタイプ（urban/suburban/rural）

## ブランドガイドライン

- **カラーパレット**: 背景 #FAFAF7 / プライマリ(緑) #7C9A82 / アクセント(青) #8BA4B8 / グレー #9B9B8E
- **フォント**: UIはゴシック体、提案テキストはNoto Serif JP（明朝体）
- **デザイン**: ミニマリスト、余白たっぷり、モバイルファースト（375px基準）
- **「スキップ」ボタン**: テキストのみで控えめに。「やった」ボタンにプライマリカラーを使用

## 実装フェーズ（codeguide.md参照）

開発は以下の順序で進める。各タスクの詳細は `codeguide.md` を参照。

1. **Phase 1** (基盤): プロジェクト初期化 → DBスキーマ → 認証基盤
2. **Phase 2** (コア機能): AI提案エンジン → ホーム画面 → 体験ログ → シェアカード
3. **Phase 3** (配信・設定): LINE連携 → ユーザー設定
4. **Phase 4** (公開準備): LP → 法的ページ → 最終仕上げ・デプロイ
5. **Phase 5** (収益化/50人達成後): Stripe決済 → 月次レポート

## テスト方針

- APIルート: 主要エンドポイントにintegrationテストを書く（vitest）
- 認証: 認証が必要なルートへの未認証アクセスがリダイレクトされることをテスト
- 決済: Stripe webhookのシグネチャ検証テスト（50人達成後に実装）
- コンポーネント: 重要なUI（SuggestionCard, ActionButtons）のみスナップショットテスト
- テストカバレッジ目標: 主要API 80%以上

## 絶対にやらないこと

- ネイティブアプリ対応（Webのみ）
- 多言語対応（日本語のみ）
- classコンポーネントの使用
- `any` 型の使用（`unknown` を使い、型ガードで絞り込む）
- ユーザーデータのクライアントサイドでの永続化（localStorageにユーザー情報を保存しない）
- `SUPABASE_SERVICE_ROLE_KEY` のクライアント露出
- 過剰な抽象化（1人開発のため、シンプルさを最優先）

## コミットメッセージ

```
feat: 新機能追加
fix: バグ修正
docs: ドキュメント変更
style: コードスタイル変更（機能影響なし）
refactor: リファクタリング
test: テスト追加・修正
chore: ビルド・設定等
```
