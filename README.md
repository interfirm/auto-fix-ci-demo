# Auto Fix CI Demo - AI-Powered CI/CD Pipeline

GitHub ActionsとGemini APIを使用した、自動テスト・自動修正・自動レビューのデモプロジェクト。

## 🎯 デモの目的

PR作成時に以下のフローを自動実行：

```
PR作成/Push
    ↓
┌─────────────────┐
│ Quality Checks  │ ← TypeCheck, Lint, Test
└────────┬────────┘
         │
    ┌────┴────┐
    │ Pass?   │
    └────┬────┘
         │
    ┌────┴────────────┐
    │                 │
    ↓ No              ↓ Yes
┌─────────┐     ┌─────────────┐
│ AI Fix  │     │  AI Review  │
│ (Gemini)│     │  (Gemini)   │
└────┬────┘     └──────┬──────┘
     │                 │
     ↓                 ↓
  Auto-commit      PR Comment
  & Re-run         (レビュー結果)
                       │
                       ↓
              ┌────────────────┐
              │ Ready to Merge │
              │  @メンション    │
              └────────────────┘
```

## 📁 プロジェクト構成

```
auto-fix-ci-demo/
├── apps/
│   ├── web/          # 公開サイト (Next.js)
│   └── admin/        # 管理画面 (Next.js)
├── packages/
│   └── ui/           # 共有UIコンポーネント
├── .github/
│   └── workflows/
│       ├── pr-pipeline.yml    # メインのCI/CDパイプライン
│       └── merge-deploy.yml   # マージ後の検証
└── scripts/
    ├── ai-review.sh   # Gemini APIでコードレビュー
    ├── ai-fix.sh      # Gemini APIでエラー修正
    └── collect-errors.sh
```

## 🚀 セットアップ

### 1. リポジトリの準備

```bash
# クローン
git clone <repository-url>
cd auto-fix-ci-demo

# 依存関係インストール
pnpm install

# 動作確認
pnpm turbo typecheck
pnpm turbo lint
pnpm turbo test
```

### 2. GitHub Secrets設定

リポジトリの Settings > Secrets and variables > Actions で以下を設定：

| Secret | 説明 |
|--------|------|
| `GEMINI_API_KEY` | Google AI Studio で取得した Gemini API キー |

### 3. ラベル作成

以下のラベルをリポジトリに作成：

- `auto-fix-attempt-1`
- `auto-fix-attempt-2`
- `auto-fix-attempt-3`
- `ready-to-merge`

## 🎮 デモの実行方法

### デモ1: 自動修正フロー

1. 新しいブランチを作成

```bash
git checkout -b demo/broken-code
```

2. 意図的にエラーを含むコードをコミット

```bash
# apps/web/src/lib/demo-broken.ts にエラーが含まれている
git add .
git commit -m "feat: add broken code for demo"
git push -u origin demo/broken-code
```

3. PRを作成してフローを観察
   - TypeCheck/Lint/Test が失敗
   - AI Fix が自動実行
   - 修正がコミットされる
   - 再度チェックが実行される
   - 成功するとAI Reviewが追加される

### デモ2: 正常フロー

1. エラーのないコードでPRを作成
2. 即座にAI Reviewが実行される
3. レビューコメントがPRに追加される
4. `ready-to-merge` ラベルが付与される

## 🔧 カスタマイズ

### 自動修正の試行回数

`.github/workflows/pr-pipeline.yml`:

```yaml
env:
  MAX_AUTO_FIX_ATTEMPTS: 3  # 変更可能
```

### AIレビューのプロンプト

`scripts/ai-review.sh` 内のPROMPT変数を編集。

### AIフィックスの精度向上

`scripts/ai-fix.sh` 内のPROMPT変数でより詳細な指示を追加。

## 🔑 技術スタック

| カテゴリ | 技術 |
|----------|------|
| モノレポ | Turborepo |
| フレームワーク | Next.js 14 |
| 言語 | TypeScript |
| テスト | Vitest |
| Lint | ESLint + Prettier |
| AI | Gemini 1.5 Flash |
| CI/CD | GitHub Actions |

## 📝 注意事項

- `apps/web/src/lib/demo-broken.ts` はデモ用のエラーファイルです
- 本番利用時は削除してください
- Gemini APIには利用制限があります（無料枠: 60 RPM）

## 🤝 Contributing

1. Feature branchを作成
2. 変更をコミット
3. PRを作成 → 自動でチェック & レビュー
4. レビュー通過後マージ
