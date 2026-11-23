# -*- coding: utf-8 -*-
"""
scripts/fetch_dividends.py — OpenDART "배당에 관한 사항" → data/dividends.json

하는 일
  1) DART 고유번호 목록에서 종목코드 → corp_code(회사 고유번호)를 찾는다
  2) 리츠마다 최근 3개 사업연도의 사업보고서에서 '주당 현금배당금(보통주)'을 모은다
  3) 최근 1년치 주당배당금 합계(dps_annual)를 구한다
       - 리츠는 결산을 1년에 1번·2번·4번 하는 곳이 섞여 있다
       - 결산 주기는 ① 보고서들의 결산기준일 간격 ② metrics.json 의 '연환산배당률 ÷ 배당수익률'
         두 가지로 판단하고, 최근 1년에 해당하는 결산기 값이 다 있을 때만 합계를 낸다
       - 하나라도 없으면 지어내지 않고 null 로 두고 이유(dps_basis)를 적는다

  4) 지금 data/dividends.json 에 합친다 (2026-11-23부터)
       - DART 로 합계를 구한 국내 리츠만 DART 값으로 바꾸고 "source": "OpenDART" 를 붙인다
       - DART 로 못 구한 국내 리츠, 리츠 ETF, 해외 리츠는 지금 값을 그대로 둔다
     GitHub Actions(.github/workflows/update-dividends.yml)가 일주일에 한 번 실행한다. (Secret: DART_API_KEY)

  "주가 기준 배당수익률"은 여기서 저장하지 않는다.
  화면(common.js)에서  dps_annual ÷ 현재가(없으면 전일 종가)  로 계산한다.

실행
  python scripts/fetch_dividends.py          평소 실행
  python scripts/fetch_dividends.py --peek   DART 원본 응답(첫 리츠)을 그대로 보여줌(구조 확인용)

필요한 키: DART_API_KEY
먼저 필요한 파일: data/reits.json (필수), data/metrics.json (있으면 결산 주기를 교차 확인)
출처 명세: OpenDART 개발가이드 DS001-2019018, DS002-2019005 (2026-11-14 확인)
"""

import argparse

from _util import (
    Stop, dart_error, get_key, http_get, load_dart_corps, load_json, now_kst, peek, run,
    save_json, to_date, to_number, today_str, update_meta,
)

ALOT_URL = "https://opendart.fss.or.kr/api/alotMatter.json"
REPORT_ANNUAL = "11011"          # 사업보고서
SOURCE = "금융감독원 전자공시시스템 OpenDART (배당에 관한 사항)"
SOURCE_URL = "https://opendart.fss.or.kr/guide/detail.do?apiGrpCd=DS002&apiId=2019005"
MIXED_SOURCE = "OpenDART(국내 리츠) · 야후 파이낸스(리츠 ETF·해외 리츠 등, 비공식)"


def fetch_alot(key, corp_code, year, label):
    """한 회사·한 사업연도의 '배당에 관한 사항' 행 목록"""
    query = {"crtfc_key": key, "corp_code": corp_code, "bsns_year": str(year), "reprt_code": REPORT_ANNUAL}
    res = http_get(ALOT_URL, query, label)
    try:
        data = res.json()
    except ValueError:
        raise Stop(f"{label}: DART 응답을 읽지 못했어요 (HTTP {res.status_code}).")
    status = str(data.get("status", "")).strip()
    if status == "013":              # 조회된 데이터 없음
        return []
    if status != "000":
        raise Stop(dart_error(status, data.get("message"), label))
    return data.get("list") or []


def shift_month(ym, months):
    """'2026-09' 에서 months 개월 이동한 'YYYY-MM'"""
    year, month = (int(x) for x in ym.split("-"))
    index = year * 12 + (month - 1) + months
    return f"{index // 12:04d}-{index % 12 + 1:02d}"


def month_gap(a, b):
    """두 'YYYY-MM' 사이의 개월 수"""
    ya, ma = (int(x) for x in a.split("-"))
    yb, mb = (int(x) for x in b.split("-"))
    return abs((ya * 12 + ma) - (yb * 12 + mb))


def collect_reports(rows):
    """행 목록에서 '주당 현금배당금(보통주)' 만 골라 보고서(접수번호)별로 정리"""
    reports = {}
    for row in rows:
        label = (row.get("se") or "").replace(" ", "")
        kind = (row.get("stock_knd") or "").replace(" ", "")
        if "주당현금배당금" not in label:
            continue
        if kind and "보통" not in kind:      # 우선주 등은 제외
            continue
        end = to_date(row.get("stlm_dt"))
        receipt = str(row.get("rcept_no") or "")
        if not end or not receipt:
            continue
        reports[receipt] = {
            "rcept_no": receipt,
            "period_end": end[:7],                      # 결산기 끝 'YYYY-MM'
            "thstrm": to_number(row.get("thstrm")),     # 당기
            "frmtrm": to_number(row.get("frmtrm")),     # 전기
            "lwfr": to_number(row.get("lwfr")),         # 전전기
        }
    return list(reports.values())


def summarize(reports, hint_per_year):
    """보고서들로 결산기별 주당배당금과 최근 1년 합계를 만든다"""
    result = {"dps_annual": None, "dps_basis": None, "period_months": None,
              "latest_period_end": None, "periods": []}
    if not reports:
        result["dps_basis"] = "DART에 최근 3개 사업연도의 배당 정보가 없음"
        return result

    # 결산기별 값: 각 보고서의 '당기'. 같은 결산기에 보고서가 여러 개면 나중 접수분(정정)이 우선
    by_end = {}
    for rep in sorted(reports, key=lambda r: r["rcept_no"]):
        by_end[rep["period_end"]] = {"dps": rep["thstrm"], "from": "당기", "rcept_no": rep["rcept_no"]}
    ends = sorted(by_end)
    latest = max(reports, key=lambda r: (r["period_end"], r["rcept_no"]))
    result["latest_period_end"] = latest["period_end"]

    # 결산 주기(개월) 판단
    reasons, candidates = [], []
    if len(ends) >= 2:
        gap = min(month_gap(a, b) for a, b in zip(ends, ends[1:]))
        if gap in (3, 6, 12):
            candidates.append(gap)
            reasons.append(f"결산기준일 간격 {gap}개월")
    if hint_per_year in (1, 2, 4):
        candidates.append(12 // hint_per_year)
        reasons.append(f"리츠정보시스템 연환산배당률÷배당수익률 = 연 {hint_per_year}회")
    if not candidates:
        result["dps_basis"] = "결산 주기를 판단할 자료가 부족함(보고서 1건뿐이고 metrics.json 에도 없음)"
        result["periods"] = [{"period_end": e, "dps": v["dps"], "from": v["from"], "rcept_no": v["rcept_no"]}
                             for e, v in sorted(by_end.items(), reverse=True)]
        return result
    period = min(candidates)
    result["period_months"] = period

    # 보고서에 같이 적힌 전기·전전기 값으로 빈 결산기를 채운다 ('당기' 값이 있으면 그것이 우선)
    for rep in sorted(reports, key=lambda r: (r["period_end"], r["rcept_no"])):
        for name, field, back in (("전기", "frmtrm", 1), ("전전기", "lwfr", 2)):
            end = shift_month(rep["period_end"], -period * back)
            if end not in by_end or by_end[end]["from"] != "당기":
                by_end[end] = {"dps": rep[field], "from": f"{rep['period_end']} 보고서의 {name}",
                               "rcept_no": rep["rcept_no"]}

    result["periods"] = [{"period_end": e, "dps": v["dps"], "from": v["from"], "rcept_no": v["rcept_no"]}
                         for e, v in sorted(by_end.items(), reverse=True)]

    # 최근 1년에 해당하는 결산기들의 합계
    count = 12 // period
    needed = [shift_month(latest["period_end"], -period * i) for i in range(count)]
    values = [by_end.get(e, {}).get("dps") for e in needed]
    how = " / ".join(reasons)
    if all(v is not None for v in values):
        result["dps_annual"] = sum(values)
        result["dps_basis"] = f"결산 {period}개월 주기({how}). {', '.join(needed)} 결산기 주당 현금배당금 합계"
    else:
        lacking = [e for e, v in zip(needed, values) if v is None]
        result["dps_basis"] = (f"결산 {period}개월 주기({how})로 보이지만 {', '.join(lacking)} "
                               "결산기 값이 없거나 '-'로 적혀 있어 합계를 내지 않음")
    return result


def main():
    parser = argparse.ArgumentParser(description="OpenDART 배당 → dividends.json")
    parser.add_argument("--peek", action="store_true", help="DART 원본 응답(첫 리츠)을 그대로 출력")
    args = parser.parse_args()

    reits = load_json("reits")
    if not reits or not reits.get("items"):
        raise Stop("data/reits.json 이 없거나 비어 있어요. 먼저  python scripts/fetch_reits.py  를 실행해 주세요.")
    reits["items"] = [r for r in reits["items"] if r.get("type", "reit") == "reit"]   # DART 에는 국내 리츠만 있다
    key = get_key("DART_API_KEY", "OpenDART opendart.fss.or.kr")

    print("[1/2] DART 고유번호 목록을 받는 중...")
    corp_by_stock = {c["stock_code"]: c for c in load_dart_corps(key)}

    metrics = load_json("metrics") or {}
    hint_by_id = {m.get("id"): m.get("periods_per_year") for m in metrics.get("items", []) if m.get("id")}
    if not hint_by_id:
        print("      (metrics.json 이 없어서 결산 주기를 교차 확인하지 못합니다. 엑셀 변환 뒤 다시 실행하면 더 정확해요)")

    this_year = now_kst().year
    years = [this_year, this_year - 1, this_year - 2]
    print(f"[2/2] 리츠 {len(reits['items'])}개의 배당 정보를 받는 중... (사업연도 {years[-1]}~{years[0]})")

    items, no_corp = [], []
    peeked = False
    for reit in reits["items"]:
        corp = corp_by_stock.get(reit["id"])
        if not corp:
            no_corp.append(reit["name"])
            items.append({"id": reit["id"], "name": reit["name"], "corp_code": None, "dps_annual": None,
                          "dps_basis": "DART 고유번호 목록에서 이 종목코드를 찾지 못함",
                          "period_months": None, "latest_period_end": None, "periods": []})
            continue
        rows = []
        for year in years:
            rows.extend(fetch_alot(key, corp["corp_code"], year, f"DART 배당({reit['name']})"))
        if args.peek and rows and not peeked:
            peek(f"배당에 관한 사항 - {reit['name']} (앞 6행)", rows[:6])
            peeked = True
        summary = summarize(collect_reports(rows), hint_by_id.get(reit["id"]))
        items.append(dict({"id": reit["id"], "name": reit["name"], "corp_code": corp["corp_code"]}, **summary))

    today = today_str()
    # 지금 dividends.json 에 합친다:
    #   - DART 로 최근 1년 합계를 구한 국내 리츠만 DART 값으로 바꾼다
    #   - DART 로 못 구한 국내 리츠는 지금 값(야후)을 그대로 둔다 (값을 지우거나 지어내지 않음)
    #   - 리츠 ETF·해외 리츠는 DART 에 없으니 그대로 둔다
    current = load_json("dividends") or {}
    merged = {i.get("id"): i for i in current.get("items", [])}
    order = [i.get("id") for i in current.get("items", [])]
    replaced, kept = [], []
    for item in items:
        if item["dps_annual"] is not None:
            merged[item["id"]] = dict(item, source="OpenDART")
            replaced.append(item["name"])
        elif item["id"] in merged:
            kept.append(item["name"])
        else:
            merged[item["id"]] = item
        if item["id"] not in order:
            order.append(item["id"])
    merged_items = [merged[i] for i in order if i in merged]
    source = SOURCE if not merged_items or all(i.get("source") == "OpenDART" for i in merged_items) else MIXED_SOURCE
    save_json("dividends", today, source, merged_items)
    update_meta("dividends", source, SOURCE_URL, today, len(merged_items),
                "기준일은 조회한 날짜. 국내 리츠는 OpenDART 사업보고서의 최근 1년 결산기 주당 현금배당금(보통주) 합계. "
                "DART 로 못 구한 국내 리츠와 리츠 ETF·해외 리츠는 직전 값(야후 파이낸스, 비공식)을 그대로 둠. "
                "과거 지급 실적이며 앞으로의 배당을 뜻하지 않음.")
    print(f"\n  DART 값으로 바꾼 리츠 {len(replaced)}개 / DART 로 못 구해 직전 값을 둔 리츠 {len(kept)}개 {kept if kept else ''}")

    # ---------- 요약 ----------
    prices = {p["id"]: p for p in (load_json("prices") or {}).get("items", [])}
    done = [i for i in items if i["dps_annual"] is not None]
    print("\n[성공] data/dividends.json 저장")
    print(f"  리츠 {len(items)}개 중 최근 1년 주당배당금을 구한 곳 {len(done)}개, 못 구한 곳 {len(items) - len(done)}개")
    for i in items:
        close = (prices.get(i["id"]) or {}).get("close")
        if i["dps_annual"] is not None and close:
            preview = f"주가 기준 {i['dps_annual'] / close * 100:.2f}% (종가 {close}원 기준, 참고용 미리보기)"
        else:
            preview = "-"
        print(f"    {i['id']}  {i['name']}: {i['dps_annual']}원  [{preview}]")
        print(f"        {i['dps_basis']}")
    if no_corp:
        print(f"  빠진 값: DART에서 못 찾은 리츠 {len(no_corp)}개 {no_corp}")


if __name__ == "__main__":
    run(main)
