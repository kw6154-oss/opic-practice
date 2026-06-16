/* =========================================================
   questions.js — 콤보 질문 생성 (유형·레벨 반영)
   ---------------------------------------------------------
   콤보 3단 흐름(유형별 고정):
   · 선택주제/돌발 : 묘사 → 습관·경향(비교·변화) → 과거 경험
   · 롤플레이      : 질문하기 → 문제 해결 → 관련 경험
   목표 레벨(IM2/IH/AL)에 맞춰 질문 난이도를 조절.
   ========================================================= */
(function (global) {
  "use strict";

  // 유형별 콤보 흐름 (라벨/힌트 + 모델에게 줄 지시)
  var FLOWS = {
    topic: [
      { type: "description", label: "묘사",      hint: "대상을 자세히 설명",
        ask: "describe it in detail — what it is like, its appearance, the place, etc." },
      { type: "habit",       label: "습관·경향",  hint: "평소 루틴 · 비교/변화",
        ask: "their usual habits, routine or tendency about it, OR how it has changed or compares over time" },
      { type: "experience",  label: "경험",      hint: "기억에 남는 일화",
        ask: "a specific, memorable past experience related to it" },
    ],
    roleplay: [
      { type: "ask",        label: "질문하기",   hint: "상황 속 질문 던지기",
        ask: "ask 3-4 natural questions to someone about the given situation" },
      { type: "solve",      label: "문제해결",   hint: "문제 상황 해결",
        ask: "a problem has come up in that situation — explain the problem and suggest solutions or alternatives" },
      { type: "experience", label: "관련경험",   hint: "유사한 과거 경험",
        ask: "a similar past experience they had related to this kind of situation" },
    ],
  };
  FLOWS.surprise = FLOWS.topic; // 돌발도 동일 흐름

  // 공통 기준 모듈(criteria.js) 참조 — 질문/스크립트가 같은 기준을 공유
  var SYSTEM = Criteria.AVA;
  // 레벨 기술자를 질문 난이도 가이드로 사용
  var LEVEL_GUIDE = {
    IM2: "Target " + Criteria.levelEn("IM2"),
    IH:  "Target " + Criteria.levelEn("IH"),
    AL:  "Target " + Criteria.levelEn("AL"),
  };

  // 선택주제/돌발 콤보 흐름 — 묘사 → 과거 경험 → (IM2: 습관 / IH·AL: 비교·문제해결)
  function topicFlow(level) {
    var third = (level === "IM2")
      ? { type: "habit",   label: "습관·루틴",   hint: "대상과 관련된 평소 습관/루틴",
          ask: "their usual habit or routine related to the topic" }
      : { type: "compare", label: "비교·문제해결", hint: "과거-현재 비교 또는 문제 해결",
          ask: "a comparison between the past and the present about the topic, OR a problem they faced related to it and how they solved it" };
    return [
      { type: "description", label: "묘사", hint: "대상의 모습·현재 상태",
        ask: "a basic description or the current state of the topic" },
      { type: "experience",  label: "경험", hint: "기억에 남는 과거 에피소드",
        ask: "a specific, memorable past experience or episode related to the topic" },
      third,
    ];
  }

  /**
   * 콤보 질문 3개 생성 (디스패처)
   * - 선택주제 연습(opts.selected && type==="topic"): 레벨별 신규 Eva 흐름
   * - 그 외(돌발/모의 등): 기존 흐름 그대로
   * @param {object} opts { topic, level, type, selected?, scenario?, signal, onRetry }
   * @returns {Promise<Array<{type,label,hint,en,ko}>>}
   */
  async function generateCombo(opts) {
    opts = opts || {};
    var type = opts.type || "topic";
    if (type === "topic" && opts.selected) return selectedTopicCombo(opts);
    if (type === "surprise" && opts.selected) return surpriseTopicCombo(opts);
    return legacyCombo(opts);
  }

  // 선택주제 전용: Eva의 구어체 영어 '질문'만 생성(답변 없음), 레벨별 3번 문제 분기
  async function selectedTopicCombo(opts) {
    var level = opts.level || "IM2";
    var flow = topicFlow(level);
    var topic = opts.topic;
    var topicEn = topic ? topic.en : "a familiar everyday topic";

    var thirdSpec = (level === "IM2")
      ? "3번 문제 (Habit/Routine): 대상과 관련된 평소 습관이나 루틴을 묻는 질문"
      : "3번 문제 (Comparison/Problem Solving): 과거와 현재를 비교하거나, 대상과 관련해 겪었던 문제와 그 해결 경험을 묻는 질문";

    var prompt =
      "너는 OPIc 시험의 면접관 'Eva'야. 수험자의 목표 등급은 [" + level + "]이고, " +
      "수험자가 선택한 주제는 [" + topicEn + "]야. " +
      "이 주제에 대해 실제 OPIc 시험에 나오는 3단 콤보 질문을 구어체 영어로 생성해 줘.\n\n" +
      "절대 답변(모범 스크립트)은 만들지 말고, 면접관이 묻는 구어체 영어 '질문'만 생성할 것.\n\n" +
      "1번 문제 (Description): 대상에 대한 기본적인 묘사나 현재 상태를 묻는 질문\n" +
      "2번 문제 (Past Experience): 대상과 관련된 기억에 남는 과거 에피소드나 경험을 묻는 질문\n" +
      thirdSpec + "\n\n" +
      "규칙:\n" +
      "- 각 질문은 실제 시험처럼 자연스러운 구어체 영어 1개 (2~3문장 허용).\n" +
      "- 주제에 맞게 개인화하고, 일반적인 빈말은 피할 것.\n" +
      "- 목표 등급 " + level + " 난이도에 맞출 것.\n" +
      "- 각 질문마다 자연스러운 한국어 해석을 함께 줄 것.\n\n" +
      "화면에서 3개의 질문 카드를 반복문으로 그릴 수 있도록, 반드시 아래 JSON 배열 형식으로만 응답해 줘:\n" +
      "[\n" +
      '  {"combo_number": 1, "question_type": "Description", "question_en": "...", "question_ko": "..."},\n' +
      '  {"combo_number": 2, "question_type": "Past Experience", "question_en": "...", "question_ko": "..."},\n' +
      '  {"combo_number": 3, "question_type": "' + (level === "IM2" ? "Habit" : "Comparison") + '", "question_en": "...", "question_ko": "..."}\n' +
      "]";

    var data = await AI.generateJSON(prompt, {
      system: SYSTEM,
      temperature: 0.85,
      signal: opts.signal,
      onRetry: opts.onRetry,
    });

    // 배열 우선, {questions:[...]} 형태도 허용
    var list = Array.isArray(data) ? data
      : (data && Array.isArray(data.questions) ? data.questions : []);
    if (list.length < 3) {
      throw new AI.ApiError("BAD_SHAPE", "질문 형식이 올바르지 않습니다. 다시 시도해 주세요.");
    }

    // combo_number 순서대로(있으면) 매핑, 없으면 인덱스 순서
    return flow.map(function (meta, i) {
      var q = list[i] || {};
      return {
        type: meta.type, label: meta.label, hint: meta.hint,
        en: String(q.question_en || q.en || "").trim(),
        ko: String(q.question_ko || q.ko || "").trim(),
      };
    });
  }

  // 돌발주제 콤보 흐름 — 묘사(현재) → [습관 또는 비교: 무작위] → 과거 경험(과거)
  function surpriseFlow() {
    var second = (Math.random() < 0.5)
      ? { type: "habit",   label: "습관·루틴",  hint: "평소 습관/루틴",      kind: "habit" }
      : { type: "compare", label: "비교·변화",  hint: "과거-현재 변화/비교", kind: "compare" };
    return [
      { type: "description", label: "묘사", hint: "대상/장소를 현재시제로 묘사" },
      second,
      { type: "experience",  label: "경험", hint: "기억에 남는 과거 경험(과거시제)" },
    ];
  }

  // 돌발주제 전용: 무작위 출제된 주제로 Eva의 구어체 영어 '질문'만 생성(답변 없음)
  async function surpriseTopicCombo(opts) {
    var level = opts.level || "IM2";
    var flow = surpriseFlow();
    var topic = opts.topic;
    var topicEn = topic ? topic.en : "a familiar everyday topic";
    var isHabit = (flow[1].kind === "habit");

    var secondSpec = isHabit
      ? "2번 문제 (Habit/Routine): 그 주제와 관련된 평소 습관이나 루틴을 말하도록 묻는 질문"
      : "2번 문제 (Comparison): 그 주제에 대한 과거와 현재의 변화나 비교를 말하도록 묻는 질문";

    var levelDetail = level === "IM2"
      ? "단순하게, 조건은 1~2개만."
      : level === "IH"
      ? "다소 복잡하게, 조건 2~3개를 포함."
      : "복합적으로, 조건 3개 이상과 심화 질문을 포함.";

    var prompt =
      "너는 OPIc 시험의 시험관 'Eva'야. 목표 등급은 [" + level + "]이고, " +
      "이번엔 돌발주제 '" + topicEn + "'가 무작위로 출제됐어. " +
      "이 주제로 돌발 콤보 질문 3개를 구어체 영어로 생성해 줘.\n\n" +
      "절대 답변(모범 스크립트)은 만들지 말고, 면접관이 묻는 구어체 영어 '질문'만 생성할 것.\n\n" +
      "1번 문제 (Description): 그 주제의 대상/장소를 현재시제로 묘사하도록 묻는 질문\n" +
      secondSpec + "\n" +
      "3번 문제 (Past Experience): 그 주제와 관련된 기억에 남는 과거 경험을 처음부터 끝까지 과거시제로 이야기하도록 묻는 질문\n\n" +
      "[난이도] " + levelDetail + "\n\n" +
      "규칙:\n" +
      "- 각 질문은 실제 시험관처럼 자연스러운 구어체 영어 1개 (2~3문장 허용).\n" +
      "- 주제에 맞게 개인화하고, 일반적인 빈말은 피할 것.\n" +
      "- 목표 등급 " + level + " 난이도에 맞출 것.\n" +
      "- 각 질문마다 자연스러운 한국어 해석을 함께 줄 것.\n\n" +
      "화면에서 3개의 질문 카드를 반복문으로 그릴 수 있도록, 반드시 아래 JSON 배열 형식으로만 응답해 줘:\n" +
      "[\n" +
      '  {"combo_number": 1, "question_type": "Description", "question_en": "...", "question_ko": "..."},\n' +
      '  {"combo_number": 2, "question_type": "' + (isHabit ? "Habit" : "Comparison") + '", "question_en": "...", "question_ko": "..."},\n' +
      '  {"combo_number": 3, "question_type": "Past Experience", "question_en": "...", "question_ko": "..."}\n' +
      "]";

    var data = await AI.generateJSON(prompt, {
      system: SYSTEM,
      temperature: 0.9,
      signal: opts.signal,
      onRetry: opts.onRetry,
    });

    var list = Array.isArray(data) ? data
      : (data && Array.isArray(data.questions) ? data.questions : []);
    if (list.length < 3) {
      throw new AI.ApiError("BAD_SHAPE", "질문 형식이 올바르지 않습니다. 다시 시도해 주세요.");
    }

    return flow.map(function (meta, i) {
      var q = list[i] || {};
      return {
        type: meta.type, label: meta.label, hint: meta.hint,
        en: String(q.question_en || q.en || "").trim(),
        ko: String(q.question_ko || q.ko || "").trim(),
      };
    });
  }

  // 기존 콤보 흐름 (모의 등) — 묘사 → 습관·경향 → 경험
  async function legacyCombo(opts) {
    var type = opts.type || "topic";
    var level = opts.level || "IM2";
    var flow = FLOWS[type] || FLOWS.topic;
    var topic = opts.topic;
    var topicEn = topic ? topic.en : "a familiar everyday topic";

    var flowLines = flow.map(function (f, i) {
      return (i + 1) + ") " + f.type.toUpperCase() + " — ask about " + f.ask + ".";
    }).join("\n");

    var context = (type === "roleplay")
      ? ("This is a ROLE-PLAY combo. Situation: " + (opts.scenario || ("something related to " + topicEn)) + "\n")
      : ("Topic: " + topicEn + "\n");

    var prompt =
      "Create a 3-question OPIc 'combo set'.\n" +
      context +
      (LEVEL_GUIDE[level] || LEVEL_GUIDE.IM2) + "\n\n" +
      Criteria.FEWSHOT + "\n\n" +
      "The three questions MUST follow this exact flow:\n" + flowLines + "\n\n" +
      "Rules:\n" +
      "- Each question is ONE natural spoken English prompt (2-3 short sentences allowed, like the real exam).\n" +
      "- Personalize to the topic/situation; avoid generic filler.\n" +
      "- Match the difficulty to the target level above.\n" +
      "- Also give a short natural Korean translation for each.\n\n" +
      "Return ONLY JSON in this exact shape:\n" +
      '{ "questions": [ {"type":"' + flow[0].type + '","en":"...","ko":"..."},' +
      ' {"type":"' + flow[1].type + '","en":"...","ko":"..."},' +
      ' {"type":"' + flow[2].type + '","en":"...","ko":"..."} ] }';

    var data = await AI.generateJSON(prompt, {
      system: SYSTEM,
      temperature: 0.85,
      signal: opts.signal,
      onRetry: opts.onRetry,
    });

    var list = (data && data.questions) || [];
    if (!Array.isArray(list) || list.length < 3) {
      throw new AI.ApiError("BAD_SHAPE", "질문 형식이 올바르지 않습니다. 다시 시도해 주세요.");
    }

    return flow.map(function (meta, i) {
      var q = byType(list, meta.type) || list[i] || {};
      return {
        type: meta.type, label: meta.label, hint: meta.hint,
        en: (q.en || "").trim(), ko: (q.ko || "").trim(),
      };
    });
  }

  /**
   * 롤플레이 세트 생성 (디스패처)
   * - 연습 경로(opts.selected): STEP0 시나리오 고정 + 3문항 일관 전개 (업그레이드)
   * - 그 외(모의 등): 기존 흐름 그대로
   * @param {object} opts { topic, level, selected?, signal, onRetry }
   * @returns {Promise<{scenario:{en,ko}, items:Array}>}
   */
  async function generateRoleplay(opts) {
    opts = opts || {};
    return opts.selected ? scenarioRoleplay(opts) : legacyRoleplay(opts);
  }

  // {scenario, questions} 응답 → 렌더 호환 형태로 매핑 (공용)
  function shapeRoleplay(data, flow) {
    var list = (data && data.questions) || [];
    if (!Array.isArray(list) || list.length < 3) {
      throw new AI.ApiError("BAD_SHAPE", "롤플레이 형식이 올바르지 않습니다. 다시 시도해 주세요.");
    }
    var items = flow.map(function (meta, i) {
      var q = byType(list, meta.type) || list[i] || {};
      return {
        type: meta.type, label: meta.label, hint: meta.hint,
        en: (q.en || "").trim(), ko: (q.ko || "").trim(),
      };
    });
    var sc = (data && data.scenario) || {};
    return {
      scenario: { en: (sc.en || "").trim(), ko: (sc.ko || "").trim() },
      items: items,
    };
  }

  // 연습용 업그레이드: 시나리오 먼저 고정 → 정보요청/문제해결/관련경험이 같은 맥락에서 전개
  async function scenarioRoleplay(opts) {
    var level = opts.level || "IM2";
    var topic = opts.topic;
    var topicEn = topic ? topic.en : "an everyday situation";
    var flow = FLOWS.roleplay;

    var levelDetail = level === "IM2"
      ? "상황은 단순하게, 조건은 1~2개만 둘 것."
      : level === "IH"
      ? "상황은 다소 복잡하게, 조건 2~3개와 예상치 못한 변수 1개를 포함할 것."
      : "상황은 복합적으로, 조건 3개 이상과 돌발 변수 2개 이상을 포함하고, 단순 정보 요청을 넘어 협상·설득·우선순위 조정이 필요하게 만들 것.";

    var prompt =
      "너는 OPIc 시험의 시험관 'Eva'야. 주제 [" + topicEn + "], 목표 등급 [" + level + "]으로 '롤플레이 콤보' 한 세트를 만들어 줘.\n\n" +
      "[STEP 0 — 시나리오 먼저 고정 (3문항을 관통하는 하나의 맥락)]\n" +
      "- 등장인물: 가상의 상대(예: 친구, 카페 직원, 호텔 프런트)\n" +
      "- 배경/설정: 구체적 시간·장소·상황\n" +
      "- 핵심 사건: 2번에서 터질 문제의 씨앗\n" +
      "모든 문항은 이 시나리오 안에서 같은 등장인물·설정으로 일관되게 전개되어야 한다.\n\n" +
      "[3문항 구조 — 이 순서를 반드시 지킬 것]\n" +
      "1번 (정보 요청): 시나리오 속 상대에게 그 상황에 대해 질문 3~4개를 하도록 지시. '질문 3~4개를 해보라'는 점을 안내에 명확히 포함.\n" +
      "2번 (문제 해결): 같은 시나리오에서 예상치 못한 문제가 발생한 상황을 제시하고, 상대에게 상황을 설명한 뒤 두세 가지 대안을 제시하도록 지시.\n" +
      "3번 (관련 경험): 위 상황과 비슷한 실제 과거 경험을 처음부터 끝까지 과거시제로 이야기하도록 지시.\n\n" +
      "[난이도] " + levelDetail + "\n\n" +
      "규칙:\n" +
      "- 각 문항은 실제 시험관처럼 자연스러운 구어체 영어 음성 안내 1~2문장.\n" +
      "- 2번·3번은 1번과 동일한 등장인물·설정을 유지해 같은 이야기로 이어갈 것.\n" +
      "- 시나리오는 사용자에게 보여줄 한 줄 요약(scenario)으로 제공.\n" +
      "- 시나리오와 각 문항에 자연스러운 한국어 해석을 함께 줄 것.\n\n" +
      "반드시 아래 JSON으로만 응답:\n" +
      '{ "scenario": {"en":"...","ko":"..."},' +
      ' "questions": [ {"type":"ask","en":"...","ko":"..."},' +
      ' {"type":"solve","en":"...","ko":"..."},' +
      ' {"type":"experience","en":"...","ko":"..."} ] }';

    var data = await AI.generateJSON(prompt, {
      system: SYSTEM, temperature: 0.85, signal: opts.signal, onRetry: opts.onRetry,
    });
    return shapeRoleplay(data, flow);
  }

  // 기존 롤플레이 흐름 (모의 등)
  async function legacyRoleplay(opts) {
    var level = opts.level || "IM2";
    var topic = opts.topic;
    var topicEn = topic ? topic.en : "an everyday situation";
    var flow = FLOWS.roleplay;
    var flowLines = flow.map(function (f, i) {
      return (i + 1) + ") " + f.type.toUpperCase() + " — " + f.ask + ".";
    }).join("\n");

    var prompt =
      "Create an OPIc ROLE-PLAY task related to: " + topicEn + ".\n" +
      "First invent a realistic SITUATION (1-2 sentences) that places the test-taker in a scenario " +
      "where they must interact with someone (e.g., calling a place, asking staff, handling a problem).\n" +
      (LEVEL_GUIDE[level] || LEVEL_GUIDE.IM2) + "\n\n" +
      Criteria.FEWSHOT + "\n\n" +
      "Then create 3 questions in this exact flow (each must clearly fit the situation):\n" +
      flowLines + "\n\n" +
      "Rules:\n" +
      "- Each question is ONE natural spoken English prompt, like the real exam.\n" +
      "- Give a short natural Korean translation for the situation and each question.\n\n" +
      "Return ONLY JSON:\n" +
      '{ "scenario": {"en":"...","ko":"..."},' +
      ' "questions": [ {"type":"ask","en":"...","ko":"..."},' +
      ' {"type":"solve","en":"...","ko":"..."},' +
      ' {"type":"experience","en":"...","ko":"..."} ] }';

    var data = await AI.generateJSON(prompt, {
      system: SYSTEM, temperature: 0.85, signal: opts.signal, onRetry: opts.onRetry,
    });
    return shapeRoleplay(data, flow);
  }

  /**
   * 자기소개 1문항 (모의고사용, STEP D에서 사용)
   */
  async function generateSelfIntro(level) {
    var prompt =
      "Generate the OPIc self-introduction question (the very first question). " +
      (LEVEL_GUIDE[level] || LEVEL_GUIDE.IM2) + "\n" +
      "Return ONLY JSON: { \"en\":\"...\", \"ko\":\"...\" }";
    var d = await AI.generateJSON(prompt, { system: SYSTEM, temperature: 0.5 });
    return {
      type: "intro", label: "자기소개", hint: "본인 소개",
      en: (d.en || "Let's start the interview. Tell me about yourself.").trim(),
      ko: (d.ko || "면접을 시작하겠습니다. 자기소개를 해주세요.").trim(),
    };
  }

  // 레벨별 모범답안 길이/복잡도 가이드
  var MODEL_LEN = {
    IM2: "Write about 5-7 simple, connected sentences using common, everyday vocabulary. " +
         "Mostly present and simple past tense.",
    IH:  "Write a full paragraph (about 8-12 sentences) with varied tenses, clear connectors, " +
         "specific details and reasons.",
    AL:  "Write a long, well-organized response (about 12-18 sentences) with rich vocabulary, " +
         "some idiomatic expressions, comparisons and nuanced reasoning.",
  };

  /**
   * 레벨별 모범답안 생성
   * @param {object} q  { en, type }
   * @param {string} level
   * @param {object} [opts] { signal, onRetry }
   * @returns {Promise<{answer, tips, level}>}
   */
  async function generateModelAnswer(q, level, opts) {
    opts = opts || {};
    level = level || "IM2";
    var prompt =
      "Write a MODEL OPIc answer for a Korean learner aiming for level " + level + ".\n" +
      "Question: " + q.en + "\n" +
      (MODEL_LEN[level] || MODEL_LEN.IM2) + "\n" +
      "Make it sound natural, first-person, and SPOKEN (not a written essay). " +
      "It should realistically be sayable in about 1.5-2 minutes.\n" +
      "Then give 2-3 tips, each WRITTEN AS A KOREAN sentence. Use English ONLY for quoted words/expressions; never write a tip as an English sentence.\n" +
      "Also provide ko (natural KOREAN translation of the answer) and pron (HANGUL pronunciation of the answer mimicking natural native connected speech with linking/reductions, not letter-by-letter). Write ko and pron sentence-by-sentence in the SAME order and count as the answer.\n" +
      'Return ONLY JSON: { "answer":"...", "tips":["...","..."], "ko":"...", "pron":"..." }';

    var d = await AI.generateJSON(prompt, {
      system: SYSTEM, temperature: 0.7, signal: opts.signal, onRetry: opts.onRetry,
    });
    var mko = (d.ko || "").trim(), mpron = (d.pron || "").trim();
    return {
      answer: (d.answer || "").trim(),
      tips: Array.isArray(d.tips) ? d.tips.filter(Boolean).map(function (t) { return String(t).trim(); }) : [],
      level: level,
      extras: (mko && mpron) ? { ko: mko, pron: mpron } : null, // 해석·발음 동봉 → 클릭 시 추가 호출 없음
    };
  }

  /**
   * 모범답안 부가: 한국어 해석 + 원어민 느낌 한글 발음
   * @param {string} text  영어 모범답안
   * @param {object} [opts] { signal, onRetry }
   * @returns {Promise<{ko, pron}>}
   */
  async function generateModelExtras(text, opts) {
    opts = opts || {};
    var prompt =
      "For this spoken English text:\n\"\"\"\n" + text + "\n\"\"\"\n\n" +
      "1) Provide a natural KOREAN translation (자연스러운 한국어 의역, 직역체 금지).\n" +
      "2) Provide a HANGUL pronunciation guide that mimics how a NATIVE English speaker actually says it — " +
      "use natural connected speech with linking and reductions " +
      "(e.g. 'want to'→'워너', 'going to'→'거너', 'kind of'→'카인덥', 'a lot of'→'어라럽'), " +
      "NOT a stiff letter-by-letter romanization. It should read smoothly in 한글.\n\n" +
      'Return ONLY JSON: { "ko":"...", "pron":"..." }';
    var d = await AI.generateJSON(prompt, {
      system: SYSTEM, temperature: 0.5, signal: opts.signal, onRetry: opts.onRetry,
    });
    return { ko: (d.ko || "").trim(), pron: (d.pron || "").trim() };
  }

  /**
   * 주제별 모범 스크립트 생성 (난이도 반영)
   * @param {object} opts { topic, level, signal, onRetry }
   * @returns {Promise<{question, answer, expressions:[{en,ko}], tips:[]}>}
   */
  // 레벨별 필수 조건 (스크립트 프롬프트 공용)
  function levelCondKo(level) {
    return level === "IM2"
      ? "- 단순 명료한 문장 위주. 과거 시제를 정확히 사용하되, 길고 복잡한 문법은 피할 것. (약 100단어)"
      : level === "IH"
      ? "- 접속사와 관계대명사를 활용해 문장을 유기적으로 연결. 감정 형용사를 풍부하게 사용할 것. (약 140단어)"
      : "- 'You know', 'I mean', 'Well', 'Honestly' 같은 원어민 필러(Filler Words)를 아주 자연스럽게 사용. 다양한 시제와 구동사(Phrasal verbs)를 활용할 것. (약 180단어)";
  }

  // 암기 보조(키워드 뼈대 + 단계 구조) 정규화 — 생성/즉석 보강 공용
  function normalizeAids(d) {
    d = d || {};
    return {
      keywords: Array.isArray(d.keywords)
        ? d.keywords.map(function (k) { return String(k || "").trim(); }).filter(Boolean) : [],
      structure: Array.isArray(d.structure)
        ? d.structure.filter(function (s) { return s && s.label && Array.isArray(s.range); })
            .map(function (s) {
              var a = Number(s.range[0]) || 1, b = Number(s.range[1]) || a;
              return { label: String(s.label).trim(), range: [a, b] };
            }) : [],
    };
  }

  // AI 응답(JSON) → UI 호환 스크립트 객체로 정규화
  function normalizeScript(d, level) {
    d = d || {};
    var aids = normalizeAids(d);
    var ko = (d.ko || "").trim(), pron = (d.pron || "").trim();
    return {
      stage: (d.stage || "").trim(),
      question: (d.question || "").trim(),
      answer: (d.answer || "").trim(),
      expressions: Array.isArray(d.expressions) ? d.expressions.filter(function (e) { return e && e.en; })
        .map(function (e) { return { en: String(e.en).trim(), ko: String(e.ko || "").trim() }; }) : [],
      tips: Array.isArray(d.tips) ? d.tips.filter(Boolean).map(function (t) { return String(t).trim(); })
        : (d.tips ? [String(d.tips).trim()] : []),
      levelNote: (d.levelNote || "").trim(),
      keywords: aids.keywords,
      structure: aids.structure,
      // 해석·발음을 생성에 합쳐 받음 → 둘 다 있으면 extras로(추가 호출 없음). 없으면 null로 두어 lazy 폴백 유지
      extras: (ko && pron) ? { ko: ko, pron: pron } : null,
      level: level,
    };
  }

  // 기존 스크립트(답변만 있는 저장본)에 암기 보조 데이터만 즉석 생성
  async function generateScriptAids(answer, opts) {
    opts = opts || {};
    var prompt =
      "아래 영어 OPIc 답변에 대해 암기 보조 데이터를 만들어 줘.\n" +
      "1) keywords: 답변 흐름을 떠올릴 수 있는 6~8개의 짧은 영어 키워드(핵심 단어/구).\n" +
      "2) structure: 답변을 문장 순서대로 4단계(상황/행동/감정/마무리)로 묶기. " +
      "range는 1부터 시작하는 문장 번호 [시작,끝]이고, 답변의 모든 문장을 빠짐없이 연속으로 덮어야 함(실제 문장 수에 맞게 조정).\n\n" +
      "[답변]\n" + answer + "\n\n" +
      "반드시 아래 JSON만:\n" +
      '{ "keywords": ["...", "..."], "structure": [{"label":"상황","range":[1,2]},{"label":"행동","range":[3,4]},{"label":"감정","range":[5,6]},{"label":"마무리","range":[7,7]}] }';
    var d = await AI.generateJSON(prompt, {
      system: SYSTEM, temperature: 0.4, signal: opts.signal, onRetry: opts.onRetry,
    });
    return normalizeAids(d);
  }

  async function generateScript(opts) {
    opts = opts || {};
    var level = opts.level || "IM2";
    var subject = (opts.request && opts.request.trim())
      ? opts.request.trim()
      : (opts.topic ? opts.topic.en : "a familiar everyday topic");
    var prompt =
      "너는 OPIc 시험의 최고 등급 평가자이자 원어민 강사야.\n" +
      "아래 [요청사항]에 맞춰 수험자가 실제 시험에서 [" + level + "] 등급을 받을 수 있는 고득점 모범 답변 스크립트를 작성해 줘.\n\n" +
      "[요청사항]\n" + subject + "\n\n" +
      "[레벨별 필수 조건: " + level + "]\n" + levelCondKo(level) + "\n\n" +
      "응답은 기존 시스템 UI와 완벽히 호환되도록 반드시 아래 JSON 형식으로만 줘.\n\n" +
      "{\n" +
      '  "question": "이 스크립트 답변을 유도할 수 있는 가상의 면접관 Eva의 구어체 영어 질문",\n' +
      '  "answer": "조건에 맞춰 작성된 자연스러운 구어체 영어 스크립트 본문",\n' +
      '  "expressions": [\n' +
      '    {"en": "본문에 사용된 핵심 영어 표현 1", "ko": "한국어 뜻"},\n' +
      '    {"en": "본문에 사용된 핵심 영어 표현 2", "ko": "한국어 뜻"},\n' +
      '    {"en": "본문에 사용된 핵심 영어 표현 3", "ko": "한국어 뜻"}\n' +
      "  ],\n" +
      '  "tips": "이 스크립트를 말할 때 주의할 발음·억양·연기 꿀팁. 반드시 한국어 문장으로 설명하고, 영어는 인용하는 단어나 표현에만 사용할 것 (예: \'really\'는 길게 늘여 발음하세요). 영어 문장으로 쓰지 말 것.",\n' +
      '  "levelNote": "이 스크립트가 ' + level + ' 등급을 받기에 적합한 이유 (한국어)",\n' +
      '  "keywords": ["답변 흐름을 떠올릴 수 있는 6~8개의 짧은 영어 키워드(핵심 단어/구)"],\n' +
      '  "structure": [\n' +
      '    {"label": "상황", "range": [1, 2]},\n' +
      '    {"label": "행동", "range": [3, 4]},\n' +
      '    {"label": "감정", "range": [5, 6]},\n' +
      '    {"label": "마무리", "range": [7, 7]}\n' +
      "  ],\n" +
      '  "ko": "answer 전체의 자연스러운 한국어 해석(의역, 직역체 금지)",\n' +
      '  "pron": "answer를 원어민이 실제로 말하는 느낌의 한글 발음 표기(연음·축약 반영: \'want to\'→\'워너\' 등, 글자 하나씩 로마자화 금지)"\n' +
      "}\n\n" +
      "structure는 answer를 문장 순서대로 4단계(상황/행동/감정/마무리)로 묶어. range는 1부터 시작하는 문장 번호 [시작,끝]이고, answer의 모든 문장을 빠짐없이 연속으로 덮어야 해(실제 문장 수에 맞게 범위를 조정).\n" +
      "ko와 pron은 answer와 같은 문장 수·같은 순서로 문장 단위로 작성해(문장마다 마침표로 구분) — 단계별 인터리브 정렬에 사용돼.";
    var d = await AI.generateJSON(prompt, {
      system: SYSTEM, temperature: 0.8, signal: opts.signal, onRetry: opts.onRetry,
    });
    return normalizeScript(d, level);
  }

  /**
   * OPIc 3단 콤보 스크립트 — 한 주제를 묘사→경험→비교 3개로 생성
   * @param {object} opts { request, level, signal, onRetry }
   * @returns {Promise<Array>} 정규화된 스크립트 객체 배열(최대 3개, 각 stage 포함)
   */
  async function generateComboScript(opts) {
    opts = opts || {};
    var level = opts.level || "IM2";
    var subject = (opts.request && opts.request.trim())
      ? opts.request.trim()
      : (opts.topic ? opts.topic.en : "a familiar everyday topic");
    var prompt =
      "너는 OPIc 시험의 최고 등급 평가자이자 원어민 강사야.\n" +
      "아래 [주제]에 대해 OPIc '3단 콤보' 구조로 서로 독립적인 3개의 스크립트를 작성해 줘.\n" +
      "3단 콤보 = (1) 묘사: 대상·장소·일상을 설명, (2) 경험: 구체적인 과거 에피소드, (3) 비교: 과거와 현재의 차이나 변화를 비교.\n\n" +
      "[주제]\n" + subject + "\n\n" +
      "[레벨별 필수 조건: " + level + "]\n" + levelCondKo(level) + "\n\n" +
      "응답은 기존 시스템 UI와 완벽히 호환되도록 반드시 아래 JSON 배열 형식으로만 줘. " +
      "배열에는 정확히 3개의 객체를 순서대로(묘사, 경험, 비교) 담고, 각 객체는 동일한 키 구조를 가져야 해.\n\n" +
      "[\n" +
      '  {"stage": "묘사",  "question": "이 단계 답변을 유도하는 Eva의 구어체 영어 질문", "answer": "자연스러운 구어체 영어 스크립트 본문", "expressions": [{"en": "핵심 영어 표현", "ko": "한국어 뜻"}, {"en": "...", "ko": "..."}, {"en": "...", "ko": "..."}], "tips": "한국어 꿀팁(영어는 인용 단어에만)", "levelNote": "이 스크립트가 ' + level + ' 등급에 적합한 이유(한국어)"},\n' +
      '  {"stage": "경험",  "question": "...", "answer": "...", "expressions": [{"en": "...", "ko": "..."}, {"en": "...", "ko": "..."}, {"en": "...", "ko": "..."}], "tips": "...", "levelNote": "..."},\n' +
      '  {"stage": "비교",  "question": "...", "answer": "...", "expressions": [{"en": "...", "ko": "..."}, {"en": "...", "ko": "..."}, {"en": "...", "ko": "..."}], "tips": "...", "levelNote": "..."}\n' +
      "]";
    var d = await AI.generateJSON(prompt, {
      system: SYSTEM, temperature: 0.8, signal: opts.signal, onRetry: opts.onRetry,
    });
    var arr = Array.isArray(d) ? d : (d && Array.isArray(d.scripts) ? d.scripts : [d]);
    return arr.filter(Boolean).slice(0, 3).map(function (item) { return normalizeScript(item, level); });
  }

  /**
   * 답변 첨삭: 사용자 답변을 교정 + 개선본 제시
   * @param {object} q { en }
   * @param {string} answer
   * @param {object} [opts] { level, signal, onRetry }
   * @returns {Promise<{corrections:[{original,fixed,why}], improved}>}
   */
  async function correctAnswer(q, answer, opts) {
    opts = opts || {};
    var level = opts.level || "IM2";
    var prompt =
      "A Korean learner answered an OPIc question. Give gentle correction & improvement.\n\n" +
      "QUESTION: " + q.en + "\n" +
      "ANSWER: \"\"\"\n" + answer + "\n\"\"\"\n\n" +
      "1) List up to 5 specific corrections (grammar/word choice/naturalness). " +
      "For each: the original phrase, the fixed phrase, and a SHORT Korean reason.\n" +
      "2) Write an IMPROVED version of their answer at level " + level +
      ", keeping their content but making it natural.\n\n" +
      "Return ONLY JSON:\n" +
      '{ "corrections":[{"original":"...","fixed":"...","why":"..."}], "improved":"..." }';
    var d = await AI.generateJSON(prompt, {
      system: SYSTEM, temperature: 0.4, signal: opts.signal, onRetry: opts.onRetry,
    });
    return {
      corrections: Array.isArray(d.corrections) ? d.corrections.filter(function (c) { return c && (c.original || c.fixed); }) : [],
      improved: (d.improved || "").trim(),
    };
  }

  /**
   * 답변 리뷰 묶음 — 한 번의 호출로 교정·개선답변·모범답안·팁을 함께 받는다.
   * @returns {Promise<{corrections:[], improved, modelAnswer, tips:[], level}>}
   */
  async function reviewAnswer(q, answer, opts) {
    opts = opts || {};
    var level = opts.level || "IM2";
    var prompt =
      "A Korean learner answered an OPIc question. Do ALL of the following in ONE response.\n\n" +
      "QUESTION: " + q.en + "\n" +
      "ANSWER: \"\"\"\n" + answer + "\n\"\"\"\n\n" +
      "1) corrections: up to 5 specific corrections (grammar/word choice/naturalness). " +
      "For each: original phrase, fixed phrase, and a SHORT Korean reason (why).\n" +
      "2) improved: an IMPROVED version of THEIR answer at level " + level +
      " (keep their content, make it natural and spoken).\n" +
      "3) modelAnswer: a fresh MODEL answer for this question at level " + level + ". " +
      (MODEL_LEN[level] || MODEL_LEN.IM2) + " Natural, first-person, SPOKEN (not an essay).\n" +
      "4) tips: 2-3 tips, each WRITTEN AS A KOREAN sentence (use English ONLY for quoted words/expressions; never write a tip as an English sentence).\n" +
      "5) modelKo: natural KOREAN translation of modelAnswer; modelPron: HANGUL pronunciation of modelAnswer (native connected speech, not letter-by-letter). Sentence-by-sentence, same order/count as modelAnswer.\n\n" +
      "Return ONLY JSON:\n" +
      '{ "corrections":[{"original":"...","fixed":"...","why":"..."}], "improved":"...", "modelAnswer":"...", "modelKo":"...", "modelPron":"...", "tips":["...","..."] }';
    // AI.generateJSON 은 ```json 펜스를 제거하고 파싱(parseLooseJSON), 실패 시 PARSE 에러를 던짐
    var d = await AI.generateJSON(prompt, {
      system: SYSTEM, temperature: 0.45, signal: opts.signal, onRetry: opts.onRetry,
    });
    var mko = (d.modelKo || "").trim(), mpron = (d.modelPron || "").trim();
    return {
      corrections: Array.isArray(d.corrections) ? d.corrections.filter(function (c) { return c && (c.original || c.fixed); }) : [],
      improved: (d.improved || "").trim(),
      modelAnswer: (d.modelAnswer || "").trim(),
      modelExtras: (mko && mpron) ? { ko: mko, pron: mpron } : null,
      tips: Array.isArray(d.tips) ? d.tips.filter(Boolean).map(function (t) { return String(t).trim(); }) : [],
      level: level,
    };
  }

  function normReview(r) {
    r = r || {};
    var mko = (r.modelKo || "").trim(), mpron = (r.modelPron || "").trim();
    return {
      corrections: Array.isArray(r.corrections) ? r.corrections.filter(function (c) { return c && (c.original || c.fixed); }) : [],
      improved: (r.improved || "").trim(),
      modelAnswer: (r.modelAnswer || "").trim(),
      modelExtras: (mko && mpron) ? { ko: mko, pron: mpron } : (r.modelExtras || null),
      tips: Array.isArray(r.tips) ? r.tips.filter(Boolean).map(function (t) { return String(t).trim(); }) : [],
    };
  }

  // 청크(최대 4문항)를 한 번의 호출로 첨삭+모범답안 일괄 생성. 실패 시 null 반환(상위에서 폴백)
  async function reviewChunk(chunk, level, opts) {
    var pairs = chunk.map(function (it, i) { return { n: i + 1, question: it.question, answer: it.transcript }; });
    var prompt =
      "A Korean learner answered OPIc questions. For EACH question-answer pair, do ALL of:\n" +
      "1) corrections: up to 5 {original phrase, fixed phrase, SHORT Korean reason(why)}\n" +
      "2) improved: an improved version of THEIR answer at level " + level + " (keep content, natural & spoken)\n" +
      "3) modelAnswer: a fresh MODEL answer for that question at level " + level + " (natural, first-person, spoken)\n" +
      "4) tips: 2-3 tips, each WRITTEN AS A KOREAN sentence (English ONLY for quoted words/expressions; never an English sentence).\n" +
      "5) modelKo: KOREAN translation of modelAnswer; modelPron: HANGUL pronunciation of modelAnswer (native connected speech). Sentence-by-sentence, same order/count as modelAnswer.\n\n" +
      "PAIRS:\n" + JSON.stringify(pairs) + "\n\n" +
      "Return ONLY a JSON array with one object per pair IN THE SAME ORDER:\n" +
      '[{"corrections":[{"original":"...","fixed":"...","why":"..."}],"improved":"...","modelAnswer":"...","modelKo":"...","modelPron":"...","tips":["...","..."]}]';
    var d = await AI.generateJSON(prompt, {
      system: SYSTEM, temperature: 0.45, signal: opts.signal, onRetry: opts.onRetry,
    });
    var arr = Array.isArray(d) ? d : (d && Array.isArray(d.reviews) ? d.reviews : null);
    if (!arr || arr.length !== chunk.length) return null; // 형식·개수 불일치 → 폴백
    return arr.map(normReview);
  }

  /**
   * 여러 답변 일괄 첨삭+모범답안 (모의고사 종합 피드백용)
   * - 최대 4문항씩 묶어 호출(응답 잘림 방지), 청크 실패 시 문제별 개별 호출로 폴백
   * @param {Array<{question,transcript}>} items
   * @returns {Promise<Array<{corrections,improved,modelAnswer,tips}>>} items와 같은 순서·길이
   */
  async function reviewAnswers(items, opts) {
    opts = opts || {};
    var level = opts.level || "IM2";
    var CHUNK = 4;
    var out = [];
    for (var start = 0; start < items.length; start += CHUNK) {
      var chunk = items.slice(start, start + CHUNK);
      var reviews = null;
      try { reviews = await reviewChunk(chunk, level, opts); } catch (e) { reviews = null; }
      if (!reviews) {
        reviews = [];
        for (var j = 0; j < chunk.length; j++) {
          try {
            var r = await reviewAnswer({ en: chunk[j].question }, chunk[j].transcript, { level: level, signal: opts.signal, onRetry: opts.onRetry });
            reviews.push(normReview(r));
          } catch (e2) {
            reviews.push({ corrections: [], improved: "", modelAnswer: "", tips: [] });
          }
        }
      }
      out = out.concat(reviews);
    }
    return out;
  }

  function byType(list, type) {
    for (var i = 0; i < list.length; i++) {
      if (list[i] && list[i].type === type) return list[i];
    }
    return null;
  }

  global.QuestionGen = {
    generateCombo: generateCombo,
    generateRoleplay: generateRoleplay,
    generateSelfIntro: generateSelfIntro,
    generateModelAnswer: generateModelAnswer,
    generateModelExtras: generateModelExtras,
    generateScript: generateScript,
    generateScriptAids: generateScriptAids,
    generateComboScript: generateComboScript,
    correctAnswer: correctAnswer,
    reviewAnswer: reviewAnswer,
    reviewAnswers: reviewAnswers,
    FLOWS: FLOWS,
  };
})(window);
