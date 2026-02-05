/**
 * embed.ts
 *
 * フィルタ済みレビューをEmbeddingし、vectors.jsonとして保存
 * このファイルがCLIバイナリに埋め込まれる
 */

import { readFileSync, writeFileSync } from "fs";
import OpenAI from "openai";

interface FilteredReview {
  id: string;
  body: string;
  diff_hunk: string;
  path: string;
  line: number | null;
}

interface EmbeddedReview {
  id: string;
  body: string;
  diff_hunk: string;
  path: string;
  vector: number[];
}

const BATCH_SIZE = 20;
const EMBEDDING_MODEL = "text-embedding-3-small";

async function main() {
  console.log("==========================================");
  console.log("Review Embedder");
  console.log("==========================================");
  console.log("");

  // API Key確認
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    console.error("❌ OPENAI_API_KEY not set");
    console.log("");
    console.log("Run with:");
    console.log("  OPENAI_API_KEY=sk-xxx bun run src/embed.ts");
    process.exit(1);
  }

  const openai = new OpenAI({ apiKey });

  // 入力読み込み
  const inputPath = "./data/reviews_filtered.jsonl";
  let reviews: FilteredReview[];

  try {
    const content = readFileSync(inputPath, "utf-8");
    reviews = content
      .trim()
      .split("\n")
      .filter((line) => line.trim())
      .map((line) => JSON.parse(line));
  } catch (error) {
    console.error(`❌ Failed to read ${inputPath}`);
    process.exit(1);
  }

  console.log(`📂 Input: ${reviews.length} reviews`);
  console.log(`📦 Batch size: ${BATCH_SIZE}`);
  console.log("");

  // バッチ処理
  const batches: FilteredReview[][] = [];
  for (let i = 0; i < reviews.length; i += BATCH_SIZE) {
    batches.push(reviews.slice(i, i + BATCH_SIZE));
  }

  console.log(`🔄 Batches: ${batches.length}`);
  console.log("");

  let totalTokens = 0;
  const embedded: EmbeddedReview[] = [];

  for (let i = 0; i < batches.length; i++) {
    const batch = batches[i];
    console.log(`  Processing batch ${i + 1}/${batches.length}...`);

    // Embedding用テキスト作成
    const texts = batch.map((r) => {
      const diffContext = r.diff_hunk.slice(0, 500);
      return `File: ${r.path}\n\nCode:\n${diffContext}\n\nReview:\n${r.body}`;
    });

    try {
      const response = await openai.embeddings.create({
        model: EMBEDDING_MODEL,
        input: texts,
      });

      totalTokens += response.usage?.total_tokens || 0;

      for (let j = 0; j < batch.length; j++) {
        embedded.push({
          id: batch[j].id,
          body: batch[j].body,
          diff_hunk: batch[j].diff_hunk,
          path: batch[j].path,
          vector: response.data[j].embedding,
        });
      }

      console.log(`  ✅ Batch ${i + 1} done (tokens: ${response.usage?.total_tokens || 0})`);

      // Rate limit
      await Bun.sleep(500);
    } catch (error) {
      console.error(`  ❌ Batch ${i + 1} failed:`, error);
    }
  }

  console.log("");
  console.log("==========================================");
  console.log("Embedding Complete!");
  console.log("==========================================");
  console.log(`Embedded: ${embedded.length}`);
  console.log(`Total tokens: ${totalTokens}`);
  console.log(`Est. cost: $${((totalTokens * 0.02) / 1_000_000).toFixed(4)}`);
  console.log("");

  // 保存
  const outputPath = "./data/vectors.json";
  writeFileSync(outputPath, JSON.stringify(embedded, null, 2));
  console.log(`💾 Saved: ${outputPath}`);
  console.log("");

  // サイズ確認
  const stats = Bun.file(outputPath);
  const size = await stats.size;
  console.log(`📊 File size: ${(size / 1024 / 1024).toFixed(2)} MB`);
}

main().catch(console.error);
