# 인수인계 문서 — "리츠 투자" 웹사이트 (대학 수업 팀 과제)

너는 이 프로젝트를 이어받는 개발자야. 사용자는 코딩 초보인 대학생이니까 설명은 쉬운 한국어로, 한 번에 하나씩 해.
이 문서는 **지금 레포의 코드 기준**으로 적었어(2026-11-24). 코드와 이 문서가 다르면 코드가 맞아.
`docs/old/`, `AUDIT_PHASE3.md`, `PREDEPLOY_FIXES.md` 는 지난 작업 기록이라 지금 기준이 아니야.

- 레포: `pjh26-hub/reits-investment` (기본 브랜치 `main`)
- 공개 링크(GitHub Pages): https://pjh26-hub.github.io/reits-investment/
- 이 링크로 결과물을 제출하고, 발표 때도 이 링크를 열어서 설명해.

## 1. 프로젝트 요약

- 대학 '부동산 프롭테크' 수업 팀 과제. 상위 주제는 "부동산 마케팅". 학생들이 폰으로 링크에 들어와 평가해.
- 문제: 리츠 정보 사이트는 전부 리츠를 이미 아는 투자자용이야. 2030은 리츠 자체를 몰라.
- 해결: 같은 데이터를 "내 얘기"로 번역해 주는 사이트. 타깃은 대학생 / 사회초년생 / 월세 사는 1인가구.
- 차별점: ① 장소에서 상품으로(지도) ② 숫자를 생활 언어로(적금과 정직하게 비교) ③ 타깃별 홍보 카드(금지 표현 자동 차단)

## 2. 절대 규칙

1. **가짜 데이터 금지.** 교수님이 가상 데이터를 싫어하셔. 숫자·이름·주소를 코드에 직접 쓰지 마. 반드시 `data/*.json` 에서 읽어. 값이 없으면(null) "데이터 없음"으로 표시해. 0이나 임의 값으로 채우지 마.
2. **투자 권유 금지.** "추천" 대신 "정렬 기준"이라고 써. 좋은 점과 위험을 같은 크기로 보여줘. "원금 손실 가능"(리츠)과 "원금 보장"(적금) 라벨은 같은 크기야.
3. **금지어**: 보장, 무조건, 확정, 원금 보장, 대박, 100%, 안전한 투자, 절대. 검사는 `Common.checkBannedWords()` 만 써. ("원금 보장"은 은행 적금 설명에만)
4. **순수 HTML/CSS/JavaScript만.** React·jQuery·Tailwind·npm·빌드 도구 금지. 외부에서 불러오는 것은 웹폰트(Pretendard)와 지도 라이브러리(Leaflet)뿐.
5. **경로는 상대 경로**(`data/reits.json`). `/` 로 시작하면 GitHub Pages에서 깨져.
6. **공통 파일**(`css/style.css`, `js/common.js`, `data/*`, `scripts/*`, `.github/*`)을 바꿀 때는 무엇을 왜 바꿨는지 사용자에게 말해. 같은 기능을 페이지 파일에서 다시 만들지 마(숫자 포맷·번역·금지어·고지 문구는 `Common` 것을 써).
7. **색·글자 크기·간격은 CSS 변수만** 써. `#ff0000`, `17px` 같은 값을 직접 쓰지 마. 페이지 전용 스타일은 그 HTML의 `<style>` 안에, 클래스 앞에 접두어(`home-`, `cmp-`, `map-`, `learn-`, `cardgen-`)를 붙여.
8. 숫자가 나오는 화면에는 출처와 기준일이 보여야 해. 꼬리말은 `Common.initPage({ sources: [...] })` 가 자동으로 넣어.
9. 모바일 우선. 폭 360px에서 가로 스크롤이 생기면 안 돼.
10. 코드 주석은 한국어. 파일은 UTF-8.
11. 데이터를 innerHTML 에 넣을 때는 꼭 `Common.escapeHtml()` 을 써.
12. 지도 장소 검색 결과는 어디에도 저장하지 마(localStorage 포함).
13. API 주소·파라미터·응답 항목을 모르면 추측하지 말고, 공식 문서를 보거나 `--peek` 로 실제 응답을 한 번 출력해 보고 코드를 짜.
14. **공개 링크에는 전날 종가만.** 한국투자증권(KIS) 등 증권사 Open API 시세는 공개 사이트에 다시 내보내면 안 될 수 있어서 쓰지 않아(2026-11-23 팀 결정).
15. **비밀 키는 `.env`(내 컴퓨터)나 GitHub Secrets 에만.** 코드·커밋·채팅에 키를 넣지 마. `.env` 는 `.gitignore` 에 들어 있어.
16. **커밋·푸시 전에는 사용자에게 물어봐.** 커밋 메시지는 `[이름] 무엇을 했는지`. 작업 전에 항상 `git pull`.

## 3. 지금 상태 (2026-11-24, 커밋 972cdc6)

### 화면 (전부 공개 링크에서 확인함)
| 파일 | 내용 |
|---|---|
| `index.html` | 타깃 3종 선택 → 정렬 기준 공개 → 리츠 목록. 국내(리츠 23 + 리츠 ETF 3) / 해외(미국 리츠 10) 전환, 가격·등락률, 최근 1년 주가 그래프, 생활 언어 문구, 배당수익률 15% 이상 주의 문구. 상단 배너 2개는 공식 정보(국토부 리츠정보시스템, 금융감독원 금융상품한눈에) |
| `compare.html` + `js/compare.js` | 최대 3개 + 맨 오른쪽 은행 적금. 배당·P/NAV·WALE 번역, 계산식, 좋은 점/조심할 점, 주가 그래프 |
| `map.html` + `js/map.js` | Leaflet + OpenStreetMap. 국내 리츠 건물 / 해외 리츠 본사·대표 자산 전환, 장소 검색(Nominatim), 반경 원, 가까운 순 카드 |
| `learn.html` + `js/learn.js` | 용어 20개 (쉬운 뜻·계산식·조심할 점·실제 숫자 예시) |
| `card.html` + `js/card.js` | 타깃·리츠 선택 → 문구 → 1080×1080 카드 → PNG 받기, 금지어가 들어가면 빨간 경고 + 받기 버튼 꺼짐 |

### 데이터와 자동 갱신
| 파일 | 내용 | 출처 / 갱신 |
|---|---|---|
| `reits.json` `metrics.json` `assets.json` | 국내 상장 리츠 23개, 지표, 건물 53곳(좌표 44곳) | 국토교통부 리츠정보시스템 공개 화면(11/14~15). 손으로 갱신 |
| `prices.json` | 가격·등락률·시가총액 (국내 23 + ETF 3 + 미국 10) | **국내·ETF: 금융위원회 시세(공공데이터포털) 전일 종가, 평일 자동 갱신.** 미국: Finnhub 키가 있을 때만 자동, 없으면 11/13 값 유지 |
| `prices_fallback.json` | `prices.json` 을 못 읽을 때 쓰는 저장본 | 11/13 종가 (야후 파이낸스, 비공식) |
| `history.json` | 최근 1년 종가 (그래프용) | 11/13까지 야후(며칠 간격), 그 뒤 자동 갱신이 매일 종가를 붙임 |
| `dividends.json` | 최근 1년 주당배당금 | 국내 리츠: OpenDART 주 1회 자동(DART 키가 있을 때). ETF·미국: 야후(11/15, 비공식) |
| `savings.json` | 은행 적금 17개 | 금융감독원 금융상품한눈에 공개 화면(11/15) |
| `global_properties.json` | 해외 리츠 대표 보유 자산 21곳 | 각 리츠·운영사 공개 자료(항목별 출처 URL) |
| `glossary.json` `ads.json` `assumptions.json` | 용어, 광고 목록(쿠팡 파트너스 iframe 배너 5개(첫 화면 맨 아래 포함), 칸마다 다른 광고, 쿠팡 광고엔 대가성 문구 자동 표시), 커피값 가정(4,700원, 2025-01-24 기준) | 팀 작성 |
| `meta.json` | 파일별 출처·기준일 (꼬리말에 표시) | 스크립트가 기록 |

**GitHub Actions** (`.github/workflows/`)
| 워크플로 | 언제 | 하는 일 | 필요한 Secret |
|---|---|---|---|
| `update-prices.yml` "리츠 시세 자동 갱신" | 평일 14:30·18:30 (한국 시간), 수동 실행 가능 | `scripts/update_prices.py` → `prices.json`, `history.json`, `meta.json` 커밋 | `DATA_GO_KR_KEY` (필수), `FINNHUB_API_KEY` (선택) |
| `update-dividends.yml` "국내 리츠 배당 자동 갱신" | 매주 월 07:00, 수동 실행 가능 | `scripts/fetch_dividends.py` → `dividends.json`, `meta.json` 커밋 | `DART_API_KEY` (없으면 건너뜀) |

- **Secrets 는 레포 주인(pjh26-hub)만 넣을 수 있어.** Settings → Secrets and variables → Actions → New repository secret.
- 전일 종가는 다음 영업일 오후 1시 이후에 올라와. 그래서 화면에는 보통 "어제 종가"가 보여.
- **아직 실제 키로 한 번도 안 돌려봤어**(가짜 응답 시험만 통과). 키를 넣고 처음 돌릴 때 로그를 꼭 봐.

### 알고 있어야 하는 한계
- 국내 리츠 8개는 배당이 "데이터 없음"(야후 배당 건수가 결산 횟수와 안 맞으면 합계를 안 냄). DART 키가 생기면 채워질 수 있어.
- 리츠 11개는 자회사·해외 건물로 갖고 있어서 `assets.json` 에 건물이 없어.
- 해외 리츠 10개 = S&P 500 안의 리츠 중 시가총액 상위 10개. Public Storage 본사는 2026년 2월 이전 발표를 반영해 Frisco, Texas.
- P/NAV 는 리츠정보시스템 원자료를 그대로 못 써서 `시가총액 ÷ NAV` 로 직접 계산해(`Common.calcPNav`).
- 미국 리츠는 Finnhub 무료 키가 '개인 용도' 조건이라, 공개 사이트에 쓸지는 팀이 정해(지금은 키 없이 11/13 값).
- `common.js` 의 `isLiveMode`·`getLivePrice` 는 예전 "발표 노트북 실시간" 계획용으로 남아 있는데, 지금은 안 써.

## 4. 폴더 구조

```
reits-investment/
├─ index.html      첫 화면 (스크립트는 파일 안에 있음)
├─ compare.html    비교            → js/compare.js
├─ map.html        지도            → js/map.js
├─ learn.html      용어 배우기      → js/learn.js
├─ card.html       홍보 카드        → js/card.js
├─ css/style.css   공통 디자인 (CSS 변수)
├─ js/common.js    공통 함수 (모든 페이지가 먼저 불러옴)
├─ data/           화면이 읽는 JSON + raw/(공개 화면에서 옮겨 적은 원본)
├─ scripts/
│   ├─ update_prices.py    ★ 시세 자동 갱신 (Actions 가 실행)
│   ├─ fetch_dividends.py  ★ 국내 리츠 배당 (Actions 가 실행)
│   ├─ build_public.py     키 없이 받는 데이터로 전체 다시 만들기 (손으로 실행. --etf-only 는 ETF 만)
│   ├─ etf_confirmed.json  사이트에 넣는 리츠 ETF 목록
│   ├─ _util.py            스크립트 공통 도구 (API 호출, JSON 저장, meta 기록)
│   └─ build_all.py 외     예전 공식 API 계획용 (지금 안 씀)
├─ .github/workflows/      자동 갱신 2개
├─ requirements.txt  .gitignore  .env.example
└─ README.md  HANDOFF_PROMPT.md(이 문서)
```

모든 HTML은 이 순서로 불러와: `css/style.css` → (페이지 `<style>`) → `js/common.js` → 페이지 js.
페이지 js는 맨 처음에 `Common.initPage({ active: "map", sources: ["assets", "prices"] })` 를 한 번 불러(머리말·꼬리말·용어 말풍선·광고 칸).

## 5. 꼭 알아야 하는 공통 함수 (`js/common.js`, 전부 `Common.` 으로 시작)

- 데이터: `loadData(name)`, `loadAll([names])` → 없으면 null. `prices` 를 못 읽으면 `prices_fallback` 을 대신 읽고 `isFallback: true` 를 붙여.
- `buildProducts(data)` → 상품 배열. 상품 한 개의 값:
  `key, id, type("reit"|"etf"|"global"), name, assetType, price(원), priceDate, priceKind("현재가"|"종가"), priceTime, changePct, yearlyChangePct, priceLocal(달러), currency, country, hq, hqLat, hqLng, hqNote, history, marketCap, dpsAnnual, dpsBasis, priceYield(주가 기준 배당수익률 %), capitalYield, capitalYieldAnnualized, pNav(직접 계산), pNavReported, navMillionWon, waleYears, assetCount`
- 포맷: `formatWon`, `formatNumber`, `formatPercent`, `formatDate`, `formatDateTime`, `formatUsd`, `formatChange(pct)` → `{text, cls}`
- 시세 기준: `formatPriceBasis(product)` → "2026.11.21 종가" 같은 글자, `priceKindLabel`, `metaForPrices(meta, prices)`(저장본을 쓰는 중이면 꼬리말 출처도 저장본으로)
- 계산: `calcPriceYield`, `calcPNav`, `calcInstallmentIncome(월납입, 수익률, 개월)`, `distanceKm`
- 번역(→ `{text, raw, note}`): `translatePNav`, `translateWale`, `translateDividend(수익률, 월납입, 커피값)` (+ `caution`, `firstYearWon`, `cups`)
- 그래프: `sparkline(points, {width, height})` → `{svg, changePct, from, to}`. 가로 위치는 날짜 기준
- 적금: `getBestSaving(savings)` → `{item, rule}`
- 타깃: `TARGETS`, `getTarget()`, `setTarget(key)`, `sortByTarget(products, key)` (student: 가격 낮은 순 / rookie: WALE 긴 순 / renter: 배당수익률 높은 순)
- 규정: `BANNED_WORDS`, `checkBannedWords(text)` → `{ok, found}`, `DISCLAIMER`, `getSourceText(meta, keys)`, `getCardDisclaimer(meta, keys)`
- 화면: `initPage`, `termHtml(용어id, 글자)`, `initTerms`, `renderAds()`, `escapeHtml`, `getQueryIds()`
- 상수: `NA`("데이터 없음"), `NA_ETF`, `NA_GLOBAL`, `COFFEE`·`applyAssumptions(data)`(커피값 가정은 `data/assumptions.json`), `MONTHLY_DEFAULT`, `YIELD_CAUTION_PCT`(15)
- 페이지 연결: 비교 화면은 `compare.html?ids=종목코드,종목코드` (최대 3개)

## 6. 이어서 할 일 (위에서부터)

1. **자동 갱신 실제로 돌려보기** (레포 주인이 해야 함)
   - 공공데이터포털(data.go.kr) 가입 → "금융위원회_주식시세정보", "금융위원회_증권상품시세정보" 두 API **활용신청** → 마이페이지에서 일반 인증키 확인.
   - 레포 Settings → Secrets and variables → Actions → New repository secret → 이름 `DATA_GO_KR_KEY`.
   - Actions 탭 → "리츠 시세 자동 갱신" → Run workflow → 로그 확인.
   - 성공 기준: 새 커밋 "chore(data): 리츠 시세 자동 갱신 …" 이 생기고, `data/prices.json` 의 `as_of` 가 최근 평일, `source` 에 "금융위원회", 국내 종목의 `price_kind` 가 "종가", `history.json` 끝에 새 날짜가 붙음. 공개 링크 첫 화면 가격 옆 날짜가 바뀜.
   - 실패하면: 로그의 `[실패]` 줄을 읽고, 내 컴퓨터에서 `.env` 에 같은 키를 넣고 `python scripts/update_prices.py --peek --dry-run` 으로 실제 응답 모양을 확인해서 고쳐. 키 승인 직후에는 "등록되지 않은 키" 오류가 잠깐 날 수 있어(시간이 지나면 풀림).
   - GitHub 서버(해외)에서 공공데이터포털 접속이 막히면(연결 실패·시간 초과가 반복) 사용자에게 알려. 대안: 한국 컴퓨터에서 스크립트를 돌려 커밋.
2. **(선택) 배당 자동 갱신**: OpenDART 키를 받으면 Secret `DART_API_KEY` 를 넣고 "국내 리츠 배당 자동 갱신" 을 Run workflow. `fetch_dividends.py` 도 실제 API로는 처음이라 로그를 확인해.
3. **(선택) 미국 리츠**: Finnhub 를 쓸지 팀이 정하면 Secret `FINNHUB_API_KEY` 추가.
4. **실기기 점검**: 아이폰 Safari / 안드로이드 크롬에서 홍보 카드 PNG 저장, 360px 화면, 지도 동작.
5. **발표 전 최종 점검**: 공개 링크에서 5개 화면, 꼬리말 출처·기준일, 금지어 없는지.

작업할 때: 한 번에 하나씩 하고, 끝날 때마다 바꾼 파일·이유·사용자가 화면에서 확인하는 방법을 짧게 알려줘. 화면이 안 바뀌면 브라우저에서 Ctrl+Shift+R(강력 새로고침).

## 7. 로컬에서 보기 / 데이터 스크립트

```bash
python -m http.server 8000
```

→ `http://localhost:8000` (HTML을 더블클릭해서 열면 데이터가 안 보여)

```bash
pip install -r requirements.txt
```

```bash
python scripts/update_prices.py --peek --dry-run
```

(`.env.example` 을 `.env` 로 복사해 키를 넣은 뒤. `--dry-run` 은 저장하지 않음)

## 8. 디자인 변수 (css/style.css 의 :root)

어두운 증권 앱 느낌(어두운 배경, 둥근 패널, 굵은 숫자, 파랑 포인트, 오르면 빨강·내리면 파랑).
- 색: `--color-bg` `--color-surface` `--color-surface-2` `--color-text` `--color-text-sub` `--color-line` `--color-primary`(파랑) `--color-primary-soft` `--color-accent`(빨강) `--color-gold` `--color-label` `--color-good`/`-soft` `--color-risk`/`-soft` `--color-up` `--color-down` `--color-on-primary`
- 글자: `--font-base` `--fs-xxs` `--fs-xs` `--fs-sm` `--fs-md` `--fs-lg` `--fs-xl` `--fs-section` `--fs-price` `--fs-hero`, 자간 `--tracking-*`
- 간격·크기: `--space-1`~`--space-6`, 고정 길이는 `--dim-숫자`(예: `--dim-44` = 44px), `--radius` `--radius-sm` `--max-width`
- 공통 클래스: `.container .section .stack .grid .grid-2 .grid-3 .card .card-title .card-sub .btn .btn-primary .btn-ghost .chip .chip-row .badge .translated .raw-note .source-note .caution-note .na .label-safe .label-risk .note-box .warn-box .notice .table .table-wrap .field .field-label .input .select .textarea .term .ad-slot .chapter .chapter-tag .page-title .lead .sec-title .sec-no .hero .spark .num-up .num-down .is-hidden .is-active`
