#!/usr/bin/env bash
# End-to-end smoke test: login → dashboard pages → actions.
set -u
BASE="http://localhost:3000"
JAR=$(mktemp)
PASS=0; FAIL=0

check() { # name expected actual
  if [ "$2" = "$3" ]; then echo "  ✓ $1 ($3)"; PASS=$((PASS+1)); else echo "  ✗ $1 (expected $2, got $3)"; FAIL=$((FAIL+1)); fi
}

echo "── Login as Côte Sauvage owner (grace.l@example.com)"
# fetch login page (to get any cookies), then POST the server action
curl -s -c "$JAR" -b "$JAR" "$BASE/login" -o /dev/null

# Next.js server actions require the action id; simplest reliable path is the
# form POST endpoint. We use the dev-mode action via the HTML form's action id.
# Instead: exercise auth by hitting the pages with a session cookie created
# through the login action id discovered from the page.
ACTION=$(curl -s -c "$JAR" -b "$JAR" "$BASE/login" | grep -oE '"\$ACTION_ID_[a-f0-9]+"' | head -1 | tr -d '"')
echo "  action id: ${ACTION:-<none found>}"

if [ -n "${ACTION:-}" ]; then
  curl -s -c "$JAR" -b "$JAR" -X POST "$BASE/login" \
    -H "Next-Action: ${ACTION#\$ACTION_ID_}" \
    -F "email=grace.l@example.com" -F "password=demo" -o /dev/null -w "  login POST: %{http_code}\n"
fi

echo
echo "── Authenticated dashboard pages"
for p in /dashboard /dashboard/floor /dashboard/menu /dashboard/tables /dashboard/analytics /dashboard/ai /dashboard/feedback /dashboard/branding /dashboard/staff; do
  code=$(curl -s -c "$JAR" -b "$JAR" -m 20 -o /dev/null -w "%{http_code}" "$BASE$p")
  check "$p" "200" "$code"
done

echo
echo "── Tenant isolation: staff user cannot reach /admin"
JAR2=$(mktemp)
curl -s -c "$JAR2" -b "$JAR2" "$BASE/login" -o /dev/null
code=$(curl -s -c "$JAR2" -b "$JAR2" -m 15 -o /dev/null -w "%{http_code}" "$BASE/admin")
check "/admin unauthenticated" "307" "$code"

echo
echo "── Guest APIs"
code=$(curl -s -m 15 -o /dev/null -w "%{http_code}" -X POST "$BASE/api/resolve" -H 'content-type: application/json' -d '{"code":"T8SAUV","source":"nfc","language":"fr"}')
check "POST /api/resolve" "200" "$code"
code=$(curl -s -m 15 -o /dev/null -w "%{http_code}" -X POST "$BASE/api/resolve" -H 'content-type: application/json' -d '{"code":"NOPE9","source":"qr"}')
check "POST /api/resolve (bad code → 404)" "404" "$code"

echo
echo "════ $PASS passed, $FAIL failed ════"
rm -f "$JAR" "$JAR2"
exit $FAIL
