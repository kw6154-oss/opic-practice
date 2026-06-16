/* =========================================================
   api.js — AI 호출 계층 (현재: Google Gemini)
   ---------------------------------------------------------
   보안 원칙:
   - API 키는 Storage(localStorage)에서만 읽는다.
   - 키는 오직 선택한 제공사의 공식 엔드포인트로만 전송된다.
     (우리 서버 없음 / 로그·콘솔에 키 출력 금지)
   - 키를 URL/에러 메시지에 노출하지 않는다.
   ========================================================= */
(function (global) {
  "use strict";

  var GEMINI = {
    model: "gemini-2.5-flash",
    endpoint: function (model) {
      return "https://generativelanguage.googleapis.com/v1beta/models/" +
        model + ":generateContent";
    },
  };

  /**
   * 저수준 호출: 프롬프트 텍스트 → 모델 응답 텍스트
   * @param {string} prompt
   * @param {object} [opts]  { system, temperature, signal, json }
   * @returns {Promise<string>}
   */
  async function generate(prompt, opts) {
    opts = opts || {};
    var key = Storage.getApiKey();
    if (!key || !key.trim()) {
      throw new ApiError("NO_KEY", "API 키가 없습니다. 설정에서 먼저 등록하세요.");
    }

    var body = {
      contents: [{ role: "user", parts: [{ text: prompt }] }],
      generationConfig: {
        temperature: opts.temperature != null ? opts.temperature : 0.7,
      },
    };
    if (opts.system) body.systemInstruction = { parts: [{ text: opts.system }] };
    if (opts.json) body.generationConfig.responseMimeType = "application/json";

    var model = (Storage.getModel && Storage.getModel()) || GEMINI.model;
    var url = GEMINI.endpoint(model);
    var maxRetry = opts.maxRetry != null ? opts.maxRetry : 2;

    for (var attempt = 0; ; attempt++) {
      var resp;
      try {
        resp = await fetch(url, {
          method: "POST",
          headers: { "Content-Type": "application/json", "x-goog-api-key": key },
          body: JSON.stringify(body),
          signal: opts.signal,
        });
      } catch (e) {
        if (e && e.name === "AbortError") throw new ApiError("ABORTED", "요청이 취소되었습니다.");
        // fetch 자체 실패(연결 끊김·리셋 등)는 일시적인 경우가 많아 짧게 자동 재시도
        if (attempt < maxRetry) {
          try { await delay(Math.min(6000, 800 * Math.pow(2, attempt)), opts.signal); }
          catch (e2) { throw new ApiError("ABORTED", "요청이 취소되었습니다."); }
          continue;
        }
        throw new ApiError("NETWORK", "네트워크 오류로 AI에 연결하지 못했습니다. 인터넷 연결, 광고 차단·확장 프로그램, 회사/학교 방화벽(VPN)을 확인한 뒤 다시 시도해 주세요.");
      }

      if (resp.ok) {
        var data = await resp.json();
        var text = extractText(data);
        if (!text) {
          var reason = data && data.promptFeedback && data.promptFeedback.blockReason;
          throw new ApiError("EMPTY", reason ? ("응답이 차단되었습니다: " + reason) : "AI가 빈 응답을 반환했습니다.");
        }
        return text;
      }

      var info = await readError(resp);

      // 자동 재시도: 429(분당 한도, 짧은 지연) 또는 5xx(서버 과부하·일시 오류)
      var isDaily = /per ?day/i.test(info.message);
      var serverBusy = (resp.status === 500 || resp.status === 502 || resp.status === 503 || resp.status === 504);
      var rateRetry = (resp.status === 429 && !isDaily && info.retryMs != null && info.retryMs <= 30000);
      if (attempt < maxRetry && (rateRetry || serverBusy)) {
        // 5xx는 지수 백오프(1.2s, 2.4s, …), 429는 서버가 알려준 지연 사용
        var waitMs = rateRetry ? info.retryMs : Math.min(8000, 1200 * Math.pow(2, attempt));
        if (typeof opts.onRetry === "function") opts.onRetry(Math.ceil(waitMs / 1000), attempt + 1);
        try { await delay(waitMs, opts.signal); } catch (e2) { throw new ApiError("ABORTED", "요청이 취소되었습니다."); }
        continue;
      }

      if (resp.status === 401 || resp.status === 403) {
        // 키 오류 → 앱이 게이트(키 재입력)로 유도하도록 알림
        try { window.dispatchEvent(new CustomEvent("apikey-invalid", { detail: { status: resp.status } })); } catch (e3) {}
        throw new ApiError("BAD_KEY", "API 키가 올바르지 않아요(" + resp.status + "). 키를 다시 확인해 주세요. " + info.message);
      }
      if (resp.status === 400) {
        throw new ApiError("BAD_KEY", "API 키가 유효하지 않거나 요청이 거부됐어요. " + info.message);
      }
      if (resp.status === 429) {
        var hint = isDaily
          ? "무료 일일 한도 초과 — 설정에서 모델을 바꾸면(예: flash-lite) 별도 일일 쿼터를 바로 쓸 수 있어요. " +
            "또는 다음날(태평양시 자정) 초기화를 기다리거나, Google Cloud 프로젝트에 결제를 연결하세요. "
          : "무료 한도(429) 초과 — 잠시 후 다시 시도하거나 설정에서 모델을 바꿔보세요. ";
        throw new ApiError("RATE_LIMIT", hint + info.message);
      }
      if (serverBusy) {
        throw new ApiError("OVERLOADED", "AI 서버가 잠시 혼잡합니다(" + resp.status + "). 잠시 후 다시 시도해 주세요. " + info.message);
      }
      throw new ApiError("HTTP_" + resp.status, "AI 응답 오류(" + resp.status + "). " + info.message);
    }
  }

  function delay(ms, signal) {
    return new Promise(function (resolve, reject) {
      var t = setTimeout(resolve, ms);
      if (signal) {
        signal.addEventListener("abort", function () { clearTimeout(t); reject(new Error("aborted")); }, { once: true });
      }
    });
  }

  /** 연결 테스트: 키가 살아있는지 가벼운 호출 */
  async function testConnection() {
    var t = await generate("Reply with exactly: OK", { temperature: 0 });
    return /ok/i.test(t);
  }

  /** JSON 응답 강제 + 파싱 (이후 단계: 평가/질문 생성에서 사용) */
  async function generateJSON(prompt, opts) {
    opts = Object.assign({ json: true, temperature: 0.6 }, opts || {});
    var raw = await generate(prompt, opts);
    return parseLooseJSON(raw);
  }

  // ---- 내부 유틸 ----
  function extractText(data) {
    try {
      var parts = data.candidates[0].content.parts;
      return parts.map(function (p) { return p.text || ""; }).join("").trim();
    } catch (e) { return ""; }
  }

  // 에러 응답에서 메시지(키 마스킹) + 재시도 지연(ms) 추출
  async function readError(resp) {
    var out = { message: "", retryMs: null };
    try {
      var j = await resp.json();
      var m = j && j.error && j.error.message;
      out.message = (m || "").replace(/key=[\w-]+/gi, "key=***");
      var details = (j && j.error && j.error.details) || [];
      for (var i = 0; i < details.length; i++) {
        var d = details[i];
        if (d && /RetryInfo/.test(d["@type"] || "") && d.retryDelay) {
          var sec = parseFloat(String(d.retryDelay).replace("s", ""));
          if (!isNaN(sec)) out.retryMs = Math.ceil(sec * 1000);
        }
      }
    } catch (e) {}
    // 메시지에서 "Please retry in 34.2s" 형태도 보조 추출
    if (out.retryMs == null) {
      var mm = /retry in ([0-9.]+)s/i.exec(out.message);
      if (mm) out.retryMs = Math.ceil(parseFloat(mm[1]) * 1000);
    }
    return out;
  }

  function parseLooseJSON(raw) {
    if (!raw) throw new ApiError("PARSE", "빈 응답");
    // 코드펜스 제거
    var s = raw.replace(/^```(?:json)?\s*/i, "").replace(/```\s*$/i, "").trim();
    try { return JSON.parse(s); }
    catch (e) {
      // 객체 또는 배열 본문만 추출해 재시도 (프로즈가 섞인 경우)
      var oa = s.indexOf("{"), ob = s.lastIndexOf("}");
      var aa = s.indexOf("["), ab = s.lastIndexOf("]");
      // 배열이 더 바깥에 있으면 배열 우선
      if (aa !== -1 && ab > aa && (oa === -1 || aa < oa)) {
        try { return JSON.parse(s.slice(aa, ab + 1)); } catch (e3) {}
      }
      if (oa !== -1 && ob > oa) {
        try { return JSON.parse(s.slice(oa, ob + 1)); } catch (e2) {}
      }
      if (aa !== -1 && ab > aa) {
        try { return JSON.parse(s.slice(aa, ab + 1)); } catch (e4) {}
      }
      throw new ApiError("PARSE", "AI 응답을 JSON으로 해석하지 못했습니다.");
    }
  }

  function ApiError(code, message) {
    this.name = "ApiError";
    this.code = code;
    this.message = message;
  }
  ApiError.prototype = Object.create(Error.prototype);

  global.AI = {
    generate: generate,
    generateJSON: generateJSON,
    testConnection: testConnection,
    ApiError: ApiError,
    model: GEMINI.model,
  };
})(window);
