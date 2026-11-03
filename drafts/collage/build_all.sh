#!/bin/sh
# Rebuild every page from site/index.html (shared head, header, footer) and parts/.
cd "$(dirname "$0")"
for x in "pg paintings.html Paintings paintings.html" "pc postcards.html Postcards postcards.html" "sk stickers.html Stickers stickers.html" "ca calendar.html Calendar calendar.html" "st story.html Story story.html" "sh shop.html Shop shop.html" "ac account.html Account x" "co checkout.html Checkout x" "pf profile.html Account x" "hp help.html Help x" "tm terms.html Terms x" "nf 404.html 404 x"; do set -- $x; python3 build_pg.py $1 $2 "$3" $4 >/dev/null || echo "FAILED $1"; done
