# -*- coding: utf-8 -*-
"""
scripts/_util.py — 데이터 스크립트들이 같이 쓰는 공통 도구

여기 있는 것
  - .env 에서 API 키 읽기 (키가 없으면 한국어로 이유를 알려줌)
  - API 호출 (실패하면 이유를 한국어로 알려주고, 메시지에 키가 보이지 않게 가림)
  - 공공데이터포털(data.go.kr) 응답 풀기 + 여러 페이지 모으기
  - 주식시세 / DART 고유번호처럼 두 스크립트 이상이 같이 쓰는 조회
  - data/*.json 저장, data/meta.json 에 출처·기준일 기록

이 파일은 직접 실행하지 않습니다. 다른 스크립트가 불러다 씁니다.
"""

import datetime as dt
import io
import json
import os
import re
import sys
import time
import zipfile
import xml.etree.ElementTree as ET
from pathlib import Path
from urllib.parse import quote, unquote

# ---------------------------------------------------------------------------
# 경로와 시간
# ---------------------------------------------------------------------------
ROOT = Path(__file__).resolve().parent.parent      # 프로젝트 폴더
DATA_DIR = ROOT / "data"                           # 화면이 읽는 JSON
RAW_DIR = DATA_DIR / "raw"                         # 직접 내려받은 엑셀 원본
SCRIPTS_DIR = Path(__file__).resolve().parent
CACHE_DIR = SCRIPTS_DIR / ".cache"                 # 임시 보관 (git에 안 올라감)
KST = dt.timezone(dt.timedelta(hours=9))           # 한국 시간

# 공식 문서에서 확인한 호출 주소 (2026-11-14 공공데이터포털 명세 기준)
STOCK_URL = "https://apis.data.go.kr/1160100/GetStockSecuritiesInfoService_V2/getStockPriceInfo_V2"
ETF_URL = "https://apis.data.go.kr/1160100/GetSecuritiesProductInfoService_V2/getETFPriceInfo_V2"
DART_CORP_URL = "https://opendart.fss.or.kr/api/corpCode.xml"

_SECRETS = set()   # 화면에 찍히면 안 되는 키 값 모음


class Stop(Exception):
    """사용자에게 이유를 보여주고 스크립트를 멈출 때 쓰는 예외"""


def now_kst():
    """지금 시각(한국 시간)"""
    return dt.datetime.now(KST)


def today_str():
    """오늘 날짜 'YYYY-MM-DD'"""
    return now_kst().strftime("%Y-%m-%d")


def setup_console():
    """윈도우 콘솔에서 글자 때문에 프로그램이 죽지 않게 한다"""
    for stream in (sys.stdout, sys.stderr):
        try:
            stream.reconfigure(errors="replace")
        except Exception:
            pass


def run(main):
    """스크립트의 main()을 실행하고, 실패하면 이유를 한국어로 보여준다"""
    setup_console()
    try:
        main()
    except Stop as e:
        print("\n[실패] " + mask(str(e)))
        sys.exit(1)
    except KeyboardInterrupt:
        print("\n[중단] 사용자가 멈췄어요.")
        sys.exit(1)


# ---------------------------------------------------------------------------
# API 키
# ---------------------------------------------------------------------------
def load_env():
    """프로젝트 폴더의 .env 를 읽는다. 파일이 있으면 True"""
    env_path = ROOT / ".env"
    if not env_path.exists():
        return False
    # utf-8-sig: 메모장으로 저장해서 맨 앞에 보이지 않는 글자(BOM)가 붙어도 읽히게
    for line in env_path.read_text(encoding="utf-8-sig").splitlines():
        line = line.strip()
        if not line or line.startswith("#") or "=" not in line:
            continue
        name, value = line.split("=", 1)
        value = value.strip().strip('"').strip("'")
        if name.strip() and value:
            os.environ[name.strip()] = value
    return True


def has_key(name):
    """키가 들어 있는지만 확인 (없어도 멈추지 않음)"""
    load_env()
    return bool(os.environ.get(name, "").strip())


def get_key(name, site):
    """.env 에서 키를 꺼낸다. 없으면 이유를 알려주고 멈춘다"""
    has_env = load_env()
    value = os.environ.get(name, "").strip()
    if not value:
        if not has_env:
            raise Stop(
                ".env 파일이 없어요.\n"
                "  → .env.example 을 복사해서 이름을 .env 로 바꾸고, 발급받은 키를 넣어 주세요.\n"
                f"  → 이 스크립트에 필요한 키: {name} ({site})"
            )
        raise Stop(
            f".env 파일에 {name} 값이 비어 있어요.\n"
            f"  → {site} 에서 키를 발급받아 {name}= 뒤에 붙여넣어 주세요."
        )
    _SECRETS.add(value)
    _SECRETS.add(quote(value, safe=""))
    return value


def get_data_go_kr_key():
    """공공데이터포털 키. Encoding 키(%가 들어 있음)를 넣었어도 알아서 풀어 쓴다"""
    value = get_key("DATA_GO_KR_KEY", "공공데이터포털 data.go.kr")
    if "%" in value:
        value = unquote(value)
        _SECRETS.add(value)
    return value


def mask(text):
    """메시지 안에 키가 들어 있으면 *** 로 가린다"""
    text = str(text)
    for secret in sorted(_SECRETS, key=len, reverse=True):
        if secret:
            text = text.replace(secret, "***")
    return text


# ---------------------------------------------------------------------------
# API 호출
# ---------------------------------------------------------------------------
def http_get(url, params=None, label="", timeout=30, tries=3):
    """GET 요청. 연결이 안 되면 몇 번 다시 해보고, 그래도 안 되면 이유를 알려준다"""
    try:
        import requests
    except ImportError:
        raise Stop("requests 패키지가 없어요. 터미널에서  pip install -r requirements.txt  를 먼저 실행해 주세요.")
    last_error = None
    for attempt in range(tries):
        try:
            return requests.get(url, params=params, timeout=timeout)
        except requests.RequestException as e:
            last_error = e
            time.sleep(1.5 * (attempt + 1))
    raise Stop(
        f"{label}: 서버에 연결하지 못했어요. 인터넷 연결을 확인하거나, 사이트가 점검 중인지 확인해 주세요.\n"
        f"  (상세: {type(last_error).__name__})"
    )


def _explain_data_go_kr_error(status, text, label):
    """공공데이터포털이 돌려준 오류를 쉬운 말로 바꾼다"""
    upper = text.upper()
    if "SERVICE_KEY_IS_NOT_REGISTERED" in upper or status == 401:
        why = ("인증키가 등록되지 않았다고 나와요. 키를 잘못 붙여넣었거나, "
               "발급·승인 직후라 아직 반영되지 않았을 수 있어요(시간이 지난 뒤 다시 시도).")
    elif status == 403 or "FORBIDDEN" in upper:
        why = ("이 API를 쓸 권한이 없다고 나와요. 공공데이터포털에서 이 API의 '활용신청'을 했는지, "
               "승인이 끝났는지 마이페이지에서 확인해 주세요.")
    elif "LIMITED_NUMBER_OF_SERVICE_REQUESTS" in upper or status == 429:
        why = "하루 호출 한도를 넘었어요. 내일 다시 시도해 주세요."
    elif "DEADLINE_HAS_EXPIRED" in upper:
        why = "API 활용 기간이 끝났어요. 공공데이터포털에서 기간 연장을 신청해 주세요."
    elif status >= 500:
        why = "공공데이터포털 서버 쪽 오류예요. 잠시 뒤 다시 시도해 주세요."
    else:
        why = "예상하지 못한 응답이 왔어요."
    short = re.sub(r"\s+", " ", text)[:200]
    return f"{label}: {why}\n  (HTTP {status}, 응답 앞부분: {mask(short)})"


def data_go_kr_page(url, params, label):
    """공공데이터포털 API를 한 번 부르고 (항목 목록, 전체 개수, 원본) 을 돌려준다"""
    res = http_get(url, params, label)
    text = (res.text or "").strip()
    # 오류일 때는 JSON을 요청해도 XML(<...>)이나 글자만 올 때가 있다
    if res.status_code != 200 or not text or text.startswith("<"):
        raise Stop(_explain_data_go_kr_error(res.status_code, text, label))
    try:
        data = res.json()
    except ValueError:
        raise Stop(_explain_data_go_kr_error(res.status_code, text, label))

    # 응답이 {"response": {"header":..., "body":...}} 이거나 {"header":..., "body":...} 인 경우 둘 다 처리
    root = data.get("response", data) if isinstance(data, dict) else {}
    header = root.get("header") or {}
    body = root.get("body") or {}
    code = str(header.get("resultCode", "")).strip()
    if code in ("03", "3"):          # 데이터 없음
        return [], 0, data
    if code not in ("", "00", "0", "000", "200"):
        raise Stop(f"{label}: API가 오류를 돌려줬어요 (코드 {code}: {header.get('resultMsg')})")

    items = body.get("items") or []
    if isinstance(items, dict):
        items = items.get("item") or []
    if isinstance(items, dict):      # 결과가 1건이면 목록이 아니라 한 덩어리로 올 수 있다
        items = [items]
    total = to_number(body.get("totalCount")) or 0
    return list(items), int(total), data


def data_go_kr_all(url, params, label, page_size=1000, max_pages=200):
    """여러 페이지를 끝까지 모아서 항목 목록 전체를 돌려준다"""
    collected = []
    for page in range(1, max_pages + 1):
        query = dict(params, pageNo=page, numOfRows=page_size)
        items, total, _ = data_go_kr_page(url, query, label)
        collected.extend(items)
        if not items or len(collected) >= total:
            break
    return collected


# ---------------------------------------------------------------------------
# 값 다듬기
# ---------------------------------------------------------------------------
def to_number(value):
    """'1,234' '12.5' 같은 글자를 숫자로. 값이 없거나 '-' 면 None"""
    if value is None or isinstance(value, bool):
        return None
    if isinstance(value, (int, float)):
        return value
    text = str(value).strip().replace(",", "")
    if text in ("", "-", "--", "N/A", "null", "None"):
        return None
    try:
        number = float(text)
    except ValueError:
        return None
    return int(number) if number.is_integer() else number


def to_date(value):
    """'20251114' '2025.11.14' '25.11.14' 등을 'YYYY-MM-DD' 로. 알 수 없으면 None"""
    if value is None:
        return None
    if isinstance(value, (dt.datetime, dt.date)):
        return value.strftime("%Y-%m-%d")
    digits = re.findall(r"\d+", str(value))
    if not digits:
        return None
    if len(digits) == 1 and len(digits[0]) == 8:          # 20251114
        y, m, d = digits[0][:4], digits[0][4:6], digits[0][6:]
    elif len(digits) >= 3:                                # 2025.11.14 / 25.11.14
        y, m, d = digits[0], digits[1], digits[2]
        if len(y) == 2:                                   # 두 자리 연도
            y = ("20" if int(y) <= now_kst().year % 100 else "19") + y
    else:
        return None
    try:
        return dt.date(int(y), int(m), int(d)).strftime("%Y-%m-%d")
    except ValueError:
        return None


def clean_text(value):
    """앞뒤 공백을 지운 글자. 비어 있으면 None"""
    if value is None:
        return None
    text = str(value).strip()
    return text if text else None


def norm_name(name):
    """이름 비교용: 공백, (주), 주식회사, ㈜ 를 지우고 영문은 대문자로"""
    text = str(name or "")
    text = re.sub(r"\(주\)|㈜|주식회사", "", text)
    text = re.sub(r"\s+", "", text)
    return text.upper()


def norm_code(code):
    """종목코드를 6자리 문자열로. 'A293940' 처럼 앞에 A가 붙어 있으면 뗀다"""
    text = str(code or "").strip()
    if len(text) == 7 and text[0].isalpha():
        text = text[1:]
    return text


# ---------------------------------------------------------------------------
# 두 스크립트 이상이 같이 쓰는 조회
# ---------------------------------------------------------------------------
def find_latest_base_date(key, url=STOCK_URL, label="주식시세", max_back=12):
    """시세 데이터가 있는 가장 최근 기준일(YYYYMMDD)을 찾는다.
    (전일 종가는 다음 영업일 오후 1시 이후에 올라오므로, 오늘부터 하루씩 거슬러 올라가며 확인)"""
    today = now_kst().date()
    for back in range(max_back + 1):
        day = today - dt.timedelta(days=back)
        if day.weekday() >= 5:       # 토·일은 건너뜀
            continue
        ymd = day.strftime("%Y%m%d")
        query = {"serviceKey": key, "resultType": "json", "basDt": ymd, "pageNo": 1, "numOfRows": 1}
        items, total, _ = data_go_kr_page(url, query, label)
        if items or total > 0:
            return ymd
    raise Stop(f"{label}: 최근 {max_back}일 안에 시세 데이터가 없어요. 잠시 뒤 다시 시도해 주세요.")


def fetch_all_stocks(key, base_date):
    """기준일의 전체 상장 주식 시세를 받아온다 (종목명으로 종목코드를 찾을 때도 씀)"""
    query = {"serviceKey": key, "resultType": "json", "basDt": base_date}
    return data_go_kr_all(STOCK_URL, query, "주식시세", page_size=1000)


DART_ERRORS = {
    "010": "등록되지 않은 인증키예요. DART_API_KEY 값을 다시 확인해 주세요.",
    "011": "사용할 수 없는(일시 중지된) 인증키예요.",
    "012": "이 컴퓨터의 IP에서는 접근할 수 없다고 나와요.",
    "020": "요청 한도를 넘었어요. 내일 다시 시도해 주세요.",
    "100": "요청 값이 잘못됐어요(스크립트 문제일 수 있으니 알려 주세요).",
    "800": "DART가 시스템 점검 중이에요. 나중에 다시 시도해 주세요.",
    "900": "DART 쪽에서 정의되지 않은 오류가 났어요.",
    "901": "인증키의 개인정보 보유기간이 끝나서 쓸 수 없어요. 키를 다시 발급받아 주세요.",
}


def dart_error(status, message, label):
    """DART 오류 코드를 쉬운 말로"""
    why = DART_ERRORS.get(str(status), "예상하지 못한 응답이 왔어요.")
    return f"{label}: {why} (DART 코드 {status}: {message})"


def load_dart_corps(key):
    """DART 고유번호 전체 목록 중 상장회사만 돌려준다.
    결과: [{'corp_code', 'corp_name', 'stock_code'}, ...]
    (파일이 커서 하루 동안은 scripts/.cache 에 보관해 두고 다시 쓴다)"""
    cache = CACHE_DIR / "corpCode.xml"
    xml_bytes = None
    if cache.exists():
        saved = dt.datetime.fromtimestamp(cache.stat().st_mtime, KST).date()
        if saved == now_kst().date():
            xml_bytes = cache.read_bytes()
    if xml_bytes is None:
        res = http_get(DART_CORP_URL, {"crtfc_key": key}, "DART 고유번호", timeout=60)
        content = res.content or b""
        if not content.startswith(b"PK"):      # 정상이면 ZIP 파일(PK로 시작), 아니면 오류 안내문
            text = content.decode("utf-8", errors="replace")
            status = re.search(r"<status>(.*?)</status>|\"status\"\s*:\s*\"(.*?)\"", text)
            message = re.search(r"<message>(.*?)</message>|\"message\"\s*:\s*\"(.*?)\"", text)
            code = next((g for g in (status.groups() if status else ()) if g), "?")
            msg = next((g for g in (message.groups() if message else ()) if g), text[:120])
            raise Stop(dart_error(code, msg, "DART 고유번호"))
        with zipfile.ZipFile(io.BytesIO(content)) as zf:
            xml_names = [n for n in zf.namelist() if n.lower().endswith(".xml")]
            if not xml_names:
                raise Stop("DART 고유번호: 받은 ZIP 안에 XML 파일이 없어요.")
            xml_bytes = zf.read(xml_names[0])
        CACHE_DIR.mkdir(parents=True, exist_ok=True)
        cache.write_bytes(xml_bytes)

    corps = []
    for node in ET.fromstring(xml_bytes).iter("list"):
        stock_code = (node.findtext("stock_code") or "").strip()
        if not stock_code:                      # 비상장회사는 건너뜀
            continue
        corps.append({
            "corp_code": (node.findtext("corp_code") or "").strip(),
            "corp_name": (node.findtext("corp_name") or "").strip(),
            "stock_code": stock_code,
        })
    return corps


# ---------------------------------------------------------------------------
# JSON 저장 / 읽기 / meta.json
# ---------------------------------------------------------------------------
def load_json(name):
    """data/이름.json 을 읽는다. 파일이 없으면 None"""
    path = DATA_DIR / f"{name}.json"
    if not path.exists():
        return None
    return json.loads(path.read_text(encoding="utf-8"))


def save_json(name, as_of, source, items, **extra):
    """data/이름.json 저장. 모든 파일이 같은 모양: {as_of, source, items, (추가 정보)}"""
    DATA_DIR.mkdir(parents=True, exist_ok=True)
    payload = {"as_of": as_of, "source": source}
    payload.update(extra)
    payload["items"] = items
    path = DATA_DIR / f"{name}.json"
    path.write_text(json.dumps(payload, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    return path


def update_meta(name, source, source_url, as_of, count, note=""):
    """data/meta.json 에 이 데이터의 출처·기준일을 기록한다"""
    path = DATA_DIR / "meta.json"
    meta = {"updated_at": None, "files": {}}
    if path.exists():
        try:
            meta = json.loads(path.read_text(encoding="utf-8"))
        except ValueError:
            pass
    stamp = now_kst().strftime("%Y-%m-%dT%H:%M:%S+09:00")
    meta.setdefault("files", {})[name] = {
        "source": source,
        "source_url": source_url,
        "as_of": as_of,
        "fetched_at": stamp,
        "count": count,
        "note": note,
    }
    meta["updated_at"] = stamp
    DATA_DIR.mkdir(parents=True, exist_ok=True)
    path.write_text(json.dumps(meta, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")


def peek(title, obj):
    """구조 확인용: 원본 응답 한 건을 그대로 보여준다 (--peek 옵션)"""
    print(f"\n----- [구조 확인] {title} -----")
    print(mask(json.dumps(obj, ensure_ascii=False, indent=2))[:3000])
    print("-----------------------------------")
