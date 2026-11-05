#!/bin/zsh
# 毎朝: ニュースを取り直して GitHub Pages に公開する（launchd から呼ばれる）
set -u
export PATH="/Users/ayano/Claude/tools/selvante_setup/bin:/usr/local/bin:/opt/homebrew/bin:/usr/bin:/bin"
export GH_CONFIG_DIR="/Users/ayano/Claude/tools/selvante_setup/ghconfig"
cd "$(dirname "$0")/.." || exit 1
LOG=tools/daily.log
echo "== $(date '+%F %T')" >> $LOG

TODAY=$(TZ=Asia/Tokyo date +%F)
if grep -q "\"date\": \"$TODAY\"" data/news.json 2>/dev/null; then
  echo "already updated for $TODAY" >> $LOG; exit 0
fi

git pull --rebase -q >> $LOG 2>&1
node tools/update_news.mjs >> $LOG 2>&1 || { echo "news update failed" >> $LOG; exit 1; }
git add data/news.json data/seen.json
git commit -q -m "news: $TODAY" >> $LOG 2>&1 && git push -q >> $LOG 2>&1 && echo "pushed" >> $LOG
