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
