"""edl.json(컷 목록 + 자막)으로 캡컷 초안 "릴스_러프컷"을 만든다.

사용법:  ~/.pycapcut/bin/python make_draft.py [영상경로] [초안폴더]
  영상경로 기본값: ~/Desktop/촬영본.mp4
  초안폴더 기본값: macOS ~/Movies/CapCut/User Data/Projects/com.lveditor.draft
                  Windows %LOCALAPPDATA%\\CapCut\\User Data\\Projects\\com.lveditor.draft
"""
import json, os, sys
import pycapcut as cc

def tr(start, length):
    # 초 -> 마이크로초. 끝점을 따로 반올림해 이어 붙인 클립 사이에 겹침/틈이 생기지 않게 한다
    a, b = round(start * 1e6), round((start + length) * 1e6)
    return cc.Timerange(a, b - a)

HERE = os.path.dirname(os.path.abspath(__file__))
DRAFT_NAME = "릴스_러프컷"

def default_draft_root():
    if os.name == "nt":
        return os.path.join(os.environ["LOCALAPPDATA"], "CapCut", "User Data", "Projects", "com.lveditor.draft")
    return os.path.expanduser("~/Movies/CapCut/User Data/Projects/com.lveditor.draft")

video_path = sys.argv[1] if len(sys.argv) > 1 else os.path.expanduser("~/Desktop/촬영본.mp4")
draft_root = sys.argv[2] if len(sys.argv) > 2 else default_draft_root()
edl = json.load(open(os.path.join(HERE, "edl.json"), encoding="utf-8"))

script = cc.DraftFolder(draft_root).create_draft(DRAFT_NAME, 1080, 1920, allow_replace=True)
script.add_track(cc.TrackType.video).add_track(cc.TrackType.text, "자막")

material = cc.VideoMaterial(video_path)
src_max = material.duration / 1e6
for c in edl["clips"]:
    src_end = min(c["src_end"], src_max)
    length = src_end - c["src_start"]
    script.add_segment(cc.VideoSegment(material, tr(c["tl_start"], length),
                                       source_timerange=tr(c["src_start"], length)))

style = cc.TextStyle(size=10.0, bold=True, color=(1.0, 1.0, 1.0), align=1)
border = cc.TextBorder(color=(0.0, 0.0, 0.0), width=40.0)
pos = cc.ClipSettings(transform_y=-0.55)  # 화면 아래쪽
for s in edl["subtitles"]:
    script.add_segment(cc.TextSegment(s["text"], tr(s["start"], s["end"] - s["start"]),
                                      style=style, border=border, clip_settings=pos), "자막")

script.save()
print("초안 생성:", os.path.join(draft_root, DRAFT_NAME))
