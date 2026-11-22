# 커피값 건물주 ☕🏢

**2030을 위한 리츠(REITs) 타깃 마케팅 웹사이트** — 대학 '부동산 프롭테크' 수업 팀 과제 (주제: 부동산 마케팅)

> 본 사이트는 대학 수업 과제용이며 투자 권유가 아닙니다. 리츠·ETF는 원금 손실이 발생할 수 있습니다.

---

## 무엇을 만드나

- **문제**: 리츠 정보 사이트는 많지만 전부 리츠를 이미 아는 투자자용이다. 2030은 리츠 자체를 모른다.
- **해결**: 같은 데이터를 "내 얘기"로 번역해 주는 마케팅 플랫폼.
- **타깃**: 대학생 · 사회초년생 · 월세 사는 1인가구

| 차별점 | 내용 |
|---|---|
| 1. 장소에서 상품으로 | 종목 검색이 아니라 "내가 자주 가는 곳"에서 시작해서, 그 근처에 리츠가 가진 건물을 보여준다 |
| 2. 숫자를 생활 언어로 | P/NAV · WALE · 배당률을 일상 표현으로 바꾸고, 적금과 정직하게 비교한다(장점과 위험 둘 다) |
| 3. 타깃별 홍보 카드 | 같은 리츠라도 타깃마다 다른 메시지로 인스타 카드를 만들고, 투자광고 금지 표현은 자동으로 걸러낸다 |

## 페이지

| 파일 | 내용 | 우선순위 | 담당 |
|---|---|---|---|
| `map.html` | 장소에서 리츠로 (지도) | P1 | 팀원 (ChatGPT) |
| `compare.html` | 비교 + 생활 언어 번역 (맨 오른쪽은 항상 은행 적금) | P1 | 팀장 (Claude Code) |
| `index.html` | 첫 화면 + 타깃 선택 | P2 | 팀장 (Claude Code) |
| `card.html` | 타깃별 홍보 카드 생성기 (1080×1080 PNG) | P3 | 팀원 (ChatGPT) |

## 구조

```
공식 API · 엑셀 ──▶ scripts/*.py ──▶ data/*.json ──▶ HTML/CSS/JS 화면 ──▶ GitHub Pages
                     (파이썬)         (git에 커밋)      (JSON만 읽음)
```

- 프론트는 **순수 HTML/CSS/JavaScript**만 (프레임워크·빌드 도구 없음)
- 화면은 `data/*.json`만 읽는다 → 팀원은 API 키 없이도 화면을 만들 수 있다
- 지도를 뺀 모든 화면은 인터넷이 불안정해도 작동한다
- 비밀 API 키는 `.env`에만 (깃허브에 올라가지 않음)

폴더 구조와 파일별 담당자는 [CONVENTIONS.md](CONVENTIONS.md) 2장에 있습니다.

## 문서

| 문서 | 누가 읽나 |
|---|---|
| [CONVENTIONS.md](CONVENTIONS.md) | 모두 (사람 + Claude Code + ChatGPT). 단 하나의 규칙 문서 |
| [TEAM_GUIDE.md](TEAM_GUIDE.md) | 팀원. 설치부터 ChatGPT 시작 프롬프트까지 |
| [data/raw/README.md](data/raw/README.md) | 엑셀 원본을 넣는 방법 |

## 데이터 출처

교수님 방침: **가상 데이터 금지.** 모든 수치는 아래 공식 출처의 실제 값이고, 화면마다 출처와 기준일을 표시합니다. 값이 없으면 "데이터 없음"으로 표시합니다.

| # | 데이터 | 출처 | 받는 방법 | 결과 파일 |
|---|---|---|---|---|
| 1 | 리츠 기본현황 · 보유 자산 | 국토교통부 리츠정보 API ([공공데이터포털 15139797](https://www.data.go.kr/data/15139797/openapi.do)) | API | `reits.json`, `assets.json` |
| 2 | 상장리츠 지표 (배당수익률, NAV, FFO, WALE, P/NAV, P/FFO) | [리츠정보시스템 상장리츠현황 통계](https://reits.molit.go.kr/pub/chart/chartSearch02_6?pmn=80) | 엑셀 직접 다운로드 → `data/raw/` | `metrics.json` |
| 3 | 상장 리츠 전일 종가 | 금융위원회 주식시세정보 API ([공공데이터포털 15094808](https://www.data.go.kr/data/15094808/openapi.do)) | API | `prices.json` |
| 4 | 리츠 ETF 전일 종가 | 금융위원회 증권상품시세정보 API ([공공데이터포털 15094806](https://www.data.go.kr/data/15094806/openapi.do)) | API | `prices.json` |
| 5 | 주당배당금 | [OpenDART](https://opendart.fss.or.kr) "배당에 관한 사항" | API | `dividends.json` |
| 6 | 은행 예금·적금 금리 | [금융감독원 금융상품한눈에](https://finlife.fss.or.kr) Open API | API | `savings.json` |
| 7 | 건물 주소 → 좌표 | [행정안전부 주소기반산업지원서비스](https://business.juso.go.kr/jst/jstAddressApiList) 도로명주소 검색 API + 좌표제공 검색 API | API | `assets.json`의 `lat`, `lng` |
| 8 | 지도 · 장소 검색 | [카카오맵](https://developers.kakao.com) | 화면에서 실시간 호출 (**저장 안 함**) | — |
| 9 | (선택) 실시간 시세 | [한국투자증권 KIS Developers](https://apiportal.koreainvestment.com) | 발표자 노트북 로컬 서버 (**공개 배포 안 함**) | — |

각 데이터의 정확한 출처·기준일은 `data/meta.json`에 기록됩니다.

### 공식 문서에서 확인한 사실 (2026-11-14)

스크립트는 아래 공식 명세를 보고 짰습니다. **실제 응답으로는 아직 검증하지 못했습니다**(API 키가 없었음). 키를 넣고 처음 돌릴 때 각 스크립트에 `--peek`를 붙이면 원본 응답 1건을 그대로 보여줍니다.

| API | 호출 주소 / 기능 | 확인한 곳 |
|---|---|---|
| 리츠 목록 | `https://apis.data.go.kr/1613000/ReitsService/ReitsInfo/getReitsCmpnyList` | 공공데이터포털 15139797 명세 |
| 리츠별 투자대상 | `.../ReitsInfo/getReitsInvtTrgtList` (`reitsNo` 필수) | 〃 |
| 주식시세 | `https://apis.data.go.kr/1160100/GetStockSecuritiesInfoService_V2/getStockPriceInfo_V2` | 공공데이터포털 15094808 명세 |
| ETF시세 | `https://apis.data.go.kr/1160100/GetSecuritiesProductInfoService_V2/getETFPriceInfo_V2` | 공공데이터포털 15094806 명세 |
| DART 고유번호 | `https://opendart.fss.or.kr/api/corpCode.xml` (ZIP) | OpenDART 개발가이드 |
| DART 배당 | `https://opendart.fss.or.kr/api/alotMatter.json` (2015년 이후 제공) | OpenDART 개발가이드 |
| 정기예금·적금 | `finlife.fss.or.kr/finlifeapi/depositProductsSearch.json`, `savingProductsSearch.json` | 금융상품한눈에 API 명세 |
| 주소 → 건물 코드 | `https://business.juso.go.kr/addrlink/addrLinkApi.do` | 주소기반산업지원서비스 API 상세 페이지 |
| 건물 코드 → 좌표 | `https://business.juso.go.kr/addrlink/addrCoordApi.do` | 〃 (견본 응답으로 모양·좌표계 확인) |

알아둘 점:

- 주식시세·ETF시세는 주소와 기능 이름 끝에 **`_V2`**가 붙는다.
- 금융위원회 시세 2종은 실시간이 아니다: 기준일의 **다음 영업일 오후 1시 이후** 갱신. 안내 페이지에 이용 조건(출처 표시, 상업적 이용 금지, 변경 금지)이 적혀 있어서 값은 가공 없이 그대로 쓰고 출처를 표시한다.
- 국토부 리츠 API에는 **종목코드가 없다.** 그래서 종목명(금융위 시세)과 회사명(DART)으로 종목코드를 찾고, 못 찾은 리츠는 `scripts/manual_ids.json`에 손으로 적는다.
- 리츠정보시스템 상장리츠현황에는 2026-11-14 기준 상장 리츠 23개가 보인다. 화면의 **P/NAV·P/FFO는 0.0079처럼 아주 작은 값**이다(주가(원) ÷ NAV(백만원)로 보임). **WALE은 0으로 적힌 리츠가 많다.**
- 브이월드 지오코더 안내 페이지에 **"별도의 저장장치나 데이터베이스에 저장할 수 없습니다"**라는 문구가 있다. 그래서 좌표 출처를 행정안전부 주소 API로 바꿨다(아래 '좌표 출처 조사').

### 좌표 출처 조사 (2026-11-14)

자산 좌표는 `assets.json`에 저장해야 하므로, "저장 금지" 문구가 없는 출처를 찾았다.

| 후보 | 저장 관련 문구 | 준비물 | 비고 |
|---|---|---|---|
| 브이월드 지오코더 (국토교통부) | **저장 금지 문구 있음** (브이월드 레퍼런스, 공공데이터포털 15101106 설명) | 키 1개 | 원래 계획 |
| **행정안전부 주소 API** (도로명주소 검색 API + 좌표제공 검색 API) | 금지 문구를 **찾지 못함** (API 상세 페이지, [공공데이터포털 15056663](https://www.data.go.kr/data/15056663/openapi.do), [주소정보누리집 이용약관](https://www.juso.go.kr/Terms)) | 승인키 2개 ([주소기반산업지원서비스](https://business.juso.go.kr/jst/jstAddressApiList)에서 API마다 따로 신청) | 주소 → 건물 코드 → 좌표, 두 번 호출. 좌표계 변환 필요 |
| 행정안전부 위치정보요약DB 내려받기 | 내려받아 보관하는 DB 형태 | 신청 후 내려받기 | 전국 자료라 용량이 큼 |
| 지도 화면에서 그때그때 변환 (카카오) | 저장을 안 하므로 문제없음 | 카카오 JavaScript 키 | 지도를 열 때마다 자산 수만큼 호출 → 느리고 발표 때 불안정 |

- 행정안전부 쪽은 "저장해도 된다"는 명시 문구를 찾은 것이 아니라 **금지 문구가 없다**는 것이다. 이용약관 제15조에는 사이트의 정보 등을 승인 없이 수정·판매·배포·상업적으로 이용할 수 없다는 일반 조항이 있다. 확실히 하려면 도로명주소 도움센터(사이트 하단 대표전화)에 문의한다.
- 공공데이터포털의 "이용허락범위 제한 없음" 표시는 브이월드 지오코더에도 똑같이 붙어 있어서, 이 표시만으로는 판단할 수 없다.
- 확인한 호출 주소: `https://business.juso.go.kr/addrlink/addrLinkApi.do` (검색: `confmKey`, `currentPage`, `countPerPage`, `keyword`, `resultType` → `admCd`, `rnMgtSn`, `udrtYn`, `buldMnnm`, `buldSlno`), `https://business.juso.go.kr/addrlink/addrCoordApi.do` (좌표: 앞의 5개 값 + `confmKey` → `entX`, `entY`). 두 API의 승인키는 서로 다르다.
- 좌표계: `entX`/`entY`는 **UTM-K(EPSG:5179)** 좌표다. 공식 예제의 시험용 키로 받은 견본 응답(서울 마포구 건물)을 위도·경도로 바꿔 보니 실제 위치와 맞았다. `geocode_assets.py`가 위도·경도로 계산해서 저장하며, 이 계산은 표준 라이브러리(pyproj)와 1mm 이내로 일치하는 것을 확인했다.
- 시험용 키(`TESTJUSOGOKR`)는 무엇을 검색해도 견본 결과만 돌려준다. 실제 변환에는 발급받은 승인키 2개가 필요하다.
- **결정(2026-11-14): 행정안전부 주소 API를 쓴다.** `geocode_assets.py`를 이 기준으로 바꿨다.

### 팀이 결정해야 하는 것

- [x] 좌표 출처 → 행정안전부 주소 API (확실히 하려면 도움센터에 저장·공개 가능 여부 문의)
- [ ] 생활 언어 번역에 쓸 P/NAV를 어떻게 구할지 (예: 시가총액 ÷ NAV를 직접 계산하고 계산식을 화면에 표시)
- [ ] WALE이 0으로 적힌 리츠를 "데이터 없음"으로 보여줄지 (지금 스크립트는 그렇게 처리)
- [ ] 리츠 ETF 중 어떤 것을 사이트에 넣을지 (`fetch_prices.py`가 후보 목록을 보여줌 → `scripts/etf_confirmed.json`)

## 사용법

### 화면만 보기 (API 키 필요 없음)

HTML 파일을 더블클릭하면 데이터가 안 보입니다. 아래 둘 중 하나로 여세요.

- VS Code **Live Server** 확장: `index.html` 우클릭 → Open with Live Server
- 또는 프로젝트 폴더에서 터미널을 열고:

  ```bash
  python -m http.server 8000
  ```

  그다음 브라우저에서 `http://localhost:8000` 접속

### 데이터 새로 받기 (데이터 담당만)

1. `.env.example`을 복사해서 `.env`를 만들고 API 키를 넣는다
2. 리츠정보시스템에서 받은 엑셀을 `data/raw/`에 넣는다
3. 패키지 설치 (처음 한 번):

   ```bash
   pip install -r requirements.txt
   ```

4. 전체 실행:

   ```bash
   python scripts/build_all.py
   ```

한 단계가 실패해도 나머지는 계속 돌고, 마지막에 성공/실패 표가 나옵니다. 실패한 이유는 한국어로 나옵니다.

| 스크립트 | 만드는 파일 | 필요한 키 | 먼저 있어야 하는 것 |
|---|---|---|---|
| `fetch_reits.py` | `reits.json`, `assets.json` | `DATA_GO_KR_KEY` (+ `DART_API_KEY` 있으면 더 정확) | — |
| `convert_metrics.py` | `metrics.json` | 없음 | `data/raw/`의 엑셀 |
| `fetch_prices.py` | `prices.json` | `DATA_GO_KR_KEY` | `reits.json` |
| `fetch_dividends.py` | `dividends.json` | `DART_API_KEY` | `reits.json` (+ `metrics.json` 있으면 더 정확) |
| `fetch_savings.py` | `savings.json` | `FINLIFE_API_KEY` | — |
| `geocode_assets.py` | `assets.json`의 좌표 | `JUSO_SEARCH_KEY`, `JUSO_COORD_KEY` | `assets.json` |
| `build_all.py` | 위 전부 + `meta.json` | | |

- 하나만 따로 실행: `python scripts/fetch_prices.py`
- 원본 응답 1건 보기(구조 확인): `python scripts/fetch_prices.py --peek`
- `_util.py`는 스크립트들이 같이 쓰는 도구 모음이라 직접 실행하지 않습니다.
- `manual_ids.json`(종목코드 손으로 잇기), `etf_confirmed.json`(확인한 ETF 목록)은 사람이 적는 설정 파일입니다.

## 진행 상황

- [x] **Phase 0** — 폴더 뼈대, 문서 3종, 설정 파일
- [ ] **Phase 1** — 데이터 스크립트 (`scripts/`) → `data/*.json`, `meta.json`
  - [x] 스크립트 8개 작성, 계산 로직 시험, 키가 없을 때 한국어 안내 확인
  - [ ] API 키·엑셀을 넣고 실제 실행 → 응답 구조 검증 → 받은 데이터 요약 (**키가 없어서 아직 못 함**)
- [ ] **Phase 2** — `style.css`, `common.js`, `index.html`
- [ ] **Phase 3** — `compare.html`
- [ ] **Phase 4** — `map.html` · `card.html` 빈 뼈대, CONVENTIONS.md v1.0 → 팀원에게 전달
- [ ] **Phase 5** (선택) — KIS 로컬 실시간 서버 + 비교 화면 "실시간" 배지

## 고지

본 사이트는 대학 수업 과제용이며 투자 권유가 아닙니다. 리츠·ETF는 원금 손실이 발생할 수 있습니다.
