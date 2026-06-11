/* =========================================================
   db.js — IndexedDB 녹음 저장소
   localStorage엔 못 넣는 오디오 Blob을 보관한다.
   audioId(string) ↔ Blob. 외부 전송 없음(브라우저 로컬).
   ========================================================= */
(function (global) {
  "use strict";

  var DB_NAME = "opic-db";
  var STORE = "recordings";
  var VERSION = 1;
  var _db = null;

  function open() {
    if (_db) return Promise.resolve(_db);
    return new Promise(function (resolve, reject) {
      if (!global.indexedDB) { reject(new Error("IndexedDB 미지원")); return; }
      var req = indexedDB.open(DB_NAME, VERSION);
      req.onupgradeneeded = function (e) {
        var db = e.target.result;
        if (!db.objectStoreNames.contains(STORE)) db.createObjectStore(STORE);
      };
      req.onsuccess = function () { _db = req.result; resolve(_db); };
      req.onerror = function () { reject(req.error || new Error("DB 열기 실패")); };
    });
  }

  function tx(mode) {
    return open().then(function (db) {
      return db.transaction(STORE, mode).objectStore(STORE);
    });
  }

  // 간단한 고유 id (Date/random 의존 없이)
  var _seq = 0;
  function newId() {
    _seq += 1;
    return "rec_" + _seq + "_" + (global.performance ? Math.floor(performance.now()) : _seq);
  }

  function put(blob, id) {
    id = id || newId();
    return tx("readwrite").then(function (store) {
      return new Promise(function (resolve, reject) {
        var r = store.put(blob, id);
        r.onsuccess = function () { resolve(id); };
        r.onerror = function () { reject(r.error); };
      });
    });
  }

  function get(id) {
    if (!id) return Promise.resolve(null);
    return tx("readonly").then(function (store) {
      return new Promise(function (resolve, reject) {
        var r = store.get(id);
        r.onsuccess = function () { resolve(r.result || null); };
        r.onerror = function () { reject(r.error); };
      });
    });
  }

  function remove(id) {
    if (!id) return Promise.resolve();
    return tx("readwrite").then(function (store) {
      return new Promise(function (resolve) {
        var r = store.delete(id);
        r.onsuccess = function () { resolve(); };
        r.onerror = function () { resolve(); };
      });
    });
  }

  function clearAll() {
    return tx("readwrite").then(function (store) {
      return new Promise(function (resolve) {
        var r = store.clear();
        r.onsuccess = function () { resolve(); };
        r.onerror = function () { resolve(); };
      });
    });
  }

  function supported() { return !!global.indexedDB; }

  global.RecDB = {
    put: put, get: get, remove: remove, clearAll: clearAll,
    newId: newId, supported: supported,
  };
})(window);
