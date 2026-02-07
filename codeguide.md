# One Day One Thing - Claude Code 実行ガイド

## このドキュメントについて

要件定義書をもとに、Claude Codeで**何を、どの順番で**実行すべきかをまとめたガイドです。
各タスクは1回のClaude Codeセッションで完了できるサイズに分割されています。

---

## 事前準備（人間が手動でやること）

Claude Codeに入る前に、以下のアカウント作成とAPIキー取得が必要です。

### 必須（開発開始前）

| サービス | やること | 取得するもの |
|:---------|:---------|:-------------|
| Supabase | プロジェクト作成 | `SUPABASE_URL`, `SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY` |
| Anthropic | APIキー発行 | `ANTHROPIC_API_KEY` |
| OpenWeather | アカウント作成 & APIキー取得 | `OPENWEATHER_API_KEY` |

### Phase 2で必要

| サービス | やること | 取得するもの |
|:---------|:---------|:-------------|
| LINE Developers | チャネル作成（Messaging API） | `LINE_CHANNEL_ACCESS_TOKEN`, `LINE_CHANNEL_SECRET` |

### Phase 3で必要

| サービス | やること | 取得するもの |
|:---------|:---------|:-------------|
| Vercel | アカウント作成 | デプロイ時に設定 |
| ドメイン | 任意のドメイン取得 | DNS設定 |
| Supabase Auth | Google OAuth設定（GCP） | OAuth Client ID/Secret |

### 50人達成後に必要

| サービス | やること | 取得するもの |
|:---------|:---------|:-------------|
| Stripe | アカウント作成、テストモード有効化、商品(月額480円)作成 | `STRIPE_SECRET_KEY`, `STRIPE_PUBLISHABLE_KEY`, `STRIPE_PRICE_ID` |

---

## Phase 1: プロジェクト基盤（Week 1）

### Task 1-1: プロジェクト初期化

```
Claude Codeへの指示:

Next.jsプロジェクトを以下の設定で初期化してください。
- Next.js 14+ (App Router)
- TypeScript (strict mode)
- TailwindCSS 3.x
- ESLint + Prettier
- CLAUDE.mdの内容に従ったディレクトリ構成を作成
- .env.exampleファイルを作成
- package.jsonにCLAUDE.md記載のscriptsを設定

CLAUDE.mdを読んでプロジェクトのルールを理解してから実行してください。
```

**確認ポイント**: `npm run dev`で起動、`npm run lint`と`npm run type-check`がパスすること。

---

### Task 1-2: データベーススキーマ作成

```
Claude Codeへの指示:

要件定義書のセクション5「データ要件」に基づいて、
Supabaseのマイグレーションファイルを作成してください。

テーブル: users, suggestions, experience_logs, subscriptions, mood_logs

以下を含めてください:
- RLS (Row Level Security) ポリシー
- インデックス（user_id, date での検索が高頻度）
- created_at, updated_atの自動設定トリガー
- 外部キー制約
- ENUMの型定義

ファイル: supabase/migrations/001_initial_schema.sql
```

**確認ポイント**: Supabase Dashboardでテーブルが正しく作成されること。

---

### Task 1-3: 認証基盤

```
Claude Codeへの指示:

Supabase Authを使った認証基盤を実装してください。

1. lib/supabase/client.ts - ブラウザ用Supabaseクライアント
2. lib/supabase/server.ts - サーバー用Supabaseクライアント（cookies使用）
3. lib/supabase/middleware.ts - 認証ミドルウェア
4. middleware.ts（ルート） - Next.jsミドルウェアで認証チェック
5. app/(auth)/login/page.tsx - ログイン画面
   - メール/パスワードログイン
   - Googleログインボタン（Supabase Auth）
6. app/(auth)/signup/page.tsx - サインアップ画面
7. app/(auth)/reset-password/page.tsx - パスワードリセット
8. app/api/auth/callback/route.ts - OAuth コールバック
9. hooks/useAuth.ts - 認証カスタムフック
10. components/layout/AuthGuard.tsx - 認証ガードコンポーネント
11. app/(app)/layout.tsx - 認証必要ページの共通レイアウト

ブランドカラー（CLAUDE.md参照）を使い、モバイルファーストのUIにしてください。
提案テキストのフォントはserif系（Noto Serif JP）を使います。

※ Google OAuthの設定は後で行うため、まずメール認証が動く状態でOKです。
※ LINEログインはSupabase Auth未対応のため、認証はGoogle + メールのみ。LINE連携は通知機能で別途実装。
```

**確認ポイント**: メールでサインアップ→ログイン→保護ページへのアクセスが動作すること。

---

## Phase 2: コア機能（Week 2-4）

### Task 2-1: AI提案エンジン

```
Claude Codeへの指示:

AI提案生成エンジンを実装してください。

1. lib/ai/prompts.ts - プロンプトテンプレート
   要件定義書のF-002に基づき、以下のコンテキスト変数を受け取る:
   - weather（天気）、temperature（気温）、dayOfWeek（曜日）
   - season（季節）、mood（気分、任意）、history（過去の履歴サマリー）
   - areaType（都市部/郊外/地方）
   
   提案カテゴリ7種: 五感/探検/プチ冒険/マインドフルネス/つながり/創作/内省
   
   出力形式: { title: string, body: string, closing: string, category: string }
   
   プロンプトのトーン:
   - 温かく、優しく、詩的だが地に足がついている
   - コーチが命令するのではなく、親しい友人がそっと囁くような感覚
   - 説教的でない、生産性用語を使わない
   - 30分以内・ゼロコストで実行可能な提案のみ

2. lib/ai/client.ts - Claude APIクライアント
3. lib/weather/client.ts - OpenWeather APIクライアント
4. lib/utils/japanese-calendar.ts - 季節・二十四節気の判定
5. app/api/suggestions/generate/route.ts - 提案生成APIエンドポイント
6. app/api/suggestions/today/route.ts - 今日の提案取得APIエンドポイント

提案はユーザーごとに1日1回生成し、suggestionsテーブルに保存。
同日に再アクセスした場合はDBから取得（再生成しない）。

テスト（vitest）:
- /api/suggestions/today のintegrationテスト（認証済み/未認証）
- /api/suggestions/generate のレスポンス形式検証
- japanese-calendar.ts の季節・二十四節気判定のユニットテスト
```

**確認ポイント**: APIを叩いて日本語の提案が返ること。天気・曜日が反映されていること。テストがパスすること。

---

### Task 2-2: ホーム画面（メイン画面）

```
Claude Codeへの指示:

ホーム画面を実装してください（要件定義書 SCR-004 / F-002 / F-003）。

画面要素:
- 日付と天気の表示
- 今日の提案カード（タイトル/本文/結び）
- 気分セレクター（任意、1タップ: great/good/normal/tired/low）
- 「やった」「スキップ」ボタン
- 「やった」押下時: メモ入力（1行、任意）+ 写真添付（1枚、任意）のモーダル
- 記録完了後の確認画面

UI/UXの要件:
- モバイルファースト（375px基準）
- 提案テキストは大きく、呼吸感のあるレイアウト
- 背景色: #FAFAF7
- 提案テキストフォント: Noto Serif JP
- 「やった」ボタン: #7C9A82（プライマリ）
- 「スキップ」ボタン: テキストのみ（控えめに）
- アニメーションは控えめだが心地よく（フェードイン程度）

必要なコンポーネント:
- components/suggestion/SuggestionCard.tsx
- components/suggestion/ActionButtons.tsx
- components/suggestion/MoodSelector.tsx
- components/log/PhotoUpload.tsx（Supabase Storage使用）

必要なAPI呼び出し:
- GET /api/suggestions/today
- POST /api/mood
- POST /api/logs

テスト（vitest）:
- POST /api/logs のintegrationテスト（やった/スキップ記録）
- POST /api/mood のintegrationテスト
- SuggestionCard, ActionButtons のスナップショットテスト
```

**確認ポイント**: 提案が表示され、やった/スキップが記録できること。写真アップロードが動くこと。テストがパスすること。

---

### Task 2-3: 体験ログ画面

```
Claude Codeへの指示:

体験ログ機能を実装してください（要件定義書 SCR-006, SCR-007 / F-006）。

1. app/(app)/log/page.tsx - カレンダー形式の一覧
   - 月ごとのカレンダー表示
   - 各日付に「やった」(緑丸)/「スキップ」(グレー丸)/未記録(空)を表示
   - 連続達成日数（ストリーク）の表示
   - 無料プラン: 直近7日間のみ（それ以前はブラーしてプレミアム誘導）
   - プレミアム: 全期間閲覧可能
   - フィルタ: 全て/やった/スキップ

2. app/(app)/log/[id]/page.tsx - 体験詳細
   - 提案内容（タイトル/本文/結び）
   - ステータス（やった/スキップ）
   - メモ
   - 写真
   - 日付

3. GET /api/logs - ログ一覧取得API（月単位、プラン制限対応）

必要なコンポーネント:
- components/log/LogCalendar.tsx
- components/log/LogEntry.tsx

テスト（vitest）:
- GET /api/logs のintegrationテスト（プラン制限: 無料は直近7日、プレミアムは全期間）
```

**確認ポイント**: カレンダーに記録が反映され、詳細画面でメモ・写真が表示されること。テストがパスすること。

---

### Task 2-4: シェアカード生成

```
Claude Codeへの指示:

シェアカード生成機能を実装してください（要件定義書 F-005）。

1. app/api/share-card/route.ts
   - サーバーサイドでOG画像を生成（@vercel/og または satori + sharp）
   - 入力: suggestion_id
   - 出力: PNG画像
   
2. シェアカードのデザイン:
   - サイズ: 1200x630px（OGP標準）
   - 背景: #FAFAF7 + 薄いテクスチャ
   - 提案タイトル（大きく中央に）
   - 日付
   - "One Day One Thing" ロゴ/テキスト
   - ユーザーの写真がある場合は小さく配置
   - 無料プラン: ベーシックデザイン1種
   - プレミアム: 3種類から選択可能

3. app/(app)/share/[id]/page.tsx - シェア画面
   - 生成されたカード画像のプレビュー
   - Xシェアボタン（Web Intent URL）
   - Instagramコピー（画像ダウンロード + テキストコピー）
   - 画像ダウンロードボタン

4. OGPメタタグ対応
   - シェアURLにアクセスした際にOGP画像が表示されるようにする
```

**確認ポイント**: カードが生成され、ダウンロードとSNSシェアが動作すること。

---

## Phase 3: 配信・設定（Week 5-6）

### Task 3-1: LINE連携

```
Claude Codeへの指示:

LINE通知連携を実装してください（要件定義書 F-004）。

1. lib/line/client.ts - LINE Messaging APIクライアント
   - プッシュメッセージ送信
   - リッチメッセージ（提案カード風）
   
2. app/api/line/webhook/route.ts
   - LINE Webhookハンドラ
   - 友だち追加イベント → line_user_idをusersテーブルに紐付け
   - フォロー解除イベント → line_user_idをnullに
   
3. app/api/cron/send-notifications/route.ts
   - Vercel Cron Jobsで毎朝7:00 JST（22:00 UTC）に実行
   - CRON_SECRET環境変数でリクエストを認証（Authorizationヘッダーの検証）
   - 不正なリクエストには401を返す
   - LINE連携済み & 通知ON のユーザー全員に一斉配信
   - 各ユーザーごとにパーソナライズされた提案テキスト + Webアプリへのリンク

4. 設定画面への追加:
   - LINE連携ボタン（未連携時）→ QRコードで友だち追加
   - 通知ON/OFF切り替え（連携済み時）

LINE連携は、LINE Loginとは別に、LINE公式アカウントの友だち追加で
ユーザーのLINE IDを取得する方式です。

テスト（vitest）:
- LINE Webhookのシグネチャ検証テスト
- Cronエンドポイントの認証テスト（CRON_SECRET検証）

vercel.json にcron設定を追加してください:
{
  "crons": [
    { "path": "/api/cron/send-notifications", "schedule": "0 22 * * *" }
  ]
}
（UTC 22:00 = JST 07:00、全ユーザーに一斉配信）
```

**確認ポイント**: LINE公式アカウントへの友だち追加→提案メッセージ受信が動作すること。

---

### Task 3-2: ユーザー設定画面

```
Claude Codeへの指示:

ユーザー設定画面を実装してください（要件定義書 F-011 / SCR-009）。

app/(app)/settings/page.tsx:
- ニックネーム編集
- エリアタイプ選択（都市部/郊外/地方）
- LINE通知設定（連携状態、ON/OFF切り替え）
- データ管理
  - データ利用の同意管理
  - アカウント削除ボタン（確認ダイアログ付き）
- ログアウトボタン

app/api/settings/route.ts:
- GET: 現在の設定取得
- PUT: 設定更新

テスト（vitest）:
- GET/PUT /api/settings のintegrationテスト（認証済み/未認証）

アカウント削除時:
- Supabase Authのユーザー削除
- 関連データの削除（GDPR/個人情報保護法対応）
```

**確認ポイント**: 各設定の変更が保存・反映されること。アカウント削除が正常に動作すること。

---

## Phase 4: 公開準備（Week 7-8）

### Task 4-1: ランディングページ

```
Claude Codeへの指示:

ランディングページを実装してください（要件定義書 SCR-001）。

app/page.tsx:
セクション構成:
1. ヒーロー: キャッチコピー「毎日、たったひとつだけ。」+ サインアップCTA
2. 課題提起: 「選択肢が多すぎて、何も選べない」
3. 解決策: One Day One Thingの仕組み（3ステップ図解）
4. 提案例: 実際の提案テキスト3つ（コンテキスト別）
5. 機能紹介: 主要機能のビジュアル説明
6. FAQ: よくある質問5つ
7. CTA: サインアップボタン
8. フッター: リンク集、法的ページ

デザイン:
- ブランドカラーパレット（CLAUDE.md参照）準拠
- 余白たっぷりのミニマルデザイン
- モバイルファーストだがデスクトップでも美しく
- スクロールアニメーション（控えめ）

SEO:
- メタタグ最適化（title, description, og:image）
- 構造化データ（JSON-LD）
- 「休日 何する」「暇 やること」をターゲットキーワードに意識
```

**確認ポイント**: LP→サインアップの導線がスムーズなこと。モバイル/PCで表示崩れがないこと。

---

### Task 4-2: 法的ページ

```
Claude Codeへの指示:

法的ページを3つ作成してください（要件定義書 セクション9）。

1. app/legal/privacy/page.tsx - プライバシーポリシー
   - 収集する情報（メール、ニックネーム、エリア、体験ログ、写真）
   - AI API（Anthropic）への送信データの説明
   - Cookieの使用
   - データの保存期間
   - 第三者提供（Stripe, LINE, Supabase）
   - データ削除の手続き
   - お問い合わせ先

2. app/legal/terms/page.tsx - 利用規約
   - サービスの概要
   - AI生成コンテンツの免責事項
   - 禁止事項
   - サブスクリプションと解約
   - サービスの変更・終了
   - 免責事項

3. app/legal/tokushoho/page.tsx - 特定商取引法に基づく表記
   - 販売業者名
   - 所在地
   - 連絡先
   - 販売価格（月額480円税込）
   - 支払方法（クレジットカード）
   - 引渡し時期
   - 返品・キャンセル

※ 法的文書のため、内容はテンプレートとして作成し、
   リリース前に法律の専門家にレビューしてもらう前提です。
   その旨をコメントで記載してください。
```

**確認ポイント**: 各ページが正しく表示され、フッターからリンクが機能すること。

---

### Task 4-3: 最終仕上げ・デプロイ準備

```
Claude Codeへの指示:

デプロイ前の最終仕上げを行ってください。

1. Bottom Navigation (components/layout/BottomNav.tsx)
   - ホーム / ログ / 設定 の3タブ
   - 現在のページをハイライト

2. Header (components/layout/Header.tsx)
   - "One Day One Thing" ロゴ
   - 設定アイコン

3. Loading / Error状態
   - 全ページにローディングスケルトン追加
   - エラーバウンダリ実装
   - 404ページ

4. PWA対応（最低限）
   - manifest.json
   - アプリアイコン
   - テーマカラー設定

5. Rate Limiting
   - API Routes（特に /api/suggestions/generate）にレート制限を実装
   - Upstash Redisを使ったレート制限（サーバーレス環境対応）
   - ※ メモリベースのレート制限はVercelのサーバーレス環境ではインスタンス間で状態が共有されないため不可
   - 提案生成APIは1ユーザー1日1回に制限（外部APIコスト抑制）

6. 環境変数チェック
   - .env.example が全変数を網羅していること
   - 環境変数未設定時のわかりやすいエラーメッセージ

7. vercel.json
   - Cron Jobs設定
   - リダイレクトルール

8. README.md
   - セットアップ手順
   - 開発コマンド
   - 環境変数一覧

9. パフォーマンス確認
   - 画像最適化（next/image使用の確認）
   - 不要なクライアントサイドJSの削減
   - Lighthouse スコア確認用のメモ
```

**確認ポイント**: `npm run build`が成功、全ページの動線確認、Vercelへのデプロイ成功。

---

## Phase 5: 収益化（50人達成後）

> **注意**: このフェーズはユーザー数が50人に達してから実施します。

### Task 5-1: Stripe決済

```
Claude Codeへの指示:

Stripeによるサブスクリプション決済を実装してください（要件定義書 F-010）。

1. lib/stripe/client.ts - Stripeクライアント
2. app/api/subscription/create/route.ts
   - Stripe Checkout Sessionを作成
   - success_url, cancel_urlを設定
3. app/api/subscription/cancel/route.ts
   - サブスクリプションをキャンセル（期間末まで利用可能）
4. app/api/subscription/webhook/route.ts
   - Stripe Webhookハンドラ
   - checkout.session.completed → subscriptionsテーブル更新、users.is_premium = true
   - customer.subscription.deleted → is_premium = false
   - invoice.payment_failed → past_due処理
5. hooks/useSubscription.ts - サブスク状態管理フック
6. app/(app)/plan/page.tsx (SCR-010)
   - 無料 vs プレミアムの比較表
   - 「プレミアムに申し込む」ボタン → Stripe Checkout
   - 現在のプラン表示
   - 解約ボタン（プレミアム時）

月額480円（税込）。テストモードで動作確認できるようにしてください。
Webhook署名検証を必ず実装してください。
```

**確認ポイント**: テストカードで決済→プレミアム有効化→解約のフローが動作すること。

---

### Task 5-2: 月次レポート（プレミアム機能）

```
Claude Codeへの指示:

月次レポート機能を実装してください（要件定義書 F-008）。

1. app/api/reports/monthly/route.ts
   - 指定月の体験データを集計
   - 「やった」数、カテゴリ別集計、最長ストリーク、ハイライト選出
   
2. app/api/cron/generate-reports/route.ts
   - 毎月1日にCronで実行
   - 全プレミアムユーザーのレポートを生成
   - LINE通知でレポート閲覧リンクを送信

3. app/(app)/report/page.tsx (SCR-012)
   - 月間の「やった」数（大きく表示）
   - カテゴリ別の円グラフ
   - 連続達成日数
   - 印象的な体験ベスト3
   - 月ごとの切り替え

プレミアム限定機能です。無料ユーザーがアクセスした場合はプラン誘導を表示。
```

**確認ポイント**: テストデータでレポートが正しく集計・表示されること。

---

## 実行上の注意事項

### Claude Codeへの指示のコツ

1. **CLAUDE.mdを最初に読ませる**
   各セッションの冒頭で「CLAUDE.mdを読んでプロジェクトのルールを理解してから作業してください」と指示。

2. **1タスク1セッション**
   上記のタスクを1つずつ実行。前のタスクが完了してから次へ進む。

3. **確認ポイントを必ず実行**
   各タスク完了後、手動で動作確認してから次のタスクへ。

4. **エラーが出たらそのまま貼る**
   エラーメッセージをそのままClaude Codeに貼って修正を依頼。

5. **要件定義書を参照させる**
   「要件定義書のF-002を参照して」のように、具体的なセクションを指定。

### よくある問題と対処法

| 問題 | 対処法 |
|:-----|:-------|
| Supabase接続エラー | .env.localの値を確認、Supabaseダッシュボードでプロジェクトがアクティブか確認 |
| 型エラーが多発 | `npx supabase gen types typescript` で型を再生成 |
| API Routeが動かない | `export const dynamic = 'force-dynamic'` を追加 |
| 画像アップロードが失敗 | Supabase Storageのバケット作成とRLSポリシーを確認 |
| Stripe Webhookが受信できない | `stripe listen --forward-to localhost:3000/api/subscription/webhook` でローカルテスト |

---

## タスク完了チェックリスト

### Phase 1: プロジェクト基盤

- [ ] Task 1-1: プロジェクト初期化完了
- [ ] Task 1-2: DBスキーマ作成完了
- [ ] Task 1-3: 認証基盤完了

### Phase 2: コア機能

- [ ] Task 2-1: AI提案エンジン完了
- [ ] Task 2-2: ホーム画面完了
- [ ] Task 2-3: 体験ログ画面完了
- [ ] Task 2-4: シェアカード生成完了

### Phase 3: 配信・設定

- [ ] Task 3-1: LINE連携完了
- [ ] Task 3-2: ユーザー設定画面完了

### Phase 4: 公開準備

- [ ] Task 4-1: ランディングページ完了
- [ ] Task 4-2: 法的ページ完了
- [ ] Task 4-3: 最終仕上げ・デプロイ完了

### Phase 5: 収益化（50人達成後）

- [ ] Task 5-1: Stripe決済完了
- [ ] Task 5-2: 月次レポート完了

---

## 想定スケジュール

| 週 | タスク | 所要時間目安 |
|:---|:-------|:-------------|
| Week 1 | Task 1-1 〜 1-3 | 15-20h |
| Week 2 | Task 2-1 〜 2-2 | 15-20h |
| Week 3 | Task 2-3 〜 2-4 | 15-20h |
| Week 4 | Task 3-1 〜 3-2 | 15-20h |
| Week 5 | Task 4-1 〜 4-2 | 15-20h |
| Week 6 | Task 4-3 + テスト | 15-20h |
| Week 7-8 | 修正・ベータ準備・公開 | 15-20h |
| 50人達成後 | Task 5-1 〜 5-2（収益化） | 15-20h |
