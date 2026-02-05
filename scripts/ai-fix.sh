#!/bin/bash
# AI Code Fix using Gemini API
# Usage: ./scripts/ai-fix.sh <error_log_file>

set -e

ERROR_LOG="${1:-/dev/stdin}"

if [ -z "$GEMINI_API_KEY" ]; then
  echo "Error: GEMINI_API_KEY is not set" >&2
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

# Truncate if too large
MAX_CHARS=20000
if [ ${#ERROR_CONTENT} -gt $MAX_CHARS ]; then
  ERROR_CONTENT="${ERROR_CONTENT:0:$MAX_CHARS}

... (truncated)"
fi

# Escape for JSON
ERROR_ESCAPED=$(echo "$ERROR_CONTENT" | jq -Rs .)

# Create prompt for fix generation
PROMPT=$(cat <<'EOF'
You are an expert TypeScript/React developer. Analyze the following error logs and generate fixes.

## Instructions:
1. Analyze each error carefully
2. For each file with errors, output the COMPLETE fixed file content
3. Use the exact format below for each fix

## Output Format (MUST follow exactly):
For each file that needs fixing:

===FILE_START===
path: <relative file path>
===CONTENT_START===
<complete fixed file content>
===CONTENT_END===

## Rules:
- Output the COMPLETE file content, not just the changed parts
- Do not add explanations between files
- If you cannot determine the fix, skip that file
- Keep existing code style and formatting
- Only fix the actual errors, don't refactor unrelated code
EOF
)

# Build request body
REQUEST_BODY=$(jq -n \
  --arg prompt "$PROMPT" \
  --argjson errors "$ERROR_ESCAPED" \
  '{
    "contents": [{
      "parts": [{
        "text": ($prompt + "\n\n## Error Logs:\n```\n" + $errors + "\n```")
      }]
    }],
    "generationConfig": {
      "temperature": 0.1,
      "maxOutputTokens": 8192
    }
  }')

# Call Gemini API
RESPONSE=$(curl -s -X POST \
  "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${GEMINI_API_KEY}" \
  -H "Content-Type: application/json" \
  -d "$REQUEST_BODY")

# Extract fix content
FIX_CONTENT=$(echo "$RESPONSE" | jq -r '.candidates[0].content.parts[0].text // ""')

# Check for API errors
if echo "$RESPONSE" | jq -e '.error' > /dev/null 2>&1; then
  ERROR_MSG=$(echo "$RESPONSE" | jq -r '.error.message')
  echo "Error: Gemini API error - $ERROR_MSG" >&2
  exit 1
fi

if [ -z "$FIX_CONTENT" ]; then
  echo "No fixes generated"
  exit 0
fi

# Parse and apply fixes
APPLIED_COUNT=0

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
    if [ -n "$CURRENT_FILE" ] && [ -f "$CURRENT_FILE" ]; then
      echo "$CONTENT" > "$CURRENT_FILE"
      echo "✅ Fixed: $CURRENT_FILE"
      ((APPLIED_COUNT++))
    elif [ -n "$CURRENT_FILE" ]; then
      echo "⚠️ Skipped (file not found): $CURRENT_FILE"
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
echo "Applied $APPLIED_COUNT fix(es)"

if [ $APPLIED_COUNT -gt 0 ]; then
  exit 0
else
  exit 1
fi
