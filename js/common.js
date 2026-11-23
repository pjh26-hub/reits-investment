/* ==========================================================================
   js/common.js — 모든 페이지가 같이 쓰는 공통 함수 (팀장만 수정)

   쓰는 법: 모든 함수는 Common. 으로 시작한다.  예) Common.formatWon(5800)
   각 페이지는 맨 처음에 Common.initPage(...) 를 한 번 부른다.

   [함수 목록]
   페이지 준비   initPage, renderHeader, renderFooter
   데이터        loadData, loadAll, findById, buildProducts
   숫자 포맷     formatNumber, formatWon, formatPercent, formatDate, formatDateTime
   시세 기준     formatPriceBasis("2026.11.23 14:30 현재가" / "2026.11.21 종가"), priceKindLabel, metaForPrices
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

  // 커피 가격은 data/assumptions.json 에서 가져온다. 받기 전이나 실패한 경우 null.
  var COFFEE = { price: null, label: NA, source: NA, as_of: null };

  var DISCLAIMER = "본 사이트는 대학 수업 과제용이며 투자 권유가 아닙니다. 리츠·ETF는 원금 손실이 발생할 수 있습니다.";
  var CARD_DISCLAIMER = "수업 과제용 · 투자 권유 아님 · 리츠·ETF는 원금 손실 가능";

  // 투자광고에 쓰면 안 되는 표현 (CONVENTIONS.md 6장)
  var BANNED_WORDS = ["보장", "무조건", "확정", "원금 보장", "대박", "100%", "안전한 투자", "절대", "추천"];

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
    prices: "야후 파이낸스 (비공식)", dividends: "야후 파이낸스 (비공식)",
    history: "야후 파이낸스 (비공식)", savings: "금융감독원 금융상품한눈에",
    assumptions: "커피 한 잔 가격 (과거 기준 가정)",
    global_properties: "해외 리츠 대표 자산 (각 리츠·운영사 공개 자료)"
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
  // 자동 갱신 파일을 못 읽었을 때 대신 읽을 저장본 (data/prices_fallback.json = 2026-11-13 종가)
  var FALLBACK_FILES = { prices: "prices_fallback" };

  function fetchJson(name) {
    return fetch("data/" + name + ".json", { cache: "no-cache" })
      .then(function (res) { return res.ok ? res.json() : null; })
      .catch(function () { return null; });
  }

  /**
   * data/이름.json 을 읽는다. 파일이 없거나 실패하면 null (화면은 "데이터 없음"으로 처리)
   * prices 는 GitHub Actions 가 자동으로 고치는 파일이라, 못 읽거나 items 가 비어 있으면
   * 저장본(prices_fallback)을 대신 읽고 isFallback: true 를 붙인다.
   */
  function loadData(name) {
    if (cache[name]) { return cache[name]; }
    cache[name] = fetchJson(name).then(function (data) {
      var backup = FALLBACK_FILES[name];
      if (!backup || (data && Array.isArray(data.items) && data.items.length)) { return data; }
      return fetchJson(backup).then(function (saved) {
        if (saved) { saved.isFallback = true; }
        return saved || data;
      });
    });
    return cache[name];
  }

  /** 생활비 가정 데이터가 유효할 때만 공통 COFFEE 에 반영한다. */
  function applyAssumptions(data) {
    var coffee = data && data.coffee;
    COFFEE.price = coffee && isNum(coffee.price) && coffee.price > 0 ? coffee.price : null;
    COFFEE.label = coffee && typeof coffee.label === "string" && coffee.label.trim() ? coffee.label : NA;
    COFFEE.source = coffee && typeof coffee.source === "string" && coffee.source.trim() ? coffee.source : NA;
    COFFEE.as_of = coffee && typeof coffee.as_of === "string" && /^\d{4}-\d{2}-\d{2}$/.test(coffee.as_of)
      ? coffee.as_of : null;
    return COFFEE;
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
          priceKind: null, priceTime: null, yearlyChangePct: null, dpsAnnualLocal: null,
          hq: null, hqLat: null, hqLng: null, hqNote: null,
          properties: [],                // 해외 리츠의 대표 보유 자산 (data/global_properties.json)
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
      // 자동 갱신(scripts/update_prices.py)이 넣는 price·dailyChangePct 를 먼저 쓰고, 없으면 예전 이름(close·change_pct)
      p.price = isNum(row.price) ? row.price : (isNum(row.close) ? row.close : null);   // 원화(해외 리츠는 환산한 값)
      p.priceDate = row.base_date || null;
      p.priceKind = row.price_kind === "현재가" ? "현재가" : "종가";                       // 예전 파일은 모두 종가
      p.priceTime = row.price_kind === "현재가" && row.price_time ? row.price_time : null;
      p.changePct = isNum(row.dailyChangePct) ? row.dailyChangePct : (isNum(row.change_pct) ? row.change_pct : null);
      p.yearlyChangePct = isNum(row.yearlyChangePct) ? row.yearlyChangePct : null;
      p.priceLocal = isNum(row.price_local) ? row.price_local : (isNum(row.close_local) ? row.close_local : null);  // 해외 리츠의 현지 통화 가격
      p.currency = row.currency || "KRW";
      p.country = row.country || null;
      if (kind === "global") {
        p.assetType = row.sub_industry || null;
        p.hq = row.hq || null;                                       // 본사가 있는 도시
        p.hqLat = isNum(row.hq_lat) ? row.hq_lat : null;
        p.hqLng = isNum(row.hq_lng) ? row.hq_lng : null;
        p.hqNote = row.hq_note || null;                              // 본사 이전 같은 안내 (있을 때만)
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
      byKey[d.id].dpsAnnualLocal = isNum(d.dps_annual_local) ? d.dps_annual_local : null;   // 해외 리츠: 달러
      byKey[d.id].dpsBasis = d.dps_basis || null;
    });

    itemsOf(data.history).forEach(function (h) {
      if (h.id && byKey[h.id] && Array.isArray(h.points) && h.points.length > 1) { byKey[h.id].history = h.points; }
    });

    // 해외 리츠의 대표 보유 자산: 좌표가 숫자인 것만 쓴다 (없으면 지도에 찍지 않는다)
    itemsOf(data.global_properties).forEach(function (g) {
      if (!g.id || !byKey[g.id] || !Array.isArray(g.properties)) { return; }
      byKey[g.id].properties = g.properties.filter(function (a) { return a && a.name && isNum(a.lat) && isNum(a.lng); });
    });

    products.forEach(function (p) {
      // 해외 리츠는 달러 배당 ÷ 달러 가격으로 계산한다 (배당을 받은 날과 오늘의 환율이 달라서 생기는 오차를 없앤다)
      p.priceYield = p.type === "global" && isNum(p.dpsAnnualLocal) && isNum(p.priceLocal)
        ? calcPriceYield(p.dpsAnnualLocal, p.priceLocal)
        : calcPriceYield(p.dpsAnnual, p.price);
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
    // 가로 위치는 날짜로 정한다. (옛 기록은 며칠 간격, 자동 갱신 뒤로는 매일이라 점 순서로 놓으면 최근이 늘어나 보임)
    // 날짜를 못 읽으면 예전처럼 점 순서로 놓는다
    var times = list.map(function (p) { return Date.parse(p[0]); });
    var byDate = times.every(isFinite) && times[times.length - 1] > times[0];
    var t0 = times[0];
    var tSpan = times[times.length - 1] - t0;
    var line = values.map(function (value, i) {
      var ratio = byDate ? (times[i] - t0) / tSpan : i / (values.length - 1);
      return (ratio * width).toFixed(1) + "," + y(value);
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

  /** "2026-11-23T14:30:05+09:00" → "2026.11.23 14:30" (한국 시간 그대로). 모양이 다르면 "" */
  function formatDateTime(text) {
    var m = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})/.exec(String(text || ""));
    return m ? m[1] + "." + m[2] + "." + m[3] + " " + m[4] + ":" + m[5] : "";
  }

  /** 가격이 종가인지 장중 현재가인지 → "종가" | "현재가" */
  function priceKindLabel(p) {
    return p && p.priceKind === "현재가" ? "현재가" : "종가";
  }

  /**
   * 가격 기준 문구. 장중: "2026.11.23 14:30 현재가", 장 마감 뒤·예전 파일: "2026.11.21 종가". 날짜가 없으면 ""
   * 현재가는 30분 간격으로 받은 값이라 실시간이 아니다.
   */
  function formatPriceBasis(p) {
    if (!p || !p.priceDate) { return ""; }
    var time = p.priceKind === "현재가" ? formatDateTime(p.priceTime) : "";
    return time ? time + " 현재가" : formatDate(p.priceDate) + " 종가";
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
    var cups = isNum(coffee) && coffee > 0 && isNum(firstYear) ? Math.floor(firstYear / coffee) : null;
    var man = monthly / 10000;
    var monthlyText = (man === Math.floor(man) ? man : man.toFixed(1)) + "만 원";
    var caution = yieldPct >= YIELD_CAUTION_PCT
      ? "배당수익률이 유난히 높아요(" + YIELD_CAUTION_PCT + "% 이상). 주가가 많이 내렸거나, 건물을 팔아서 준 한 번뿐인 배당이 섞였을 수 있어요. 앞으로도 이만큼 준다는 뜻이 아니에요."
      : null;
    return {
      caution: caution,
      text: "매달 " + monthlyText + "씩 1년 모으면 그 1년 배당은 약 " + formatWon(firstYear) +
        (cups === null ? " (커피값 " + NA + ")" : " (커피 " + cups + "잔)"),
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

  /**
   * 시세 저장본(prices_fallback)을 쓰는 중이면, 꼬리말의 시세 출처·기준일도 저장본 것으로 바꾼 meta 를 돌려준다.
   * (meta.json 은 자동 갱신으로 최신 날짜인데 화면 가격은 저장본이면 서로 안 맞기 때문)
   */
  function metaForPrices(meta, prices) {
    if (!prices || !prices.isFallback) { return meta; }
    var copy = { files: {} };
    var files = (meta && meta.files) || {};
    Object.keys(files).forEach(function (key) { copy.files[key] = files[key]; });
    copy.files.prices = { source: (prices.source || SOURCE_LABELS.prices) + " · 저장본", as_of: prices.as_of || null };
    return copy;
  }

  /** 고지 문구 + 이 페이지가 쓴 데이터의 출처·기준일을 넣는다 */
  function renderFooter(sourceKeys) {
    var el = document.getElementById("site-footer");
    if (!el) { return Promise.resolve(); }
    el.className = "site-footer";
    var needPrices = (sourceKeys || []).indexOf("prices") !== -1;
    return Promise.all([loadData("meta"), needPrices ? loadData("prices") : null]).then(function (loaded) {
      var meta = metaForPrices(loaded[0], loaded[1]);
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
    COFFEE: COFFEE, applyAssumptions: applyAssumptions,
    MONTHLY_DEFAULT: MONTHLY_DEFAULT, formatUsd: formatUsd, formatChange: formatChange,
    sparkline: sparkline,
    TARGETS: TARGETS, BANNED_WORDS: BANNED_WORDS, DISCLAIMER: DISCLAIMER,
    initPage: initPage, renderHeader: renderHeader, renderFooter: renderFooter,
    loadData: loadData, loadAll: loadAll, findById: findById, buildProducts: buildProducts,
    formatNumber: formatNumber, formatWon: formatWon, formatPercent: formatPercent, formatDate: formatDate,
    formatDateTime: formatDateTime, formatPriceBasis: formatPriceBasis, priceKindLabel: priceKindLabel,
    metaForPrices: metaForPrices,
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
