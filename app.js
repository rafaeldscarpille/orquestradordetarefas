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
     Persistência (localStorage + Firebase)
     ============================================================ */
  function writeLocal() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({
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
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
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
    return simpleHash(JSON.stringify({ n: p.name, c: p.color, a: p.addedAt, t: p.tasks }));
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
    clearTimeout(cloud.saveTimer);
    setSyncStatus('syncing');
    cloud.saveTimer = setTimeout(saveToCloud, 1200);
  }

  async function saveToCloud() {
    if (!cloud.db) return;
    if (cloud.saving) { cloud.pendingResave = true; return; }
    cloud.saving = true;
    setSyncStatus('syncing');
    try {
      const db = cloud.db;
      const existing = await db.collection('planners').get();
      const keepIds = new Set(state.planners.map(p => p.id));

      // Remove da nuvem planners excluídos localmente
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
        const fp = plannerFingerprint(p);
        if (cloud.fingerprints[p.id] === fp) continue;

        const ref = db.collection('planners').doc(p.id);
        const prevDoc = existing.docs.find(d => d.id === p.id);
        const prevChunkCount = prevDoc ? (prevDoc.data().chunkCount || 0) : 0;
        const chunks = chunkTasksJson(p.tasks);

        const batch = db.batch();
        batch.set(ref, {
          name: p.name,
          color: p.color || null,
          addedAt: p.addedAt || null,
          taskCount: p.tasks.length,
          chunkCount: chunks.length,
          updatedAt: new Date().toISOString(),
        });
        chunks.forEach((json, i) => batch.set(ref.collection('chunks').doc('c' + i), { json }));
        for (let i = chunks.length; i < prevChunkCount; i++) {
          batch.delete(ref.collection('chunks').doc('c' + i));
        }
        await batch.commit();
        cloud.fingerprints[p.id] = fp;
      }

      // Metadados (planner ativo)
      if (cloud.metaFingerprint !== state.activePlannerId) {
        await db.collection('app').doc('meta').set({
          activePlannerId: state.activePlannerId,
          updatedAt: new Date().toISOString(),
        });
        cloud.metaFingerprint = state.activePlannerId;
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

  async function loadFromCloud() {
    if (!cloud.db) return null;
    const db = cloud.db;
    const [metaSnap, plannersSnap] = await Promise.all([
      db.collection('app').doc('meta').get(),
      db.collection('planners').get(),
    ]);
    if (plannersSnap.empty) return null;

    const planners = [];
    for (const doc of plannersSnap.docs) {
      const d = doc.data();
      const chunksSnap = await doc.ref.collection('chunks').get();
      const ordered = chunksSnap.docs.slice().sort((a, b) => parseInt(a.id.slice(1), 10) - parseInt(b.id.slice(1), 10));
      let tasks = [];
      ordered.forEach(c => {
        try { tasks = tasks.concat(JSON.parse(c.data().json || '[]')); } catch (e) {}
      });
      planners.push({
        id: doc.id,
        name: d.name || 'Planner',
        color: d.color || PLANNER_COLORS[0],
        addedAt: d.addedAt || null,
        tasks: tasks.map(normalizeExistingTask),
      });
    }
    planners.sort((a, b) => String(a.addedAt || '').localeCompare(String(b.addedAt || '')));

    return { planners, activePlannerId: metaSnap.exists ? metaSnap.data().activePlannerId : null };
  }

  function makeDefaultPlanner() {
    const baseTasks = Array.isArray(window.TASKS_DATA) ? window.TASKS_DATA.map(normalizeExistingTask) : [];
    return { id: genId(), name: 'Planner Principal', tasks: baseTasks, addedAt: new Date().toISOString(), color: PLANNER_COLORS[0] };
  }

  async function initData() {
    // 1º tenta a nuvem (fonte da verdade); localStorage é cache/fallback
    let fromCloud = null;
    try {
      fromCloud = await loadFromCloud();
    } catch (e) {
      console.warn('Não foi possível carregar da nuvem — usando dados locais.', e);
      setSyncStatus('error');
    }

    if (fromCloud && fromCloud.planners.length > 0) {
      state.planners = fromCloud.planners;
      const found = state.planners.find(p => p.id === fromCloud.activePlannerId);
      state.activePlannerId = found ? found.id : state.planners[0].id;
      // Marca como já sincronizado para não reenviar o que acabou de baixar
      state.planners.forEach(p => { cloud.fingerprints[p.id] = plannerFingerprint(p); });
      cloud.metaFingerprint = fromCloud.activePlannerId === state.activePlannerId ? state.activePlannerId : null;
      writeLocal();
      setSyncStatus('synced');
      return;
    }

    const restored = loadFromStorage();
    if (restored && Array.isArray(restored.planners) && restored.planners.length > 0) {
      state.planners = restored.planners.map(p => ({
        ...p,
        tasks: (p.tasks || []).map(t => (t && t.statusGroup) ? t : normalizeExistingTask(t)),
      }));
      const found = state.planners.find(p => p.id === restored.activePlannerId);
      state.activePlannerId = found ? found.id : state.planners[0].id;
      saveToStorage(); // migra os dados locais para a nuvem
    } else {
      const planner = makeDefaultPlanner();
      state.planners = [planner];
      state.activePlannerId = planner.id;
      saveToStorage();
    }
  }

  function resetAllPlanners() {
    if (!confirm('Isso removerá todos os planners adicionados e restaurará apenas os dados originais. Deseja continuar?')) return;
    try { localStorage.removeItem(STORAGE_KEY); } catch (e) {}
    const planner = makeDefaultPlanner();
    state.planners = [planner];
    state.activePlannerId = planner.id;
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
  function getActiveTasks() {
    const p = state.planners.find(pl => pl.id === state.activePlannerId);
    return p ? p.tasks : [];
  }

  function uniquePlannerName(base) {
    const existing = new Set(state.planners.map(p => p.name));
    if (!existing.has(base)) return base;
    let i = 2;
    while (existing.has(`${base} (${i})`)) i++;
    return `${base} (${i})`;
  }

  function addPlanner(name, tasks) {
    const color = PLANNER_COLORS[state.planners.length % PLANNER_COLORS.length];
    const planner = { id: genId(), name, tasks, addedAt: new Date().toISOString(), color };
    state.planners.push(planner);
    state.activePlannerId = planner.id;
    state.filters = {};
    state.cardsVisibleCount = 24;
    saveToStorage();
    populatePlannerSwitcher();
  }

  function renamePlanner(id, newName) {
    const p = state.planners.find(pl => pl.id === id);
    if (p && newName && newName.trim()) {
      p.name = newName.trim();
      saveToStorage();
      populatePlannerSwitcher();
    }
  }

  function updatePlanner(id, name, color) {
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
    state.planners = state.planners.filter(p => p.id !== id);
    // Se excluiu o último, cria um planner vazio para o app continuar funcional
    if (state.planners.length === 0) {
      state.planners = [{ id: genId(), name: 'Novo Planner', tasks: [], addedAt: new Date().toISOString(), color: PLANNER_COLORS[0] }];
    }
    if (!state.planners.find(p => p.id === state.activePlannerId)) {
      state.activePlannerId = state.planners[0].id;
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
      ? state.planners.flatMap(p => p.tasks)
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
    const m = computeMetrics(p.tasks);
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
          <h2 class="section-title" style="margin-bottom:.25rem">Meus Planners</h2>
          <p class="section-subtitle">Adicione quantos planners exportados (Excel ou CSV) quiser — a aplicação identifica as colunas automaticamente.</p>
        </div>
        <button class="btn-secondary subtle" id="btnResetAllPlanners">Restaurar dados originais</button>
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
  function renderCompareTab() {
    const root = document.getElementById('compareRoot');

    if (state.planners.length < 2) {
      root.innerHTML = `<div class="empty-state">Adicione pelo menos 2 planners na aba "Planners" para comparar resultados.</div>`;
      return;
    }

    // Filtros da barra lateral aplicados a todos os planners
    const rows = state.planners.map(p => {
      const filtered = getFilteredTasks(p.tasks);
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

    Object.values(state.compareCharts).forEach(c => c && c.destroy());
    state.compareCharts = {};

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
     Render geral
     ============================================================ */
  function renderAll() {
    const tasks = getActiveTasks();
    const filtered = getFilteredTasks(tasks);
    document.getElementById('taskCounter').textContent = `${filtered.length} / ${tasks.length}`;

    renderPanel();

    if (state.activeTab === 'metrics') renderMetrics(filtered);
    if (state.activeTab === 'gantt') renderGantt(filtered);
    if (state.activeTab === 'tasks') renderTasksCards(filtered);
    if (state.activeTab === 'planners') renderPlannersTab();
    if (state.activeTab === 'compare') renderCompareTab();
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
     Inicialização
     ============================================================ */
  async function init() {
    cloudInit();
    await initData();
    document.getElementById('loadingScreen').classList.add('hidden');
    populatePlannerSwitcher();
    renderAll();
  }

  document.addEventListener('DOMContentLoaded', () => {
    bindNav();
    syncSidebarUI();
    init();
  });
})();
