/* =========================================================
   speech.js — 녹음 + STT (Web Speech API)
   ---------------------------------------------------------
   - MediaRecorder: 마이크 오디오를 Blob으로 저장 → "다시 듣기"
   - SpeechRecognition: 실시간 영어 전사 (Chrome/Edge)
   둘을 동시에 돌려, 오디오와 전사를 함께 얻는다.
   STT 미지원 브라우저에서도 녹음/재생은 동작.
   ========================================================= */
(function (global) {
  "use strict";

  var SR = global.SpeechRecognition || global.webkitSpeechRecognition || null;

  function sttSupported() { return !!SR; }
  function recordSupported() {
    return !!(global.navigator && navigator.mediaDevices &&
              navigator.mediaDevices.getUserMedia && global.MediaRecorder);
  }

  function pickMime() {
    var cands = ["audio/webm;codecs=opus", "audio/webm", "audio/mp4", "audio/ogg"];
    if (!global.MediaRecorder || !MediaRecorder.isTypeSupported) return "";
    for (var i = 0; i < cands.length; i++) {
      if (MediaRecorder.isTypeSupported(cands[i])) return cands[i];
    }
    return "";
  }

  /**
   * 녹음+전사 세션 생성
   * opts: { onInterim(finalText, interimText), onError(code) }
   * 반환: { start(): Promise<void>, stop(): Promise<{blob,url,transcript}> }
   */
  function createSession(opts) {
    opts = opts || {};
    var onInterim = opts.onInterim || function () {};
    var onError = opts.onError || function () {};

    var stream = null, recorder = null, chunks = [], recognition = null;
    var finalText = "", interimText = "";
    var stopping = false;

    async function start() {
      stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      chunks = [];
      var mime = pickMime();
      recorder = new MediaRecorder(stream, mime ? { mimeType: mime } : undefined);
      recorder.ondataavailable = function (e) {
        if (e.data && e.data.size > 0) chunks.push(e.data);
      };
      recorder.start();

      if (SR) {
        recognition = new SR();
        recognition.lang = "en-US";
        recognition.continuous = true;
        recognition.interimResults = true;
        recognition.onresult = function (ev) {
          interimText = "";
          for (var i = ev.resultIndex; i < ev.results.length; i++) {
            var res = ev.results[i];
            if (res.isFinal) finalText += res[0].transcript + " ";
            else interimText += res[0].transcript;
          }
          onInterim(finalText, interimText);
        };
        recognition.onerror = function (e) {
          // no-speech/aborted 는 정상 흐름 → 무시
          if (e && e.error && e.error !== "no-speech" && e.error !== "aborted") {
            onError(e.error);
          }
        };
        // 길게 말하면 엔진이 자동 종료되므로, 멈추기 전까지 재시작
        recognition.onend = function () {
          if (!stopping) { try { recognition.start(); } catch (e) {} }
        };
        try { recognition.start(); } catch (e) {}
      }
    }

    function stop() {
      return new Promise(function (resolve) {
        stopping = true;
        if (recognition) { try { recognition.stop(); } catch (e) {} }

        function done() {
          var type = (recorder && recorder.mimeType) || "audio/webm";
          var blob = chunks.length ? new Blob(chunks, { type: type }) : null;
          releaseStream();
          resolve({
            blob: blob,
            url: blob ? URL.createObjectURL(blob) : null,
            transcript: (finalText + interimText).trim(),
          });
        }

        if (recorder && recorder.state !== "inactive") {
          recorder.onstop = done;
          try { recorder.stop(); } catch (e) { done(); }
        } else {
          done();
        }
      });
    }

    function releaseStream() {
      if (stream) {
        stream.getTracks().forEach(function (t) { t.stop(); });
        stream = null;
      }
    }

    return { start: start, stop: stop };
  }

  global.Speech = {
    createSession: createSession,
    sttSupported: sttSupported,
    recordSupported: recordSupported,
  };
})(window);
