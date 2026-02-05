/**
 * collect.ts
 *
 * PRレビューコメントを収集し、Suggestion採用されたもののみ抽出
 *
 * 使い方:
 *   bun run src/collect.ts <org> <repo> [max_prs]
 *
 * 例:
 *   bun run src/collect.ts interfirm car-katix 500
 */

import { $ } from "bun";

interface PRComment {
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

interface Commit {
  sha: string;
  commit: {
    message: string;
    author: {
      date: string;
    };
  };
}

async function ghApi<T>(endpoint: string): Promise<T> {
  const result = await $`gh api ${endpoint} --paginate`.json();
  return result as T;
}

async function ghApiSafe<T>(endpoint: string, defaultValue: T): Promise<T> {
  try {
    return await ghApi<T>(endpoint);
  } catch {
    return defaultValue;
  }
}

function hasSuggestion(body: string): boolean {
  return body.includes("```suggestion");
}

function extractSuggestionContent(body: string): string | null {
  const match = body.match(/```suggestion\s*([\s\S]*?)```/);
  return match ? match[1].trim() : null;
}

async function checkSuggestionAdopted(
  org: string,
  repo: string,
  prNumber: number,
  comment: PRComment
): Promise<boolean> {
  // コメント後のコミットを取得
  const commits = await ghApiSafe<Commit[]>(
    `repos/${org}/${repo}/pulls/${prNumber}/commits`,
    []
  );

  const commentDate = new Date(comment.created_at);
  const laterCommits = commits.filter(
    (c) => new Date(c.commit.author.date) > commentDate
  );

  if (laterCommits.length === 0) return false;

  // Suggestion内容を抽出
  const suggestionContent = extractSuggestionContent(comment.body);
  if (!suggestionContent) return false;

  // 後続コミットで該当ファイルが変更されたか確認
  for (const commit of laterCommits) {
    try {
      const diff = await $`gh api repos/${org}/${repo}/commits/${commit.sha} --jq '.files[] | select(.filename == "${comment.path}") | .patch'`.text();

      // Suggestion内容の一部が含まれていれば採用されたとみなす
      // (完全一致は難しいので、キーとなる部分の存在確認)
      const suggestionLines = suggestionContent.split("\n").filter(l => l.trim().length > 5);
      const adopted = suggestionLines.some(line => diff.includes(line.trim()));

      if (adopted) return true;
    } catch {
      // ファイルが変更されていない場合はスキップ
      continue;
    }
  }

  return false;
}

async function getPRNumbers(org: string, repo: string, maxPRs: number): Promise<number[]> {
  console.log(`📋 Fetching PR list (max: ${maxPRs})...`);

  const prs = await ghApi<Array<{ number: number }>>(
    `repos/${org}/${repo}/pulls?state=all&per_page=100`
  );

  return prs.slice(0, maxPRs).map((pr) => pr.number);
}

async function getCommentsForPR(
  org: string,
  repo: string,
  prNumber: number
): Promise<PRComment[]> {
  const comments = await ghApiSafe<any[]>(
    `repos/${org}/${repo}/pulls/${prNumber}/comments`,
    []
  );

  return comments
    .filter((c) => c.diff_hunk && c.body)
    .map((c) => ({
      id: c.id,
      body: c.body,
      diff_hunk: c.diff_hunk,
      path: c.path,
      line: c.line,
      original_line: c.original_line,
      commit_id: c.commit_id,
      created_at: c.created_at,
      pr_number: prNumber,
    }));
}

async function main() {
  const args = process.argv.slice(2);

  if (args.length < 2) {
    console.error("Usage: bun run src/collect.ts <org> <repo> [max_prs]");
    console.error("Example: bun run src/collect.ts interfirm car-katix 500");
    process.exit(1);
  }

  const [org, repo, maxPRsStr] = args;
  const maxPRs = parseInt(maxPRsStr || "500", 10);

  console.log("==========================================");
  console.log("Review Collector - Suggestion Adopted Only");
  console.log("==========================================");
  console.log(`Repository: ${org}/${repo}`);
  console.log(`Max PRs: ${maxPRs}`);
  console.log("");

  // 1. PR番号一覧を取得
  const prNumbers = await getPRNumbers(org, repo, maxPRs);
  console.log(`✅ Found ${prNumbers.length} PRs`);
  console.log("");

  // 2. 各PRからSuggestion含むコメントを抽出
  console.log("💬 Collecting comments with suggestions...");

  const validReviews: PRComment[] = [];
  let totalComments = 0;
  let suggestionComments = 0;
  let adoptedComments = 0;

  for (let i = 0; i < prNumbers.length; i++) {
    const prNumber = prNumbers[i];

    if ((i + 1) % 20 === 0) {
      console.log(`   Processing: ${i + 1}/${prNumbers.length} PRs (adopted: ${adoptedComments})`);
    }

    const comments = await getCommentsForPR(org, repo, prNumber);
    totalComments += comments.length;

    // Suggestionを含むコメントのみ
    const withSuggestion = comments.filter((c) => hasSuggestion(c.body));
    suggestionComments += withSuggestion.length;

    // Suggestionが採用されたか確認
    for (const comment of withSuggestion) {
      const adopted = await checkSuggestionAdopted(org, repo, prNumber, comment);
      if (adopted) {
        validReviews.push(comment);
        adoptedComments++;
      }
    }

    // Rate limit対策
    await Bun.sleep(100);
  }

  console.log("");
  console.log("==========================================");
  console.log("Collection Complete!");
  console.log("==========================================");
  console.log(`Total comments: ${totalComments}`);
  console.log(`With suggestion: ${suggestionComments}`);
  console.log(`Adopted: ${adoptedComments}`);
  console.log("");

  // 3. 結果を保存
  const outputPath = "./data/reviews_raw.jsonl";
  await Bun.write(
    outputPath,
    validReviews.map((r) => JSON.stringify(r)).join("\n")
  );
  console.log(`💾 Saved to: ${outputPath}`);
}

main().catch(console.error);
