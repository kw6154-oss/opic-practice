/* =========================================================
   evaluate.js — AI 루브릭 평가 (ACTFL / OPIc 기준)
   ---------------------------------------------------------
   공통 기준 모듈(criteria.js)의 5축·레벨 기술자·등급을 사용.
   5축: 과제수행 / 내용·맥락 / 담화유형 / 정확성 / 구술전달력 (각 1~5)
   → 예상 레벨 판정 + 축별 피드백 + '다음 레벨로 가려면' 조언
   전사 텍스트 기반(발음은 텍스트로 판단 불가 → 유창성/구성으로 대체).
   ========================================================= */
(function (global) {
  "use strict";

  var DIMENSIONS = Criteria.AXES;   // 5축 (공통 모듈)
  var GRADES = Criteria.GRADES;

  // 평가 프롬프트가 공유하는 루브릭 블록
  function rubricBlock() {
    return "Score EACH axis from 1 to 5 (5 = strongest):\n" + Criteria.axesList() + "\n\n" +
      "Use these level descriptors to keep judgments consistent:\n" +
      "- " + Criteria.levelEn("IM2") + "\n" +
      "- " + Criteria.levelEn("IH") + "\n" +
      "- " + Criteria.levelEn("AL") + "\n\n" +
      "Then estimate the overall OPIc grade (one of: " + Criteria.gradesLine() + ").";
  }

  // 5축 JSON 예시 (scores/comments)
  var SCORES_JSON = '{ "task":4, "content":3, "discourse":3, "accuracy":3, "delivery":4 }';
  var COMMENTS_JSON = '{ "task":"...", "content":"...", "discourse":"...", "accuracy":"...", "delivery":"..." }';

  var SYSTEM =
    "You are a certified ACTFL OPIc rater. Evaluate a Korean learner's spoken English " +
    "based ONLY on the transcript, fairly but rigorously by ACTFL criteria. " +
    "Pronunciation can't be judged from text, so for 'delivery' use fluency, connectors, " +
    "organization, flow and length. Write ALL feedback in KOREAN, concise and actionable.";

  var SYSTEM_MOCK = SYSTEM +
    " You are grading a full OPIc session of several questions holistically, like a real rater.";

  /**
   * 단일 답변 평가
   */
  async function evaluateAnswer(q, transcript, opts) {
    opts = opts || {};
    var answer = (transcript || "").trim();
    if (!answer) {
      throw new AI.ApiError("NO_ANSWER", "평가할 답변(전사)이 없습니다. 먼저 녹음하거나 전사를 입력하세요.");
    }

    var prompt =
      "Evaluate this OPIc answer.\n\n" +
      "QUESTION (type: " + (q.type || "general") + "):\n" + q.en + "\n\n" +
      "TEST-TAKER ANSWER (transcript):\n\"\"\"\n" + answer + "\n\"\"\"\n\n" +
      rubricBlock() + "\n\n" +
      "Also give a one-paragraph KOREAN advice on what to do to reach the NEXT level (nextAdvice).\n\n" +
      "Return ONLY JSON in this exact shape (Korean text):\n" +
      "{\n" +
      '  "grade": "IM2",\n' +
      '  "summary": "한국어 2~3문장 총평",\n' +
      '  "scores":   ' + SCORES_JSON + ",\n" +
      '  "comments": ' + COMMENTS_JSON + ",\n" +
      '  "strengths": ["강점 1", "강점 2"],\n' +
      '  "improvements": ["개선점 1", "개선점 2"],\n' +
      '  "nextAdvice": "다음 레벨로 가려면 ..."\n' +
      "}";

    var data = await AI.generateJSON(prompt, {
      system: SYSTEM, temperature: 0.4, signal: opts.signal, onRetry: opts.onRetry,
    });
    return normalize(data);
  }

  /**
   * 세션 종합 평가 (콤보/모의, N문항)
   */
  async function evaluateMock(topic, items, opts) {
    opts = opts || {};
    var blocks = items.map(function (it, i) {
      var a = (it.transcript || "").trim();
      return (i + 1) + ") [" + it.q.label + " / " + it.q.type + "] Q: " + it.q.en +
        "\nA: " + (a || "(무응답)");
    }).join("\n\n");

    var prompt =
      "Grade this OPIc session (" + items.length + " questions) — " + topic.en + ".\n\n" +
      blocks + "\n\n" +
      rubricBlock() + "\n\n" +
      "Give a one-line Korean note for EACH of the " + items.length + " questions (perQuestion array, same order). " +
      "If a question was unanswered, reflect that in the grade. " +
      "Also give a one-paragraph KOREAN advice to reach the NEXT level (nextAdvice).\n\n" +
      "Return ONLY JSON (Korean text; perQuestion must have " + items.length + " items):\n" +
      "{\n" +
      '  "grade": "IM2",\n' +
      '  "summary": "한국어 총평 3~4문장",\n' +
      '  "scores":   ' + SCORES_JSON + ",\n" +
      '  "comments": ' + COMMENTS_JSON + ",\n" +
      '  "perQuestion": [ {"grade":"IM2","note":"..."} ],\n' +
      '  "strengths": ["..."],\n' +
      '  "improvements": ["..."],\n' +
      '  "nextAdvice": "다음 레벨로 가려면 ..."\n' +
      "}";

    var data = await AI.generateJSON(prompt, {
      system: SYSTEM_MOCK, temperature: 0.4, signal: opts.signal, onRetry: opts.onRetry,
    });

    var base = normalize(data);
    var pq = Array.isArray(data.perQuestion) ? data.perQuestion : [];
    base.perQuestion = items.map(function (it, i) {
      var p = pq[i] || {};
      return {
        label: it.q.label, type: it.q.type,
        grade: p.grade || "—", note: (p.note || "").trim(),
        answered: !!(it.transcript && it.transcript.trim()),
      };
    });
    return base;
  }

  function normalize(d) {
    d = d || {};
    var scores = d.scores || {};
    var comments = d.comments || {};
    var out = {
      grade: GRADES.indexOf(d.grade) !== -1 ? d.grade : (d.grade || "—"),
      summary: (d.summary || "").trim(),
      dims: DIMENSIONS.map(function (dim) {
        return {
          key: dim.key, label: dim.label, desc: dim.desc,
          score: clamp(scores[dim.key]),
          comment: (comments[dim.key] || "").trim(),
        };
      }),
      strengths: toArr(d.strengths),
      improvements: toArr(d.improvements),
      nextAdvice: (d.nextAdvice || "").trim(),
    };
    var sum = out.dims.reduce(function (a, x) { return a + x.score; }, 0);
    out.total = sum;
    out.avg = +(sum / out.dims.length).toFixed(1);
    return out;
  }

  function clamp(n) {
    n = Number(n);
    if (isNaN(n)) return 0;
    return Math.max(1, Math.min(5, Math.round(n)));
  }
  function toArr(v) {
    if (Array.isArray(v)) return v.filter(Boolean).map(function (s) { return String(s).trim(); });
    if (typeof v === "string" && v.trim()) return [v.trim()];
    return [];
  }

  function gradeTier(g) {
    if (/^N/.test(g)) return "novice";
    if (/^I/.test(g)) return "inter";
    if (/^A/.test(g)) return "adv";
    return "none";
  }

  global.Evaluator = {
    evaluateAnswer: evaluateAnswer,
    evaluateMock: evaluateMock,
    DIMENSIONS: DIMENSIONS,
    GRADES: GRADES,
    gradeTier: gradeTier,
  };
})(window);
