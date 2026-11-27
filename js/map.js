/* ==========================================================================
   js/map.js — 지도 페이지 (map.html)   ★ 담당: 팀원 (기본 기능은 들어 있음)

   지금 되는 것
     - [국내 리츠 건물] / [해외 리츠 본사·자산] 전환 버튼
         국내: 리츠가 직접 가진 건물을 지도에 표시 (좌표가 있는 건물만)
         해외: 본사가 있는 도시(초록 "본사" 핀) + 리츠마다 대표 보유 자산 2~3곳(노랑 점)
     - 해외 리츠 고르기: 종목 버튼, 본사 핀, 카드의 "한 화면에 보기" 를 누르면
       그 리츠의 본사와 대표 자산이 한 화면에 다 보이게 지도 범위를 맞춘다(fitBounds)
     - 자주 가는 장소를 찾으면 그 주변(반경 조절 가능)만 보여줌. 주변에 없으면 가장 가까운 3곳
     - 카드 "이 건물, ○○리츠가 가지고 있어요" + 생활 언어 지표 + 비교 화면 버튼
     - 지도가 안 떠도(인터넷 불안정) 목록과 글자 검색은 동작
     - 03 내 동선 건물주 카드: 3곳(집 근처·학교·회사·자주 가는 곳) → 곳마다 가장 가까운 리츠 건물 → 스토리 카드 PNG

   지도와 장소 검색 (2026-11-28 카카오맵 추가)
     - 국내: 카카오맵 지도 + 카카오 장소 검색 + 로드뷰(건물을 누르면 실제 거리 사진).
         KAKAO_JS_KEY 가 비어 있거나 카카오 지도를 못 불러오면 자동으로 아래 Leaflet 지도로 돌아간다.
     - 해외: Leaflet + OpenStreetMap (카카오맵에는 한국 밖이 거의 안 나와서). 화면에 "© OpenStreetMap contributors" 표시 필수.
         장소 검색은 OpenStreetMap Nominatim. 버튼을 눌렀을 때 한 번만 부른다(자동완성 금지, 1초에 1번 이하).
     - 장소 검색 결과는 어디에도 저장하지 않는다(localStorage 포함). state.center 에만 잠깐 둔다.
     - 카카오 JavaScript 키는 원래 웹페이지에 그대로 보이는 공개용 키다(.env 에 숨길 수 없음).
         카카오 개발자 사이트에 등록한 도메인(https://pjh26-hub.github.io, http://localhost:8772)에서만 작동한다.

   꼭 지킬 것 (HANDOFF_PROMPT.md)
     - 좌표는 data/ 의 값만 쓴다(국내: assets.json 의 lat·lng, 해외 본사: prices.json 의 hq_lat·hq_lng,
       해외 대표 자산: global_properties.json 의 lat·lng). 없으면 찍지 않는다.
     - 숫자·이름·주소를 코드에 직접 쓰지 않는다. 숫자 포맷과 번역은 Common 함수를 쓴다.
   ========================================================================== */
(function () {
  "use strict";

  // 카카오맵 JavaScript 키 (카카오 개발자 > 내 애플리케이션 > 앱 키 > JavaScript 키). 비워 두면 국내도 Leaflet 지도
  var KAKAO_JS_KEY = "27104759d7bebe7cf5c54ee8ce551e99";   // 앱 "리츠 투자"(ID 1669794), 등록 도메인: pjh26-hub.github.io, localhost:8772
  var KAKAO_SDK_URL = "https://dapi.kakao.com/v2/maps/sdk.js";
  var KAKAO_LOAD_TIMEOUT_MS = 8000;
  var ROADVIEW_RADIUS_M = 80;   // 건물 좌표에서 이 거리 안의 로드뷰 사진을 찾는다
  var TILE_URL = "https://tile.openstreetmap.org/{z}/{x}/{y}.png";
  var TILE_CREDIT = '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors';
  var SEARCH_URL = "https://nominatim.openstreetmap.org/search";
  // 자산 종류별 마커 색은 css/style.css 에 있는 공통 변수만 참조한다.
  var MARKER_COLOR_VARS = {
    office: "--color-primary", retail: "--color-accent", mixed: "--color-gold",
    global: "--color-good", "global-asset": "--color-gold", other: "--color-text-sub"
  };
  var LEGEND_HQ = "해외 리츠 본사";
  var LEGEND_GLOBAL_ASSET = "대표 보유 자산";

  // 국내·해외마다 다른 설정 (찾는 범위 선택지와 기본값, 화면 문구)
  var MARKETS = {
    kr: { label: "국내 리츠 건물", radii: [1, 3, 5, 10], radius: 3, unit: "건물", placeholder: "예: 강남역, ○○대학교" },
    global: { label: "해외 리츠 본사·자산", radii: [50, 100, 500, 1000], radius: 100, unit: "곳", placeholder: "예: 뉴욕, 시카고, 샌프란시스코" }
  };

  var state = {
    market: "kr",        // "kr" 국내 건물 / "global" 해외 리츠 본사·대표 자산
    assets: [],          // 국내: 좌표가 있는 건물
    globals: [],         // 해외: 본사 + 대표 보유 자산 (건물과 같은 모양으로 맞춘 것)
    globalReits: [],     // 해외 리츠 목록 [{ id, name, count }] (종목 고르기 버튼용)
    focusReit: null,     // 지금 모아 보는 해외 리츠 id (null 이면 전체)
    noCoordCount: 0,     // 좌표가 없어 지도에 못 찍은 국내 건물 수
    productById: {},     // 리츠 id → 상품 정보 (Common.buildProducts 결과)
    center: null,        // 사용자가 찾은 장소 { lat, lng, name }  ← 저장하지 않는다
    radiusKm: 3,
    map: null,           // Leaflet 지도
    layer: null,         // 마커 묶음
    centerLayer: null,   // 찾은 장소 표시 + 반경 원
    useKakao: false,     // 카카오맵을 불러왔으면 true → 국내는 카카오맵
    kakao: { map: null, overlays: [], circle: null, places: null, roadview: null, rvClient: null, rvTarget: null, rvPending: false },
    rvToken: 0,          // 로드뷰를 연달아 누르면 마지막 것만 보여준다
    route: [null, null, null],   // 동선 카드: 칸마다 { name, lat, lng, nearest: { asset, km } }  ← 저장하지 않는다
    routeTokens: [0, 0, 0],      // 칸마다 마지막 검색만 반영
    meta: null,                  // 카드 맨 아래 출처·기준일용 (data/meta.json)
    searchToken: 0,      // 이미 취소된 검색 응답은 화면에 반영하지 않는다
    lastSearchAt: 0      // Nominatim 요청 사이 간격 제한 (검색 기록 저장 아님)
  };

  /** 지금 쪽(국내/해외)을 그리는 지도. 국내는 카카오맵을 불러왔을 때만 카카오 */
  function engine() {
    return state.market === "kr" && state.useKakao ? "kakao" : "leaflet";
  }

  /** 지금 고른 쪽의 지점 목록. 해외에서 리츠를 골랐으면 그 리츠의 본사·자산만 */
  function places() {
    if (state.market !== "global") { return state.assets; }
    if (!state.focusReit) { return state.globals; }
    return state.globals.filter(function (a) { return a.reit_id === state.focusReit; });
  }

  function reitName(id) {
    var p = state.productById[id];
    return p ? p.name : id;
  }

  /** 받침에 맞는 조사: subject("롯데리츠") → "롯데리츠가", subject("이리츠코크렙") → "이리츠코크렙이" */
  function subject(word) {
    var text = String(word || "");
    var code = text.charCodeAt(text.length - 1);
    var hasFinal = code >= 0xAC00 && code <= 0xD7A3 && (code - 0xAC00) % 28 !== 0;
    return text + (hasFinal ? "이" : "가");
  }

  /** 실제 JSON 자산 유형을 색상 구분용 키로 바꾼다. */
  function assetKind(asset) {
    if (asset.isHq) { return "global"; }
    if (asset.isGlobalAsset) { return "global-asset"; }
    if (asset.asset_type === "오피스") { return "office"; }
    if (asset.asset_type === "리테일") { return "retail"; }
    if (asset.asset_type === "복합형") { return "mixed"; }
    return "other";
  }

  function legendLabel(asset) {
    if (asset.isHq) { return LEGEND_HQ; }
    if (asset.isGlobalAsset) { return LEGEND_GLOBAL_ASSET; }
    return asset.asset_type || "유형 데이터 없음";
  }

  /** 현재 지도에 표시할 종류만 범례에 넣는다. 본사는 지도와 같은 "본사" 핀 모양으로 보여준다. */
  function renderLegend() {
    var kinds = [];
    places().forEach(function (asset) {
      var item = { kind: assetKind(asset), label: legendLabel(asset) };
      if (!kinds.some(function (k) { return k.kind === item.kind && k.label === item.label; })) { kinds.push(item); }
    });
    document.getElementById("map-legend").innerHTML = kinds.map(function (item) {
      var sample = item.kind === "global"
        ? '<span class="map-hq-pin map-hq-pin--legend" aria-hidden="true">본사</span>'
        : '<span class="map-legend-dot map-legend-dot--' + item.kind + '" aria-hidden="true"></span>';
      return '<span class="map-legend-item">' + sample + Common.escapeHtml(item.label) + "</span>";
    }).join("");
  }

  /** 해외 리츠 고르기 버튼 (해외를 볼 때만) */
  function renderReits() {
    var box = document.getElementById("map-reits");
    if (state.market !== "global" || !state.globalReits.length) {
      box.innerHTML = "";
      box.classList.add("is-hidden");
      return;
    }
    var chips = [{ id: "", name: "전체", count: state.globals.length }].concat(state.globalReits);
    box.innerHTML = chips.map(function (r) {
      var active = (r.id || null) === state.focusReit;
      return '<button type="button" class="chip' + (active ? " is-active" : "") + '" data-reit="' + Common.escapeHtml(r.id) +
        '" aria-pressed="' + active + '">' + Common.escapeHtml(r.name) + " " + r.count + "</button>";
    }).join("");
    box.classList.remove("is-hidden");
  }

  /** 해외 리츠 하나를 고른다 → 본사와 대표 자산 핀이 한 화면에 다 보이도록 지도를 맞춘다 (id 가 없으면 전체) */
  function selectReit(id) {
    state.focusReit = id || null;
    state.center = null;                                   // 찾던 장소는 지운다 (리츠의 핀만 한 화면에)
    state.searchToken++;
    clearSearchChoices();
    document.getElementById("map-keyword").value = "";
    showNotice("");
    renderReits();
    renderLegend();
    renderResult();
  }

  /** 선택한 마커와 대응하는 카드를 연결한다. noScroll 이면 강조만 하고 화면은 움직이지 않는다 */
  function focusAssetCard(assetId, noScroll) {
    var previous = document.querySelector("#map-result .map-asset.is-active");
    if (previous) { previous.classList.remove("is-active"); }
    var card = document.getElementById("asset-" + assetId);
    if (!card) { return; }
    card.classList.add("is-active");
    if (noScroll) { return; }
    card.focus({ preventScroll: true });
    card.scrollIntoView({ behavior: "smooth", block: "center" });
  }

  /** 검색 후보는 화면에 잠시 보관하고, 선택/취소 후 즉시 비운다. */
  function clearSearchChoices() {
    var box = document.getElementById("map-search-choices");
    box.innerHTML = "";
    box.classList.add("is-hidden");
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
  function kmText(km) {
    // 10km 안은 소수 첫째 자리까지 (Common.formatNumber 는 정수로 반올림해서 직접 만든다)
    return typeof km === "number" ? " · 약 " + (km < 10 ? (Math.round(km * 10) / 10).toFixed(1) : Common.formatNumber(km)) + "km" : "";
  }

  /** 해외 리츠 하나를 한 화면에 모아 보는 버튼 (이미 모아 보는 중이면 "전체로" 버튼) */
  function focusButtonHtml(reitId) {
    return state.focusReit === reitId
      ? '<button type="button" class="btn btn-ghost" data-focus-reit="">해외 리츠 전체 보기</button>'
      : '<button type="button" class="btn btn-ghost" data-focus-reit="' + Common.escapeHtml(reitId) + '">본사·대표 자산 한 화면에 보기</button>';
  }

  function sourceLinkHtml(url) {
    return /^https:\/\//.test(url || "")
      ? ' · <a href="' + Common.escapeHtml(url) + '" target="_blank" rel="noopener noreferrer">보유 확인 출처</a>' : "";
  }

  /** 해외 리츠의 대표 보유 자산 카드 */
  function globalAssetCardHtml(asset, km) {
    return '<article class="card map-asset" tabindex="-1" id="asset-' + Common.escapeHtml(asset.asset_id) + '">' +
      '<p class="card-sub">' + Common.escapeHtml(asset.reit_name) + " · " + Common.escapeHtml(asset.ownership || "보유 방식 " + Common.NA) + "</p>" +
      '<h3 class="card-title">' + Common.escapeHtml(asset.name) + "</h3>" +
      '<p class="map-asset-meta"><span class="badge">' + Common.escapeHtml(asset.asset_type || "유형 " + Common.NA) + "</span> " +
        Common.escapeHtml(asset.city || "") + kmText(km) + "</p>" +
      (asset.desc ? '<p class="map-asset-desc">' + Common.escapeHtml(asset.desc) + "</p>" : "") +
      '<p class="raw-note">' + Common.escapeHtml(asset.address || "") + sourceLinkHtml(asset.source_url) + "</p>" +
      '<p class="raw-note"><span class="label-risk">원금 손실 가능</span></p>' +
      '<div class="map-asset-actions"><a class="btn" href="compare.html?ids=' + encodeURIComponent(asset.reit_id) + '">적금과 비교하기</a>' +
        focusButtonHtml(asset.reit_id) + "</div>" +
      "</article>";
  }

  function assetCardHtml(asset, km) {
    if (asset.isGlobalAsset) { return globalAssetCardHtml(asset, km); }
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
      : '<p class="card-sub">이 건물, ' + Common.escapeHtml(subject(asset.reit_name)) + " 가지고 있어요</p>" +
        '<h3 class="card-title">' + Common.escapeHtml(asset.name || "이름 " + Common.NA) + "</h3>";
    var hqNote = "";
    if (asset.isHq) {
      hqNote = '<p class="raw-note">' + (asset.propertyCount
        ? "이 리츠의 건물은 여러 도시에 아주 많아서, 지도에는 본사와 대표 자산 " + asset.propertyCount + "곳만 표시했어요."
        : "이 리츠의 건물은 여러 나라·도시에 아주 많아서, 지도에는 본사 위치만 표시했어요.") +
        (asset.note ? " " + Common.escapeHtml(asset.note) : "") + "</p>";
    }

    return '<article class="card map-asset" tabindex="-1" id="asset-' + Common.escapeHtml(asset.asset_id) + '">' + head +
      '<p class="map-asset-meta">' +
        '<span class="badge">' + Common.escapeHtml(asset.asset_type || "유형 " + Common.NA) + "</span> " +
        Common.escapeHtml(asset.address || "") + kmText(km) + "</p>" +
      linesHtml + hqNote +
      '<p class="raw-note"><span class="label-risk">원금 손실 가능</span></p>' +
      '<div class="map-asset-actions"><a class="btn" href="compare.html?ids=' + encodeURIComponent(asset.reit_id) + '">적금과 비교하기</a>' +
        (asset.isHq && asset.propertyCount ? focusButtonHtml(asset.reit_id) : "") +
        (!asset.isHq && state.useKakao
          ? '<button type="button" class="btn btn-ghost" data-rv-asset="' + Common.escapeHtml(asset.asset_id) + '">건물 모습 보기</button>' : "") +
        "</div>" +
      "</article>";
  }

  function renderResult() {
    var title = document.getElementById("map-result-title");
    var note = document.getElementById("map-result-note");
    var box = document.getElementById("map-result");
    var list = places();
    var unit = MARKETS[state.market].unit;
    var what = state.market === "global"
      ? (state.focusReit ? reitName(state.focusReit) + " 본사·대표 자산" : "해외 리츠 본사·대표 자산")
      : "리츠가 가진 건물";
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
      if (state.market === "global") {
        note.textContent = state.focusReit
          ? "이 리츠의 본사(초록 핀)와 대표 보유 자산(노랑 점)을 한 화면에 모았어요. 보유 자산은 전체가 아니라 대표적인 곳만 골랐어요."
          : "해외 리츠는 건물이 아주 많아서 본사와 대표 자산 2~3곳만 표시해요. 위에서 리츠를 고르면 그 리츠의 핀만 한 화면에 모아 보여줘요.";
      } else {
        note.textContent = "위에서 장소를 찾으면 그 근처만 보여줘요. 지금은 전체 목록이에요." +
          (state.noCoordCount ? " (위치 정보가 없는 건물 " + state.noCoordCount + "곳은 빠져 있어요)" : "");
      }
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
      var count = key === "global" ? state.globals.length : state.assets.length;
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

  function popupHtml(a) {
    var compare = '<br><a href="compare.html?ids=' + encodeURIComponent(a.reit_id) + '">적금과 비교하기</a>';
    if (a.isHq) {
      return "<b>" + Common.escapeHtml(a.name || "") + "</b><br>해외 리츠 본사 · " + Common.escapeHtml(a.address || "") +
        (a.propertyCount ? "<br>대표 자산 " + a.propertyCount + "곳을 함께 보여줘요" : "") + compare;
    }
    if (a.isGlobalAsset) {
      return "<b>" + Common.escapeHtml(a.name || "") + "</b><br>" + Common.escapeHtml(a.reit_name) + " · " +
        Common.escapeHtml(a.ownership || "") + "<br>" + Common.escapeHtml((a.asset_type || "") + " · " + (a.city || "")) + compare;
    }
    return "<b>" + Common.escapeHtml(a.name || "") + "</b><br>" + Common.escapeHtml(subject(a.reit_name)) + " 가지고 있어요" + compare;
  }

  /** 지금 쪽에 맞는 지도만 보이게 한다 (국내 카카오맵 / 해외·대체 Leaflet) */
  function syncMapVisibility() {
    var useKakao = engine() === "kakao";
    var kakaoBox = document.getElementById("map-kakao");
    var leafletBox = document.getElementById("map-canvas");
    var leafletWasHidden = leafletBox.classList.contains("is-hidden");
    kakaoBox.classList.toggle("is-hidden", !useKakao);
    leafletBox.classList.toggle("is-hidden", useKakao);
    if (useKakao && state.kakao.map) { state.kakao.map.relayout(); }
    if (!useKakao && state.map && leafletWasHidden) { state.map.invalidateSize(); }
    if (!useKakao) { hideRoadview(); }
  }

  /** rows 의 지점에 마커를 찍고, 찾은 장소와 반경 원을 그린 뒤 지도를 그 범위에 맞춘다 */
  function drawMarkers(rows) {
    syncMapVisibility();
    if (engine() === "kakao") { drawKakao(rows); } else { drawLeaflet(rows); }
  }

  function drawLeaflet(rows) {
    if (!state.map) { return; }
    var L = window.L;
    var points = [];
    state.layer.clearLayers();
    state.centerLayer.clearLayers();
    var rootStyle = window.getComputedStyle(document.documentElement);
    var markerRadius = parseFloat(rootStyle.getPropertyValue("--space-3"));
    var markerBorder = parseFloat(rootStyle.getPropertyValue("--space-1")) / 2;
    rows.forEach(function (row) {
      var a = row.asset;
      var marker;
      // 본사 핀을 누르면 그 리츠만 모아 다시 그린다 → 그때는 말풍선 대신 바로 모아 보기
      var willFocus = a.isHq && a.propertyCount > 0 && state.focusReit !== a.reit_id;
      if (a.isHq) {
        // 본사: 글자가 들어간 초록 "본사" 핀 (보유 자산의 동그란 점과 모양으로 구분). 누르면 그 리츠만 모아 본다
        marker = L.marker([a.lat, a.lng], {
          icon: L.divIcon({ className: "map-hq-icon", html: '<span class="map-hq-pin">본사</span>', iconSize: null }),
          title: a.name + " 본사", keyboard: true
        }).on("click", function () {
          if (willFocus) {
            // 마커를 다시 그리기 전에 Leaflet 의 클릭 처리가 끝나도록 한 박자 늦춘다
            window.setTimeout(function () { selectReit(a.reit_id); focusAssetCard(a.asset_id); }, 0);
          } else {
            focusAssetCard(a.asset_id);
          }
        });
      } else {
        var color = rootStyle.getPropertyValue(MARKER_COLOR_VARS[assetKind(a)]).trim();
        marker = L.circleMarker([a.lat, a.lng], {
          radius: markerRadius, weight: markerBorder, color: rootStyle.getPropertyValue("--color-surface").trim(),
          fillColor: color, fillOpacity: 1, title: a.name || ""
        }).on("click", function () {
          focusAssetCard(a.asset_id);
        });
      }
      if (!willFocus) { marker.bindPopup(popupHtml(a)); }
      marker.addTo(state.layer);
      points.push([a.lat, a.lng]);
    });
    if (state.center) {
      var c = [state.center.lat, state.center.lng];
      // 찾은 장소와 반경 원의 색은 style.css 의 강조색을 읽어서 쓴다
      var accent = rootStyle.getPropertyValue("--color-accent").trim();
      L.circle(c, { radius: state.radiusKm * 1000, color: accent, weight: 2, fillOpacity: 0.06 }).addTo(state.centerLayer);
      L.circleMarker(c, { radius: 7, color: accent, fillColor: accent, fillOpacity: 1 })
        .bindPopup(Common.escapeHtml(state.center.name)).addTo(state.centerLayer);
      points.push(c);
    }
    if (points.length === 1) {
      state.map.setView(points[0], state.market === "global" ? 8 : 14);
    } else if (points.length > 1) {
      // 본사와 보유 자산이 여러 주에 흩어져 있어도 한 화면에 다 보이게 범위를 맞춘다
      state.map.fitBounds(points, { padding: [40, 40], maxZoom: 15 });
    }
  }

  // ---------------------------------------------------------------------
  // 카카오맵 (국내): 지도 · 장소 검색 · 로드뷰
  // ---------------------------------------------------------------------
  /** 카카오맵 SDK 를 불러온다. 키가 없거나 실패·시간 초과면 false (→ Leaflet 지도) */
  function loadKakao() {
    return new Promise(function (resolve) {
      if (!KAKAO_JS_KEY) { resolve(false); return; }
      var done = false;
      function finish(ok) { if (!done) { done = true; resolve(ok); } }
      var timer = window.setTimeout(function () { finish(false); }, KAKAO_LOAD_TIMEOUT_MS);
      var script = document.createElement("script");
      script.src = KAKAO_SDK_URL + "?appkey=" + encodeURIComponent(KAKAO_JS_KEY) + "&libraries=services&autoload=false";
      script.onload = function () {
        if (!window.kakao || !window.kakao.maps || !window.kakao.maps.load) { window.clearTimeout(timer); finish(false); return; }
        window.kakao.maps.load(function () { window.clearTimeout(timer); finish(true); });
      };
      script.onerror = function () { window.clearTimeout(timer); finish(false); };
      document.head.appendChild(script);
    });
  }

  function initKakao() {
    var kakao = window.kakao;
    try {
      var box = document.getElementById("map-kakao");
      box.classList.remove("is-hidden");                      // 크기가 있어야 지도가 제대로 그려진다
      state.kakao.map = new kakao.maps.Map(box, { center: new kakao.maps.LatLng(36.4, 127.9), level: 13 });
      state.kakao.map.addControl(new kakao.maps.ZoomControl(), kakao.maps.ControlPosition.RIGHT);
      state.kakao.places = new kakao.maps.services.Places();
      return true;
    } catch (err) {
      return false;
    }
  }

  function kakaoLatLng(lat, lng) { return new window.kakao.maps.LatLng(lat, lng); }

  /** 건물 점 하나 (색은 범례와 같은 CSS 클래스). 누르면 카드 강조 + 로드뷰 */
  function kakaoDot(asset) {
    var el = document.createElement("button");
    el.type = "button";
    el.className = "map-k-dot map-legend-dot--" + assetKind(asset);
    el.title = (asset.name || "") + " · " + asset.reit_name;
    el.setAttribute("aria-label", el.title + " 건물 모습 보기");
    el.addEventListener("click", function () {
      focusAssetCard(asset.asset_id, true);
      showRoadview(asset, true);
    });
    return new window.kakao.maps.CustomOverlay({
      position: kakaoLatLng(asset.lat, asset.lng), content: el, xAnchor: 0.5, yAnchor: 0.5, clickable: true, zIndex: 2
    });
  }

  function drawKakao(rows) {
    var k = state.kakao;
    if (!k.map) { return; }
    var kakao = window.kakao;
    k.overlays.forEach(function (o) { o.setMap(null); });
    k.overlays = [];
    if (k.circle) { k.circle.setMap(null); k.circle = null; }
    var bounds = new kakao.maps.LatLngBounds();
    var count = 0;
    rows.forEach(function (row) {
      var overlay = kakaoDot(row.asset);
      overlay.setMap(k.map);
      k.overlays.push(overlay);
      bounds.extend(kakaoLatLng(row.asset.lat, row.asset.lng));
      count += 1;
    });
    if (state.center) {
      var c = state.center;
      var accent = window.getComputedStyle(document.documentElement).getPropertyValue("--color-accent").trim();
      k.circle = new kakao.maps.Circle({
        center: kakaoLatLng(c.lat, c.lng), radius: state.radiusKm * 1000,
        strokeWeight: 2, strokeColor: accent, strokeOpacity: 0.9, fillColor: accent, fillOpacity: 0.08
      });
      k.circle.setMap(k.map);
      var pin = document.createElement("div");
      pin.className = "map-k-center";
      pin.innerHTML = '<span class="map-k-center-dot" aria-hidden="true"></span><span class="map-k-center-label">' + Common.escapeHtml(c.name) + "</span>";
      var centerOverlay = new kakao.maps.CustomOverlay({ position: kakaoLatLng(c.lat, c.lng), content: pin, xAnchor: 0.5, yAnchor: 0.5, zIndex: 3 });
      centerOverlay.setMap(k.map);
      k.overlays.push(centerOverlay);
      // 반경 원이 다 보이게 원의 위·아래·왼쪽·오른쪽 끝도 범위에 넣는다
      var dLat = state.radiusKm / 111;
      var dLng = state.radiusKm / (111 * Math.cos(c.lat * Math.PI / 180));
      bounds.extend(kakaoLatLng(c.lat + dLat, c.lng + dLng));
      bounds.extend(kakaoLatLng(c.lat - dLat, c.lng - dLng));
      count += 2;
    }
    if (count === 1) {
      k.map.setLevel(4);
      k.map.setCenter(kakaoLatLng(rows[0].asset.lat, rows[0].asset.lng));
    } else if (count > 1) {
      k.map.setBounds(bounds, 40, 40, 40, 40);
    }
  }

  /**
   * 장소 검색 (국내 + 카카오맵: 카카오 장소 검색 / 그 외: OpenStreetMap Nominatim). 결과 모양은 둘 다 같게 맞춘다.
   * 결과: [{ name, display_name, lat, lon }] / [] 찾은 곳 없음 / null 연결 실패 / "wait" Nominatim 간격 제한
   */
  function fetchPlaces(keyword, market) {
    if (market === "kr" && state.useKakao) {
      return new Promise(function (resolve) {
        var Status = window.kakao.maps.services.Status;
        state.kakao.places.keywordSearch(keyword, function (data, status) {
          if (status === Status.OK) {
            resolve(data.map(function (d) {
              return { name: d.place_name, display_name: d.place_name + " · " + (d.road_address_name || d.address_name || ""),
                lat: Number(d.y), lon: Number(d.x) };
            }));
          } else {
            resolve(status === Status.ZERO_RESULT ? [] : null);
          }
        }, { size: 5 });
      });
    }
    // Nominatim 공용 서비스에 지나치게 자주 요청하지 않는다(1초에 1번 이하).
    var now = Date.now();
    if (now - state.lastSearchAt < 1100) { return Promise.resolve("wait"); }
    state.lastSearchAt = now;
    // 국내를 볼 때는 한국 안에서만, 해외를 볼 때는 전 세계에서 찾는다.
    var url = SEARCH_URL + "?format=jsonv2&limit=5&accept-language=ko" + (market === "kr" ? "&countrycodes=kr" : "") +
      "&q=" + encodeURIComponent(keyword);
    return fetch(url, { headers: { "Accept": "application/json" } })
      .then(function (res) { return res.ok ? res.json() : null; })
      .catch(function () { return null; });
  }

  /** 좌표가 제대로 된 검색 결과만 */
  function validPlaces(list) {
    return Array.isArray(list) ? list.filter(function (hit) {
      return hit && hit.lat !== null && hit.lon !== null && isFinite(Number(hit.lat)) && isFinite(Number(hit.lon));
    }) : [];
  }

  /** 검색 결과의 짧은 이름 (Nominatim 은 "이름, 구, 시, ..." 라서 앞 두 덩어리만) */
  function placeName(hit, fallback) {
    return String(hit.name || hit.display_name || fallback || "").split(",").slice(0, 2).join(",").trim();
  }

  /** 로드뷰 사진이 건물 쪽을 보도록 방향(북쪽 0도, 시계 방향)을 구한다 */
  function bearing(from, to) {
    var rad = Math.PI / 180;
    var y = Math.sin((to.lng - from.lng) * rad) * Math.cos(to.lat * rad);
    var x = Math.cos(from.lat * rad) * Math.sin(to.lat * rad) -
      Math.sin(from.lat * rad) * Math.cos(to.lat * rad) * Math.cos((to.lng - from.lng) * rad);
    return (Math.atan2(y, x) / rad + 360) % 360;
  }

  function faceRoadviewTarget() {
    var k = state.kakao;
    if (!k.rvPending || !k.rvTarget || !k.roadview) { return; }
    var at = k.roadview.getPosition();
    if (!at) { return; }
    k.rvPending = false;
    k.roadview.setViewpoint(new window.kakao.maps.Viewpoint(bearing({ lat: at.getLat(), lng: at.getLng() }, k.rvTarget), 0, 0));
  }

  function setRoadviewNote(text) {
    document.getElementById("map-rv-note").textContent = text;
  }

  /** "누가 가지고 있을까" 답: 건물 이름 · 주인 리츠 · 1주 가격 + 카카오 로드뷰 사진 */
  function showRoadview(asset, scroll) {
    if (!state.useKakao || asset.isHq || asset.isGlobalAsset) { return; }
    var kakao = window.kakao;
    var k = state.kakao;
    var p = state.productById[asset.reit_id] || null;
    var basis = p ? Common.formatPriceBasis(p) : "";
    document.getElementById("map-rv-owner").textContent = "이 건물, " + subject(asset.reit_name) + " 가지고 있어요";
    document.getElementById("map-rv-name").textContent = asset.name || "이름 " + Common.NA;
    document.getElementById("map-rv-meta").textContent = [asset.asset_type, asset.address].filter(Boolean).join(" · ");
    document.getElementById("map-rv-price").textContent = p
      ? "1주 가격 " + Common.formatWon(p.price) + (basis ? " (" + basis + ")" : "") : "";
    document.getElementById("map-rv-compare").setAttribute("href", "compare.html?ids=" + encodeURIComponent(asset.reit_id));
    var panel = document.getElementById("map-rv");
    var view = document.getElementById("map-rv-view");
    panel.classList.remove("is-hidden");
    view.classList.add("is-hidden");
    setRoadviewNote("거리 사진을 찾는 중이에요...");
    if (scroll) { panel.scrollIntoView({ behavior: "smooth", block: "nearest" }); }

    var token = ++state.rvToken;
    var target = kakaoLatLng(asset.lat, asset.lng);
    if (!k.rvClient) { k.rvClient = new kakao.maps.RoadviewClient(); }
    k.rvClient.getNearestPanoId(target, ROADVIEW_RADIUS_M, function (panoId) {
      if (token !== state.rvToken) { return; }
      if (panoId === null) {
        setRoadviewNote("이 건물 근처에는 카카오맵 로드뷰 사진이 없어요. 위치는 지도의 점으로 확인해 주세요.");
        return;
      }
      view.classList.remove("is-hidden");
      if (!k.roadview) {
        k.roadview = new kakao.maps.Roadview(view);
        ["init", "panoid_changed", "position_changed"].forEach(function (name) {
          kakao.maps.event.addListener(k.roadview, name, faceRoadviewTarget);
        });
      }
      k.rvTarget = { lat: asset.lat, lng: asset.lng };
      k.rvPending = true;
      k.roadview.setPanoId(panoId, target);
      k.roadview.relayout();
      setRoadviewNote("카카오맵 로드뷰 사진이에요. 찍은 때가 지금과 다를 수 있어요. 끌어서 둘러볼 수 있어요.");
    });
  }

  function hideRoadview() {
    state.rvToken++;
    var panel = document.getElementById("map-rv");
    if (panel) { panel.classList.add("is-hidden"); }
  }

  // ---------------------------------------------------------------------
  // 장소 찾기
  // ---------------------------------------------------------------------
  /** 이름·주소·리츠 이름에서 글자로 찾기 (지도 검색이 안 될 때 대신 쓴다) */
  function findInPlaces(keyword) {
    var word = keyword.replace(/\s+/g, "").toLowerCase();
    return places().filter(function (a) {
      return [a.name, a.address, a.city, a.reit_name].join(" ").replace(/\s+/g, "").toLowerCase().indexOf(word) !== -1;
    })[0] || null;
  }

  /** 검색 결과가 여러 곳이면 먼저 목록을 보여주고 고르게 한다. */
  function showSearchChoices(list) {
    var box = document.getElementById("map-search-choices");
    box.innerHTML = '<p class="field-label">찾은 장소가 여러 곳이에요. 하나를 선택해 주세요.</p>' +
      list.map(function (hit) {
        var fullName = String(hit.display_name || hit.name || "장소 이름 데이터 없음");
        var shortName = String(hit.name || fullName.split(",").slice(0, 2).join(",").trim());
        return '<button type="button" class="map-search-choice" data-place-lat="' + Number(hit.lat) +
          '" data-place-lng="' + Number(hit.lon) + '" data-place-name="' + Common.escapeHtml(shortName) +
          '">' + Common.escapeHtml(fullName) + '</button>';
      }).join("");
    box.classList.remove("is-hidden");
    showNotice("");
  }

  function searchPlace(keyword) {
    var token = ++state.searchToken;
    clearSearchChoices();
    showNotice("찾는 중이에요...");
    fetchPlaces(keyword, state.market).then(function (list) {
      if (token !== state.searchToken) { return; }        // 전환·재검색·취소한 이전 결과는 무시한다.
      if (list === "wait") { showNotice("장소 검색은 잠시 간격을 두고 다시 눌러 주세요."); return; }
      handleSearchResults(list, keyword);
    });
  }

  /** 장소 검색 결과 처리 (Nominatim·카카오 공통). list: [{ name, display_name, lat, lon }] / [] 없음 / null 연결 실패 */
  function handleSearchResults(list, keyword) {
    var valid = validPlaces(list);
    if (valid.length > 1) {
      showSearchChoices(valid);
      return;
    }
    if (valid.length === 1) {
      var hit = valid[0];
      state.center = { lat: Number(hit.lat), lng: Number(hit.lon), name: placeName(hit, keyword) };
      showNotice("");
    } else {
      // 외부 지도 검색이 실패하면 실제 JSON의 자산 이름으로만 찾는다.
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
  }

  function showNotice(text) {
    var el = document.getElementById("map-notice");
    el.textContent = text || "";
    el.classList.toggle("is-hidden", !text);
  }

  // ---------------------------------------------------------------------
  // 내 동선 건물주 카드: 집·학교(회사)·자주 가는 곳 → 곳마다 가장 가까운 리츠 건물 → 인스타 스토리 카드(1080×1920) PNG
  //   - 장소는 어디에도 저장하지 않는다(state.route 에만 잠깐). "집 근처" 칸은 카드에 장소 이름을 쓰지 않는다
  //   - 거리는 직선거리. 3km 안이 아니면 "근처"라고 쓰지 않는다
  // ---------------------------------------------------------------------
  var ROUTE_STOPS = [
    { label: "집 근처", hideName: true, placeholder: "예: 죽전역, ○○동 주민센터" },
    { label: "학교·회사", hideName: false, placeholder: "예: 단국대학교, 판교역" },
    { label: "자주 가는 곳", hideName: false, placeholder: "예: 강남역, 스타필드 하남" }
  ];
  var ROUTE_NEAR_KM = 3;
  var ROUTE_FILE = "reits-route-card.png";

  /** 국내 리츠 건물 중 가장 가까운 곳 { asset, km } (없으면 null) */
  function nearestAsset(lat, lng) {
    var best = null;
    state.assets.forEach(function (a) {
      var km = Common.distanceKm(lat, lng, a.lat, a.lng);
      if (best === null || km < best.km) { best = { asset: a, km: km }; }
    });
    return best;
  }

  function routeKmText(km) {
    return "직선거리 약 " + (km < 10 ? (Math.round(km * 10) / 10).toFixed(1) : Common.formatNumber(km)) + "km";
  }

  function routeEl(attr, i) {
    return document.querySelector("[" + attr + '="' + i + '"]');
  }

  function renderRouteStops() {
    document.getElementById("map-route-stops").innerHTML = ROUTE_STOPS.map(function (stop, i) {
      return '<div class="map-route-stop">' +
        '<label class="field-label" for="map-route-input-' + i + '">' + Common.escapeHtml(stop.label) +
          (stop.hideName ? ' <span class="map-route-tip">카드에는 장소 이름 없이 "집 근처"로만 나와요</span>' : "") + "</label>" +
        '<div class="map-route-row">' +
          '<input class="input" id="map-route-input-' + i + '" type="search" autocomplete="off" data-route-input="' + i +
            '" placeholder="' + Common.escapeHtml(stop.placeholder) + '">' +
          '<button type="button" class="btn btn-ghost" data-route-search="' + i + '">찾기</button>' +
        "</div>" +
        '<div class="map-search-choices is-hidden" data-route-choices="' + i + '" role="group" aria-label="' +
          Common.escapeHtml(stop.label) + ' 검색 결과"></div>' +
        '<div class="map-route-picked is-hidden" data-route-picked="' + i + '"></div>' +
        "</div>";
    }).join("");
  }

  function setRouteNotice(text) {
    var el = document.getElementById("map-route-notice");
    el.textContent = text || "";
    el.classList.toggle("is-hidden", !text);
  }

  function setRouteChoices(i, list) {
    var box = routeEl("data-route-choices", i);
    if (!list || !list.length) { box.innerHTML = ""; box.classList.add("is-hidden"); return; }
    box.innerHTML = '<p class="field-label">찾은 장소가 여러 곳이에요. 하나를 골라 주세요.</p>' + list.map(function (hit) {
      return '<button type="button" class="map-search-choice" data-route-choice="' + i + '" data-place-lat="' + Number(hit.lat) +
        '" data-place-lng="' + Number(hit.lon) + '" data-place-name="' + Common.escapeHtml(placeName(hit)) + '">' +
        Common.escapeHtml(String(hit.display_name || hit.name || "")) + "</button>";
    }).join("");
    box.classList.remove("is-hidden");
  }

  function renderRoutePicked(i) {
    var box = routeEl("data-route-picked", i);
    var stop = state.route[i];
    if (!stop) { box.innerHTML = ""; box.classList.add("is-hidden"); return; }
    var near = stop.nearest;
    box.innerHTML = "<p><b>" + Common.escapeHtml(stop.name) + "</b> → " + (near
      ? "가장 가까운 리츠 건물 <b>" + Common.escapeHtml(near.asset.name || "이름 " + Common.NA) + "</b> (" +
        Common.escapeHtml(near.asset.reit_name) + ", " + routeKmText(near.km) + ")"
      : "위치 정보가 있는 리츠 건물이 없어요") + "</p>" +
      '<button type="button" class="btn btn-ghost" data-route-clear="' + i + '">지우기</button>';
    box.classList.remove("is-hidden");
  }

  function pickRouteStop(i, lat, lng, name) {
    state.route[i] = { name: name, lat: lat, lng: lng, nearest: nearestAsset(lat, lng) };
    setRouteChoices(i, null);
    renderRoutePicked(i);
    drawRouteCard();
  }

  function routeSearch(i) {
    var keyword = routeEl("data-route-input", i).value.trim();
    if (!keyword) { return; }
    var token = ++state.routeTokens[i];
    setRouteChoices(i, null);
    setRouteNotice("찾는 중이에요...");
    fetchPlaces(keyword, "kr").then(function (list) {
      if (token !== state.routeTokens[i]) { return; }
      if (list === "wait") { setRouteNotice("장소 검색은 잠시 간격을 두고 다시 눌러 주세요."); return; }
      var valid = validPlaces(list);
      if (!valid.length) {
        setRouteNotice(list === null ? "장소 검색에 연결하지 못했어요. 잠시 뒤 다시 찾아 주세요." : "찾는 장소가 없어요. 다른 말로 찾아보세요.");
        return;
      }
      setRouteNotice("");
      if (valid.length === 1) {
        pickRouteStop(i, Number(valid[0].lat), Number(valid[0].lon), placeName(valid[0], keyword));
      } else {
        setRouteChoices(i, valid);
      }
    });
  }

  // --- 캔버스 그리기 도구 (색·크기는 style.css 변수에서 읽는다) ---
  function cssVar(name) { return window.getComputedStyle(document.documentElement).getPropertyValue(name).trim(); }
  function cssNum(name) { return parseFloat(cssVar(name)); }
  function setFont(ctx, weight, size) { ctx.font = weight + " " + Math.round(size) + "px " + cssVar("--font-base"); }

  function fillRound(ctx, x, y, w, h, r) {
    r = Math.min(r, w / 2, h / 2);
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.arcTo(x + w, y, x + w, y + h, r);
    ctx.arcTo(x + w, y + h, x, y + h, r);
    ctx.arcTo(x, y + h, x, y, r);
    ctx.arcTo(x, y, x + w, y, r);
    ctx.closePath();
    ctx.fill();
  }

  /** 띄어쓰기 단위로 줄을 나눈다. 한 단어가 한 줄보다 길 때만 글자 단위로 */
  function wrapText(ctx, text, maxWidth) {
    var lines = [];
    String(text).split("\n").forEach(function (paragraph) {
      var line = "";
      paragraph.split(/(\s+)/).forEach(function (chunk) {
        if (!chunk) { return; }
        if (ctx.measureText(line + chunk).width <= maxWidth) { line += chunk; return; }
        if (line.trim()) { lines.push(line.trim()); line = ""; }
        Array.from(chunk.trim()).forEach(function (ch) {
          if (line && ctx.measureText(line + ch).width > maxWidth) { lines.push(line); line = ""; }
          line += ch;
        });
      });
      if (line.trim()) { lines.push(line.trim()); }
    });
    return lines;
  }

  /** maxLines 줄 안에 들어갈 때까지 글자를 줄인다 */
  function fitText(ctx, text, maxWidth, maxLines, maxSize, minSize, weight) {
    for (var size = maxSize; size >= minSize; size -= 1) {
      setFont(ctx, weight, size);
      var lines = wrapText(ctx, text, maxWidth);
      if (lines.length <= maxLines) { return { size: size, lines: lines, lineHeight: Math.ceil(size * 1.3), weight: weight }; }
    }
    setFont(ctx, weight, minSize);
    return { size: minSize, lines: wrapText(ctx, text, maxWidth).slice(0, maxLines), lineHeight: Math.ceil(minSize * 1.3), weight: weight };
  }

  function paintText(ctx, fitted, x, y) {
    setFont(ctx, fitted.weight, fitted.size);
    fitted.lines.forEach(function (line, n) { ctx.fillText(line, x, y + n * fitted.lineHeight); });
    return y + fitted.lines.length * fitted.lineHeight;
  }

  /** 카드에 들어가는 글자 전부 (금지어 검사용) */
  function routeCardTexts(stops, hook) {
    var texts = ["리츠 투자", "데이터로 읽는 부동산", "내 동선 속 리츠 건물", hook];
    stops.forEach(function (row) {
      texts.push(row.label, row.from, row.building, row.owner, row.meta);
    });
    return texts.join(" ");
  }

  /** 스토리 카드를 그린다. 저장할 수 있으면 true */
  function drawRouteCard() {
    var canvas = document.getElementById("map-route-canvas");
    var ctx = canvas && canvas.getContext("2d");
    var button = document.getElementById("map-route-download");
    if (!ctx) { return false; }
    var W = canvas.width;
    var H = canvas.height;
    var u = cssNum("--space-4");                 // 간격 기본 단위
    var fsXl = cssNum("--fs-xl");
    var fsLg = cssNum("--fs-lg");
    var radius = cssNum("--radius");
    var side = u * 5;
    var inner = W - side * 2;

    var stops = [];
    state.route.forEach(function (stop, i) {
      if (!stop || !stop.nearest) { return; }
      var a = stop.nearest.asset;
      var p = state.productById[a.reit_id] || null;
      var basis = p ? Common.formatPriceBasis(p) : "";
      stops.push({
        label: ROUTE_STOPS[i].label,
        from: ROUTE_STOPS[i].hideName ? "" : stop.name + "에서",
        building: a.name || "이름 " + Common.NA,
        owner: subject(a.reit_name) + " 가지고 있어요",
        meta: routeKmText(stop.nearest.km) + (p && p.price ? " · 1주 " + Common.formatWon(p.price) + (basis ? " (" + basis + ")" : "") : ""),
        km: stop.nearest.km
      });
    });
    var allNear = stops.length > 0 && stops.every(function (row) { return row.km <= ROUTE_NEAR_KM; });
    var hook = allNear ? "자주 가는 곳 근처에 리츠가 가진 건물이 있어요" : "자주 가는 곳에서 가장 가까운 리츠 건물을 찾아봤어요";

    // 바탕
    ctx.clearRect(0, 0, W, H);
    ctx.fillStyle = cssVar("--color-bg");
    ctx.fillRect(0, 0, W, H);
    ctx.fillStyle = cssVar("--color-surface");
    fillRound(ctx, u * 3, u * 3, W - u * 6, H - u * 6, radius * 2);
    ctx.textBaseline = "top";

    // 머리: 브랜드 + 제목 + 한 줄
    ctx.fillStyle = cssVar("--color-primary");
    fillRound(ctx, side, side, u * 8, u * 0.7, radius);
    ctx.fillStyle = cssVar("--color-text");
    setFont(ctx, 800, fsXl * 1.4);
    ctx.fillText("리츠 투자", side, side + u * 2);
    ctx.fillStyle = cssVar("--color-text-sub");
    setFont(ctx, 600, fsLg * 1.05);
    ctx.fillText("데이터로 읽는 부동산", side, side + u * 5.6);
    ctx.fillStyle = cssVar("--color-text");
    var y = paintText(ctx, fitText(ctx, "내 동선 속\n리츠 건물", inner, 2, fsXl * 3, fsXl * 2, 800), side, side + u * 10);
    ctx.fillStyle = cssVar("--color-primary");
    y = paintText(ctx, fitText(ctx, hook, inner, 2, fsLg * 1.7, fsLg * 1.2, 700), side, y + u * 1.5);

    // 꼬리: 고지 + 출처·기준일 (지울 수 없게 자동으로)
    var footerTop = H - u * 16;
    var disclaimer = Common.getCardDisclaimer(state.meta, ["assets", "prices"]);
    ctx.fillStyle = cssVar("--color-surface-2");
    ctx.fillRect(u * 3, footerTop, W - u * 6, H - footerTop - u * 3);
    ctx.fillStyle = cssVar("--color-text-sub");
    paintText(ctx, fitText(ctx, disclaimer, inner, 5, fsLg * 1.3, cssNum("--fs-xs") * 1.4, 600), side, footerTop + u * 2);

    // 가운데: 곳마다 한 칸
    var top = y + u * 3;
    var gap = u * 1.5;
    var blockH = (footerTop - u * 3 - top - gap * 2) / 3;
    if (!stops.length) {
      ctx.fillStyle = cssVar("--color-text-sub");
      paintText(ctx, fitText(ctx, "장소를 1곳 이상 넣으면\n카드가 만들어져요", inner, 3, fsLg * 1.6, fsLg, 700), side, top);
    }
    stops.forEach(function (row, n) {
      var bx = side;
      var by = top + n * (blockH + gap);
      var pad = u * 2.2;
      var tw = inner - pad * 2;
      ctx.fillStyle = cssVar("--color-surface-2");
      fillRound(ctx, bx, by, inner, blockH, radius * 1.5);
      // 칸 이름 배지 + 어디에서
      setFont(ctx, 800, fsLg * 1.15);
      var chipW = ctx.measureText(row.label).width + u * 2.4;
      var chipH = fsLg * 1.15 + u * 1.4;
      ctx.fillStyle = cssVar("--color-primary-soft");
      fillRound(ctx, bx + pad, by + pad, chipW, chipH, radius);
      ctx.fillStyle = cssVar("--color-primary");
      ctx.fillText(row.label, bx + pad + u * 1.2, by + pad + u * 0.7);
      if (row.from) {
        ctx.fillStyle = cssVar("--color-text-sub");
        var fromFit = fitText(ctx, row.from, tw - chipW - u, 1, fsLg * 1.1, fsLg * 0.8, 600);
        paintText(ctx, fromFit, bx + pad + chipW + u, by + pad + (chipH - fromFit.size) / 2);
      }
      // 건물 이름 · 주인 리츠 · 거리와 1주 가격
      var ty = by + pad + chipH + u * 1.2;
      ctx.fillStyle = cssVar("--color-text");
      ty = paintText(ctx, fitText(ctx, row.building, tw, 2, fsXl * 1.6, fsLg * 1.2, 800), bx + pad, ty);
      ctx.fillStyle = cssVar("--color-primary");
      ty = paintText(ctx, fitText(ctx, row.owner, tw, 1, fsLg * 1.4, fsLg, 700), bx + pad, ty + u * 0.4);
      ctx.fillStyle = cssVar("--color-text-sub");
      paintText(ctx, fitText(ctx, row.meta, tw, 2, fsLg * 1.15, fsLg * 0.85, 600), bx + pad, ty + u * 0.4);
    });

    var ok = stops.length > 0 && Common.checkBannedWords(routeCardTexts(stops, hook) + " " + disclaimer).ok;
    canvas.setAttribute("aria-label", stops.length
      ? "내 동선 건물주 카드 미리 보기: " + stops.map(function (row) { return row.label + " " + row.building; }).join(", ")
      : "내 동선 건물주 카드 미리 보기");
    button.disabled = !ok;
    document.getElementById("map-route-status").textContent = "";
    return ok;
  }

  function saveRouteBlob(blob) {
    var url = URL.createObjectURL(blob);
    var link = document.createElement("a");
    link.download = ROUTE_FILE;
    link.href = url;
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.setTimeout(function () { URL.revokeObjectURL(url); }, 3000);
    document.getElementById("map-route-status").textContent = "PNG 파일 저장을 요청했어요. 브라우저의 다운로드 목록을 확인해 주세요.";
  }

  /** 휴대폰은 공유 창(이미지 저장), 그 밖에는 PNG 바로 저장 — 홍보 카드와 같은 방식 */
  function downloadRouteCard() {
    if (!drawRouteCard()) { return; }
    var status = document.getElementById("map-route-status");
    try {
      var dataUrl = document.getElementById("map-route-canvas").toDataURL("image/png");
      var binary = window.atob(dataUrl.split(",")[1]);
      var bytes = new Uint8Array(binary.length);
      for (var i = 0; i < binary.length; i += 1) { bytes[i] = binary.charCodeAt(i); }
      var blob = new Blob([bytes], { type: "image/png" });
      var file = typeof File === "function" ? new File([blob], ROUTE_FILE, { type: "image/png" }) : null;
      if (file && navigator.share && navigator.canShare && navigator.canShare({ files: [file] })) {
        status.textContent = "공유 메뉴에서 '이미지 저장'이나 '파일에 저장'을 선택해 주세요.";
        navigator.share({ files: [file], title: "내 동선 건물주 카드" }).catch(function (error) {
          if (error && error.name === "AbortError") { status.textContent = "공유가 취소됐어요."; } else { saveRouteBlob(blob); }
        });
      } else {
        saveRouteBlob(blob);
      }
    } catch (error) {
      status.textContent = "PNG 저장에 실패했어요. 다른 브라우저에서 다시 시도해 주세요.";
    }
  }

  function initRouteCard() {
    renderRouteStops();
    var box = document.getElementById("map-route-stops");
    box.addEventListener("click", function (event) {
      var search = event.target.closest("[data-route-search]");
      if (search) { routeSearch(Number(search.getAttribute("data-route-search"))); return; }
      var choice = event.target.closest("[data-route-choice]");
      if (choice) {
        var lat = Number(choice.getAttribute("data-place-lat"));
        var lng = Number(choice.getAttribute("data-place-lng"));
        if (isFinite(lat) && isFinite(lng)) {
          pickRouteStop(Number(choice.getAttribute("data-route-choice")), lat, lng, choice.getAttribute("data-place-name"));
        }
        return;
      }
      var clear = event.target.closest("[data-route-clear]");
      if (clear) {
        var i = Number(clear.getAttribute("data-route-clear"));
        state.route[i] = null;
        state.routeTokens[i]++;
        routeEl("data-route-input", i).value = "";
        renderRoutePicked(i);
        drawRouteCard();
      }
    });
    box.addEventListener("keydown", function (event) {
      var input = event.target.closest("[data-route-input]");
      if (input && event.key === "Enter") { routeSearch(Number(input.getAttribute("data-route-input"))); }
    });
    document.getElementById("map-route-download").addEventListener("click", downloadRouteCard);
    // 웹폰트가 다 받아진 뒤에 그려야 카드 글꼴이 화면과 같다
    if (document.fonts && document.fonts.ready) { document.fonts.ready.then(drawRouteCard); } else { drawRouteCard(); }
  }

  // ---------------------------------------------------------------------
  // 해외 리츠: 본사 + 대표 보유 자산을 국내 건물과 같은 모양으로 맞춘다
  // ---------------------------------------------------------------------
  function buildGlobals(products, globalFile) {
    var notes = {};
    ((globalFile && globalFile.items) || []).forEach(function (g) { if (g && g.id && g.note) { notes[g.id] = g.note; } });
    products.forEach(function (p) {
      if (p.type !== "global" || !p.id) { return; }
      var props = p.properties || [];
      var count = 0;
      if (p.hqLat !== null && p.hqLng !== null) {
        state.globals.push({ asset_id: "hq-" + p.id, reit_id: p.id, reit_name: p.name, name: p.name, isHq: true,
          asset_type: "해외 리츠" + (p.country ? " · " + p.country : ""), address: p.hq, lat: p.hqLat, lng: p.hqLng,
          propertyCount: props.length,
          note: [notes[p.id], p.hqNote ? "(" + p.hqNote + ")" : ""].filter(Boolean).join(" ") });   // 본사 이전 안내도 같이
        count += 1;
      }
      props.forEach(function (a, i) {
        state.globals.push({ asset_id: "gp-" + p.id + "-" + i, reit_id: p.id, reit_name: p.name, name: a.name,
          isGlobalAsset: true, asset_type: a.type || null, city: a.city || "", address: a.address || a.city || "",
          ownership: a.ownership || "", desc: a.desc || "", source_url: a.source_url || "", lat: a.lat, lng: a.lng });
        count += 1;
      });
      if (count) { state.globalReits.push({ id: p.id, name: p.name, count: count }); }
    });
  }

  // ---------------------------------------------------------------------
  // 시작
  // ---------------------------------------------------------------------
  function start() {
    Common.initPage({ active: "map", sources: ["assets", "prices", "global_properties", "dividends", "metrics", "assumptions"] });

    Promise.all([
      Common.loadAll(["assets", "reits", "metrics", "prices", "dividends", "global_properties", "assumptions", "meta"]),
      loadKakao()
    ]).then(function (loaded) {
      var data = loaded[0];
      state.useKakao = loaded[1] && initKakao();            // 카카오맵을 못 불러오면 국내도 Leaflet 지도
      document.getElementById("map-provider-note").textContent = state.useKakao
        ? "지도·장소 검색·로드뷰: 국내는 카카오맵, 해외는 OpenStreetMap."
        : "지도와 장소 검색: OpenStreetMap.";
      Common.applyAssumptions(data.assumptions);           // 배당 번역 문구의 커피 잔수 계산용 (없으면 "데이터 없음")
      state.meta = Common.metaForPrices(data.meta, data.prices);   // 동선 카드 출처·기준일 (저장본을 쓰면 저장본 것으로)
      var assets = (data.assets && data.assets.items) || [];
      state.assets = assets.filter(function (a) { return typeof a.lat === "number" && typeof a.lng === "number"; });
      state.noCoordCount = assets.length - state.assets.length;
      var products = Common.buildProducts(data);
      products.forEach(function (p) { if (p.id) { state.productById[p.id] = p; } });
      buildGlobals(products, data.global_properties);
      if (!initMap() && !state.useKakao) {
        showNotice("지도를 불러오지 못했어요(인터넷 연결 확인). 아래 목록과 글자 검색은 쓸 수 있어요.");
      }
      renderMarket();
      renderReits();
      renderLegend();
      renderResult();
      initRouteCard();
    });

    document.getElementById("map-market").addEventListener("click", function (event) {
      var button = event.target.closest("[data-market]");
      if (!button || button.getAttribute("data-market") === state.market) { return; }
      state.market = button.getAttribute("data-market");
      state.radiusKm = MARKETS[state.market].radius;
      state.center = null;                               // 찾던 장소는 지운다
      state.focusReit = null;
      state.searchToken++;
      clearSearchChoices();
      document.getElementById("map-keyword").value = "";
      showNotice("");
      renderMarket();
      renderReits();
      renderLegend();
      renderResult();
    });
    // 해외 리츠 고르기 버튼 → 그 리츠의 본사·대표 자산만 한 화면에
    document.getElementById("map-reits").addEventListener("click", function (event) {
      var button = event.target.closest("[data-reit]");
      if (button) { selectReit(button.getAttribute("data-reit")); }
    });
    // 카드의 "본사·대표 자산 한 화면에 보기" / "해외 리츠 전체 보기" / "건물 모습 보기"(카카오 로드뷰)
    document.getElementById("map-result").addEventListener("click", function (event) {
      var rvButton = event.target.closest("[data-rv-asset]");
      if (rvButton) {
        var id = rvButton.getAttribute("data-rv-asset");
        var asset = state.assets.filter(function (a) { return a.asset_id === id; })[0];
        if (asset) { focusAssetCard(id, true); showRoadview(asset, true); }
        return;
      }
      var button = event.target.closest("[data-focus-reit]");
      if (!button) { return; }
      selectReit(button.getAttribute("data-focus-reit"));
      document.getElementById("map-canvas").scrollIntoView({ behavior: "smooth", block: "center" });
    });
    document.getElementById("map-rv-close").addEventListener("click", hideRoadview);
    document.getElementById("map-search-btn").addEventListener("click", function () {
      var keyword = document.getElementById("map-keyword").value.trim();
      if (keyword) { searchPlace(keyword); }
    });
    document.getElementById("map-keyword").addEventListener("keydown", function (event) {
      if (event.key === "Enter") { document.getElementById("map-search-btn").click(); }
    });
    // 장소 목록을 선택하면 좌표를 그때만 사용하고, 후보 목록은 즉시 지운다.
    document.getElementById("map-search-choices").addEventListener("click", function (event) {
      var choice = event.target.closest(".map-search-choice");
      if (!choice) { return; }
      var lat = Number(choice.getAttribute("data-place-lat"));
      var lng = Number(choice.getAttribute("data-place-lng"));
      if (!isFinite(lat) || !isFinite(lng)) { return; }
      state.center = { lat: lat, lng: lng, name: choice.getAttribute("data-place-name") };
      state.searchToken++;
      clearSearchChoices();
      showNotice("");
      renderResult();
    });
    document.getElementById("map-keyword").addEventListener("input", function () {
      state.searchToken++;
      clearSearchChoices();
      showNotice("");
    });
    document.getElementById("map-radius").addEventListener("change", function (event) {
      state.radiusKm = Number(event.target.value) || MARKETS[state.market].radius;
      renderResult();
    });
    document.getElementById("map-reset-btn").addEventListener("click", function () {
      state.center = null;
      state.focusReit = null;
      state.searchToken++;
      hideRoadview();
      clearSearchChoices();
      document.getElementById("map-keyword").value = "";
      showNotice("");
      renderReits();
      renderLegend();
      renderResult();
    });
  }

  document.addEventListener("DOMContentLoaded", start);
})();
