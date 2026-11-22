# -*- coding: utf-8 -*-
"""
scripts/fetch_prices.py — 금융위원회 시세 API → data/prices.json

하는 일
  1) 시세가 올라와 있는 가장 최근 기준일을 찾는다
     (전일 종가는 다음 영업일 오후 1시 이후에 올라온다. 실시간이 아니다)
  2) reits.json 에 있는 상장 리츠의 종가를 받는다          ← 주식시세정보 API
  3) 종목명에 '리츠'가 들어간 ETF의 종가를 받는다           ← 증권상품시세정보 API
     ETF 목록은 사람이 확인해야 한다 → scripts/etf_confirmed.json

실행
  python scripts/fetch_prices.py          평소 실행
  python scripts/fetch_prices.py --peek   API 원본 1건을 그대로 보여줌(구조 확인용)

필요한 키: DATA_GO_KR_KEY
먼저 필요한 파일: data/reits.json (fetch_reits.py 가 만든다)
출처 명세: 공공데이터포털 15094808, 15094806 (2026-11-14 확인)
"""

import argparse
import json

from _util import (
    ETF_URL, SCRIPTS_DIR, Stop, clean_text, data_go_kr_all, fetch_all_stocks, find_latest_base_date,
    get_data_go_kr_key, load_json, norm_code, peek, run, save_json, to_date, to_number, update_meta,
)

SOURCE = "금융위원회 주식시세정보·증권상품시세정보 API (공공데이터포털 15094808, 15094806)"
SOURCE_URL = "https://www.data.go.kr/data/15094808/openapi.do"
ETF_KEYWORD = "리츠"     # 종목명에 이 글자가 들어간 ETF를 후보로 뽑는다


def load_confirmed_etfs():
    """사람이 확인한 ETF 종목코드 목록. 아직 확인 전이면 None"""
    path = SCRIPTS_DIR / "etf_confirmed.json"
    if not path.exists():
        return None
    try:
        confirmed = json.loads(path.read_text(encoding="utf-8")).get("confirmed")
    except ValueError:
        raise Stop("scripts/etf_confirmed.json 의 모양이 잘못됐어요(쉼표·따옴표 확인).")
    return None if confirmed is None else [norm_code(c) for c in confirmed]


def price_item(row, kind, name=None):
    """API 한 건을 우리 모양으로 바꾼다 (리츠와 ETF 공통)"""
    item = {
        "id": norm_code(row.get("srtnCd")),
        "type": kind,
        "name": name or clean_text(row.get("itmsNm")),
        "close": to_number(row.get("clpr")),                 # 종가(원) = 1주 가격
        "base_date": to_date(row.get("basDt")),
        "change": to_number(row.get("vs")),                  # 전일 대비(원)
        "change_pct": to_number(row.get("fltRt")),           # 등락률(%)
        "volume": to_number(row.get("trqu")),                # 거래량
        "market_cap": to_number(row.get("mrktTotAmt")),      # 시가총액(원)
    }
    if kind == "reit":
        item["listed_shares"] = to_number(row.get("lstgStCnt"))    # 상장주식수
    else:
        item["listed_shares"] = to_number(row.get("stLstgCnt"))    # 상장좌수
        item["nav"] = to_number(row.get("nav"))                    # ETF 1좌당 순자산가치
        item["base_index"] = clean_text(row.get("bssIdxIdxNm"))    # 기초지수 이름
    return item


def main():
    parser = argparse.ArgumentParser(description="금융위 시세 → prices.json")
    parser.add_argument("--peek", action="store_true", help="API 원본 1건을 그대로 출력")
    args = parser.parse_args()

    reits = load_json("reits")
    if not reits or not reits.get("items"):
        raise Stop("data/reits.json 이 없거나 비어 있어요. 먼저  python scripts/fetch_reits.py  를 실행해 주세요.")
    key = get_data_go_kr_key()

    # ---------- 1) 최근 기준일 ----------
    base_date = find_latest_base_date(key)
    print(f"[1/3] 가장 최근 시세 기준일: {to_date(base_date)}")

    # ---------- 2) 상장 리츠 종가 ----------
    print("[2/3] 상장 리츠 종가를 받는 중...")
    stocks = fetch_all_stocks(key, base_date)
    if args.peek and stocks:
        peek("주식시세 1건", stocks[0])
    by_code = {norm_code(s.get("srtnCd")): s for s in stocks}
    items, missing = [], []
    for reit in reits["items"]:
        row = by_code.get(reit["id"])
        if row:
            items.append(price_item(row, "reit", reit["name"]))
        else:                         # 시세가 없으면 지어내지 않고 null 로 남긴다
            missing.append(reit["name"])
            items.append({"id": reit["id"], "type": "reit", "name": reit["name"], "close": None,
                          "base_date": to_date(base_date), "change": None, "change_pct": None,
                          "volume": None, "market_cap": None, "listed_shares": None})

    # ---------- 3) 리츠 ETF 종가 ----------
    print("[3/3] 리츠 ETF 종가를 받는 중...")
    query = {"serviceKey": key, "resultType": "json", "basDt": base_date, "likeItmsNm": ETF_KEYWORD}
    etf_rows = data_go_kr_all(ETF_URL, query, "ETF시세", page_size=1000)
    etf_date = base_date
    if not etf_rows:                  # 주식과 ETF의 최근 기준일이 다를 때를 대비
        etf_date = find_latest_base_date(key, ETF_URL, "ETF시세")
        query["basDt"] = etf_date
        etf_rows = data_go_kr_all(ETF_URL, query, "ETF시세", page_size=1000)
    if args.peek and etf_rows:
        peek("ETF시세 1건", etf_rows[0])

    confirmed = load_confirmed_etfs()
    candidates = [price_item(r, "etf") for r in etf_rows]
    if confirmed is None:
        etf_items = candidates
    else:
        etf_items = [c for c in candidates if c["id"] in confirmed]
    items.extend(etf_items)

    as_of = to_date(base_date)
    note = "전일 종가(실시간 아님). 기준일의 다음 영업일 오후 1시 이후 갱신. 값은 원자료 그대로."
    if confirmed is None:
        note += " ETF 목록은 아직 사람이 확인하지 않음(종목명에 '리츠'가 들어간 ETF 전부)."
    save_json("prices", as_of, SOURCE, items, etf_confirmed=confirmed is not None)
    update_meta("prices", SOURCE, SOURCE_URL, as_of, len(items), note)

    # ---------- 요약 ----------
    reit_count = sum(1 for i in items if i["type"] == "reit")
    print("\n[성공] data/prices.json 저장")
    print(f"  기준일 {as_of} / 리츠 {reit_count}개 / 리츠 ETF {len(etf_items)}개")
    if missing:
        print(f"  빠진 값: 시세를 못 찾은 리츠 {len(missing)}개 {missing}")
    print(f"\n  종목명에 '{ETF_KEYWORD}'가 들어간 ETF 후보 {len(candidates)}개:")
    for c in candidates:
        mark = "" if confirmed is None else ("  [포함]" if c["id"] in confirmed else "  [제외]")
        print(f"    {c['id']}  {c['name']}  (종가 {c['close']}, 기초지수: {c['base_index']}){mark}")
    if confirmed is None:
        print("  [확인 필요] 위 목록에서 넣을 ETF를 알려주세요. 정해지면 scripts/etf_confirmed.json 의")
        print("             confirmed 에 종목코드를 적고 다시 실행하면 그 ETF만 들어갑니다. (지금은 전부 포함)")


if __name__ == "__main__":
    run(main)
