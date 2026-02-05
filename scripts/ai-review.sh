#!/bin/bash
# AI Code Review using Gemini API
# Usage: ./scripts/ai-review.sh <diff_file> <output_file>

set -e

DIFF_FILE="${1:-/dev/stdin}"
OUTPUT_FILE="${2:-/dev/stdout}"

if [ -z "$GEMINI_API_KEY" ]; then
  echo "Error: GEMINI_API_KEY is not set" >&2
  exit 1
fi

# Read diff content
if [ "$DIFF_FILE" = "/dev/stdin" ]; then
  DIFF_CONTENT=$(cat)
else
  DIFF_CONTENT=$(cat "$DIFF_FILE")
fi

# Skip if diff is empty
if [ -z "$DIFF_CONTENT" ]; then
  echo "No changes to review" > "$OUTPUT_FILE"
  exit 0
fi

# Truncate diff if too large (Gemini has token limits)
MAX_CHARS=30000
if [ ${#DIFF_CONTENT} -gt $MAX_CHARS ]; then
  DIFF_CONTENT="${DIFF_CONTENT:0:$MAX_CHARS}

... (truncated, diff too large)"
fi

# Escape for JSON
DIFF_ESCAPED=$(echo "$DIFF_CONTENT" | jq -Rs .)

# Create prompt
PROMPT=$(cat <<'EOF'
You are a senior code reviewer. Review the following git diff and provide feedback.

## Review Guidelines:
1. **Security**: Check for vulnerabilities (XSS, injection, etc.)
2. **Performance**: Identify potential performance issues
3. **Best Practices**: TypeScript/React patterns, code organization
4. **Bugs**: Potential runtime errors or logic issues
5. **Testing**: Missing test coverage or test quality

## Output Format:
Use this exact markdown format:

### 🔍 Review Summary
[1-2 sentence overall assessment]

### 🚨 Critical Issues
[List critical issues that MUST be fixed, or "None found"]

### ⚠️ Warnings
[List warnings and suggestions]

### 💡 Suggestions
[Optional improvements]

### ✅ Good Practices
[Positive feedback on well-written code]

---

Be concise. Focus on actionable feedback. Use Japanese for the review content.
EOF
)

# Build request body
REQUEST_BODY=$(jq -n \
  --arg prompt "$PROMPT" \
  --argjson diff "$DIFF_ESCAPED" \
  '{
    "contents": [{
      "parts": [{
        "text": ($prompt + "\n\n## Diff:\n```diff\n" + $diff + "\n```")
      }]
    }],
    "generationConfig": {
      "temperature": 0.3,
      "maxOutputTokens": 2048
    }
  }')

# Call Gemini API
RESPONSE=$(curl -s -X POST \
  "https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${GEMINI_API_KEY}" \
  -H "Content-Type: application/json" \
  -d "$REQUEST_BODY")

# Extract review text
REVIEW=$(echo "$RESPONSE" | jq -r '.candidates[0].content.parts[0].text // "Error: Failed to generate review"')

# Check for API errors
if echo "$RESPONSE" | jq -e '.error' > /dev/null 2>&1; then
  ERROR_MSG=$(echo "$RESPONSE" | jq -r '.error.message')
  echo "Error: Gemini API error - $ERROR_MSG" >&2
  exit 1
fi

echo "$REVIEW" > "$OUTPUT_FILE"
echo "Review completed successfully" >&2
