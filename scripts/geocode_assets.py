# -*- coding: utf-8 -*-
"""
scripts/geocode_assets.py — 자산 주소 → 지도 좌표 → data/assets.json 의 lat, lng

좌표 출처: 행정안전부 주소기반산업지원서비스 (business.juso.go.kr)
  ① 도로명주소 검색 API   주소 글자 → 건물을 가리키는 코드 5개
  ② 좌표제공 검색 API     코드 5개 → 그 건물 출입구 좌표 (entX, entY)
  두 API는 승인키가 서로 다릅니다. 각각 신청해서 .env 에 넣습니다.

왜 브이월드가 아닌가
  브이월드 지오코더 안내에는 "별도의 저장장치나 데이터베이스에 저장할 수 없습니다"라는 문구가 있습니다.
  우리는 좌표를 assets.json 에 저장해야 해서, 그런 문구가 없는 행정안전부 API로 정했습니다(2026-11-14 팀 결정).
  단, 행정안전부 쪽에서 "저장해도 된다"는 명시 문구를 확인한 것은 아닙니다. → README.md '좌표 출처 조사' 참고

좌표계 (2026-11-14 실제 응답으로 확인)
  entX, entY 는 UTM-K(EPSG:5179, GRS80) 좌표입니다. 지도(카카오)는 위도·경도를 쓰므로 여기서 계산해서 바꿉니다.

틀린 좌표를 넣지 않기 위한 규칙
  - 검색된 주소가 우리 주소와 맞는지(도로명+건물번호 또는 동+지번) 확인하고, 맞는 것만 씁니다.
  - 맞는 것이 없고 검색 결과가 여러 개면 '확정하지 못함'으로 두고 좌표를 넣지 않습니다.
  - 어떤 주소로 맞췄는지 geocode_matched 에 남겨서 사람이 확인할 수 있게 합니다.
  - 해외 자산처럼 못 찾는 주소는 지어내지 않고 lat/lng 를 null 로 둡니다.

실행
  python scripts/geocode_assets.py          좌표가 없는 자산만 변환
  python scripts/geocode_assets.py --all    전부 다시 변환
  python scripts/geocode_assets.py --peek   API 원본 1건을 그대로 보여줌(구조 확인용)

필요한 키: JUSO_SEARCH_KEY (도로명주소 검색 API), JUSO_COORD_KEY (좌표제공 검색 API)
먼저 필요한 파일: data/assets.json (fetch_reits.py 가 만든다)
출처 명세: 주소기반산업지원서비스 '주소정보 API 연계' 상세 페이지 (2026-11-14 확인)
"""

import argparse
import math
import re
import time

from _util import Stop, get_key, http_get, load_json, mask, peek, run, save_json, today_str, update_meta

SEARCH_URL = "https://business.juso.go.kr/addrlink/addrLinkApi.do"     # 도로명주소 검색 API
COORD_URL = "https://business.juso.go.kr/addrlink/addrCoordApi.do"     # 좌표제공 검색 API
TEST_KEY = "TESTJUSOGOKR"      # 공식 예제에 적힌 시험용 키. 실제 주소가 아니라 견본 결과만 돌려준다
SOURCE_NOTE = ("좌표는 행정안전부 도로명주소 검색 API + 좌표제공 검색 API의 건물 출입구 좌표(UTM-K)를 "
               "위도·경도로 계산해 바꾼 값. 변환 실패는 null.")

FATAL_ERRORS = {
    "E0001": "승인되지 않은 키예요. 검색 API 키와 좌표제공 API 키는 서로 다릅니다. .env 에 맞게 넣었는지 확인해 주세요.",
    "E0014": "개발 승인키의 기간이 끝났어요. 주소기반산업지원서비스에서 키를 다시 발급받아 주세요.",
    "-999": "주소 서비스 쪽 시스템 오류예요. 잠시 뒤 다시 시도해 주세요.",
}


# ---------------------------------------------------------------------------
# 좌표계 변환: UTM-K(EPSG:5179) → 위도·경도
# ---------------------------------------------------------------------------
_A = 6378137.0                       # GRS80 타원체 긴반지름(m)
_F = 1 / 298.257222101               # GRS80 편평률
_K0 = 0.9996                         # 축척계수
_LAT0 = math.radians(38.0)           # 원점 위도
_LON0 = math.radians(127.5)          # 원점 경도
_X0, _Y0 = 1000000.0, 2000000.0      # 원점에 더해 둔 값(가산값)
_N = _F / (2 - _F)
_RADIUS = _A / (1 + _N) * (1 + _N ** 2 / 4 + _N ** 4 / 64)
_ALPHA = (_N / 2 - 2 * _N ** 2 / 3 + 5 * _N ** 3 / 16, 13 * _N ** 2 / 48 - 3 * _N ** 3 / 5, 61 * _N ** 3 / 240)
_BETA = (_N / 2 - 2 * _N ** 2 / 3 + 37 * _N ** 3 / 96, _N ** 2 / 48 + _N ** 3 / 15, 17 * _N ** 3 / 480)
_DELTA = (2 * _N - 2 * _N ** 2 / 3 - 2 * _N ** 3, 7 * _N ** 2 / 3 - 8 * _N ** 3 / 5, 56 * _N ** 3 / 15)


def _xi_on_meridian(lat):
    """중앙 자오선 위에서 위도 lat 까지의 거리(비율값). 원점 위도 보정에 쓴다"""
    e = 2 * math.sqrt(_N) / (1 + _N)
    t = math.sinh(math.atanh(math.sin(lat)) - e * math.atanh(e * math.sin(lat)))
    xi = math.atan(t)
    return xi + sum(a * math.sin(2 * (j + 1) * xi) for j, a in enumerate(_ALPHA))


_XI0 = _xi_on_meridian(_LAT0)


def utmk_to_wgs84(x, y):
    """UTM-K 좌표(x=동쪽, y=북쪽, 단위 m)를 (위도, 경도)로 바꾼다"""
    xi = (y - _Y0) / (_K0 * _RADIUS) + _XI0
    eta = (x - _X0) / (_K0 * _RADIUS)
    xi_p = xi - sum(b * math.sin(2 * (j + 1) * xi) * math.cosh(2 * (j + 1) * eta) for j, b in enumerate(_BETA))
    eta_p = eta - sum(b * math.cos(2 * (j + 1) * xi) * math.sinh(2 * (j + 1) * eta) for j, b in enumerate(_BETA))
    chi = math.asin(math.sin(xi_p) / math.cosh(eta_p))
    lat = chi + sum(d * math.sin(2 * (j + 1) * chi) for j, d in enumerate(_DELTA))
    lon = _LON0 + math.atan2(math.sinh(eta_p), math.cos(xi_p))
    return math.degrees(lat), math.degrees(lon)


# ---------------------------------------------------------------------------
# 주소 다듬기와 맞는지 확인
# ---------------------------------------------------------------------------
def clean_keyword(address):
    """검색어로 쓸 수 있게 주소를 다듬는다 (괄호 설명·특수문자 제거, 80자 이하)"""
    text = re.sub(r"\(.*?\)", " ", str(address))
    text = re.sub(r"외\s*\d+\s*(필지|개).*$", "", text)
    text = text.split(",")[0]                       # ", 3층" 같은 상세주소는 뗀다
    text = re.sub(r"[%=><\[\]]", " ", text)         # API가 받지 않는 특수문자
    return re.sub(r"\s+", " ", text).strip()[:80]


def squash(text):
    """비교용: 공백을 모두 지운 글자"""
    return re.sub(r"\s+", "", str(text or ""))


def _number_pattern(main, sub):
    """'136' 또는 '136-2' 를 찾는 정규식. 136 이 1360 이나 136-5 에 잘못 맞지 않게 한다"""
    if sub and str(sub) != "0":
        return rf"{main}-{sub}(?!\d)"
    return rf"{main}(?![\d-])"


def is_same_place(candidate, address):
    """검색 결과(candidate)가 우리 주소(address)와 같은 곳인지: 도로명+건물번호 또는 동+지번으로 확인"""
    target = squash(re.sub(r"\(.*?\)", " ", str(address)))
    district = squash(candidate.get("sggNm"))
    if district and district not in target:
        return False
    road = squash(candidate.get("rn"))
    if road and candidate.get("buldMnnm"):
        pattern = re.escape(road) + _number_pattern(candidate.get("buldMnnm"), candidate.get("buldSlno"))
        if re.search(pattern, target):
            return True
    town = squash((candidate.get("liNm") or "") or candidate.get("emdNm"))
    if town and candidate.get("lnbrMnnm"):
        pattern = (re.escape(town) + ("산?" if str(candidate.get("mtYn")) == "1" else "")
                   + _number_pattern(candidate.get("lnbrMnnm"), candidate.get("lnbrSlno")))
        if re.search(pattern, target):
            return True
    return False


# ---------------------------------------------------------------------------
# API 호출
# ---------------------------------------------------------------------------
def juso_call(url, params, label):
    """주소 API를 한 번 부르고 (오류코드, 오류메시지, 결과 목록)을 돌려준다"""
    for attempt in range(4):
        res = http_get(url, params, label)
        try:
            results = res.json()["results"]
        except (ValueError, KeyError, TypeError):
            raise Stop(f"{label}: 응답을 읽지 못했어요 (HTTP {res.status_code}, 앞부분: {mask(res.text[:120])})")
        common = results.get("common") or {}
        code = str(common.get("errorCode", "")).strip()
        if code == "E0007":              # 짧은 시간에 너무 많이 불렀을 때: 잠깐 쉬었다 다시
            time.sleep(3 * (attempt + 1))
            continue
        if code in FATAL_ERRORS:
            raise Stop(f"{label}: {FATAL_ERRORS[code]} (코드 {code}: {common.get('errorMessage')})")
        return code, common.get("errorMessage"), results.get("juso") or []
    raise Stop(f"{label}: 요청이 너무 잦다고 계속 거절돼요. 몇 분 뒤 다시 실행해 주세요.")


def geocode(search_key, coord_key, address, want_peek=False):
    """주소 하나를 좌표로. 결과: (위도, 경도, 맞춘 주소, 상태 글자)"""
    keyword = clean_keyword(address)
    if len(keyword) < 2:
        return None, None, None, "주소가 너무 짧아 검색하지 못함"
    query = {"confmKey": search_key, "currentPage": 1, "countPerPage": 10, "keyword": keyword, "resultType": "json"}
    code, message, found = juso_call(SEARCH_URL, query, "도로명주소 검색")
    if want_peek and found:
        peek("도로명주소 검색 1건", found[0])
    if code != "0":
        return None, None, None, f"주소 검색 실패({message})"
    if not found:
        return None, None, None, "주소 검색 결과 없음"

    same = [c for c in found if is_same_place(c, address)]
    if same:
        chosen = same[0]
    elif len(found) == 1:
        chosen = found[0]                # 한 곳만 검색됐으면 그곳으로 보되, geocode_matched 로 확인할 수 있게 남긴다
    else:
        return None, None, None, "검색된 주소가 여러 개라 확정하지 못함"

    query = {"confmKey": coord_key, "admCd": chosen.get("admCd"), "rnMgtSn": chosen.get("rnMgtSn"),
             "udrtYn": chosen.get("udrtYn"), "buldMnnm": chosen.get("buldMnnm"),
             "buldSlno": chosen.get("buldSlno"), "resultType": "json"}
    code, message, coords = juso_call(COORD_URL, query, "좌표제공 검색")
    if want_peek and coords:
        peek("좌표제공 검색 1건", coords[0])
    matched = chosen.get("roadAddrPart1") or chosen.get("roadAddr")
    if code != "0" or not coords:
        return None, None, matched, "주소는 찾았지만 좌표가 제공되지 않음"
    try:
        x, y = float(coords[0].get("entX")), float(coords[0].get("entY"))
    except (TypeError, ValueError):
        return None, None, matched, "주소는 찾았지만 좌표가 제공되지 않음"
    lat, lng = utmk_to_wgs84(x, y)
    if not (33 <= lat <= 39 and 124 <= lng <= 132):      # 한국 범위를 벗어나면 쓰지 않는다
        return None, None, matched, "좌표가 한국 범위를 벗어남"
    return round(lat, 6), round(lng, 6), matched, "변환 성공"


def main():
    parser = argparse.ArgumentParser(description="자산 주소 → 좌표 (행정안전부 주소 API)")
    parser.add_argument("--all", action="store_true", help="이미 좌표가 있는 자산도 다시 변환")
    parser.add_argument("--peek", action="store_true", help="API 원본 1건을 그대로 출력")
    args = parser.parse_args()

    data = load_json("assets")
    if not data or not data.get("items"):
        raise Stop("data/assets.json 이 없거나 비어 있어요. 먼저  python scripts/fetch_reits.py  를 실행해 주세요.")
    site = "주소기반산업지원서비스 business.juso.go.kr"
    search_key = get_key("JUSO_SEARCH_KEY", f"{site} 의 '도로명주소 검색 API'")
    coord_key = get_key("JUSO_COORD_KEY", f"{site} 의 '좌표제공 검색 API'")
    if TEST_KEY in (search_key, coord_key):
        raise Stop("시험용 키(TESTJUSOGOKR)로는 실제 주소가 검색되지 않고 견본 결과만 나와요. 발급받은 승인키를 넣어 주세요.")

    items = data["items"]
    targets = [a for a in items if args.all or a.get("lat") is None]
    print(f"[1/1] 자산 {len(items)}개 중 {len(targets)}개의 주소를 좌표로 바꾸는 중...")
    peeked = False
    for n, asset in enumerate(targets, start=1):
        address = asset.get("address")
        if not address:
            asset.update(lat=None, lng=None, geocode_matched=None, geocode_status="주소 없음")
            continue
        lat, lng, matched, status = geocode(search_key, coord_key, address, args.peek and not peeked)
        peeked = True
        asset.update(lat=lat, lng=lng, geocode_matched=matched, geocode_status=status)
        time.sleep(0.15)                 # 너무 빨리 연달아 부르지 않게
        if n % 20 == 0:
            print(f"      {n}/{len(targets)}...")

    extra = {k: v for k, v in data.items() if k not in ("as_of", "source", "items")}
    save_json("assets", data.get("as_of") or today_str(), data.get("source"), items, **extra)
    done = sum(1 for a in items if a.get("lat") is not None)
    update_meta("assets", f"{data.get('source')} + 행정안전부 주소 API(좌표)",
                "https://www.data.go.kr/data/15139797/openapi.do",
                data.get("as_of") or today_str(), len(items),
                f"{SOURCE_NOTE} 좌표 있음 {done}개 / 없음 {len(items) - done}개.")

    # ---------- 요약 ----------
    print("\n[성공] data/assets.json 에 좌표 저장")
    print(f"  좌표 있음 {done}개 / 없음 {len(items) - done}개")
    loose = [a for a in items if a.get("lat") is not None and a.get("geocode_matched")
             and not is_same_place_text(a.get("geocode_matched"), a.get("address"))]
    if loose:
        print("  [확인 필요] 좌표는 넣었지만, 맞춘 주소가 원래 주소와 글자로는 달라 보이는 자산:")
        for a in loose[:30]:
            print(f"    {a['reit_name']} | {a['name']} | 원래: {a['address']} → 맞춘 주소: {a['geocode_matched']}")
    failed = [a for a in items if a.get("lat") is None]
    if failed:
        print("  좌표를 못 구한 자산(지도에 찍지 않습니다):")
        for a in failed[:40]:
            print(f"    {a['reit_name']} | {a['name']} | {a['address']} | {a.get('geocode_status')}")
        if len(failed) > 40:
            print(f"    ... 외 {len(failed) - 40}개")


def is_same_place_text(matched, address):
    """맞춘 도로명주소의 '도로명+번호' 부분이 원래 주소 글자에 그대로 들어 있는지"""
    tail = " ".join(str(matched or "").split()[-2:])       # 예: '세종대로 136'
    return bool(tail) and squash(tail) in squash(address)


if __name__ == "__main__":
    run(main)
