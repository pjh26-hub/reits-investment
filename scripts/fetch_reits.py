# -*- coding: utf-8 -*-
"""
scripts/fetch_reits.py — 국토교통부 리츠정보 API → data/reits.json, data/assets.json

하는 일
  1) 리츠 목록 전체를 받아서 '상장 리츠'만 고른다 (상장일이 있고 상장폐지일이 없는 리츠)
  2) 상장 리츠마다 종목코드(6자리)를 찾는다
       ① scripts/manual_ids.json 에 손으로 적어 둔 것
       ② 금융위원회 주식시세의 종목명과 이름이 같은 것
       ③ DART에 등록된 회사 이름과 같은 것 (DART 키가 있을 때만)
     못 찾은 리츠는 지어내지 않고 '못 찾음' 목록으로 따로 알려준다
  3) 리츠마다 보유 자산(투자대상) 목록을 받는다

실행
  python scripts/fetch_reits.py          평소 실행
  python scripts/fetch_reits.py --peek   API가 돌려준 원본 1건을 그대로 보여줌(구조 확인용)

필요한 키: DATA_GO_KR_KEY (필수), DART_API_KEY (있으면 종목코드를 더 잘 찾음)
출처 명세: 공공데이터포털 15139797 (2026-11-14 확인)
"""

import argparse
import json

from _util import (
    SCRIPTS_DIR, Stop, clean_text, data_go_kr_all, fetch_all_stocks, find_latest_base_date,
    get_data_go_kr_key, get_key, has_key, load_dart_corps, load_json, norm_code, norm_name,
    peek, run, save_json, to_date, to_number, today_str, update_meta,
)

BASE_URL = "https://apis.data.go.kr/1613000/ReitsService/ReitsInfo"
LIST_URL = BASE_URL + "/getReitsCmpnyList"        # 리츠 목록 조회
ASSET_URL = BASE_URL + "/getReitsInvtTrgtList"    # 리츠별 투자대상 목록 조회 (reitsNo 필수)
SOURCE = "국토교통부 리츠정보 API (공공데이터포털 15139797)"
SOURCE_URL = "https://www.data.go.kr/data/15139797/openapi.do"

# 국토부 이름이 법인 정식 명칭일 때, 주식시장 종목명으로 바꿔 보기 위한 꼬리말
LEGAL_SUFFIXES = [
    "위탁관리부동산투자회사", "기업구조조정부동산투자회사",
    "자기관리부동산투자회사", "부동산투자회사",
]


def name_candidates(official_name):
    """국토부 이름으로 만들 수 있는 '비교용 이름' 후보들"""
    base = norm_name(official_name)
    candidates = [base]
    for suffix in LEGAL_SUFFIXES:
        if base.endswith(suffix):
            stem = base[: -len(suffix)]
            candidates += [stem + "리츠", stem]
            break
    return candidates


def load_manual_ids():
    """scripts/manual_ids.json 에 손으로 적어 둔 종목코드"""
    path = SCRIPTS_DIR / "manual_ids.json"
    if not path.exists():
        return {}
    try:
        return json.loads(path.read_text(encoding="utf-8")).get("ids") or {}
    except ValueError:
        raise Stop("scripts/manual_ids.json 의 모양이 잘못됐어요(쉼표·따옴표 확인).")


def main():
    parser = argparse.ArgumentParser(description="국토부 리츠정보 → reits.json, assets.json")
    parser.add_argument("--peek", action="store_true", help="API 원본 1건을 그대로 출력")
    args = parser.parse_args()

    key = get_data_go_kr_key()

    # ---------- 1) 리츠 목록 ----------
    print("[1/3] 국토부 리츠 목록을 받는 중...")
    rows = data_go_kr_all(LIST_URL, {"serviceKey": key}, "리츠 목록", page_size=100)
    if not rows:
        raise Stop("리츠 목록이 비어 있어요. 잠시 뒤 다시 시도해 주세요.")
    if args.peek:
        peek("리츠 목록 1건", rows[0])
    listed = [r for r in rows if clean_text(r.get("lstDe")) and not clean_text(r.get("stpageDe"))]
    print(f"      전체 {len(rows)}개 중 상장 리츠 {len(listed)}개")

    # ---------- 2) 종목코드 찾기 ----------
    print("[2/3] 종목코드를 찾는 중...")
    base_date = find_latest_base_date(key)
    stocks = fetch_all_stocks(key, base_date)
    if args.peek and stocks:
        peek("주식시세 1건", stocks[0])
    stock_by_name = {norm_name(s.get("itmsNm")): s for s in stocks}
    stock_by_code = {norm_code(s.get("srtnCd")): s for s in stocks}

    manual = load_manual_ids()
    dart_by_name = {}
    if has_key("DART_API_KEY"):
        dart_key = get_key("DART_API_KEY", "OpenDART")
        dart_by_name = {norm_name(c["corp_name"]): c["stock_code"] for c in load_dart_corps(dart_key)}
    else:
        print("      (DART 키가 없어서 'DART 회사 이름으로 찾기'는 건너뜁니다)")

    matched, unmatched = [], []
    for row in listed:
        official = clean_text(row.get("reitsNm")) or ""
        reits_no = str(row.get("reitsNo") or "").strip()
        code, method = None, None
        if manual.get(reits_no) or manual.get(official):
            code, method = norm_code(manual.get(reits_no) or manual.get(official)), "손으로 지정"
        if not code:
            for candidate in name_candidates(official):
                if candidate in stock_by_name:
                    code, method = norm_code(stock_by_name[candidate].get("srtnCd")), "종목명 일치"
                    break
        if not code and norm_name(official) in dart_by_name:
            code, method = norm_code(dart_by_name[norm_name(official)]), "DART 회사명 일치"
        if code:
            matched.append((row, code, method))
        else:
            unmatched.append(row)

    # 같은 종목코드가 두 리츠에 붙으면 잘못 찾은 것이므로 둘 다 뺀다
    counts = {}
    for _, code, _ in matched:
        counts[code] = counts.get(code, 0) + 1
    for row, code, _ in [m for m in matched if counts[m[1]] > 1]:
        print(f"      [주의] 종목코드 {code} 가 여러 리츠에 겹쳐서 제외: {row.get('reitsNm')}")
        unmatched.append(row)
    matched = [m for m in matched if counts[m[1]] == 1]

    # ---------- 3) 보유 자산 ----------
    print(f"[3/3] 상장 리츠 {len(matched)}개의 보유 자산을 받는 중...")
    old_assets = load_json("assets") or {}
    old_coords = {                       # 예전에 구해 둔 좌표는 주소가 같으면 그대로 쓴다
        (a.get("reit_id"), a.get("address")): a
        for a in old_assets.get("items", []) if a.get("lat") is not None
    }

    reit_items, asset_items = [], []
    peeked = False
    for row, code, method in sorted(matched, key=lambda m: m[1]):
        official = clean_text(row.get("reitsNm"))
        stock = stock_by_code.get(code)
        name = clean_text(stock.get("itmsNm")) if stock else official
        reits_no = str(row.get("reitsNo")).strip()

        asset_rows = data_go_kr_all(
            ASSET_URL, {"serviceKey": key, "reitsNo": reits_no}, f"투자대상({name})", page_size=100)
        if args.peek and asset_rows and not peeked:
            peek("투자대상 1건", asset_rows[0])
            peeked = True

        types = []
        for n, a in enumerate(asset_rows, start=1):
            address = clean_text(a.get("invtTrgtAddr"))
            asset_type = clean_text(a.get("invtTrgtCodeNm"))
            if asset_type and asset_type not in types:
                types.append(asset_type)
            kept = old_coords.get((code, address), {})
            asset_items.append({
                "asset_id": f"{code}-{n:02d}",
                "reit_id": code,
                "reit_name": name,
                "name": clean_text(a.get("invtTrgtNm")),              # 부동산명
                "asset_type": asset_type,                             # 대표투자대상
                "invest_type": clean_text(a.get("invtTrgtTypeNm")),   # 부동산 투자구분
                "address": address,
                "land_area_m2": to_number(a.get("landArea")),
                "floor_area_m2": to_number(a.get("floorArea")),
                "completed_date": to_date(a.get("competDe")),
                "lat": kept.get("lat"),
                "lng": kept.get("lng"),
                "geocode_matched": kept.get("geocode_matched"),
                "geocode_status": kept.get("geocode_status"),
            })

        reit_items.append({
            "id": code,
            "type": "reit",
            "name": name,                                            # 주식시장 종목명
            "name_official": official,                               # 국토부에 등록된 이름
            "reits_no": reits_no,
            "id_method": method,                                     # 종목코드를 어떻게 찾았는지
            "status": "해산 결의" if clean_text(row.get("dsrgnzDecsnDe")) else "운영중",
            "reit_type": clean_text(row.get("reitsTyNm")),
            "amc": clean_text(row.get("amcNm")),
            "approval_type": clean_text(row.get("cnfmAtCodeNm")),
            "approved_date": to_date(row.get("confmDe")),
            "listed_date": to_date(row.get("lstDe")),
            "public_offering": clean_text(row.get("pssrpCodeNm")),
            "main_asset_type": clean_text(row.get("invtTrgetCodeNm")),
            "asset_types": types,
            "asset_count": len(asset_rows),
            "total_assets_100m_won": to_number(row.get("assetsTotalAmount")),   # 자산총계(억원)
            "molit_dividend_yield": to_number(row.get("ratio")),                # 국토부 표기 배당수익률(%)
        })

    not_found = [
        {"reits_no": str(r.get("reitsNo")), "name_official": clean_text(r.get("reitsNm")),
         "listed_date": to_date(r.get("lstDe"))}
        for r in unmatched
    ]
    today = today_str()
    save_json("reits", today, SOURCE, reit_items, unmatched=not_found)
    save_json("assets", today, SOURCE, asset_items)
    note = "기준일은 조회한 날짜. 상장 리츠만 수록(상장일 있음·상장폐지일 없음)."
    if not_found:
        note += f" 종목코드를 못 찾은 상장 리츠 {len(not_found)}개는 제외."
    update_meta("reits", SOURCE, SOURCE_URL, today, len(reit_items), note)
    update_meta("assets", SOURCE, SOURCE_URL, today, len(asset_items),
                "기준일은 조회한 날짜. 좌표(lat/lng)는 geocode_assets.py 가 채움.")

    # ---------- 요약 ----------
    print("\n[성공] data/reits.json, data/assets.json 저장")
    print(f"  상장 리츠 {len(reit_items)}개 / 보유 자산 {len(asset_items)}개")
    print("  종목코드를 찾은 방법:")
    for item in reit_items:
        print(f"    {item['id']}  {item['name']}  ← {item['name_official']}  ({item['id_method']}, 자산 {item['asset_count']}개)")
    if not_found:
        print(f"\n  [확인 필요] 종목코드를 못 찾은 상장 리츠 {len(not_found)}개 (reits.json 의 unmatched 에 기록):")
        for r in not_found:
            print(f"    리츠번호 {r['reits_no']}  {r['name_official']}  (상장일 {r['listed_date']})")
        print("    → scripts/manual_ids.json 의 ids 에  \"리츠번호\": \"종목코드\"  를 적고 다시 실행하면 들어갑니다.")
    no_address = sum(1 for a in asset_items if not a["address"])
    no_asset = [r["name"] for r in reit_items if r["asset_count"] == 0]
    print(f"  빠진 값: 주소 없는 자산 {no_address}개, 자산이 0개인 리츠 {len(no_asset)}개 {no_asset if no_asset else ''}")


if __name__ == "__main__":
    run(main)
