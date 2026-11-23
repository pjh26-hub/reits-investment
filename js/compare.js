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
      state.coffee = Number.isFinite(value) && value >= 500 ? value : Common.COFFEE.price;
      renderGrid();
    });
  }

  document.addEventListener("DOMContentLoaded", start);
})();
