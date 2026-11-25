/* Penyimpanan untuk mode demo: antarmuka sama dengan store Google Sheets (all, append, update, remove).
   Data disimpan di localStorage perangkat ini. Dipakai oleh LakuCore. */
(function (root) {
  'use strict';
  function LocalStore(storage, key) {
    key = key || 'laku.localdb.v1';
    var db = null;
    function load() {
      if (db) return db;
      try { db = JSON.parse(storage.getItem(key)); } catch (e) { db = null; }
      if (!db || typeof db !== 'object') db = {};
      Object.keys(root.LakuCore.TABLES).forEach(function (t) { if (!Array.isArray(db[t])) db[t] = []; });
      return db;
    }
    function flush() { try { storage.setItem(key, JSON.stringify(db)); } catch (e) { throw new Error('Penyimpanan perangkat penuh'); } }
    return {
      all: function (t) { return load()[t].map(function (r) { return Object.assign({}, r); }); },
      append: function (t, rows) { if (!rows.length) return; var d = load(); rows.forEach(function (r) { d[t].push(Object.assign({}, r)); }); flush(); },
      update: function (t, pred, fn) { var d = load(), ch = false; d[t].forEach(function (r) { if (pred(r)) { fn(r); ch = true; } }); if (ch) flush(); },
      remove: function (t, pred) { var d = load(), n = d[t].length; d[t] = d[t].filter(function (r) { return !pred(r); }); if (d[t].length !== n) flush(); }
    };
  }
  root.LakuLocalStore = LocalStore;
})(typeof self !== 'undefined' ? self : this);
