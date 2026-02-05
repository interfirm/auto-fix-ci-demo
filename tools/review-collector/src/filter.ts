/**
 * filter.ts
 *
 * 収集したレビューを匿名化・フィルタリング
 *
 * - レビュアー名を完全削除
 * - @メンションを削除
 * - 最小文字数チェック
 * - 一般的なパターン（LGTM等）除外
 */

import { readFileSync, writeFileSync } from "fs";

interface RawReview {
  id: number;
  body: string;
  diff_hunk: string;
  path: string;
  line: number | null;
  original_line: number | null;
  commit_id: string;
  created_at: string;
  pr_number: number;
}

interface FilteredReview {
  id: string; // ハッシュ化
  body: string;
  diff_hunk: string;
  path: string;
  line: number | null;
}

const MIN_BODY_LENGTH = 30;

// 除外パターン（先頭一致、短文の場合）
const EXCLUDE_PATTERNS = [
  /^(got it|thanks|thank you|sure|yea|yeah|yes|ok|okay)/i,
  /^(lgtm|looks good|sounds good|nice|great|perfect|awesome|cool)/i,
  /^(agreed|i agree|right|correct|exactly|indeed)/i,
  /^(will do|done|fixed|updated|noted|i see|makes sense)/i,
  /^(👍|✅|🙏|💯|nice!|great!|lgtm!|perfect!)/i,
];

function anonymizeBody(body: string): string {
  // @メンションを削除
  let anonymized = body.replace(/@[a-zA-Z0-9_-]+/g, "");

  // 連続する空白を整理
  anonymized = anonymized.replace(/\s+/g, " ").trim();

  // 先頭の改行・空白を除去
  anonymized = anonymized.replace(/^\s+/, "");

  return anonymized;
}

function shouldExclude(body: string): boolean {
  const lower = body.toLowerCase().trim();

  // 短すぎる
  if (body.length < MIN_BODY_LENGTH) return true;

  // 除外パターンに一致（短文の場合のみ）
  if (body.length < 100) {
    for (const pattern of EXCLUDE_PATTERNS) {
      if (pattern.test(lower)) return true;
    }
  }

  return false;
}

function hashId(id: number): string {
  // 簡易ハッシュ（バイナリ内でIDが追跡されないように）
  const hash = Bun.hash(id.toString()).toString(16);
  return hash.slice(0, 12);
}

async function main() {
  console.log("==========================================");
  console.log("Review Filter & Anonymizer");
  console.log("==========================================");
  console.log("");

  // 入力ファイル読み込み
  const inputPath = "./data/reviews_raw.jsonl";
  let rawReviews: RawReview[];

  try {
    const content = readFileSync(inputPath, "utf-8");
    rawReviews = content
      .trim()
      .split("\n")
      .filter((line) => line.trim())
      .map((line) => JSON.parse(line));
  } catch (error) {
    console.error(`❌ Failed to read ${inputPath}`);
    process.exit(1);
  }

  console.log(`📂 Input: ${rawReviews.length} reviews`);
  console.log("");

  // フィルタリング・匿名化
  const filtered: FilteredReview[] = [];
  const rejected: RawReview[] = [];

  for (const review of rawReviews) {
    const anonymizedBody = anonymizeBody(review.body);

    if (shouldExclude(anonymizedBody)) {
      rejected.push(review);
      continue;
    }

    filtered.push({
      id: hashId(review.id),
      body: anonymizedBody,
      diff_hunk: review.diff_hunk,
      path: review.path,
      line: review.line || review.original_line,
    });
  }

  console.log("==========================================");
  console.log("Filter Complete!");
  console.log("==========================================");
  console.log(`Input: ${rawReviews.length}`);
  console.log(`Accepted: ${filtered.length}`);
  console.log(`Rejected: ${rejected.length}`);
  console.log("");

  // 保存
  const outputPath = "./data/reviews_filtered.jsonl";
  const rejectedPath = "./data/reviews_rejected.jsonl";

  writeFileSync(
    outputPath,
    filtered.map((r) => JSON.stringify(r)).join("\n")
  );
  writeFileSync(
    rejectedPath,
    rejected.map((r) => JSON.stringify(r)).join("\n")
  );

  console.log(`💾 Saved filtered: ${outputPath}`);
  console.log(`💾 Saved rejected: ${rejectedPath}`);
  console.log("");

  // サンプル表示
  if (filtered.length > 0) {
    console.log("📝 Sample (first 3):");
    console.log("------------------------------------------");
    filtered.slice(0, 3).forEach((r) => {
      console.log(`[${r.path}]`);
      console.log(`  ${r.body.slice(0, 80)}...`);
      console.log("");
    });
  }
}

main().catch(console.error);
