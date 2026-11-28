/* ==========================================================================
   js/reit.js — 리츠 상세 화면 (reit.html?id=종목코드)

   보여주는 것
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

  var state = { product: null, profile: null, assets: [], global: null, mixKind: null, map: null };

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

    var chart = Common.sparkline(p.history, { width: 320, height: 68 });
    var yearPct = isNum(p.yearlyChangePct) ? p.yearlyChangePct : chart.changePct;
    $("reit-chart").innerHTML = chart.svg
      ? chart.svg + '<p class="spark-caption">최근 1년 주가 흐름 <span class="' + (yearPct > 0 ? "num-up" : (yearPct < 0 ? "num-down" : "")) + '">' +
        (yearPct > 0 ? "+" : "") + yearPct.toFixed(1) + "%</span>" + (p.type === "global" ? " (달러 기준)" : "") + "</p>"
      : '<p class="source-note">최근 1년 주가 기록: ' + Common.NA + "</p>";

    $("reit-actions").innerHTML = '<a class="btn btn-primary" href="compare.html?ids=' + encodeURIComponent(p.key) + '">적금과 비교하기</a>' +
      (p.type !== "etf" ? '<a class="btn btn-ghost" href="map.html">지도에서 찾아보기</a>' : "");
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
      renderHead();
      renderAmc();
      renderMix();
      $("reit-loading").classList.add("is-hidden");
      $("reit-body").classList.remove("is-hidden");
      renderAssets();          // 지도는 화면에 보인 뒤 그려야 크기가 맞는다
      if (product.type !== "etf") { renderNumbers(); } else { $("reit-docs-no").textContent = "03"; }
      renderDocs();
    });
  }

  document.addEventListener("DOMContentLoaded", start);
})();
