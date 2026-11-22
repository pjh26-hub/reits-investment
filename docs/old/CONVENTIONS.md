# CONVENTIONS.md — "커피값 건물주" 공통 규칙

> 이 문서는 **사람 팀원, Claude Code, ChatGPT가 모두 따르는 단 하나의 규칙 문서**입니다.
> ChatGPT로 작업하는 팀원은 대화를 시작할 때 **이 문서 전체**를 붙여넣으세요.
> 다른 설명과 이 문서가 다르면 이 문서가 이깁니다.

- 문서 버전: **v0.3** (Phase 1, 2026-11-14 — 3장을 데이터 스크립트에 맞춰 고침, 좌표 출처를 행정안전부 주소 API로 변경. 실제 데이터로는 아직 검증 전)
- 표시: ✅ 확정(안 바뀜) / 🚧 초안(Phase 1~4에서 실제 데이터·코드를 보고 확정)
- 3장(데이터 스키마), 4장(공통 함수), 5장(디자인)은 아직 🚧 초안입니다.
  Phase 4가 끝나면 **v1.0**으로 올라가고, **팀원은 v1.0부터 작업을 시작**합니다.

---

## 0. 프로젝트 한 줄 요약 ✅

2030(대학생 · 사회초년생 · 월세 사는 1인가구)에게 리츠(REITs)를 "내 얘기"로 번역해서 보여주는 **부동산 마케팅 웹사이트**. 대학 '부동산 프롭테크' 수업 팀 과제이고, 발표 때 학생들이 폰으로 접속해서 평가합니다.

절대 어기면 안 되는 3가지:

1. **가짜 데이터 금지** — 모든 숫자는 실제 공식 데이터. 없으면 "데이터 없음".
2. **투자 권유 금지** — "추천" 같은 말을 쓰지 않고, 위험도 장점과 같은 크기로 보여준다.
3. **가장 단순한 구조** — 순수 HTML/CSS/JS. 초보자가 파일을 통째로 붙여넣어도 돌아가야 한다.

---

## 1. 기술 규칙 ✅

| # | 규칙 |
|---|---|
| 1 | **순수 HTML / CSS / JavaScript만** 쓴다. React·Vue·jQuery·Tailwind·npm·빌드 도구 금지. |
| 2 | 외부에서 불러오는 것(CDN)은 **카카오맵 SDK와 웹폰트 2가지뿐**. 다른 라이브러리가 필요하면 먼저 요청한다(8장). |
| 3 | 배포는 GitHub Pages(정적 사이트). 서버 코드는 없다. |
| 4 | 데이터 흐름은 한 방향: **API → `scripts/*.py` → `data/*.json` → 화면**. 화면(프론트)은 `data/*.json`만 읽는다. |
| 5 | 프론트에서 외부 API를 직접 부르지 않는다. 예외 2개: ① 카카오맵 SDK·장소 검색(map.html) ② 선택 기능인 로컬 실시간 시세 서버. |
| 6 | **가짜 데이터 금지.** 숫자·리츠 이름·주소를 코드에 직접 써넣지(하드코딩) 않는다. **이 문서의 예시 값을 코드에 복사하지 않는다.** |
| 7 | 값이 없으면(`null`) 화면에 **"데이터 없음"**이라고 쓴다. 0이나 임의 값으로 채우지 않는다. |
| 8 | 숫자가 나오는 화면에는 **출처와 기준일**을 표시한다(`data/meta.json` 사용). |
| 9 | **비밀 API 키는 `.env`에만.** 프론트 코드(HTML/JS)에 넣지 않는다. 예외는 **카카오 JavaScript 키 하나** — `map.html`의 카카오 SDK `<script>` 태그에만 넣고, 카카오 개발자 콘솔에서 사이트 도메인을 제한한다. |
| 10 | **카카오 장소 검색 결과는 저장 금지**(카카오 정책). localStorage·JSON·파일 어디에도 저장하지 않고, 화면에서 쓰고 버린다. |
| 11 | 실시간 시세(KIS)는 발표자 노트북의 로컬 서버 전용. 서버가 꺼져 있으면 자동으로 전일 종가(`prices.json`)를 쓴다. 공개 배포하지 않는다. |
| 12 | **지도를 뺀 모든 화면은 인터넷이 불안정해도** 정적 JSON만으로 작동해야 한다. |
| 13 | `localStorage`는 항상 `try/catch`로 감싼다. 저장하는 것은 "타깃 선택" 하나뿐이다. |
| 14 | **모바일 우선.** 화면 폭 360px에서 가로 스크롤이 생기면 안 된다. |
| 15 | 파일 경로는 **상대 경로**로 쓴다: `data/reits.json` ⭕ / `/data/reits.json` ❌ (GitHub Pages는 `/저장소이름/` 아래에서 열리기 때문에 `/`로 시작하면 깨진다). |
| 16 | 코드 주석은 **한국어**로 쓴다. 파일은 UTF-8로 저장한다. |
| 17 | 화면 문구에 "추천"을 쓰지 않는다 → **"정렬 기준"**이라고 쓴다. (6장 참고) |

---

## 2. 폴더 구조와 담당자 ✅

```
/
├─ index.html          첫 화면 + 타깃 선택            [A]
├─ compare.html        비교 + 생활 언어 번역          [A]
├─ map.html            장소에서 리츠로 (지도)         [B]
├─ card.html           타깃별 홍보 카드 생성기        [B]
├─ css/
│   └─ style.css       공통 디자인 (CSS 변수)         [A] ★공통
├─ js/
│   ├─ common.js       공통 함수                      [A] ★공통
│   ├─ compare.js                                     [A]
│   ├─ map.js                                         [B]
│   └─ card.js                                        [B]
├─ data/               화면이 읽는 JSON               [A] ★공통 (스크립트가 만듦)
│   ├─ reits.json  assets.json  metrics.json
│   ├─ prices.json  dividends.json  savings.json
│   ├─ meta.json       데이터별 출처·기준일
│   └─ raw/            직접 내려받은 엑셀 원본
├─ scripts/            데이터 수집 파이썬 스크립트     [A]
├─ .env.example  .gitignore  requirements.txt         [A]
└─ README.md  CONVENTIONS.md  TEAM_GUIDE.md           [A]
```

| 담당 | 누구 | 쓰는 AI | 맡은 파일 |
|---|---|---|---|
| **A** | 팀장 (이름: ________) | Claude Code | `scripts/*`, `data/*`, `css/style.css`, `js/common.js`, `index.html`, `compare.html`, `js/compare.js`, 문서 3종 |
| **B** | 팀원 (이름: ________) | ChatGPT | `map.html`, `js/map.js`, `card.html`, `js/card.js` |

- ★공통 파일(`css/style.css`, `js/common.js`, `data/` 전체)은 **A만 수정**한다. B가 바꾸고 싶으면 8장 방법으로 요청한다.
- `data/*.json`은 **손으로 고치지 않는다.** 반드시 스크립트를 다시 돌려서 만든다.
- `map.html`, `card.html`의 빈 뼈대(공통 헤더·푸터, style.css 연결, 데이터 로드 예시)는 Phase 4에서 A가 만들어 준다. B는 그 안을 채운다.

---

## 3. 데이터 스키마 (`data/*.json`) 🚧

> ⚠️ **초안입니다.** 실제 API 응답과 엑셀을 아직 받아보지 않았기 때문에, 아래 필드 목록은 Phase 1에서 실제 데이터를 확인한 뒤 확정합니다. 지금 이 표만 보고 화면 코드를 짜지 마세요.
>
> ⚠️ **아래 예시 값은 모양(형식)을 보여주기 위한 것이고 실제 값이 아닙니다.** 코드에 복사하지 마세요. Phase 4에서 실제 JSON에서 뽑은 예시로 교체합니다.

### 3-0. 모든 파일의 공통 규칙 ✅

1. 모든 파일은 같은 모양이다(`meta.json`만 예외):
   ```json
   { "as_of": "기준일", "source": "출처 이름", "items": [ { ... }, { ... } ] }
   ```
2. 상품을 구분하는 열쇠는 **`id` = 종목코드 6자리 "문자열"** 이다. 예: `"293940"`. (숫자로 쓰면 `"088980"`의 맨 앞 0이 사라지므로 반드시 문자열)
   → 서로 다른 파일의 데이터를 이 `id`로 연결한다.
3. `type`은 `"reit"`(리츠) 또는 `"etf"`(리츠 ETF) 둘 중 하나.
4. **값이 없으면 `null`.** 빈 문자열 `""`, `0`, `"-"`로 쓰지 않는다. 화면은 `null`을 "데이터 없음"으로 보여준다.
5. 필드 이름은 영어 소문자 + 밑줄(`snake_case`).
6. 날짜는 `"YYYY-MM-DD"`, 월은 `"YYYY-MM"`.
7. 비율은 **퍼센트 숫자 그대로** 적는다: `5.2`는 5.2%를 뜻한다(0.052 아님). 금액은 **원 단위 숫자**.

### 3-1. `reits.json` — 리츠 기본 정보 🚧

- 출처: 국토교통부 리츠정보 API (공공데이터포털 15139797)
- 범위: 기본은 **상장 리츠만**(주식처럼 살 수 있고 시세·비교가 가능한 상품)

| 필드 | 타입 | 설명 |
|---|---|---|
| `id` | 문자열 | 종목코드 6자리 |
| `type` | 문자열 | 항상 `"reit"` |
| `name` | 문자열 | 주식시장 종목명 (**화면에는 이 이름을 쓴다**) |
| `name_official` | 문자열 | 국토부에 등록된 이름 |
| `reits_no` | 문자열 | 국토부 리츠번호(국토부 API에서 쓰는 번호) |
| `id_method` | 문자열 | 종목코드를 어떻게 찾았는지(검증용. 화면에 쓰지 않음) |
| `status` | 문자열 | `"운영중"` 또는 `"해산 결의"` |
| `reit_type` | 문자열 또는 null | 리츠 유형 |
| `amc` | 문자열 또는 null | 운용사(자산관리회사) |
| `approved_date` | 문자열 또는 null | 인가일 |
| `listed_date` | 문자열 또는 null | 상장일 |
| `main_asset_type` | 문자열 또는 null | 대표 투자대상 |
| `asset_types` | 문자열 배열 | 보유 자산의 유형 목록 |
| `asset_count` | 숫자 | 보유 자산 개수 |
| `total_assets_100m_won` | 숫자 또는 null | 자산총계(**억원**) |
| `molit_dividend_yield` | 숫자 또는 null | 국토부 표기 배당수익률(%) — 참고용 |

- 파일 맨 위에 `unmatched` 목록이 따로 있다: 종목코드를 못 찾아서 `items`에 넣지 못한 상장 리츠(화면에 쓰지 않음).

```json
{ "id": "000000", "type": "reit", "name": "(종목명)", "name_official": "(국토부 등록 이름)",
  "reits_no": "(리츠번호)", "status": "운영중", "amc": "(운용사 이름)",
  "listed_date": "YYYY-MM-DD", "asset_types": ["(자산 유형)"], "asset_count": 0 }
```

### 3-2. `assets.json` — 리츠가 가진 건물(자산) 🚧

- 출처: 국토교통부 리츠정보 API(투자대상 목록) + 행정안전부 주소 API(주소 → 건물 출입구 좌표)

| 필드 | 타입 | 설명 |
|---|---|---|
| `asset_id` | 문자열 | 자산 고유 번호 (`리츠id-순번`) |
| `reit_id` | 문자열 | 이 자산을 가진 리츠의 `id` |
| `reit_name` | 문자열 | 리츠 이름(편의용) |
| `name` | 문자열 또는 null | 건물·자산 이름 |
| `asset_type` | 문자열 또는 null | 자산 유형(대표투자대상) |
| `invest_type` | 문자열 또는 null | 부동산 투자구분 |
| `address` | 문자열 또는 null | 주소 |
| `land_area_m2` | 숫자 또는 null | 대지면적(㎡) |
| `floor_area_m2` | 숫자 또는 null | 연면적(㎡) |
| `completed_date` | 문자열 또는 null | 완공일 |
| `lat` | 숫자 또는 null | 위도 (좌표 변환 실패 시 null) |
| `lng` | 숫자 또는 null | 경도 (좌표 변환 실패 시 null) |
| `geocode_matched` | 문자열 또는 null | 좌표를 구할 때 맞춘 도로명주소(사람이 확인하는 용도. 화면에 쓰지 않음) |
| `geocode_status` | 문자열 또는 null | 좌표 변환 결과. 성공이면 `"변환 성공"`, 실패면 이유(`"주소 없음"`, `"주소 검색 결과 없음"`, `"검색된 주소가 여러 개라 확정하지 못함"` 등). 아직 변환 전이면 null |

```json
{ "asset_id": "000000-01", "reit_id": "000000", "reit_name": "(리츠 이름)",
  "name": "(건물 이름)", "asset_type": "(자산 유형)", "address": "(주소)",
  "lat": 37.0, "lng": 127.0 }
```

- `lat`/`lng`가 `null`인 자산은 지도에 찍지 않는다(임의 위치에 찍지 않는다).

### 3-3. `metrics.json` — 상장리츠 지표 🚧

- 출처: 리츠정보시스템 상장리츠현황 통계(직접 내려받은 엑셀 → `scripts/convert_metrics.py`)
- 실제 엑셀 파일로는 아직 검증하지 못했다(리츠정보시스템 화면의 표 제목 기준으로 작성).

| 필드 | 타입 | 설명 |
|---|---|---|
| `id` | 문자열 또는 null | 종목코드. `reits.json`과 이름(또는 인가일·상장일)으로 이어 붙인다. 못 붙이면 null |
| `name` | 문자열 | 리츠 이름 |
| `asset_type` | 문자열 또는 null | 주요투자대상(오피스, 물류, 리테일 등) |
| `approved_date`, `listed_date` | 문자열 또는 null | 인가일, 상장일 |
| `dividend_yield_capital` | 숫자 또는 null | 배당수익률(%) — **자본금 기준** (배당액 ÷ 평균 납입자본금) |
| `dividend_yield_annualized` | 숫자 또는 null | 연환산배당률(%) — 자본금 기준 |
| `periods_per_year` | 1, 2, 4 또는 null | 1년에 결산을 몇 번 하는지(연환산배당률 ÷ 배당수익률로 계산) |
| `nav_million_won` | 숫자 또는 null | NAV(**백만원**) = 자산의 최근 감정평가액 − 부채총계 |
| `ffo_million_won` | 숫자 또는 null | FFO(**백만원**) |
| `p_nav_reported` | 숫자 또는 null | P/NAV **원자료 그대로**(결산월 말일 주가 기준) |
| `p_ffo_reported` | 숫자 또는 null | P/FFO **원자료 그대로** |
| `wale_years` | 숫자 또는 null | WALE, 남은 임대 기간 평균(년). 원자료가 0이면 null |
| `wale_years_raw` | 숫자 또는 null | WALE 원자료 그대로(0 포함) |
| `real_assets` | 문자열 또는 null | 실물자산 칸 원자료 |

**화면에 쓸 때 꼭 지킬 것 ✅**

- `dividend_yield_capital`에는 반드시 **"자본금 기준"** 라벨을 붙인다. 현재 주가 기준이 아니다.
- 생활 언어 번역(커피 몇 잔 등)에는 이 값이 아니라 **주가 기준 배당수익률**(3-5)을 쓴다. 자본금 기준 값은 참고로만 보여준다.
- ⚠️ `p_nav_reported`는 **그대로 "1만 원어치 건물을 ○천 원에" 번역에 쓸 수 없다.** 리츠정보시스템 화면의 P/NAV는 0.0079처럼 아주 작은 값인데, "주가(원) ÷ NAV(백만원)"를 그대로 나눈 것으로 보인다. 번역에 쓸 P/NAV를 어떻게 구할지(예: 시가총액 ÷ NAV)는 팀 결정 후 Phase 2에서 `common.js` 함수로 정한다.

### 3-4. `prices.json` — 전일 종가 🚧

- 출처: 금융위원회 주식시세정보 API(리츠) + 금융위원회 증권상품시세정보 API(리츠 ETF)
- 영업일 다음 날 오후 1시 이후에 갱신되는 **전일 종가**다. 실시간이 아니다.
- 리츠 ETF 목록은 이 파일에 `type: "etf"`로 들어 있다(ETF는 `reits.json`에 없음).

| 필드 | 타입 | 설명 |
|---|---|---|
| `id` | 문자열 | 종목코드 |
| `type` | 문자열 | `"reit"` 또는 `"etf"` |
| `name` | 문자열 | 종목 이름 |
| `close` | 숫자 또는 null | 종가(원) = 1주 가격 |
| `base_date` | 문자열 | 이 종가의 기준일 `"YYYY-MM-DD"` |
| `change` | 숫자 또는 null | 전일 대비(원) |
| `change_pct` | 숫자 또는 null | 등락률(%) |
| `volume` | 숫자 또는 null | 거래량 |
| `market_cap` | 숫자 또는 null | 시가총액(원) |
| `listed_shares` | 숫자 또는 null | 상장주식수(ETF는 상장좌수) |
| `nav` | 숫자 또는 null | **ETF만**: 1좌당 순자산가치(원) |
| `base_index` | 문자열 또는 null | **ETF만**: 기초지수 이름 |

- 파일 맨 위의 `etf_confirmed`가 `false`이면 ETF 목록을 아직 사람이 확인하지 않았다는 뜻이다.

```json
{ "id": "000000", "type": "reit", "name": "(종목 이름)", "close": 0, "base_date": "YYYY-MM-DD",
  "change": 0, "change_pct": 0.0, "volume": 0, "market_cap": 0, "listed_shares": 0 }
```

### 3-5. `dividends.json` — 주당배당금 🚧

- 출처: OpenDART "배당에 관한 사항"
- **주가 기준 배당수익률(%) = 최근 1년 주당배당금 ÷ 현재가(없으면 전일 종가) × 100**
  → 이 계산은 저장하지 않고 화면에서 `common.js` 함수로 한다(실시간 가격에도 쓸 수 있게).

| 필드 | 타입 | 설명 |
|---|---|---|
| `id` | 문자열 | 종목코드 |
| `name` | 문자열 | 리츠 이름 |
| `corp_code` | 문자열 또는 null | DART 고유번호 |
| `dps_annual` | 숫자 또는 null | 최근 1년 주당배당금 합계(원). 필요한 결산기 값이 하나라도 없으면 null |
| `dps_basis` | 문자열 | 위 값을 어떻게 구했는지, 또는 왜 못 구했는지 설명 |
| `period_months` | 3, 6, 12 또는 null | 결산 주기(개월) |
| `latest_period_end` | 문자열 또는 null | 가장 최근 결산기 `"YYYY-MM"` |
| `periods` | 배열 | 결산기별 주당배당금: `{ "period_end": "YYYY-MM", "dps": 숫자 또는 null, "from": "당기" 등, "rcept_no": "DART 접수번호" }` |

- `dps_annual`은 **과거에 실제로 지급한 금액**이다. 화면에는 "최근 1년 배당 기준"이라고 쓰고, 앞으로도 같다고 쓰지 않는다.

### 3-6. `savings.json` — 은행 예금·적금 금리 🚧

- 출처: 금융감독원 금융상품한눈에 Open API (은행권, 권역코드 020000)

| 필드 | 타입 | 설명 |
|---|---|---|
| `kind` | 문자열 | `"saving"`(적금) 또는 `"deposit"`(정기예금) |
| `bank` | 문자열 | 은행 이름 |
| `product` | 문자열 | 상품 이름 |
| `term_months` | 숫자 | 가입 기간(개월) |
| `rate_base` | 숫자 또는 null | 기본 금리(%) |
| `rate_max` | 숫자 또는 null | 최고 우대 금리(%) — 우대조건을 모두 채웠을 때 |
| `rate_type` | 문자열 또는 null | 단리/복리 |
| `reserve_type` | 문자열 또는 null | 적립 유형(적금만. 정액적립식/자유적립식) |
| `join_deny` | 숫자 또는 null | 가입제한: 1 제한없음, 2 서민전용, 3 일부제한 |
| `join_way`, `join_member` | 문자열 또는 null | 가입 방법, 가입 대상 |
| `special_condition` | 문자열 또는 null | 우대조건 설명 |
| `max_limit` | 숫자 또는 null | 최고한도(원) |
| `product_code` | 문자열 | 금융상품 코드 |
| `disclosure_month` | 문자열 또는 null | 공시 제출월 `"YYYY-MM"` |

- 한 상품이 가입 기간마다 한 줄씩 들어 있다(상품 × 기간). 금리는 모두 **세전**이다.
- 이 파일의 `as_of`는 날짜가 아니라 공시 제출월(`"YYYY-MM"`)이다.

### 3-7. `meta.json` — 데이터별 출처·기준일 🚧

```json
{
  "updated_at": "YYYY-MM-DDTHH:MM:SS+09:00",
  "files": {
    "prices": {
      "source": "(출처 이름)",
      "source_url": "(출처 주소)",
      "as_of": "YYYY-MM-DD",
      "fetched_at": "YYYY-MM-DDTHH:MM:SS+09:00",
      "count": 0,
      "note": "(주의할 점)"
    }
  }
}
```

- `files` 안의 열쇠는 파일 이름과 같다: `reits`, `assets`, `metrics`, `prices`, `dividends`, `savings`.
- 화면 하단의 "데이터 출처: ○○ (기준일 ○○)"는 이 파일에서 읽어서 만든다.

---

## 4. 공통 함수 (`js/common.js`) 🚧

> ⚠️ **계획 단계입니다.** Phase 2에서 실제로 만들고, Phase 4에서 이 목록을 최종본으로 고칩니다.
> 여기 없는 함수를 **지어내서 쓰지 마세요.** 필요하면 요청하세요(8장).

### 4-0. 사용 규칙 ✅

- 공통 함수는 전부 **`Common.` 으로 시작**한다. 예: `Common.formatWon(5800)`
- 모든 페이지는 아래 순서로 불러온다(공통이 먼저, 페이지 전용이 나중):
  ```html
  <link rel="stylesheet" href="css/style.css">
  ...
  <script src="js/common.js"></script>
  <script src="js/map.js"></script>   <!-- 페이지 전용 파일 -->
  ```
- 같은 기능을 페이지 파일에서 **다시 만들지 않는다**(숫자 포맷, 금지어 검사, 고지 문구 등은 반드시 `Common` 것을 쓴다).

### 4-1. 데이터 불러오기 🚧

| 함수 | 입력 | 출력 |
|---|---|---|
| `Common.loadData(name)` | `"reits"`, `"assets"`, `"metrics"`, `"prices"`, `"dividends"`, `"savings"`, `"meta"` 중 하나 | Promise → 파일 내용 전체(객체). 실패하면 `null` |
| `Common.loadAll(names)` | 이름 배열. 예: `["reits", "prices"]` | Promise → `{ reits: {...}, prices: {...} }` |
| `Common.findById(items, id)` | `items` 배열, 종목코드 | 그 `id`의 항목 하나. 없으면 `null` |

```js
// 사용 예시
const data = await Common.loadAll(["reits", "assets"]);
if (!data.assets) { /* "데이터 없음" 표시 */ }
data.assets.items.forEach(function (asset) { /* ... */ });
```

### 4-2. 숫자 포맷 🚧

값이 `null`이면 모두 `"데이터 없음"`을 돌려준다.

| 함수 | 입력 | 출력 예 |
|---|---|---|
| `Common.formatWon(n)` | 숫자(원) | `"5,800원"` |
| `Common.formatNumber(n)` | 숫자 | `"12,345"` |
| `Common.formatPercent(n, digits)` | 퍼센트 숫자, 소수 자릿수(기본 1) | `"5.2%"` |
| `Common.formatDate(s)` | `"YYYY-MM-DD"` | `"2026.11.13"` |

### 4-3. 생활 언어 번역 🚧

모두 `{ text, raw, note }` 모양의 객체를 돌려준다.
- `text`: 생활 언어 문구(크게 보여줌)
- `raw`: 원래 숫자(문구 아래 작은 글씨로 **항상 같이** 보여줌)
- `note`: 계산식·가정(작은 글씨)

| 함수 | 입력 | `text` 예 |
|---|---|---|
| `Common.translatePNav(pNav)` | P/NAV 숫자 | "1만 원어치 건물을 8천 원에 사는 셈" |
| `Common.translateWale(years)` | WALE(년) | "세입자들 계약이 평균 5년 넘게 남아 있어요" |
| `Common.translateDividend(yieldPct, monthlyWon)` | 주가 기준 배당수익률(%), 월 납입액(기본 50000) | "매달 5만 원씩 1년 넣으면 1년 배당은 약 ○원 (커피 ○잔)" |

- 입력이 `null`이면 `text`는 `"데이터 없음"`.
- ETF는 P/NAV·WALE가 없다 → `"해당 없음 (여러 리츠를 묶은 상품)"`으로 표시한다.

### 4-4. 계산 🚧

| 함수 | 입력 | 출력 |
|---|---|---|
| `Common.calcPriceYield(dpsAnnual, price)` | 최근 1년 주당배당금(원), 가격(원) | 주가 기준 배당수익률(%). 계산 불가면 `null` |
| `Common.distanceKm(lat1, lng1, lat2, lng2)` | 두 지점의 위도·경도 | 직선 거리(km) |

### 4-5. 타깃 🚧

| 이름 | 설명 |
|---|---|
| `Common.TARGETS` | 타깃 목록. 열쇠는 `"student"`(대학생), `"rookie"`(사회초년생), `"renter"`(월세 사는 1인가구) |
| `Common.getTarget()` | 저장된 타깃 열쇠. 없으면 `null` |
| `Common.setTarget(key)` | 타깃을 저장(localStorage, try/catch) |
| `Common.sortByTarget(products, key)` | 타깃별 **정렬 기준**대로 정렬한 새 배열 |

정렬 기준(화면에 공개한다) ✅

| 타깃 | 정렬 기준 | 이유 문구 |
|---|---|---|
| 대학생 | 1주 가격 낮은 순 | 소액으로 시작 |
| 사회초년생 | WALE 긴 순 | 안정성 |
| 월세 사는 1인가구 | 주가 기준 배당수익률 높은 순 | "월세 받는 쪽 되기" |

### 4-6. 금지어·고지 문구 🚧

| 이름 | 입력 | 출력 |
|---|---|---|
| `Common.BANNED_WORDS` | — | 금지어 배열(6장) |
| `Common.checkBannedWords(text)` | 문구 | `{ ok: true/false, found: ["걸린 금지어", ...] }` |
| `Common.renderHeader(activePage)` | `"index"`, `"map"`, `"compare"`, `"card"` | 공통 헤더(메뉴)를 넣는다 |
| `Common.renderFooter(sourceKeys)` | 이 페이지가 쓴 데이터 이름 배열. 예: `["prices", "dividends"]` | 고지 문구 + 출처·기준일을 넣는다 |
| `Common.getCardDisclaimer(sourceKeys)` | 데이터 이름 배열 | 홍보 카드 하단에 넣을 짧은 고지 문구(문자열) |

### 4-7. 페이지끼리 연결하는 주소 규칙 🚧

- 비교 화면으로 보낼 때: `compare.html?ids=종목코드,종목코드` (최대 3개)
  예: 지도 카드의 "비교하기" 버튼 → `compare.html?ids=` 뒤에 그 리츠의 `id`

### 4-8. 실시간 시세 (선택, Phase 5) 🚧

| 함수 | 출력 |
|---|---|
| `Common.getLivePrice(id)` | Promise → `{ price, time }`. 로컬 서버가 꺼져 있으면 `null` → 이때는 `prices.json`의 `close`를 쓴다 |

---

## 5. 디자인 규칙 (`css/style.css`) 🚧

> Phase 2에서 `style.css`를 만들면서 값이 조금 바뀔 수 있습니다. **변수 이름은 유지**합니다.

### 5-1. CSS 변수

```css
:root {
  /* 색 */
  --color-bg: #FBF7F2;           /* 페이지 배경 (크림) */
  --color-surface: #FFFFFF;      /* 카드 배경 */
  --color-text: #2A211B;         /* 본문 글자 (에스프레소) */
  --color-text-sub: #7B6E64;     /* 보조 글자 */
  --color-line: #E8DED3;         /* 테두리·구분선 */
  --color-primary: #6B4A32;      /* 대표색 (커피 브라운) */
  --color-primary-soft: #F1E6DA; /* 대표색 옅은 배경 */
  --color-accent: #E8743B;       /* 강조 (주요 버튼) */
  --color-good: #2F7D5C;         /* 장점 · 원금 보장(적금) */
  --color-risk: #C8402F;         /* 위험 · 경고 · 금지어 */

  /* 글자 */
  --font-base: "Pretendard", -apple-system, BlinkMacSystemFont,
               "Apple SD Gothic Neo", "Malgun Gothic", sans-serif;
  --fs-xs: 12px;   /* 출처·원래 숫자 */
  --fs-sm: 14px;
  --fs-md: 16px;   /* 본문 */
  --fs-lg: 20px;   /* 카드 제목·번역 문구 */
  --fs-xl: 28px;   /* 페이지 제목 */

  /* 간격 */
  --space-1: 4px;  --space-2: 8px;  --space-3: 12px;
  --space-4: 16px; --space-5: 24px; --space-6: 32px;

  /* 모양 */
  --radius: 14px;
  --radius-sm: 8px;
  --shadow: 0 2px 10px rgba(42, 33, 27, 0.08);
  --max-width: 1080px;
}
```

### 5-2. 규칙 ✅

- 색·글자 크기·간격은 **CSS 변수만** 쓴다. `#ff0000`, `17px` 같은 값을 직접 쓰지 않는다.
- 클래스 이름은 영어 소문자 + 하이픈(`kebab-case`). 예: `.btn-primary`
- **공통 클래스**(style.css에 있음, 아래 표)는 그대로 가져다 쓴다.
- **페이지 전용 클래스**는 앞에 페이지 이름을 붙인다. 공통 `.card`와 겹치지 않게 카드 생성기는 `cardgen-`을 쓴다.

  | 페이지 | 접두어 | 예 |
  |---|---|---|
  | index.html | `home-` | `.home-target-btn` |
  | compare.html | `cmp-` | `.cmp-column` |
  | map.html | `map-` | `.map-search-box` |
  | card.html | `cardgen-` | `.cardgen-preview` |

- B(팀원)는 `style.css`를 고칠 수 없으므로, 페이지 전용 스타일은 **자기 HTML 파일의 `<style>` 태그 안**에 쓴다(접두어 필수, 값은 CSS 변수로).
- 상태를 나타내는 클래스는 `is-`로 시작한다: `.is-active`, `.is-hidden`, `.is-disabled`

### 5-3. 공통 클래스 목록 🚧

| 클래스 | 용도 |
|---|---|
| `.container` | 페이지 가운데 정렬 + 좌우 여백 |
| `.card`, `.card-title` | 흰 카드 상자와 제목 |
| `.btn`, `.btn-primary`, `.btn-ghost` | 버튼 |
| `.badge`, `.badge-live` | 작은 배지 / "실시간" 배지 |
| `.chip` | 선택 칩(타깃·자산 유형 등) |
| `.translated` | 생활 언어 번역 문구(크게) |
| `.raw-note` | 번역 문구 아래 원래 숫자·계산식(작게) |
| `.source-note` | 출처·기준일(작게) |
| `.label-safe`, `.label-risk` | "원금 보장" / "원금 손실 가능" — **두 라벨은 같은 크기** |
| `.na` | "데이터 없음" 표시 |
| `.warn-box` | 빨간 경고 상자(금지어 등) |

---

## 6. 금지어와 고지 문구 ✅

### 6-1. 금지어 (투자광고에 쓰면 안 되는 표현)

```
보장, 무조건, 확정, 원금 보장, 대박, 100%, 안전한 투자, 절대
```

- 검사는 `Common.checkBannedWords(text)`로만 한다(직접 만들지 않는다).
- 띄어쓰기를 지우고 검사한다("원금보장", "안전한투자"도 걸린다).
- **적용 대상**: 홍보 카드 문구(card.html), 그리고 리츠·ETF를 설명하는 모든 화면 문구.
- `"원금 보장"`은 **은행 적금을 설명할 때만** 쓸 수 있다(compare.html의 적금 칸). 리츠·ETF에는 절대 붙이지 않는다.
- 카드 문구는 "보장되지 않습니다"처럼 부정문이어도 금지어에 걸린다. 위험은 **"원금 손실 가능"**이라고 쓴다.
- card.html: 사용자가 문구를 고치다가 금지어가 들어가면 **빨간 경고**를 띄우고 **다운로드 버튼을 비활성화**한다.

### 6-2. 표현 규칙

| 쓰지 않는다 | 이렇게 쓴다 |
|---|---|
| 추천, 추천 리츠 | **정렬 기준**, "○○ 순으로 정렬" |
| ~를 받습니다, ~를 법니다 (단정) | 최근 1년 배당 기준 약 ○원 (과거 실적이며 달라질 수 있어요) |
| 장점만 나열 | 장점과 위험을 **같은 크기**로 |
| 배당수익률 (라벨 없이) | "주가 기준" 또는 "자본금 기준"을 꼭 붙인다 |

### 6-3. 고지 문구

**모든 페이지 하단** (`Common.renderFooter`가 자동으로 넣는다):

```
본 사이트는 대학 수업 과제용이며 투자 권유가 아닙니다. 리츠·ETF는 원금 손실이 발생할 수 있습니다. 데이터 출처: ○○ (기준일 ○○)
```

**홍보 카드 하단** (`Common.getCardDisclaimer`가 만들어 준다) 🚧 문구는 Phase 2에서 확정:

```
수업 과제용 · 투자 권유 아님 · 리츠·ETF는 원금 손실 가능 · 출처: ○○ (기준일 ○○)
```

- ○○ 부분은 `data/meta.json`의 실제 출처·기준일로 채운다. 직접 써넣지 않는다.

---

## 7. git 규칙 ✅

1. **작업 시작 전에 항상** `git pull`
2. 작업이 끝나면 **바로** `git add` → `git commit` → `git push` (며칠씩 쌓아두지 않는다)
3. **남의 담당 파일은 수정하지 않는다.** 필요하면 요청한다(8장).
4. 커밋 메시지: **`[이름] 무엇을 했는지`**
   예: `[홍길동] 지도 검색창과 반경 조절 추가`
5. `git add`는 **자기 담당 파일만** 한다. 예: `git add map.html js/map.js`
   (`git add .` 은 남의 파일이 섞일 수 있으니 쓰지 않는다)
6. `.env` 파일은 절대 올리지 않는다(`.gitignore`에 등록되어 있다).
7. push가 거부되면 당황하지 말고 `git pull` 먼저 한 뒤 다시 `git push`.

---

## 8. 공통 파일을 바꾸고 싶을 때 ✅

B(팀원)가 `style.css`, `common.js`, `data/*.json`에 무언가 필요할 때:

1. 직접 고치지 않는다.
2. 팀 채팅방에 이렇게 요청한다:
   > [공통 요청] `common.js`에 ○○하는 함수가 필요해요. 입력은 ○○, 출력은 ○○. 이유: ○○
3. A가 공통 파일을 고치고 push한 뒤, **이 문서(4장·5장·3장)도 같이 고친다.**
4. B는 `git pull` 후에 사용한다.

---

## 9. 이 문서를 읽는 AI(ChatGPT 등)에게 ✅

- 당신은 이 프로젝트의 저장소를 볼 수 없습니다. **이 문서에 없는 필드·함수·클래스를 지어내지 마세요.** 필요하면 사용자에게 해당 파일(`data/*.json`의 앞부분, `js/common.js`)을 붙여달라고 요청하세요.
- 수정할 수 있는 파일은 사용자의 담당 파일뿐입니다(2장). 공통 파일을 바꿔야 하면 코드를 주지 말고 8장의 요청 문구를 써 주세요.
- 사용자는 코딩 초보입니다. 답은 **"어느 파일을 통째로 무엇으로 바꾸는지"** 로 주세요(파일 전체 코드). 설명은 쉬운 한국어, 주석도 한국어.
- 이 문서의 예시 값은 실제 데이터가 아닙니다. 코드에 숫자·이름·주소를 직접 써넣지 말고 반드시 `Common.loadData()`로 읽으세요.
- 프레임워크·라이브러리·빌드 도구를 제안하지 마세요(1장).
