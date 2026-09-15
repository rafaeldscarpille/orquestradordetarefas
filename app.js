(function () {
  'use strict';

  const STORAGE_KEY = 'marketingPlannerDashboard_v2';

  const PLANNER_COLORS = ['#4D8DF6', '#10B981', '#F97316', '#8B5CF6', '#EC4899', '#06B6D4', '#F59E0B', '#EF4444'];

  const COLORS = {
    primary: '#4D8DF6',
    success: '#10B981',
    warning: '#F97316',
    error: '#EF4444',
    muted: '#9CA3AF',
  };

  /* ============================================================
     Estado global
     ============================================================ */
  const state = {
    planners: [],          // [{id, name, tasks, addedAt, color}]
    activePlannerId: null,
    filters: {},
    activeTab: 'metrics',
    sidebarExpanded: false,
    ganttExpanded: new Set(),
    cardExpandedIds: new Set(),
    sortBy: 'due_date',
    sortOrder: 'asc',
    cardsVisibleCount: 24,
    charts: {},
    compareCharts: {},
    pendingImport: null,   // { fileName, headers, rows, mapping }
    editingPlannerId: null,
    editingPlannerColor: null,
    editingAdjustmentId: null,
    editingUserId: null,
  };

  let plannerUploadMessage = null;

  /* ============================================================
     Ícones (SVG inline, estilo lucide)
     ============================================================ */
  const ICONS = {
    chevronDown: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="6 9 12 15 18 9"/></svg>',
    chevronUp: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="18 15 12 9 6 15"/></svg>',
    x: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>',
    alertCircle: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>',
    checkCircle: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>',
    clock: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>',
    users: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>',
    trendingUp: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="23 6 13.5 15.5 8.5 10.5 1 18"/><polyline points="17 6 23 6 23 12"/></svg>',
    upload: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>',
    calendar: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>',
    flag: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z"/><line x1="4" y1="22" x2="4" y2="15"/></svg>',
    trash: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/><path d="M10 11v6"/><path d="M14 11v6"/><path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/></svg>',
    wand: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M15 4V2m0 14v-2M8 9h2M20 9h2M17.8 11.8L19 13m-1.2-9.8L19 2M13 21l7-7m-11.5-1.5L3 18l3 3 5.5-5.5"/></svg>',
    pencil: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M17 3a2.85 2.85 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5z"/></svg>',
  };

  /* ============================================================
     Helpers gerais
     ============================================================ */
  function genId() {
    return 'pln_' + Date.now().toString(36) + '_' + Math.random().toString(36).slice(2, 8);
  }

  function normalizeStr(s) {
    return String(s ?? '')
      .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
      .toLowerCase()
      .trim();
  }

  function colorFromString(str) {
    let hash = 0;
    const s = String(str || '');
    for (let i = 0; i < s.length; i++) hash = s.charCodeAt(i) + ((hash << 5) - hash);
    const hue = Math.abs(hash) % 360;
    return `hsl(${hue}, 55%, 46%)`;
  }

  function escapeHtml(str) {
    return String(str ?? '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  function strOrDefault(val, def) {
    if (val === undefined || val === null) return def;
    const s = String(val).trim();
    return s === '' ? def : s;
  }

  /* ============================================================
     Datas — parser robusto (Excel date, ISO, dd/mm/yyyy)
     ============================================================ */
  function parseAnyDate(value) {
    if (value === null || value === undefined || value === '') return null;
    if (value instanceof Date) return isNaN(value.getTime()) ? null : value;

    if (typeof value === 'number') {
      try {
        if (window.XLSX && XLSX.SSF && XLSX.SSF.parse_date_code) {
          const d = XLSX.SSF.parse_date_code(value);
          if (d) return new Date(d.y, (d.m || 1) - 1, d.d || 1, d.H || 0, d.M || 0, d.S || 0);
        }
      } catch {}
      return null;
    }

    const str = String(value).trim();
    if (!str) return null;

    // yyyy-mm-dd (input type=date) — interpretar como data LOCAL, não UTC
    const iso = str.match(/^(\d{4})-(\d{2})-(\d{2})$/);
    if (iso) {
      const dt = new Date(+iso[1], +iso[2] - 1, +iso[3]);
      return isNaN(dt.getTime()) ? null : dt;
    }

    // dd/mm/yyyy ou dd-mm-yyyy (padrão brasileiro)
    const m = str.match(/^(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{2,4})$/);
    if (m) {
      let [, d, mo, y] = m;
      if (y.length === 2) y = '20' + y;
      const day = +d, month = +mo, year = +y;
      if (month >= 1 && month <= 12 && day >= 1 && day <= 31) {
        const dt = new Date(year, month - 1, day);
        if (!isNaN(dt.getTime())) return dt;
      }
    }

    const dt2 = new Date(str);
    if (!isNaN(dt2.getTime())) return dt2;
    return null;
  }

  function parseDate(str) { return parseAnyDate(str); }

  function formatDate(dateStr) {
    const d = parseDate(dateStr);
    return d ? d.toLocaleDateString('pt-BR') : '—';
  }

  function getDaysUntilDue(dateStr) {
    const due = parseDate(dateStr);
    if (!due) return '—';
    const today = new Date();
    const diff = Math.ceil((due.getTime() - today.getTime()) / 86400000);
    if (diff < 0) return `${Math.abs(diff)}d atrasado`;
    if (diff === 0) return 'Vence hoje';
    if (diff === 1) return 'Amanhã';
    return `${diff}d`;
  }

  function durationLabel(task) {
    const s = parseDate(task.start_date);
    const d = parseDate(task.due_date);
    if (!s || !d) return '—';
    const days = Math.round((d.getTime() - s.getTime()) / 86400000);
    return days >= 0 ? `${days} dia${days !== 1 ? 's' : ''}` : '—';
  }

  // Diferença em dias inteiros entre duas datas (normalizadas à meia-noite local)
  function dayDiff(from, to) {
    const a = new Date(from.getFullYear(), from.getMonth(), from.getDate());
    const b = new Date(to.getFullYear(), to.getMonth(), to.getDate());
    return Math.round((b.getTime() - a.getTime()) / 86400000);
  }

  /* ============================================================
     Status / Prioridade — normalização e cores
     ============================================================ */
  function normalizeStatusGroup(rawStatus) {
    const s = normalizeStr(rawStatus);
    if (!s) return 'notStarted';
    if (/(conclu|complet|done|finaliz|fechad|closed|entregue)/.test(s)) return 'completed';
    if (/(andamento|progress|doing|execu|ativ|active|em curso|working)/.test(s)) return 'inProgress';
    if (/(nao inici|not started|to ?do|pendente|backlog|novo|new|aguardando|planejad)/.test(s)) return 'notStarted';
    return 'other';
  }

  function getStatusColor(task) {
    switch (task.statusGroup) {
      case 'completed': return COLORS.success;
      case 'inProgress': return COLORS.primary;
      case 'notStarted': return COLORS.muted;
      default: return colorFromString(task.status);
    }
  }

  function groupColor(group, fallbackName) {
    switch (group) {
      case 'completed': return COLORS.success;
      case 'inProgress': return COLORS.primary;
      case 'notStarted': return COLORS.muted;
      default: return colorFromString(fallbackName);
    }
  }

  function getPriorityColor(priority) {
    const s = normalizeStr(priority);
    if (/(alta|high|urgent|crit)/.test(s)) return COLORS.warning;
    if (/(media|medium|normal)/.test(s)) return COLORS.primary;
    if (/(baixa|low)/.test(s)) return COLORS.success;
    return colorFromString(priority);
  }

  function isOverdue(task) {
    if (task.statusGroup === 'completed') return false;
    if (!task.due_date) return false;
    const d = parseDate(task.due_date);
    return d ? d < new Date() : false;
  }

  /* ============================================================
     Normalização de tarefas (garante formato consistente)
     ============================================================ */
  function normalizeExistingTask(t) {
    t = t || {};
    const statusText = strOrDefault(t.status, 'Não informado');
    const statusGroup = normalizeStatusGroup(statusText);
    return {
      id: t.id != null ? String(t.id) : genId(),
      name: strOrDefault(t.name, 'Sem nome'),
      category: strOrDefault(t.category, 'Sem categoria'),
      status: statusText,
      statusGroup,
      priority: strOrDefault(t.priority, 'Média'),
      assignees: Array.isArray(t.assignees) ? t.assignees : [],
      taskType: strOrDefault(t.taskType, ''),
      client: strOrDefault(t.client, ''),
      created_at: t.created_at || null,
      due_date: t.due_date || null,
      start_date: t.start_date || null,
      completed_at: t.completed_at || null,
      progress: typeof t.progress === 'number' ? t.progress : (statusGroup === 'completed' ? 100 : 0),
      labels: strOrDefault(t.labels, ''),
      notes: strOrDefault(t.notes, ''),
    };
  }

  /* ============================================================
     Persistência (localStorage + Firebase) — isolada por usuário:
     cada usuário enxerga somente os próprios arquivos/planners.
     ============================================================ */
  function storageKey() {
    return auth.user ? `${STORAGE_KEY}:${auth.user.id}` : null;
  }

  function writeLocal() {
    const key = storageKey();
    if (!key) return; // anônimo não possui espaço de dados
    try {
      localStorage.setItem(key, JSON.stringify({
        planners: state.planners,
        activePlannerId: state.activePlannerId,
      }));
    } catch (e) {
      console.warn('Não foi possível salvar localmente (armazenamento cheio).', e);
    }
  }

  function saveToStorage() {
    writeLocal();
    scheduleCloudSave();
  }

  function loadFromStorage() {
    const key = storageKey();
    if (!key) return null;
    try {
      const raw = localStorage.getItem(key);
      if (!raw) return null;
      return JSON.parse(raw);
    } catch (e) {
      console.warn('Falha ao ler dados salvos.', e);
      return null;
    }
  }

  /* ============================================================
     Sincronização com Firebase (Firestore)
     - Cada planner vira um documento em "planners/{id}";
       as tarefas são gravadas em blocos JSON na subcoleção "chunks"
       para respeitar o limite de 1MB por documento.
     ============================================================ */
  const CHUNK_CHAR_LIMIT = 500000;

  const cloud = {
    db: null,
    fingerprints: {},      // plannerId -> hash do que já está na nuvem
    remoteStamps: {},      // plannerId -> updatedAt visto na nuvem (realtime)
    metaFingerprint: null,
    saveTimer: null,
    saving: false,
    pendingResave: false,
  };

  function cloudInit() {
    cloud.db = window.FIREBASE_DB || null;
    if (!cloud.db) setSyncStatus('local');
  }

  function setSyncStatus(status) {
    const el = document.getElementById('syncStatus');
    if (!el) return;
    const map = {
      syncing: { text: 'Sincronizando...', cls: 'syncing' },
      synced: { text: 'Salvo na nuvem', cls: 'synced' },
      error: { text: 'Erro ao sincronizar', cls: 'error' },
      local: { text: 'Somente local', cls: 'local' },
      readonly: { text: 'Somente leitura', cls: 'local' },
    };
    const s = map[status] || map.local;
    el.className = 'sync-status ' + s.cls;
    const txt = el.querySelector('.sync-status__text');
    if (txt) txt.textContent = s.text;
  }

  function simpleHash(str) {
    let h = 0;
    for (let i = 0; i < str.length; i++) h = (h * 31 + str.charCodeAt(i)) | 0;
    return h + ':' + str.length;
  }

  function plannerFingerprint(p) {
    return simpleHash(JSON.stringify({ n: p.name, c: p.color, a: p.addedAt, t: p.tasks, j: p.adjustments || [] }));
  }

  function chunkTasksJson(tasks) {
    const chunks = [];
    let current = [];
    let size = 2;
    tasks.forEach(t => {
      const s = JSON.stringify(t);
      if (current.length && size + s.length > CHUNK_CHAR_LIMIT) {
        chunks.push(JSON.stringify(current));
        current = [];
        size = 2;
      }
      current.push(t);
      size += s.length + 1;
    });
    chunks.push(JSON.stringify(current));
    return chunks;
  }

  function scheduleCloudSave() {
    if (!cloud.db) return;
    // Autorização na camada de persistência: perfis sem escrita nunca enviam nada à nuvem
    if (!can('cloudWrite')) { setSyncStatus('readonly'); return; }
    clearTimeout(cloud.saveTimer);
    setSyncStatus('syncing');
    cloud.saveTimer = setTimeout(saveToCloud, 1200);
  }

  async function saveToCloud() {
    if (!cloud.db) return;
    if (!can('cloudWrite') || !auth.user) return;
    cloud.saveTimer = null;
    if (cloud.saving) { cloud.pendingResave = true; return; }
    cloud.saving = true;
    setSyncStatus('syncing');
    try {
      const db = cloud.db;
      const uid = auth.user.id;
      // Isolamento: opera SOMENTE sobre os planners do próprio usuário
      const existing = await db.collection('planners').where('ownerId', '==', uid).get();
      const keepIds = new Set(state.planners.map(p => p.id));

      // Remove da nuvem planners excluídos localmente (apenas os do usuário)
      for (const doc of existing.docs) {
        if (keepIds.has(doc.id)) continue;
        const chunksSnap = await doc.ref.collection('chunks').get();
        const batch = db.batch();
        chunksSnap.docs.forEach(c => batch.delete(c.ref));
        batch.delete(doc.ref);
        await batch.commit();
        delete cloud.fingerprints[doc.id];
      }

      // Grava apenas planners novos ou alterados
      for (const p of state.planners) {
        if (p.ownerId && p.ownerId !== uid) continue; // nunca escreve sobre arquivos de outro usuário
        const fp = plannerFingerprint(p);
        if (cloud.fingerprints[p.id] === fp) continue;

        const ref = db.collection('planners').doc(p.id);
        const prevDoc = existing.docs.find(d => d.id === p.id);
        const prevChunkCount = prevDoc ? (prevDoc.data().chunkCount || 0) : 0;
        const chunks = chunkTasksJson(p.tasks);

        const stamp = new Date().toISOString();
        const batch = db.batch();
        batch.set(ref, {
          name: p.name,
          color: p.color || null,
          addedAt: p.addedAt || null,
          taskCount: p.tasks.length,
          chunkCount: chunks.length,
          adjustmentsJson: JSON.stringify(p.adjustments || []),
          ownerId: uid,
          ownerUsername: auth.user.username,
          fileName: p.fileName || p.name,
          importedBy: p.importedBy || auth.user.fullName || auth.user.username,
          version: p.version || 1,
          updatedAt: stamp,
        });
        chunks.forEach((json, i) => batch.set(ref.collection('chunks').doc('c' + i), { json }));
        for (let i = chunks.length; i < prevChunkCount; i++) {
          batch.delete(ref.collection('chunks').doc('c' + i));
        }
        await batch.commit();
        cloud.fingerprints[p.id] = fp;
        cloud.remoteStamps[p.id] = stamp; // evita reprocessar o próprio eco do listener
      }

      setSyncStatus('synced');
    } catch (e) {
      console.warn('Falha ao sincronizar com o Firebase.', e);
      setSyncStatus('error');
    } finally {
      cloud.saving = false;
      if (cloud.pendingResave) {
        cloud.pendingResave = false;
        scheduleCloudSave();
      }
    }
  }

  function plannerFromDoc(doc, chunksSnap) {
    const d = doc.data();
    const ordered = chunksSnap.docs.slice().sort((a, b) => parseInt(a.id.slice(1), 10) - parseInt(b.id.slice(1), 10));
    let tasks = [];
    ordered.forEach(c => {
      try { tasks = tasks.concat(JSON.parse(c.data().json || '[]')); } catch (e) {}
    });
    let adjustments = [];
    try { adjustments = JSON.parse(d.adjustmentsJson || '[]'); } catch (e) {}
    return {
      id: doc.id,
      name: d.name || 'Planner',
      color: d.color || PLANNER_COLORS[0],
      addedAt: d.addedAt || null,
      ownerId: d.ownerId || null,
      ownerUsername: d.ownerUsername || null,
      fileName: d.fileName || d.name || null,
      importedBy: d.importedBy || null,
      version: d.version || 1,
      tasks: tasks.map(normalizeExistingTask),
      adjustments: Array.isArray(adjustments) ? adjustments : [],
    };
  }

  // Carrega SOMENTE os planners do usuário autenticado
  async function loadUserPlanners(uid) {
    if (!cloud.db) return null;
    const plannersSnap = await cloud.db.collection('planners').where('ownerId', '==', uid).get();
    if (plannersSnap.empty) return [];

    const planners = [];
    for (const doc of plannersSnap.docs) {
      cloud.remoteStamps[doc.id] = doc.data().updatedAt || '';
      const chunksSnap = await doc.ref.collection('chunks').get();
      planners.push(plannerFromDoc(doc, chunksSnap));
    }
    planners.sort((a, b) => String(a.addedAt || '').localeCompare(String(b.addedAt || '')));
    return planners;
  }

  /* ============================================================
     Realtime: planners DO USUÁRIO em outras sessões (mesmo usuário em
     outro computador). Nossos próprios saves são ignorados via remoteStamps.
     ============================================================ */
  let plannersUnsub = null;
  let plannersPollTimer = null;

  function subscribePlanners() {
    if (plannersUnsub) { try { plannersUnsub(); } catch (e) {} plannersUnsub = null; }
    clearInterval(plannersPollTimer);
    if (!cloud.db || !auth.user) return;
    plannersUnsub = cloud.db.collection('planners').where('ownerId', '==', auth.user.id).onSnapshot(snap => {
      if (snap.metadata.hasPendingWrites) return;
      queueRemoteApply();
    }, err => console.warn('Listener de planners indisponível.', err));
    // Fallback: redes/proxies que bloqueiam o canal de push do Firestore
    plannersPollTimer = setInterval(queueRemoteApply, 30000);
  }

  let remoteApplyTimer = null;
  // Com save local em andamento, adia (nunca descarta) a reconciliação remota
  function queueRemoteApply() {
    clearTimeout(remoteApplyTimer);
    if (cloud.saving || cloud.saveTimer) {
      remoteApplyTimer = setTimeout(queueRemoteApply, 1200);
      return;
    }
    applyRemotePlanners();
  }

  async function applyRemotePlanners() {
    if (!cloud.db || !auth.user) return;
    try {
      const uid = auth.user.id;
      const snap = await cloud.db.collection('planners').where('ownerId', '==', uid).get();
      if (!auth.user || auth.user.id !== uid) return; // usuário trocou durante o fetch
      if (cloud.saving || cloud.saveTimer) { queueRemoteApply(); return; }
      const seen = new Set();
      const changed = [];
      snap.docs.forEach(doc => {
        seen.add(doc.id);
        if (cloud.remoteStamps[doc.id] !== (doc.data().updatedAt || '')) changed.push(doc);
      });
      const removedIds = state.planners.filter(p => !seen.has(p.id)).map(p => p.id);
      if (!changed.length && !removedIds.length) return;

      for (const doc of changed) {
        const chunksSnap = await doc.ref.collection('chunks').get();
        const planner = plannerFromDoc(doc, chunksSnap);
        const idx = state.planners.findIndex(p => p.id === doc.id);
        if (idx >= 0) state.planners[idx] = planner;
        else state.planners.push(planner);
        cloud.remoteStamps[doc.id] = doc.data().updatedAt || '';
        cloud.fingerprints[doc.id] = plannerFingerprint(planner);
      }
      if (removedIds.length) {
        state.planners = state.planners.filter(p => !removedIds.includes(p.id));
        removedIds.forEach(id => { delete cloud.remoteStamps[id]; delete cloud.fingerprints[id]; });
      }
      if (state.planners.length && !state.planners.find(p => p.id === state.activePlannerId)) {
        state.activePlannerId = state.planners[0].id;
      }
      writeLocal();
      populatePlannerSwitcher();
      renderAll();
    } catch (e) {
      console.warn('Falha ao aplicar atualização em tempo real.', e);
    }
  }

  /* ============================================================
     Usuários, autenticação e perfis de acesso
     - Autenticação: sessão local (apenas userId) validada contra a
       coleção "users" do Firestore (fonte da verdade, em tempo real).
     - Autorização: mapa central PERMISSIONS consultado pela UI E
       pela camada de persistência (não basta esconder botões).
     ============================================================ */
  const SESSION_KEY = 'orquestradorSession_v1';
  const USERS_CACHE_KEY = 'orquestradorUsersCache_v1';

  const ROLE_DEFS = {
    admin: { label: 'Admin', color: '#8B5CF6' },
    editor: { label: 'Editor', color: '#4D8DF6' },
    viewer: { label: 'Visualizador', color: '#10B981' },
  };

  const PERMISSIONS = {
    // managePlanners/cloudWrite valem apenas para o PRÓPRIO espaço de arquivos do usuário
    admin: { manageUsers: true, managePlanners: true, createAdjustments: true, deleteAdjustments: true, cloudWrite: true },
    editor: { manageUsers: false, managePlanners: true, createAdjustments: true, deleteAdjustments: false, cloudWrite: true },
    viewer: { manageUsers: false, managePlanners: true, createAdjustments: false, deleteAdjustments: false, cloudWrite: true },
  };

  const auth = {
    user: null,          // sessão atual {id, username, fullName, area, role, active}
    users: [],           // coleção "users" sincronizada em tempo real
    loaded: false,
    pendingUserId: null, // sessão persistida aguardando validação na nuvem
  };

  function can(action) {
    if (!auth.user) return false;
    const p = PERMISSIONS[auth.user.role];
    return !!(p && p[action]);
  }

  function isAdmin() { return !!auth.user && auth.user.role === 'admin'; }

  function normalizeUsername(u) { return normalizeStr(u).replace(/\s+/g, ''); }

  /* ============================================================
     Senhas — PBKDF2-SHA256 via WebCrypto. Nunca em texto puro:
     o banco guarda somente {salt, iterations, hash}.
     ============================================================ */
  const PASS_ITERATIONS = 120000;

  // Credencial inicial de configuração do admin: apenas o HASH (a senha não existe no código)
  const BOOTSTRAP_ADMIN = {
    username: 'admin',
    salt: '20e5645d6cb5d2c90cc6f8553a4a50e5',
    hash: '0de810d80248f9699ad4d0adf37746e272a11fc48da2b6992f13ab40844d4d4c',
    iterations: 120000,
  };

  function hexToBytes(hex) {
    const out = new Uint8Array(hex.length / 2);
    for (let i = 0; i < out.length; i++) out[i] = parseInt(hex.substr(i * 2, 2), 16);
    return out;
  }

  function bytesToHex(buf) {
    return [...new Uint8Array(buf)].map(b => b.toString(16).padStart(2, '0')).join('');
  }

  async function pbkdf2Hex(password, saltHex, iterations) {
    const key = await crypto.subtle.importKey('raw', new TextEncoder().encode(password), 'PBKDF2', false, ['deriveBits']);
    const bits = await crypto.subtle.deriveBits(
      { name: 'PBKDF2', hash: 'SHA-256', salt: hexToBytes(saltHex), iterations }, key, 256);
    return bytesToHex(bits);
  }

  async function hashPassword(password) {
    const salt = bytesToHex(crypto.getRandomValues(new Uint8Array(16)));
    return { algo: 'PBKDF2-SHA256', iterations: PASS_ITERATIONS, salt, hash: await pbkdf2Hex(password, salt, PASS_ITERATIONS) };
  }

  async function verifyPassword(pass, password) {
    if (!pass || !pass.salt || !pass.hash) return false;
    try {
      return (await pbkdf2Hex(password, pass.salt, pass.iterations || PASS_ITERATIONS)) === pass.hash;
    } catch (e) { return false; }
  }

  function emailValid(email) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(String(email || '').trim());
  }

  /* Token de recuperação: temporário (30 min), uso único, armazenado só como hash */
  const TOKEN_ITERATIONS = 20000;
  const TOKEN_TTL_MS = 30 * 60000;

  function genRecoveryToken() {
    const chars = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789';
    const buf = crypto.getRandomValues(new Uint8Array(8));
    let t = '';
    for (let i = 0; i < 8; i++) {
      t += chars[buf[i] % chars.length];
      if (i === 3) t += '-';
    }
    return t;
  }

  function normalizeToken(t) { return String(t || '').replace(/[\s\-]/g, '').toUpperCase(); }

  // Emite token para o usuário (Admin) — o valor só existe no e-mail a ser enviado
  async function issueResetToken(userId) {
    if (!isAdmin()) throw new Error('Apenas administradores podem gerar tokens de recuperação.');
    const u = auth.users.find(x => x.id === userId);
    if (!u) throw new Error('Usuário não encontrado.');
    if (!emailValid(u.email)) throw new Error('O usuário precisa de um e-mail válido cadastrado.');
    const token = genRecoveryToken();
    const salt = bytesToHex(crypto.getRandomValues(new Uint8Array(16)));
    const hash = await pbkdf2Hex(normalizeToken(token), salt, TOKEN_ITERATIONS);
    await persistUserDoc({
      ...u,
      resetToken: { salt, hash, expiresAt: new Date(Date.now() + TOKEN_TTL_MS).toISOString() },
      updatedAt: new Date().toISOString(),
      updatedBy: auth.user.username,
    });
    logAudit('Token de recuperação gerado', u.username, '', `expira em 30 min · envio para ${u.email}`);
    return token;
  }

  // Resgate do token na tela de login (usuário não autenticado)
  async function redeemResetToken(username, tokenInput, novaSenha) {
    const norm = normalizeUsername(username);
    const u = auth.users.find(x => x.usernameNorm === norm);
    if (!u || !u.resetToken) throw new Error('Token inválido ou inexistente. Solicite um novo a um administrador.');
    if (u.active === false) throw new Error('Este usuário está desativado.');
    if (!emailValid(u.email)) throw new Error('Cadastre um e-mail válido antes de definir uma senha.');
    if (new Date(u.resetToken.expiresAt).getTime() < Date.now()) throw new Error('Token expirado. Solicite um novo.');
    const hash = await pbkdf2Hex(normalizeToken(tokenInput), u.resetToken.salt, TOKEN_ITERATIONS);
    if (hash !== u.resetToken.hash) throw new Error('Token inválido.');
    const user = { ...u, pass: await hashPassword(novaSenha), updatedAt: new Date().toISOString(), updatedBy: u.username };
    delete user.resetToken;    // uso único
    delete user.resetRequestedAt;
    delete user.firstAccess;
    await persistUserDoc(user);
    logAudit('Senha redefinida via token', u.username, 'Sem senha / recuperação', 'Senha cadastrada');
    return user;
  }

  /* ============================================================
     Rastreabilidade — trilha de auditoria (coleção "audit").
     Nunca registra senhas, hashes ou tokens.
     ============================================================ */
  function logAudit(action, target, before, after) {
    if (!cloud.db) return;
    const u = auth.user || {};
    cloud.db.collection('audit').add({
      atIso: new Date().toISOString(),
      userId: u.id || null,
      username: u.username || 'anônimo',
      fullName: u.fullName || '',
      role: u.role || null,
      action: String(action || ''),
      target: String(target || ''),
      before: before == null ? '' : String(before),
      after: after == null ? '' : String(after),
    }).catch(() => {});
  }

  function userIdGen() { return 'usr_' + Date.now().toString(36) + '_' + Math.random().toString(36).slice(2, 8); }

  function cacheUsers() {
    try { localStorage.setItem(USERS_CACHE_KEY, JSON.stringify(auth.users)); } catch (e) {}
  }

  function loadSession() {
    let session = null;
    try { session = JSON.parse(localStorage.getItem(SESSION_KEY)); } catch (e) {}
    if (!session || !session.userId) return;
    auth.pendingUserId = session.userId;
    // Resolve pelo cache para evitar UI anônima até a nuvem responder (revalidado no snapshot)
    try {
      const cached = JSON.parse(localStorage.getItem(USERS_CACHE_KEY)) || [];
      const u = cached.find(x => x.id === session.userId);
      if (u && u.active !== false) auth.user = u;
    } catch (e) {}
  }

  function setSession(user) {
    auth.user = user || null;
    auth.pendingUserId = user ? user.id : null;
    try {
      if (user) localStorage.setItem(SESSION_KEY, JSON.stringify({ userId: user.id }));
      else localStorage.removeItem(SESSION_KEY);
    } catch (e) {}
  }

  // Reação em tempo real a mudanças no próprio usuário (desativação, troca de perfil).
  // Só derruba a sessão com dado confirmado pelo servidor — nunca por cache/erro transitório.
  function revalidateSession(serverConfirmed) {
    const targetId = auth.user ? auth.user.id : auth.pendingUserId;
    if (!targetId) return;
    const fresh = auth.users.find(u => u.id === targetId);
    if (!fresh) {
      if (serverConfirmed && auth.user) {
        setSession(null);
        switchUserContext().then(() => applyAccessUI());
        alert('Seu acesso foi removido por um administrador.');
      }
      return;
    }
    if (fresh.active === false) {
      if (auth.user) {
        setSession(null);
        switchUserContext().then(() => applyAccessUI());
        alert('Seu acesso foi desativado por um administrador.');
      } else {
        auth.pendingUserId = null;
      }
      return;
    }
    const roleChanged = !auth.user || auth.user.role !== fresh.role;
    auth.user = fresh;
    if (roleChanged) applyAccessUI();
    else renderUserArea();
  }

  let lastUsersJson = null;
  let adminEnsured = false;

  // Garante que a conta "admin" exista com a credencial inicial (só o hash — a senha nunca aparece)
  async function ensureAdminAccount() {
    if (adminEnsured || !cloud.db || !auth.loaded) return;
    if (auth.users.some(u => u.usernameNorm === BOOTSTRAP_ADMIN.username)) { adminEnsured = true; return; }
    adminEnsured = true;
    const nowIso = new Date().toISOString();
    try {
      await persistUserDoc({
        id: 'usr_admin', // id fixo: criação idempotente entre sessões simultâneas
        username: 'admin',
        usernameNorm: 'admin',
        fullName: 'Administrador',
        area: '',
        email: '',
        role: 'admin',
        active: true,
        pass: { algo: 'PBKDF2-SHA256', iterations: BOOTSTRAP_ADMIN.iterations, salt: BOOTSTRAP_ADMIN.salt, hash: BOOTSTRAP_ADMIN.hash },
        firstAccess: true,
        createdAt: nowIso,
        createdBy: 'credencial inicial de configuração',
        updatedAt: nowIso,
      });
      renderUserArea();
      if (state.activeTab === 'admin') renderAdminTab();
    } catch (e) {
      adminEnsured = false;
      console.warn('Não foi possível provisionar a conta admin inicial.', e);
    }
  }

  function processUsersSnapshot(snap, serverConfirmed) {
    auth.users = snap.docs.map(d => ({ id: d.id, ...d.data() }));
    auth.users.sort((a, b) => String(a.createdAt || '').localeCompare(String(b.createdAt || '')));
    auth.loaded = true;
    if (serverConfirmed) ensureAdminAccount();
    // Evita re-render (e perda de digitação no formulário) quando nada mudou
    const json = JSON.stringify(auth.users);
    const changed = json !== lastUsersJson;
    lastUsersJson = json;
    cacheUsers();
    revalidateSession(serverConfirmed);
    if (!changed) return;
    renderUserArea();
    const loginVisible = !document.getElementById('loginScreen').classList.contains('hidden');
    if (loginVisible) renderLoginScreen();
    if (state.activeTab === 'admin') renderAdminTab();
  }

  function subscribeUsers() {
    if (!cloud.db) {
      try { auth.users = JSON.parse(localStorage.getItem(USERS_CACHE_KEY)) || []; } catch (e) { auth.users = []; }
      auth.loaded = true;
      revalidateSession(false);
      return;
    }
    cloud.db.collection('users').onSnapshot(snap => {
      processUsersSnapshot(snap, !snap.metadata.fromCache && !snap.metadata.hasPendingWrites);
    }, err => {
      console.warn('Falha ao sincronizar usuários — usando cache local.', err);
      try {
        const cached = JSON.parse(localStorage.getItem(USERS_CACHE_KEY)) || [];
        if (cached.length) auth.users = cached;
      } catch (e) {}
      auth.loaded = true;
      revalidateSession(false);
      renderUserArea();
    });
    // Fallback: redes/proxies que bloqueiam o canal de push do Firestore
    setInterval(async () => {
      try {
        const snap = await cloud.db.collection('users').get();
        processUsersSnapshot(snap, !snap.metadata.fromCache);
      } catch (e) {}
    }, 30000);
  }

  function countActiveAdmins() {
    return auth.users.filter(u => u.role === 'admin' && u.active !== false).length;
  }

  async function persistUserDoc(user) {
    const { id, ...data } = user;
    Object.keys(data).forEach(k => { if (data[k] === undefined) delete data[k]; });
    if (cloud.db) {
      await cloud.db.collection('users').doc(id).set(data);
    }
    // Atualização otimista local (o snapshot confirma em seguida)
    const idx = auth.users.findIndex(u => u.id === id);
    if (idx >= 0) auth.users[idx] = user;
    else auth.users.push(user);
    cacheUsers();
  }

  async function createUser({ username, fullName, area, role, email }) {
    if (!isAdmin()) throw new Error('Apenas administradores podem criar usuários.');
    const uname = String(username || '').trim();
    if (!uname) throw new Error('Informe o nome de usuário.');
    const norm = normalizeUsername(uname);
    if (auth.users.some(u => u.usernameNorm === norm)) throw new Error(`O nome de usuário "${uname}" já está em uso.`);
    if (!ROLE_DEFS[role]) role = 'viewer';
    const nowIso = new Date().toISOString();
    const user = {
      id: userIdGen(),
      username: uname,
      usernameNorm: norm,
      fullName: String(fullName || '').trim() || uname,
      area: String(area || '').trim(),
      email: String(email || '').trim(),
      role,
      active: true,
      createdAt: nowIso,
      createdBy: auth.user ? auth.user.username : 'sistema',
      updatedAt: nowIso,
    };
    await persistUserDoc(user);
    logAudit('Usuário criado', uname, '', `perfil ${ROLE_DEFS[role].label}${user.area ? ' · área ' + user.area : ''}`);
    return user;
  }

  // Primeiro acesso: valida a credencial inicial (só hash no código) e cria a conta admin
  async function bootstrapAdmin(password) {
    if (auth.users.some(u => u.usernameNorm === BOOTSTRAP_ADMIN.username)) return null;
    const ok = (await pbkdf2Hex(password, BOOTSTRAP_ADMIN.salt, BOOTSTRAP_ADMIN.iterations)) === BOOTSTRAP_ADMIN.hash;
    if (!ok) return null;
    const nowIso = new Date().toISOString();
    const user = {
      id: 'usr_admin', // mesmo id do provisionamento automático — criação idempotente
      username: 'admin',
      usernameNorm: 'admin',
      fullName: 'Administrador',
      area: '',
      email: '',
      role: 'admin',
      active: true,
      pass: await hashPassword(password),
      firstAccess: true,
      createdAt: nowIso,
      createdBy: 'credencial inicial de configuração',
      updatedAt: nowIso,
    };
    await persistUserDoc(user);
    return user;
  }

  async function updateUser(id, patch) {
    if (!isAdmin()) throw new Error('Apenas administradores podem editar usuários.');
    const existing = auth.users.find(u => u.id === id);
    if (!existing) throw new Error('Usuário não encontrado.');
    if (patch.username !== undefined) {
      const uname = String(patch.username || '').trim();
      if (!uname) throw new Error('Informe o nome de usuário.');
      const norm = normalizeUsername(uname);
      if (auth.users.some(u => u.id !== id && u.usernameNorm === norm)) throw new Error(`O nome de usuário "${uname}" já está em uso.`);
      patch.username = uname;
      patch.usernameNorm = norm;
    }
    // Não deixar o sistema sem nenhum Admin ativo
    const losingAdmin = existing.role === 'admin' && existing.active !== false &&
      ((patch.role && patch.role !== 'admin') || patch.active === false);
    if (losingAdmin && countActiveAdmins() <= 1) throw new Error('O sistema precisa de pelo menos um Admin ativo.');
    const user = { ...existing, ...patch, updatedAt: new Date().toISOString(), updatedBy: auth.user.username };
    await persistUserDoc(user);
    // Auditoria: diff dos campos visíveis (nunca senha/hash)
    const AUDIT_FIELDS = { username: 'usuário', fullName: 'nome', area: 'área', email: 'e-mail', role: 'perfil', active: 'status' };
    const fmtVal = (k, v) => k === 'role' ? (ROLE_DEFS[v] ? ROLE_DEFS[v].label : v) : k === 'active' ? (v === false ? 'Inativo' : 'Ativo') : (v || '—');
    const diffs = Object.keys(AUDIT_FIELDS)
      .filter(k => patch[k] !== undefined && String(existing[k] ?? '') !== String(patch[k] ?? ''))
      .map(k => AUDIT_FIELDS[k]);
    if (diffs.length) {
      const before = diffs.map(l => { const k = Object.keys(AUDIT_FIELDS).find(x => AUDIT_FIELDS[x] === l); return `${l}: ${fmtVal(k, existing[k])}`; }).join(' · ');
      const after = diffs.map(l => { const k = Object.keys(AUDIT_FIELDS).find(x => AUDIT_FIELDS[x] === l); return `${l}: ${fmtVal(k, user[k])}`; }).join(' · ');
      logAudit('Usuário editado', existing.username, before, after);
    }
    return user;
  }

  async function resetPassword(id) {
    if (!isAdmin()) throw new Error('Apenas administradores podem resetar senhas.');
    const existing = auth.users.find(u => u.id === id);
    if (!existing) throw new Error('Usuário não encontrado.');
    const user = { ...existing, updatedAt: new Date().toISOString(), updatedBy: auth.user.username };
    delete user.pass;
    delete user.firstAccess;
    delete user.resetRequestedAt;
    delete user.resetToken;
    await persistUserDoc(user);
    logAudit('Senha resetada', existing.username, existing.pass ? 'Senha cadastrada' : 'Sem senha', 'Sem senha (login somente com usuário)');
    return user;
  }

  async function deleteUser(id) {
    if (!isAdmin()) throw new Error('Apenas administradores podem excluir usuários.');
    const existing = auth.users.find(u => u.id === id);
    if (!existing) throw new Error('Usuário não encontrado.');
    if (existing.id === auth.user.id) throw new Error('Você não pode excluir o seu próprio usuário — peça a outro administrador.');
    if (cloud.db) await cloud.db.collection('users').doc(id).delete();
    auth.users = auth.users.filter(u => u.id !== id);
    cacheUsers();
    logAudit('Usuário excluído', existing.username,
      `perfil ${(ROLE_DEFS[existing.role] || ROLE_DEFS.viewer).label} · ${existing.active === false ? 'Inativo' : 'Ativo'}`, 'conta removida');
    return existing;
  }

  // O próprio usuário só pode alterar e-mail e senha — dados estruturais são do Admin
  async function updateSelfAccount(patch) {
    if (!auth.user) throw new Error('Faça login para alterar sua conta.');
    const existing = auth.users.find(u => u.id === auth.user.id);
    if (!existing) throw new Error('Conta não encontrada.');
    const user = { ...existing, updatedAt: new Date().toISOString(), updatedBy: existing.username };
    if (patch.email !== undefined) user.email = String(patch.email).trim();
    if (patch.pass !== undefined) user.pass = patch.pass;
    if (patch.firstAccess !== undefined) user.firstAccess = patch.firstAccess;
    if (patch.clearReset) delete user.resetRequestedAt;
    await persistUserDoc(user);
    auth.user = user;
    return user;
  }

  /* ============================================================
     Contexto de dados do usuário — "Meus arquivos → Meus dados"
     ============================================================ */
  async function loadDataForCurrentUser() {
    state.planners = [];
    state.activePlannerId = null;
    cloud.fingerprints = {};
    cloud.remoteStamps = {};

    if (!auth.user) {
      setSyncStatus(cloud.db ? 'readonly' : 'local');
      return;
    }

    let fromCloud = null;
    try {
      fromCloud = await loadUserPlanners(auth.user.id);
    } catch (e) {
      console.warn('Não foi possível carregar da nuvem — usando dados locais.', e);
      setSyncStatus('error');
    }

    const restored = loadFromStorage(); // cache local do PRÓPRIO usuário

    if (fromCloud && fromCloud.length > 0) {
      state.planners = fromCloud;
      state.planners.forEach(p => { cloud.fingerprints[p.id] = plannerFingerprint(p); });
      const cached = restored && state.planners.find(p => p.id === restored.activePlannerId);
      state.activePlannerId = cached ? restored.activePlannerId : state.planners[0].id;
      writeLocal();
      setSyncStatus('synced');
      return;
    }

    if (restored && Array.isArray(restored.planners) && restored.planners.length > 0) {
      state.planners = restored.planners.map(p => ({
        ...p,
        ownerId: auth.user.id,
        ownerUsername: auth.user.username,
        tasks: (p.tasks || []).map(t => (t && t.statusGroup) ? t : normalizeExistingTask(t)),
        adjustments: Array.isArray(p.adjustments) ? p.adjustments : [],
      }));
      const found = state.planners.find(p => p.id === restored.activePlannerId);
      state.activePlannerId = found ? found.id : state.planners[0].id;
      saveToStorage(); // migra o cache local para a nuvem
      return;
    }
    // Usuário novo: espaço vazio — ele importa os próprios arquivos
  }

  // Troca de contexto ao entrar/sair: recarrega dados e listeners do usuário
  async function switchUserContext() {
    clearTimeout(cloud.saveTimer);
    cloud.saveTimer = null;
    state.filters = {};
    state.editingAdjustmentId = null;
    state.editingPlannerId = null;
    state.cardsVisibleCount = 24;
    await loadDataForCurrentUser();
    subscribePlanners();
    populatePlannerSwitcher();
  }

  function resetAllPlanners() {
    if (!can('managePlanners')) { alert('Seu perfil não permite alterar os planners.'); return; }
    if (!confirm('Isso removerá TODOS os seus arquivos importados e ajustes. Essa ação não pode ser desfeita. Deseja continuar?')) return;
    const key = storageKey();
    if (key) { try { localStorage.removeItem(key); } catch (e) {} }
    logAudit('Todos os arquivos removidos', auth.user.username, `${state.planners.length} planner(s)`, 'espaço vazio');
    state.planners = [];
    state.activePlannerId = null;
    state.filters = {};
    state.cardsVisibleCount = 24;
    saveToStorage();
    populatePlannerSwitcher();
    renderPlannersTab();
    renderAll();
  }

  /* ============================================================
     Gestão de planners
     ============================================================ */
  function getActivePlanner() {
    return state.planners.find(pl => pl.id === state.activePlannerId) || null;
  }

  function getActiveTasks() {
    const p = getActivePlanner();
    return p ? getEffectiveTasks(p) : [];
  }

  /* ============================================================
     Ajustes manuais — camada de sobreposição sobre os dados do Excel.
     Os dados originais NUNCA são sobrescritos; quando existe um ajuste
     para a atividade, as datas ajustadas têm prioridade nas análises.
     ============================================================ */
  function adjustmentMatchesTask(adj, task) {
    if (adj.taskId && String(adj.taskId) === String(task.id)) return true;
    return !!adj.taskName && normalizeStr(adj.taskName) === normalizeStr(task.name);
  }

  function findAdjustmentForTask(planner, task) {
    return (planner.adjustments || []).find(a => adjustmentMatchesTask(a, task)) || null;
  }

  function findTaskForAdjustment(planner, adj) {
    return (planner.tasks || []).find(t => adjustmentMatchesTask(adj, t)) || null;
  }

  // Retorna cópias das tarefas com as datas ajustadas aplicadas (originais preservados)
  function getEffectiveTasks(planner) {
    const adjustments = planner.adjustments || [];
    if (!adjustments.length) return planner.tasks;
    return planner.tasks.map(t => {
      const adj = adjustments.find(a => adjustmentMatchesTask(a, t));
      if (!adj) return t;
      const out = {
        ...t,
        _adjusted: true,
        _adjustmentId: adj.id,
        _original: { start_date: t.start_date, due_date: t.due_date, completed_at: t.completed_at },
      };
      if (adj.start_date) out.start_date = adj.start_date;
      if (adj.due_date) out.due_date = adj.due_date;
      if (adj.completed_at) out.completed_at = adj.completed_at;
      return out;
    });
  }

  function saveAdjustment(planner, adj) {
    if (!can('createAdjustments')) { alert('Seu perfil não permite registrar ajustes.'); return; }
    if (!Array.isArray(planner.adjustments)) planner.adjustments = [];
    const idx = planner.adjustments.findIndex(a =>
      a.id === adj.id || (adj.taskId && String(a.taskId) === String(adj.taskId)));
    const prev = idx >= 0 ? planner.adjustments[idx] : null;
    const saved = prev ? { ...prev, ...adj } : adj;
    if (idx >= 0) planner.adjustments[idx] = saved;
    else planner.adjustments.push(saved);
    const fmtAdj = a => `início ${a.start_date || '—'} · previsão ${a.due_date || '—'} · fim ${a.completed_at || '—'}`;
    logAudit(prev ? 'Ajuste atualizado' : 'Ajuste registrado', adj.taskName,
      prev ? fmtAdj(prev) : 'sem ajuste (dados originais do Excel)', fmtAdj(saved));
    saveToStorage();
  }

  function removeAdjustment(planner, adjId) {
    if (!can('deleteAdjustments')) { alert('Somente administradores podem excluir ajustes.'); return; }
    const adj = (planner.adjustments || []).find(a => a.id === adjId);
    planner.adjustments = (planner.adjustments || []).filter(a => a.id !== adjId);
    if (adj) {
      logAudit('Ajuste excluído', adj.taskName,
        `início ${adj.start_date || '—'} · previsão ${adj.due_date || '—'} · fim ${adj.completed_at || '—'}`,
        'análises voltam aos dados originais do Excel');
    }
    saveToStorage();
  }

  function uniquePlannerName(base) {
    const existing = new Set(state.planners.map(p => p.name));
    if (!existing.has(base)) return base;
    let i = 2;
    while (existing.has(`${base} (${i})`)) i++;
    return `${base} (${i})`;
  }

  function addPlanner(name, tasks) {
    if (!can('managePlanners')) { alert('Seu perfil não permite adicionar planners.'); return; }
    const color = PLANNER_COLORS[state.planners.length % PLANNER_COLORS.length];
    const fileName = state.pendingImport ? state.pendingImport.fileName : name;
    const planner = {
      id: genId(), name, tasks,
      addedAt: new Date().toISOString(), color, adjustments: [],
      // Isolamento: arquivo vinculado ao usuário autenticado que importou
      ownerId: auth.user.id,
      ownerUsername: auth.user.username,
      fileName,
      importedBy: auth.user.fullName || auth.user.username,
      version: state.planners.filter(p => p.fileName === fileName).length + 1,
    };
    logAudit('Planner importado', name, '', `${tasks.length} tarefas · arquivo ${fileName}`);
    state.planners.push(planner);
    state.activePlannerId = planner.id;
    state.filters = {};
    state.cardsVisibleCount = 24;
    saveToStorage();
    populatePlannerSwitcher();
  }

  function renamePlanner(id, newName) {
    if (!can('managePlanners')) return;
    const p = state.planners.find(pl => pl.id === id);
    if (p && newName && newName.trim() && p.name !== newName.trim()) {
      logAudit('Planner renomeado', p.name, p.name, newName.trim());
      p.name = newName.trim();
      saveToStorage();
      populatePlannerSwitcher();
    }
  }

  function updatePlanner(id, name, color) {
    if (!can('managePlanners')) return;
    const p = state.planners.find(pl => pl.id === id);
    if (!p) return;
    if (name && name.trim()) p.name = name.trim();
    if (color) p.color = color;
    state.editingPlannerId = null;
    state.editingPlannerColor = null;
    saveToStorage();
    populatePlannerSwitcher();
    renderAll();
  }

  function removePlanner(id) {
    if (!can('managePlanners')) { alert('Seu perfil não permite excluir planners.'); return; }
    const removed = state.planners.find(p => p.id === id);
    if (removed) logAudit('Planner excluído', removed.name, `${removed.tasks.length} tarefas`, '');
    state.planners = state.planners.filter(p => p.id !== id);
    if (!state.planners.find(p => p.id === state.activePlannerId)) {
      state.activePlannerId = state.planners.length ? state.planners[0].id : null;
    }
    state.filters = {};
    saveToStorage();
    populatePlannerSwitcher();
    renderPlannersTab();
    renderAll();
  }

  function setActivePlanner(id) {
    state.activePlannerId = id;
    state.filters = {};
    state.cardsVisibleCount = 24;
    saveToStorage();
    populatePlannerSwitcher();
    renderPlannersTab();
    renderAll();
  }

  function populatePlannerSwitcher() {
    const sel = document.getElementById('plannerSwitcher');
    if (!sel) return;
    sel.style.display = state.planners.length ? '' : 'none';
    sel.innerHTML = state.planners.map(p =>
      `<option value="${p.id}" ${p.id === state.activePlannerId ? 'selected' : ''}>${escapeHtml(p.name)}</option>`
    ).join('');
    sel.onchange = e => setActivePlanner(e.target.value);
  }

  /* ============================================================
     Interpretação inteligente de colunas (Excel / CSV)
     ============================================================ */
  const IMPORT_FIELDS = [
    { key: 'name', label: 'Nome da Tarefa', required: true },
    { key: 'status', label: 'Status' },
    { key: 'priority', label: 'Prioridade' },
    { key: 'category', label: 'Categoria / Projeto' },
    { key: 'assignees', label: 'Responsável / Atribuído a' },
    { key: 'task_type', label: 'Tipo de Tarefa' },
    { key: 'client', label: 'Para quem / Cliente / Público-alvo' },
    { key: 'start_date', label: 'Data de Início' },
    { key: 'due_date', label: 'Previsão de Conclusão' },
    { key: 'completed_at', label: 'Data de Conclusão Real' },
    { key: 'created_at', label: 'Data de Criação' },
    { key: 'progress', label: 'Progresso (%)' },
    { key: 'labels', label: 'Rótulos / Tags' },
    { key: 'notes', label: 'Notas / Descrição' },
  ];

  const FIELD_ALIASES = {
    name: ['nome da tarefa', 'nome', 'titulo', 'title', 'task name', 'tarefa', 'name', 'atividade'],
    status: ['status', 'situacao', 'estado'],
    priority: ['prioridade', 'priority'],
    category: ['categoria', 'category', 'projeto', 'project', 'grupo', 'group'],
    assignees: ['atribuido a', 'responsavel', 'assignee', 'assigned to', 'owner', 'dono', 'executor'],
    task_type: ['tipo de tarefa', 'tipo', 'task type', 'type', 'tipo de atividade'],
    client: ['para quem', 'cliente', 'publico-alvo', 'publico alvo', 'target', 'audience', 'destinatario', 'area', 'departamento', 'setor', 'unidade'],
    start_date: ['data de inicio', 'inicio', 'start date', 'start'],
    due_date: ['data de conclusao', 'previsao de conclusao', 'prazo', 'data prevista', 'due date', 'deadline', 'vencimento', 'data de entrega', 'previsao de termino', 'end date', 'data de vencimento'],
    completed_at: ['concluido em', 'data de conclusao real', 'finalizado em', 'completed at', 'completion date', 'data real de conclusao'],
    created_at: ['criado em', 'data de criacao', 'created', 'created at'],
    progress: ['progresso', '% concluido', 'percent complete', 'completion', 'itens concluidos da lista de verificacao', '% completo'],
    labels: ['rotulos', 'labels', 'tags', 'etiquetas'],
    notes: ['notas', 'observacoes', 'descricao', 'description', 'comentarios', 'comments'],
  };

  function detectColumnMapping(headers) {
    const normHeaders = headers.map(h => ({ raw: h, norm: normalizeStr(h) }));
    const mapping = {};
    const used = new Set();

    IMPORT_FIELDS.forEach(({ key: field }) => {
      const aliases = FIELD_ALIASES[field] || [];
      let best = null, bestScore = 0;
      normHeaders.forEach(h => {
        if (used.has(h.raw)) return;
        aliases.forEach(alias => {
          const a = normalizeStr(alias);
          let score = 0;
          if (h.norm === a) score = 3;
          else if (h.norm.includes(a) || a.includes(h.norm)) score = 2;
          if (score > bestScore) { bestScore = score; best = h.raw; }
        });
      });
      if (best) { mapping[field] = best; used.add(best); }
    });

    return mapping;
  }

  function buildTaskFromRow(row, mapping, idx) {
    const get = field => mapping[field] ? row[mapping[field]] : undefined;

    const statusText = strOrDefault(get('status'), 'Não informado');
    const statusGroup = normalizeStatusGroup(statusText);

    const startDate = parseAnyDate(get('start_date'));
    const dueDate = parseAnyDate(get('due_date'));
    const completedDate = parseAnyDate(get('completed_at'));
    const createdDate = parseAnyDate(get('created_at'));

    let progress = null;
    const progRaw = get('progress');
    if (progRaw !== undefined && progRaw !== null && String(progRaw).trim() !== '') {
      const s = String(progRaw).trim();
      if (s.includes('/')) {
        const parts = s.split('/').map(Number);
        if (parts.length === 2 && parts[1] > 0 && !isNaN(parts[0]) && !isNaN(parts[1])) {
          progress = Math.round((parts[0] / parts[1]) * 100);
        }
      } else {
        const num = parseFloat(s.replace('%', '').replace(',', '.'));
        if (!isNaN(num)) progress = num <= 1 ? Math.round(num * 100) : Math.round(num);
      }
    }
    if (progress === null) progress = statusGroup === 'completed' ? 100 : 0;
    progress = Math.max(0, Math.min(100, progress));

    const assigneesRaw = get('assignees');
    const assignees = assigneesRaw ? String(assigneesRaw).split(/[;,|/]+/).map(a => a.trim()).filter(Boolean) : [];

    const nameVal = get('name');
    const nameStr = strOrDefault(nameVal, `Tarefa ${idx + 1}`);

    return {
      id: `imp_${idx}_${Math.random().toString(36).slice(2, 8)}`,
      name: nameStr,
      category: strOrDefault(get('category'), 'Sem categoria'),
      status: statusText,
      statusGroup,
      priority: strOrDefault(get('priority'), 'Média'),
      assignees,
      taskType: strOrDefault(get('task_type'), ''),
      client: strOrDefault(get('client'), ''),
      created_at: createdDate ? createdDate.toISOString() : null,
      due_date: dueDate ? dueDate.toISOString() : null,
      start_date: startDate ? startDate.toISOString() : null,
      completed_at: completedDate ? completedDate.toISOString() : (statusGroup === 'completed' && dueDate ? dueDate.toISOString() : null),
      progress,
      labels: strOrDefault(get('labels'), ''),
      notes: strOrDefault(get('notes'), ''),
    };
  }

  function onPlannerFileSelected(file) {
    if (!can('managePlanners')) {
      plannerUploadMessage = { type: 'error', text: 'Seu perfil não permite importar planners.' };
      renderPlannersTab();
      return;
    }
    if (!/\.(xlsx|xls|csv)$/i.test(file.name)) {
      plannerUploadMessage = { type: 'error', text: 'Por favor, selecione um arquivo Excel (.xlsx, .xls) ou CSV (.csv)' };
      renderPlannersTab();
      return;
    }
    parseFileForImport(file);
  }

  function parseFileForImport(file) {
    const isCsv = /\.csv$/i.test(file.name);
    const dzText = document.getElementById('plannerDropzoneText');
    if (dzText) dzText.textContent = 'Lendo e interpretando o arquivo...';

    const reader = new FileReader();
    reader.onload = evt => {
      try {
        let workbook;
        if (isCsv) {
          workbook = XLSX.read(evt.target.result, { type: 'string' });
        } else {
          workbook = XLSX.read(evt.target.result, { type: 'array', cellDates: true });
        }
        let worksheet = workbook.Sheets['Dados Consolidados'];
        if (!worksheet) worksheet = workbook.Sheets[workbook.SheetNames[0]];
        const rows = XLSX.utils.sheet_to_json(worksheet, { defval: '' });

        if (!rows.length) {
          plannerUploadMessage = { type: 'error', text: 'Não encontramos linhas de dados nesse arquivo.' };
          renderPlannersTab();
          return;
        }

        const headers = Object.keys(rows[0]);
        const mapping = detectColumnMapping(headers);

        state.pendingImport = { fileName: file.name, headers, rows, mapping };
        plannerUploadMessage = null;
        renderPlannersTab();
      } catch (err) {
        console.error('Erro ao processar arquivo:', err);
        plannerUploadMessage = { type: 'error', text: 'Erro ao processar arquivo. Verifique se é um Excel (.xlsx/.xls) ou CSV válido.' };
        renderPlannersTab();
      }
    };

    if (isCsv) reader.readAsText(file, 'UTF-8');
    else reader.readAsArrayBuffer(file);
  }

  function importMappingHtml() {
    const { fileName, headers, rows, mapping } = state.pendingImport;
    const previewRows = rows.slice(0, 3);

    return `
      <div class="import-mapping-card">
        <div class="import-mapping-card__header">
          <div class="import-mapping-card__title">
            <span class="import-mapping-card__icon">${ICONS.wand}</span>
            <div>
              <h3>Confirmar importação: ${escapeHtml(fileName)}</h3>
              <p class="section-subtitle">${rows.length} linhas encontradas. Identificamos automaticamente as colunas abaixo — ajuste se algo não estiver certo.</p>
            </div>
          </div>
        </div>

        <div class="mapping-fields">
          ${IMPORT_FIELDS.map(f => `
            <div class="mapping-field">
              <label>${f.label}${f.required ? ' *' : ''}</label>
              <select data-map-field="${f.key}">
                <option value="">— Não mapear —</option>
                ${headers.map(h => `<option value="${escapeHtml(h)}" ${mapping[f.key] === h ? 'selected' : ''}>${escapeHtml(h)}</option>`).join('')}
              </select>
            </div>
          `).join('')}
        </div>

        ${previewRows.length ? `
        <div class="import-preview">
          <p class="section-subtitle" style="margin-bottom:.5rem">Pré-visualização das primeiras linhas do arquivo original:</p>
          <div class="table-scroll">
            <table class="compare-table">
              <thead><tr>${headers.map(h => `<th>${escapeHtml(h)}</th>`).join('')}</tr></thead>
              <tbody>
                ${previewRows.map(r => `<tr>${headers.map(h => `<td>${escapeHtml(r[h] instanceof Date ? r[h].toLocaleDateString('pt-BR') : (r[h] ?? ''))}</td>`).join('')}</tr>`).join('')}
              </tbody>
            </table>
          </div>
        </div>` : ''}

        <div class="import-mapping-card__actions">
          <button class="btn-secondary subtle" id="btnCancelImport">Cancelar</button>
          <button class="btn-primary" id="btnConfirmImport">Confirmar Importação</button>
        </div>
      </div>
    `;
  }

  function bindImportMapping() {
    document.querySelectorAll('[data-map-field]').forEach(sel => {
      sel.onchange = () => {
        const field = sel.getAttribute('data-map-field');
        state.pendingImport.mapping[field] = sel.value || null;
      };
    });

    document.getElementById('btnCancelImport').onclick = () => {
      state.pendingImport = null;
      renderPlannersTab();
    };

    document.getElementById('btnConfirmImport').onclick = () => {
      const { fileName, rows, mapping } = state.pendingImport;
      if (!mapping.name) {
        alert('Selecione ao menos a coluna de "Nome da Tarefa" para continuar.');
        return;
      }
      const tasks = rows.map((row, idx) => buildTaskFromRow(row, mapping, idx));
      const baseName = fileName.replace(/\.(xlsx|xls|csv)$/i, '');
      const name = uniquePlannerName(baseName || 'Novo Planner');
      addPlanner(name, tasks);
      plannerUploadMessage = { type: 'success', text: `Planner "${name}" adicionado com ${tasks.length} tarefas!` };
      state.pendingImport = null;
      renderPlannersTab();
      renderAll();
    };
  }

  /* ============================================================
     Filtros
     ============================================================ */
  function getFilteredTasks(tasks) {
    const f = state.filters;
    return tasks.filter(task => {
      if (f.status && task.status !== f.status) return false;
      if (f.priority && task.priority !== f.priority) return false;
      if (f.category && task.category !== f.category) return false;
      if (f.assignee && !(task.assignees || []).includes(f.assignee)) return false;
      if (f.taskType && task.taskType !== f.taskType) return false;
      if (f.client && task.client !== f.client) return false;

      if (f.year) {
        const datesToCheck = [task.due_date, task.start_date, task.created_at, task.completed_at];
        const hasMatch = datesToCheck.some(dateStr => {
          const date = parseDate(dateStr);
          if (!date) return false;
          const year = date.getFullYear();
          const month = date.getMonth() + 1;
          if (year !== f.year) return false;
          if (f.month && month !== f.month) return false;
          return true;
        });
        if (!hasMatch) return false;
      }
      return true;
    });
  }

  function computeFilterOptions(tasks) {
    const statuses = new Set(), priorities = new Set(), assignees = new Set(),
      categories = new Set(), years = new Set(), months = new Set(),
      taskTypes = new Set(), clients = new Set();

    tasks.forEach(task => {
      statuses.add(task.status);
      priorities.add(task.priority);
      categories.add(task.category);
      (task.assignees || []).forEach(a => assignees.add(a));
      if (task.taskType) taskTypes.add(task.taskType);
      if (task.client) clients.add(task.client);

      [task.due_date, task.start_date, task.created_at, task.completed_at].forEach(dateStr => {
        const date = parseDate(dateStr);
        if (date) { years.add(date.getFullYear()); months.add(date.getMonth() + 1); }
      });
    });

    return {
      statuses: Array.from(statuses).sort(),
      priorities: Array.from(priorities).sort(),
      assignees: Array.from(assignees).sort(),
      categories: Array.from(categories).sort(),
      years: Array.from(years).sort((a, b) => b - a),
      months: Array.from(months).sort((a, b) => a - b),
      taskTypes: Array.from(taskTypes).sort(),
      clients: Array.from(clients).sort(),
    };
  }

  const MONTH_NAMES = ['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
    'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'];

  function filterPanelHtml(tasks) {
    const opts = computeFilterOptions(tasks);
    const f = state.filters;
    const activeCount = Object.values(f).filter(v => v !== undefined).length;

    return `
      <div class="filter-panel-header">
        <h3>Filtros</h3>
        ${activeCount > 0 ? `<button class="btn-clear" id="btnClearFilters">${ICONS.x} Limpar (${activeCount})</button>` : ''}
      </div>

      <div class="filter-field">
        <label>Ano</label>
        <select id="filterYear">
          <option value="">Todos os anos</option>
          ${opts.years.map(y => `<option value="${y}" ${f.year === y ? 'selected' : ''}>${y}</option>`).join('')}
        </select>
      </div>

      ${f.year ? `
      <div class="filter-field">
        <label>Mês</label>
        <select id="filterMonth">
          <option value="">Todos os meses</option>
          ${opts.months.map(m => `<option value="${m}" ${f.month === m ? 'selected' : ''}>${MONTH_NAMES[m - 1]}</option>`).join('')}
        </select>
      </div>` : ''}

      <div class="filter-field">
        <label>Status</label>
        <select id="filterStatus">
          <option value="">Todos os status</option>
          ${opts.statuses.map(s => `<option value="${escapeHtml(s)}" ${f.status === s ? 'selected' : ''}>${escapeHtml(s)}</option>`).join('')}
        </select>
      </div>

      <div class="filter-field">
        <label>Prioridade</label>
        <select id="filterPriority">
          <option value="">Todas as prioridades</option>
          ${opts.priorities.map(p => `<option value="${escapeHtml(p)}" ${f.priority === p ? 'selected' : ''}>${escapeHtml(p)}</option>`).join('')}
        </select>
      </div>

      <div class="filter-field">
        <label>Categoria</label>
        <select id="filterCategory">
          <option value="">Todas as categorias</option>
          ${opts.categories.map(c => `<option value="${escapeHtml(c)}" ${f.category === c ? 'selected' : ''}>${escapeHtml(c)}</option>`).join('')}
        </select>
      </div>

      <div class="filter-field">
        <label>Responsável</label>
        <select id="filterAssignee">
          <option value="">Todos os responsáveis</option>
          ${opts.assignees.map(a => `<option value="${escapeHtml(a)}" ${f.assignee === a ? 'selected' : ''}>${escapeHtml(a)}</option>`).join('')}
        </select>
      </div>

      ${opts.taskTypes.length > 0 ? `
      <div class="filter-field">
        <label>Tipo de Tarefa</label>
        <select id="filterTaskType">
          <option value="">Todos os tipos</option>
          ${opts.taskTypes.map(t => `<option value="${escapeHtml(t)}" ${f.taskType === t ? 'selected' : ''}>${escapeHtml(t)}</option>`).join('')}
        </select>
      </div>` : ''}

      ${opts.clients.length > 0 ? `
      <div class="filter-field">
        <label>Para quem / Cliente</label>
        <select id="filterClient">
          <option value="">Todos</option>
          ${opts.clients.map(c => `<option value="${escapeHtml(c)}" ${f.client === c ? 'selected' : ''}>${escapeHtml(c)}</option>`).join('')}
        </select>
      </div>` : ''}

      ${activeCount > 0 ? `
      <div class="active-filters">
        <p>Filtros Ativos:</p>
        <div class="active-filters__list">
          ${f.year ? chip('Ano', f.year, 'year') : ''}
          ${f.month ? chip('Mês', MONTH_NAMES[f.month - 1], 'month') : ''}
          ${f.status ? chip('Status', f.status, 'status') : ''}
          ${f.priority ? chip('Prioridade', f.priority, 'priority') : ''}
          ${f.category ? chip('Categoria', f.category, 'category') : ''}
          ${f.assignee ? chip('Responsável', f.assignee, 'assignee') : ''}
          ${f.taskType ? chip('Tipo', f.taskType, 'taskType') : ''}
          ${f.client ? chip('Para quem', f.client, 'client') : ''}
        </div>
      </div>` : ''}
    `;

    function chip(label, value, key) {
      return `<span class="filter-chip">${label}: ${escapeHtml(String(value))}
        <button data-clear-filter="${key}">${ICONS.x}</button>
      </span>`;
    }
  }

  function renderPanel() {
    // Na aba Comparar os filtros valem para todos os planners
    const tasks = state.activeTab === 'compare'
      ? state.planners.flatMap(p => getEffectiveTasks(p))
      : getActiveTasks();
    document.getElementById('panelContent').innerHTML = filterPanelHtml(tasks);
    bindFilterPanel();
  }

  function bindFilterPanel() {
    const set = (key, val) => {
      if (val === '' || val === undefined) delete state.filters[key];
      else state.filters[key] = val;
      renderAll();
    };
    const byId = id => document.getElementById(id);

    if (byId('filterYear')) byId('filterYear').onchange = e => {
      const v = e.target.value;
      if (v) state.filters.year = parseInt(v, 10); else delete state.filters.year;
      delete state.filters.month;
      renderAll();
    };
    if (byId('filterMonth')) byId('filterMonth').onchange = e => set('month', e.target.value ? parseInt(e.target.value, 10) : undefined);
    if (byId('filterStatus')) byId('filterStatus').onchange = e => set('status', e.target.value || undefined);
    if (byId('filterPriority')) byId('filterPriority').onchange = e => set('priority', e.target.value || undefined);
    if (byId('filterCategory')) byId('filterCategory').onchange = e => set('category', e.target.value || undefined);
    if (byId('filterAssignee')) byId('filterAssignee').onchange = e => set('assignee', e.target.value || undefined);
    if (byId('filterTaskType')) byId('filterTaskType').onchange = e => set('taskType', e.target.value || undefined);
    if (byId('filterClient')) byId('filterClient').onchange = e => set('client', e.target.value || undefined);
    if (byId('btnClearFilters')) byId('btnClearFilters').onclick = () => { state.filters = {}; renderAll(); };

    document.querySelectorAll('[data-clear-filter]').forEach(btn => {
      btn.onclick = () => {
        const key = btn.getAttribute('data-clear-filter');
        delete state.filters[key];
        if (key === 'year') delete state.filters.month;
        renderAll();
      };
    });
  }

  /* ============================================================
     Métricas (compartilhado entre Métricas / Planners / Comparar)
     ============================================================ */
  function computeMetrics(tasks) {
    const total = tasks.length;
    const completed = tasks.filter(t => t.statusGroup === 'completed').length;
    const inProgress = tasks.filter(t => t.statusGroup === 'inProgress').length;
    const notStarted = tasks.filter(t => t.statusGroup === 'notStarted').length;
    const overdue = tasks.filter(isOverdue).length;
    const completionRate = total > 0 ? Math.round((completed / total) * 100) : 0;

    const byCategory = {};
    tasks.forEach(t => { byCategory[t.category] = (byCategory[t.category] || 0) + 1; });
    const categoryData = Object.entries(byCategory)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value).slice(0, 8);

    const statusGroups = {};
    tasks.forEach(t => {
      if (!statusGroups[t.status]) statusGroups[t.status] = { count: 0, group: t.statusGroup };
      statusGroups[t.status].count++;
    });
    const statusData = Object.entries(statusGroups)
      .map(([name, v]) => ({ name, value: v.count, color: groupColor(v.group, name) }))
      .sort((a, b) => b.value - a.value);

    const byPriority = {};
    tasks.forEach(t => { byPriority[t.priority] = (byPriority[t.priority] || 0) + 1; });
    const priorityData = Object.entries(byPriority)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value);

    const byAssignee = {};
    tasks.forEach(t => (t.assignees || []).forEach(a => { byAssignee[a] = (byAssignee[a] || 0) + 1; }));
    const topAssignees = Object.entries(byAssignee)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value).slice(0, 8);

    const byTaskType = {};
    tasks.forEach(t => { if (t.taskType) byTaskType[t.taskType] = (byTaskType[t.taskType] || 0) + 1; });
    const taskTypeData = Object.entries(byTaskType)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value).slice(0, 8);

    const byClient = {};
    tasks.forEach(t => { if (t.client) byClient[t.client] = (byClient[t.client] || 0) + 1; });
    const clientData = Object.entries(byClient)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value).slice(0, 8);

    const progressByWeek = {};
    const addWeek = (dateStr, key) => {
      const date = parseDate(dateStr);
      if (!date) return;
      const weekStart = new Date(date);
      weekStart.setDate(date.getDate() - date.getDay());
      const weekKey = weekStart.toISOString().split('T')[0];
      if (!progressByWeek[weekKey]) progressByWeek[weekKey] = { completed: 0, total: 0 };
      progressByWeek[weekKey][key] += 1;
    };
    tasks.forEach(t => addWeek(t.completed_at, 'completed'));
    tasks.forEach(t => addWeek(t.created_at, 'total'));

    const weeklyData = Object.entries(progressByWeek)
      .sort(([a], [b]) => a.localeCompare(b))
      .slice(-12)
      .map(([week, d]) => ({
        week: new Date(week).toLocaleDateString('pt-BR', { month: 'short', day: 'numeric' }),
        completed: d.completed,
        total: d.total,
      }));

    // Duração planejada (início -> previsão de fim)
    const durations = [];
    tasks.forEach(t => {
      const s = parseDate(t.start_date);
      const d = parseDate(t.due_date);
      if (s && d) {
        const days = Math.round((d.getTime() - s.getTime()) / 86400000);
        if (days >= 0) durations.push({ task: t, days });
      }
    });
    const avgDuration = durations.length ? Math.round(durations.reduce((sum, x) => sum + x.days, 0) / durations.length) : null;
    const pctWithDates = total > 0 ? Math.round((durations.length / total) * 100) : 0;

    const durByCategory = {};
    durations.forEach(({ task, days }) => {
      if (!durByCategory[task.category]) durByCategory[task.category] = { sum: 0, count: 0 };
      durByCategory[task.category].sum += days;
      durByCategory[task.category].count += 1;
    });
    const categoryDurationData = Object.entries(durByCategory)
      .map(([name, v]) => ({ name, value: Math.round(v.sum / v.count) }))
      .sort((a, b) => b.value - a.value).slice(0, 8);

    return {
      total, completed, inProgress, notStarted, overdue, completionRate,
      categoryData, statusData, priorityData, topAssignees, weeklyData,
      taskTypeData, clientData,
      avgDuration, pctWithDates, categoryDurationData, durationsCount: durations.length,
    };
  }

  function destroyCharts() {
    Object.values(state.charts).forEach(c => c && c.destroy());
    state.charts = {};
  }

  /* ============================================================
     Tab: Métricas
     ============================================================ */
  function renderMetrics(tasks) {
    const metrics = computeMetrics(tasks);
    destroyCharts();

    const root = document.getElementById('metricsRoot');
    root.innerHTML = `
      <div class="kpi-grid">
        ${kpiCard('alertCircle', 'Total de Tarefas', metrics.total, COLORS.primary, 'completionRate')}
        ${kpiCard('checkCircle', 'Concluídas', metrics.completed, COLORS.success, 'completed')}
        ${kpiCard('clock', 'Em Andamento', metrics.inProgress, COLORS.primary, 'inProgress')}
        ${kpiCard('alertCircle', 'Atrasadas', metrics.overdue, COLORS.warning, 'overdue')}
        ${kpiCard('users', 'Taxa de Conclusão', metrics.completionRate + '%', COLORS.success, 'completionRate')}
        ${kpiCard('calendar', 'Duração Média Planejada', metrics.avgDuration !== null ? metrics.avgDuration + 'd' : '—', COLORS.primary, 'avgDuration')}
        ${kpiCard('flag', 'Com Prazo Definido', metrics.pctWithDates + '%', metrics.pctWithDates >= 70 ? COLORS.success : COLORS.warning, 'missingDates')}
      </div>

      <div class="charts-grid">
        <div class="chart-card">
          <h3>Distribuição por Status</h3>
          <canvas id="chartStatus"></canvas>
        </div>
        <div class="chart-card">
          <h3>Tarefas por Prioridade</h3>
          <canvas id="chartPriority"></canvas>
        </div>
        <div class="chart-card">
          <h3>Top Categorias</h3>
          <canvas id="chartCategory"></canvas>
        </div>
        <div class="chart-card">
          <h3>Pessoas Mais Ocupadas</h3>
          <canvas id="chartAssignees"></canvas>
        </div>
        ${metrics.taskTypeData.length > 0 ? `
        <div class="chart-card">
          <h3>Tarefas por Tipo</h3>
          <canvas id="chartTaskType"></canvas>
        </div>` : ''}
        ${metrics.clientData.length > 0 ? `
        <div class="chart-card">
          <h3>Tarefas por Cliente / Público-alvo</h3>
          <canvas id="chartClient"></canvas>
        </div>` : ''}
        ${metrics.categoryDurationData.length > 0 ? `
        <div class="chart-card">
          <h3>Duração Média por Categoria (dias)</h3>
          <canvas id="chartCategoryDuration"></canvas>
        </div>` : ''}
        ${metrics.weeklyData.length > 0 ? `
        <div class="chart-card">
          <h3>Progresso Semanal</h3>
          <canvas id="chartWeekly"></canvas>
        </div>` : ''}
      </div>
    `;

    document.querySelectorAll('[data-kpi]').forEach(btn => {
      btn.onclick = () => openKpiModal(btn.getAttribute('data-kpi'), tasks, metrics);
    });

    state.charts.status = new Chart(document.getElementById('chartStatus'), {
      type: 'pie',
      data: { labels: metrics.statusData.map(d => d.name), datasets: [{ data: metrics.statusData.map(d => d.value), backgroundColor: metrics.statusData.map(d => d.color) }] },
      options: { responsive: true, maintainAspectRatio: true, plugins: { legend: { position: 'bottom' } } },
    });

    state.charts.priority = new Chart(document.getElementById('chartPriority'), {
      type: 'bar',
      data: { labels: metrics.priorityData.map(d => d.name), datasets: [{ data: metrics.priorityData.map(d => d.value), backgroundColor: metrics.priorityData.map(d => getPriorityColor(d.name)), borderRadius: 8 }] },
      options: { responsive: true, maintainAspectRatio: true, plugins: { legend: { display: false } }, scales: { y: { beginAtZero: true, ticks: { precision: 0 } } } },
    });

    state.charts.category = new Chart(document.getElementById('chartCategory'), {
      type: 'bar',
      data: { labels: metrics.categoryData.map(d => d.name), datasets: [{ data: metrics.categoryData.map(d => d.value), backgroundColor: COLORS.primary, borderRadius: 8 }] },
      options: { indexAxis: 'y', responsive: true, maintainAspectRatio: true, plugins: { legend: { display: false } }, scales: { x: { beginAtZero: true, ticks: { precision: 0 } } } },
    });

    state.charts.assignees = new Chart(document.getElementById('chartAssignees'), {
      type: 'bar',
      data: { labels: metrics.topAssignees.map(d => d.name), datasets: [{ data: metrics.topAssignees.map(d => d.value), backgroundColor: COLORS.success, borderRadius: 8 }] },
      options: { indexAxis: 'y', responsive: true, maintainAspectRatio: true, plugins: { legend: { display: false } }, scales: { x: { beginAtZero: true, ticks: { precision: 0 } } } },
    });

    if (metrics.taskTypeData.length > 0) {
      state.charts.taskType = new Chart(document.getElementById('chartTaskType'), {
        type: 'bar',
        data: { labels: metrics.taskTypeData.map(d => d.name), datasets: [{ data: metrics.taskTypeData.map(d => d.value), backgroundColor: '#06B6D4', borderRadius: 8 }] },
        options: { indexAxis: 'y', responsive: true, maintainAspectRatio: true, plugins: { legend: { display: false } }, scales: { x: { beginAtZero: true, ticks: { precision: 0 } } } },
      });
    }

    if (metrics.clientData.length > 0) {
      state.charts.client = new Chart(document.getElementById('chartClient'), {
        type: 'bar',
        data: { labels: metrics.clientData.map(d => d.name), datasets: [{ data: metrics.clientData.map(d => d.value), backgroundColor: '#EC4899', borderRadius: 8 }] },
        options: { indexAxis: 'y', responsive: true, maintainAspectRatio: true, plugins: { legend: { display: false } }, scales: { x: { beginAtZero: true, ticks: { precision: 0 } } } },
      });
    }

    if (metrics.categoryDurationData.length > 0) {
      state.charts.categoryDuration = new Chart(document.getElementById('chartCategoryDuration'), {
        type: 'bar',
        data: { labels: metrics.categoryDurationData.map(d => d.name), datasets: [{ data: metrics.categoryDurationData.map(d => d.value), backgroundColor: '#8B5CF6', borderRadius: 8 }] },
        options: { indexAxis: 'y', responsive: true, maintainAspectRatio: true, plugins: { legend: { display: false } }, scales: { x: { beginAtZero: true, ticks: { precision: 0, callback: v => v + 'd' } } } },
      });
    }

    if (metrics.weeklyData.length > 0) {
      state.charts.weekly = new Chart(document.getElementById('chartWeekly'), {
        type: 'line',
        data: {
          labels: metrics.weeklyData.map(d => d.week),
          datasets: [
            { label: 'Concluídas', data: metrics.weeklyData.map(d => d.completed), borderColor: COLORS.success, backgroundColor: COLORS.success, tension: .35 },
            { label: 'Total', data: metrics.weeklyData.map(d => d.total), borderColor: COLORS.primary, backgroundColor: COLORS.primary, tension: .35 },
          ],
        },
        options: { responsive: true, maintainAspectRatio: true, plugins: { legend: { position: 'bottom' } }, scales: { y: { beginAtZero: true, ticks: { precision: 0 } } } },
      });
    }

    function kpiCard(icon, label, value, color, kpiType) {
      return `
        <button class="kpi-card" data-kpi="${kpiType}">
          <div class="kpi-card__top">
            <div>
              <p class="kpi-card__label">${label}</p>
              <p class="kpi-card__value">${value}</p>
            </div>
            <div class="kpi-card__icon" style="background:${color}15;color:${color}">${ICONS[icon]}</div>
          </div>
          <p class="kpi-card__cta">Clique para ver detalhes →</p>
        </button>
      `;
    }
  }

  /* ============================================================
     KPI Detail Modal
     ============================================================ */
  function openKpiModal(type, tasks, metrics) {
    let filtered = [], title = '', icon = '', description = '', iconColor = COLORS.primary;

    switch (type) {
      case 'completed':
        filtered = tasks.filter(t => t.statusGroup === 'completed');
        title = `Tarefas Concluídas (${filtered.length})`;
        icon = ICONS.checkCircle; iconColor = COLORS.success;
        description = `${metrics.completionRate}% do total de tarefas foram concluídas`;
        break;
      case 'inProgress':
        filtered = tasks.filter(t => t.statusGroup === 'inProgress');
        title = `Tarefas em Andamento (${filtered.length})`;
        icon = ICONS.clock; iconColor = COLORS.primary;
        description = `${metrics.total ? Math.round((filtered.length / metrics.total) * 100) : 0}% das tarefas estão sendo executadas`;
        break;
      case 'notStarted':
        filtered = tasks.filter(t => t.statusGroup === 'notStarted');
        title = `Tarefas Não Iniciadas (${filtered.length})`;
        icon = ICONS.alertCircle; iconColor = COLORS.muted;
        description = `${metrics.total ? Math.round((filtered.length / metrics.total) * 100) : 0}% das tarefas ainda não foram iniciadas`;
        break;
      case 'overdue':
        filtered = tasks.filter(isOverdue);
        title = `Tarefas Atrasadas (${filtered.length})`;
        icon = ICONS.alertCircle; iconColor = COLORS.error;
        description = `${metrics.total ? Math.round((filtered.length / metrics.total) * 100) : 0}% das tarefas estão vencidas`;
        break;
      case 'avgDuration':
        filtered = tasks.filter(t => parseDate(t.start_date) && parseDate(t.due_date));
        title = `Duração Média Planejada: ${metrics.avgDuration ?? '—'} dias`;
        icon = ICONS.calendar; iconColor = COLORS.primary;
        description = `${filtered.length} tarefas com início e previsão de fim definidos`;
        break;
      case 'missingDates':
        filtered = tasks.filter(t => !(parseDate(t.start_date) && parseDate(t.due_date)));
        title = `Tarefas sem Prazo Completo (${filtered.length})`;
        icon = ICONS.flag; iconColor = COLORS.warning;
        description = `${100 - metrics.pctWithDates}% das tarefas não têm início e previsão de fim definidos`;
        break;
      case 'completionRate':
      default:
        filtered = tasks;
        title = `Taxa de Conclusão: ${metrics.completionRate}%`;
        icon = ICONS.trendingUp; iconColor = COLORS.success;
        description = `${metrics.completed} de ${metrics.total} tarefas concluídas`;
        break;
    }

    document.getElementById('modalIcon').innerHTML = icon;
    document.getElementById('modalIcon').style.color = iconColor;
    document.getElementById('modalTitle').textContent = title;
    document.getElementById('modalDescription').textContent = description;

    const body = document.getElementById('modalBody');
    if (filtered.length === 0) {
      body.innerHTML = `<div class="modal-empty">Nenhuma tarefa encontrada nesta categoria</div>`;
    } else {
      body.innerHTML = filtered.map((task, idx) => {
        const color = getStatusColor(task);
        const firstAssignee = (task.assignees || [])[0];
        return `
          <div class="modal-task-item" style="animation-delay:${Math.min(idx * 25, 250)}ms">
            <div class="modal-task-item__top">
              <div style="flex:1;min-width:0">
                <h3 title="${escapeHtml(task.name)}">${escapeHtml(task.name)}</h3>
                <div class="modal-task-item__meta">
                  <span class="tag-neutral">${escapeHtml(task.category)}</span>
                  <span class="badge-pill" style="background:${color}">${escapeHtml(task.status)}</span>
                  <span class="tag-neutral">Início: ${formatDate(task.start_date)}</span>
                  <span class="tag-neutral">Fim: ${formatDate(task.due_date)}</span>
                  ${firstAssignee ? `<span class="tag-neutral" style="background:transparent;padding:0">${escapeHtml(firstAssignee.split(' ')[0])}${task.assignees.length > 1 ? ' +' + (task.assignees.length - 1) : ''}</span>` : ''}
                </div>
              </div>
              <div class="modal-task-item__right">
                <p>${Math.round(task.progress || 0)}%</p>
                <p>${task.due_date ? formatDate(task.due_date) : '—'}</p>
              </div>
            </div>
            <div class="progress-track">
              <div class="progress-fill" style="width:${task.progress || 0}%;background:${color}"></div>
            </div>
          </div>
        `;
      }).join('');
    }

    document.getElementById('modalOverlay').classList.add('open');
    document.getElementById('modalPanel').classList.add('open');
  }

  function closeKpiModal() {
    document.getElementById('modalOverlay').classList.remove('open');
    document.getElementById('modalPanel').classList.remove('open');
  }

  /* ============================================================
     Tab: Gantt
     ============================================================ */
  function getDateRange(tasks) {
    const dates = [];
    tasks.forEach(t => {
      [t.start_date, t.due_date, t.created_at, t.completed_at].forEach(ds => {
        const d = parseDate(ds);
        if (d) dates.push(d);
      });
    });

    if (dates.length === 0) {
      const today = new Date();
      return { min: new Date(today.getFullYear(), today.getMonth(), 1), max: new Date(today.getFullYear(), today.getMonth() + 3, 0) };
    }

    const min = new Date(Math.min(...dates.map(d => d.getTime())));
    const max = new Date(Math.max(...dates.map(d => d.getTime())));
    min.setDate(1);
    max.setMonth(max.getMonth() + 1);
    max.setDate(0);
    return { min, max };
  }

  function getTaskPosition(task, minDate, maxDate, totalDays) {
    const startDate = parseDate(task.start_date) || parseDate(task.created_at) || minDate;
    const endDate = parseDate(task.due_date) || parseDate(task.completed_at) || startDate;

    const startOffset = Math.max(0, (startDate.getTime() - minDate.getTime()) / 86400000);
    const duration = Math.max(1, (endDate.getTime() - startDate.getTime()) / 86400000);

    const start = (startOffset / totalDays) * 100;
    const width = (duration / totalDays) * 100;
    return { start: Math.max(0, start), width: Math.max(2, width) };
  }

  function renderGantt(tasks) {
    const root = document.getElementById('ganttRoot');

    if (tasks.length === 0) {
      root.innerHTML = `<div class="empty-state">Nenhuma tarefa encontrada com os filtros atuais.</div>`;
      return;
    }

    const { min: minDate, max: maxDate } = getDateRange(tasks);
    const totalDays = Math.ceil((maxDate.getTime() - minDate.getTime()) / 86400000) || 1;

    const pctOf = d => Math.min(100, Math.max(0, ((d.getTime() - minDate.getTime()) / 86400000) / totalDays * 100));
    const shortDate = d => d.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });

    // Linhas verticais dos meses + linha de "hoje" (sobrepostas em cada linha)
    const monthBoundaries = [];
    const boundary = new Date(minDate.getFullYear(), minDate.getMonth() + 1, 1);
    while (boundary < maxDate) {
      monthBoundaries.push(pctOf(boundary));
      boundary.setMonth(boundary.getMonth() + 1);
    }
    const today = new Date();
    const todayPct = (today >= minDate && today <= maxDate) ? pctOf(today) : null;
    const rowOverlays =
      monthBoundaries.map(b => `<i class="gantt-gridline" style="left:${b}%"></i>`).join('') +
      (todayPct !== null ? `<i class="gantt-today-line" style="left:${todayPct}%" title="Hoje: ${today.toLocaleDateString('pt-BR')}"></i>` : '');

    const grouped = {};
    tasks.forEach(t => {
      if (!grouped[t.category]) grouped[t.category] = [];
      grouped[t.category].push(t);
    });

    const monthLabels = [];
    let current = new Date(minDate);
    while (current <= maxDate) {
      monthLabels.push(current.toLocaleDateString('pt-BR', { month: 'short', year: '2-digit' }));
      current.setMonth(current.getMonth() + 1);
    }

    let html = `
      <div class="gantt-card">
        <div class="gantt-card__header">
          <h3>Timeline de Execução</h3>
          <p>Cronograma das tarefas por categoria — a barra mostra o período planejado e o preenchimento indica o progresso</p>
          <div class="gantt-legend">
            <span><i class="legend-dot" style="background:${COLORS.primary}"></i> Início</span>
            <span><i class="legend-diamond"></i> Previsão de fim</span>
            <span><i class="legend-dot" style="background:${COLORS.success}"></i> Concluído em</span>
            <span><i class="legend-today"></i> Hoje</span>
            <span><i class="legend-diamond legend-diamond--overdue"></i> Previsão estourada</span>
          </div>
        </div>
        <div class="gantt-scroll">
          <div class="gantt-table">
            <div class="gantt-row-header">
              <div class="gantt-col-label"><h4>Tarefa</h4></div>
              <div class="gantt-months">${monthLabels.map(m => `<div class="gantt-month">${m}</div>`).join('')}</div>
            </div>
    `;

    Object.entries(grouped).forEach(([category, catTasks]) => {
      html += `
        <div class="gantt-category-header">
          <div class="gantt-col-label">
            <span class="cat-name">${escapeHtml(category)}</span>
            <span class="cat-count">(${catTasks.length})</span>
          </div>
        </div>
      `;

      catTasks.forEach(task => {
        const { start, width } = getTaskPosition(task, minDate, maxDate, totalDays);
        const isExpanded = state.ganttExpanded.has(task.id);
        const statusColor = getStatusColor(task);
        const priorityColor = getPriorityColor(task.priority);

        const startD = parseDate(task.start_date);
        const dueD = parseDate(task.due_date);
        const doneD = parseDate(task.completed_at);
        const overdue = isOverdue(task);
        const progress = Math.round(task.progress || 0);
        const endPct = Math.min(100, start + width);

        // Marcadores de datas sobre a linha
        let markers = '';
        if (startD) markers += `<i class="gantt-marker gantt-marker--start" style="left:${pctOf(startD)}%" title="Início: ${formatDate(task.start_date)}"></i>`;
        if (dueD) markers += `<i class="gantt-marker gantt-marker--due ${overdue ? 'overdue' : ''}" style="left:${pctOf(dueD)}%" title="Previsão de fim: ${formatDate(task.due_date)}"></i>`;
        if (doneD) markers += `<i class="gantt-marker gantt-marker--done" style="left:${pctOf(doneD)}%" title="Concluído em: ${formatDate(task.completed_at)}"></i>`;

        // Etiquetas de data nas pontas da barra (ocultas se não couberem)
        const leftTag = (startD && start > 9)
          ? `<span class="gantt-date-tag gantt-date-tag--start" style="left:${start}%">${shortDate(startD)}</span>` : '';
        let rightTag = '';
        if (endPct < 90) {
          if (doneD) rightTag = `<span class="gantt-date-tag gantt-date-tag--done" style="left:${Math.max(endPct, pctOf(doneD))}%">✓ ${shortDate(doneD)}</span>`;
          else if (dueD) rightTag = `<span class="gantt-date-tag gantt-date-tag--due ${overdue ? 'overdue' : ''}" style="left:${endPct}%">${shortDate(dueD)}</span>`;
        }

        const tooltip = `${escapeHtml(task.name)}\nInício: ${formatDate(task.start_date)}\nPrevisão: ${formatDate(task.due_date)}\nConcluído: ${formatDate(task.completed_at)}\nProgresso: ${progress}%`;

        const lateDays = (doneD && dueD) ? Math.round((doneD.getTime() - dueD.getTime()) / 86400000) : null;

        html += `
          <div class="gantt-task-row">
            <div class="gantt-task-label">
              <button class="gantt-expand-btn" data-gantt-toggle="${escapeHtml(task.id)}">${isExpanded ? ICONS.chevronUp : ICONS.chevronDown}</button>
              <div class="gantt-task-label__body">
                <p title="${escapeHtml(task.name)}">${escapeHtml(task.name)}</p>
                <div class="gantt-badges">
                  <span class="badge" style="background:${statusColor}">${escapeHtml(task.status)}</span>
                  <span class="badge" style="background:${priorityColor}">${escapeHtml(task.priority)}</span>
                  ${overdue ? `<span class="badge" style="background:${COLORS.error}">Atrasada</span>` : ''}
                </div>
              </div>
            </div>
            <div class="gantt-bar-area">
              ${rowOverlays}
              <div class="gantt-bar-wrap">
                <div class="gantt-bar" style="left:${start}%;width:${width}%;background:${statusColor}2b;border-color:${statusColor}66" title="${tooltip}">
                  <div class="gantt-bar__fill" style="width:${progress}%;background:${statusColor}"></div>
                  <span>${progress}%</span>
                </div>
                ${leftTag}
                ${rightTag}
                ${markers}
              </div>
            </div>
          </div>
          ${isExpanded ? `
          <div class="gantt-details">
            <div class="gantt-details-grid">
              <div><p class="lbl">Responsáveis</p><p class="val">${(task.assignees || []).length > 0 ? escapeHtml(task.assignees.join(', ')) : 'Não atribuído'}</p></div>
              <div><p class="lbl">Data de Início</p><p class="val">${formatDate(task.start_date)}</p></div>
              <div><p class="lbl">Previsão de Fim</p><p class="val ${overdue ? 'text-error' : ''}">${formatDate(task.due_date)}${overdue ? ` — ${getDaysUntilDue(task.due_date)}` : ''}</p></div>
              <div><p class="lbl">Concluído em</p><p class="val">${task.completed_at ? formatDate(task.completed_at) : 'Ainda não concluída'}</p></div>
              ${lateDays !== null && lateDays > 0 ? `<div><p class="lbl">Atraso na Entrega</p><p class="val text-error">${lateDays} dia${lateDays !== 1 ? 's' : ''} após a previsão</p></div>` : ''}
              ${lateDays !== null && lateDays <= 0 ? `<div><p class="lbl">Entrega</p><p class="val" style="color:${COLORS.success};font-weight:600">No prazo${lateDays < 0 ? ` (${Math.abs(lateDays)}d antes)` : ''}</p></div>` : ''}
              <div><p class="lbl">Duração Planejada</p><p class="val">${durationLabel(task)}</p></div>
              ${task.created_at ? `<div><p class="lbl">Criada em</p><p class="val">${formatDate(task.created_at)}</p></div>` : ''}
              ${task.taskType ? `<div><p class="lbl">Tipo</p><p class="val">${escapeHtml(task.taskType)}</p></div>` : ''}
              ${task.client ? `<div><p class="lbl">Para quem</p><p class="val">${escapeHtml(task.client)}</p></div>` : ''}
              ${task.labels ? `<div class="full"><p class="lbl">Rótulos</p><p class="val">${escapeHtml(task.labels)}</p></div>` : ''}
              ${task.notes ? `<div class="full"><p class="lbl">Notas</p><p class="val">${escapeHtml(task.notes)}</p></div>` : ''}
            </div>
          </div>` : ''}
        `;
      });
    });

    html += `</div></div></div>`;
    root.innerHTML = html;

    document.querySelectorAll('[data-gantt-toggle]').forEach(btn => {
      btn.onclick = () => {
        const id = btn.getAttribute('data-gantt-toggle');
        if (state.ganttExpanded.has(id)) state.ganttExpanded.delete(id);
        else state.ganttExpanded.add(id);
        renderGantt(tasks);
      };
    });
  }

  /* ============================================================
     Tab: Tarefas (cards)
     ============================================================ */
  function sortTasks(tasks, sortBy, sortOrder) {
    const sorted = [...tasks].sort((a, b) => {
      let aVal, bVal;
      switch (sortBy) {
        case 'name': aVal = (a.name || '').toLowerCase(); bVal = (b.name || '').toLowerCase(); break;
        case 'progress': aVal = a.progress || 0; bVal = b.progress || 0; break;
        case 'start_date':
          aVal = a.start_date ? new Date(a.start_date).getTime() : Infinity;
          bVal = b.start_date ? new Date(b.start_date).getTime() : Infinity;
          break;
        case 'due_date':
        default:
          aVal = a.due_date ? new Date(a.due_date).getTime() : Infinity;
          bVal = b.due_date ? new Date(b.due_date).getTime() : Infinity;
          break;
      }
      if (sortOrder === 'asc') return aVal > bVal ? 1 : -1;
      return aVal < bVal ? 1 : -1;
    });
    return sorted;
  }

  function taskCardHtml(task, idx) {
    const statusColor = getStatusColor(task);
    const priorityColor = getPriorityColor(task.priority);
    const overdue = isOverdue(task);
    const expanded = state.cardExpandedIds.has(task.id);
    const assignees = task.assignees || [];
    const delay = Math.min(idx * 25, 250);

    return `
      <div class="task-card ${overdue ? 'is-overdue' : ''}" style="animation-delay:${delay}ms">
        <div class="task-card__top">
          <span class="badge-pill" style="background:${statusColor}">${escapeHtml(task.status)}</span>
          <span class="badge-pill" style="background:${priorityColor}">${escapeHtml(task.priority)}</span>
        </div>
        <h3 class="task-card__name" title="${escapeHtml(task.name)}">${escapeHtml(task.name)}</h3>
        <p class="task-card__category">${escapeHtml(task.category)}</p>
        ${task.taskType || task.client ? `
        <div class="task-card__meta-tags">
          ${task.taskType ? `<span class="tag-neutral">${escapeHtml(task.taskType)}</span>` : ''}
          ${task.client ? `<span class="tag-neutral">${escapeHtml(task.client)}</span>` : ''}
        </div>` : ''}

        <div class="task-card__dates">
          <div class="date-chip date-chip--start">
            ${ICONS.calendar}
            <div class="date-chip__body">
              <span class="date-chip__lbl">Início</span>
              <span class="date-chip__val">${formatDate(task.start_date)}</span>
            </div>
          </div>
          <div class="date-chip date-chip--due ${overdue ? 'overdue' : ''}">
            ${ICONS.flag}
            <div class="date-chip__body">
              <span class="date-chip__lbl">Previsão de Fim</span>
              <span class="date-chip__val">${formatDate(task.due_date)}</span>
            </div>
          </div>
        </div>

        <div class="task-card__progress">
          <div class="progress-track"><div class="progress-fill" style="width:${task.progress || 0}%;background:${statusColor}"></div></div>
          <span class="progress-pct">${Math.round(task.progress || 0)}%</span>
        </div>

        <div class="task-card__footer">
          <div class="task-card__assignees">
            ${assignees.length > 0
              ? assignees.slice(0, 3).map(a => `<span class="assignee-chip" title="${escapeHtml(a)}">${escapeHtml(a.split(' ')[0])}</span>`).join('')
                + (assignees.length > 3 ? `<span class="assignee-more">+${assignees.length - 3}</span>` : '')
              : `<span class="unassigned">Não atribuído</span>`}
          </div>
          <button class="icon-btn" data-card-toggle="${escapeHtml(task.id)}">${expanded ? ICONS.chevronUp : ICONS.chevronDown}</button>
        </div>

        ${expanded ? `
        <div class="task-card__details">
          <div class="gantt-details-grid">
            <div><p class="lbl">Criado em</p><p class="val">${formatDate(task.created_at)}</p></div>
            <div><p class="lbl">Concluído em</p><p class="val">${formatDate(task.completed_at)}</p></div>
            <div><p class="lbl">Duração Planejada</p><p class="val">${durationLabel(task)}</p></div>
            <div><p class="lbl">Prazo</p><p class="val ${overdue ? 'text-error' : ''}">${getDaysUntilDue(task.due_date)}</p></div>
            ${assignees.length ? `<div class="full"><p class="lbl">Responsáveis</p><p class="val">${escapeHtml(assignees.join(', '))}</p></div>` : ''}
            ${task.labels ? `<div class="full"><p class="lbl">Rótulos</p><p class="val">${escapeHtml(task.labels)}</p></div>` : ''}
            ${task.notes ? `<div class="full"><p class="lbl">Notas</p><p class="val">${escapeHtml(task.notes)}</p></div>` : ''}
          </div>
        </div>` : ''}
      </div>
    `;
  }

  function renderTasksCards(tasks) {
    const root = document.getElementById('tasksRoot');
    const sorted = sortTasks(tasks, state.sortBy, state.sortOrder);

    const controlsHtml = `
      <div class="cards-toolbar">
        <div class="cards-toolbar__count">${tasks.length} tarefa${tasks.length !== 1 ? 's' : ''}</div>
        <div class="cards-toolbar__sort">
          <label>Ordenar por</label>
          <select id="cardSortBy">
            <option value="due_date" ${state.sortBy === 'due_date' ? 'selected' : ''}>Previsão de Fim</option>
            <option value="start_date" ${state.sortBy === 'start_date' ? 'selected' : ''}>Início</option>
            <option value="name" ${state.sortBy === 'name' ? 'selected' : ''}>Nome</option>
            <option value="progress" ${state.sortBy === 'progress' ? 'selected' : ''}>Progresso</option>
          </select>
          <button class="icon-btn" id="cardSortOrderBtn" title="Inverter ordem">${state.sortOrder === 'asc' ? ICONS.chevronUp : ICONS.chevronDown}</button>
        </div>
      </div>
    `;

    if (tasks.length === 0) {
      root.innerHTML = controlsHtml + `<div class="empty-state">Nenhuma tarefa encontrada com os filtros atuais.</div>`;
      bindCardsToolbar(tasks);
      return;
    }

    const visible = sorted.slice(0, state.cardsVisibleCount);
    let cardsHtml = `<div class="cards-grid">${visible.map((t, i) => taskCardHtml(t, i)).join('')}</div>`;

    if (sorted.length > visible.length) {
      cardsHtml += `<div class="load-more-wrap"><button class="btn-secondary" id="btnLoadMoreCards">Carregar mais (${sorted.length - visible.length} restantes)</button></div>`;
    }

    root.innerHTML = controlsHtml + cardsHtml;

    document.querySelectorAll('[data-card-toggle]').forEach(btn => {
      btn.onclick = () => {
        const id = btn.getAttribute('data-card-toggle');
        if (state.cardExpandedIds.has(id)) state.cardExpandedIds.delete(id);
        else state.cardExpandedIds.add(id);
        renderTasksCards(tasks);
      };
    });

    const loadMoreBtn = document.getElementById('btnLoadMoreCards');
    if (loadMoreBtn) loadMoreBtn.onclick = () => { state.cardsVisibleCount += 24; renderTasksCards(tasks); };

    bindCardsToolbar(tasks);
  }

  function bindCardsToolbar(tasks) {
    const sortSel = document.getElementById('cardSortBy');
    if (sortSel) sortSel.onchange = e => { state.sortBy = e.target.value; state.cardsVisibleCount = 24; renderTasksCards(tasks); };
    const orderBtn = document.getElementById('cardSortOrderBtn');
    if (orderBtn) orderBtn.onclick = () => { state.sortOrder = state.sortOrder === 'asc' ? 'desc' : 'asc'; renderTasksCards(tasks); };
  }

  /* ============================================================
     Tab: Planners
     ============================================================ */
  function plannerCardHtml(p, idx) {
    const m = computeMetrics(getEffectiveTasks(p));
    const active = p.id === state.activePlannerId;
    const delay = Math.min(idx * 40, 240);
    const activeStyle = active ? `box-shadow:0 0 0 2px ${p.color}55;border-color:${p.color};` : '';

    if (state.editingPlannerId === p.id) {
      const selColor = state.editingPlannerColor || p.color;
      return `
        <div class="planner-card planner-card--editing" style="animation-delay:${delay}ms">
          <div class="planner-card__top">
            <span class="planner-color-dot" style="background:${selColor}"></span>
            <strong class="planner-edit__title">Editar planner</strong>
          </div>
          <div class="planner-edit">
            <label>Nome</label>
            <input class="planner-edit__name" id="plannerEditName" value="${escapeHtml(p.name)}" maxlength="60" />
            <label>Cor</label>
            <div class="color-swatches">
              ${PLANNER_COLORS.map(c => `<button class="color-swatch ${c === selColor ? 'selected' : ''}" data-color-pick="${c}" style="background:${c}" title="${c}"></button>`).join('')}
            </div>
            <div class="planner-edit__actions">
              <button class="btn-secondary subtle" id="btnCancelPlannerEdit">Cancelar</button>
              <button class="btn-primary" id="btnSavePlannerEdit">Salvar</button>
            </div>
          </div>
        </div>
      `;
    }

    return `
      <div class="planner-card" style="animation-delay:${delay}ms;${activeStyle}">
        <div class="planner-card__top">
          <span class="planner-color-dot" style="background:${p.color}"></span>
          <input class="planner-name-input" data-planner-rename="${p.id}" value="${escapeHtml(p.name)}" />
          ${active ? '<span class="planner-active-tag">Ativo</span>' : ''}
        </div>
        <div class="planner-card__stats">
          <div><span class="stat-value">${p.tasks.length}</span><span class="stat-label">Tarefas</span></div>
          <div><span class="stat-value">${m.completionRate}%</span><span class="stat-label">Concluído</span></div>
          <div><span class="stat-value">${m.overdue}</span><span class="stat-label">Atrasadas</span></div>
        </div>
        <p class="planner-card__date">Adicionado em ${formatDate(p.addedAt)}</p>
        <div class="planner-card__actions">
          ${!active ? `<button class="btn-secondary" data-planner-activate="${p.id}">Tornar ativo</button>` : `<button class="btn-secondary" disabled>Planner ativo</button>`}
          <div class="planner-card__icons">
            <button class="icon-btn" data-planner-edit="${p.id}" title="Editar planner">${ICONS.pencil}</button>
            <button class="icon-btn danger" data-planner-remove="${p.id}" title="Excluir planner">${ICONS.trash}</button>
          </div>
        </div>
      </div>
    `;
  }

  function renderPlannersTab() {
    const root = document.getElementById('plannersRoot');

    if (state.pendingImport) {
      root.innerHTML = importMappingHtml();
      bindImportMapping();
      return;
    }

    root.innerHTML = `
      <div class="planners-header">
        <div>
          <h2 class="section-title" style="margin-bottom:.25rem">Meus Arquivos</h2>
          <p class="section-subtitle">Os arquivos importados (Excel ou CSV) ficam vinculados ao seu usuário <strong>${escapeHtml(auth.user ? auth.user.username : '')}</strong> — outros usuários não os visualizam. A aplicação identifica as colunas automaticamente.</p>
        </div>
        <button class="btn-secondary subtle" id="btnResetAllPlanners">Remover todos os meus arquivos</button>
      </div>

      <div class="dropzone" id="plannerDropzone">
        <input type="file" id="plannerFileInput" accept=".xlsx,.xls,.csv" style="display:none" />
        <div class="dropzone__icon">${ICONS.upload}</div>
        <p class="main-text" id="plannerDropzoneText">Arraste um arquivo Excel ou CSV aqui para adicionar um novo planner</p>
        <p class="sub-text">ou clique para selecionar (.xlsx, .xls ou .csv) — qualquer layout de colunas é aceito</p>
      </div>
      ${plannerUploadMessage ? `
      <div class="upload-message ${plannerUploadMessage.type}">
        ${plannerUploadMessage.type === 'success' ? ICONS.checkCircle : ICONS.alertCircle}
        <p>${escapeHtml(plannerUploadMessage.text)}</p>
      </div>` : ''}

      <div class="planners-grid">
        ${state.planners.map((p, idx) => plannerCardHtml(p, idx)).join('')}
      </div>
    `;
    bindPlannersTab();
  }

  function bindPlannersTab() {
    const dropzone = document.getElementById('plannerDropzone');
    const fileInput = document.getElementById('plannerFileInput');
    if (dropzone) {
      dropzone.onclick = () => fileInput.click();
      dropzone.ondragover = e => { e.preventDefault(); dropzone.classList.add('dragging'); };
      dropzone.ondragleave = () => dropzone.classList.remove('dragging');
      dropzone.ondrop = e => {
        e.preventDefault();
        dropzone.classList.remove('dragging');
        const files = e.dataTransfer.files;
        if (files.length > 0) onPlannerFileSelected(files[0]);
      };
    }
    if (fileInput) fileInput.onchange = e => { if (e.target.files.length > 0) onPlannerFileSelected(e.target.files[0]); };

    document.querySelectorAll('[data-planner-activate]').forEach(btn => {
      btn.onclick = () => setActivePlanner(btn.getAttribute('data-planner-activate'));
    });

    document.querySelectorAll('[data-planner-remove]').forEach(btn => {
      btn.onclick = () => {
        const id = btn.getAttribute('data-planner-remove');
        const p = state.planners.find(pl => pl.id === id);
        if (p && confirm(`Excluir o planner "${p.name}" e suas ${p.tasks.length} tarefas? Essa ação não pode ser desfeita.`)) removePlanner(id);
      };
    });

    document.querySelectorAll('[data-planner-edit]').forEach(btn => {
      btn.onclick = () => {
        state.editingPlannerId = btn.getAttribute('data-planner-edit');
        state.editingPlannerColor = null;
        renderPlannersTab();
        const nameInput = document.getElementById('plannerEditName');
        if (nameInput) nameInput.focus();
      };
    });

    document.querySelectorAll('[data-color-pick]').forEach(sw => {
      sw.onclick = () => {
        state.editingPlannerColor = sw.getAttribute('data-color-pick');
        document.querySelectorAll('[data-color-pick]').forEach(s => s.classList.toggle('selected', s === sw));
      };
    });

    const saveEditBtn = document.getElementById('btnSavePlannerEdit');
    if (saveEditBtn) saveEditBtn.onclick = () => {
      const nameInput = document.getElementById('plannerEditName');
      updatePlanner(state.editingPlannerId, nameInput ? nameInput.value : null, state.editingPlannerColor);
    };

    const cancelEditBtn = document.getElementById('btnCancelPlannerEdit');
    if (cancelEditBtn) cancelEditBtn.onclick = () => {
      state.editingPlannerId = null;
      state.editingPlannerColor = null;
      renderPlannersTab();
    };

    document.querySelectorAll('[data-planner-rename]').forEach(input => {
      input.onblur = () => renamePlanner(input.getAttribute('data-planner-rename'), input.value);
      input.onkeydown = e => { if (e.key === 'Enter') input.blur(); };
    });

    const resetBtn = document.getElementById('btnResetAllPlanners');
    if (resetBtn) resetBtn.onclick = resetAllPlanners;
  }

  /* ============================================================
     Tab: Comparar
     ============================================================ */
  /* ============================================================
     Análise de prazos — previsto × realizado (tarefas concluídas)
     ============================================================ */
  function computeDeadlineStats(tasks) {
    const rows = [];
    tasks.forEach(t => {
      if (t.statusGroup !== 'completed') return;
      const due = parseDate(t.due_date);
      const done = parseDate(t.completed_at);
      if (!due || !done) return;
      const start = parseDate(t.start_date);
      // Prazo estimado = previsão - início | Prazo real = conclusão - início
      const estimated = start ? dayDiff(start, due) : null;
      const real = start ? dayDiff(start, done) : null;
      // Desvio = prazo real - prazo estimado (equivale a conclusão - previsão)
      const deviation = dayDiff(due, done);
      let deviationPct = null;
      if (estimated !== null && estimated !== 0) deviationPct = Math.round((deviation / estimated) * 1000) / 10;
      rows.push({ task: t, start, due, done, estimated, real, deviation, deviationPct });
    });

    rows.sort((a, b) => b.deviation - a.deviation);

    const before = rows.filter(r => r.deviation < 0);
    const onTime = rows.filter(r => r.deviation === 0);
    const after = rows.filter(r => r.deviation > 0);
    const avg = arr => (arr.length ? arr.reduce((s, x) => s + x, 0) / arr.length : null);
    const round1 = v => (v === null ? null : Math.round(v * 10) / 10);

    return {
      rows,
      total: rows.length,
      before: before.length,
      onTime: onTime.length,
      after: after.length,
      avgAnticipation: round1(avg(before.map(r => -r.deviation))),
      avgDelay: round1(avg(after.map(r => r.deviation))),
      avgDeviation: round1(avg(rows.map(r => r.deviation))),
    };
  }

  function signedDays(v) {
    if (v === null || v === undefined) return '—';
    return (v > 0 ? '+' : '') + v + 'd';
  }

  function deviationClass(v) {
    if (v < 0) return 'dev-neg';
    if (v > 0) return 'dev-pos';
    return 'dev-zero';
  }

  function deviationBadge(v) {
    if (v < 0) return `<span class="badge-pill" style="background:${COLORS.success}18;color:${COLORS.success}">Antecipada</span>`;
    if (v > 0) return `<span class="badge-pill" style="background:${COLORS.error}18;color:${COLORS.error}">Atrasada</span>`;
    return `<span class="badge-pill" style="background:${COLORS.primary}18;color:${COLORS.primary}">No prazo</span>`;
  }

  function deadlineKpiCard(icon, label, value, color) {
    return `
      <div class="kpi-card kpi-card--static">
        <div class="kpi-card__top">
          <div>
            <p class="kpi-card__label">${label}</p>
            <p class="kpi-card__value">${value}</p>
          </div>
          <div class="kpi-card__icon" style="background:${color}15;color:${color}">${ICONS[icon]}</div>
        </div>
      </div>
    `;
  }

  function deadlineSectionHtml(dl, planner) {
    const plannerName = planner ? planner.name : '—';
    const hasAdjust = planner && (planner.adjustments || []).length > 0;

    if (dl.total === 0) {
      return `
        <h3 class="section-title" style="font-size:1.05rem">Análise de Prazos — Previsto × Realizado</h3>
        <p class="section-subtitle" style="margin-bottom:1rem">Planner ativo: <strong>${escapeHtml(plannerName)}</strong></p>
        <div class="empty-state" style="margin-bottom:1.5rem">Nenhuma atividade concluída com data de previsão e data de conclusão disponíveis. Complete os dados na aba "Ajustes" para habilitar esta análise.</div>
      `;
    }

    return `
      <h3 class="section-title" style="font-size:1.05rem">Análise de Prazos — Previsto × Realizado</h3>
      <p class="section-subtitle" style="margin-bottom:1rem">
        Planner ativo: <strong>${escapeHtml(plannerName)}</strong> — atividades concluídas com datas de previsão e conclusão.
        ${hasAdjust ? 'Ajustes manuais da aba "Ajustes" já aplicados.' : ''}
        Clique em uma atividade (no gráfico de desvios ou na tabela) para abrir o rastreamento completo.
      </p>

      <div class="kpi-grid">
        ${deadlineKpiCard('alertCircle', 'Atividades Analisadas', dl.total, COLORS.primary)}
        ${deadlineKpiCard('checkCircle', 'Antes do Prazo', dl.before, COLORS.success)}
        ${deadlineKpiCard('flag', 'No Prazo', dl.onTime, COLORS.primary)}
        ${deadlineKpiCard('alertCircle', 'Após o Prazo', dl.after, COLORS.error)}
        ${deadlineKpiCard('trendingUp', 'Média de Antecipação', dl.avgAnticipation !== null ? dl.avgAnticipation + 'd' : '—', COLORS.success)}
        ${deadlineKpiCard('clock', 'Média de Atraso', dl.avgDelay !== null ? dl.avgDelay + 'd' : '—', COLORS.warning)}
        ${deadlineKpiCard('calendar', 'Desvio Médio', dl.avgDeviation !== null ? signedDays(dl.avgDeviation) : '—', COLORS.primary)}
      </div>

      <div class="charts-grid" style="margin-bottom:1.5rem">
        <div class="chart-card">
          <h3>Cumprimento do Prazo</h3>
          <canvas id="chartDeadlineSplit"></canvas>
        </div>
        <div class="chart-card">
          <h3>Maiores Desvios (dias)</h3>
          <p class="chart-click-hint">Clique em uma barra para rastrear a atividade</p>
          <canvas id="chartDeadlineDeviation"></canvas>
        </div>
      </div>

      <div class="compare-table-card deadline-table-card" style="margin-bottom:2rem">
        <div class="table-scroll deadline-table-scroll">
          <table class="compare-table">
            <thead>
              <tr>
                <th>Atividade</th><th>Início</th><th>Previsão</th><th>Conclusão</th>
                <th>Prazo Estimado</th><th>Prazo Real</th><th>Desvio</th><th>Desvio %</th><th>Situação</th>
              </tr>
            </thead>
            <tbody>
              ${dl.rows.map((r, i) => `
                <tr class="deadline-row-click" data-deadline-row="${i}" title="Clique para ver o rastreamento completo">
                  <td class="deadline-task-name" title="${escapeHtml(r.task.name)}">
                    ${escapeHtml(r.task.name)}
                    ${r.task._adjusted ? '<span class="adjusted-tag" title="Datas complementadas manualmente na aba Ajustes">ajustada</span>' : ''}
                  </td>
                  <td>${r.start ? r.start.toLocaleDateString('pt-BR') : '—'}</td>
                  <td>${r.due.toLocaleDateString('pt-BR')}</td>
                  <td>${r.done.toLocaleDateString('pt-BR')}</td>
                  <td>${r.estimated !== null ? r.estimated + 'd' : '—'}</td>
                  <td>${r.real !== null ? r.real + 'd' : '—'}</td>
                  <td class="${deviationClass(r.deviation)}"><strong>${signedDays(r.deviation)}</strong></td>
                  <td class="${deviationClass(r.deviation)}">${r.deviationPct !== null ? (r.deviationPct > 0 ? '+' : '') + r.deviationPct + '%' : '—'}</td>
                  <td>${deviationBadge(r.deviation)}</td>
                </tr>`).join('')}
            </tbody>
          </table>
        </div>
      </div>
    `;
  }

  function renderDeadlineCharts(dl) {
    const splitEl = document.getElementById('chartDeadlineSplit');
    const devEl = document.getElementById('chartDeadlineDeviation');
    if (!splitEl || !devEl || dl.total === 0) return;

    state.compareCharts.deadlineSplit = new Chart(splitEl, {
      type: 'doughnut',
      data: {
        labels: ['Antes do prazo', 'No prazo', 'Após o prazo'],
        datasets: [{ data: [dl.before, dl.onTime, dl.after], backgroundColor: [COLORS.success, COLORS.primary, COLORS.error], borderWidth: 2, borderColor: '#fff' }],
      },
      options: { responsive: true, maintainAspectRatio: true, cutout: '62%', plugins: { legend: { position: 'bottom' } } },
    });

    const topDev = dl.rows
      .slice()
      .sort((a, b) => Math.abs(b.deviation) - Math.abs(a.deviation))
      .slice(0, 10);
    state.compareCharts.deadlineDeviation = new Chart(devEl, {
      type: 'bar',
      data: {
        labels: topDev.map(r => r.task.name.length > 32 ? r.task.name.slice(0, 30) + '…' : r.task.name),
        datasets: [{
          data: topDev.map(r => r.deviation),
          backgroundColor: topDev.map(r => (r.deviation > 0 ? COLORS.error : r.deviation < 0 ? COLORS.success : COLORS.primary)),
          borderRadius: 6,
        }],
      },
      options: {
        indexAxis: 'y', responsive: true, maintainAspectRatio: true,
        onClick: (evt, els) => { if (els.length) openTaskTraceModal(topDev[els[0].index]); },
        onHover: (evt, els) => {
          const target = evt.native && evt.native.target;
          if (target) target.style.cursor = els.length ? 'pointer' : 'default';
        },
        plugins: {
          legend: { display: false },
          tooltip: {
            callbacks: {
              title: items => topDev[items[0].dataIndex].task.name,
              label: ctx => {
                const r = topDev[ctx.dataIndex];
                const perf = taskPerformance(r);
                return [
                  'Responsável: ' + ((r.task.assignees || []).join(', ') || 'Não disponível'),
                  'Tempo estimado: ' + (r.estimated !== null ? r.estimated + 'd' : 'Não disponível'),
                  'Tempo realizado: ' + (r.real !== null ? r.real + 'd' : 'Não disponível'),
                  'Desvio: ' + signedDays(r.deviation),
                  'Situação: ' + perf.label,
                  '➜ Clique para ver o rastreamento completo',
                ];
              },
            },
          },
        },
        scales: { x: { ticks: { callback: v => signedDays(v) } } },
      },
    });

    // Linhas da tabela de prazos também abrem o rastreamento da atividade
    document.querySelectorAll('[data-deadline-row]').forEach(tr => {
      tr.onclick = () => {
        const row = dl.rows[Number(tr.getAttribute('data-deadline-row'))];
        if (row) openTaskTraceModal(row);
      };
    });
  }

  /* ============================================================
     Rastreamento completo da atividade (aba Comparação)
     — detalhe sob demanda, sem sair da aba nem perder filtros
     ============================================================ */
  function taskPerformance(row) {
    if (!row.due || !row.done) {
      if (row.task.statusGroup !== 'completed') return { label: 'Em andamento', color: COLORS.primary };
      return { label: 'Dados insuficientes', color: COLORS.muted };
    }
    if (row.deviation < 0) return { label: 'Antecipada', color: COLORS.success };
    if (row.deviation > 0) return { label: 'Atrasada', color: COLORS.error };
    return { label: 'No prazo', color: COLORS.primary };
  }

  function traceDate(ds) {
    const d = parseDate(ds);
    return d ? d.toLocaleDateString('pt-BR') : null;
  }

  function traceDateTime(iso) {
    if (!iso) return null;
    const d = new Date(iso);
    return isNaN(d.getTime()) ? null : d.toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' });
  }

  function traceVal(v) {
    return (v === null || v === undefined || v === '') ? '<span class="tt-na">Não disponível</span>' : escapeHtml(String(v));
  }

  function traceField(label, valueHtml) {
    return `<div class="tt-field"><label>${label}</label><div class="tt-value">${valueHtml}</div></div>`;
  }

  function traceSourceTag(manual) {
    return manual
      ? `<span class="tt-src tt-src--manual" title="Valor definido na aba Ajustes — o dado original do arquivo permanece preservado">Ajuste manual</span>`
      : `<span class="tt-src tt-src--excel" title="Valor original importado do Planner/Excel">Planner/Excel</span>`;
  }

  function openTaskTraceModal(row) {
    const task = row.task;
    const planner = getActivePlanner();
    const adj = planner ? ((planner.adjustments || []).find(a => a.id === task._adjustmentId) || findAdjustmentForTask(planner, task)) : null;
    const orig = task._original || { start_date: task.start_date, due_date: task.due_date, completed_at: task.completed_at };
    const perf = taskPerformance(row);

    // Cabeçalho do modal (reaproveita a estrutura do modal de KPIs)
    document.getElementById('modalIcon').innerHTML = ICONS.trendingUp;
    document.getElementById('modalIcon').style.color = perf.color;
    document.getElementById('modalTitle').textContent = task.name;
    document.getElementById('modalDescription').textContent = `Rastreamento completo da atividade — Plano: ${planner ? planner.name : 'Não disponível'}`;

    // ---- Status de desempenho ----
    const explainParts = [];
    if (row.estimated !== null) explainParts.push(`Tempo estimado: <strong>${row.estimated} dia${row.estimated === 1 ? '' : 's'}</strong>`);
    if (row.real !== null) explainParts.push(`Tempo realizado: <strong>${row.real} dia${row.real === 1 ? '' : 's'}</strong>`);
    if (row.deviation !== null && row.deviation !== undefined) explainParts.push(`Desvio: <strong>${signedDays(row.deviation)}</strong>`);
    explainParts.push(`Resultado: <strong style="color:${perf.color}">${perf.label}</strong>`);
    let explainText = '';
    if (row.deviation < 0) explainText = `Concluída ${Math.abs(row.deviation)} dia${Math.abs(row.deviation) === 1 ? '' : 's'} antes da data prevista.`;
    else if (row.deviation > 0) explainText = `Concluída ${row.deviation} dia${row.deviation === 1 ? '' : 's'} depois da data prevista.`;
    else if (row.due && row.done) explainText = 'Concluída exatamente na data prevista.';

    const statusHtml = `
      <div class="tt-section" style="animation-delay:0ms">
        <div class="tt-status-banner" style="border-color:${perf.color}55;background:${perf.color}0f">
          <span class="badge-pill" style="background:${perf.color}">${perf.label}</span>
          <div class="tt-status-lines">
            <p>${explainParts.join(' &nbsp;·&nbsp; ')}</p>
            ${explainText ? `<p class="tt-status-explain">${explainText}</p>` : ''}
          </div>
        </div>
      </div>`;

    // ---- Identificação ----
    const idHtml = `
      <div class="tt-section" style="animation-delay:40ms">
        <h4>Identificação</h4>
        <div class="tt-grid">
          ${traceField('Atividade', traceVal(task.name))}
          ${traceField('ID da atividade', traceVal(task.id))}
          ${traceField('Plano', traceVal(planner ? planner.name : null))}
          ${traceField('Projeto / Bucket / Lista', traceVal(task.category !== 'Sem categoria' ? task.category : null))}
          ${traceField('Responsável', traceVal((task.assignees || []).join(', ') || null))}
          ${traceField('Área / Equipe', traceVal(task.client || null))}
          ${traceField('Tipo de tarefa', traceVal(task.taskType || null))}
          ${traceField('Prioridade', traceVal(task.priority))}
          ${traceField('Status', traceVal(task.status))}
          ${traceField('Percentual de conclusão', `${Math.round(task.progress || 0)}%`)}
        </div>
      </div>`;

    // ---- Datas (valores em uso na análise, com origem identificada) ----
    const dateWithSrc = (ds, adjusted) => {
      const v = traceDate(ds);
      return v ? `${escapeHtml(v)} ${traceSourceTag(adjusted)}` : '<span class="tt-na">Não disponível</span>';
    };
    const lastUpdate = adj ? (adj.updatedAtIso || adj.createdAtIso) : null;
    const datesHtml = `
      <div class="tt-section" style="animation-delay:80ms">
        <h4>Datas</h4>
        <div class="tt-grid">
          ${traceField('Data de criação', dateWithSrc(task.created_at, false))}
          ${traceField('Data de início', dateWithSrc(task.start_date, !!(adj && adj.start_date)))}
          ${traceField('Data prevista de conclusão', dateWithSrc(task.due_date, !!(adj && adj.due_date)))}
          ${traceField('Data real de conclusão', dateWithSrc(task.completed_at, !!(adj && adj.completed_at)))}
          ${traceField('Última atualização no sistema', traceVal(traceDateTime(lastUpdate)))}
        </div>
      </div>`;

    // ---- Tempos ----
    const timesHtml = `
      <div class="tt-section" style="animation-delay:120ms">
        <h4>Tempos</h4>
        <div class="tt-grid">
          ${traceField('Tempo estimado (previsão − início)', row.estimated !== null ? row.estimated + ' dia' + (row.estimated === 1 ? '' : 's') : '<span class="tt-na">Não disponível</span>')}
          ${traceField('Tempo real de execução (conclusão − início)', row.real !== null ? row.real + ' dia' + (row.real === 1 ? '' : 's') : '<span class="tt-na">Não disponível</span>')}
          ${traceField('Diferença estimado × realizado', `<strong style="color:${perf.color}">${signedDays(row.deviation)}</strong>`)}
          ${traceField('Percentual de desvio', row.deviationPct !== null ? (row.deviationPct > 0 ? '+' : '') + row.deviationPct + '%' : '<span class="tt-na">Não disponível</span>')}
          ${traceField(row.deviation < 0 ? 'Dias de antecipação' : 'Dias de atraso', row.deviation === 0 ? '0 (no prazo)' : Math.abs(row.deviation) + ' dia' + (Math.abs(row.deviation) === 1 ? '' : 's'))}
        </div>
      </div>`;

    // ---- Linha do tempo ----
    const tlItems = [
      { title: 'Criada', date: traceDate(task.created_at), color: COLORS.muted, manual: false },
      { title: 'Iniciada', date: traceDate(task.start_date), color: COLORS.primary, manual: !!(adj && adj.start_date) },
      { title: 'Previsão de conclusão', date: traceDate(task.due_date), color: COLORS.warning, manual: !!(adj && adj.due_date) },
      { title: 'Concluída', date: traceDate(task.completed_at), color: COLORS.success, manual: !!(adj && adj.completed_at) },
    ];
    const adjEvents = [];
    if (adj) {
      const FIELD_LABELS = { start_date: 'Data de início', due_date: 'Data prevista', completed_at: 'Data de conclusão' };
      const changed = Object.keys(FIELD_LABELS).filter(k => adj[k]);
      adjEvents.push({
        title: 'Ajuste realizado',
        date: traceDateTime(adj.createdAtIso) || traceDate(adj.adjustedAt),
        color: COLORS.warning,
        manual: true,
        detail: `Campo(s): ${changed.map(k => FIELD_LABELS[k]).join(', ') || '—'} · Usuário: ${escapeHtml(adj.createdByName || adj.responsible || 'Não disponível')}`,
      });
      if (adj.updatedAtIso && adj.updatedAtIso !== adj.createdAtIso) {
        adjEvents.push({
          title: 'Ajuste atualizado',
          date: traceDateTime(adj.updatedAtIso),
          color: COLORS.warning,
          manual: true,
          detail: `Usuário: ${escapeHtml(adj.updatedByName || 'Não disponível')}`,
        });
      }
    }
    const timelineHtml = `
      <div class="tt-section" style="animation-delay:160ms">
        <h4>Linha do tempo</h4>
        <div class="tt-timeline">
          ${tlItems.concat(adjEvents).map(it => `
            <div class="tt-tl-item">
              <span class="tt-tl-dot" style="background:${it.date ? it.color : 'var(--color-muted)'}"></span>
              <div class="tt-tl-body">
                <p class="tt-tl-title">${it.title} ${it.manual ? traceSourceTag(true) : ''}</p>
                <p class="tt-tl-date">${it.date ? escapeHtml(it.date) : 'Não disponível'}</p>
                ${it.detail ? `<p class="tt-tl-detail">${it.detail}</p>` : ''}
              </div>
            </div>`).join('')}
        </div>
      </div>`;

    // ---- Dados originais × dados ajustados (auditoria — original nunca é sobrescrito) ----
    let originalsHtml = '';
    if (task._adjusted && adj) {
      const cmpRow = (label, origVal, adjVal) => `
        <tr>
          <td>${label}</td>
          <td>${traceDate(origVal) ? escapeHtml(traceDate(origVal)) : '<span class="tt-na">Não disponível</span>'}</td>
          <td>${adjVal
            ? `<strong>${escapeHtml(traceDate(adjVal) || adjVal)}</strong> ${traceSourceTag(true)}`
            : `${traceDate(origVal) ? escapeHtml(traceDate(origVal)) : '<span class="tt-na">Não disponível</span>'} ${traceSourceTag(false)}`}</td>
        </tr>`;
      originalsHtml = `
        <div class="tt-section" style="animation-delay:200ms">
          <h4>Dados originais × dados ajustados</h4>
          <p class="tt-note">O dado original do Planner/Excel é sempre preservado — o ajuste manual apenas se sobrepõe nas análises.</p>
          <div class="table-scroll">
            <table class="compare-table tt-cmp-table">
              <thead><tr><th>Campo</th><th>Original (Planner/Excel)</th><th>Em uso na análise</th></tr></thead>
              <tbody>
                ${cmpRow('Início', orig.start_date, adj.start_date)}
                ${cmpRow('Previsão', orig.due_date, adj.due_date)}
                ${cmpRow('Conclusão', orig.completed_at, adj.completed_at)}
              </tbody>
            </table>
          </div>
        </div>`;
    }

    // ---- Histórico de alterações (registro do ajuste + trilha de auditoria) ----
    let historyItems = '';
    if (adj) {
      const FIELD_LABELS = { start_date: 'Data de início', due_date: 'Data prevista', completed_at: 'Data de conclusão' };
      const changes = Object.keys(FIELD_LABELS).filter(k => adj[k]).map(k => `
        <p class="tt-hist-change">${FIELD_LABELS[k]} alterada — De: <strong>${traceDate(orig[k]) || 'Não disponível'}</strong> · Para: <strong>${traceDate(adj[k]) || escapeHtml(adj[k])}</strong></p>`).join('');
      historyItems = `
        <div class="tt-hist-item">
          <p class="tt-hist-head">${traceDateTime(adj.createdAtIso) || traceDate(adj.adjustedAt) || 'Data não disponível'} — <strong>${escapeHtml(adj.createdByName || adj.responsible || 'Não disponível')}</strong></p>
          ${changes}
          ${adj.note ? `<p class="tt-hist-note">Observação: ${escapeHtml(adj.note)}</p>` : ''}
        </div>
        ${adj.updatedAtIso && adj.updatedAtIso !== adj.createdAtIso ? `
        <div class="tt-hist-item">
          <p class="tt-hist-head">${traceDateTime(adj.updatedAtIso)} — <strong>${escapeHtml(adj.updatedByName || 'Não disponível')}</strong></p>
          <p class="tt-hist-change">Ajuste atualizado (valores acima refletem a versão vigente).</p>
        </div>` : ''}`;
    } else {
      historyItems = '<p class="tt-na" style="padding:.25rem 0">Nenhum ajuste manual registrado — a análise usa somente os dados originais do Planner/Excel.</p>';
    }
    const historyHtml = `
      <div class="tt-section" style="animation-delay:240ms">
        <h4>Histórico da atividade</h4>
        ${historyItems}
        <div id="ttAuditRoot" class="tt-audit-root"><p class="tt-na">Carregando trilha de auditoria do sistema…</p></div>
      </div>`;

    // ---- Rastreabilidade do responsável ----
    const traceRespHtml = `
      <div class="tt-section" style="animation-delay:280ms">
        <h4>Rastreabilidade do responsável</h4>
        <div class="tt-grid">
          ${traceField('Responsável pela atividade', traceVal((task.assignees || [])[0] || null))}
          ${traceField('Participantes', traceVal((task.assignees || []).length > 1 ? task.assignees.join(', ') : ((task.assignees || []).length === 1 ? task.assignees[0] : null)))}
          ${traceField('Área / Equipe', traceVal(task.client || null))}
          ${traceField('Quem iniciou', traceVal(null))}
          ${traceField('Quem concluiu', traceVal(null))}
          ${traceField('Quem registrou ajustes no sistema', traceVal(adj ? (adj.createdByName || adj.responsible || null) : null))}
          ${traceField('Última alteração por', traceVal(adj ? (adj.updatedByName || null) : null))}
        </div>
        <p class="tt-note">Informações exibidas somente quando presentes no Planner/Excel ou registradas no sistema — nenhum valor é inventado.</p>
      </div>`;

    document.getElementById('modalBody').innerHTML =
      statusHtml + idHtml + datesHtml + timesHtml + timelineHtml + originalsHtml + historyHtml + traceRespHtml;

    document.getElementById('modalOverlay').classList.add('open');
    document.getElementById('modalPanel').classList.add('open');

    loadTaskTraceAudit(task.name);
  }

  // Trilha de auditoria da atividade — carregada sob demanda ao abrir o detalhe
  async function loadTaskTraceAudit(taskName) {
    const root = document.getElementById('ttAuditRoot');
    if (!root) return;
    if (!cloud.db) {
      root.innerHTML = '<p class="tt-na">Trilha de auditoria disponível apenas com a nuvem conectada.</p>';
      return;
    }
    try {
      const snap = await cloud.db.collection('audit').where('target', '==', String(taskName)).limit(30).get();
      const el = document.getElementById('ttAuditRoot');
      if (!el) return; // modal fechado/re-renderizado enquanto carregava
      const entries = snap.docs.map(d => d.data())
        .filter(a => /ajuste/i.test(a.action || ''))
        .sort((a, b) => String(b.atIso || '').localeCompare(String(a.atIso || '')));
      if (!entries.length) {
        el.innerHTML = '<p class="tt-na">Nenhum registro desta atividade na trilha de auditoria do sistema.</p>';
        return;
      }
      el.innerHTML = `
        <p class="tt-audit-title">Trilha de auditoria do sistema (somente leitura)</p>
        ${entries.map(a => `
          <div class="tt-hist-item tt-hist-item--audit">
            <p class="tt-hist-head">${a.atIso ? new Date(a.atIso).toLocaleString('pt-BR') : 'Data não disponível'} — <strong>${escapeHtml(a.fullName || a.username || 'Não disponível')}</strong> · ${escapeHtml(a.action || '')}</p>
            ${a.before ? `<p class="tt-hist-change">De: ${escapeHtml(a.before)}</p>` : ''}
            ${a.after ? `<p class="tt-hist-change">Para: ${escapeHtml(a.after)}</p>` : ''}
          </div>`).join('')}`;
    } catch (e) {
      console.warn('Falha ao carregar trilha de auditoria da atividade.', e);
      const el = document.getElementById('ttAuditRoot');
      if (el) el.innerHTML = '<p class="tt-na">Não foi possível carregar a trilha de auditoria.</p>';
    }
  }

  function renderCompareTab() {
    const root = document.getElementById('compareRoot');

    Object.values(state.compareCharts).forEach(c => c && c.destroy());
    state.compareCharts = {};

    const activePlanner = getActivePlanner();
    const activeTasks = activePlanner ? getFilteredTasks(getEffectiveTasks(activePlanner)) : [];
    const deadlineStats = computeDeadlineStats(activeTasks);
    const deadlineHtml = deadlineSectionHtml(deadlineStats, activePlanner);

    if (state.planners.length < 2) {
      root.innerHTML = `
        ${deadlineHtml}
        <h3 class="section-title" style="font-size:1.05rem">Comparativo entre Planners</h3>
        <div class="empty-state">Adicione pelo menos 2 planners na aba "Planners" para comparar resultados.</div>
      `;
      renderDeadlineCharts(deadlineStats);
      return;
    }

    // Filtros da barra lateral aplicados a todos os planners (com ajustes manuais aplicados)
    const rows = state.planners.map(p => {
      const filtered = getFilteredTasks(getEffectiveTasks(p));
      return { planner: p, tasks: filtered, metrics: computeMetrics(filtered) };
    });

    const activeFilterCount = Object.keys(state.filters).length;

    // Entregas no prazo (%): concluídas até a data de previsão
    const onTimeRate = tasks => {
      const withBoth = tasks.filter(t => t.statusGroup === 'completed' && parseDate(t.completed_at) && parseDate(t.due_date));
      if (!withBoth.length) return null;
      const onTime = withBoth.filter(t => parseDate(t.completed_at) <= parseDate(t.due_date)).length;
      return Math.round((onTime / withBoth.length) * 100);
    };

    // Conclusões por mês (para o gráfico de linha)
    const monthKey = d => d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0');
    const monthlyMaps = rows.map(r => {
      const map = {};
      r.tasks.forEach(t => {
        const d = parseDate(t.completed_at);
        if (d) map[monthKey(d)] = (map[monthKey(d)] || 0) + 1;
      });
      return map;
    });
    const allMonths = Array.from(new Set(monthlyMaps.flatMap(m => Object.keys(m)))).sort().slice(-12);
    const monthLabels = allMonths.map(k => {
      const [y, m] = k.split('-').map(Number);
      return new Date(y, m - 1, 1).toLocaleDateString('pt-BR', { month: 'short', year: '2-digit' });
    });

    root.innerHTML = `
      ${deadlineHtml}
      <h3 class="section-title" style="font-size:1.05rem">Comparativo entre Planners</h3>
      ${activeFilterCount > 0 ? `
      <div class="compare-filters-note">
        ${ICONS.checkCircle}
        <span>Comparando com <strong>${activeFilterCount} filtro${activeFilterCount !== 1 ? 's' : ''} ativo${activeFilterCount !== 1 ? 's' : ''}</strong> — aplicados a todos os planners. Use o ícone de funil na lateral para ajustar.</span>
      </div>` : `
      <p class="section-subtitle" style="margin-bottom:1rem">Dica: os filtros da barra lateral (ano, status, responsável...) também se aplicam a esta comparação.</p>`}

      <div class="compare-table-card">
        <div class="table-scroll">
          <table class="compare-table">
            <thead>
              <tr>
                <th>Planner</th><th>Tarefas</th><th>Concluídas</th><th>Em Andamento</th><th>Atrasadas</th><th>Taxa de Conclusão</th><th>No Prazo</th><th>Duração Média</th>
              </tr>
            </thead>
            <tbody>
              ${rows.map(r => {
                const ot = onTimeRate(r.tasks);
                return `
                <tr>
                  <td><span class="planner-color-dot" style="background:${r.planner.color}"></span>${escapeHtml(r.planner.name)}</td>
                  <td>${r.metrics.total}</td>
                  <td>${r.metrics.completed}</td>
                  <td>${r.metrics.inProgress}</td>
                  <td>${r.metrics.overdue}</td>
                  <td><strong>${r.metrics.completionRate}%</strong></td>
                  <td>${ot !== null ? ot + '%' : '—'}</td>
                  <td>${r.metrics.avgDuration !== null ? r.metrics.avgDuration + 'd' : '—'}</td>
                </tr>`;
              }).join('')}
            </tbody>
          </table>
        </div>
      </div>

      <div class="charts-grid" style="margin-top:1.5rem">
        <div class="chart-card">
          <h3>Taxa de Conclusão por Planner</h3>
          <canvas id="chartCompareCompletion"></canvas>
        </div>
        <div class="chart-card">
          <h3>Status por Planner</h3>
          <canvas id="chartCompareStatus"></canvas>
        </div>
        <div class="chart-card full">
          <h3>Evolução de Conclusões por Mês</h3>
          <canvas id="chartCompareMonthly"></canvas>
        </div>
        <div class="chart-card">
          <h3>Volume de Tarefas por Planner</h3>
          <canvas id="chartCompareVolume"></canvas>
        </div>
        <div class="chart-card">
          <h3>Radar de Desempenho (%)</h3>
          <canvas id="chartCompareRadar"></canvas>
        </div>
      </div>
    `;

    renderDeadlineCharts(deadlineStats);

    state.compareCharts.completion = new Chart(document.getElementById('chartCompareCompletion'), {
      type: 'bar',
      data: { labels: rows.map(r => r.planner.name), datasets: [{ data: rows.map(r => r.metrics.completionRate), backgroundColor: rows.map(r => r.planner.color), borderRadius: 10 }] },
      options: { responsive: true, maintainAspectRatio: true, plugins: { legend: { display: false } }, scales: { y: { beginAtZero: true, max: 100, ticks: { callback: v => v + '%' } } } },
    });

    state.compareCharts.status = new Chart(document.getElementById('chartCompareStatus'), {
      type: 'bar',
      data: {
        labels: rows.map(r => r.planner.name),
        datasets: [
          { label: 'Concluídas', data: rows.map(r => r.metrics.completed), backgroundColor: COLORS.success, borderRadius: 6 },
          { label: 'Em andamento', data: rows.map(r => r.metrics.inProgress), backgroundColor: COLORS.primary, borderRadius: 6 },
          { label: 'Não iniciado', data: rows.map(r => r.metrics.notStarted), backgroundColor: COLORS.muted, borderRadius: 6 },
        ],
      },
      options: { responsive: true, maintainAspectRatio: true, plugins: { legend: { position: 'bottom' } }, scales: { x: { stacked: true }, y: { stacked: true, beginAtZero: true, ticks: { precision: 0 } } } },
    });

    if (allMonths.length > 0) {
      state.compareCharts.monthly = new Chart(document.getElementById('chartCompareMonthly'), {
        type: 'line',
        data: {
          labels: monthLabels,
          datasets: rows.map((r, i) => ({
            label: r.planner.name,
            data: allMonths.map(k => monthlyMaps[i][k] || 0),
            borderColor: r.planner.color,
            backgroundColor: r.planner.color + '22',
            fill: true,
            tension: .35,
            pointRadius: 3,
            pointHoverRadius: 6,
          })),
        },
        options: {
          responsive: true, maintainAspectRatio: true,
          plugins: { legend: { position: 'bottom' } },
          scales: { y: { beginAtZero: true, ticks: { precision: 0 } } },
          interaction: { mode: 'index', intersect: false },
        },
      });
    }

    state.compareCharts.volume = new Chart(document.getElementById('chartCompareVolume'), {
      type: 'doughnut',
      data: {
        labels: rows.map(r => r.planner.name),
        datasets: [{ data: rows.map(r => r.metrics.total), backgroundColor: rows.map(r => r.planner.color), borderWidth: 2, borderColor: '#fff' }],
      },
      options: { responsive: true, maintainAspectRatio: true, cutout: '62%', plugins: { legend: { position: 'bottom' } } },
    });

    state.compareCharts.radar = new Chart(document.getElementById('chartCompareRadar'), {
      type: 'radar',
      data: {
        labels: ['Conclusão', 'No prazo', 'Em andamento', 'Sem atraso', 'Com responsável'],
        datasets: rows.map(r => {
          const t = r.metrics.total || 1;
          const ot = onTimeRate(r.tasks);
          const withAssignee = r.tasks.filter(x => (x.assignees || []).length > 0).length;
          return {
            label: r.planner.name,
            data: [
              r.metrics.completionRate,
              ot !== null ? ot : 0,
              Math.round((r.metrics.inProgress / t) * 100),
              100 - Math.round((r.metrics.overdue / t) * 100),
              Math.round((withAssignee / t) * 100),
            ],
            borderColor: r.planner.color,
            backgroundColor: r.planner.color + '2e',
            pointBackgroundColor: r.planner.color,
          };
        }),
      },
      options: {
        responsive: true, maintainAspectRatio: true,
        plugins: { legend: { position: 'bottom' } },
        scales: { r: { beginAtZero: true, max: 100, ticks: { stepSize: 25, callback: v => v + '%' } } },
      },
    });
  }

  /* ============================================================
     Tab: Ajustes — complementa/corrige dados do Excel sem sobrescrevê-los
     ============================================================ */
  let adjustMessage = null;
  let adjSelectedTaskId = null;

  // Busca em memória: ignora acentos/maiúsculas, aceita termos parciais em qualquer ordem;
  // prioriza nomes que começam com o termo pesquisado
  function searchTasks(tasks, query, limit = 8) {
    const q = normalizeStr(query);
    if (!q) return [];
    const tokens = q.split(/\s+/).filter(Boolean);
    const results = [];
    for (const t of tasks) {
      const name = normalizeStr(t.name);
      if (!tokens.every(tok => name.includes(tok))) continue;
      let rank = 2;
      if (name.startsWith(q)) rank = 0;
      else if (name.startsWith(tokens[0])) rank = 1;
      results.push({ task: t, rank, pos: name.indexOf(tokens[0]) });
    }
    results.sort((a, b) => a.rank - b.rank || a.pos - b.pos || a.task.name.localeCompare(b.task.name, 'pt-BR'));
    return results.slice(0, limit).map(r => r.task);
  }

  function taskMetaLine(task) {
    const parts = [];
    if (task.category && task.category !== 'Sem categoria') parts.push(`Categoria: ${escapeHtml(task.category)}`);
    if ((task.assignees || []).length) parts.push(`Responsável: ${escapeHtml(task.assignees.join(', '))}`);
    if (task.status) parts.push(`Status: ${escapeHtml(task.status)}`);
    return parts.join(' · ');
  }

  function toInputDate(value) {
    const d = parseDate(value);
    if (!d) return '';
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const dd = String(d.getDate()).padStart(2, '0');
    return `${d.getFullYear()}-${mm}-${dd}`;
  }

  function adjustDateCellHtml(origValue, adjValue) {
    if (!adjValue) return `<span class="adjust-keep">${formatDate(origValue)}</span>`;
    return `<span class="orig-strike">${formatDate(origValue)}</span> <strong>${formatDate(adjValue)}</strong>`;
  }

  function renderAdjustmentsTab() {
    const root = document.getElementById('adjustmentsRoot');
    if (!auth.user) {
      root.innerHTML = `
        <div class="empty-state">
          <p style="margin:0 0 1rem">Faça login para acessar os seus ajustes.</p>
          <button class="btn-primary" id="btnEmptyLoginAdj">Entrar</button>
        </div>`;
      document.getElementById('btnEmptyLoginAdj').onclick = openLoginScreen;
      return;
    }
    const planner = getActivePlanner();
    if (!planner) {
      root.innerHTML = '<div class="empty-state">Você ainda não importou nenhum arquivo. Adicione um planner na aba "Planners" para registrar ajustes.</div>';
      return;
    }

    const adjustments = planner.adjustments || [];
    const canCreate = can('createAdjustments');
    const canDelete = can('deleteAdjustments');
    const editing = state.editingAdjustmentId ? adjustments.find(a => a.id === state.editingAdjustmentId) : null;
    const editingTask = editing ? findTaskForAdjustment(planner, editing) : null;
    if (editing) adjSelectedTaskId = editingTask ? editingTask.id : null;
    const selectedTask = adjSelectedTaskId ? planner.tasks.find(t => String(t.id) === String(adjSelectedTaskId)) : null;
    if (adjSelectedTaskId && !selectedTask) adjSelectedTaskId = null;
    const today = toInputDate(new Date());

    root.innerHTML = `
      <div class="planners-header">
        <div>
          <h2 class="section-title" style="margin-bottom:.25rem">Ajustes Manuais</h2>
          <p class="section-subtitle">
            Complemente ou corrija datas de atividades do planner <strong>${escapeHtml(planner.name)}</strong>.
            Os ajustes têm prioridade sobre os dados do Excel em todas as análises do dashboard — os dados originais permanecem preservados.
            ${!canCreate ? '<br /><strong>Seu perfil permite somente consulta dos ajustes.</strong>' : ''}
          </p>
        </div>
      </div>

      ${canCreate ? `
      <div class="adjust-form-card">
        <h3 class="adjust-form-title">${editing ? 'Editar ajuste' : 'Novo ajuste'}</h3>
        <div class="adjust-form-grid">
          <div class="adjust-field adjust-field--full adjust-search-wrap">
            <label>Tarefa *</label>
            <div class="adjust-combo">
              <input type="text" id="adjTaskSearch" placeholder="Clique para abrir a lista ou digite para pesquisar..." autocomplete="off" spellcheck="false"
                value="${selectedTask ? escapeHtml(selectedTask.name) : ''}" />
              <button type="button" class="adjust-combo-arrow" id="adjComboArrow" title="Abrir lista de tarefas" tabindex="-1">${ICONS.chevronDown}</button>
            </div>
            <div class="adjust-suggestions" id="adjTaskSuggestions" hidden></div>
          </div>
          <div class="adjust-field adjust-field--full" id="adjSelectedCard"></div>
          <div class="adjust-field">
            <label>Data de início</label>
            <input type="date" id="adjStart" value="${editing ? toInputDate(editing.start_date) : ''}" />
          </div>
          <div class="adjust-field">
            <label>Data de previsão</label>
            <input type="date" id="adjDue" value="${editing ? toInputDate(editing.due_date) : ''}" />
          </div>
          <div class="adjust-field">
            <label>Data de fim/conclusão</label>
            <input type="date" id="adjDone" value="${editing ? toInputDate(editing.completed_at) : ''}" />
          </div>
          <div class="adjust-field">
            <label>Responsável pelo ajuste</label>
            <input type="text" id="adjResponsible" maxlength="60" placeholder="Opcional" value="${editing ? escapeHtml(editing.responsible || '') : escapeHtml(auth.user ? (auth.user.fullName || auth.user.username) : '')}" />
          </div>
          <div class="adjust-field">
            <label>Data do ajuste</label>
            <input type="date" id="adjDate" value="${editing ? toInputDate(editing.adjustedAt) || today : today}" />
          </div>
          <div class="adjust-field adjust-field--full">
            <label>Observação</label>
            <input type="text" id="adjNote" maxlength="200" placeholder="Opcional — ex.: data corrigida conforme registro da equipe" value="${editing ? escapeHtml(editing.note || '') : ''}" />
          </div>
        </div>
        ${adjustMessage ? `
        <div class="upload-message ${adjustMessage.type}">
          ${adjustMessage.type === 'success' ? ICONS.checkCircle : ICONS.alertCircle}
          <p>${escapeHtml(adjustMessage.text)}</p>
        </div>` : ''}
        <div class="adjust-actions">
          ${editing ? '<button class="btn-secondary subtle" id="btnCancelAdjustment">Cancelar</button>' : ''}
          <button class="btn-primary" id="btnSaveAdjustment">${editing ? 'Salvar alterações' : 'Adicionar ajuste'}</button>
        </div>
      </div>` : ''}

      <h3 class="section-title" style="font-size:1.05rem;margin-top:2rem">Ajustes cadastrados (${adjustments.length})</h3>
      ${adjustments.length === 0
        ? `<div class="empty-state">Nenhum ajuste cadastrado.${canCreate ? ' Selecione uma atividade acima para complementar as datas.' : ''}</div>`
        : `
      <div class="compare-table-card">
        <div class="table-scroll">
          <table class="compare-table">
            <thead>
              <tr>
                <th>Atividade</th><th>Início</th><th>Previsão</th><th>Conclusão</th>
                <th>Responsável</th><th>Data do Ajuste</th><th>Observação</th><th>Registrado por</th>${canCreate || canDelete ? '<th></th>' : ''}
              </tr>
            </thead>
            <tbody>
              ${adjustments.map(a => {
                const task = findTaskForAdjustment(planner, a);
                const orig = task || {};
                return `
                <tr>
                  <td class="deadline-task-name" title="${escapeHtml(a.taskName || '')}">
                    ${escapeHtml(a.taskName || '—')}
                    ${!task ? '<span class="adjusted-tag adjusted-tag--warn" title="Atividade não encontrada no planner atual">sem correspondência</span>' : ''}
                  </td>
                  <td>${adjustDateCellHtml(orig.start_date, a.start_date)}</td>
                  <td>${adjustDateCellHtml(orig.due_date, a.due_date)}</td>
                  <td>${adjustDateCellHtml(orig.completed_at, a.completed_at)}</td>
                  <td>${escapeHtml(a.responsible || '—')}</td>
                  <td>${formatDate(a.adjustedAt)}</td>
                  <td class="adjust-note-cell" title="${escapeHtml(a.note || '')}">${escapeHtml(a.note || '—')}</td>
                  <td title="${a.createdAtIso ? 'Registrado em ' + new Date(a.createdAtIso).toLocaleString('pt-BR') : ''}${a.updatedByName ? ' · Atualizado por ' + escapeHtml(a.updatedByName) + (a.updatedAtIso ? ' em ' + new Date(a.updatedAtIso).toLocaleString('pt-BR') : '') : ''}">${escapeHtml(a.createdByName || '—')}</td>
                  ${canCreate || canDelete ? `
                  <td>
                    <div class="planner-card__icons">
                      ${canCreate ? `<button class="icon-btn" data-adj-edit="${a.id}" title="Editar ajuste">${ICONS.pencil}</button>` : ''}
                      ${canDelete ? `<button class="icon-btn danger" data-adj-remove="${a.id}" title="Excluir ajuste">${ICONS.trash}</button>` : ''}
                    </div>
                  </td>` : ''}
                </tr>`;
              }).join('')}
            </tbody>
          </table>
        </div>
      </div>`}
    `;

    bindAdjustmentsTab(planner);
  }

  function bindAdjustmentsTab(planner) {
    const byId = id => document.getElementById(id);
    const searchInput = byId('adjTaskSearch');
    const suggestBox = byId('adjTaskSuggestions');
    const selectedCard = byId('adjSelectedCard');
    let suggestions = [];
    let activeIdx = -1;
    let debounceTimer = null;

    const getSelectedTask = () =>
      adjSelectedTaskId ? planner.tasks.find(t => String(t.id) === String(adjSelectedTaskId)) : null;

    const renderSelectedCard = () => {
      const task = getSelectedTask();
      if (!task) { selectedCard.innerHTML = ''; return; }
      const existing = findAdjustmentForTask(planner, task);
      selectedCard.innerHTML = `
        <div class="adjust-selected">
          <div class="adjust-selected__head">
            <strong>Tarefa selecionada</strong>
            <button type="button" class="btn-clear" id="btnClearAdjTask">Trocar tarefa</button>
          </div>
          <p class="adjust-selected__name">${escapeHtml(task.name)}</p>
          <p class="adjust-selected__meta">
            ${taskMetaLine(task) ? taskMetaLine(task) + ' · ' : ''}<span class="adjust-original__id">ID: ${escapeHtml(String(task.id))}</span>
          </p>
          <p class="adjust-selected__dates">
            <strong>Dados originais do Excel:</strong>
            Início ${formatDate(task.start_date)} · Previsão ${formatDate(task.due_date)} · Conclusão ${formatDate(task.completed_at)}
          </p>
          ${existing && existing.id !== state.editingAdjustmentId
            ? '<p class="adjust-original__warn">Esta atividade já possui um ajuste — salvar irá atualizá-lo.</p>' : ''}
        </div>
      `;
      const clearBtn = byId('btnClearAdjTask');
      if (clearBtn) clearBtn.onclick = () => {
        adjSelectedTaskId = null;
        selectedCard.innerHTML = '';
        searchInput.value = '';
        searchInput.focus();
      };
    };

    const hideSuggestions = () => {
      suggestBox.hidden = true;
      suggestBox.innerHTML = '';
      suggestions = [];
      activeIdx = -1;
    };

    const selectTask = task => {
      adjSelectedTaskId = task.id;
      searchInput.value = task.name;
      hideSuggestions();
      renderSelectedCard();
    };

    const renderSuggestions = () => {
      if (!suggestions.length) {
        const q = searchInput.value.trim();
        suggestBox.innerHTML = q.length >= 2
          ? '<div class="adjust-suggestion adjust-suggestion--empty">Nenhuma tarefa encontrada.</div>' : '';
        suggestBox.hidden = !suggestBox.innerHTML;
        return;
      }
      suggestBox.innerHTML = suggestions.map((t, i) => `
        <div class="adjust-suggestion ${i === activeIdx ? 'active' : ''}" data-suggest-idx="${i}">
          <p class="adjust-suggestion__name">${escapeHtml(t.name)}</p>
          ${taskMetaLine(t) ? `<p class="adjust-suggestion__meta">${taskMetaLine(t)}</p>` : ''}
        </div>`).join('');
      suggestBox.hidden = false;
      const activeEl = suggestBox.querySelector('.adjust-suggestion.active');
      if (activeEl) activeEl.scrollIntoView({ block: 'nearest' });
      // mousedown para vencer o blur do input
      suggestBox.querySelectorAll('[data-suggest-idx]').forEach(el => {
        el.onmousedown = e => {
          e.preventDefault();
          selectTask(suggestions[+el.getAttribute('data-suggest-idx')]);
        };
      });
    };

    const allSorted = planner.tasks.slice().sort((a, b) => a.name.localeCompare(b.name, 'pt-BR'));

    // Combobox: sem texto (ou com a tarefa já selecionada) mostra a LISTA COMPLETA; digitando, filtra
    const listFor = () => {
      const task = getSelectedTask();
      const q = task && searchInput.value === task.name ? '' : searchInput.value;
      return q.trim() ? searchTasks(planner.tasks, q, 50) : allSorted;
    };

    const runSearch = () => {
      suggestions = listFor();
      activeIdx = -1;
      renderSuggestions();
    };

    if (searchInput) {
      searchInput.oninput = () => {
        // Digitar de novo invalida a seleção anterior
        const task = getSelectedTask();
        if (task && searchInput.value !== task.name) {
          adjSelectedTaskId = null;
          selectedCard.innerHTML = '';
        }
        clearTimeout(debounceTimer);
        debounceTimer = setTimeout(runSearch, 120);
      };
      searchInput.onfocus = runSearch;
      searchInput.onblur = () => setTimeout(hideSuggestions, 150);
      const arrow = byId('adjComboArrow');
      if (arrow) arrow.onmousedown = e => {
        e.preventDefault();
        if (suggestBox.hidden) { searchInput.focus(); runSearch(); }
        else hideSuggestions();
      };
      searchInput.onkeydown = e => {
        if (suggestBox.hidden && (e.key === 'ArrowDown' || e.key === 'ArrowUp')) { runSearch(); return; }
        if (e.key === 'ArrowDown') { e.preventDefault(); activeIdx = Math.min(activeIdx + 1, suggestions.length - 1); renderSuggestions(); }
        else if (e.key === 'ArrowUp') { e.preventDefault(); activeIdx = Math.max(activeIdx - 1, 0); renderSuggestions(); }
        else if (e.key === 'Enter') {
          e.preventDefault();
          if (suggestions.length) selectTask(suggestions[activeIdx >= 0 ? activeIdx : 0]);
        }
        else if (e.key === 'Escape') hideSuggestions();
      };
    }
    if (searchInput) renderSelectedCard();

    const saveBtn = byId('btnSaveAdjustment');
    if (saveBtn) saveBtn.onclick = () => {
      adjustMessage = null;
      const task = getSelectedTask();
      if (!task) {
        adjustMessage = { type: 'error', text: 'Busque e selecione a tarefa que deseja ajustar.' };
        renderAdjustmentsTab();
        return;
      }
      const start = byId('adjStart').value || null;
      const due = byId('adjDue').value || null;
      const done = byId('adjDone').value || null;
      if (!start && !due && !done) {
        adjustMessage = { type: 'error', text: 'Informe pelo menos uma data (início, previsão ou fim) para o ajuste.' };
        renderAdjustmentsTab();
        return;
      }

      const existing = state.editingAdjustmentId
        ? (planner.adjustments || []).find(a => a.id === state.editingAdjustmentId)
        : findAdjustmentForTask(planner, task);

      // Auditoria: quem registrou e quando (dados originais ficam preservados na tarefa)
      const nowIso = new Date().toISOString();
      const me = auth.user || {};
      saveAdjustment(planner, {
        id: existing ? existing.id : 'adj_' + Date.now().toString(36) + '_' + Math.random().toString(36).slice(2, 8),
        taskId: String(task.id),
        taskName: task.name,
        start_date: start,
        due_date: due,
        completed_at: done,
        note: byId('adjNote').value.trim(),
        responsible: byId('adjResponsible').value.trim(),
        adjustedAt: byId('adjDate').value || toInputDate(new Date()),
        createdById: existing && existing.createdById ? existing.createdById : (me.id || null),
        createdByName: existing && existing.createdByName ? existing.createdByName : (me.fullName || me.username || null),
        createdAtIso: existing && existing.createdAtIso ? existing.createdAtIso : nowIso,
        updatedById: me.id || null,
        updatedByName: me.fullName || me.username || null,
        updatedAtIso: nowIso,
      });

      state.editingAdjustmentId = null;
      adjSelectedTaskId = null;
      adjustMessage = { type: 'success', text: `Ajuste de "${task.name}" salvo — já aplicado a todas as análises do dashboard.` };
      renderAll();
    };

    const cancelBtn = byId('btnCancelAdjustment');
    if (cancelBtn) cancelBtn.onclick = () => {
      state.editingAdjustmentId = null;
      adjSelectedTaskId = null;
      adjustMessage = null;
      renderAdjustmentsTab();
    };

    document.querySelectorAll('[data-adj-edit]').forEach(btn => {
      btn.onclick = () => {
        state.editingAdjustmentId = btn.getAttribute('data-adj-edit');
        adjustMessage = null;
        renderAdjustmentsTab();
      };
    });

    document.querySelectorAll('[data-adj-remove]').forEach(btn => {
      btn.onclick = () => {
        const id = btn.getAttribute('data-adj-remove');
        const adj = (planner.adjustments || []).find(a => a.id === id);
        if (!adj) return;
        if (!confirm(`Excluir o ajuste de "${adj.taskName}"? As análises voltarão a usar os dados originais do Excel.`)) return;
        removeAdjustment(planner, id);
        if (state.editingAdjustmentId === id) state.editingAdjustmentId = null;
        adjustMessage = null;
        renderAll();
      };
    });
  }

  /* ============================================================
     Tab: Administração — gerenciamento de usuários (somente Admin)
     ============================================================ */
  let adminMessage = null;

  function roleBadge(role) {
    const def = ROLE_DEFS[role] || ROLE_DEFS.viewer;
    return `<span class="badge-pill" style="background:${def.color}18;color:${def.color}">${def.label}</span>`;
  }

  function renderAdminTab() {
    const root = document.getElementById('adminRoot');
    if (!root) return;
    if (!isAdmin()) {
      root.innerHTML = '<div class="empty-state">Acesso restrito a administradores.</div>';
      return;
    }
    const editing = state.editingUserId ? auth.users.find(u => u.id === state.editingUserId) : null;

    root.innerHTML = `
      <div class="planners-header">
        <div>
          <h2 class="section-title" style="margin-bottom:.25rem">Administração</h2>
          <p class="section-subtitle">Gerenciamento de usuários — crie, edite e ative/desative os acessos ao sistema. As alterações são sincronizadas em tempo real com as sessões ativas.</p>
        </div>
      </div>

      <div class="adjust-form-card">
        <h3 class="adjust-form-title">${editing ? `Editar usuário — ${escapeHtml(editing.username)}` : 'Criar usuário'}</h3>
        <div class="adjust-form-grid">
          <div class="adjust-field">
            <label>Nome de usuário *</label>
            <input type="text" id="adminUsername" placeholder="Identificador usado no login" maxlength="40" autocomplete="off" spellcheck="false" value="${editing ? escapeHtml(editing.username) : ''}" />
          </div>
          <div class="adjust-field">
            <label>Nome completo *</label>
            <input type="text" id="adminFullName" placeholder="Nome real/apresentação" maxlength="80" value="${editing ? escapeHtml(editing.fullName || '') : ''}" />
          </div>
          <div class="adjust-field">
            <label>Área de atuação</label>
            <input type="text" id="adminArea" placeholder="ex.: Marketing" maxlength="60" value="${editing ? escapeHtml(editing.area || '') : ''}" />
          </div>
          <div class="adjust-field">
            <label>E-mail</label>
            <input type="email" id="adminEmail" placeholder="Opcional — usado na recuperação de senha" maxlength="120" value="${editing ? escapeHtml(editing.email || '') : ''}" />
          </div>
          <div class="adjust-field">
            <label>Perfil *</label>
            <select id="adminRole">
              ${Object.entries(ROLE_DEFS).map(([key, def]) =>
                `<option value="${key}" ${editing && editing.role === key ? 'selected' : (!editing && key === 'viewer' ? 'selected' : '')}>${def.label}</option>`).join('')}
            </select>
          </div>
        </div>
        ${adminMessage ? `
        <div class="upload-message ${adminMessage.type}">
          ${adminMessage.type === 'success' ? ICONS.checkCircle : ICONS.alertCircle}
          <p>${escapeHtml(adminMessage.text)}</p>
        </div>` : ''}
        <div class="adjust-actions">
          ${editing ? '<button class="btn-secondary subtle" id="btnCancelUser">Cancelar</button>' : ''}
          <button class="btn-primary" id="btnSaveUser">${editing ? 'Salvar alterações' : 'Criar usuário'}</button>
        </div>
      </div>

      <h3 class="section-title" style="font-size:1.05rem;margin-top:2rem">Usuários cadastrados (${auth.users.length})</h3>
      ${auth.users.length === 0
        ? '<div class="empty-state">Nenhum usuário cadastrado.</div>'
        : `
      <div class="compare-table-card">
        <div class="table-scroll">
          <table class="compare-table">
            <thead>
              <tr>
                <th>Nome de Usuário</th><th>Nome Completo</th><th>Área de Atuação</th><th>E-mail</th><th>Perfil</th><th>Senha</th><th>Status</th><th>Criado em</th><th></th>
              </tr>
            </thead>
            <tbody>
              ${auth.users.map(u => `
                <tr class="${u.active === false ? 'user-row--inactive' : ''}">
                  <td><strong>${escapeHtml(u.username)}</strong>${auth.user.id === u.id ? ' <span class="tag-neutral">você</span>' : ''}</td>
                  <td>${escapeHtml(u.fullName || '—')}</td>
                  <td>${escapeHtml(u.area || '—')}</td>
                  <td>${escapeHtml(u.email || '—')}</td>
                  <td>${roleBadge(u.role)}</td>
                  <td>
                    ${u.pass
                      ? `<span class="badge-pill" style="background:${COLORS.success}18;color:${COLORS.success}">Senha cadastrada</span>`
                      : `<span class="badge-pill" style="background:${COLORS.warning}18;color:${COLORS.warning}">Sem senha</span>`}
                    ${u.resetRequestedAt ? `<span class="badge-pill badge-reset-req" title="Recuperação solicitada em ${new Date(u.resetRequestedAt).toLocaleString('pt-BR')}">Recuperação solicitada</span>` : ''}
                    ${u.resetToken ? `<span class="badge-pill badge-reset-req" title="Token expira em ${new Date(u.resetToken.expiresAt).toLocaleString('pt-BR')}">Token ativo</span>` : ''}
                  </td>
                  <td>${u.active === false
                    ? `<span class="badge-pill" style="background:${COLORS.error}18;color:${COLORS.error}">Inativo</span>`
                    : `<span class="badge-pill" style="background:${COLORS.success}18;color:${COLORS.success}">Ativo</span>`}</td>
                  <td>${formatDate(u.createdAt)}</td>
                  <td>
                    <div class="admin-row-actions">
                      <button class="icon-btn" data-user-edit="${u.id}" title="Editar usuário">${ICONS.pencil}</button>
                      ${emailValid(u.email) ? `<button class="btn-secondary subtle btn-toggle-user" data-user-sendtoken="${u.id}" title="Gera um token temporário (30 min, uso único) e abre o e-mail para envio — a senha atual nunca é enviada">Enviar token</button>` : ''}
                      ${u.pass || u.resetRequestedAt ? `<button class="btn-secondary subtle btn-toggle-user" data-user-resetpass="${u.id}" title="A conta volta ao estado Sem senha — a senha atual nunca é exibida">Resetar senha</button>` : ''}
                      <button class="btn-secondary subtle btn-toggle-user" data-user-toggle="${u.id}">${u.active === false ? 'Ativar' : 'Desativar'}</button>
                      ${auth.user.id !== u.id ? `<button class="icon-btn danger" data-user-delete="${u.id}" title="Excluir usuário">${ICONS.trash}</button>` : ''}
                    </div>
                  </td>
                </tr>`).join('')}
            </tbody>
          </table>
        </div>
      </div>`}

      <h3 class="section-title" style="font-size:1.05rem;margin-top:2rem">Arquivos importados por usuário</h3>
      <p class="section-subtitle" style="margin-bottom:1rem">Função administrativa — visão geral dos arquivos de cada usuário. Não altera o seu dashboard pessoal, que mostra somente os seus arquivos.</p>
      <div id="adminFilesRoot"><div class="empty-state">Carregando arquivos...</div></div>

      <h3 class="section-title" style="font-size:1.05rem;margin-top:2rem">Histórico de atividades</h3>
      <p class="section-subtitle" style="margin-bottom:1rem">Rastreabilidade das ações realizadas no sistema — senhas e tokens nunca são registrados.</p>
      <div id="auditRoot"><div class="empty-state">Carregando histórico...</div></div>
    `;

    bindAdminTab();
    loadAdminFilesOverview();
    loadAuditLog();
  }

  // Função administrativa: metadados dos arquivos de todos os usuários (sem carregar as tarefas)
  async function loadAdminFilesOverview() {
    const root = document.getElementById('adminFilesRoot');
    if (!root) return;
    if (!isAdmin() || !cloud.db) { root.innerHTML = '<div class="empty-state">Indisponível.</div>'; return; }
    try {
      const snap = await cloud.db.collection('planners').get();
      const el = document.getElementById('adminFilesRoot');
      if (!el) return;
      if (snap.empty) { el.innerHTML = '<div class="empty-state">Nenhum arquivo importado no sistema.</div>'; return; }
      const rows = snap.docs.map(d => ({ id: d.id, ...d.data() }))
        .sort((a, b) => String(a.ownerUsername || '').localeCompare(String(b.ownerUsername || '')) || String(a.addedAt || '').localeCompare(String(b.addedAt || '')));
      el.innerHTML = `
        <div class="compare-table-card">
          <div class="table-scroll">
            <table class="compare-table audit-table">
              <thead>
                <tr><th>Usuário</th><th>Planner</th><th>Arquivo</th><th>Tarefas</th><th>Versão</th><th>Importado em</th><th>Última atualização</th></tr>
              </thead>
              <tbody>
                ${rows.map(p => `
                <tr>
                  <td><strong>${escapeHtml(p.ownerUsername || '(sem dono)')}</strong></td>
                  <td>${escapeHtml(p.name || '—')}</td>
                  <td class="audit-cell" title="${escapeHtml(p.fileName || '')}">${escapeHtml(p.fileName || '—')}</td>
                  <td>${p.taskCount != null ? p.taskCount : '—'}</td>
                  <td>${p.version || 1}</td>
                  <td>${formatDate(p.addedAt)}</td>
                  <td>${p.updatedAt ? new Date(p.updatedAt).toLocaleString('pt-BR') : '—'}</td>
                </tr>`).join('')}
              </tbody>
            </table>
          </div>
        </div>
      `;
    } catch (e) {
      console.warn('Falha ao carregar arquivos por usuário.', e);
      const el = document.getElementById('adminFilesRoot');
      if (el) el.innerHTML = '<div class="empty-state">Não foi possível carregar os arquivos.</div>';
    }
  }

  async function loadAuditLog() {
    const root = document.getElementById('auditRoot');
    if (!root) return;
    if (!cloud.db) { root.innerHTML = '<div class="empty-state">Histórico disponível apenas com a nuvem conectada.</div>'; return; }
    try {
      const snap = await cloud.db.collection('audit').orderBy('atIso', 'desc').limit(50).get();
      if (!document.getElementById('auditRoot')) return;
      if (snap.empty) { document.getElementById('auditRoot').innerHTML = '<div class="empty-state">Nenhuma atividade registrada ainda.</div>'; return; }
      document.getElementById('auditRoot').innerHTML = `
        <div class="compare-table-card">
          <div class="table-scroll deadline-table-scroll">
            <table class="compare-table audit-table">
              <thead>
                <tr><th>Data / Hora</th><th>Usuário</th><th>Perfil</th><th>Ação</th><th>Alvo</th><th>Antes</th><th>Depois</th></tr>
              </thead>
              <tbody>
                ${snap.docs.map(d => {
                  const a = d.data();
                  return `
                  <tr>
                    <td>${a.atIso ? new Date(a.atIso).toLocaleString('pt-BR') : '—'}</td>
                    <td title="${escapeHtml(a.fullName || '')}">${escapeHtml(a.username || '—')}</td>
                    <td>${a.role ? roleBadge(a.role) : '—'}</td>
                    <td>${escapeHtml(a.action || '—')}</td>
                    <td class="audit-cell" title="${escapeHtml(a.target || '')}">${escapeHtml(a.target || '—')}</td>
                    <td class="audit-cell" title="${escapeHtml(a.before || '')}">${escapeHtml(a.before || '—')}</td>
                    <td class="audit-cell" title="${escapeHtml(a.after || '')}">${escapeHtml(a.after || '—')}</td>
                  </tr>`;
                }).join('')}
              </tbody>
            </table>
          </div>
        </div>
      `;
    } catch (e) {
      console.warn('Falha ao carregar histórico.', e);
      const el = document.getElementById('auditRoot');
      if (el) el.innerHTML = '<div class="empty-state">Não foi possível carregar o histórico.</div>';
    }
  }

  function bindAdminTab() {
    const byId = id => document.getElementById(id);

    byId('btnSaveUser').onclick = async () => {
      adminMessage = null;
      const payload = {
        username: byId('adminUsername').value,
        fullName: byId('adminFullName').value,
        area: byId('adminArea').value,
        email: byId('adminEmail').value.trim(),
        role: byId('adminRole').value,
      };
      try {
        if (!payload.username.trim()) throw new Error('Informe o nome de usuário.');
        if (!payload.fullName.trim()) throw new Error('Informe o nome completo.');
        if (state.editingUserId) {
          await updateUser(state.editingUserId, payload);
          adminMessage = { type: 'success', text: `Usuário "${payload.username.trim()}" atualizado.` };
        } else {
          await createUser(payload);
          adminMessage = { type: 'success', text: `Usuário "${payload.username.trim()}" criado — já pode entrar pelo botão Login.` };
        }
        state.editingUserId = null;
      } catch (e) {
        adminMessage = { type: 'error', text: e.message || 'Não foi possível salvar o usuário.' };
      }
      renderAdminTab();
    };

    const cancelBtn = byId('btnCancelUser');
    if (cancelBtn) cancelBtn.onclick = () => {
      state.editingUserId = null;
      adminMessage = null;
      renderAdminTab();
    };

    document.querySelectorAll('[data-user-edit]').forEach(btn => {
      btn.onclick = () => {
        state.editingUserId = btn.getAttribute('data-user-edit');
        adminMessage = null;
        renderAdminTab();
        const input = byId('adminUsername');
        if (input) input.focus();
      };
    });

    document.querySelectorAll('[data-user-delete]').forEach(btn => {
      btn.onclick = async () => {
        adminMessage = null;
        const id = btn.getAttribute('data-user-delete');
        const u = auth.users.find(x => x.id === id);
        if (!u) return;
        if (!confirm(`Excluir o usuário "${u.username}" (${u.fullName || '—'})? Essa ação não pode ser desfeita — se preferir manter o histórico, use "Desativar".`)) return;
        try {
          await deleteUser(id);
          if (state.editingUserId === id) state.editingUserId = null;
          adminMessage = { type: 'success', text: `Usuário "${u.username}" excluído.` };
        } catch (e) {
          adminMessage = { type: 'error', text: e.message || 'Não foi possível excluir o usuário.' };
        }
        if (state.activeTab === 'admin') renderAdminTab();
      };
    });

    document.querySelectorAll('[data-user-sendtoken]').forEach(btn => {
      btn.onclick = async () => {
        adminMessage = null;
        const id = btn.getAttribute('data-user-sendtoken');
        const u = auth.users.find(x => x.id === id);
        if (!u) return;
        try {
          const token = await issueResetToken(id);
          // Entrega por e-mail via cliente do Admin — o token não é persistido nem exibido na interface
          const subject = encodeURIComponent('Orquestrador de Tarefas — Token de recuperação de senha');
          const body = encodeURIComponent(
            `Olá, ${u.fullName || u.username}!\n\n` +
            `Use o token abaixo para redefinir sua senha no Orquestrador de Tarefas ` +
            `(tela de Login → "Esqueci minha senha" → "Já tenho um token"):\n\n` +
            `TOKEN: ${token}\n\n` +
            `Ele é válido por 30 minutos e só pode ser usado uma vez.`);
          window.open(`mailto:${encodeURIComponent(u.email)}?subject=${subject}&body=${body}`);
          adminMessage = { type: 'success', text: `Token gerado para "${u.username}" — finalize o envio no seu aplicativo de e-mail.` };
        } catch (e) {
          adminMessage = { type: 'error', text: e.message || 'Não foi possível gerar o token.' };
        }
        if (state.activeTab === 'admin') renderAdminTab();
      };
    });

    document.querySelectorAll('[data-user-resetpass]').forEach(btn => {
      btn.onclick = async () => {
        adminMessage = null;
        const id = btn.getAttribute('data-user-resetpass');
        const u = auth.users.find(x => x.id === id);
        if (!u) return;
        if (!confirm(`Resetar a senha de "${u.username}"? A conta voltará ao estado "Sem senha" e o usuário poderá entrar somente com o nome de usuário para definir uma nova.`)) return;
        try {
          await resetPassword(id);
          adminMessage = { type: 'success', text: `Senha de "${u.username}" resetada — conta sem senha.` };
        } catch (e) {
          adminMessage = { type: 'error', text: e.message || 'Não foi possível resetar a senha.' };
        }
        if (state.activeTab === 'admin') renderAdminTab();
      };
    });

    document.querySelectorAll('[data-user-toggle]').forEach(btn => {
      btn.onclick = async () => {
        adminMessage = null;
        const id = btn.getAttribute('data-user-toggle');
        const u = auth.users.find(x => x.id === id);
        if (!u) return;
        const deactivating = u.active !== false;
        if (deactivating && auth.user.id === id &&
            !confirm('Desativar o seu próprio usuário encerrará a sua sessão. Continuar?')) return;
        try {
          await updateUser(id, { active: !deactivating ? true : false });
          adminMessage = { type: 'success', text: `Usuário "${u.username}" ${deactivating ? 'desativado' : 'ativado'}.` };
        } catch (e) {
          adminMessage = { type: 'error', text: e.message || 'Não foi possível alterar o status.' };
        }
        if (state.activeTab === 'admin') renderAdminTab();
      };
    });
  }

  /* ============================================================
     Render geral
     ============================================================ */
  function renderAll() {
    const tasks = getActiveTasks();
    const filtered = getFilteredTasks(tasks);
    document.getElementById('taskCounter').textContent = `${filtered.length} / ${tasks.length}`;

    renderPanel();

    // Sem login não há espaço de dados; logado sem arquivos, orienta a importar
    const TAB_ROOTS = { metrics: 'metricsRoot', gantt: 'ganttRoot', tasks: 'tasksRoot', compare: 'compareRoot' };
    if (TAB_ROOTS[state.activeTab] && (!auth.user || !state.planners.length)) {
      destroyCharts();
      Object.values(state.compareCharts).forEach(c => c && c.destroy());
      state.compareCharts = {};
      document.getElementById(TAB_ROOTS[state.activeTab]).innerHTML = `
        <div class="empty-state">
          ${!auth.user
            ? '<p style="margin:0 0 1rem">Faça login para acessar os seus arquivos, análises e ajustes.</p><button class="btn-primary" id="btnEmptyLogin">Entrar</button>'
            : `<p style="margin:0${can('managePlanners') ? ' 0 1rem' : ''}">Você ainda não importou nenhum arquivo.</p>${can('managePlanners') ? '<button class="btn-primary" id="btnEmptyImport">Importar meu primeiro Excel</button>' : ''}`}
        </div>`;
      const loginBtn = document.getElementById('btnEmptyLogin');
      if (loginBtn) loginBtn.onclick = openLoginScreen;
      const importBtn = document.getElementById('btnEmptyImport');
      if (importBtn) importBtn.onclick = () => {
        const tabBtn = document.querySelector('.tab-trigger[data-tab="planners"]');
        if (tabBtn) tabBtn.click();
      };
      return;
    }

    if (state.activeTab === 'metrics') renderMetrics(filtered);
    if (state.activeTab === 'gantt') renderGantt(filtered);
    if (state.activeTab === 'tasks') renderTasksCards(filtered);
    if (state.activeTab === 'planners') renderPlannersTab();
    if (state.activeTab === 'adjustments') renderAdjustmentsTab();
    if (state.activeTab === 'compare') renderCompareTab();
    if (state.activeTab === 'admin') renderAdminTab();
  }

  /* ============================================================
     Navegação
     ============================================================ */
  function bindNav() {
    document.querySelectorAll('.tab-trigger').forEach(btn => {
      btn.onclick = () => {
        document.querySelectorAll('.tab-trigger').forEach(b => b.classList.remove('active'));
        document.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));
        btn.classList.add('active');
        const tab = btn.getAttribute('data-tab');
        document.getElementById('tab-' + tab).classList.add('active');
        state.activeTab = tab;
        renderAll();
      };
    });

    document.getElementById('btnToggleFilters').onclick = () => {
      state.sidebarExpanded = !state.sidebarExpanded;
      syncSidebarUI();
    };

    document.getElementById('modalOverlay').onclick = closeKpiModal;
    document.getElementById('modalClose').onclick = closeKpiModal;
  }

  function syncSidebarUI() {
    document.getElementById('btnToggleFilters').classList.toggle('active', state.sidebarExpanded);
    document.getElementById('expandablePanel').classList.toggle('expanded', state.sidebarExpanded);
  }

  /* ============================================================
     Controle de acesso na interface (abas por perfil)
     - Anônimo/Visualizador: consulta (dashboards, filtros, comparações)
     - Editor: experiência simplificada — somente registro de ajustes
     - Admin: tudo + Administração
     ============================================================ */
  function visibleTabs() {
    const role = auth.user ? auth.user.role : null;
    if (role === 'admin') return ['metrics', 'gantt', 'tasks', 'planners', 'adjustments', 'compare', 'admin'];
    if (role === 'editor') return ['adjustments', 'planners'];
    if (role === 'viewer') return ['metrics', 'gantt', 'tasks', 'planners', 'adjustments', 'compare'];
    return ['metrics', 'gantt', 'tasks', 'adjustments', 'compare']; // anônimo: telas com convite ao login
  }

  function applyAccessUI() {
    const visible = visibleTabs();
    if (!visible.includes(state.activeTab)) state.activeTab = visible[0];
    document.querySelectorAll('.tab-trigger').forEach(btn => {
      const tab = btn.getAttribute('data-tab');
      btn.style.display = visible.includes(tab) ? '' : 'none';
      btn.classList.toggle('active', tab === state.activeTab);
    });
    document.querySelectorAll('.tab-content').forEach(c => c.classList.toggle('active', c.id === 'tab-' + state.activeTab));
    renderUserArea();
    renderAll();
  }

  /* ============================================================
     Área do usuário no header (Login / usuário logado + Sair)
     ============================================================ */
  const AUTH_ICONS = {
    user: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>',
    logout: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>',
  };

  function userInitials(user) {
    const src = (user.fullName || user.username || '?').trim();
    const parts = src.split(/\s+/);
    return (parts[0][0] + (parts.length > 1 ? parts[parts.length - 1][0] : '')).toUpperCase();
  }

  function renderUserArea() {
    const el = document.getElementById('userArea');
    if (!el) return;
    if (!auth.user) {
      el.innerHTML = `<button class="btn-login" id="btnLogin">${AUTH_ICONS.user}<span>Login</span></button>`;
      document.getElementById('btnLogin').onclick = openLoginScreen;
      return;
    }
    const role = ROLE_DEFS[auth.user.role] || ROLE_DEFS.viewer;
    el.innerHTML = `
      <button class="user-chip" id="btnMyAccount" title="Minha Conta">
        <span class="user-chip__avatar" style="background:${role.color}20;color:${role.color}">${escapeHtml(userInitials(auth.user))}</span>
        <span class="user-chip__info">
          <span class="user-chip__name">${escapeHtml(auth.user.fullName || auth.user.username)}</span>
          <span class="user-chip__role" style="color:${role.color}">${role.label}</span>
        </span>
      </button>
      <button class="btn-logout" id="btnLogout" title="Sair">${AUTH_ICONS.logout}<span>Sair</span></button>
    `;
    document.getElementById('btnMyAccount').onclick = () => openAccountScreen();
    document.getElementById('btnLogout').onclick = logout;
  }

  /* ============================================================
     Tela de Login — usuário + senha (contas sem senha entram só
     com o usuário) e recuperação de senha
     ============================================================ */
  let loginError = null;
  let loginMode = 'login'; // 'login' | 'forgot' | 'token'
  let loginInfo = null;

  function openLoginScreen() {
    loginError = null;
    loginInfo = null;
    loginMode = 'login';
    document.getElementById('loginScreen').classList.remove('hidden');
    renderLoginScreen();
  }

  function closeLoginScreen() {
    document.getElementById('loginScreen').classList.add('hidden');
  }

  function renderLoginScreen() {
    const card = document.getElementById('loginCard');
    const forgot = loginMode === 'forgot';
    const tokenMode = loginMode === 'token';

    const titles = {
      login: ['Entrar no Orquestrador', 'Informe o nome de usuário cadastrado. Se a conta tiver senha, ela também será solicitada.'],
      forgot: ['Recuperação de senha', 'Informe seu nome de usuário. Um administrador enviará um token temporário para o seu e-mail cadastrado — a senha atual nunca é enviada.'],
      token: ['Redefinir senha com token', 'Use o token recebido por e-mail (válido por 30 minutos, uso único) para criar uma nova senha.'],
    };

    card.innerHTML = `
      <button class="modal-close login-close" id="loginClose" title="Fechar">${ICONS.x}</button>
      <div class="login-brand">
        <span class="app-logo" aria-hidden="true">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 2v4"/><path d="M12 18v4"/><path d="M4.93 4.93l2.83 2.83"/><path d="M16.24 16.24l2.83 2.83"/><path d="M2 12h4"/><path d="M18 12h4"/><path d="M4.93 19.07l2.83-2.83"/><path d="M16.24 7.76l2.83-2.83"/></svg>
        </span>
        <h2>${titles[loginMode][0]}</h2>
        <p>${titles[loginMode][1]}</p>
      </div>
      <div class="login-fields">
        <div class="adjust-field">
          <label>Nome de usuário</label>
          <input type="text" id="loginUsername" placeholder="ex.: rafael" autocomplete="username" spellcheck="false" maxlength="40" />
        </div>
        ${loginMode === 'login' ? `
        <div class="adjust-field">
          <label>Senha</label>
          <input type="password" id="loginPassword" placeholder="Deixe em branco se a conta não tem senha" autocomplete="current-password" maxlength="80" />
        </div>` : ''}
        ${tokenMode ? `
        <div class="adjust-field">
          <label>Token recebido por e-mail</label>
          <input type="text" id="loginToken" placeholder="XXXX-XXXX" autocomplete="one-time-code" spellcheck="false" maxlength="12" />
        </div>
        <div class="adjust-field">
          <label>Nova senha</label>
          <input type="password" id="loginNewPass" placeholder="Mínimo de 4 caracteres" autocomplete="new-password" maxlength="80" />
        </div>
        <div class="adjust-field">
          <label>Confirmar nova senha</label>
          <input type="password" id="loginNewPass2" autocomplete="new-password" maxlength="80" />
        </div>` : ''}
      </div>
      ${loginError ? `<p class="login-error">${escapeHtml(loginError)}</p>` : ''}
      ${loginInfo ? `<p class="login-info">${escapeHtml(loginInfo)}</p>` : ''}
      <button class="btn-primary login-submit" id="loginSubmit">${tokenMode ? 'Redefinir senha' : forgot ? 'Solicitar recuperação' : 'Entrar'}</button>
      <p class="login-hint">
        ${loginMode === 'login'
          ? '<a href="#" data-login-mode="forgot">Esqueci minha senha</a>'
          : forgot
            ? '<a href="#" data-login-mode="token">Já tenho um token</a> · <a href="#" data-login-mode="login">← Voltar ao login</a>'
            : '<a href="#" data-login-mode="login">← Voltar ao login</a>'}
      </p>
    `;

    document.getElementById('loginClose').onclick = closeLoginScreen;
    card.querySelectorAll('[data-login-mode]').forEach(a => {
      a.onclick = e => {
        e.preventDefault();
        loginMode = a.getAttribute('data-login-mode');
        loginError = null;
        loginInfo = null;
        renderLoginScreen();
      };
    });
    const input = document.getElementById('loginUsername');
    input.focus();

    const submit = async () => {
      loginError = null;
      loginInfo = null;
      const uname = input.value.trim();
      if (!uname) { loginError = 'Informe o nome de usuário.'; renderLoginScreen(); return; }
      const norm = normalizeUsername(uname);
      const user = auth.users.find(u => u.usernameNorm === norm);

      if (forgot) {
        try {
          if (user) {
            await persistUserDoc({ ...user, resetRequestedAt: new Date().toISOString() });
            logAudit('Recuperação de senha solicitada', user.username, '', user.email ? `e-mail cadastrado: ${user.email}` : 'conta sem e-mail');
          }
          loginInfo = 'Solicitação registrada. Um administrador poderá enviar um token para o seu e-mail cadastrado ou resetar sua senha.';
        } catch (e) {
          loginError = 'Não foi possível registrar a solicitação.';
        }
        renderLoginScreen();
        return;
      }

      if (tokenMode) {
        const token = document.getElementById('loginToken').value;
        const nova = document.getElementById('loginNewPass').value;
        const conf = document.getElementById('loginNewPass2').value;
        try {
          if (!normalizeToken(token)) throw new Error('Informe o token recebido por e-mail.');
          if (nova.length < 4) throw new Error('A nova senha deve ter pelo menos 4 caracteres.');
          if (nova !== conf) throw new Error('A confirmação não confere com a nova senha.');
          await redeemResetToken(uname, token, nova);
          loginMode = 'login';
          loginInfo = 'Senha redefinida com sucesso — entre com sua nova senha.';
        } catch (e) {
          loginError = e.message || 'Não foi possível redefinir a senha.';
        }
        renderLoginScreen();
        return;
      }

      const pwd = document.getElementById('loginPassword').value;
      try {
        // Primeiro acesso administrativo: credencial inicial de configuração
        if (!user && norm === BOOTSTRAP_ADMIN.username) {
          if (!pwd) { loginError = 'Informe a senha.'; renderLoginScreen(); return; }
          const created = await bootstrapAdmin(pwd);
          if (!created) { loginError = 'Usuário ou senha inválidos.'; renderLoginScreen(); return; }
          setSession(created);
          logAudit('Primeiro acesso do administrador configurado', 'admin', '', 'conta admin criada com senha');
          await switchUserContext();
          closeLoginScreen();
          applyAccessUI();
          openAccountScreen('Primeiro acesso — recomendamos alterar a senha inicial em Segurança.');
          return;
        }
        if (!user) { loginError = 'Usuário não encontrado. Solicite o cadastro a um administrador.'; renderLoginScreen(); return; }
        if (user.active === false) { loginError = 'Este usuário está desativado. Fale com um administrador.'; renderLoginScreen(); return; }
        if (user.pass) {
          if (!pwd) { loginError = 'Informe a senha.'; renderLoginScreen(); return; }
          if (!(await verifyPassword(user.pass, pwd))) { loginError = 'Usuário ou senha inválidos.'; renderLoginScreen(); return; }
        }
        setSession(user);
        await switchUserContext();
        closeLoginScreen();
        applyAccessUI();
        if (user.firstAccess) openAccountScreen('Primeiro acesso — recomendamos alterar a senha inicial em Segurança.');
      } catch (e) {
        loginError = e.message || 'Não foi possível entrar.';
        renderLoginScreen();
      }
    };

    document.getElementById('loginSubmit').onclick = submit;
    card.querySelectorAll('input').forEach(i => {
      i.onkeydown = e => { if (e.key === 'Enter') submit(); };
    });
  }

  /* ============================================================
     Minha Conta — dados da conta, e-mail e segurança (senha).
     Dados estruturais (usuário/nome/área/perfil) são do Admin.
     ============================================================ */
  let accountMessage = null;
  let accountNotice = null;

  function openAccountScreen(notice) {
    if (!auth.user) return;
    accountNotice = notice || null;
    accountMessage = null;
    document.getElementById('accountScreen').classList.remove('hidden');
    renderAccountScreen();
  }

  function closeAccountScreen() {
    document.getElementById('accountScreen').classList.add('hidden');
  }

  function renderAccountScreen() {
    const card = document.getElementById('accountCard');
    if (!auth.user) { closeAccountScreen(); return; }
    const u = auth.users.find(x => x.id === auth.user.id) || auth.user;
    const role = ROLE_DEFS[u.role] || ROLE_DEFS.viewer;
    const hasPass = !!u.pass;
    const emailOk = emailValid(u.email);

    card.innerHTML = `
      <button class="modal-close login-close" id="accountClose" title="Fechar">${ICONS.x}</button>
      <div class="login-brand" style="margin-bottom:1rem">
        <h2>Minha Conta</h2>
      </div>
      ${accountNotice ? `<p class="login-info" style="margin:0 0 1rem">${escapeHtml(accountNotice)}</p>` : ''}
      <div class="account-info">
        <div><span class="account-info__lbl">Usuário</span><span>${escapeHtml(u.username)}</span></div>
        <div><span class="account-info__lbl">Nome completo</span><span>${escapeHtml(u.fullName || '—')}</span></div>
        <div><span class="account-info__lbl">Área de atuação</span><span>${escapeHtml(u.area || '—')}</span></div>
        <div><span class="account-info__lbl">Perfil</span><span class="badge-pill" style="background:${role.color}18;color:${role.color}">${role.label}</span></div>
        <div><span class="account-info__lbl">Senha</span><span class="badge-pill" style="background:${hasPass ? COLORS.success : COLORS.warning}18;color:${hasPass ? COLORS.success : COLORS.warning}">${hasPass ? 'Senha cadastrada' : 'Sem senha'}</span></div>
      </div>

      <div class="adjust-field" style="margin-top:1rem">
        <label>E-mail</label>
        <div class="account-email-row">
          <input type="email" id="accEmail" placeholder="seu@email.com" maxlength="120" value="${escapeHtml(u.email || '')}" />
          <button class="btn-secondary" id="accSaveEmail">Salvar</button>
        </div>
      </div>

      <h3 class="account-section-title">Segurança</h3>
      ${!emailOk ? '<p class="login-error" style="margin:0 0 .9rem">Cadastre um e-mail válido antes de definir uma senha.</p>' : ''}
      <div class="login-fields">
        ${hasPass ? `
        <div class="adjust-field">
          <label>Senha atual</label>
          <input type="password" id="accCurrent" autocomplete="current-password" maxlength="80" ${emailOk ? '' : 'disabled'} />
        </div>` : ''}
        <div class="adjust-field">
          <label>Nova senha</label>
          <input type="password" id="accNew" autocomplete="new-password" maxlength="80" placeholder="Mínimo de 4 caracteres" ${emailOk ? '' : 'disabled'} />
        </div>
        <div class="adjust-field">
          <label>Confirmar nova senha</label>
          <input type="password" id="accConfirm" autocomplete="new-password" maxlength="80" ${emailOk ? '' : 'disabled'} />
        </div>
      </div>
      ${accountMessage ? `<p class="${accountMessage.type === 'success' ? 'login-info' : 'login-error'}">${escapeHtml(accountMessage.text)}</p>` : ''}
      <button class="btn-primary login-submit" id="accSavePass" ${emailOk ? '' : 'disabled'} ${emailOk ? '' : 'title="Cadastre um e-mail válido antes de definir uma senha."'}>${hasPass ? 'Alterar senha' : 'Definir senha'}</button>
    `;

    document.getElementById('accountClose').onclick = closeAccountScreen;

    document.getElementById('accSaveEmail').onclick = async () => {
      accountMessage = null;
      accountNotice = null;
      const email = document.getElementById('accEmail').value.trim();
      try {
        const before = u.email || '—';
        await updateSelfAccount({ email });
        logAudit('E-mail da conta atualizado', u.username, before, email || '—');
        accountMessage = { type: 'success', text: 'E-mail salvo.' };
      } catch (e) {
        accountMessage = { type: 'error', text: e.message || 'Não foi possível salvar o e-mail.' };
      }
      renderAccountScreen();
    };

    document.getElementById('accSavePass').onclick = async () => {
      accountMessage = null;
      accountNotice = null;
      const nova = document.getElementById('accNew').value;
      const conf = document.getElementById('accConfirm').value;
      try {
        if (!emailOk) throw new Error('Cadastre um e-mail válido antes de definir uma senha.');
        if (nova.length < 4) throw new Error('A nova senha deve ter pelo menos 4 caracteres.');
        if (nova !== conf) throw new Error('A confirmação não confere com a nova senha.');
        if (hasPass) {
          const atual = document.getElementById('accCurrent').value;
          if (!(await verifyPassword(u.pass, atual))) throw new Error('Senha atual incorreta.');
        }
        await updateSelfAccount({ pass: await hashPassword(nova), firstAccess: false, clearReset: true });
        logAudit(hasPass ? 'Senha alterada' : 'Senha definida', u.username, hasPass ? 'Senha cadastrada' : 'Sem senha', 'Senha cadastrada');
        accountMessage = { type: 'success', text: hasPass ? 'Senha alterada com sucesso.' : 'Senha definida com sucesso.' };
      } catch (e) {
        accountMessage = { type: 'error', text: e.message || 'Não foi possível salvar a senha.' };
      }
      renderAccountScreen();
    };
  }

  function logout() {
    setSession(null);
    state.editingAdjustmentId = null;
    state.editingUserId = null;
    closeAccountScreen();
    switchUserContext().then(() => applyAccessUI());
  }

  /* ============================================================
     Inicialização
     ============================================================ */
  async function init() {
    cloudInit();
    loadSession();
    subscribeUsers();
    await loadDataForCurrentUser();
    subscribePlanners();
    document.getElementById('loadingScreen').classList.add('hidden');
    populatePlannerSwitcher();
    applyAccessUI();
  }

  document.addEventListener('DOMContentLoaded', () => {
    bindNav();
    syncSidebarUI();
    init();
  });
})();
