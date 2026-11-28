# -*- coding: utf-8 -*-
"""
scripts/fetch_news.py — 부동산 뉴스 제목 모으기 → data/news.json  (API 키 필요 없음)

  언론사 부동산 RSS 에서 최근 기사 '제목·언론사·시간·링크'만 모아 주거용·상업용으로 나눈다.
  기사 본문·요약은 저장하지 않는다 (저작권). 화면에서 누르면 언론사 원문으로 간다.

  쓰는 RSS (2026-11-28 확인)
    - 한국경제 부동산  https://www.hankyung.com/feed/realestate         (주거용·상업용)
    - 헤럴드경제 부동산 https://biz.heraldcorp.com/rss/google/realestate  (주거용·상업용)
    - 한국경제 전체 기사·헤럴드경제 전체 기사 (상업용 말이 들어간 기사만: 리츠·오피스·물류·데이터센터 등)
    두 곳 모두 RSS 안내 페이지에 이용 제한 문구가 없다.
  상업용 기사는 드물어서, 지난 실행에서 모은 기사를 14일까지 이어서 보관하고 분류마다 최신 30건만 남긴다.
  쓰지 않는 RSS
    - 서울경제·아시아경제: RSS 안내에 '비상업적 사용만 허용' (이 사이트엔 쿠팡 광고가 있어서 뺌)
    - 연합뉴스: 피드에 '무단 전재-재배포 금지' / 매일경제: 이용 조건을 확인하지 못함
  (네이버 개발자센터는 새 앱에서 '검색' API를 고를 수 없어서 쓰지 않는다. 2026-11-28 확인)

  실행
    python scripts/fetch_news.py            저장
    python scripts/fetch_news.py --dry-run  저장하지 않고 결과만 보기

  data/meta.json 은 건드리지 않는다 (시세 자동 갱신과 같은 줄을 동시에 고쳐 커밋이 부딪히지 않게).
"""

import datetime as dt
import hashlib
import html
import json
import re
import sys
import xml.etree.ElementTree as ET
from email.utils import parsedate_to_datetime

from _util import DATA_DIR, KST, Stop, http_get, now_kst, run

SOURCE = "언론사 부동산 RSS (한국경제·헤럴드경제, 제목·링크만)"
FEEDS = [
    {"name": "한국경제", "url": "https://www.hankyung.com/feed/realestate", "only": None},
    {"name": "헤럴드경제", "url": "https://biz.heraldcorp.com/rss/google/realestate", "only": None},
    {"name": "한국경제", "url": "https://www.hankyung.com/feed/all-news", "only": "commercial"},
    {"name": "헤럴드경제", "url": "https://biz.heraldcorp.com/rss/google/newsAll", "only": "commercial"},
]
KEEP = 30               # 분류마다 화면에 남길 기사 수
KEEP_DAYS = 14          # 지난 기사를 며칠까지 이어서 보관할지
UA = {"User-Agent": "Mozilla/5.0 (compatible; reits-investment class project RSS reader)"}

# 분류 기준: 상업용 말이 있으면 상업용, 없고 주거용 말이 있으면 주거용, 둘 다 없으면 버림
COMMERCIAL = ["리츠", "REIT", "오피스", "빌딩", "물류", "상가", "데이터센터", "호텔", "리테일", "쇼핑몰",
              "백화점", "아울렛", "지식산업센터", "사옥", "공실률", "오피스 빌딩"]
EXCLUDE = ["메리츠"]   # '리츠'가 들어가지만 부동산과 상관없는 말 (메리츠금융 등)
RESIDENTIAL = ["아파트", "전세", "월세", "청약", "재건축", "재개발", "주택", "분양", "집값", "매매", "임대",
               "오피스텔", "빌라", "정비사업", "전월세", "주거"]


def clean(text):
    return re.sub(r"\s+", " ", html.unescape(re.sub(r"<[^>]+>", "", text or ""))).strip()


def to_iso(text):
    text = (text or "").strip()
    if not text:
        return None
    try:
        return parsedate_to_datetime(text).isoformat()          # Sat, 28 Nov 2026 15:13:31 +0900
    except (TypeError, ValueError):
        pass
    for fmt in ("%Y-%m-%d %H:%M:%S", "%Y-%m-%dT%H:%M:%S%z", "%Y-%m-%d %H:%M"):
        try:
            moment = dt.datetime.strptime(text, fmt)
            if moment.tzinfo is None:
                moment = moment.replace(tzinfo=KST)               # 헤럴드경제처럼 시간대가 없으면 한국 시간
            return moment.isoformat()
        except ValueError:
            continue
    return None


def category_of(title):
    for word in EXCLUDE:
        title = title.replace(word, "")
    without_officetel = title.replace("오피스텔", "")
    if any(w in without_officetel for w in COMMERCIAL):
        return "commercial"
    if any(w in title for w in RESIDENTIAL):
        return "residential"
    return None


def read_feed(feed):
    res = http_get(feed["url"], label=feed["name"] + " RSS", headers=UA)
    if res.status_code != 200:
        print("[건너뜀] " + feed["name"] + " RSS 를 받지 못했어요 (HTTP " + str(res.status_code) + ")")
        return []
    try:
        root = ET.fromstring(res.content)
    except ET.ParseError:
        print("[건너뜀] " + feed["name"] + " RSS 를 읽지 못했어요 (형식 오류)")
        return []
    items = []
    for node in root.iter("item"):
        title = clean(node.findtext("title"))
        link = (node.findtext("link") or "").strip()
        if not title or not re.match(r"^https?://", link):
            continue
        category = category_of(title)
        if not category or (feed["only"] and category != feed["only"]):
            continue
        items.append({
            "id": hashlib.sha1(link.encode("utf-8")).hexdigest()[:12],
            "category": category,
            "title": title,
            "link": link,
            "source": feed["name"],
            "published": to_iso(node.findtext("pubDate")),
        })
    print("[완료] " + feed["name"] + (" 상업용" if feed["only"] else " 부동산") + " 기사 " + str(len(items)) + "건")
    return items


def previous_items():
    """지난번에 저장한 기사 (14일 안의 것만). 파일이 없거나 읽지 못하면 빈 목록"""
    try:
        old = json.loads((DATA_DIR / "news.json").read_text(encoding="utf-8")).get("items") or []
    except (OSError, ValueError):
        return []
    cutoff = (now_kst() - dt.timedelta(days=KEEP_DAYS)).isoformat()
    return [x for x in old if isinstance(x, dict) and x.get("title") and x.get("link") and (x.get("published") or "") >= cutoff
            and x.get("category") in ("residential", "commercial")]


def main():
    seen = {}
    fresh = 0
    for feed in FEEDS:
        for item in read_feed(feed):
            key = re.sub(r"\W", "", item["title"])[:40]
            if key not in seen:
                seen[key] = item
                fresh += 1
    if not fresh:
        raise Stop("받은 기사가 하나도 없어요. RSS 주소가 바뀌었는지 확인해 주세요. (data/news.json 그대로)")
    for item in previous_items():                     # 지난 기사 이어 붙이기 (분류는 지금 기준으로 다시)
        key = re.sub(r"\W", "", item["title"])[:40]
        category = category_of(item["title"])
        if key not in seen and category:
            item["category"] = category
            seen[key] = item
    items = []
    for category in ("residential", "commercial"):
        picked = sorted((x for x in seen.values() if x["category"] == category),
                        key=lambda x: x["published"] or "", reverse=True)[:KEEP]
        print("[분류] " + ("주거용" if category == "residential" else "상업용") + " " + str(len(picked)) + "건")
        items.extend(picked)
    stamp = now_kst().strftime("%Y-%m-%dT%H:%M:%S+09:00")
    payload = {"as_of": stamp, "source": SOURCE,
               "feeds": [{"name": f["name"], "url": f["url"]} for f in FEEDS],
               "note": "제목·언론사·시간·링크만 저장해요. 기사 본문과 의견은 각 언론사의 것이에요.",
               "items": items}
    if "--dry-run" in sys.argv:
        for x in items[:12]:
            print(" ", x["category"], x["source"], x["published"], x["title"][:50])
        print("[저장 안 함] --dry-run")
        return
    (DATA_DIR / "news.json").write_text(json.dumps(payload, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    print("[저장] data/news.json (" + str(len(items)) + "건, " + stamp + ")")


if __name__ == "__main__":
    run(main)
