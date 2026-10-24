(() => {
  'use strict';
  const cfg = window.URNA_CONFIG || {};
  const base = (cfg.supabaseUrl || '').replace(/\/$/, '');
  // Administrador: só nesta aba. Aparelho e pedido: persistentes neste navegador.
  const slots = { admin: 'sessionStorage', station: 'localStorage', pending: 'localStorage' };
  const memory = {};
  const read = key => { try { return window[slots[key]].getItem('urna8.' + key) || ''; } catch { return memory[key] || ''; } };
  const write = (key, value) => {
    memory[key] = value;
    try { if (value) window[slots[key]].setItem('urna8.' + key, value); else window[slots[key]].removeItem('urna8.' + key); } catch { /* modo privado: sessão apenas em memória */ }
  };
  const ready = /^https:\/\/[a-z0-9-]+\.supabase\.co$/.test(base);
  const request = async (path, body) => {
    if (!ready) return { s: 503, e: 'A urna ainda não foi configurada. Siga o arquivo LEIA-ME da versão 8.0.' };
    const headers = { 'content-type': 'application/json' };
    for (const key of Object.keys(slots)) { const value = read(key); if (value) headers['x-urna-' + key] = value; }
    try {
      const response = await fetch(base + '/functions/v1/urna/' + path, {
        method: body ? 'POST' : 'GET', headers, body: body ? JSON.stringify(body) : undefined,
        credentials: 'omit', cache: 'no-store', signal: AbortSignal.timeout(20000)
      });
      const data = await response.json();
      for (const key of Object.keys(slots)) if (data[key + 'Token']) write(key, data[key + 'Token']);
      if (data.clearAdmin || (response.status === 401 && path === 'a')) write('admin', '');
      if (data.clearPending) write('pending', '');
      if (response.status === 403 && path === 'vote') write('station', '');
      return { ...data, s: response.status };
    } catch { return { s: 0, e: 'Sem confirmação do servidor. Confira a conexão e tente novamente.' }; }
  };
  window.UrnaCloud = Object.freeze({ request });
})();
