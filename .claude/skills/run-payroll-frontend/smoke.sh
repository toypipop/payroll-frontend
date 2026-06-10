#!/usr/bin/env bash
# Smoke-test the payroll frontend dev server.
# Usage: bash smoke.sh
# Run from: payroll-frontend/ inside Git Bash or WSL (not PowerShell)

ERRORS=0
ok()   { echo "  OK  $1"; }
fail() { echo "  FAIL $1"; ((ERRORS++)); }

echo ""
echo "=== payroll-frontend smoke ==="
echo ""

# Kill any lingering Vite processes
pkill -f "vite" 2>/dev/null || true
sleep 1

# Install deps if needed
[ ! -d node_modules ] && npm install --silent

# Start Vite in background
npm run dev > /dev/null 2>&1 &
FE_PID=$!
echo "[1] Vite PID $FE_PID — port-scanning 5174..5180..."

# Detect port by scanning (Vite auto-increments if 5174 is occupied)
PORT=""
for i in $(seq 1 20); do
  sleep 1
  for p in 5174 5175 5176 5177 5178 5179 5180; do
    STATUS=$(curl -s -o /dev/null -w "%{http_code}" "http://localhost:$p" --max-time 0.5 2>/dev/null)
    if [ "$STATUS" = "200" ]; then PORT=$p; break 2; fi
  done
done

if [ -z "$PORT" ]; then
  echo "  FAIL Vite never became ready"
  kill $FE_PID 2>/dev/null; pkill -f "vite" 2>/dev/null
  exit 1
fi

echo "  Vite on :$PORT"
BASE="http://localhost:$PORT"

# Probes
STATUS=$(curl -s -o /dev/null -w "%{http_code}" "$BASE")
[ "$STATUS" = "200" ] && ok "GET / -> 200" || fail "GET / -> $STATUS"

BODY=$(curl -s "$BASE")
echo "$BODY" | grep -q 'id="root"' && ok "HTML has #root div"    || fail "HTML missing #root"
echo "$BODY" | grep -q '<script'   && ok "HTML has Vite bundle"  || fail "HTML missing script"

# Cleanup
kill $FE_PID 2>/dev/null
pkill -f "vite" 2>/dev/null
wait 2>/dev/null

echo ""
echo "=== $( [ $ERRORS -eq 0 ] && echo 'ALL PASSED' || echo "$ERRORS FAILED" ) ==="
echo ""
exit $ERRORS
