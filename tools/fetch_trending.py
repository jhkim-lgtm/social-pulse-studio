#!/usr/bin/env python3
"""Discovery 트렌딩 수집기 — 외부 급상승 콘텐츠 3소스를 모아 assets/trending-content.js 생성.

소스:
  1. TikTok Creative Center (공식 트렌드 허브) — 국가별 급상승 크리에이터/영상, 상세 모달의 실제 미리보기 mp4 다운로드
  2. Douyin 热点榜 (공식 실시간 핫보드) — 급상승 토픽 50개 중 상위, 热度·연관 영상 수·커버
  3. TikTok Creative Center KR 해시태그 — 한국 주간 급상승 해시태그 (비로그인은 TOP 3까지 공개)
  4. Instagram 매거진 급상승 (eyesmag · dailyfashion_news · fastpapermag) — Business Discovery API로
     최근 게시물 좋아요를 스냅샷 저장(tools/state/ig_like_snapshots.json)하고, 재실행 시 차분으로
     '1분당 좋아요 증가'를 실측 계산. 첫 실행은 게시 후 평균 증가율로 폴백.

참고: YouTube 트렌딩 페이지는 2025-07 폐지되어(피드 빈 껍데기만 반환) 소스에서 제외.
Playboard 등 국내 집계 사이트는 봇 차단으로 제외.

사용: python3 tools/fetch_trending.py   (헤드리스 Chrome + websocket-client 필요)
"""
import json, os, re, subprocess, sys, time, urllib.request, urllib.parse

APP_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
ASSET_DIR = os.path.join(APP_DIR, "assets", "trending")
os.makedirs(ASSET_DIR, exist_ok=True)
UA = "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36"
CHROME = "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome"
NOW = time.time()

def http_get(url, referer=None, timeout=60):
    headers = {"User-Agent": UA, "Accept-Language": "ko,en;q=0.9,ja;q=0.8,zh;q=0.7"}
    if referer:
        headers["Referer"] = referer
    req = urllib.request.Request(url, headers=headers)
    return urllib.request.urlopen(req, timeout=timeout).read()

def download(url, dest, referer=None, max_mb=45):
    data = http_get(url, referer=referer, timeout=180)
    if len(data) > max_mb * 1024 * 1024:
        return None
    with open(dest, "wb") as f:
        f.write(data)
    return len(data)

def parse_count(text):
    m = re.search(r"([\d.,]+)\s*([KMB만억]?)", text or "")
    if not m:
        return 0
    value = float(m.group(1).replace(",", ""))
    mult = {"K": 1e3, "M": 1e6, "B": 1e9, "만": 1e4, "억": 1e8}.get(m.group(2), 1)
    return int(value * mult)

items = []

# ---------------------------------------------------------------- 1. Douyin 热点榜
def fetch_douyin(limit=8):
    got = []
    url = "https://www.douyin.com/aweme/v1/web/hot/search/list/?device_platform=webapp&aid=6383&channel=channel_pc_web"
    data = json.loads(http_get(url, referer="https://www.douyin.com/"))
    words = data.get("data", {}).get("word_list", [])[: limit * 2]
    for w in words:
        if len(got) >= limit:
            break
        sid = w.get("sentence_id")
        cover_urls = (w.get("word_cover") or {}).get("url_list") or []
        if not sid or not cover_urls:
            continue
        dest = os.path.join(ASSET_DIR, f"douyin_{sid}.jpg")
        try:
            if download(cover_urls[0], dest, referer="https://www.douyin.com/", max_mb=10) is None:
                continue
        except Exception as e:
            print(f"[douyin] cover fail {sid}: {e}", file=sys.stderr)
            continue
        got.append({
            "platform": "Douyin",
            "group": "Douyin",
            "creator": "抖音热点榜",
            "title": w.get("word"),
            "views": w.get("hot_value") or 0,
            "likes": None,
            "metricLabel": "연관 영상",
            "metricValue": w.get("video_count") or w.get("discuss_video_count") or 0,
            "badge": f"热度 {round((w.get('hot_value') or 0)/1e4)}만",
            "rank": w.get("position"),
            "age": "실시간",
            "mediaType": "image",
            "asset": f"assets/trending/douyin_{sid}.jpg",
            "poster": f"assets/trending/douyin_{sid}.jpg",
            "originalUrl": f"https://www.douyin.com/hot/{sid}",
            "source": "Douyin 热点榜 (공식 실시간)",
        })
    return got

# ---------------------------------------------------------------- 1b. Instagram 버티컬 급상승 (Business Discovery + 좋아요 스냅샷 차분)
# 계정 목록은 tools/ig_sources.json에서 관리 (버티컬: 패션/뷰티/호텔/럭셔리 라이프/럭셔리 브랜드/자동차/F&B)
IG_SOURCES_PATH = os.path.join(os.path.dirname(os.path.abspath(__file__)), "ig_sources.json")
IG_TOKEN_PATH = os.path.expanduser("~/sales-agent/scripts/instagram_token.json")
IG_SELF_ID = "17841456731873380"  # 1club.kr (Business Discovery 호출 주체)
SNAPSHOT_PATH = os.path.join(os.path.dirname(os.path.abspath(__file__)), "state", "ig_like_snapshots.json")

def relative_age(ts_iso):
    try:
        posted = time.mktime(time.strptime(ts_iso[:19], "%Y-%m-%dT%H:%M:%S")) - time.timezone
        minutes = max(1, (NOW - posted) / 60)
    except Exception:
        return "", 1
    if minutes < 60:
        return f"{round(minutes)}분 전", minutes
    if minutes < 60 * 24:
        return f"{round(minutes/60)}시간 전", minutes
    return f"{round(minutes/1440)}일 전", minutes

def fetch_instagram_rising(per_account=2):
    try:
        tok = json.load(open(IG_TOKEN_PATH))["access_token"]
    except Exception as e:
        print(f"[ig] token 없음: {e}", file=sys.stderr)
        return []
    try:
        all_sources = json.load(open(IG_SOURCES_PATH))["accounts"]
    except Exception as e:
        print(f"[ig] ig_sources.json 로드 실패: {e}", file=sys.stderr)
        return []
    # --rotate N: 계정을 N개 슬롯으로 나눠 이번 실행은 한 슬롯만 조회 (5분 주기 실행 시 레이트리밋 방지).
    # 조회하지 않은 계정의 항목은 직전 스냅샷에서 이어받는다.
    sources = all_sources
    rotate = None
    if "--rotate" in sys.argv:
        rotate = max(1, int(sys.argv[sys.argv.index("--rotate") + 1]))
        slot = int(NOW // 300) % rotate
        sources = [s for i, s in enumerate(all_sources) if i % rotate == slot]
        print(f"[ig] rotate {slot + 1}/{rotate}: {[s['username'] for s in sources]}", file=sys.stderr)
    os.makedirs(os.path.dirname(SNAPSHOT_PATH), exist_ok=True)
    try:
        snapshots = json.load(open(SNAPSHOT_PATH))
    except Exception:
        snapshots = {}
    got = []
    # 기존 베이스라인에서 시작 — 이번 실행에서 조회 실패한 계정의 측정 기준점을 잃지 않는다
    new_snapshots = dict(snapshots)
    for src_index, src in enumerate(sources):
        username, label, vertical = src["username"], src["label"], src["vertical"]
        if src_index:
            time.sleep(2)  # Business Discovery 레이트리밋 완화
        fields = (f"business_discovery.username({username})"
                  "{followers_count,media{id,caption,media_type,media_url,thumbnail_url,permalink,timestamp,like_count,comments_count}}")
        url = f"https://graph.facebook.com/v21.0/{IG_SELF_ID}?" + urllib.parse.urlencode({"fields": fields, "access_token": tok})
        bd = None
        for attempt in range(3):
            try:
                bd = json.load(urllib.request.urlopen(url, timeout=60))["business_discovery"]
                break
            except Exception as e:
                is_rate_limit = "403" in str(e) or "429" in str(e)
                print(f"[ig] {username} 조회 실패 (시도 {attempt + 1}/3): {e}", file=sys.stderr)
                time.sleep(30 if is_rate_limit else 3)
        if bd is None:
            continue
        followers = bd.get("followers_count") or 0
        candidates = []
        for m in (bd.get("media") or {}).get("data", [])[:20]:
            mid, likes = m.get("id"), m.get("like_count")
            if not mid or likes is None:
                continue
            age_label, minutes_live = relative_age(m.get("timestamp", ""))
            prev = snapshots.get(mid)
            live_delta = False
            elapsed_min = (NOW - prev["ts"]) / 60 if prev else None
            if prev and 2 <= elapsed_min <= 720 and likes >= prev["likes"]:
                velocity = (likes - prev["likes"]) / elapsed_min
                live_delta = True
            else:
                velocity = likes / minutes_live  # 첫 실행 폴백: 게시 후 평균 증가율
            # 2분 미만 재실행은 기존 베이스라인 유지 (차분 측정 창 보존)
            new_snapshots[mid] = prev if (prev and elapsed_min is not None and elapsed_min < 2) else {"likes": likes, "ts": NOW}
            candidates.append((velocity, live_delta, age_label, m))
        candidates.sort(key=lambda c: c[0], reverse=True)
        for pick_rank, (velocity, live_delta, age_label, m) in enumerate(candidates[:per_account]):
            mid = m["id"]
            is_video = m.get("media_type") == "VIDEO"
            media_url = m.get("media_url")
            poster_url = m.get("thumbnail_url") or media_url
            if not poster_url:
                continue
            base = f"ig_{username}_{mid}"
            asset_rel = poster_rel = f"assets/trending/{base}.jpg"
            try:
                # 용량 관리: 계정별 급상승 1위 항목만 영상(mp4) 저장, 나머지는 썸네일
                if is_video and media_url and pick_rank == 0:
                    if download(media_url, os.path.join(ASSET_DIR, base + ".mp4"), referer="https://www.instagram.com/", max_mb=25):
                        asset_rel = f"assets/trending/{base}.mp4"
                download(poster_url, os.path.join(ASSET_DIR, base + ".jpg"), referer="https://www.instagram.com/", max_mb=15)
            except Exception as e:
                print(f"[ig] {username} 미디어 실패 {mid}: {e}", file=sys.stderr)
                continue
            caption = (m.get("caption") or "").strip()
            vel_label = f"+{velocity:.1f}/분" if velocity < 10 else f"+{round(velocity)}/분"
            got.append({
                "platform": "Instagram",
                "group": "IG-Media",
                "vertical": vertical,
                "creator": f"@{username}",
                "creatorName": label,
                "title": caption.split("\n")[0][:80] if caption else f"@{username} 게시물",
                "views": None,
                "likes": m.get("like_count"),
                "metricLabel": "팔로워",
                "metricValue": followers,
                "velocity": round(velocity, 2),
                "velocityLive": live_delta,
                "badge": f"{vel_label} {'실측' if live_delta else '평균'}",
                "rankValue": velocity,
                "age": age_label,
                "topic": label,
                "mediaType": "video" if asset_rel.endswith(".mp4") else "image",
                "asset": asset_rel,
                "poster": poster_rel,
                "originalUrl": m.get("permalink"),
                "source": f"{label} · 좋아요 스냅샷 차분",
            })
            print(f"[ig:{username}] {vertical} {vel_label}{'(실측)' if live_delta else '(평균)'} likes={m.get('like_count')} {m.get('media_type')}", file=sys.stderr)
    json.dump(new_snapshots, open(SNAPSHOT_PATH, "w"))
    # 로테이션 실행이면 이번에 조회하지 않은 계정의 항목을 직전 스냅샷에서 이어받는다
    if rotate:
        fetched = {f"@{s['username']}" for s in sources}
        valid = {f"@{s['username']}" for s in all_sources}
        try:
            previous_ig = [p for p in json.load(open(os.path.join(APP_DIR, "assets", "trending-content.json")))
                           if p.get("group") == "IG-Media" and p.get("creator") in valid - fetched]
            got.extend(previous_ig)
        except Exception:
            pass
    return got

# ---------------------------------------------------------------- 2. TikTok CC KR 급상승 해시태그
def fetch_kr_hashtags():
    if websocket is None:
        return []
    got = []
    port = 9362
    profile = "/tmp/pulse-chrome-ttcc"
    proc = subprocess.Popen([CHROME, "--headless=new", "--disable-gpu", f"--remote-debugging-port={port}",
                             "--remote-allow-origins=*", "--window-size=1440,2400",
                             f"--user-agent={UA}", f"--user-data-dir={profile}-h", "--lang=en-US", "about:blank"],
                            stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
    try:
        ws_url = None
        for _ in range(40):
            try:
                pages = [t for t in json.load(urllib.request.urlopen(f"http://localhost:{port}/json")) if t.get("type") == "page"]
                if pages:
                    ws_url = pages[0]["webSocketDebuggerUrl"]; break
            except Exception:
                pass
            time.sleep(0.5)
        if not ws_url:
            return got
        ws = websocket.create_connection(ws_url, timeout=60)
        mid = [0]

        def send(method, **params):
            mid[0] += 1
            ws.send(json.dumps({"id": mid[0], "method": method, "params": params}))
            return mid[0]

        def wait(rid, seconds=25):
            deadline = time.time() + seconds
            while time.time() < deadline:
                ws.settimeout(1)
                try:
                    msg = json.loads(ws.recv())
                except Exception:
                    continue
                if msg.get("id") == rid:
                    return msg.get("result", {})
            return {}

        send("Page.enable")
        send("Page.navigate", url="https://ads.tiktok.com/creative/creativeCenter/trends/hashtag?region=KR&period=7")
        time.sleep(18)
        r = wait(send("Runtime.evaluate", expression="document.body.innerText", returnByValue=True))
        text = (r.get("result", {}) or {}).get("value", "")
        ws.close()
        # 텍스트 파싱: "1\n#태그\n(카테고리...)\nN\nPosts\nN\nViews"
        lines = [l.strip() for l in text.split("\n") if l.strip()]
        i = 0
        while i < len(lines) and len(got) < 6:
            if lines[i].isdigit() and i + 1 < len(lines) and lines[i + 1].startswith("#"):
                rank = int(lines[i])
                tag = lines[i + 1]
                posts = views = 0
                cats = []
                j = i + 2
                while j < len(lines) - 1 and j < i + 10:
                    if lines[j + 1] == "Posts":
                        posts = parse_count(lines[j]); j += 2; continue
                    if lines[j + 1] == "Views":
                        views = parse_count(lines[j]); j += 2; break
                    if not lines[j].isdigit() and lines[j] not in ("Posts", "Views"):
                        cats.append(lines[j])
                    j += 1
                got.append({
                    "platform": "TikTok",
                    "group": "KR-Hashtag",
                    "creator": "TikTok Korea",
                    "title": f"{tag} — 한국 주간 급상승 {rank}위",
                    "hashtag": tag,
                    "views": views,
                    "likes": None,
                    "metricLabel": "게시물",
                    "metricValue": posts,
                    "badge": f"KR #{rank}",
                    "rank": rank,
                    "age": "주간 집계",
                    "topic": " · ".join(cats[:2]),
                    "mediaType": "hashtag",
                    "asset": None,
                    "poster": None,
                    "originalUrl": f"https://www.tiktok.com/tag/{urllib.parse.quote(tag.lstrip('#'))}",
                    "source": "TikTok Creative Center · KR 주간 해시태그",
                })
                i = j
            else:
                i += 1
        return got
    finally:
        proc.terminate()

# ---------------------------------------------------------------- 3. TikTok Creative Center
try:
    import websocket
except ImportError:
    websocket = None

def fetch_tiktok_cc(regions=("JP", "US"), per_region=4):
    if websocket is None:
        print("[tiktok] websocket-client 미설치 — 건너뜀", file=sys.stderr)
        return []
    got = []
    port = 9361
    profile = "/tmp/pulse-chrome-ttcc"
    proc = subprocess.Popen([CHROME, "--headless=new", "--disable-gpu", f"--remote-debugging-port={port}",
                             "--remote-allow-origins=*", "--window-size=1440,2400",
                             f"--user-agent={UA}", f"--user-data-dir={profile}", "--lang=en-US", "about:blank"],
                            stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
    try:
        ws_url = None
        for _ in range(40):
            try:
                pages = [t for t in json.load(urllib.request.urlopen(f"http://localhost:{port}/json")) if t.get("type") == "page"]
                if pages:
                    ws_url = pages[0]["webSocketDebuggerUrl"]; break
            except Exception:
                pass
            time.sleep(0.5)
        if not ws_url:
            print("[tiktok] chrome debug target 없음", file=sys.stderr)
            return got
        ws = websocket.create_connection(ws_url, timeout=60)
        mid = [0]

        def send(method, **params):
            mid[0] += 1
            ws.send(json.dumps({"id": mid[0], "method": method, "params": params}))
            return mid[0]

        def wait(rid, seconds=25):
            deadline = time.time() + seconds
            while time.time() < deadline:
                ws.settimeout(1)
                try:
                    msg = json.loads(ws.recv())
                except Exception:
                    continue
                if msg.get("id") == rid:
                    return msg.get("result", {})
            return {}

        def js(expr, seconds=25):
            r = wait(send("Runtime.evaluate", expression=expr, returnByValue=True), seconds)
            return r.get("result", {}).get("value")

        send("Page.enable")
        for region in regions:
            send("Page.navigate", url=f"https://ads.tiktok.com/creative/creativeCenter/trends/video?region={region}&period=7")
            time.sleep(18)
            count = js("[...document.querySelectorAll('button, a, div[role=button], span')].filter(e => e.textContent.trim() === 'View details').length") or 0
            print(f"[tiktok:{region}] detail buttons: {count}", file=sys.stderr)
            for idx in range(min(per_region, int(count))):
                js(f"""
                  (() => {{
                    const btns = [...document.querySelectorAll('button, a, div[role=button], span')].filter(e => e.textContent.trim() === 'View details');
                    btns[{idx}] && btns[{idx}].click();
                  }})()
                """)
                time.sleep(7)
                info = js("""
                  (() => {
                    const dlg = document.querySelector('[class*=modal],[class*=Modal],[class*=drawer],[class*=Drawer],[role=dialog]');
                    const v = document.querySelector('video');
                    if (!dlg || !v) return null;
                    const lines = dlg.innerText.split('\\n').map(s => s.trim()).filter(Boolean);
                    return { lines: lines.slice(0, 24), src: v.src || v.currentSrc || '', poster: v.poster || '' };
                  })()
                """)
                # 모달 닫기 (ESC)
                for kind in ("keyDown", "keyUp"):
                    send("Input.dispatchKeyEvent", type=kind, key="Escape", code="Escape",
                         windowsVirtualKeyCode=27, nativeVirtualKeyCode=27)
                time.sleep(2)
                if not info or not info.get("src"):
                    continue
                lines = info["lines"]
                handle = lines[0] if lines else f"tiktok_{region}_{idx}"
                name = lines[1] if len(lines) > 1 else handle
                followers = 0
                views = 0
                topic = ""
                for i, ln in enumerate(lines):
                    if ln == "Followers" and i > 0:
                        followers = parse_count(lines[i - 1])
                    if ln == "Video views" and i + 1 < len(lines):
                        views = parse_count(lines[i + 1])
                    if ln == "Content topic" and i + 1 < len(lines):
                        topic = lines[i + 1]
                safe = re.sub(r"[^\w.-]", "_", handle)[:40]
                base = f"tiktok_{region.lower()}_{safe}"
                dest = os.path.join(ASSET_DIR, base + ".mp4")
                try:
                    size = download(info["src"], dest, referer="https://ads.tiktok.com/", max_mb=45)
                    if size is None:
                        continue
                except Exception as e:
                    print(f"[tiktok:{region}] video fail {handle}: {e}", file=sys.stderr)
                    continue
                poster_rel = None
                if not info.get("poster"):
                    try:
                        poster_path = os.path.join(ASSET_DIR, base + "_poster.jpg")
                        r = subprocess.run(["ffmpeg", "-y", "-ss", "0.5", "-i", dest, "-frames:v", "1", "-q:v", "3", poster_path], capture_output=True)
                        if r.returncode == 0 and os.path.exists(poster_path):
                            poster_rel = f"assets/trending/{base}_poster.jpg"
                    except Exception:
                        pass
                if info.get("poster"):
                    try:
                        if download(info["poster"], os.path.join(ASSET_DIR, base + "_poster.jpg"),
                                    referer="https://ads.tiktok.com/", max_mb=10):
                            poster_rel = f"assets/trending/{base}_poster.jpg"
                    except Exception:
                        pass
                got.append({
                    "platform": "TikTok",
                    "group": "TikTok",
                    "creator": f"@{handle}",
                    "creatorName": name,
                    "title": f"{name} — 주간 급상승 {'· ' + topic if topic else ''}".strip(),
                    "views": views,
                    "likes": None,
                    "metricLabel": "팔로워",
                    "metricValue": followers,
                    "badge": f"{region} 주간 TOP",
                    "age": "주간 집계",
                    "topic": topic,
                    "mediaType": "video",
                    "asset": f"assets/trending/{base}.mp4",
                    "poster": poster_rel or f"assets/trending/{base}.mp4",
                    "originalUrl": f"https://www.tiktok.com/@{handle}",
                    "source": f"TikTok Creative Center · {region} 주간",
                })
                print(f"[tiktok:{region}] {handle} views={views} followers={followers} ({(size or 0)//1024}KB)", file=sys.stderr)
        ws.close()
    finally:
        proc.terminate()
    return got

# ---------------------------------------------------------------- 실행 & 저장
FETCHERS = (
    (fetch_tiktok_cc, "tiktok", ("TikTok",)),
    (fetch_kr_hashtags, "kr-hashtag", ("KR-Hashtag",)),
    (fetch_douyin, "douyin", ("Douyin",)),
    (fetch_instagram_rising, "ig", ("IG-Media",)),
)
only = None
if "--only" in sys.argv:
    only = set(sys.argv[sys.argv.index("--only") + 1].split(","))

refreshed_groups = set()
for fetcher, label, groups in FETCHERS:
    if only and label not in only:
        continue
    try:
        batch = fetcher()
        print(f"[{label}] {len(batch)} items")
        items.extend(batch)
        refreshed_groups.update(groups)
    except Exception as e:
        print(f"[{label}] FAILED: {e}", file=sys.stderr)

# 부분 갱신 병합 + 열화 가드
try:
    previous = json.load(open(os.path.join(APP_DIR, "assets", "trending-content.json")))
except Exception:
    previous = []

# 열화 가드: 재수집한 그룹의 결과가 직전 대비 60% 미만이면(레이트리밋 등) 직전 항목을 유지
for group in list(refreshed_groups):
    prev_group = [p for p in previous if p.get("group") == group]
    new_group = [i for i in items if i.get("group") == group]
    if prev_group and len(new_group) < len(prev_group) * 0.6:
        print(f"[guard] {group}: 이번 {len(new_group)}건 < 직전 {len(prev_group)}건의 60% — 직전 데이터 유지", file=sys.stderr)
        items = [i for i in items if i.get("group") != group] + prev_group
        refreshed_groups.discard(group)

# --only 부분 갱신: 재수집하지 않은 그룹은 기존 스냅샷 유지
if only:
    items = [p for p in previous if p.get("group") not in refreshed_groups and
             not any(i.get("group") == p.get("group") for i in items)] + items

# 최종 items가 참조하지 않는 IG 미디어 정리
referenced = set()
for i in items:
    for key in ("asset", "poster"):
        if i.get(key):
            referenced.add(os.path.basename(i[key]))
for f in os.listdir(ASSET_DIR):
    if f.startswith("ig_") and f not in referenced:
        os.remove(os.path.join(ASSET_DIR, f))

stamp = time.strftime("%Y-%m-%d %H:%M", time.localtime(NOW))
for i, item in enumerate(items):
    item["fetchedAt"] = stamp

json_path = os.path.join(APP_DIR, "assets", "trending-content.json")
json.dump(items, open(json_path, "w"), ensure_ascii=False, indent=2)
js_path = os.path.join(APP_DIR, "assets", "trending-content.js")
with open(js_path, "w") as f:
    f.write("/* 외부 급상승 콘텐츠 스냅샷 — tools/fetch_trending.py로 재수집. 소스: TikTok Creative Center · Douyin 热点榜 · YouTube 트렌딩 KR */\n")
    f.write("window.TRENDING_DISCOVERY = " + json.dumps(items, ensure_ascii=False, indent=2) + ";\n")
    f.write(f"window.TRENDING_FETCHED_AT = {json.dumps(stamp)};\n")
print(f"TOTAL {len(items)} items -> {js_path}")
