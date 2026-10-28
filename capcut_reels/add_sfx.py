"""캡컷 초안 "릴스_러프컷"에 효과음 트랙을 넣는다. (캡컷에서 프로젝트를 닫은 뒤 실행)

사용법:  ~/.pycapcut/bin/python add_sfx.py [초안폴더] [효과음폴더]
  효과음폴더 기본값: ~/릴스효과음  (없는 소리는 Openverse에서 받아 효과음폴더/openverse 에 저장)
다시 실행하면 기존 "효과음" 트랙을 지우고 새로 만든다.
"""
import json, os, sys, urllib.parse, urllib.request
import pycapcut as cc

DRAFT_NAME = "릴스_러프컷"
TRACK = "효과음"
LEAD = 0.05     # 문장 시작보다 0.05초 먼저
VOLUME = 0.5
AUDIO_EXT = (".mp3", ".wav", ".m4a", ".aac", ".flac")
KEYWORDS = {    # 파일 이름에 이 단어가 들어 있으면 그 소리로 쓴다
    "whoosh": ["whoosh", "휙", "휘익"], "swoosh": ["swoosh", "슉", "슈욱"],
    "click": ["click", "클릭", "딸깍"], "pop": ["pop", "팝", "뽁"], "ding": ["ding", "딩", "띵"],
}
# 자막 문장(앞부분) -> (소리, 이유). 30초 기준 4~8개 규칙으로 고른 것
CUES = [
    ("안녕하세요", "whoosh", "첫 문장"),
    ("저는 지금", "swoosh", "주제 전환: 인사 → 지금 하는 작업"),
    ("컷 편집", "click", "목록 시작: 컷 편집, 자막, 효과음"),
    ("수정이 다 되면", "swoosh", "주제 전환: 작업 소개 → 결과 보기"),
]

def default_draft_root():
    if os.name == "nt":
        return os.path.join(os.environ["LOCALAPPDATA"], "CapCut", "User Data", "Projects", "com.lveditor.draft")
    return os.path.expanduser("~/Movies/CapCut/User Data/Projects/com.lveditor.draft")

draft_root = sys.argv[1] if len(sys.argv) > 1 else default_draft_root()
sfx_dir = sys.argv[2] if len(sys.argv) > 2 else os.path.expanduser("~/릴스효과음")
cache_dir = os.path.join(sfx_dir, "openverse")
meta_path = os.path.join(cache_dir, "meta.json")

def sentence_starts(content):
    """자막 트랙의 (시작초, 문장) 목록"""
    texts = {m["id"]: json.loads(m["content"])["text"] for m in content["materials"]["texts"]}
    out = []
    for t in content["tracks"]:
        if t["type"] == "text":
            for s in t["segments"]:
                out.append((s["target_timerange"]["start"] / 1e6, texts[s["material_id"]]))
    return sorted(out)

def find_local(kind):
    if not os.path.isdir(sfx_dir):
        return None
    for f in sorted(os.listdir(sfx_dir)):
        stem, ext = os.path.splitext(f)
        if ext.lower() in AUDIO_EXT and any(k in stem.lower() for k in KEYWORDS[kind]):
            return os.path.join(sfx_dir, f)
    return None

def fetch_openverse(kind, meta):
    if kind in meta and os.path.exists(meta[kind]["path"]):
        return meta[kind]
    q = urllib.parse.urlencode({"q": kind, "license": "cc0,by", "page_size": 50})
    req = urllib.request.Request(f"https://api.openverse.org/v1/audio/?{q}", headers={"User-Agent": "reels-sfx/1.0"})
    results = json.load(urllib.request.urlopen(req, timeout=30))["results"]
    # 4초 이하 첫 결과 (캡컷이 못 여는 형식은 건너뜀)
    r = next((r for r in results
              if r.get("duration") and r["duration"] <= 4000
              and os.path.splitext(urllib.parse.urlparse(r["url"]).path)[1].lower() in AUDIO_EXT), None)
    if r is None:
        raise RuntimeError(f"Openverse에서 4초 이하 '{kind}' 소리를 찾지 못했습니다")
    os.makedirs(cache_dir, exist_ok=True)
    ext = os.path.splitext(urllib.parse.urlparse(r["url"]).path)[1].lower()
    path = os.path.join(cache_dir, f"{kind}_{r['id']}{ext}")
    with urllib.request.urlopen(urllib.request.Request(r["url"], headers={"User-Agent": "reels-sfx/1.0"}), timeout=60) as resp, \
            open(path, "wb") as f:
        f.write(resp.read())
    meta[kind] = {"path": path, "title": r.get("title"), "creator": r.get("creator"),
                  "license": r["license"], "license_version": r.get("license_version"),
                  "license_url": r.get("license_url"), "page": r.get("foreign_landing_url"),
                  "attribution": r.get("attribution"), "duration": r["duration"] / 1000}
    return meta[kind]

script = cc.DraftFolder(draft_root).load_template(DRAFT_NAME)
content = script.content
starts = sentence_starts(content)
print("문장 시작 시간")
for t, s in starts:
    print(f"  {t:6.2f}s  {s}")

# 다시 실행할 때 이전 효과음 트랙과 그 소리 소재를 지운다
old = [t for t in script.imported_tracks if t.name == TRACK]
old_ids = {seg.material_id for t in old for seg in t.segments}
script.imported_tracks = [t for t in script.imported_tracks if t.name != TRACK]
script.imported_materials["audios"] = [m for m in script.imported_materials.get("audios", []) if m["id"] not in old_ids]

meta = json.load(open(meta_path, encoding="utf-8")) if os.path.exists(meta_path) else {}
cues = []
for prefix, kind, why in CUES:
    t = next((t for t, s in starts if s.startswith(prefix)), None)
    if t is None:
        print(f"  ! '{prefix}' 자막을 찾지 못해 건너뜀")
        continue
    local = find_local(kind)
    src = {"path": local, "license": "local"} if local else fetch_openverse(kind, meta)
    cues.append((max(0.0, t - LEAD), kind, why, prefix, src))
if meta:
    json.dump(meta, open(meta_path, "w", encoding="utf-8"), ensure_ascii=False, indent=1)

script.add_track(cc.TrackType.audio, TRACK)
end_us = script.duration
rows = []
for i, (at, kind, why, prefix, src) in enumerate(cues):
    mat = cc.AudioMaterial(src["path"])
    a = round(at * 1e6)
    limit = round(cues[i + 1][0] * 1e6) if i + 1 < len(cues) else end_us   # 같은 트랙에서 겹치지 않게
    length = min(mat.duration, limit - a)
    script.add_segment(cc.AudioSegment(mat, cc.Timerange(a, length), volume=VOLUME), TRACK)
    rows.append((at, kind, prefix, why, src, length / 1e6))
script.save()

lic = lambda s: "직접 넣은 파일" if s["license"] == "local" else f"CC {s['license'].upper()} {s.get('license_version') or ''}".strip()
print(f"\n| 시간 | 소리 | 자막 | 이유 | 파일 | 라이선스 |\n|---|---|---|---|---|---|")
for at, kind, prefix, why, src, ln in rows:
    print(f"| {at:.2f}s | {kind} | {prefix}… | {why} | {os.path.basename(src['path'])} ({ln:.2f}s) | {lic(src)} |")
credits = [s for *_, s, _ in rows if s["license"] == "by"]
seen = set()
lines = []
for s in credits:
    if s["path"] in seen:
        continue
    seen.add(s["path"])
    lines.append(f"🔊 \"{s['title']}\" by {s['creator']} / CC BY {s.get('license_version') or ''} ({s['page']})".replace("  ", " "))
if lines:
    text = "효과음 출처\n" + "\n".join(lines)
    open(os.path.join(sfx_dir, "출처_캡션.txt"), "w", encoding="utf-8").write(text + "\n")
    print("\n캡션 출처 문구 (출처_캡션.txt 에도 저장):\n" + text)
else:
    print("\nCC BY 소리가 없어 출처 표기가 필요 없습니다.")
print(f"\n저장 완료: {os.path.join(draft_root, DRAFT_NAME)}  → 캡컷을 다시 여세요.")
