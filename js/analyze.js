/* =========================================================
   analyze.js — 발화 분석
   ---------------------------------------------------------
   · 군더더기(filler) : 전사 텍스트에서 카운트
   · WPM             : 단어수 / (오디오 길이/60)
   · 휴지(pause)      : 녹음 오디오를 디코딩해 무음 구간 측정
   오디오 분석은 Web Audio API(AudioContext) 사용. 외부 전송 없음.
   ========================================================= */
(function (global) {
  "use strict";

  // OPIc에서 자주 나오는 군더더기 표현
  var FILLERS = [
    "um", "uh", "er", "ah", "hmm",
    "like", "you know", "i mean", "kind of", "sort of",
    "basically", "actually", "literally",
  ];

  function analyzeText(transcript) {
    var raw = transcript || "";
    var words = raw.trim() ? raw.trim().split(/\s+/) : [];
    var wc = words.length;
    var lower = " " + raw.toLowerCase().replace(/[^a-z\s']/g, " ").replace(/\s+/g, " ") + " ";
    var found = [], total = 0;
    FILLERS.forEach(function (f) {
      var pat = f.replace(/ /g, "\\s+");
      var re = new RegExp("(?:^|\\s)" + pat + "(?:\\s|$)", "g");
      var n = 0, m;
      // 겹치는 매칭 방지: lastIndex 직접 관리
      re.lastIndex = 0;
      while ((m = re.exec(lower)) !== null) { n++; re.lastIndex = m.index + 1; }
      if (n > 0) { found.push({ word: f, count: n }); total += n; }
    });
    found.sort(function (a, b) { return b.count - a.count; });
    return {
      words: wc,
      fillers: found,
      fillerTotal: total,
      fillerRatio: wc ? +(total / wc * 100).toFixed(1) : 0,
    };
  }

  function wpm(words, durationSec) {
    if (!durationSec || durationSec <= 0) return null;
    return Math.round(words / (durationSec / 60));
  }

  // 녹음 오디오에서 길이·휴지 측정
  async function analyzeAudio(blob) {
    if (!blob) return null;
    var Ctx = global.AudioContext || global.webkitAudioContext;
    if (!Ctx) return null;
    var ctx = new Ctx();
    try {
      var arr = await blob.arrayBuffer();
      var audio = await ctx.decodeAudioData(arr);
      var data = audio.getChannelData(0);
      var sr = audio.sampleRate;
      var dur = audio.duration;

      var win = Math.max(1, Math.floor(sr * 0.05)); // 50ms
      var threshold = 0.015;  // 무음 진폭(RMS) 기준
      var minPause = 0.4;     // 0.4초 이상이면 '휴지'로 카운트

      var silentRun = 0, pauseCount = 0, pauseSec = 0, speakSec = 0;
      for (var i = 0; i < data.length; i += win) {
        var sum = 0, n = 0;
        for (var j = i; j < i + win && j < data.length; j++) { sum += data[j] * data[j]; n++; }
        var rms = Math.sqrt(sum / (n || 1));
        var sec = n / sr;
        if (rms < threshold) {
          silentRun += sec;
        } else {
          speakSec += sec;
          if (silentRun >= minPause) { pauseCount++; pauseSec += silentRun; }
          silentRun = 0;
        }
      }
      if (silentRun >= minPause) { pauseCount++; pauseSec += silentRun; }

      return {
        durationSec: +dur.toFixed(1),
        speakSec: +speakSec.toFixed(1),
        pauseCount: pauseCount,
        pauseSec: +pauseSec.toFixed(1),
      };
    } catch (e) {
      return null;
    } finally {
      try { ctx.close(); } catch (e) {}
    }
  }

  // 전사 + (선택)오디오 → 통합 분석
  async function analyze(transcript, blob) {
    var t = analyzeText(transcript);
    var out = {
      words: t.words, fillers: t.fillers, fillerTotal: t.fillerTotal, fillerRatio: t.fillerRatio,
      wpm: null, durationSec: null, pauseCount: null, pauseSec: null,
    };
    if (blob) {
      var au = await analyzeAudio(blob);
      if (au) {
        out.durationSec = au.durationSec;
        out.pauseCount = au.pauseCount;
        out.pauseSec = au.pauseSec;
        out.wpm = wpm(t.words, au.durationSec);
      }
    }
    return out;
  }

  // 정성 코멘트
  function wpmNote(w) {
    if (w == null) return "";
    if (w < 90) return "조금 느린 편 — 조금 더 매끄럽게";
    if (w <= 150) return "적절한 속도 👍";
    return "다소 빠른 편 — 또박또박";
  }
  function fillerNote(ratio) {
    if (ratio <= 3) return "군더더기 적음 👍";
    if (ratio <= 7) return "보통";
    return "군더더기 잦음 — 줄여보기";
  }

  global.Analyzer = {
    analyzeText: analyzeText,
    analyzeAudio: analyzeAudio,
    analyze: analyze,
    wpm: wpm,
    wpmNote: wpmNote,
    fillerNote: fillerNote,
  };
})(window);
