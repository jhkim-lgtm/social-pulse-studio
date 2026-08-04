#!/bin/zsh
# Pulse Discovery 자동 갱신 + GitHub Pages(live 브랜치) 배포
# - 기본(5분 주기): IG 로테이션(절반씩) + Douyin 핫보드 갱신
# - FULL=1 (일 1회): TikTok CC 영상/KR 해시태그 포함 전체 갱신
# 히스토리 비대 방지를 위해 live 브랜치는 단일 커밋 amend + force push로 유지한다.
set -u
export PATH="/opt/homebrew/bin:/usr/local/bin:/usr/bin:/bin"

APP="/Users/bk/orca/workspaces/sales-agent/편집기제작/social-pulse-studio"
DEPLOY="$HOME/.pulse-live-deploy"
LOCK="/tmp/pulse-trending.lock"
LOG="/tmp/pulse-trending.log"

# 중복 실행 방지 (10분 이상 된 락은 스테일로 간주)
if [ -d "$LOCK" ]; then
  if [ -n "$(find "$LOCK" -maxdepth 0 -mmin -10 2>/dev/null)" ]; then
    echo "$(date '+%F %T') lock 존재, 스킵" >> "$LOG"; exit 0
  fi
  rm -rf "$LOCK"
fi
mkdir "$LOCK"
trap 'rm -rf "$LOCK"' EXIT

cd "$APP"
echo "$(date '+%F %T') fetch 시작 (FULL=${FULL:-0})" >> "$LOG"
if [ "${FULL:-0}" = "1" ]; then
  /usr/bin/python3 tools/fetch_trending.py >> "$LOG" 2>&1 || echo "$(date '+%F %T') full fetch 실패" >> "$LOG"
else
  /usr/bin/python3 tools/fetch_trending.py --only ig,douyin --rotate 2 >> "$LOG" 2>&1 || echo "$(date '+%F %T') fetch 실패" >> "$LOG"
fi

# 배포 디렉토리 동기화 (상태/프로필/git 제외)
mkdir -p "$DEPLOY"
rsync -a --delete \
  --exclude '.git' --exclude 'tools/state' --exclude 'tools/publish_live.sh' \
  "$APP/" "$DEPLOY/"

cd "$DEPLOY"
if [ ! -d .git ]; then
  git init -q -b live
  git remote add origin https://github.com/jhkim-lgtm/social-pulse-studio.git
fi
git add -A
if git diff --cached --quiet 2>/dev/null && git rev-parse HEAD >/dev/null 2>&1; then
  echo "$(date '+%F %T') 변경 없음, 푸시 스킵" >> "$LOG"; exit 0
fi
if git rev-parse HEAD >/dev/null 2>&1; then
  git commit -q --amend -m "live: $(date '+%F %H:%M')"
else
  git commit -q -m "live: $(date '+%F %H:%M')"
fi
git push -q -f origin live >> "$LOG" 2>&1 && echo "$(date '+%F %T') 배포 완료" >> "$LOG" || echo "$(date '+%F %T') push 실패" >> "$LOG"
