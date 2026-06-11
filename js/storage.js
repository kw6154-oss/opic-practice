/* =========================================================
   storage.js — localStorage 래퍼
   민감 정보(API 키)는 이 브라우저에만 보관. 외부 전송 없음.
   ========================================================= */
(function (global) {
  "use strict";

  var NS = "opic.";           // 키 네임스페이스
  var K = {
    apiKey:   NS + "apiKey",
    provider: NS + "provider",
    theme:    NS + "theme",
    survey:   NS + "survey",   // 선택 주제 풀 (id 배열)
    level:    NS + "level",    // 목표 레벨 IM2|IH|AL
    history:  NS + "history",  // 테스트 내역
  };

  function get(key, fallback) {
    try {
      var v = localStorage.getItem(key);
      return v === null ? (fallback === undefined ? null : fallback) : v;
    } catch (e) {
      return fallback === undefined ? null : fallback;
    }
  }
  function set(key, value) {
    try { localStorage.setItem(key, value); return true; }
    catch (e) { return false; }
  }
  function remove(key) {
    try { localStorage.removeItem(key); } catch (e) {}
  }
  function getJSON(key, fallback) {
    var raw = get(key, null);
    if (raw === null) return fallback;
    try { return JSON.parse(raw); } catch (e) { return fallback; }
  }
  function setJSON(key, obj) { return set(key, JSON.stringify(obj)); }

  // --- 공개 API ---
  var Storage = {
    keys: K,

    // API 키
    getApiKey: function () { return get(K.apiKey, ""); },
    setApiKey: function (v) { return set(K.apiKey, v); },
    clearApiKey: function () { remove(K.apiKey); },
    hasApiKey: function () { var v = get(K.apiKey, ""); return !!(v && v.trim()); },

    // 제공사
    getProvider: function () { return get(K.provider, "gemini"); },
    setProvider: function (v) { return set(K.provider, v); },

    // 모델
    getModel: function () { return get(NS + "model", "gemini-2.5-flash"); },
    setModel: function (v) { return set(NS + "model", v); },

    // 듣기(TTS) — 속도(0.75|1|1.25) / 음성(voiceURI 또는 name)
    getTtsRate: function () { var v = parseFloat(get(NS + "ttsRate", "1")); return (v === 0.75 || v === 1.25) ? v : 1; },
    setTtsRate: function (v) { return set(NS + "ttsRate", String(v)); },
    getTtsVoice: function () { return get(NS + "ttsVoice", ""); },
    setTtsVoice: function (v) { return set(NS + "ttsVoice", v || ""); },

    // 발음 연습 '뜻 보기' 토글 (켜둔 채 유지)
    getPronMeaning: function () { return get(NS + "pronMeaning", "0") === "1"; },
    setPronMeaning: function (on) { return set(NS + "pronMeaning", on ? "1" : "0"); },

    // 테마
    getTheme: function () { return get(K.theme, null); },
    setTheme: function (v) { return set(K.theme, v); },

    // 배경 설문 (선택 주제 풀)
    getSurvey: function () { return getJSON(K.survey, []); },
    setSurvey: function (arr) { return setJSON(K.survey, arr || []); },

    // 목표 레벨
    getLevel: function () { return get(K.level, "IM2"); },
    setLevel: function (v) { return set(K.level, v); },

    // 테스트 내역
    getHistory: function () { return getJSON(K.history, []); },
    setHistory: function (arr) { return setJSON(K.history, arr || []); },

    // 저장한 스크립트
    getScripts: function () { return getJSON(NS + "scripts", []); },
    setScripts: function (arr) { return setJSON(NS + "scripts", arr || []); },

    // 범용
    getJSON: getJSON,
    setJSON: setJSON,
    remove: remove,
  };

  global.Storage = Storage;
})(window);
