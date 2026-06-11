/* =========================================================
   criteria.js — 오픽 평가 공통 기준 (단일 출처)
   질문 생성 / 스크립트 생성 / 평가 프롬프트가 모두 참조해
   기준이 어긋나지 않게 한다.
   ========================================================= */
(function (global) {
  "use strict";

  // ----- ACTFL/OPIc 평가 5축 -----
  var AXES = [
    { key: "task",      label: "과제수행",   desc: "질문이 요구한 과제 충족",
      en: "Task completion — did the answer fully address what the question actually asked?" },
    { key: "content",   label: "내용·맥락",  desc: "구체성·전개·맥락 적합성",
      en: "Content & context — relevance, specific detail, development, examples." },
    { key: "discourse", label: "담화유형",   desc: "문장→문단→확장, 구성",
      en: "Text type (discourse) — sentence vs. paragraph vs. extended speech, organization and connectors." },
    { key: "accuracy",  label: "정확성",     desc: "문법·어휘 정확도",
      en: "Accuracy — grammatical and lexical control." },
    { key: "delivery",  label: "구술전달력", desc: "유창성·일관성·흐름",
      en: "Oral delivery — fluency, coherence, pacing and flow (from text: connectors, smoothness, sufficient length)." },
  ];

  // ----- 레벨 기술자 -----
  var LEVELS = {
    IM2: {
      ko: "쉽게 간단한 문장과 원하는 정도를 말할 수 있다 (문장 단위, 단순 시제, 의미 통하는 약간의 오류 허용).",
      en: "IM2 (Intermediate-Mid): handles familiar everyday topics in connected SENTENCES; mostly present and simple past; some errors that don't block meaning; sentence-level discourse.",
    },
    IH: {
      ko: "문단으로 말하고, 시제·돌발·일기정보가 가능해야 한다 (문단 단위, 다양한 시제·연결어, 상황/롤플레이 대응).",
      en: "IH (Intermediate-High): PARAGRAPH-length answers with varied tenses, connectors, reasons and detail; can handle unexpected questions and role-play; minor breakdowns only under complexity.",
    },
    AL: {
      ko: "실수가 극히 적고, 표현이 다양해야 한다 (길고 정교한 담화, 풍부한 어휘·논리, 추상/가정 대응).",
      en: "AL (Advanced-Low): EXTENDED, well-organized discourse; rich and varied vocabulary with some idioms; handles abstract and hypothetical angles; very few errors.",
    },
  };

  // ----- Ava 화법 규칙 -----
  var AVA =
    "You are 'Ava', the official OPIc (Oral Proficiency Interview - computer) examiner. " +
    "You speak in natural, friendly, SPOKEN American English, asking ONE clear prompt at a time " +
    "(1-3 short conversational sentences, never academic). You personalize questions to the " +
    "test-taker's chosen topics, exactly like the real OPIc test.";

  // ----- 실제 오픽 질문 예시 (few-shot) -----
  var FEWSHOT =
    "Examples of real Ava-style questions:\n" +
    "- \"You indicated that you like going to cafes. Can you describe your favorite cafe? What does it look like and why do you like going there?\"\n" +
    "- \"Now, let's talk about your routine. How often do you go to cafes, and what do you usually do once you get there?\"\n" +
    "- \"I'd like to hear about a memorable experience. Tell me about a time something interesting or unexpected happened at a cafe, from start to finish.\"";

  var GRADES = ["NL", "NM", "NH", "IL", "IM1", "IM2", "IM3", "IH", "AL", "AM", "AH"];

  function levelEn(level) { return (LEVELS[level] || LEVELS.IM2).en; }
  function levelKo(level) { return (LEVELS[level] || LEVELS.IM2).ko; }
  // 평가 프롬프트용 5축 목록
  function axesList() {
    return AXES.map(function (a, i) { return (i + 1) + ") " + a.key + " — " + a.en; }).join("\n");
  }
  function gradesLine() { return GRADES.join(", "); }

  global.Criteria = {
    AXES: AXES, LEVELS: LEVELS, AVA: AVA, FEWSHOT: FEWSHOT, GRADES: GRADES,
    levelEn: levelEn, levelKo: levelKo, axesList: axesList, gradesLine: gradesLine,
  };
})(window);
