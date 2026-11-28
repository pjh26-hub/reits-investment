# 리츠 투자

2030(대학생 · 사회초년생 · 월세 사는 1인가구)에게 리츠(REITs)를 생활 언어로 번역해서 보여주는 웹사이트.
대학 '부동산 프롭테크' 수업 팀 과제(주제: 부동산 마케팅)입니다.

> 본 사이트는 대학 수업 과제용이며 투자 권유가 아닙니다. 리츠·ETF는 원금 손실이 발생할 수 있습니다.

**공개 링크:** https://pjh26-hub.github.io/reits-investment/

## 화면

| 파일 | 내용 |
|---|---|
| `index.html` | 첫 화면. 타깃 선택 → 정렬 기준 공개 → 리츠 목록(국내/해외 전환, 최근 1년 주가 그래프) |
| `reit.html?id=종목코드` | 리츠 하나를 자세히: 훑어보는 가격 그래프(1개월·3개월·1년), 배당 달력, 매달 커피값으로 모았다면, 운용사·홈페이지, 가진 건물 비율 원 그래프·목록·지도, 증권사 리포트·공시 링크 |
| `compare.html` | 리츠·해외 리츠를 3개까지 골라 은행 적금과 나란히 비교 |
| `map.html` | 자주 가는 곳 근처에 리츠가 가진 건물 찾기 (해외 리츠는 본사 + 대표 보유 자산 2~3곳) |
| `learn.html` | 어려운 용어를 쉬운 말로 배우기 |
| `card.html` | 타깃별 홍보 카드 만들기 (금지 표현 자동 차단) |

발표할 때는 첫 화면의 **2분 만에 둘러보기** 버튼(또는 주소 끝에 `?tour=1`)으로 화면 6개를 순서대로 설명하는 투어를 켤 수 있습니다.

## 같이 작업하는 사람은

**[HANDOFF_PROMPT.md](HANDOFF_PROMPT.md)** 하나만 읽으면 됩니다. 규칙, 현재 상태, 이어서 할 일이 전부 들어 있습니다.
(GPT Codex 등 AI 도구로 작업한다면 그 파일을 읽게 한 뒤 시작하세요.)

`docs/old/` 의 문서는 예전 내용이라 지금 코드와 다릅니다. 공식 API(공공데이터포털·OpenDART 등) 주소를 확인해 둔 기록만 참고용으로 남겨 두었습니다.
`AUDIT_PHASE3.md`, `PREDEPLOY_FIXES.md` 는 11월 19일 점검·수정 기록입니다.

## 내 컴퓨터에서 보기

HTML 파일을 더블클릭하면 데이터가 안 보입니다. 폴더에서 아래를 실행하고 `http://localhost:8000` 을 여세요.

```bash
python -m http.server 8000
```

## 데이터

모든 수치는 실제 값이고, 화면 아래에 출처와 기준일이 표시됩니다. 값이 없으면 "데이터 없음"으로 표시합니다.

| 데이터 | 출처 |
|---|---|
| 국내 상장 리츠 목록 · 지표 · 건물 위치 | 국토교통부 리츠정보시스템 공개 화면 |
| 종목코드 | 한국거래소 KIND 상장법인목록 |
| 국내 리츠·리츠 ETF 시세 (전일 종가) | 금융위원회 주식시세정보·증권상품시세정보 (공공데이터포털, 공공누리 제4유형) — GitHub Actions 가 평일 하루 두 번 자동 갱신 |
| 미국 리츠 시세 | 2026-11-13 종가 저장본 (Finnhub 키를 넣으면 자동 갱신) · 환율 Frankfurter |
| 시세 저장본 (자동 갱신 파일을 못 읽을 때) | `data/prices_fallback.json` (야후 파이낸스, 2026-11-13 종가) |
| 최근 1년 주가 그래프 | 2026-11-13까지 야후 파이낸스(비공식), 그 뒤는 자동 갱신이 매일 종가를 붙임 |
| 배당 | 국내 리츠: OpenDART (DART 키를 넣으면 매주 자동 갱신) · 리츠 ETF·해외 리츠: 야후 파이낸스 (비공식) |
| 리츠 ETF 3개 | 팀이 고른 것 (`scripts/etf_confirmed.json`) |
| 해외 리츠 대표 보유 자산 | `data/global_properties.json` — 각 리츠·운영사 공개 자료(항목별 출처), 좌표는 미국 인구조사국 지오코더·위키백과 |
| 은행 적금 금리 | 금융감독원 금융상품한눈에 공개 화면 |
| 지도 · 장소 검색 | OpenStreetMap |

데이터를 새로 받으려면:

```bash
pip install -r requirements.txt
```

```bash
python scripts/build_public.py
```

## 시세 자동 갱신 (GitHub Actions)

공개 링크에는 **전날 종가만** 보여줍니다. 한국투자증권(KIS) 시세는 공개 사이트에 다시 내보내면 안 될 수 있어서 쓰지 않습니다(2026-11-23 팀 결정).

- `.github/workflows/update-prices.yml` — 평일 14:30, 18:30(한국 시간)에 `scripts/update_prices.py` 를 실행해
  `data/prices.json`, `data/history.json`(1년 그래프), `data/meta.json` 을 고치고 자동으로 커밋합니다.
  전일 종가는 다음 영업일 오후 1시 이후에 올라오므로, 화면에는 보통 "어제 종가"가 보입니다.
- `.github/workflows/update-dividends.yml` — 매주 월요일 07:00에 `scripts/fetch_dividends.py` 로 국내 리츠 배당(OpenDART)을 갱신합니다. DART 키가 없으면 건너뜁니다.

API 키는 저장소 **Settings > Secrets and variables > Actions** 에만 넣습니다(화면에는 키가 나가지 않음). Secrets 는 레포 주인만 넣을 수 있습니다.

| Secret 이름 | 쓰는 곳 | 발급처 |
|---|---|---|
| `DATA_GO_KR_KEY` | 국내 리츠·ETF 시세 (필수) | data.go.kr 가입 후 '금융위원회_주식시세정보', '금융위원회_증권상품시세정보' 활용신청 |
| `DART_API_KEY` | 국내 리츠 배당 (선택) | opendart.fss.or.kr 인증키 신청 |
| `FINNHUB_API_KEY` | 미국 리츠 시세 (선택, '개인 용도' 조건이라 팀이 정함) | finnhub.io 무료 가입 |

Actions 탭 > "리츠 시세 자동 갱신" > **Run workflow** 로 바로 실행해 볼 수 있습니다.
내 컴퓨터에서 실행하려면 `.env.example` 을 `.env` 로 복사해 키를 넣고 `python scripts/update_prices.py` (저장 없이 보기: `--dry-run`).

## 기술

순수 HTML / CSS / JavaScript (프레임워크·빌드 도구 없음). 데이터는 파이썬 스크립트가 `data/*.json` 으로 만들고, 화면은 이 JSON만 읽습니다.
