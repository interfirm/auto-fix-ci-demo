# Review Collector

PRレビューを収集・学習し、Gemini APIでレビューを生成するCLIツール。

## 特徴

- **Suggestion採用のみ学習**: `\`\`\`suggestion\`\`\``が実際にcommitされたレビューのみ
- **完全匿名化**: レビュアー名、@メンションは削除
- **ローカル類似検索**: ベクトルはバイナリ埋め込み、API不要
- **Gemini API使用**: 実行時はGemini APIのみ（Secrets経由）

## ビルドフロー

```
1. collect.ts   - PRからSuggestion採用レビューを収集
2. filter.ts    - 匿名化・フィルタリング
3. embed.ts     - OpenAI Embeddingでベクトル化
4. build-cli    - Bunでバイナリ化（vectors.json埋め込み）
```

## 使い方

### 1. データ収集（初回のみ）

```bash
cd tools/review-collector

# 依存関係インストール
bun install

# レビュー収集
bun run collect interfirm car-katix 500

# フィルタリング
bun run filter

# Embedding（OpenAI API Key必要）
OPENAI_API_KEY=sk-xxx bun run embed
```

### 2. CLIビルド

```bash
bun run build-cli
# → ../../bin/reviewer が生成される
```

### 3. 使用（GitHub Actions）

```yaml
- name: AI Review
  env:
    GEMINI_API_KEY: ${{ secrets.GEMINI_API_KEY }}
  run: |
    git diff origin/main...HEAD > diff.txt
    ./bin/reviewer diff.txt
```

## ファイル構成

```
tools/review-collector/
├── src/
│   ├── collect.ts   # レビュー収集
│   ├── filter.ts    # 匿名化・フィルタ
│   ├── embed.ts     # Embedding生成
│   └── cli.ts       # CLIエントリポイント
├── data/
│   ├── reviews_raw.jsonl       # 収集済みレビュー
│   ├── reviews_filtered.jsonl  # フィルタ済み
│   └── vectors.json            # Embedding済み（バイナリ埋め込み）
└── package.json
```

## セキュリティ

- バイナリ内にレビュアー名は含まれない
- API Keyは環境変数/Secrets経由のみ
- ベクトルデータからは元のレビュアーを特定不可
