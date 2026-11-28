/* ==========================================================================
   js/news.js — 뉴스 화면 (news.html)

   보여주는 것
     - [주거용] [상업용] 두 칸으로 나눈 최신 부동산 뉴스 (data/news.json, GitHub Actions 가 1시간마다 채움)
     - 처음 보이는 칸은 첫 화면에서 고른 타깃을 따른다 (월세 사는 1인가구 → 주거용, 나머지 → 상업용)
     - 이 목록에 많이 나온 말 (예: 물류 6 · 오피스 4)
     - 기사마다 "관련 리츠": 제목에 리츠 이름이 나오면 그 리츠, 아니면 같은 건물 유형(오피스·물류·리테일)을 가진 리츠
       → 리츠 상세 화면으로. (뉴스로 관심 → 상세에서 이해 → 비교·카드로 공유, 마케팅 흐름)

   꼭 지킬 것
     - 기사 본문은 저장하지도 보여주지도 않는다. 제목·언론사·시간·링크만. 누르면 언론사 원문으로.
     - "관련 리츠"는 건물 유형이 같다는 정보일 뿐 권유가 아니다. 금지어(Common.BANNED_WORDS)를 쓰지 않는다.
   ========================================================================== */
(function () {
  "use strict";

  var TABS = [
    { key: "residential", label: "주거용", desc: "아파트·전세·월세·청약·재건축" },
    { key: "commercial", label: "상업용", desc: "오피스·물류센터·상가·호텔·리츠" }
  ];
  // 상업용 뉴스의 건물 유형 → 우리 리츠 데이터의 대표 자산 유형
  var ASSET_WORDS = [
    { type: "물류", words: ["물류"] },
    { type: "오피스", words: ["오피스", "빌딩", "사옥"] },
    { type: "리테일", words: ["상가", "리테일", "백화점", "쇼핑몰", "아울렛", "마트"] }
  ];
  // 분류마다 많이 나온 말을 세는 목록
  var COUNT_WORDS = {
    residential: ["전세", "월세", "매매", "청약", "재건축", "재개발", "분양", "임대", "오피스텔", "빌라"],
    commercial: ["오피스", "물류", "상가", "리츠", "데이터센터", "호텔", "공실", "매각"]
  };
  var MAX_RELATED = 3;

  var state = { tab: null, news: null, products: [] };

  function $(id) { return document.getElementById(id); }
  function esc(v) { return Common.escapeHtml(v); }

  function itemsOf(tab) {
    return ((state.news && state.news.items) || []).filter(function (n) { return n && n.category === tab; });
  }

  /** "3분 전", "2시간 전", 하루 넘으면 "11월 27일" */
  function timeText(iso) {
    var t = Date.parse(iso || "");
    if (!isFinite(t)) { return ""; }
    var min = Math.floor((Date.now() - t) / 60000);
    if (min < 1) { return "방금"; }
    if (min < 60) { return min + "분 전"; }
    if (min < 24 * 60) { return Math.floor(min / 60) + "시간 전"; }
    var d = new Date(t);
    return (d.getMonth() + 1) + "월 " + d.getDate() + "일";
  }

  /** 건물 유형 (오피스텔은 주거 쪽이라 오피스로 세지 않는다) */
  function assetTypeOf(title) {
    var text = title.replace(/오피스텔/g, "");
    for (var i = 0; i < ASSET_WORDS.length; i += 1) {
      if (ASSET_WORDS[i].words.some(function (w) { return text.indexOf(w) !== -1; })) { return ASSET_WORDS[i].type; }
    }
    return null;
  }

  /** 관련 리츠: 제목에 이름이 나온 국내 리츠 먼저, 없으면 같은 건물 유형을 가진 리츠 (시가총액 큰 순) */
  function relatedOf(item) {
    var domestic = state.products.filter(function (p) { return p.type === "reit"; });
    var named = domestic.filter(function (p) { return item.title.indexOf(p.name) !== -1; });
    if (named.length) { return { why: "기사에 나온 리츠", list: named.slice(0, MAX_RELATED) }; }
    if (item.category !== "commercial") { return null; }
    var type = assetTypeOf(item.title);
    if (!type) { return null; }
    var same = domestic.filter(function (p) { return p.assetType === type; })
      .sort(function (a, b) { return (b.marketCap || 0) - (a.marketCap || 0); });
    return same.length ? { why: type + " 건물을 가진 리츠", list: same.slice(0, MAX_RELATED) } : null;
  }

  function renderTabs() {
    $("news-tabs").innerHTML = TABS.map(function (t) {
      var on = t.key === state.tab;
      return '<button type="button" class="chip' + (on ? " is-active" : "") + '" data-tab="' + t.key + '" aria-pressed="' + on + '">' +
        t.label + " " + itemsOf(t.key).length + "</button>";
    }).join("");
    var tab = TABS.filter(function (t) { return t.key === state.tab; })[0];
    $("news-tab-desc").textContent = tab.label + " 뉴스: " + tab.desc + " 관련 최신 기사 제목이에요.";
  }

  function renderWords(list) {
    var counts = COUNT_WORDS[state.tab].map(function (w) {
      // '오피스'를 셀 때 '오피스텔'은 빼고 센다
      return { word: w, n: list.filter(function (n) { return (w === "오피스" ? n.title.replace(/오피스텔/g, "") : n.title).indexOf(w) !== -1; }).length };
    }).filter(function (c) { return c.n > 0; }).sort(function (a, b) { return b.n - a.n; }).slice(0, 5);
    $("news-words").innerHTML = counts.length
      ? '<span class="news-words-label">이 목록에 많이 나온 말</span>' + counts.map(function (c) {
        return '<span class="news-word">' + esc(c.word) + " <b>" + c.n + "</b></span>";
      }).join("")
      : "";
  }

  function articleHtml(item) {
    var rel = relatedOf(item);
    var safeLink = /^https?:\/\//.test(item.link || "") ? item.link : null;
    return '<article class="card news-item">' +
      (safeLink
        ? '<a class="news-title" href="' + esc(safeLink) + '" target="_blank" rel="noopener noreferrer">' + esc(item.title) + "</a>"
        : '<p class="news-title">' + esc(item.title) + "</p>") +
      '<p class="news-meta">' + esc(item.source || "") + (item.published ? " · " + esc(timeText(item.published)) : "") + "</p>" +
      (rel ? '<div class="news-related"><span class="news-related-label">' + esc(rel.why) + "</span>" + rel.list.map(function (p) {
        return '<a class="news-reit" href="' + Common.detailHref(p.key) + '">' + esc(p.name) + "</a>";
      }).join("") + "</div>" : "") +
      "</article>";
  }

  function render() {
    renderTabs();
    var list = itemsOf(state.tab);
    renderWords(list);
    var box = $("news-list");
    if (!state.news || !(state.news.items || []).length) {
      box.innerHTML = '<p class="notice">아직 뉴스를 받아오지 못했어요. 뉴스 자동 수집이 켜지면 1시간마다 새 기사가 여기에 나와요.</p>';
    } else if (!list.length) {
      box.innerHTML = '<p class="notice">지금은 이 칸에 들어온 기사가 없어요. 1시간 뒤 다시 확인해 주세요.</p>';
    } else {
      box.innerHTML = list.map(articleHtml).join("");
    }
    var asOf = state.news && state.news.as_of;
    $("news-updated").textContent = asOf
      ? "마지막 수집 " + Common.formatDateTime(asOf) + " (한국 시간) · 1시간마다 새로 받아요(실시간 아님)"
      : "뉴스 자동 수집 전이에요.";
  }

  function start() {
    Common.initPage({ active: "news", sources: ["reits", "prices"] });
    var target = Common.getTarget();
    state.tab = target === "renter" ? "residential" : "commercial";
    var who = Common.TARGETS.filter(function (t) { return t.key === target; })[0];
    $("news-persona").textContent = who
      ? "첫 화면에서 '" + who.label + "'로 골라서 " + (state.tab === "residential" ? "주거용" : "상업용") + " 뉴스를 먼저 보여줘요. 위 버튼으로 바꿀 수 있어요."
      : "첫 화면에서 '나는 ○○예요'를 고르면 그 사람에게 맞는 칸을 먼저 보여줘요.";
    Common.loadAll(["news", "reits", "metrics", "prices", "dividends"]).then(function (data) {
      state.news = data.news;
      state.products = Common.buildProducts(data);
      render();
    });
    $("news-tabs").addEventListener("click", function (event) {
      var chip = event.target.closest("[data-tab]");
      if (!chip) { return; }
      state.tab = chip.getAttribute("data-tab");
      render();
    });
  }

  document.addEventListener("DOMContentLoaded", start);
})();
