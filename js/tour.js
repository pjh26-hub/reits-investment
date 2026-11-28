/* ==========================================================================
   js/tour.js — 발표 투어 모드
   - 주소 끝에 ?tour=1 을 붙이면(첫 화면의 "2분 만에 둘러보기" 버튼) 화면 6개를 순서대로 돌며
     중요한 곳을 강조하고 한두 줄씩 설명한다. 교수님이 링크만 열어도 흐름을 따라올 수 있게.
   - Common.initPage 가 주소에 tour 가 있을 때만 이 파일을 불러온다 (평소에는 안 불러옴).
   - [다음]·[이전] 버튼, 키보드 ← → , Esc(끝내기). 다른 화면 차례가 되면 그 화면으로 이동한다.
   - 설명 문구는 사이트에 실제로 있는 기능과 데이터만 말한다. 금지어(Common.BANNED_WORDS)는 쓰지 않는다.
   ========================================================================== */
(function () {
  "use strict";

  // 차례: page(파일 이름), target(강조할 곳, CSS 선택자. 쉼표로 여러 개면 화면에 보이는 첫 번째), title, text
  var STEPS = [
    { page: "index.html", target: ".hero", title: "리츠 투자는 이런 사이트예요",
      text: "2030(대학생·사회초년생·월세 사는 1인가구)에게 리츠를 생활 언어로 설명해요. 좋은 점과 위험을 같은 크기로 보여주는 게 원칙이에요." },
    { page: "index.html", target: "#home-targets", title: "나는 ○○예요",
      text: "타깃을 고르면 아래 목록의 정렬 기준과 설명이 바뀌어요. 대학생은 1주 가격 낮은 순, 사회초년생은 세입자 계약이 오래 남은 순, 월세 1인가구는 배당수익률 높은 순이에요." },
    { page: "index.html", target: ".home-rule", title: "정렬 기준을 먼저 밝혀요",
      text: "이 순서는 권유가 아니라 기준 하나로 줄 세운 결과라는 걸 먼저 보여주고, '원금 손실 가능'을 항상 같이 붙여요." },
    { page: "index.html", target: "#home-list > :first-child", title: "실제 시세와 1년 그래프",
      text: "가격은 금융위원회 공공데이터의 전일 종가예요. 평일마다 자동으로 새로 받아 오고, 1주 가격을 커피 몇 잔 값으로 바꿔 보여줘요." },
    { page: "reit.html", query: "id=330590", target: ".reit-price-box", title: "리츠마다 자세히 보기",
      text: "카드의 '자세히 보기'를 누르면 이 화면이 나와요. 그래프를 손가락으로 훑으면 그날 종가가 보이고, 1개월·3개월·1년으로 바꿔 볼 수 있어요. ♥ 를 누르면 첫 화면 '내 관심 리츠'에 모여요." },
    { page: "reit.html", query: "id=330590", target: "#reit-div-sec", title: "배당은 언제 나왔나요",
      text: "지난 1년 동안 몇 월에, 1주당 얼마씩 배당이 나왔는지 달력으로 보여줘요. 날짜는 배당락일 기준이고, 앞으로도 같은 달이라는 뜻은 아니라고 같이 적어요." },
    { page: "reit.html", query: "id=330590", target: "#reit-sim-sec", title: "매달 커피값으로 모았다면",
      text: "지난 1년 실제 종가로, 매달 커피 한 잔 값씩 1주 단위로 모았다면 지금 얼마인지 계산해요. 손실이 났으면 손실도 그대로 보여줘요." },
    { page: "map.html", target: ".map-search", title: "자주 가는 그곳, 누가 가지고 있을까",
      text: "학교·회사·자취방 같은 장소를 검색하면 그 근처에 리츠가 가진 건물을 카카오맵에 표시해요." },
    { page: "map.html", target: "#map-kakao:not(.is-hidden), #map-canvas:not(.is-hidden)", title: "건물을 누르면",
      text: "로드뷰로 실제 건물 모습이 뜨고, '이 건물, ○○리츠가 가지고 있어요'와 1주 가격이 나와요. 매일 지나치던 건물이 투자 상품으로 보이는 순간이에요." },
    { page: "map.html", target: "[aria-label='내 동선 건물주 카드']", title: "내 동선 건물주 카드",
      text: "집·학교·자주 가는 곳을 넣으면 곳마다 가장 가까운 리츠 건물을 찾아 인스타 스토리 카드로 만들어요. 2030이 직접 공유하게 만드는 장치예요." },
    { page: "compare.html", target: "[aria-label='고르기']", title: "적금과 나란히",
      text: "리츠를 3개까지 골라 은행 적금과 같은 계산법(매달 넣는 돈 기준 1년 배당·이자)으로 비교해요. 적금 금리는 금융감독원 공개 자료예요." },
    { page: "learn.html", target: "#learn-list > :first-child", title: "어려운 말, 쉬운 말로",
      text: "배당, P/NAV, WALE 같은 말을 생활 언어로 풀었어요. 다른 화면에서 밑줄 친 말을 누르면 같은 설명이 말풍선으로 떠요." },
    { page: "card.html", target: "[aria-label='문구 만들기']", title: "타깃별 홍보 카드",
      text: "같은 리츠도 타깃마다 다른 문구로 카드를 만들어요. 투자 광고에 쓰면 안 되는 표현을 넣으면 저장을 막고, 출처·기준일·위험 고지는 카드에서 지울 수 없어요." },
    { page: "card.html", target: "#site-footer", title: "모든 숫자는 실제 데이터",
      text: "화면 맨 아래에 데이터 출처와 기준일을 항상 적어요. 값이 없으면 지어내지 않고 '데이터 없음'으로 보여줘요. 둘러봐 주셔서 고마워요!" }
  ];
  var PAGE_NAMES = { "index.html": "첫 화면", "reit.html": "자세히 보기", "map.html": "지도", "compare.html": "비교", "learn.html": "용어", "card.html": "홍보 카드" };
  var WAIT_MS = 4000;       // 강조할 곳이 늦게 그려지는 화면(목록·지도)을 기다리는 시간
  var REFRESH_MS = 400;     // 화면이 바뀌어도 강조 위치가 따라가게 다시 재는 간격

  var current = 0;          // 지금 차례 (1부터)
  var spot = null;
  var box = null;
  var timer = null;

  function currentPage() {
    var name = window.location.pathname.split("/").pop();
    return name || "index.html";
  }

  function stepFromUrl() {
    var m = /[?&]tour=(\d+)/.exec(window.location.search);
    return m ? Number(m[1]) : 0;
  }

  function isShown(el) {
    return !!(el && el.getClientRects().length);
  }

  function findTarget(selector) {
    var list = document.querySelectorAll(selector);
    for (var i = 0; i < list.length; i += 1) {
      if (isShown(list[i])) { return list[i]; }
    }
    return null;
  }

  function waitForTarget(selector, done) {
    var started = Date.now();
    (function check() {
      var el = findTarget(selector);
      if (el || Date.now() - started > WAIT_MS) { done(el); return; }
      window.setTimeout(check, 150);
    })();
  }

  function buildUi() {
    if (spot) { return; }
    spot = document.createElement("div");
    spot.className = "tour-spot";
    spot.setAttribute("aria-hidden", "true");
    box = document.createElement("div");
    box.className = "tour-box";
    box.setAttribute("role", "dialog");
    box.setAttribute("aria-label", "발표 투어");
    document.body.appendChild(spot);
    document.body.appendChild(box);
    box.addEventListener("click", function (event) {
      var button = event.target.closest("[data-tour]");
      if (!button) { return; }
      var action = button.getAttribute("data-tour");
      if (action === "next") { go(current + 1); }
      if (action === "prev") { go(current - 1); }
      if (action === "end") { end(); }
    });
    document.addEventListener("keydown", onKey);
    window.addEventListener("resize", placeSpot);
  }

  function onKey(event) {
    if (!box) { return; }
    var typing = /^(INPUT|TEXTAREA|SELECT)$/.test(event.target.tagName);
    if (event.key === "Escape") { end(); }
    if (typing) { return; }
    if (event.key === "ArrowRight") { go(current + 1); }
    if (event.key === "ArrowLeft") { go(current - 1); }
  }

  var target = null;

  function placeSpot() {
    if (!spot) { return; }
    if (!target || !isShown(target)) { spot.classList.add("is-hidden"); return; }
    var r = target.getBoundingClientRect();
    var pad = parseFloat(window.getComputedStyle(document.documentElement).getPropertyValue("--space-2")) || 0;
    // 화면 폭을 넘지 않게 자른다 (넘으면 옆으로 스크롤이 생김)
    var viewW = document.documentElement.clientWidth;
    var left = Math.max(0, r.left - pad);
    var right = Math.min(viewW, r.right + pad);
    spot.classList.remove("is-hidden");
    spot.style.top = (r.top + window.scrollY - pad) + "px";
    spot.style.left = (left + window.scrollX) + "px";
    spot.style.width = Math.max(0, right - left) + "px";
    spot.style.height = (r.height + pad * 2) + "px";
  }

  /** 아래 설명 상자에 가려지지 않게, 투어 중에는 페이지 아래에 상자 높이만큼 여백을 둔다 */
  function reserveSpace() {
    if (!box) { return; }
    var gap = parseFloat(window.getComputedStyle(document.documentElement).getPropertyValue("--space-6")) || 0;
    document.body.style.paddingBottom = (box.offsetHeight + gap * 2) + "px";
  }

  function scrollToTarget() {
    if (!target) { return; }
    var header = document.getElementById("site-header");
    var offset = (header ? header.offsetHeight : 0) + parseFloat(window.getComputedStyle(document.documentElement).getPropertyValue("--space-6") || 0);
    var top = target.getBoundingClientRect().top + window.scrollY - offset;
    window.scrollTo({ top: Math.max(0, top), behavior: "smooth" });
  }

  function renderBox(n, step) {
    var last = n === STEPS.length;
    box.innerHTML =
      '<div class="tour-head"><span class="tour-count">' + n + " / " + STEPS.length + " · " +
        Common.escapeHtml(PAGE_NAMES[step.page] || "") + "</span>" +
        '<button type="button" class="tour-close" data-tour="end" aria-label="투어 끝내기">×</button></div>' +
      '<p class="tour-title">' + Common.escapeHtml(step.title) + "</p>" +
      '<p class="tour-text">' + Common.escapeHtml(step.text) + "</p>" +
      '<div class="tour-actions">' +
        (n > 1 ? '<button type="button" class="btn btn-ghost" data-tour="prev">이전</button>' : "") +
        (last ? '<button type="button" class="btn btn-primary" data-tour="end">투어 끝내기</button>'
              : '<button type="button" class="btn btn-primary" data-tour="next">다음 →</button>') +
      "</div>" +
      '<p class="tour-hint">키보드 ← → 로 넘기고, Esc 로 끝낼 수 있어요.</p>';
    var primary = box.querySelector(".btn-primary");
    if (primary) { primary.focus({ preventScroll: true }); }
  }

  function show(n) {
    var step = STEPS[n - 1];
    current = n;
    buildUi();
    renderBox(n, step);
    reserveSpace();
    target = null;
    placeSpot();
    waitForTarget(step.target, function (el) {
      if (current !== n) { return; }
      target = el;
      scrollToTarget();
      placeSpot();
    });
    window.clearInterval(timer);
    timer = window.setInterval(placeSpot, REFRESH_MS);   // 목록·지도가 늦게 그려져 크기가 바뀌어도 따라간다
  }

  function go(n) {
    if (n < 1) { return; }
    if (n > STEPS.length) { end(); return; }
    var step = STEPS[n - 1];
    var search = "?" + (step.query ? step.query + "&" : "") + "tour=" + n;   // 상세 화면은 ?id=종목코드 가 같이 필요
    if (step.page !== currentPage() || (step.query && window.location.search.indexOf(step.query) === -1)) {
      window.location.href = step.page + search;
      return;
    }
    window.history.replaceState(null, "", window.location.pathname + search);
    show(n);
  }

  function end() {
    window.clearInterval(timer);
    document.removeEventListener("keydown", onKey);
    window.removeEventListener("resize", placeSpot);
    if (spot) { spot.remove(); }
    if (box) { box.remove(); }
    document.body.style.paddingBottom = "";
    spot = null;
    box = null;
    target = null;
    window.history.replaceState(null, "", window.location.pathname);
  }

  var first = stepFromUrl();
  if (first >= 1 && first <= STEPS.length) { go(first); }
})();
