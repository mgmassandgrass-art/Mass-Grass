#!/bin/sh
# Read-only checks of a deployed site. sh test/smoke.sh [https://www.massandgrass.com]
# Changes nothing: GET requests only (no orders, no sign-in).
S=${1:-https://www.massandgrass.com}; bad=0
chk() { if [ "$2" = "$3" ]; then echo "ok   $1"; else echo "FAIL $1 (got $3, want $2)"; bad=$((bad+1)); fi; }
code() { curl -s -o /dev/null -w "%{http_code}" -m 20 "$@"; }
chk "home answers" 200 "$(code "$S/")"
chk "coming-soon page" 200 "$(code "$S/soon")"
chk "admin sends visitors to sign-in" 302 "$(code "$S/admin/")"
chk "admin API hidden" 404 "$(code "$S/api/admin/overview")"
chk "catalog API" 200 "$(code "$S/api/catalog")"
chk "robots.txt" 200 "$(code "$S/robots.txt")"
H=$(curl -sI -m 20 "$S/")
echo "$H" | grep -qi "content-security-policy: default-src 'self'; script-src 'self' https://static" && echo "ok   strict CSP" || { echo "FAIL strict CSP"; bad=$((bad+1)); }
echo "$H" | grep -qi "strict-transport-security: max-age=63072000" && echo "ok   HSTS" || { echo "FAIL HSTS"; bad=$((bad+1)); }
curl -s -m 20 "$S/api/catalog" | grep -q '"s-kaak"' && echo "ok   new catalog in the database" || { echo "FAIL new catalog (migration 0008 applied?)"; bad=$((bad+1)); }
curl -s -m 20 "$S/api/catalog" | grep -q '"s-dove"\|"ppoppies"\|"ptree"' && { echo "FAIL watermarked pieces still on sale"; bad=$((bad+1)); } || echo "ok   no watermarked pieces"
[ $bad -eq 0 ] && echo "all passed" || { echo "$bad failed"; exit 1; }
