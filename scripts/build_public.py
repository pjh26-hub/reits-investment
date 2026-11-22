# -*- coding: utf-8 -*-
"""
scripts/build_public.py — API 키 없이 받을 수 있는 데이터로 data/*.json 만들기

API 키가 아직 없을 때 쓰는 길입니다. 키가 생기면 build_all.py(공식 API)를 쓰세요.

어디서 가져오나
  ① 상장 리츠 목록·건물(이름, 주소, 좌표)   국토교통부 리츠정보시스템 공개 화면을 옮겨 적은 data/raw/molit_*.txt
  ② 종목코드                                 한국거래소 KIND 상장법인목록 (공식, 키 없음)
  ③ 지표(배당수익률, NAV, WALE 등)           리츠정보시스템 상장리츠현황 화면 → convert_metrics.py
  ④ 종가·배당·주식 수                        야후 파이낸스 차트 (비공식. 거래소 시세를 늦게 받아 보여주는 곳)

꼭 알아둘 점
  - ④는 정부·거래소의 공식 API가 아닙니다. 그래서 meta.json 에 출처를 그대로 적고,
    배당은 리츠정보시스템의 결산 횟수와 맞을 때만 "최근 1년 주당배당금"으로 씁니다. 안 맞으면 null.
  - 리츠 ETF는 여기서 받지 않습니다(어떤 ETF를 넣을지 사람이 정해야 함).

실행
  python scripts/build_public.py
"""

import datetime as dt
import re
import subprocess
import sys

from _util import (
    KST, RAW_DIR, SCRIPTS_DIR, Stop, http_get, load_json, norm_name, run, save_json,
    to_date, to_number, today_str, update_meta,
)

KIND_URL = "https://kind.krx.co.kr/corpgeneral/corpList.do"
YAHOO_CHART = "https://query1.finance.yahoo.com/v8/finance/chart/"
YAHOO_SHARES = "https://query1.finance.yahoo.com/ws/fundamentals-timeseries/v1/finance/timeseries/"
BROWSER = {"User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0 Safari/537.36"}

MOLIT_SOURCE = "국토교통부 리츠정보시스템 공개 화면 (상장리츠현황·GIS 지도에 표시된 값을 옮겨 적음)"
MOLIT_URL = "https://reits.molit.go.kr/pub/chart/chartSearch02_6?pmn=80"
YAHOO_SOURCE = "야후 파이낸스 (비공식 · 거래소 시세 지연 제공)"
YAHOO_URL = "https://finance.yahoo.com"
WIKI_SP500_URL = "https://en.wikipedia.org/wiki/List_of_S%26P_500_companies"
NOMINATIM_URL = "https://nominatim.openstreetmap.org/search"
FINLIFE_SOURCE = "금융감독원 금융상품한눈에 적금 비교 화면 (은행·12개월·정액적립식·가입제한 없음으로 검색한 표를 옮겨 적음)"
FINLIFE_URL = "https://finlife.fss.or.kr/finlife/svings/fdrmEnty/list.do?menuNo=700003"


def get(url, params=None, label=""):
    """_util.http_get 에 브라우저 머리말만 더한 것"""
    import requests
    last = None
    for attempt in range(3):
        try:
            return requests.get(url, params=params, headers=BROWSER, timeout=30)
        except requests.RequestException as e:
            last = e
    raise Stop(f"{label}: 서버에 연결하지 못했어요. 인터넷 연결을 확인해 주세요. ({type(last).__name__})")


def newest_raw(prefix):
    """data/raw 에서 이름이 prefix 로 시작하는 가장 최근 파일의 줄 목록(제목 줄 제외)과 파일 이름"""
    files = sorted(RAW_DIR.glob(prefix + "*.txt"))
    if not files:
        raise Stop(f"data/raw 에 {prefix}*.txt 파일이 없어요.")
    lines = [l for l in files[-1].read_text(encoding="utf-8-sig").splitlines() if l.strip()]
    return [l.split("|") for l in lines[1:]], files[-1].name


def fetch_kind():
    """한국거래소 KIND 상장법인목록 → {비교용 이름: {code, market, listed_date, fiscal_month}}"""
    res = get(KIND_URL, {"method": "download", "searchType": "13"}, "KIND 상장법인목록")
    html = res.content.decode("euc-kr", errors="replace")
    table = {}
    for row in re.findall(r"<tr>(.*?)</tr>", html, flags=re.S):
        cells = [re.sub(r"<.*?>", "", c).strip() for c in re.findall(r"<td[^>]*>(.*?)</td>", row, flags=re.S)]
        if len(cells) >= 7 and cells[2]:
            table[norm_name(cells[0])] = {"code": cells[2], "market": cells[1], "listed_date": to_date(cells[5]),
                                          "fiscal_month": cells[6]}
    if not table:
        raise Stop("KIND 상장법인목록을 읽지 못했어요(표 모양이 바뀌었을 수 있어요).")
    return table


def fetch_yahoo(symbol):
    """야후 차트에서 마지막 종가와 배당 내역을 받는다. 종목이 없으면 None"""
    res = get(YAHOO_CHART + symbol, {"range": "2y", "interval": "1d", "events": "div"}, f"야후 차트({symbol})")
    try:
        result = res.json()["chart"]["result"][0]
    except (ValueError, KeyError, TypeError, IndexError):
        return None
    offset = result["meta"].get("gmtoffset", 32400)
    stamps = result.get("timestamp") or []
    closes = ((result.get("indicators") or {}).get("quote") or [{}])[0].get("close") or []
    bars = [(t, c) for t, c in zip(stamps, closes) if c is not None]
    if not bars:
        return None
    last_time, last_close = bars[-1]

    def day(ts):
        return dt.datetime.fromtimestamp(ts + offset, dt.timezone.utc).strftime("%Y-%m-%d")

    prev_close = bars[-2][1] if len(bars) > 1 else None
    events = sorted(({"date": day(v["date"]), "amount": v["amount"]}
                     for v in ((result.get("events") or {}).get("dividends") or {}).values()), key=lambda e: e["date"])
    # 최근 1년 종가 기록(그래프용). 점이 너무 많으면 80개 안팎으로 솎아 낸다. 마지막 날은 꼭 넣는다
    is_won = result["meta"].get("currency") == "KRW"
    year = [[day(t), round(c) if is_won else round(c, 2)] for t, c in bars if t >= last_time - 365 * 86400]
    history = year[::max(1, len(year) // 80)]
    if history and history[-1] != year[-1]:
        history.append(year[-1])
    return {"close": last_close, "base_date": day(last_time), "prev_close": prev_close,
            "currency": result["meta"].get("currency"), "dividends": events, "history": history,
            "name": result["meta"].get("shortName") or result["meta"].get("longName")}


def fetch_sp500_reits():
    """위키백과 'List of S&P 500 companies' 표에서 리츠만 고른다 → [(종목기호, 이름, 소분류)]"""
    res = get(WIKI_SP500_URL, None, "위키백과 S&P 500 목록")
    table = re.search(r'<table[^>]*id="constituents".*?</table>', res.text, flags=re.S)
    if not table:
        return []
    found = []
    for row in re.findall(r"<tr[^>]*>(.*?)</tr>", table.group(0), flags=re.S):
        cells = [re.sub(r"<.*?>", "", c).strip() for c in re.findall(r"<td[^>]*>(.*?)</td>", row, flags=re.S)]
        if len(cells) >= 5 and "REIT" in cells[3]:
            found.append((cells[0].replace(".", "-"), cells[1], cells[3], cells[4]))    # 기호, 이름, 소분류, 본사 도시
    return found


def geocode_city(city):
    """도시 이름(예: 'San Diego, California')을 (위도, 경도)로. OpenStreetMap Nominatim 사용 (1초에 1번 이하)"""
    import time

    import requests
    time.sleep(1.1)
    try:
        res = requests.get(NOMINATIM_URL, params={"format": "jsonv2", "limit": 1, "q": city},
                           headers={"User-Agent": "coffee-landlord-class-project/1.0"}, timeout=30)
        hit = res.json()[0]
        return round(float(hit["lat"]), 4), round(float(hit["lon"]), 4)
    except (requests.RequestException, ValueError, KeyError, IndexError, TypeError):
        return None, None


def build_global(count=10):
    """해외 리츠: S&P 500 구성 종목 중 리츠의 시가총액 상위 count 개 (가격·배당은 달러 → 원으로 환산)"""
    fx_quote = fetch_yahoo("KRW=X")
    candidates = fetch_sp500_reits()
    if not fx_quote or not candidates:
        return [], [], None, []
    fx = fx_quote["close"]
    rows = []
    for symbol, name, sub, hq in candidates:
        quote = fetch_yahoo(symbol)
        shares, shares_date = fetch_shares(symbol) if quote else (None, None)
        if not quote or quote.get("currency") != "USD" or not shares:
            continue
        rows.append({"symbol": symbol, "name": name, "sub": sub, "hq": hq, "quote": quote, "shares": shares,
                     "shares_date": shares_date, "cap": quote["close"] * shares})
    rows.sort(key=lambda r: r["cap"], reverse=True)
    prices, dividends = [], []
    for r in rows[:count]:
        q = r["quote"]
        end = dt.date.fromisoformat(q["base_date"])
        recent = [e for e in q["dividends"] if dt.date.fromisoformat(e["date"]) > end - dt.timedelta(days=365)]
        dps_local = round(sum(e["amount"] for e in recent), 4) if recent else None
        hq_lat, hq_lng = geocode_city(r["hq"]) if r["hq"] else (None, None)
        prices.append({
            "hq": r["hq"] or None, "hq_lat": hq_lat, "hq_lng": hq_lng,      # 본사 도시와 그 도시의 좌표
            "id": r["symbol"], "type": "global", "name": r["name"], "close": round(q["close"] * fx),
            "close_local": round(q["close"], 2), "currency": "USD", "fx_rate": round(fx, 2), "base_date": q["base_date"],
            "change": None, "change_pct": round((q["close"] - q["prev_close"]) / q["prev_close"] * 100, 2) if q["prev_close"] else None,
            "volume": None, "market_cap": round(r["cap"] * fx), "listed_shares": int(r["shares"]),
            "listed_shares_date": r["shares_date"], "country": "미국", "sub_industry": r["sub"],
        })
        dividends.append({
            "id": r["symbol"], "name": r["name"], "corp_code": None,
            "dps_annual": round(dps_local * fx, 2) if dps_local else None,
            "dps_annual_local": dps_local, "currency": "USD",
            "dps_basis": (f"최근 1년 배당 {len(recent)}건 합계 {dps_local}달러 × 환율 {fx:,.2f}원" if dps_local
                          else "최근 1년 배당 내역이 없음"),
            "period_months": None, "latest_period_end": None,
            "periods": [{"period_end": e["date"], "dps": e["amount"], "from": "배당락일 기준(달러)", "rcept_no": None}
                        for e in reversed(recent)],
        })
    histories = [{"id": r["symbol"], "currency": "USD", "points": r["quote"]["history"]} for r in rows[:count]]
    info = {"fx": fx, "fx_date": fx_quote["base_date"], "candidates": len(candidates), "priced": len(rows)}
    return prices, dividends, info, histories


def build_savings():
    """금융상품한눈에 화면에서 옮겨 적은 은행 적금 표 → savings.json 항목"""
    files = sorted(RAW_DIR.glob("finlife_savings_screen_*.txt"))
    if not files:
        return [], None
    lines = [l for l in files[-1].read_text(encoding="utf-8-sig").splitlines() if l.strip()][1:]
    items = []
    for line in lines:
        bank, product, reserve, base, top, who, kind = [c.strip() for c in line.split("|")]
        items.append({
            "kind": "saving", "bank": bank, "product": product, "product_code": None, "term_months": 12,
            "rate_base": to_number(base.replace("%", "")), "rate_max": to_number(top.replace("%", "")),
            "rate_type": kind or None, "reserve_type": reserve or None,
            "join_deny": 1 if who == "제한없음" else None, "join_way": None, "join_member": who or None,
            "special_condition": None, "max_limit": None, "disclosure_month": None,
        })
    return items, to_date(re.search(r"(\d{8})", files[-1].name).group(1))


def fetch_shares(symbol):
    """야후 재무자료에서 가장 최근 발행 주식 수와 그 기준일. 없으면 (None, None)"""
    now = int(dt.datetime.now(KST).timestamp())
    kinds = "quarterlyOrdinarySharesNumber,annualOrdinarySharesNumber,quarterlyShareIssued,annualShareIssued"
    res = get(YAHOO_SHARES + symbol, {"symbol": symbol, "type": kinds, "period1": now - 3 * 365 * 86400, "period2": now},
              f"야후 주식 수({symbol})")
    try:
        results = res.json()["timeseries"]["result"]
    except (ValueError, KeyError, TypeError):
        return None, None
    best = (None, None)
    for block in results:
        for key, rows in block.items():
            if key in ("meta", "timestamp") or not isinstance(rows, list):
                continue
            for row in rows:
                value = ((row or {}).get("reportedValue") or {}).get("raw")
                as_of = (row or {}).get("asOfDate")
                if value and as_of and (best[1] is None or as_of > best[1]):
                    best = (value, as_of)
    return best


def main():
    # ---------- 1) 상장 리츠 목록 + 종목코드 ----------
    print("[1/4] 상장 리츠 목록에 종목코드를 붙이는 중...")
    listed, listed_file = newest_raw("molit_listed_reits_")
    kind = fetch_kind()
    reits, missing = [], []
    for reits_no, name, _count in listed:
        hit = kind.get(norm_name(name))
        if not hit:
            missing.append(name)
            continue
        reits.append({"id": hit["code"], "name": name, "reits_no": reits_no, "listed_date": hit["listed_date"],
                      "fiscal_month": hit["fiscal_month"], "market": hit["market"]})
    print(f"      리츠 {len(listed)}개 중 종목코드를 찾은 곳 {len(reits)}개" + (f" / 못 찾은 곳 {missing}" if missing else ""))

    # ---------- 2) 건물 ----------
    print("[2/4] 건물(주소·좌표)을 정리하는 중...")
    rows, assets_file = newest_raw("molit_gis_assets_")
    by_no = {r["reits_no"]: r for r in reits}
    assets, counts = [], {}
    for reits_no, name, address, kind_name, lng, lat, land, floor, completed in rows:
        reit = by_no.get(reits_no)
        if not reit:
            continue
        counts[reits_no] = counts.get(reits_no, 0) + 1
        lat_n, lng_n = to_number(lat), to_number(lng)
        assets.append({
            "asset_id": f"{reit['id']}-{counts[reits_no]:02d}", "reit_id": reit["id"], "reit_name": reit["name"],
            "name": name or None, "asset_type": kind_name or None, "invest_type": None, "address": address or None,
            "land_area_m2": to_number(land), "floor_area_m2": to_number(floor), "completed_date": to_date(completed),
            "lat": round(lat_n, 6) if lat_n else None, "lng": round(lng_n, 6) if lng_n else None,
            "geocode_matched": None,
            "geocode_status": "리츠정보시스템 지도 표시 위치" if lat_n else ("주소 없음" if not address else "위치 정보 없음"),
        })
    as_of_assets = to_date(re.search(r"(\d{8})", assets_file).group(1))

    # ---------- 3) reits.json 저장 → 지표에 종목코드 붙이기 ----------
    metrics_by_name = {norm_name(m["name"]): m for m in (load_json("metrics") or {}).get("items", [])}
    reit_items = []
    for r in reits:
        m = metrics_by_name.get(norm_name(r["name"]), {})
        own = [a for a in assets if a["reit_id"] == r["id"]]
        reit_items.append({
            "id": r["id"], "type": "reit", "name": r["name"], "name_official": None, "reits_no": r["reits_no"],
            "id_method": "KIND 상장법인목록 이름 일치", "status": "운영중", "reit_type": None, "amc": None,
            "approved_date": m.get("approved_date"), "listed_date": r["listed_date"],
            "listing_check": "상장일 일치" if m.get("listed_date") == r["listed_date"] else "상장일 확인 필요",
            "fiscal_month": r["fiscal_month"], "main_asset_type": m.get("asset_type"),
            "asset_types": sorted({a["asset_type"] for a in own if a["asset_type"]}), "asset_count": len(own),
            "total_assets_100m_won": None, "molit_dividend_yield": None,
        })
    today = today_str()
    save_json("reits", today, MOLIT_SOURCE + " + 한국거래소 KIND 상장법인목록(종목코드)", reit_items, unmatched=missing)
    save_json("assets", as_of_assets, MOLIT_SOURCE, assets)
    update_meta("reits", "국토교통부 리츠정보시스템 + 한국거래소 KIND 상장법인목록", MOLIT_URL, today, len(reit_items),
                "상장 리츠 목록은 리츠정보시스템 화면, 종목코드는 KIND 상장법인목록에서 이름이 같은 회사.")
    update_meta("assets", "국토교통부 리츠정보시스템 GIS 지도", "https://reits.molit.go.kr/pub/gis/gisMapSearch?pmn=70",
                as_of_assets, len(assets),
                "리츠가 직접 가진 건물만 있음(자회사 리츠를 통해 가진 건물, 해외 건물은 없음). "
                "좌표는 리츠정보시스템 GIS 지도에 표시된 위치. 주소가 없는 건물은 좌표도 없음.")
    screen_file = sorted(RAW_DIR.glob("listed_reits_screen_*.txt"))[-1]
    code = subprocess.run([sys.executable, str(SCRIPTS_DIR / "convert_metrics.py"), "--file", str(screen_file),
                           "--as-of", to_date(re.search(r"(\d{8})", screen_file.name).group(1))],
                          stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL).returncode
    print("      지표에 종목코드 붙이기:", "성공" if code == 0 else "실패(convert_metrics.py 를 따로 실행해 보세요)")
    metrics_by_id = {m["id"]: m for m in (load_json("metrics") or {}).get("items", []) if m.get("id")}

    # ---------- 4) 종가·배당·주식 수 ----------
    print("[3/4] 종가·배당·주식 수를 받는 중... (야후 파이낸스)")
    prices, dividends, base_dates, histories = [], [], [], []
    for r in reit_items:
        symbol = r["id"] + ".KS"
        quote = fetch_yahoo(symbol)
        shares, shares_date = fetch_shares(symbol) if quote else (None, None)
        if not quote or quote.get("currency") != "KRW":
            prices.append({"id": r["id"], "type": "reit", "name": r["name"], "close": None, "base_date": None, "change": None,
                           "change_pct": None, "volume": None, "market_cap": None, "listed_shares": None,
                           "listed_shares_date": None})
            dividends.append({"id": r["id"], "name": r["name"], "corp_code": None, "dps_annual": None,
                              "dps_basis": "야후 파이낸스에 이 종목이 없음", "period_months": None,
                              "latest_period_end": None, "periods": []})
            continue
        close, prev = quote["close"], quote["prev_close"]
        base_dates.append(quote["base_date"])
        histories.append({"id": r["id"], "currency": "KRW", "points": quote["history"]})
        # 주식 수 자료가 1년보다 오래됐으면 그 사이 증자 등으로 달라졌을 수 있어 쓰지 않는다
        limit = (dt.date.fromisoformat(quote["base_date"]) - dt.timedelta(days=365)).isoformat()
        if shares_date and shares_date < limit:
            shares = None
        prices.append({
            "id": r["id"], "type": "reit", "name": r["name"], "close": round(close), "base_date": quote["base_date"],
            "change": round(close - prev) if prev else None,
            "change_pct": round((close - prev) / prev * 100, 2) if prev else None, "volume": None,
            "market_cap": round(close * shares) if shares else None,
            "listed_shares": int(shares) if shares else None, "listed_shares_date": shares_date,
        })
        # 최근 1년 배당: 리츠정보시스템의 결산 횟수와 건수가 맞을 때만 합계를 낸다
        end = dt.date.fromisoformat(quote["base_date"])
        recent = [e for e in quote["dividends"] if dt.date.fromisoformat(e["date"]) > end - dt.timedelta(days=365)]
        expected = (metrics_by_id.get(r["id"]) or {}).get("periods_per_year")
        listing = ", ".join(f"{e['date']} {e['amount']:g}원" for e in recent) or "없음"
        if expected and len(recent) == expected:
            total = round(sum(e["amount"] for e in recent), 2)
            basis = f"최근 1년 배당 {len(recent)}건 합계({listing}). 리츠정보시스템 기준 연 {expected}회 결산과 건수가 일치"
        else:
            total = None
            basis = (f"최근 1년 배당 {len(recent)}건({listing})이 리츠정보시스템 기준 결산 횟수"
                     f"({expected if expected else '알 수 없음'})와 맞지 않아 합계를 내지 않음")
        dividends.append({
            "id": r["id"], "name": r["name"], "corp_code": None, "dps_annual": total, "dps_basis": basis,
            "period_months": 12 // expected if expected else None, "latest_period_end": None,
            "periods": [{"period_end": e["date"], "dps": e["amount"], "from": "배당락일 기준", "rcept_no": None}
                        for e in reversed(quote["dividends"])],
        })

    domestic_prices, domestic_dividends = list(prices), list(dividends)

    # ---------- 해외 리츠 (미국) ----------
    print("      해외 리츠를 받는 중... (S&P 500에 들어 있는 리츠 중 시가총액 상위 10개)")
    global_prices, global_dividends, global_info, global_histories = build_global(10)
    prices.extend(global_prices)
    dividends.extend(global_dividends)
    histories.extend(global_histories)
    global_note = ""
    if global_info:
        global_note = (f" 해외 리츠 {len(global_prices)}개는 S&P 500 구성 종목 중 리츠(위키백과 목록의 GICS 소분류 기준 "
                       f"{global_info['candidates']}개)에서 시가총액이 큰 순서로 고름. "
                       f"원화 값은 달러 값 × 환율 {global_info['fx']:,.2f}원({global_info['fx_date']}, 야후 파이낸스). "
                       "해외 리츠의 위치는 건물이 아니라 본사가 있는 도시(위키백과 목록)이고, 좌표는 OpenStreetMap 기준.")

    as_of_price = max(base_dates) if base_dates else None
    save_json("prices", as_of_price, YAHOO_SOURCE, prices, etf_confirmed=False)
    save_json("dividends", today, YAHOO_SOURCE, dividends)
    save_json("history", as_of_price, YAHOO_SOURCE, histories)
    update_meta("history", YAHOO_SOURCE, YAHOO_URL, as_of_price, len(histories),
                "최근 1년 종가 기록(그래프용). 며칠 간격으로 솎아 낸 값이고, 해외 리츠는 달러 기준.")
    update_meta("prices", YAHOO_SOURCE, YAHOO_URL, as_of_price, len(prices),
                "공식 API 키가 없어 임시로 쓰는 출처. 종가는 마지막 거래일 값(실시간 아님). "
                "시가총액 = 종가 × 발행 주식 수(재무자료 기준, 기준일은 listed_shares_date). 리츠 ETF는 아직 없음."
                + global_note)

    # ---------- 은행 적금 ----------
    saving_items, saving_date = build_savings()
    if saving_items:
        save_json("savings", saving_date, FINLIFE_SOURCE, saving_items)
        update_meta("savings", FINLIFE_SOURCE, FINLIFE_URL, saving_date, len(saving_items),
                    "기준일은 화면을 조회한 날짜. 은행·12개월·정액적립식·가입제한 없음 상품만. 금리는 세전, "
                    "최고 우대금리는 우대조건을 모두 채웠을 때. 우대조건 내용은 담지 못함.")
    update_meta("dividends", YAHOO_SOURCE, YAHOO_URL, today, len(dividends),
                "공식 API 키가 없어 임시로 쓰는 출처. 최근 1년 배당 건수가 리츠정보시스템의 결산 횟수와 같을 때만 "
                "합계를 냄. 과거 지급 실적이며 앞으로의 배당을 뜻하지 않음.")

    # ---------- 요약 ----------
    print("[4/4] 저장 끝\n")
    print(f"  리츠 {len(reit_items)}개 / 건물 {len(assets)}곳 (좌표 있음 {sum(1 for a in assets if a['lat'])}곳)")
    print(f"  종가 기준일 {as_of_price}")
    if saving_items:
        best = max(saving_items, key=lambda s: s["rate_max"] or 0)
        print(f"  은행 적금 {len(saving_items)}개 (최고 우대금리: {best['bank']} {best['product']} {best['rate_max']}%, 기본 {best['rate_base']}%)")
    print(f"  해외 리츠 {len(global_prices)}개" + (f" (환율 {global_info['fx']:,.2f}원)" if global_info else ""))
    for p, d in zip(global_prices, global_dividends):
        y = f"{d['dps_annual'] / p['close'] * 100:.2f}%" if d["dps_annual"] else "-"
        print(f"    {p['id']} {p['name']}: {p['close_local']}달러 (약 {p['close']:,}원) / 1년 배당 {d['dps_annual_local']}달러 / 주가 기준 {y}")
    price_by_id = {p["id"]: p for p in prices}
    for d in domestic_dividends:
        p = price_by_id[d["id"]]
        m = metrics_by_id.get(d["id"]) or {}
        y = f"{d['dps_annual'] / p['close'] * 100:.2f}%" if d["dps_annual"] and p["close"] else "-"
        pnav = (f"{p['market_cap'] / (m['nav_million_won'] * 1e6):.2f}"
                if p.get("market_cap") and m.get("nav_million_won") else "-")
        print(f"    {d['id']} {d['name']}: 종가 {p['close']} / 1년 배당 {d['dps_annual']} / 주가 기준 {y} / P/NAV {pnav}"
              f" / 주식 수 기준일 {p.get('listed_shares_date')}")
        if d["dps_annual"] is None:
            print(f"        → {d['dps_basis']}")
    bad = [r["name"] for r in reit_items if r["listing_check"] != "상장일 일치"]
    if bad:
        print(f"  [확인 필요] KIND의 상장일이 리츠정보시스템과 다른 곳: {bad}")


if __name__ == "__main__":
    run(main)
