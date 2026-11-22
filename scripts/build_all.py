# -*- coding: utf-8 -*-
"""
scripts/build_all.py — 데이터 스크립트를 순서대로 한 번에 실행

순서 (앞 단계가 만든 파일을 뒤 단계가 쓴다)
  1) fetch_reits.py       리츠·보유 자산      → reits.json, assets.json
  2) convert_metrics.py   상장리츠현황 엑셀   → metrics.json
  3) fetch_prices.py      전일 종가           → prices.json
  4) fetch_dividends.py   주당배당금          → dividends.json
  5) fetch_savings.py     은행 예금·적금      → savings.json
  6) geocode_assets.py    주소 → 좌표         → assets.json 의 lat, lng

한 단계가 실패해도 멈추지 않고 다음 단계로 넘어가고, 마지막에 결과를 표로 보여줍니다.
각 단계의 출처·기준일은 data/meta.json 에 기록됩니다.

실행
  python scripts/build_all.py
"""

import subprocess
import sys
from pathlib import Path

HERE = Path(__file__).resolve().parent

STEPS = [
    ("fetch_reits.py", "리츠·보유 자산"),
    ("convert_metrics.py", "상장리츠 지표(엑셀)"),
    ("fetch_prices.py", "전일 종가"),
    ("fetch_dividends.py", "주당배당금"),
    ("fetch_savings.py", "은행 예금·적금"),
    ("geocode_assets.py", "주소 → 좌표"),
]


def main():
    results = []
    for number, (script, title) in enumerate(STEPS, start=1):
        print("\n" + "=" * 64)
        print(f" {number}/{len(STEPS)}  {title}  ({script})")
        print("=" * 64, flush=True)
        command = [sys.executable, str(HERE / script)]
        code = subprocess.run(command, cwd=str(HERE.parent)).returncode
        results.append((script, title, code))

    print("\n" + "=" * 64)
    print(" 전체 결과")
    print("=" * 64)
    for script, title, code in results:
        state = "성공" if code == 0 else "실패"
        print(f"  [{state}] {title:<18} {script}")
    failed = [r for r in results if r[2] != 0]
    if failed:
        print("\n  실패한 단계는 위쪽에 이유가 적혀 있어요. 고친 뒤 그 스크립트만 따로 다시 실행해도 됩니다.")
        print("  예:  python scripts/" + failed[0][0])
        sys.exit(1)
    print("\n  출처·기준일은 data/meta.json 에 기록했습니다.")


if __name__ == "__main__":
    main()
