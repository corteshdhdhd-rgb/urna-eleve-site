(() => {
  'use strict';
  let pending = null;
  try { pending = JSON.parse(sessionStorage.getItem('urna8.vote') || 'null'); } catch { /* armazenamento indisponível */ }
  if (pending && (!pending.requestId || !pending.round || typeof pending.k !== 'string')) pending = null;
  const save = () => {
    try { if (pending) sessionStorage.setItem('urna8.vote', JSON.stringify(pending)); else sessionStorage.removeItem('urna8.vote'); } catch { /* mantém em memória */ }
  };
  window.UrnaVotes = Object.freeze({
    hasPending: () => !!pending,
    async send(k, round) {
      if (!pending) { pending = { k, round, requestId: crypto.randomUUID() }; save(); }
      const result = await window.UrnaCloud.request('vote', pending);
      // Em erro de conexão, limite ou falha no servidor, repetir usa o MESMO identificador.
      const uncertain = result.s === 0 || result.s === 429 || result.s >= 500;
      if (!uncertain) { pending = null; save(); }
      return { ...result, uncertain };
    }
  });
})();
