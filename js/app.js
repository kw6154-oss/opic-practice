/* =========================================================
   app.js — 화면 라우팅 + 설정/보안 + 테마
   STEP 1 범위: 골격, 설정화면(키 보안 저장/연결 테스트), 다크모드
   ========================================================= */
(function () {
  "use strict";

  var $ = function (id) { return document.getElementById(id); };

  // ---------- 앱 상태 ----------
  var state = {
    type: "topic",         // topic | roleplay | surprise | mock
    session: null,         // 현재 진행 중 세션 { type, level, items, index, ... }
  };

  // ---------- 화면 라우팅 ----------
  var SCREENS = ["home", "settings", "survey", "practice", "mockset", "mock", "history", "detail", "stats", "script", "scripts", "pron", "listen"];
  function show(name) {
    // 키 없어도 모든 화면 자유 이용 — 키는 '실제 호출' 시점에만 requireApiKey로 확인
    if (typeof stopScriptRec === "function") stopScriptRec(); // 화면 이동 시 녹음 정리
    if (typeof stopTts === "function") stopTts();             // 화면 이동 시 재생 정리
    SCREENS.forEach(function (s) {
      var el = $("screen-" + s);
      if (el) el.hidden = (s !== name);
    });
    window.scrollTo(0, 0);
  }

  // ---------- 토스트 ----------
  var toastTimer = null;
  function toast(msg) {
    var t = $("toast");
    t.textContent = msg;
    t.hidden = false;
    requestAnimationFrame(function () { t.classList.add("show"); });
    clearTimeout(toastTimer);
    toastTimer = setTimeout(function () {
      t.classList.remove("show");
      setTimeout(function () { t.hidden = true; }, 220);
    }, 2200);
  }

  // ---------- 테마 ----------
  function applyTheme(theme) {
    document.documentElement.setAttribute("data-theme", theme);
    $("themeToggle").textContent = theme === "dark" ? "☀️" : "🌙";
    var sw = $("darkSwitch");
    if (sw) sw.checked = (theme === "dark");
  }
  function initTheme() {
    var saved = Storage.getTheme();
    if (!saved) {
      saved = (window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches)
        ? "dark" : "light";
    }
    applyTheme(saved);
  }
  function toggleTheme() {
    var next = document.documentElement.getAttribute("data-theme") === "dark" ? "light" : "dark";
    Storage.setTheme(next);
    applyTheme(next);
  }

  // ---------- 설정: API 키 ----------
  function setBadge(state, text) {
    var b = $("apiStatusBadge");
    b.setAttribute("data-state", state);
    b.textContent = text;
  }
  function refreshKeyState() {
    if (Storage.hasApiKey()) {
      setBadge("saved", "키 저장됨");
    } else {
      setBadge("none", "미연결");
    }
    refreshHomeAvailability();
  }
  function refreshHomeAvailability() {
    // 키 없어도 자유롭게 진입 가능(실제 호출 시점에 안내). 카드 비활성화하지 않음.
    document.querySelectorAll(".type-card").forEach(function (c) { c.disabled = false; });
    var lab = $("openScriptLab");
    if (lab) lab.disabled = false;
    var hint = $("setupHint");
    if (hint) hint.hidden = true;
  }

  function loadKeyIntoField() {
    // 저장된 키가 있으면 마스킹된 상태(password)로 채워 둠
    var k = Storage.getApiKey();
    $("apiKey").value = k || "";
  }

  function setTestResult(kind, msg) {
    var el = $("testResult");
    if (!kind) { el.hidden = true; return; }
    el.hidden = false;
    el.setAttribute("data-kind", kind);
    el.textContent = msg;
  }

  function saveKey() {
    var v = $("apiKey").value.trim();
    if (!v) { toast("키를 입력하세요"); return; }
    Storage.setProvider($("provider").value);
    Storage.setModel($("model").value);
    Storage.setApiKey(v);
    refreshKeyState();
    setTestResult(null);
    toast("저장됨 · 이 브라우저에만 보관");
  }

  function clearKey() {
    Storage.clearApiKey();
    $("apiKey").value = "";
    refreshKeyState();
    setTestResult(null);
    toast("키를 삭제했습니다");
  }

  // ---------- API 키 안내 모달 (필요 시점에만) ----------
  var _pendingKeyAction = null;
  // 키가 있으면 onOk 즉시 실행, 없으면 모달을 띄우고 저장 후 onOk 이어서 실행
  function requireApiKey(onOk) {
    if (Storage.hasApiKey()) { onOk(); return true; }
    _pendingKeyAction = onOk || null;
    openKeyModal();
    return false;
  }
  function openKeyModal(errMsg) {
    var input = $("gateKey");
    if (input) input.value = Storage.getApiKey() || "";
    var err = $("gateError");
    if (err) {
      if (errMsg) { err.textContent = errMsg; err.hidden = false; }
      else { err.hidden = true; }
    }
    var m = $("keyModal");
    if (m) { m.hidden = false; }
    if (input) setTimeout(function () { try { input.focus(); } catch (e) {} }, 30);
  }
  function closeKeyModal() {
    var m = $("keyModal"); if (m) m.hidden = true;
  }
  function saveGateKey() {
    var v = $("gateKey").value.trim();
    if (!v) { toast("API 키를 입력하세요"); return; }
    Storage.setApiKey(v);
    var err = $("gateError"); if (err) err.hidden = true;
    refreshKeyState();
    loadKeyIntoField(); // 설정 화면 입력란도 동기화
    closeKeyModal();
    toast("저장됨 · 이 브라우저에만 보관");
    var fn = _pendingKeyAction; _pendingKeyAction = null;
    if (fn) fn(); // 원래 하려던 동작 이어서 진행
  }

  async function testKey() {
    var v = $("apiKey").value.trim();
    if (!v) { toast("먼저 키를 입력하세요"); return; }
    // 테스트 시점의 입력값을 즉시 저장(사용자가 저장 안 눌렀어도 테스트 가능)
    Storage.setApiKey(v);
    Storage.setProvider($("provider").value);

    var btn = $("testKey");
    btn.disabled = true;
    setTestResult("loading", "연결 확인 중…");
    try {
      var ok = await AI.testConnection();
      if (ok) {
        setTestResult("ok", "✓ 연결 성공 — AI가 정상 응답했습니다.");
        setBadge("ok", "연결됨");
      } else {
        setTestResult("ok", "✓ 응답은 받았지만 형식이 예상과 달랐습니다. 사용에는 문제없을 수 있어요.");
        setBadge("ok", "연결됨");
      }
    } catch (e) {
      var m = (e && e.message) ? e.message : "알 수 없는 오류";
      setTestResult("error", "✕ " + m);
      setBadge("error", "오류");
    } finally {
      btn.disabled = false;
      refreshHomeAvailability();
    }
  }

  // ---------- 배경 설문 (다중선택 풀) ----------
  function openSurvey() {
    renderTopics(Storage.getSurvey());
    updateSaveSurveyLabel();
    show("survey");
  }

  function renderTopics(selectedIds) {
    var selected = {};
    (selectedIds || []).forEach(function (id) { selected[id] = true; });
    var host = $("topicGroups");
    host.innerHTML = "";
    var order = [], byGroup = {};
    TOPICS.forEach(function (t) {
      if (!byGroup[t.group]) { byGroup[t.group] = []; order.push(t.group); }
      byGroup[t.group].push(t);
    });
    order.forEach(function (g) {
      var wrap = el("div", "topic-group");
      wrap.appendChild(el("div", "topic-group-title", g));
      var chips = el("div", "chips");
      byGroup[g].forEach(function (t) {
        var b = el("button", "chip");
        b.type = "button";
        b.setAttribute("aria-pressed", selected[t.id] ? "true" : "false");
        b.dataset.id = t.id;
        b.innerHTML = '<span class="chip-emoji">' + t.emoji + "</span>" + escapeHtml(t.label);
        b.addEventListener("click", function () {
          var on = b.getAttribute("aria-pressed") === "true";
          b.setAttribute("aria-pressed", on ? "false" : "true");
          updateSaveSurveyLabel();
        });
        chips.appendChild(b);
      });
      wrap.appendChild(chips);
      host.appendChild(wrap);
    });
  }

  function currentSurveySelection() {
    var ids = [];
    $("topicGroups").querySelectorAll('.chip[aria-pressed="true"]').forEach(function (c) {
      ids.push(c.dataset.id);
    });
    return ids;
  }
  function updateSaveSurveyLabel() {
    $("saveSurvey").textContent = "저장 (" + currentSurveySelection().length + "개 선택)";
  }
  function saveSurvey() {
    var ids = currentSurveySelection();
    if (!ids.length) { toast("최소 한 개 이상 골라주세요"); return; }
    Storage.setSurvey(ids);
    renderHub();
    toast("저장됨 · " + ids.length + "개 주제");
    show("home");
  }

  // ---------- 홈 허브 ----------
  var LEVEL_DESC = {
    IM2: "IM2 — 문장을 이어 일상 주제를 무난히 설명하는 수준.",
    IH:  "IH — 문단 단위로 다양한 시제·연결어를 써서 자세히 말하는 수준.",
    AL:  "AL — 풍부한 어휘·논리로 길고 정교하게 말하는 고급 수준.",
  };
  function applyLevelUI() {
    var lv = Storage.getLevel();
    $("levelSeg").querySelectorAll(".level-card").forEach(function (b) {
      b.setAttribute("aria-pressed", b.dataset.level === lv ? "true" : "false");
    });
  }
  function setLevel(lv) {
    Storage.setLevel(lv);
    applyLevelUI();
    toast("목표 레벨 · " + lv);
  }
  function renderSurveySummary() {
    var ids = Storage.getSurvey();
    var host = $("surveySummary");
    host.innerHTML = "";
    if (!ids.length) {
      host.appendChild(el("span", "empty", "아직 선택한 주제가 없어요. '수정'에서 주제를 골라주세요."));
      return;
    }
    ids.forEach(function (id) {
      var t = topicById(id);
      if (t) host.appendChild(el("span", "tag", t.emoji + " " + t.label));
    });
  }
  function renderHub() {
    applyLevelUI();
    renderSurveySummary();
    refreshHomeAvailability();
  }

  function pickIndex(n) { return Math.floor(Math.random() * n); }

  // 유형 카드 진입 (STEP C: 선택주제·롤플레이·돌발 연결, 모의는 다음 단계)
  function startType(type) {
    if (type === "pron") { openPronPractice(); return; }   // 기초 연습 (AI 호출 없음)
    if (type === "listen") { openListenPractice(); return; }
    state.type = type;
    if (type === "topic" || type === "roleplay" || type === "surprise") {
      startCombo(type);
    } else if (type === "mock") {
      show("mockset");
    }
  }

  // ==================== 기초 연습: 발음 ====================
  var pronState = { tab: "filler", idx: 0 };
  var pronSession = null;
  var PRON_SPK = '<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/><path d="M15.5 8.5a5 5 0 0 1 0 7"/><path d="M19 5a9 9 0 0 1 0 14"/></svg>';

  function pronList() {
    var P = window.PRONUNCIATION_SENTENCES || {};
    if (pronState.tab === "filler") return P.FILLER || [];
    return P[Storage.getLevel()] || [];
  }

  function openPronPractice() {
    if (pronSession) { try { pronSession.stop(); } catch (e) {} pronSession = null; }
    pronState.tab = "filler"; pronState.idx = 0;
    renderPron();
    show("pron");
  }

  function renderPron() {
    var host = $("pronBody");
    host.innerHTML = "";
    host.appendChild(detailHeader("발음 연습", goHome));

    // 카테고리 탭
    var tabs = el("div", "pron-tabs");
    function mkTab(key, label) {
      var b = el("button", "pron-tab" + (pronState.tab === key ? " on" : ""), label);
      b.type = "button";
      b.addEventListener("click", function () {
        if (pronState.tab === key) return;
        pronState.tab = key; pronState.idx = 0; renderPron();
      });
      return b;
    }
    tabs.appendChild(mkTab("filler", "시간벌기 표현"));
    tabs.appendChild(mkTab("general", "일반 문장"));
    host.appendChild(tabs);

    var list = pronList();
    var lv = Storage.getLevel();
    if (pronState.tab === "filler") {
      host.appendChild(el("p", "pron-tabdesc", "생각할 시간을 벌어주는 표현이에요. 입에 붙을 때까지 반복하세요. 단, 답변당 1~2개만 — 남발하면 역효과예요."));
    }
    if (!list.length) { host.appendChild(el("p", "muted", "문장이 없습니다.")); return; }

    // 6) 진행 표시 + 얇은 진행바
    var prog = el("div", "pron-progress");
    prog.appendChild(el("div", "pron-progress-label muted small",
      (pronState.tab === "filler")
        ? ((pronState.idx + 1) + "/" + list.length)
        : ("문장 " + (pronState.idx + 1) + "/" + list.length + " · " + lv)));
    var pbar = el("div", "pron-pbar");
    var pfill = el("div", "pron-pbar-fill");
    pfill.style.width = ((pronState.idx + 1) / list.length * 100) + "%";
    pbar.appendChild(pfill); prog.appendChild(pbar);
    host.appendChild(prog);

    var item = list[pronState.idx];
    var en = item.en; // 표시·TTS·비교는 영어(en) 기준

    var card = el("div", "pron-card");
    // 1) 문장 (전체 폭)
    card.appendChild(el("p", "pron-sentence", en));

    // 2) 뜻 보기 — 가벼운 텍스트 토글 + 회색 뜻 (상태 localStorage 유지)
    var meanBtn = el("button", "pron-mean-toggle");
    meanBtn.type = "button";
    var meanBox = el("div", "pron-meaning", item.ko || "");
    function applyMean(on) {
      meanBox.hidden = !on;
      meanBtn.classList.toggle("on", on);
      meanBtn.setAttribute("aria-pressed", on ? "true" : "false");
      meanBtn.textContent = on ? "뜻 숨기기 ▴" : "뜻 보기 ▾";
    }
    applyMean(Storage.getPronMeaning());
    meanBtn.addEventListener("click", function () {
      var on = !Storage.getPronMeaning();
      Storage.setPronMeaning(on);
      applyMean(on);
    });
    card.appendChild(meanBtn);
    card.appendChild(meanBox);

    // 3) 얇은 구분선
    card.appendChild(el("div", "pron-divider"));

    // 4) 동작 줄: 왼쪽 [스피커][속도], 오른쪽 [따라 말하기]
    var action = el("div", "pron-action");
    var leftGrp = el("div", "tts-group");
    var tts = el("button", "icon-btn-sm icon-accent");
    tts.type = "button"; tts.title = "문장 듣기"; tts.setAttribute("aria-label", "문장 듣기");
    tts.innerHTML = PRON_SPK;
    tts.addEventListener("click", function () { playWithState(tts, en); });
    leftGrp.appendChild(tts); leftGrp.appendChild(makeSpeedBadge());
    action.appendChild(leftGrp);

    var recArea = el("div", "pron-rec");
    if (!Speech.recordSupported()) {
      action.appendChild(el("span", "muted small", "녹음 미지원 (Chrome/Edge 권장)"));
    } else {
      var speakBtn = el("button", "run-btn primary pron-speak", "🎙 따라 말하기");
      speakBtn.type = "button";
      speakBtn.addEventListener("click", function () { pronStartRec(recArea, en, speakBtn); });
      action.appendChild(speakBtn);
    }
    card.appendChild(action);
    card.appendChild(recArea);
    host.appendChild(card);

    // 5) 문장 내비게이션 (말하기 전에도 건너뛰기 가능)
    var nav = el("div", "pron-nav");
    var prev = el("button", "run-btn", "‹ 이전");
    prev.type = "button";
    prev.addEventListener("click", function () { pronGo(-1); });
    var next = el("button", "run-btn", "다음 ›");
    next.type = "button";
    next.addEventListener("click", function () { pronGo(1); });
    nav.appendChild(prev); nav.appendChild(next);
    host.appendChild(nav);

    host.appendChild(el("p", "eval-note", "※ 음성 인식 기반 전달력 체크예요. 정밀한 발음 평가와는 다를 수 있어요."));
  }

  // 문장 이동 (이전/다음 — 말하기 전에도 건너뛰기 가능)
  function pronGo(delta) {
    if (pronSession) { try { pronSession.stop(); } catch (e) {} pronSession = null; }
    var list = pronList();
    if (!list.length) return;
    pronState.idx = (pronState.idx + delta + list.length) % list.length;
    renderPron();
  }

  async function pronStartRec(recArea, en, speakBtn) {
    if (window.speechSynthesis) window.speechSynthesis.cancel();
    if (speakBtn) speakBtn.disabled = true;
    recArea.innerHTML = "";
    var bar = el("div", "rec-bar");
    var dot = el("span", "rec-dot");
    var stopBtn = el("button", "rec-stop", "■ 멈추기");
    stopBtn.type = "button";
    bar.appendChild(dot); bar.appendChild(stopBtn);
    recArea.appendChild(bar);
    var live = el("div", "rec-live");
    live.innerHTML = '<span class="muted small">듣는 중… 문장을 따라 말하세요.</span>';
    recArea.appendChild(live);

    pronSession = Speech.createSession({
      onInterim: function (fin, intr) {
        live.innerHTML = escapeHtml(fin) + '<span class="interim">' + escapeHtml(intr) + "</span>";
      },
      onError: function () {},
    });
    try {
      await pronSession.start();
    } catch (e) {
      pronSession = null;
      if (speakBtn) speakBtn.disabled = false;
      recArea.innerHTML = "";
      recArea.appendChild(el("div", "error-box", "마이크를 사용할 수 없습니다. 마이크 권한을 확인하세요."));
      return;
    }
    stopBtn.addEventListener("click", async function () {
      if (!pronSession) return;
      var s = pronSession; pronSession = null;
      recArea.innerHTML = '<div class="muted small">분석 중…</div>';
      var result = await s.stop();
      renderPronResult(recArea, en, (result && result.transcript) || "", speakBtn);
    });
  }

  // 단어 정규화: 소문자 + 문장부호 제거 (어포스트로피는 유지)
  function pronNorm(w) { return String(w).toLowerCase().replace(/[^a-z0-9']/g, ""); }
  function comparePron(target, said) {
    var pool = {};
    String(said).split(/\s+/).forEach(function (w) {
      var n = pronNorm(w); if (n) pool[n] = (pool[n] || 0) + 1;
    });
    var matched = 0, total = 0;
    var words = String(target).split(/\s+/).filter(Boolean).map(function (tw) {
      var n = pronNorm(tw);
      if (!n) return { text: tw, ok: true, skip: true }; // 부호만 있는 토큰
      total++;
      if (pool[n] > 0) { pool[n]--; matched++; return { text: tw, ok: true }; }
      return { text: tw, ok: false };
    });
    return { words: words, matched: matched, total: total, pct: total ? Math.round(matched / total * 100) : 0 };
  }

  function renderPronResult(recArea, en, transcript, speakBtn) {
    recArea.innerHTML = "";
    var cmp = comparePron(en, transcript);
    var vis = el("p", "pron-compare");
    cmp.words.forEach(function (w) {
      vis.appendChild(el("span", "pw " + (w.skip ? "" : (w.ok ? "pw-ok" : "pw-bad")), w.text));
      vis.appendChild(document.createTextNode(" "));
    });
    recArea.appendChild(vis);
    recArea.appendChild(el("div", "pron-score", cmp.pct + "% · " + cmp.matched + "/" + cmp.total + " 단어 인식 성공"));
    if (transcript) recArea.appendChild(el("div", "muted small", "내가 말한 것: " + transcript));
    // 재녹음은 동작 줄의 버튼으로 (라벨만 '다시 말하기'로), 다음 문장은 하단 내비로
    if (speakBtn) { speakBtn.disabled = false; speakBtn.textContent = "🎙 다시 말하기"; }
  }

  // ==================== 기초 연습: 듣기 ====================
  function openListenPractice() {
    var host = $("listenBody");
    host.innerHTML = "";
    host.appendChild(detailHeader("듣기 연습", goHome));
    host.appendChild(el("p", "muted small", "레벨별 실전 질문 음성으로 귀를 트이세요. 링크는 새 탭에서 열립니다."));
    var LV = [
      { lv: "IM2", title: "IM2 실전 질문 듣기", desc: "기초 일상 질문 위주" },
      { lv: "IH", title: "IH 실전 질문 듣기", desc: "문단·시제·돌발 대응" },
      { lv: "AL", title: "AL 실전 질문 듣기", desc: "고급 표현·심화 질문" },
    ];
    var links = window.YOUTUBE_LINKS || {};
    var list = el("div", "listen-list");
    LV.forEach(function (x) {
      var a = document.createElement("a");
      a.className = "listen-row";
      a.href = links[x.lv] || "#";
      a.target = "_blank"; a.rel = "noopener noreferrer";
      var badge = el("span", "lvl-badge", x.lv);
      badge.setAttribute("data-lv", x.lv);
      a.appendChild(badge);
      var body = el("div", "listen-row-body");
      body.appendChild(el("div", "listen-row-title", x.title));
      body.appendChild(el("div", "muted small", x.desc));
      a.appendChild(body);
      a.appendChild(el("span", "listen-row-ext", "↗"));
      list.appendChild(a);
    });
    host.appendChild(list);
    show("listen");
  }

  // 질문 카드 1개 생성 (콤보/모의 공용)
  function buildQuestionCard(q, i, opts) {
    opts = opts || {};
    var card = el("div", "q-card");

    var top = el("div", "q-top");
    top.innerHTML =
      '<span class="q-num">' + (i + 1) + "</span>" +
      '<span class="q-type" data-t="' + q.type + '">' + q.label + "</span>" +
      '<span class="q-type-hint">' + escapeHtml(q.hint) + "</span>";
    card.appendChild(top);

    var en = el("p", "q-en"); en.textContent = q.en; card.appendChild(en);
    var ko = el("p", "q-ko"); ko.textContent = q.ko; card.appendChild(ko);

    var actions = el("div", "q-actions");
    var tts = el("button", "icon-btn-sm icon-accent");
    tts.type = "button";
    tts.title = "질문 듣기";
    tts.setAttribute("aria-label", "질문 듣기");
    tts.innerHTML = '<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/><path d="M15.5 8.5a5 5 0 0 1 0 7"/><path d="M19 5a9 9 0 0 1 0 14"/></svg>';
    tts.addEventListener("click", function () { playWithState(tts, q.en); });
    actions.appendChild(tts);
    actions.appendChild(makeSpeedBadge());

    var trans = el("button", "q-trans", "한글 보기");
    trans.type = "button";
    trans.setAttribute("aria-pressed", "false");
    trans.addEventListener("click", function () {
      var open = ko.classList.toggle("show");
      trans.classList.toggle("on", open);
      trans.setAttribute("aria-pressed", open ? "true" : "false");
      trans.textContent = open ? "한글 숨기기" : "한글 보기";
    });
    actions.appendChild(trans);
    card.appendChild(actions);

    // 녹음 + 전사 (+ 연습 모드에서만 개별 평가 버튼)
    attachRecorder(card, q, { showEval: opts.showEval !== false });
    return card;
  }

  // ---------- TTS (질문 읽어주기 등) — 속도·음성 공통 적용 ----------
  var TTS_RATES = [0.75, 1, 1.25];
  var _ttsVoices = [];
  function loadVoices() {
    try { _ttsVoices = ("speechSynthesis" in window) ? (window.speechSynthesis.getVoices() || []) : []; }
    catch (e) { _ttsVoices = []; }
    return _ttsVoices;
  }
  function enVoices() {
    var list = (_ttsVoices && _ttsVoices.length) ? _ttsVoices : loadVoices();
    return list.filter(function (v) { return /^en([-_]|$)/i.test(v.lang); });
  }
  // 저장된 음성 우선 → Google US English → Natural 포함 MS → 그 외 en-US → en → 기본
  function pickVoice() {
    var list = (_ttsVoices && _ttsVoices.length) ? _ttsVoices : loadVoices();
    if (!list.length) return null;
    var saved = Storage.getTtsVoice();
    if (saved) {
      for (var i = 0; i < list.length; i++) { if (list[i].voiceURI === saved || list[i].name === saved) return list[i]; }
    }
    function find(fn) { for (var j = 0; j < list.length; j++) { if (fn(list[j])) return list[j]; } return null; }
    return find(function (v) { return /Google US English/i.test(v.name); })
      || find(function (v) { return /Natural/i.test(v.name) && /Microsoft/i.test(v.name) && /en[-_]?US/i.test(v.lang); })
      || find(function (v) { return /en[-_]?US/i.test(v.lang); })
      || find(function (v) { return /^en/i.test(v.lang); })
      || null;
  }
  function buildUtterance(text) {
    var u = new SpeechSynthesisUtterance(text);
    u.lang = "en-US";
    u.rate = Storage.getTtsRate(); // 0.75 | 1 | 1.25
    var v = pickVoice();
    if (v) u.voice = v;
    return u;
  }
  // ---------- TTS 재생 상태 (일시정지/이어듣기 토글) ----------
  var _ttsBtn = null;        // 현재 재생/일시정지 중인 버튼
  var _ttsState = "idle";    // idle | playing | paused
  var TTS_ICON_PAUSE = '<svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor" aria-hidden="true"><rect x="6" y="5" width="4" height="14" rx="1"/><rect x="14" y="5" width="4" height="14" rx="1"/></svg>';
  var TTS_ICON_PLAY = '<svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor" aria-hidden="true"><path d="M8 5v14l11-7z"/></svg>';
  function _ttsSetBtnState(btn, state) {
    if (!btn) return;
    var labeled = btn.dataset.ttsLabel === "1"; // 텍스트 버튼: 라벨도 바꿈
    var iconBtn = btn.classList.contains("icon-btn-sm"); // 아이콘 버튼: 아이콘도 ⏸/▶로 교체
    if (btn.dataset.ttsTitle === undefined && btn.title) btn.dataset.ttsTitle = btn.title;
    if (labeled && btn.dataset.ttsText === undefined) btn.dataset.ttsText = btn.textContent;
    if (iconBtn && btn._ttsOrigHTML === undefined) btn._ttsOrigHTML = btn.innerHTML;
    btn.classList.remove("playing", "paused");
    if (state === "playing") {
      btn.classList.add("playing"); btn.title = "일시정지";
      if (labeled) btn.textContent = "⏸ 일시정지";
      if (iconBtn) btn.innerHTML = TTS_ICON_PAUSE;
    } else if (state === "paused") {
      btn.classList.add("paused"); btn.title = "이어 듣기";
      if (labeled) btn.textContent = "▶ 이어 듣기";
      if (iconBtn) btn.innerHTML = TTS_ICON_PLAY;
    } else {
      if (btn.dataset.ttsTitle) btn.title = btn.dataset.ttsTitle;
      if (labeled && btn.dataset.ttsText) btn.textContent = btn.dataset.ttsText;
      if (iconBtn && btn._ttsOrigHTML !== undefined) btn.innerHTML = btn._ttsOrigHTML;
    }
  }
  function _ttsClear() {
    if (_ttsBtn) _ttsSetBtnState(_ttsBtn, "idle");
    _ttsBtn = null; _ttsState = "idle";
  }
  // 재생을 멈추고 상태 초기화 (화면 이동·다른 음성 재생 전 호출)
  function stopTts() {
    if ("speechSynthesis" in window) {
      try { window.speechSynthesis.resume(); } catch (e) {} // 일시정지 상태 해제 후 취소 (Chrome 버그 회피)
      window.speechSynthesis.cancel();
    }
    _ttsClear();
  }
  function speak(text) {
    if (!("speechSynthesis" in window)) { toast("이 브라우저는 음성 읽기를 지원하지 않아요"); return; }
    stopTts();
    window.speechSynthesis.speak(buildUtterance(text));
  }
  // 듣기 버튼: 재생 / 같은 버튼 재클릭 시 일시정지 ↔ 이어듣기 토글
  function playWithState(btn, text) {
    if (!("speechSynthesis" in window)) { toast("이 브라우저는 음성 읽기를 지원하지 않아요"); return; }
    var ss = window.speechSynthesis;
    // 같은 버튼을 다시 누르면 일시정지/이어듣기
    if (_ttsBtn === btn && _ttsState !== "idle") {
      if (_ttsState === "playing") { ss.pause(); _ttsState = "paused"; _ttsSetBtnState(btn, "paused"); }
      else { ss.resume(); _ttsState = "playing"; _ttsSetBtnState(btn, "playing"); }
      return;
    }
    // 새 재생 (기존 재생은 정리)
    stopTts();
    var u = buildUtterance(text);
    // 클릭 즉시 ⏸ 상태로 반영 (onstart 지연/누락에도 아이콘이 바로 바뀌도록)
    _ttsBtn = btn; _ttsState = "playing"; _ttsSetBtnState(btn, "playing");
    u.onend = function () { if (_ttsBtn === btn) _ttsClear(); else _ttsSetBtnState(btn, "idle"); };
    u.onerror = function () { if (_ttsBtn === btn) _ttsClear(); else _ttsSetBtnState(btn, "idle"); };
    ss.speak(u);
  }

  // 듣기 버튼 옆 속도 배지 (0.75x → 1x → 1.25x 순환, 모든 배지 동기화)
  function makeSpeedBadge() {
    var b = el("button", "tts-speed", Storage.getTtsRate() + "x");
    b.type = "button";
    b.title = "재생 속도 (다음 재생부터 적용)";
    b.setAttribute("aria-label", "재생 속도");
    b.addEventListener("click", function (e) {
      e.stopPropagation();
      var i = TTS_RATES.indexOf(Storage.getTtsRate());
      var next = TTS_RATES[((i < 0 ? 1 : i) + 1) % TTS_RATES.length];
      Storage.setTtsRate(next);
      // 화면의 모든 속도 배지 갱신 (재생 중인 음성은 중단하지 않음 → 다음 재생부터 적용)
      var all = document.querySelectorAll(".tts-speed");
      for (var k = 0; k < all.length; k++) all[k].textContent = next + "x";
    });
    return b;
  }

  // 스크립트 상세: 배속 점 3개 스텝 컨트롤 (0.75x / 1x / 1.25x) — 연결선으로 이어진 점 + 값 텍스트
  function makeSpeedDots() {
    var wrap = el("div", "speed-dots");
    wrap.setAttribute("role", "group");
    wrap.setAttribute("aria-label", "재생 속도");
    var rail = el("div", "speed-rail");
    rail.appendChild(el("span", "speed-line"));
    var valTxt = el("span", "speed-val");
    var dots = [];
    function sync() {
      var idx = TTS_RATES.indexOf(Storage.getTtsRate());
      if (idx < 0) idx = 1; // 기본 활성 1x(가운데)
      dots.forEach(function (d, i) { d.classList.toggle("on", i === idx); });
      valTxt.textContent = TTS_RATES[idx] + "x";
    }
    TTS_RATES.forEach(function (rate) {
      var dot = el("button", "speed-dot");
      dot.type = "button";
      dot.title = rate + "x";
      dot.setAttribute("aria-label", rate + "x 배속");
      dot.addEventListener("click", function (e) {
        e.stopPropagation();
        Storage.setTtsRate(rate);
        sync();
        // 다른 화면의 속도 배지(.tts-speed)도 동기화 (다음 재생부터 적용)
        var all = document.querySelectorAll(".tts-speed");
        for (var k = 0; k < all.length; k++) all[k].textContent = rate + "x";
      });
      dots.push(dot);
      rail.appendChild(dot);
    });
    wrap.appendChild(rail);
    wrap.appendChild(valTxt);
    sync();
    return wrap;
  }

  // 설정 화면: 영어 음성 드롭다운 채우기 (voiceschanged로 비동기 로드 후 재호출)
  function refreshVoiceSelect() {
    var sel = $("ttsVoice");
    if (!sel) return;
    var list = enVoices();
    var saved = Storage.getTtsVoice();
    sel.innerHTML = "";
    var auto = document.createElement("option");
    auto.value = ""; auto.textContent = "자동 (권장)";
    sel.appendChild(auto);
    if (!list.length) {
      var ld = document.createElement("option");
      ld.value = ""; ld.textContent = "(음성 불러오는 중…)"; ld.disabled = true;
      sel.appendChild(ld);
      return;
    }
    list.forEach(function (v) {
      var o = document.createElement("option");
      o.value = v.voiceURI;
      o.textContent = v.name + " · " + v.lang + (v.localService ? "" : " (온라인)");
      if (saved && (v.voiceURI === saved || v.name === saved)) o.selected = true;
      sel.appendChild(o);
    });
  }
  function setupTtsSettings() {
    var sel = $("ttsVoice");
    if (sel) {
      refreshVoiceSelect();
      sel.addEventListener("change", function () { Storage.setTtsVoice(sel.value); });
    }
    var pv = $("ttsPreview");
    if (pv) pv.addEventListener("click", function () {
      if (!("speechSynthesis" in window)) { toast("이 브라우저는 음성 읽기를 지원하지 않아요"); return; }
      window.speechSynthesis.cancel();
      var u = new SpeechSynthesisUtterance("Hi! This is a sample of the selected voice.");
      u.lang = "en-US";
      u.rate = Storage.getTtsRate();
      var want = sel ? sel.value : "";
      var list = enVoices(), chosen = null;
      if (want) { for (var i = 0; i < list.length; i++) { if (list[i].voiceURI === want || list[i].name === want) { chosen = list[i]; break; } } }
      if (!chosen) chosen = pickVoice();
      if (chosen) u.voice = chosen;
      window.speechSynthesis.speak(u);
    });
  }

  function escapeHtml(s) {
    return String(s).replace(/[&<>"']/g, function (c) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c];
    });
  }

  // ---------- 작은 DOM 헬퍼 ----------
  function el(tag, cls, text) {
    var e = document.createElement(tag);
    if (cls) e.className = cls;
    if (text != null) e.textContent = text;
    return e;
  }
  function fmtTime(sec) {
    var m = Math.floor(sec / 60), s = sec % 60;
    return m + ":" + (s < 10 ? "0" : "") + s;
  }
  function wordCount(t) {
    t = (t || "").trim();
    return t ? t.split(/\s+/).length : 0;
  }

  // ---------- 질문별 녹음 컴포넌트 ----------
  var REC_SECONDS = 120; // 2분

  function attachRecorder(card, q, opts) {
    opts = opts || {};
    var showEval = opts.showEval !== false;
    var box = el("div", "rec");
    card.appendChild(box);

    var session = null, timer = null, remain = REC_SECONDS;

    function renderIdle() {
      box.innerHTML = "";
      if (!Speech.recordSupported()) {
        box.appendChild(el("p", "muted small",
          "이 브라우저는 녹음을 지원하지 않습니다. Chrome 또는 Edge를 권장합니다."));
        return;
      }
      if (q.recording) { renderDone(); return; }

      var row = el("div", "idle-row");
      var btn = el("button", "rec-start", "🎙 답변 녹음 시작");
      btn.type = "button";
      btn.addEventListener("click", startRec);
      row.appendChild(btn);

      var typeBtn = el("button", "ghost-btn", "⌨️ 녹음 없이 직접 입력");
      typeBtn.type = "button";
      typeBtn.addEventListener("click", function () {
        q.recording = { blob: null, url: null, transcript: "" };
        renderDone();
      });
      row.appendChild(typeBtn);
      box.appendChild(row);

      if (!Speech.sttSupported()) {
        box.appendChild(el("p", "muted small",
          "※ 자동 전사는 Chrome/Edge에서만 동작해요. 녹음·재생은 가능하며, 전사는 직접 입력할 수 있습니다."));
      }
    }

    async function startRec() {
      // 다른 카드에서 재생 중인 TTS 정지
      if (window.speechSynthesis) window.speechSynthesis.cancel();

      box.innerHTML = "";
      var bar = el("div", "rec-bar");
      var dot = el("span", "rec-dot");
      var time = el("span", "rec-time", fmtTime(REC_SECONDS));
      var stopBtn = el("button", "rec-stop", "■ 멈추기");
      stopBtn.type = "button";
      bar.appendChild(dot); bar.appendChild(time); bar.appendChild(stopBtn);
      box.appendChild(bar);

      var live = el("div", "rec-live");
      live.innerHTML = '<span class="muted small">듣는 중… 영어로 말해보세요.</span>';
      box.appendChild(live);

      session = Speech.createSession({
        onInterim: function (fin, intr) {
          live.innerHTML = escapeHtml(fin) +
            '<span class="interim">' + escapeHtml(intr) + "</span>";
        },
        onError: function () { /* no-speech 등은 무시 */ },
      });

      try {
        await session.start();
      } catch (e) {
        session = null;
        box.innerHTML = "";
        box.appendChild(el("p", "error-box",
          "마이크를 사용할 수 없습니다. 브라우저의 마이크 권한을 허용했는지 확인하세요."));
        var retry = el("button", "ghost-btn", "다시 시도");
        retry.type = "button";
        retry.addEventListener("click", renderIdle);
        box.appendChild(retry);
        return;
      }

      remain = REC_SECONDS;
      time.textContent = fmtTime(remain);
      timer = setInterval(function () {
        remain -= 1;
        time.textContent = fmtTime(Math.max(remain, 0));
        if (remain <= 10) time.classList.add("warn");
        if (remain <= 0) finishRec();
      }, 1000);

      stopBtn.addEventListener("click", finishRec);
    }

    async function finishRec() {
      if (timer) { clearInterval(timer); timer = null; }
      if (!session) return;
      var s = session; session = null;
      box.innerHTML = '<div class="muted small">정리 중…</div>';
      var result = await s.stop();
      q.recording = result;
      renderDone();
    }

    function renderDone() {
      box.innerHTML = "";
      var r = q.recording || {};

      if (r.url) {
        var audio = document.createElement("audio");
        audio.controls = true;
        audio.src = r.url;
        audio.className = "rec-audio";
        box.appendChild(audio);
      }

      box.appendChild(el("div", "rec-tlabel", "전사 (STT가 부정확하면 직접 고치세요 — 평가에 사용됩니다)"));
      var ta = el("textarea", "rec-transcript");
      ta.value = r.transcript || "";
      ta.placeholder = "전사된 답변이 여기에 표시됩니다.";
      box.appendChild(ta);

      var meta = el("div", "rec-meta");
      var stat = el("span", "muted small", wordCount(ta.value) + " 단어");
      meta.appendChild(stat);
      box.appendChild(meta);

      ta.addEventListener("input", function () {
        q.recording.transcript = ta.value;
        stat.textContent = wordCount(ta.value) + " 단어";
      });

      // --- 동작 버튼 한 줄 그룹 (첨삭만 파란 강조, 나머지 외곽선) ---
      var grp = el("div", "run-actions");

      var again = el("button", "run-btn", "🎙 다시 녹음");
      again.type = "button";
      again.addEventListener("click", function () {
        if (r.url) { try { URL.revokeObjectURL(r.url); } catch (e) {} }
        q.recording = null;
        q.evaluation = null;
        q.review = null; q.correction = null; q.modelAnswer = null; // 캐시 정리(전사 바뀜)
        renderIdle();
      });
      grp.appendChild(again);

      // AI 평가(연습 모드 전용)는 호출 시 별도 — 그룹과 분리해 영역만 둠
      var evalArea = el("div");

      var corrBtn = el("button", "run-btn primary", q.correction ? "✏️ 첨삭 다시" : "✏️ 답변 첨삭");
      corrBtn.type = "button";
      var corrArea = el("div");
      corrBtn.addEventListener("click", function () { runCorrection(q, corrArea, corrBtn); });
      grp.appendChild(corrBtn);

      var anaBtn = el("button", "run-btn", "📊 발화 분석");
      anaBtn.type = "button";
      var anaArea = el("div");
      anaBtn.addEventListener("click", function () { runSpeechAnalysis(q.recording, anaArea, anaBtn, q); });
      grp.appendChild(anaBtn);

      var maBtn = el("button", "run-btn", q.modelAnswer ? "📝 모범답안 다시 보기" : "📝 모범답안 보기");
      maBtn.type = "button";
      var maArea = el("div");
      maBtn.addEventListener("click", function () { runModelAnswer(q, maArea, maBtn, Storage.getLevel()); });
      grp.appendChild(maBtn);

      box.appendChild(grp);

      // 결과 영역 (버튼 그룹 아래)
      if (showEval) {
        var evalBtn = el("button", "eval-btn", q.evaluation ? "🔄 다시 평가" : "🤖 AI 평가 받기");
        evalBtn.type = "button";
        evalBtn.addEventListener("click", function () { runEval(q, evalArea, evalBtn); });
        box.appendChild(evalBtn);
        box.appendChild(evalArea);
        if (q.evaluation) renderEval(evalArea, q.evaluation);
      }
      box.appendChild(corrArea);
      box.appendChild(anaArea);
      box.appendChild(maArea);
      if (q.correction) renderCorrection(corrArea, q.correction);
      if (q.modelAnswer) renderModelAnswer(maArea, q.modelAnswer);
    }

    renderIdle();
  }

  // ---------- AI 평가 실행/렌더 ----------
  async function runEval(q, area, btn) {
    var transcript = q.recording && q.recording.transcript;
    if (!transcript || !transcript.trim()) {
      toast("먼저 답변을 녹음하거나 전사를 입력하세요");
      return;
    }
    btn.disabled = true;
    area.innerHTML = '<div class="loader"><div class="spinner"></div><div>AI가 답변을 평가하고 있어요…</div></div>';
    try {
      var result = await Evaluator.evaluateAnswer(q, transcript);
      q.evaluation = result;
      renderEval(area, result);
      btn.textContent = "🔄 다시 평가";
    } catch (e) {
      area.innerHTML = "";
      area.appendChild(el("div", "error-box", "✕ " + ((e && e.message) || "평가에 실패했습니다.")));
    } finally {
      btn.disabled = false;
    }
  }

  function renderEval(area, r) {
    area.innerHTML = "";
    var box = el("div", "eval");

    // 헤더: 등급 배지 + 총평
    var head = el("div", "eval-head");
    var badge = el("div", "grade-badge", r.grade);
    badge.setAttribute("data-tier", Evaluator.gradeTier(r.grade));
    badge.setAttribute("data-grade", r.grade);
    head.appendChild(badge);
    var ht = el("div", "eval-head-text");
    ht.appendChild(el("span", "lbl", "예상 등급 · 평균 " + r.avg + " / 5"));
    ht.appendChild(el("div", "eval-summary", r.summary));
    head.appendChild(ht);
    box.appendChild(head);

    // 루브릭 4항목
    var rubric = el("div", "rubric");
    r.dims.forEach(function (d) {
      var row = el("div", "rubric-row");
      var top = el("div", "rubric-top");
      var name = el("div", "rubric-name");
      name.innerHTML = escapeHtml(d.label) + '<span class="desc">' + escapeHtml(d.desc) + "</span>";
      top.appendChild(name);
      top.appendChild(el("div", "rubric-score", d.score + " / 5"));
      row.appendChild(top);

      var bar = el("div", "bar");
      var fill = el("div", "bar-fill");
      fill.style.width = (d.score * 20) + "%";
      fill.setAttribute("data-lvl", String(d.score));
      bar.appendChild(fill);
      row.appendChild(bar);

      if (d.comment) row.appendChild(el("div", "rubric-comment", d.comment));
      rubric.appendChild(row);
    });
    box.appendChild(rubric);

    // 강점/개선점
    if (r.strengths.length || r.improvements.length) {
      var lists = el("div", "eval-lists");
      lists.appendChild(makeEvalList("👍 강점", "good", r.strengths));
      lists.appendChild(makeEvalList("🔧 개선점", "bad", r.improvements));
      box.appendChild(lists);
    }

    // 다음 레벨로 가려면
    if (r.nextAdvice) {
      var nx = el("div", "eval-next");
      nx.appendChild(el("h4", null, "🎯 다음 레벨로 가려면"));
      nx.appendChild(el("p", null, r.nextAdvice));
      box.appendChild(nx);
    }

    box.appendChild(el("p", "eval-note",
      "※ 전사 텍스트 기반 평가입니다. 발음·억양은 반영되지 않으며, 참고용 예상 등급입니다."));
    area.appendChild(box);
  }

  function makeEvalList(title, cls, items) {
    var wrap = el("div", "eval-list");
    wrap.appendChild(el("h4", cls, title));
    var ul = document.createElement("ul");
    (items.length ? items : ["—"]).forEach(function (it) {
      ul.appendChild(el("li", null, it));
    });
    wrap.appendChild(ul);
    return wrap;
  }

  // ---------- 발화 분석 (WPM·군더더기·휴지) ----------
  async function runSpeechAnalysis(rec, area, btn, store) {
    rec = rec || {};
    if (!(rec.transcript && rec.transcript.trim())) {
      toast("먼저 답변(전사)이 있어야 분석할 수 있어요");
      return;
    }
    btn.disabled = true;
    var blob = rec.blob || null;
    // 내역(전사+audioId)에서 호출되면 audioId로 blob 로드
    if (!blob && rec.audioId && RecDB.supported()) {
      try { blob = await RecDB.get(rec.audioId); } catch (e) { blob = null; }
    }
    area.innerHTML = loaderHTML("발화 분석 중…");
    try {
      var a = await Analyzer.analyze(rec.transcript, blob);
      if (store) store.analysis = a; // 문항 기록에 저장 → 내역 상세에서 재사용
      renderSpeechAnalysis(area, a);
      btn.textContent = "📊 발화 분석 다시";
    } catch (e) {
      area.innerHTML = "";
      area.appendChild(el("div", "error-box", "✕ 분석에 실패했습니다."));
    } finally {
      btn.disabled = false;
    }
  }

  function renderSpeechAnalysis(area, a) {
    area.innerHTML = "";
    var box = el("div", "analysis");

    var stats = el("div", "ana-stats");
    stats.appendChild(anaStat("WPM", a.wpm != null ? a.wpm : "—",
      a.wpm != null ? Analyzer.wpmNote(a.wpm) : "녹음 시 측정"));
    stats.appendChild(anaStat("군더더기", a.fillerTotal + "회 · " + a.fillerRatio + "%",
      Analyzer.fillerNote(a.fillerRatio)));
    stats.appendChild(anaStat("휴지(0.4s+)", a.pauseCount != null ? (a.pauseCount + "회") : "—",
      a.pauseSec != null ? ("총 " + a.pauseSec + "초") : "녹음 시 측정"));
    box.appendChild(stats);

    if (a.fillers && a.fillers.length) {
      var chips = el("div", "ana-chips");
      a.fillers.forEach(function (f) {
        chips.appendChild(el("span", "ana-chip", '"' + f.word + '" ×' + f.count));
      });
      box.appendChild(chips);
    }
    box.appendChild(el("p", "eval-note",
      "※ 군더더기는 전사 기준, WPM·휴지는 녹음(오디오) 기준입니다. 직접 입력만 한 경우 WPM·휴지는 표시되지 않아요."));
    area.appendChild(box);
  }

  function anaStat(label, value, note) {
    var s = el("div", "ana-stat");
    s.appendChild(el("div", "ana-val", String(value)));
    s.appendChild(el("div", "ana-label", label));
    if (note) s.appendChild(el("div", "ana-note", note));
    return s;
  }

  // ---------- 레벨별 모범답안 ----------
  async function runModelAnswer(q, area, btn, level) {
    btn.disabled = true;
    var prev = btn.textContent;
    btn.textContent = "준비 중…";
    var transcript = q.recording && q.recording.transcript;
    area.innerHTML = loaderHTML((level || Storage.getLevel()) + " 모범답안 준비 중…");
    try {
      var ma;
      if (transcript && transcript.trim()) {
        // 런너: 첨삭과 묶어 받아둔 모범답안 사용(없으면 그때 한 번만 호출)
        var review = await ensureReview(q, transcript.trim(), function (sec) { area.innerHTML = loaderHTML("무료 한도 대기 중… " + sec + "초 후 자동 재시도"); });
        ma = review.modelAnswer;
      } else {
        // 내역 상세 등 전사 없음: 모범답안만 단독 생성
        ma = await QuestionGen.generateModelAnswer(q, level, {
          onRetry: function (sec) { area.innerHTML = loaderHTML("무료 한도 대기 중… " + sec + "초 후 자동 재시도"); },
        });
        q.modelAnswer = ma;
      }
      renderModelAnswer(area, ma);
      btn.textContent = "📝 모범답안 다시 보기";
    } catch (e) {
      area.innerHTML = "";
      area.appendChild(el("div", "error-box", "✕ " + ((e && e.message) || "모범답안 생성 실패")));
      btn.textContent = prev;
    } finally {
      btn.disabled = false;
    }
  }

  function renderModelAnswer(area, ma) {
    area.innerHTML = "";
    var box = el("div", "model-answer");
    var head = el("div", "ma-head");
    head.appendChild(el("span", "ma-tag", "📝 " + (ma.level || "") + " 모범답안"));
    var tts = el("button", "q-tts", "🔊 듣기");
    tts.type = "button";
    tts.dataset.ttsLabel = "1";
    tts.addEventListener("click", function () { playWithState(tts, ma.answer); });
    var maListen = el("span", "tts-group");
    maListen.appendChild(tts); maListen.appendChild(makeSpeedBadge());
    head.appendChild(maListen);
    box.appendChild(head);

    var maBody = el("div", "ma-text ss-answer"); // 문장 단위 줄바꿈('저장한 스크립트'와 동일)
    renderAnswerLines(maBody, ma.answer, null);
    box.appendChild(maBody);

    // 해석 / 한글 발음 (on-demand, 한 번에 생성·캐시)
    var actions = el("div", "ma-actions");
    var transBtn = el("button", "ma-sub", "🇰🇷 해석");
    transBtn.type = "button";
    var pronBtn = el("button", "ma-sub", "🗣️ 한글 발음");
    pronBtn.type = "button";
    var extraArea = el("div", "ma-extra");
    transBtn.addEventListener("click", function () { showExtra("ko", ma, extraArea, transBtn, pronBtn); });
    pronBtn.addEventListener("click", function () { showExtra("pron", ma, extraArea, pronBtn, transBtn); });
    actions.appendChild(transBtn);
    actions.appendChild(pronBtn);
    box.appendChild(actions);
    box.appendChild(extraArea);

    if (ma.tips && ma.tips.length) {
      var tipWrap = el("div", "ma-tips");
      tipWrap.appendChild(el("h4", null, "💡 표현·구성 팁"));
      var ul = document.createElement("ul");
      ma.tips.forEach(function (t) { ul.appendChild(el("li", null, t)); });
      tipWrap.appendChild(ul);
      box.appendChild(tipWrap);
    }
    area.appendChild(box);
  }

  function ensureModelExtras(ma, onRetry) {
    if (ma.extras) return Promise.resolve(ma.extras);
    return QuestionGen.generateModelExtras(ma.answer, { onRetry: onRetry }).then(function (ex) {
      ma.extras = ex; return ex;
    });
  }

  async function showExtra(kind, ma, area, btn, otherBtn) {
    // 같은 항목 다시 누르면 닫기(토글)
    if (area.dataset.kind === kind) {
      area.innerHTML = ""; area.dataset.kind = "";
      btn.classList.remove("on");
      return;
    }
    btn.disabled = true;
    area.innerHTML = loaderHTML(kind === "ko" ? "해석 생성 중…" : "한글 발음 생성 중…");
    try {
      var ex = await ensureModelExtras(ma, function (sec) {
        area.innerHTML = loaderHTML("무료 한도 대기 중… " + sec + "초 후 자동 재시도");
      });
      area.innerHTML = "";
      area.dataset.kind = kind;
      area.appendChild(el("div", "ma-extra-label", kind === "ko" ? "🇰🇷 해석" : "🗣️ 원어민 느낌 한글 발음"));
      area.appendChild(el("p", "ma-extra-text", kind === "ko" ? (ex.ko || "—") : (ex.pron || "—")));
      btn.classList.add("on");
      otherBtn.classList.remove("on");
    } catch (e) {
      area.innerHTML = "";
      area.appendChild(el("div", "error-box", "✕ " + ((e && e.message) || "생성 실패")));
    } finally {
      btn.disabled = false;
    }
  }

  // 스크립트 카드 전용: 최초 1회만 API로 해석+한글발음을 함께 만들고 두 블록을 구성,
  // 이후 '해석'/'한글 발음' 버튼은 순수 show/hide 토글(추가 API·로더 없음)
  function makeExtraBlock(k, label, text) {
    var blk = el("div", "ma-extra-block");
    blk.dataset.k = k;
    blk.hidden = true;
    // 라벨 없이 내용만 — 토글 버튼이 이미 무엇인지 표시함
    // 해석·한글 발음 모두 모범답안처럼 문장 단위로 줄바꿈(통짜 덩어리 X)
    var wrap = el("div", "ma-extra-text ss-answer");
    var lines = splitSentences(text);
    if (!lines.length) lines = ["—"];
    lines.forEach(function (line) { wrap.appendChild(el("p", "ss-line", line)); });
    blk.appendChild(wrap);
    return blk;
  }

  // 저장한 스크립트면 생성된 extras를 localStorage에 영구 저장 → 재진입 시 재호출 차단
  function persistScriptExtras(sc) {
    if (!sc || !sc.id || !sc.extras) return; // 만들기 화면(저장 전) sc에는 id가 없음
    var list = Storage.getScripts();
    for (var i = 0; i < list.length; i++) {
      if (list[i].id === sc.id) {
        if (!list[i].extras) { list[i].extras = sc.extras; Storage.setScripts(list); }
        return;
      }
    }
  }

  async function scriptExtraToggle(kind, sc, area, btn, otherBtn) {
    // 블록이 아직 없으면: 데이터 확보(필요 시 1회만 API) 후 두 블록을 미리 구성
    if (!area.querySelector(".ma-extra-block")) {
      if (!sc.extras) {
        btn.disabled = true; otherBtn.disabled = true;
        area.innerHTML = loaderHTML("해석·한글 발음 생성 중…");
        try {
          await ensureModelExtras(sc, function (sec) {
            area.innerHTML = loaderHTML("무료 한도 대기 중… " + sec + "초 후 자동 재시도");
          });
          persistScriptExtras(sc); // 저장본이면 영구 저장
        } catch (e) {
          area.innerHTML = "";
          area.appendChild(el("div", "error-box", "✕ " + ((e && e.message) || "생성 실패")));
          btn.disabled = false; otherBtn.disabled = false;
          return;
        }
        btn.disabled = false; otherBtn.disabled = false;
      }
      area.innerHTML = "";
      area.appendChild(makeExtraBlock("ko", "🇰🇷 해석", sc.extras.ko));
      area.appendChild(makeExtraBlock("pron", "🗣️ 원어민 느낌 한글 발음", sc.extras.pron));
      area.dataset.shown = "";
    }
    // 토글: 같은 항목 다시 누르면 닫기, 아니면 해당 블록만 표시
    var open = (area.dataset.shown !== kind);
    area.dataset.shown = open ? kind : "";
    Array.prototype.forEach.call(area.querySelectorAll(".ma-extra-block"), function (blk) {
      blk.hidden = !(open && blk.dataset.k === kind);
    });
    btn.classList.toggle("on", open);
    otherBtn.classList.remove("on");
  }

  // ---------- 통합 세션 런너 (콤보/모의 공용) ----------
  var sessionAbort = null;

  var TYPE_LABEL = { topic: "선택주제", roleplay: "롤플레이", surprise: "돌발주제", mock: "모의고사" };
  function loaderHTML(msg) {
    return '<div class="loader"><div class="spinner"></div><div>' + escapeHtml(msg) + "</div></div>";
  }
  function pickSurpriseTopic() {
    var pool = {};
    Storage.getSurvey().forEach(function (id) { pool[id] = true; });
    var rest = TOPICS.filter(function (t) { return !pool[t.id]; });
    return rest.length ? rest[pickIndex(rest.length)] : null;
  }

  // 콤보 1세트 진입 (선택주제/롤플레이/돌발) — 주제만 정하고 '시작' 화면 표시 (API 호출 X)
  function startCombo(type) {
    var level = Storage.getLevel();
    var topic = null;
    if (type === "topic") {
      var pool = Storage.getSurvey();
      if (!pool.length) { toast("먼저 배경 설문에서 주제를 고르세요"); openSurvey(); return; }
      topic = topicById(pool[pickIndex(pool.length)]);
    } else if (type === "surprise") {
      // 돌발주제: 설문 밖 일상 주제 풀에서 무작위(직전 주제 반복 안 함)
      topic = pickPracticeSurprise();
    } else if (type === "roleplay") {
      var p = Storage.getSurvey();
      topic = p.length ? topicById(p[pickIndex(p.length)]) : TOPICS[pickIndex(TOPICS.length)];
    }

    state.session = {
      type: type, level: level,
      topic: topic,
      topicId: topic ? topic.id : null,
      topicLabel: topic ? (topic.emoji + " " + topic.label) : TYPE_LABEL[type],
      title: TYPE_LABEL[type] + (topic ? " · " + topic.label : ""),
      items: null, index: 0, result: null,
    };

    show("mock"); // 런너 화면 재사용
    $("mockTitle").textContent = TYPE_LABEL[type] || "실전 풀이";
    $("mockTopicPill").textContent = state.session.topicLabel + " · " + level;
    $("mockReport").innerHTML = "";
    $("mockNavBar").style.display = "none";
    renderComboReady(type); // '시작' 버튼 화면 — 여기서는 API를 부르지 않음
  }

  // 돌발주제용 — 배경설문 밖이지만 누구나 일상에서 겪는 주제 풀
  var SURPRISE_TOPICS = [
    { id: "st_bank",     emoji: "🏦",  label: "은행",        en: "going to the bank" },
    { id: "st_hospital", emoji: "🏥",  label: "병원",        en: "going to the hospital" },
    { id: "st_appt",     emoji: "📅",  label: "약속",        en: "making and keeping appointments" },
    { id: "st_holiday",  emoji: "🎎",  label: "명절·휴일",    en: "holidays and special occasions" },
    { id: "st_transit",  emoji: "🚌",  label: "교통수단",     en: "public transportation" },
    { id: "st_weather",  emoji: "🌦️", label: "날씨·계절",    en: "the weather and seasons" },
    { id: "st_dining",   emoji: "🍽️", label: "외식",        en: "eating out at restaurants" },
    { id: "st_shopping", emoji: "🛍️", label: "쇼핑",        en: "going shopping" },
    { id: "st_hotel",    emoji: "🏨",  label: "호텔",        en: "staying at a hotel" },
    { id: "st_tech",     emoji: "💻",  label: "인터넷·기술",  en: "the internet and technology" },
    { id: "st_recycle",  emoji: "♻️",  label: "재활용",      en: "recycling and separating trash" },
    { id: "st_chores",   emoji: "🧹",  label: "집안일",      en: "doing household chores" },
    { id: "st_furni",    emoji: "🛋️", label: "가구·가전",    en: "furniture and home appliances" },
    { id: "st_health",   emoji: "💪",  label: "건강",        en: "staying healthy" },
    { id: "st_neighbor", emoji: "🏘️", label: "동네·이웃",    en: "your neighborhood and neighbors" },
    { id: "st_pharm",    emoji: "💊",  label: "약국",        en: "going to the pharmacy" },
    { id: "st_library",  emoji: "📚",  label: "도서관",      en: "going to the library" },
    { id: "st_cafe",     emoji: "☕",  label: "카페",        en: "going to a café" },
    { id: "st_fashion",  emoji: "👗",  label: "패션",        en: "fashion and clothes" },
  ];
  var lastSurpriseTopicId = null; // 직전 돌발 주제(반복 방지)
  function pickPracticeSurprise() {
    var pool = SURPRISE_TOPICS;
    if (pool.length > 1 && lastSurpriseTopicId) {
      pool = pool.filter(function (t) { return t.id !== lastSurpriseTopicId; });
    }
    var pick = pool[pickIndex(pool.length)];
    lastSurpriseTopicId = pick.id;
    return pick;
  }

  // 돌발 롤플레이용 — 설문 밖이지만 누구나 겪는 생활 상황 풀
  var ROLEPLAY_SURPRISE = [
    { id: "rp_bank",    emoji: "🏦",  label: "은행 업무",     en: "handling a task at the bank" },
    { id: "rp_clinic",  emoji: "🏥",  label: "병원·약국 예약", en: "making a hospital or pharmacy appointment" },
    { id: "rp_hotel",   emoji: "🏨",  label: "호텔 체크인",   en: "checking in at a hotel" },
    { id: "rp_refund",  emoji: "🧾",  label: "환불·교환",     en: "asking for a refund or exchange at a store" },
    { id: "rp_parcel",  emoji: "📦",  label: "택배·배송 문제", en: "dealing with a delivery or parcel problem" },
    { id: "rp_resv",    emoji: "🍽️", label: "식당 예약",     en: "making a restaurant reservation" },
    { id: "rp_salon",   emoji: "💇",  label: "미용실",        en: "getting a haircut at a hair salon" },
    { id: "rp_repair",  emoji: "🔧",  label: "수리 요청",     en: "requesting a repair for something broken" },
    { id: "rp_resched", emoji: "📅",  label: "약속 변경",     en: "changing or rescheduling an appointment" },
  ];

  // ✕로 주제를 지우면 → 설문 밖 생활 상황에서 무작위로 돌발 롤플레이 주제 선택
  function switchToSurpriseRoleplay() {
    var s = state.session;
    var sit = ROLEPLAY_SURPRISE[pickIndex(ROLEPLAY_SURPRISE.length)];
    s.topic = sit;
    s.topicId = null;
    s.surpriseRoleplay = true;
    s.topicLabel = sit.emoji + " " + sit.label;
    s.title = "돌발 롤플레이 · " + sit.label;
    $("mockTitle").textContent = "돌발 롤플레이";
    $("mockTopicPill").textContent = "🎲 돌발 롤플레이 · " + sit.label + " · " + s.level;
    renderComboReady("roleplay");
  }

  // 시작 전 준비 화면: 사용자가 '시작'을 눌러야 API 연동이 일어남 (불필요한 호출 방지)
  function renderComboReady(type) {
    var s = state.session;
    var stage = $("mockStage");
    stage.innerHTML = "";
    var _mh = document.querySelector(".mock-head"); if (_mh) _mh.style.display = "none"; // 시작 화면에선 진행 행(주제·진행바·카운터) 숨김
    var isSurpriseRp = (type === "roleplay" && s.surpriseRoleplay);
    var ready = el("div", "combo-ready");
    // 주제·레벨은 카드 안에서만 표시
    ready.appendChild(el("div", "combo-ready-type",
      (isSurpriseRp ? "🎲 돌발 롤플레이" : TYPE_LABEL[type]) + " · " + s.level));

    var topicRow = el("div", "combo-ready-topic-row");
    topicRow.appendChild(el("span", "combo-ready-topic", s.topicLabel));
    ready.appendChild(topicRow);

    var READY_HINT = {
      topic: "3개의 질문이 이어집니다. 실전처럼 답해보세요",
      roleplay: "상황이 주어집니다. 역할에 몰입해 말해보세요",
      surprise: "예상 못 한 주제예요. 실전 돌발처럼 대응해보세요",
    };
    ready.appendChild(el("p", "combo-ready-hint muted", READY_HINT[type] || ""));

    var btns = el("div", "combo-ready-btns");
    var start = el("button", "primary-btn", "▶ 시작");
    start.type = "button";
    start.addEventListener("click", function () { runCombo(); });
    btns.appendChild(start);

    var reroll = el("button", "ghost-btn", isSurpriseRp ? "🎲 다른 돌발" : "🔄 다른 주제");
    reroll.type = "button";
    reroll.addEventListener("click", function () {
      if (isSurpriseRp) switchToSurpriseRoleplay();
      else startCombo(type);
    });
    btns.appendChild(reroll);

    ready.appendChild(btns);
    stage.appendChild(ready);
  }

  // 실제 문제 생성(API 연동) — '시작' 클릭 시에만 호출
  async function runCombo() {
    if (!requireApiKey(runCombo)) return; // 키 없으면 안내 모달 → 저장 후 이어서 진행
    var s = state.session;
    var type = s.type, topic = s.topic, level = s.level;
    $("mockStage").innerHTML = loaderHTML(
      "AI가 " + level + " 난이도 " + (type === "roleplay" ? "상황극을" : "콤보 질문을") + " 만들고 있어요…");

    if (sessionAbort) sessionAbort.abort();
    sessionAbort = new AbortController();
    try {
      var onRetry = function (sec) {
        $("mockStage").innerHTML = loaderHTML("무료 한도 대기 중… " + sec + "초 후 자동 재시도");
      };
      var items;
      if (type === "roleplay") {
        var rp = await QuestionGen.generateRoleplay({
          topic: topic, level: level, selected: true, signal: sessionAbort.signal, onRetry: onRetry,
        });
        rp.items.forEach(function (it) { it.scenario = rp.scenario; });
        items = rp.items;
      } else {
        items = await QuestionGen.generateCombo({
          topic: topic, level: level, type: type, selected: true, signal: sessionAbort.signal, onRetry: onRetry,
        });
      }
      state.session.items = items;
      state.session.index = 0;
      $("mockNavBar").style.display = "flex";
      renderRunItem();
    } catch (e) {
      if (e && e.code === "ABORTED") return;
      $("mockStage").innerHTML = "";
      $("mockStage").appendChild(el("div", "error-box", "✕ " + ((e && e.message) || "문제 생성 실패")));
      var retry = el("button", "ghost-btn", "다시 시도");
      retry.addEventListener("click", function () { runCombo(); });
      $("mockStage").appendChild(retry);
    }
  }

  function renderRunItem() {
    var s = state.session, i = s.index, qs = s.items;
    var _mh = document.querySelector(".mock-head"); if (_mh) _mh.style.display = ""; // 풀이 중 진행 행 표시
    $("mockReport").innerHTML = "";
    $("mockNavBar").style.display = "flex";
    $("mockCounter").textContent = (i + 1) + " / " + qs.length;
    $("mockBar").style.width = ((i + 1) / qs.length * 100) + "%";

    var stage = $("mockStage");
    stage.innerHTML = "";
    if (qs[i].scenario && qs[i].scenario.en) stage.appendChild(scenarioBanner(qs[i].scenario));
    stage.appendChild(buildQuestionCard(qs[i], i, { showEval: false }));

    $("mockPrev").disabled = (i === 0);
    $("mockNext").textContent = (i === qs.length - 1) ? "채점하기 ✓" : "다음 문제 →";
  }

  // 롤플레이 상황(시나리오) 배너
  function scenarioBanner(sc) {
    var box = el("div", "scenario");
    var head = el("div", "scenario-head");
    head.appendChild(el("span", "scenario-tag", "🎭 상황"));
    var tts = el("button", "q-tts", "🔊 듣기");
    tts.type = "button";
    tts.dataset.ttsLabel = "1";
    tts.addEventListener("click", function () { playWithState(tts, sc.en); });
    head.appendChild(tts);
    box.appendChild(head);

    box.appendChild(el("p", "scenario-en", sc.en));
    if (sc.ko) {
      var ko = el("p", "scenario-ko", sc.ko);
      box.appendChild(ko);
      var trans = el("button", "q-trans", "한글 보기");
      trans.type = "button";
      trans.addEventListener("click", function () {
        var open = ko.classList.toggle("show");
        trans.textContent = open ? "한글 숨기기" : "한글 보기";
      });
      box.appendChild(trans);
    }
    return box;
  }

  function runNext() {
    var s = state.session;
    if (!s) return;
    if (s.index < s.items.length - 1) { s.index += 1; renderRunItem(); }
    else gradeSession();
  }
  function runPrev() {
    var s = state.session;
    if (s && s.index > 0) { s.index -= 1; renderRunItem(); }
  }

  async function gradeSession() {
    if (window.speechSynthesis) window.speechSynthesis.cancel();
    var s = state.session;
    var items = s.items.map(function (q) {
      return { q: q, transcript: (q.recording && q.recording.transcript) || "" };
    });
    if (!items.filter(function (it) { return it.transcript.trim(); }).length) {
      toast("최소 한 문제는 답변해야 채점할 수 있어요");
      return;
    }

    $("mockStage").innerHTML = "";
    $("mockNavBar").style.display = "none";
    var _mh = document.querySelector(".mock-head"); if (_mh) _mh.style.display = "none"; // 결과 화면에선 진행 행 숨김(헤더 깔끔히)
    var report = $("mockReport");
    report.innerHTML = loaderHTML(items.length + "문항을 종합 평가하고 있어요…");

    try {
      var topicForEval = { en: s.title, label: s.topicLabel };
      var result = await Evaluator.evaluateMock(topicForEval, items, {
        onRetry: function (sec) {
          report.innerHTML = loaderHTML("무료 한도 대기 중… " + sec + "초 후 자동 재시도");
        },
      });
      s.result = result;
      var saved = await saveSession(s, result);
      renderReport(result, { saved: saved });
    } catch (e) {
      report.innerHTML = "";
      report.appendChild(el("div", "error-box", "✕ " + ((e && e.message) || "채점에 실패했습니다.")));
      var retry = el("button", "ghost-btn", "다시 채점");
      retry.addEventListener("click", gradeSession);
      report.appendChild(retry);
    }
  }

  // 세션 저장: 녹음→IndexedDB, 메타·전사·평가→localStorage 내역
  async function saveSession(s, result) {
    var items = [];
    for (var i = 0; i < s.items.length; i++) {
      var q = s.items[i];
      var rec = q.recording || {};
      var audioId = null;
      if (rec.blob && RecDB.supported()) {
        try { audioId = await RecDB.put(rec.blob); } catch (e) { audioId = null; }
      }
      items.push({
        idx: i, label: q.label, type: q.type,
        question: q.en, ko: q.ko || "",
        scenario: q.scenario || null,
        transcript: (rec.transcript || "").trim(),
        audioId: audioId,
        analysis: q.analysis || null,       // 풀이 중 생성된 발화 분석(있으면 재사용)
        modelAnswer: q.modelAnswer || null, // 풀이 중 생성된 모범답안(있으면 재사용)
      });
    }
    var record = {
      id: "h_" + Date.now() + "_" + Math.floor(Math.random() * 1000),
      ts: Date.now(),
      type: s.type, level: s.level, title: s.title,
      mockMode: s.mockMode || null,
      topicId: s.topicId || null,
      grade: result.grade, avg: result.avg,
      evaluation: {
        summary: result.summary, dims: result.dims,
        strengths: result.strengths, improvements: result.improvements,
        perQuestion: result.perQuestion, nextAdvice: result.nextAdvice,
      },
      items: items,
    };
    try {
      var hist = Storage.getHistory();
      hist.unshift(record);
      Storage.setHistory(hist);
      s.savedId = record.id;
      return true;
    } catch (e) {
      return false;
    }
  }

  // ---------- 모의고사 ----------
  var MOCK_PLAN = {
    short: [{ kind: "topic" }, { kind: "roleplay" }],
    full:  [{ kind: "topic" }, { kind: "topic" }, { kind: "surprise" }, { kind: "roleplay" }],
  };

  function pickTopics(n) {
    var pool = Storage.getSurvey().map(function (id) { return topicById(id); }).filter(Boolean);
    if (!pool.length) return [];
    var shuffled = pool.slice();
    for (var i = shuffled.length - 1; i > 0; i--) {
      var j = pickIndex(i + 1), t = shuffled[i]; shuffled[i] = shuffled[j]; shuffled[j] = t;
    }
    var out = [];
    for (var k = 0; k < n; k++) out.push(shuffled[k % shuffled.length]);
    return out;
  }
  function pushAll(arr, items) { items.forEach(function (x) { arr.push(x); }); }

  async function startMockExam(version) {
    if (!requireApiKey(function () { startMockExam(version); })) return;
    var level = Storage.getLevel();
    if (!Storage.getSurvey().length) { toast("먼저 배경 설문에서 주제를 고르세요"); openSurvey(); return; }

    var plan = MOCK_PLAN[version] || MOCK_PLAN.short;
    var modeLabel = version === "full" ? "실전형" : "짧은형";
    var topicNeeded = plan.filter(function (p) { return p.kind === "topic"; }).length;
    var topics = pickTopics(topicNeeded);

    state.session = {
      type: "mock", mockMode: modeLabel, level: level,
      topicLabel: "📝 모의고사", title: "모의고사 · " + modeLabel,
      items: null, index: 0, result: null,
    };

    show("mock");
    $("mockTitle").textContent = "모의고사";
    $("mockTopicPill").textContent = "📝 모의고사 · " + modeLabel + " · " + level;
    var _mh = document.querySelector(".mock-head"); if (_mh) _mh.style.display = ""; // 진행 행 표시(연습 시작화면에서 숨겼을 수 있음)
    $("mockReport").innerHTML = "";
    $("mockNavBar").style.display = "none";

    if (sessionAbort) sessionAbort.abort();
    sessionAbort = new AbortController();
    var signal = sessionAbort.signal;

    var totalSets = plan.length + 1; // + 자기소개
    function progress(done) {
      $("mockStage").innerHTML = loaderHTML("모의고사 문제 생성 중… (" + done + "/" + totalSets + " 세트)");
    }
    var retryNote = function (sec) {
      $("mockStage").innerHTML = loaderHTML("무료 한도 대기 중… " + sec + "초 후 자동 재시도");
    };

    try {
      progress(0);
      var items = [];
      items.push(await QuestionGen.generateSelfIntro(level));
      progress(1);

      var ti = 0;
      for (var si = 0; si < plan.length; si++) {
        var kind = plan[si].kind;
        if (kind === "roleplay") {
          var rpTopic = topics.length ? topics[0] : null;
          var rp = await QuestionGen.generateRoleplay({ topic: rpTopic, level: level, selected: true, signal: signal, onRetry: retryNote });
          rp.items.forEach(function (it) { it.scenario = rp.scenario; });
          pushAll(items, rp.items);
        } else if (kind === "surprise") {
          var sc = await QuestionGen.generateCombo({ topic: pickPracticeSurprise(), level: level, type: "surprise", selected: true, signal: signal, onRetry: retryNote });
          pushAll(items, sc);
        } else {
          var tp = topics[ti++ % topics.length];
          var tc = await QuestionGen.generateCombo({ topic: tp, level: level, type: "topic", selected: true, signal: signal, onRetry: retryNote });
          pushAll(items, tc);
        }
        progress(si + 2);
      }

      state.session.items = items;
      state.session.index = 0;
      $("mockNavBar").style.display = "flex";
      renderRunItem();
    } catch (e) {
      if (e && e.code === "ABORTED") return;
      $("mockStage").innerHTML = "";
      $("mockStage").appendChild(el("div", "error-box", "✕ " + ((e && e.message) || "문제 생성 실패")));
      var retry = el("button", "ghost-btn", "다시 시도");
      retry.addEventListener("click", function () { startMockExam(version); });
      $("mockStage").appendChild(retry);
    }
  }

  function renderReport(r, opts) {
    opts = opts || {};
    var report = $("mockReport");
    report.innerHTML = "";
    var wrap = el("div", "report");

    // 히어로: 종합 등급
    var hero = el("div", "report-hero");
    var s = state.session || {};
    hero.appendChild(el("div", "lbl", (s.title || "") + " · 종합 예상 등급"));
    // 현재 등급(크게) → 목표 레벨(작게) — 갭이 보이게
    var gradeRow = el("div", "grade-compare");
    var cur = el("div", "grade-cell");
    cur.appendChild(el("div", "grade-cap", "현재"));
    var g = el("div", "report-grade", r.grade);
    g.setAttribute("data-tier", Evaluator.gradeTier(r.grade));
    g.setAttribute("data-grade", r.grade);
    cur.appendChild(g);
    gradeRow.appendChild(cur);
    gradeRow.appendChild(el("div", "grade-arrow", "→"));
    var tgt = el("div", "grade-cell");
    tgt.appendChild(el("div", "grade-cap", "목표"));
    var tg = el("div", "report-grade small", s.level || "");
    tg.setAttribute("data-grade", s.level || "");
    tgt.appendChild(tg);
    gradeRow.appendChild(tgt);
    hero.appendChild(gradeRow);
    hero.appendChild(el("div", "lbl", "평균 " + r.avg + " / 5"));
    if (r.summary) hero.appendChild(el("div", "report-summary", r.summary));
    if (opts.saved) hero.appendChild(el("div", "saved-badge", "✓ 테스트 내역에 저장됨"));
    wrap.appendChild(hero);

    // 루브릭 4항목 (renderEval와 동일 시각화 재사용)
    wrap.appendChild(el("div", "report-section-title", "항목별 평가"));
    var evalArea = el("div");
    renderEval(evalArea, r);
    // renderEval은 헤더(등급)·강점/개선·주의문까지 그리므로, 리포트에서 중복되는 부분은 숨기고
    // 루브릭 막대만 남긴다.
    var innerHead = evalArea.querySelector(".eval-head");
    if (innerHead) innerHead.style.display = "none";
    var innerLists = evalArea.querySelector(".eval-lists");
    if (innerLists) innerLists.style.display = "none";
    var innerNote = evalArea.querySelector(".eval-note");
    if (innerNote) innerNote.style.display = "none";
    // '다음 레벨로 가려면' 연파랑 박스는 독립 섹션으로 분리
    var innerNext = evalArea.querySelector(".eval-next");
    wrap.appendChild(evalArea);
    if (innerNext) wrap.appendChild(innerNext);

    // 문제별 요약
    wrap.appendChild(el("div", "report-section-title", "문제별 요약"));
    var pqBox = el("div", "pq-list");
    r.perQuestion.forEach(function (p, i) {
      var row = el("div", "pq");
      row.appendChild(el("div", "pq-num", String(i + 1)));
      var body = el("div", "pq-body");
      var lbl = el("div", "pq-label");
      lbl.innerHTML = '<span class="q-type" data-t="' + escapeHtml(p.type || "") + '">' + escapeHtml(p.label || "") + '</span>' +
        (p.answered ? "" : ' <span class="na">· 무응답</span>');
      body.appendChild(lbl);
      if (p.note) body.appendChild(el("div", "pq-note", p.note));
      row.appendChild(body);
      pqBox.appendChild(row);
    });
    wrap.appendChild(pqBox);

    // 강점/개선
    if (r.strengths.length || r.improvements.length) {
      wrap.appendChild(el("div", "report-section-title", "강점 & 개선점"));
      var lists = el("div", "eval-lists");
      lists.appendChild(makeEvalList("👍 강점", "good", r.strengths));
      lists.appendChild(makeEvalList("🔧 개선점", "bad", r.improvements));
      wrap.appendChild(lists);
    }

    wrap.appendChild(el("p", "eval-note",
      "※ 전사 텍스트 기반 종합 평가입니다. 발음·억양은 반영되지 않으며, 참고용 예상 등급입니다."));

    // 액션
    var actions = el("div", "report-actions");
    var again = el("button", "primary-btn", "🔄 다시 연습");
    again.addEventListener("click", function () {
      var t = (state.session && state.session.type) || "topic";
      if (t === "mock") goHome(); else startCombo(t);
    });
    var histBtn = el("button", "ghost-btn", "🗂 내역");
    histBtn.addEventListener("click", openHistory);
    var home = el("button", "ghost-btn", "🏠 홈");
    home.addEventListener("click", goHome);
    actions.appendChild(again);
    actions.appendChild(histBtn);
    actions.appendChild(home);
    wrap.appendChild(actions);

    report.appendChild(wrap);
    window.scrollTo(0, 0);
  }

  function toggleKeyVisibility() {
    var input = $("apiKey");
    var btn = $("toggleKey");
    if (input.type === "password") { input.type = "text"; btn.textContent = "숨김"; }
    else { input.type = "password"; btn.textContent = "표시"; }
  }

  // ---------- 초기화 ----------
  function init() {
    initTheme();

    // 제공사/모델/키 로드
    $("provider").value = Storage.getProvider();
    $("model").value = Storage.getModel();
    $("model").addEventListener("change", function () {
      Storage.setModel($("model").value);
      toast("모델 변경 · " + $("model").value);
    });
    loadKeyIntoField();
    refreshKeyState();

    // 네비게이션
    $("navHome").addEventListener("click", goHome);
    $("navSettings").addEventListener("click", function () { show("settings"); });
    $("gotoSettingsFromHint").addEventListener("click", function () { show("settings"); });

    // 테마
    $("themeToggle").addEventListener("click", toggleTheme);
    $("darkSwitch").addEventListener("change", function (e) {
      var t = e.target.checked ? "dark" : "light";
      Storage.setTheme(t); applyTheme(t);
    });

    // 키 관리
    $("saveKey").addEventListener("click", saveKey);
    $("testKey").addEventListener("click", testKey);
    $("clearKey").addEventListener("click", clearKey);
    $("toggleKey").addEventListener("click", toggleKeyVisibility);
    $("apiKey").addEventListener("keydown", function (e) {
      if (e.key === "Enter") { e.preventDefault(); saveKey(); }
    });

    // API 키 안내 모달
    $("gateSave").addEventListener("click", saveGateKey);
    $("gateKey").addEventListener("keydown", function (e) {
      if (e.key === "Enter") { e.preventDefault(); saveGateKey(); }
    });
    var kmClose = $("keyModalClose");
    if (kmClose) kmClose.addEventListener("click", closeKeyModal);
    var km = $("keyModal");
    if (km) km.addEventListener("click", function (e) { if (e.target === km) closeKeyModal(); }); // 바깥 클릭 닫기
    // 401/403(키 오류) 발생 시 같은 안내 모달로 재입력 유도
    window.addEventListener("apikey-invalid", function () {
      openKeyModal("API 키가 올바르지 않아요. 키를 다시 확인해 입력해 주세요.");
    });

    // 듣기(TTS): 음성 비동기 로드 + 설정(음성 드롭다운/미리듣기) 연결
    loadVoices();
    if (("speechSynthesis" in window) && typeof window.speechSynthesis.addEventListener === "function") {
      window.speechSynthesis.addEventListener("voiceschanged", function () { loadVoices(); refreshVoiceSelect(); });
    }
    setupTtsSettings();

    // 홈 허브 — 레벨 / 설문수정 / 유형카드 / 내역
    $("levelSeg").querySelectorAll(".level-card").forEach(function (b) {
      b.addEventListener("click", function () { setLevel(b.dataset.level); });
    });
    $("editSurvey").addEventListener("click", openSurvey);
    document.querySelectorAll(".type-card").forEach(function (c) {
      c.addEventListener("click", function () { startType(c.dataset.type); });
    });
    $("openHistory").addEventListener("click", openHistory);
    $("historyBack").addEventListener("click", goHome);
    $("detailBack").addEventListener("click", openHistory);
    $("clearHistory").addEventListener("click", clearHistory);
    $("openStats").addEventListener("click", openStats);
    $("statsBack").addEventListener("click", openHistory);

    // 스크립트 만들기 / 보관함
    $("openScriptLab").addEventListener("click", openScriptLab);
    $("scriptBack").addEventListener("click", goHome);
    $("genScript").addEventListener("click", generateScript);
    $("scriptRequest").addEventListener("input", function () {
      $("genScript").disabled = !$("scriptRequest").value.trim();
    });
    $("scriptModeSeg").querySelectorAll(".seg-btn").forEach(function (b) {
      b.addEventListener("click", function () { scriptState.mode = b.dataset.mode; applyScriptMode(); });
    });
    $("openScripts").addEventListener("click", openScripts);
    $("scriptsBack").addEventListener("click", goHome);

    // 설문
    $("surveyBack").addEventListener("click", goHome);
    $("saveSurvey").addEventListener("click", saveSurvey);

    // 모의고사 버전 선택
    $("mocksetBack").addEventListener("click", goHome);
    document.querySelectorAll(".ver-card").forEach(function (c) {
      c.addEventListener("click", function () { startMockExam(c.dataset.ver); });
    });

    // 연습 런너
    $("practiceBack").addEventListener("click", function () {
      if (window.speechSynthesis) window.speechSynthesis.cancel();
      goHome();
    });

    // 런너 네비게이션
    $("mockPrev").addEventListener("click", runPrev);
    $("mockNext").addEventListener("click", runNext);
    $("mockExit").addEventListener("click", function () {
      if (window.speechSynthesis) window.speechSynthesis.cancel();
      if (sessionAbort) sessionAbort.abort();
      goHome();
    });

    // 첫 화면: 항상 홈 (키는 실제 호출 시점에만 안내)
    renderHub();
    show("home");
  }

  function goHome() {
    if (window.speechSynthesis) window.speechSynthesis.cancel();
    renderHub();
    show("home");
  }

  // ---------- 테스트 내역 ----------
  function openHistory() {
    renderHistoryList();
    show("history");
  }

  function fmtDate(ts) {
    var d = new Date(ts);
    function p(n) { return (n < 10 ? "0" : "") + n; }
    return d.getFullYear() + "." + p(d.getMonth() + 1) + "." + p(d.getDate()) +
      " " + p(d.getHours()) + ":" + p(d.getMinutes());
  }

  var TRASH_SVG = '<svg viewBox="0 0 24 24" width="17" height="17" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/><path d="M10 11v6M14 11v6"/><path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/></svg>';

  function renderHistoryList() {
    var host = $("historyList");
    // 정적 헤더 숨기고 공통 [‹ + 제목] 헤더 사용
    $("historyBack").style.display = "none";
    var hh = document.querySelector("#screen-history .hist-head");
    if (hh) hh.style.display = "none";
    host.innerHTML = "";

    var hist = Storage.getHistory();

    // 헤더: [‹ + '테스트 내역'] + 우측 '전체 삭제'
    var clearBtn = el("button", "hist-clear-btn", "전체 삭제");
    clearBtn.type = "button";
    clearBtn.addEventListener("click", clearHistory);
    host.appendChild(detailHeader("테스트 내역", goHome, hist.length ? clearBtn : null));

    if (!hist.length) {
      var empty = el("div", "scripts-empty");
      empty.appendChild(el("p", "muted", "아직 연습 기록이 없어요"));
      var go = el("button", "primary-btn", "▶ 연습 시작");
      go.type = "button";
      go.addEventListener("click", goHome);
      empty.appendChild(go);
      host.appendChild(empty);
      return;
    }

    host.appendChild(buildHistStats(hist));
    hist.forEach(function (rec) { host.appendChild(buildHistRow(rec)); });
  }

  // 미니 통계 카드: 총 연습 / 평균 점수 / 최근 등급 (+ 분석 아이콘)
  function buildHistStats(hist) {
    var sum = 0, n = 0;
    hist.forEach(function (r) { var a = parseFloat(r.avg); if (!isNaN(a)) { sum += a; n++; } });
    var avg = n ? (sum / n).toFixed(1) : "—";
    var recent = (hist[0] && hist[0].grade) || "—";

    var card = el("div", "hist-stats");
    var ana = el("button", "hist-stats-ana");
    ana.type = "button"; ana.title = "학습 분석"; ana.setAttribute("aria-label", "학습 분석");
    ana.innerHTML = '<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/></svg>';
    ana.addEventListener("click", openStats);
    card.appendChild(ana);

    var grid = el("div", "hist-stats-grid");
    grid.appendChild(histStatCell(String(hist.length), "총 연습"));
    grid.appendChild(histStatCell(n ? (avg + " / 5") : "—", "평균 점수"));
    var recCell = histStatCell(recent, "최근 등급");
    var rv = recCell.querySelector(".hist-stat-val");
    if (rv) rv.setAttribute("data-grade", recent);
    grid.appendChild(recCell);
    card.appendChild(grid);
    return card;
  }
  function histStatCell(val, label) {
    var c = el("div", "hist-stat");
    c.appendChild(el("div", "hist-stat-val", val));
    c.appendChild(el("div", "hist-stat-label", label));
    return c;
  }

  // 행: [등급 배지] + [제목 + 날짜·목표·평균] + [휴지통] + [›]
  function buildHistRow(rec) {
    var row = el("div", "script-row");
    row.setAttribute("role", "button");
    row.setAttribute("tabindex", "0");
    row.addEventListener("click", function () { openDetail(rec.id); });

    var g = el("div", "pq-grade", rec.grade);
    g.setAttribute("data-grade", rec.grade);
    row.appendChild(g);

    var main = el("div", "script-row-main");
    main.appendChild(el("div", "script-row-title", rec.title));
    main.appendChild(el("div", "muted small",
      fmtDate(rec.ts) + " · 목표 " + rec.level + " · 평균 " + rec.avg + "/5"));
    row.appendChild(main);

    var meta = el("div", "script-row-meta");
    var del = el("button", "script-del");
    del.type = "button"; del.title = "삭제"; del.setAttribute("aria-label", "삭제");
    del.innerHTML = TRASH_SVG;
    del.addEventListener("click", function (e) {
      e.stopPropagation();
      if (window.confirm("이 기록을 삭제할까요?")) deleteRecord(rec.id);
    });
    meta.appendChild(del);
    meta.appendChild(el("span", "script-row-chevron", "›"));
    row.appendChild(meta);
    return row;
  }

  function openDetail(id) {
    var hist = Storage.getHistory();
    var rec = null;
    for (var i = 0; i < hist.length; i++) { if (hist[i].id === id) { rec = hist[i]; break; } }
    if (!rec) { toast("내역을 찾을 수 없습니다"); return; }
    renderDetail(rec);
    show("detail");
  }

  function renderDetail(rec) {
    var host = $("detailBody");
    $("detailBack").style.display = "none"; // 정적 헤더 숨김 → 공통 헤더 사용
    host.innerHTML = "";

    // 헤더: [‹ + 제목] + 우측 휴지통(삭제)
    var trash = el("button", "icon-btn-sm icon-danger");
    trash.type = "button"; trash.title = "이 기록 삭제"; trash.setAttribute("aria-label", "이 기록 삭제");
    trash.innerHTML = TRASH_SVG;
    trash.addEventListener("click", function () {
      if (window.confirm("이 기록을 삭제할까요?")) deleteRecord(rec.id);
    });
    host.appendChild(detailHeader(rec.title, openHistory, trash));
    // 날짜·목표 작은 글씨 한 줄
    host.appendChild(el("div", "detail-sub muted small",
      fmtDate(rec.ts) + " · 목표 " + rec.level + (rec.mockMode ? " · " + rec.mockMode : "")));

    // 평가(등급/루브릭/강점·개선) — renderEval 재사용 (흰 카드 톤은 .report 스코프 재사용)
    var ev = rec.evaluation || {};
    var evalObj = {
      grade: rec.grade, avg: rec.avg,
      summary: ev.summary || "", dims: ev.dims || [],
      strengths: ev.strengths || [], improvements: ev.improvements || [],
      nextAdvice: ev.nextAdvice || "",
    };
    var evalArea = el("div", "report");
    renderEval(evalArea, evalObj);
    host.appendChild(evalArea);

    // 문항별 답변(질문/전사/녹음)
    host.appendChild(el("div", "report-section-title", "문항별 답변"));
    (rec.items || []).forEach(function (it, i) {
      host.appendChild(buildHistoryItem(it, ev.perQuestion && ev.perQuestion[i], rec.level, rec.id, i));
    });

    window.scrollTo(0, 0);
  }

  // 기록의 특정 문항 필드를 localStorage에 영구 저장 (재호출 차단)
  function persistItemField(recId, idx, field, value) {
    if (recId == null || idx == null) return;
    var hist = Storage.getHistory();
    for (var i = 0; i < hist.length; i++) {
      if (hist[i].id === recId) {
        if (hist[i].items && hist[i].items[idx]) {
          hist[i].items[idx][field] = value;
          Storage.setHistory(hist);
        }
        return;
      }
    }
  }

  // 저장본 있으면 접힌 섹션(표시만), 없으면 작은 링크 → 1회 호출 → 결과 표시 + 기록 저장.
  // 한 번 받아온 뒤로는 접기 토글만 동작 — 닫았다 열어도 재호출 없음.
  function attachResultSection(card, o) {
    if (o.saved) {
      console.log(o.logName + ": cache hit");
      var det = el("details", "hist-collapse");
      det.appendChild(el("summary", null, o.openLabel));
      var body = el("div");
      o.render(body, o.saved);
      det.appendChild(body);
      card.appendChild(det);
      return;
    }
    var area = el("div");
    var link = el("button", "hist-link-btn", o.getLabel);
    link.type = "button";
    link.addEventListener("click", async function () {
      link.disabled = true;
      area.innerHTML = loaderHTML(o.openLabel + " 생성 중…");
      try {
        console.log(o.logName + ": API call");
        var data = await o.generate();
        o.persist(data); // it.* + localStorage 영구 저장
        var det2 = el("details", "hist-collapse");
        det2.open = true;
        det2.appendChild(el("summary", null, o.openLabel));
        var body2 = el("div");
        o.render(body2, data);
        det2.appendChild(body2);
        area.innerHTML = "";
        link.replaceWith(det2); // 링크 → 접기 토글로 교체
      } catch (e) {
        area.innerHTML = "";
        area.appendChild(el("div", "error-box", "✕ " + ((e && e.message) || "실패")));
        link.disabled = false;
      }
    });
    card.appendChild(link);
    card.appendChild(area);
  }

  function buildHistoryItem(it, pq, level, recId, idx) {
    var card = el("div", "hist-item");
    var top = el("div", "q-top");
    top.innerHTML =
      '<span class="q-num">' + ((it.idx != null ? it.idx : 0) + 1) + "</span>" +
      '<span class="q-type" data-t="' + it.type + '">' + escapeHtml(it.label) + "</span>" +
      (pq && pq.grade ? '<span class="q-type-hint">' + escapeHtml(pq.grade) + "</span>" : "");
    card.appendChild(top);

    if (it.scenario && it.scenario.en) {
      card.appendChild(el("p", "muted small", "🎭 " + it.scenario.en));
    }
    card.appendChild(el("p", "q-en", it.question));

    card.appendChild(el("div", "rec-tlabel", "내 답변 (전사)"));
    card.appendChild(el("p", "hist-transcript", it.transcript || "(무응답)"));

    if (it.audioId) {
      var holder = el("div");
      var playBtn = el("button", "hist-audio-btn");
      playBtn.type = "button";
      playBtn.setAttribute("aria-label", "내 녹음 듣기");
      playBtn.innerHTML = '<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><polygon points="6 4 20 12 6 20 6 4"/></svg><span>내 녹음</span>';
      playBtn.addEventListener("click", function () { loadAudio(it.audioId, holder, playBtn); });
      card.appendChild(playBtn);
      card.appendChild(holder);
    }
    if (pq && pq.note) card.appendChild(el("p", "pq-note", pq.note));

    var lv = level || Storage.getLevel();

    // 발화 분석 — 저장본 있으면 표시만, 없으면 1회 생성+저장(전사 있을 때만)
    if (it.analysis || (it.transcript && it.transcript.trim())) {
      attachResultSection(card, {
        logName: "speechAnalysis",
        saved: it.analysis || null,
        openLabel: "📊 발화 분석",
        getLabel: "📊 발화 분석 받기",
        generate: async function () {
          var blob = null;
          if (it.audioId && RecDB.supported()) { try { blob = await RecDB.get(it.audioId); } catch (e) { blob = null; } }
          return Analyzer.analyze(it.transcript, blob);
        },
        render: function (body, data) { renderSpeechAnalysis(body, data); },
        persist: function (data) { it.analysis = data; persistItemField(recId, idx, "analysis", data); },
      });
    }

    // 모범답안 — 저장본 있으면 표시만, 없으면 1회 생성+저장
    attachResultSection(card, {
      logName: "modelAnswer",
      saved: it.modelAnswer || null,
      openLabel: lv + " 모범답안",
      getLabel: lv + " 모범답안 받기",
      generate: function () { return QuestionGen.generateModelAnswer({ en: it.question, type: it.type }, lv); },
      render: function (body, data) { renderModelAnswer(body, data); },
      persist: function (data) { it.modelAnswer = data; persistItemField(recId, idx, "modelAnswer", data); },
    });

    return card;
  }

  async function loadAudio(audioId, holder, btn) {
    btn.disabled = true;
    btn.classList.add("playing"); // 아이콘 버튼 로딩/재생 표시 (텍스트 미변경)
    try {
      var blob = await RecDB.get(audioId);
      if (!blob) { btn.disabled = false; btn.classList.remove("playing"); toast("녹음이 없습니다"); return; }
      var url = URL.createObjectURL(blob);
      var audio = document.createElement("audio");
      audio.controls = true; audio.src = url; audio.className = "rec-audio";
      holder.appendChild(audio);
      audio.play().catch(function () {});
      btn.remove();
    } catch (e) {
      btn.disabled = false; btn.classList.remove("playing");
      toast("녹음을 불러오지 못했습니다");
    }
  }

  function deleteRecord(id) {
    var rec = null;
    var hist = Storage.getHistory().filter(function (r) {
      if (r.id === id) { rec = r; return false; }
      return true;
    });
    Storage.setHistory(hist);
    if (rec && rec.items) {
      rec.items.forEach(function (it) { if (it.audioId) RecDB.remove(it.audioId); });
    }
    toast("삭제했습니다");
    openHistory();
  }

  function clearHistory() {
    if (!Storage.getHistory().length) { toast("내역이 없습니다"); return; }
    if (!window.confirm("모든 테스트 내역과 녹음을 삭제할까요? 되돌릴 수 없습니다.")) return;
    Storage.setHistory([]);
    if (RecDB.supported()) RecDB.clearAll();
    renderHistoryList();
    toast("전체 삭제됨");
  }

  // ---------- 학습 분석 (약점·추이·내보내기) ----------
  // 약점 항목별 고정 조언(AI 호출 없음)
  var WEAK_ADVICE = {
    "과제수행": "질문이 요구하는 내용에 직접 답하는 연습을",
    "내용·맥락": "구체적인 정보와 상세 설명을 늘려보세요",
    "담화유형": "문장을 연결해 문단으로 말해보세요",
    "정확성": "시제·수일치 등 기본 문법을 점검하세요",
    "구술전달력": "머뭇거림을 줄이고 일정한 속도로 말해보세요",
  };
  var ICON_DL = '<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>';
  function statCardWrap(content) { var c = el("div", "stat-card"); c.appendChild(content); return c; }

  function openStats() { renderStats(); show("stats"); }

  function renderStats() {
    var host = $("statsBody");
    host.innerHTML = "";
    var hist = Storage.getHistory();
    if (!hist.length) {
      host.appendChild(el("p", "muted", "분석할 기록이 없어요. 연습이나 모의고사를 마치면 통계가 쌓입니다."));
      return;
    }

    // --- 집계 ---
    var ordered = hist.slice().reverse(); // 오래된→최신
    var avgs = ordered.map(function (r) { return r.avg || 0; });
    var totalAvg = +(avgs.reduce(function (a, b) { return a + b; }, 0) / avgs.length).toFixed(1);

    var dimSum = {}, dimCnt = {}, typeSum = {}, typeCnt = {}, topSum = {}, topCnt = {};
    hist.forEach(function (r) {
      ((r.evaluation && r.evaluation.dims) || []).forEach(function (d) {
        dimSum[d.key] = (dimSum[d.key] || 0) + (d.score || 0);
        dimCnt[d.key] = (dimCnt[d.key] || 0) + 1;
      });
      if (r.type) { typeSum[r.type] = (typeSum[r.type] || 0) + (r.avg || 0); typeCnt[r.type] = (typeCnt[r.type] || 0) + 1; }
      if (r.topicId) { topSum[r.topicId] = (topSum[r.topicId] || 0) + (r.avg || 0); topCnt[r.topicId] = (topCnt[r.topicId] || 0) + 1; }
    });

    // --- 요약 ---
    var sum = el("div", "stats-summary");
    sum.appendChild(statBox(hist.length + "회", "총 테스트"));
    sum.appendChild(statBox(totalAvg + "/5", "평균 점수"));
    var recentBox = statBox(hist[0].grade, "최근 등급");
    var rv = recentBox.querySelector(".stat-value");
    if (rv) rv.setAttribute("data-grade", hist[0].grade); // 등급 컬러 스케일
    sum.appendChild(recentBox);
    host.appendChild(sum);

    // --- 추이 차트 (날짜·점수 라벨) ---
    host.appendChild(el("div", "report-section-title", "점수 추이 (평균/5, 오래된→최신)"));
    host.appendChild(buildLineChart(avgs.slice(-20), ordered.map(function (r) { return r.ts; }).slice(-20)));

    // --- 루브릭 약점 (흰 카드) ---
    host.appendChild(el("div", "report-section-title", "항목별 평균 (약점 진단)"));
    var dims = Evaluator.DIMENSIONS.map(function (d) {
      var avg = dimCnt[d.key] ? dimSum[d.key] / dimCnt[d.key] : 0;
      return { label: d.label, avg: avg };
    }).filter(function (d) { return d.avg > 0; });
    var weakest = dims.reduce(function (m, d) { return (!m || d.avg < m.avg) ? d : m; }, null);
    var dl = el("div", "rubric");
    dims.forEach(function (d) {
      var isWeak = weakest && d.label === weakest.label;
      var row = el("div", "rubric-row");
      var top = el("div", "rubric-top");
      var nm = el("div", "rubric-name");
      nm.innerHTML = escapeHtml(d.label) + (isWeak ? ' <span class="weak-tag">약점</span>' : "");
      top.appendChild(nm);
      top.appendChild(el("div", "rubric-score", d.avg.toFixed(1) + " / 5"));
      row.appendChild(top);
      var bar = el("div", "bar");
      var fill = el("div", "bar-fill");
      fill.style.width = (d.avg / 5 * 100) + "%";
      fill.setAttribute("data-lvl", String(Math.round(d.avg)));
      bar.appendChild(fill);
      row.appendChild(bar);
      // 약점 항목 아래 한 줄 고정 조언 (AI 호출 없음)
      if (isWeak && WEAK_ADVICE[d.label]) row.appendChild(el("div", "weak-advice", "💡 " + WEAK_ADVICE[d.label]));
      dl.appendChild(row);
    });
    host.appendChild(statCardWrap(dl));

    // --- 유형별 (흰 카드) ---
    host.appendChild(el("div", "report-section-title", "유형별 평균"));
    host.appendChild(statCardWrap(rankList(typeSum, typeCnt, function (k) { return TYPE_LABEL[k] || k; })));

    // --- 주제별 약점 (흰 카드) ---
    var topicKeys = Object.keys(topSum);
    if (topicKeys.length) {
      host.appendChild(el("div", "report-section-title", "주제별 평균 (약한 주제부터)"));
      host.appendChild(statCardWrap(rankList(topSum, topCnt, function (k) {
        var t = topicById(k); return t ? (t.emoji + " " + t.label) : k;
      }, true)));
    }

    // --- 내보내기 (흰 카드 + 라인 아이콘) ---
    host.appendChild(el("div", "report-section-title", "내보내기"));
    var expCard = el("div", "stat-card");
    var exp = el("div", "report-actions");
    var js = el("button", "ghost-btn");
    js.type = "button"; js.innerHTML = ICON_DL + '<span>JSON</span>';
    js.addEventListener("click", exportJSON);
    var cs = el("button", "ghost-btn");
    cs.type = "button"; cs.innerHTML = ICON_DL + '<span>CSV</span>';
    cs.addEventListener("click", exportCSV);
    exp.appendChild(js); exp.appendChild(cs);
    expCard.appendChild(exp);
    expCard.appendChild(el("p", "eval-note", "※ 전사·평가가 포함됩니다(녹음 오디오는 제외). 개인 기록이니 공유 시 주의하세요."));
    host.appendChild(expCard);
    window.scrollTo(0, 0);
  }

  function statBox(value, label) {
    var b = el("div", "stat-box");
    b.appendChild(el("div", "stat-value", String(value)));
    b.appendChild(el("div", "stat-label", label));
    return b;
  }

  // 평균 랭킹 리스트 (낮은 순 옵션)
  function rankList(sum, cnt, labelFn, ascending) {
    var rows = Object.keys(sum).map(function (k) {
      return { key: k, avg: sum[k] / cnt[k], n: cnt[k] };
    });
    rows.sort(function (a, b) { return ascending ? a.avg - b.avg : b.avg - a.avg; });
    var wrap = el("div", "rank-list");
    rows.forEach(function (r) {
      var row = el("div", "rank-row");
      row.appendChild(el("span", "rank-label", labelFn(r.key)));
      row.appendChild(el("span", "rank-val", r.avg.toFixed(1) + "/5 · " + r.n + "회"));
      wrap.appendChild(row);
    });
    return wrap;
  }

  // 인라인 SVG 라인 차트
  function buildLineChart(values) {
    if (!values.length) return el("p", "muted small", "데이터가 없습니다.");
    var W = 320, H = 150, pad = 26, min = 1, max = 5, n = values.length;
    var xstep = n > 1 ? (W - 2 * pad) / (n - 1) : 0;
    function x(i) { return +(pad + i * xstep).toFixed(1); }
    function y(v) { return +(H - pad - (Math.max(min, Math.min(max, v)) - min) / (max - min) * (H - 2 * pad)).toFixed(1); }

    var grid = "", labels = "";
    [1, 2, 3, 4, 5].forEach(function (v) {
      grid += '<line x1="' + pad + '" y1="' + y(v) + '" x2="' + (W - pad) + '" y2="' + y(v) + '" class="chart-grid"/>';
      labels += '<text x="' + (pad - 6) + '" y="' + (y(v) + 3) + '" class="chart-axis" text-anchor="end">' + v + "</text>";
    });
    var pts = values.map(function (v, i) { return x(i) + "," + y(v); }).join(" ");
    var poly = n > 1 ? '<polyline points="' + pts + '" class="chart-line"/>' : "";
    var dots = values.map(function (v, i) { return '<circle cx="' + x(i) + '" cy="' + y(v) + '" r="3.5" class="chart-dot"/>'; }).join("");

    var wrap = el("div", "chart-wrap");
    wrap.innerHTML = '<svg viewBox="0 0 ' + W + ' ' + H + '" class="chart" preserveAspectRatio="xMidYMid meet">' +
      grid + labels + poly + dots + "</svg>";
    return wrap;
  }

  // ---------- 내보내기 ----------
  function download(filename, text, mime) {
    var blob = new Blob([text], { type: mime || "text/plain;charset=utf-8" });
    var url = URL.createObjectURL(blob);
    var a = document.createElement("a");
    a.href = url; a.download = filename;
    document.body.appendChild(a); a.click();
    document.body.removeChild(a);
    setTimeout(function () { URL.revokeObjectURL(url); }, 1000);
  }
  function stamp() {
    var d = new Date();
    function p(n) { return (n < 10 ? "0" : "") + n; }
    return d.getFullYear() + p(d.getMonth() + 1) + p(d.getDate()) + "_" + p(d.getHours()) + p(d.getMinutes());
  }
  function exportJSON() {
    var hist = Storage.getHistory();
    if (!hist.length) { toast("내보낼 기록이 없습니다"); return; }
    download("opic_history_" + stamp() + ".json", JSON.stringify(hist, null, 2), "application/json");
    toast("JSON 내보내기 완료");
  }
  function exportCSV() {
    var hist = Storage.getHistory();
    if (!hist.length) { toast("내보낼 기록이 없습니다"); return; }
    var rows = [["date", "type", "mockMode", "level", "title", "grade", "avg", "q_no", "q_label", "q_type", "question", "transcript"]];
    hist.forEach(function (r) {
      (r.items || []).forEach(function (it, i) {
        rows.push([
          fmtDate(r.ts), r.type, r.mockMode || "", r.level, r.title, r.grade, r.avg,
          (i + 1), it.label, it.type, it.question, it.transcript || "",
        ]);
      });
    });
    var csv = rows.map(function (row) {
      return row.map(function (c) {
        var s = String(c == null ? "" : c);
        return /[",\n]/.test(s) ? '"' + s.replace(/"/g, '""') + '"' : s;
      }).join(",");
    }).join("\r\n");
    download("opic_history_" + stamp() + ".csv", "﻿" + csv, "text/csv;charset=utf-8");
    toast("CSV 내보내기 완료");
  }

  // ---------- 스크립트 만들기 ----------
  var scriptState = { mode: "each", scriptAbort: null };
  var SCRIPT_MAX = 5;
  // 요청에 '3단 콤보'(3단콤보 / 삼단 콤보 등)가 있으면 묘사→경험→비교 3개 생성
  var COMBO_RE = /(3|３|삼)\s*단\s*콤보/;

  function applyScriptMode() {
    $("scriptModeSeg").querySelectorAll(".seg-btn").forEach(function (b) {
      b.setAttribute("aria-pressed", b.dataset.mode === scriptState.mode ? "true" : "false");
    });
    $("scriptModeDesc").textContent = scriptState.mode === "each"
      ? "주제마다 별도 스크립트를 만듭니다. 한 줄에 하나씩(또는 번호 목록), 최대 " + SCRIPT_MAX + "개."
      : "여러 내용을 한 시나리오로 묶어 1개 스크립트를 만듭니다.";
  }

  function openScriptLab() {
    if (!Storage.hasApiKey()) { show("settings"); return; }
    $("scriptLevelTag").textContent = Storage.getLevel();
    applyScriptMode();
    $("genScript").disabled = !$("scriptRequest").value.trim();
    $("scriptResult").innerHTML = "";
    show("script");
  }

  function shorten(s, n) { s = String(s); return s.length > n ? s.slice(0, n) + "…" : s; }

  // 요청 텍스트 → 주제 배열 (줄 단위, 번호/불릿 제거; 한 줄이면 콤마 분리)
  function parseTopics(text) {
    var lines = text.split(/\n+/).map(function (l) { return l.trim(); }).filter(Boolean);
    var items = lines.length > 1 ? lines : text.split(/[,，]/);
    return items
      .map(function (s) { return s.replace(/^\s*(\d+[.)]|[-•·*])\s*/, "").trim(); })
      .filter(Boolean);
  }

  async function generateScript() {
    var request = $("scriptRequest").value.trim();
    if (!request) { toast("요청사항을 입력하세요"); return; }
    if (!requireApiKey(generateScript)) return; // 키 없으면 안내 모달 → 저장 후 이어서 생성
    var level = Storage.getLevel();
    var area = $("scriptResult");
    $("genScript").disabled = true;
    if (scriptState.scriptAbort) scriptState.scriptAbort.abort();
    scriptState.scriptAbort = new AbortController();
    var signal = scriptState.scriptAbort.signal;

    try {
      if (COMBO_RE.test(request)) {
        // 3단 콤보: 한 주제 → 묘사·경험·비교 3개 카드
        var topic = request.replace(COMBO_RE, "").trim() || request;
        area.innerHTML = loaderHTML(level + " 3단 콤보 스크립트 생성 중… (묘사·경험·비교)");
        var combo = await QuestionGen.generateComboScript({
          request: topic, level: level, signal: signal,
          onRetry: function (s) { area.innerHTML = loaderHTML("무료 한도 대기 중… " + s + "초 후 자동 재시도"); },
        });
        area.innerHTML = "";
        var cstatus = el("div", "muted small script-status");
        area.appendChild(cstatus);
        var stageLabels = ["묘사", "경험", "비교"];
        combo.forEach(function (sc, i) {
          var stage = sc.stage || stageLabels[i] || ("파트 " + (i + 1));
          sc.topicId = null;
          sc.topicLabel = "✍️ " + shorten(topic, 18) + " · " + stage;
          var wrap = el("div", "script-card-wrap");
          wrap.appendChild(el("div", "script-idx", "3단 콤보 " + (i + 1) + "/" + combo.length + " · " + stage));
          var cbody = el("div");
          wrap.appendChild(cbody);
          area.appendChild(wrap);
          renderScriptView(cbody, sc, { saved: false });
        });
        cstatus.textContent = "완료 · 3단 콤보 " + combo.length + "개 (묘사·경험·비교)";
      } else if (scriptState.mode === "merge") {
        area.innerHTML = loaderHTML(level + " 스크립트 생성 중…");
        var sc = await QuestionGen.generateScript({
          request: request, level: level, signal: signal,
          onRetry: function (s) { area.innerHTML = loaderHTML("무료 한도 대기 중… " + s + "초 후 자동 재시도"); },
        });
        sc.topicId = null;
        sc.topicLabel = "✍️ " + shorten(request, 22);
        area.innerHTML = "";
        var c = el("div");
        area.appendChild(c);
        renderScriptView(c, sc, { saved: false });
      } else {
        // 주제별 각각: 주제마다 별도 호출 → 카드 N개
        var topics = parseTopics(request);
        if (!topics.length) { toast("주제를 한 줄에 하나씩(또는 번호 목록)으로 적어주세요"); return; }
        var capped = topics.slice(0, SCRIPT_MAX);
        var truncated = topics.length > SCRIPT_MAX;

        area.innerHTML = "";
        var status = el("div", "muted small script-status");
        area.appendChild(status);
        var n = capped.length;

        for (var i = 0; i < n; i++) {
          status.textContent = "스크립트 생성 중… (" + (i + 1) + "/" + n + ")";
          var holder = el("div", "script-card-wrap");
          holder.appendChild(el("div", "script-idx", "스크립트 " + (i + 1) + "/" + n + " · " + shorten(capped[i], 20)));
          var body = el("div");
          body.innerHTML = loaderHTML(capped[i]);
          holder.appendChild(body);
          area.appendChild(holder);

          try {
            var s2 = await QuestionGen.generateScript({
              request: capped[i], level: level, signal: signal,
              onRetry: (function (b) {
                return function (sec) { b.innerHTML = loaderHTML("무료 한도 대기 중… " + sec + "초 후 자동 재시도"); };
              })(body),
            });
            s2.topicId = null;
            s2.topicLabel = "✍️ " + shorten(capped[i], 22);
            renderScriptView(body, s2, { saved: false });
          } catch (e2) {
            if (e2 && e2.code === "ABORTED") return;
            body.innerHTML = "";
            body.appendChild(el("div", "error-box", "✕ " + ((e2 && e2.message) || "생성 실패")));
          }
        }
        status.textContent = "완료 · " + n + "개 스크립트" +
          (truncated ? " (입력 " + topics.length + "개 중 최대 " + SCRIPT_MAX + "개만 생성)" : "");
      }
    } catch (e) {
      if (e && e.code === "ABORTED") return;
      area.innerHTML = "";
      area.appendChild(el("div", "error-box", "✕ " + ((e && e.message) || "생성 실패")));
    } finally {
      $("genScript").disabled = false;
    }
  }

  // Lucide 스타일 라인 아이콘 (저장 상세 통일용)
  var ICON = {
    tag: '<svg class="sec-ic" viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z"/><line x1="7" y1="7" x2="7.01" y2="7"/></svg>',
    bulb: '<svg class="sec-ic" viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M9 18h6"/><path d="M10 22h4"/><path d="M15.09 14c.18-.98.65-1.74 1.41-2.5A4.65 4.65 0 0 0 18 8 6 6 0 0 0 6 8c0 1 .23 2.23 1.5 3.5A4.6 4.6 0 0 1 8.91 14"/></svg>',
    translate: '<svg class="ma-sub-ic" viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M2 5h12"/><path d="M7 2h1"/><path d="m4 14 6-6 2-3"/><path d="m5 8 6 6"/><path d="m22 22-5-10-5 10"/><path d="M14 18h6"/></svg>',
    speaker: '<svg class="ma-sub-ic" viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/><path d="M15.54 8.46a5 5 0 0 1 0 7.07"/><path d="M19.07 4.93a10 10 0 0 1 0 14.14"/></svg>',
    speakerSm: '<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/><path d="M15.54 8.46a5 5 0 0 1 0 7.07"/><path d="M19.07 4.93a10 10 0 0 1 0 14.14"/></svg>',
  };

  // 모범답안 줄 렌더 (phrase 있으면 첫 일치를 <mark>로 하이라이트, 매칭된 mark 반환)
  function renderAnswerLines(container, text, phrase) {
    container.innerHTML = "";
    var lines = splitSentences(text);
    if (!lines.length) lines = [String(text || "")];
    var lower = phrase ? String(phrase).toLowerCase() : null;
    var markEl = null;
    lines.forEach(function (line) {
      var p = el("p", "ss-line");
      if (lower && !markEl) {
        var idx = line.toLowerCase().indexOf(lower);
        if (idx !== -1) {
          p.appendChild(document.createTextNode(line.slice(0, idx)));
          var mk = document.createElement("mark");
          mk.className = "expr-hl";
          mk.textContent = line.slice(idx, idx + phrase.length);
          p.appendChild(mk);
          p.appendChild(document.createTextNode(line.slice(idx + phrase.length)));
          markEl = mk;
          container.appendChild(p);
          return;
        }
      }
      p.textContent = line;
      container.appendChild(p);
    });
    return markEl;
  }

  // 단계 라벨 4색 매핑 (상황 파랑 / 행동 인디고 / 감정 바이올렛 / 마무리 퍼플), 그 외는 순서대로 순환
  var STEP_COLOR = { "상황": 0, "행동": 1, "감정": 2, "마무리": 3 };
  // 보기 모드별 모범답안 렌더
  //  - keyword: 키워드 칩
  //  - body: 단계 그룹 단위로 묶어 렌더(같은 문장에 라벨만 매핑). showSteps면 라벨+색 레일+2열, 아니면 구분선만 단일 컬럼
  function renderAnswerMode(container, sc, mode, showSteps) {
    container.innerHTML = "";
    container.dataset.hl = "";
    if (mode === "keyword" && sc.keywords && sc.keywords.length) {
      var wrap = el("div", "kw-chips");
      sc.keywords.forEach(function (k, i) {
        if (i > 0) wrap.appendChild(el("span", "kw-arrow", "→"));
        wrap.appendChild(el("span", "kw-chip", k));
      });
      container.appendChild(wrap);
      container.appendChild(el("div", "kw-note", "키워드만 보고 문장을 직접 만들어 말해보세요. 막히면 ‘본문’으로 돌아가 확인하세요."));
      return;
    }
    // 본문: 단계 구조가 있으면 단계 범위(range)로 묶어서 렌더 — 단계용 텍스트를 따로 두지 않음
    if (sc.structure && sc.structure.length) {
      var sents = splitSentences(sc.answer);
      var list = el("div", "step-list" + (showSteps ? " show-steps" : ""));
      sc.structure.forEach(function (st, i) {
        var ci = (STEP_COLOR[st.label] != null) ? STEP_COLOR[st.label] : (i % 4);
        var r = st.range || [];
        var from = (r[0] || 1), to = (r[1] || from);
        var text = sents.slice(from - 1, to).join(" ");
        var row = el("div", "step-row step-c" + ci);
        if (showSteps) row.appendChild(el("span", "step-label step-c" + ci, st.label));
        row.appendChild(el("div", "step-text", text));
        list.appendChild(row);
      });
      container.appendChild(list);
      return;
    }
    renderAnswerLines(container, sc.answer, null);
  }

  // 스크립트 녹음 연습 (마이크 녹음 + 다시 듣기, 저장 안 함)
  var SD_MIC_ICON = '<svg viewBox="0 0 24 24" width="17" height="17" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"/><path d="M19 10v2a7 7 0 0 1-14 0v-2"/><line x1="12" y1="19" x2="12" y2="23"/><line x1="8" y1="23" x2="16" y2="23"/></svg>';
  var scriptRec = { session: null, url: null };
  function stopScriptRec() {
    if (scriptRec.session) { try { scriptRec.session.stop(); } catch (e) {} scriptRec.session = null; }
    if (scriptRec.url) { try { URL.revokeObjectURL(scriptRec.url); } catch (e) {} scriptRec.url = null; }
  }
  function scriptStartRec(recBtn, statusEl, labelEl) {
    stopScriptRec();
    if (window.speechSynthesis) window.speechSynthesis.cancel();
    recBtn.style.display = "none";
    if (labelEl) labelEl.style.display = "none";
    statusEl.innerHTML = "";
    var bar = el("div", "rec-bar");
    var dot = el("span", "rec-dot");
    var stopBtn = el("button", "rec-stop", "■ 멈추기");
    stopBtn.type = "button";
    bar.appendChild(dot); bar.appendChild(stopBtn);
    statusEl.appendChild(bar);
    statusEl.appendChild(el("div", "rec-live muted small", "녹음 중… 스크립트를 보고 말해보세요."));

    scriptRec.session = Speech.createSession({ onError: function () {} });
    scriptRec.session.start().then(function () {
      stopBtn.addEventListener("click", async function () {
        if (!scriptRec.session) return;
        var s = scriptRec.session; scriptRec.session = null;
        statusEl.innerHTML = '<div class="muted small">마무리 중…</div>';
        var result = await s.stop();
        statusEl.innerHTML = "";
        if (result && result.url) {
          scriptRec.url = result.url;
          var audio = document.createElement("audio");
          audio.controls = true; audio.src = result.url; audio.className = "script-rec-audio";
          statusEl.appendChild(audio);
        } else {
          statusEl.appendChild(el("div", "muted small", "녹음을 재생할 수 없어요."));
        }
        recBtn.style.display = "";
        recBtn.innerHTML = SD_MIC_ICON; // 원형 버튼은 아이콘만 유지
        if (labelEl) { labelEl.style.display = ""; labelEl.textContent = "탭해서 다시 녹음"; }
      });
    }).catch(function () {
      scriptRec.session = null;
      statusEl.innerHTML = "";
      statusEl.appendChild(el("div", "error-box", "마이크를 사용할 수 없습니다. 마이크 권한을 확인하세요."));
      recBtn.style.display = "";
      if (labelEl) labelEl.style.display = "";
    });
  }

  // 스크립트 1개 렌더 (생성 결과 / 저장본 공용)
  function renderScriptView(host, sc, opts) {
    opts = opts || {};
    stopScriptRec();
    host.innerHTML = "";
    var box = el("div", "model-answer script-result script-detail");

    // 헤더 (레벨 배지 → 주제 + 배속·듣기)
    var head = el("div", "ma-head");
    if (sc.level) head.appendChild(el("span", "sd-level", sc.level));
    var maTag = el("span", "ma-tag");
    maTag.appendChild(document.createTextNode(String(sc.topicLabel || "").replace(/^✍️?\s*/, "")));
    head.appendChild(maTag);
    // 듣기: 텍스트 없는 스피커 아이콘 버튼(파스텔 톤)
    var tts = el("button", "icon-btn-sm icon-accent");
    tts.type = "button";
    tts.title = "질문 듣기";
    tts.setAttribute("aria-label", "질문 듣기");
    tts.innerHTML = '<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/><path d="M15.5 8.5a5 5 0 0 1 0 7"/><path d="M19 5a9 9 0 0 1 0 14"/></svg>';
    tts.addEventListener("click", function () {
      var spoken = sc.answer || (sc.cards && sc.cards.map(function (c) { return c.en; }).join(" ")) || "";
      playWithState(tts, spoken);
    });
    var scListen = el("span", "tts-group"); // 배속(왼쪽) + 듣기(오른쪽), 제목 줄 오른쪽 끝
    scListen.appendChild(makeSpeedDots()); scListen.appendChild(tts);
    head.appendChild(scListen);
    box.appendChild(head);

    // 질문 섹션 (버튼 없이 전체 폭)
    if (sc.question) {
      var qSec = el("div", "ss-sec");
      qSec.appendChild(el("div", "ss-eyebrow", "질문"));
      var qRow = el("div", "script-q");
      qRow.appendChild(el("span", "script-q-text", sc.question));
      qSec.appendChild(qRow);
      box.appendChild(qSec);
    }

    var ans = null;
    if (sc.cards && sc.cards.length) {
      // 질문 카드 섹션 (롤플레이: 단일 모범답안 대신 카드 묶음)
      var cSec = el("div", "ss-sec");
      cSec.appendChild(el("div", "ss-eyebrow", "질문 카드"));
      sc.cards.forEach(function (card) {
        var qc = el("div", "qcard");
        var qh = el("div", "qcard-head");
        if (card.label) qh.appendChild(el("span", "qcard-label", card.label));
        var qspk = el("button", "expr-spk");
        qspk.type = "button";
        qspk.title = "카드 듣기";
        qspk.setAttribute("aria-label", "카드 듣기");
        qspk.innerHTML = ICON.speakerSm;
        qspk.addEventListener("click", function (ev) { ev.stopPropagation(); speak(card.en); });
        qh.appendChild(qspk);
        qc.appendChild(qh);
        qc.appendChild(el("div", "qcard-en", card.en));
        if (card.ko) qc.appendChild(el("div", "qcard-ko", card.ko));
        if (card.pron) qc.appendChild(el("div", "qcard-pron", card.pron));
        cSec.appendChild(qc);
      });
      box.appendChild(cSec);
    } else {
      // 모범답안 섹션 (문장 단위 줄바꿈)
      var aSec = el("div", "ss-sec");
      aSec.appendChild(el("div", "ss-eyebrow", "모범답안"));
      ans = el("div", "ma-text ss-answer");

      // 보기 모드: [본문] [키워드만] 탭 + 본문 우상단 '단계 표시' on/off 스위치
      var hasStruct = sc.structure && sc.structure.length;
      var hasKw = sc.keywords && sc.keywords.length;
      var stepOn = false;     // 단계 표시 기본 off
      var curMode = "body";
      var stepSwitch = null;
      if (hasStruct || hasKw) {
        var aHead = el("div", "ma-view-head");
        // 탭 (키워드가 있을 때만 — 본문/키워드만 선택)
        if (hasKw) {
          var modes = [["body", "본문"], ["keyword", "키워드만"]];
          var seg = el("div", "view-mode-seg");
          var ind = el("span", "vm-indicator");
          seg.appendChild(ind);
          var n = modes.length;
          var moveInd = function (idx) {
            ind.style.width = (100 / n) + "%";
            ind.style.transform = "translateX(" + (idx * 100) + "%)";
          };
          var segBtns = [];
          modes.forEach(function (m, i) {
            var b = el("button", "view-mode-btn" + (i === 0 ? " on" : ""), m[1]);
            b.type = "button";
            b.addEventListener("click", function () {
              curMode = m[0];
              segBtns.forEach(function (x, j) { x.classList.toggle("on", j === i); });
              moveInd(i);
              // 단계 표시 스위치는 본문 탭에서만 노출
              if (stepSwitch) stepSwitch.style.display = (curMode === "body") ? "" : "none";
              renderAnswerMode(ans, sc, curMode, stepOn);
            });
            segBtns.push(b);
            seg.appendChild(b);
          });
          aHead.appendChild(seg);
          moveInd(0);
        }
        // 단계 표시 스위치 (단계 구조가 있을 때만)
        if (hasStruct) {
          stepSwitch = el("label", "step-switch");
          stepSwitch.appendChild(el("span", "step-switch-text", "단계 표시"));
          var chk = el("input", "step-switch-input");
          chk.type = "checkbox";
          stepSwitch.appendChild(chk);
          stepSwitch.appendChild(el("span", "step-switch-track"));
          chk.addEventListener("change", function () {
            stepOn = chk.checked;
            if (curMode === "body") renderAnswerMode(ans, sc, "body", stepOn);
          });
          aHead.appendChild(stepSwitch);
        }
        aSec.appendChild(aHead);
      }

      renderAnswerMode(ans, sc, "body", stepOn);
      aSec.appendChild(ans);

      // 해석 / 한글 발음 토글 (세그먼트 + 아이콘)
      var actions = el("div", "ma-actions");
      var transBtn = el("button", "ma-sub");
      transBtn.type = "button";
      transBtn.innerHTML = ICON.translate + '<span>해석</span>';
      var pronBtn = el("button", "ma-sub");
      pronBtn.type = "button";
      pronBtn.innerHTML = ICON.speaker + '<span>한글 발음</span>';
      var extraArea = el("div", "ma-extra");
      transBtn.addEventListener("click", function () { scriptExtraToggle("ko", sc, extraArea, transBtn, pronBtn); });
      pronBtn.addEventListener("click", function () { scriptExtraToggle("pron", sc, extraArea, pronBtn, transBtn); });
      actions.appendChild(transBtn); actions.appendChild(pronBtn);
      aSec.appendChild(actions);
      aSec.appendChild(extraArea);
      box.appendChild(aSec);
    }

    // 주제 표현 섹션
    if (sc.expressions && sc.expressions.length) {
      var ex = el("div", "ma-tips ss-tips");
      var exH = el("h4", null, "주제 표현");
      ex.appendChild(exH);
      sc.expressions.forEach(function (e) {
        // 영어(파랑) 위 / 한글 뜻(회색) 아래 — 2줄 구조
        var row = el("div", "expr-row expr-row-i");
        var txt = el("div", "expr-text");
        txt.appendChild(el("span", "expr-en", e.en));
        if (e.ko) txt.appendChild(el("span", "expr-ko", e.ko));
        row.appendChild(txt);
        // 표현 텍스트 클릭 → 모범답안에서 해당 표현 하이라이트(토글)
        txt.addEventListener("click", function () {
          var cur = ans.dataset.hl || "";
          if (cur === e.en) { ans.dataset.hl = ""; renderAnswerLines(ans, sc.answer, null); return; }
          var mk = renderAnswerLines(ans, sc.answer, e.en);
          if (mk) {
            ans.dataset.hl = e.en;
            mk.scrollIntoView({ behavior: "smooth", block: "center" });
          } else {
            renderAnswerLines(ans, sc.answer, cur || null); // 답안에 없으면 이전 상태로 복원(무시)
          }
        });
        // 표현 개별 듣기 (기존 TTS 재사용)
        var spk = el("button", "expr-spk");
        spk.type = "button";
        spk.title = "표현 듣기";
        spk.setAttribute("aria-label", "표현 듣기");
        spk.innerHTML = ICON.speakerSm;
        spk.addEventListener("click", function (ev) { ev.stopPropagation(); speak(e.en); });
        row.appendChild(spk);
        ex.appendChild(row);
      });
      box.appendChild(ex);
    }

    // 다르게 말하기 섹션 (패러프레이즈)
    if (sc.paraphrases && sc.paraphrases.length) {
      var pp = el("div", "ma-tips ss-tips");
      var ppH = el("h4", null, "다르게 말하기");
      pp.appendChild(ppH);
      sc.paraphrases.forEach(function (para) {
        var row = el("div", "para-row");
        row.appendChild(el("div", "para-ko", para.ko));
        var opts = el("div", "para-opts");
        (para.options || []).forEach(function (o, i) {
          if (i > 0) opts.appendChild(el("span", "para-sep", "/"));
          var chip = el("span", "para-opt", o);
          chip.title = "듣기";
          chip.addEventListener("click", function () { speak(o); });
          opts.appendChild(chip);
        });
        row.appendChild(opts);
        pp.appendChild(row);
      });
      box.appendChild(pp);
    }

    // 팁 섹션 (짧은 불릿 2~4개)
    if (sc.tips && sc.tips.length) {
      var bullets = tipsToBullets(sc.tips);
      if (bullets.length) {
        var tw = el("div", "ma-tips ss-tips");
        var twH = el("h4", null, "팁");
        tw.appendChild(twH);
        var ul = document.createElement("ul");
        bullets.forEach(function (t) { ul.appendChild(el("li", null, t)); });
        tw.appendChild(ul);
        box.appendChild(tw);
      }
    }

    // 녹음하며 연습 (마이크 녹음 + 다시 듣기, 저장 안 함)
    var recSec = el("div", "ss-sec script-rec-sec");
    recSec.appendChild(el("div", "ss-eyebrow", "녹음 연습"));
    if (!Speech.recordSupported()) {
      recSec.appendChild(el("p", "muted small", "이 브라우저는 녹음을 지원하지 않아요. Chrome/Edge를 권장해요."));
    } else {
      var recBox = el("div", "script-rec rec-panel");
      var recBtn = el("button", "rec-circle", "");
      recBtn.innerHTML = SD_MIC_ICON;
      recBtn.type = "button";
      recBtn.title = "녹음 시작";
      recBtn.setAttribute("aria-label", "녹음 시작");
      var recLabel = el("div", "rec-cta", "탭해서 녹음 시작");
      var recStatus = el("div", "script-rec-status");
      recBtn.addEventListener("click", function () { scriptStartRec(recBtn, recStatus, recLabel); });
      recBox.appendChild(recBtn);
      recBox.appendChild(recLabel);
      recBox.appendChild(recStatus);
      recBox.appendChild(el("p", "rec-panel-note", "※ 녹음은 이 화면에서만 들을 수 있어요. 저장되지 않습니다."));
      recSec.appendChild(recBox);
    }
    box.appendChild(recSec);

    host.appendChild(box);

    // 저장(만들기 화면만). 저장 상세의 삭제는 헤더 우측 휴지통 아이콘으로 이동.
    if (!opts.saved) {
      var act = el("div", "report-actions");
      var save = el("button", "primary-btn", "⭐ 저장");
      save.addEventListener("click", function () { saveScript(sc, save); });
      act.appendChild(save);
      host.appendChild(act);
    }
  }

  // 문장 단위 분리 (영어 .?! 기준) — 모범답안 가독성용
  // 문장 단위 분리 — 종결부호 뒤가 공백/끝일 때만 끊고, 닫는 따옴표는 함께 포함
  function splitSentences(text) {
    var s = String(text || "").trim();
    if (!s) return [];
    var closers = String.fromCharCode(34,39,8217,8221,187,41,93);
    var ws = String.fromCharCode(32,9,10,13,12,160);
    var out = [], buf = "";
    for (var i = 0; i < s.length; i++) {
      var ch = s[i];
      buf += ch;
      if (ch === "." || ch === "!" || ch === "?") {
        while (i + 1 < s.length && (s[i + 1] === "." || s[i + 1] === "!" || s[i + 1] === "?")) buf += s[++i];
        if (i + 1 < s.length && closers.indexOf(s[i + 1]) !== -1) buf += s[++i];
        if (i + 1 >= s.length || ws.indexOf(s[i + 1]) !== -1) { out.push(buf.trim()); buf = ""; }
      }
    }
    if (buf.trim()) out.push(buf.trim());
    return out.length ? out : [s];
  }

  // 팁: 배열/긴 문단 → 짧은 불릿 2~4개 (끝의 영어 번역 괄호 제거 + 문장 분리)
  // 팁: 배열/긴 문단 → 짧은 불릿 2~4개 (끝의 영어 번역 괄호 제거 + 문장 분리)
  function tipsToBullets(tips) {
    var out = [];
    (tips || []).forEach(function (t) {
      var clean = String(t).replace(/s*(([^)]*))s*$/, function (m, inner) {
        return /[가-힣]/.test(inner) ? m : "";
      }).trim();
      if (!clean) return;
      var sents = clean.match(/[^.?!]+[.?!]*/g) || [clean];
      sents.forEach(function (p) { p = p.trim(); if (p) out.push(p); });
    });
    return out.slice(0, 4);
  }

  function saveScript(sc, btn) {
    var rec = {
      id: "s_" + Date.now() + "_" + Math.floor(Math.random() * 1000),
      ts: Date.now(),
      topicId: sc.topicId, topicLabel: sc.topicLabel, level: sc.level,
      question: sc.question, answer: sc.answer,
      expressions: sc.expressions || [], tips: sc.tips || [],
      levelNote: sc.levelNote || "",
      extras: sc.extras || null,
    };
    var list = Storage.getScripts();
    list.unshift(rec);
    Storage.setScripts(list);
    if (btn) { btn.textContent = "✓ 저장됨"; btn.disabled = true; }
    toast("스크립트를 저장했어요");
  }

  // 공통 상세 헤더: [원형 ‹ 뒤로 버튼] + 제목 (+ 선택적 우측 액션) — 다른 상세 화면에서도 재사용 가능
  function detailHeader(title, onBack, rightEl) {
    var hd = el("div", "detail-header");
    var btn = el("button", "icon-back");
    btn.type = "button";
    btn.setAttribute("aria-label", "뒤로");
    btn.innerHTML = '<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><polyline points="15 18 9 12 15 6"/></svg>';
    btn.addEventListener("click", onBack);
    hd.appendChild(btn);
    hd.appendChild(el("h2", "detail-title", title));
    if (rightEl) hd.appendChild(rightEl);
    return hd;
  }

  function openScripts() {
    renderScriptsList();
    show("scripts");
  }
  // 주제 → 이모지 매핑 (없으면 ✍️)
  var SCRIPT_EMOJI = [
    [/여행|trip|travel|공항|항공|비행/, "✈️"],
    [/공원|park/, "🌳"],
    [/카페|커피|coffee|cafe/, "☕"],
    [/영화|movie|cinema|극장/, "🎬"],
    [/음악|노래|music|콘서트|concert/, "🎵"],
    [/운동|헬스|gym|조깅|러닝|달리기|exercise|run/, "🏃"],
    [/음식|요리|맛집|식당|레스토랑|food|cook|restaurant|외식/, "🍽️"],
    [/집|home|house|방 |인테리어/, "🏠"],
    [/책|독서|도서관|book|read|library/, "📚"],
    [/게임|game/, "🎮"],
    [/쇼핑|shop/, "🛍️"],
    [/날씨|계절|weather|season/, "🌤️"],
    [/은행|bank/, "🏦"],
    [/병원|약국|hospital|pharmacy|clinic/, "🏥"],
    [/호텔|hotel/, "🏨"],
  ];
  function scriptEmoji(sc) {
    var s = String((sc.topicLabel || "") + " " + (sc.question || ""));
    for (var i = 0; i < SCRIPT_EMOJI.length; i++) {
      if (SCRIPT_EMOJI[i][0].test(s)) return SCRIPT_EMOJI[i][1];
    }
    return "✍️";
  }
  function shortDate(ts) {
    var d = new Date(ts);
    return (d.getMonth() + 1) + "." + String(d.getDate()).padStart(2, "0");
  }
  function scriptRowTitle(sc) {
    return String(sc.topicLabel || "스크립트").replace(/^✍️?\s*/, "") || "스크립트";
  }

  function buildScriptRow(sc) {
    var row = el("div", "script-row");
    row.setAttribute("role", "button");
    row.setAttribute("tabindex", "0");
    row.addEventListener("click", function () { openScriptView(sc.id); });

    row.appendChild(el("div", "script-row-tile", scriptEmoji(sc)));

    var main = el("div", "script-row-main");
    var top = el("div", "script-row-top");
    top.appendChild(el("span", "script-row-title", scriptRowTitle(sc)));
    var lv = el("span", "lvl-badge", sc.level || "");
    lv.setAttribute("data-lv", sc.level || "");
    top.appendChild(lv);
    if (sc.sample) top.appendChild(el("span", "sample-badge", "샘플"));
    if (sc.type === "roleplay") top.appendChild(el("span", "sample-badge rp-badge", "롤플레이"));
    main.appendChild(top);
    row.appendChild(main);

    var meta = el("div", "script-row-meta");
    if (sc.sample) {
      // 샘플: 날짜·삭제 없음 (삭제 불가)
      meta.appendChild(el("span", "script-row-date", "기본 제공"));
    } else {
      meta.appendChild(el("span", "script-row-date", shortDate(sc.ts)));
      var del = el("button", "script-del");
      del.type = "button";
      del.title = "삭제";
      del.setAttribute("aria-label", "삭제");
      del.innerHTML = '<svg viewBox="0 0 24 24" width="17" height="17" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/><path d="M10 11v6M14 11v6"/><path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/></svg>';
      del.addEventListener("click", function (e) {
        e.stopPropagation(); // 행 클릭(상세 이동)과 분리
        if (window.confirm("이 스크립트를 삭제할까요?")) deleteScript(sc.id);
      });
      meta.appendChild(del);
    }
    meta.appendChild(el("span", "script-row-chevron", "›"));
    row.appendChild(meta);
    return row;
  }

  function renderScriptsList() {
    var host = $("scriptsBody");
    // 정적 헤더(← 홈/제목) 숨기고 공통 [‹ + 제목] 헤더 사용
    $("scriptsBack").style.display = "none";
    $("scriptsTitle").style.display = "none";
    host.innerHTML = "";
    host.appendChild(detailHeader("저장한 스크립트", goHome));

    var list = Storage.getScripts();
    var samples = window.SAMPLE_SCRIPTS || [];
    if (!list.length && !samples.length) {
      var empty = el("div", "scripts-empty");
      empty.appendChild(el("p", "muted", "저장한 스크립트가 없어요."));
      var go = el("button", "primary-btn", "✍️ 스크립트 만들기");
      go.type = "button";
      go.addEventListener("click", openScriptLab);
      empty.appendChild(go);
      host.appendChild(empty);
      return;
    }
    host.appendChild(el("div", "scripts-count muted small", list.length + "개 저장됨"));
    list.forEach(function (sc) { host.appendChild(buildScriptRow(sc)); });
    // 기본 샘플 — 사용자 스크립트 아래, 삭제 불가 (다음 방문에도 항상 제공)
    if (samples.length) {
      var descSamples = samples.filter(function (s) { return s.type !== "roleplay"; });
      var rpSamples = samples.filter(function (s) { return s.type === "roleplay"; });
      if (descSamples.length) {
        host.appendChild(el("div", "scripts-sample-head muted small", "기본 샘플 · 묘사·서술형"));
        descSamples.forEach(function (sc) { host.appendChild(buildScriptRow(sc)); });
      }
      if (rpSamples.length) {
        host.appendChild(el("div", "scripts-sample-head muted small", "기본 샘플 · 롤플레이"));
        rpSamples.forEach(function (sc) { host.appendChild(buildScriptRow(sc)); });
      }
    }
  }
  function openScriptView(id) {
    var sc = null;
    var list = Storage.getScripts();
    for (var i = 0; i < list.length; i++) { if (list[i].id === id) { sc = list[i]; break; } }
    if (!sc) { // 사용자 스크립트에 없으면 기본 샘플에서 조회
      var samples = window.SAMPLE_SCRIPTS || [];
      for (var j = 0; j < samples.length; j++) { if (samples[j].id === id) { sc = samples[j]; break; } }
    }
    if (!sc) { toast("스크립트를 찾을 수 없습니다"); return; }
    var host = $("scriptsBody");
    host.innerHTML = "";
    $("scriptsBack").style.display = "none";
    $("scriptsTitle").style.display = "none";
    // 샘플은 삭제 불가 → 우측 휴지통 없음
    var trash = null;
    if (!sc.sample) {
      trash = el("button", "icon-btn-sm icon-danger");
      trash.type = "button";
      trash.setAttribute("aria-label", "삭제");
      trash.innerHTML = '<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/><path d="M10 11v6M14 11v6"/><path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/></svg>';
      trash.addEventListener("click", function () {
        if (window.confirm("이 스크립트를 삭제할까요?")) deleteScript(sc.id);
      });
    }
    host.appendChild(detailHeader("저장한 스크립트", openScripts, trash));
    var area = el("div");
    host.appendChild(area);
    renderScriptView(area, sc, { saved: true });
    window.scrollTo(0, 0);
  }
  function deleteScript(id) {
    Storage.setScripts(Storage.getScripts().filter(function (s) { return s.id !== id; }));
    toast("삭제했습니다");
    openScripts();
  }

  // ---------- 답변 첨삭 + 모범답안 묶음 호출(캐시) ----------
  // 전사가 같으면 재호출 안 함, 묶음 호출 실패 시 기존 개별 호출로 폴백.
  async function ensureReview(q, transcript, onRetry) {
    if (q.review && q.review.forTranscript === transcript) return q.review;
    var level = Storage.getLevel();
    var review;
    try {
      var r = await QuestionGen.reviewAnswer(q, transcript, { level: level, onRetry: onRetry });
      review = {
        corrections: r.corrections, improved: r.improved,
        modelAnswer: { answer: r.modelAnswer, tips: r.tips, level: level },
        forTranscript: transcript,
      };
    } catch (e) {
      // JSON 파싱 실패/오류 → 기존 개별 호출로 폴백
      var c = await QuestionGen.correctAnswer(q, transcript, { level: level, onRetry: onRetry });
      var ma = await QuestionGen.generateModelAnswer(q, level, { onRetry: onRetry });
      review = { corrections: c.corrections, improved: c.improved, modelAnswer: ma, forTranscript: transcript };
    }
    q.review = review;
    q.correction = { corrections: review.corrections, improved: review.improved }; // 카드 재렌더 호환
    q.modelAnswer = review.modelAnswer;
    return review;
  }

  async function runCorrection(q, area, btn) {
    var transcript = q.recording && q.recording.transcript;
    if (!transcript || !transcript.trim()) { toast("먼저 답변(전사)이 있어야 첨삭할 수 있어요"); return; }
    transcript = transcript.trim();
    btn.disabled = true;
    area.innerHTML = loaderHTML("AI가 첨삭하고 있어요…");
    try {
      var review = await ensureReview(q, transcript, function (s) { area.innerHTML = loaderHTML("무료 한도 대기 중… " + s + "초 후 자동 재시도"); });
      renderCorrection(area, { corrections: review.corrections, improved: review.improved });
      btn.textContent = "✏️ 첨삭 다시";
    } catch (e) {
      area.innerHTML = "";
      area.appendChild(el("div", "error-box", "✕ " + ((e && e.message) || "첨삭 실패")));
    } finally {
      btn.disabled = false;
    }
  }
  function renderCorrection(area, r) {
    area.innerHTML = "";
    // 흰 배경 + 섹션 라벨(교정 / 개선 답변) 구조
    var box = el("div", "correction correction-v2");

    var cSec = el("div", "ss-sec");
    cSec.appendChild(el("div", "ss-eyebrow", "교정"));
    if (r.corrections && r.corrections.length) {
      r.corrections.forEach(function (c) {
        var row = el("div", "corr-row");
        var line = el("div", "corr-line");
        if (c.original) line.appendChild(el("span", "corr-old", c.original));
        if (c.original && c.fixed) line.appendChild(el("span", "corr-arrow", "→"));
        if (c.fixed) line.appendChild(el("span", "corr-new", c.fixed));
        row.appendChild(line);
        if (c.why) row.appendChild(el("div", "corr-why", c.why));
        cSec.appendChild(row);
      });
    } else {
      cSec.appendChild(el("p", "muted small", "큰 오류는 없었어요 👍"));
    }
    box.appendChild(cSec);

    if (r.improved) {
      var iSec = el("div", "ss-sec");
      var iHead = el("div", "ss-eyebrow-row");
      iHead.appendChild(el("span", "ss-eyebrow", "개선 답변"));
      var tts = el("button", "icon-btn-sm icon-accent");
      tts.type = "button"; tts.title = "개선 답변 듣기"; tts.setAttribute("aria-label", "개선 답변 듣기");
      tts.innerHTML = '<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/><path d="M15.5 8.5a5 5 0 0 1 0 7"/><path d="M19 5a9 9 0 0 1 0 14"/></svg>';
      tts.addEventListener("click", function () { playWithState(tts, r.improved); });
      iHead.appendChild(tts);
      iSec.appendChild(iHead);
      var imp = el("div", "ma-text ss-answer"); // 문장 단위 줄바꿈
      renderAnswerLines(imp, r.improved, null);
      iSec.appendChild(imp);
      box.appendChild(iSec);
    }
    area.appendChild(box);
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else { init(); }
})();
