# Auto Fix CI Demo

CI自動化促進のための検証プロジェクト。

## 概要

GitHub Actions + AI を組み合わせ、以下を自動化する検証：

- **自動テスト修正**: CI失敗時にAIがエラーを分析し、簡単なテスト・型エラーを自動修正
- **自動コードレビュー**: PRに対して学習済みレビュアーが自動でレビューコメント
- **構想: staging自動割当**: PRごとにstagingを自動割当し、デプロイ確認を並列化

## 使い方

### 自動修正 (CI Fix)

PR作成 → CI失敗 → AIが自動修正コミット → 再実行

```
PR Push → TypeCheck/Lint/Test
              ↓ Fail
         AI Fix (auto-commit)
              ↓
         Re-run CI
              ↓ Pass
         AI Review → Ready to Merge
```

### 自動レビュー (Code Review)

過去のマージ済みPRレビューを学習したレビュアーバイナリ（`bin/demo-reviewer-20260205`）を使用。

```bash
# ローカルで実行
ANTHROPIC_API_KEY=xxx OPENAI_API_KEY=xxx REVIEWER_SALT=xxx \
  ./bin/demo-reviewer-20260205 changes.diff
```

必要な環境変数 / GitHub Secrets:

| 変数                | 説明                         |
| ------------------- | ---------------------------- |
| `ANTHROPIC_API_KEY` | Claude API Key               |
| `OPENAI_API_KEY`    | OpenAI API Key (embedding用) |
| `REVIEWER_SALT`     | レビュアー認証キー           |

### 構想: staging自動割当

PRごとにpreview環境を自動割当し、複数PRの並列検証を可能にする。

## 技術スタック

| カテゴリ       | 技術                             |
| -------------- | -------------------------------- |
| モノレポ       | Turborepo                        |
| フレームワーク | Next.js                          |
| 言語           | TypeScript                       |
| テスト         | Vitest                           |
| AI (レビュー)  | Claude Opus 4 + OpenAI Embedding |
| AI (修正)      | Gemini                           |
| CI/CD          | GitHub Actions                   |

## Contributing

[@interfirm/dev](https://github.com/orgs/interfirm/teams/dev)
