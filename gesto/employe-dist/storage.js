/* Stockage. Même forme pour un futur adaptateur Supabase : load() et save(state).
   Cette version ne fait aucun appel réseau. */
/* Remplacement prévu : un adaptateur Supabase avec les mêmes load() et save().
   Aucun appel réseau ici. */
(function () {
  function createLocalStore(key) {
    return {
      name: "local",
      load() {
        try { return JSON.parse(localStorage.getItem(key) || "null"); }
        catch { return null; }
      },
      save(value) { localStorage.setItem(key, JSON.stringify(value)); },
    };
  }
  window.GestoStorage = { createLocalStore };
})();
