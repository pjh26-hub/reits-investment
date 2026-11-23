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

   지도와 장소 검색
     - 지도: Leaflet + OpenStreetMap (API 키가 필요 없음). 화면에 "© OpenStreetMap contributors" 표시 필수.
     - 장소 검색: OpenStreetMap Nominatim. 버튼을 눌렀을 때 한 번만 부른다(자동완성 금지, 1초에 1번 이하).
     - 장소 검색 결과는 어디에도 저장하지 않는다(localStorage 포함). state.center 에만 잠깐 둔다.
     - 카카오맵으로 바꾸고 싶으면 initMap / searchPlace / drawMarkers 세 함수만 바꾸면 된다.

   꼭 지킬 것 (HANDOFF_PROMPT.md)
     - 좌표는 data/ 의 값만 쓴다(국내: assets.json 의 lat·lng, 해외 본사: prices.json 의 hq_lat·hq_lng,
       해외 대표 자산: global_properties.json 의 lat·lng). 없으면 찍지 않는다.
     - 숫자·이름·주소를 코드에 직접 쓰지 않는다. 숫자 포맷과 번역은 Common 함수를 쓴다.
   ========================================================================== */
(function () {
  "use strict";

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
    searchToken: 0,      // 이미 취소된 검색 응답은 화면에 반영하지 않는다
    lastSearchAt: 0      // Nominatim 요청 사이 간격 제한 (검색 기록 저장 아님)
  };

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

  /** 선택한 마커와 대응하는 카드를 연결한다. */
  function focusAssetCard(assetId) {
    var previous = document.querySelector("#map-result .map-asset.is-active");
    if (previous) { previous.classList.remove("is-active"); }
    var card = document.getElementById("asset-" + assetId);
    if (!card) { return; }
    card.classList.add("is-active");
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
    return typeof km === "number" ? " · 약 " + Common.formatNumber(km < 10 ? Math.round(km * 10) / 10 : km) + "km" : "";
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
      : '<p class="card-sub">이 건물, ' + Common.escapeHtml(asset.reit_name) + "가 가지고 있어요</p>" +
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
        (asset.isHq && asset.propertyCount ? focusButtonHtml(asset.reit_id) : "") + "</div>" +
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
    return "<b>" + Common.escapeHtml(a.name || "") + "</b><br>" + Common.escapeHtml(a.reit_name) + "가 가지고 있어요" + compare;
  }

  /** rows 의 지점에 마커를 찍고, 찾은 장소와 반경 원을 그린 뒤 지도를 그 범위에 맞춘다 */
  function drawMarkers(rows) {
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
    var now = Date.now();
    // Nominatim 공용 서비스에 지나치게 자주 요청하지 않는다.
    if (now - state.lastSearchAt < 1100) {
      showNotice("장소 검색은 잠시 간격을 두고 다시 눌러 주세요.");
      return;
    }
    state.lastSearchAt = now;
    showNotice("찾는 중이에요...");
    // 국내를 볼 때는 한국 안에서만, 해외를 볼 때는 전 세계에서 찾는다.
    var url = SEARCH_URL + "?format=jsonv2&limit=5&accept-language=ko" + (state.market === "kr" ? "&countrycodes=kr" : "") +
      "&q=" + encodeURIComponent(keyword);
    fetch(url, { headers: { "Accept": "application/json" } })
      .then(function (res) { return res.ok ? res.json() : null; })
      .catch(function () { return null; })
      .then(function (list) {
        if (token !== state.searchToken) { return; } // 전환·재검색·취소한 이전 결과는 무시한다.
        var valid = Array.isArray(list) ? list.filter(function (hit) {
          return hit && hit.lat !== null && hit.lon !== null &&
            isFinite(Number(hit.lat)) && isFinite(Number(hit.lon));
        }) : [];
        if (valid.length > 1) {
          showSearchChoices(valid);
          return;
        }
        if (valid.length === 1) {
          var hit = valid[0];
          state.center = { lat: Number(hit.lat), lng: Number(hit.lon),
            name: String(hit.name || hit.display_name || keyword).split(",").slice(0, 2).join(",").trim() };
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
      });
  }

  function showNotice(text) {
    var el = document.getElementById("map-notice");
    el.textContent = text || "";
    el.classList.toggle("is-hidden", !text);
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

    Common.loadAll(["assets", "reits", "metrics", "prices", "dividends", "global_properties", "assumptions"]).then(function (data) {
      Common.applyAssumptions(data.assumptions);           // 배당 번역 문구의 커피 잔수 계산용 (없으면 "데이터 없음")
      var assets = (data.assets && data.assets.items) || [];
      state.assets = assets.filter(function (a) { return typeof a.lat === "number" && typeof a.lng === "number"; });
      state.noCoordCount = assets.length - state.assets.length;
      var products = Common.buildProducts(data);
      products.forEach(function (p) { if (p.id) { state.productById[p.id] = p; } });
      buildGlobals(products, data.global_properties);
      if (!initMap()) {
        showNotice("지도를 불러오지 못했어요(인터넷 연결 확인). 아래 목록과 글자 검색은 쓸 수 있어요.");
      }
      renderMarket();
      renderReits();
      renderLegend();
      renderResult();
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
    // 카드의 "본사·대표 자산 한 화면에 보기" / "해외 리츠 전체 보기"
    document.getElementById("map-result").addEventListener("click", function (event) {
      var button = event.target.closest("[data-focus-reit]");
      if (!button) { return; }
      selectReit(button.getAttribute("data-focus-reit"));
      document.getElementById("map-canvas").scrollIntoView({ behavior: "smooth", block: "center" });
    });
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
