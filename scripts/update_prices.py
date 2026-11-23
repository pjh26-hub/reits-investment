# -*- coding: utf-8 -*-
"""
scripts/update_prices.py — 리츠 시세 자동 갱신 → data/prices.json (+ data/meta.json 의 prices 항목)

GitHub Actions(.github/workflows/update-prices.yml)가 평일 장중 30분마다 실행한다.
API 키는 GitHub Secrets 에만 있고, 브라우저(화면)는 이 스크립트가 만든 JSON 만 읽는다. → 키가 노출되지 않음

하는 일
  1) 국내 리츠 (prices.json 의 type "reit")  한국투자증권 Open API(KIS Developers)
       - 현재가·전일 대비 등락률·상장주수      주식현재가 시세   FHKST01010100
       - 1년 전 종가(1년 등락률 계산용)        기간별시세(일봉)  FHKST03010100
  2) 미국 리츠 (type "global")               Finnhub
       - 현재가·전일 대비 등락률               /quote
       - 최근 52주 가격 등락률                 /stock/metric (52WeekPriceReturnDaily)
  3) 원/달러 환율                            Frankfurter(키 없음) → 실패하면 open.er-api.com → 그래도 실패하면 직전 환율
     미국 리츠의 원화 가격 = 달러 가격 × 환율
  4) data/prices.json 을 지금과 같은 모양으로 덮어쓴다(화면 코드가 그대로 읽음). 새로 넣는 값:
       종목별  price, dailyChangePct, yearlyChangePct, price_kind("현재가"|"종가"), price_time
       전체    updatedAt

가짜 값 금지 (HANDOFF_PROMPT.md 2장)
  - 어떤 종목을 못 받으면 그 종목은 직전 값을 그대로 두고 "stale": true 로 표시한다. 값을 지어내지 않는다.
  - 한 종목도 못 받으면 파일을 건드리지 않고 실패로 끝낸다. (화면은 직전 파일을 계속 쓴다)
  - 시세가 직전 파일과 같으면 저장하지 않는다. (쓸데없는 커밋 방지)

필요한 키 (GitHub Secrets 또는 프로젝트 폴더의 .env)
  KIS_APP_KEY, KIS_APP_SECRET   한국투자증권 KIS Developers 앱키
  FINNHUB_API_KEY               finnhub.io 무료 키
  (선택) KIS_ENV=demo            모의투자 앱키를 쓸 때. 기본은 실전(real)

실행
  python scripts/update_prices.py            평소 실행
  python scripts/update_prices.py --peek     API 원본 1건씩 그대로 보여줌(구조 확인용)
  python scripts/update_prices.py --dry-run  받아만 보고 저장하지 않음

공식 명세 확인 (2026-11-23)
  KIS      github.com/koreainvestment/open-trading-api  examples_llm/domestic_stock/inquire_price,
           inquire_daily_itemchartprice, examples_llm/kis_auth.py (토큰: POST /oauth2/tokenP, 유효 1일)
  Finnhub  finnhub.io/docs/api  (/quote: c 현재가, d 전일대비, dp 등락률, pc 전일 종가, t 시각)
  환율     api.frankfurter.dev/v2/rates?base=USD&quotes=KRW  → [{"date","base","quote","rate"}]
"""

import argparse
import base64
import datetime as dt
import hashlib
import json
import os
import time
from pathlib import Path

from _util import (
    CACHE_DIR, KST, Stop, _SECRETS, has_key, load_env, load_json, mask, now_kst, peek, run, save_json,
    to_date, to_number, update_meta,
)

# ---------------------------------------------------------------------------
# 주소와 출처 문구
# ---------------------------------------------------------------------------
KIS_BASE = {
    "real": "https://openapi.koreainvestment.com:9443",      # 실전 도메인
    "demo": "https://openapivts.koreainvestment.com:29443",  # 모의투자 도메인
}
KIS_TOKEN_PATH = "/oauth2/tokenP"
KIS_PRICE_PATH = "/uapi/domestic-stock/v1/quotations/inquire-price"
KIS_PRICE_TR = "FHKST01010100"
KIS_DAILY_PATH = "/uapi/domestic-stock/v1/quotations/inquire-daily-itemchartprice"
KIS_DAILY_TR = "FHKST03010100"
KIS_MARKET = "J"                       # 조건 시장 분류 코드: J = KRX

FINNHUB_BASE = "https://finnhub.io/api/v1"
FX_FRANKFURTER = "https://api.frankfurter.dev/v2/rates"
FX_ER_API = "https://open.er-api.com/v6/latest/USD"

SOURCE = "한국투자증권 Open API(국내 리츠) · Finnhub(미국 리츠) · 환율 Frankfurter"
SOURCE_URL = "https://apiportal.koreainvestment.com"
KR_SOURCE = "한국투자증권 Open API (KIS Developers)"
US_SOURCE = "Finnhub (finnhub.io)"

KR_OPEN, KR_CLOSE = dt.time(9, 0), dt.time(15, 30)        # 한국 정규장 (한국 시간)
US_OPEN, US_CLOSE = dt.time(9, 30), dt.time(16, 0)        # 미국 정규장 (뉴욕 시간)

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


# ---------------------------------------------------------------------------
# HTTP (실패 이유를 한국어로, 메시지에 키가 보이지 않게)
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
# 한국투자증권 Open API
# ---------------------------------------------------------------------------
class Kis:
    """KIS 접근토큰을 한 번 받아 두고 시세를 조회한다.

    접근토큰은 하루 동안 쓸 수 있고, 새로 발급할 때마다 카카오톡 알림이 간다(KIS 공식 예제 주석).
    그래서 30분마다 새로 받지 않도록 토큰을 암호화해서 캐시 파일에 보관한다(GitHub Actions cache).
    암호 키는 앱시크릿에서 만들기 때문에, 캐시 파일만 가져가서는 토큰을 꺼낼 수 없다.
    """

    def __init__(self, app_key, app_secret, env="real", cache_path=None):
        self.app_key = app_key
        self.app_secret = app_secret
        self.env = env if env in KIS_BASE else "real"
        self.base = KIS_BASE[self.env]
        self.cache_path = Path(cache_path) if cache_path else CACHE_DIR / "kis_token.enc"
        self.token = None
        self.token_refreshed = False
        self.pause = 0.07 if self.env == "real" else 0.55      # 실전 초당 20건, 모의 초당 2건 제한보다 느리게

    # ----- 토큰 캐시 (암호화) -----
    def _fernet(self):
        try:
            from cryptography.fernet import Fernet
        except ImportError:
            return None
        digest = hashlib.sha256(("kis-token-cache|" + self.app_secret).encode("utf-8")).digest()
        return Fernet(base64.urlsafe_b64encode(digest))

    def _key_id(self):
        return hashlib.sha256(self.app_key.encode("utf-8")).hexdigest()[:16]

    def _load_cached_token(self):
        fernet = self._fernet()
        if not fernet or not self.cache_path.exists():
            return None
        try:
            data = json.loads(fernet.decrypt(self.cache_path.read_bytes()).decode("utf-8"))
            expires = dt.datetime.fromisoformat(data["expires_at"])
        except Exception:                       # 풀 수 없으면(키가 바뀜 등) 그냥 새로 받는다
            return None
        if data.get("env") != self.env or data.get("key_id") != self._key_id():
            return None
        if expires - now_kst() < dt.timedelta(minutes=30):
            return None
        return data.get("token")

    def _save_cached_token(self, token, expires_at):
        fernet = self._fernet()
        if not fernet:
            print("  [안내] cryptography 패키지가 없어 접근토큰을 저장하지 않아요. (실행할 때마다 새로 발급)")
            return
        payload = json.dumps({"token": token, "expires_at": iso_kst(expires_at), "env": self.env,
                              "key_id": self._key_id()}).encode("utf-8")
        self.cache_path.parent.mkdir(parents=True, exist_ok=True)
        self.cache_path.write_bytes(fernet.encrypt(payload))

    # ----- 토큰 발급 -----
    def ensure_token(self, force=False):
        if self.token and not force:
            return self.token
        cached = None if force else self._load_cached_token()
        if cached:
            self.token = cached
            _SECRETS.add(cached)
            print("  KIS 접근토큰: 저장해 둔 토큰을 다시 써요.")
            return self.token
        body = {"grant_type": "client_credentials", "appkey": self.app_key, "appsecret": self.app_secret}
        status, data = request_json("POST", self.base + KIS_TOKEN_PATH, "KIS 접근토큰 발급",
                                    json=body, headers={"content-type": "application/json; charset=utf-8"})
        if status != 200 or not data or not data.get("access_token"):
            message = (data or {}).get("error_description") or (data or {}).get("msg1") or ""
            raise Stop(
                f"KIS 접근토큰을 받지 못했어요 (HTTP {status}). {mask(message)}\n"
                "  → KIS_APP_KEY / KIS_APP_SECRET 값이 맞는지, 실전·모의(KIS_ENV) 구분이 맞는지 확인해 주세요.\n"
                "  → 토큰은 1분에 1번만 발급돼요. 방금 실행했다면 1분 뒤에 다시 해 주세요."
            )
        self.token = data["access_token"]
        _SECRETS.add(self.token)
        try:   # 만료 시각: "2026-11-24 12:00:00" (한국 시간)
            expires = dt.datetime.strptime(data.get("access_token_token_expired", ""), "%Y-%m-%d %H:%M:%S").replace(tzinfo=KST)
        except ValueError:
            expires = now_kst() + dt.timedelta(seconds=int(data.get("expires_in") or 86400))
        self._save_cached_token(self.token, expires)
        self.token_refreshed = True
        set_output("token_refreshed", "true")
        print("  KIS 접근토큰: 새로 발급했어요.")
        return self.token

    # ----- 조회 공통 -----
    def get(self, path, tr_id, params, label):
        """KIS GET 조회. 성공하면 응답 본문(dict), 실패하면 None"""
        for attempt in range(3):
            headers = {
                "content-type": "application/json; charset=utf-8",
                "authorization": "Bearer " + self.ensure_token(),
                "appkey": self.app_key,
                "appsecret": self.app_secret,
                "tr_id": tr_id,
                "custtype": "P",                # 개인
            }
            time.sleep(self.pause)
            status, body = request_json("GET", self.base + path, label, headers=headers, params=params)
            if body and body.get("rt_cd") == "0":
                return body
            code = (body or {}).get("msg_cd", "")
            if code == "EGW00201":                          # 초당 거래건수 초과 → 잠깐 쉬고 다시
                time.sleep(1.0)
                continue
            if code in ("EGW00121", "EGW00123") or status == 401:   # 토큰 만료·무효 → 한 번만 새로 발급
                if attempt == 0:
                    self.ensure_token(force=True)
                    continue
            print(f"  [실패] {label}: HTTP {status} {code} {mask((body or {}).get('msg1', ''))}")
            return None
        return None

    def quote(self, code):
        """현재가 시세 → {price, change, change_pct, listed_shares} 또는 None"""
        body = self.get(KIS_PRICE_PATH, KIS_PRICE_TR,
                        {"FID_COND_MRKT_DIV_CODE": KIS_MARKET, "FID_INPUT_ISCD": code}, f"KIS 현재가({code})")
        out = (body or {}).get("output") or {}
        price = to_number(out.get("stck_prpr"))
        if not price or price <= 0:                         # 0원은 거래정지 등 → 값 없음으로 본다
            return None
        return {
            "raw": out,
            "price": price,
            "change": to_number(out.get("prdy_vrss")),
            "change_pct": to_number(out.get("prdy_ctrt")),
            "listed_shares": to_number(out.get("lstn_stcn")),
        }

    def daily_closes(self, code, start, end):
        """기간별 일봉 종가 → [(날짜 'YYYY-MM-DD', 종가)], 날짜 오름차순 (수정주가 기준)"""
        body = self.get(KIS_DAILY_PATH, KIS_DAILY_TR, {
            "FID_COND_MRKT_DIV_CODE": KIS_MARKET, "FID_INPUT_ISCD": code,
            "FID_INPUT_DATE_1": start.strftime("%Y%m%d"), "FID_INPUT_DATE_2": end.strftime("%Y%m%d"),
            "FID_PERIOD_DIV_CODE": "D", "FID_ORG_ADJ_PRC": "0",
        }, f"KIS 일봉({code})")
        rows = []
        for row in (body or {}).get("output2") or []:
            day, close = to_date(row.get("stck_bsop_date")), to_number(row.get("stck_clpr"))
            if day and close and close > 0:
                rows.append((day, close))
        return sorted(rows)


# ---------------------------------------------------------------------------
# Finnhub
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


# ---------------------------------------------------------------------------
# 환율
# ---------------------------------------------------------------------------
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


# ---------------------------------------------------------------------------
# 종목별 갱신
# ---------------------------------------------------------------------------
def kr_market_date(kis, code, today):
    """가장 최근 거래일 (최근 2주 일봉의 마지막 날짜). 휴장일 판단에 쓴다"""
    rows = kis.daily_closes(code, today - dt.timedelta(days=14), today)
    return rows[-1][0] if rows else None


def kr_year_ago_close(kis, item, today):
    """1년 전(그날이 휴장이면 그 직전 거래일) 종가. 같은 날 이미 구했으면 다시 부르지 않는다"""
    target = one_year_ago(today).isoformat()
    saved = item.get("year_ago") or {}
    if saved.get("target") == target and saved.get("close"):
        return saved
    rows = kis.daily_closes(item["id"], one_year_ago(today) - dt.timedelta(days=14), one_year_ago(today))
    if not rows:
        return None
    return {"target": target, "date": rows[-1][0], "close": rows[-1][1]}


def update_kr(items, kis, now, args):
    today = now.date()
    codes = [i["id"] for i in items if i.get("type") == "reit"]
    if not codes:
        return 0, []
    market_date = kr_market_date(kis, codes[0], today)
    in_session = market_date == today.isoformat() and KR_OPEN <= now.time() < KR_CLOSE
    print(f"  최근 거래일 {market_date} / {'장중' if in_session else '장 마감 후 또는 휴장'}")
    updated, missing = 0, []
    for item in items:
        if item.get("type") != "reit":
            continue
        q = kis.quote(item["id"])
        if args.peek and q and updated == 0:
            peek(f"KIS 현재가 원본 ({item['name']})", q["raw"])
        if not q:
            item["stale"] = True
            missing.append(item["name"])
            continue
        year = kr_year_ago_close(kis, item, today)
        yearly = round((q["price"] - year["close"]) / year["close"] * 100, 2) if year else None
        shares = q["listed_shares"] if q["listed_shares"] and q["listed_shares"] > 0 else item.get("listed_shares")
        item.update({
            "close": q["price"], "price": q["price"],
            "base_date": (today.isoformat() if in_session else market_date) or item.get("base_date"),
            "price_kind": "현재가" if in_session else "종가",
            "price_time": iso_kst(now) if in_session else None,
            "change": q["change"], "change_pct": q["change_pct"], "dailyChangePct": q["change_pct"],
            "yearlyChangePct": yearly, "year_ago": year,
            "market_cap": round(q["price"] * shares) if shares else None,
            "listed_shares": shares,
            "listed_shares_date": today.isoformat() if q["listed_shares"] else item.get("listed_shares_date"),
            "price_source": KR_SOURCE, "stale": False,
        })
        updated += 1
    return updated, missing


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
    parser = argparse.ArgumentParser(description="KIS·Finnhub 시세 → data/prices.json")
    parser.add_argument("--peek", action="store_true", help="API 원본 1건씩 그대로 출력")
    parser.add_argument("--dry-run", action="store_true", help="저장하지 않고 결과만 출력")
    args = parser.parse_args()
    set_output("token_refreshed", "false")

    old = load_json("prices")
    if not old or not isinstance(old.get("items"), list) or not old["items"]:
        raise Stop("data/prices.json 이 없거나 비어 있어요. 종목 목록이 이 파일에 있어서 먼저 있어야 해요.")
    items = json.loads(json.dumps(old["items"]))            # 깊은 복사 (비교용 원본은 그대로)
    before = snapshot(items)
    now = now_kst()
    load_env()

    has_kis = has_key("KIS_APP_KEY") and has_key("KIS_APP_SECRET")
    has_finnhub = has_key("FINNHUB_API_KEY")
    if not has_kis and not has_finnhub:
        raise Stop("API 키가 하나도 없어요. KIS_APP_KEY·KIS_APP_SECRET·FINNHUB_API_KEY 를 "
                   "GitHub Secrets(또는 .env)에 넣어 주세요.")
    for name in ("KIS_APP_KEY", "KIS_APP_SECRET", "FINNHUB_API_KEY"):
        if has_key(name):
            _SECRETS.add(os.environ[name].strip())

    # ---------- 1) 국내 리츠 ----------
    kr_count, kr_missing = 0, []
    if has_kis:
        print("[1/3] 국내 리츠 시세 (한국투자증권 Open API)")
        kis = Kis(os.environ["KIS_APP_KEY"].strip(), os.environ["KIS_APP_SECRET"].strip(),
                  os.environ.get("KIS_ENV", "real").strip().lower(), os.environ.get("KIS_TOKEN_CACHE"))
        kr_count, kr_missing = update_kr(items, kis, now, args)
    else:
        print("[1/3] KIS 키가 없어 국내 리츠는 직전 값을 그대로 둬요.")

    # ---------- 2) 환율 ----------
    print("[2/3] 원/달러 환율")
    previous_fx = old.get("fx") or next(({"rate": i.get("fx_rate"), "date": i.get("fx_date")}
                                         for i in items if i.get("fx_rate")), None)
    fx = fetch_usd_krw(previous_fx) if has_finnhub else previous_fx
    if fx:
        print(f"  1달러 = {fx['rate']:,.2f}원 ({fx.get('date')}, {fx.get('source', '직전 값')})")

    # ---------- 3) 미국 리츠 ----------
    us_count, us_missing = 0, []
    if has_finnhub:
        print("[3/3] 미국 리츠 시세 (Finnhub)")
        us_count, us_missing = update_us(items, os.environ["FINNHUB_API_KEY"].strip(), fx, now, args)
    else:
        print("[3/3] Finnhub 키가 없어 미국 리츠는 직전 값을 그대로 둬요.")

    total = kr_count + us_count
    print(f"\n  받은 종목: 국내 {kr_count} / 미국 {us_count}")
    if kr_missing or us_missing:
        print(f"  못 받은 종목(직전 값 유지): {kr_missing + us_missing}")
    set_output("updated", str(total))
    if total == 0:
        raise Stop("한 종목도 시세를 받지 못해서 파일을 그대로 뒀어요. 위의 [실패] 이유를 확인해 주세요.")

    if snapshot(items) == before and not args.dry_run:
        print("\n[완료] 직전 파일과 시세가 같아서 저장하지 않았어요.")
        return

    dates = sorted(i["base_date"] for i in items if i.get("type") == "reit" and i.get("base_date") and not i.get("stale"))
    as_of = dates[-1] if dates else now.date().isoformat()
    sources = {"kr": KR_SOURCE if has_kis else old.get("source"), "us": US_SOURCE if has_finnhub else old.get("source"),
               "fx": (fx or {}).get("source")}
    if args.dry_run:
        print("\n[dry-run] 저장하지 않았어요. 첫 종목 결과:")
        print(json.dumps(items[0], ensure_ascii=False, indent=2))
        return
    save_json("prices", as_of, SOURCE, items, updatedAt=iso_kst(now), etf_confirmed=old.get("etf_confirmed", False),
              fx=fx, sources=sources)
    note = ("장중에는 30분 간격으로 받은 현재가(price_kind \"현재가\"), 장 마감 뒤에는 종가. 실시간 아님. "
            "1년 등락률: 국내는 1년 전 같은 날(휴장이면 직전 거래일) 종가 대비, 미국은 Finnhub 52주 가격 등락률. "
            f"미국 리츠 원화 값 = 달러 값 × 환율({(fx or {}).get('source')}). "
            "못 받은 종목은 직전 값을 그대로 두고 stale 로 표시. 시가총액 = 가격 × 상장주식 수.")
    update_meta("prices", SOURCE, SOURCE_URL, as_of, len(items), note)
    print(f"\n[성공] data/prices.json 저장 (기준일 {as_of}, {iso_kst(now)})")


if __name__ == "__main__":
    run(main)
