# -*- coding: utf-8 -*-
"""
scripts/convert_metrics.py — 리츠정보시스템 상장리츠현황 엑셀 → data/metrics.json

엑셀은 API가 아니라서 사람이 직접 내려받습니다.
  받는 곳: https://reits.molit.go.kr/pub/chart/chartSearch02_6?pmn=80  ("엑셀 다운로드" 버튼)
  넣는 곳: data/raw/  (내용·이름을 고치지 말고 그대로)

하는 일
  1) data/raw 에서 가장 최근에 넣은 엑셀을 찾는다
  2) 제목 줄(P/NAV 가 들어 있는 줄)을 찾아서 열 이름으로 값을 읽는다
  3) reits.json 의 종목코드를 이름(또는 인가일·상장일)으로 이어 붙인다

꼭 알아둘 점 (리츠정보시스템 '성과지표 안내' 기준, 2026-11-14 확인)
  - 배당수익률 = 배당액 ÷ 평균 납입자본금  → "자본금 기준". 현재 주가 기준이 아니다
  - 연환산배당률 = 배당수익률 × 365 ÷ 사업연도 일수
  - P/NAV = 결산월 말일 주가 ÷ NAV,  P/FFO = 결산월 말일 주가 ÷ FFO
      화면에 보이는 값은 0.0079 처럼 아주 작다. '주가(원) ÷ NAV(백만원)'를 그대로 나눈 값으로 보인다.
      → 원자료 그대로 p_nav_reported / p_ffo_reported 에 넣고, 여기서 고치지 않는다.
  - WALE 이 0 으로 적힌 리츠가 많다. 0년은 '값이 제공되지 않음'으로 보고 wale_years 는 null 로 두되,
    원자료는 wale_years_raw 에 그대로 남긴다.

실행
  python scripts/convert_metrics.py                      평소 실행
  python scripts/convert_metrics.py --peek               엑셀 앞 12줄을 그대로 보여줌(구조 확인용)
  python scripts/convert_metrics.py --as-of 2026-11-14   엑셀을 내려받은 날짜를 직접 지정

필요한 키: 없음
"""

import argparse
import datetime as dt
import re
from html.parser import HTMLParser
from pathlib import Path

from _util import KST, RAW_DIR, Stop, clean_text, load_json, norm_name, run, save_json, to_date, to_number, update_meta

SOURCE = "국토교통부 리츠정보시스템 상장리츠현황 통계 (엑셀 직접 다운로드)"
SOURCE_URL = "https://reits.molit.go.kr/pub/chart/chartSearch02_6?pmn=80"


class _TableReader(HTMLParser):
    """엑셀인 척하는 HTML 표를 읽는다 (공공 사이트 엑셀에 가끔 있음)"""

    def __init__(self):
        super().__init__()
        self.rows, self._row, self._cell = [], None, None

    def handle_starttag(self, tag, attrs):
        if tag == "tr":
            self._row = []
        elif tag in ("td", "th") and self._row is not None:
            self._cell = []

    def handle_data(self, data):
        if self._cell is not None:
            self._cell.append(data)

    def handle_endtag(self, tag):
        if tag in ("td", "th") and self._cell is not None:
            self._row.append("".join(self._cell).strip())
            self._cell = None
        elif tag == "tr" and self._row is not None:
            self.rows.append(self._row)
            self._row = None


def find_source(path_arg):
    """읽을 엑셀 파일을 고른다"""
    if path_arg:
        path = Path(path_arg)
        if not path.exists():
            raise Stop(f"지정한 파일이 없어요: {path}")
        return path
    files = [f for f in RAW_DIR.glob("*") if f.suffix.lower() in (".xlsx", ".xlsm", ".xls", ".txt", ".tsv", ".csv")
             and not f.name.startswith("~$")]
    if not files:
        raise Stop(
            "data/raw 폴더에 엑셀 파일이 없어요.\n"
            f"  → {SOURCE_URL} 에서 '엑셀 다운로드'를 눌러 받은 파일을 data/raw 폴더에 그대로 넣어 주세요."
        )
    return max(files, key=lambda f: f.stat().st_mtime)


def read_rows(path):
    """엑셀(또는 엑셀인 척하는 HTML)의 첫 시트를 줄 목록으로 읽는다"""
    raw = path.read_bytes()
    head = raw[:2048]
    if path.suffix.lower() in (".txt", ".tsv", ".csv"):     # 화면의 표를 옮겨 적은 글자 파일
        lines = [line for line in raw.decode("utf-8-sig").splitlines() if line.strip() and not line.startswith("#")]
        delimiter = "\t" if "\t" in lines[0] else ("|" if "|" in lines[0] else ",")
        return [[cell.strip() for cell in line.split(delimiter)] for line in lines]
    if head.startswith(b"PK"):                              # .xlsx
        try:
            import openpyxl
        except ImportError:
            raise Stop("openpyxl 패키지가 없어요. 터미널에서  pip install -r requirements.txt  를 먼저 실행해 주세요.")
        sheet = openpyxl.load_workbook(path, data_only=True).worksheets[0]
        return [list(row) for row in sheet.iter_rows(values_only=True)]
    if head.startswith(b"\xd0\xcf\x11\xe0"):                # 옛날 .xls
        try:
            import xlrd
        except ImportError:
            raise Stop(
                "이 파일은 옛날 엑셀 형식(.xls)이라 지금은 읽을 수 없어요.\n"
                "  → 엑셀로 연 다음 '다른 이름으로 저장 → Excel 통합 문서(.xlsx)'로 저장해서 data/raw 에 넣어 주세요."
            )
        sheet = xlrd.open_workbook(str(path)).sheet_by_index(0)
        return [sheet.row_values(i) for i in range(sheet.nrows)]
    if b"<" in head[:200]:                                  # HTML 표
        text = None
        for encoding in ("utf-8", "cp949"):
            try:
                text = raw.decode(encoding)
                break
            except UnicodeDecodeError:
                continue
        reader = _TableReader()
        reader.feed(text or raw.decode("utf-8", errors="replace"))
        return reader.rows
    raise Stop(f"{path.name}: 엑셀 파일로 보이지 않아요. 리츠정보시스템에서 받은 파일이 맞는지 확인해 주세요.")


def squash(value):
    """제목 비교용: 공백·줄바꿈을 지우고 대문자로"""
    return re.sub(r"\s+", "", str(value if value is not None else "")).upper()


def looks_like_header(row):
    """숫자가 하나도 없고 글자만 있는 줄이면 제목 줄로 본다"""
    cells = [c for c in row if c not in (None, "")]
    return bool(cells) and all(to_number(c) is None for c in cells)


def find_columns(rows):
    """제목 줄을 찾아 (데이터 시작 줄 번호, 열 이름→열 번호)를 돌려준다"""
    header_at = next((i for i, row in enumerate(rows[:30]) if any("P/NAV" in squash(c) for c in row)), None)
    if header_at is None:
        raise Stop("엑셀에서 'P/NAV' 제목이 있는 줄을 찾지 못했어요. --peek 옵션으로 앞부분을 확인해야 합니다.")
    header_rows = [i for i in (header_at - 1, header_at, header_at + 1)
                   if 0 <= i < len(rows) and (i == header_at or looks_like_header(rows[i]))]
    width = max(len(rows[i]) for i in header_rows)
    labels = []
    for col in range(width):              # 제목이 두 줄로 나뉘어 있으면 이어 붙인다
        parts = [squash(rows[i][col]) for i in header_rows if col < len(rows[i])]
        labels.append("|".join(p for p in parts if p))

    def pick(include, exclude=()):
        for col, label in enumerate(labels):
            if all(k in label for k in include) and not any(k in label for k in exclude):
                return col
        return None

    columns = {
        "name": next((c for c in (pick(["리츠명"]), pick(["회사명"]), pick(["종목명"])) if c is not None), None),
        "code": pick(["종목코드"]),
        "asset_type": pick(["투자대상"], exclude=["리츠명"]),
        "approved": pick(["인가일"]),
        "listed": pick(["상장일"]),
        "yield": pick(["배당수익률"]),
        "annual": pick(["연환산"]),
        "nav": pick(["NAV"], exclude=["P/NAV"]),
        "p_nav": pick(["P/NAV"]),
        "ffo": pick(["FFO"], exclude=["P/FFO"]),
        "p_ffo": pick(["P/FFO"]),
        "wale": pick(["WALE"]),
        "real_assets": pick(["실물자산"]),
    }
    if columns["name"] is None:
        raise Stop(f"엑셀에서 리츠 이름 열을 찾지 못했어요. 찾은 제목들: {labels}")
    return max(header_rows) + 1, columns, labels


def unit_factor(label):
    """NAV·FFO 를 '백만원' 단위로 맞추기 위한 곱셈값. 단위를 모르면 None"""
    if "백만원" in label:
        return 1
    if "억원" in label:
        return 100
    return None


def main():
    parser = argparse.ArgumentParser(description="상장리츠현황 엑셀 → metrics.json")
    parser.add_argument("--file", help="읽을 엑셀 파일 경로 (생략하면 data/raw 의 가장 최근 파일)")
    parser.add_argument("--as-of", help="엑셀을 내려받은 날짜 YYYY-MM-DD (생략하면 파일 수정 날짜)")
    parser.add_argument("--peek", action="store_true", help="엑셀 앞 12줄을 그대로 출력")
    args = parser.parse_args()

    path = find_source(args.file)
    print(f"[1/2] 엑셀 읽는 중: {path.name}")
    rows = read_rows(path)
    if args.peek:
        print("\n----- [구조 확인] 엑셀 앞 12줄 -----")
        for i, row in enumerate(rows[:12]):
            print(f"  {i:>2}: {row}")
        print("-----------------------------------")
    start, col, labels = find_columns(rows)
    print(f"      찾은 제목: {[l for l in labels if l]}")

    reits = (load_json("reits") or {}).get("items", [])
    id_by_name = {}
    for r in reits:
        id_by_name[norm_name(r.get("name"))] = r["id"]
        id_by_name[norm_name(r.get("name_official"))] = r["id"]
    id_by_dates = {(r.get("approved_date"), r.get("listed_date")): r["id"] for r in reits
                   if r.get("approved_date") and r.get("listed_date")}
    if not reits:
        print("      (reits.json 이 없어서 종목코드를 못 붙입니다. fetch_reits.py 실행 뒤 다시 돌려 주세요)")

    def cell(row, name):
        index = col.get(name)
        return row[index] if index is not None and index < len(row) else None

    nav_factor = unit_factor(labels[col["nav"]]) if col["nav"] is not None else None
    ffo_factor = unit_factor(labels[col["ffo"]]) if col["ffo"] is not None else None

    print("[2/2] 값을 옮기는 중...")
    items = []
    for row in rows[start:]:
        raw_name = clean_text(cell(row, "name"))
        if not raw_name:
            continue
        # "신한알파리츠 (오피스)" 처럼 이름 뒤 괄호에 주요투자대상이 붙어 있으면 나눈다
        match = re.match(r"^(.*?)\s*\(([^()]*)\)\s*$", raw_name)
        name = match.group(1).strip() if match else raw_name
        asset_type = clean_text(cell(row, "asset_type")) or (match.group(2).strip() if match else None)

        approved, listed = to_date(cell(row, "approved")), to_date(cell(row, "listed"))
        if col["approved"] is not None and col["approved"] == col["listed"]:
            # 인가일·상장일이 한 칸에 같이 들어 있는 경우: 앞의 날짜가 인가일, 뒤가 상장일
            found = re.findall(r"\d{2,4}[.\-/]\d{1,2}[.\-/]\d{1,2}", str(cell(row, "approved") or ""))
            approved = to_date(found[0]) if len(found) > 0 else None
            listed = to_date(found[1]) if len(found) > 1 else None

        code = clean_text(cell(row, "code"))
        reit_id = (code if code and code.isdigit() and len(code) == 6 else None) \
            or id_by_name.get(norm_name(name)) or id_by_dates.get((approved, listed))

        div_yield, annual = to_number(cell(row, "yield")), to_number(cell(row, "annual"))
        per_year = None                     # 1년에 결산을 몇 번 하는지 (연환산 ÷ 배당수익률)
        if div_yield and annual and div_yield > 0:
            ratio = annual / div_yield
            per_year = next((n for n in (1, 2, 4) if abs(ratio - n) < 0.35), None)

        nav, ffo = to_number(cell(row, "nav")), to_number(cell(row, "ffo"))
        wale_raw = to_number(cell(row, "wale"))
        items.append({
            "id": reit_id,
            "name": name,
            "asset_type": asset_type,
            "approved_date": approved,
            "listed_date": listed,
            "dividend_yield_capital": div_yield,                 # 배당수익률(%) - 자본금 기준
            "dividend_yield_annualized": annual,                 # 연환산배당률(%) - 자본금 기준
            "periods_per_year": per_year,
            "nav_million_won": nav * nav_factor if nav is not None and nav_factor else nav,
            "ffo_million_won": ffo * ffo_factor if ffo is not None and ffo_factor else ffo,
            "p_nav_reported": to_number(cell(row, "p_nav")),     # 원자료 그대로 (결산월 말일 주가 ÷ NAV)
            "p_ffo_reported": to_number(cell(row, "p_ffo")),     # 원자료 그대로 (결산월 말일 주가 ÷ FFO)
            "wale_years": wale_raw if wale_raw else None,        # 0 은 '제공 안 됨'으로 보고 null
            "wale_years_raw": wale_raw,
            "real_assets": clean_text(cell(row, "real_assets")),
        })

    if not items:
        raise Stop("엑셀에서 리츠를 한 줄도 읽지 못했어요. --peek 옵션으로 앞부분을 확인해야 합니다.")

    as_of = args.as_of or dt.datetime.fromtimestamp(path.stat().st_mtime, KST).strftime("%Y-%m-%d")
    from_screen = path.suffix.lower() in (".txt", ".tsv", ".csv")
    source = "국토교통부 리츠정보시스템 상장리츠현황 통계 (화면에 공개된 표를 옮겨 적음)" if from_screen else SOURCE
    notes = ["기준일은 화면을 조회한 날짜." if from_screen else "기준일은 엑셀을 내려받은 날짜(파일 날짜).",
             "배당수익률·연환산배당률은 자본금 기준(배당액÷평균 납입자본금)이며 현재 주가 기준이 아님.",
             "P/NAV·P/FFO 는 결산월 말일 주가 기준 원자료 그대로.",
             "WALE 0 은 제공되지 않은 값으로 보고 null 처리(원자료는 wale_years_raw)."]
    if nav_factor is None or ffo_factor is None:
        notes.append("NAV·FFO 단위를 제목에서 확인하지 못해 원자료 숫자 그대로 저장.")
    save_json("metrics", as_of, source, items, source_file=path.name)
    update_meta("metrics", source, SOURCE_URL, as_of, len(items), " ".join(notes))

    # ---------- 요약 ----------
    print("\n[성공] data/metrics.json 저장")
    print(f"  리츠 {len(items)}개 / 기준일(내려받은 날) {as_of}")
    no_id = [i["name"] for i in items if not i["id"]]
    if no_id:
        print(f"  [확인 필요] 종목코드를 못 붙인 리츠 {len(no_id)}개: {no_id}")
    fields = ["dividend_yield_capital", "dividend_yield_annualized", "nav_million_won", "ffo_million_won",
              "p_nav_reported", "p_ffo_reported", "wale_years"]
    print("  빠진 값(null) 개수: " + ", ".join(f"{f} {sum(1 for i in items if i[f] is None)}" for f in fields))
    zero_wale = sum(1 for i in items if i["wale_years_raw"] == 0)
    print(f"  WALE 이 0 으로 적혀 있어 null 로 둔 리츠: {zero_wale}개")


if __name__ == "__main__":
    run(main)
