# 인수인계 프롬프트 — "리츠 투자" 웹사이트 (대학 수업 팀 과제)

너는 이 프로젝트를 이어받는 개발자야. 나는 코딩 초보인 대학생이고, 설명은 쉬운 한국어로 해줘.
이 파일 하나에 규칙·현재 상태·할 일·모든 코드와 데이터가 들어 있어. 끝까지 읽고 시작해.

## 0. 제일 먼저 할 일 (파일 복원)

이 사이트는 아직 인터넷에 올라가 있지 않아(배포 전, GitHub 저장소도 없음). 그래서 코드를 여기에 전부 넣었어.

1. 빈 폴더 `coffee-landlord` 를 만들어.
2. 이 파일 맨 아래 "9. 파일 전체" 에 있는 블록을 하나씩 그대로 파일로 만들어.
   - 블록은 `<<<FILE: 경로>>>` 로 시작해서 `<<<END FILE>>>` 로 끝나. 그 사이 내용을 한 글자도 바꾸지 말고 저장해. (UTF-8)
   - 이미 같은 폴더(압축 파일을 푼 것)가 있으면 이 단계는 건너뛰어.
3. 폴더에서 `python -m http.server 8000` 을 실행하고 브라우저로 `http://localhost:8000` 을 열어 5개 화면이 뜨는지 확인해.
   (HTML을 더블클릭해서 열면 데이터가 안 보여. 꼭 이렇게 서버로 열어야 해.)
4. 확인이 끝나면 "지금 상태를 이렇게 이해했다"를 5줄로 요약하고, 아래 "6. 네가 이어서 할 일"의 순서를 제안해. 내가 "시작"이라고 하면 작업해.

## 1. 프로젝트 요약

- 대학 '부동산 프롭테크' 수업 팀 과제. 상위 주제는 "부동산 마케팅". 발표에서 시연하고 학생들이 폰으로 접속해 평가해.
- 문제: 리츠 정보 사이트는 많지만 전부 리츠를 아는 투자자용이야. 2030은 리츠 자체를 몰라.
- 해결: 같은 데이터를 "내 얘기"로 번역해 주는 마케팅 사이트. 타깃은 대학생 / 사회초년생 / 월세 사는 1인가구.
- 차별점: ① 장소에서 상품으로(지도) ② 숫자를 생활 언어로(적금과 정직하게 비교) ③ 타깃별 홍보 카드(금지 표현 자동 차단)
- 사이트 이름은 **"리츠 투자"** (예전 이름 "커피값 건물주"는 쓰지 않아. 폴더 이름만 coffee-landlord)

## 2. 절대 규칙

1. **가짜 데이터 금지.** 교수님이 가상 데이터를 싫어하셔. 숫자·이름·주소를 코드에 직접 쓰지 마. 반드시 `data/*.json` 에서 읽어. 값이 없으면(null) "데이터 없음"으로 표시해. 0이나 임의 값으로 채우지 마.
2. **투자 권유 금지.** "추천"이라는 말 대신 "정렬 기준"이라고 써. 좋은 점과 위험을 같은 크기로 보여줘. "원금 손실 가능"(리츠)과 "원금 보장"(적금) 라벨은 같은 크기야.
3. **금지어**: 보장, 무조건, 확정, 원금 보장, 대박, 100%, 안전한 투자, 절대. 검사는 `Common.checkBannedWords()` 만 써. 리츠 설명 문구에 이 말들을 쓰지 마. ("원금 보장"은 은행 적금 설명에만)
4. **순수 HTML/CSS/JavaScript만.** React·jQuery·Tailwind·npm·빌드 도구 금지. 외부에서 불러오는 것은 웹폰트(Pretendard)와 지도 라이브러리(Leaflet)뿐.
5. **경로는 상대 경로**(`data/reits.json`). `/` 로 시작하면 GitHub Pages에서 깨져.
6. **공통 파일**(`css/style.css`, `js/common.js`, `data/*`, `scripts/*`)을 바꿀 때는 무엇을 왜 바꿨는지 나에게 먼저 말해. 같은 기능을 페이지 파일에서 다시 만들지 마(숫자 포맷·번역·금지어·고지 문구는 Common 것을 써).
7. **색·글자 크기·간격은 CSS 변수만** 써(`var(--color-primary)` 등). `#ff0000`, `17px` 같은 값을 직접 쓰지 마. 페이지 전용 스타일은 그 HTML의 `<style>` 안에, 클래스 앞에 접두어(`home-`, `cmp-`, `map-`, `learn-`, `cardgen-`)를 붙여.
8. 숫자가 나오는 화면에는 출처와 기준일이 보여야 해. 꼬리말은 `Common.initPage({ sources: [...] })` 가 자동으로 넣어.
9. 모바일 우선. 폭 360px에서 가로 스크롤이 생기면 안 돼.
10. 코드 주석은 한국어. 파일은 UTF-8.
11. 데이터를 innerHTML 에 넣을 때는 꼭 `Common.escapeHtml()` 을 써.
12. 지도 장소 검색 결과는 어디에도 저장하지 마(localStorage 포함).
13. API 주소·파라미터·응답 항목을 모르면 추측하지 말고, 공식 문서를 확인하거나 실제 응답을 한 번 출력해 보고 코드를 짜.

## 3. 지금 상태 (2026-11-15)

### 된 것 (브라우저에서 확인함)
- `index.html` 첫 화면: 타깃 3종 선택(선택 저장) → 정렬 기준 공개 → 리츠 목록. **국내/해외 전환 버튼**, 가격·등락률, **최근 1년 주가 그래프**, 생활 언어 문구, 배당수익률 15% 이상 주의 문구.
- `compare.html` 비교: 최대 3개 + 맨 오른쪽 은행 적금. 배당·P/NAV·WALE 번역, 계산식, 좋은 점/조심할 점, 주가 그래프.
- `map.html` 지도: Leaflet + OpenStreetMap(키 필요 없음). **국내 리츠 건물 / 해외 리츠 본사 전환**, 장소 검색(Nominatim), 반경 원, 가까운 순 카드, 없으면 가장 가까운 3곳.
- `learn.html` 용어 배우기: 용어 20개(쉬운 뜻·계산식·조심할 점·실제 숫자 예시), 찾기·분류. 다른 화면의 점선 밑줄 용어를 누르면 말풍선.
- `card.html` 홍보 카드: 타깃·리츠 선택 → 문구 → 1080×1080 카드 미리보기 → PNG 받기, 금지어가 들어가면 빨간 경고 + 받기 버튼 꺼짐. (**기본 뼈대만 있음 — 아래 할 일 참고**)
- 광고 칸 틀: `<div class="ad-slot ad-slot--banner" data-ad="이름"></div>`. `data/ads.json` 이 비어 있으면 "광고 자리" 틀만 보여.
- 디자인: 어두운 증권 앱 느낌(어두운 배경, 둥근 패널, 굵은 숫자, 파랑 포인트, 오르면 빨강·내리면 파랑).

### 데이터 (전부 실제 값. `python scripts/build_public.py` 로 다시 만들 수 있음)
| 파일 | 내용 | 출처 |
|---|---|---|
| `reits.json` | 국내 상장 리츠 23개 | 국토교통부 리츠정보시스템 공개 화면 + 한국거래소 KIND 상장법인목록(종목코드) |
| `metrics.json` | 배당수익률(자본금 기준), NAV, FFO, WALE 등 | 리츠정보시스템 상장리츠현황 화면 |
| `assets.json` | 리츠가 직접 가진 건물 53곳(좌표 44곳) | 리츠정보시스템 GIS 지도 화면 |
| `prices.json` | 종가·등락률·시가총액. 국내 23 + 해외(미국) 10 | 야후 파이낸스 차트(비공식) |
| `dividends.json` | 최근 1년 주당배당금 | 야후 파이낸스(비공식) |
| `history.json` | 최근 1년 종가 기록(그래프용) | 야후 파이낸스(비공식) |
| `savings.json` | 은행 적금 17개(12개월·정액적립식·가입제한 없음) | 금융감독원 금융상품한눈에 공개 화면 |
| `glossary.json` | 용어 20개 | 팀 작성 |
| `ads.json` | 광고 목록(지금은 비어 있음) | 팀 직접 등록 |
| `meta.json` | 파일별 출처·기준일 | 스크립트가 기록 |

### 알고 있어야 하는 한계
- 가격·배당·그래프는 **공식 API가 아니라 야후 파이낸스**야(공식 API 키를 아직 못 받음). 화면에 출처가 그대로 표시돼. 키가 생기면 `scripts/build_all.py`(공공데이터포털·OpenDART·금융상품한눈에 공식 API용, 작성만 하고 실제 실행은 못 해 봄)로 바꿀 예정.
- 국내 리츠 8개는 배당이 "데이터 없음"이야. 야후의 배당 건수가 리츠정보시스템의 결산 횟수와 안 맞으면 합계를 내지 않게 했어(틀린 값 방지).
- 리츠 11개는 자회사 리츠나 해외 건물을 통해 갖고 있어서 `assets.json` 에 건물이 없어.
- 해외 리츠 10개는 "S&P 500에 들어 있는 리츠 중 시가총액 상위 10개"야. 건물이 수천 곳이라 지도에는 본사가 있는 도시만 표시해.
- P/NAV는 리츠정보시스템 원자료(0.0079 같은 값)를 그대로 못 써서 `시가총액 ÷ NAV` 로 직접 계산해(`Common.calcPNav`).
- WALE이 0으로 적힌 리츠는 "데이터 없음"으로 처리해.
- 적금 칸의 우대조건 내용은 데이터에 없어.
- 리츠 ETF는 아직 없어(어떤 ETF를 넣을지 팀이 정해야 함).
- `docs/old/` 폴더의 문서(예전 README·CONVENTIONS·TEAM_GUIDE)는 **예전 내용**이야(디자인·함수 이름·데이터 출처가 지금과 달라). 이 프롬프트와 실제 코드가 기준이야.

## 4. 폴더 구조

```
coffee-landlord/
├─ index.html      첫 화면 (스크립트는 파일 안에 있음)
├─ compare.html    비교            → js/compare.js
├─ map.html        지도            → js/map.js
├─ learn.html      용어 배우기      → js/learn.js
├─ card.html       홍보 카드        → js/card.js
├─ css/style.css   공통 디자인 (CSS 변수)
├─ js/common.js    공통 함수 (모든 페이지가 먼저 불러옴)
├─ data/           화면이 읽는 JSON + raw/(공개 화면에서 옮겨 적은 원본)
├─ scripts/        데이터 스크립트 (파이썬)
│   ├─ build_public.py   ★ 지금 쓰는 것: 키 없이 받는 데이터로 data/*.json 생성
│   ├─ build_all.py 외   공식 API용(키 필요, 실제 실행 전)
│   └─ _util.py          스크립트 공통 도구
├─ requirements.txt (requests, openpyxl)   .gitignore   .env.example
```

모든 HTML은 이 순서로 불러와: `css/style.css` → (페이지 `<style>`) → `js/common.js` → 페이지 js. 페이지 js는 맨 처음에 `Common.initPage({ active: "map", sources: ["assets", "prices"] })` 를 한 번 불러(머리말·꼬리말·용어 말풍선·광고 칸).

## 5. 꼭 알아야 하는 공통 함수 (`js/common.js`, 전부 `Common.` 으로 시작)

- 데이터: `loadData(name)`, `loadAll([names])` → 없으면 null. `buildProducts(data)` → 상품 배열. 상품 한 개의 값:
  `key, id, type("reit"|"etf"|"global"), name, assetType, price(원), priceDate, changePct, priceLocal(달러), currency, country, hq, hqLat, hqLng, history, marketCap, dpsAnnual, dpsBasis, priceYield(주가 기준 배당수익률 %), capitalYield, capitalYieldAnnualized, pNav(직접 계산), pNavReported, navMillionWon, waleYears, assetCount`
- 포맷: `formatWon`, `formatNumber`, `formatPercent`, `formatDate`, `formatUsd`, `formatChange(pct)` → `{text, cls}`
- 계산: `calcPriceYield`, `calcPNav`, `calcInstallmentIncome(월납입, 수익률, 개월)`, `distanceKm`
- 번역(→ `{text, raw, note}`): `translatePNav`, `translateWale`, `translateDividend(수익률, 월납입, 커피값)` (+ `caution`, `firstYearWon`, `cups`)
- 그래프: `sparkline(points, {width, height})` → `{svg, changePct, from, to}`
- 적금: `getBestSaving(savings)` → `{item, rule}`
- 타깃: `TARGETS`, `getTarget()`, `setTarget(key)`, `sortByTarget(products, key)` (student: 가격 낮은 순 / rookie: WALE 긴 순 / renter: 배당수익률 높은 순)
- 규정: `BANNED_WORDS`, `checkBannedWords(text)` → `{ok, found}`, `DISCLAIMER`, `getSourceText(meta, keys)`, `getCardDisclaimer(meta, keys)`
- 화면: `initPage`, `termHtml(용어id, 글자)`, `renderAds()`, `escapeHtml`, `getQueryIds()`
- 상수: `NA`("데이터 없음"), `NA_ETF`, `NA_GLOBAL`, `COFFEE`(4,700원 가정과 출처), `MONTHLY_DEFAULT`, `YIELD_CAUTION_PCT`(15)
- 페이지 연결: 비교 화면은 `compare.html?ids=종목코드,종목코드` (최대 3개)

## 6. 네가 이어서 할 일 (위에서부터)

1. **홍보 카드 완성 (`js/card.js`, `card.html`)** — 파일 안에서 "TODO" 로 검색
   - TODO 1: 타깃마다 문구를 3안으로 늘리기(지금 1안씩). 숫자는 data 값만, 값이 null 이거나 주의가 붙은 리츠는 그 문구를 만들지 않기.
   - TODO 2: 카드 디자인 다듬기(사이트와 같은 어두운 분위기, CSS 변수 색 사용).
   - TODO 3: 긴 문구가 카드 밖으로 나가지 않게 글자 크기 자동 조절.
   - TODO 4: 휴대폰에서 PNG 받기가 되는지 확인.
2. **지도 다듬기 (`js/map.js`)** — TODO 1(마커를 누르면 그 카드로 이동·강조), TODO 2(자산 유형별 마커 색 + 범례), TODO 3(검색 결과가 여러 개일 때 고르기)
3. **전체 점검**: 5개 화면을 폭 360px·1200px에서 확인, 콘솔 오류 확인, 금지어가 화면 문구에 없는지 확인.
4. **배포 준비**: GitHub 저장소가 아직 없어. 내가 저장소를 만들면 GitHub Pages로 올리는 방법을 단계별로 알려줘. `.env` 는 절대 올리지 않아.
5. (나중에) 문서 3종(README, CONVENTIONS, TEAM_GUIDE)을 지금 코드에 맞게 다시 쓰기, 리츠 ETF 추가, 공식 API 키가 생기면 `build_all.py` 로 교체.

작업할 때: 한 번에 하나씩 하고, 끝날 때마다 무엇을 바꿨는지와 내가 화면에서 확인할 방법을 알려줘. 파일을 고친 뒤 화면이 안 바뀌면 브라우저에서 Ctrl+Shift+R(강력 새로고침)을 해야 해.

## 7. 로컬에서 보기 / 데이터 다시 받기

```bash
python -m http.server 8000
```

→ `http://localhost:8000`

데이터를 새로 받으려면(인터넷 필요, 5분쯤 걸림):

```bash
pip install -r requirements.txt
```

```bash
python scripts/build_public.py
```

## 8. 디자인 변수 (css/style.css 의 :root)

색 `--color-bg` `--color-surface` `--color-surface-2` `--color-text` `--color-text-sub` `--color-line` `--color-primary`(파랑) `--color-primary-soft` `--color-accent`(빨강) `--color-gold` `--color-good`/`-soft` `--color-risk`/`-soft` `--color-up`(빨강) `--color-down`(파랑)
글자 `--font-base` `--fs-xs`(12) `--fs-sm`(14) `--fs-md`(16) `--fs-lg`(20) `--fs-xl`(30) / 간격 `--space-1`~`--space-6`(4·8·12·16·24·32) / 모양 `--radius`(16) `--radius-sm`(12)
공통 클래스: `.container .section .stack .grid .grid-2 .grid-3 .card .card-title .card-sub .btn .btn-primary .btn-ghost .chip .chip-row .badge .badge-live .translated .raw-note .source-note .caution-note .na .label-safe .label-risk .note-box .summary-box .warn-box .notice .table .table-wrap .field .field-label .input .select .textarea .term .ad-slot .chapter .chapter-tag .page-title .lead .sec-title .sec-no .hero .spark .num-up .num-down .is-hidden .is-active`

## 9. 파일 전체

아래 블록을 그대로 파일로 만들어. (`<<<FILE: 경로>>>` 다음 줄부터 `<<<END FILE>>>` 앞 줄까지가 파일 내용)

<<<FILE: index.html>>>
<!DOCTYPE html>
<html lang="ko">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>리츠 투자 | 2030을 위한 리츠 안내</title>
  <meta name="description" content="리츠를 생활 언어로 번역해서 보여주는 대학 수업 과제 사이트">
  <link rel="stylesheet" href="css/style.css">
  <style>
    /* 첫 화면 전용 스타일 (접두어 home-) */
    .home-targets { display: grid; gap: var(--space-3); grid-template-columns: 1fr; }
    @media (min-width: 640px) { .home-targets { grid-template-columns: repeat(3, minmax(0, 1fr)); } }
    .home-target-btn { display: block; width: 100%; padding: 20px; border: 1px solid transparent; border-radius: var(--radius); background: var(--color-surface); text-align: left; cursor: pointer; transition: border-color 0.15s, background-color 0.15s; }
    .home-target-btn:hover { border-color: var(--color-line); }
    .home-target-btn.is-active { border-color: var(--color-primary); background: var(--color-primary-soft); }
    .home-target-who { display: block; font-size: var(--fs-xs); color: var(--color-text-sub); }
    .home-target-name { display: block; font-size: var(--fs-lg); font-weight: 800; }
    .home-target-sort { display: block; margin-top: var(--space-2); font-size: var(--fs-xs); color: var(--color-primary); font-weight: 700; }
    .home-rule { display: flex; flex-wrap: wrap; align-items: center; gap: var(--space-2) var(--space-3); }
    .home-item-head { display: flex; flex-wrap: wrap; align-items: baseline; gap: var(--space-2); }
    .home-item-price { margin-top: var(--space-3); font-size: 26px; font-weight: 800; letter-spacing: -0.03em; line-height: 1.2; }
    .home-item-change { font-size: var(--fs-sm); font-weight: 700; }
    .home-item-top { display: flex; justify-content: space-between; align-items: flex-end; gap: var(--space-3); }
    .home-item-chart { flex: none; width: 112px; }
    .home-headline { margin-top: var(--space-2); font-size: var(--fs-lg); font-weight: 700; color: var(--color-gold); letter-spacing: -0.02em; }
    .home-item-sub { margin-top: 2px; font-size: var(--fs-xs); color: var(--color-text-sub); }
    .home-item .translated { margin-top: var(--space-3); font-size: var(--fs-md); }
    .home-item-actions { margin-top: var(--space-3); }
    .home-links .card { display: block; text-decoration: none; color: inherit; }
    .home-links .card:hover { background: var(--color-primary-soft); }
    .home-link-step { font-size: var(--fs-xs); font-weight: 700; letter-spacing: 0.2em; color: var(--color-accent); }
  </style>
</head>
<body>
  <header id="site-header"></header>

  <div class="hero">
    <div class="container">
      <p class="hero-kicker">2030을 위한 리츠 안내 · 수업 과제</p>
      <h1 class="hero-title">리츠 투자</h1>
      <p class="home-headline" id="home-headline"></p>
      <p class="hero-text">리츠는 여러 사람이 돈을 모아 건물을 사고 임대료를 나눠 갖는 상품이에요. 어려운 숫자를 생활 언어로 바꾸고, 좋은 점과 위험을 같은 크기로 보여드려요.</p>
    </div>
  </div>

  <main class="container section stack">

    <section class="stack" aria-label="타깃 선택">
      <h2 class="sec-title"><span class="sec-no">01</span>나는 ○○예요</h2>
      <p class="source-note">고르면 아래 목록의 정렬 기준과 설명이 바뀌어요. 선택은 이 기기에만 저장돼요.</p>
      <div class="home-targets" id="home-targets"></div>
    </section>

    <div class="ad-slot ad-slot--banner" data-ad="home-top"></div>

    <section class="stack" aria-label="리츠 목록">
      <h2 class="sec-title"><span class="sec-no">02</span>리츠 둘러보기</h2>
      <!-- 국내 리츠 / 해외 리츠 전환 버튼 -->
      <div class="chip-row" id="home-market" role="group" aria-label="국내 리츠와 해외 리츠 전환"></div>
      <div class="note-box home-rule">
        <span><b>정렬 기준</b> <span id="home-sort-label"></span></span>
        <span class="label-risk">원금 손실 가능</span>
      </div>
      <p class="source-note">이 순서는 권유가 아니에요. 위에 적은 기준 하나로만 줄을 세운 것이고, 값이 없는 상품은 맨 뒤에 있어요.</p>
      <p class="notice is-hidden" id="home-notice"></p>
      <div class="grid grid-3" id="home-list"></div>
      <div><button class="btn btn-ghost is-hidden" id="home-more" type="button">전체 보기</button></div>
    </section>

    <section class="stack" aria-label="둘러볼 곳">
      <h2 class="sec-title"><span class="sec-no">03</span>어디부터 볼까요</h2>
      <div class="grid grid-2 home-links">
        <a class="card" href="map.html">
          <p class="home-link-step">MAP</p>
          <p class="card-title">내가 자주 가는 곳에서 시작하기</p>
          <p class="card-sub">학교, 회사, 자취방 근처에 리츠가 가진 건물이 있는지 지도에서 찾아봐요.</p>
        </a>
        <a class="card" href="compare.html">
          <p class="home-link-step">COMPARE</p>
          <p class="card-title">적금과 나란히 비교하기</p>
          <p class="card-sub">리츠·ETF를 3개까지 골라 은행 적금과 같은 잣대로 비교해요.</p>
        </a>
        <a class="card" href="learn.html">
          <p class="home-link-step">LEARN</p>
          <p class="card-title">어려운 말 쉬운 말로 배우기</p>
          <p class="card-sub">배당, P/NAV, WALE 같은 말을 하나씩 쉬운 말로 풀었어요.</p>
        </a>
        <a class="card" href="card.html">
          <p class="home-link-step">CARD</p>
          <p class="card-title">홍보 카드 만들어 보기</p>
          <p class="card-sub">타깃에 맞는 문구로 인스타 카드를 만들어요. 쓰면 안 되는 표현은 자동으로 걸러요.</p>
        </a>
      </div>
    </section>

  </main>

  <footer id="site-footer"></footer>

  <script src="js/common.js"></script>
  <script>
    /* 첫 화면 스크립트: 타깃 선택 → 정렬 기준대로 목록 표시 */
    (function () {
      "use strict";
      var FIRST_COUNT = 9;                 // 처음에 보여줄 상품 수
      var state = { target: Common.getTarget() || "student", products: [], showAll: false, market: "kr" };   // market: "kr" 국내 / "global" 해외

      // 지금 고른 쪽(국내 또는 해외)의 상품만
      function marketProducts(market) {
        return state.products.filter(function (p) { return market === "global" ? p.type === "global" : p.type !== "global"; });
      }

      function renderMarket() {
        var tabs = [["kr", "국내 리츠"], ["global", "해외 리츠"]];
        document.getElementById("home-market").innerHTML = tabs.map(function (tab) {
          var active = tab[0] === state.market;
          return '<button type="button" class="chip' + (active ? " is-active" : "") + '" data-market="' + tab[0] +
            '" aria-pressed="' + active + '">' + tab[1] + " " + marketProducts(tab[0]).length + "</button>";
        }).join("");
      }

      function targetInfo() {
        return Common.TARGETS.filter(function (t) { return t.key === state.target; })[0];
      }

      // 받침이 있으면 "이에요", 없으면 "예요"  (대학생이에요 / 1인가구예요)
      function withEnding(word) {
        var code = word.charCodeAt(word.length - 1) - 0xAC00;
        var hasFinal = code >= 0 && code <= 11171 && code % 28 !== 0;
        return word + (hasFinal ? "이에요" : "예요");
      }

      function renderTargets() {
        document.getElementById("home-targets").innerHTML = Common.TARGETS.map(function (t) {
          var active = t.key === state.target;
          return '<button type="button" class="home-target-btn' + (active ? " is-active" : "") +
            '" data-target="' + t.key + '" aria-pressed="' + active + '">' +
            '<span class="home-target-who">나는</span>' +
            '<span class="home-target-name">' + Common.escapeHtml(withEnding(t.label)) + "</span>" +
            '<span class="home-target-sort">정렬 기준: ' + Common.escapeHtml(t.sortLabel) + "</span></button>";
        }).join("");
        var info = targetInfo();
        document.getElementById("home-sort-label").textContent = info.sortLabel + " — " + info.reason;
      }

      // 타깃마다 카드에서 가장 크게 보여줄 번역 문구 하나
      function mainLine(p) {
        if (state.target === "rookie") {
          if (p.type === "etf") { return { text: Common.NA_ETF, raw: "WALE" }; }
          if (p.type === "global") { return { text: Common.NA_GLOBAL, raw: "WALE" }; }
          return Common.translateWale(p.waleYears);
        }
        if (state.target === "renter") {
          return Common.translateDividend(p.priceYield);
        }
        var cups = (typeof p.price === "number") ? Math.ceil(p.price / Common.COFFEE.price) : null;
        return {
          text: cups === null ? Common.NA : "커피 " + cups + "잔 값이면 1주를 살 수 있어요",
          raw: "1주 가격 " + Common.formatWon(p.price) + " · 커피 한 잔 " + Common.formatWon(Common.COFFEE.price) + " 가정"
        };
      }

      function itemHtml(p) {
        var line = mainLine(p);
        var change = Common.formatChange(p.changePct);
        var chart = Common.sparkline(p.history, { width: 120, height: 44 });       // 최근 1년 주가 그래프
        var compare ='<a class="btn" href="compare.html?ids=' + encodeURIComponent(p.key) + '">적금과 비교하기</a>';
        return '<article class="card home-item">' +
          '<div class="home-item-head"><h3 class="card-title">' + Common.escapeHtml(p.name) + "</h3>" +
          '<span class="badge">' + (p.type === "etf" ? "리츠 ETF" : (p.type === "global"
            ? "해외 리츠" + (p.country ? " · " + Common.escapeHtml(p.country) : "") : Common.escapeHtml(p.assetType || "리츠"))) + "</span></div>" +
          '<div class="home-item-top"><div>' +
          '<p class="home-item-price">' + (typeof p.price === "number" ? Common.formatWon(p.price) : '<span class="na">' + Common.NA + "</span>") +
          (change.text ? ' <span class="home-item-change ' + change.cls + '">' + change.text + "</span>" : "") + "</p>" +
          '<p class="home-item-sub">1주 가격' + (p.priceDate ? " · " + Common.formatDate(p.priceDate) + " 종가" : "") +
          (p.type === "global" && p.priceLocal !== null ? " · " + Common.formatUsd(p.priceLocal) + "를 원으로 바꾼 값" : "") + "</p></div>" +
          (chart.svg ? '<div class="home-item-chart">' + chart.svg + '<p class="spark-caption">최근 1년 <span class="' +
            (chart.changePct > 0 ? "num-up" : (chart.changePct < 0 ? "num-down" : "")) + '">' +
            (chart.changePct > 0 ? "+" : "") + chart.changePct.toFixed(1) + "%</span></p></div>" : "") +
          "</div>" +
          '<p class="translated' + (line.text === Common.NA ? " na" : "") + '">' + Common.escapeHtml(line.text) + "</p>" +
          '<p class="raw-note">' + Common.escapeHtml(line.raw || "") + "</p>" +
          (line.caution ? '<p class="caution-note">' + Common.escapeHtml(line.caution) + "</p>" : "") +
          '<div class="home-item-actions">' + compare + "</div></article>";
      }

      function renderList() {
        var notice = document.getElementById("home-notice");
        var list = document.getElementById("home-list");
        var more = document.getElementById("home-more");
        if (!state.products.length) {
          notice.textContent = "아직 받은 데이터가 없어요. 데이터 담당이 scripts/build_all.py 를 실행하면 이 자리에 리츠 목록이 나와요.";
          notice.classList.remove("is-hidden");
          list.innerHTML = "";
          more.classList.add("is-hidden");
          return;
        }
        var hasPrice = state.products.some(function (p) { return typeof p.price === "number"; });
        notice.classList.toggle("is-hidden", hasPrice);
        if (!hasPrice) {
          notice.textContent = "시세와 배당 데이터는 아직 받지 못했어요. 지금은 리츠정보시스템 지표만 보여요.";
        }
        if (state.market === "global") {
          notice.textContent = "해외 리츠는 미국 S&P 500에 들어 있는 리츠 중 시가총액이 큰 순서로 골랐어요. 가격은 달러를 원으로 바꾼 값이고, WALE·P/NAV 같은 국내 공시 지표는 없어요.";
          notice.classList.remove("is-hidden");
        }
        var sorted = Common.sortByTarget(marketProducts(state.market), state.target);
        var shown = state.showAll ? sorted : sorted.slice(0, FIRST_COUNT);
        list.innerHTML = shown.map(itemHtml).join("");
        more.classList.toggle("is-hidden", state.showAll || sorted.length <= FIRST_COUNT);
        more.textContent = "전체 " + sorted.length + "개 보기";
      }

      // 큰 제목 아래 한 줄: 고른 타깃에 맞는 문구
      function renderHeadline() {
        document.getElementById("home-headline").textContent = targetInfo().headline;
      }

      document.addEventListener("DOMContentLoaded", function () {
        Common.initPage({ active: "index", sources: ["reits", "metrics", "prices", "dividends"] });
        renderTargets();
        renderHeadline();
        Common.loadAll(["reits", "metrics", "prices", "dividends", "history"]).then(function (data) {
          state.products = Common.buildProducts(data);
          renderMarket();
          renderList();
        });
        document.getElementById("home-market").addEventListener("click", function (event) {
          var button = event.target.closest("[data-market]");
          if (!button) { return; }
          state.market = button.getAttribute("data-market");
          state.showAll = false;
          renderMarket();
          renderList();
        });
        document.getElementById("home-targets").addEventListener("click", function (event) {
          var button = event.target.closest("[data-target]");
          if (!button) { return; }
          state.target = button.getAttribute("data-target");
          Common.setTarget(state.target);
          renderTargets();
          renderHeadline();
          renderList();
        });
        document.getElementById("home-more").addEventListener("click", function () {
          state.showAll = true;
          renderList();
        });
      });
    })();
  </script>
</body>
</html>
<<<END FILE>>>

<<<FILE: compare.html>>>
<!DOCTYPE html>
<html lang="ko">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>적금과 비교 | 리츠 투자</title>
  <meta name="description" content="리츠·리츠 ETF를 은행 적금과 같은 잣대로 나란히 비교">
  <link rel="stylesheet" href="css/style.css">
  <style>
    /* 비교 화면 전용 스타일 (접두어 cmp-) */
    .cmp-pick { display: grid; gap: var(--space-3); grid-template-columns: 1fr; }
    @media (min-width: 720px) { .cmp-pick { grid-template-columns: repeat(3, minmax(0, 1fr)); } }
    .cmp-assume { display: grid; gap: var(--space-3); grid-template-columns: 1fr 1fr; max-width: 480px; }

    /* 작은 화면: 상품별로 위에서 아래로 쌓는다 / 큰 화면: 상품이 옆으로 나란히, 줄이 맞게 */
    .cmp-grid { display: block; }
    .cmp-cell { padding: var(--space-3) var(--space-4); border: 1px solid var(--color-line); border-top: 0; background: var(--color-surface); }
    .cmp-cell--head { margin-top: var(--space-4); border-top: 3px solid var(--color-primary); border-radius: var(--radius) var(--radius) 0 0; background: var(--color-primary-soft); }
    .cmp-cell--saving.cmp-cell--head { border-top-color: var(--color-good); background: var(--color-good-soft); }
    .cmp-cell--last { border-radius: 0 0 var(--radius) var(--radius); }
    .cmp-change { font-size: var(--fs-sm); font-weight: 700; }
    .cmp-chart { margin-top: var(--space-3); }
    .cmp-chart .spark { height: 56px; }
    @media (min-width: 720px) {
      .cmp-grid { display: grid; grid-auto-flow: column; grid-auto-columns: minmax(0, 1fr); grid-template-rows: repeat(8, auto); }
      .cmp-cell { border-left: 0; }
      .cmp-cell--first { border-left: 1px solid var(--color-line); }
      .cmp-cell--head { margin-top: 0; border-radius: 0; }
      .cmp-cell--last { border-radius: 0; }
    }
    .cmp-label { display: block; margin-bottom: var(--space-1); font-size: var(--fs-xs); font-weight: 700; color: var(--color-text-sub); letter-spacing: 0.02em; }
    .cmp-name { font-size: var(--fs-lg); font-weight: 800; line-height: 1.3; }
    .cmp-cell .translated { font-size: var(--fs-md); }
    .cmp-points { margin: 0; padding-left: 1.1em; font-size: var(--fs-sm); }
    .cmp-points + .cmp-label { margin-top: var(--space-3); }
  </style>
</head>
<body>
  <header id="site-header"></header>

  <main class="container section stack">
    <div>
      <div class="chapter"><span class="chapter-tag">COMPARE</span><span class="chapter-name">비교</span></div>
      <h1 class="page-title">적금과 나란히 놓고 보기</h1>
      <p class="lead">리츠와 리츠 ETF를 3개까지 골라 은행 적금과 같은 잣대로 비교해요. 맨 오른쪽은 늘 은행 적금이에요. 좋은 점과 조심할 점을 같은 크기로 적었어요.</p>
    </div>

    <section class="stack" aria-label="고르기">
      <h2 class="sec-title"><span class="sec-no">01</span>비교할 상품 고르기</h2>
      <div class="cmp-pick" id="cmp-pick"></div>
      <div class="cmp-assume">
        <label class="field">
          <span class="field-label">매달 넣는 돈</span>
          <select class="select" id="cmp-monthly">
            <option value="30000">3만 원</option>
            <option value="50000" selected>5만 원</option>
            <option value="100000">10만 원</option>
            <option value="300000">30만 원</option>
          </select>
        </label>
        <label class="field">
          <span class="field-label">커피 한 잔 값(원)</span>
          <input class="input" id="cmp-coffee" type="number" min="500" max="20000" step="100" inputmode="numeric">
        </label>
      </div>
      <p class="source-note" id="cmp-coffee-source"></p>
      <p class="notice is-hidden" id="cmp-notice"></p>
    </section>

    <section class="stack" aria-label="비교표">
      <h2 class="sec-title"><span class="sec-no">02</span>나란히 보기</h2>
      <div class="cmp-grid" id="cmp-grid"></div>
    </section>

    <section class="stack" aria-label="계산 방법">
      <h2 class="sec-title"><span class="sec-no">03</span>이렇게 계산했어요</h2>
      <div class="table-wrap">
        <table class="table">
          <tbody>
            <tr><th>1년 배당·이자</th><td>매달 넣는 돈 × 연 수익률(금리) × 6.5. 첫 달에 넣은 돈은 12개월, 마지막 달에 넣은 돈은 1개월 치만 받는다고 보는 적금 이자 계산법(단리)을 리츠에도 똑같이 적용했어요. 세금(15.4%)을 떼기 전 금액이에요.</td></tr>
            <tr><th>주가 기준 배당수익률</th><td>최근 1년 주당배당금 ÷ 가격 × 100. 가격은 전일 종가를 쓰고, 발표자 노트북에서 실시간 서버가 켜져 있을 때만 현재가를 써요.</td></tr>
            <tr><th>P/NAV</th><td>시가총액 ÷ NAV(자산의 최근 감정평가액 − 부채총계). 리츠정보시스템 원자료는 "결산월 말일 주가 ÷ NAV"라서 단위가 달라 그대로 쓰지 않고, 공식 숫자 두 개로 직접 계산했어요.</td></tr>
            <tr><th>WALE</th><td>리츠정보시스템 값 그대로. 0으로 적힌 리츠는 값이 제공되지 않은 것으로 보고 "데이터 없음"으로 표시해요.</td></tr>
            <tr><th>은행 적금</th><td id="cmp-saving-rule">데이터 없음</td></tr>
            <tr><th>리츠에 없는 것</th><td>리츠는 1주 단위로만 살 수 있어서 매달 딱 맞는 금액을 넣기 어려워요. 사고팔 때 수수료가 들고, 주가와 배당은 계속 바뀌어요. 위 숫자는 지난 1년 실적을 그대로 옮긴 것이에요.</td></tr>
          </tbody>
        </table>
      </div>
    </section>

    <div class="ad-slot ad-slot--banner" data-ad="compare-bottom"></div>
  </main>

  <footer id="site-footer"></footer>

  <script src="js/common.js"></script>
  <script src="js/compare.js"></script>
</body>
</html>
<<<END FILE>>>

<<<FILE: map.html>>>
<!DOCTYPE html>
<html lang="ko">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>지도에서 찾기 | 리츠 투자</title>
  <meta name="description" content="내가 자주 가는 곳 근처에 리츠가 가진 건물이 있는지 지도에서 찾기">
  <link rel="stylesheet" href="css/style.css">
  <!-- 지도 라이브러리 Leaflet (OpenStreetMap 지도용, API 키 필요 없음) -->
  <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css">
  <style>
    /* 지도 페이지 전용 스타일 (접두어 map-). 색·간격은 style.css 의 변수만 쓴다 */
    .map-search { display: grid; gap: var(--space-3); grid-template-columns: 1fr; }
    @media (min-width: 720px) { .map-search { grid-template-columns: 1fr 160px auto auto; align-items: end; } }
    .map-canvas { z-index: 0; border-radius: var(--radius); overflow: hidden; }
    .map-canvas .leaflet-popup-content-wrapper, .map-canvas .leaflet-popup-tip { background: var(--color-surface-2); color: var(--color-text); }
    .map-canvas .leaflet-popup-content { font-family: var(--font-base); font-size: var(--fs-sm); line-height: 1.5; }
    .map-canvas .leaflet-container a.leaflet-popup-close-button { color: var(--color-text-sub); }
    .map-canvas { width: 100%; height: 360px; border: 1px solid var(--color-line); background: var(--color-label); }
    @media (min-width: 720px) { .map-canvas { height: 480px; } }
    .map-asset-meta { margin-top: var(--space-1); font-size: var(--fs-xs); color: var(--color-text-sub); }
    .map-asset .translated { margin-top: var(--space-3); font-size: var(--fs-md); }
    .map-asset-actions { margin-top: var(--space-3); }
  </style>
</head>
<body>
  <header id="site-header"></header>

  <main class="container section stack">
    <div>
      <div class="chapter"><span class="chapter-tag">MAP</span><span class="chapter-name">장소에서 리츠로</span></div>
      <h1 class="page-title">자주 가는 그곳, 누가 가지고 있을까</h1>
      <p class="lead">학교, 회사, 자취방처럼 자주 가는 곳을 찾아보세요. 그 근처에 리츠가 가진 건물이 있으면 지도에 표시해요.</p>
    </div>

    <section class="stack" aria-label="장소 찾기">
      <h2 class="sec-title"><span class="sec-no">01</span>장소 찾기</h2>
      <!-- 국내 리츠 건물 / 해외 리츠 본사 전환 버튼 -->
      <div class="chip-row" id="map-market" role="group" aria-label="국내 리츠 건물과 해외 리츠 본사 전환"></div>
      <div class="map-search">
        <label class="field">
          <span class="field-label">자주 가는 장소</span>
          <input class="input" id="map-keyword" type="search" placeholder="예: 강남역, ○○대학교" autocomplete="off">
        </label>
        <label class="field">
          <span class="field-label">찾는 범위</span>
          <select class="select" id="map-radius">
            <option value="1">반경 1km</option>
            <option value="3" selected>반경 3km</option>
            <option value="5">반경 5km</option>
            <option value="10">반경 10km</option>
          </select>
        </label>
        <button class="btn btn-primary" id="map-search-btn" type="button">찾기</button>
        <button class="btn btn-ghost" id="map-reset-btn" type="button">전체 보기</button>
      </div>
      <p class="notice is-hidden" id="map-notice"></p>
      <!-- 지도가 그려지는 자리 -->
      <div class="map-canvas" id="map-canvas" role="application" aria-label="지도"></div>
      <p class="source-note">지도와 장소 검색: OpenStreetMap. 장소 검색 결과는 어디에도 저장하지 않아요. 국내 건물 위치: 국토교통부 리츠정보시스템. 해외 리츠는 본사가 있는 도시를 표시해요.</p>
    </section>

    <section class="stack" aria-label="근처 건물">
      <h2 class="sec-title"><span class="sec-no">02</span><span id="map-result-title">리츠가 가진 건물</span></h2>
      <p class="source-note" id="map-result-note"></p>
      <!-- 건물 카드가 들어가는 자리: "이 건물, ○○리츠가 가지고 있어요" -->
      <div class="grid grid-2" id="map-result"></div>
    </section>

    <div class="ad-slot ad-slot--banner" data-ad="map-bottom"></div>
  </main>

  <footer id="site-footer"></footer>

  <script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
  <script src="js/common.js"></script>
  <script src="js/map.js"></script>
</body>
</html>
<<<END FILE>>>

<<<FILE: learn.html>>>
<!DOCTYPE html>
<html lang="ko">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>용어 배우기 | 리츠 투자</title>
  <meta name="description" content="리츠, 배당, P/NAV, WALE 같은 어려운 말을 쉬운 말로 배우는 곳">
  <link rel="stylesheet" href="css/style.css">
  <style>
    /* 용어 배우기 페이지 전용 스타일 (접두어 learn-) */
    .learn-tools { display: grid; gap: var(--space-3); }
    .learn-card { scroll-margin-top: var(--space-5); }
    .learn-card:target { border-color: var(--color-accent); border-top-color: var(--color-accent); }
    .learn-term { display: flex; flex-wrap: wrap; align-items: baseline; gap: var(--space-2); }
    .learn-full { font-size: var(--fs-xs); color: var(--color-text-sub); }
    .learn-easy { margin-top: var(--space-3); }
    .learn-detail { margin-top: var(--space-3); font-size: var(--fs-sm); color: var(--color-text-sub); }
    .learn-row { margin-top: var(--space-3); display: grid; grid-template-columns: 68px 1fr; gap: var(--space-3); font-size: var(--fs-xs); }
    .learn-row dt { padding: 3px var(--space-2); border-radius: 6px; background: var(--color-surface-2); color: var(--color-text-sub); font-weight: 700; text-align: center; align-self: start; }
    .learn-row dd { margin: 0; padding-top: 3px; color: var(--color-text-sub); }
  </style>
</head>
<body>
  <header id="site-header"></header>

  <main class="container section stack">
    <div>
      <div class="chapter"><span class="chapter-tag">LEARN</span><span class="chapter-name">용어 배우기</span></div>
      <h1 class="page-title">어려운 말, 쉬운 말로</h1>
      <p class="lead">리츠 기사나 증권사 앱에 나오는 말을 하나씩 쉬운 말로 바꿨어요. 카드마다 쉬운 뜻, 계산식, 조심할 점이 같이 들어 있어요.</p>
    </div>

    <section class="stack" aria-label="용어 찾기">
      <h2 class="sec-title"><span class="sec-no">01</span>용어 찾기</h2>
      <div class="learn-tools">
        <label class="field">
          <span class="field-label">찾고 싶은 말을 적어 보세요</span>
          <input class="input" id="learn-search" type="search" placeholder="예: 배당, WALE, 원금" autocomplete="off">
        </label>
        <div class="chip-row" id="learn-categories" role="group" aria-label="분류"></div>
      </div>
      <p class="source-note" id="learn-count"></p>
      <div class="grid grid-2" id="learn-list"></div>
      <p class="notice is-hidden" id="learn-empty">찾는 말이 없어요. 다른 말로 찾아보세요.</p>
    </section>

    <div class="ad-slot ad-slot--banner" data-ad="learn-bottom"></div>

    <div class="note-box">
      <div class="note-box-title">☑ 짚고 넘어갈 점</div>
      용어 뜻은 이해를 돕기 위해 쉽게 풀어 쓴 것이에요. 계산식은 국토교통부 리츠정보시스템의 '성과지표 안내'를 따랐고, 카드에 붙은 실제 숫자 예시는 이 사이트가 받은 공식 데이터에서 가져와요.
    </div>
  </main>

  <footer id="site-footer"></footer>

  <script src="js/common.js"></script>
  <script src="js/learn.js"></script>
</body>
</html>
<<<END FILE>>>

<<<FILE: card.html>>>
<!DOCTYPE html>
<html lang="ko">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>홍보 카드 만들기 | 리츠 투자</title>
  <meta name="description" content="타깃에 맞는 문구로 리츠 홍보 카드를 만들고, 쓰면 안 되는 표현은 자동으로 걸러내기">
  <link rel="stylesheet" href="css/style.css">
  <style>
    /* 홍보 카드 페이지 전용 스타일 (접두어 cardgen-). 색·간격은 style.css 의 변수만 쓴다 */
    .cardgen-layout { display: grid; gap: var(--space-5); grid-template-columns: 1fr; }
    @media (min-width: 860px) { .cardgen-layout { grid-template-columns: 1fr 1fr; align-items: start; } }
    .cardgen-option { display: block; width: 100%; margin-top: var(--space-2); padding: var(--space-4); border: 1px solid transparent; border-radius: var(--radius-sm); background: var(--color-surface); text-align: left; font-weight: 600; cursor: pointer; }
    .cardgen-option.is-active { border-color: var(--color-primary); background: var(--color-primary-soft); }
    .cardgen-preview { display: block; width: 100%; height: auto; border: 1px solid var(--color-line); border-radius: var(--radius); }
  </style>
</head>
<body>
  <header id="site-header"></header>

  <main class="container section stack">
    <div>
      <div class="chapter"><span class="chapter-tag">CARD</span><span class="chapter-name">타깃별 홍보 카드</span></div>
      <h1 class="page-title">같은 리츠, 다른 한마디</h1>
      <p class="lead">누구에게 말하느냐에 따라 문구가 달라져요. 타깃과 리츠를 고르면 문구가 나오고, 인스타용 정사각형 카드로 받을 수 있어요. 투자 광고에 쓰면 안 되는 표현은 자동으로 걸러요.</p>
    </div>

    <div class="cardgen-layout">
      <section class="stack" aria-label="문구 만들기">
        <h2 class="sec-title"><span class="sec-no">01</span>문구 만들기</h2>
        <div>
          <span class="field-label">누구에게 보여줄까요</span>
          <div class="chip-row" id="cardgen-targets" role="group" aria-label="타깃"></div>
        </div>
        <label class="field">
          <span class="field-label">어떤 리츠인가요</span>
          <select class="select" id="cardgen-product"></select>
        </label>
        <div>
          <span class="field-label">문구 고르기</span>
          <!-- 템플릿으로 만든 문구 3안이 들어가는 자리 -->
          <div id="cardgen-options"></div>
        </div>
        <label class="field">
          <span class="field-label">문구 고치기</span>
          <textarea class="textarea" id="cardgen-text" maxlength="120"></textarea>
        </label>
        <!-- 금지어가 들어가면 보이는 빨간 경고 -->
        <p class="warn-box is-hidden" id="cardgen-warn" role="alert"></p>
        <p class="notice is-hidden" id="cardgen-notice"></p>
      </section>

      <section class="stack" aria-label="미리 보기">
        <h2 class="sec-title"><span class="sec-no">02</span>미리 보기</h2>
        <!-- 실제 크기는 1080×1080. 화면에는 폭에 맞게 줄여서 보여준다 -->
        <canvas class="cardgen-preview" id="cardgen-canvas" width="1080" height="1080"></canvas>
        <button class="btn btn-primary" id="cardgen-download" type="button">PNG로 받기</button>
        <p class="source-note">카드 맨 아래 고지 문구는 자동으로 들어가고 지울 수 없어요.</p>
      </section>
    </div>

    <div class="ad-slot ad-slot--banner" data-ad="card-bottom"></div>
  </main>

  <footer id="site-footer"></footer>

  <script src="js/common.js"></script>
  <script src="js/card.js"></script>
</body>
</html>
<<<END FILE>>>

<<<FILE: css/style.css>>>
/* ==========================================================================
   css/style.css — "커피값 건물주" 공통 디자인
   - 디자인 기준: 어두운 증권 앱 느낌
     어두운 배경 + 둥근 패널 + 굵은 숫자 + 파랑 포인트, 오르면 빨강·내리면 파랑
   - 색·글자 크기·간격은 아래 :root 의 변수만 쓴다 (값을 직접 쓰지 않는다)
   - 이 파일은 팀장만 고친다. 페이지 전용 스타일은 각 HTML의 <style> 안에.
   ========================================================================== */

@import url("https://cdn.jsdelivr.net/gh/orioncactus/pretendard@v1.3.9/dist/web/static/pretendard.min.css");

:root {
  color-scheme: dark;

  /* 색 */
  --color-bg: #0F1014;            /* 페이지 배경 */
  --color-surface: #17181D;       /* 카드·패널 배경 */
  --color-surface-2: #20222A;     /* 입력칸·칩·한 단계 밝은 패널 */
  --color-text: #F3F4F6;          /* 제목·본문 글자 */
  --color-text-sub: #9DA1AB;      /* 보조 글자 */
  --color-line: #2A2C35;          /* 테두리·구분선 */
  --color-primary: #3B82F6;       /* 대표색 (파랑) */
  --color-primary-soft: #18233A;  /* 파랑의 어두운 배경 */
  --color-sky: #20222A;           /* 칩 배경 */
  --color-accent: #F04452;        /* 강조 (빨강) */
  --color-gold: #FFC83D;          /* 큰 제목 안의 강조 글자 (노랑) */
  --color-label: #1C1D24;         /* 표의 라벨 칸 */
  --color-good: #34C38F;          /* 장점 · 원금 보장(적금) */
  --color-good-soft: #12281F;
  --color-risk: #F04452;          /* 위험 · 경고 · 금지어 */
  --color-risk-soft: #2C1519;
  --color-up: #F04452;            /* 올랐을 때 (빨강) */
  --color-down: #3B82F6;          /* 내렸을 때 (파랑) */
  --color-on-primary: #FFFFFF;    /* 파랑·빨강 바탕 위의 글자 */

  /* 글자 */
  --font-base: "Pretendard", -apple-system, BlinkMacSystemFont,
               "Apple SD Gothic Neo", "Malgun Gothic", sans-serif;
  --font-body: var(--font-base);
  --fs-xs: 12px;   /* 출처·원래 숫자 */
  --fs-sm: 14px;
  --fs-md: 16px;   /* 본문 */
  --fs-lg: 20px;   /* 카드 제목·번역 문구 */
  --fs-xl: 30px;   /* 페이지 제목 */

  /* 간격 */
  --space-1: 4px;  --space-2: 8px;  --space-3: 12px;
  --space-4: 16px; --space-5: 24px; --space-6: 32px;

  /* 모양 */
  --radius: 16px;       /* 카드·패널 */
  --radius-sm: 12px;    /* 버튼·입력칸 */
  --shadow: none;
  --max-width: 1080px;
}

/* ---------- 기본 ---------- */
* { box-sizing: border-box; }
html { -webkit-text-size-adjust: 100%; }
body {
  margin: 0;
  background: var(--color-bg);
  color: var(--color-text);
  font-family: var(--font-base);
  font-size: var(--fs-md);
  line-height: 1.6;
  letter-spacing: -0.01em;
  font-variant-numeric: tabular-nums;
  word-break: keep-all;
  overflow-wrap: anywhere;
  -webkit-font-smoothing: antialiased;
}
img, canvas, svg { max-width: 100%; }
a { color: var(--color-primary); }
h1, h2, h3, p { margin: 0; }
button, input, select, textarea { font: inherit; color: inherit; }
:focus-visible { outline: 2px solid var(--color-primary); outline-offset: 2px; }

.container { max-width: var(--max-width); margin: 0 auto; padding: 0 var(--space-4); }
.section { padding-top: var(--space-6); padding-bottom: var(--space-6); }   /* 좌우 여백은 .container 가 맡는다 */
.stack > * + * { margin-top: var(--space-5); }
.is-hidden { display: none !important; }
.num-up { color: var(--color-up); }
.num-down { color: var(--color-down); }

/* ---------- 주가 그래프(작은 선 그래프) ---------- */
.spark { display: block; width: 100%; height: 44px; color: var(--color-text-sub); overflow: visible; }
.spark.num-up { color: var(--color-up); }
.spark.num-down { color: var(--color-down); }
.spark-line { fill: none; stroke: currentColor; stroke-width: 2; stroke-linejoin: round; stroke-linecap: round; vector-effect: non-scaling-stroke; }
.spark-base { stroke: var(--color-line); stroke-width: 1; stroke-dasharray: 3 3; vector-effect: non-scaling-stroke; }
.spark-caption { margin-top: 2px; font-size: 11px; color: var(--color-text-sub); text-align: right; }

/* ---------- 머리말(메뉴) ---------- */
.site-header { position: sticky; top: 0; z-index: 40; background: rgba(15, 16, 20, 0.88); -webkit-backdrop-filter: blur(14px); backdrop-filter: blur(14px); border-bottom: 1px solid var(--color-line); }
.site-header .container { display: flex; flex-wrap: wrap; align-items: center; gap: 0 var(--space-5); padding-top: var(--space-2); padding-bottom: 0; }
.brand { display: flex; align-items: baseline; gap: var(--space-2); text-decoration: none; color: var(--color-text); padding: var(--space-2) 0; }
.brand-name { font-size: var(--fs-lg); font-weight: 800; letter-spacing: -0.03em; }
.brand-tag { font-size: 11px; font-weight: 700; color: var(--color-primary); letter-spacing: 0.06em; }
.site-nav { display: flex; flex-wrap: wrap; gap: 0 var(--space-1); }
.site-nav a { display: block; padding: var(--space-3) var(--space-3); font-size: var(--fs-md); font-weight: 600; color: var(--color-text-sub); text-decoration: none; border-bottom: 2px solid transparent; }
.site-nav a:hover { color: var(--color-text); }
.site-nav a.is-active { color: var(--color-text); font-weight: 800; border-bottom-color: var(--color-text); }

/* ---------- 큰 제목 영역(첫 화면) ---------- */
.hero { background: radial-gradient(900px 360px at 12% -20%, rgba(59, 130, 246, 0.30), transparent 62%), radial-gradient(700px 300px at 95% 0%, rgba(240, 68, 82, 0.12), transparent 60%), var(--color-bg); border-bottom: 1px solid var(--color-line); padding: 48px 0 40px; }
.hero-kicker { display: inline-block; padding: var(--space-1) var(--space-3); border-radius: 999px; background: var(--color-primary-soft); color: var(--color-primary); font-size: var(--fs-xs); font-weight: 700; letter-spacing: 0.04em; }
.hero-title { margin-top: var(--space-4); font-size: 38px; font-weight: 800; line-height: 1.25; letter-spacing: -0.035em; }
.hero-title em { font-style: normal; color: var(--color-gold); }
.hero-text { margin-top: var(--space-3); font-size: var(--fs-md); color: var(--color-text-sub); max-width: 620px; }

/* ---------- 페이지 이름표 · 소제목 ---------- */
.chapter { display: flex; align-items: center; gap: var(--space-2); }
.chapter-tag { padding: var(--space-1) var(--space-3); border-radius: 999px; background: var(--color-primary-soft); color: var(--color-primary); font-size: var(--fs-xs); font-weight: 800; letter-spacing: 0.1em; white-space: nowrap; }
.chapter-name { font-size: var(--fs-sm); font-weight: 600; color: var(--color-text-sub); }
.page-title { margin-top: var(--space-3); font-size: var(--fs-xl); font-weight: 800; letter-spacing: -0.03em; line-height: 1.3; }
.lead { margin-top: var(--space-3); font-size: var(--fs-md); color: var(--color-text-sub); max-width: 720px; }
.sec-title { display: flex; align-items: center; gap: var(--space-2); font-size: 22px; font-weight: 800; letter-spacing: -0.025em; }
.sec-no { flex: none; display: inline-block; min-width: 30px; padding: 2px var(--space-2); border-radius: 8px; background: var(--color-primary-soft); color: var(--color-primary); font-size: var(--fs-xs); font-weight: 800; text-align: center; }

/* ---------- 카드 ---------- */
.card { background: var(--color-surface); border: 1px solid transparent; border-radius: var(--radius); padding: 20px; box-shadow: var(--shadow); transition: background-color 0.15s, border-color 0.15s; }
a.card:hover, .card:hover { border-color: var(--color-line); }
.card-title { font-size: var(--fs-lg); font-weight: 800; letter-spacing: -0.02em; line-height: 1.35; }
.card-sub { font-size: var(--fs-sm); color: var(--color-text-sub); }
.grid { display: grid; gap: var(--space-3); grid-template-columns: 1fr; }
@media (min-width: 640px) { .grid-2, .grid-3 { grid-template-columns: repeat(2, minmax(0, 1fr)); } }
@media (min-width: 960px) { .grid-3 { grid-template-columns: repeat(3, minmax(0, 1fr)); } }

/* ---------- 버튼 · 칩 · 배지 ---------- */
.btn { display: inline-flex; align-items: center; justify-content: center; gap: var(--space-2); min-height: 44px; padding: var(--space-2) 18px; border: 1px solid transparent; border-radius: var(--radius-sm); background: var(--color-surface-2); color: var(--color-text); font-size: var(--fs-sm); font-weight: 700; text-decoration: none; cursor: pointer; transition: background-color 0.15s, filter 0.15s; }
.btn:hover { filter: brightness(1.18); }
.btn-primary { background: var(--color-primary); color: var(--color-on-primary); }
.btn-ghost { background: transparent; border-color: var(--color-line); color: var(--color-text); }
.btn:disabled, .btn.is-disabled { opacity: 0.35; cursor: not-allowed; pointer-events: none; }
.chip { display: inline-flex; align-items: center; min-height: 36px; padding: var(--space-1) var(--space-4); border: 0; border-radius: 999px; background: var(--color-sky); color: var(--color-text-sub); font-size: var(--fs-sm); font-weight: 700; cursor: pointer; }
.chip:hover { color: var(--color-text); }
.chip.is-active { background: var(--color-text); color: var(--color-bg); }
.chip-row { display: flex; flex-wrap: wrap; gap: var(--space-2); }
.badge { display: inline-block; padding: 2px var(--space-2); border-radius: 6px; background: var(--color-surface-2); font-size: var(--fs-xs); font-weight: 700; color: var(--color-text-sub); vertical-align: middle; }
.badge-live { background: var(--color-accent); color: var(--color-on-primary); }

/* ---------- 생활 언어 번역 · 원래 숫자 · 출처 ---------- */
.translated { font-size: var(--fs-lg); font-weight: 700; line-height: 1.45; letter-spacing: -0.02em; }
.translated strong { color: var(--color-primary); }
.raw-note { margin-top: var(--space-1); font-size: var(--fs-xs); color: var(--color-text-sub); line-height: 1.6; }
.source-note { font-size: var(--fs-xs); color: var(--color-text-sub); }
.caution-note { margin-top: var(--space-2); padding: var(--space-2) var(--space-3); border-radius: 10px; background: var(--color-risk-soft); color: var(--color-risk); font-size: var(--fs-xs); font-weight: 700; line-height: 1.5; }
.na { color: var(--color-text-sub); font-weight: 500; }

/* "원금 보장"과 "원금 손실 가능"은 반드시 같은 크기 */
.label-safe, .label-risk { display: inline-block; padding: 6px var(--space-3); border: 1px solid; border-radius: 10px; font-size: var(--fs-md); font-weight: 800; }
.label-safe { border-color: var(--color-good); color: var(--color-good); background: var(--color-good-soft); }
.label-risk { border-color: var(--color-risk); color: var(--color-risk); background: var(--color-risk-soft); }

/* ---------- 상자: 짚고 넘어갈 점 · 한 줄 정리 · 경고 · 안내 ---------- */
.note-box { padding: var(--space-4); border-radius: var(--radius); background: var(--color-surface); font-size: var(--fs-sm); color: var(--color-text-sub); }
.note-box b, .note-box-title { color: var(--color-text); }
.note-box-title { font-weight: 800; margin-bottom: var(--space-1); }
.summary-box { padding: var(--space-4); border: 1px solid var(--color-line); border-radius: var(--radius); font-size: var(--fs-sm); }
.warn-box { padding: var(--space-3) var(--space-4); border: 1px solid var(--color-risk); border-radius: var(--radius-sm); background: var(--color-risk-soft); color: var(--color-risk); font-size: var(--fs-sm); font-weight: 700; }
.notice { padding: var(--space-3) var(--space-4); border-radius: var(--radius-sm); background: var(--color-surface-2); font-size: var(--fs-sm); color: var(--color-text-sub); }

/* ---------- 표 ---------- */
.table { width: 100%; border-collapse: collapse; font-size: var(--fs-sm); }
.table th, .table td { padding: var(--space-3) var(--space-4); border-bottom: 1px solid var(--color-line); text-align: left; vertical-align: top; }
.table tr:last-child th, .table tr:last-child td { border-bottom: 0; }
.table th { background: var(--color-label); color: var(--color-text); font-weight: 700; white-space: nowrap; }
.table td { color: var(--color-text-sub); }
.table-wrap { overflow-x: auto; border-radius: var(--radius); background: var(--color-surface); }

/* ---------- 입력 ---------- */
.field { display: block; }
.field-label { display: block; margin-bottom: 6px; font-size: var(--fs-xs); font-weight: 700; color: var(--color-text-sub); }
.input, .select, .textarea { width: 100%; min-height: 48px; padding: var(--space-2) var(--space-4); border: 1px solid transparent; border-radius: var(--radius-sm); background: var(--color-surface-2); color: var(--color-text); }
.input::placeholder, .textarea::placeholder { color: var(--color-text-sub); }
.input:focus, .select:focus, .textarea:focus { outline: none; border-color: var(--color-primary); }
.textarea { min-height: 104px; resize: vertical; padding-top: var(--space-3); }

/* ---------- 용어 풀이 (점선 밑줄 → 누르면 쉬운 설명) ---------- */
.term { border: 0; border-bottom: 1px dotted var(--color-primary); padding: 0; background: none; color: inherit; font: inherit; cursor: help; }
.term-pop { position: absolute; z-index: 50; max-width: min(320px, calc(100vw - 32px)); padding: var(--space-4); border: 1px solid var(--color-line); border-radius: var(--radius); background: var(--color-surface-2); box-shadow: 0 16px 40px rgba(0, 0, 0, 0.55); font-size: var(--fs-sm); }
.term-pop-title { font-weight: 800; color: var(--color-primary); }
.term-pop-easy { margin-top: var(--space-1); color: var(--color-text); }
.term-pop-more { display: inline-block; margin-top: var(--space-2); font-size: var(--fs-xs); font-weight: 700; }

/* ---------- 광고 칸 (틀) ---------- */
.ad-slot { position: relative; display: flex; align-items: center; justify-content: center; margin: var(--space-5) auto; border: 1px dashed var(--color-line); border-radius: var(--radius); background: var(--color-surface); color: var(--color-text-sub); font-size: var(--fs-xs); text-align: center; overflow: hidden; }
.ad-slot::before { content: "광고"; position: absolute; top: 0; left: 0; padding: 2px var(--space-2); border-radius: 0 0 8px 0; background: var(--color-surface-2); color: var(--color-text-sub); font-size: 11px; font-weight: 700; letter-spacing: 0.08em; }
.ad-slot--banner { width: 100%; max-width: 728px; min-height: 90px; }
.ad-slot--box { width: 100%; max-width: 300px; min-height: 250px; }
.ad-slot a { display: block; width: 100%; }
.ad-slot img { display: block; width: 100%; height: auto; }
.ad-slot-empty { padding: var(--space-4); line-height: 1.5; }

/* ---------- 꼬리말(고지 문구) ---------- */
.site-footer { margin-top: var(--space-6); border-top: 1px solid var(--color-line); background: #0B0C0F; color: var(--color-text-sub); font-size: var(--fs-xs); }
.site-footer .container { padding-top: var(--space-5); padding-bottom: var(--space-6); }
.footer-disclaimer { font-size: var(--fs-sm); font-weight: 700; line-height: 1.6; color: var(--color-text); }
.footer-sources { margin-top: var(--space-3); line-height: 1.7; }
.footer-sources b { color: var(--color-text); font-weight: 700; margin-right: var(--space-1); }

/* ---------- 작은 화면 ---------- */
@media (max-width: 639px) {
  .site-header .container { gap: 0; }
  .site-nav { width: 100%; margin: 0 calc(var(--space-3) * -1); flex-wrap: nowrap; overflow-x: auto; scrollbar-width: none; }
  .site-nav::-webkit-scrollbar { display: none; }
  .site-nav a { white-space: nowrap; font-size: var(--fs-sm); }
  .hero { padding: var(--space-6) 0 28px; }
  .hero-title { font-size: 28px; }
  .page-title { font-size: 24px; }
  .sec-title { font-size: var(--fs-lg); }
}
<<<END FILE>>>

<<<FILE: js/common.js>>>
/* ==========================================================================
   js/common.js — 모든 페이지가 같이 쓰는 공통 함수 (팀장만 수정)

   쓰는 법: 모든 함수는 Common. 으로 시작한다.  예) Common.formatWon(5800)
   각 페이지는 맨 처음에 Common.initPage(...) 를 한 번 부른다.

   [함수 목록]
   페이지 준비   initPage, renderHeader, renderFooter
   데이터        loadData, loadAll, findById, buildProducts
   숫자 포맷     formatNumber, formatWon, formatPercent, formatDate
   계산          calcPriceYield, calcPNav, calcInstallmentIncome, distanceKm
   생활 언어     translatePNav, translateWale, translateDividend
   적금          getBestSaving
   타깃          TARGETS, getTarget, setTarget, sortByTarget
   규정          BANNED_WORDS, checkBannedWords, DISCLAIMER, getSourceText, getCardDisclaimer
   용어 풀이     termHtml, initTerms
   광고 칸       renderAds
   기타          escapeHtml, getQueryIds, isLiveMode, getLivePrice
   상수          NA, NA_ETF, COFFEE, MONTHLY_DEFAULT

   규칙: 값이 없으면(null) 지어내지 않고 "데이터 없음"을 돌려준다.
   ========================================================================== */
var Common = (function () {
  "use strict";

  // ---------------------------------------------------------------------
  // 상수
  // ---------------------------------------------------------------------
  var NA = "데이터 없음";
  var NA_ETF = "해당 없음 (여러 리츠를 묶은 상품)";
  var NA_GLOBAL = "해당 없음 (해외 리츠는 국내 공시 지표가 없어요)";
  var YIELD_CAUTION_PCT = 15;           // 주가 기준 배당수익률이 이 값 이상이면 주의 문구를 붙인다
  var MONTHLY_DEFAULT = 50000;          // 번역 예시에 쓰는 기본 월 납입액(원)
  var TARGET_STORAGE_KEY = "cb_target";  // localStorage 에 타깃을 저장하는 이름

  // 커피 한 잔 값(가정). 화면에서 사용자가 바꿀 수 있게 하고, 출처를 항상 같이 보여준다.
  var COFFEE = {
    price: 4700,
    label: "스타벅스 카페 아메리카노 Tall",
    source: "스타벅스코리아 가격 조정 발표(2025-01-24 적용) 보도",
    as_of: "2025-01-24"
  };

  var DISCLAIMER = "본 사이트는 대학 수업 과제용이며 투자 권유가 아닙니다. 리츠·ETF는 원금 손실이 발생할 수 있습니다.";
  var CARD_DISCLAIMER = "수업 과제용 · 투자 권유 아님 · 리츠·ETF는 원금 손실 가능";

  // 투자광고에 쓰면 안 되는 표현 (CONVENTIONS.md 6장)
  var BANNED_WORDS = ["보장", "무조건", "확정", "원금 보장", "대박", "100%", "안전한 투자", "절대"];

  // 타깃 3종과 정렬 기준 ("추천"이 아니라 "정렬 기준"이라고 쓴다)
  var TARGETS = [
    { key: "student", label: "대학생", sortLabel: "1주 가격 낮은 순", reason: "소액으로 시작",
      headline: "적은 돈으로 시작하는 건물 한 조각" },
    { key: "rookie", label: "사회초년생", sortLabel: "WALE 긴 순 (세입자 계약이 오래 남은 순)", reason: "안정성",
      headline: "첫 월급, 세입자 계약이 길게 남은 건물부터 살펴보기" },
    { key: "renter", label: "월세 사는 1인가구", sortLabel: "주가 기준 배당수익률 높은 순", reason: "월세 받는 쪽 되기",
      headline: "월세 내는 쪽에서, 월세 받는 쪽도 되어 보기" }
  ];

  var NAV_ITEMS = [
    { key: "index", label: "홈", href: "index.html" },
    { key: "map", label: "지도", href: "map.html" },
    { key: "compare", label: "비교", href: "compare.html" },
    { key: "learn", label: "용어 배우기", href: "learn.html" },
    { key: "card", label: "홍보 카드", href: "card.html" }
  ];

  var SOURCE_LABELS = {        // meta.json 이 없을 때 꼬리말에 보여줄 이름
    reits: "국토교통부 리츠정보", assets: "국토교통부 리츠정보(보유 자산)", metrics: "리츠정보시스템 상장리츠현황",
    prices: "금융위원회 시세정보", dividends: "OpenDART 배당", savings: "금융감독원 금융상품한눈에"
  };

  var cache = {};              // 한 번 읽은 JSON 을 다시 받지 않게 보관

  // ---------------------------------------------------------------------
  // 기타 도구
  // ---------------------------------------------------------------------
  function isNum(value) {
    return typeof value === "number" && isFinite(value);
  }

  /** 글자를 HTML 에 안전하게 넣을 수 있게 바꾼다 (꼭 써야 함: 데이터를 innerHTML 에 넣을 때) */
  function escapeHtml(value) {
    return String(value === null || value === undefined ? "" : value)
      .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;").replace(/'/g, "&#39;");
  }

  /** 주소의 ?ids=293940,330590 를 ["293940", "330590"] 로 (최대 3개) */
  function getQueryIds() {
    var match = /[?&]ids=([^&#]*)/.exec(window.location.search);
    if (!match) { return []; }
    return decodeURIComponent(match[1]).split(",").map(function (s) { return s.trim(); })
      .filter(Boolean).slice(0, 3);
  }

  // ---------------------------------------------------------------------
  // 데이터 불러오기
  // ---------------------------------------------------------------------
  /** data/이름.json 을 읽는다. 파일이 없거나 실패하면 null (화면은 "데이터 없음"으로 처리) */
  function loadData(name) {
    if (cache[name]) { return cache[name]; }
    cache[name] = fetch("data/" + name + ".json", { cache: "no-cache" })
      .then(function (res) { return res.ok ? res.json() : null; })
      .catch(function () { return null; });
    return cache[name];
  }

  /** 여러 파일을 한 번에. loadAll(["reits","prices"]) → { reits: {...}, prices: {...} } */
  function loadAll(names) {
    return Promise.all(names.map(loadData)).then(function (list) {
      var result = {};
      names.forEach(function (name, i) { result[name] = list[i]; });
      return result;
    });
  }

  /** items 배열에서 id 가 같은 항목 하나. 없으면 null */
  function findById(items, id) {
    if (!items) { return null; }
    for (var i = 0; i < items.length; i += 1) {
      if (items[i] && items[i].id === id) { return items[i]; }
    }
    return null;
  }

  function itemsOf(file) {
    return file && Array.isArray(file.items) ? file.items : [];
  }

  /**
   * 여러 JSON 을 종목별 한 줄로 합친다.
   * 입력: loadAll(["reits","metrics","prices","dividends"]) 의 결과 (일부가 null 이어도 됨)
   * 출력: 상품 배열. 각 상품의 값은 없으면 null.
   *   key(화면용 고유값), id(종목코드 또는 null), type("reit"|"etf"), name, assetType, amc, assetCount,
   *   price(1주 가격), priceDate, marketCap, dpsAnnual, dpsBasis, priceYield(주가 기준 배당수익률 %),
   *   capitalYield(자본금 기준 %), capitalYieldAnnualized, pNav(직접 계산), pNavReported(원자료),
   *   navMillionWon, waleYears, baseIndex(ETF 기초지수)
   */
  function buildProducts(data) {
    var products = [];
    var byKey = {};

    function ensure(key, id, type, name) {
      if (!byKey[key]) {
        byKey[key] = {
          key: key, id: id || null, type: type, name: name, assetType: null, amc: null, assetCount: null,
          price: null, priceDate: null, changePct: null, priceLocal: null, currency: "KRW", country: null,
          hq: null, hqLat: null, hqLng: null,
          history: null,                 // 최근 1년 종가 기록 [["2026-01-02", 5600], ...] (그래프용)
          marketCap: null, dpsAnnual: null, dpsBasis: null, priceYield: null,
          capitalYield: null, capitalYieldAnnualized: null, pNav: null, pNavReported: null,
          navMillionWon: null, waleYears: null, baseIndex: null
        };
        products.push(byKey[key]);
      }
      return byKey[key];
    }

    itemsOf(data.reits).forEach(function (r) {
      var p = ensure(r.id, r.id, "reit", r.name);
      p.assetType = r.main_asset_type || (r.asset_types && r.asset_types[0]) || null;
      p.amc = r.amc || null;
      p.assetCount = isNum(r.asset_count) ? r.asset_count : null;
    });

    itemsOf(data.prices).forEach(function (row) {
      if (!row.id) { return; }
      var kind = row.type === "etf" ? "etf" : (row.type === "global" ? "global" : "reit");
      var p = ensure(row.id, row.id, kind, row.name);
      p.price = isNum(row.close) ? row.close : null;                 // 원화(해외 리츠는 환산한 값)
      p.priceDate = row.base_date || null;
      p.changePct = isNum(row.change_pct) ? row.change_pct : null;
      p.priceLocal = isNum(row.close_local) ? row.close_local : null;  // 해외 리츠의 현지 통화 가격
      p.currency = row.currency || "KRW";
      p.country = row.country || null;
      if (kind === "global") {
        p.assetType = row.sub_industry || null;
        p.hq = row.hq || null;                                       // 본사가 있는 도시
        p.hqLat = isNum(row.hq_lat) ? row.hq_lat : null;
        p.hqLng = isNum(row.hq_lng) ? row.hq_lng : null;
      }
      p.marketCap = isNum(row.market_cap) ? row.market_cap : null;
      p.baseIndex = row.base_index || null;
    });

    itemsOf(data.metrics).forEach(function (m) {
      // 종목코드가 아직 안 붙은 지표(리츠 목록을 받기 전)는 이름으로 구분해서 보여준다
      var key = m.id || ("m:" + m.name);
      var p = ensure(key, m.id, "reit", m.name);
      p.assetType = p.assetType || m.asset_type || null;
      p.capitalYield = isNum(m.dividend_yield_capital) ? m.dividend_yield_capital : null;
      p.capitalYieldAnnualized = isNum(m.dividend_yield_annualized) ? m.dividend_yield_annualized : null;
      p.pNavReported = isNum(m.p_nav_reported) ? m.p_nav_reported : null;
      p.navMillionWon = isNum(m.nav_million_won) ? m.nav_million_won : null;
      p.waleYears = isNum(m.wale_years) ? m.wale_years : null;
    });

    itemsOf(data.dividends).forEach(function (d) {
      if (!d.id || !byKey[d.id]) { return; }
      byKey[d.id].dpsAnnual = isNum(d.dps_annual) ? d.dps_annual : null;
      byKey[d.id].dpsBasis = d.dps_basis || null;
    });

    itemsOf(data.history).forEach(function (h) {
      if (h.id && byKey[h.id] && Array.isArray(h.points) && h.points.length > 1) { byKey[h.id].history = h.points; }
    });

    products.forEach(function (p) {
      p.priceYield = calcPriceYield(p.dpsAnnual, p.price);
      p.pNav = p.type === "reit" ? calcPNav(p.marketCap, p.navMillionWon) : null;
    });
    return products;
  }

  // ---------------------------------------------------------------------
  // 숫자 포맷 (값이 없으면 "데이터 없음")
  // ---------------------------------------------------------------------
  function formatNumber(n) {
    return isNum(n) ? Math.round(n).toLocaleString("ko-KR") : NA;
  }

  function formatWon(n) {
    return isNum(n) ? Math.round(n).toLocaleString("ko-KR") + "원" : NA;
  }

  function formatPercent(n, digits) {
    return isNum(n) ? n.toFixed(isNum(digits) ? digits : 1) + "%" : NA;
  }

  /** 달러 표시: 57.3 → "$57.30" */
  function formatUsd(n) {
    return isNum(n) ? "$" + n.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : NA;
  }

  /** 등락률 표시: 1.85 → "+1.85%" (오르면 빨강, 내리면 파랑으로 쓸 수 있게 class 도 같이) */
  function formatChange(pct) {
    if (!isNum(pct)) { return { text: "", cls: "" }; }
    return { text: (pct > 0 ? "+" : "") + pct.toFixed(2) + "%", cls: pct > 0 ? "num-up" : (pct < 0 ? "num-down" : "") };
  }

  /**
   * 주가 기록으로 작은 선 그래프(SVG)를 만든다. 주식 앱처럼 기간 동안 올랐으면 빨강, 내렸으면 파랑.
   * 입력: points [["2026-01-02", 5600], ...], options { width, height }
   * 출력: { svg(HTML 글자), changePct(기간 등락률 %), from(시작일), to(끝일) }. 기록이 없으면 svg 는 ""
   */
  function sparkline(points, options) {
    var opts = options || {};
    var width = opts.width || 120;
    var height = opts.height || 40;
    var list = (points || []).filter(function (p) { return p && isNum(p[1]); });
    if (list.length < 2) { return { svg: "", changePct: null, from: null, to: null }; }
    var values = list.map(function (p) { return p[1]; });
    var min = Math.min.apply(null, values);
    var max = Math.max.apply(null, values);
    var span = (max - min) || 1;
    var first = values[0];
    var last = values[values.length - 1];
    function y(value) { return (height - 3 - (value - min) / span * (height - 6)).toFixed(1); }
    var line = values.map(function (value, i) {
      return (i / (values.length - 1) * width).toFixed(1) + "," + y(value);
    }).join(" ");
    var changePct = first > 0 ? (last - first) / first * 100 : null;
    var cls = last > first ? "num-up" : (last < first ? "num-down" : "");
    var label = "주가 흐름 " + formatDate(list[0][0]) + "부터 " + formatDate(list[list.length - 1][0]) + "까지" +
      (isNum(changePct) ? ", " + (changePct > 0 ? "+" : "") + changePct.toFixed(1) + "%" : "");
    var svg = '<svg class="spark ' + cls + '" viewBox="0 0 ' + width + " " + height + '" preserveAspectRatio="none" role="img" aria-label="' +
      escapeHtml(label) + '">' +
      '<line class="spark-base" x1="0" x2="' + width + '" y1="' + y(first) + '" y2="' + y(first) + '"></line>' +
      '<polyline class="spark-line" points="' + line + '"></polyline></svg>';
    return { svg: svg, changePct: changePct, from: list[0][0], to: list[list.length - 1][0] };
  }

  /** "2026-11-13" → "2026.11.13",  "2026-11" → "2026.11" */
  function formatDate(text) {
    return text ? String(text).replace(/-/g, ".") : NA;
  }

  // ---------------------------------------------------------------------
  // 계산
  // ---------------------------------------------------------------------
  /** 주가 기준 배당수익률(%) = 최근 1년 주당배당금 ÷ 가격 × 100 */
  function calcPriceYield(dpsAnnual, price) {
    if (!isNum(dpsAnnual) || !isNum(price) || price <= 0) { return null; }
    return dpsAnnual / price * 100;
  }

  /**
   * P/NAV(직접 계산) = 시가총액(원) ÷ NAV(원)
   * 리츠정보시스템의 P/NAV 원자료는 "주가(원) ÷ NAV(백만원)"라서 0.0079 같은 값이 나온다.
   * 그대로는 "1만 원어치 건물을 얼마에 사는 셈"으로 바꿀 수 없어서, 공식 숫자 두 개로 직접 계산한다.
   */
  function calcPNav(marketCapWon, navMillionWon) {
    if (!isNum(marketCapWon) || !isNum(navMillionWon) || navMillionWon <= 0) { return null; }
    return marketCapWon / (navMillionWon * 1000000);
  }

  /**
   * 매달 같은 돈을 넣을 때 "모으는 1년 동안" 생기는 이자·배당(세전).
   * 적금 이자 계산법(단리)과 똑같이 계산해서 리츠와 적금을 같은 잣대로 비교한다.
   *   첫 달에 넣은 돈은 12개월, 둘째 달은 11개월 ... 마지막 달은 1개월 치를 받는다
   *   = 월 납입액 × (연 수익률 ÷ 100) × (12+11+...+1) ÷ 12 = 월 납입액 × 연 수익률 × 6.5 ÷ 100
   */
  function calcInstallmentIncome(monthlyWon, ratePct, months) {
    var count = isNum(months) ? months : 12;
    if (!isNum(monthlyWon) || !isNum(ratePct)) { return null; }
    return monthlyWon * (ratePct / 100) * (count * (count + 1) / 2) / 12;
  }

  /** 두 지점 사이의 직선 거리(km) */
  function distanceKm(lat1, lng1, lat2, lng2) {
    if (![lat1, lng1, lat2, lng2].every(isNum)) { return null; }
    var rad = Math.PI / 180;
    var dLat = (lat2 - lat1) * rad;
    var dLng = (lng2 - lng1) * rad;
    var a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(lat1 * rad) * Math.cos(lat2 * rad) * Math.sin(dLng / 2) * Math.sin(dLng / 2);
    return 6371 * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  }

  // ---------------------------------------------------------------------
  // 생활 언어 번역  →  { text(쉬운 말), raw(원래 숫자), note(계산식·가정) }
  // ---------------------------------------------------------------------
  /** P/NAV 0.8 → "1만 원어치 건물을 약 8,000원에 사는 셈" */
  function translatePNav(pNav) {
    if (!isNum(pNav) || pNav <= 0) {
      return { text: NA, raw: "P/NAV " + NA, note: "" };
    }
    var per = Math.round(pNav * 10000 / 100) * 100;          // 1만 원어치 건물의 값(100원 단위)
    var text;
    if (pNav < 0.98) {
      text = "1만 원어치 건물을 약 " + formatNumber(per) + "원에 사는 셈";
    } else if (pNav <= 1.02) {
      text = "건물 가치와 거의 같은 값에 사는 셈";
    } else {
      text = "1만 원어치 건물을 약 " + formatNumber(per) + "원에 사는 셈 (웃돈)";
    }
    return {
      text: text,
      raw: "P/NAV " + pNav.toFixed(2) + " (직접 계산)",
      note: "계산식: 시가총액 ÷ NAV(자산 감정평가액 − 부채). 싸게 거래된다고 해서 주가가 오른다는 뜻은 아니에요."
    };
  }

  /** WALE 5.2년 → "세입자들 계약이 평균 5년 넘게 남아 있어요" */
  function translateWale(years) {
    if (!isNum(years) || years <= 0) {
      return { text: NA, raw: "WALE " + NA, note: "" };
    }
    var whole = Math.floor(years);
    var text;
    if (years < 1) {
      text = "세입자들 계약이 평균 1년도 안 남았어요";
    } else if (years - whole < 0.05) {
      text = "세입자들 계약이 평균 약 " + whole + "년 남아 있어요";
    } else {
      text = "세입자들 계약이 평균 " + whole + "년 넘게 남아 있어요";
    }
    return {
      text: text,
      raw: "WALE " + years.toFixed(2) + "년",
      note: "남은 계약 기간을 임대 면적 비중으로 평균 낸 값. 길수록 임대료가 끊길 걱정이 적지만, 계약이 끝난 뒤는 알 수 없어요."
    };
  }

  /**
   * 배당수익률 → "매달 5만 원씩 1년 모으면 그 1년 배당은 약 ○원 (커피 ○잔)"
   * 입력: 주가 기준 배당수익률(%), 월 납입액(기본 5만 원), 커피 한 잔 값(기본 COFFEE.price)
   * 출력: text, raw, note + firstYearWon(모으는 1년), nextYearWon(다 모은 뒤 1년), cups
   */
  function translateDividend(yieldPct, monthlyWon, coffeePrice) {
    var monthly = isNum(monthlyWon) && monthlyWon > 0 ? monthlyWon : MONTHLY_DEFAULT;
    var coffee = isNum(coffeePrice) && coffeePrice > 0 ? coffeePrice : COFFEE.price;
    if (!isNum(yieldPct)) {
      return { text: NA, raw: "주가 기준 배당수익률 " + NA, note: "", caution: null, firstYearWon: null, nextYearWon: null, cups: null };
    }
    var firstYear = calcInstallmentIncome(monthly, yieldPct, 12);
    var nextYear = monthly * 12 * yieldPct / 100;
    var cups = Math.floor(firstYear / coffee);
    var man = monthly / 10000;
    var monthlyText = (man === Math.floor(man) ? man : man.toFixed(1)) + "만 원";
    var caution = yieldPct >= YIELD_CAUTION_PCT
      ? "배당수익률이 유난히 높아요(" + YIELD_CAUTION_PCT + "% 이상). 주가가 많이 내렸거나, 건물을 팔아서 준 한 번뿐인 배당이 섞였을 수 있어요. 앞으로도 이만큼 준다는 뜻이 아니에요."
      : null;
    return {
      caution: caution,
      text: "매달 " + monthlyText + "씩 1년 모으면 그 1년 배당은 약 " + formatWon(firstYear) + " (커피 " + cups + "잔)",
      raw: "주가 기준 배당수익률 " + formatPercent(yieldPct, 2) + " (최근 1년 배당 기준)",
      note: "계산식: 월 납입액 × 수익률 × 6.5 (적금 이자와 같은 방식). 다 모은 " + formatWon(monthly * 12) +
        "을 1년 더 들고 있으면 약 " + formatWon(nextYear) + ". 가정: 주가와 배당이 지금과 같음, 세금(15.4%) 떼기 전, " +
        "커피 한 잔 " + formatWon(coffee) + ". 과거 배당 실적이며 앞으로는 달라질 수 있어요.",
      firstYearWon: firstYear,
      nextYearWon: nextYear,
      cups: cups
    };
  }

  // ---------------------------------------------------------------------
  // 적금 (비교 화면 맨 오른쪽 칸)
  // ---------------------------------------------------------------------
  /**
   * 비교에 쓸 "은행 적금(최고 금리)" 한 줄을 고른다. 고른 기준(rule)을 화면에 공개한다.
   * 기준: 은행 적금 · 12개월 · 가입제한 없음(누구나) · 정액적립식(없으면 전체) 중 최고 우대금리가 가장 높은 것
   */
  function getBestSaving(savingsFile) {
    var rows = itemsOf(savingsFile).filter(function (s) {
      return s.kind === "saving" && s.term_months === 12 && s.join_deny === 1 && isNum(s.rate_max);
    });
    var fixed = rows.filter(function (s) { return s.reserve_type && s.reserve_type.indexOf("정액") !== -1; });
    var pool = fixed.length ? fixed : rows;
    if (!pool.length) { return null; }
    pool.sort(function (a, b) { return b.rate_max - a.rate_max || (b.rate_base || 0) - (a.rate_base || 0); });
    return {
      item: pool[0],
      rule: "은행 적금 · 12개월 · 누구나 가입 가능(가입제한 없음)" + (fixed.length ? " · 정액적립식" : "") +
        " 상품 중 최고 우대금리가 가장 높은 상품"
    };
  }

  // ---------------------------------------------------------------------
  // 타깃
  // ---------------------------------------------------------------------
  function getTarget() {
    try {
      var value = window.localStorage.getItem(TARGET_STORAGE_KEY);
      return TARGETS.some(function (t) { return t.key === value; }) ? value : null;
    } catch (e) {
      return null;       // 사생활 보호 모드 등에서는 저장소를 못 쓸 수 있다
    }
  }

  function setTarget(key) {
    try { window.localStorage.setItem(TARGET_STORAGE_KEY, key); } catch (e) { /* 저장 못 해도 화면은 계속 */ }
  }

  /** 타깃의 정렬 기준대로 정렬한 새 배열. 값이 없는 상품은 맨 뒤로 보낸다 */
  function sortByTarget(products, targetKey) {
    var field = targetKey === "student" ? "price" : (targetKey === "rookie" ? "waleYears" : "priceYield");
    var ascending = targetKey === "student";
    return products.slice().sort(function (a, b) {
      var av = a[field], bv = b[field];
      if (!isNum(av) && !isNum(bv)) { return a.name.localeCompare(b.name, "ko"); }
      if (!isNum(av)) { return 1; }
      if (!isNum(bv)) { return -1; }
      return ascending ? av - bv : bv - av;
    });
  }

  // ---------------------------------------------------------------------
  // 금지어 · 고지 문구
  // ---------------------------------------------------------------------
  /** 문구에 금지어가 있는지. 띄어쓰기를 지우고 검사한다 → { ok, found: [걸린 금지어] } */
  function checkBannedWords(text) {
    var squashed = String(text || "").replace(/\s+/g, "");
    var found = BANNED_WORDS.filter(function (word) {
      return squashed.indexOf(word.replace(/\s+/g, "")) !== -1;
    });
    return { ok: found.length === 0, found: found };
  }

  /** "출처 이름 (기준일 2026.11.13), ..." — meta.json 에서 읽어서 만든다 */
  function getSourceText(meta, sourceKeys) {
    var files = (meta && meta.files) || {};
    var parts = (sourceKeys || []).map(function (key) {
      var info = files[key];
      if (!info) { return (SOURCE_LABELS[key] || key) + " (" + NA + ")"; }
      return info.source + " (기준일 " + formatDate(info.as_of) + ")";
    });
    return parts.length ? parts.join(", ") : NA;
  }

  /** 홍보 카드 맨 아래에 넣는 짧은 고지 문구 (사용자가 지울 수 없게 자동으로 넣는다) */
  function getCardDisclaimer(meta, sourceKeys) {
    return CARD_DISCLAIMER + " · 출처: " + getSourceText(meta, sourceKeys);
  }

  // ---------------------------------------------------------------------
  // 머리말 · 꼬리말
  // ---------------------------------------------------------------------
  function renderHeader(activePage) {
    var el = document.getElementById("site-header");
    if (!el) { return; }
    el.className = "site-header";
    el.innerHTML =
      '<div class="container">' +
        '<a class="brand" href="index.html"><span class="brand-name">리츠 투자</span>' +
        '<span class="brand-tag">2030 REITs</span></a>' +
        '<nav class="site-nav" aria-label="주 메뉴">' +
        NAV_ITEMS.map(function (item) {
          return '<a href="' + item.href + '"' + (item.key === activePage ? ' class="is-active" aria-current="page"' : "") +
            ">" + item.label + "</a>";
        }).join("") +
        "</nav></div>";
  }

  /** 고지 문구 + 이 페이지가 쓴 데이터의 출처·기준일을 넣는다 */
  function renderFooter(sourceKeys) {
    var el = document.getElementById("site-footer");
    if (!el) { return Promise.resolve(); }
    el.className = "site-footer";
    return loadData("meta").then(function (meta) {
      el.innerHTML =
        '<div class="container">' +
          '<p class="footer-disclaimer">' + escapeHtml(DISCLAIMER) + "</p>" +
          '<p class="footer-sources"><b>데이터 출처</b> ' + escapeHtml(getSourceText(meta, sourceKeys)) + "</p>" +
        "</div>";
    });
  }

  // ---------------------------------------------------------------------
  // 용어 풀이: 점선 밑줄 글자를 누르면 쉬운 설명이 뜬다
  // ---------------------------------------------------------------------
  /** 본문에 넣을 용어 버튼 HTML.  termHtml("wale", "WALE") */
  function termHtml(termId, label) {
    return '<button type="button" class="term" data-term="' + escapeHtml(termId) + '">' + escapeHtml(label) + "</button>";
  }

  var termPop = null;

  function closeTermPop() {
    if (termPop) { termPop.remove(); termPop = null; }
  }

  /** 페이지 안의 .term[data-term] 에 설명 말풍선을 붙인다 (data/glossary.json 사용) */
  function initTerms() {
    if (initTerms.done) { return; }
    initTerms.done = true;
    document.addEventListener("click", function (event) {
      var button = event.target.closest ? event.target.closest(".term[data-term]") : null;
      if (!button) {
        if (termPop && !termPop.contains(event.target)) { closeTermPop(); }
        return;
      }
      event.preventDefault();
      loadData("glossary").then(function (glossary) {
        var term = findById(itemsOf(glossary), button.getAttribute("data-term"));
        closeTermPop();
        if (!term) { return; }
        termPop = document.createElement("div");
        termPop.className = "term-pop";
        termPop.setAttribute("role", "dialog");
        termPop.innerHTML =
          '<div class="term-pop-title">' + escapeHtml(term.term) + "</div>" +
          '<div class="term-pop-easy">' + escapeHtml(term.easy) + "</div>" +
          '<a class="term-pop-more" href="learn.html#term-' + escapeHtml(term.id) + '">용어 배우기에서 더 보기 →</a>';
        document.body.appendChild(termPop);
        var box = button.getBoundingClientRect();
        var left = Math.max(16, Math.min(box.left, window.innerWidth - termPop.offsetWidth - 16));
        termPop.style.left = (left + window.scrollX) + "px";
        termPop.style.top = (box.bottom + window.scrollY + 6) + "px";
      });
    });
    document.addEventListener("keydown", function (event) {
      if (event.key === "Escape") { closeTermPop(); }
    });
  }

  // ---------------------------------------------------------------------
  // 광고 칸: <div class="ad-slot ad-slot--banner" data-ad="home-top"></div>
  // ---------------------------------------------------------------------
  /** data/ads.json 에 등록된 광고가 있으면 넣고, 없으면 "광고 자리" 틀만 보여준다 */
  function renderAds() {
    var slots = document.querySelectorAll(".ad-slot[data-ad]");
    if (!slots.length) { return Promise.resolve(); }
    return loadData("ads").then(function (ads) {
      var list = itemsOf(ads);
      Array.prototype.forEach.call(slots, function (slot) {
        var position = slot.getAttribute("data-ad");
        var ad = list.filter(function (a) { return a.position === position || a.position === "any"; })[0];
        if (ad && ad.image && ad.link) {
          slot.innerHTML =
            '<a href="' + escapeHtml(ad.link) + '" target="_blank" rel="noopener sponsored nofollow">' +
            '<img src="' + escapeHtml(ad.image) + '" alt="' + escapeHtml(ad.alt || ad.advertiser || "광고") + '" loading="lazy"></a>';
        } else {
          slot.innerHTML = '<div class="ad-slot-empty">광고 자리<br>이 칸에 배너 광고가 들어갑니다</div>';
        }
        slot.setAttribute("aria-label", "광고");
      });
    });
  }

  // ---------------------------------------------------------------------
  // 실시간 시세 (선택 기능, 발표자 노트북 전용)
  // ---------------------------------------------------------------------
  /** 주소에 ?live=1 을 붙였을 때만 실시간 모드. (방문자 브라우저가 로컬 서버를 찾아 헤매지 않게) */
  function isLiveMode() {
    return /[?&]live=1(&|$)/.test(window.location.search);
  }

  /** 로컬 실시간 서버에서 현재가를 받는다. 실시간 모드가 아니거나 서버가 꺼져 있으면 null */
  function getLivePrice(id) {
    if (!isLiveMode() || !window.AbortController) { return Promise.resolve(null); }
    var controller = new AbortController();
    var timer = window.setTimeout(function () { controller.abort(); }, 800);
    return fetch("http://127.0.0.1:8787/price?id=" + encodeURIComponent(id), { signal: controller.signal })
      .then(function (res) { return res.ok ? res.json() : null; })
      .then(function (body) { return body && isNum(body.price) ? { price: body.price, time: body.time || null } : null; })
      .catch(function () { return null; })
      .then(function (result) { window.clearTimeout(timer); return result; });
  }

  // ---------------------------------------------------------------------
  // 페이지 준비: 각 페이지가 맨 처음 한 번 부른다
  // ---------------------------------------------------------------------
  /**
   * Common.initPage({ active: "map", sources: ["assets", "prices"] })
   *   active  : 메뉴에서 표시할 현재 페이지 ("index","map","compare","learn","card")
   *   sources : 이 페이지가 쓰는 데이터 이름들 → 꼬리말에 출처·기준일로 표시
   */
  function initPage(options) {
    var opts = options || {};
    renderHeader(opts.active);
    initTerms();
    return Promise.all([renderFooter(opts.sources || []), renderAds()]);
  }

  return {
    NA: NA, NA_ETF: NA_ETF, NA_GLOBAL: NA_GLOBAL, YIELD_CAUTION_PCT: YIELD_CAUTION_PCT,
    COFFEE: COFFEE, MONTHLY_DEFAULT: MONTHLY_DEFAULT, formatUsd: formatUsd, formatChange: formatChange,
    sparkline: sparkline,
    TARGETS: TARGETS, BANNED_WORDS: BANNED_WORDS, DISCLAIMER: DISCLAIMER,
    initPage: initPage, renderHeader: renderHeader, renderFooter: renderFooter,
    loadData: loadData, loadAll: loadAll, findById: findById, buildProducts: buildProducts,
    formatNumber: formatNumber, formatWon: formatWon, formatPercent: formatPercent, formatDate: formatDate,
    calcPriceYield: calcPriceYield, calcPNav: calcPNav, calcInstallmentIncome: calcInstallmentIncome,
    distanceKm: distanceKm,
    translatePNav: translatePNav, translateWale: translateWale, translateDividend: translateDividend,
    getBestSaving: getBestSaving,
    getTarget: getTarget, setTarget: setTarget, sortByTarget: sortByTarget,
    checkBannedWords: checkBannedWords, getSourceText: getSourceText, getCardDisclaimer: getCardDisclaimer,
    termHtml: termHtml, initTerms: initTerms, renderAds: renderAds,
    escapeHtml: escapeHtml, getQueryIds: getQueryIds, isLiveMode: isLiveMode, getLivePrice: getLivePrice
  };
})();
<<<END FILE>>>

<<<FILE: js/compare.js>>>
/* ==========================================================================
   js/compare.js — 비교 화면 (compare.html)
   - 리츠·리츠 ETF를 최대 3개 골라 나란히 비교. 맨 오른쪽 칸은 항상 "은행 적금"
   - 숫자는 생활 언어로 바꿔 크게, 원래 숫자와 계산식은 그 아래 작게 항상 같이 보여준다
   - "원금 손실 가능"(리츠)과 "원금 보장"(적금)은 같은 크기로 보여준다
   - 주소: compare.html?ids=종목코드,종목코드  (최대 3개)
   ========================================================================== */
(function () {
  "use strict";

  var MAX_PICK = 3;
  var state = {
    products: [], savings: null, picked: [],        // picked: 고른 상품의 key 목록
    monthly: Common.MONTHLY_DEFAULT, coffee: Common.COFFEE.price,
    live: {}                                         // key → 실시간 가격(있을 때만)
  };

  var POINTS = {      // 좋은 점과 조심할 점: 칸마다 같은 개수, 같은 크기로
    reit: {
      good: ["커피 몇 잔 값으로 큰 건물에 참여할 수 있어요", "건물 임대료에서 나오는 배당이 있어요", "주식처럼 사고팔 수 있어요"],
      care: ["주가가 내리면 원금 손실이 나요", "배당은 줄거나 없을 수 있어요", "금리가 오르면 불리해지는 경우가 많아요"]
    },
    etf: {
      good: ["여러 리츠에 나눠 담아요", "한 번에 여러 건물에 참여해요", "주식처럼 사고팔 수 있어요"],
      care: ["리츠 시장 전체가 내리면 같이 내려요", "운용 보수(수수료)가 들어요", "주가가 내리면 원금 손실이 나요"]
    },
    global: {
      good: ["세계적으로 큰 리츠에 참여할 수 있어요", "달러로 배당을 받아요", "분기나 매달 배당을 주는 곳이 많아요"],
      care: ["환율에 따라 원화로 받는 돈이 달라져요", "배당에서 미국 세금 15%를 먼저 떼요", "주가가 내리면 원금 손실이 나요"]
    },
    saving: {
      good: ["원금과 이자가 예금자보호 한도(1억 원)까지 보호돼요", "이자가 가입할 때 정해져요", "매달 정한 금액을 딱 맞게 넣을 수 있어요"],
      care: ["최고 금리는 우대조건을 다 채워야 받아요", "물가가 더 많이 오르면 실제 가치는 줄어요", "중간에 깨면 이자가 크게 줄어요"]
    }
  };

  function productByKey(key) {
    return state.products.filter(function (p) { return p.key === key || p.id === key; })[0] || null;
  }

  function priceOf(p) {
    return state.live[p.key] ? state.live[p.key].price : p.price;
  }

  // ---------- 고르기 ----------
  function renderPick() {
    var groups = [["국내 리츠", "reit"], ["리츠 ETF", "etf"], ["해외 리츠 (미국)", "global"]];
    var html = "";
    for (var slot = 0; slot < MAX_PICK; slot += 1) {
      var options = '<option value="">선택 안 함</option>' + groups.map(function (group) {
        var list = state.products.filter(function (p) { return p.type === group[1]; })
          .sort(function (a, b) { return a.name.localeCompare(b.name, "ko"); });
        if (!list.length) { return ""; }
        return '<optgroup label="' + group[0] + '">' + list.map(function (p) {
          return '<option value="' + Common.escapeHtml(p.key) + '"' + (state.picked[slot] === p.key ? " selected" : "") + ">" +
            Common.escapeHtml(p.name) + "</option>";
        }).join("") + "</optgroup>";
      }).join("");
      html += '<label class="field"><span class="field-label">비교 ' + (slot + 1) + "</span>" +
        '<select class="select" data-slot="' + slot + '">' + options + "</select></label>";
    }
    document.getElementById("cmp-pick").innerHTML = html;
  }

  function saveToAddress() {
    var keys = state.picked.filter(Boolean);
    var query = keys.length ? "?ids=" + keys.map(encodeURIComponent).join(",") : "";
    if (Common.isLiveMode()) { query += (query ? "&" : "?") + "live=1"; }
    try { window.history.replaceState(null, "", window.location.pathname + query); } catch (e) { /* 주소를 못 바꿔도 화면은 계속 */ }
  }

  // ---------- 칸 만들기 ----------
  function cell(label, bodyHtml, extraClass) {
    return '<div class="cmp-cell ' + (extraClass || "") + '"><span class="cmp-label">' + label + "</span>" + bodyHtml + "</div>";
  }

  function lineHtml(line) {
    var empty = line.text === Common.NA || line.text === Common.NA_ETF || line.text.indexOf("해당 없음") === 0;
    return '<p class="translated' + (empty ? " na" : "") + '">' + Common.escapeHtml(line.text) + "</p>" +
      (line.raw ? '<p class="raw-note">' + Common.escapeHtml(line.raw) + "</p>" : "") +
      (line.caution ? '<p class="caution-note">' + Common.escapeHtml(line.caution) + "</p>" : "") +
      (line.note ? '<p class="raw-note">' + Common.escapeHtml(line.note) + "</p>" : "");
  }

  function pointsHtml(kind) {
    function list(items) {
      return '<ul class="cmp-points">' + items.map(function (t) { return "<li>" + Common.escapeHtml(t) + "</li>"; }).join("") + "</ul>";
    }
    return list(POINTS[kind].good) + '<span class="cmp-label">조심할 점</span>' + list(POINTS[kind].care);
  }

  function productColumn(p, first) {
    var cls = first ? "cmp-cell--first" : "";
    var isEtf = p.type === "etf";
    var isGlobal = p.type === "global";
    var noLocal = isEtf ? Common.NA_ETF : (isGlobal ? Common.NA_GLOBAL : null);   // 국내 공시 지표가 없는 상품
    var price = priceOf(p);
    var live = state.live[p.key];
    var priceYield = live ? Common.calcPriceYield(p.dpsAnnual, price) : p.priceYield;
    var pNav = noLocal ? { text: noLocal, raw: "P/NAV" } : Common.translatePNav(p.pNav);
    var wale = noLocal ? { text: noLocal, raw: "WALE" } : Common.translateWale(p.waleYears);
    var capital = noLocal
      ? { text: noLocal }
      : { text: p.capitalYieldAnnualized === null ? Common.NA : "자본금 기준 연 " + Common.formatPercent(p.capitalYieldAnnualized, 2),
          raw: "리츠정보시스템 연환산배당률 (결산 1회분 " + Common.formatPercent(p.capitalYield, 2) + ")",
          note: "배당액 ÷ 평균 납입자본금. 지금 주가로 사는 사람의 수익률이 아니에요." };
    var kindLabel = isEtf ? "리츠 ETF" : (isGlobal ? "해외 리츠" + (p.country ? " · " + Common.escapeHtml(p.country) : "")
      : "국내 리츠" + (p.assetType ? " · " + Common.escapeHtml(p.assetType) : ""));
    var change = Common.formatChange(p.changePct);
    var chart = Common.sparkline(p.history, { width: 240, height: 56 });       // 최근 1년 주가 그래프

    return [
      cell(kindLabel, '<p class="cmp-name">' + Common.escapeHtml(p.name) + "</p>", "cmp-cell--head " + cls),
      cell("원금",
        '<span class="label-risk">원금 손실 가능</span><p class="raw-note">주가가 내리면 넣은 돈보다 적게 돌려받아요. 예금자보호 대상이 아니에요.' +
        (isGlobal ? " 환율이 내려도 원화 가치가 줄어요." : "") + "</p>", cls),
      cell("매달 모으면 (" + Common.termHtml("price-yield", "주가 기준 배당수익률") + ")",
        lineHtml(Common.translateDividend(priceYield, state.monthly, state.coffee)), cls),
      cell("건물 값에 비해 (" + Common.termHtml("pnav", "P/NAV") + ")", lineHtml(pNav), cls),
      cell("세입자 계약 (" + Common.termHtml("wale", "WALE") + ")", lineHtml(wale), cls),
      cell("1주 가격",
        '<p class="translated' + (typeof price === "number" ? "" : " na") + '">' + Common.formatWon(price) +
        (live ? ' <span class="badge badge-live">실시간</span>' :
          (change.text ? ' <span class="cmp-change ' + change.cls + '">' + change.text + "</span>" : "")) + "</p>" +
        '<p class="raw-note">' + (live ? "현재가 (발표자 노트북의 실시간 서버)" :
          (p.priceDate ? Common.formatDate(p.priceDate) + " 종가 (전일 종가, 실시간 아님)" : "")) +
        (isGlobal && p.priceLocal !== null ? " · " + Common.formatUsd(p.priceLocal) + "를 원으로 바꾼 값" : "") + "</p>" +
        (chart.svg ? '<div class="cmp-chart">' + chart.svg + '<p class="spark-caption">최근 1년 주가 흐름 <span class="' +
          (chart.changePct > 0 ? "num-up" : (chart.changePct < 0 ? "num-down" : "")) + '">' +
          (chart.changePct > 0 ? "+" : "") + chart.changePct.toFixed(1) + "%</span>" +
          (isGlobal ? " (달러 기준)" : "") + "</p></div>" : ""), cls),
      cell("참고 (" + Common.termHtml("capital-yield", "자본금 기준") + ")", lineHtml(capital), cls),
      cell("좋은 점", pointsHtml(isEtf ? "etf" : (isGlobal ? "global" : "reit")), "cmp-cell--last " + cls)
    ].join("");
  }

  function savingColumn(first) {
    var cls = "cmp-cell--saving " + (first ? "cmp-cell--first" : "");
    var best = Common.getBestSaving(state.savings);
    var item = best ? best.item : null;
    var income, name;
    if (item) {
      var top = Common.calcInstallmentIncome(state.monthly, item.rate_max, 12);
      var base = Common.calcInstallmentIncome(state.monthly, item.rate_base, 12);
      var man = state.monthly / 10000;
      income = {
        text: "매달 " + man + "만 원씩 1년 모으면 이자는 약 " + Common.formatWon(top) + " (커피 " + Math.floor(top / state.coffee) + "잔)",
        raw: "최고 우대금리 연 " + Common.formatPercent(item.rate_max, 2) + " (기본 " + Common.formatPercent(item.rate_base, 2) + ")",
        note: "계산식: 월 납입액 × 금리 × 6.5 (단리). 우대조건을 모두 채웠을 때이고, 기본 금리로는 약 " +
          Common.formatWon(base) + ". 세금(15.4%) 떼기 전." +
          (item.rate_type && item.rate_type.indexOf("복리") !== -1 ? " 복리 상품이라 실제 이자는 조금 더 많아요." : "")
      };
      name = '<p class="cmp-name">' + Common.escapeHtml(item.bank) + "</p><p class=\"raw-note\">" + Common.escapeHtml(item.product) + " · 12개월</p>";
    } else {
      income = { text: Common.NA, raw: "은행 적금 금리 " + Common.NA };
      name = '<p class="cmp-name">은행 적금</p><p class="raw-note na">' + Common.NA + "</p>";
    }
    var none = function (why) { return { text: "해당 없음 (" + why + ")" }; };
    return [
      cell("은행 적금 (최고 금리)", name, "cmp-cell--head " + cls),
      cell("원금",
        '<span class="label-safe">원금 보장</span><p class="raw-note">' + Common.termHtml("deposit-protect", "예금자보호") +
        " 한도(금융회사별 1인당 원금과 이자 합쳐 1억 원)까지 보호돼요.</p>", cls),
      cell("매달 모으면 (금리)", lineHtml(income), cls),
      cell("건물 값에 비해 (P/NAV)", lineHtml(none("건물을 사는 상품이 아니에요")), cls),
      cell("세입자 계약 (WALE)", lineHtml(none("세입자가 없는 상품이에요")), cls),
      cell("1주 가격", lineHtml(none("매달 정한 금액을 넣어요")), cls),
      cell("참고", item && item.special_condition
        ? '<p class="raw-note"><b>우대조건</b> ' + Common.escapeHtml(item.special_condition) + "</p>"
        : '<p class="raw-note na">' + Common.NA + "</p>", cls),
      cell("좋은 점", pointsHtml("saving"), "cmp-cell--last " + cls)
    ].join("");
  }

  function renderGrid() {
    var picked = state.picked.map(function (key) { return key ? productByKey(key) : null; }).filter(Boolean);
    var html = picked.map(function (p, i) { return productColumn(p, i === 0); }).join("");
    html += savingColumn(picked.length === 0);
    document.getElementById("cmp-grid").innerHTML = html;

    var best = Common.getBestSaving(state.savings);
    document.getElementById("cmp-saving-rule").textContent = best
      ? "고른 기준: " + best.rule + ". 금융감독원 금융상품한눈에 공시 기준이에요."
      : Common.NA + " (금리 데이터를 아직 받지 못했어요)";

    var notice = document.getElementById("cmp-notice");
    if (!state.products.length) {
      notice.textContent = "아직 받은 리츠 데이터가 없어요. 데이터 담당이 scripts/build_all.py 를 실행하면 고를 수 있어요.";
      notice.classList.remove("is-hidden");
    } else if (!picked.length) {
      notice.textContent = "위에서 비교할 상품을 골라 주세요. 지금은 은행 적금만 보여요.";
      notice.classList.remove("is-hidden");
    } else {
      notice.classList.add("is-hidden");
    }
  }

  // ---------- 실시간(선택 기능) ----------
  function refreshLive() {
    if (!Common.isLiveMode()) { return; }
    state.picked.filter(Boolean).forEach(function (key) {
      var p = productByKey(key);
      if (!p || !p.id) { return; }
      Common.getLivePrice(p.id).then(function (result) {
        if (result) { state.live[p.key] = result; } else { delete state.live[p.key]; }
        renderGrid();
      });
    });
  }

  // ---------- 시작 ----------
  function start() {
    Common.initPage({ active: "compare", sources: ["prices", "dividends", "metrics", "savings"] });

    var coffeeInput = document.getElementById("cmp-coffee");
    coffeeInput.value = state.coffee;
    document.getElementById("cmp-coffee-source").textContent =
      "커피 한 잔 값은 가정이에요. 기본값 " + Common.formatWon(Common.COFFEE.price) + ": " + Common.COFFEE.label +
      " (" + Common.COFFEE.source + "). 직접 바꿔 볼 수 있어요.";

    Common.loadAll(["reits", "metrics", "prices", "dividends", "savings", "history"]).then(function (data) {
      state.products = Common.buildProducts(data);
      state.savings = data.savings;
      state.picked = Common.getQueryIds().map(function (id) {
        var p = productByKey(id);
        return p ? p.key : "";
      }).filter(Boolean);
      renderPick();
      renderGrid();
      refreshLive();
    });

    document.getElementById("cmp-pick").addEventListener("change", function (event) {
      var slot = event.target.getAttribute("data-slot");
      if (slot === null) { return; }
      var value = event.target.value;
      // 같은 상품을 두 칸에 고르면 앞 칸을 비운다
      state.picked = state.picked.map(function (key, i) { return (key === value && String(i) !== slot) ? "" : key; });
      state.picked[Number(slot)] = value;
      renderPick();
      renderGrid();
      saveToAddress();
      refreshLive();
    });
    document.getElementById("cmp-monthly").addEventListener("change", function (event) {
      state.monthly = Number(event.target.value) || Common.MONTHLY_DEFAULT;
      renderGrid();
    });
    coffeeInput.addEventListener("input", function (event) {
      var value = Number(event.target.value);
      state.coffee = value >= 500 ? value : Common.COFFEE.price;
      renderGrid();
    });
  }

  document.addEventListener("DOMContentLoaded", start);
})();
<<<END FILE>>>

<<<FILE: js/map.js>>>
/* ==========================================================================
   js/map.js — 지도 페이지 (map.html)   ★ 담당: 팀원 (기본 기능은 들어 있음)

   지금 되는 것
     - [국내 리츠 건물] / [해외 리츠 본사] 전환 버튼
         국내: 리츠가 직접 가진 건물을 지도에 표시 (좌표가 있는 건물만)
         해외: 해외 리츠는 건물이 수천 곳이라, 본사가 있는 도시를 표시
     - 자주 가는 장소를 찾으면 그 주변(반경 조절 가능)만 보여줌. 주변에 없으면 가장 가까운 3곳
     - 카드 "이 건물, ○○리츠가 가지고 있어요" + 생활 언어 지표 + 비교 화면 버튼
     - 지도가 안 떠도(인터넷 불안정) 목록과 글자 검색은 동작

   지도와 장소 검색
     - 지도: Leaflet + OpenStreetMap (API 키가 필요 없음). 화면에 "© OpenStreetMap contributors" 표시 필수.
     - 장소 검색: OpenStreetMap Nominatim. 버튼을 눌렀을 때 한 번만 부른다(자동완성 금지, 1초에 1번 이하).
     - 장소 검색 결과는 어디에도 저장하지 않는다(localStorage 포함). state.center 에만 잠깐 둔다.
     - 카카오맵으로 바꾸고 싶으면 initMap / searchPlace / drawMarkers 세 함수만 바꾸면 된다.

   더 다듬을 수 있는 곳 (아래에서 "TODO" 로 검색)
     TODO 1  마커를 누르면 아래 목록의 그 카드로 이동·강조
     TODO 2  자산 유형(오피스·리테일·물류)별로 마커 색 다르게 + 범례
     TODO 3  검색 결과가 여러 개일 때 고르게 하기

   꼭 지킬 것 (CONVENTIONS.md)
     - 좌표는 data/ 의 값만 쓴다(국내: assets.json 의 lat·lng, 해외: prices.json 의 hq_lat·hq_lng). 없으면 찍지 않는다.
     - 숫자·이름·주소를 코드에 직접 쓰지 않는다. 숫자 포맷과 번역은 Common 함수를 쓴다.
   ========================================================================== */
(function () {
  "use strict";

  var TILE_URL = "https://tile.openstreetmap.org/{z}/{x}/{y}.png";
  var TILE_CREDIT = '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors';
  var SEARCH_URL = "https://nominatim.openstreetmap.org/search";

  // 국내·해외마다 다른 설정 (찾는 범위 선택지와 기본값, 화면 문구)
  var MARKETS = {
    kr: { label: "국내 리츠 건물", radii: [1, 3, 5, 10], radius: 3, unit: "건물", placeholder: "예: 강남역, ○○대학교" },
    global: { label: "해외 리츠 본사", radii: [50, 100, 500, 1000], radius: 100, unit: "본사", placeholder: "예: 뉴욕, 시카고, 샌프란시스코" }
  };

  var state = {
    market: "kr",        // "kr" 국내 건물 / "global" 해외 리츠 본사
    assets: [],          // 국내: 좌표가 있는 건물
    hqs: [],             // 해외: 본사 위치 (건물과 같은 모양으로 맞춘 것)
    noCoordCount: 0,     // 좌표가 없어 지도에 못 찍은 국내 건물 수
    productById: {},     // 리츠 id → 상품 정보 (Common.buildProducts 결과)
    center: null,        // 사용자가 찾은 장소 { lat, lng, name }  ← 저장하지 않는다
    radiusKm: 3,
    map: null,           // Leaflet 지도
    layer: null,         // 마커 묶음
    centerLayer: null    // 찾은 장소 표시 + 반경 원
  };

  /** 지금 고른 쪽(국내 건물 또는 해외 본사)의 지점 목록 */
  function places() {
    return state.market === "global" ? state.hqs : state.assets;
  }

  // ---------------------------------------------------------------------
  // 찾기: 가운데 지점에서 반경 안의 지점. 하나도 없으면 가장 가까운 3개
  // ---------------------------------------------------------------------
  function findNearby(center, radiusKm) {
    var withDistance = places().map(function (asset) {
      return { asset: asset, km: Common.distanceKm(center.lat, center.lng, asset.lat, asset.lng) };
    }).sort(function (a, b) { return a.km - b.km; });
    var inside = withDistance.filter(function (row) { return row.km <= radiusKm; });
    return inside.length
      ? { found: true, rows: inside }
      : { found: false, rows: withDistance.slice(0, 3) };
  }

  // ---------------------------------------------------------------------
  // 카드: 리츠 이름, 자산 유형, 생활 언어 지표 2~3개, 비교 화면으로 가는 버튼
  // ---------------------------------------------------------------------
  function assetCardHtml(asset, km) {
    var p = state.productById[asset.reit_id] || null;
    var lines = [];
    if (p) {
      lines.push(Common.translateDividend(p.priceYield));
      lines.push(Common.translateWale(p.waleYears));
      lines.push(Common.translatePNav(p.pNav));
    }
    var linesHtml = lines.filter(function (line) { return line.text !== Common.NA; }).slice(0, 3).map(function (line) {
      return '<p class="translated">' + Common.escapeHtml(line.text) + '</p><p class="raw-note">' + Common.escapeHtml(line.raw) + "</p>" +
        (line.caution ? '<p class="caution-note">' + Common.escapeHtml(line.caution) + "</p>" : "");
    }).join("") || '<p class="translated na">' + Common.NA + "</p>";
    var head = asset.isHq
      ? '<p class="card-sub">해외 리츠 · 본사가 있는 도시</p><h3 class="card-title">' + Common.escapeHtml(asset.reit_name) + "</h3>"
      : '<p class="card-sub">이 건물, ' + Common.escapeHtml(asset.reit_name) + "가 가지고 있어요</p>" +
        '<h3 class="card-title">' + Common.escapeHtml(asset.name || "이름 " + Common.NA) + "</h3>";

    return '<article class="card map-asset" id="asset-' + Common.escapeHtml(asset.asset_id) + '">' + head +
      '<p class="map-asset-meta">' +
        '<span class="badge">' + Common.escapeHtml(asset.asset_type || "유형 " + Common.NA) + "</span> " +
        Common.escapeHtml(asset.address || "") +
        (typeof km === "number" ? " · 약 " + Common.formatNumber(km < 10 ? Math.round(km * 10) / 10 : km) + "km" : "") + "</p>" +
      linesHtml +
      (asset.isHq ? '<p class="raw-note">이 리츠의 건물은 여러 나라·도시에 아주 많아서, 지도에는 본사 위치만 표시했어요.</p>' : "") +
      '<p class="raw-note"><span class="label-risk">원금 손실 가능</span></p>' +
      '<div class="map-asset-actions"><a class="btn" href="compare.html?ids=' + encodeURIComponent(asset.reit_id) + '">적금과 비교하기</a></div>' +
      "</article>";
  }

  function renderResult() {
    var title = document.getElementById("map-result-title");
    var note = document.getElementById("map-result-note");
    var box = document.getElementById("map-result");
    var list = places();
    var unit = MARKETS[state.market].unit;
    var what = state.market === "global" ? "해외 리츠 본사" : "리츠가 가진 건물";
    var rows;
    if (!list.length) {
      title.textContent = what;
      note.textContent = "";
      box.innerHTML = '<p class="notice">위치 정보가 있는 데이터가 아직 없어요.</p>';
      drawMarkers([]);
      return;
    }
    if (!state.center) {
      // 아직 장소를 찾기 전: 전체를 보여준다 (지도가 안 떠도 이 목록은 보인다)
      title.textContent = what + " " + list.length + "곳";
      note.textContent = "위에서 장소를 찾으면 그 근처만 보여줘요. 지금은 전체 목록이에요." +
        (state.market === "kr" && state.noCoordCount ? " (위치 정보가 없는 건물 " + state.noCoordCount + "곳은 빠져 있어요)" : "") +
        (state.market === "global" ? " 해외 리츠는 건물이 아주 많아서 본사가 있는 도시를 표시해요." : "");
      rows = list.map(function (asset) { return { asset: asset, km: null }; });
    } else {
      var result = findNearby(state.center, state.radiusKm);
      rows = result.rows;
      if (result.found) {
        title.textContent = "'" + state.center.name + "' 반경 " + Common.formatNumber(state.radiusKm) + "km 안에 " + rows.length + "곳";
        note.textContent = "가까운 순서로 보여줘요.";
      } else {
        title.textContent = "가장 가까운 " + unit + " " + rows.length + "곳";
        note.textContent = "'" + state.center.name + "' 반경 " + Common.formatNumber(state.radiusKm) + "km 안에는 없어서, 가장 가까운 곳을 보여줘요.";
      }
    }
    box.innerHTML = rows.map(function (row) { return assetCardHtml(row.asset, row.km); }).join("");
    drawMarkers(rows);
  }

  // ---------------------------------------------------------------------
  // 국내·해외 전환 버튼, 찾는 범위 선택
  // ---------------------------------------------------------------------
  function renderMarket() {
    document.getElementById("map-market").innerHTML = Object.keys(MARKETS).map(function (key) {
      var active = key === state.market;
      var count = key === "global" ? state.hqs.length : state.assets.length;
      return '<button type="button" class="chip' + (active ? " is-active" : "") + '" data-market="' + key +
        '" aria-pressed="' + active + '">' + MARKETS[key].label + " " + count + "</button>";
    }).join("");
    var config = MARKETS[state.market];
    document.getElementById("map-keyword").placeholder = config.placeholder;
    document.getElementById("map-radius").innerHTML = config.radii.map(function (km) {
      return '<option value="' + km + '"' + (km === state.radiusKm ? " selected" : "") + ">반경 " + Common.formatNumber(km) + "km</option>";
    }).join("");
  }

  // ---------------------------------------------------------------------
  // 지도 (Leaflet + OpenStreetMap)
  // ---------------------------------------------------------------------
  function initMap() {
    if (!window.L) { return false; }      // 지도 라이브러리를 못 불러옴(인터넷 불안정)
    state.map = window.L.map("map-canvas", { scrollWheelZoom: false });
    window.L.tileLayer(TILE_URL, { maxZoom: 19, attribution: TILE_CREDIT }).addTo(state.map);
    state.layer = window.L.layerGroup().addTo(state.map);
    state.centerLayer = window.L.layerGroup().addTo(state.map);
    return true;
  }

  /** rows 의 지점에 마커를 찍고, 찾은 장소와 반경 원을 그린 뒤 지도를 그 범위에 맞춘다 */
  function drawMarkers(rows) {
    if (!state.map) { return; }
    var L = window.L;
    var points = [];
    state.layer.clearLayers();
    state.centerLayer.clearLayers();
    rows.forEach(function (row) {
      var a = row.asset;
      var popup = "<b>" + Common.escapeHtml(a.name || "") + "</b><br>" +
        (a.isHq ? "해외 리츠 본사 · " + Common.escapeHtml(a.address || "") : Common.escapeHtml(a.reit_name) + "가 가지고 있어요") +
        '<br><a href="compare.html?ids=' + encodeURIComponent(a.reit_id) + '">적금과 비교하기</a>';
      L.marker([a.lat, a.lng], { title: a.name || "" }).bindPopup(popup).addTo(state.layer);
      // TODO 1: 마커를 눌렀을 때 document.getElementById("asset-" + a.asset_id) 카드로 이동·강조
      points.push([a.lat, a.lng]);
    });
    if (state.center) {
      var c = [state.center.lat, state.center.lng];
      // 찾은 장소와 반경 원의 색은 style.css 의 강조색을 읽어서 쓴다
      var accent = window.getComputedStyle(document.documentElement).getPropertyValue("--color-accent").trim();
      L.circle(c, { radius: state.radiusKm * 1000, color: accent, weight: 2, fillOpacity: 0.06 }).addTo(state.centerLayer);
      L.circleMarker(c, { radius: 7, color: accent, fillColor: accent, fillOpacity: 1 })
        .bindPopup(Common.escapeHtml(state.center.name)).addTo(state.centerLayer);
      points.push(c);
    }
    if (points.length === 1) {
      state.map.setView(points[0], state.market === "global" ? 8 : 14);
    } else if (points.length > 1) {
      state.map.fitBounds(points, { padding: [30, 30], maxZoom: 15 });
    }
  }

  // ---------------------------------------------------------------------
  // 장소 찾기
  // ---------------------------------------------------------------------
  /** 이름·주소·리츠 이름에서 글자로 찾기 (지도 검색이 안 될 때 대신 쓴다) */
  function findInPlaces(keyword) {
    var word = keyword.replace(/\s+/g, "").toLowerCase();
    return places().filter(function (a) {
      return [a.name, a.address, a.reit_name].join(" ").replace(/\s+/g, "").toLowerCase().indexOf(word) !== -1;
    })[0] || null;
  }

  function searchPlace(keyword) {
    showNotice("찾는 중이에요...");
    // 국내를 볼 때는 한국 안에서만, 해외를 볼 때는 전 세계에서 찾는다
    var url = SEARCH_URL + "?format=jsonv2&limit=1&accept-language=ko" + (state.market === "kr" ? "&countrycodes=kr" : "") +
      "&q=" + encodeURIComponent(keyword);
    fetch(url, { headers: { "Accept": "application/json" } })
      .then(function (res) { return res.ok ? res.json() : []; })
      .catch(function () { return null; })              // 인터넷이 안 되면 null
      .then(function (list) {
        var hit = list && list[0];
        if (hit && isFinite(Number(hit.lat)) && isFinite(Number(hit.lon))) {
          // TODO 3: 결과가 여러 개일 때 고르게 하기 (지금은 첫 번째 결과)
          state.center = { lat: Number(hit.lat), lng: Number(hit.lon), name: keyword };
          showNotice("");
        } else {
          var place = findInPlaces(keyword);
          if (!place) {
            showNotice(list === null
              ? "장소 검색에 연결하지 못했어요. 목록에 있는 이름이나 지역 이름으로 다시 찾아보세요."
              : "찾는 장소가 없어요. 다른 말로 찾아보세요.");
            return;
          }
          state.center = { lat: place.lat, lng: place.lng, name: place.name || keyword };
          showNotice("지도 검색 대신 목록에서 '" + (place.name || keyword) + "'을(를) 찾았어요.");
        }
        renderResult();
      });
  }

  function showNotice(text) {
    var el = document.getElementById("map-notice");
    el.textContent = text || "";
    el.classList.toggle("is-hidden", !text);
  }

  // ---------------------------------------------------------------------
  // 시작
  // ---------------------------------------------------------------------
  function start() {
    Common.initPage({ active: "map", sources: ["assets", "prices", "dividends", "metrics"] });

    Common.loadAll(["assets", "reits", "metrics", "prices", "dividends"]).then(function (data) {
      var assets = (data.assets && data.assets.items) || [];
      state.assets = assets.filter(function (a) { return typeof a.lat === "number" && typeof a.lng === "number"; });
      state.noCoordCount = assets.length - state.assets.length;
      Common.buildProducts(data).forEach(function (p) {
        if (!p.id) { return; }
        state.productById[p.id] = p;
        if (p.type === "global" && p.hqLat !== null && p.hqLng !== null) {
          // 해외 리츠 본사를 건물과 같은 모양으로 맞춰 둔다 → 같은 함수로 목록·지도에 그릴 수 있다
          state.hqs.push({ asset_id: "hq-" + p.id, reit_id: p.id, reit_name: p.name, name: p.name, isHq: true,
            asset_type: "해외 리츠" + (p.country ? " · " + p.country : ""), address: p.hq, lat: p.hqLat, lng: p.hqLng });
        }
      });
      if (!initMap()) {
        showNotice("지도를 불러오지 못했어요(인터넷 연결 확인). 아래 목록과 글자 검색은 쓸 수 있어요.");
      }
      renderMarket();
      renderResult();
    });

    document.getElementById("map-market").addEventListener("click", function (event) {
      var button = event.target.closest("[data-market]");
      if (!button || button.getAttribute("data-market") === state.market) { return; }
      state.market = button.getAttribute("data-market");
      state.radiusKm = MARKETS[state.market].radius;
      state.center = null;                               // 찾던 장소는 지운다
      document.getElementById("map-keyword").value = "";
      showNotice("");
      renderMarket();
      renderResult();
    });
    document.getElementById("map-search-btn").addEventListener("click", function () {
      var keyword = document.getElementById("map-keyword").value.trim();
      if (keyword) { searchPlace(keyword); }
    });
    document.getElementById("map-keyword").addEventListener("keydown", function (event) {
      if (event.key === "Enter") { document.getElementById("map-search-btn").click(); }
    });
    document.getElementById("map-radius").addEventListener("change", function (event) {
      state.radiusKm = Number(event.target.value) || MARKETS[state.market].radius;
      renderResult();
    });
    document.getElementById("map-reset-btn").addEventListener("click", function () {
      state.center = null;
      document.getElementById("map-keyword").value = "";
      showNotice("");
      renderResult();
    });
  }

  document.addEventListener("DOMContentLoaded", start);
})();
<<<END FILE>>>

<<<FILE: js/learn.js>>>
/* ==========================================================================
   js/learn.js — 용어 배우기 페이지 (learn.html)
   - data/glossary.json 의 용어를 카드로 보여준다 (찾기 + 분류)
   - 카드마다 실제 데이터 예시를 한 줄 붙인다 (데이터가 있을 때만)
   ========================================================================== */
(function () {
  "use strict";

  var state = { terms: [], categories: [], category: "전체", keyword: "", products: [] };

  // 실제 숫자 예시를 보여줄 때 쓰는 표시 방법 (상품 값 이름 → 글자)
  var LIVE_FORMAT = {
    price: function (p) { return "1주 가격 " + Common.formatWon(p.price); },
    dpsAnnual: function (p) { return "최근 1년 주당배당금 " + Common.formatWon(p.dpsAnnual); },
    priceYield: function (p) { return "주가 기준 배당수익률 " + Common.formatPercent(p.priceYield, 2); },
    capitalYield: function (p) { return "자본금 기준 배당수익률 " + Common.formatPercent(p.capitalYield, 2); },
    capitalYieldAnnualized: function (p) { return "연환산배당률 " + Common.formatPercent(p.capitalYieldAnnualized, 2); },
    navMillionWon: function (p) { return "NAV " + Common.formatNumber(p.navMillionWon) + "백만 원"; },
    pNav: function (p) { return "P/NAV " + p.pNav.toFixed(2) + " → " + Common.translatePNav(p.pNav).text; },
    waleYears: function (p) { return "WALE " + p.waleYears.toFixed(2) + "년 → " + Common.translateWale(p.waleYears).text; }
  };

  /** 실제 데이터에서 예시 한 줄을 만든다. 값이 있는 상품 중 '가운데 값'을 골라 순위처럼 보이지 않게 한다 */
  function liveExample(field) {
    if (!field || !LIVE_FORMAT[field]) { return null; }
    var withValue = state.products.filter(function (p) {
      return typeof p[field] === "number" && isFinite(p[field]) && p[field] > 0;
    }).sort(function (a, b) { return a[field] - b[field]; });
    if (!withValue.length) { return null; }
    var middle = withValue[Math.floor(withValue.length / 2)];
    return middle.name + ": " + LIVE_FORMAT[field](middle);
  }

  function row(label, text) {
    return text ? '<dl class="learn-row"><dt>' + label + "</dt><dd>" + Common.escapeHtml(text) + "</dd></dl>" : "";
  }

  function cardHtml(term) {
    return '<article class="card learn-card" id="term-' + Common.escapeHtml(term.id) + '">' +
      '<div class="learn-term"><h3 class="card-title">' + Common.escapeHtml(term.term) + "</h3>" +
      '<span class="learn-full">' + Common.escapeHtml(term.full || "") + "</span>" +
      '<span class="badge">' + Common.escapeHtml(term.category) + "</span></div>" +
      '<p class="translated learn-easy">' + Common.escapeHtml(term.easy) + "</p>" +
      '<p class="learn-detail">' + Common.escapeHtml(term.detail || "") + "</p>" +
      row("계산식", term.formula) +
      row("조심", term.caution) +
      row("실제 숫자", liveExample(term.live)) +
      "</article>";
  }

  function renderCategories() {
    document.getElementById("learn-categories").innerHTML = ["전체"].concat(state.categories).map(function (name) {
      return '<button type="button" class="chip' + (name === state.category ? " is-active" : "") +
        '" data-category="' + Common.escapeHtml(name) + '" aria-pressed="' + (name === state.category) + '">' +
        Common.escapeHtml(name) + "</button>";
    }).join("");
  }

  function renderList() {
    var keyword = state.keyword.replace(/\s+/g, "").toLowerCase();
    var shown = state.terms.filter(function (term) {
      if (state.category !== "전체" && term.category !== state.category) { return false; }
      if (!keyword) { return true; }
      var haystack = [term.term, term.full, term.easy, term.detail].join(" ").replace(/\s+/g, "").toLowerCase();
      return haystack.indexOf(keyword) !== -1;
    });
    document.getElementById("learn-list").innerHTML = shown.map(cardHtml).join("");
    document.getElementById("learn-count").textContent = "용어 " + shown.length + "개";
    document.getElementById("learn-empty").classList.toggle("is-hidden", shown.length > 0);
  }

  function start() {
    Common.initPage({ active: "learn", sources: ["metrics", "prices", "dividends"] });

    Common.loadAll(["glossary", "reits", "metrics", "prices", "dividends"]).then(function (data) {
      if (!data.glossary || !data.glossary.items) {
        document.getElementById("learn-list").innerHTML = '<p class="notice">용어 파일(data/glossary.json)을 불러오지 못했어요.</p>';
        return;
      }
      state.terms = data.glossary.items;
      state.categories = data.glossary.categories || [];
      state.products = Common.buildProducts(data);
      renderCategories();
      renderList();
      // 주소에 #term-wale 처럼 붙어서 들어왔으면 그 카드로 이동
      if (window.location.hash) {
        var target = document.getElementById(window.location.hash.slice(1));
        if (target) { target.scrollIntoView(); }
      }
    });

    document.getElementById("learn-search").addEventListener("input", function (event) {
      state.keyword = event.target.value;
      renderList();
    });
    document.getElementById("learn-categories").addEventListener("click", function (event) {
      var chip = event.target.closest(".chip");
      if (!chip) { return; }
      state.category = chip.getAttribute("data-category");
      renderCategories();
      renderList();
    });
  }

  document.addEventListener("DOMContentLoaded", start);
})();
<<<END FILE>>>

<<<FILE: js/card.js>>>
/* ==========================================================================
   js/card.js — 홍보 카드 생성기 (card.html)   ★ 담당: 팀원

   지금 되어 있는 것 (뼈대)
     - 타깃·리츠 고르기, 데이터 불러오기
     - 문구 템플릿 구조 (타깃마다 1안씩만 예시로 들어 있음)          → TEMPLATES
     - 금지어 검사 → 빨간 경고 + 다운로드 버튼 끄기                  → checkText()
     - 1080×1080 카드 그리기(아주 기본 모양)와 PNG 받기              → drawCard(), download()

   아직 안 된 것 (팀원이 채울 곳: 아래에서 "TODO" 로 검색)
     TODO 1  타깃마다 문구를 3안으로 늘리기 (지금은 1안씩)
     TODO 2  카드 디자인 다듬기 (지금은 남색 띠 + 글자만 있는 기본 모양)
     TODO 3  긴 문구가 카드 밖으로 나가지 않게 글자 크기 자동 조절
     TODO 4  휴대폰에서 받기가 잘 되는지 확인

   꼭 지킬 것 (CONVENTIONS.md)
     - 문구는 템플릿으로만 만든다. 외부 AI API 를 부르지 않는다.
     - 숫자는 data/ 의 실제 값만 쓴다. 값이 null 이면 그 숫자가 들어가는 문구는 만들지 않는다.
     - 금지어 검사는 Common.checkBannedWords() 만 쓴다. 직접 만들지 않는다.
     - 카드 맨 아래 고지 문구는 Common.getCardDisclaimer() 가 주는 글자를 그대로 넣는다.
     - "추천", "보장" 같은 표현을 템플릿에 쓰지 않는다. 위험은 "원금 손실 가능"이라고 쓴다.
   ========================================================================== */
(function () {
  "use strict";

  var SOURCES = ["prices", "dividends", "metrics"];     // 카드 문구에 쓰는 데이터 (고지 문구의 출처)

  var state = { target: Common.getTarget() || "student", products: [], productKey: "", meta: null, optionIndex: 0 };

  /*
   * 문구 템플릿. 타깃 key → 함수 배열. 각 함수는 상품(p)을 받아 문구를 돌려준다.
   * 필요한 값이 없으면 null 을 돌려준다 (그 문구는 목록에서 빠진다).
   * 상품(p)에 들어 있는 값: Common.buildProducts() 설명 참고 (name, price, priceYield, waleYears, pNav ...)
   */
  var TEMPLATES = {
    student: [
      function (p) {
        if (typeof p.price !== "number") { return null; }
        var cups = Math.ceil(p.price / Common.COFFEE.price);
        return "커피 " + cups + "잔 값이면\n" + p.name + " 1주";
      }
      // TODO 1: 대학생용 문구 2개 더
    ],
    rookie: [
      function (p) {
        if (typeof p.waleYears !== "number") { return null; }
        return p.name + "\n" + Common.translateWale(p.waleYears).text;
      }
      // TODO 1: 사회초년생용 문구 2개 더
    ],
    renter: [
      function (p) {
        var line = Common.translateDividend(p.priceYield);
        // 값이 없거나, 배당수익률이 유난히 높아 주의가 붙은 리츠는 홍보 문구로 만들지 않는다
        if (line.firstYearWon === null || line.caution) { return null; }
        return "월세 내는 나,\n" + p.name + "에서는 배당 받는 쪽\n" + "5만 원씩 1년, 배당 약 " + Common.formatWon(line.firstYearWon);
      }
      // TODO 1: 월세 사는 1인가구용 문구 2개 더
    ]
  };

  function currentProduct() {
    return state.products.filter(function (p) { return p.key === state.productKey; })[0] || null;
  }

  function buildOptions() {
    var p = currentProduct();
    if (!p) { return []; }
    return (TEMPLATES[state.target] || []).map(function (make) { return make(p); }).filter(Boolean);
  }

  // ---------------------------------------------------------------------
  // 화면
  // ---------------------------------------------------------------------
  function renderTargets() {
    document.getElementById("cardgen-targets").innerHTML = Common.TARGETS.map(function (t) {
      return '<button type="button" class="chip' + (t.key === state.target ? " is-active" : "") +
        '" data-target="' + t.key + '" aria-pressed="' + (t.key === state.target) + '">' + Common.escapeHtml(t.label) + "</button>";
    }).join("");
  }

  function renderProducts() {
    var select = document.getElementById("cardgen-product");
    var reits = state.products.filter(function (p) { return p.type === "reit"; })
      .sort(function (a, b) { return a.name.localeCompare(b.name, "ko"); });
    select.innerHTML = reits.map(function (p) {
      return '<option value="' + Common.escapeHtml(p.key) + '">' + Common.escapeHtml(p.name) + "</option>";
    }).join("");
    if (!state.productKey && reits.length) { state.productKey = reits[0].key; }
    select.value = state.productKey;
  }

  function renderOptions() {
    var options = buildOptions();
    var notice = document.getElementById("cardgen-notice");
    var box = document.getElementById("cardgen-options");
    if (!state.products.length) {
      notice.textContent = "아직 받은 리츠 데이터가 없어요. 데이터 담당이 scripts/build_all.py 를 실행하면 문구가 만들어져요.";
    } else if (!options.length) {
      notice.textContent = "이 리츠는 문구에 넣을 숫자가 아직 없어요(" + Common.NA + "). 다른 리츠나 다른 타깃을 골라 보세요.";
    } else {
      notice.textContent = "";
    }
    notice.classList.toggle("is-hidden", !notice.textContent);
    state.optionIndex = Math.min(state.optionIndex, Math.max(0, options.length - 1));
    box.innerHTML = options.map(function (text, i) {
      return '<button type="button" class="cardgen-option' + (i === state.optionIndex ? " is-active" : "") +
        '" data-option="' + i + '">' + Common.escapeHtml(text).replace(/\n/g, "<br>") + "</button>";
    }).join("");
    document.getElementById("cardgen-text").value = options[state.optionIndex] || "";
    checkText();
  }

  /** 금지어가 있으면 빨간 경고를 띄우고 받기 버튼을 끈다 */
  function checkText() {
    var text = document.getElementById("cardgen-text").value;
    var result = Common.checkBannedWords(text);
    var warn = document.getElementById("cardgen-warn");
    var button = document.getElementById("cardgen-download");
    warn.textContent = result.ok ? "" : "쓸 수 없는 표현이 들어 있어요: " + result.found.join(", ") + " — 지우면 카드를 받을 수 있어요.";
    warn.classList.toggle("is-hidden", result.ok);
    button.disabled = !result.ok || !text.trim();
    drawCard();
  }

  // ---------------------------------------------------------------------
  // 카드 그리기 (1080×1080)
  // ---------------------------------------------------------------------
  function cssVar(name) {
    return window.getComputedStyle(document.documentElement).getPropertyValue(name).trim();
  }

  /** 글자가 폭을 넘으면 줄을 바꿔서 그린다. 그린 마지막 줄의 y 를 돌려준다 */
  function drawWrapped(ctx, text, x, y, maxWidth, lineHeight) {
    String(text).split("\n").forEach(function (paragraph) {
      var line = "";
      Array.from(paragraph).forEach(function (ch) {
        if (ctx.measureText(line + ch).width > maxWidth && line) {
          ctx.fillText(line, x, y);
          y += lineHeight;
          line = ch;
        } else {
          line += ch;
        }
      });
      ctx.fillText(line, x, y);
      y += lineHeight;
    });
    return y;
  }

  function drawCard() {
    var canvas = document.getElementById("cardgen-canvas");
    var ctx = canvas.getContext("2d");
    var p = currentProduct();
    var text = document.getElementById("cardgen-text").value;
    var font = cssVar("--font-base") || "sans-serif";
    // TODO 2: 아래는 아주 기본 모양이다. 디자인을 다듬는다.
    ctx.fillStyle = cssVar("--color-bg");
    ctx.fillRect(0, 0, 1080, 1080);
    ctx.fillStyle = cssVar("--color-primary");         // 위쪽 파란 띠
    ctx.fillRect(80, 80, 96, 10);
    ctx.font = "800 36px " + font;
    ctx.textBaseline = "top";
    ctx.fillText("리츠 투자", 80, 112);
    ctx.fillStyle = cssVar("--color-text");
    ctx.font = "800 76px " + font;
    drawWrapped(ctx, text, 80, 260, 920, 104);         // TODO 3: 긴 문구일 때 글자 크기 줄이기
    // 맨 아래 고지 문구 (지울 수 없음)
    ctx.fillStyle = cssVar("--color-surface-2");
    ctx.fillRect(0, 880, 1080, 200);
    ctx.fillStyle = cssVar("--color-text-sub");
    ctx.font = "600 24px " + font;
    drawWrapped(ctx, Common.getCardDisclaimer(state.meta, SOURCES), 60, 912, 960, 36);
    if (p) {
      canvas.setAttribute("aria-label", p.name + " 홍보 카드 미리 보기: " + text.replace(/\n/g, " "));
    }
  }

  function download() {
    if (!Common.checkBannedWords(document.getElementById("cardgen-text").value).ok) { return; }
    var link = document.createElement("a");
    link.download = "coffee-landlord-card.png";
    link.href = document.getElementById("cardgen-canvas").toDataURL("image/png");
    link.click();
  }

  // ---------------------------------------------------------------------
  // 시작
  // ---------------------------------------------------------------------
  function start() {
    Common.initPage({ active: "card", sources: SOURCES });
    renderTargets();

    Common.loadAll(["reits", "metrics", "prices", "dividends", "meta"]).then(function (data) {
      state.products = Common.buildProducts(data);
      state.meta = data.meta;
      renderProducts();
      renderOptions();
    });

    document.getElementById("cardgen-targets").addEventListener("click", function (event) {
      var chip = event.target.closest("[data-target]");
      if (!chip) { return; }
      state.target = chip.getAttribute("data-target");
      state.optionIndex = 0;
      renderTargets();
      renderOptions();
    });
    document.getElementById("cardgen-product").addEventListener("change", function (event) {
      state.productKey = event.target.value;
      state.optionIndex = 0;
      renderOptions();
    });
    document.getElementById("cardgen-options").addEventListener("click", function (event) {
      var option = event.target.closest("[data-option]");
      if (!option) { return; }
      state.optionIndex = Number(option.getAttribute("data-option"));
      renderOptions();
    });
    document.getElementById("cardgen-text").addEventListener("input", checkText);
    document.getElementById("cardgen-download").addEventListener("click", download);
  }

  document.addEventListener("DOMContentLoaded", start);
})();
<<<END FILE>>>

<<<FILE: README.md>>>
# 리츠 투자

2030(대학생 · 사회초년생 · 월세 사는 1인가구)에게 리츠(REITs)를 생활 언어로 번역해서 보여주는 웹사이트.
대학 '부동산 프롭테크' 수업 팀 과제(주제: 부동산 마케팅)입니다.

> 본 사이트는 대학 수업 과제용이며 투자 권유가 아닙니다. 리츠·ETF는 원금 손실이 발생할 수 있습니다.

## 화면

| 파일 | 내용 |
|---|---|
| `index.html` | 첫 화면. 타깃 선택 → 정렬 기준 공개 → 리츠 목록(국내/해외 전환, 최근 1년 주가 그래프) |
| `compare.html` | 리츠·해외 리츠를 3개까지 골라 은행 적금과 나란히 비교 |
| `map.html` | 자주 가는 곳 근처에 리츠가 가진 건물 찾기 (해외 리츠는 본사 위치) |
| `learn.html` | 어려운 용어를 쉬운 말로 배우기 |
| `card.html` | 타깃별 홍보 카드 만들기 (금지 표현 자동 차단) |

## 같이 작업하는 사람은

**[HANDOFF_PROMPT.md](HANDOFF_PROMPT.md)** 하나만 읽으면 됩니다. 규칙, 현재 상태, 이어서 할 일이 전부 들어 있습니다.
(GPT Codex 등 AI 도구로 작업한다면 그 파일을 읽게 한 뒤 시작하세요.)

`docs/old/` 의 문서는 예전 내용이라 지금 코드와 다릅니다. 공식 API(공공데이터포털·OpenDART 등) 주소를 확인해 둔 기록만 참고용으로 남겨 두었습니다.

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
| 종가 · 배당 · 최근 1년 주가 · 해외 리츠 | 야후 파이낸스 (비공식. 공식 API 키를 받으면 교체 예정) |
| 은행 적금 금리 | 금융감독원 금융상품한눈에 공개 화면 |
| 지도 · 장소 검색 | OpenStreetMap |

데이터를 새로 받으려면:

```bash
pip install -r requirements.txt
```

```bash
python scripts/build_public.py
```

## 기술

순수 HTML / CSS / JavaScript (프레임워크·빌드 도구 없음). 데이터는 파이썬 스크립트가 `data/*.json` 으로 만들고, 화면은 이 JSON만 읽습니다.
<<<END FILE>>>

<<<FILE: requirements.txt>>>
# Python packages for the data scripts in scripts/
# Install:  pip install -r requirements.txt
# NOTE: keep this file ASCII-only (no Korean). pip on Korean Windows fails to read it otherwise.
requests>=2.31
openpyxl>=3.1
<<<END FILE>>>

<<<FILE: .gitignore>>>
# ===== 비밀 키 (절대 깃허브에 올리지 않음) =====
.env
.env.*
!.env.example

# ===== 파이썬 =====
__pycache__/
*.pyc
.venv/
venv/

# ===== 로컬 전용 파일 (KIS 토큰 캐시 등) =====
scripts/.cache/
*.token

# ===== 엑셀을 열어둘 때 생기는 임시 잠금 파일 =====
~$*

# ===== 운영체제 / 에디터 =====
.DS_Store
Thumbs.db
desktop.ini
.vscode/
.idea/

# ===== Claude Code 로컬 설정 =====
.claude/
<<<END FILE>>>

<<<FILE: .env.example>>>
# ==========================================================
# API 키 보관함 (예시 파일)
#
# 사용법
#   1) 이 파일을 복사해서 이름을 ".env" 로 바꿉니다. (.env.example 은 그대로 둡니다)
#   2) = 뒤에 발급받은 키를 붙여넣습니다. 따옴표 없이, = 앞뒤에 띄어쓰기 없이.
#   3) 저장합니다. 끝.
#
# 주의
#   - ".env" 파일은 깃허브에 올라가지 않습니다 (.gitignore 에 등록되어 있음).
#   - 키를 카톡·ChatGPT·코드에 붙여넣지 마세요.
#   - 카카오 JavaScript 키는 여기 넣지 않습니다. (map.html 안에 넣는 유일한 예외 → CONVENTIONS.md 1장)
# ==========================================================

# 1) 공공데이터포털 (data.go.kr) 일반 인증키
#    리츠정보 / 주식시세정보 / 증권상품시세정보 3개 API가 이 키 하나를 같이 씁니다.
#    (단, API 3개 각각 "활용신청"은 따로 해야 합니다)
DATA_GO_KR_KEY=

# 2) OpenDART (opendart.fss.or.kr) 인증키
DART_API_KEY=

# 3) 금융감독원 금융상품한눈에 (finlife.fss.or.kr) 인증키
FINLIFE_API_KEY=

# 4) 행정안전부 주소기반산업지원서비스 (business.juso.go.kr) 승인키 2개 - 건물 주소를 지도 좌표로 바꿀 때 사용
#    '주소정보 API 연계' 메뉴에서 API마다 따로 신청합니다. 두 키는 서로 다릅니다.
#    JUSO_SEARCH_KEY = '도로명주소 검색 API' 승인키
#    JUSO_COORD_KEY  = '좌표제공 검색 API' 승인키
JUSO_SEARCH_KEY=
JUSO_COORD_KEY=

# 5) (선택) 한국투자증권 KIS Developers - 실시간 시세. 발표자 노트북에서만 사용
KIS_APP_KEY=
KIS_APP_SECRET=
<<<END FILE>>>

<<<FILE: scripts/_util.py>>>
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
<<<END FILE>>>

<<<FILE: scripts/build_public.py>>>
# -*- coding: utf-8 -*-
"""
scripts/build_public.py — API 키 없이 받을 수 있는 데이터로 data/*.json 만들기

API 키가 아직 없을 때 쓰는 길입니다. 키가 생기면 build_all.py(공식 API)를 쓰세요.

어디서 가져오나
  ① 상장 리츠 목록·건물(이름, 주소, 좌표)   국토교통부 리츠정보시스템 공개 화면을 옮겨 적은 data/raw/molit_*.txt
  ② 종목코드                                 한국거래소 KIND 상장법인목록 (공식, 키 없음)
  ③ 지표(배당수익률, NAV, WALE 등)           리츠정보시스템 상장리츠현황 화면 → convert_metrics.py
  ④ 종가·배당·주식 수                        야후 파이낸스 차트 (비공식. 거래소 시세를 늦게 받아 보여주는 곳)

꼭 알아둘 점
  - ④는 정부·거래소의 공식 API가 아닙니다. 그래서 meta.json 에 출처를 그대로 적고,
    배당은 리츠정보시스템의 결산 횟수와 맞을 때만 "최근 1년 주당배당금"으로 씁니다. 안 맞으면 null.
  - 리츠 ETF는 여기서 받지 않습니다(어떤 ETF를 넣을지 사람이 정해야 함).

실행
  python scripts/build_public.py
"""

import datetime as dt
import re
import subprocess
import sys

from _util import (
    KST, RAW_DIR, SCRIPTS_DIR, Stop, http_get, load_json, norm_name, run, save_json,
    to_date, to_number, today_str, update_meta,
)

KIND_URL = "https://kind.krx.co.kr/corpgeneral/corpList.do"
YAHOO_CHART = "https://query1.finance.yahoo.com/v8/finance/chart/"
YAHOO_SHARES = "https://query1.finance.yahoo.com/ws/fundamentals-timeseries/v1/finance/timeseries/"
BROWSER = {"User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0 Safari/537.36"}

MOLIT_SOURCE = "국토교통부 리츠정보시스템 공개 화면 (상장리츠현황·GIS 지도에 표시된 값을 옮겨 적음)"
MOLIT_URL = "https://reits.molit.go.kr/pub/chart/chartSearch02_6?pmn=80"
YAHOO_SOURCE = "야후 파이낸스 (비공식 · 거래소 시세 지연 제공)"
YAHOO_URL = "https://finance.yahoo.com"
WIKI_SP500_URL = "https://en.wikipedia.org/wiki/List_of_S%26P_500_companies"
NOMINATIM_URL = "https://nominatim.openstreetmap.org/search"
FINLIFE_SOURCE = "금융감독원 금융상품한눈에 적금 비교 화면 (은행·12개월·정액적립식·가입제한 없음으로 검색한 표를 옮겨 적음)"
FINLIFE_URL = "https://finlife.fss.or.kr/finlife/svings/fdrmEnty/list.do?menuNo=700003"


def get(url, params=None, label=""):
    """_util.http_get 에 브라우저 머리말만 더한 것"""
    import requests
    last = None
    for attempt in range(3):
        try:
            return requests.get(url, params=params, headers=BROWSER, timeout=30)
        except requests.RequestException as e:
            last = e
    raise Stop(f"{label}: 서버에 연결하지 못했어요. 인터넷 연결을 확인해 주세요. ({type(last).__name__})")


def newest_raw(prefix):
    """data/raw 에서 이름이 prefix 로 시작하는 가장 최근 파일의 줄 목록(제목 줄 제외)과 파일 이름"""
    files = sorted(RAW_DIR.glob(prefix + "*.txt"))
    if not files:
        raise Stop(f"data/raw 에 {prefix}*.txt 파일이 없어요.")
    lines = [l for l in files[-1].read_text(encoding="utf-8-sig").splitlines() if l.strip()]
    return [l.split("|") for l in lines[1:]], files[-1].name


def fetch_kind():
    """한국거래소 KIND 상장법인목록 → {비교용 이름: {code, market, listed_date, fiscal_month}}"""
    res = get(KIND_URL, {"method": "download", "searchType": "13"}, "KIND 상장법인목록")
    html = res.content.decode("euc-kr", errors="replace")
    table = {}
    for row in re.findall(r"<tr>(.*?)</tr>", html, flags=re.S):
        cells = [re.sub(r"<.*?>", "", c).strip() for c in re.findall(r"<td[^>]*>(.*?)</td>", row, flags=re.S)]
        if len(cells) >= 7 and cells[2]:
            table[norm_name(cells[0])] = {"code": cells[2], "market": cells[1], "listed_date": to_date(cells[5]),
                                          "fiscal_month": cells[6]}
    if not table:
        raise Stop("KIND 상장법인목록을 읽지 못했어요(표 모양이 바뀌었을 수 있어요).")
    return table


def fetch_yahoo(symbol):
    """야후 차트에서 마지막 종가와 배당 내역을 받는다. 종목이 없으면 None"""
    res = get(YAHOO_CHART + symbol, {"range": "2y", "interval": "1d", "events": "div"}, f"야후 차트({symbol})")
    try:
        result = res.json()["chart"]["result"][0]
    except (ValueError, KeyError, TypeError, IndexError):
        return None
    offset = result["meta"].get("gmtoffset", 32400)
    stamps = result.get("timestamp") or []
    closes = ((result.get("indicators") or {}).get("quote") or [{}])[0].get("close") or []
    bars = [(t, c) for t, c in zip(stamps, closes) if c is not None]
    if not bars:
        return None
    last_time, last_close = bars[-1]

    def day(ts):
        return dt.datetime.fromtimestamp(ts + offset, dt.timezone.utc).strftime("%Y-%m-%d")

    prev_close = bars[-2][1] if len(bars) > 1 else None
    events = sorted(({"date": day(v["date"]), "amount": v["amount"]}
                     for v in ((result.get("events") or {}).get("dividends") or {}).values()), key=lambda e: e["date"])
    # 최근 1년 종가 기록(그래프용). 점이 너무 많으면 80개 안팎으로 솎아 낸다. 마지막 날은 꼭 넣는다
    is_won = result["meta"].get("currency") == "KRW"
    year = [[day(t), round(c) if is_won else round(c, 2)] for t, c in bars if t >= last_time - 365 * 86400]
    history = year[::max(1, len(year) // 80)]
    if history and history[-1] != year[-1]:
        history.append(year[-1])
    return {"close": last_close, "base_date": day(last_time), "prev_close": prev_close,
            "currency": result["meta"].get("currency"), "dividends": events, "history": history,
            "name": result["meta"].get("shortName") or result["meta"].get("longName")}


def fetch_sp500_reits():
    """위키백과 'List of S&P 500 companies' 표에서 리츠만 고른다 → [(종목기호, 이름, 소분류)]"""
    res = get(WIKI_SP500_URL, None, "위키백과 S&P 500 목록")
    table = re.search(r'<table[^>]*id="constituents".*?</table>', res.text, flags=re.S)
    if not table:
        return []
    found = []
    for row in re.findall(r"<tr[^>]*>(.*?)</tr>", table.group(0), flags=re.S):
        cells = [re.sub(r"<.*?>", "", c).strip() for c in re.findall(r"<td[^>]*>(.*?)</td>", row, flags=re.S)]
        if len(cells) >= 5 and "REIT" in cells[3]:
            found.append((cells[0].replace(".", "-"), cells[1], cells[3], cells[4]))    # 기호, 이름, 소분류, 본사 도시
    return found


def geocode_city(city):
    """도시 이름(예: 'San Diego, California')을 (위도, 경도)로. OpenStreetMap Nominatim 사용 (1초에 1번 이하)"""
    import time

    import requests
    time.sleep(1.1)
    try:
        res = requests.get(NOMINATIM_URL, params={"format": "jsonv2", "limit": 1, "q": city},
                           headers={"User-Agent": "coffee-landlord-class-project/1.0"}, timeout=30)
        hit = res.json()[0]
        return round(float(hit["lat"]), 4), round(float(hit["lon"]), 4)
    except (requests.RequestException, ValueError, KeyError, IndexError, TypeError):
        return None, None


def build_global(count=10):
    """해외 리츠: S&P 500 구성 종목 중 리츠의 시가총액 상위 count 개 (가격·배당은 달러 → 원으로 환산)"""
    fx_quote = fetch_yahoo("KRW=X")
    candidates = fetch_sp500_reits()
    if not fx_quote or not candidates:
        return [], [], None, []
    fx = fx_quote["close"]
    rows = []
    for symbol, name, sub, hq in candidates:
        quote = fetch_yahoo(symbol)
        shares, shares_date = fetch_shares(symbol) if quote else (None, None)
        if not quote or quote.get("currency") != "USD" or not shares:
            continue
        rows.append({"symbol": symbol, "name": name, "sub": sub, "hq": hq, "quote": quote, "shares": shares,
                     "shares_date": shares_date, "cap": quote["close"] * shares})
    rows.sort(key=lambda r: r["cap"], reverse=True)
    prices, dividends = [], []
    for r in rows[:count]:
        q = r["quote"]
        end = dt.date.fromisoformat(q["base_date"])
        recent = [e for e in q["dividends"] if dt.date.fromisoformat(e["date"]) > end - dt.timedelta(days=365)]
        dps_local = round(sum(e["amount"] for e in recent), 4) if recent else None
        hq_lat, hq_lng = geocode_city(r["hq"]) if r["hq"] else (None, None)
        prices.append({
            "hq": r["hq"] or None, "hq_lat": hq_lat, "hq_lng": hq_lng,      # 본사 도시와 그 도시의 좌표
            "id": r["symbol"], "type": "global", "name": r["name"], "close": round(q["close"] * fx),
            "close_local": round(q["close"], 2), "currency": "USD", "fx_rate": round(fx, 2), "base_date": q["base_date"],
            "change": None, "change_pct": round((q["close"] - q["prev_close"]) / q["prev_close"] * 100, 2) if q["prev_close"] else None,
            "volume": None, "market_cap": round(r["cap"] * fx), "listed_shares": int(r["shares"]),
            "listed_shares_date": r["shares_date"], "country": "미국", "sub_industry": r["sub"],
        })
        dividends.append({
            "id": r["symbol"], "name": r["name"], "corp_code": None,
            "dps_annual": round(dps_local * fx, 2) if dps_local else None,
            "dps_annual_local": dps_local, "currency": "USD",
            "dps_basis": (f"최근 1년 배당 {len(recent)}건 합계 {dps_local}달러 × 환율 {fx:,.2f}원" if dps_local
                          else "최근 1년 배당 내역이 없음"),
            "period_months": None, "latest_period_end": None,
            "periods": [{"period_end": e["date"], "dps": e["amount"], "from": "배당락일 기준(달러)", "rcept_no": None}
                        for e in reversed(recent)],
        })
    histories = [{"id": r["symbol"], "currency": "USD", "points": r["quote"]["history"]} for r in rows[:count]]
    info = {"fx": fx, "fx_date": fx_quote["base_date"], "candidates": len(candidates), "priced": len(rows)}
    return prices, dividends, info, histories


def build_savings():
    """금융상품한눈에 화면에서 옮겨 적은 은행 적금 표 → savings.json 항목"""
    files = sorted(RAW_DIR.glob("finlife_savings_screen_*.txt"))
    if not files:
        return [], None
    lines = [l for l in files[-1].read_text(encoding="utf-8-sig").splitlines() if l.strip()][1:]
    items = []
    for line in lines:
        bank, product, reserve, base, top, who, kind = [c.strip() for c in line.split("|")]
        items.append({
            "kind": "saving", "bank": bank, "product": product, "product_code": None, "term_months": 12,
            "rate_base": to_number(base.replace("%", "")), "rate_max": to_number(top.replace("%", "")),
            "rate_type": kind or None, "reserve_type": reserve or None,
            "join_deny": 1 if who == "제한없음" else None, "join_way": None, "join_member": who or None,
            "special_condition": None, "max_limit": None, "disclosure_month": None,
        })
    return items, to_date(re.search(r"(\d{8})", files[-1].name).group(1))


def fetch_shares(symbol):
    """야후 재무자료에서 가장 최근 발행 주식 수와 그 기준일. 없으면 (None, None)"""
    now = int(dt.datetime.now(KST).timestamp())
    kinds = "quarterlyOrdinarySharesNumber,annualOrdinarySharesNumber,quarterlyShareIssued,annualShareIssued"
    res = get(YAHOO_SHARES + symbol, {"symbol": symbol, "type": kinds, "period1": now - 3 * 365 * 86400, "period2": now},
              f"야후 주식 수({symbol})")
    try:
        results = res.json()["timeseries"]["result"]
    except (ValueError, KeyError, TypeError):
        return None, None
    best = (None, None)
    for block in results:
        for key, rows in block.items():
            if key in ("meta", "timestamp") or not isinstance(rows, list):
                continue
            for row in rows:
                value = ((row or {}).get("reportedValue") or {}).get("raw")
                as_of = (row or {}).get("asOfDate")
                if value and as_of and (best[1] is None or as_of > best[1]):
                    best = (value, as_of)
    return best


def main():
    # ---------- 1) 상장 리츠 목록 + 종목코드 ----------
    print("[1/4] 상장 리츠 목록에 종목코드를 붙이는 중...")
    listed, listed_file = newest_raw("molit_listed_reits_")
    kind = fetch_kind()
    reits, missing = [], []
    for reits_no, name, _count in listed:
        hit = kind.get(norm_name(name))
        if not hit:
            missing.append(name)
            continue
        reits.append({"id": hit["code"], "name": name, "reits_no": reits_no, "listed_date": hit["listed_date"],
                      "fiscal_month": hit["fiscal_month"], "market": hit["market"]})
    print(f"      리츠 {len(listed)}개 중 종목코드를 찾은 곳 {len(reits)}개" + (f" / 못 찾은 곳 {missing}" if missing else ""))

    # ---------- 2) 건물 ----------
    print("[2/4] 건물(주소·좌표)을 정리하는 중...")
    rows, assets_file = newest_raw("molit_gis_assets_")
    by_no = {r["reits_no"]: r for r in reits}
    assets, counts = [], {}
    for reits_no, name, address, kind_name, lng, lat, land, floor, completed in rows:
        reit = by_no.get(reits_no)
        if not reit:
            continue
        counts[reits_no] = counts.get(reits_no, 0) + 1
        lat_n, lng_n = to_number(lat), to_number(lng)
        assets.append({
            "asset_id": f"{reit['id']}-{counts[reits_no]:02d}", "reit_id": reit["id"], "reit_name": reit["name"],
            "name": name or None, "asset_type": kind_name or None, "invest_type": None, "address": address or None,
            "land_area_m2": to_number(land), "floor_area_m2": to_number(floor), "completed_date": to_date(completed),
            "lat": round(lat_n, 6) if lat_n else None, "lng": round(lng_n, 6) if lng_n else None,
            "geocode_matched": None,
            "geocode_status": "리츠정보시스템 지도 표시 위치" if lat_n else ("주소 없음" if not address else "위치 정보 없음"),
        })
    as_of_assets = to_date(re.search(r"(\d{8})", assets_file).group(1))

    # ---------- 3) reits.json 저장 → 지표에 종목코드 붙이기 ----------
    metrics_by_name = {norm_name(m["name"]): m for m in (load_json("metrics") or {}).get("items", [])}
    reit_items = []
    for r in reits:
        m = metrics_by_name.get(norm_name(r["name"]), {})
        own = [a for a in assets if a["reit_id"] == r["id"]]
        reit_items.append({
            "id": r["id"], "type": "reit", "name": r["name"], "name_official": None, "reits_no": r["reits_no"],
            "id_method": "KIND 상장법인목록 이름 일치", "status": "운영중", "reit_type": None, "amc": None,
            "approved_date": m.get("approved_date"), "listed_date": r["listed_date"],
            "listing_check": "상장일 일치" if m.get("listed_date") == r["listed_date"] else "상장일 확인 필요",
            "fiscal_month": r["fiscal_month"], "main_asset_type": m.get("asset_type"),
            "asset_types": sorted({a["asset_type"] for a in own if a["asset_type"]}), "asset_count": len(own),
            "total_assets_100m_won": None, "molit_dividend_yield": None,
        })
    today = today_str()
    save_json("reits", today, MOLIT_SOURCE + " + 한국거래소 KIND 상장법인목록(종목코드)", reit_items, unmatched=missing)
    save_json("assets", as_of_assets, MOLIT_SOURCE, assets)
    update_meta("reits", "국토교통부 리츠정보시스템 + 한국거래소 KIND 상장법인목록", MOLIT_URL, today, len(reit_items),
                "상장 리츠 목록은 리츠정보시스템 화면, 종목코드는 KIND 상장법인목록에서 이름이 같은 회사.")
    update_meta("assets", "국토교통부 리츠정보시스템 GIS 지도", "https://reits.molit.go.kr/pub/gis/gisMapSearch?pmn=70",
                as_of_assets, len(assets),
                "리츠가 직접 가진 건물만 있음(자회사 리츠를 통해 가진 건물, 해외 건물은 없음). "
                "좌표는 리츠정보시스템 GIS 지도에 표시된 위치. 주소가 없는 건물은 좌표도 없음.")
    screen_file = sorted(RAW_DIR.glob("listed_reits_screen_*.txt"))[-1]
    code = subprocess.run([sys.executable, str(SCRIPTS_DIR / "convert_metrics.py"), "--file", str(screen_file),
                           "--as-of", to_date(re.search(r"(\d{8})", screen_file.name).group(1))],
                          stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL).returncode
    print("      지표에 종목코드 붙이기:", "성공" if code == 0 else "실패(convert_metrics.py 를 따로 실행해 보세요)")
    metrics_by_id = {m["id"]: m for m in (load_json("metrics") or {}).get("items", []) if m.get("id")}

    # ---------- 4) 종가·배당·주식 수 ----------
    print("[3/4] 종가·배당·주식 수를 받는 중... (야후 파이낸스)")
    prices, dividends, base_dates, histories = [], [], [], []
    for r in reit_items:
        symbol = r["id"] + ".KS"
        quote = fetch_yahoo(symbol)
        shares, shares_date = fetch_shares(symbol) if quote else (None, None)
        if not quote or quote.get("currency") != "KRW":
            prices.append({"id": r["id"], "type": "reit", "name": r["name"], "close": None, "base_date": None, "change": None,
                           "change_pct": None, "volume": None, "market_cap": None, "listed_shares": None,
                           "listed_shares_date": None})
            dividends.append({"id": r["id"], "name": r["name"], "corp_code": None, "dps_annual": None,
                              "dps_basis": "야후 파이낸스에 이 종목이 없음", "period_months": None,
                              "latest_period_end": None, "periods": []})
            continue
        close, prev = quote["close"], quote["prev_close"]
        base_dates.append(quote["base_date"])
        histories.append({"id": r["id"], "currency": "KRW", "points": quote["history"]})
        # 주식 수 자료가 1년보다 오래됐으면 그 사이 증자 등으로 달라졌을 수 있어 쓰지 않는다
        limit = (dt.date.fromisoformat(quote["base_date"]) - dt.timedelta(days=365)).isoformat()
        if shares_date and shares_date < limit:
            shares = None
        prices.append({
            "id": r["id"], "type": "reit", "name": r["name"], "close": round(close), "base_date": quote["base_date"],
            "change": round(close - prev) if prev else None,
            "change_pct": round((close - prev) / prev * 100, 2) if prev else None, "volume": None,
            "market_cap": round(close * shares) if shares else None,
            "listed_shares": int(shares) if shares else None, "listed_shares_date": shares_date,
        })
        # 최근 1년 배당: 리츠정보시스템의 결산 횟수와 건수가 맞을 때만 합계를 낸다
        end = dt.date.fromisoformat(quote["base_date"])
        recent = [e for e in quote["dividends"] if dt.date.fromisoformat(e["date"]) > end - dt.timedelta(days=365)]
        expected = (metrics_by_id.get(r["id"]) or {}).get("periods_per_year")
        listing = ", ".join(f"{e['date']} {e['amount']:g}원" for e in recent) or "없음"
        if expected and len(recent) == expected:
            total = round(sum(e["amount"] for e in recent), 2)
            basis = f"최근 1년 배당 {len(recent)}건 합계({listing}). 리츠정보시스템 기준 연 {expected}회 결산과 건수가 일치"
        else:
            total = None
            basis = (f"최근 1년 배당 {len(recent)}건({listing})이 리츠정보시스템 기준 결산 횟수"
                     f"({expected if expected else '알 수 없음'})와 맞지 않아 합계를 내지 않음")
        dividends.append({
            "id": r["id"], "name": r["name"], "corp_code": None, "dps_annual": total, "dps_basis": basis,
            "period_months": 12 // expected if expected else None, "latest_period_end": None,
            "periods": [{"period_end": e["date"], "dps": e["amount"], "from": "배당락일 기준", "rcept_no": None}
                        for e in reversed(quote["dividends"])],
        })

    domestic_prices, domestic_dividends = list(prices), list(dividends)

    # ---------- 해외 리츠 (미국) ----------
    print("      해외 리츠를 받는 중... (S&P 500에 들어 있는 리츠 중 시가총액 상위 10개)")
    global_prices, global_dividends, global_info, global_histories = build_global(10)
    prices.extend(global_prices)
    dividends.extend(global_dividends)
    histories.extend(global_histories)
    global_note = ""
    if global_info:
        global_note = (f" 해외 리츠 {len(global_prices)}개는 S&P 500 구성 종목 중 리츠(위키백과 목록의 GICS 소분류 기준 "
                       f"{global_info['candidates']}개)에서 시가총액이 큰 순서로 고름. "
                       f"원화 값은 달러 값 × 환율 {global_info['fx']:,.2f}원({global_info['fx_date']}, 야후 파이낸스). "
                       "해외 리츠의 위치는 건물이 아니라 본사가 있는 도시(위키백과 목록)이고, 좌표는 OpenStreetMap 기준.")

    as_of_price = max(base_dates) if base_dates else None
    save_json("prices", as_of_price, YAHOO_SOURCE, prices, etf_confirmed=False)
    save_json("dividends", today, YAHOO_SOURCE, dividends)
    save_json("history", as_of_price, YAHOO_SOURCE, histories)
    update_meta("history", YAHOO_SOURCE, YAHOO_URL, as_of_price, len(histories),
                "최근 1년 종가 기록(그래프용). 며칠 간격으로 솎아 낸 값이고, 해외 리츠는 달러 기준.")
    update_meta("prices", YAHOO_SOURCE, YAHOO_URL, as_of_price, len(prices),
                "공식 API 키가 없어 임시로 쓰는 출처. 종가는 마지막 거래일 값(실시간 아님). "
                "시가총액 = 종가 × 발행 주식 수(재무자료 기준, 기준일은 listed_shares_date). 리츠 ETF는 아직 없음."
                + global_note)

    # ---------- 은행 적금 ----------
    saving_items, saving_date = build_savings()
    if saving_items:
        save_json("savings", saving_date, FINLIFE_SOURCE, saving_items)
        update_meta("savings", FINLIFE_SOURCE, FINLIFE_URL, saving_date, len(saving_items),
                    "기준일은 화면을 조회한 날짜. 은행·12개월·정액적립식·가입제한 없음 상품만. 금리는 세전, "
                    "최고 우대금리는 우대조건을 모두 채웠을 때. 우대조건 내용은 담지 못함.")
    update_meta("dividends", YAHOO_SOURCE, YAHOO_URL, today, len(dividends),
                "공식 API 키가 없어 임시로 쓰는 출처. 최근 1년 배당 건수가 리츠정보시스템의 결산 횟수와 같을 때만 "
                "합계를 냄. 과거 지급 실적이며 앞으로의 배당을 뜻하지 않음.")

    # ---------- 요약 ----------
    print("[4/4] 저장 끝\n")
    print(f"  리츠 {len(reit_items)}개 / 건물 {len(assets)}곳 (좌표 있음 {sum(1 for a in assets if a['lat'])}곳)")
    print(f"  종가 기준일 {as_of_price}")
    if saving_items:
        best = max(saving_items, key=lambda s: s["rate_max"] or 0)
        print(f"  은행 적금 {len(saving_items)}개 (최고 우대금리: {best['bank']} {best['product']} {best['rate_max']}%, 기본 {best['rate_base']}%)")
    print(f"  해외 리츠 {len(global_prices)}개" + (f" (환율 {global_info['fx']:,.2f}원)" if global_info else ""))
    for p, d in zip(global_prices, global_dividends):
        y = f"{d['dps_annual'] / p['close'] * 100:.2f}%" if d["dps_annual"] else "-"
        print(f"    {p['id']} {p['name']}: {p['close_local']}달러 (약 {p['close']:,}원) / 1년 배당 {d['dps_annual_local']}달러 / 주가 기준 {y}")
    price_by_id = {p["id"]: p for p in prices}
    for d in domestic_dividends:
        p = price_by_id[d["id"]]
        m = metrics_by_id.get(d["id"]) or {}
        y = f"{d['dps_annual'] / p['close'] * 100:.2f}%" if d["dps_annual"] and p["close"] else "-"
        pnav = (f"{p['market_cap'] / (m['nav_million_won'] * 1e6):.2f}"
                if p.get("market_cap") and m.get("nav_million_won") else "-")
        print(f"    {d['id']} {d['name']}: 종가 {p['close']} / 1년 배당 {d['dps_annual']} / 주가 기준 {y} / P/NAV {pnav}"
              f" / 주식 수 기준일 {p.get('listed_shares_date')}")
        if d["dps_annual"] is None:
            print(f"        → {d['dps_basis']}")
    bad = [r["name"] for r in reit_items if r["listing_check"] != "상장일 일치"]
    if bad:
        print(f"  [확인 필요] KIND의 상장일이 리츠정보시스템과 다른 곳: {bad}")


if __name__ == "__main__":
    run(main)
<<<END FILE>>>

<<<FILE: scripts/build_all.py>>>
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
<<<END FILE>>>

<<<FILE: scripts/fetch_reits.py>>>
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
<<<END FILE>>>

<<<FILE: scripts/fetch_prices.py>>>
# -*- coding: utf-8 -*-
"""
scripts/fetch_prices.py — 금융위원회 시세 API → data/prices.json

하는 일
  1) 시세가 올라와 있는 가장 최근 기준일을 찾는다
     (전일 종가는 다음 영업일 오후 1시 이후에 올라온다. 실시간이 아니다)
  2) reits.json 에 있는 상장 리츠의 종가를 받는다          ← 주식시세정보 API
  3) 종목명에 '리츠'가 들어간 ETF의 종가를 받는다           ← 증권상품시세정보 API
     ETF 목록은 사람이 확인해야 한다 → scripts/etf_confirmed.json

실행
  python scripts/fetch_prices.py          평소 실행
  python scripts/fetch_prices.py --peek   API 원본 1건을 그대로 보여줌(구조 확인용)

필요한 키: DATA_GO_KR_KEY
먼저 필요한 파일: data/reits.json (fetch_reits.py 가 만든다)
출처 명세: 공공데이터포털 15094808, 15094806 (2026-11-14 확인)
"""

import argparse
import json

from _util import (
    ETF_URL, SCRIPTS_DIR, Stop, clean_text, data_go_kr_all, fetch_all_stocks, find_latest_base_date,
    get_data_go_kr_key, load_json, norm_code, peek, run, save_json, to_date, to_number, update_meta,
)

SOURCE = "금융위원회 주식시세정보·증권상품시세정보 API (공공데이터포털 15094808, 15094806)"
SOURCE_URL = "https://www.data.go.kr/data/15094808/openapi.do"
ETF_KEYWORD = "리츠"     # 종목명에 이 글자가 들어간 ETF를 후보로 뽑는다


def load_confirmed_etfs():
    """사람이 확인한 ETF 종목코드 목록. 아직 확인 전이면 None"""
    path = SCRIPTS_DIR / "etf_confirmed.json"
    if not path.exists():
        return None
    try:
        confirmed = json.loads(path.read_text(encoding="utf-8")).get("confirmed")
    except ValueError:
        raise Stop("scripts/etf_confirmed.json 의 모양이 잘못됐어요(쉼표·따옴표 확인).")
    return None if confirmed is None else [norm_code(c) for c in confirmed]


def price_item(row, kind, name=None):
    """API 한 건을 우리 모양으로 바꾼다 (리츠와 ETF 공통)"""
    item = {
        "id": norm_code(row.get("srtnCd")),
        "type": kind,
        "name": name or clean_text(row.get("itmsNm")),
        "close": to_number(row.get("clpr")),                 # 종가(원) = 1주 가격
        "base_date": to_date(row.get("basDt")),
        "change": to_number(row.get("vs")),                  # 전일 대비(원)
        "change_pct": to_number(row.get("fltRt")),           # 등락률(%)
        "volume": to_number(row.get("trqu")),                # 거래량
        "market_cap": to_number(row.get("mrktTotAmt")),      # 시가총액(원)
    }
    if kind == "reit":
        item["listed_shares"] = to_number(row.get("lstgStCnt"))    # 상장주식수
    else:
        item["listed_shares"] = to_number(row.get("stLstgCnt"))    # 상장좌수
        item["nav"] = to_number(row.get("nav"))                    # ETF 1좌당 순자산가치
        item["base_index"] = clean_text(row.get("bssIdxIdxNm"))    # 기초지수 이름
    return item


def main():
    parser = argparse.ArgumentParser(description="금융위 시세 → prices.json")
    parser.add_argument("--peek", action="store_true", help="API 원본 1건을 그대로 출력")
    args = parser.parse_args()

    reits = load_json("reits")
    if not reits or not reits.get("items"):
        raise Stop("data/reits.json 이 없거나 비어 있어요. 먼저  python scripts/fetch_reits.py  를 실행해 주세요.")
    key = get_data_go_kr_key()

    # ---------- 1) 최근 기준일 ----------
    base_date = find_latest_base_date(key)
    print(f"[1/3] 가장 최근 시세 기준일: {to_date(base_date)}")

    # ---------- 2) 상장 리츠 종가 ----------
    print("[2/3] 상장 리츠 종가를 받는 중...")
    stocks = fetch_all_stocks(key, base_date)
    if args.peek and stocks:
        peek("주식시세 1건", stocks[0])
    by_code = {norm_code(s.get("srtnCd")): s for s in stocks}
    items, missing = [], []
    for reit in reits["items"]:
        row = by_code.get(reit["id"])
        if row:
            items.append(price_item(row, "reit", reit["name"]))
        else:                         # 시세가 없으면 지어내지 않고 null 로 남긴다
            missing.append(reit["name"])
            items.append({"id": reit["id"], "type": "reit", "name": reit["name"], "close": None,
                          "base_date": to_date(base_date), "change": None, "change_pct": None,
                          "volume": None, "market_cap": None, "listed_shares": None})

    # ---------- 3) 리츠 ETF 종가 ----------
    print("[3/3] 리츠 ETF 종가를 받는 중...")
    query = {"serviceKey": key, "resultType": "json", "basDt": base_date, "likeItmsNm": ETF_KEYWORD}
    etf_rows = data_go_kr_all(ETF_URL, query, "ETF시세", page_size=1000)
    etf_date = base_date
    if not etf_rows:                  # 주식과 ETF의 최근 기준일이 다를 때를 대비
        etf_date = find_latest_base_date(key, ETF_URL, "ETF시세")
        query["basDt"] = etf_date
        etf_rows = data_go_kr_all(ETF_URL, query, "ETF시세", page_size=1000)
    if args.peek and etf_rows:
        peek("ETF시세 1건", etf_rows[0])

    confirmed = load_confirmed_etfs()
    candidates = [price_item(r, "etf") for r in etf_rows]
    if confirmed is None:
        etf_items = candidates
    else:
        etf_items = [c for c in candidates if c["id"] in confirmed]
    items.extend(etf_items)

    as_of = to_date(base_date)
    note = "전일 종가(실시간 아님). 기준일의 다음 영업일 오후 1시 이후 갱신. 값은 원자료 그대로."
    if confirmed is None:
        note += " ETF 목록은 아직 사람이 확인하지 않음(종목명에 '리츠'가 들어간 ETF 전부)."
    save_json("prices", as_of, SOURCE, items, etf_confirmed=confirmed is not None)
    update_meta("prices", SOURCE, SOURCE_URL, as_of, len(items), note)

    # ---------- 요약 ----------
    reit_count = sum(1 for i in items if i["type"] == "reit")
    print("\n[성공] data/prices.json 저장")
    print(f"  기준일 {as_of} / 리츠 {reit_count}개 / 리츠 ETF {len(etf_items)}개")
    if missing:
        print(f"  빠진 값: 시세를 못 찾은 리츠 {len(missing)}개 {missing}")
    print(f"\n  종목명에 '{ETF_KEYWORD}'가 들어간 ETF 후보 {len(candidates)}개:")
    for c in candidates:
        mark = "" if confirmed is None else ("  [포함]" if c["id"] in confirmed else "  [제외]")
        print(f"    {c['id']}  {c['name']}  (종가 {c['close']}, 기초지수: {c['base_index']}){mark}")
    if confirmed is None:
        print("  [확인 필요] 위 목록에서 넣을 ETF를 알려주세요. 정해지면 scripts/etf_confirmed.json 의")
        print("             confirmed 에 종목코드를 적고 다시 실행하면 그 ETF만 들어갑니다. (지금은 전부 포함)")


if __name__ == "__main__":
    run(main)
<<<END FILE>>>

<<<FILE: scripts/fetch_dividends.py>>>
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
    save_json("dividends", today, SOURCE, items)
    update_meta("dividends", SOURCE, SOURCE_URL, today, len(items),
                "기준일은 조회한 날짜. dps_annual 은 최근 1년에 해당하는 결산기들의 주당 현금배당금(보통주) 합계. "
                "과거 지급 실적이며 앞으로의 배당을 뜻하지 않음.")

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
<<<END FILE>>>

<<<FILE: scripts/fetch_savings.py>>>
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
<<<END FILE>>>

<<<FILE: scripts/convert_metrics.py>>>
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
<<<END FILE>>>

<<<FILE: scripts/geocode_assets.py>>>
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
<<<END FILE>>>

<<<FILE: scripts/manual_ids.json>>>
{
  "_설명": "fetch_reits.py 가 종목코드를 자동으로 못 찾은 상장 리츠를 손으로 이어 주는 파일입니다. ids 안에 \"국토부 리츠번호\": \"종목코드 6자리\" 모양으로 적습니다. 종목코드는 한국거래소(KRX)나 증권사 앱에서 확인한 실제 값만 적으세요.",
  "ids": {}
}
<<<END FILE>>>

<<<FILE: scripts/etf_confirmed.json>>>
{
  "_설명": "fetch_prices.py 가 뽑은 리츠 ETF 후보 중에서, 사람이 확인하고 사이트에 넣기로 한 ETF의 종목코드를 적는 파일입니다. confirmed 가 null 이면 '아직 확인 전'이라는 뜻이고 후보 전부가 들어갑니다. 확인이 끝나면 [\"종목코드\", \"종목코드\"] 모양으로 바꿉니다.",
  "confirmed": null
}
<<<END FILE>>>

<<<FILE: data/raw/README.md>>>
# data/raw — 직접 내려받은 원본 파일을 넣는 곳

여기에는 API로 받을 수 없어서 **사람이 직접 내려받은 엑셀 원본**을 넣습니다.

## 넣을 파일

| 파일 | 어디서 받나 | 누가 |
|---|---|---|
| 상장리츠현황 통계 엑셀 | 리츠정보시스템 https://reits.molit.go.kr/pub/chart/chartSearch02_6?pmn=80 | 데이터 담당 |

## 규칙

- 내려받은 파일은 **내용을 고치지 말고 그대로** 넣습니다. (원본 보존)
- 파일 이름은 무엇이든 괜찮습니다. 이 폴더에 엑셀이 여러 개 있으면 **가장 최근에 넣은 파일**을 읽습니다.
- 이 엑셀을 `scripts/convert_metrics.py`가 읽어서 `data/metrics.json`으로 바꿉니다.
- 기준일은 파일 날짜(내려받은 날)로 기록됩니다. 다른 날짜로 적으려면 `python scripts/convert_metrics.py --as-of 2026-11-14` 처럼 실행합니다.
- 옛날 형식(`.xls`)이라 못 읽는다고 나오면, 엑셀로 열어서 `.xlsx`로 다시 저장한 파일을 넣어 주세요.
<<<END FILE>>>

<<<FILE: data/raw/listed_reits_screen_20261114.txt>>>
리츠명|주요투자대상|인가일|상장일|배당수익률(%)|연환산배당률(%)|NAV(백만원)|P/NAV|FFO(백만원)|P/FFO|WALE(년)
ESR켄달스퀘어리츠|물류|20.08.24|20.12.23|2.77|5.56|1,263,137|0.0031|20,927|0.1885|0
KB스타리츠|오피스|22.02.24|22.10.06|2.74|5.53|267,192|0.005|-54,060|-0.0246|0
NH올원리츠|오피스|19.12.26|21.11.18|3.52|7.1|230,744|0.0128|6,542|0.4525|1.95
NH프라임리츠|오피스|19.08.27|19.12.05|17.42|34.94|108,427|0.0352|10,560|0.3613|0
SK리츠|오피스|21.06.07|21.09.14|1.48|5.93|1,779,469|0.003|28,639|0.1889|1.72
대신밸류리츠|오피스|24.11.28|25.07.10|1.5|5.93|296,787|0.0141|4,387|0.9528|0
디앤디플랫폼리츠|물류|20.04.22|21.08.27|2.83|5.67|386,045|0.0079|9,882|0.3076|0
롯데리츠|리테일|19.05.14|19.10.30|3.03|6.12|1,127,726|0.0031|43,856|0.0787|3.6
마스턴프리미어리츠|오피스|20.06.10|22.05.31|1.12|2.25|94,296|0.015|1,265|1.1194|0
미래에셋글로벌리츠|물류|21.09.15|21.12.03|3.07|6.16|172,409|0.0137|5,135|0.4606|0
미래에셋맵스리츠|리테일|20.02.25|20.08.05|2.83|5.67|94,185|0.0209|2,576|0.7644|0
삼성FN리츠|오피스|22.10.21|23.04.10|1.53|6.05|510,494|0.0106|4,487|1.2012|2.59
신한글로벌액티브리츠|복합형|22.07.08|24.07.01|3.84|7.75|90,905|0.013|-652|-1.8083|0
신한서부티엔디리츠|리테일|20.05.13|21.12.10|2.84|5.72|346,920|0.011|9,631|0.3972|0
신한알파리츠|오피스|18.03.21|18.08.08|3.29|6.61|711,041|0.0079|24,058|0.2344|3.45
이리츠코크렙|리테일|05.07.26|18.06.27|10.54|21.25|260,696|0.013|11,006|0.3089|6.18
이지스레지던스리츠|복합형|20.04.03|20.08.05|3.54|7.15|303,965|0.011|3,878|0.8613|0
이지스밸류플러스리츠|복합형|19.09.10|20.07.16|4.07|8.21|456,821|0.0092|10,117|0.4137|0
제이알글로벌리츠|오피스|20.02.21|20.08.07|0|0|944,002|0.0013|-7,958|-0.1485|11.36
케이탑리츠|복합형|11.02.24|12.01.31|4.72|4.72|104,658|0.0089|1,684|0.5511|2.05
코람코더원리츠|오피스|15.10.26|22.03.28|3.53|14.01|196,511|0.0498|4,642|2.109|3.39
코람코라이프인프라리츠|복합형|20.04.01|20.08.31|3.22|6.46|472,004|0.0091|8,983|0.4804|4
한화리츠|오피스|22.09.20|23.03.27|3.46|6.98|689,622|0.0087|23,645|0.2525|0.9
<<<END FILE>>>

<<<FILE: data/raw/molit_listed_reits_20261115.txt>>>
리츠번호|리츠명|GIS자산수
816|ESR켄달스퀘어리츠|0
914|KB스타리츠|0
774|NH올원리츠|1
750|NH프라임리츠|0
861|SK리츠|4
1057|대신밸류리츠|0
798|디앤디플랫폼리츠|0
745|롯데리츠|13
805|마스턴프리미어리츠|0
881|미래에셋글로벌리츠|0
786|미래에셋맵스리츠|1
950|삼성FN리츠|4
936|신한글로벌액티브리츠|0
800|신한서부티엔디리츠|1
694|신한알파리츠|1
462|이리츠코크렙|3
795|이지스레지던스리츠|0
754|이지스밸류플러스리츠|0
784|제이알글로벌리츠|0
249|케이탑리츠|9
597|코람코더원리츠|1
794|코람코라이프인프라리츠|8
948|한화리츠|7
<<<END FILE>>>

<<<FILE: data/raw/molit_gis_assets_20261115.txt>>>
리츠번호|건물명|주소|자산유형|경도|위도|대지면적|연면적|완공일
745|L7 HOTELS 강남타워|서울특별시 강남구 삼성동 142-41|리테일|127.0515707|37.5057057|2304|33584|2017.11.09
745|롯데백화점 강남점|서울특별시 강남구 대치동 936-21|리테일|127.0537829|37.4976703|11319|67517|1986.04.29
745|롯데호텔 L7 홍대|서울특별시 마포구 동교동 160-5|리테일|126.9216349|37.5557338|2277|27852|2017.12.04
745|롯데백화점 광주점|전남광주통합특별시 동구 대인동 7-1|리테일|126.9120524|35.1548234|10039|92997|1998.09.14
745|롯데마트 계양점|인천광역시 계양구 계산동 1059-1|리테일|126.7360055|37.5408810|10797|58119|1998.07.13
745|롯데마트 경기양평점|경기도 양평군 양평읍 공흥리 468-33|리테일|127.5026162|37.4894593|6473|9977|2018.03.14
745|롯데마트 의왕점|경기도 의왕시 내손동 743-1|리테일|126.9730436|37.3804337|14444|36879|2002.07.16
745|롯데백화점 구리점|경기도 구리시 인창동 675-2|리테일|127.1426875|37.6026816|9938|79271|1998.03.12
745|롯데백화점 안산점|경기도 안산시 단원구 고잔동 536-2|리테일|126.8345336|37.3179993|7165|54887|1992.10.23
745|롯데백화점 중동점|경기도 부천시 중동 1140-1|리테일|126.7759266|37.5022162|7999|93419|1996.10.15
745|롯데마트 장유점|경상남도 김해시 대청동 300|리테일|128.8012792|35.1930446|12646|38838|2004.07.31
745|롯데백화점 창원점|경상남도 창원시 성산구 상남동 79|리테일|128.6819135|35.2245531|27253|140977|2002.02.25
745|롯데마트 춘천점|강원특별자치도 춘천시 온의동 6-25|리테일|127.7180409|37.8686218|13633|40570|2011.08.16
774|분당스퀘어 (비전월드 주차장포함)|경기도 성남시 분당구 서현동 263|오피스|127.1233470|37.3850671|20916|163819|1997.10.08
861|SK-C 타워|서울특별시 중구 충무로3가 43|오피스|126.9925700|37.5625946|2116|21641|2024.12.20
861|서린빌딩|서울특별시 종로구 서린동 99|오피스|126.9803646|37.5696207|5779|83828|2021.07.06
861|SK U-타워|경기도 성남시 분당구 정자동 25-1|오피스|127.1066552|37.3661552|9968|86804|2022.06.30
861|SK-P 타워|경기도 성남시 분당구 삼평동 623|오피스|127.1029666|37.4027258|6717|49679|2013.10.08
786|광교센트럴푸르지오시티 상업시설|경기도 수원시 영통구 이의동 10|리테일|127.0578953|37.3058354|18661|198691|2020.03.24
950|에프엔타워 대치|서울특별시 강남구 대치동 891|오피스|127.0535981|37.5054445|3601|45192|1995.10.14
950|에프엔타워 순화|서울특별시 중구 순화동 175|오피스|126.9727701|37.5604208|1921|27612|2002.04.29
950|에프엔타워 잠실|서울특별시 송파구 신천동 7-22|오피스|127.1032056|37.5148702|1852|24531|2011.10.27
950|에프엔타워 판교|경기도 성남시 분당구 삼평동 642|오피스|127.1100866|37.3974573|1328|17321|2014.04.01
800|스퀘어원 인천|인천광역시 연수구 동춘동 926|리테일|126.6837003|37.4059822|48047|169074|2012.10.05
694|그레이츠 판교|경기도 성남시 분당구 백현동 535|오피스|127.1121840|37.3942219|7325|99416|2018.03.23
462|뉴코아야탑점|경기도 성남시 분당구 야탑동 356|리테일|127.1274580|37.4109559|8047|77031|1995.09.01
462|뉴코아일산점|경기도 고양시 일산동구 마두동 797|리테일|126.7770909|37.6548252|5712|60148|1996.04.01
462|뉴코아평촌점|경기도 안양시 동안구 호계동 1039-3|리테일|126.9511876|37.3891921|5746|70155|1998.04.01
249|LG팰리스빌딩 (3층 일부)|서울특별시 마포구 동교동 165-8|복합형|126.9234529|37.5560839|97|1427|1997.07.20
249|서초빌딩|서울특별시 서초구 서초동 1449-9|복합형|127.0160888|37.4818827|990|4588|2007.08.27
249|쥬디스태화 본관빌딩 (2층~5층)|부산광역시 부산진구 부전동 192-2|복합형|129.0597227|35.1549587|810|6578|1983.04.28
249|완정빌딩|인천광역시 서구 마전동 1015-4|복합형|126.6734017|37.5939899|743|3842|2008.05.27
249|김포빌딩|경기도 김포시 걸포동 1574-3|복합형|126.7072527|37.6322178|1347|9470|2013.09.04
249|화정빌딩|경기도 고양시 덕양구 화정동 970-2|복합형|126.8310665|37.6336269|1328|17256|2009.11.02
249|신원빌딩||복합형|||807|2730|1997.05.27
249|안양동||복합형|||375|134|2010.03.15
249|운중동 큐브타워 (1층 및 2층 일부)||복합형|||73|778|2015.01.26
597|하나증권빌딩|서울특별시 영등포구 여의도동 27-3|오피스|126.9218148|37.5225820|7570|69826|1994.06.07
794|남청라 물류센터|인천광역시 서구 원창동 394-20|복합형|126.6168382|37.5038205|44488|139973|2022.03.14
794|라포르테블랑서현 제2주차장|경기도 성남시 분당구 서현동 275|복합형|127.1206040|37.3860349|2369|17285|1997.01.24
794|죽전 물류센터|경기도 용인시 수지구 죽전동 1351|복합형|127.1288598|37.3299691|7186|5889|1993.03.09
794|고속셀프주유소 외 140개 주유소||복합형|||279773|96355|2020.06.01
794|아늑 시그니처 호텔 서울 구로 시리즈 바이 메리어트||복합형|||633|5084|2017.07.27
794|아늑 시그니처 호텔 인천 구월||복합형|||715|6688|2014.02.28
794|아늑호텔(홍대)||복합형|||221|1256|2013.11.18
794|재동 개발사업||복합형|||0|3642|2027.09.30
948|노원 사옥|서울특별시 노원구 상계동 731|오피스|127.0596854|37.6537684|752|8152|1999.01.21
948|여의도 사옥|서울특별시 영등포구 여의도동 23-5|오피스|126.9229680|37.5239808|3707|59641|1995.03.28
948|장교동 사옥|서울특별시 중구 장교동 1|오피스|126.9865596|37.5673852|7448|74375|1987.10.28
948|구리 사옥|경기도 구리시 교문동 205-3|오피스|127.1326766|37.6005370|1644|18982|2012.05.25
948|중동 사옥|경기도 부천시 원미구 중동 1132-3|오피스|126.7765796|37.4997222|1820|28489|2009.02.03
948|평촌 사옥|경기도 안양시 동안구 호계동 1043|오피스|126.9543262|37.3917820|2228|22259|2005.10.13
948|오렌지센터||오피스|||2732|34173|2007.01.02
<<<END FILE>>>

<<<FILE: data/raw/finlife_savings_screen_20261115.txt>>>
금융회사|상품명|적립방식|세전이자율|최고우대금리|가입대상|이자계산방식
경남은행|오면우대! 하면우대! 정기적금|정액적립식|1.90%|7.00%|제한없음|단리
경남은행|주거래 프리미엄 적금|정액적립식|2.70%|4.30%|제한없음|단리
경남은행|행복 DREAM 적금|정액적립식|2.90%|3.90%|제한없음|단리
광주은행|여행스케치_남도투어적금|정액적립식|2.20%|4.10%|제한없음|단리
광주은행|해피라이프_여행스케치적금V|정액적립식|2.50%|3.70%|제한없음|단리
광주은행|VIP플러스적금|정액적립식|2.40%|2.90%|제한없음|단리
국민은행|KB국민프리미엄적금(정액)|정액적립식|2.75%|3.65%|제한없음|단리
국민은행|KB내맘대로적금|정액적립식|2.55%|3.15%|제한없음|단리
부산은행|펫 적금|정액적립식|2.20%|3.10%|제한없음|단리
수협은행|헤이(Hey)적금 (정액적립식)|정액적립식|2.80%|3.70%|제한없음|단리
수협은행|Sh해양플라스틱Zero!적금 (정액적립식)|정액적립식|3.50%|4.10%|제한없음|단리
우리은행|우리SUPER주거래적금|정액적립식|2.45%|3.85%|제한없음|단리
우리은행|WON적금|정액적립식|3.20%|3.40%|제한없음|단리
전북은행|JB 다이렉트적금(정액적립식)|정액적립식|3.60%|3.70%|제한없음|단리
주식회사 하나은행|내맘적금|정액적립식|2.30%|2.80%|제한없음|단리
한국산업은행|KDB 기업정기적금|정액적립식|3.70%|3.70%|제한없음|단리
한국스탠다드차타드은행|퍼스트가계적금|정액적립식|2.95%|2.95%|제한없음|단리
<<<END FILE>>>

<<<FILE: data/reits.json>>>
{"as_of": "2026-11-15", "source": "국토교통부 리츠정보시스템 공개 화면 (상장리츠현황·GIS 지도에 표시된 값을 옮겨 적음) + 한국거래소 KIND 상장법인목록(종목코드)", "unmatched": [], "items": [
{"id":"365550","type":"reit","name":"ESR켄달스퀘어리츠","name_official":null,"reits_no":"816","id_method":"KIND 상장법인목록 이름 일치","status":"운영중","reit_type":null,"amc":null,"approved_date":"2020-08-24","listed_date":"2020-12-23","listing_check":"상장일 일치","fiscal_month":"05월","main_asset_type":"물류","asset_types":[],"asset_count":0,"total_assets_100m_won":null,"molit_dividend_yield":null},
{"id":"432320","type":"reit","name":"KB스타리츠","name_official":null,"reits_no":"914","id_method":"KIND 상장법인목록 이름 일치","status":"운영중","reit_type":null,"amc":null,"approved_date":"2022-02-24","listed_date":"2022-10-06","listing_check":"상장일 일치","fiscal_month":"01월","main_asset_type":"오피스","asset_types":[],"asset_count":0,"total_assets_100m_won":null,"molit_dividend_yield":null},
{"id":"400760","type":"reit","name":"NH올원리츠","name_official":null,"reits_no":"774","id_method":"KIND 상장법인목록 이름 일치","status":"운영중","reit_type":null,"amc":null,"approved_date":"2019-12-26","listed_date":"2021-11-18","listing_check":"상장일 일치","fiscal_month":"12월","main_asset_type":"오피스","asset_types":["오피스"],"asset_count":1,"total_assets_100m_won":null,"molit_dividend_yield":null},
{"id":"338100","type":"reit","name":"NH프라임리츠","name_official":null,"reits_no":"750","id_method":"KIND 상장법인목록 이름 일치","status":"운영중","reit_type":null,"amc":null,"approved_date":"2019-08-27","listed_date":"2019-12-05","listing_check":"상장일 일치","fiscal_month":"11월","main_asset_type":"오피스","asset_types":[],"asset_count":0,"total_assets_100m_won":null,"molit_dividend_yield":null},
{"id":"395400","type":"reit","name":"SK리츠","name_official":null,"reits_no":"861","id_method":"KIND 상장법인목록 이름 일치","status":"운영중","reit_type":null,"amc":null,"approved_date":"2021-06-07","listed_date":"2021-09-14","listing_check":"상장일 일치","fiscal_month":"03월","main_asset_type":"오피스","asset_types":["오피스"],"asset_count":4,"total_assets_100m_won":null,"molit_dividend_yield":null},
{"id":"0030R0","type":"reit","name":"대신밸류리츠","name_official":null,"reits_no":"1057","id_method":"KIND 상장법인목록 이름 일치","status":"운영중","reit_type":null,"amc":null,"approved_date":"2024-11-28","listed_date":"2025-07-10","listing_check":"상장일 일치","fiscal_month":"08월","main_asset_type":"오피스","asset_types":[],"asset_count":0,"total_assets_100m_won":null,"molit_dividend_yield":null},
{"id":"377190","type":"reit","name":"디앤디플랫폼리츠","name_official":null,"reits_no":"798","id_method":"KIND 상장법인목록 이름 일치","status":"운영중","reit_type":null,"amc":null,"approved_date":"2020-04-22","listed_date":"2021-08-27","listing_check":"상장일 일치","fiscal_month":"03월","main_asset_type":"물류","asset_types":[],"asset_count":0,"total_assets_100m_won":null,"molit_dividend_yield":null},
{"id":"330590","type":"reit","name":"롯데리츠","name_official":null,"reits_no":"745","id_method":"KIND 상장법인목록 이름 일치","status":"운영중","reit_type":null,"amc":null,"approved_date":"2019-05-14","listed_date":"2019-10-30","listing_check":"상장일 일치","fiscal_month":"06월","main_asset_type":"리테일","asset_types":["리테일"],"asset_count":13,"total_assets_100m_won":null,"molit_dividend_yield":null},
{"id":"357430","type":"reit","name":"마스턴프리미어리츠","name_official":null,"reits_no":"805","id_method":"KIND 상장법인목록 이름 일치","status":"운영중","reit_type":null,"amc":null,"approved_date":"2020-06-10","listed_date":"2022-05-31","listing_check":"상장일 일치","fiscal_month":"03월","main_asset_type":"오피스","asset_types":[],"asset_count":0,"total_assets_100m_won":null,"molit_dividend_yield":null},
{"id":"396690","type":"reit","name":"미래에셋글로벌리츠","name_official":null,"reits_no":"881","id_method":"KIND 상장법인목록 이름 일치","status":"운영중","reit_type":null,"amc":null,"approved_date":"2021-09-15","listed_date":"2021-12-03","listing_check":"상장일 일치","fiscal_month":"03월","main_asset_type":"물류","asset_types":[],"asset_count":0,"total_assets_100m_won":null,"molit_dividend_yield":null},
{"id":"357250","type":"reit","name":"미래에셋맵스리츠","name_official":null,"reits_no":"786","id_method":"KIND 상장법인목록 이름 일치","status":"운영중","reit_type":null,"amc":null,"approved_date":"2020-02-25","listed_date":"2020-08-05","listing_check":"상장일 일치","fiscal_month":"11월","main_asset_type":"리테일","asset_types":["리테일"],"asset_count":1,"total_assets_100m_won":null,"molit_dividend_yield":null},
{"id":"448730","type":"reit","name":"삼성FN리츠","name_official":null,"reits_no":"950","id_method":"KIND 상장법인목록 이름 일치","status":"운영중","reit_type":null,"amc":null,"approved_date":"2022-10-21","listed_date":"2023-04-10","listing_check":"상장일 일치","fiscal_month":"01월","main_asset_type":"오피스","asset_types":["오피스"],"asset_count":4,"total_assets_100m_won":null,"molit_dividend_yield":null},
{"id":"481850","type":"reit","name":"신한글로벌액티브리츠","name_official":null,"reits_no":"936","id_method":"KIND 상장법인목록 이름 일치","status":"운영중","reit_type":null,"amc":null,"approved_date":"2022-07-08","listed_date":"2024-07-01","listing_check":"상장일 일치","fiscal_month":"02월","main_asset_type":"복합형","asset_types":[],"asset_count":0,"total_assets_100m_won":null,"molit_dividend_yield":null},
{"id":"404990","type":"reit","name":"신한서부티엔디리츠","name_official":null,"reits_no":"800","id_method":"KIND 상장법인목록 이름 일치","status":"운영중","reit_type":null,"amc":null,"approved_date":"2020-05-13","listed_date":"2021-12-10","listing_check":"상장일 일치","fiscal_month":"12월","main_asset_type":"리테일","asset_types":["리테일"],"asset_count":1,"total_assets_100m_won":null,"molit_dividend_yield":null},
{"id":"293940","type":"reit","name":"신한알파리츠","name_official":null,"reits_no":"694","id_method":"KIND 상장법인목록 이름 일치","status":"운영중","reit_type":null,"amc":null,"approved_date":"2018-03-21","listed_date":"2018-08-08","listing_check":"상장일 일치","fiscal_month":"03월","main_asset_type":"오피스","asset_types":["오피스"],"asset_count":1,"total_assets_100m_won":null,"molit_dividend_yield":null},
{"id":"088260","type":"reit","name":"이리츠코크렙","name_official":null,"reits_no":"462","id_method":"KIND 상장법인목록 이름 일치","status":"운영중","reit_type":null,"amc":null,"approved_date":"2005-07-26","listed_date":"2018-06-27","listing_check":"상장일 일치","fiscal_month":"06월","main_asset_type":"리테일","asset_types":["리테일"],"asset_count":3,"total_assets_100m_won":null,"molit_dividend_yield":null},
{"id":"350520","type":"reit","name":"이지스레지던스리츠","name_official":null,"reits_no":"795","id_method":"KIND 상장법인목록 이름 일치","status":"운영중","reit_type":null,"amc":null,"approved_date":"2020-04-03","listed_date":"2020-08-05","listing_check":"상장일 일치","fiscal_month":"06월","main_asset_type":"복합형","asset_types":[],"asset_count":0,"total_assets_100m_won":null,"molit_dividend_yield":null},
{"id":"334890","type":"reit","name":"이지스밸류플러스리츠","name_official":null,"reits_no":"754","id_method":"KIND 상장법인목록 이름 일치","status":"운영중","reit_type":null,"amc":null,"approved_date":"2019-09-10","listed_date":"2020-07-16","listing_check":"상장일 일치","fiscal_month":"08월","main_asset_type":"복합형","asset_types":[],"asset_count":0,"total_assets_100m_won":null,"molit_dividend_yield":null},
{"id":"348950","type":"reit","name":"제이알글로벌리츠","name_official":null,"reits_no":"784","id_method":"KIND 상장법인목록 이름 일치","status":"운영중","reit_type":null,"amc":null,"approved_date":"2020-02-21","listed_date":"2020-08-07","listing_check":"상장일 일치","fiscal_month":"06월","main_asset_type":"오피스","asset_types":[],"asset_count":0,"total_assets_100m_won":null,"molit_dividend_yield":null},
{"id":"145270","type":"reit","name":"케이탑리츠","name_official":null,"reits_no":"249","id_method":"KIND 상장법인목록 이름 일치","status":"운영중","reit_type":null,"amc":null,"approved_date":"2011-02-24","listed_date":"2012-01-31","listing_check":"상장일 일치","fiscal_month":"12월","main_asset_type":"복합형","asset_types":["복합형"],"asset_count":9,"total_assets_100m_won":null,"molit_dividend_yield":null},
{"id":"417310","type":"reit","name":"코람코더원리츠","name_official":null,"reits_no":"597","id_method":"KIND 상장법인목록 이름 일치","status":"운영중","reit_type":null,"amc":null,"approved_date":"2015-10-26","listed_date":"2022-03-28","listing_check":"상장일 일치","fiscal_month":"02월","main_asset_type":"오피스","asset_types":["오피스"],"asset_count":1,"total_assets_100m_won":null,"molit_dividend_yield":null},
{"id":"357120","type":"reit","name":"코람코라이프인프라리츠","name_official":null,"reits_no":"794","id_method":"KIND 상장법인목록 이름 일치","status":"운영중","reit_type":null,"amc":null,"approved_date":"2020-04-01","listed_date":"2020-08-31","listing_check":"상장일 일치","fiscal_month":"11월","main_asset_type":"복합형","asset_types":["복합형"],"asset_count":8,"total_assets_100m_won":null,"molit_dividend_yield":null},
{"id":"451800","type":"reit","name":"한화리츠","name_official":null,"reits_no":"948","id_method":"KIND 상장법인목록 이름 일치","status":"운영중","reit_type":null,"amc":null,"approved_date":"2022-09-20","listed_date":"2023-03-27","listing_check":"상장일 일치","fiscal_month":"04월","main_asset_type":"오피스","asset_types":["오피스"],"asset_count":7,"total_assets_100m_won":null,"molit_dividend_yield":null}
]}
<<<END FILE>>>

<<<FILE: data/assets.json>>>
{"as_of": "2026-11-15", "source": "국토교통부 리츠정보시스템 공개 화면 (상장리츠현황·GIS 지도에 표시된 값을 옮겨 적음)", "items": [
{"asset_id":"330590-01","reit_id":"330590","reit_name":"롯데리츠","name":"L7 HOTELS 강남타워","asset_type":"리테일","invest_type":null,"address":"서울특별시 강남구 삼성동 142-41","land_area_m2":2304,"floor_area_m2":33584,"completed_date":"2017-11-09","lat":37.505706,"lng":127.051571,"geocode_matched":null,"geocode_status":"리츠정보시스템 지도 표시 위치"},
{"asset_id":"330590-02","reit_id":"330590","reit_name":"롯데리츠","name":"롯데백화점 강남점","asset_type":"리테일","invest_type":null,"address":"서울특별시 강남구 대치동 936-21","land_area_m2":11319,"floor_area_m2":67517,"completed_date":"1986-04-29","lat":37.49767,"lng":127.053783,"geocode_matched":null,"geocode_status":"리츠정보시스템 지도 표시 위치"},
{"asset_id":"330590-03","reit_id":"330590","reit_name":"롯데리츠","name":"롯데호텔 L7 홍대","asset_type":"리테일","invest_type":null,"address":"서울특별시 마포구 동교동 160-5","land_area_m2":2277,"floor_area_m2":27852,"completed_date":"2017-12-04","lat":37.555734,"lng":126.921635,"geocode_matched":null,"geocode_status":"리츠정보시스템 지도 표시 위치"},
{"asset_id":"330590-04","reit_id":"330590","reit_name":"롯데리츠","name":"롯데백화점 광주점","asset_type":"리테일","invest_type":null,"address":"전남광주통합특별시 동구 대인동 7-1","land_area_m2":10039,"floor_area_m2":92997,"completed_date":"1998-09-14","lat":35.154823,"lng":126.912052,"geocode_matched":null,"geocode_status":"리츠정보시스템 지도 표시 위치"},
{"asset_id":"330590-05","reit_id":"330590","reit_name":"롯데리츠","name":"롯데마트 계양점","asset_type":"리테일","invest_type":null,"address":"인천광역시 계양구 계산동 1059-1","land_area_m2":10797,"floor_area_m2":58119,"completed_date":"1998-07-13","lat":37.540881,"lng":126.736006,"geocode_matched":null,"geocode_status":"리츠정보시스템 지도 표시 위치"},
{"asset_id":"330590-06","reit_id":"330590","reit_name":"롯데리츠","name":"롯데마트 경기양평점","asset_type":"리테일","invest_type":null,"address":"경기도 양평군 양평읍 공흥리 468-33","land_area_m2":6473,"floor_area_m2":9977,"completed_date":"2018-03-14","lat":37.489459,"lng":127.502616,"geocode_matched":null,"geocode_status":"리츠정보시스템 지도 표시 위치"},
{"asset_id":"330590-07","reit_id":"330590","reit_name":"롯데리츠","name":"롯데마트 의왕점","asset_type":"리테일","invest_type":null,"address":"경기도 의왕시 내손동 743-1","land_area_m2":14444,"floor_area_m2":36879,"completed_date":"2002-07-16","lat":37.380434,"lng":126.973044,"geocode_matched":null,"geocode_status":"리츠정보시스템 지도 표시 위치"},
{"asset_id":"330590-08","reit_id":"330590","reit_name":"롯데리츠","name":"롯데백화점 구리점","asset_type":"리테일","invest_type":null,"address":"경기도 구리시 인창동 675-2","land_area_m2":9938,"floor_area_m2":79271,"completed_date":"1998-03-12","lat":37.602682,"lng":127.142687,"geocode_matched":null,"geocode_status":"리츠정보시스템 지도 표시 위치"},
{"asset_id":"330590-09","reit_id":"330590","reit_name":"롯데리츠","name":"롯데백화점 안산점","asset_type":"리테일","invest_type":null,"address":"경기도 안산시 단원구 고잔동 536-2","land_area_m2":7165,"floor_area_m2":54887,"completed_date":"1992-10-23","lat":37.317999,"lng":126.834534,"geocode_matched":null,"geocode_status":"리츠정보시스템 지도 표시 위치"},
{"asset_id":"330590-10","reit_id":"330590","reit_name":"롯데리츠","name":"롯데백화점 중동점","asset_type":"리테일","invest_type":null,"address":"경기도 부천시 중동 1140-1","land_area_m2":7999,"floor_area_m2":93419,"completed_date":"1996-10-15","lat":37.502216,"lng":126.775927,"geocode_matched":null,"geocode_status":"리츠정보시스템 지도 표시 위치"},
{"asset_id":"330590-11","reit_id":"330590","reit_name":"롯데리츠","name":"롯데마트 장유점","asset_type":"리테일","invest_type":null,"address":"경상남도 김해시 대청동 300","land_area_m2":12646,"floor_area_m2":38838,"completed_date":"2004-07-31","lat":35.193045,"lng":128.801279,"geocode_matched":null,"geocode_status":"리츠정보시스템 지도 표시 위치"},
{"asset_id":"330590-12","reit_id":"330590","reit_name":"롯데리츠","name":"롯데백화점 창원점","asset_type":"리테일","invest_type":null,"address":"경상남도 창원시 성산구 상남동 79","land_area_m2":27253,"floor_area_m2":140977,"completed_date":"2002-02-25","lat":35.224553,"lng":128.681914,"geocode_matched":null,"geocode_status":"리츠정보시스템 지도 표시 위치"},
{"asset_id":"330590-13","reit_id":"330590","reit_name":"롯데리츠","name":"롯데마트 춘천점","asset_type":"리테일","invest_type":null,"address":"강원특별자치도 춘천시 온의동 6-25","land_area_m2":13633,"floor_area_m2":40570,"completed_date":"2011-08-16","lat":37.868622,"lng":127.718041,"geocode_matched":null,"geocode_status":"리츠정보시스템 지도 표시 위치"},
{"asset_id":"400760-01","reit_id":"400760","reit_name":"NH올원리츠","name":"분당스퀘어 (비전월드 주차장포함)","asset_type":"오피스","invest_type":null,"address":"경기도 성남시 분당구 서현동 263","land_area_m2":20916,"floor_area_m2":163819,"completed_date":"1997-10-08","lat":37.385067,"lng":127.123347,"geocode_matched":null,"geocode_status":"리츠정보시스템 지도 표시 위치"},
{"asset_id":"395400-01","reit_id":"395400","reit_name":"SK리츠","name":"SK-C 타워","asset_type":"오피스","invest_type":null,"address":"서울특별시 중구 충무로3가 43","land_area_m2":2116,"floor_area_m2":21641,"completed_date":"2024-12-20","lat":37.562595,"lng":126.99257,"geocode_matched":null,"geocode_status":"리츠정보시스템 지도 표시 위치"},
{"asset_id":"395400-02","reit_id":"395400","reit_name":"SK리츠","name":"서린빌딩","asset_type":"오피스","invest_type":null,"address":"서울특별시 종로구 서린동 99","land_area_m2":5779,"floor_area_m2":83828,"completed_date":"2021-07-06","lat":37.569621,"lng":126.980365,"geocode_matched":null,"geocode_status":"리츠정보시스템 지도 표시 위치"},
{"asset_id":"395400-03","reit_id":"395400","reit_name":"SK리츠","name":"SK U-타워","asset_type":"오피스","invest_type":null,"address":"경기도 성남시 분당구 정자동 25-1","land_area_m2":9968,"floor_area_m2":86804,"completed_date":"2022-06-30","lat":37.366155,"lng":127.106655,"geocode_matched":null,"geocode_status":"리츠정보시스템 지도 표시 위치"},
{"asset_id":"395400-04","reit_id":"395400","reit_name":"SK리츠","name":"SK-P 타워","asset_type":"오피스","invest_type":null,"address":"경기도 성남시 분당구 삼평동 623","land_area_m2":6717,"floor_area_m2":49679,"completed_date":"2013-10-08","lat":37.402726,"lng":127.102967,"geocode_matched":null,"geocode_status":"리츠정보시스템 지도 표시 위치"},
{"asset_id":"357250-01","reit_id":"357250","reit_name":"미래에셋맵스리츠","name":"광교센트럴푸르지오시티 상업시설","asset_type":"리테일","invest_type":null,"address":"경기도 수원시 영통구 이의동 10","land_area_m2":18661,"floor_area_m2":198691,"completed_date":"2020-03-24","lat":37.305835,"lng":127.057895,"geocode_matched":null,"geocode_status":"리츠정보시스템 지도 표시 위치"},
{"asset_id":"448730-01","reit_id":"448730","reit_name":"삼성FN리츠","name":"에프엔타워 대치","asset_type":"오피스","invest_type":null,"address":"서울특별시 강남구 대치동 891","land_area_m2":3601,"floor_area_m2":45192,"completed_date":"1995-10-14","lat":37.505445,"lng":127.053598,"geocode_matched":null,"geocode_status":"리츠정보시스템 지도 표시 위치"},
{"asset_id":"448730-02","reit_id":"448730","reit_name":"삼성FN리츠","name":"에프엔타워 순화","asset_type":"오피스","invest_type":null,"address":"서울특별시 중구 순화동 175","land_area_m2":1921,"floor_area_m2":27612,"completed_date":"2002-04-29","lat":37.560421,"lng":126.97277,"geocode_matched":null,"geocode_status":"리츠정보시스템 지도 표시 위치"},
{"asset_id":"448730-03","reit_id":"448730","reit_name":"삼성FN리츠","name":"에프엔타워 잠실","asset_type":"오피스","invest_type":null,"address":"서울특별시 송파구 신천동 7-22","land_area_m2":1852,"floor_area_m2":24531,"completed_date":"2011-10-27","lat":37.51487,"lng":127.103206,"geocode_matched":null,"geocode_status":"리츠정보시스템 지도 표시 위치"},
{"asset_id":"448730-04","reit_id":"448730","reit_name":"삼성FN리츠","name":"에프엔타워 판교","asset_type":"오피스","invest_type":null,"address":"경기도 성남시 분당구 삼평동 642","land_area_m2":1328,"floor_area_m2":17321,"completed_date":"2014-04-01","lat":37.397457,"lng":127.110087,"geocode_matched":null,"geocode_status":"리츠정보시스템 지도 표시 위치"},
{"asset_id":"404990-01","reit_id":"404990","reit_name":"신한서부티엔디리츠","name":"스퀘어원 인천","asset_type":"리테일","invest_type":null,"address":"인천광역시 연수구 동춘동 926","land_area_m2":48047,"floor_area_m2":169074,"completed_date":"2012-10-05","lat":37.405982,"lng":126.6837,"geocode_matched":null,"geocode_status":"리츠정보시스템 지도 표시 위치"},
{"asset_id":"293940-01","reit_id":"293940","reit_name":"신한알파리츠","name":"그레이츠 판교","asset_type":"오피스","invest_type":null,"address":"경기도 성남시 분당구 백현동 535","land_area_m2":7325,"floor_area_m2":99416,"completed_date":"2018-03-23","lat":37.394222,"lng":127.112184,"geocode_matched":null,"geocode_status":"리츠정보시스템 지도 표시 위치"},
{"asset_id":"088260-01","reit_id":"088260","reit_name":"이리츠코크렙","name":"뉴코아야탑점","asset_type":"리테일","invest_type":null,"address":"경기도 성남시 분당구 야탑동 356","land_area_m2":8047,"floor_area_m2":77031,"completed_date":"1995-09-01","lat":37.410956,"lng":127.127458,"geocode_matched":null,"geocode_status":"리츠정보시스템 지도 표시 위치"},
{"asset_id":"088260-02","reit_id":"088260","reit_name":"이리츠코크렙","name":"뉴코아일산점","asset_type":"리테일","invest_type":null,"address":"경기도 고양시 일산동구 마두동 797","land_area_m2":5712,"floor_area_m2":60148,"completed_date":"1996-04-01","lat":37.654825,"lng":126.777091,"geocode_matched":null,"geocode_status":"리츠정보시스템 지도 표시 위치"},
{"asset_id":"088260-03","reit_id":"088260","reit_name":"이리츠코크렙","name":"뉴코아평촌점","asset_type":"리테일","invest_type":null,"address":"경기도 안양시 동안구 호계동 1039-3","land_area_m2":5746,"floor_area_m2":70155,"completed_date":"1998-04-01","lat":37.389192,"lng":126.951188,"geocode_matched":null,"geocode_status":"리츠정보시스템 지도 표시 위치"},
{"asset_id":"145270-01","reit_id":"145270","reit_name":"케이탑리츠","name":"LG팰리스빌딩 (3층 일부)","asset_type":"복합형","invest_type":null,"address":"서울특별시 마포구 동교동 165-8","land_area_m2":97,"floor_area_m2":1427,"completed_date":"1997-07-20","lat":37.556084,"lng":126.923453,"geocode_matched":null,"geocode_status":"리츠정보시스템 지도 표시 위치"},
{"asset_id":"145270-02","reit_id":"145270","reit_name":"케이탑리츠","name":"서초빌딩","asset_type":"복합형","invest_type":null,"address":"서울특별시 서초구 서초동 1449-9","land_area_m2":990,"floor_area_m2":4588,"completed_date":"2007-08-27","lat":37.481883,"lng":127.016089,"geocode_matched":null,"geocode_status":"리츠정보시스템 지도 표시 위치"},
{"asset_id":"145270-03","reit_id":"145270","reit_name":"케이탑리츠","name":"쥬디스태화 본관빌딩 (2층~5층)","asset_type":"복합형","invest_type":null,"address":"부산광역시 부산진구 부전동 192-2","land_area_m2":810,"floor_area_m2":6578,"completed_date":"1983-04-28","lat":35.154959,"lng":129.059723,"geocode_matched":null,"geocode_status":"리츠정보시스템 지도 표시 위치"},
{"asset_id":"145270-04","reit_id":"145270","reit_name":"케이탑리츠","name":"완정빌딩","asset_type":"복합형","invest_type":null,"address":"인천광역시 서구 마전동 1015-4","land_area_m2":743,"floor_area_m2":3842,"completed_date":"2008-05-27","lat":37.59399,"lng":126.673402,"geocode_matched":null,"geocode_status":"리츠정보시스템 지도 표시 위치"},
{"asset_id":"145270-05","reit_id":"145270","reit_name":"케이탑리츠","name":"김포빌딩","asset_type":"복합형","invest_type":null,"address":"경기도 김포시 걸포동 1574-3","land_area_m2":1347,"floor_area_m2":9470,"completed_date":"2013-09-04","lat":37.632218,"lng":126.707253,"geocode_matched":null,"geocode_status":"리츠정보시스템 지도 표시 위치"},
{"asset_id":"145270-06","reit_id":"145270","reit_name":"케이탑리츠","name":"화정빌딩","asset_type":"복합형","invest_type":null,"address":"경기도 고양시 덕양구 화정동 970-2","land_area_m2":1328,"floor_area_m2":17256,"completed_date":"2009-11-02","lat":37.633627,"lng":126.831067,"geocode_matched":null,"geocode_status":"리츠정보시스템 지도 표시 위치"},
{"asset_id":"145270-07","reit_id":"145270","reit_name":"케이탑리츠","name":"신원빌딩","asset_type":"복합형","invest_type":null,"address":null,"land_area_m2":807,"floor_area_m2":2730,"completed_date":"1997-05-27","lat":null,"lng":null,"geocode_matched":null,"geocode_status":"주소 없음"},
{"asset_id":"145270-08","reit_id":"145270","reit_name":"케이탑리츠","name":"안양동","asset_type":"복합형","invest_type":null,"address":null,"land_area_m2":375,"floor_area_m2":134,"completed_date":"2010-03-15","lat":null,"lng":null,"geocode_matched":null,"geocode_status":"주소 없음"},
{"asset_id":"145270-09","reit_id":"145270","reit_name":"케이탑리츠","name":"운중동 큐브타워 (1층 및 2층 일부)","asset_type":"복합형","invest_type":null,"address":null,"land_area_m2":73,"floor_area_m2":778,"completed_date":"2015-01-26","lat":null,"lng":null,"geocode_matched":null,"geocode_status":"주소 없음"},
{"asset_id":"417310-01","reit_id":"417310","reit_name":"코람코더원리츠","name":"하나증권빌딩","asset_type":"오피스","invest_type":null,"address":"서울특별시 영등포구 여의도동 27-3","land_area_m2":7570,"floor_area_m2":69826,"completed_date":"1994-06-07","lat":37.522582,"lng":126.921815,"geocode_matched":null,"geocode_status":"리츠정보시스템 지도 표시 위치"},
{"asset_id":"357120-01","reit_id":"357120","reit_name":"코람코라이프인프라리츠","name":"남청라 물류센터","asset_type":"복합형","invest_type":null,"address":"인천광역시 서구 원창동 394-20","land_area_m2":44488,"floor_area_m2":139973,"completed_date":"2022-03-14","lat":37.503821,"lng":126.616838,"geocode_matched":null,"geocode_status":"리츠정보시스템 지도 표시 위치"},
{"asset_id":"357120-02","reit_id":"357120","reit_name":"코람코라이프인프라리츠","name":"라포르테블랑서현 제2주차장","asset_type":"복합형","invest_type":null,"address":"경기도 성남시 분당구 서현동 275","land_area_m2":2369,"floor_area_m2":17285,"completed_date":"1997-01-24","lat":37.386035,"lng":127.120604,"geocode_matched":null,"geocode_status":"리츠정보시스템 지도 표시 위치"},
{"asset_id":"357120-03","reit_id":"357120","reit_name":"코람코라이프인프라리츠","name":"죽전 물류센터","asset_type":"복합형","invest_type":null,"address":"경기도 용인시 수지구 죽전동 1351","land_area_m2":7186,"floor_area_m2":5889,"completed_date":"1993-03-09","lat":37.329969,"lng":127.12886,"geocode_matched":null,"geocode_status":"리츠정보시스템 지도 표시 위치"},
{"asset_id":"357120-04","reit_id":"357120","reit_name":"코람코라이프인프라리츠","name":"고속셀프주유소 외 140개 주유소","asset_type":"복합형","invest_type":null,"address":null,"land_area_m2":279773,"floor_area_m2":96355,"completed_date":"2020-06-01","lat":null,"lng":null,"geocode_matched":null,"geocode_status":"주소 없음"},
{"asset_id":"357120-05","reit_id":"357120","reit_name":"코람코라이프인프라리츠","name":"아늑 시그니처 호텔 서울 구로 시리즈 바이 메리어트","asset_type":"복합형","invest_type":null,"address":null,"land_area_m2":633,"floor_area_m2":5084,"completed_date":"2017-07-27","lat":null,"lng":null,"geocode_matched":null,"geocode_status":"주소 없음"},
{"asset_id":"357120-06","reit_id":"357120","reit_name":"코람코라이프인프라리츠","name":"아늑 시그니처 호텔 인천 구월","asset_type":"복합형","invest_type":null,"address":null,"land_area_m2":715,"floor_area_m2":6688,"completed_date":"2014-02-28","lat":null,"lng":null,"geocode_matched":null,"geocode_status":"주소 없음"},
{"asset_id":"357120-07","reit_id":"357120","reit_name":"코람코라이프인프라리츠","name":"아늑호텔(홍대)","asset_type":"복합형","invest_type":null,"address":null,"land_area_m2":221,"floor_area_m2":1256,"completed_date":"2013-11-18","lat":null,"lng":null,"geocode_matched":null,"geocode_status":"주소 없음"},
{"asset_id":"357120-08","reit_id":"357120","reit_name":"코람코라이프인프라리츠","name":"재동 개발사업","asset_type":"복합형","invest_type":null,"address":null,"land_area_m2":0,"floor_area_m2":3642,"completed_date":"2027-09-30","lat":null,"lng":null,"geocode_matched":null,"geocode_status":"주소 없음"},
{"asset_id":"451800-01","reit_id":"451800","reit_name":"한화리츠","name":"노원 사옥","asset_type":"오피스","invest_type":null,"address":"서울특별시 노원구 상계동 731","land_area_m2":752,"floor_area_m2":8152,"completed_date":"1999-01-21","lat":37.653768,"lng":127.059685,"geocode_matched":null,"geocode_status":"리츠정보시스템 지도 표시 위치"},
{"asset_id":"451800-02","reit_id":"451800","reit_name":"한화리츠","name":"여의도 사옥","asset_type":"오피스","invest_type":null,"address":"서울특별시 영등포구 여의도동 23-5","land_area_m2":3707,"floor_area_m2":59641,"completed_date":"1995-03-28","lat":37.523981,"lng":126.922968,"geocode_matched":null,"geocode_status":"리츠정보시스템 지도 표시 위치"},
{"asset_id":"451800-03","reit_id":"451800","reit_name":"한화리츠","name":"장교동 사옥","asset_type":"오피스","invest_type":null,"address":"서울특별시 중구 장교동 1","land_area_m2":7448,"floor_area_m2":74375,"completed_date":"1987-10-28","lat":37.567385,"lng":126.98656,"geocode_matched":null,"geocode_status":"리츠정보시스템 지도 표시 위치"},
{"asset_id":"451800-04","reit_id":"451800","reit_name":"한화리츠","name":"구리 사옥","asset_type":"오피스","invest_type":null,"address":"경기도 구리시 교문동 205-3","land_area_m2":1644,"floor_area_m2":18982,"completed_date":"2012-05-25","lat":37.600537,"lng":127.132677,"geocode_matched":null,"geocode_status":"리츠정보시스템 지도 표시 위치"},
{"asset_id":"451800-05","reit_id":"451800","reit_name":"한화리츠","name":"중동 사옥","asset_type":"오피스","invest_type":null,"address":"경기도 부천시 원미구 중동 1132-3","land_area_m2":1820,"floor_area_m2":28489,"completed_date":"2009-02-03","lat":37.499722,"lng":126.77658,"geocode_matched":null,"geocode_status":"리츠정보시스템 지도 표시 위치"},
{"asset_id":"451800-06","reit_id":"451800","reit_name":"한화리츠","name":"평촌 사옥","asset_type":"오피스","invest_type":null,"address":"경기도 안양시 동안구 호계동 1043","land_area_m2":2228,"floor_area_m2":22259,"completed_date":"2005-10-13","lat":37.391782,"lng":126.954326,"geocode_matched":null,"geocode_status":"리츠정보시스템 지도 표시 위치"},
{"asset_id":"451800-07","reit_id":"451800","reit_name":"한화리츠","name":"오렌지센터","asset_type":"오피스","invest_type":null,"address":null,"land_area_m2":2732,"floor_area_m2":34173,"completed_date":"2007-01-02","lat":null,"lng":null,"geocode_matched":null,"geocode_status":"주소 없음"}
]}
<<<END FILE>>>

<<<FILE: data/metrics.json>>>
{"as_of": "2026-11-14", "source": "국토교통부 리츠정보시스템 상장리츠현황 통계 (화면에 공개된 표를 옮겨 적음)", "source_file": "listed_reits_screen_20261114.txt", "items": [
{"id":"365550","name":"ESR켄달스퀘어리츠","asset_type":"물류","approved_date":"2020-08-24","listed_date":"2020-12-23","dividend_yield_capital":2.77,"dividend_yield_annualized":5.56,"periods_per_year":2,"nav_million_won":1263137,"ffo_million_won":20927,"p_nav_reported":0.0031,"p_ffo_reported":0.1885,"wale_years":null,"wale_years_raw":0,"real_assets":null},
{"id":"432320","name":"KB스타리츠","asset_type":"오피스","approved_date":"2022-02-24","listed_date":"2022-10-06","dividend_yield_capital":2.74,"dividend_yield_annualized":5.53,"periods_per_year":2,"nav_million_won":267192,"ffo_million_won":-54060,"p_nav_reported":0.005,"p_ffo_reported":-0.0246,"wale_years":null,"wale_years_raw":0,"real_assets":null},
{"id":"400760","name":"NH올원리츠","asset_type":"오피스","approved_date":"2019-12-26","listed_date":"2021-11-18","dividend_yield_capital":3.52,"dividend_yield_annualized":7.1,"periods_per_year":2,"nav_million_won":230744,"ffo_million_won":6542,"p_nav_reported":0.0128,"p_ffo_reported":0.4525,"wale_years":1.95,"wale_years_raw":1.95,"real_assets":null},
{"id":"338100","name":"NH프라임리츠","asset_type":"오피스","approved_date":"2019-08-27","listed_date":"2019-12-05","dividend_yield_capital":17.42,"dividend_yield_annualized":34.94,"periods_per_year":2,"nav_million_won":108427,"ffo_million_won":10560,"p_nav_reported":0.0352,"p_ffo_reported":0.3613,"wale_years":null,"wale_years_raw":0,"real_assets":null},
{"id":"395400","name":"SK리츠","asset_type":"오피스","approved_date":"2021-06-07","listed_date":"2021-09-14","dividend_yield_capital":1.48,"dividend_yield_annualized":5.93,"periods_per_year":4,"nav_million_won":1779469,"ffo_million_won":28639,"p_nav_reported":0.003,"p_ffo_reported":0.1889,"wale_years":1.72,"wale_years_raw":1.72,"real_assets":null},
{"id":"0030R0","name":"대신밸류리츠","asset_type":"오피스","approved_date":"2024-11-28","listed_date":"2025-07-10","dividend_yield_capital":1.5,"dividend_yield_annualized":5.93,"periods_per_year":4,"nav_million_won":296787,"ffo_million_won":4387,"p_nav_reported":0.0141,"p_ffo_reported":0.9528,"wale_years":null,"wale_years_raw":0,"real_assets":null},
{"id":"377190","name":"디앤디플랫폼리츠","asset_type":"물류","approved_date":"2020-04-22","listed_date":"2021-08-27","dividend_yield_capital":2.83,"dividend_yield_annualized":5.67,"periods_per_year":2,"nav_million_won":386045,"ffo_million_won":9882,"p_nav_reported":0.0079,"p_ffo_reported":0.3076,"wale_years":null,"wale_years_raw":0,"real_assets":null},
{"id":"330590","name":"롯데리츠","asset_type":"리테일","approved_date":"2019-05-14","listed_date":"2019-10-30","dividend_yield_capital":3.03,"dividend_yield_annualized":6.12,"periods_per_year":2,"nav_million_won":1127726,"ffo_million_won":43856,"p_nav_reported":0.0031,"p_ffo_reported":0.0787,"wale_years":3.6,"wale_years_raw":3.6,"real_assets":null},
{"id":"357430","name":"마스턴프리미어리츠","asset_type":"오피스","approved_date":"2020-06-10","listed_date":"2022-05-31","dividend_yield_capital":1.12,"dividend_yield_annualized":2.25,"periods_per_year":2,"nav_million_won":94296,"ffo_million_won":1265,"p_nav_reported":0.015,"p_ffo_reported":1.1194,"wale_years":null,"wale_years_raw":0,"real_assets":null},
{"id":"396690","name":"미래에셋글로벌리츠","asset_type":"물류","approved_date":"2021-09-15","listed_date":"2021-12-03","dividend_yield_capital":3.07,"dividend_yield_annualized":6.16,"periods_per_year":2,"nav_million_won":172409,"ffo_million_won":5135,"p_nav_reported":0.0137,"p_ffo_reported":0.4606,"wale_years":null,"wale_years_raw":0,"real_assets":null},
{"id":"357250","name":"미래에셋맵스리츠","asset_type":"리테일","approved_date":"2020-02-25","listed_date":"2020-08-05","dividend_yield_capital":2.83,"dividend_yield_annualized":5.67,"periods_per_year":2,"nav_million_won":94185,"ffo_million_won":2576,"p_nav_reported":0.0209,"p_ffo_reported":0.7644,"wale_years":null,"wale_years_raw":0,"real_assets":null},
{"id":"448730","name":"삼성FN리츠","asset_type":"오피스","approved_date":"2022-10-21","listed_date":"2023-04-10","dividend_yield_capital":1.53,"dividend_yield_annualized":6.05,"periods_per_year":4,"nav_million_won":510494,"ffo_million_won":4487,"p_nav_reported":0.0106,"p_ffo_reported":1.2012,"wale_years":2.59,"wale_years_raw":2.59,"real_assets":null},
{"id":"481850","name":"신한글로벌액티브리츠","asset_type":"복합형","approved_date":"2022-07-08","listed_date":"2024-07-01","dividend_yield_capital":3.84,"dividend_yield_annualized":7.75,"periods_per_year":2,"nav_million_won":90905,"ffo_million_won":-652,"p_nav_reported":0.013,"p_ffo_reported":-1.8083,"wale_years":null,"wale_years_raw":0,"real_assets":null},
{"id":"404990","name":"신한서부티엔디리츠","asset_type":"리테일","approved_date":"2020-05-13","listed_date":"2021-12-10","dividend_yield_capital":2.84,"dividend_yield_annualized":5.72,"periods_per_year":2,"nav_million_won":346920,"ffo_million_won":9631,"p_nav_reported":0.011,"p_ffo_reported":0.3972,"wale_years":null,"wale_years_raw":0,"real_assets":null},
{"id":"293940","name":"신한알파리츠","asset_type":"오피스","approved_date":"2018-03-21","listed_date":"2018-08-08","dividend_yield_capital":3.29,"dividend_yield_annualized":6.61,"periods_per_year":2,"nav_million_won":711041,"ffo_million_won":24058,"p_nav_reported":0.0079,"p_ffo_reported":0.2344,"wale_years":3.45,"wale_years_raw":3.45,"real_assets":null},
{"id":"088260","name":"이리츠코크렙","asset_type":"리테일","approved_date":"2005-07-26","listed_date":"2018-06-27","dividend_yield_capital":10.54,"dividend_yield_annualized":21.25,"periods_per_year":2,"nav_million_won":260696,"ffo_million_won":11006,"p_nav_reported":0.013,"p_ffo_reported":0.3089,"wale_years":6.18,"wale_years_raw":6.18,"real_assets":null},
{"id":"350520","name":"이지스레지던스리츠","asset_type":"복합형","approved_date":"2020-04-03","listed_date":"2020-08-05","dividend_yield_capital":3.54,"dividend_yield_annualized":7.15,"periods_per_year":2,"nav_million_won":303965,"ffo_million_won":3878,"p_nav_reported":0.011,"p_ffo_reported":0.8613,"wale_years":null,"wale_years_raw":0,"real_assets":null},
{"id":"334890","name":"이지스밸류플러스리츠","asset_type":"복합형","approved_date":"2019-09-10","listed_date":"2020-07-16","dividend_yield_capital":4.07,"dividend_yield_annualized":8.21,"periods_per_year":2,"nav_million_won":456821,"ffo_million_won":10117,"p_nav_reported":0.0092,"p_ffo_reported":0.4137,"wale_years":null,"wale_years_raw":0,"real_assets":null},
{"id":"348950","name":"제이알글로벌리츠","asset_type":"오피스","approved_date":"2020-02-21","listed_date":"2020-08-07","dividend_yield_capital":0,"dividend_yield_annualized":0,"periods_per_year":null,"nav_million_won":944002,"ffo_million_won":-7958,"p_nav_reported":0.0013,"p_ffo_reported":-0.1485,"wale_years":11.36,"wale_years_raw":11.36,"real_assets":null},
{"id":"145270","name":"케이탑리츠","asset_type":"복합형","approved_date":"2011-02-24","listed_date":"2012-01-31","dividend_yield_capital":4.72,"dividend_yield_annualized":4.72,"periods_per_year":1,"nav_million_won":104658,"ffo_million_won":1684,"p_nav_reported":0.0089,"p_ffo_reported":0.5511,"wale_years":2.05,"wale_years_raw":2.05,"real_assets":null},
{"id":"417310","name":"코람코더원리츠","asset_type":"오피스","approved_date":"2015-10-26","listed_date":"2022-03-28","dividend_yield_capital":3.53,"dividend_yield_annualized":14.01,"periods_per_year":4,"nav_million_won":196511,"ffo_million_won":4642,"p_nav_reported":0.0498,"p_ffo_reported":2.109,"wale_years":3.39,"wale_years_raw":3.39,"real_assets":null},
{"id":"357120","name":"코람코라이프인프라리츠","asset_type":"복합형","approved_date":"2020-04-01","listed_date":"2020-08-31","dividend_yield_capital":3.22,"dividend_yield_annualized":6.46,"periods_per_year":2,"nav_million_won":472004,"ffo_million_won":8983,"p_nav_reported":0.0091,"p_ffo_reported":0.4804,"wale_years":4,"wale_years_raw":4,"real_assets":null},
{"id":"451800","name":"한화리츠","asset_type":"오피스","approved_date":"2022-09-20","listed_date":"2023-03-27","dividend_yield_capital":3.46,"dividend_yield_annualized":6.98,"periods_per_year":2,"nav_million_won":689622,"ffo_million_won":23645,"p_nav_reported":0.0087,"p_ffo_reported":0.2525,"wale_years":0.9,"wale_years_raw":0.9,"real_assets":null}
]}
<<<END FILE>>>

<<<FILE: data/prices.json>>>
{"as_of": "2026-11-13", "source": "야후 파이낸스 (비공식 · 거래소 시세 지연 제공)", "etf_confirmed": false, "items": [
{"id":"365550","type":"reit","name":"ESR켄달스퀘어리츠","close":2745,"base_date":"2026-11-13","change":60,"change_pct":2.23,"volume":null,"market_cap":675514305000,"listed_shares":246089000,"listed_shares_date":"2026-08-31"},
{"id":"432320","type":"reit","name":"KB스타리츠","close":1290,"base_date":"2026-11-13","change":-4,"change_pct":-0.31,"volume":null,"market_cap":142528927890,"listed_shares":110487541,"listed_shares_date":"2026-04-30"},
{"id":"400760","type":"reit","name":"NH올원리츠","close":2295,"base_date":"2026-11-13","change":20,"change_pct":0.88,"volume":null,"market_cap":126062686125,"listed_shares":54929275,"listed_shares_date":"2026-06-30"},
{"id":"338100","type":"reit","name":"NH프라임리츠","close":3615,"base_date":"2026-11-13","change":10,"change_pct":0.28,"volume":null,"market_cap":67455900000,"listed_shares":18660000,"listed_shares_date":"2026-08-31"},
{"id":"395400","type":"reit","name":"SK리츠","close":4780,"base_date":"2026-11-13","change":165,"change_pct":3.58,"volume":null,"market_cap":1438864223600,"listed_shares":301017620,"listed_shares_date":"2026-06-30"},
{"id":"0030R0","type":"reit","name":"대신밸류리츠","close":3520,"base_date":"2026-11-13","change":25,"change_pct":0.72,"volume":null,"market_cap":null,"listed_shares":null,"listed_shares_date":null},
{"id":"377190","type":"reit","name":"디앤디플랫폼리츠","close":1758,"base_date":"2026-11-13","change":0,"change_pct":0.0,"volume":null,"market_cap":155407200000,"listed_shares":88400000,"listed_shares_date":"2026-06-30"},
{"id":"330590","type":"reit","name":"롯데리츠","close":3645,"base_date":"2026-11-13","change":110,"change_pct":3.11,"volume":null,"market_cap":1053291582180,"listed_shares":288968884,"listed_shares_date":"2026-06-30"},
{"id":"357430","type":"reit","name":"마스턴프리미어리츠","close":601,"base_date":"2026-11-13","change":-11,"change_pct":-1.8,"volume":null,"market_cap":18333689507,"listed_shares":30505307,"listed_shares_date":"2026-06-30"},
{"id":"396690","type":"reit","name":"미래에셋글로벌리츠","close":765,"base_date":"2026-11-13","change":-10,"change_pct":-1.29,"volume":null,"market_cap":30298544100,"listed_shares":39605940,"listed_shares_date":"2026-06-30"},
{"id":"357250","type":"reit","name":"미래에셋맵스리츠","close":1555,"base_date":"2026-11-13","change":1,"change_pct":0.06,"volume":null,"market_cap":38867388275,"listed_shares":24995105,"listed_shares_date":"2026-08-31"},
{"id":"448730","type":"reit","name":"삼성FN리츠","close":4490,"base_date":"2026-11-13","change":-5,"change_pct":-0.11,"volume":null,"market_cap":408814500000,"listed_shares":91050000,"listed_shares_date":"2026-07-31"},
{"id":"481850","type":"reit","name":"신한글로벌액티브리츠","close":802,"base_date":"2026-11-13","change":0,"change_pct":0.0,"volume":null,"market_cap":null,"listed_shares":null,"listed_shares_date":"2024-08-31"},
{"id":"404990","type":"reit","name":"신한서부티엔디리츠","close":3400,"base_date":"2026-11-13","change":20,"change_pct":0.59,"volume":null,"market_cap":195857197200,"listed_shares":57605058,"listed_shares_date":"2025-12-31"},
{"id":"293940","type":"reit","name":"신한알파리츠","close":5660,"base_date":"2026-11-13","change":10,"change_pct":0.18,"volume":null,"market_cap":684521096180,"listed_shares":120940123,"listed_shares_date":"2026-06-30"},
{"id":"088260","type":"reit","name":"이리츠코크렙","close":2935,"base_date":"2026-11-13","change":50,"change_pct":1.73,"volume":null,"market_cap":185907566650,"listed_shares":63341590,"listed_shares_date":"2026-06-30"},
{"id":"350520","type":"reit","name":"이지스레지던스리츠","close":3000,"base_date":"2026-11-13","change":60,"change_pct":2.04,"volume":null,"market_cap":110598606000,"listed_shares":36866202,"listed_shares_date":"2026-06-30"},
{"id":"334890","type":"reit","name":"이지스밸류플러스리츠","close":2930,"base_date":"2026-11-13","change":0,"change_pct":0.0,"volume":null,"market_cap":152886160610,"listed_shares":52179577,"listed_shares_date":"2025-11-30"},
{"id":"348950","type":"reit","name":"제이알글로벌리츠","close":1182,"base_date":"2026-11-13","change":0,"change_pct":0.0,"volume":null,"market_cap":233298432000,"listed_shares":197376000,"listed_shares_date":"2026-06-30"},
{"id":"145270","type":"reit","name":"케이탑리츠","close":815,"base_date":"2026-11-13","change":0,"change_pct":0.0,"volume":null,"market_cap":38635602305,"listed_shares":47405647,"listed_shares_date":"2026-09-30"},
{"id":"417310","type":"reit","name":"코람코더원리츠","close":2450,"base_date":"2026-11-13","change":35,"change_pct":1.45,"volume":null,"market_cap":98980000000,"listed_shares":40400000,"listed_shares_date":"2026-08-31"},
{"id":"357120","type":"reit","name":"코람코라이프인프라리츠","close":3210,"base_date":"2026-11-13","change":-15,"change_pct":-0.47,"volume":null,"market_cap":312446486340,"listed_shares":97335354,"listed_shares_date":"2026-08-31"},
{"id":"451800","type":"reit","name":"한화리츠","close":4555,"base_date":"2026-11-13","change":-40,"change_pct":-0.87,"volume":null,"market_cap":818078000000,"listed_shares":179600000,"listed_shares_date":"2026-07-31"},
{"hq":"Toledo, Ohio","hq_lat":41.6529,"hq_lng":-83.5378,"id":"WELL","type":"global","name":"Welltower","close":326647,"close_local":244.46,"currency":"USD","fx_rate":1336.2,"base_date":"2026-11-13","change":null,"change_pct":-0.19,"volume":null,"market_cap":239104432728201,"listed_shares":731995408,"listed_shares_date":"2026-09-30","country":"미국","sub_industry":"Health Care REITs"},
{"hq":"San Francisco, California","hq_lat":37.7879,"hq_lng":-122.4075,"id":"PLD","type":"global","name":"Prologis","close":171929,"close_local":128.67,"currency":"USD","fx_rate":1336.2,"base_date":"2026-11-13","change":null,"change_pct":0.09,"volume":null,"market_cap":163400486829826,"listed_shares":950396000,"listed_shares_date":"2026-09-30","country":"미국","sub_industry":"Industrial REITs"},
{"hq":"Redwood City, California","hq_lat":37.4863,"hq_lng":-122.2325,"id":"EQIX","type":"global","name":"Equinix","close":1408074,"close_local":1053.79,"currency":"USD","fx_rate":1336.2,"base_date":"2026-11-13","change":null,"change_pct":-1.77,"volume":null,"market_cap":139382448784946,"listed_shares":98988000,"listed_shares_date":"2026-09-30","country":"미국","sub_industry":"Data Center REITs"},
{"hq":"Boston, Massachusetts","hq_lat":42.3588,"hq_lng":-71.0578,"id":"AMT","type":"global","name":"American Tower","close":256069,"close_local":191.64,"currency":"USD","fx_rate":1336.2,"base_date":"2026-11-13","change":null,"change_pct":0.97,"volume":null,"market_cap":118860225961286,"listed_shares":464172000,"listed_shares_date":"2026-09-30","country":"미국","sub_industry":"Telecom Tower REITs"},
{"hq":"Indianapolis, Indiana","hq_lat":39.7683,"hq_lng":-86.1584,"id":"SPG","type":"global","name":"Simon Property Group","close":311295,"close_local":232.97,"currency":"USD","fx_rate":1336.2,"base_date":"2026-11-13","change":null,"change_pct":-0.27,"volume":null,"market_cap":100383204470449,"listed_shares":322470211,"listed_shares_date":"2026-09-30","country":"미국","sub_industry":"Retail REITs"},
{"hq":"Austin, Texas","hq_lat":30.2649,"hq_lng":-97.7474,"id":"DLR","type":"global","name":"Digital Realty","close":240503,"close_local":179.99,"currency":"USD","fx_rate":1336.2,"base_date":"2026-11-13","change":null,"change_pct":-1.9,"volume":null,"market_cap":90161552411478,"listed_shares":374888000,"listed_shares_date":"2026-09-30","country":"미국","sub_industry":"Data Center REITs"},
{"hq":"Glendale, California","hq_lat":34.1469,"hq_lng":-118.2478,"id":"PSA","type":"global","name":"Public Storage","close":444407,"close_local":332.59,"currency":"USD","fx_rate":1336.2,"base_date":"2026-11-13","change":null,"change_pct":-0.22,"volume":null,"market_cap":83034390149980,"listed_shares":186843230,"listed_shares_date":"2026-09-30","country":"미국","sub_industry":"Self-Storage REITs"},
{"hq":"San Diego, California","hq_lat":32.7157,"hq_lng":-117.1638,"id":"O","type":"global","name":"Realty Income","close":78595,"close_local":58.82,"currency":"USD","fx_rate":1336.2,"base_date":"2026-11-13","change":null,"change_pct":-0.74,"volume":null,"market_cap":74741282534760,"listed_shares":950964000,"listed_shares_date":"2026-09-30","country":"미국","sub_industry":"Retail REITs"},
{"hq":"Chicago, Illinois","hq_lat":41.8756,"hq_lng":-87.6244,"id":"VMRK","type":"global","name":"Vivmark Residential","close":85811,"close_local":64.22,"currency":"USD","fx_rate":1336.2,"base_date":"2026-11-13","change":null,"change_pct":0.45,"volume":null,"market_cap":66363869784055,"listed_shares":773374666,"listed_shares_date":"2026-09-30","country":"미국","sub_industry":"Multi-Family Residential REITs"},
{"hq":"Chicago, Illinois","hq_lat":41.8756,"hq_lng":-87.6244,"id":"VTR","type":"global","name":"Ventas","close":118815,"close_local":88.92,"currency":"USD","fx_rate":1336.2,"base_date":"2026-11-13","change":null,"change_pct":-0.81,"volume":null,"market_cap":62831693943411,"listed_shares":528820000,"listed_shares_date":"2026-09-30","country":"미국","sub_industry":"Health Care REITs"}
]}
<<<END FILE>>>

<<<FILE: data/dividends.json>>>
{"as_of": "2026-11-15", "source": "야후 파이낸스 (비공식 · 거래소 시세 지연 제공)", "items": [
{"id":"365550","name":"ESR켄달스퀘어리츠","corp_code":null,"dps_annual":278.0,"dps_basis":"최근 1년 배당 2건 합계(2025-11-27 139원, 2026-05-28 139원). 리츠정보시스템 기준 연 2회 결산과 건수가 일치","period_months":6,"latest_period_end":null,"periods":[{"period_end":"2026-05-28","dps":139.0,"from":"배당락일 기준","rcept_no":null},{"period_end":"2025-11-27","dps":139.0,"from":"배당락일 기준","rcept_no":null},{"period_end":"2025-05-29","dps":137.0,"from":"배당락일 기준","rcept_no":null},{"period_end":"2024-11-28","dps":135.24255,"from":"배당락일 기준","rcept_no":null}]},
{"id":"432320","name":"KB스타리츠","corp_code":null,"dps_annual":260.0,"dps_basis":"최근 1년 배당 2건 합계(2026-05-07 170원, 2026-11-05 90원). 리츠정보시스템 기준 연 2회 결산과 건수가 일치","period_months":6,"latest_period_end":null,"periods":[{"period_end":"2026-11-05","dps":90.0,"from":"배당락일 기준","rcept_no":null},{"period_end":"2026-05-07","dps":170.0,"from":"배당락일 기준","rcept_no":null},{"period_end":"2025-07-30","dps":156.03957,"from":"배당락일 기준","rcept_no":null},{"period_end":"2025-01-24","dps":165.21837,"from":"배당락일 기준","rcept_no":null}]},
{"id":"400760","name":"NH올원리츠","corp_code":null,"dps_annual":300.0,"dps_basis":"최근 1년 배당 2건 합계(2025-12-29 150원, 2026-06-29 150원). 리츠정보시스템 기준 연 2회 결산과 건수가 일치","period_months":6,"latest_period_end":null,"periods":[{"period_end":"2026-06-29","dps":150.0,"from":"배당락일 기준","rcept_no":null},{"period_end":"2025-12-29","dps":150.0,"from":"배당락일 기준","rcept_no":null},{"period_end":"2025-06-27","dps":166.3584,"from":"배당락일 기준","rcept_no":null},{"period_end":"2024-12-27","dps":195.71576,"from":"배당락일 기준","rcept_no":null}]},
{"id":"338100","name":"NH프라임리츠","corp_code":null,"dps_annual":1462.0,"dps_basis":"최근 1년 배당 2건 합계(2025-11-27 625원, 2026-05-28 837원). 리츠정보시스템 기준 연 2회 결산과 건수가 일치","period_months":6,"latest_period_end":null,"periods":[{"period_end":"2026-05-28","dps":837.0,"from":"배당락일 기준","rcept_no":null},{"period_end":"2025-11-27","dps":625.0,"from":"배당락일 기준","rcept_no":null},{"period_end":"2025-05-29","dps":126.0,"from":"배당락일 기준","rcept_no":null},{"period_end":"2024-11-28","dps":518.0,"from":"배당락일 기준","rcept_no":null}]},
{"id":"395400","name":"SK리츠","corp_code":null,"dps_annual":274.0,"dps_basis":"최근 1년 배당 4건 합계(2025-12-29 66원, 2026-03-30 68원, 2026-06-29 68원, 2026-09-29 72원). 리츠정보시스템 기준 연 4회 결산과 건수가 일치","period_months":3,"latest_period_end":null,"periods":[{"period_end":"2026-09-29","dps":72.0,"from":"배당락일 기준","rcept_no":null},{"period_end":"2026-06-29","dps":68.0,"from":"배당락일 기준","rcept_no":null},{"period_end":"2026-03-30","dps":68.0,"from":"배당락일 기준","rcept_no":null},{"period_end":"2025-12-29","dps":66.0,"from":"배당락일 기준","rcept_no":null},{"period_end":"2025-09-29","dps":66.0,"from":"배당락일 기준","rcept_no":null},{"period_end":"2025-06-27","dps":66.0,"from":"배당락일 기준","rcept_no":null},{"period_end":"2025-03-28","dps":70.0,"from":"배당락일 기준","rcept_no":null},{"period_end":"2024-12-27","dps":66.0,"from":"배당락일 기준","rcept_no":null}]},
{"id":"0030R0","name":"대신밸류리츠","corp_code":null,"dps_annual":null,"dps_basis":"최근 1년 배당 3건(2025-11-27 73원, 2026-02-26 73원, 2026-05-28 73원)이 리츠정보시스템 기준 결산 횟수(4)와 맞지 않아 합계를 내지 않음","period_months":3,"latest_period_end":null,"periods":[{"period_end":"2026-05-28","dps":73.0,"from":"배당락일 기준","rcept_no":null},{"period_end":"2026-02-26","dps":73.0,"from":"배당락일 기준","rcept_no":null},{"period_end":"2025-11-27","dps":73.0,"from":"배당락일 기준","rcept_no":null},{"period_end":"2025-08-28","dps":73.0,"from":"배당락일 기준","rcept_no":null}]},
{"id":"377190","name":"디앤디플랫폼리츠","corp_code":null,"dps_annual":330.0,"dps_basis":"최근 1년 배당 2건 합계(2026-03-30 120원, 2026-09-29 210원). 리츠정보시스템 기준 연 2회 결산과 건수가 일치","period_months":6,"latest_period_end":null,"periods":[{"period_end":"2026-09-29","dps":210.0,"from":"배당락일 기준","rcept_no":null},{"period_end":"2026-03-30","dps":120.0,"from":"배당락일 기준","rcept_no":null},{"period_end":"2025-09-29","dps":120.0,"from":"배당락일 기준","rcept_no":null},{"period_end":"2025-03-28","dps":126.0,"from":"배당락일 기준","rcept_no":null}]},
{"id":"330590","name":"롯데리츠","corp_code":null,"dps_annual":262.0,"dps_basis":"최근 1년 배당 2건 합계(2026-03-24 123원, 2026-10-02 139원). 리츠정보시스템 기준 연 2회 결산과 건수가 일치","period_months":6,"latest_period_end":null,"periods":[{"period_end":"2026-10-02","dps":139.0,"from":"배당락일 기준","rcept_no":null},{"period_end":"2026-03-24","dps":123.0,"from":"배당락일 기준","rcept_no":null},{"period_end":"2025-09-25","dps":117.0,"from":"배당락일 기준","rcept_no":null},{"period_end":"2024-12-27","dps":112.0,"from":"배당락일 기준","rcept_no":null}]},
{"id":"357430","name":"마스턴프리미어리츠","corp_code":null,"dps_annual":null,"dps_basis":"최근 1년 배당 0건(없음)이 리츠정보시스템 기준 결산 횟수(2)와 맞지 않아 합계를 내지 않음","period_months":6,"latest_period_end":null,"periods":[{"period_end":"2025-09-29","dps":96.0,"from":"배당락일 기준","rcept_no":null},{"period_end":"2025-03-28","dps":61.0,"from":"배당락일 기준","rcept_no":null}]},
{"id":"396690","name":"미래에셋글로벌리츠","corp_code":null,"dps_annual":null,"dps_basis":"최근 1년 배당 1건(2026-03-30 130원)이 리츠정보시스템 기준 결산 횟수(2)와 맞지 않아 합계를 내지 않음","period_months":6,"latest_period_end":null,"periods":[{"period_end":"2026-03-30","dps":130.0,"from":"배당락일 기준","rcept_no":null},{"period_end":"2025-09-29","dps":135.0,"from":"배당락일 기준","rcept_no":null},{"period_end":"2025-03-28","dps":142.0,"from":"배당락일 기준","rcept_no":null}]},
{"id":"357250","name":"미래에셋맵스리츠","corp_code":null,"dps_annual":232.0,"dps_basis":"최근 1년 배당 2건 합계(2025-11-27 112원, 2026-05-28 120원). 리츠정보시스템 기준 연 2회 결산과 건수가 일치","period_months":6,"latest_period_end":null,"periods":[{"period_end":"2026-05-28","dps":120.0,"from":"배당락일 기준","rcept_no":null},{"period_end":"2025-11-27","dps":112.0,"from":"배당락일 기준","rcept_no":null},{"period_end":"2025-05-29","dps":137.0,"from":"배당락일 기준","rcept_no":null},{"period_end":"2024-11-28","dps":132.0,"from":"배당락일 기준","rcept_no":null}]},
{"id":"448730","name":"삼성FN리츠","corp_code":null,"dps_annual":null,"dps_basis":"최근 1년 배당 3건(2026-01-29 69원, 2026-04-29 69원, 2026-07-30 69원)이 리츠정보시스템 기준 결산 횟수(4)와 맞지 않아 합계를 내지 않음","period_months":3,"latest_period_end":null,"periods":[{"period_end":"2026-07-30","dps":69.0,"from":"배당락일 기준","rcept_no":null},{"period_end":"2026-04-29","dps":69.0,"from":"배당락일 기준","rcept_no":null},{"period_end":"2026-01-29","dps":69.0,"from":"배당락일 기준","rcept_no":null},{"period_end":"2025-10-30","dps":69.0,"from":"배당락일 기준","rcept_no":null},{"period_end":"2025-07-30","dps":69.0,"from":"배당락일 기준","rcept_no":null},{"period_end":"2025-04-29","dps":69.0,"from":"배당락일 기준","rcept_no":null},{"period_end":"2025-01-24","dps":73.0,"from":"배당락일 기준","rcept_no":null}]},
{"id":"481850","name":"신한글로벌액티브리츠","corp_code":null,"dps_annual":164.0,"dps_basis":"최근 1년 배당 2건 합계(2026-02-26 130원, 2026-08-28 34원). 리츠정보시스템 기준 연 2회 결산과 건수가 일치","period_months":6,"latest_period_end":null,"periods":[{"period_end":"2026-08-28","dps":34.0,"from":"배당락일 기준","rcept_no":null},{"period_end":"2026-02-26","dps":130.0,"from":"배당락일 기준","rcept_no":null},{"period_end":"2025-02-27","dps":127.0,"from":"배당락일 기준","rcept_no":null}]},
{"id":"404990","name":"신한서부티엔디리츠","corp_code":null,"dps_annual":267.0,"dps_basis":"최근 1년 배당 2건 합계(2025-12-29 132원, 2026-09-11 135원). 리츠정보시스템 기준 연 2회 결산과 건수가 일치","period_months":6,"latest_period_end":null,"periods":[{"period_end":"2026-09-11","dps":135.0,"from":"배당락일 기준","rcept_no":null},{"period_end":"2025-12-29","dps":132.0,"from":"배당락일 기준","rcept_no":null},{"period_end":"2025-06-27","dps":130.0,"from":"배당락일 기준","rcept_no":null},{"period_end":"2024-12-27","dps":130.0,"from":"배당락일 기준","rcept_no":null}]},
{"id":"293940","name":"신한알파리츠","corp_code":null,"dps_annual":361.0,"dps_basis":"최근 1년 배당 2건 합계(2025-12-12 179원, 2026-06-11 182원). 리츠정보시스템 기준 연 2회 결산과 건수가 일치","period_months":6,"latest_period_end":null,"periods":[{"period_end":"2026-06-11","dps":182.0,"from":"배당락일 기준","rcept_no":null},{"period_end":"2025-12-12","dps":179.0,"from":"배당락일 기준","rcept_no":null},{"period_end":"2025-03-28","dps":173.0,"from":"배당락일 기준","rcept_no":null}]},
{"id":"088260","name":"이리츠코크렙","corp_code":null,"dps_annual":349.0,"dps_basis":"최근 1년 배당 2건 합계(2025-12-29 176원, 2026-06-29 173원). 리츠정보시스템 기준 연 2회 결산과 건수가 일치","period_months":6,"latest_period_end":null,"periods":[{"period_end":"2026-06-29","dps":173.0,"from":"배당락일 기준","rcept_no":null},{"period_end":"2025-12-29","dps":176.0,"from":"배당락일 기준","rcept_no":null},{"period_end":"2025-06-27","dps":174.0,"from":"배당락일 기준","rcept_no":null},{"period_end":"2024-12-27","dps":176.0,"from":"배당락일 기준","rcept_no":null}]},
{"id":"350520","name":"이지스레지던스리츠","corp_code":null,"dps_annual":300.0,"dps_basis":"최근 1년 배당 2건 합계(2025-12-29 150원, 2026-06-29 150원). 리츠정보시스템 기준 연 2회 결산과 건수가 일치","period_months":6,"latest_period_end":null,"periods":[{"period_end":"2026-06-29","dps":150.0,"from":"배당락일 기준","rcept_no":null},{"period_end":"2025-12-29","dps":150.0,"from":"배당락일 기준","rcept_no":null},{"period_end":"2025-06-27","dps":150.0,"from":"배당락일 기준","rcept_no":null},{"period_end":"2024-12-27","dps":150.0,"from":"배당락일 기준","rcept_no":null}]},
{"id":"334890","name":"이지스밸류플러스리츠","corp_code":null,"dps_annual":332.0,"dps_basis":"최근 1년 배당 2건 합계(2025-12-04 172원, 2026-06-04 160원). 리츠정보시스템 기준 연 2회 결산과 건수가 일치","period_months":6,"latest_period_end":null,"periods":[{"period_end":"2026-06-04","dps":160.0,"from":"배당락일 기준","rcept_no":null},{"period_end":"2025-12-04","dps":172.0,"from":"배당락일 기준","rcept_no":null},{"period_end":"2025-06-04","dps":170.55945,"from":"배당락일 기준","rcept_no":null},{"period_end":"2024-12-03","dps":603.3664,"from":"배당락일 기준","rcept_no":null}]},
{"id":"348950","name":"제이알글로벌리츠","corp_code":null,"dps_annual":null,"dps_basis":"최근 1년 배당 1건(2025-12-29 115원)이 리츠정보시스템 기준 결산 횟수(알 수 없음)와 맞지 않아 합계를 내지 않음","period_months":null,"latest_period_end":null,"periods":[{"period_end":"2025-12-29","dps":115.0,"from":"배당락일 기준","rcept_no":null},{"period_end":"2025-06-27","dps":115.0,"from":"배당락일 기준","rcept_no":null},{"period_end":"2024-12-27","dps":195.0,"from":"배당락일 기준","rcept_no":null}]},
{"id":"145270","name":"케이탑리츠","corp_code":null,"dps_annual":null,"dps_basis":"최근 1년 배당 0건(없음)이 리츠정보시스템 기준 결산 횟수(1)와 맞지 않아 합계를 내지 않음","period_months":12,"latest_period_end":null,"periods":[{"period_end":"2024-12-27","dps":68.0,"from":"배당락일 기준","rcept_no":null}]},
{"id":"417310","name":"코람코더원리츠","corp_code":null,"dps_annual":null,"dps_basis":"최근 1년 배당 3건(2025-11-27 94원, 2026-05-28 114원, 2026-08-28 8974원)이 리츠정보시스템 기준 결산 횟수(4)와 맞지 않아 합계를 내지 않음","period_months":3,"latest_period_end":null,"periods":[{"period_end":"2026-08-28","dps":8974.0,"from":"배당락일 기준","rcept_no":null},{"period_end":"2026-05-28","dps":114.0,"from":"배당락일 기준","rcept_no":null},{"period_end":"2025-11-27","dps":94.0,"from":"배당락일 기준","rcept_no":null},{"period_end":"2025-08-28","dps":72.0,"from":"배당락일 기준","rcept_no":null},{"period_end":"2025-05-29","dps":94.0,"from":"배당락일 기준","rcept_no":null},{"period_end":"2025-02-27","dps":94.0,"from":"배당락일 기준","rcept_no":null},{"period_end":"2024-11-28","dps":95.0,"from":"배당락일 기준","rcept_no":null}]},
{"id":"357120","name":"코람코라이프인프라리츠","corp_code":null,"dps_annual":327.0,"dps_basis":"최근 1년 배당 2건 합계(2025-11-27 164원, 2026-08-28 163원). 리츠정보시스템 기준 연 2회 결산과 건수가 일치","period_months":6,"latest_period_end":null,"periods":[{"period_end":"2026-08-28","dps":163.0,"from":"배당락일 기준","rcept_no":null},{"period_end":"2025-11-27","dps":164.0,"from":"배당락일 기준","rcept_no":null},{"period_end":"2025-05-29","dps":163.0,"from":"배당락일 기준","rcept_no":null},{"period_end":"2024-11-28","dps":249.0,"from":"배당락일 기준","rcept_no":null}]},
{"id":"451800","name":"한화리츠","corp_code":null,"dps_annual":null,"dps_basis":"최근 1년 배당 1건(2026-04-29 135원)이 리츠정보시스템 기준 결산 횟수(2)와 맞지 않아 합계를 내지 않음","period_months":6,"latest_period_end":null,"periods":[{"period_end":"2026-04-29","dps":135.0,"from":"배당락일 기준","rcept_no":null},{"period_end":"2025-10-30","dps":135.0,"from":"배당락일 기준","rcept_no":null},{"period_end":"2025-04-29","dps":135.0,"from":"배당락일 기준","rcept_no":null}]},
{"id":"WELL","name":"Welltower","corp_code":null,"dps_annual":4249.12,"dps_annual_local":3.18,"currency":"USD","dps_basis":"최근 1년 배당 4건 합계 3.18달러 × 환율 1,336.20원","period_months":null,"latest_period_end":null,"periods":[{"period_end":"2026-11-10","dps":0.85,"from":"배당락일 기준(달러)","rcept_no":null},{"period_end":"2026-08-12","dps":0.85,"from":"배당락일 기준(달러)","rcept_no":null},{"period_end":"2026-05-13","dps":0.74,"from":"배당락일 기준(달러)","rcept_no":null},{"period_end":"2026-02-25","dps":0.74,"from":"배당락일 기준(달러)","rcept_no":null}]},
{"id":"PLD","name":"Prologis","corp_code":null,"dps_annual":5638.76,"dps_annual_local":4.22,"currency":"USD","dps_basis":"최근 1년 배당 4건 합계 4.22달러 × 환율 1,336.20원","period_months":null,"latest_period_end":null,"periods":[{"period_end":"2026-09-16","dps":1.07,"from":"배당락일 기준(달러)","rcept_no":null},{"period_end":"2026-06-16","dps":1.07,"from":"배당락일 기준(달러)","rcept_no":null},{"period_end":"2026-03-17","dps":1.07,"from":"배당락일 기준(달러)","rcept_no":null},{"period_end":"2025-12-16","dps":1.01,"from":"배당락일 기준(달러)","rcept_no":null}]},
{"id":"EQIX","name":"Equinix","corp_code":null,"dps_annual":26951.15,"dps_annual_local":20.17,"currency":"USD","dps_basis":"최근 1년 배당 4건 합계 20.17달러 × 환율 1,336.20원","period_months":null,"latest_period_end":null,"periods":[{"period_end":"2026-08-19","dps":5.16,"from":"배당락일 기준(달러)","rcept_no":null},{"period_end":"2026-05-20","dps":5.16,"from":"배당락일 기준(달러)","rcept_no":null},{"period_end":"2026-02-25","dps":5.16,"from":"배당락일 기준(달러)","rcept_no":null},{"period_end":"2025-11-19","dps":4.69,"from":"배당락일 기준(달러)","rcept_no":null}]},
{"id":"AMT","name":"American Tower","corp_code":null,"dps_annual":9446.93,"dps_annual_local":7.07,"currency":"USD","dps_basis":"최근 1년 배당 4건 합계 7.07달러 × 환율 1,336.20원","period_months":null,"latest_period_end":null,"periods":[{"period_end":"2026-09-30","dps":1.79,"from":"배당락일 기준(달러)","rcept_no":null},{"period_end":"2026-06-12","dps":1.79,"from":"배당락일 기준(달러)","rcept_no":null},{"period_end":"2026-04-14","dps":1.79,"from":"배당락일 기준(달러)","rcept_no":null},{"period_end":"2025-12-29","dps":1.7,"from":"배당락일 기준(달러)","rcept_no":null}]},
{"id":"SPG","name":"Simon Property Group","corp_code":null,"dps_annual":11892.18,"dps_annual_local":8.9,"currency":"USD","dps_basis":"최근 1년 배당 4건 합계 8.9달러 × 환율 1,336.20원","period_months":null,"latest_period_end":null,"periods":[{"period_end":"2026-09-09","dps":2.25,"from":"배당락일 기준(달러)","rcept_no":null},{"period_end":"2026-06-09","dps":2.25,"from":"배당락일 기준(달러)","rcept_no":null},{"period_end":"2026-03-10","dps":2.2,"from":"배당락일 기준(달러)","rcept_no":null},{"period_end":"2025-12-10","dps":2.2,"from":"배당락일 기준(달러)","rcept_no":null}]},
{"id":"DLR","name":"Digital Realty","corp_code":null,"dps_annual":6520.66,"dps_annual_local":4.88,"currency":"USD","dps_basis":"최근 1년 배당 4건 합계 4.88달러 × 환율 1,336.20원","period_months":null,"latest_period_end":null,"periods":[{"period_end":"2026-09-15","dps":1.22,"from":"배당락일 기준(달러)","rcept_no":null},{"period_end":"2026-06-15","dps":1.22,"from":"배당락일 기준(달러)","rcept_no":null},{"period_end":"2026-03-13","dps":1.22,"from":"배당락일 기준(달러)","rcept_no":null},{"period_end":"2025-12-15","dps":1.22,"from":"배당락일 기준(달러)","rcept_no":null}]},
{"id":"PSA","name":"Public Storage","corp_code":null,"dps_annual":16034.4,"dps_annual_local":12.0,"currency":"USD","dps_basis":"최근 1년 배당 4건 합계 12.0달러 × 환율 1,336.20원","period_months":null,"latest_period_end":null,"periods":[{"period_end":"2026-09-15","dps":3.0,"from":"배당락일 기준(달러)","rcept_no":null},{"period_end":"2026-06-15","dps":3.0,"from":"배당락일 기준(달러)","rcept_no":null},{"period_end":"2026-03-16","dps":3.0,"from":"배당락일 기준(달러)","rcept_no":null},{"period_end":"2025-12-15","dps":3.0,"from":"배당락일 기준(달러)","rcept_no":null}]},
{"id":"O","name":"Realty Income","corp_code":null,"dps_annual":4342.65,"dps_annual_local":3.25,"currency":"USD","dps_basis":"최근 1년 배당 12건 합계 3.25달러 × 환율 1,336.20원","period_months":null,"latest_period_end":null,"periods":[{"period_end":"2026-10-30","dps":0.272,"from":"배당락일 기준(달러)","rcept_no":null},{"period_end":"2026-09-30","dps":0.272,"from":"배당락일 기준(달러)","rcept_no":null},{"period_end":"2026-08-31","dps":0.271,"from":"배당락일 기준(달러)","rcept_no":null},{"period_end":"2026-07-31","dps":0.271,"from":"배당락일 기준(달러)","rcept_no":null},{"period_end":"2026-06-30","dps":0.271,"from":"배당락일 기준(달러)","rcept_no":null},{"period_end":"2026-05-29","dps":0.271,"from":"배당락일 기준(달러)","rcept_no":null},{"period_end":"2026-04-30","dps":0.271,"from":"배당락일 기준(달러)","rcept_no":null},{"period_end":"2026-03-31","dps":0.271,"from":"배당락일 기준(달러)","rcept_no":null},{"period_end":"2026-02-27","dps":0.27,"from":"배당락일 기준(달러)","rcept_no":null},{"period_end":"2026-01-30","dps":0.27,"from":"배당락일 기준(달러)","rcept_no":null},{"period_end":"2025-12-31","dps":0.27,"from":"배당락일 기준(달러)","rcept_no":null},{"period_end":"2025-11-28","dps":0.27,"from":"배당락일 기준(달러)","rcept_no":null}]},
{"id":"VMRK","name":"Vivmark Residential","corp_code":null,"dps_annual":3744.03,"dps_annual_local":2.802,"currency":"USD","dps_basis":"최근 1년 배당 4건 합계 2.802달러 × 환율 1,336.20원","period_months":null,"latest_period_end":null,"periods":[{"period_end":"2026-10-05","dps":0.703,"from":"배당락일 기준(달러)","rcept_no":null},{"period_end":"2026-06-29","dps":0.703,"from":"배당락일 기준(달러)","rcept_no":null},{"period_end":"2026-03-30","dps":0.703,"from":"배당락일 기준(달러)","rcept_no":null},{"period_end":"2026-01-02","dps":0.693,"from":"배당락일 기준(달러)","rcept_no":null}]},
{"id":"VTR","name":"Ventas","corp_code":null,"dps_annual":2725.85,"dps_annual_local":2.04,"currency":"USD","dps_basis":"최근 1년 배당 4건 합계 2.04달러 × 환율 1,336.20원","period_months":null,"latest_period_end":null,"periods":[{"period_end":"2026-09-30","dps":0.52,"from":"배당락일 기준(달러)","rcept_no":null},{"period_end":"2026-06-30","dps":0.52,"from":"배당락일 기준(달러)","rcept_no":null},{"period_end":"2026-03-31","dps":0.52,"from":"배당락일 기준(달러)","rcept_no":null},{"period_end":"2025-12-31","dps":0.48,"from":"배당락일 기준(달러)","rcept_no":null}]}
]}
<<<END FILE>>>

<<<FILE: data/history.json>>>
{"as_of": "2026-11-13", "source": "야후 파이낸스 (비공식 · 거래소 시세 지연 제공)", "items": [
{"id":"365550","currency":"KRW","points":[["2025-11-13",4395],["2025-11-18",4440],["2025-11-21",4415],["2025-11-26",4470],["2025-12-01",4375],["2025-12-04",4435],["2025-12-09",4325],["2025-12-12",4315],["2025-12-17",4225],["2025-12-22",4130],["2025-12-26",4210],["2026-01-02",4305],["2026-01-07",4430],["2026-01-12",4375],["2026-01-15",4395],["2026-01-20",4425],["2026-01-23",4385],["2026-01-28",4390],["2026-02-02",4370],["2026-02-05",4390],["2026-02-10",4370],["2026-02-13",4445],["2026-02-23",4460],["2026-02-26",4420],["2026-03-04",4105],["2026-03-09",4170],["2026-03-12",4280],["2026-03-17",4310],["2026-03-20",4195],["2026-03-25",4270],["2026-03-30",4355],["2026-04-02",4500],["2026-04-07",4480],["2026-04-10",4650],["2026-04-15",4465],["2026-04-20",4510],["2026-04-23",4615],["2026-04-28",4580],["2026-05-04",4385],["2026-05-08",4420],["2026-05-13",4200],["2026-05-18",4130],["2026-05-21",4125],["2026-05-27",4130],["2026-06-01",3910],["2026-06-05",3575],["2026-06-10",3475],["2026-06-15",3755],["2026-06-18",3980],["2026-06-23",3445],["2026-06-26",3430],["2026-07-01",3405],["2026-07-06",3325],["2026-07-09",3190],["2026-07-14",3155],["2026-07-20",3275],["2026-07-23",3185],["2026-07-28",3335],["2026-07-31",3290],["2026-08-05",3210],["2026-08-10",3290],["2026-08-13",3145],["2026-08-19",3085],["2026-08-24",3015],["2026-08-27",3055],["2026-09-01",3190],["2026-09-04",3085],["2026-09-09",3145],["2026-09-14",3195],["2026-09-17",3095],["2026-09-22",3165],["2026-09-29",3125],["2026-10-02",3100],["2026-10-08",3095],["2026-10-14",3115],["2026-10-19",3105],["2026-10-22",3060],["2026-10-27",3025],["2026-10-30",2990],["2026-11-04",2885],["2026-11-09",2825],["2026-11-12",2685],["2026-11-13",2745]]},
{"id":"432320","currency":"KRW","points":[["2025-11-13",3900],["2025-11-18",3795],["2025-11-21",3620],["2025-11-26",3670],["2025-12-01",3630],["2025-12-04",3675],["2025-12-09",3710],["2025-12-12",3600],["2025-12-17",3290],["2025-12-22",3245],["2025-12-26",3260],["2026-01-02",3390],["2026-01-07",3495],["2026-01-12",3540],["2026-01-15",3610],["2026-01-20",3490],["2026-01-23",3580],["2026-01-28",3570],["2026-02-02",3405],["2026-02-05",3475],["2026-02-10",3560],["2026-02-13",3335],["2026-02-23",3040],["2026-02-26",3375],["2026-03-04",3105],["2026-03-09",2850],["2026-03-12",2680],["2026-03-17",2620],["2026-03-20",2645],["2026-03-25",2455],["2026-03-30",2240],["2026-04-02",2220],["2026-04-07",2240],["2026-04-10",2285],["2026-04-15",2195],["2026-04-20",2270],["2026-04-23",2260],["2026-04-28",2205],["2026-05-04",2020],["2026-05-08",1905],["2026-05-13",1574],["2026-05-18",1589],["2026-05-21",1557],["2026-05-27",1555],["2026-06-01",1400],["2026-06-05",1473],["2026-06-10",1516],["2026-06-15",1413],["2026-06-18",1340],["2026-06-23",1298],["2026-06-26",1267],["2026-07-01",1333],["2026-07-06",1405],["2026-07-09",1393],["2026-07-14",1416],["2026-07-20",1496],["2026-07-23",1521],["2026-07-28",1432],["2026-07-31",1331],["2026-08-05",1367],["2026-08-10",1405],["2026-08-13",1450],["2026-08-19",1411],["2026-08-24",1429],["2026-08-27",1410],["2026-09-01",1449],["2026-09-04",1483],["2026-09-09",1569],["2026-09-14",1602],["2026-09-17",1701],["2026-09-22",1633],["2026-09-29",1645],["2026-10-02",1644],["2026-10-08",1625],["2026-10-14",1540],["2026-10-19",1544],["2026-10-22",1501],["2026-10-27",1450],["2026-10-30",1436],["2026-11-04",1424],["2026-11-09",1331],["2026-11-12",1294],["2026-11-13",1290]]},
{"id":"400760","currency":"KRW","points":[["2025-11-13",3455],["2025-11-18",3445],["2025-11-21",3490],["2025-11-26",3495],["2025-12-01",3545],["2025-12-04",3600],["2025-12-09",3565],["2025-12-12",3565],["2025-12-17",3515],["2025-12-22",3510],["2025-12-26",3490],["2026-01-02",3375],["2026-01-07",3390],["2026-01-12",3325],["2026-01-15",3370],["2026-01-20",3415],["2026-01-23",3370],["2026-01-28",3340],["2026-02-02",3280],["2026-02-05",3315],["2026-02-10",3330],["2026-02-13",3315],["2026-02-23",3230],["2026-02-26",3180],["2026-03-04",3060],["2026-03-09",3105],["2026-03-12",3210],["2026-03-17",3280],["2026-03-20",3280],["2026-03-25",3240],["2026-03-30",3200],["2026-04-02",3235],["2026-04-07",3300],["2026-04-10",3365],["2026-04-15",3350],["2026-04-20",3420],["2026-04-23",3470],["2026-04-28",3500],["2026-05-04",3270],["2026-05-08",3170],["2026-05-13",3030],["2026-05-18",3105],["2026-05-21",3015],["2026-05-27",3040],["2026-06-01",2940],["2026-06-05",2945],["2026-06-10",3015],["2026-06-15",3050],["2026-06-18",3080],["2026-06-23",3040],["2026-06-26",3010],["2026-07-01",2935],["2026-07-06",2945],["2026-07-09",2935],["2026-07-14",2960],["2026-07-20",2975],["2026-07-23",3005],["2026-07-28",3010],["2026-07-31",2965],["2026-08-05",2950],["2026-08-10",2975],["2026-08-13",2925],["2026-08-19",2860],["2026-08-24",2860],["2026-08-27",2895],["2026-09-01",2870],["2026-09-04",2795],["2026-09-09",2815],["2026-09-14",2820],["2026-09-17",2850],["2026-09-22",2795],["2026-09-29",2800],["2026-10-02",2815],["2026-10-08",2805],["2026-10-14",2725],["2026-10-19",2695],["2026-10-22",2645],["2026-10-27",2560],["2026-10-30",2465],["2026-11-04",2270],["2026-11-09",2265],["2026-11-12",2275],["2026-11-13",2295]]},
{"id":"338100","currency":"KRW","points":[["2025-11-13",4900],["2025-11-18",4795],["2025-11-21",4885],["2025-11-26",4860],["2025-12-01",4505],["2025-12-04",4510],["2025-12-09",4470],["2025-12-12",4510],["2025-12-17",4445],["2025-12-22",4470],["2025-12-26",4445],["2026-01-02",4470],["2026-01-07",4450],["2026-01-12",4390],["2026-01-15",4365],["2026-01-20",4385],["2026-01-23",4375],["2026-01-28",4420],["2026-02-02",4365],["2026-02-05",4430],["2026-02-10",4450],["2026-02-13",4565],["2026-02-23",4555],["2026-02-26",4645],["2026-03-04",4570],["2026-03-09",4580],["2026-03-12",4670],["2026-03-17",4655],["2026-03-20",4630],["2026-03-25",4630],["2026-03-30",4555],["2026-04-02",4610],["2026-04-07",4730],["2026-04-10",4765],["2026-04-15",4750],["2026-04-20",4835],["2026-04-23",4840],["2026-04-28",4865],["2026-05-04",4675],["2026-05-08",4660],["2026-05-13",4520],["2026-05-18",4515],["2026-05-21",4475],["2026-05-27",4525],["2026-06-01",3665],["2026-06-05",3630],["2026-06-10",3600],["2026-06-15",3685],["2026-06-18",3835],["2026-06-23",3635],["2026-06-26",3555],["2026-07-01",3835],["2026-07-06",3890],["2026-07-09",3815],["2026-07-14",3765],["2026-07-20",3800],["2026-07-23",3815],["2026-07-28",3795],["2026-07-31",3805],["2026-08-05",3740],["2026-08-10",3830],["2026-08-13",3780],["2026-08-19",3750],["2026-08-24",3695],["2026-08-27",3785],["2026-09-01",3865],["2026-09-04",3850],["2026-09-09",3810],["2026-09-14",3830],["2026-09-17",3800],["2026-09-22",3775],["2026-09-29",3795],["2026-10-02",3870],["2026-10-08",3745],["2026-10-14",3750],["2026-10-19",3720],["2026-10-22",3675],["2026-10-27",3710],["2026-10-30",3695],["2026-11-04",3660],["2026-11-09",3580],["2026-11-12",3605],["2026-11-13",3615]]},
{"id":"395400","currency":"KRW","points":[["2025-11-13",5320],["2025-11-18",5240],["2025-11-21",5280],["2025-11-26",5280],["2025-12-01",5270],["2025-12-04",5530],["2025-12-09",5660],["2025-12-12",5680],["2025-12-17",5870],["2025-12-22",5620],["2025-12-26",5760],["2026-01-02",5890],["2026-01-07",5900],["2026-01-12",5700],["2026-01-15",5540],["2026-01-20",5690],["2026-01-23",5530],["2026-01-28",5560],["2026-02-02",5540],["2026-02-05",5600],["2026-02-10",5480],["2026-02-13",5610],["2026-02-23",5630],["2026-02-26",5610],["2026-03-04",5440],["2026-03-09",5690],["2026-03-12",5900],["2026-03-17",6110],["2026-03-20",6310],["2026-03-25",6540],["2026-03-30",6280],["2026-04-02",6400],["2026-04-07",6350],["2026-04-10",6450],["2026-04-15",6560],["2026-04-20",6700],["2026-04-23",6810],["2026-04-28",6990],["2026-05-04",6490],["2026-05-08",6370],["2026-05-13",5830],["2026-05-18",5640],["2026-05-21",5390],["2026-05-27",5780],["2026-06-01",5140],["2026-06-05",4995],["2026-06-10",5340],["2026-06-15",5840],["2026-06-18",5980],["2026-06-23",5630],["2026-06-26",5680],["2026-07-01",5560],["2026-07-06",5890],["2026-07-09",5770],["2026-07-14",5610],["2026-07-20",5710],["2026-07-23",5540],["2026-07-28",5600],["2026-07-31",5480],["2026-08-05",5570],["2026-08-10",5630],["2026-08-13",5720],["2026-08-19",5680],["2026-08-24",5680],["2026-08-27",5510],["2026-09-01",5390],["2026-09-04",5380],["2026-09-09",5230],["2026-09-14",5300],["2026-09-17",5180],["2026-09-22",5380],["2026-09-29",5230],["2026-10-02",5330],["2026-10-08",5290],["2026-10-14",5260],["2026-10-19",5310],["2026-10-22",5270],["2026-10-27",5330],["2026-10-30",5250],["2026-11-04",4950],["2026-11-09",4650],["2026-11-12",4615],["2026-11-13",4780]]},
{"id":"0030R0","currency":"KRW","points":[["2025-11-13",4505],["2025-11-18",4450],["2025-11-21",4500],["2025-11-26",4530],["2025-12-01",4640],["2025-12-04",4725],["2025-12-09",4670],["2025-12-12",4580],["2025-12-17",4490],["2025-12-22",4475],["2025-12-26",4470],["2026-01-02",4520],["2026-01-07",4560],["2026-01-12",4505],["2026-01-15",4530],["2026-01-20",4510],["2026-01-23",4500],["2026-01-28",4495],["2026-02-02",4505],["2026-02-05",4530],["2026-02-10",4545],["2026-02-13",4540],["2026-02-23",4535],["2026-02-26",4545],["2026-03-04",4320],["2026-03-09",4355],["2026-03-12",4400],["2026-03-17",4355],["2026-03-20",4330],["2026-03-25",4285],["2026-03-30",4290],["2026-04-02",4335],["2026-04-07",4345],["2026-04-10",4325],["2026-04-15",4450],["2026-04-20",4390],["2026-04-23",4415],["2026-04-28",4420],["2026-05-04",4340],["2026-05-08",4295],["2026-05-13",4285],["2026-05-18",4195],["2026-05-21",4200],["2026-05-27",4240],["2026-06-01",4100],["2026-06-05",4210],["2026-06-10",4050],["2026-06-15",3890],["2026-06-18",3935],["2026-06-23",3775],["2026-06-26",3795],["2026-07-01",3930],["2026-07-06",4040],["2026-07-09",3850],["2026-07-14",3810],["2026-07-20",3700],["2026-07-23",3780],["2026-07-28",3650],["2026-07-31",3620],["2026-08-05",3815],["2026-08-10",3960],["2026-08-13",3940],["2026-08-19",3850],["2026-08-24",3825],["2026-08-27",3925],["2026-09-01",4000],["2026-09-04",3920],["2026-09-09",3900],["2026-09-14",3830],["2026-09-17",3700],["2026-09-22",3710],["2026-09-29",3745],["2026-10-02",3920],["2026-10-08",3965],["2026-10-14",4000],["2026-10-19",3945],["2026-10-22",3900],["2026-10-27",3655],["2026-10-30",3560],["2026-11-04",3565],["2026-11-09",3495],["2026-11-12",3495],["2026-11-13",3520]]},
{"id":"377190","currency":"KRW","points":[["2025-11-13",3430],["2025-11-18",3440],["2025-11-21",3455],["2025-11-26",3515],["2025-12-01",3590],["2025-12-04",3700],["2025-12-09",3670],["2025-12-12",3580],["2025-12-17",3435],["2025-12-22",3395],["2025-12-26",3360],["2026-01-02",3400],["2026-01-07",3450],["2026-01-12",3450],["2026-01-15",3475],["2026-01-20",3430],["2026-01-23",3410],["2026-01-28",3425],["2026-02-02",3280],["2026-02-05",3295],["2026-02-10",3330],["2026-02-13",3300],["2026-02-23",3245],["2026-02-26",3200],["2026-03-04",2935],["2026-03-09",2950],["2026-03-12",3095],["2026-03-17",3140],["2026-03-20",3095],["2026-03-25",3090],["2026-03-30",2985],["2026-04-02",3040],["2026-04-07",3010],["2026-04-10",3100],["2026-04-15",3165],["2026-04-20",3195],["2026-04-23",3280],["2026-04-28",3405],["2026-05-04",3085],["2026-05-08",3030],["2026-05-13",2715],["2026-05-18",2670],["2026-05-21",2595],["2026-05-27",2640],["2026-06-01",2290],["2026-06-05",2350],["2026-06-10",2405],["2026-06-15",2045],["2026-06-18",2025],["2026-06-23",2020],["2026-06-26",1977],["2026-07-01",2035],["2026-07-06",1980],["2026-07-09",1966],["2026-07-14",1964],["2026-07-20",2030],["2026-07-23",2010],["2026-07-28",2020],["2026-07-31",1977],["2026-08-05",2065],["2026-08-10",2225],["2026-08-13",2160],["2026-08-19",2140],["2026-08-24",2155],["2026-08-27",2155],["2026-09-01",2220],["2026-09-04",2195],["2026-09-09",2195],["2026-09-14",2215],["2026-09-17",2275],["2026-09-22",2235],["2026-09-29",2015],["2026-10-02",1995],["2026-10-08",1983],["2026-10-14",1907],["2026-10-19",1930],["2026-10-22",1914],["2026-10-27",1854],["2026-10-30",1850],["2026-11-04",1798],["2026-11-09",1798],["2026-11-12",1758],["2026-11-13",1758]]},
{"id":"330590","currency":"KRW","points":[["2025-11-13",3885],["2025-11-18",3945],["2025-11-21",3970],["2025-11-26",4035],["2025-12-01",4050],["2025-12-04",4110],["2025-12-09",4115],["2025-12-12",4070],["2025-12-17",3935],["2025-12-22",3935],["2025-12-26",3985],["2026-01-02",4000],["2026-01-07",4040],["2026-01-12",4010],["2026-01-15",4150],["2026-01-20",4310],["2026-01-23",4295],["2026-01-28",4375],["2026-02-02",4275],["2026-02-05",4440],["2026-02-10",4500],["2026-02-13",4575],["2026-02-23",4660],["2026-02-26",4775],["2026-03-04",4320],["2026-03-09",4445],["2026-03-12",4685],["2026-03-17",4690],["2026-03-20",4850],["2026-03-25",4635],["2026-03-30",4695],["2026-04-02",4640],["2026-04-07",4690],["2026-04-10",4770],["2026-04-15",4845],["2026-04-20",4800],["2026-04-23",4805],["2026-04-28",4750],["2026-05-04",4270],["2026-05-08",4210],["2026-05-13",3880],["2026-05-18",3905],["2026-05-21",3780],["2026-05-27",3915],["2026-06-01",3580],["2026-06-05",3455],["2026-06-10",3605],["2026-06-15",3775],["2026-06-18",3945],["2026-06-23",3520],["2026-06-26",3530],["2026-07-01",3600],["2026-07-06",3600],["2026-07-09",3450],["2026-07-14",3450],["2026-07-20",3485],["2026-07-23",3560],["2026-07-28",3645],["2026-07-31",3615],["2026-08-05",3620],["2026-08-10",3800],["2026-08-13",3870],["2026-08-19",3880],["2026-08-24",3930],["2026-08-27",3915],["2026-09-01",3850],["2026-09-04",3925],["2026-09-09",3890],["2026-09-14",3980],["2026-09-17",3985],["2026-09-22",4060],["2026-09-29",4155],["2026-10-02",4065],["2026-10-08",4155],["2026-10-14",4175],["2026-10-19",4195],["2026-10-22",4185],["2026-10-27",4200],["2026-10-30",4145],["2026-11-04",3945],["2026-11-09",3630],["2026-11-12",3535],["2026-11-13",3645]]},
{"id":"357430","currency":"KRW","points":[["2025-11-13",1570],["2025-11-18",1556],["2025-11-21",1563],["2025-11-26",1575],["2025-12-01",1573],["2025-12-04",1582],["2025-12-09",1593],["2025-12-12",1613],["2025-12-17",1611],["2025-12-22",1638],["2025-12-26",1643],["2026-01-02",1659],["2026-01-07",1655],["2026-01-12",1649],["2026-01-15",1640],["2026-01-20",1626],["2026-01-23",1624],["2026-01-28",1580],["2026-02-02",1575],["2026-02-05",1571],["2026-02-10",1581],["2026-02-13",1604],["2026-02-23",1592],["2026-02-26",1548],["2026-03-04",1474],["2026-03-09",1460],["2026-03-12",1466],["2026-03-17",1488],["2026-03-20",1485],["2026-03-25",1485],["2026-03-30",1442],["2026-04-02",1420],["2026-04-07",1421],["2026-04-10",1427],["2026-04-15",1439],["2026-04-20",1405],["2026-04-23",1428],["2026-04-28",1371],["2026-05-04",1225],["2026-05-08",1120],["2026-05-13",1082],["2026-05-18",895],["2026-05-21",856],["2026-05-27",840],["2026-06-01",762],["2026-06-05",708],["2026-06-10",698],["2026-06-15",667],["2026-06-18",650],["2026-06-23",581],["2026-06-26",509],["2026-07-01",544],["2026-07-06",536],["2026-07-09",595],["2026-07-14",616],["2026-07-20",609],["2026-07-23",626],["2026-07-28",717],["2026-07-31",677],["2026-08-05",895],["2026-08-10",874],["2026-08-13",875],["2026-08-19",870],["2026-08-24",875],["2026-08-27",888],["2026-09-01",930],["2026-09-04",970],["2026-09-09",984],["2026-09-14",940],["2026-09-17",924],["2026-09-22",891],["2026-09-29",861],["2026-10-02",794],["2026-10-08",779],["2026-10-14",770],["2026-10-19",735],["2026-10-22",725],["2026-10-27",734],["2026-10-30",737],["2026-11-04",721],["2026-11-09",687],["2026-11-12",612],["2026-11-13",601]]},
{"id":"396690","currency":"KRW","points":[["2025-11-13",2645],["2025-11-18",2615],["2025-11-21",2630],["2025-11-26",2645],["2025-12-01",2660],["2025-12-04",2680],["2025-12-09",2685],["2025-12-12",2680],["2025-12-17",2630],["2025-12-22",2575],["2025-12-26",2565],["2026-01-02",2625],["2026-01-07",2620],["2026-01-12",2600],["2026-01-15",2605],["2026-01-20",2615],["2026-01-23",2640],["2026-01-28",2575],["2026-02-02",2540],["2026-02-05",2585],["2026-02-10",2585],["2026-02-13",2590],["2026-02-23",2615],["2026-02-26",2550],["2026-03-04",2450],["2026-03-09",2450],["2026-03-12",2510],["2026-03-17",2500],["2026-03-20",2510],["2026-03-25",2485],["2026-03-30",2375],["2026-04-02",2280],["2026-04-07",2310],["2026-04-10",2365],["2026-04-15",2325],["2026-04-20",2295],["2026-04-23",2330],["2026-04-28",2290],["2026-05-04",2035],["2026-05-08",1995],["2026-05-13",1762],["2026-05-18",1660],["2026-05-21",1509],["2026-05-27",1435],["2026-06-01",1350],["2026-06-05",1476],["2026-06-10",1453],["2026-06-15",1481],["2026-06-18",1520],["2026-06-23",1480],["2026-06-26",1420],["2026-07-01",1539],["2026-07-06",1556],["2026-07-09",1580],["2026-07-14",1606],["2026-07-20",1663],["2026-07-23",1690],["2026-07-28",1637],["2026-07-31",1614],["2026-08-05",1634],["2026-08-10",1645],["2026-08-13",1589],["2026-08-19",1570],["2026-08-24",1563],["2026-08-27",1498],["2026-09-01",1522],["2026-09-04",1550],["2026-09-09",1440],["2026-09-14",1428],["2026-09-17",1412],["2026-09-22",1425],["2026-09-29",1347],["2026-10-02",1355],["2026-10-08",1337],["2026-10-14",1302],["2026-10-19",1319],["2026-10-22",1240],["2026-10-27",833],["2026-10-30",710],["2026-11-04",787],["2026-11-09",747],["2026-11-12",775],["2026-11-13",765]]},
{"id":"357250","currency":"KRW","points":[["2025-11-13",2745],["2025-11-18",2725],["2025-11-21",2760],["2025-11-26",2775],["2025-12-01",2665],["2025-12-04",2665],["2025-12-09",2685],["2025-12-12",2685],["2025-12-17",2630],["2025-12-22",2615],["2025-12-26",2620],["2026-01-02",2630],["2026-01-07",2620],["2026-01-12",2600],["2026-01-15",2600],["2026-01-20",2600],["2026-01-23",2595],["2026-01-28",2540],["2026-02-02",2500],["2026-02-05",2535],["2026-02-10",2530],["2026-02-13",2535],["2026-02-23",2545],["2026-02-26",2515],["2026-03-04",2415],["2026-03-09",2425],["2026-03-12",2410],["2026-03-17",2435],["2026-03-20",2425],["2026-03-25",2410],["2026-03-30",2385],["2026-04-02",2370],["2026-04-07",2380],["2026-04-10",2425],["2026-04-15",2450],["2026-04-20",2455],["2026-04-23",2475],["2026-04-28",2455],["2026-05-04",2290],["2026-05-08",2285],["2026-05-13",2140],["2026-05-18",2140],["2026-05-21",2065],["2026-05-27",2150],["2026-06-01",1858],["2026-06-05",1877],["2026-06-10",1840],["2026-06-15",1840],["2026-06-18",1820],["2026-06-23",1793],["2026-06-26",1784],["2026-07-01",1827],["2026-07-06",1900],["2026-07-09",1892],["2026-07-14",1820],["2026-07-20",1857],["2026-07-23",1880],["2026-07-28",1813],["2026-07-31",1787],["2026-08-05",1817],["2026-08-10",1860],["2026-08-13",1890],["2026-08-19",1895],["2026-08-24",1899],["2026-08-27",1888],["2026-09-01",1900],["2026-09-04",1910],["2026-09-09",1891],["2026-09-14",1843],["2026-09-17",1816],["2026-09-22",1839],["2026-09-29",1849],["2026-10-02",1852],["2026-10-08",1825],["2026-10-14",1809],["2026-10-19",1789],["2026-10-22",1756],["2026-10-27",1679],["2026-10-30",1538],["2026-11-04",1516],["2026-11-09",1540],["2026-11-12",1554],["2026-11-13",1555]]},
{"id":"448730","currency":"KRW","points":[["2025-11-13",4555],["2025-11-18",4555],["2025-11-21",4575],["2025-11-26",4640],["2025-12-01",4620],["2025-12-04",4685],["2025-12-09",4710],["2025-12-12",4595],["2025-12-17",4555],["2025-12-22",4680],["2025-12-26",4710],["2026-01-02",4735],["2026-01-07",4800],["2026-01-12",4845],["2026-01-15",4815],["2026-01-20",4855],["2026-01-23",4865],["2026-01-28",4975],["2026-02-02",4880],["2026-02-05",4980],["2026-02-10",5100],["2026-02-13",5140],["2026-02-23",5290],["2026-02-26",5460],["2026-03-04",4855],["2026-03-09",5190],["2026-03-12",5360],["2026-03-17",5450],["2026-03-20",5400],["2026-03-25",5450],["2026-03-30",5510],["2026-04-02",5320],["2026-04-07",5570],["2026-04-10",5950],["2026-04-15",6110],["2026-04-20",6800],["2026-04-23",7350],["2026-04-28",6670],["2026-05-04",5770],["2026-05-08",5930],["2026-05-13",5370],["2026-05-18",5320],["2026-05-21",5030],["2026-05-27",5590],["2026-06-01",5160],["2026-06-05",4960],["2026-06-10",4895],["2026-06-15",5380],["2026-06-18",5570],["2026-06-23",5180],["2026-06-26",5440],["2026-07-01",5600],["2026-07-06",5620],["2026-07-09",5310],["2026-07-14",5350],["2026-07-20",5410],["2026-07-23",5600],["2026-07-28",5550],["2026-07-31",5390],["2026-08-05",5530],["2026-08-10",5530],["2026-08-13",5400],["2026-08-19",5390],["2026-08-24",5380],["2026-08-27",5490],["2026-09-01",5530],["2026-09-04",5240],["2026-09-09",5220],["2026-09-14",5330],["2026-09-17",5360],["2026-09-22",4795],["2026-09-29",4990],["2026-10-02",5030],["2026-10-08",5130],["2026-10-14",5190],["2026-10-19",5190],["2026-10-22",5200],["2026-10-27",5180],["2026-10-30",4870],["2026-11-04",4770],["2026-11-09",4435],["2026-11-12",4495],["2026-11-13",4490]]},
{"id":"481850","currency":"KRW","points":[["2025-11-13",1387],["2025-11-18",1366],["2025-11-21",1307],["2025-11-26",1294],["2025-12-01",1302],["2025-12-04",1299],["2025-12-09",1321],["2025-12-12",1308],["2025-12-17",1290],["2025-12-22",1294],["2025-12-26",1289],["2026-01-02",1298],["2026-01-07",1302],["2026-01-12",1290],["2026-01-15",1284],["2026-01-20",1292],["2026-01-23",1288],["2026-01-28",1280],["2026-02-02",1265],["2026-02-05",1276],["2026-02-10",1278],["2026-02-13",1316],["2026-02-23",1310],["2026-02-26",1204],["2026-03-04",1116],["2026-03-09",1105],["2026-03-12",1117],["2026-03-17",1139],["2026-03-20",1104],["2026-03-25",1087],["2026-03-30",1091],["2026-04-02",1094],["2026-04-07",1103],["2026-04-10",1116],["2026-04-15",1138],["2026-04-20",1145],["2026-04-23",1170],["2026-04-28",1188],["2026-05-04",1124],["2026-05-08",1098],["2026-05-13",996],["2026-05-18",959],["2026-05-21",995],["2026-05-27",960],["2026-06-01",923],["2026-06-05",916],["2026-06-10",871],["2026-06-15",895],["2026-06-18",895],["2026-06-23",863],["2026-06-26",878],["2026-07-01",913],["2026-07-06",944],["2026-07-09",1004],["2026-07-14",977],["2026-07-20",987],["2026-07-23",1010],["2026-07-28",981],["2026-07-31",975],["2026-08-05",992],["2026-08-10",1000],["2026-08-13",1005],["2026-08-19",999],["2026-08-24",993],["2026-08-27",999],["2026-09-01",985],["2026-09-04",980],["2026-09-09",985],["2026-09-14",980],["2026-09-17",978],["2026-09-22",980],["2026-09-29",975],["2026-10-02",977],["2026-10-08",976],["2026-10-14",919],["2026-10-19",859],["2026-10-22",827],["2026-10-27",805],["2026-10-30",810],["2026-11-04",809],["2026-11-09",805],["2026-11-12",802],["2026-11-13",802]]},
{"id":"404990","currency":"KRW","points":[["2025-11-13",3490],["2025-11-18",3530],["2025-11-21",3590],["2025-11-26",3615],["2025-12-01",3620],["2025-12-04",3700],["2025-12-09",3660],["2025-12-12",3575],["2025-12-17",3560],["2025-12-22",3655],["2025-12-26",3645],["2026-01-02",3630],["2026-01-07",3595],["2026-01-12",3600],["2026-01-15",3730],["2026-01-20",3740],["2026-01-23",3770],["2026-01-28",3890],["2026-02-02",3780],["2026-02-05",3865],["2026-02-10",3900],["2026-02-13",4075],["2026-02-23",4240],["2026-02-26",4365],["2026-03-04",4135],["2026-03-09",4280],["2026-03-12",4505],["2026-03-17",4525],["2026-03-20",4490],["2026-03-25",4440],["2026-03-30",4355],["2026-04-02",4235],["2026-04-07",4085],["2026-04-10",4190],["2026-04-15",4265],["2026-04-20",4590],["2026-04-23",4745],["2026-04-28",4870],["2026-05-04",4440],["2026-05-08",4535],["2026-05-13",3940],["2026-05-18",3740],["2026-05-21",3670],["2026-05-27",3740],["2026-06-01",3350],["2026-06-05",3365],["2026-06-10",4455],["2026-06-15",4115],["2026-06-18",3985],["2026-06-23",3815],["2026-06-26",3850],["2026-07-01",3715],["2026-07-06",3665],["2026-07-09",3645],["2026-07-14",3575],["2026-07-20",3575],["2026-07-23",3805],["2026-07-28",3845],["2026-07-31",3915],["2026-08-05",4115],["2026-08-10",4015],["2026-08-13",4020],["2026-08-19",4020],["2026-08-24",3830],["2026-08-27",3910],["2026-09-01",3920],["2026-09-04",3930],["2026-09-09",3800],["2026-09-14",3750],["2026-09-17",3795],["2026-09-22",3875],["2026-09-29",3950],["2026-10-02",3890],["2026-10-08",3860],["2026-10-14",4030],["2026-10-19",3960],["2026-10-22",3885],["2026-10-27",3900],["2026-10-30",3790],["2026-11-04",3720],["2026-11-09",3570],["2026-11-12",3380],["2026-11-13",3400]]},
{"id":"293940","currency":"KRW","points":[["2025-11-13",5550],["2025-11-18",5530],["2025-11-21",5580],["2025-11-26",5680],["2025-12-01",5900],["2025-12-04",5880],["2025-12-09",5820],["2025-12-12",5640],["2025-12-17",5530],["2025-12-22",5490],["2025-12-26",5510],["2026-01-02",5620],["2026-01-07",5680],["2026-01-12",5620],["2026-01-15",5580],["2026-01-20",5640],["2026-01-23",5650],["2026-01-28",5740],["2026-02-02",5710],["2026-02-05",5790],["2026-02-10",5820],["2026-02-13",6030],["2026-02-23",5950],["2026-02-26",5840],["2026-03-04",5460],["2026-03-09",5580],["2026-03-12",5720],["2026-03-17",5860],["2026-03-20",5830],["2026-03-25",5730],["2026-03-30",5690],["2026-04-02",5710],["2026-04-07",5770],["2026-04-10",5950],["2026-04-15",6040],["2026-04-20",6140],["2026-04-23",6240],["2026-04-28",6170],["2026-05-04",5870],["2026-05-08",5760],["2026-05-13",5550],["2026-05-18",5420],["2026-05-21",5250],["2026-05-27",5400],["2026-06-01",5240],["2026-06-05",5390],["2026-06-10",5220],["2026-06-15",5390],["2026-06-18",5500],["2026-06-23",5080],["2026-06-26",5170],["2026-07-01",5140],["2026-07-06",5170],["2026-07-09",5170],["2026-07-14",5180],["2026-07-20",5230],["2026-07-23",5220],["2026-07-28",5240],["2026-07-31",5220],["2026-08-05",5220],["2026-08-10",5290],["2026-08-13",5240],["2026-08-19",5200],["2026-08-24",5330],["2026-08-27",5450],["2026-09-01",5420],["2026-09-04",5350],["2026-09-09",5350],["2026-09-14",5420],["2026-09-17",5460],["2026-09-22",5550],["2026-09-29",5590],["2026-10-02",5540],["2026-10-08",5520],["2026-10-14",5520],["2026-10-19",5630],["2026-10-22",5600],["2026-10-27",5720],["2026-10-30",5720],["2026-11-04",5630],["2026-11-09",5640],["2026-11-12",5650],["2026-11-13",5660]]},
{"id":"088260","currency":"KRW","points":[["2025-11-13",4735],["2025-11-18",4740],["2025-11-21",4765],["2025-11-26",4880],["2025-12-01",4860],["2025-12-04",4880],["2025-12-09",4880],["2025-12-12",4825],["2025-12-17",4705],["2025-12-22",4750],["2025-12-26",4715],["2026-01-02",4615],["2026-01-07",4620],["2026-01-12",4625],["2026-01-15",4710],["2026-01-20",4750],["2026-01-23",4785],["2026-01-28",4750],["2026-02-02",4695],["2026-02-05",4695],["2026-02-10",4680],["2026-02-13",4745],["2026-02-23",4830],["2026-02-26",4905],["2026-03-04",4550],["2026-03-09",4650],["2026-03-12",4790],["2026-03-17",4855],["2026-03-20",4880],["2026-03-25",4805],["2026-03-30",4775],["2026-04-02",4830],["2026-04-07",4855],["2026-04-10",4885],["2026-04-15",4925],["2026-04-20",5010],["2026-04-23",5200],["2026-04-28",5220],["2026-05-04",4700],["2026-05-08",4665],["2026-05-13",4335],["2026-05-18",4150],["2026-05-21",4250],["2026-05-27",4380],["2026-06-01",3820],["2026-06-05",3905],["2026-06-10",3950],["2026-06-15",3370],["2026-06-18",3515],["2026-06-23",3380],["2026-06-26",3515],["2026-07-01",3425],["2026-07-06",3445],["2026-07-09",3415],["2026-07-14",3440],["2026-07-20",3190],["2026-07-23",3060],["2026-07-28",3010],["2026-07-31",2955],["2026-08-05",2825],["2026-08-10",3020],["2026-08-13",3110],["2026-08-19",3195],["2026-08-24",3160],["2026-08-27",3110],["2026-09-01",3200],["2026-09-04",3205],["2026-09-09",3185],["2026-09-14",3235],["2026-09-17",3290],["2026-09-22",3280],["2026-09-29",3285],["2026-10-02",3245],["2026-10-08",3240],["2026-10-14",3315],["2026-10-19",3270],["2026-10-22",3140],["2026-10-27",2970],["2026-10-30",2945],["2026-11-04",2940],["2026-11-09",3005],["2026-11-12",2885],["2026-11-13",2935]]},
{"id":"350520","currency":"KRW","points":[["2025-11-13",3960],["2025-11-18",3985],["2025-11-21",3980],["2025-11-26",3970],["2025-12-01",4000],["2025-12-04",4020],["2025-12-09",4010],["2025-12-12",3980],["2025-12-17",3930],["2025-12-22",3905],["2025-12-26",3940],["2026-01-02",3820],["2026-01-07",3920],["2026-01-12",3940],["2026-01-15",3915],["2026-01-20",3885],["2026-01-23",3830],["2026-01-28",3810],["2026-02-02",3790],["2026-02-05",3820],["2026-02-10",3810],["2026-02-13",3870],["2026-02-23",3860],["2026-02-26",3810],["2026-03-04",3640],["2026-03-09",3670],["2026-03-12",3755],["2026-03-17",3740],["2026-03-20",3725],["2026-03-25",3680],["2026-03-30",3670],["2026-04-02",3715],["2026-04-07",3875],["2026-04-10",3970],["2026-04-15",3965],["2026-04-20",3970],["2026-04-23",4045],["2026-04-28",4010],["2026-05-04",3805],["2026-05-08",3785],["2026-05-13",3575],["2026-05-18",3520],["2026-05-21",3425],["2026-05-27",3495],["2026-06-01",3300],["2026-06-05",3430],["2026-06-10",3435],["2026-06-15",3460],["2026-06-18",3450],["2026-06-23",3395],["2026-06-26",3350],["2026-07-01",3385],["2026-07-06",3350],["2026-07-09",3330],["2026-07-14",3370],["2026-07-20",3310],["2026-07-23",3330],["2026-07-28",3275],["2026-07-31",3265],["2026-08-05",3295],["2026-08-10",3400],["2026-08-13",3450],["2026-08-19",3375],["2026-08-24",3350],["2026-08-27",3330],["2026-09-01",3410],["2026-09-04",3405],["2026-09-09",3330],["2026-09-14",3315],["2026-09-17",3345],["2026-09-22",3345],["2026-09-29",3295],["2026-10-02",3260],["2026-10-08",3205],["2026-10-14",3190],["2026-10-19",3215],["2026-10-22",3140],["2026-10-27",3000],["2026-10-30",3005],["2026-11-04",2965],["2026-11-09",2935],["2026-11-12",2940],["2026-11-13",3000]]},
{"id":"334890","currency":"KRW","points":[["2025-11-13",4265],["2025-11-18",4275],["2025-11-21",4355],["2025-11-26",4450],["2025-12-01",4415],["2025-12-04",4250],["2025-12-09",4220],["2025-12-12",4265],["2025-12-17",4205],["2025-12-22",4190],["2025-12-26",4150],["2026-01-02",4195],["2026-01-07",4265],["2026-01-12",4190],["2026-01-15",4195],["2026-01-20",4160],["2026-01-23",4140],["2026-01-28",4210],["2026-02-02",4130],["2026-02-05",4185],["2026-02-10",4205],["2026-02-13",4290],["2026-02-23",4270],["2026-02-26",4235],["2026-03-04",3945],["2026-03-09",4020],["2026-03-12",4130],["2026-03-17",4190],["2026-03-20",4225],["2026-03-25",4135],["2026-03-30",4025],["2026-04-02",4145],["2026-04-07",4230],["2026-04-10",4270],["2026-04-15",4265],["2026-04-20",4275],["2026-04-23",4305],["2026-04-28",4360],["2026-05-04",4075],["2026-05-08",4095],["2026-05-13",3905],["2026-05-18",3990],["2026-05-21",3935],["2026-05-27",3990],["2026-06-01",3650],["2026-06-05",3275],["2026-06-10",3215],["2026-06-15",3480],["2026-06-18",3545],["2026-06-23",3290],["2026-06-26",3425],["2026-07-01",3540],["2026-07-06",3495],["2026-07-09",3395],["2026-07-14",3390],["2026-07-20",3400],["2026-07-23",3525],["2026-07-28",3620],["2026-07-31",3490],["2026-08-05",3380],["2026-08-10",3700],["2026-08-13",3690],["2026-08-19",3685],["2026-08-24",3765],["2026-08-27",3870],["2026-09-01",4050],["2026-09-04",3875],["2026-09-09",3605],["2026-09-14",3740],["2026-09-17",3635],["2026-09-22",3610],["2026-09-29",3670],["2026-10-02",3635],["2026-10-08",3595],["2026-10-14",3490],["2026-10-19",3450],["2026-10-22",3355],["2026-10-27",3110],["2026-10-30",2990],["2026-11-04",2965],["2026-11-09",2910],["2026-11-12",2930],["2026-11-13",2930]]},
{"id":"348950","currency":"KRW","points":[["2025-11-13",2970],["2025-11-18",2915],["2025-11-21",2965],["2025-11-26",3000],["2025-12-01",2985],["2025-12-04",3045],["2025-12-09",3030],["2025-12-12",2980],["2025-12-17",2880],["2025-12-22",2880],["2025-12-26",2885],["2026-01-02",2845],["2026-01-07",2880],["2026-01-12",2830],["2026-01-15",2845],["2026-01-20",2825],["2026-01-23",2815],["2026-01-28",2315],["2026-02-02",2315],["2026-02-05",2340],["2026-02-10",2300],["2026-02-13",2125],["2026-02-23",2045],["2026-02-26",1918],["2026-03-04",1779],["2026-03-09",1642],["2026-03-12",1625],["2026-03-17",1561],["2026-03-20",1565],["2026-03-25",1628],["2026-03-30",1572],["2026-04-02",1612],["2026-04-07",1687],["2026-04-10",1781],["2026-04-15",1483],["2026-04-20",1236],["2026-04-23",1270],["2026-04-28",1182],["2026-05-04",1182],["2026-05-08",1182],["2026-05-13",1182],["2026-05-18",1182],["2026-05-21",1182],["2026-05-27",1182],["2026-06-01",1182],["2026-06-05",1182],["2026-06-10",1182],["2026-06-15",1182],["2026-06-18",1182],["2026-06-23",1182],["2026-06-26",1182],["2026-07-01",1182],["2026-07-06",1182],["2026-07-09",1182],["2026-07-14",1182],["2026-07-20",1182],["2026-07-23",1182],["2026-07-28",1182],["2026-07-31",1182],["2026-08-05",1182],["2026-08-10",1182],["2026-08-13",1182],["2026-08-19",1182],["2026-08-24",1182],["2026-08-27",1182],["2026-09-01",1182],["2026-09-04",1182],["2026-09-09",1182],["2026-09-14",1182],["2026-09-17",1182],["2026-09-22",1182],["2026-09-29",1182],["2026-10-02",1182],["2026-10-08",1182],["2026-10-14",1182],["2026-10-19",1182],["2026-10-22",1182],["2026-10-27",1182],["2026-10-30",1182],["2026-11-04",1182],["2026-11-09",1182],["2026-11-12",1182],["2026-11-13",1182]]},
{"id":"145270","currency":"KRW","points":[["2025-11-13",958],["2025-11-18",958],["2025-11-21",959],["2025-11-26",959],["2025-12-01",966],["2025-12-04",964],["2025-12-09",965],["2025-12-12",962],["2025-12-17",959],["2025-12-22",971],["2025-12-26",970],["2026-01-02",925],["2026-01-07",926],["2026-01-12",924],["2026-01-15",923],["2026-01-20",917],["2026-01-23",917],["2026-01-28",919],["2026-02-02",908],["2026-02-05",910],["2026-02-10",914],["2026-02-13",915],["2026-02-23",917],["2026-02-26",910],["2026-03-04",903],["2026-03-09",896],["2026-03-12",898],["2026-03-17",900],["2026-03-20",900],["2026-03-25",905],["2026-03-30",910],["2026-04-02",906],["2026-04-07",906],["2026-04-10",911],["2026-04-15",903],["2026-04-20",907],["2026-04-23",904],["2026-04-28",902],["2026-05-04",897],["2026-05-08",889],["2026-05-13",837],["2026-05-18",830],["2026-05-21",815],["2026-05-27",808],["2026-06-01",749],["2026-06-05",751],["2026-06-10",762],["2026-06-15",770],["2026-06-18",770],["2026-06-23",746],["2026-06-26",736],["2026-07-01",768],["2026-07-06",765],["2026-07-09",755],["2026-07-14",754],["2026-07-20",760],["2026-07-23",807],["2026-07-28",790],["2026-07-31",816],["2026-08-05",819],["2026-08-10",808],["2026-08-13",800],["2026-08-19",795],["2026-08-24",785],["2026-08-27",787],["2026-09-01",795],["2026-09-04",789],["2026-09-09",792],["2026-09-14",784],["2026-09-17",782],["2026-09-22",794],["2026-09-29",794],["2026-10-02",803],["2026-10-08",801],["2026-10-14",803],["2026-10-19",806],["2026-10-22",797],["2026-10-27",802],["2026-10-30",814],["2026-11-04",879],["2026-11-09",814],["2026-11-12",815],["2026-11-13",815]]},
{"id":"417310","currency":"KRW","points":[["2025-11-13",6600],["2025-11-18",6630],["2025-11-21",6860],["2025-11-26",6910],["2025-12-01",7370],["2025-12-04",7810],["2025-12-09",8000],["2025-12-12",8000],["2025-12-17",8220],["2025-12-22",8640],["2025-12-26",8650],["2026-01-02",8840],["2026-01-07",8730],["2026-01-12",8700],["2026-01-15",8640],["2026-01-20",8900],["2026-01-23",8790],["2026-01-28",8880],["2026-02-02",8740],["2026-02-05",8900],["2026-02-10",8820],["2026-02-13",8960],["2026-02-23",9000],["2026-02-26",9360],["2026-03-04",8630],["2026-03-09",9220],["2026-03-12",9810],["2026-03-17",9280],["2026-03-20",9640],["2026-03-25",9780],["2026-03-30",9530],["2026-04-02",9610],["2026-04-07",9690],["2026-04-10",9750],["2026-04-15",10220],["2026-04-20",10200],["2026-04-23",10360],["2026-04-28",10430],["2026-05-04",10210],["2026-05-08",10190],["2026-05-13",10060],["2026-05-18",9950],["2026-05-21",10240],["2026-05-27",10000],["2026-06-01",9760],["2026-06-05",9760],["2026-06-10",10020],["2026-06-15",10150],["2026-06-18",10160],["2026-06-23",9790],["2026-06-26",9950],["2026-07-01",9970],["2026-07-06",9950],["2026-07-09",9890],["2026-07-14",10030],["2026-07-20",10020],["2026-07-23",10600],["2026-07-28",10800],["2026-07-31",10700],["2026-08-05",10750],["2026-08-10",10910],["2026-08-13",10920],["2026-08-19",10860],["2026-08-24",10810],["2026-08-27",10930],["2026-09-01",2370],["2026-09-04",2370],["2026-09-09",2365],["2026-09-14",2380],["2026-09-17",2370],["2026-09-22",2385],["2026-09-29",2385],["2026-10-02",2375],["2026-10-08",2385],["2026-10-14",2390],["2026-10-19",2390],["2026-10-22",2395],["2026-10-27",2405],["2026-10-30",2435],["2026-11-04",2425],["2026-11-09",2415],["2026-11-12",2415],["2026-11-13",2450]]},
{"id":"357120","currency":"KRW","points":[["2025-11-13",4500],["2025-11-18",4490],["2025-11-21",4615],["2025-11-26",4585],["2025-12-01",4435],["2025-12-04",4490],["2025-12-09",4495],["2025-12-12",4375],["2025-12-17",4275],["2025-12-22",4410],["2025-12-26",4420],["2026-01-02",4410],["2026-01-07",4440],["2026-01-12",4450],["2026-01-15",4410],["2026-01-20",4385],["2026-01-23",4430],["2026-01-28",4535],["2026-02-02",4510],["2026-02-05",4540],["2026-02-10",4590],["2026-02-13",4660],["2026-02-23",4630],["2026-02-26",4580],["2026-03-04",4310],["2026-03-09",4450],["2026-03-12",4585],["2026-03-17",4625],["2026-03-20",4645],["2026-03-25",4600],["2026-03-30",4500],["2026-04-02",4510],["2026-04-07",4570],["2026-04-10",4650],["2026-04-15",4665],["2026-04-20",4715],["2026-04-23",4845],["2026-04-28",4850],["2026-05-04",4585],["2026-05-08",4530],["2026-05-13",4360],["2026-05-18",4330],["2026-05-21",4395],["2026-05-27",4475],["2026-06-01",4050],["2026-06-05",3915],["2026-06-10",3945],["2026-06-15",3905],["2026-06-18",4210],["2026-06-23",4000],["2026-06-26",4025],["2026-07-01",4240],["2026-07-06",4210],["2026-07-09",4020],["2026-07-14",3985],["2026-07-20",3970],["2026-07-23",4080],["2026-07-28",4130],["2026-07-31",4145],["2026-08-05",4240],["2026-08-10",4260],["2026-08-13",4320],["2026-08-19",4355],["2026-08-24",4270],["2026-08-27",4310],["2026-09-01",4185],["2026-09-04",4075],["2026-09-09",4105],["2026-09-14",4120],["2026-09-17",4100],["2026-09-22",4235],["2026-09-29",4280],["2026-10-02",4130],["2026-10-08",4070],["2026-10-14",3935],["2026-10-19",3950],["2026-10-22",3795],["2026-10-27",3720],["2026-10-30",3615],["2026-11-04",3585],["2026-11-09",3385],["2026-11-12",3225],["2026-11-13",3210]]},
{"id":"451800","currency":"KRW","points":[["2025-11-13",4005],["2025-11-18",4020],["2025-11-21",4020],["2025-11-26",4105],["2025-12-01",4070],["2025-12-04",4135],["2025-12-09",4230],["2025-12-12",4160],["2025-12-17",4045],["2025-12-22",4125],["2025-12-26",4125],["2026-01-02",4155],["2026-01-07",4275],["2026-01-12",4350],["2026-01-15",4300],["2026-01-20",4355],["2026-01-23",4360],["2026-01-28",4530],["2026-02-02",4585],["2026-02-05",4635],["2026-02-10",4725],["2026-02-13",4850],["2026-02-23",4985],["2026-02-26",5150],["2026-03-04",4750],["2026-03-09",5020],["2026-03-12",5070],["2026-03-17",5080],["2026-03-20",5190],["2026-03-25",5070],["2026-03-30",5070],["2026-04-02",5250],["2026-04-07",5300],["2026-04-10",5620],["2026-04-15",5670],["2026-04-20",6070],["2026-04-23",6530],["2026-04-28",6590],["2026-05-04",5670],["2026-05-08",5700],["2026-05-13",5250],["2026-05-18",5300],["2026-05-21",4840],["2026-05-27",5470],["2026-06-01",4755],["2026-06-05",4355],["2026-06-10",4455],["2026-06-15",5060],["2026-06-18",4865],["2026-06-23",4705],["2026-06-26",4800],["2026-07-01",4835],["2026-07-06",4855],["2026-07-09",4660],["2026-07-14",4620],["2026-07-20",4605],["2026-07-23",4850],["2026-07-28",4990],["2026-07-31",5090],["2026-08-05",5130],["2026-08-10",5310],["2026-08-13",5420],["2026-08-19",5640],["2026-08-24",5530],["2026-08-27",5280],["2026-09-01",5280],["2026-09-04",5310],["2026-09-09",5300],["2026-09-14",5340],["2026-09-17",5320],["2026-09-22",5370],["2026-09-29",5340],["2026-10-02",5370],["2026-10-08",5460],["2026-10-14",5360],["2026-10-19",5150],["2026-10-22",5100],["2026-10-27",5350],["2026-10-30",5070],["2026-11-04",4805],["2026-11-09",4420],["2026-11-12",4595],["2026-11-13",4555]]},
{"id":"WELL","currency":"USD","points":[["2025-11-13",191.07],["2025-11-18",198.29],["2025-11-21",199.93],["2025-11-26",206.25],["2025-12-02",203.2],["2025-12-05",204.31],["2025-12-10",191.07],["2025-12-15",190.47],["2025-12-18",187.49],["2025-12-23",186.86],["2025-12-29",189.64],["2026-01-02",186.94],["2026-01-07",185.65],["2026-01-12",186.68],["2026-01-15",188.18],["2026-01-21",186.0],["2026-01-26",183.63],["2026-01-29",185.69],["2026-02-03",187.5],["2026-02-06",195.92],["2026-02-11",207.88],["2026-02-17",215.48],["2026-02-20",208.19],["2026-02-25",208.25],["2026-03-02",210.16],["2026-03-05",205.05],["2026-03-10",207.72],["2026-03-13",207.82],["2026-03-18",209.21],["2026-03-23",195.0],["2026-03-26",195.53],["2026-03-31",197.71],["2026-04-06",200.91],["2026-04-09",206.34],["2026-04-14",210.99],["2026-04-17",210.52],["2026-04-22",199.7],["2026-04-27",210.0],["2026-04-30",217.34],["2026-05-05",214.3],["2026-05-08",214.63],["2026-05-13",220.14],["2026-05-18",212.61],["2026-05-21",216.01],["2026-05-27",214.18],["2026-06-01",197.36],["2026-06-04",200.85],["2026-06-09",206.77],["2026-06-12",214.23],["2026-06-17",206.55],["2026-06-23",217.67],["2026-06-26",227.33],["2026-07-01",230.19],["2026-07-07",237.59],["2026-07-10",231.59],["2026-07-15",233.29],["2026-07-20",244.84],["2026-07-23",247.05],["2026-07-28",243.57],["2026-07-31",234.44],["2026-08-05",237.25],["2026-08-10",235.04],["2026-08-13",234.44],["2026-08-18",235.44],["2026-08-21",239.22],["2026-08-26",241.56],["2026-08-31",236.24],["2026-09-03",241.12],["2026-09-09",235.9],["2026-09-14",234.21],["2026-09-17",232.26],["2026-09-22",230.39],["2026-09-25",231.37],["2026-09-30",230.24],["2026-10-05",224.16],["2026-10-08",223.04],["2026-10-13",230.14],["2026-10-16",234.85],["2026-10-21",234.19],["2026-10-26",240.61],["2026-10-29",233.17],["2026-11-03",241.17],["2026-11-06",245.01],["2026-11-11",247.35],["2026-11-13",244.46]]},
{"id":"PLD","currency":"USD","points":[["2025-11-13",124.0],["2025-11-18",123.8],["2025-11-21",125.79],["2025-11-26",128.16],["2025-12-02",128.93],["2025-12-05",127.98],["2025-12-10",129.71],["2025-12-15",130.66],["2025-12-18",127.66],["2025-12-23",127.77],["2025-12-29",128.48],["2026-01-02",129.05],["2026-01-07",126.9],["2026-01-12",129.06],["2026-01-15",132.75],["2026-01-21",131.14],["2026-01-26",126.43],["2026-01-29",130.41],["2026-02-03",131.88],["2026-02-06",136.95],["2026-02-11",139.88],["2026-02-17",141.77],["2026-02-20",141.51],["2026-02-25",140.03],["2026-03-02",142.72],["2026-03-05",137.85],["2026-03-10",136.16],["2026-03-13",131.75],["2026-03-18",131.2],["2026-03-23",130.31],["2026-03-26",129.74],["2026-03-31",132.18],["2026-04-06",132.35],["2026-04-09",138.02],["2026-04-14",138.36],["2026-04-17",145.1],["2026-04-22",141.42],["2026-04-27",140.02],["2026-04-30",142.02],["2026-05-05",140.27],["2026-05-08",144.09],["2026-05-13",142.0],["2026-05-18",142.31],["2026-05-21",144.63],["2026-05-27",146.52],["2026-06-01",139.02],["2026-06-04",143.79],["2026-06-09",147.52],["2026-06-12",148.74],["2026-06-17",140.94],["2026-06-23",145.25],["2026-06-26",139.97],["2026-07-01",136.8],["2026-07-07",143.61],["2026-07-10",140.87],["2026-07-15",143.42],["2026-07-20",147.48],["2026-07-23",145.12],["2026-07-28",147.12],["2026-07-31",144.61],["2026-08-05",140.76],["2026-08-10",138.76],["2026-08-13",141.21],["2026-08-18",140.02],["2026-08-21",141.8],["2026-08-26",142.59],["2026-08-31",139.92],["2026-09-03",138.35],["2026-09-09",135.66],["2026-09-14",135.19],["2026-09-17",135.18],["2026-09-22",135.88],["2026-09-25",133.05],["2026-09-30",129.84],["2026-10-05",128.08],["2026-10-08",129.29],["2026-10-13",133.55],["2026-10-16",125.75],["2026-10-21",127.6],["2026-10-26",126.31],["2026-10-29",128.02],["2026-11-03",129.08],["2026-11-06",126.96],["2026-11-11",130.03],["2026-11-13",128.67]]},
{"id":"EQIX","currency":"USD","points":[["2025-11-13",786.54],["2025-11-18",779.17],["2025-11-21",754.68],["2025-11-26",750.41],["2025-12-02",727.38],["2025-12-05",741.58],["2025-12-10",734.4],["2025-12-15",761.39],["2025-12-18",744.08],["2025-12-23",760.13],["2025-12-29",765.0],["2026-01-02",764.11],["2026-01-07",776.55],["2026-01-12",783.86],["2026-01-15",801.82],["2026-01-21",795.48],["2026-01-26",806.35],["2026-01-29",826.05],["2026-02-03",801.83],["2026-02-06",848.12],["2026-02-11",867.52],["2026-02-17",951.97],["2026-02-20",928.11],["2026-02-25",960.52],["2026-03-02",966.1],["2026-03-05",953.0],["2026-03-10",956.07],["2026-03-13",969.9],["2026-03-18",973.56],["2026-03-23",966.96],["2026-03-26",963.39],["2026-03-31",980.24],["2026-04-06",1016.08],["2026-04-09",1031.57],["2026-04-14",1057.37],["2026-04-17",1088.62],["2026-04-22",1102.28],["2026-04-27",1089.85],["2026-04-30",1082.83],["2026-05-05",1078.46],["2026-05-08",1072.08],["2026-05-13",1077.28],["2026-05-18",1062.62],["2026-05-21",1078.42],["2026-05-27",1070.22],["2026-06-01",1050.77],["2026-06-04",1089.15],["2026-06-09",1059.84],["2026-06-12",1055.85],["2026-06-17",1088.52],["2026-06-23",1115.93],["2026-06-26",1091.3],["2026-07-01",1013.62],["2026-07-07",1022.93],["2026-07-10",1051.21],["2026-07-15",1022.6],["2026-07-20",1017.31],["2026-07-23",1033.55],["2026-07-28",1034.86],["2026-07-31",1019.28],["2026-08-05",1056.2],["2026-08-10",1043.38],["2026-08-13",1073.78],["2026-08-18",1085.09],["2026-08-21",1065.39],["2026-08-26",1079.61],["2026-08-31",1046.72],["2026-09-03",1040.83],["2026-09-09",1043.06],["2026-09-14",998.72],["2026-09-17",1025.94],["2026-09-22",1059.26],["2026-09-25",1008.08],["2026-09-30",1011.58],["2026-10-05",1023.44],["2026-10-08",1011.16],["2026-10-13",1019.4],["2026-10-16",985.98],["2026-10-21",995.0],["2026-10-26",967.65],["2026-10-29",1036.67],["2026-11-03",1014.4],["2026-11-06",1012.71],["2026-11-11",1068.06],["2026-11-13",1053.79]]},
{"id":"AMT","currency":"USD","points":[["2025-11-13",181.13],["2025-11-18",181.55],["2025-11-21",179.56],["2025-11-26",181.24],["2025-12-02",175.81],["2025-12-05",178.86],["2025-12-10",180.26],["2025-12-15",180.26],["2025-12-18",174.29],["2025-12-23",174.51],["2025-12-29",175.83],["2026-01-02",174.8],["2026-01-07",169.44],["2026-01-12",171.53],["2026-01-15",181.55],["2026-01-21",178.17],["2026-01-26",179.46],["2026-01-29",181.34],["2026-02-03",173.13],["2026-02-06",171.27],["2026-02-11",180.48],["2026-02-17",193.09],["2026-02-20",187.31],["2026-02-25",182.48],["2026-03-02",190.2],["2026-03-05",187.64],["2026-03-10",186.12],["2026-03-13",184.41],["2026-03-18",180.69],["2026-03-23",176.5],["2026-03-26",168.92],["2026-03-31",172.58],["2026-04-06",176.14],["2026-04-09",179.93],["2026-04-14",176.41],["2026-04-17",182.36],["2026-04-22",176.31],["2026-04-27",175.3],["2026-04-30",182.71],["2026-05-05",178.12],["2026-05-08",176.53],["2026-05-13",173.87],["2026-05-18",177.28],["2026-05-21",183.78],["2026-05-27",184.98],["2026-06-01",187.53],["2026-06-04",193.91],["2026-06-09",190.83],["2026-06-12",187.18],["2026-06-17",181.09],["2026-06-23",179.38],["2026-06-26",175.59],["2026-07-01",166.08],["2026-07-07",165.25],["2026-07-10",168.59],["2026-07-15",168.63],["2026-07-20",167.06],["2026-07-23",164.65],["2026-07-28",171.5],["2026-07-31",173.36],["2026-08-05",168.07],["2026-08-10",169.11],["2026-08-13",174.19],["2026-08-18",172.33],["2026-08-21",175.8],["2026-08-26",175.73],["2026-08-31",175.7],["2026-09-03",177.75],["2026-09-09",175.43],["2026-09-14",176.94],["2026-09-17",175.58],["2026-09-22",175.25],["2026-09-25",169.03],["2026-09-30",163.69],["2026-10-05",162.26],["2026-10-08",166.73],["2026-10-13",179.43],["2026-10-16",185.27],["2026-10-21",177.64],["2026-10-26",188.28],["2026-10-29",185.88],["2026-11-03",187.29],["2026-11-06",188.79],["2026-11-11",190.24],["2026-11-13",191.64]]},
{"id":"SPG","currency":"USD","points":[["2025-11-13",183.61],["2025-11-18",181.93],["2025-11-21",183.08],["2025-11-26",185.56],["2025-12-02",182.17],["2025-12-05",182.56],["2025-12-10",181.65],["2025-12-15",184.17],["2025-12-18",185.07],["2025-12-23",187.6],["2025-12-29",187.62],["2026-01-02",183.97],["2026-01-07",183.95],["2026-01-12",184.83],["2026-01-15",182.31],["2026-01-21",185.17],["2026-01-26",185.33],["2026-01-29",189.8],["2026-02-03",189.42],["2026-02-06",199.6],["2026-02-11",194.77],["2026-02-17",202.01],["2026-02-20",201.7],["2026-02-25",200.99],["2026-03-02",203.16],["2026-03-05",201.03],["2026-03-10",192.07],["2026-03-13",186.82],["2026-03-18",189.9],["2026-03-23",181.49],["2026-03-26",181.8],["2026-03-31",186.53],["2026-04-06",190.23],["2026-04-09",198.97],["2026-04-14",202.96],["2026-04-17",206.23],["2026-04-22",201.68],["2026-04-27",201.29],["2026-04-30",203.71],["2026-05-05",202.31],["2026-05-08",202.12],["2026-05-13",200.56],["2026-05-18",200.42],["2026-05-21",204.9],["2026-05-27",206.77],["2026-06-01",202.7],["2026-06-04",206.22],["2026-06-09",211.89],["2026-06-12",219.04],["2026-06-17",209.86],["2026-06-23",216.74],["2026-06-26",226.89],["2026-07-01",223.0],["2026-07-07",227.19],["2026-07-10",218.77],["2026-07-15",222.01],["2026-07-20",228.19],["2026-07-23",225.2],["2026-07-28",236.7],["2026-07-31",229.37],["2026-08-05",224.81],["2026-08-10",220.55],["2026-08-13",221.47],["2026-08-18",220.61],["2026-08-21",218.29],["2026-08-26",217.11],["2026-08-31",212.32],["2026-09-03",211.52],["2026-09-09",204.53],["2026-09-14",204.97],["2026-09-17",204.47],["2026-09-22",205.95],["2026-09-25",204.82],["2026-09-30",200.76],["2026-10-05",201.4],["2026-10-08",199.61],["2026-10-13",200.65],["2026-10-16",205.44],["2026-10-21",205.55],["2026-10-26",212.69],["2026-10-29",215.72],["2026-11-03",222.08],["2026-11-06",228.42],["2026-11-11",234.75],["2026-11-13",232.97]]},
{"id":"DLR","currency":"USD","points":[["2025-11-13",158.11],["2025-11-18",159.62],["2025-11-21",157.18],["2025-11-26",158.91],["2025-12-02",156.5],["2025-12-05",164.73],["2025-12-10",159.51],["2025-12-15",152.89],["2025-12-18",147.93],["2025-12-23",153.88],["2025-12-29",155.65],["2026-01-02",155.03],["2026-01-07",154.87],["2026-01-12",157.87],["2026-01-15",160.57],["2026-01-21",159.0],["2026-01-26",161.57],["2026-01-29",167.44],["2026-02-03",164.45],["2026-02-06",171.62],["2026-02-11",174.57],["2026-02-17",179.89],["2026-02-20",175.68],["2026-02-25",179.59],["2026-03-02",178.69],["2026-03-05",179.75],["2026-03-10",180.86],["2026-03-13",179.61],["2026-03-18",178.94],["2026-03-23",176.47],["2026-03-26",174.75],["2026-03-31",180.21],["2026-04-06",181.99],["2026-04-09",188.15],["2026-04-14",195.79],["2026-04-17",203.62],["2026-04-22",200.86],["2026-04-27",196.34],["2026-04-30",200.94],["2026-05-05",196.69],["2026-05-08",195.31],["2026-05-13",193.31],["2026-05-18",188.5],["2026-05-21",194.27],["2026-05-27",191.71],["2026-06-01",185.0],["2026-06-04",188.7],["2026-06-09",184.93],["2026-06-12",184.2],["2026-06-17",187.08],["2026-06-23",195.0],["2026-06-26",193.0],["2026-07-01",176.32],["2026-07-07",174.9],["2026-07-10",180.41],["2026-07-15",176.07],["2026-07-20",176.25],["2026-07-23",179.34],["2026-07-28",193.18],["2026-07-31",188.52],["2026-08-05",194.93],["2026-08-10",191.3],["2026-08-13",197.58],["2026-08-18",195.25],["2026-08-21",190.62],["2026-08-26",193.43],["2026-08-31",185.59],["2026-09-03",187.79],["2026-09-09",189.08],["2026-09-14",179.14],["2026-09-17",184.26],["2026-09-22",185.65],["2026-09-25",178.61],["2026-09-30",175.53],["2026-10-05",179.87],["2026-10-08",176.07],["2026-10-13",178.14],["2026-10-16",175.97],["2026-10-21",176.31],["2026-10-26",174.53],["2026-10-29",182.91],["2026-11-03",180.25],["2026-11-06",174.2],["2026-11-11",181.13],["2026-11-13",179.99]]},
{"id":"PSA","currency":"USD","points":[["2025-11-13",274.28],["2025-11-18",271.5],["2025-11-21",269.51],["2025-11-26",274.21],["2025-12-02",273.16],["2025-12-05",272.06],["2025-12-10",267.62],["2025-12-15",272.38],["2025-12-18",261.37],["2025-12-23",259.43],["2025-12-29",259.32],["2026-01-02",258.44],["2026-01-07",265.68],["2026-01-12",279.2],["2026-01-15",293.03],["2026-01-21",288.7],["2026-01-26",278.75],["2026-01-29",277.45],["2026-02-03",279.54],["2026-02-06",287.0],["2026-02-11",293.84],["2026-02-17",302.0],["2026-02-20",305.0],["2026-02-25",299.35],["2026-03-02",310.94],["2026-03-05",306.94],["2026-03-10",305.99],["2026-03-13",297.72],["2026-03-18",277.59],["2026-03-23",271.32],["2026-03-26",268.01],["2026-03-31",270.88],["2026-04-06",280.89],["2026-04-09",293.27],["2026-04-14",304.0],["2026-04-17",309.22],["2026-04-22",304.81],["2026-04-27",305.48],["2026-04-30",302.45],["2026-05-05",298.82],["2026-05-08",311.04],["2026-05-13",303.7],["2026-05-18",296.15],["2026-05-21",304.99],["2026-05-27",306.79],["2026-06-01",295.8],["2026-06-04",306.66],["2026-06-09",322.86],["2026-06-12",325.94],["2026-06-17",312.58],["2026-06-23",321.29],["2026-06-26",324.39],["2026-07-01",323.04],["2026-07-07",328.69],["2026-07-10",320.56],["2026-07-15",314.68],["2026-07-20",315.53],["2026-07-23",315.01],["2026-07-28",330.47],["2026-07-31",324.17],["2026-08-05",327.34],["2026-08-10",325.71],["2026-08-13",328.72],["2026-08-18",323.1],["2026-08-21",322.49],["2026-08-26",317.37],["2026-08-31",306.99],["2026-09-03",305.73],["2026-09-09",294.6],["2026-09-14",295.4],["2026-09-17",300.76],["2026-09-22",289.71],["2026-09-25",287.97],["2026-09-30",282.84],["2026-10-05",281.66],["2026-10-08",285.52],["2026-10-13",288.39],["2026-10-16",298.31],["2026-10-21",298.31],["2026-10-26",306.97],["2026-10-29",317.06],["2026-11-03",333.39],["2026-11-06",337.46],["2026-11-11",335.73],["2026-11-13",332.59]]},
{"id":"O","currency":"USD","points":[["2025-11-13",56.59],["2025-11-18",57.34],["2025-11-21",56.67],["2025-11-26",57.14],["2025-12-02",57.5],["2025-12-05",58.48],["2025-12-10",56.67],["2025-12-15",58.08],["2025-12-18",56.77],["2025-12-23",55.93],["2025-12-29",56.81],["2026-01-02",57.31],["2026-01-07",57.35],["2026-01-12",58.89],["2026-01-15",60.72],["2026-01-21",61.79],["2026-01-26",60.4],["2026-01-29",60.78],["2026-02-03",61.46],["2026-02-06",63.23],["2026-02-11",64.5],["2026-02-17",66.49],["2026-02-20",66.14],["2026-02-25",65.99],["2026-03-02",67.56],["2026-03-05",64.8],["2026-03-10",64.88],["2026-03-13",64.44],["2026-03-18",63.04],["2026-03-23",60.85],["2026-03-26",60.27],["2026-03-31",61.18],["2026-04-06",61.83],["2026-04-09",63.2],["2026-04-14",63.81],["2026-04-17",65.09],["2026-04-22",63.34],["2026-04-27",62.75],["2026-04-30",64.24],["2026-05-05",63.57],["2026-05-08",61.92],["2026-05-13",61.52],["2026-05-18",61.71],["2026-05-21",62.23],["2026-05-27",62.19],["2026-06-01",59.55],["2026-06-04",59.75],["2026-06-09",61.25],["2026-06-12",62.72],["2026-06-17",60.57],["2026-06-23",61.53],["2026-06-26",63.12],["2026-07-01",61.82],["2026-07-07",64.01],["2026-07-10",63.31],["2026-07-15",63.26],["2026-07-20",65.18],["2026-07-23",64.72],["2026-07-28",65.73],["2026-07-31",63.87],["2026-08-05",62.7],["2026-08-10",61.89],["2026-08-13",62.95],["2026-08-18",62.21],["2026-08-21",62.6],["2026-08-26",62.26],["2026-08-31",61.28],["2026-09-03",61.74],["2026-09-09",60.11],["2026-09-14",59.27],["2026-09-17",57.32],["2026-09-22",56.53],["2026-09-25",55.54],["2026-09-30",54.3],["2026-10-05",53.77],["2026-10-08",54.17],["2026-10-13",54.99],["2026-10-16",56.08],["2026-10-21",55.35],["2026-10-26",57.16],["2026-10-29",57.2],["2026-11-03",57.5],["2026-11-06",59.04],["2026-11-11",59.57],["2026-11-13",58.82]]},
{"id":"VMRK","currency":"USD","points":[["2025-11-13",59.28],["2025-11-18",59.18],["2025-11-21",60.55],["2025-11-26",61.58],["2025-12-02",61.98],["2025-12-05",61.06],["2025-12-10",60.67],["2025-12-15",61.1],["2025-12-18",62.09],["2025-12-23",62.33],["2025-12-29",63.28],["2026-01-02",62.03],["2026-01-07",61.94],["2026-01-12",60.26],["2026-01-15",61.17],["2026-01-21",61.35],["2026-01-26",62.12],["2026-01-29",61.86],["2026-02-03",61.79],["2026-02-06",63.89],["2026-02-11",64.65],["2026-02-17",63.48],["2026-02-20",62.6],["2026-02-25",63.4],["2026-03-02",63.13],["2026-03-05",63.11],["2026-03-10",61.48],["2026-03-13",59.99],["2026-03-18",59.85],["2026-03-23",58.41],["2026-03-26",59.51],["2026-03-31",59.15],["2026-04-06",60.06],["2026-04-09",60.46],["2026-04-14",61.36],["2026-04-17",62.68],["2026-04-22",61.7],["2026-04-27",62.32],["2026-04-30",65.38],["2026-05-05",66.25],["2026-05-08",65.54],["2026-05-13",65.83],["2026-05-18",65.43],["2026-05-21",65.76],["2026-05-27",66.63],["2026-06-01",65.81],["2026-06-04",67.9],["2026-06-09",67.86],["2026-06-12",67.34],["2026-06-17",64.63],["2026-06-23",65.7],["2026-06-26",68.38],["2026-07-01",68.63],["2026-07-07",70.15],["2026-07-10",68.69],["2026-07-15",68.26],["2026-07-20",68.8],["2026-07-23",68.28],["2026-07-28",68.09],["2026-07-31",66.45],["2026-08-05",67.74],["2026-08-10",65.83],["2026-08-13",65.97],["2026-08-18",64.03],["2026-08-21",66.79],["2026-08-26",66.83],["2026-08-31",65.14],["2026-09-03",64.96],["2026-09-09",64.98],["2026-09-14",66.32],["2026-09-17",63.01],["2026-09-22",62.35],["2026-09-25",61.51],["2026-09-30",60.76],["2026-10-05",60.09],["2026-10-08",59.98],["2026-10-13",61.2],["2026-10-16",61.26],["2026-10-21",61.99],["2026-10-26",62.78],["2026-10-29",61.75],["2026-11-03",62.04],["2026-11-06",65.51],["2026-11-11",64.63],["2026-11-13",64.22]]},
{"id":"VTR","currency":"USD","points":[["2025-11-13",77.24],["2025-11-18",79.86],["2025-11-21",79.24],["2025-11-26",80.08],["2025-12-02",80.08],["2025-12-05",80.61],["2025-12-10",77.73],["2025-12-15",78.71],["2025-12-18",79.91],["2025-12-23",79.11],["2025-12-29",79.65],["2026-01-02",77.33],["2026-01-07",75.69],["2026-01-12",75.68],["2026-01-15",76.92],["2026-01-21",77.78],["2026-01-26",76.28],["2026-01-29",76.87],["2026-02-03",77.69],["2026-02-06",82.55],["2026-02-11",85.69],["2026-02-17",86.89],["2026-02-20",85.94],["2026-02-25",86.41],["2026-03-02",86.66],["2026-03-05",84.96],["2026-03-10",86.08],["2026-03-13",86.56],["2026-03-18",87.33],["2026-03-23",81.85],["2026-03-26",82.66],["2026-03-31",81.78],["2026-04-06",82.95],["2026-04-09",84.95],["2026-04-14",85.34],["2026-04-17",85.1],["2026-04-22",80.1],["2026-04-27",84.7],["2026-04-30",87.86],["2026-05-05",86.78],["2026-05-08",87.26],["2026-05-13",90.35],["2026-05-18",88.14],["2026-05-21",88.0],["2026-05-27",88.05],["2026-06-01",81.71],["2026-06-04",79.1],["2026-06-09",82.47],["2026-06-12",84.6],["2026-06-17",82.15],["2026-06-23",85.37],["2026-06-26",89.05],["2026-07-01",89.65],["2026-07-07",94.07],["2026-07-10",90.66],["2026-07-15",92.29],["2026-07-20",96.25],["2026-07-23",97.92],["2026-07-28",98.14],["2026-07-31",93.51],["2026-08-05",92.53],["2026-08-10",91.95],["2026-08-13",90.29],["2026-08-18",91.2],["2026-08-21",93.06],["2026-08-26",93.5],["2026-08-31",91.17],["2026-09-03",92.11],["2026-09-09",89.38],["2026-09-14",89.1],["2026-09-17",87.71],["2026-09-22",86.86],["2026-09-25",86.59],["2026-09-30",85.02],["2026-10-05",81.36],["2026-10-08",81.76],["2026-10-13",83.85],["2026-10-16",85.86],["2026-10-21",85.38],["2026-10-26",87.42],["2026-10-29",83.71],["2026-11-03",87.04],["2026-11-06",88.75],["2026-11-11",90.42],["2026-11-13",88.92]]}
]}
<<<END FILE>>>

<<<FILE: data/savings.json>>>
{"as_of": "2026-11-15", "source": "금융감독원 금융상품한눈에 적금 비교 화면 (은행·12개월·정액적립식·가입제한 없음으로 검색한 표를 옮겨 적음)", "items": [
{"kind":"saving","bank":"경남은행","product":"오면우대! 하면우대! 정기적금","product_code":null,"term_months":12,"rate_base":1.9,"rate_max":7,"rate_type":"단리","reserve_type":"정액적립식","join_deny":1,"join_way":null,"join_member":"제한없음","special_condition":null,"max_limit":null,"disclosure_month":null},
{"kind":"saving","bank":"경남은행","product":"주거래 프리미엄 적금","product_code":null,"term_months":12,"rate_base":2.7,"rate_max":4.3,"rate_type":"단리","reserve_type":"정액적립식","join_deny":1,"join_way":null,"join_member":"제한없음","special_condition":null,"max_limit":null,"disclosure_month":null},
{"kind":"saving","bank":"경남은행","product":"행복 DREAM 적금","product_code":null,"term_months":12,"rate_base":2.9,"rate_max":3.9,"rate_type":"단리","reserve_type":"정액적립식","join_deny":1,"join_way":null,"join_member":"제한없음","special_condition":null,"max_limit":null,"disclosure_month":null},
{"kind":"saving","bank":"광주은행","product":"여행스케치_남도투어적금","product_code":null,"term_months":12,"rate_base":2.2,"rate_max":4.1,"rate_type":"단리","reserve_type":"정액적립식","join_deny":1,"join_way":null,"join_member":"제한없음","special_condition":null,"max_limit":null,"disclosure_month":null},
{"kind":"saving","bank":"광주은행","product":"해피라이프_여행스케치적금V","product_code":null,"term_months":12,"rate_base":2.5,"rate_max":3.7,"rate_type":"단리","reserve_type":"정액적립식","join_deny":1,"join_way":null,"join_member":"제한없음","special_condition":null,"max_limit":null,"disclosure_month":null},
{"kind":"saving","bank":"광주은행","product":"VIP플러스적금","product_code":null,"term_months":12,"rate_base":2.4,"rate_max":2.9,"rate_type":"단리","reserve_type":"정액적립식","join_deny":1,"join_way":null,"join_member":"제한없음","special_condition":null,"max_limit":null,"disclosure_month":null},
{"kind":"saving","bank":"국민은행","product":"KB국민프리미엄적금(정액)","product_code":null,"term_months":12,"rate_base":2.75,"rate_max":3.65,"rate_type":"단리","reserve_type":"정액적립식","join_deny":1,"join_way":null,"join_member":"제한없음","special_condition":null,"max_limit":null,"disclosure_month":null},
{"kind":"saving","bank":"국민은행","product":"KB내맘대로적금","product_code":null,"term_months":12,"rate_base":2.55,"rate_max":3.15,"rate_type":"단리","reserve_type":"정액적립식","join_deny":1,"join_way":null,"join_member":"제한없음","special_condition":null,"max_limit":null,"disclosure_month":null},
{"kind":"saving","bank":"부산은행","product":"펫 적금","product_code":null,"term_months":12,"rate_base":2.2,"rate_max":3.1,"rate_type":"단리","reserve_type":"정액적립식","join_deny":1,"join_way":null,"join_member":"제한없음","special_condition":null,"max_limit":null,"disclosure_month":null},
{"kind":"saving","bank":"수협은행","product":"헤이(Hey)적금 (정액적립식)","product_code":null,"term_months":12,"rate_base":2.8,"rate_max":3.7,"rate_type":"단리","reserve_type":"정액적립식","join_deny":1,"join_way":null,"join_member":"제한없음","special_condition":null,"max_limit":null,"disclosure_month":null},
{"kind":"saving","bank":"수협은행","product":"Sh해양플라스틱Zero!적금 (정액적립식)","product_code":null,"term_months":12,"rate_base":3.5,"rate_max":4.1,"rate_type":"단리","reserve_type":"정액적립식","join_deny":1,"join_way":null,"join_member":"제한없음","special_condition":null,"max_limit":null,"disclosure_month":null},
{"kind":"saving","bank":"우리은행","product":"우리SUPER주거래적금","product_code":null,"term_months":12,"rate_base":2.45,"rate_max":3.85,"rate_type":"단리","reserve_type":"정액적립식","join_deny":1,"join_way":null,"join_member":"제한없음","special_condition":null,"max_limit":null,"disclosure_month":null},
{"kind":"saving","bank":"우리은행","product":"WON적금","product_code":null,"term_months":12,"rate_base":3.2,"rate_max":3.4,"rate_type":"단리","reserve_type":"정액적립식","join_deny":1,"join_way":null,"join_member":"제한없음","special_condition":null,"max_limit":null,"disclosure_month":null},
{"kind":"saving","bank":"전북은행","product":"JB 다이렉트적금(정액적립식)","product_code":null,"term_months":12,"rate_base":3.6,"rate_max":3.7,"rate_type":"단리","reserve_type":"정액적립식","join_deny":1,"join_way":null,"join_member":"제한없음","special_condition":null,"max_limit":null,"disclosure_month":null},
{"kind":"saving","bank":"주식회사 하나은행","product":"내맘적금","product_code":null,"term_months":12,"rate_base":2.3,"rate_max":2.8,"rate_type":"단리","reserve_type":"정액적립식","join_deny":1,"join_way":null,"join_member":"제한없음","special_condition":null,"max_limit":null,"disclosure_month":null},
{"kind":"saving","bank":"한국산업은행","product":"KDB 기업정기적금","product_code":null,"term_months":12,"rate_base":3.7,"rate_max":3.7,"rate_type":"단리","reserve_type":"정액적립식","join_deny":1,"join_way":null,"join_member":"제한없음","special_condition":null,"max_limit":null,"disclosure_month":null},
{"kind":"saving","bank":"한국스탠다드차타드은행","product":"퍼스트가계적금","product_code":null,"term_months":12,"rate_base":2.95,"rate_max":2.95,"rate_type":"단리","reserve_type":"정액적립식","join_deny":1,"join_way":null,"join_member":"제한없음","special_condition":null,"max_limit":null,"disclosure_month":null}
]}
<<<END FILE>>>

<<<FILE: data/glossary.json>>>
{"as_of": "2026-11-14", "source": "팀 작성 (산식 출처: 국토교통부 리츠정보시스템 '성과지표 안내', 부동산투자회사법, 소득세법, 예금자보호법)", "_설명": "용어 배우기(learn.html)와 용어 말풍선이 읽는 파일. 스크립트가 아니라 사람이 직접 쓰는 파일이다. live 는 실제 데이터 예시를 붙일 때 쓰는 상품 값 이름(Common.buildProducts 의 필드).", "categories": ["기본", "배당", "가격", "안정성", "위험·세금"], "items": [
{"id":"reit","term":"리츠","full":"REITs · 부동산투자회사","category":"기본","easy":"여러 사람의 돈을 모아 건물을 사고, 거기서 나온 임대료를 나눠 주는 회사예요.","detail":"혼자서는 살 수 없는 큰 건물(오피스, 물류센터, 마트 등)을 여럿이 조금씩 나눠 갖는 방식이에요. 리츠는 법에 따라 벌어들인 이익의 90% 이상을 주주에게 배당하게 되어 있어요.","formula":null,"caution":"건물 가격이나 임대료가 떨어지면 주가와 배당도 줄 수 있어요.","live":null},
{"id":"listed-reit","term":"상장 리츠","full":"주식시장에 상장된 리츠","category":"기본","easy":"주식시장에 올라와 있어서 주식처럼 1주씩 사고팔 수 있는 리츠예요.","detail":"증권사 앱에서 종목 이름을 검색해 주식과 똑같이 사고팔아요. 이 사이트에 나오는 리츠는 모두 상장 리츠예요.","formula":null,"caution":"주식처럼 가격이 매일 바뀌어요. 산 가격보다 내릴 수 있어요.","live":"price"},
{"id":"etf","term":"리츠 ETF","full":"상장지수펀드","category":"기본","easy":"여러 리츠를 한 바구니에 담아 놓은 상품이에요.","detail":"리츠 하나만 사면 그 리츠의 건물에만 기대게 되지만, ETF는 여러 리츠에 나눠 담아요. 그래서 건물 하나하나의 지표인 P/NAV, WALE은 ETF에는 없어요.","formula":null,"caution":"여러 개를 담았어도 리츠 시장 전체가 내리면 같이 내려요. 운용 보수(수수료)도 있어요.","live":null},
{"id":"amc","term":"운용사","full":"AMC · 자산관리회사","category":"기본","easy":"리츠 대신 건물을 고르고, 세입자를 구하고, 관리해 주는 회사예요.","detail":"대부분의 리츠는 직원이 없는 서류상 회사이고, 실제 일은 운용사가 맡아요. 같은 운용사가 여러 리츠를 맡기도 해요.","formula":null,"caution":null,"live":null},
{"id":"market-cap","term":"시가총액","full":"주가 × 발행 주식 수","category":"기본","easy":"주식시장이 그 리츠 전체에 매긴 값이에요.","detail":"1주 가격에 전체 주식 수를 곱한 값이에요. 리츠를 통째로 사려면 얼마가 필요한지를 뜻해요.","formula":"시가총액 = 종가 × 상장 주식 수","caution":null,"live":null},
{"id":"dividend","term":"배당","full":"배당금","category":"배당","easy":"리츠가 번 돈을 주주에게 나눠 주는 돈이에요. 건물주가 받는 월세와 비슷해요.","detail":"리츠마다 1년에 1번, 2번(반기), 4번(분기) 주는 곳이 달라요. 주식을 가지고 있으면 증권 계좌로 들어와요.","formula":null,"caution":"배당은 정해진 금액이 아니에요. 임대료가 줄거나 이자가 늘면 배당도 줄 수 있고, 안 주는 때도 있어요.","live":null},
{"id":"dps","term":"주당배당금","full":"DPS · Dividend Per Share","category":"배당","easy":"주식 1주를 가진 사람이 받는 배당금이에요.","detail":"10주를 가지고 있으면 주당배당금의 10배를 받아요. 이 사이트는 최근 1년 동안 준 주당배당금을 더해서 써요.","formula":"최근 1년 주당배당금 = 최근 1년에 해당하는 결산기들의 주당 현금배당금 합계","caution":"지난 1년에 실제로 준 금액이에요. 앞으로도 같다는 뜻이 아니에요.","live":"dpsAnnual"},
{"id":"price-yield","term":"주가 기준 배당수익률","full":"시가 배당수익률","category":"배당","easy":"지금 가격에 사면, 1년 배당이 내가 낸 돈의 몇 %인지예요.","detail":"5%라면 100만 원어치를 샀을 때 1년 배당이 약 5만 원(세금 떼기 전)이라는 뜻이에요. 이 사이트에서 '커피 몇 잔'으로 바꿔 보여주는 숫자가 이것이에요.","formula":"주가 기준 배당수익률 = 최근 1년 주당배당금 ÷ 현재 주가 × 100","caution":"주가가 떨어지면 이 숫자는 오히려 커져요. 숫자가 크다고 꼭 좋은 것은 아니에요.","live":"priceYield"},
{"id":"capital-yield","term":"자본금 기준 배당수익률","full":"리츠정보시스템의 '배당수익률'","category":"배당","easy":"리츠가 처음 주주에게 받은 돈(자본금)에 비해 배당을 얼마나 줬는지예요.","detail":"국토교통부 리츠정보시스템이 쓰는 방식이에요. 지금 주가와는 상관없는 숫자라서, 지금 사는 사람이 받는 수익률과는 달라요. 그래서 이 사이트에서는 참고로만 보여줘요.","formula":"배당수익률 = 배당액 ÷ {(기초 납입자본금 + 기말 납입자본금) ÷ 2}","caution":"결산 한 번(6개월 또는 3개월) 치 숫자일 수 있어요. 1년 치로 바꾼 것이 연환산배당률이에요.","live":"capitalYield"},
{"id":"annualized","term":"연환산배당률","full":"1년 치로 바꾼 배당률","category":"배당","easy":"6개월·3개월마다 결산하는 리츠의 배당률을 1년 치로 바꾼 숫자예요.","detail":"리츠마다 결산 주기가 달라서 그대로는 비교가 안 돼요. 그래서 모두 1년 기준으로 맞춘 것이에요.","formula":"연환산배당률 = 배당수익률 × 365 ÷ 해당 사업연도의 일수","caution":"자본금 기준이에요. 지금 주가 기준이 아니에요.","live":"capitalYieldAnnualized"},
{"id":"nav","term":"NAV","full":"순자산가치 · Net Asset Value","category":"가격","easy":"리츠가 가진 건물 값에서 빚을 뺀 진짜 내 몫이에요.","detail":"10억짜리 건물을 빚 6억을 내서 샀다면 NAV는 4억이에요. 건물 값은 감정평가사가 매긴 값을 써요.","formula":"NAV = 자산의 최근 감정평가액 − 부채총계","caution":"감정평가액은 실제로 팔리는 값과 다를 수 있어요.","live":"navMillionWon"},
{"id":"pnav","term":"P/NAV","full":"Price to NAV · 순자산가치 대비 주가","category":"가격","easy":"건물의 진짜 값에 비해 주식시장에서 싸게 팔리는지 비싸게 팔리는지예요.","detail":"0.8이면 1만 원어치 건물을 8천 원에 사는 셈이에요. 1보다 작으면 건물 값보다 싸게, 1보다 크면 웃돈을 주고 거래된다는 뜻이에요.","formula":"이 사이트의 P/NAV = 시가총액 ÷ NAV (리츠정보시스템 원자료는 '결산월 말일 주가 ÷ NAV'라서 0.0079 같은 값이 나와 그대로 쓰지 않아요)","caution":"싸게 거래되는 데는 이유가 있을 수 있어요(빚이 많다, 세입자가 나갈 예정이다 등). 싸다고 오른다는 뜻이 아니에요.","live":"pNav"},
{"id":"ffo","term":"FFO","full":"Funds From Operations · 운영으로 번 현금","category":"가격","easy":"리츠가 건물을 굴려서 실제로 벌어들인 돈에 가까운 숫자예요.","detail":"회계상 이익에는 실제로 돈이 나가지 않은 비용(감가상각비)이나 한 번뿐인 매각 이익이 섞여 있어요. 이런 것을 걸러 내고 임대 사업으로 번 돈만 보려는 숫자예요.","formula":"FFO = 당기순이익 + 감가상각비 ± 평가손익 ± 매각손익 ± 손상차손/환입 ± 판매손익","caution":"마이너스라면 임대 사업만으로는 돈을 못 벌고 있다는 뜻일 수 있어요.","live":null},
{"id":"pffo","term":"P/FFO","full":"Price to FFO","category":"가격","easy":"리츠가 버는 돈에 비해 주가가 몇 배인지예요. 주식의 PER과 비슷해요.","detail":"10이면 지금처럼 벌 때 10년 치 번 돈이 지금 가격과 같다는 뜻이에요. 낮을수록 버는 돈에 비해 싸게 거래되는 거예요.","formula":"P/FFO = 결산월 말일 주가 ÷ FFO (리츠정보시스템 기준)","caution":"리츠정보시스템 원자료는 단위 때문에 아주 작은 숫자로 나와요. 이 사이트에서는 번역에 쓰지 않아요.","live":null},
{"id":"wale","term":"WALE","full":"Weighted Average Lease Expiry · 가중평균 잔여 임대기간","category":"안정성","easy":"세입자들의 계약이 평균 몇 년 남았는지예요.","detail":"5년이면 지금 세입자들이 평균 5년은 더 임대료를 내기로 약속했다는 뜻이에요. 넓은 면적을 쓰는 세입자일수록 더 크게 반영해요.","formula":"WALE = Σ(각 임차인의 잔여 임대기간 × 각 임차인의 임대면적) ÷ 전체 임대면적","caution":"길다고 걱정이 없는 것은 아니에요. 세입자가 망하거나 중간에 나갈 수도 있고, 계약이 끝난 뒤는 알 수 없어요.","live":"waleYears"},
{"id":"vacancy","term":"공실","full":"비어 있는 임대 공간","category":"안정성","easy":"세입자를 못 구해서 비어 있는 공간이에요. 비어 있으면 임대료가 안 들어와요.","detail":"건물의 10%가 비어 있으면 공실률 10%라고 해요. 공실이 늘면 리츠가 버는 돈과 배당이 줄어요.","formula":null,"caution":null,"live":null},
{"id":"interest-rate","term":"금리와 리츠","full":"금리가 리츠에 주는 영향","category":"안정성","easy":"리츠는 빚을 내서 건물을 사기 때문에, 금리가 오르면 이자가 늘어 배당이 줄 수 있어요.","detail":"금리가 오르면 은행 이자만으로도 수익이 나니까 리츠를 찾는 사람이 줄어 주가가 약해지는 경우가 많았어요. 반대로 금리가 내리면 부담이 줄어요.","formula":null,"caution":"늘 그런 것은 아니에요. 임대료가 같이 오르는지, 대출 만기가 언제인지에 따라 달라요.","live":null},
{"id":"principal-risk","term":"원금 손실","full":"투자한 돈이 줄어드는 것","category":"위험·세금","easy":"산 가격보다 주가가 내리면, 넣은 돈보다 적게 돌려받는 거예요.","detail":"리츠와 ETF는 주식처럼 가격이 매일 바뀌어요. 배당을 받아도 주가가 더 많이 내리면 전체로는 손해예요. 은행 적금과 가장 다른 점이에요.","formula":null,"caution":"이 사이트의 모든 숫자는 지난 실적이에요. 앞으로의 수익을 알려 주지 않아요.","live":null},
{"id":"deposit-protect","term":"예금자보호","full":"예금자보호법에 따른 보호","category":"위험·세금","easy":"은행이 망해도 내 예금·적금을 일정 금액까지 돌려받게 해 주는 제도예요.","detail":"은행 예금과 적금은 금융회사 한 곳당 1인당 원금과 이자를 합쳐 1억 원까지 보호돼요(2025년 9월 1일부터). 리츠와 ETF는 이 보호 대상이 아니에요.","formula":null,"caution":"보호되는 것은 은행이 망했을 때예요. 적금 금리가 낮아 물가보다 덜 오르는 것까지 막아 주지는 않아요.","live":null},
{"id":"dividend-tax","term":"배당소득세","full":"배당·이자에 붙는 세금 15.4%","category":"위험·세금","easy":"배당이나 이자를 받을 때 15.4%를 세금으로 떼고 받아요.","detail":"소득세 14%에 지방소득세 1.4%를 더한 값이에요. 배당이 1만 원이면 8,460원이 들어와요. 은행 이자도 똑같이 15.4%를 떼요. 이 사이트의 금액은 모두 세금을 떼기 전이에요.","formula":"받는 돈 = 배당금 × (1 − 0.154)","caution":null,"live":null}
]}
<<<END FILE>>>

<<<FILE: data/ads.json>>>
{"as_of": null, "source": "팀 직접 등록", "_설명": "광고 칸에 넣을 광고 목록. 사람이 직접 쓰는 파일이다. 비어 있으면 화면에는 '광고 자리' 틀만 보인다. 광고를 넣으려면 items 에 { \"position\": \"광고 칸 이름(예: home-top) 또는 any\", \"image\": \"이미지 경로\", \"link\": \"눌렀을 때 갈 주소\", \"alt\": \"이미지 설명\", \"advertiser\": \"광고주\" } 모양으로 적는다. 금융상품(리츠·ETF·주식·코인 등) 광고는 넣지 않는다.", "items": [

]}
<<<END FILE>>>

<<<FILE: data/meta.json>>>
{
 "updated_at": "2026-11-15T21:53:04+09:00",
 "files": {
  "metrics": {
   "source": "국토교통부 리츠정보시스템 상장리츠현황 통계 (화면에 공개된 표를 옮겨 적음)",
   "source_url": "https://reits.molit.go.kr/pub/chart/chartSearch02_6?pmn=80",
   "as_of": "2026-11-14",
   "fetched_at": "2026-11-15T21:50:40+09:00",
   "count": 23,
   "note": "기준일은 화면을 조회한 날짜. 배당수익률·연환산배당률은 자본금 기준(배당액÷평균 납입자본금)이며 현재 주가 기준이 아님. P/NAV·P/FFO 는 결산월 말일 주가 기준 원자료 그대로. WALE 0 은 제공되지 않은 값으로 보고 null 처리(원자료는 wale_years_raw)."
  },
  "reits": {
   "source": "국토교통부 리츠정보시스템 + 한국거래소 KIND 상장법인목록",
   "source_url": "https://reits.molit.go.kr/pub/chart/chartSearch02_6?pmn=80",
   "as_of": "2026-11-15",
   "fetched_at": "2026-11-15T21:50:40+09:00",
   "count": 23,
   "note": "상장 리츠 목록은 리츠정보시스템 화면, 종목코드는 KIND 상장법인목록에서 이름이 같은 회사."
  },
  "assets": {
   "source": "국토교통부 리츠정보시스템 GIS 지도",
   "source_url": "https://reits.molit.go.kr/pub/gis/gisMapSearch?pmn=70",
   "as_of": "2026-11-15",
   "fetched_at": "2026-11-15T21:50:40+09:00",
   "count": 53,
   "note": "리츠가 직접 가진 건물만 있음(자회사 리츠를 통해 가진 건물, 해외 건물은 없음). 좌표는 리츠정보시스템 GIS 지도에 표시된 위치. 주소가 없는 건물은 좌표도 없음."
  },
  "prices": {
   "source": "야후 파이낸스 (비공식 · 거래소 시세 지연 제공)",
   "source_url": "https://finance.yahoo.com",
   "as_of": "2026-11-13",
   "fetched_at": "2026-11-15T21:53:04+09:00",
   "count": 33,
   "note": "공식 API 키가 없어 임시로 쓰는 출처. 종가는 마지막 거래일 값(실시간 아님). 시가총액 = 종가 × 발행 주식 수(재무자료 기준, 기준일은 listed_shares_date). 리츠 ETF는 아직 없음. 해외 리츠 10개는 S&P 500 구성 종목 중 리츠(위키백과 목록의 GICS 소분류 기준 28개)에서 시가총액이 큰 순서로 고름. 원화 값은 달러 값 × 환율 1,336.20원(2026-11-15, 야후 파이낸스). 해외 리츠의 위치는 건물이 아니라 본사가 있는 도시(위키백과 목록)이고, 좌표는 OpenStreetMap 기준."
  },
  "dividends": {
   "source": "야후 파이낸스 (비공식 · 거래소 시세 지연 제공)",
   "source_url": "https://finance.yahoo.com",
   "as_of": "2026-11-15",
   "fetched_at": "2026-11-15T21:53:04+09:00",
   "count": 33,
   "note": "공식 API 키가 없어 임시로 쓰는 출처. 최근 1년 배당 건수가 리츠정보시스템의 결산 횟수와 같을 때만 합계를 냄. 과거 지급 실적이며 앞으로의 배당을 뜻하지 않음."
  },
  "savings": {
   "source": "금융감독원 금융상품한눈에 적금 비교 화면 (은행·12개월·정액적립식·가입제한 없음으로 검색한 표를 옮겨 적음)",
   "source_url": "https://finlife.fss.or.kr/finlife/svings/fdrmEnty/list.do?menuNo=700003",
   "as_of": "2026-11-15",
   "fetched_at": "2026-11-15T21:53:04+09:00",
   "count": 17,
   "note": "기준일은 화면을 조회한 날짜. 은행·12개월·정액적립식·가입제한 없음 상품만. 금리는 세전, 최고 우대금리는 우대조건을 모두 채웠을 때. 우대조건 내용은 담지 못함."
  },
  "history": {
   "source": "야후 파이낸스 (비공식 · 거래소 시세 지연 제공)",
   "source_url": "https://finance.yahoo.com",
   "as_of": "2026-11-13",
   "fetched_at": "2026-11-15T21:53:04+09:00",
   "count": 33,
   "note": "최근 1년 종가 기록(그래프용). 며칠 간격으로 솎아 낸 값이고, 해외 리츠는 달러 기준."
  }
 }
}
<<<END FILE>>>
