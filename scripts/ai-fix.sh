#!/bin/bash
# AI Code Fix using Claude Haiku API
# Usage: ./scripts/ai-fix.sh <error_log_file>

set -e

ERROR_LOG="${1:-/dev/stdin}"

if [ -z "$ANTHROPIC_API_KEY" ]; then
  echo "Error: ANTHROPIC_API_KEY is not set" >&2
  exit 1
fi

# Read error content
if [ "$ERROR_LOG" = "/dev/stdin" ]; then
  ERROR_CONTENT=$(cat)
else
  ERROR_CONTENT=$(cat "$ERROR_LOG")
fi

if [ -z "$ERROR_CONTENT" ]; then
  echo "No errors to fix"
  exit 0
fi

# ============================================
# Guard: Extract allowed file paths from errors
# ============================================
# Only .ts/.tsx/.js/.jsx files mentioned in error logs are allowed
ALLOWED_FILES=$(echo "$ERROR_CONTENT" | grep -oE '[a-zA-Z0-9_./-]+\.(ts|tsx|js|jsx)' | sort -u)

if [ -z "$ALLOWED_FILES" ]; then
  echo "No source files found in error logs"
  exit 0
fi

echo "=== Allowed files for modification ==="
echo "$ALLOWED_FILES"
echo "======================================="

# Truncate if too large
MAX_CHARS=20000
if [ ${#ERROR_CONTENT} -gt $MAX_CHARS ]; then
  ERROR_CONTENT="${ERROR_CONTENT:0:$MAX_CHARS}

... (truncated)"
fi

# Escape for JSON
ERROR_ESCAPED=$(echo "$ERROR_CONTENT" | jq -Rs .)

# Create prompt — strict instructions to prevent over-fixing
PROMPT=$(cat <<'PROMPT_EOF'
You are a TypeScript/React error fixer. Your ONLY job is to fix the specific errors shown in the error logs.

## CRITICAL RULES:
1. ONLY modify files that appear in the error logs
2. ONLY fix the specific errors mentioned - do NOT refactor, improve, or change anything else
3. NEVER modify package.json, tsconfig.json, .eslintrc, or any config file
4. NEVER add new dependencies or imports that weren't already there
5. Keep the EXACT same code style, formatting, and structure
6. If unsure about a fix, skip that file entirely

## Output Format (MUST follow exactly):
For each file that needs fixing:

===FILE_START===
path: <relative file path>
===CONTENT_START===
<complete fixed file content>
===CONTENT_END===

Output ONLY the file blocks above. No explanations, no markdown, no commentary.
PROMPT_EOF
)

# Build request body for Claude Haiku
REQUEST_BODY=$(jq -n \
  --arg prompt "$PROMPT" \
  --argjson errors "$ERROR_ESCAPED" \
  '{
    "model": "claude-haiku-4-5-20251001",
    "max_tokens": 8192,
    "messages": [{
      "role": "user",
      "content": ($prompt + "\n\n## Error Logs:\n```\n" + $errors + "\n```")
    }]
  }')

# Call Claude API
RESPONSE=$(curl -s -X POST \
  "https://api.anthropic.com/v1/messages" \
  -H "Content-Type: application/json" \
  -H "x-api-key: ${ANTHROPIC_API_KEY}" \
  -H "anthropic-version: 2023-06-01" \
  -d "$REQUEST_BODY")

# Check for API errors
if echo "$RESPONSE" | jq -e '.error' > /dev/null 2>&1; then
  ERROR_MSG=$(echo "$RESPONSE" | jq -r '.error.message')
  echo "Error: Claude API error - $ERROR_MSG" >&2
  exit 1
fi

# Extract fix content
FIX_CONTENT=$(echo "$RESPONSE" | jq -r '.content[0].text // ""')

if [ -z "$FIX_CONTENT" ]; then
  echo "No fixes generated"
  exit 0
fi

# ============================================
# Parse and apply fixes (with allowlist guard)
# ============================================
APPLIED_COUNT=0
BLOCKED_COUNT=0

while IFS= read -r line; do
  if [[ "$line" == "===FILE_START===" ]]; then
    CURRENT_FILE=""
    CONTENT=""
    IN_CONTENT=false
  elif [[ "$line" =~ ^path:\ (.+)$ ]]; then
    CURRENT_FILE="${BASH_REMATCH[1]}"
    CURRENT_FILE=$(echo "$CURRENT_FILE" | xargs) # trim whitespace
  elif [[ "$line" == "===CONTENT_START===" ]]; then
    IN_CONTENT=true
    CONTENT=""
  elif [[ "$line" == "===CONTENT_END===" ]]; then
    IN_CONTENT=false

    # Guard: only apply if file is in the allowlist
    if [ -n "$CURRENT_FILE" ] && echo "$ALLOWED_FILES" | grep -qF "$CURRENT_FILE"; then
      if [ -f "$CURRENT_FILE" ]; then
        echo "$CONTENT" > "$CURRENT_FILE"
        echo "✅ Fixed: $CURRENT_FILE"
        ((APPLIED_COUNT++))
      else
        echo "⚠️ Skipped (file not found): $CURRENT_FILE"
      fi
    elif [ -n "$CURRENT_FILE" ]; then
      echo "🚫 Blocked (not in error logs): $CURRENT_FILE"
      ((BLOCKED_COUNT++))
    fi
  elif [ "$IN_CONTENT" = true ]; then
    if [ -z "$CONTENT" ]; then
      CONTENT="$line"
    else
      CONTENT="$CONTENT
$line"
    fi
  fi
done <<< "$FIX_CONTENT"

echo ""
echo "Applied $APPLIED_COUNT fix(es), blocked $BLOCKED_COUNT file(s)"

if [ $APPLIED_COUNT -gt 0 ]; then
  exit 0
else
  exit 1
fi
