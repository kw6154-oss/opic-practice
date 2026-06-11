/* =========================================================
   topics.js — OPIc Background Survey 주제 (12개 고정)
   집/공연/콘서트/카페/술집/음악듣기/조깅/걷기/하이킹/운동안함/국내여행/해외여행
   각 주제: id, group, emoji, label(한글), en(영문, 프롬프트용)
   ========================================================= */
(function (global) {
  "use strict";

  var TOPICS = [
    // 여가
    { id: "home",        group: "여가",      emoji: "🏠", label: "집",       en: "your home, where you live" },
    { id: "performance", group: "여가",      emoji: "🎭", label: "공연",     en: "going to see performances or plays" },
    { id: "concert",     group: "여가",      emoji: "🎤", label: "콘서트",   en: "going to concerts" },
    { id: "cafe",        group: "여가",      emoji: "☕", label: "카페",     en: "going to cafes or coffee shops" },
    { id: "bar",         group: "여가",      emoji: "🍺", label: "술집",     en: "going to bars or pubs" },
    { id: "music",       group: "여가",      emoji: "🎧", label: "음악듣기", en: "listening to music" },

    // 야외 · 운동
    { id: "jogging",     group: "야외·운동", emoji: "🏃", label: "조깅",     en: "jogging" },
    { id: "walking",     group: "야외·운동", emoji: "🚶", label: "걷기",     en: "taking walks (walking)" },
    { id: "hiking",      group: "야외·운동", emoji: "🥾", label: "하이킹",   en: "hiking" },
    { id: "no_sport",    group: "야외·운동", emoji: "🛋️", label: "운동안함", en: "not playing any sports; you don't really exercise" },

    // 여행
    { id: "domestic",    group: "여행",      emoji: "🚆", label: "국내여행", en: "domestic travel within Korea" },
    { id: "overseas",    group: "여행",      emoji: "✈️", label: "해외여행", en: "traveling abroad (overseas trips)" },
  ];

  function byId(id) {
    for (var i = 0; i < TOPICS.length; i++) if (TOPICS[i].id === id) return TOPICS[i];
    return null;
  }

  global.TOPICS = TOPICS;
  global.topicById = byId;
})(window);
