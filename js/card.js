/* ==========================================================================
   js/card.js — 홍보 카드 생성기
   - 모든 상품 수치와 이름은 Common.buildProducts()가 JSON에서 읽은 값만 사용
   - 출처·기준일은 선택한 문구에 사용된 JSON에 맞춰 카드 아래에 표시
   - 금지어 판정은 반드시 Common.checkBannedWords()를 사용
   ========================================================================== */
(function () {
  "use strict";

  var state = {
    target: Common.getTarget() || "student",
    products: [], productKey: "", meta: null, optionIndex: 0,
    cardReady: false
  };

  function isNumber(value) {
    return typeof value === "number" && isFinite(value);
  }

  // 필요한 항목이 없으면 해당 문구만 목록에서 뺀다. 임의의 수치를 채우지 않는다.
  function option(text, sources) {
    return { text: text, sources: sources };
  }

  function dividendWithoutCaution(p) {
    if (!isNumber(p.priceYield) || p.priceYield < 0) { return false; }
    return !Common.translateDividend(p.priceYield).caution;
  }

  // 타깃별 세 가지 문구: 숫자는 상품 JSON 값에서 읽거나 그 값으로 계산한 것만 사용한다.
  var TEMPLATES = {
    student: [
      function (p) {
        if (!isNumber(p.price) || !p.priceDate) { return null; }
        // 장중에 받은 값이면 "현재가", 장 마감 뒤 값이면 "종가" (Common.priceKindLabel)
        return option("관심 리츠, 최근 가격부터 읽기\n" + p.name +
          "\n1주 " + Common.priceKindLabel(p) + " " + Common.formatWon(p.price) + "\n기준 " + Common.formatPriceBasis(p), ["reits", "prices"]);
      },
      function (p) {
        if (!p.assetType) { return null; }
        return option("리츠가 담은 부동산 알아보기\n" + p.name +
          "\n주요 자산 유형: " + p.assetType, ["reits"]);
      },
      function (p) {
        if (!isNumber(p.changePct) || !p.priceDate) { return null; }
        return option("직전 거래일과의 가격 변화\n" + p.name +
          "\n전일 대비 " + Common.formatChange(p.changePct).text +
          "\n기준 " + Common.formatPriceBasis(p), ["reits", "prices"]);
      }
    ],
    rookie: [
      function (p) {
        if (!isNumber(p.waleYears) || p.waleYears <= 0) { return null; }
        var translated = Common.translateWale(p.waleYears);
        if (translated.text === Common.NA) { return null; }
        return option("세입자 계약이 얼마나 남았을까?\n" + p.name +
          "\n" + translated.text, ["reits", "metrics"]);
      },
      function (p) {
        if (!isNumber(p.pNav) || p.pNav <= 0) { return null; }
        return option("건물 가치와 주식 가격 비교하기\n" + p.name +
          "\nP/NAV " + p.pNav.toFixed(2) + "배\n시가총액 ÷ 순자산가치", ["reits", "metrics", "prices"]);
      },
      function (p) {
        if (!p.assetType || !isNumber(p.price) || !p.priceDate) { return null; }
        return option("첫 월급으로 알아보는 리츠\n" + p.name +
          "\n주요 자산: " + p.assetType +
          "\n1주 " + Common.priceKindLabel(p) + " " + Common.formatWon(p.price), ["reits", "prices"]);
      }
    ],
    renter: [
      function (p) {
        if (!isNumber(p.dpsAnnual) || p.dpsAnnual < 0 || !dividendWithoutCaution(p)) { return null; }
        return option("월세처럼 살펴보는 배당 기록\n" + p.name +
          "\n최근 1년 주당배당금 " + Common.formatWon(p.dpsAnnual), ["reits", "dividends"]);
      },
      function (p) {
        if (!dividendWithoutCaution(p)) { return null; }
        return option("배당 기록을 수익률로 읽어 보기\n" + p.name +
          "\n최근 1년 주가 기준 배당수익률 " + Common.formatPercent(p.priceYield, 2),
        ["reits", "prices", "dividends"]);
      },
      function (p) {
        if (!p.assetType) { return null; }
        return option("임대료가 나오는 곳은 어디일까?\n" + p.name +
          "\n주요 자산 유형: " + p.assetType, ["reits"]);
      }
    ]
  };

  function currentProduct() {
    return state.products.filter(function (p) { return p.key === state.productKey; })[0] || null;
  }

  function buildOptions() {
    var p = currentProduct();
    if (!p) { return []; }
    return (TEMPLATES[state.target] || []).map(function (make) { return make(p); }).filter(Boolean);
  }

  function selectedOption() {
    return buildOptions()[state.optionIndex] || null;
  }

  function renderTargets() {
    document.getElementById("cardgen-targets").innerHTML = Common.TARGETS.map(function (t) {
      var active = t.key === state.target;
      return '<button type="button" class="chip' + (active ? " is-active" : "") +
        '" data-target="' + Common.escapeHtml(t.key) + '" aria-pressed="' + active + '">' +
        Common.escapeHtml(t.label) + "</button>";
    }).join("");
  }

  function renderProducts() {
    var select = document.getElementById("cardgen-product");
    var reits = state.products.filter(function (p) { return p.type === "reit"; })
      .sort(function (a, b) { return a.name.localeCompare(b.name, "ko"); });
    select.innerHTML = reits.map(function (p) {
      return '<option value="' + Common.escapeHtml(p.key) + '">' + Common.escapeHtml(p.name) + "</option>";
    }).join("");
    if (!reits.some(function (p) { return p.key === state.productKey; })) {
      state.productKey = reits.length ? reits[0].key : "";
    }
    select.value = state.productKey;
    select.disabled = !reits.length;
  }

  function renderOptions() {
    var options = buildOptions();
    var notice = document.getElementById("cardgen-notice");
    var box = document.getElementById("cardgen-options");
    var count = document.getElementById("cardgen-count");
    var p = currentProduct();
    state.optionIndex = Math.min(state.optionIndex, Math.max(0, options.length - 1));

    if (!state.products.length) {
      notice.textContent = "리츠 데이터를 불러오지 못했어요. data 폴더를 확인해 주세요.";
    } else if (!options.length) {
      notice.textContent = "이 리츠의 해당 데이터가 없어서 문구를 만들 수 없어요. 다른 리츠나 타깃을 골라 주세요.";
    } else if (options.length < TEMPLATES[state.target].length) {
      notice.textContent = "일부 데이터가 없거나 배당수익률에 주의가 필요해 해당 문구는 제외했어요.";
    } else {
      notice.textContent = "";
    }
    notice.classList.toggle("is-hidden", !notice.textContent);
    count.textContent = options.length ? "사용 가능한 문구 " + options.length + "개" : "사용 가능한 문구 없음";

    box.innerHTML = options.map(function (item, i) {
      var active = i === state.optionIndex;
      return '<button type="button" class="cardgen-option' + (active ? " is-active" : "") +
        '" data-option="' + i + '" aria-pressed="' + active + '">' +
        '<span class="cardgen-option-caption">문구 ' + (i + 1) + '</span>' +
        '<span class="cardgen-option-copy">' + Common.escapeHtml(item.text).replace(/\n/g, "<br>") +
        "</span></button>";
    }).join("");
    document.getElementById("cardgen-text").value = options[state.optionIndex] ? options[state.optionIndex].text : "";
    checkText();
  }

  // 사용자가 직접 편집하면서 새로운 수치를 추가하지 않도록 선택한 문구의 숫자와 비교한다.
  // 이는 금지어 검사가 아닌 데이터 검증이며, 금지어 판정은 Common에서만 한다.
  function numberParts(text) {
    return String(text || "").match(/\d+(?:[,.]\d+)*/g) || [];
  }

  function hasUnsupportedNumber(text, original) {
    var allowed = numberParts(original);
    return numberParts(text).some(function (value) { return allowed.indexOf(value) === -1; });
  }

  // meta.json에 실제 출처와 기준일이 없으면 카드의 수치를 공개하지 않는다.
  function hasSourceInfo(item) {
    if (!item || !state.meta || !state.meta.files) { return false; }
    return item.sources.every(function (key) {
      var info = state.meta.files[key];
      return !!(info && info.source && info.as_of);
    });
  }

  function checkText() {
    var text = document.getElementById("cardgen-text").value;
    var item = selectedOption();
    var result = Common.checkBannedWords(text);
    var warn = document.getElementById("cardgen-warn");
    var button = document.getElementById("cardgen-download");
    var problems = [];
    if (!result.ok) {
      problems.push("쓸 수 없는 표현이 들어 있어요: " + result.found.join(", ") + ".");
    }
    if (item && hasUnsupportedNumber(text, item.text)) {
      problems.push("선택한 문구의 JSON 데이터에 없는 숫자를 추가했어요. 새 숫자를 지우거나 문구를 다시 골라 주세요.");
    }
    if (item && !hasSourceInfo(item)) {
      problems.push("데이터 출처 또는 기준일이 없어서 카드를 저장할 수 없어요.");
    }
    state.cardReady = drawCard() && hasSourceInfo(item);
    if (item && text.trim() && !state.cardReady) {
      problems.push("문구 또는 출처가 너무 길어 카드 안에 넣을 수 없어요. 문구를 줄여 주세요.");
    }
    warn.textContent = problems.join(" ");
    warn.classList.toggle("is-hidden", !problems.length);
    button.disabled = !item || !text.trim() || !!problems.length;
    document.getElementById("cardgen-download-status").textContent = "";
  }

  // ---------------------------------------------------------------------
  // 카드 미리보기: CSS 변수로 색·글자 크기·간격을 가져와 캔버스 크기에 맞게 배율 적용
  // ---------------------------------------------------------------------
  function cssVar(name) {
    return window.getComputedStyle(document.documentElement).getPropertyValue(name).trim();
  }

  function cssNum(name) {
    return Number.parseFloat(cssVar(name));
  }

  function fontName() {
    return cssVar("--font-base");
  }

  function setFont(ctx, weight, size) {
    ctx.font = weight + " " + Math.round(size) + "px " + fontName();
  }

  function roundedRect(ctx, x, y, width, height, radius) {
    var r = Math.min(radius, width / 2, height / 2);
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.lineTo(x + width - r, y);
    ctx.quadraticCurveTo(x + width, y, x + width, y + r);
    ctx.lineTo(x + width, y + height - r);
    ctx.quadraticCurveTo(x + width, y + height, x + width - r, y + height);
    ctx.lineTo(x + r, y + height);
    ctx.quadraticCurveTo(x, y + height, x, y + height - r);
    ctx.lineTo(x, y + r);
    ctx.quadraticCurveTo(x, y, x + r, y);
    ctx.closePath();
    ctx.fill();
  }

  function wrapLines(ctx, text, maxWidth) {
    var lines = [];
    String(text).split("\n").forEach(function (paragraph) {
      if (!paragraph) { lines.push(""); return; }
      var line = "";
      // 띄어쓰기 단위로 먼저 줄을 나눠서 한글 단어의 마지막 글자만 남지 않도록 한다.
      paragraph.split(/(\s+)/).forEach(function (chunk) {
        if (!chunk) { return; }
        if (ctx.measureText(line + chunk).width <= maxWidth) {
          line += chunk;
          return;
        }
        if (line.trim()) {
          lines.push(line.trimEnd());
          line = "";
        }
        var remaining = chunk.trimStart();
        // 단어 하나가 한 줄보다 길 때만 글자 단위로 나눈다.
        Array.from(remaining).forEach(function (ch) {
          if (line && ctx.measureText(line + ch).width > maxWidth) {
            lines.push(line);
            line = "";
          }
          line += ch;
        });
      });
      if (line.trim()) { lines.push(line.trimEnd()); }
    });
    return lines;
  }

  // 정해 둔 영역에 모든 줄이 들어갈 때까지 글자 크기를 줄인다.
  function fitLines(ctx, text, width, height, maxSize, minSize, weight) {
    for (var size = maxSize; size >= minSize; size -= 1) {
      setFont(ctx, weight, size);
      var lines = wrapLines(ctx, text, width);
      var lineHeight = Math.ceil(size * 1.32);
      if (lines.length * lineHeight <= height) {
        return { size: size, lines: lines, lineHeight: lineHeight };
      }
    }
    return null;
  }

  function paintLines(ctx, fitted, x, y) {
    setFont(ctx, 800, fitted.size);
    fitted.lines.forEach(function (line) {
      ctx.fillText(line, x, y);
      y += fitted.lineHeight;
    });
  }

  function drawCard() {
    var canvas = document.getElementById("cardgen-canvas");
    var ctx = canvas.getContext("2d");
    if (!ctx) { return false; }
    var p = currentProduct();
    var item = selectedOption();
    var text = document.getElementById("cardgen-text").value;
    var width = canvas.width;
    var height = canvas.height;
    var space = cssNum("--space-4");
    var titleSize = cssNum("--fs-xl");
    var labelSize = cssNum("--fs-lg");
    var radius = cssNum("--radius");
    var side = space * 5;
    var textWidth = width - side * 2;
    var footerTop = height - space * 18;
    var mainTop = space * 19;
    var mainHeight = footerTop - mainTop - space * 2;
    var disclaimer = Common.getCardDisclaimer(state.meta, item ? item.sources : ["reits"]);
    var mainFit = item && text.trim() ? fitLines(ctx, text, textWidth, mainHeight,
      titleSize * 3, cssNum("--fs-xs") * 2, 800) : null;
    var footerFit = fitLines(ctx, disclaimer, textWidth, height - footerTop - space * 5,
      labelSize * 1.35, cssNum("--fs-xs") * 1.5, 600);

    ctx.clearRect(0, 0, width, height);
    ctx.fillStyle = cssVar("--color-bg");
    ctx.fillRect(0, 0, width, height);
    ctx.fillStyle = cssVar("--color-surface");
    roundedRect(ctx, space * 3, space * 3, width - space * 6, height - space * 6, radius * 2);

    // 상단 선과 브랜드: 모든 색은 CSS :root 변수에서 가져온다.
    ctx.fillStyle = cssVar("--color-primary");
    roundedRect(ctx, side, side, space * 8, space * 0.7, radius);
    ctx.fillStyle = cssVar("--color-text");
    ctx.textBaseline = "top";
    setFont(ctx, 800, titleSize * 1.55);
    ctx.fillText("리츠 투자", side, side + space * 2);
    ctx.fillStyle = cssVar("--color-text-sub");
    setFont(ctx, 600, labelSize * 1.05);
    ctx.fillText("데이터로 읽는 부동산", side, side + space * 6);

    // 타깃 표시 배지.
    var target = Common.TARGETS.filter(function (t) { return t.key === state.target; })[0];
    var targetText = (target ? target.label : "") + "의 시선";
    setFont(ctx, 700, labelSize * 1.2);
    var badgeWidth = ctx.measureText(targetText).width + space * 4;
    ctx.fillStyle = cssVar("--color-primary-soft");
    roundedRect(ctx, side, side + space * 9, badgeWidth, space * 3.5, radius);
    ctx.fillStyle = cssVar("--color-primary");
    ctx.fillText(targetText, side + space * 2, side + space * 9.6);

    // 본문은 필요에 따라 줄바꿈하고 축소한다. 영역 밖은 절대 그리지 않는다.
    ctx.save();
    ctx.beginPath();
    ctx.rect(side, mainTop, textWidth, mainHeight);
    ctx.clip();
    ctx.fillStyle = cssVar("--color-text");
    if (mainFit) {
      paintLines(ctx, mainFit, side, mainTop);
    } else {
      setFont(ctx, 700, labelSize * 1.5);
      ctx.fillStyle = cssVar("--color-text-sub");
      ctx.fillText(item ? "문구를 줄이면 카드가 표시돼요." : "문구를 골라 주세요.", side, mainTop);
    }
    ctx.restore();

    // 고지는 사용자가 편집할 수 없으며 Common 원문을 한 글자도 생략하지 않는다.
    ctx.fillStyle = cssVar("--color-surface-2");
    ctx.fillRect(space * 3, footerTop, width - space * 6, height - footerTop - space * 3);
    ctx.fillStyle = cssVar("--color-line");
    ctx.fillRect(side, footerTop, textWidth, Math.max(1, space / 8));
    ctx.fillStyle = cssVar("--color-text-sub");
    if (footerFit) {
      setFont(ctx, 600, footerFit.size);
      var footY = footerTop + space * 2;
      footerFit.lines.forEach(function (line) {
        ctx.fillText(line, side, footY);
        footY += footerFit.lineHeight;
      });
    }
    canvas.setAttribute("aria-label", p ? p.name + " 홍보 카드 미리 보기: " + text.replace(/\n/g, " ") : "홍보 카드 미리 보기");
    return !!mainFit && !!footerFit;
  }

  function saveBlob(blob, filename) {
    var url = URL.createObjectURL(blob);
    var link = document.createElement("a");
    link.download = filename;
    link.href = url;
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.setTimeout(function () { URL.revokeObjectURL(url); }, 3000);
    document.getElementById("cardgen-download-status").textContent = "PNG 파일 저장을 요청했어요. 브라우저의 다운로드 목록을 확인해 주세요.";
  }

  // 공유 기능이 있는 휴대폰에서는 파일 공유 창을 열고, 없으면 PNG를 바로 저장한다.
  function download() {
    if (!state.cardReady) { return; }
    var text = document.getElementById("cardgen-text").value;
    var item = selectedOption();
    if (!item || !text.trim() || !Common.checkBannedWords(text).ok ||
        hasUnsupportedNumber(text, item.text) || !hasSourceInfo(item)) { return; }

    var status = document.getElementById("cardgen-download-status");
    var canvas = document.getElementById("cardgen-canvas");
    var p = currentProduct();
    var filename = "reits-card-" + (p && p.id ? p.id : "card") + ".png";
    try {
      // 동기 변환: iOS에서 공유 창을 여는 데 필요한 클릭 동작을 유지한다.
      var dataUrl = canvas.toDataURL("image/png");
      var binary = window.atob(dataUrl.split(",")[1]);
      var bytes = new Uint8Array(binary.length);
      for (var i = 0; i < binary.length; i += 1) { bytes[i] = binary.charCodeAt(i); }
      var blob = new Blob([bytes], { type: "image/png" });
      var file = typeof File === "function" ? new File([blob], filename, { type: "image/png" }) : null;
      if (file && navigator.share && navigator.canShare && navigator.canShare({ files: [file] })) {
        status.textContent = "공유 메뉴에서 '이미지 저장'이나 '파일에 저장'을 선택해 주세요.";
        navigator.share({ files: [file], title: "리츠 투자 홍보 카드" }).catch(function (error) {
          if (error && error.name === "AbortError") {
            status.textContent = "공유가 취소됐어요.";
          } else {
            saveBlob(blob, filename);
          }
        });
      } else {
        saveBlob(blob, filename);
      }
    } catch (error) {
      status.textContent = "PNG 저장에 실패했어요. 다른 브라우저에서 다시 시도해 주세요.";
    }
  }

  function start() {
    Common.initPage({ active: "card", sources: ["reits", "prices", "dividends", "metrics"] });
    renderTargets();
    Common.loadAll(["reits", "metrics", "prices", "dividends", "meta"]).then(function (data) {
      state.products = Common.buildProducts(data);
      state.meta = Common.metaForPrices(data.meta, data.prices);   // 시세 저장본을 쓰는 중이면 출처·기준일도 저장본 것으로
      renderProducts();
      renderOptions();
      if (document.fonts && document.fonts.ready) {
        document.fonts.ready.then(function () { checkText(); });
      }
    });

    document.getElementById("cardgen-targets").addEventListener("click", function (event) {
      var chip = event.target.closest("[data-target]");
      if (!chip) { return; }
      state.target = chip.getAttribute("data-target");
      state.optionIndex = 0;
      Common.setTarget(state.target);
      renderTargets();
      renderOptions();
    });
    document.getElementById("cardgen-product").addEventListener("change", function (event) {
      state.productKey = event.target.value;
      state.optionIndex = 0;
      renderOptions();
    });
    document.getElementById("cardgen-options").addEventListener("click", function (event) {
      var button = event.target.closest("[data-option]");
      if (!button) { return; }
      state.optionIndex = Number(button.getAttribute("data-option"));
      renderOptions();
    });
    document.getElementById("cardgen-text").addEventListener("input", checkText);
    document.getElementById("cardgen-download").addEventListener("click", download);
  }

  document.addEventListener("DOMContentLoaded", start);
})();
