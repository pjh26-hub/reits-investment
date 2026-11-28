# -*- coding: utf-8 -*-
"""
scripts/fetch_news.py — 부동산 뉴스 제목 모으기 → data/news.json

  네이버 뉴스 검색 API (https://openapi.naver.com/v1/search/news.json, 최신순)로
  주거용·상업용 키워드를 검색해서 최근 기사 '제목·언론사·시간·링크'만 모은다.
  기사 본문·요약은 저장하지 않는다 (저작권). 화면에서 누르면 언론사 원문으로 간다.

  필요한 키 (.env 또는 GitHub Secrets) — 둘 중 하나만 있으면 된다
    ① 네이버 개발자센터(developers.naver.com) '검색' API 애플리케이션: NAVER_CLIENT_ID, NAVER_CLIENT_SECRET
    ② 네이버 클라우드 NAVER API HUB(검색 API가 옮겨 가는 곳, 2026-11 안내): NAVER_HUB_KEY_ID, NAVER_HUB_KEY
       (두 곳의 키는 서로 바꿔 쓸 수 없다. ②가 있으면 ②를 쓴다)
  키가 없으면 아무것도 바꾸지 않고 끝난다 (자동 실행이 실패로 표시되지 않게).

  실행
    python scripts/fetch_news.py            저장
    python scripts/fetch_news.py --dry-run  저장하지 않고 결과만 보기

  data/meta.json 은 건드리지 않는다 (시세 자동 갱신과 같은 줄을 동시에 고쳐 커밋이 부딪히지 않게).
  출처·받은 시각은 data/news.json 안에 적는다.
"""

import hashlib
import html
import json
import os
import re
import sys
from email.utils import parsedate_to_datetime
from urllib.parse import urlparse

from _util import DATA_DIR, Stop, http_get, load_env, mask, now_kst, run, _SECRETS

API_URL = "https://openapi.naver.com/v1/search/news.json"                 # ① 개발자센터
HUB_URL = "https://naverapihub.apigw.ntruss.com/search/v1/news"          # ② NAVER API HUB (같은 요청·응답 모양)
SOURCE = "네이버 뉴스 검색 API (제목·링크만, 본문은 각 언론사)"
PER_QUERY = 20          # 검색어 하나당 최신 기사 수 (API 최대 100)
KEEP = 30               # 분류마다 화면에 남길 기사 수

# 검색어 (분류마다 몇 개씩). '청약'만 쓰면 공모주 청약이 섞여서 '아파트 청약'으로
QUERIES = {
    "residential": ["아파트 전세", "아파트 매매가", "아파트 청약", "월세 시장", "재건축 재개발", "임대주택"],
    "commercial": ["오피스 빌딩", "물류센터", "상가 공실", "리츠", "데이터센터 부동산", "호텔 매각"],
}
# 제목에 이 말이 하나도 없으면 버린다 (검색어와 상관없는 기사가 섞이지 않게)
TITLE_WORDS = {
    "residential": ["아파트", "전세", "월세", "청약", "재건축", "재개발", "주택", "분양", "집값", "매매", "임대", "오피스텔", "빌라"],
    "commercial": ["오피스", "빌딩", "물류", "상가", "리츠", "REIT", "데이터센터", "호텔", "리테일", "쇼핑몰", "공실", "백화점", "아울렛"],
}
# 언론사 도메인 → 이름 (없으면 도메인 그대로 보여줌)
PRESS = {
    "hankyung.com": "한국경제", "mk.co.kr": "매일경제", "yna.co.kr": "연합뉴스", "sedaily.com": "서울경제",
    "mt.co.kr": "머니투데이", "edaily.co.kr": "이데일리", "chosun.com": "조선일보", "biz.chosun.com": "조선비즈",
    "joongang.co.kr": "중앙일보", "donga.com": "동아일보", "hani.co.kr": "한겨레", "khan.co.kr": "경향신문",
    "fnnews.com": "파이낸셜뉴스", "asiae.co.kr": "아시아경제", "heraldcorp.com": "헤럴드경제", "newsis.com": "뉴시스",
    "news1.kr": "뉴스1", "etoday.co.kr": "이투데이", "dt.co.kr": "디지털타임스", "ajunews.com": "아주경제",
    "nocutnews.co.kr": "노컷뉴스", "kbs.co.kr": "KBS", "imbc.com": "MBC", "sbs.co.kr": "SBS", "ytn.co.kr": "YTN",
    "mbn.co.kr": "MBN", "hankookilbo.com": "한국일보", "seoul.co.kr": "서울신문", "segye.com": "세계일보",
    "kmib.co.kr": "국민일보", "munhwa.com": "문화일보", "businesspost.co.kr": "비즈니스포스트", "thebell.co.kr": "더벨",
    "newspim.com": "뉴스핌", "news.naver.com": "네이버뉴스", "n.news.naver.com": "네이버뉴스", "bizwatch.co.kr": "비즈니스워치",
    "inews24.com": "아이뉴스24", "ebn.co.kr": "EBN", "dnews.co.kr": "대한경제", "hankyung.co.kr": "한국경제",
}


def clean_title(text):
    """<b>강남</b> 아파트 &quot;…&quot; → 강남 아파트 "…" """
    return re.sub(r"\s+", " ", html.unescape(re.sub(r"<[^>]+>", "", text or ""))).strip()


def press_name(url):
    host = (urlparse(url).netloc or "").lower()
    if host.startswith("www."):
        host = host[4:]
    if host in PRESS:
        return PRESS[host]
    for domain, name in PRESS.items():
        if host.endswith("." + domain):
            return name
    return host or "출처 확인 필요"


def to_iso(pub_date):
    try:
        return parsedate_to_datetime(pub_date).isoformat()
    except (TypeError, ValueError):
        return None


def search(query, api):
    res = http_get(api["url"], params={"query": query, "display": PER_QUERY, "start": 1, "sort": "date"},
                   label="네이버 뉴스 검색 '" + query + "'", headers=api["headers"])
    if res.status_code == 401:
        raise Stop("네이버 API 키가 맞지 않아요(401). 키를 다시 확인해 주세요. (개발자센터 키와 API HUB 키는 서로 바꿔 쓸 수 없어요)")
    if res.status_code == 403:
        raise Stop("네이버 API 권한이 없어요(403). 애플리케이션 '사용 API'에 '검색'을 넣었는지 확인해 주세요.")
    if res.status_code == 429:
        raise Stop("네이버 API 하루 호출 한도를 넘었어요(429). 내일 다시 돌아가요.")
    if res.status_code != 200:
        raise Stop("네이버 뉴스 검색이 실패했어요 (HTTP " + str(res.status_code) + "): " + mask(res.text[:200]))
    try:
        return res.json().get("items", [])
    except ValueError:
        raise Stop("네이버 뉴스 검색 응답을 읽지 못했어요.")


def collect(category, api):
    words = TITLE_WORDS[category]
    seen = {}
    for query in QUERIES[category]:
        for raw in search(query, api):
            title = clean_title(raw.get("title"))
            link = raw.get("originallink") or raw.get("link") or ""
            if not title or not re.match(r"^https?://", link):
                continue
            if not any(w.lower() in title.lower() for w in words):
                continue
            # 상업용에서 '오피스텔'만 걸린 기사는 주거용 쪽 이야기라 뺀다
            if category == "commercial" and "오피스텔" in title and not any(
                    w in title for w in ["빌딩", "물류", "상가", "리츠", "데이터센터", "호텔", "리테일"]):
                continue
            key = re.sub(r"\W", "", title)[:40]
            if key in seen:
                continue
            seen[key] = {
                "id": hashlib.sha1(link.encode("utf-8")).hexdigest()[:12],
                "category": category,
                "title": title,
                "link": link,
                "source": press_name(link),
                "published": to_iso(raw.get("pubDate")),
                "query": query,
            }
    items = sorted(seen.values(), key=lambda x: x["published"] or "", reverse=True)
    return items[:KEEP]


def main():
    load_env()
    env = lambda name: os.environ.get(name, "").strip()
    if env("NAVER_HUB_KEY_ID") and env("NAVER_HUB_KEY"):
        api = {"name": "NAVER API HUB", "url": HUB_URL,
               "headers": {"X-NCP-APIGW-API-KEY-ID": env("NAVER_HUB_KEY_ID"), "X-NCP-APIGW-API-KEY": env("NAVER_HUB_KEY")}}
    elif env("NAVER_CLIENT_ID") and env("NAVER_CLIENT_SECRET"):
        api = {"name": "네이버 개발자센터", "url": API_URL,
               "headers": {"X-Naver-Client-Id": env("NAVER_CLIENT_ID"), "X-Naver-Client-Secret": env("NAVER_CLIENT_SECRET")}}
    else:
        print("[건너뜀] 네이버 키(NAVER_CLIENT_ID·SECRET 또는 NAVER_HUB_KEY_ID·KEY)가 없어서 뉴스를 받지 않았어요. (data/news.json 그대로)")
        return
    _SECRETS.update(v for v in api["headers"].values())
    print("[키] " + api["name"] + " 키로 받아요.")
    items = []
    for category in ("residential", "commercial"):
        got = collect(category, api)
        print("[완료] " + ("주거용" if category == "residential" else "상업용") + " 기사 " + str(len(got)) + "건")
        items.extend(got)
    if not items:
        raise Stop("받은 기사가 하나도 없어요. 검색어나 API 상태를 확인해 주세요.")
    stamp = now_kst().strftime("%Y-%m-%dT%H:%M:%S+09:00")
    payload = {"as_of": stamp, "source": SOURCE, "source_url": "https://developers.naver.com/docs/serviceapi/search/news/news.md",
               "note": "제목·언론사·시간·링크만 저장해요. 기사 본문과 의견은 각 언론사의 것이에요.",
               "items": items}
    if "--dry-run" in sys.argv:
        print(json.dumps(payload, ensure_ascii=False, indent=2)[:3000])
        print("[저장 안 함] --dry-run")
        return
    (DATA_DIR / "news.json").write_text(json.dumps(payload, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    print("[저장] data/news.json (" + str(len(items)) + "건, " + stamp + ")")


if __name__ == "__main__":
    run(main)
