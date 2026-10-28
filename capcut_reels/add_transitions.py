"""캡컷 초안 "릴스_러프컷"의 이야기 전환 지점에 장면 전환을 넣는다. (캡컷에서 프로젝트를 닫은 뒤 실행)

사용법:  ~/.pycapcut/bin/python add_transitions.py [초안폴더]
다시 실행하면 이전에 넣은 전환을 지우고 새로 넣는다.
"""
import json, os, sys, uuid
import pycapcut as cc
from pycapcut.video_segment import Transition

DRAFT_NAME = "릴스_러프컷"
SNAP = 0.25   # 문장 시작이 기존 컷과 이만큼 가까우면 그 컷을 쓰고, 아니면 그 자리에서 영상을 나눈다
# 뒤 문장(앞부분) -> (전환, 길이초, 구간). 30초 기준 2~4곳 규칙, 같은 전환 반복 금지
POINTS = [
    ("저는 지금", cc.TransitionType.推近, 0.3, "훅 → 본론 (빠른 줌인)"),
    ("수정이 다 되면", cc.TransitionType.叠化, 0.3, "본론 → 마무리"),
]

def default_draft_root():
    if os.name == "nt":
        return os.path.join(os.environ["LOCALAPPDATA"], "CapCut", "User Data", "Projects", "com.lveditor.draft")
    return os.path.expanduser("~/Movies/CapCut/User Data/Projects/com.lveditor.draft")

draft_root = sys.argv[1] if len(sys.argv) > 1 else default_draft_root()
path = os.path.join(draft_root, DRAFT_NAME, "draft_content.json")
d = json.load(open(path, encoding="utf-8"))
mats = d["materials"]
track = next(t for t in d["tracks"] if t["type"] == "video")
segs = track["segments"]

texts = {m["id"]: json.loads(m["content"])["text"] for m in mats["texts"]}
subs = sorted((s["target_timerange"]["start"], texts[s["material_id"]])
              for t in d["tracks"] if t["type"] == "text" for s in t["segments"])

# 이전 실행에서 넣은 전환 제거
old = {m["id"] for m in mats.get("transitions", [])}
mats["transitions"] = []
for s in segs:
    s["extra_material_refs"] = [r for r in s["extra_material_refs"] if r not in old]

def split_at(us):
    """타임라인 us 지점에서 영상 조각을 둘로 나누고, 뒤 조각의 인덱스를 돌려준다"""
    for i, s in enumerate(segs):
        tt, st = s["target_timerange"], s["source_timerange"]
        if tt["start"] < us < tt["start"] + tt["duration"]:
            head = us - tt["start"]
            tail = json.loads(json.dumps(s))
            tail["id"] = uuid.uuid4().hex
            refs = []
            for r in tail["extra_material_refs"]:   # 속도 등 조각별 소재는 복사해서 새 id
                for kind, lst in mats.items():
                    m = next((m for m in lst if isinstance(m, dict) and m.get("id") == r), None)
                    if m:
                        m2 = dict(m, id=uuid.uuid4().hex); lst.append(m2); refs.append(m2["id"]); break
            tail["extra_material_refs"] = refs
            tail["target_timerange"] = {"start": us, "duration": tt["duration"] - head}
            tail["source_timerange"] = {"start": st["start"] + head, "duration": st["duration"] - head}
            tt["duration"] = st["duration"] = head
            segs.insert(i + 1, tail)
            return i + 1
    raise ValueError(f"{us / 1e6:.2f}s 위치에 영상 조각이 없습니다")

rows = []
for prefix, ttype, dur, why in POINTS:
    i_sub = next((i for i, (_, s) in enumerate(subs) if s.startswith(prefix)), None)
    if i_sub is None:
        print(f"! '{prefix}' 자막을 찾지 못해 건너뜀"); continue
    at = subs[i_sub][0]
    near = min(range(len(segs)), key=lambda i: abs(segs[i]["target_timerange"]["start"] - at))
    if near > 0 and abs(segs[near]["target_timerange"]["start"] - at) <= SNAP * 1e6:
        idx, split = near, False
    else:
        idx, split = split_at(at), True
    prev = segs[idx - 1]                       # 전환은 앞 조각에 붙인다
    # 전환이 양쪽 조각 절반을 넘지 않게
    dur_us = min(round(dur * 1e6), prev["target_timerange"]["duration"] // 2, segs[idx]["target_timerange"]["duration"] // 2)
    tr = Transition(ttype, dur_us)
    mats["transitions"].append(tr.export_json())
    prev["extra_material_refs"].append(tr.global_id)
    cut = segs[idx]["target_timerange"]["start"] / 1e6
    rows.append((cut, subs[i_sub - 1][1], subs[i_sub][1], f"{ttype.value.name} {dur_us / 1e6:.2f}s", why, split))

json.dump(d, open(path, "w", encoding="utf-8"), ensure_ascii=False, indent=4)
print("| 시간 | 앞 문장 | 뒤 문장 | 전환 이름 | 구간 |\n|---|---|---|---|---|")
for cut, a, b, name, why, split in rows:
    print(f"| {cut:.2f}s{' (새로 나눔)' if split else ''} | {a} | {b} | {name} | {why} |")
print(f"\n저장 완료: {os.path.dirname(path)}  → 캡컷을 다시 여세요.")
