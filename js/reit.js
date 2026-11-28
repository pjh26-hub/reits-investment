/* ==========================================================================
   js/reit.js — 리츠 상세 화면 (reit.html?id=종목코드)

   보여주는 것
     머리                   가격 + 그래프([1개월][3개월][1년], 훑으면 그날 종가), ♥ 관심 리츠
     배당 달력              지난 1년 몇 월에 배당이 나왔나 (data/dividends.json, 배당락일 기준)
     매달 모았다면          지난 1년 실제 종가로 매달 커피값·1만 원·5만 원씩 1주 단위로 모은 기록 (국내 리츠·ETF)
     01 누가 운용하나요     운용사(자산관리회사) 이름·종류·홈페이지, 리츠 홈페이지, 한 줄 소개 (data/reit_profiles.json)
     02 무엇을 가지고 있나요 가진 건물 비율 원 그래프 + 목록 + 작은 지도
          국내: data/assets.json (리츠정보시스템 GIS) 의 연면적으로 비율 계산 (유형별 / 건물별)
          해외: data/global_properties.json 의 대표 자산 + 본사 (비율 자료 없음 → 그래프 대신 안내)
          지도에 건물이 없는 국내 리츠: reit_profiles.json 의 holdings (보도·공시로 확인한 대표 자산)
     03 숫자를 생활 언어로   배당·P/NAV·WALE (Common 번역 함수)
     04 자료 더 보기        증권사 리포트(한경 컨센서스), 공시(DART), 리츠정보시스템, 미국 SEC 공시

   꼭 지킬 것 (HANDOFF_PROMPT.md)
     - 숫자·이름·주소는 data/*.json 에서만 읽는다. 값이 없으면 "데이터 없음".
     - 리포트 PDF 는 저작권이 있어서 이 사이트에 올리지 않고 링크로만 안내한다.
     - innerHTML 에 데이터를 넣을 때는 Common.escapeHtml.
   ========================================================================== */
(function () {
  "use strict";

  var TILE_URL = "https://tile.openstreetmap.org/{z}/{x}/{y}.png";
  var TILE_CREDIT = '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors';
  var HANKYUNG_URL = "https://consensus.hankyung.com/analysis/list";      // 증권사 리포트 목록 (PDF 받기)
  var DART_URL = "https://dart.fss.or.kr/dsab007/main.do";                // 공시 통합검색 (종목코드가 미리 들어감)
  var MOLIT_URL = "https://reits.molit.go.kr/";                           // 국토교통부 리츠정보시스템
  var SEC_URL = "https://www.sec.gov/cgi-bin/browse-edgar";              // 미국 SEC 공시 (티커로 찾기)
  var REPORT_YEARS = 2;                                                   // 리포트 검색 기간: 최근 2년
  var PIE_MAX_SLICES = 6;                                                 // 6칸 넘으면 작은 것은 "기타"로 묶는다
  var PIE_COLORS = ["--chart-1", "--chart-2", "--chart-3", "--chart-4", "--chart-5", "--chart-6"];
  var PIE_OTHER = "--chart-other";

  var state = { product: null, profile: null, assets: [], global: null, mixKind: null, map: null, dividend: null, dividendSource: null };

  function $(id) { return document.getElementById(id); }
  function esc(value) { return Common.escapeHtml(value); }
  function isNum(value) { return typeof value === "number" && isFinite(value); }

  /** 바깥 링크 버튼 (새 창). https/http 로 시작하는 주소만 */
  function linkButton(url, label, ghost) {
    if (!/^https?:\/\//.test(url || "")) { return ""; }
    return '<a class="btn' + (ghost ? " btn-ghost" : "") + '" href="' + esc(url) + '" target="_blank" rel="noopener noreferrer">' + esc(label) + " ↗</a>";
  }

  function kindLabel(p) {
    if (p.type === "etf") { return "리츠 ETF"; }
    if (p.type === "global") { return "해외 리츠" + (p.country ? " · " + p.country : ""); }
    return p.assetType ? "국내 리츠 · " + p.assetType : "국내 리츠";
  }

  // ---------------------------------------------------------------------
  // 머리: 이름, 운용사 한 줄, 상태 경고, 가격·그래프, 버튼
  // ---------------------------------------------------------------------
  function renderHead() {
    var p = state.product;
    var prof = state.profile;
    document.title = p.name + " 자세히 보기 | 리츠 투자";
    $("reit-name").textContent = p.name;
    $("reit-badge").textContent = kindLabel(p);
    $("reit-amc-line").textContent = "운용: " + (prof && prof.amc && prof.amc.name ? prof.amc.name : Common.NA) +
      (p.id ? " · 종목코드 " + p.id : "");
    $("reit-summary").textContent = prof && prof.summary ? prof.summary : "";

    var note = prof && prof.status_note;
    if (note && note.text) {
      $("reit-status").innerHTML = "주의: " + esc(note.text) +
        (note.source ? ' <span class="reit-sources">(' + esc(note.source) + (note.date ? " " + esc(Common.formatDate(note.date)) : "") + ")</span>" : "") +
        (/^https:\/\//.test(note.source_url || "") ? ' <a href="' + esc(note.source_url) + '" target="_blank" rel="noopener noreferrer">기사 보기</a>' : "");
      $("reit-status").classList.remove("is-hidden");
    }

    var change = Common.formatChange(p.changePct);
    $("reit-price").innerHTML = (isNum(p.price) ? esc(Common.formatWon(p.price)) : '<span class="na">' + Common.NA + "</span>") +
      (change.text ? ' <span class="reit-change ' + change.cls + '">' + esc(change.text) + "</span>" : "");
    $("reit-price-sub").textContent = "1주 가격" + (p.priceDate ? " · " + Common.formatPriceBasis(p) + " (실시간 아님)" : "") +
      (p.type === "global" && isNum(p.priceLocal) ? " · " + Common.formatUsd(p.priceLocal) + "를 원으로 바꾼 값" : "");

    renderChart("1y");

    $("reit-actions").innerHTML = '<a class="btn btn-primary" href="compare.html?ids=' + encodeURIComponent(p.key) + '">적금과 비교하기</a>' +
      (p.type !== "etf" ? '<a class="btn btn-ghost" href="map.html">지도에서 찾아보기</a>' : "");
  }

  // ---------------------------------------------------------------------
  // 가격 그래프: [1개월] [3개월] [1년] + 손가락·마우스로 훑으면 그날 종가 (data/history.json)
  // ---------------------------------------------------------------------
  var PERIODS = [{ key: "1m", label: "1개월", months: 1 }, { key: "3m", label: "3개월", months: 3 }, { key: "1y", label: "1년", months: 12 }];
  var CHART_W = 320;
  var CHART_H = 120;
  var CHART_PAD = 8;

  /** "2026-11-26" 에서 months 달 전 날짜 문자열 */
  function monthsBefore(day, months) {
    var d = new Date(day + "T00:00:00");
    d.setMonth(d.getMonth() - months);
    return isoDay(d);
  }

  function validHistory() {
    return (state.product.history || []).filter(function (pt) { return pt && typeof pt[0] === "string" && isNum(pt[1]); });
  }

  /** 해외 리츠 그래프·배당은 달러, 나머지는 원 */
  function money(value) {
    return state.product.type === "global" ? Common.formatUsd(value) : Common.formatWon(value);
  }

  function pctText(pct) {
    return isNum(pct) ? (pct > 0 ? "+" : "") + pct.toFixed(1) + "%" : "";
  }

  function pctClass(pct) {
    return pct > 0 ? "num-up" : (pct < 0 ? "num-down" : "");
  }

  function renderChart(periodKey) {
    var box = $("reit-chart");
    var list = validHistory();
    var last = list.length ? list[list.length - 1][0] : null;
    var options = PERIODS.map(function (per) {
      var from = last ? monthsBefore(last, per.months) : null;
      return { per: per, pts: list.filter(function (pt) { return from && pt[0] >= from; }) };
    });
    var usable = options.filter(function (o) { return o.pts.length >= 2; });
    if (!usable.length) {
      box.innerHTML = '<p class="source-note">최근 1년 주가 기록: ' + Common.NA + "</p>";
      return;
    }
    var current = options.filter(function (o) { return o.per.key === periodKey && o.pts.length >= 2; })[0] || usable[usable.length - 1];
    var pts = current.pts;
    var values = pts.map(function (pt) { return pt[1]; });
    var min = Math.min.apply(null, values);
    var max = Math.max.apply(null, values);
    var times = pts.map(function (pt) { return Date.parse(pt[0]); });
    var t0 = times[0];
    var span = (times[times.length - 1] - t0) || 1;
    function x(i) { return (times[i] - t0) / span * CHART_W; }
    function y(v) { return CHART_PAD + (max - v) / ((max - min) || 1) * (CHART_H - CHART_PAD * 2); }
    var first = values[0];
    var lastValue = values[values.length - 1];
    var periodPct = first > 0 ? (lastValue - first) / first * 100 : null;
    var line = pts.map(function (pt, i) { return x(i).toFixed(1) + "," + y(pt[1]).toFixed(1); }).join(" ");

    box.innerHTML =
      '<div class="chip-row reit-period" role="group" aria-label="그래프 기간">' + options.map(function (o) {
        var on = o.per.key === current.per.key;
        return '<button type="button" class="chip' + (on ? " is-active" : "") + '" data-period="' + o.per.key + '" aria-pressed="' + on + '"' +
          (o.pts.length < 2 ? " disabled" : "") + ">" + o.per.label + "</button>";
      }).join("") + "</div>" +
      '<p class="reit-readout" id="reit-readout" aria-live="polite"></p>' +
      '<div class="reit-plot" id="reit-plot">' +
        '<svg class="spark ' + pctClass(lastValue - first) + '" viewBox="0 0 ' + CHART_W + " " + CHART_H + '" preserveAspectRatio="none" role="img" aria-label="' +
          esc(current.per.label + " 주가 흐름 " + Common.formatDate(pts[0][0]) + "부터 " + Common.formatDate(pts[pts.length - 1][0]) + "까지 " + pctText(periodPct)) + '">' +
          '<line class="spark-base" x1="0" x2="' + CHART_W + '" y1="' + y(first).toFixed(1) + '" y2="' + y(first).toFixed(1) + '"></line>' +
          '<polyline class="spark-line" points="' + line + '"></polyline></svg>' +
        '<span class="reit-cursor is-hidden" id="reit-cursor"></span><span class="reit-dot is-hidden" id="reit-dot"></span>' +
      "</div>" +
      '<p class="spark-caption">그래프를 손가락이나 마우스로 훑으면 그날 종가가 보여요' + (state.product.type === "global" ? " (달러 기준)" : "") + "</p>";

    var readout = $("reit-readout");
    var plot = $("reit-plot");
    var cursor = $("reit-cursor");
    var dot = $("reit-dot");
    function showDefault() {
      cursor.classList.add("is-hidden");
      dot.classList.add("is-hidden");
      readout.innerHTML = esc(current.per.label) + ' 동안 <b class="' + pctClass(periodPct) + '">' + esc(pctText(periodPct)) + "</b>" +
        '<span class="reit-readout-sub">' + esc(Common.formatDate(pts[0][0]) + " " + money(first) + " → " + Common.formatDate(pts[pts.length - 1][0]) + " " + money(lastValue)) + "</span>";
    }
    function showAt(clientX) {
      var rect = plot.getBoundingClientRect();
      if (!rect.width) { return; }
      var target = t0 + Math.max(0, Math.min(1, (clientX - rect.left) / rect.width)) * span;
      var best = 0;
      times.forEach(function (t, i) { if (Math.abs(t - target) < Math.abs(times[best] - target)) { best = i; } });
      var v = values[best];
      var fromStart = first > 0 ? (v - first) / first * 100 : null;
      cursor.style.left = (x(best) / CHART_W * 100) + "%";
      dot.style.left = (x(best) / CHART_W * 100) + "%";
      dot.style.top = (y(v) / CHART_H * 100) + "%";
      cursor.classList.remove("is-hidden");
      dot.classList.remove("is-hidden");
      readout.innerHTML = esc(Common.formatDate(pts[best][0])) + " 종가 <b>" + esc(money(v)) + "</b>" +
        '<span class="reit-readout-sub">' + esc(current.per.label) + ' 처음보다 <span class="' + pctClass(fromStart) + '">' + esc(pctText(fromStart)) + "</span></span>";
    }
    plot.addEventListener("pointermove", function (e) { showAt(e.clientX); });
    plot.addEventListener("pointerdown", function (e) { showAt(e.clientX); });
    plot.addEventListener("pointerleave", showDefault);
    plot.addEventListener("pointercancel", showDefault);
    showDefault();
  }

  // ---------------------------------------------------------------------
  // 배당 달력: 지난 1년 동안 몇 월에 배당이 나왔나 (data/dividends.json 의 periods, 배당락일 기준)
  // ---------------------------------------------------------------------
  function dividendPeriods() {
    return ((state.dividend && state.dividend.periods) || []).filter(function (d) {
      return d && /^\d{4}-\d{2}-\d{2}$/.test(d.period_end || "") && isNum(d.dps);
    }).sort(function (a, b) { return a.period_end < b.period_end ? -1 : 1; });
  }

  var SPECIAL_SHARE = 0.2;   // 1주당 배당이 직전 종가의 20%를 넘으면 평소와 다른 특별 분배로 표시

  /** 배당락일 직전 종가 대비 비율 (주가 기록이 없으면 null) */
  function dividendShare(d) {
    var before = validHistory().filter(function (pt) { return pt[0] < d.period_end; });
    var price = before.length ? before[before.length - 1][1] : null;
    return isNum(price) && price > 0 ? { price: price, share: d.dps / price } : null;
  }

  function dividendWord() {
    return state.product.type === "etf" ? "분배금" : "배당";
  }

  function renderDividends() {
    var p = state.product;
    var word = dividendWord();
    var all = dividendPeriods();
    var end = p.priceDate || isoDay(new Date());
    var start = monthsBefore(end, 12);
    var recent = all.filter(function (d) { return d.period_end > start && d.period_end <= end; });
    var byMonth = {};
    recent.forEach(function (d) {
      var m = Number(d.period_end.slice(5, 7));
      byMonth[m] = (byMonth[m] || []).concat(d);
    });
    var months = Object.keys(byMonth).map(Number).sort(function (a, b) { return a - b; });
    var total = recent.reduce(function (s, d) { return s + d.dps; }, 0);
    var basis = (recent[0] || all[0] || {}).from || "";

    var summary;
    if (!all.length) {
      summary = word + " 기록: " + Common.NA;
    } else if (!recent.length) {
      summary = "지난 1년(" + Common.formatDate(start) + "~" + Common.formatDate(end) + ") 동안 " + word + " 기록이 없어요.";
    } else {
      summary = "지난 1년 동안 " + months.join("·") + "월에 " + word + "이 나왔어요. " + recent.length + "번, 1주당 합계 " + money(total) + ".";
    }
    var grid = "";
    for (var m = 1; m <= 12; m += 1) {
      var hits = byMonth[m] || [];
      grid += '<div class="reit-cal-cell' + (hits.length ? " is-on" : "") + '"><span class="reit-cal-month">' + m + "월</span>" +
        (hits.length ? '<span class="reit-cal-amount">' + esc(hits.map(function (d) { return money(d.dps); }).join(" + ")) + "</span>" : "") + "</div>";
    }
    var specials = recent.filter(function (d) { var r = dividendShare(d); return r && r.share > SPECIAL_SHARE; });
    $("reit-div").innerHTML =
      '<p class="reit-div-summary">' + esc(summary) + "</p>" +
      specials.map(function (d) {
        var r = dividendShare(d);
        return '<p class="caution-note">' + esc(Common.formatDate(d.period_end)) + " " + esc(word) + " " + esc(money(d.dps)) + "은 직전 종가(" + esc(money(r.price)) +
          ")의 " + Math.round(r.share * 100) + "%로, 평소와 다른 특별 분배예요. 이유는 공시에서 확인해 주세요.</p>";
      }).join("") +
      (all.length ? '<div class="reit-cal" role="list" aria-label="' + esc(word) + ' 달력">' + grid + "</div>" : "") +
      (recent.length ? '<ul class="reit-div-list">' + recent.slice().reverse().map(function (d) {
        return "<li>" + esc(Common.formatDate(d.period_end)) + " · 1주당 " + esc(money(d.dps)) + "</li>";
      }).join("") + "</ul>" : "");
    $("reit-div-note").textContent = all.length
      ? "날짜는 " + (basis || "배당락일 기준") + "이에요. 이 날짜 전까지 주식을 가지고 있어야 " + word + "을 받고, 돈이 실제로 들어오는 날(지급일)은 이보다 늦어요. " +
        "지난 기록이라 앞으로도 같은 달·같은 금액이 나온다는 뜻은 아니에요. 금액은 세금 떼기 전이에요." +
        (p.type === "global" ? " 해외 리츠는 달러 금액이에요." : "") + " 출처: " + ((state.dividendSource) || Common.NA) + "."
      : "";
    $("reit-div-sec").classList.remove("is-hidden");
  }

  // ---------------------------------------------------------------------
  // 매달 커피값으로 모았다면: 지난 1년 실제 종가로, 매달 첫 기록일에 정한 돈만큼 1주 단위로 산 기록
  //   남은 돈은 다음 달로 넘기고, 배당은 배당락일 전에 가진 주식 수 × 1주당 배당 (세전)
  // ---------------------------------------------------------------------
  function simAmounts() {
    var list = [];
    if (isNum(Common.COFFEE.price) && Common.COFFEE.price > 0) {
      list.push({ key: "coffee", label: "커피 1잔 " + Common.formatWon(Common.COFFEE.price), value: Common.COFFEE.price });
    }
    list.push({ key: "10k", label: "1만 원", value: 10000 });
    list.push({ key: "monthly", label: Common.formatNumber(Common.MONTHLY_DEFAULT / 10000) + "만 원", value: Common.MONTHLY_DEFAULT });
    return list;
  }

  function simulate(amount) {
    var list = validHistory();
    if (list.length < 2) { return null; }
    var end = list[list.length - 1][0];
    var start = monthsBefore(end, 12);
    var buys = [];
    var seen = {};
    list.forEach(function (pt) {
      var month = pt[0].slice(0, 7);
      if (month > start.slice(0, 7) && !seen[month]) { seen[month] = true; buys.push(pt); }   // 끝 달 포함 딱 12달
    });
    if (!buys.length) { return null; }
    var shares = 0;
    var cash = 0;
    var invested = 0;
    var held = [];                       // [날짜, 그날 산 뒤 가진 주식 수]
    buys.forEach(function (pt) {
      invested += amount;
      cash += amount;
      var n = Math.floor(cash / pt[1]);
      shares += n;
      cash -= n * pt[1];
      held.push([pt[0], shares]);
    });
    var dividends = 0;
    var divCount = 0;
    var special = false;
    dividendPeriods().forEach(function (d) {
      if (d.period_end <= buys[0][0] || d.period_end > end) { return; }
      var have = 0;
      held.forEach(function (h) { if (h[0] < d.period_end) { have = h[1]; } });
      if (have > 0) {
        dividends += have * d.dps;
        divCount += 1;
        var share = dividendShare(d);
        if (share && share.share > SPECIAL_SHARE) { special = true; }
      }
    });
    var lastPrice = list[list.length - 1][1];
    var stockValue = shares * lastPrice;
    var total = stockValue + cash + dividends;
    return { amount: amount, months: buys.length, from: buys[0][0], to: end, invested: invested, shares: shares, cash: cash,
      lastPrice: lastPrice, stockValue: stockValue, dividends: dividends, divCount: divCount, total: total, special: special,
      pct: invested > 0 ? (total - invested) / invested * 100 : null };
  }

  function renderSim(key) {
    var p = state.product;
    var box = $("reit-sim");
    if (p.type === "global") {
      box.innerHTML = '<p class="notice">해외 리츠는 지난 1년 환율 기록이 없어서 원화로 모은 기록을 계산하지 않았어요.</p>';
      $("reit-sim-sec").classList.remove("is-hidden");
      return;
    }
    var amounts = simAmounts();
    var pick = amounts.filter(function (a) { return a.key === key; })[0] || amounts[0];
    var r = simulate(pick.value);
    if (!r) {
      box.innerHTML = '<p class="notice">지난 1년 주가 기록이 ' + Common.NA + "라 계산할 수 없어요.</p>";
      $("reit-sim-sec").classList.remove("is-hidden");
      return;
    }
    var max = Math.max(r.invested, r.total) || 1;
    box.innerHTML =
      '<div class="chip-row" role="group" aria-label="매달 모을 돈">' + amounts.map(function (a) {
        var on = a.key === pick.key;
        return '<button type="button" class="chip' + (on ? " is-active" : "") + '" data-sim="' + a.key + '" aria-pressed="' + on + '">매달 ' + esc(a.label) + "</button>";
      }).join("") + "</div>" +
      '<p class="reit-sim-head">' + esc(Common.formatDate(r.from)) + "부터 " + r.months + "달 동안 매달 " + esc(Common.formatWon(r.amount)) + "씩 모았다면 (" +
        esc(Common.formatDate(r.to)) + " 종가 기준)</p>" +
      '<p class="reit-sim-result">넣은 돈 ' + esc(Common.formatWon(r.invested)) + ' → 지금 <b class="' + pctClass(r.pct) + '">' + esc(Common.formatWon(r.total)) +
        " (" + esc(pctText(r.pct)) + ")</b></p>" +
      '<div class="reit-sim-bars" aria-hidden="true">' +
        '<div class="reit-sim-bar"><span class="reit-sim-label">넣은 돈</span><span class="reit-sim-track"><span class="reit-sim-fill is-in" style="width:' + (r.invested / max * 100).toFixed(1) + '%"></span></span></div>' +
        '<div class="reit-sim-bar"><span class="reit-sim-label">지금</span><span class="reit-sim-track"><span class="reit-sim-fill ' + (r.total >= r.invested ? "is-up" : "is-down") +
          '" style="width:' + (r.total / max * 100).toFixed(1) + '%"></span></span></div>' +
      "</div>" +
      '<dl class="reit-kv reit-sim-kv">' +
        "<dt>모은 주식</dt><dd>" + esc(Common.formatNumber(r.shares)) + "주 × 지금 가격 " + esc(Common.formatWon(r.lastPrice)) + " = " + esc(Common.formatWon(r.stockValue)) + "</dd>" +
        "<dt>못 쓰고 남은 돈</dt><dd>" + esc(Common.formatWon(r.cash)) + "</dd>" +
        "<dt>받은 " + esc(dividendWord()) + "</dt><dd>" + esc(Common.formatWon(r.dividends)) + (r.divCount ? " (" + r.divCount + "번, 세전)" : "") + "</dd>" +
      "</dl>" +
      (r.special ? '<p class="caution-note">이 기간에 평소와 다른 큰 특별 분배가 있어서, 결과가 주가 흐름과 크게 달라요. 위 배당 달력을 함께 봐 주세요.</p>' : "");
    $("reit-sim-note").textContent = "지난 1년 실제 종가로 계산한 기록이에요. 매달 처음 기록된 날 종가에 1주 단위로 샀다고 보고, 1주 값이 안 되는 남은 돈은 다음 달로 넘겼어요. " +
      "수수료·세금은 빼지 않았어요. 지난 기록일 뿐 앞으로도 같다는 뜻이 아니고, 원금 손실이 날 수 있어요.";
    $("reit-sim-sec").classList.remove("is-hidden");
  }

  // ---------------------------------------------------------------------
  // 보이는 섹션 번호를 01, 02, ... 차례로 다시 매긴다 (종목마다 없는 섹션이 있어서)
  // ---------------------------------------------------------------------
  function renumberSections() {
    var n = 0;
    Array.prototype.forEach.call(document.querySelectorAll("#reit-body section .sec-no"), function (el) {
      var sec = el.closest("section");
      if (sec.classList.contains("is-hidden")) { return; }
      n += 1;
      el.textContent = (n < 10 ? "0" : "") + n;
    });
  }

  function renderFav() {
    $("reit-fav-slot").innerHTML = Common.favButtonHtml(state.product.key, state.product.name);
  }

  // ---------------------------------------------------------------------
  // 01 운용사
  // ---------------------------------------------------------------------
  function renderAmc() {
    var p = state.product;
    var prof = state.profile || {};
    var amc = prof.amc || {};
    var rows = [
      ["운용 주체", amc.name || Common.NA],
      ["운용 방식", amc.kind || Common.NA]
    ];
    var links = linkButton(amc.url, "운용사 홈페이지", false) + linkButton(prof.homepage, p.type === "global" ? "회사 홈페이지" : "리츠 홈페이지", true);
    var sources = (prof.sources || []).filter(function (url) { return /^https:\/\//.test(url); });
    $("reit-amc").innerHTML =
      '<dl class="reit-kv">' + rows.map(function (r) { return "<dt>" + esc(r[0]) + "</dt><dd>" + esc(r[1]) + "</dd>"; }).join("") + "</dl>" +
      (links ? '<div class="reit-links">' + links + "</div>" : '<p class="source-note">' + (amc.name ? "홈페이지 주소는 아직 확인하지 못했어요." : "") + "</p>") +
      '<p class="source-note">' + (p.type === "global"
        ? "미국 상장 리츠는 회사가 직접 건물을 사고 관리해요."
        : (p.type === "etf" ? "ETF는 자산운용사가 여러 종목을 묶어 운용해요."
          : "위탁관리리츠는 직원이 없는 회사라서, 건물을 사고 관리하는 일을 자산관리회사(AMC)에 맡겨요.")) + "</p>" +
      (sources.length ? '<p class="reit-sources">확인한 곳: ' + sources.map(function (url, i) {
        return '<a href="' + esc(url) + '" target="_blank" rel="noopener noreferrer">자료 ' + (i + 1) + "</a>";
      }).join(" · ") + "</p>" : "");
  }

  // ---------------------------------------------------------------------
  // 02 비율 원 그래프 (SVG 도넛). 작은 칸 사이에 2px 정도 틈을 두고, 색은 CSS 변수만 쓴다
  // ---------------------------------------------------------------------
  /** rows [{label, value, meta}] → 큰 순서, 6칸 넘으면 5칸 + 기타 */
  function foldSlices(rows) {
    var sorted = rows.filter(function (r) { return isNum(r.value) && r.value > 0; })
      .sort(function (a, b) { return b.value - a.value; });
    if (sorted.length <= PIE_MAX_SLICES) { return sorted; }
    var head = sorted.slice(0, PIE_MAX_SLICES - 1);
    var tail = sorted.slice(PIE_MAX_SLICES - 1);
    head.push({ label: "기타 " + tail.length + "곳", value: tail.reduce(function (s, r) { return s + r.value; }, 0),
      meta: tail.map(function (r) { return r.label; }).join(", "), isOther: true });
    return head;
  }

  function pieSvg(slices, total) {
    var radius = 48;
    var circ = 2 * Math.PI * radius;
    var gap = slices.length > 1 ? 1.6 : 0;            // 칸 사이 틈 (약 2px)
    var start = 0;
    var paths = slices.map(function (s, i) {
      var len = s.value / total * circ;
      var dash = Math.max(len - gap, 0.4);
      var colorVar = s.isOther ? PIE_OTHER : PIE_COLORS[i % PIE_COLORS.length];
      var html = '<circle class="reit-slice" data-i="' + i + '" cx="60" cy="60" r="' + radius + '" style="stroke: var(' + colorVar + ')"' +
        ' stroke-dasharray="' + dash.toFixed(2) + " " + (circ - dash).toFixed(2) + '" stroke-dashoffset="' + (-start).toFixed(2) + '"' +
        ' transform="rotate(-90 60 60)" tabindex="-1"><title>' + esc(s.label + " " + (s.value / total * 100).toFixed(1) + "%") + "</title></circle>";
      start += len;
      return html;
    }).join("");
    return '<svg viewBox="0 0 120 120" role="img" aria-label="비율 원 그래프">' + paths + "</svg>";
  }

  function renderPie(kind) {
    var mix = buildMix(kind);
    var wrap = $("reit-pie-wrap");
    if (!mix) { wrap.innerHTML = ""; return; }
    state.mixKind = kind;
    var total = mix.slices.reduce(function (s, r) { return s + r.value; }, 0);
    wrap.innerHTML =
      '<div class="reit-pie" id="reit-pie">' + pieSvg(mix.slices, total) +
        '<div class="reit-pie-center"><span class="reit-pie-total">' + esc(Common.formatNumber(total)) + "㎡</span>" +
        '<span class="reit-pie-label">' + esc(mix.centerLabel) + "</span></div></div>" +
      '<ul class="reit-legend" aria-label="비율 목록">' + mix.slices.map(function (s, i) {
        var colorVar = s.isOther ? PIE_OTHER : PIE_COLORS[i % PIE_COLORS.length];
        return '<li><button type="button" class="reit-legend-row" data-i="' + i + '">' +
          '<span class="reit-swatch" style="background: var(' + colorVar + ')" aria-hidden="true"></span>' +
          '<span class="reit-legend-name">' + esc(s.label) + "</span>" +
          '<span class="reit-legend-pct">' + (s.value / total * 100).toFixed(1) + "%</span>" +
          '<span class="reit-legend-val">연면적 ' + esc(Common.formatNumber(s.value)) + "㎡" + (s.meta ? " · " + esc(s.meta) : "") + "</span>" +
          "</button></li>";
      }).join("") + "</ul>";
    $("reit-mix-note").textContent = mix.note;
    bindPieHover(mix.slices, total);
    Array.prototype.forEach.call(document.querySelectorAll("#reit-mix-tabs .chip"), function (chip) {
      var active = chip.getAttribute("data-kind") === kind;
      chip.classList.toggle("is-active", active);
      chip.setAttribute("aria-pressed", String(active));
    });
  }

  /** 원 그래프 조각·목록 줄에 마우스를 올리거나 눌렀을 때 같은 항목을 함께 강조하고 말풍선을 띄운다 */
  function bindPieHover(slices, total) {
    var pie = $("reit-pie");
    var tip = null;
    function show(i, event) {
      var s = slices[i];
      if (!s) { return; }
      pie.classList.add("is-hovering");
      Array.prototype.forEach.call(document.querySelectorAll(".reit-slice, .reit-legend-row"), function (el) {
        el.classList.toggle("is-on", el.getAttribute("data-i") === String(i));
      });
      if (!tip) { tip = document.createElement("div"); tip.className = "reit-tip"; pie.appendChild(tip); }
      tip.innerHTML = "<b>" + esc(s.label) + "</b><br>" + (s.value / total * 100).toFixed(1) + "% · 연면적 " + esc(Common.formatNumber(s.value)) + "㎡";
      var box = pie.getBoundingClientRect();
      var x = event && isNum(event.clientX) ? event.clientX - box.left : box.width / 2;
      var y = event && isNum(event.clientY) ? event.clientY - box.top : box.height / 2;
      tip.style.left = Math.max(0, Math.min(x + 12, box.width - tip.offsetWidth)) + "px";
      tip.style.top = Math.max(0, y + 12) + "px";
    }
    function hide() {
      pie.classList.remove("is-hovering");
      Array.prototype.forEach.call(document.querySelectorAll(".reit-slice, .reit-legend-row"), function (el) { el.classList.remove("is-on"); });
      if (tip) { tip.remove(); tip = null; }
    }
    Array.prototype.forEach.call(document.querySelectorAll(".reit-slice, .reit-legend-row"), function (el) {
      var i = Number(el.getAttribute("data-i"));
      el.addEventListener("mouseenter", function (e) { show(i, e); });
      el.addEventListener("mousemove", function (e) { if (el.classList.contains("reit-slice")) { show(i, e); } });
      el.addEventListener("mouseleave", hide);
      el.addEventListener("focus", function () { show(i, null); });
      el.addEventListener("blur", hide);
      el.addEventListener("click", function (e) { show(i, el.classList.contains("reit-slice") ? e : null); });
    });
  }

  /** 국내 리츠의 건물(assets.json)로 비율 자료를 만든다. kind: "type" 유형별 / "building" 건물별 */
  function buildMix(kind) {
    var withArea = state.assets.filter(function (a) { return isNum(a.floor_area_m2) && a.floor_area_m2 > 0; });
    if (withArea.length < 2) { return null; }
    var note = "기준: 연면적(건물 바닥 면적의 합). 국토교통부 리츠정보시스템 지도에 나온, 리츠가 직접 가진 건물 " + withArea.length +
      "곳만 계산했어요. 건물 값(감정평가액)이나 임대료 비율과는 달라요." +
      (withArea.length < state.assets.length ? " (연면적 값이 없는 건물 " + (state.assets.length - withArea.length) + "곳은 빠졌어요)" : "");
    if (kind === "type") {
      var byType = {};
      withArea.forEach(function (a) {
        var key = a.asset_type || "유형 데이터 없음";
        byType[key] = byType[key] || { label: key, value: 0, count: 0 };
        byType[key].value += a.floor_area_m2;
        byType[key].count += 1;
      });
      var rows = Object.keys(byType).map(function (k) {
        return { label: byType[k].label, value: byType[k].value, meta: "건물 " + byType[k].count + "곳" };
      });
      return { slices: foldSlices(rows), centerLabel: "유형별 연면적", note: note };
    }
    return {
      slices: foldSlices(withArea.map(function (a) { return { label: a.name || "이름 " + Common.NA, value: a.floor_area_m2, meta: a.asset_type || "" }; })),
      centerLabel: "건물별 연면적", note: note
    };
  }

  function renderMix() {
    var p = state.product;
    var empty = $("reit-mix-empty");
    var withArea = state.assets.filter(function (a) { return isNum(a.floor_area_m2) && a.floor_area_m2 > 0; });
    if (p.type === "reit" && withArea.length >= 2) {
      var types = {};
      withArea.forEach(function (a) { types[a.asset_type || "-"] = true; });
      var typeCount = Object.keys(types).length;
      var tabs = $("reit-mix-tabs");
      if (typeCount > 1) {
        tabs.innerHTML = '<button type="button" class="chip" data-kind="type" aria-pressed="false">유형별</button>' +
          '<button type="button" class="chip" data-kind="building" aria-pressed="false">건물별</button>';
        tabs.classList.remove("is-hidden");
        tabs.addEventListener("click", function (event) {
          var chip = event.target.closest("[data-kind]");
          if (chip) { renderPie(chip.getAttribute("data-kind")); }
        });
      }
      $("reit-mix").classList.remove("is-hidden");
      renderPie(typeCount > 1 ? "type" : "building");
      if (typeCount === 1) {
        $("reit-mix-note").textContent = "가진 건물이 모두 '" + Object.keys(types)[0] + "' 유형이라 건물별로 나눠 보여줘요. " + $("reit-mix-note").textContent;
      }
      return;
    }
    var text;
    if (p.type === "etf") {
      text = "ETF는 건물을 직접 갖지 않고 여러 리츠 주식을 묶어 담아요. 담은 종목 비율은 운용사 홈페이지의 구성 종목(PDF)에서 확인할 수 있어요.";
    } else if (p.type === "global") {
      text = "해외 리츠는 건물이 수백~수천 곳이라 비율 자료를 아직 담지 못했어요. 아래는 대표 자산만 고른 거예요. 자산 구성 비율은 회사 홈페이지의 분기 실적 자료(Supplemental)에서 볼 수 있어요.";
    } else if (withArea.length === 1) {
      text = "리츠정보시스템 지도에 나온 직접 보유 건물이 1곳이라 비율 그래프 대신 건물 정보를 보여줘요.";
    } else {
      text = "이 리츠는 자회사 리츠·펀드나 해외 건물을 통해 투자해서 리츠정보시스템 지도에 건물이 없어요. 그래서 비율 그래프는 " + Common.NA +
        "이고, 보도·공시로 확인한 대표 자산을 아래에 적었어요.";
    }
    empty.textContent = text;
    empty.classList.remove("is-hidden");
  }

  // ---------------------------------------------------------------------
  // 02 가진 건물 목록 + 작은 지도
  // ---------------------------------------------------------------------
  function assetCards() {
    var p = state.product;
    var prof = state.profile || {};
    if (p.type === "reit" && state.assets.length) {
      return state.assets.slice().sort(function (a, b) { return (b.floor_area_m2 || 0) - (a.floor_area_m2 || 0); }).map(function (a) {
        return '<article class="card"><p class="card-sub">' + esc(a.asset_type || "유형 " + Common.NA) + "</p>" +
          '<h3 class="card-title">' + esc(a.name || "이름 " + Common.NA) + "</h3>" +
          '<p class="reit-asset-meta">' + esc(a.address || "주소 " + Common.NA) + "</p>" +
          '<p class="reit-asset-meta">연면적 ' + esc(isNum(a.floor_area_m2) ? Common.formatNumber(a.floor_area_m2) + "㎡" : Common.NA) +
          " · 완공 " + esc(a.completed_date ? Common.formatDate(a.completed_date) : Common.NA) + "</p></article>";
      });
    }
    if (p.type === "global" && state.global) {
      return (state.global.properties || []).map(function (a) {
        return '<article class="card"><p class="card-sub">' + esc((a.type || "") + (a.ownership ? " · " + a.ownership : "")) + "</p>" +
          '<h3 class="card-title">' + esc(a.name) + "</h3>" +
          '<p class="reit-asset-meta">' + esc(a.city || "") + "</p>" +
          (a.desc ? '<p class="reit-asset-note">' + esc(a.desc) + "</p>" : "") +
          (/^https:\/\//.test(a.source_url || "") ? '<p class="reit-sources"><a href="' + esc(a.source_url) + '" target="_blank" rel="noopener noreferrer">보유 확인 출처</a></p>' : "") +
          "</article>";
      });
    }
    return (prof.holdings || []).map(function (h) {
      return '<article class="card"><p class="card-sub">' + esc(h.type || "") + "</p>" +
        '<h3 class="card-title">' + esc(h.name) + "</h3>" +
        '<p class="reit-asset-meta">' + esc(h.place || "") + "</p>" +
        (h.note ? '<p class="reit-asset-note">' + esc(h.note) + "</p>" : "") + "</article>";
    });
  }

  function renderAssets() {
    var p = state.product;
    var prof = state.profile || {};
    var cards = assetCards();
    $("reit-assets").innerHTML = cards.join("");
    var notes = [];
    if (p.type === "reit" && state.assets.length) {
      notes.push("건물 정보: 국토교통부 리츠정보시스템 GIS 지도 (리츠가 직접 가진 건물만).");
    } else if (p.type === "global") {
      notes.push("대표 자산은 전체가 아니라 리츠마다 2~3곳만 골랐어요. 보유 방식(직접 소유·지분 투자·운영)이 서로 달라요.");
    } else if (cards.length) {
      notes.push("보도·공시에 나온 대표 자산이에요. 보유 자산은 사고팔면서 바뀌니 최신 공시로 확인해 주세요.");
    } else if (p.type === "reit") {
      notes.push("가진 건물 목록: " + Common.NA + ". 아래 '공시' 링크의 투자보고서에서 확인할 수 있어요.");
    }
    if (prof.holdings_count_note) { notes.push(prof.holdings_count_note + "."); }
    if (prof.holdings_note) { notes.push(prof.holdings_note); }
    $("reit-assets-note").textContent = notes.join(" ");
    drawMap();
  }

  function mapPoints() {
    var p = state.product;
    if (p.type === "reit") {
      return state.assets.filter(function (a) { return isNum(a.lat) && isNum(a.lng); })
        .map(function (a) { return { lat: a.lat, lng: a.lng, name: a.name || "", sub: a.asset_type || "" }; });
    }
    if (p.type === "global") {
      var pts = [];
      if (isNum(p.hqLat) && isNum(p.hqLng)) { pts.push({ lat: p.hqLat, lng: p.hqLng, name: p.name + " 본사", sub: p.hq || "", isHq: true }); }
      ((state.global && state.global.properties) || []).forEach(function (a) {
        if (isNum(a.lat) && isNum(a.lng)) { pts.push({ lat: a.lat, lng: a.lng, name: a.name, sub: (a.type || "") + " · " + (a.city || "") }); }
      });
      return pts;
    }
    return [];
  }

  function drawMap() {
    var points = mapPoints();
    var box = $("reit-map");
    var note = $("reit-map-note");
    if (!points.length) { return; }
    if (!window.L) {
      note.textContent = "지도를 불러오지 못했어요(인터넷 연결 확인). 아래 목록은 그대로 볼 수 있어요.";
      note.classList.remove("is-hidden");
      return;
    }
    box.classList.remove("is-hidden");
    var L = window.L;
    var root = window.getComputedStyle(document.documentElement);
    state.map = L.map("reit-map", { scrollWheelZoom: false });
    L.tileLayer(TILE_URL, { maxZoom: 19, attribution: TILE_CREDIT }).addTo(state.map);
    points.forEach(function (pt) {
      var marker = pt.isHq
        ? L.marker([pt.lat, pt.lng], { icon: L.divIcon({ className: "reit-hq-icon", html: '<span class="reit-hq-pin">본사</span>', iconSize: null }), title: pt.name })
        : L.circleMarker([pt.lat, pt.lng], { radius: parseFloat(root.getPropertyValue("--space-2")) || 8, weight: 2,
          color: root.getPropertyValue("--color-surface").trim(), fillColor: root.getPropertyValue("--color-primary").trim(), fillOpacity: 1 });
      marker.bindPopup("<b>" + esc(pt.name) + "</b><br>" + esc(pt.sub)).addTo(state.map);
    });
    var latlngs = points.map(function (pt) { return [pt.lat, pt.lng]; });
    if (latlngs.length === 1) { state.map.setView(latlngs[0], 15); } else { state.map.fitBounds(latlngs, { padding: [30, 30], maxZoom: 15 }); }
    var noCoord = state.product.type === "reit" ? state.assets.length - points.length : 0;
    note.textContent = "지도: OpenStreetMap. 점은 건물" + (state.product.type === "global" ? ", 초록 '본사' 표시는 본사가 있는 도시예요." : " 위치예요(리츠정보시스템 지도 표시 위치).") +
      (noCoord > 0 ? " 위치 좌표가 없는 건물 " + noCoord + "곳은 지도에서 빠졌어요(목록에는 있어요)." : "");
    note.classList.remove("is-hidden");
  }

  // ---------------------------------------------------------------------
  // 03 숫자를 생활 언어로 (ETF·해외 리츠는 국내 공시 지표가 없어서 배당만)
  // ---------------------------------------------------------------------
  function renderNumbers() {
    var p = state.product;
    var lines = [{ title: "매달 모으면 (" + Common.termHtml("price-yield", "주가 기준 배당수익률") + ")", line: Common.translateDividend(p.priceYield) }];
    if (p.type === "reit") {
      lines.push({ title: "건물 값에 비해 (" + Common.termHtml("pnav", "P/NAV") + ")", line: Common.translatePNav(p.pNav) });
      lines.push({ title: "세입자 계약 (" + Common.termHtml("wale", "WALE") + ")", line: Common.translateWale(p.waleYears) });
    }
    $("reit-numbers").innerHTML = lines.map(function (item) {
      var l = item.line;
      return '<article class="card"><p class="card-sub">' + item.title + "</p>" +
        '<p class="translated' + (l.text === Common.NA ? " na" : "") + '">' + esc(l.text) + "</p>" +
        '<p class="raw-note">' + esc(l.raw || "") + "</p>" +
        (l.caution ? '<p class="caution-note">' + esc(l.caution) + "</p>" : "") +
        (l.note ? '<p class="raw-note">' + esc(l.note) + "</p>" : "") + "</article>";
    }).join("");
    $("reit-numbers-sec").classList.remove("is-hidden");
  }

  // ---------------------------------------------------------------------
  // 04 자료 더 보기
  // ---------------------------------------------------------------------
  function isoDay(date) {
    return date.getFullYear() + "-" + String(date.getMonth() + 1).padStart(2, "0") + "-" + String(date.getDate()).padStart(2, "0");
  }

  function docCard(title, body, url, label) {
    return '<article class="card reit-doc"><h3 class="card-title">' + esc(title) + "</h3>" +
      '<p class="card-sub">' + esc(body) + "</p>" + linkButton(url, label, false) + "</article>";
  }

  function renderDocs() {
    var p = state.product;
    var prof = state.profile || {};
    var cards = [];
    if (p.type === "reit") {
      var today = new Date();
      var from = new Date(today.getFullYear() - REPORT_YEARS, today.getMonth(), today.getDate());
      var reportUrl = HANKYUNG_URL + "?sdate=" + isoDay(from) + "&edate=" + isoDay(today) +
        "&search_text=" + encodeURIComponent(p.name) + "&pagenum=20";
      cards.push(docCard("증권사 분석 리포트", "최근 " + REPORT_YEARS + "년 동안 증권사 애널리스트가 쓴 " + p.name + " 리포트 목록이에요. 목록에서 PDF를 바로 받을 수 있어요.",
        reportUrl, "한경 컨센서스에서 보기"));
    }
    if (p.type !== "global" && p.id) {
      cards.push(docCard("공시 (투자보고서·사업보고서)", "금융감독원 전자공시(DART)에 종목코드 " + p.id + "가 미리 들어가요. 열린 화면에서 '검색' 버튼을 눌러 주세요.",
        DART_URL + "?option=corp&textCrpNm=" + encodeURIComponent(p.id), "DART에서 찾기"));
    }
    if (p.type === "reit") {
      cards.push(docCard("국토교통부 리츠정보시스템", "모든 리츠의 투자보고서와 성과 지표를 볼 수 있는 정부 사이트예요. 이 사이트의 건물·지표 자료도 여기서 가져왔어요.",
        MOLIT_URL, "리츠정보시스템 열기"));
    }
    if (p.type === "global" && prof.sec_ticker) {
      cards.push(docCard("미국 SEC 공시 (10-K 연간보고서)", "미국 증권거래위원회(SEC)에 낸 연간보고서예요. 가진 건물 수, 자산 구성, 위험 요인이 영어로 자세히 나와요.",
        SEC_URL + "?action=getcompany&CIK=" + encodeURIComponent(prof.sec_ticker) + "&type=10-K", "SEC에서 보기"));
    }
    if (/^https?:\/\//.test(prof.homepage || "")) {
      cards.push(docCard(p.type === "global" ? "회사 홈페이지 (IR 자료)" : "리츠 홈페이지 (IR 자료)",
        (p.type === "global" ? "회사가" : "운용사가") + " 올리는 실적 발표 자료, 주주서한, 배당 안내를 볼 수 있어요.", prof.homepage, "홈페이지 열기"));
    }
    $("reit-docs").innerHTML = cards.join("");
    if (p.type !== "reit") {
      // ETF·해외 리츠는 한경 리포트 링크가 없으니 안내 문구도 바꾼다
      $("reit-docs-note").textContent = p.type === "global"
        ? "SEC 공시와 회사 자료는 영어 원문이에요. 이 사이트는 링크로만 안내하고, 그 안의 의견은 이 사이트의 의견이 아니에요."
        : "ETF 구성 종목·보수는 운용사 홈페이지의 상품 페이지에서 확인할 수 있어요. 이 사이트는 링크로만 안내해요.";
    }
    if (!$("reit-numbers-sec").classList.contains("is-hidden")) { $("reit-docs-no").textContent = "04"; }
  }

  // ---------------------------------------------------------------------
  // 시작
  // ---------------------------------------------------------------------
  function showMissing(text) {
    var el = $("reit-loading");
    el.innerHTML = esc(text) + ' <a href="index.html">리츠 목록으로 가기</a>';
  }

  function start() {
    Common.initPage({ active: "index", sources: ["reits", "assets", "prices", "metrics", "dividends", "reit_profiles", "global_properties", "assumptions"] });
    var id = Common.getQueryId();
    if (!id) { showMissing("어떤 리츠를 볼지 정해지지 않았어요."); return; }
    Common.loadAll(["reits", "metrics", "prices", "dividends", "history", "assets", "reit_profiles", "global_properties", "assumptions"]).then(function (data) {
      Common.applyAssumptions(data.assumptions);
      var product = Common.buildProducts(data).filter(function (p) { return p.key === id || p.id === id; })[0];
      if (!product) { showMissing("이 종목(" + id + ")의 정보를 찾지 못했어요."); return; }
      state.product = product;
      state.profile = Common.findById((data.reit_profiles && data.reit_profiles.items) || [], product.id);
      state.assets = ((data.assets && data.assets.items) || []).filter(function (a) { return a.reit_id === product.id; });
      state.global = Common.findById((data.global_properties && data.global_properties.items) || [], product.id);
      state.dividend = Common.findById((data.dividends && data.dividends.items) || [], product.id);
      state.dividendSource = data.dividends && data.dividends.source;
      renderHead();
      renderFav();
      renderDividends();
      renderSim("coffee");
      renderAmc();
      renderMix();
      $("reit-loading").classList.add("is-hidden");
      $("reit-body").classList.remove("is-hidden");
      renderAssets();          // 지도는 화면에 보인 뒤 그려야 크기가 맞는다
      if (product.type !== "etf") { renderNumbers(); } else { $("reit-docs-no").textContent = "03"; }
      renderDocs();
      renumberSections();
    });
    // 그래프 기간, 모을 돈, ♥ 버튼
    document.getElementById("reit-chart").addEventListener("click", function (event) {
      var chip = event.target.closest("[data-period]");
      if (chip && !chip.disabled) { renderChart(chip.getAttribute("data-period")); }
    });
    document.getElementById("reit-sim").addEventListener("click", function (event) {
      var chip = event.target.closest("[data-sim]");
      if (chip) { renderSim(chip.getAttribute("data-sim")); }
    });
    document.getElementById("reit-fav-slot").addEventListener("click", function (event) {
      var button = event.target.closest("[data-fav]");
      if (button) { Common.toggleFavorite(button.getAttribute("data-fav")); renderFav(); }
    });
  }

  document.addEventListener("DOMContentLoaded", start);
})();
