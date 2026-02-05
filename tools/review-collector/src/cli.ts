#!/usr/bin/env bun
/**
 * cli.ts
 *
 * コードレビュー生成CLI
 * Bunでコンパイルして単一バイナリとして配布
 *
 * 使い方:
 *   reviewer <diff_file> [--api-key <key>]
 *
 * 環境変数:
 *   GEMINI_API_KEY - Gemini API Key (required)
 */

// ベクトルデータを埋め込み（ビルド時に解決）
import vectors from "../data/vectors.json";

interface EmbeddedReview {
  id: string;
  body: string;
  diff_hunk: string;
  path: string;
  vector: number[];
}

interface SimilarReview {
  score: number;
  body: string;
  diff_hunk: string;
  path: string;
}

// コサイン類似度計算
function cosineSimilarity(a: number[], b: number[]): number {
  let dotProduct = 0;
  let normA = 0;
  let normB = 0;

  for (let i = 0; i < a.length; i++) {
    dotProduct += a[i] * b[i];
    normA += a[i] * a[i];
    normB += b[i] * b[i];
  }

  return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
}

// 類似レビュー検索（ローカル計算）
function searchSimilar(queryVector: number[], topK: number = 5): SimilarReview[] {
  const reviews = vectors as EmbeddedReview[];

  const scored = reviews.map((r) => ({
    score: cosineSimilarity(queryVector, r.vector),
    body: r.body,
    diff_hunk: r.diff_hunk,
    path: r.path,
  }));

  scored.sort((a, b) => b.score - a.score);

  return scored.slice(0, topK);
}

// Gemini APIでEmbedding生成
async function generateEmbedding(text: string, apiKey: string): Promise<number[]> {
  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/text-embedding-004:embedContent?key=${apiKey}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "models/text-embedding-004",
        content: { parts: [{ text }] },
      }),
    }
  );

  if (!response.ok) {
    throw new Error(`Embedding API error: ${response.statusText}`);
  }

  const data = (await response.json()) as { embedding: { values: number[] } };
  return data.embedding.values;
}

// Gemini APIでレビュー生成
async function generateReview(
  diff: string,
  filePath: string,
  similarReviews: SimilarReview[],
  apiKey: string
): Promise<string> {
  const examples = similarReviews
    .slice(0, 3)
    .map(
      (r, i) => `
## Example ${i + 1} (similarity: ${r.score.toFixed(2)})
**File**: ${r.path}
**Code**:
\`\`\`
${r.diff_hunk.slice(0, 300)}
\`\`\`
**Review**:
${r.body}
`
    )
    .join("\n---\n");

  const systemPrompt = `あなたは熟練のコードレビュアーです。

以下の過去のレビュー例を参考に、同様のスタイルでコードレビューを行ってください。

# レビュースタイルのガイドライン

1. **技術的で詳細**: 実装の詳細に焦点を当てる
2. **説明重視**: 提案の「理由」を説明する
3. **コード例を含める**: 変更を提案する際は、具体的なコードスニペットを含める
4. **問題解決**: 潜在的な問題を指摘する

# 過去のレビュー例

${examples}

---

**重要**:
- レビューは必ず日本語で返してください
- @メンションは含めないでください
- 問題や改善点を指摘する際は、ファイルパスと行番号を明記してください`;

  const userPrompt = `# Code Change to Review

**ファイル**: ${filePath}

**差分**:
\`\`\`diff
${diff}
\`\`\`

上記のコード変更をレビューしてください。`;

  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [
          {
            role: "user",
            parts: [{ text: `${systemPrompt}\n\n${userPrompt}` }],
          },
        ],
        generationConfig: {
          temperature: 0.3,
          maxOutputTokens: 2000,
        },
      }),
    }
  );

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Gemini API error: ${error}`);
  }

  const data = (await response.json()) as {
    candidates: Array<{ content: { parts: Array<{ text: string }> } }>;
  };

  return data.candidates[0]?.content?.parts[0]?.text || "レビューを生成できませんでした";
}

async function main() {
  const args = process.argv.slice(2);

  // ヘルプ表示
  if (args.includes("--help") || args.includes("-h") || args.length === 0) {
    console.log(`
Usage: reviewer <diff_file> [options]

Options:
  --api-key <key>    Gemini API Key (or set GEMINI_API_KEY env)
  --file <path>      File path for context (optional)
  --help, -h         Show this help

Example:
  reviewer changes.diff --file src/index.ts
  GEMINI_API_KEY=xxx reviewer changes.diff
`);
    process.exit(0);
  }

  // 引数解析
  const diffFile = args[0];
  let apiKey = process.env.GEMINI_API_KEY || "";
  let filePath = "";

  for (let i = 1; i < args.length; i++) {
    if (args[i] === "--api-key" && args[i + 1]) {
      apiKey = args[++i];
    } else if (args[i] === "--file" && args[i + 1]) {
      filePath = args[++i];
    }
  }

  if (!apiKey) {
    console.error("❌ GEMINI_API_KEY not set");
    console.error("Set via --api-key or GEMINI_API_KEY environment variable");
    process.exit(1);
  }

  // Diffファイル読み込み
  let diff: string;
  try {
    diff = await Bun.file(diffFile).text();
  } catch {
    console.error(`❌ Cannot read diff file: ${diffFile}`);
    process.exit(1);
  }

  // ファイルパスをdiffから推測
  if (!filePath) {
    const match = diff.match(/^\+\+\+ [ab]\/(.+)$/m);
    filePath = match ? match[1] : "unknown";
  }

  console.log("🔄 Generating embedding...");

  // Embedding生成
  const queryText = `File: ${filePath}\n\nCode:\n${diff.slice(0, 500)}`;
  const queryVector = await generateEmbedding(queryText, apiKey);

  console.log("🔍 Searching similar reviews...");

  // 類似レビュー検索
  const similarReviews = searchSimilar(queryVector, 5);

  console.log("🤖 Generating review...");

  // レビュー生成
  const review = await generateReview(diff, filePath, similarReviews, apiKey);

  // 出力
  console.log("");
  console.log("==========================================");
  console.log("Generated Review");
  console.log("==========================================");
  console.log(review);
  console.log("");

  console.log("📚 Referenced reviews:");
  similarReviews.forEach((r, i) => {
    console.log(`  ${i + 1}. ${r.path} (score: ${r.score.toFixed(2)})`);
  });
}

main().catch((error) => {
  console.error("❌ Error:", error.message);
  process.exit(1);
});
