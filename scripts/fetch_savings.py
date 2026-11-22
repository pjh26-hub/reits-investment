# -*- coding: utf-8 -*-
"""
scripts/fetch_savings.py — 금융감독원 금융상품한눈에 Open API → data/savings.json

하는 일
  은행권(권역코드 020000)의 적금과 정기예금 상품·금리를 전부 받아서
  "상품 × 가입기간(옵션)" 한 줄씩으로 저장한다. 리츠와 비교할 때 쓴다.

실행
  python scripts/fetch_savings.py          평소 실행
  python scripts/fetch_savings.py --peek   API 원본 1건을 그대로 보여줌(구조 확인용)

필요한 키: FINLIFE_API_KEY  (finlife.fss.or.kr 에서 따로 발급. 공공데이터포털 키와 다름)
출처 명세: 금융상품한눈에 오픈API 정기예금·적금 API 명세 (2026-11-14 확인)
"""

import argparse

from _util import Stop, clean_text, get_key, http_get, mask, peek, run, save_json, to_number, update_meta

API_HOST = "finlife.fss.or.kr/finlifeapi"
BANK_GROUP = "020000"            # 권역코드: 은행
SERVICES = [                     # (우리 이름, API 서비스명, 한글 이름)
    ("saving", "savingProductsSearch", "적금"),
    ("deposit", "depositProductsSearch", "정기예금"),
]
SOURCE = "금융감독원 금융상품한눈에 Open API (은행권 정기예금·적금)"
SOURCE_URL = "https://finlife.fss.or.kr"

FINLIFE_ERRORS = {
    "010": "등록되지 않은 인증키예요. FINLIFE_API_KEY 값을 다시 확인해 주세요.",
    "011": "중지된 인증키예요.",
    "012": "삭제된 인증키예요. 키를 다시 발급받아 주세요.",
    "013": "샘플 인증키예요. 본인 키를 발급받아 넣어 주세요.",
    "020": "하루 검색 허용 횟수를 넘었어요. 내일 다시 시도해 주세요.",
    "021": "허용된 IP가 아니라고 나와요(인증키 신청 때와 다른 IP).",
    "100": "요청 값이 빠졌어요(스크립트 문제일 수 있으니 알려 주세요).",
    "101": "요청 값이 잘못됐어요(스크립트 문제일 수 있으니 알려 주세요).",
    "900": "금융상품한눈에 쪽에서 정의되지 않은 오류가 났어요.",
}


def fetch_service(key, service, label, want_peek):
    """한 서비스(적금 또는 예금)의 모든 페이지를 받아 (상품 목록, 옵션 목록)을 돌려준다"""
    products, options = [], []
    page = 1
    while True:
        res = None
        for scheme in ("https", "http"):          # 문서의 주소는 http. https 가 되면 그쪽을 먼저 쓴다
            url = f"{scheme}://{API_HOST}/{service}.json"
            try:
                res = http_get(url, {"auth": key, "topFinGrpNo": BANK_GROUP, "pageNo": page}, label, tries=2)
                break
            except Stop:
                if scheme == "http":
                    raise
        try:
            data = res.json()
        except ValueError:
            raise Stop(f"{label}: 응답을 읽지 못했어요 (HTTP {res.status_code}, 앞부분: {mask(res.text[:120])})")
        result = data.get("result", data)
        code = str(result.get("err_cd", "")).strip()
        if code != "000":
            why = FINLIFE_ERRORS.get(code, "예상하지 못한 응답이 왔어요.")
            raise Stop(f"{label}: {why} (코드 {code}: {result.get('err_msg')})")
        if "baseList" not in result or "optionList" not in result:
            raise Stop(f"{label}: 응답 모양이 문서와 달라요. 들어 있는 항목: {sorted(result.keys())}\n"
                       "  → --peek 옵션으로 원본을 확인해야 합니다.")
        if want_peek and page == 1:
            peek(f"{label} 상품 1건(baseList)", (result["baseList"] or [None])[0])
            peek(f"{label} 옵션 1건(optionList)", (result["optionList"] or [None])[0])
        products.extend(result["baseList"] or [])
        options.extend(result["optionList"] or [])
        last_page = int(to_number(result.get("max_page_no")) or 1)
        if page >= last_page:
            break
        page += 1
    return products, options


def main():
    parser = argparse.ArgumentParser(description="금융상품한눈에 → savings.json")
    parser.add_argument("--peek", action="store_true", help="API 원본 1건을 그대로 출력")
    args = parser.parse_args()

    key = get_key("FINLIFE_API_KEY", "금융상품한눈에 finlife.fss.or.kr")

    items, months = [], []
    for step, (kind, service, label) in enumerate(SERVICES, start=1):
        print(f"[{step}/{len(SERVICES)}] 은행 {label} 금리를 받는 중...")
        products, options = fetch_service(key, service, label, args.peek)
        product_by_key = {(p.get("fin_co_no"), p.get("fin_prdt_cd")): p for p in products}
        for opt in options:
            base = product_by_key.get((opt.get("fin_co_no"), opt.get("fin_prdt_cd")))
            if not base:
                continue
            month = clean_text(base.get("dcls_month"))           # 공시 제출월 YYYYMM
            if month and len(month) == 6:
                month = f"{month[:4]}-{month[4:]}"
                months.append(month)
            items.append({
                "kind": kind,                                            # saving=적금, deposit=정기예금
                "bank": clean_text(base.get("kor_co_nm")),
                "product": clean_text(base.get("fin_prdt_nm")),
                "product_code": clean_text(base.get("fin_prdt_cd")),
                "term_months": to_number(opt.get("save_trm")),           # 저축 기간(개월)
                "rate_base": to_number(opt.get("intr_rate")),            # 기본 금리(%)
                "rate_max": to_number(opt.get("intr_rate2")),            # 최고 우대금리(%)
                "rate_type": clean_text(opt.get("intr_rate_type_nm")),   # 단리/복리
                "reserve_type": clean_text(opt.get("rsrv_type_nm")),     # 적립 유형(적금만)
                "join_deny": to_number(base.get("join_deny")),           # 가입제한 1:제한없음 2:서민전용 3:일부제한
                "join_way": clean_text(base.get("join_way")),
                "join_member": clean_text(base.get("join_member")),
                "special_condition": clean_text(base.get("spcl_cnd")),   # 우대조건
                "max_limit": to_number(base.get("max_limit")),           # 최고한도
                "disclosure_month": month,
            })

    if not items:
        raise Stop("받은 상품이 하나도 없어요. 잠시 뒤 다시 시도해 주세요.")
    as_of = max(months) if months else None
    save_json("savings", as_of, SOURCE, items)
    update_meta("savings", SOURCE, SOURCE_URL, as_of, len(items),
                "기준일은 금융회사 공시 제출월. 은행권(권역코드 020000)만. 금리는 세전, 최고 우대금리는 우대조건을 모두 채웠을 때.")

    # ---------- 요약 ----------
    savings = [i for i in items if i["kind"] == "saving"]
    deposits = [i for i in items if i["kind"] == "deposit"]
    print("\n[성공] data/savings.json 저장")
    print(f"  공시 제출월 {as_of} / 적금 {len(savings)}줄 / 정기예금 {len(deposits)}줄 (상품×기간)")
    no_rate = sum(1 for i in items if i["rate_max"] is None)
    print(f"  빠진 값: 최고 우대금리가 없는 줄 {no_rate}개")
    top = sorted(
        [i for i in savings if i["term_months"] == 12 and i["join_deny"] == 1 and i["rate_max"] is not None],
        key=lambda i: i["rate_max"], reverse=True)[:5]
    print("  참고) 12개월 적금·가입제한 없음 중 최고 우대금리 상위 5개:")
    for i in top:
        print(f"    {i['rate_max']}%  {i['bank']} {i['product']}  (기본 {i['rate_base']}%, {i['reserve_type']}, {i['rate_type']})")


if __name__ == "__main__":
    run(main)
