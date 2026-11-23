# -*- coding: utf-8 -*-
"""
scripts/update_prices.py — 리츠 시세 자동 갱신(전일 종가) → data/prices.json, data/history.json (+ data/meta.json)

GitHub Actions(.github/workflows/update-prices.yml)가 평일 하루 두 번(한국 시간 14:30, 18:30) 실행한다.
API 키는 GitHub Secrets 에만 있고, 브라우저(화면)는 이 스크립트가 만든 JSON 만 읽는다. → 키가 노출되지 않음

공개 사이트 출처 원칙 (2026-11-23 팀 결정)
  - 공개 링크에는 **전날 종가만** 보여준다.
  - 한국투자증권(KIS) 시세는 공개 사이트에 다시 내보내면 안 될 수 있어서 쓰지 않는다.
  - 금융위원회 시세는 공공데이터포털의 공공데이터(공공누리 제4유형: 출처표시·상업적 이용금지·변경금지)
    → 비영리 수업 과제라 쓸 수 있고, 값은 바꾸지 않고 출처를 표시한다.

하는 일
  1) 국내 리츠·리츠 ETF (prices.json 의 type "reit"·"etf")  금융위원회 시세 (공공데이터포털)
       - 국내 리츠   주식시세정보 getStockPriceInfo_V2      (공공데이터포털 15094808)
       - 리츠 ETF    증권상품시세정보 getETFPriceInfo_V2    (공공데이터포털 15094806)
       - 기준일의 다음 영업일 오후 1시 이후에 올라오는 "전일 종가"다. 실시간이 아니다.
       - 1년 등락률 = 1년 전 같은 날(휴장이면 그 직전 거래일) 종가 대비
  2) 미국 리츠 (type "global")  Finnhub /quote, /stock/metric — FINNHUB_API_KEY 가 있을 때만.
     키가 없으면 미국 리츠는 직전 값을 그대로 둔다. (Finnhub 무료 키는 '개인 용도' 조건이라 팀이 정해서 넣는다)
  3) 원/달러 환율 (미국 리츠를 받을 때만)  Frankfurter → 실패하면 open.er-api.com → 그래도 실패하면 직전 환율
  4) data/prices.json 을 지금과 같은 모양으로 덮어쓴다. 종목별 price, dailyChangePct, yearlyChangePct,
     price_kind("종가"), 전체 updatedAt
  5) data/history.json(1년 그래프)에 종가를 한 점씩 붙이고 1년보다 오래된 점은 뺀다.
     국내는 마지막 점 이후 빈 거래일을 같은 API(그날 전체 시세)로 채운다. 미국은 채우지 못한다.

가짜 값 금지 (HANDOFF_PROMPT.md 2장)
  - 어떤 종목을 못 받으면 그 종목은 직전 값을 그대로 두고 "stale": true 로 표시한다. 값을 지어내지 않는다.
  - 한 종목도 못 받으면 파일을 건드리지 않고 실패로 끝낸다. (화면은 직전 파일을 계속 쓴다)
  - 시세와 그래프가 직전 파일과 같으면 저장하지 않는다. (쓸데없는 커밋 방지)

필요한 키 (GitHub Secrets 또는 프로젝트 폴더의 .env)
  DATA_GO_KR_KEY    공공데이터포털 인증키 (주식시세정보·증권상품시세정보 두 API 모두 '활용신청' 필요)
  (선택) FINNHUB_API_KEY   미국 리츠까지 갱신할 때만

실행
  python scripts/update_prices.py            평소 실행
  python scripts/update_prices.py --peek     API 원본 1건씩 그대로 보여줌(구조 확인용)
  python scripts/update_prices.py --dry-run  받아만 보고 저장하지 않음

공식 명세 확인
  금융위원회 시세  공공데이터포털 15094808·15094806 오픈API 명세(swagger) — 2026-11-14 확인
                   응답 body.items.item: srtnCd(단축코드), itmsNm, basDt(YYYYMMDD), clpr(종가), vs(전일 대비),
                   fltRt(등락률), mrktTotAmt(시가총액), lstgStCnt(상장주식수, 주식) / stLstgCnt·nav·bssIdxIdxNm(ETF)
  Finnhub          finnhub.io/docs/api  (/quote: c 현재가, d 전일대비, dp 등락률, pc 전일 종가, t 시각)
  환율             api.frankfurter.dev/v2/rates?base=USD&quotes=KRW  → [{"date","base","quote","rate"}]
"""

import argparse
import datetime as dt
import json
import os
import time

from _util import (
    ETF_URL, KST, STOCK_URL, Stop, _SECRETS, data_go_kr_all, find_latest_base_date, get_data_go_kr_key,
    has_key, load_env, load_json, norm_code, now_kst, peek, run, save_json, to_date, to_number, update_meta,
)

# ---------------------------------------------------------------------------
# 주소와 출처 문구
# ---------------------------------------------------------------------------
FINNHUB_BASE = "https://finnhub.io/api/v1"
FX_FRANKFURTER = "https://api.frankfurter.dev/v2/rates"
FX_ER_API = "https://open.er-api.com/v6/latest/USD"

KR_SOURCE = "금융위원회 주식시세정보·증권상품시세정보 (공공데이터포털, 공공누리 제4유형)"
KR_SOURCE_URL = "https://www.data.go.kr/data/15094808/openapi.do"
KR_TYPES = ("reit", "etf")         # 금융위원회 시세로 받는 종류 (국내 리츠, 국내 리츠 ETF)
US_SOURCE = "Finnhub (finnhub.io)"

US_OPEN, US_CLOSE = dt.time(9, 30), dt.time(16, 0)        # 미국 정규장 (뉴욕 시간)

# 1년 그래프(data/history.json): 종가를 하루 한 점씩 붙이고, 1년보다 오래된 점은 뺀다
HISTORY_DAYS = 366
HISTORY_GAP_LIMIT = 45             # 국내 빈 구간을 채우는 최대 일수 (이보다 길면 API 호출이 너무 많아 채우지 않음)
HISTORY_SOURCE = "야후 파이낸스(2026-11-13까지, 비공식) + 그 뒤 종가: 금융위원회 시세(국내) · Finnhub(미국)"

# 직전 파일과 비교할 때 보는 값 (시각만 바뀐 것은 "변동 없음")
COMPARE_FIELDS = ("price", "dailyChangePct", "yearlyChangePct", "price_kind", "base_date", "close_local", "fx_rate", "stale")


# ---------------------------------------------------------------------------
# 시간
# ---------------------------------------------------------------------------
def iso_kst(moment):
    """한국 시간 ISO 글자: 2026-11-23T14:30:05+09:00"""
    return moment.astimezone(KST).strftime("%Y-%m-%dT%H:%M:%S+09:00")


def nth_sunday(year, month, n):
    """그 달의 n번째 일요일"""
    first = dt.date(year, month, 1)
    return first + dt.timedelta(days=(6 - first.weekday()) % 7 + 7 * (n - 1))


def to_new_york(moment):
    """UTC 시각 → 뉴욕 시간. 서머타임(3월 둘째 일요일 ~ 11월 첫째 일요일, 오전 2시)을 직접 계산한다.
    (윈도우 파이썬에는 시간대 자료(tzdata)가 없을 수 있어서 zoneinfo 를 쓰지 않는다)"""
    utc = moment.astimezone(dt.timezone.utc)
    start = dt.datetime.combine(nth_sunday(utc.year, 3, 2), dt.time(7, 0), dt.timezone.utc)    # 02:00 EST = 07:00 UTC
    end = dt.datetime.combine(nth_sunday(utc.year, 11, 1), dt.time(6, 0), dt.timezone.utc)     # 02:00 EDT = 06:00 UTC
    offset = -4 if start <= utc < end else -5
    return utc.astimezone(dt.timezone(dt.timedelta(hours=offset)))


def one_year_ago(day):
    """1년 전 같은 날 (2월 29일은 2월 28일로)"""
    try:
        return day.replace(year=day.year - 1)
    except ValueError:
        return day.replace(year=day.year - 1, day=28)


def ymd(day):
    return day.strftime("%Y%m%d")


# ---------------------------------------------------------------------------
# HTTP (Finnhub·환율용. 실패 이유를 한국어로)
# ---------------------------------------------------------------------------
def request_json(method, url, label, tries=3, **kwargs):
    """JSON 응답을 받는다 → (상태코드, 본문 또는 None). 연결 자체가 안 되면 (None, None)"""
    import requests
    kwargs.setdefault("timeout", 20)
    for attempt in range(tries):
        try:
            res = requests.request(method, url, **kwargs)
        except requests.RequestException as e:
            print(f"  [연결 실패] {label}: {type(e).__name__} (다시 시도 {attempt + 1}/{tries})")
            time.sleep(1.5 * (attempt + 1))
            continue
        if res.status_code == 429 and attempt < tries - 1:      # 너무 자주 불렀을 때
            time.sleep(2 * (attempt + 1))
            continue
        try:
            return res.status_code, res.json()
        except ValueError:
            return res.status_code, None
    return None, None


# ---------------------------------------------------------------------------
# 금융위원회 시세 (공공데이터포털)
# ---------------------------------------------------------------------------
class MarketDay:
    """하루치 전체 시세(주식 + ETF)를 받아서 단축코드로 찾게 해 준다. 같은 날은 한 번만 받는다."""

    def __init__(self, key, peek_first=False):
        self.key = key
        self.cache = {}
        self.peek_first = peek_first

    def rows(self, day_ymd):
        """그날 시세 → {단축코드: 원본 행}. 휴장일·자료 없음이면 빈 dict"""
        if day_ymd not in self.cache:
            table = {}
            for url, label in ((STOCK_URL, "주식시세"), (ETF_URL, "ETF시세")):
                query = {"serviceKey": self.key, "resultType": "json", "basDt": day_ymd}
                for row in data_go_kr_all(url, query, f"{label}({day_ymd})", page_size=1000):
                    code = norm_code(row.get("srtnCd"))
                    if code:
                        table[code] = row
                if self.peek_first:
                    sample = next((r for r in table.values()), None)
                    if sample:
                        peek(f"{label} 원본 1건 ({day_ymd})", sample)
            self.peek_first = False
            self.cache[day_ymd] = table
        return self.cache[day_ymd]

    def on_or_before(self, day, max_back=10):
        """그날(휴장이면 그 직전 거래일)의 (날짜 'YYYY-MM-DD', 시세표). 없으면 (None, {})"""
        for back in range(max_back + 1):
            d = day - dt.timedelta(days=back)
            if d.weekday() >= 5:
                continue
            table = self.rows(ymd(d))
            if table:
                return d.isoformat(), table
        return None, {}


def update_kr(items, market, latest_ymd):
    """국내 리츠·리츠 ETF 의 전일 종가 → (받은 수, 못 받은 이름 목록)"""
    latest = dt.datetime.strptime(latest_ymd, "%Y%m%d").date()
    today_rows = market.rows(latest_ymd)
    year_date, year_rows = market.on_or_before(one_year_ago(latest))
    print(f"  최근 기준일 {latest.isoformat()} / 1년 전 비교일 {year_date}")
    updated, missing = 0, []
    for item in items:
        if item.get("type") not in KR_TYPES:
            continue
        row = today_rows.get(item["id"])
        price = to_number((row or {}).get("clpr"))
        if not row or not price or price <= 0:              # 0원은 거래정지 등 → 값 없음으로 본다
            item["stale"] = True
            missing.append(item["name"])
            continue
        year_row = year_rows.get(item["id"])
        year_close = to_number((year_row or {}).get("clpr"))
        yearly = round((price - year_close) / year_close * 100, 2) if year_close else None
        is_etf = item.get("type") == "etf"
        shares = to_number(row.get("stLstgCnt" if is_etf else "lstgStCnt"))
        item.update({
            "close": price, "price": price,
            "base_date": to_date(row.get("basDt")) or latest.isoformat(),
            "price_kind": "종가", "price_time": None,
            "change": to_number(row.get("vs")), "change_pct": to_number(row.get("fltRt")),
            "dailyChangePct": to_number(row.get("fltRt")),
            "yearlyChangePct": yearly,
            "year_ago": {"date": year_date, "close": year_close} if year_close else None,
            "market_cap": to_number(row.get("mrktTotAmt")),
            "listed_shares": shares if shares else item.get("listed_shares"),
            "listed_shares_date": to_date(row.get("basDt")) if shares else item.get("listed_shares_date"),
            "price_source": KR_SOURCE, "stale": False,
        })
        if is_etf:
            item["nav"] = to_number(row.get("nav"))
            item["base_index"] = row.get("bssIdxIdxNm") or item.get("base_index")
        updated += 1
    return updated, missing


# ---------------------------------------------------------------------------
# Finnhub (미국 리츠, 선택)
# ---------------------------------------------------------------------------
def finnhub_get(path, params, key, label):
    status, body = request_json("GET", FINNHUB_BASE + path, label, params=dict(params, token=key))
    if status != 200 or not isinstance(body, dict):
        print(f"  [실패] {label}: HTTP {status}")
        return None
    return body


def finnhub_quote(symbol, key):
    """→ {price, change, change_pct, time(UTC datetime)} 또는 None. 없는 종목은 c 와 t 가 0"""
    body = finnhub_get("/quote", {"symbol": symbol}, key, f"Finnhub 현재가({symbol})")
    if not body or not body.get("c") or not body.get("t"):
        return None
    change_pct = body.get("dp")
    if change_pct is None and body.get("pc"):
        change_pct = (body["c"] - body["pc"]) / body["pc"] * 100
    return {"raw": body, "price": float(body["c"]), "change": body.get("d"),
            "change_pct": round(float(change_pct), 2) if change_pct is not None else None,
            "time": dt.datetime.fromtimestamp(int(body["t"]), dt.timezone.utc)}


def finnhub_year_change(symbol, key):
    """최근 52주 가격 등락률(%) — Finnhub 기본 재무지표의 52WeekPriceReturnDaily. 없으면 None"""
    body = finnhub_get("/stock/metric", {"symbol": symbol, "metric": "all"}, key, f"Finnhub 52주 등락률({symbol})")
    value = ((body or {}).get("metric") or {}).get("52WeekPriceReturnDaily")
    return round(float(value), 2) if isinstance(value, (int, float)) else None


def fetch_usd_krw(previous):
    """원/달러 환율 → {rate, date, source}. 둘 다 실패하면 직전 값(previous)"""
    status, body = request_json("GET", FX_FRANKFURTER, "환율(Frankfurter)", params={"base": "USD", "quotes": "KRW"})
    if status == 200 and isinstance(body, list):
        for row in body:
            if row.get("quote") == "KRW" and isinstance(row.get("rate"), (int, float)) and row["rate"] > 0:
                return {"rate": round(float(row["rate"]), 2), "date": row.get("date"),
                        "source": "Frankfurter (frankfurter.dev, 중앙은행 기준환율)"}
    status, body = request_json("GET", FX_ER_API, "환율(ExchangeRate-API)")
    rate = ((body or {}).get("rates") or {}).get("KRW") if status == 200 else None
    if isinstance(rate, (int, float)) and rate > 0:
        stamp = (body or {}).get("time_last_update_unix")
        date = dt.datetime.fromtimestamp(stamp, dt.timezone.utc).strftime("%Y-%m-%d") if stamp else None
        return {"rate": round(float(rate), 2), "date": date, "source": "Rates By Exchange Rate API (exchangerate-api.com)"}
    if previous and previous.get("rate"):
        print("  [안내] 환율을 새로 받지 못해서 직전 환율을 그대로 써요.")
        return dict(previous, stale=True)
    return None


def update_us(items, key, fx, now, args):
    now_ny = to_new_york(now)
    updated, missing = 0, []
    for item in items:
        if item.get("type") != "global":
            continue
        time.sleep(1.1)                                    # 무료 키: 1분에 60번 이하
        q = finnhub_quote(item["id"], key)
        if args.peek and q and updated == 0:
            peek(f"Finnhub 현재가 원본 ({item['name']})", q["raw"])
        if not q or not fx:
            item["stale"] = True
            missing.append(item["name"])
            continue
        yearly = finnhub_year_change(item["id"], key)
        quote_ny = to_new_york(q["time"])
        in_session = (quote_ny.date() == now_ny.date() and now_ny.weekday() < 5
                      and US_OPEN <= now_ny.time() < US_CLOSE)
        shares = item.get("listed_shares")
        item.update({
            "close": round(q["price"] * fx["rate"]), "price": round(q["price"] * fx["rate"]),
            "close_local": round(q["price"], 2), "price_local": round(q["price"], 2),
            "currency": "USD", "fx_rate": fx["rate"], "fx_date": fx.get("date"),
            "base_date": quote_ny.date().isoformat(),
            "price_kind": "현재가" if in_session else "종가",
            "price_time": iso_kst(q["time"]) if in_session else None,
            "change": q["change"], "change_pct": q["change_pct"], "dailyChangePct": q["change_pct"],
            "yearlyChangePct": yearly,
            "market_cap": round(q["price"] * shares * fx["rate"]) if shares else None,
            "price_source": US_SOURCE, "stale": False,
        })
        updated += 1
    return updated, missing


# ---------------------------------------------------------------------------
# 1년 그래프 (data/history.json)
# ---------------------------------------------------------------------------
def update_history(items, market, history):
    """종가를 1년 그래프에 붙인다 → 바뀐 종목 수. history 는 data/history.json 내용(직접 고친다)

    - price_kind 가 "종가"이고 stale 이 아닌 종목만 붙인다 (장중 현재가는 넣지 않는다, 가짜 값 금지)
    - 같은 날짜가 이미 있으면 그 점을 바꾼다
    - 국내는 마지막 점과 오늘 사이 빈 거래일을 금융위원회 시세(그날 전체 시세)로 채운다 (예: 자동 갱신 첫 실행)
      미국은 Finnhub 무료 키로 과거 일봉을 받을 수 없어서 빈 구간은 그대로 둔다(그래프는 그 사이를 직선으로 이음)
    - 그래프는 국내가 원, 미국이 달러 기준 (history.json 의 currency)
    """
    if not history or not isinstance(history.get("items"), list):
        return 0
    by_id = {h.get("id"): h for h in history["items"]}
    changed = 0
    for item in items:
        if item.get("stale") or item.get("price_kind") != "종가" or not item.get("base_date"):
            continue
        is_us = item.get("type") == "global"
        value = item.get("close_local") if is_us else (item.get("price") or item.get("close"))
        if not isinstance(value, (int, float)) or value <= 0:
            continue
        day = item["base_date"]
        h = by_id.get(item["id"])
        if h is None:                                       # 그래프가 없던 종목은 새로 만든다
            h = {"id": item["id"], "currency": "USD" if is_us else "KRW", "points": []}
            history["items"].append(h)
            by_id[item["id"]] = h
        points = {p[0]: p[1] for p in h.get("points") or [] if isinstance(p, list) and len(p) == 2}
        before = dict(points)
        # 국내: 마지막 점 다음 날부터 어제까지 비어 있는 거래일을 그날 전체 시세로 채운다
        if market and not is_us and points:
            gap_start = dt.date.fromisoformat(max(points)) + dt.timedelta(days=1)
            gap_end = dt.date.fromisoformat(day) - dt.timedelta(days=1)
            if gap_start <= gap_end and (gap_end - gap_start).days <= HISTORY_GAP_LIMIT:
                d = gap_start
                while d <= gap_end:
                    if d.weekday() < 5:
                        close = to_number((market.rows(ymd(d)).get(item["id"]) or {}).get("clpr"))
                        if close and close > 0:
                            points[d.isoformat()] = round(close)
                    d += dt.timedelta(days=1)
        points[day] = round(value, 2) if is_us else round(value)
        start = (dt.date.fromisoformat(max(points)) - dt.timedelta(days=HISTORY_DAYS)).isoformat()
        points = {d: v for d, v in points.items() if d >= start}
        if points != before:
            h["points"] = [[d, points[d]] for d in sorted(points)]
            changed += 1
    return changed


# ---------------------------------------------------------------------------
# 저장
# ---------------------------------------------------------------------------
def set_output(name, value):
    """GitHub Actions 다음 단계에 값 넘기기 (로컬에서는 아무것도 안 함)"""
    path = os.environ.get("GITHUB_OUTPUT")
    if path:
        with open(path, "a", encoding="utf-8") as f:
            f.write(f"{name}={value}\n")


def snapshot(items):
    return [{k: i.get(k) for k in ("id",) + COMPARE_FIELDS} for i in items]


def main():
    parser = argparse.ArgumentParser(description="금융위원회 시세(전일 종가)·Finnhub → data/prices.json, history.json")
    parser.add_argument("--peek", action="store_true", help="API 원본 1건씩 그대로 출력")
    parser.add_argument("--dry-run", action="store_true", help="저장하지 않고 결과만 출력")
    args = parser.parse_args()

    old = load_json("prices")
    if not old or not isinstance(old.get("items"), list) or not old["items"]:
        raise Stop("data/prices.json 이 없거나 비어 있어요. 종목 목록이 이 파일에 있어서 먼저 있어야 해요.")
    items = json.loads(json.dumps(old["items"]))            # 깊은 복사 (비교용 원본은 그대로)
    before = snapshot(items)
    now = now_kst()
    load_env()

    has_kr = has_key("DATA_GO_KR_KEY")
    has_finnhub = has_key("FINNHUB_API_KEY")
    if not has_kr and not has_finnhub:
        raise Stop("API 키가 하나도 없어요. DATA_GO_KR_KEY(공공데이터포털)를 GitHub Secrets(또는 .env)에 넣어 주세요.")
    if has_finnhub:
        _SECRETS.add(os.environ["FINNHUB_API_KEY"].strip())

    # ---------- 1) 국내 리츠·리츠 ETF (금융위원회 시세) ----------
    kr_count, kr_missing, market = 0, [], None
    if has_kr:
        print("[1/3] 국내 리츠·리츠 ETF 전일 종가 (금융위원회 시세, 공공데이터포털)")
        key = get_data_go_kr_key()
        market = MarketDay(key, peek_first=args.peek)
        latest_ymd = find_latest_base_date(key)
        kr_count, kr_missing = update_kr(items, market, latest_ymd)
    else:
        print("[1/3] 공공데이터포털 키가 없어 국내 리츠는 직전 값을 그대로 둬요.")

    # ---------- 2) 환율 · 3) 미국 리츠 (Finnhub, 선택) ----------
    previous_fx = old.get("fx") or next(({"rate": i.get("fx_rate"), "date": i.get("fx_date")}
                                         for i in items if i.get("fx_rate")), None)
    fx = previous_fx
    us_count, us_missing = 0, []
    if has_finnhub:
        print("[2/3] 원/달러 환율")
        fx = fetch_usd_krw(previous_fx)
        if fx:
            print(f"  1달러 = {fx['rate']:,.2f}원 ({fx.get('date')}, {fx.get('source', '직전 값')})")
        print("[3/3] 미국 리츠 시세 (Finnhub)")
        us_count, us_missing = update_us(items, os.environ["FINNHUB_API_KEY"].strip(), fx, now, args)
    else:
        print("[2/3][3/3] Finnhub 키가 없어 미국 리츠·환율은 직전 값을 그대로 둬요.")

    total = kr_count + us_count
    print(f"\n  받은 종목: 국내 {kr_count} / 미국 {us_count}")
    if kr_missing or us_missing:
        print(f"  못 받은 종목(직전 값 유지): {kr_missing + us_missing}")
    set_output("updated", str(total))
    if total == 0:
        raise Stop("한 종목도 시세를 받지 못해서 파일을 그대로 뒀어요. 위의 [실패] 이유를 확인해 주세요.")

    # ---------- 4) 1년 그래프에 종가 붙이기 ----------
    history = load_json("history")
    history_changed = update_history(items, market, history)
    if history_changed:
        print(f"  1년 그래프: {history_changed}개 종목에 종가를 붙였어요.")

    if snapshot(items) == before and not history_changed and not args.dry_run:
        print("\n[완료] 직전 파일과 시세가 같아서 저장하지 않았어요.")
        return

    dates = sorted(i["base_date"] for i in items
                   if i.get("type") in KR_TYPES and i.get("base_date") and not i.get("stale"))
    as_of = dates[-1] if dates else old.get("as_of")
    if args.dry_run:
        print("\n[dry-run] 저장하지 않았어요. 첫 종목 결과:")
        print(json.dumps(items[0], ensure_ascii=False, indent=2))
        return
    source = KR_SOURCE + (" · Finnhub(미국 리츠)" if has_finnhub else "")
    sources = {"kr": KR_SOURCE if has_kr else old.get("source"),
               "us": US_SOURCE if has_finnhub else (old.get("sources") or {}).get("us") or old.get("source"),
               "fx": (fx or {}).get("source")}
    save_json("prices", as_of, source, items, updatedAt=iso_kst(now), etf_confirmed=old.get("etf_confirmed", False),
              fx=fx, sources=sources)
    note = ("국내 리츠·리츠 ETF는 금융위원회 시세(공공데이터포털)의 전일 종가. 기준일의 다음 영업일 오후 1시 이후 갱신, 실시간 아님. "
            "1년 등락률은 1년 전 같은 날(휴장이면 직전 거래일) 종가 대비. 공공누리 제4유형(출처표시·상업적 이용금지·변경금지). "
            + ("미국 리츠는 Finnhub, 원화 값 = 달러 값 × 환율. " if has_finnhub
               else "미국 리츠는 자동 갱신하지 않고 마지막으로 받은 값(기준일 표시)을 그대로 둠. ")
            + "못 받은 종목은 직전 값을 그대로 두고 stale 로 표시.")
    update_meta("prices", source, KR_SOURCE_URL, as_of, len(items), note)
    print(f"\n[성공] data/prices.json 저장 (기준일 {as_of}, {iso_kst(now)})")
    if history_changed:
        last_day = max((h["points"][-1][0] for h in history["items"] if h.get("points")), default=as_of)
        extra = {k: v for k, v in history.items() if k not in ("as_of", "source", "items")}
        save_json("history", last_day, HISTORY_SOURCE, history["items"], **extra)
        update_meta("history", HISTORY_SOURCE, KR_SOURCE_URL, last_day, len(history["items"]),
                    "최근 1년 종가 기록(그래프용). 2026-11-13까지는 야후 파이낸스에서 며칠 간격으로 솎아 낸 값, "
                    "그 뒤는 자동 갱신이 종가를 하루 한 점씩 붙인 값. 해외 리츠는 달러 기준.")
        print(f"[성공] data/history.json 저장 (마지막 날 {last_day})")


if __name__ == "__main__":
    run(main)
