/* ==========================================================================
   js/compare.js — 비교 화면 (compare.html)
   - 리츠·리츠 ETF를 최대 3개 골라 나란히 비교. 맨 오른쪽 칸은 항상 "은행 적금"
   - 숫자는 생활 언어로 바꿔 크게, 원래 숫자와 계산식은 그 아래 작게 항상 같이 보여준다
   - "원금 손실 가능"(리츠)과 "원금 보장"(적금)은 같은 크기로 보여준다
   - 주소: compare.html?ids=종목코드,종목코드  (최대 3개)
   - 토스식 구성(2026-11-28): 담은 상품 칩 + 이름 검색·종류 필터 목록에서 담기 / 매달 넣는 돈 버튼 /
     한눈에 보기(1년 배당·이자 막대) / 주가 흐름 겹쳐 보기(1개월·3개월·1년, 훑으면 그날 등락률) / 자세히 나란히 보기
   ========================================================================== */
(function () {
  "use strict";

  var MAX_PICK = 3;
  var state = {
    products: [], savings: null, picked: [],        // picked: 고른 상품의 key 목록 (최대 3개, 담은 순서 = 그래프 색 순서)
    group: "all", period: "1y",                      // 목록 종류 필터, 그래프 기간
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

  // ---------- 고르기 (토스식): 담은 상품 칩 + 이름 검색 + 종류 필터 + 목록에서 담기 ----------
  var GROUPS = [["all", "전체"], ["reit", "국내 리츠"], ["etf", "리츠 ETF"], ["global", "해외 리츠"]];
  var MONTHLY_OPTIONS = [30000, 50000, 100000, 300000];
  var SERIES_COLORS = ["--chart-1", "--chart-2", "--chart-3"];
  var PERIODS = [{ key: "1m", label: "1개월", months: 1 }, { key: "3m", label: "3개월", months: 3 }, { key: "1y", label: "1년", months: 12 }];

  function kindText(p) {
    return p.type === "etf" ? "리츠 ETF" : (p.type === "global" ? "해외 리츠" : "국내 리츠" + (p.assetType ? " · " + p.assetType : ""));
  }

  function pickedProducts() {
    return state.picked.map(function (key) { return key ? productByKey(key) : null; }).filter(Boolean);
  }

  function renderPicked() {
    var picked = pickedProducts();
    var box = document.getElementById("cmp-picked");
    var chips = picked.map(function (p, i) {
      return '<span class="cmp-chip"><span class="cmp-chip-dot" style="background: var(' + SERIES_COLORS[i] + ')" aria-hidden="true"></span>' +
        Common.escapeHtml(p.name) + '<button type="button" class="cmp-chip-x" data-unpick="' + Common.escapeHtml(p.key) + '" aria-label="' +
        Common.escapeHtml(p.name) + ' 빼기">×</button></span>';
    }).join("");
    box.innerHTML = chips + '<span class="cmp-chip cmp-chip--saving"><span class="cmp-chip-dot" aria-hidden="true"></span>은행 적금 (늘 같이 비교)</span>' +
      '<span class="cmp-count">' + picked.length + " / " + MAX_PICK + "</span>";
  }

  function renderList() {
    var word = document.getElementById("cmp-search").value.replace(/\s+/g, "").toLowerCase();
    var group = state.group || "all";
    document.getElementById("cmp-groups").innerHTML = GROUPS.map(function (g) {
      var on = g[0] === group;
      return '<button type="button" class="chip' + (on ? " is-active" : "") + '" data-group="' + g[0] + '" aria-pressed="' + on + '">' + g[1] + "</button>";
    }).join("");
    var list = state.products.filter(function (p) {
      return (group === "all" || p.type === group) && (!word || p.name.replace(/\s+/g, "").toLowerCase().indexOf(word) !== -1);
    }).sort(function (a, b) { return a.name.localeCompare(b.name, "ko"); });
    var full = state.picked.filter(Boolean).length >= MAX_PICK;
    document.getElementById("cmp-list").innerHTML = list.length ? list.map(function (p) {
      var on = state.picked.indexOf(p.key) !== -1;
      var change = Common.formatChange(p.changePct);
      return '<button type="button" class="cmp-row' + (on ? " is-on" : "") + '" data-pick="' + Common.escapeHtml(p.key) + '" aria-pressed="' + on + '"' +
        (!on && full ? ' aria-disabled="true"' : "") + ">" +
        '<span class="cmp-row-main"><span class="cmp-row-name">' + Common.escapeHtml(p.name) + "</span>" +
        '<span class="cmp-row-sub">' + Common.escapeHtml(kindText(p)) + "</span></span>" +
        '<span class="cmp-row-price">' + (typeof p.price === "number" ? Common.formatWon(p.price) : Common.NA) +
          (change.text ? '<span class="' + change.cls + '">' + change.text + "</span>" : "") + "</span>" +
        '<span class="cmp-row-add">' + (on ? "✓ 담김" : "+ 담기") + "</span></button>";
    }).join("") : '<p class="source-note">찾는 상품이 없어요. 다른 이름으로 찾아보세요.</p>';
  }

  function renderMonthly() {
    document.getElementById("cmp-monthly").innerHTML = MONTHLY_OPTIONS.map(function (won) {
      var on = won === state.monthly;
      return '<button type="button" class="chip' + (on ? " is-active" : "") + '" data-monthly="' + won + '" aria-pressed="' + on + '">' +
        (won / 10000) + "만 원</button>";
    }).join("");
  }

  function togglePick(key) {
    var at = state.picked.indexOf(key);
    var notice = document.getElementById("cmp-pick-notice");
    if (at !== -1) {
      state.picked.splice(at, 1);
    } else if (state.picked.filter(Boolean).length >= MAX_PICK) {
      notice.textContent = MAX_PICK + "개까지 비교할 수 있어요. 위에서 하나를 빼고 담아 주세요.";
      notice.classList.remove("is-hidden");
      return;
    } else {
      state.picked = state.picked.filter(Boolean).concat(key);
    }
    notice.classList.add("is-hidden");
    renderAll();
    saveToAddress();
    refreshLive();
  }

  // ---------- 한눈에 보기: 매달 ○만 원씩 1년 모으면 받는 돈 (배당·이자) 막대 ----------
  function dividendWhy(p) {
    if (typeof priceOf(p) !== "number") { return "시세를 받지 못했어요"; }
    var m = /최근 1년 배당 (\d+)건.*결산 횟수\(([^)]+)\)/.exec(p.dpsBasis || "");
    if (!m) { return "최근 1년 배당 기록을 받지 못했어요"; }
    if (m[1] === "0") { return "지난 1년 동안 배당 기록이 없어요"; }
    return "지난 1년 배당 기록(" + m[1] + "번)이 1년 배당 횟수와 안 맞아 계산하지 않았어요";
  }

  function renderSummary() {
    var picked = pickedProducts();
    var man = state.monthly / 10000;
    var rows = picked.map(function (p, i) {
      var price = priceOf(p);
      var live = state.live[p.key];
      var yieldPct = live ? Common.calcPriceYield(p.dpsAnnual, price) : p.priceYield;
      var value = Common.calcInstallmentIncome(state.monthly, yieldPct, 12);
      return { name: p.name, color: SERIES_COLORS[i], value: value, safe: false,
        note: typeof yieldPct === "number" ? "주가 기준 배당수익률 연 " + Common.formatPercent(yieldPct, 2) + " (지난 1년 배당 기준)" : "이유: " + dividendWhy(p) };
    });
    var best = Common.getBestSaving(state.savings);
    var item = best ? best.item : null;
    rows.push({ name: item ? item.bank + " 적금" : "은행 적금", color: null, safe: true,
      value: item ? Common.calcInstallmentIncome(state.monthly, item.rate_max, 12) : null,
      note: item ? "최고 우대금리 연 " + Common.formatPercent(item.rate_max, 2) + " (기본 " + Common.formatPercent(item.rate_base, 2) + ", 우대조건을 다 채웠을 때)" : "적금 금리 " + Common.NA });
    var max = Math.max.apply(null, rows.map(function (r) { return typeof r.value === "number" ? r.value : 0; })) || 1;
    var coffee = state.coffee;
    document.getElementById("cmp-summary-title").textContent = "매달 " + man + "만 원씩 1년 모으면 받는 돈";
    document.getElementById("cmp-summary").innerHTML = rows.map(function (r) {
      var has = typeof r.value === "number";
      return '<div class="cmp-sum-row">' +
        '<div class="cmp-sum-head"><span class="cmp-sum-name">' + (r.color ? '<span class="cmp-chip-dot" style="background: var(' + r.color + ')" aria-hidden="true"></span>' : '<span class="cmp-chip-dot cmp-chip-dot--saving" aria-hidden="true"></span>') +
          Common.escapeHtml(r.name) + "</span>" +
          (r.safe ? '<span class="label-safe cmp-sum-label">원금 보장</span>' : '<span class="label-risk cmp-sum-label">원금 손실 가능</span>') + "</div>" +
        '<p class="cmp-sum-value' + (has ? "" : " na") + '">' + (has ? "약 " + Common.formatWon(r.value) +
          (typeof coffee === "number" && coffee > 0 ? ' <span class="cmp-sum-cups">커피 ' + Math.floor(r.value / coffee) + "잔</span>" : "") : Common.NA) + "</p>" +
        '<span class="cmp-sum-track"><span class="cmp-sum-fill' + (r.safe ? " is-saving" : "") + '" style="width:' + (has ? Math.max(1, r.value / max * 100).toFixed(1) : 0) + "%;" +
          (r.color ? " background: var(" + r.color + ");" : "") + '"></span></span>' +
        '<p class="raw-note">' + Common.escapeHtml(r.note) + "</p></div>";
    }).join("");
    document.getElementById("cmp-summary-note").textContent = picked.length
      ? "세금(15.4%) 떼기 전. 리츠 배당은 지난 1년 실적을 옮긴 것이라 앞으로 줄거나 없을 수 있고, 주가가 내리면 원금 손실이 나요. 적금 이자는 가입할 때 정해지고 원금이 보호돼요."
      : "아래 목록에서 리츠를 담으면 은행 적금과 나란히 막대로 보여줘요.";
  }

  // ---------- 주가 흐름 겹쳐 보기: 고른 상품의 주가 등락률(%)을 한 그래프에, 훑으면 그날 값 ----------
  function monthsBefore(day, months) {
    var d = new Date(day + "T00:00:00");
    d.setMonth(d.getMonth() - months);
    return d.getFullYear() + "-" + String(d.getMonth() + 1).padStart(2, "0") + "-" + String(d.getDate()).padStart(2, "0");
  }

  function pctText(v) { return typeof v === "number" ? (v > 0 ? "+" : "") + v.toFixed(1) + "%" : Common.NA; }
  function pctCls(v) { return v > 0 ? "num-up" : (v < 0 ? "num-down" : ""); }

  function renderTrend(periodKey) {
    var picked = pickedProducts();
    var box = document.getElementById("cmp-trend");
    state.period = periodKey || state.period || "1y";
    var per = PERIODS.filter(function (x) { return x.key === state.period; })[0];
    var chips = '<div class="chip-row" role="group" aria-label="그래프 기간">' + PERIODS.map(function (x) {
      var on = x.key === per.key;
      return '<button type="button" class="chip' + (on ? " is-active" : "") + '" data-period="' + x.key + '" aria-pressed="' + on + '">' + x.label + "</button>";
    }).join("") + "</div>";
    var series = picked.map(function (p, i) {
      var list = (p.history || []).filter(function (pt) { return pt && typeof pt[0] === "string" && typeof pt[1] === "number"; });
      if (list.length < 2) { return null; }
      var from = monthsBefore(list[list.length - 1][0], per.months);
      var pts = list.filter(function (pt) { return pt[0] >= from; });
      if (pts.length < 2) { return null; }
      var base = pts[0][1];
      return { name: p.name, color: SERIES_COLORS[i], global: p.type === "global",
        pts: pts.map(function (pt) { return [pt[0], Date.parse(pt[0]), (pt[1] / base - 1) * 100]; }) };
    }).filter(Boolean);
    if (!series.length) {
      box.innerHTML = chips + '<p class="source-note">' + (picked.length ? "고른 상품의 주가 기록이 " + Common.NA + "예요." : "리츠를 담으면 주가 흐름을 한 그래프에 겹쳐서 보여줘요.") + "</p>";
      return;
    }
    var W = 320;
    var H = 160;
    var PAD = 10;
    var t0 = Math.min.apply(null, series.map(function (s) { return s.pts[0][1]; }));
    var t1 = Math.max.apply(null, series.map(function (s) { return s.pts[s.pts.length - 1][1]; }));
    var all = [0];
    series.forEach(function (s) { s.pts.forEach(function (pt) { all.push(pt[2]); }); });
    var min = Math.min.apply(null, all);
    var max = Math.max.apply(null, all);
    var span = (t1 - t0) || 1;
    function x(t) { return (t - t0) / span * W; }
    function y(v) { return PAD + (max - v) / ((max - min) || 1) * (H - PAD * 2); }
    var lines = series.map(function (s) {
      return '<polyline class="cmp-line" style="stroke: var(' + s.color + ')" points="' +
        s.pts.map(function (pt) { return x(pt[1]).toFixed(1) + "," + y(pt[2]).toFixed(1); }).join(" ") + '"></polyline>';
    }).join("");
    box.innerHTML = chips +
      '<p class="cmp-readout" id="cmp-readout" aria-live="polite"></p>' +
      '<div class="cmp-plot" id="cmp-plot">' +
        '<svg viewBox="0 0 ' + W + " " + H + '" preserveAspectRatio="none" role="img" aria-label="' + Common.escapeHtml(per.label + " 주가 등락률 비교") + '">' +
          '<line class="spark-base" x1="0" x2="' + W + '" y1="' + y(0).toFixed(1) + '" y2="' + y(0).toFixed(1) + '"></line>' + lines + "</svg>" +
        '<span class="cmp-cursor is-hidden" id="cmp-cursor"></span>' +
      "</div>" +
      '<p class="spark-caption">0% 점선은 기간 첫날 가격이에요. 그래프를 훑으면 그날 등락률이 보여요. 배당은 빼고 주가만 비교했어요' +
        (series.some(function (s) { return s.global; }) ? " (해외 리츠는 달러 기준)" : "") + ".</p>";

    var readout = document.getElementById("cmp-readout");
    var plot = document.getElementById("cmp-plot");
    var cursor = document.getElementById("cmp-cursor");
    function itemHtml(s, v) {
      return '<span class="cmp-read-item"><span class="cmp-chip-dot" style="background: var(' + s.color + ')" aria-hidden="true"></span>' +
        Common.escapeHtml(s.name) + ' <b class="' + pctCls(v) + '">' + pctText(v) + "</b></span>";
    }
    function showDefault() {
      cursor.classList.add("is-hidden");
      readout.innerHTML = '<span class="cmp-read-date">' + Common.escapeHtml(per.label) + " 동안</span>" +
        series.map(function (s) { return itemHtml(s, s.pts[s.pts.length - 1][2]); }).join("");
    }
    function showAt(clientX) {
      var rect = plot.getBoundingClientRect();
      if (!rect.width) { return; }
      var target = t0 + Math.max(0, Math.min(1, (clientX - rect.left) / rect.width)) * span;
      var day = null;
      var items = series.map(function (s) {
        var best = s.pts[0];
        s.pts.forEach(function (pt) { if (Math.abs(pt[1] - target) < Math.abs(best[1] - target)) { best = pt; } });
        if (!day) { day = best; }
        return itemHtml(s, best[2]);
      });
      cursor.style.left = (x(day[1]) / W * 100) + "%";
      cursor.classList.remove("is-hidden");
      readout.innerHTML = '<span class="cmp-read-date">' + Common.escapeHtml(Common.formatDate(day[0])) + "</span>" + items.join("");
    }
    plot.addEventListener("pointermove", function (e) { showAt(e.clientX); });
    plot.addEventListener("pointerdown", function (e) { showAt(e.clientX); });
    plot.addEventListener("pointerleave", showDefault);
    plot.addEventListener("pointercancel", showDefault);
    showDefault();
  }

  function renderAll() {
    renderPicked();
    renderList();
    renderMonthly();
    renderSummary();
    renderTrend();
    renderGrid();
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
      cell(kindLabel, '<p class="cmp-name">' + Common.escapeHtml(p.name) + "</p>" +
        '<a class="raw-note" href="' + Common.detailHref(p.key) + '">운용사·가진 건물 자세히 보기 →</a>', "cmp-cell--head " + cls),
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
          (p.priceDate ? Common.formatPriceBasis(p) + " (실시간 아님)" : "")) +
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
        text: "매달 " + man + "만 원씩 1년 모으면 이자는 약 " + Common.formatWon(top) +
          (typeof state.coffee === "number" && state.coffee > 0
            ? " (커피 " + Math.floor(top / state.coffee) + "잔)" : " (커피값 " + Common.NA + ")"),
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
      notice.textContent = "리츠 목록을 불러오지 못했어요. 인터넷 연결을 확인하고 새로고침해 주세요.";
      notice.classList.remove("is-hidden");
    } else if (!picked.length) {
      notice.textContent = "위 목록에서 비교할 리츠를 담아 주세요. 지금은 은행 적금만 보여요.";
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
        renderSummary();
        renderGrid();
      });
    });
  }

  // ---------- 시작 ----------
  function start() {
    Common.initPage({ active: "compare", sources: ["prices", "dividends", "metrics", "savings", "assumptions"] });

    var coffeeInput = document.getElementById("cmp-coffee");
    Common.loadAll(["reits", "metrics", "prices", "dividends", "savings", "history", "assumptions"]).then(function (data) {
      Common.applyAssumptions(data.assumptions);
      state.coffee = Common.COFFEE.price;
      coffeeInput.value = state.coffee === null ? "" : state.coffee;
      document.getElementById("cmp-coffee-source").textContent =
        state.coffee === null ? "커피 한 잔 값: 데이터 없음. 직접 입력하면 계산에 사용할 수 있어요." :
        "커피 한 잔 값은 과거 기준의 가정이에요. 기본값 " + Common.formatWon(state.coffee) +
        ": " + Common.COFFEE.label + " (" + Common.COFFEE.source + " · 기준일 " +
        Common.formatDate(Common.COFFEE.as_of) + "). 직접 바꿔 볼 수 있어요.";
      state.products = Common.buildProducts(data);
      state.savings = data.savings;
      state.picked = Common.getQueryIds().map(function (id) {
        var p = productByKey(id);
        return p ? p.key : "";
      }).filter(Boolean).slice(0, MAX_PICK);
      renderAll();
      refreshLive();
    });

    // 담기·빼기, 검색, 종류 필터, 매달 넣는 돈, 그래프 기간
    document.getElementById("cmp-picked").addEventListener("click", function (event) {
      var button = event.target.closest("[data-unpick]");
      if (button) { togglePick(button.getAttribute("data-unpick")); }
    });
    document.getElementById("cmp-list").addEventListener("click", function (event) {
      var row = event.target.closest("[data-pick]");
      if (row) { togglePick(row.getAttribute("data-pick")); }
    });
    document.getElementById("cmp-search").addEventListener("input", renderList);
    document.getElementById("cmp-groups").addEventListener("click", function (event) {
      var chip = event.target.closest("[data-group]");
      if (chip) { state.group = chip.getAttribute("data-group"); renderList(); }
    });
    document.getElementById("cmp-monthly").addEventListener("click", function (event) {
      var chip = event.target.closest("[data-monthly]");
      if (!chip) { return; }
      state.monthly = Number(chip.getAttribute("data-monthly")) || Common.MONTHLY_DEFAULT;
      renderMonthly();
      renderSummary();
      renderGrid();
    });
    document.getElementById("cmp-trend").addEventListener("click", function (event) {
      var chip = event.target.closest("[data-period]");
      if (chip) { renderTrend(chip.getAttribute("data-period")); }
    });
    coffeeInput.addEventListener("input", function (event) {
      var value = Number(event.target.value);
      state.coffee = Number.isFinite(value) && value >= 500 ? value : Common.COFFEE.price;
      renderSummary();
      renderGrid();
    });
  }

  document.addEventListener("DOMContentLoaded", start);
})();
