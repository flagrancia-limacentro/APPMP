(() => {
  const SUPABASE_URL = 'https://nfsrnajbwngyihxmjqzu.supabase.co';
  const SUPABASE_KEY = 'sb_publishable_sPQyd-FIzAaCitv0L5UvPQ_3RTznJ0Z';
  const EMAIL_DOMAIN = 'flagrancia.mpfn.gob.pe';
  const STORAGE_PREFIX = 'mp_informe_turno_draft_v3_';

  const sb = window.supabase ? window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY) : null;

  let currentAccount = null;
  let currentDraftId = null;
  let cloudSaveTimer = null;
  let adminFiscaliasCache = [];
  let adminInformesCache = [];

  const OFFICIAL_ANTECEDENTES = {
    antecedente_1:
      'Mediante el Oficio Circular N° 000137-2026-MP-FN-PJFSLIMA, de fecha 06 de noviembre de 2026, la Presidencia de la Junta de Fiscales Superiores del Distrito Fiscal de Lima Centro dispuso que, una vez culminado cada turno fiscal, el despacho a cargo remita el informe correspondiente.',
    antecedente_2:
      'El turno se desarrolló conforme al rol de turno establecido para el año 2026 mediante la Resolución de la Presidencia de la Junta de Fiscales Superiores del Distrito Fiscal de Lima Centro N° 008316-2025-MP-FN-PJFSLIMA, de fecha 30 de diciembre de 2025, modificado en lo que resta del año 2026 por la Resolución N° 007171-2026-MP-FN-PJFSLIMA, de fecha 19 de octubre de 2026, con efectividad desde las 08:00 horas de esa fecha, para los Despachos Fiscales de las Fiscalías Corporativas Penales del Distrito Fiscal de Lima Centro y las Fiscalías Provinciales Penales de Flagrancia Delictiva de Lima Centro. Dicha resolución fue rectificada por error material mediante la Resolución N° 007540-2026-MP-FN-PJFSLIMA, de fecha 30 de octubre de 2026, que consigna a la 5.ª Fiscalía Provincial Penal de Flagrancia Delictiva de Lima Centro en el rol del mes de diciembre de 2026. Cada turno rige desde las 08:00 horas de un día hasta las 07:59 horas del día siguiente.',
    antecedente_3:
      'Se aplicaron, además, las Resoluciones de la Fiscalía de la Nación N° 3190-2026-MP-FN (Directiva "Actuación del Fiscal de Turno en Flagrancia"), N° 3191-2026-MP-FN (versión 02 de la Directiva Técnica "Actividades del Coordinador Nacional y de los Coordinadores Distritales de las Fiscalías Especializadas en Flagrancia Delictiva") y N° 3192-2026-MP-FN (versión 02 de los "Criterios para Determinar la Competencia Material de las Fiscalías de Flagrancia Delictiva y otras Fiscalías de Turno"), emitidas el 13 de octubre de 2026 y publicadas en el diario oficial El Peruano el 14 de octubre de 2026. En virtud de ellas, durante el turno los despachos de las Fiscalías Corporativas Penales se constituyen en fiscalías de turno en flagrancia y asumen los casos en que exista flagrancia delictiva.'
  };

  function getDefaultState() {
    const today = new Date();
    const meses = ['enero','febrero','marzo','abril','mayo','junio','julio','agosto','septiembre','octubre','noviembre','diciembre'];
    const fechaStr = `${String(today.getDate()).padStart(2,'0')} de ${meses[today.getMonth()]} de ${today.getFullYear()}`;
    return {
      fecha_informe: fechaStr,
      numero_informe: '',
      anio: String(today.getFullYear()),
      siglas_despacho: '',
      nombre_despacho_emisor: '',
      destinataria_nombre: 'LILLY LORENA GELACIO LLONTOP',
      destinataria_cargo: 'Coordinadora Distrital de las Fiscalías Especializadas en Flagrancia Delictiva de Lima Centro',
      tipo_turno_asunto: 'DE FLAGRANCIA DELICTIVA',
      referencia: 'OFICIO CIRCULAR N° 000137-2026-MP-FN-PJFSLIMA (06NOV2026)',
      fecha_inicio: '',
      hora_inicio: '08:00',
      fecha_fin: '',
      hora_fin: '07:59',

      ...OFFICIAL_ANTECEDENTES,

      nombre_despacho_turno: '',
      tipo_flagrancia: true,
      tipo_corporativa: false,
      tipo_superior: false,
      tipo_otro_check: false,
      otro_tipo_turno: '',
      mod_24h: true,
      mod_semanal: false,
      mod_otra_check: false,
      otra_modalidad: '',
      sede_atencion: 'Unidad de Flagrancia Delictiva de Lima Centro',
      fiscal_responsable_nombre: '',
      fiscal_responsable_cargo: 'Fiscal Provincial Penal',
      fiscales_adjuntos: '',
      asistentes: '',
      observaciones_personal: 'Sin observaciones.',

      total_casos: '0',
      casos_con_detenido: '0',
      casos_sin_detenido: '0',
      total_detenidos: '0',
      levantamientos_cadaver: '0',
      casos_turnos_anteriores: '0',
      detenidos_resueltos: '0',
      detenidos_pendientes: '0',

      res_principio_oportunidad: '0',
      res_acuerdo_reparatorio: '0',
      res_proceso_inmediato: '0',
      res_terminacion_anticipada: '0',
      res_acusacion: '0',
      res_formalizacion: '0',
      res_medidas_coercion: '0',
      res_ampliacion: '0',
      res_archivo: '0',
      res_derivacion: '0',
      res_otros_detalle: '',
      res_otros: '0',
      delitos_mayor_incidencia: '',

      inc_personal: 'Sin incidencias',
      inc_flagrancia_turno: 'Sin incidencias',
      inc_interinstitucional: 'Sin incidencias',
      inc_comunicaciones_carpetas: 'Sin incidencias',
      inc_logistica: 'Sin incidencias',
      inc_otras: 'Sin incidencias',

      remitente_nombre: '',
      remitente_cargo: 'FISCAL PROVINCIAL',
      iniciales_redactor: '',

      anexo_acta: true,
      anexo_audiencias: false,
      anexo_excel: true,
      anexo_otros_check: false,
      otros_anexos: '',
      copias_a: 'Archivo',

      personalApoyo: [{ nombre: '', cargo: '', origen: '', horario: '', observacion: '' }],
      casosIngresados: [{ n_caso: '', detenidos: '', agraviado: '', delito: '', diligencias: '', resultado: '' }],
      casosAnteriores: [{ carpeta: '', origen: '', detenidos: '', estado_recibe: '', actuacion: '' }],
      audiencias: [{ carpeta: '', exp_juzgado: '', tipo_audiencia: '', resultado: '', observacion: '' }],
      levantamientos: [{ caso: '', diligencia: '', lugar: '', fecha_hora: '', observacion: '' }],
      casosDerivados: [{ carpeta: '', destino: '', motivo: '', pendiente: '', limite: '' }],
      conclusiones: ['', ''],
      recomendaciones: ['', '']
    };
  }

  function getExampleState() {
    const base = getDefaultState();
    return {
      ...base,
      numero_informe: '0018',
      siglas_despacho: '5FPPFD-LIMACENTRO',
      nombre_despacho_emisor: '5.ª Fiscalía Provincial Penal de Flagrancia Delictiva de Lima Centro',
      nombre_despacho_turno: '5.ª Fiscalía Provincial Penal de Flagrancia Delictiva de Lima Centro',
      fecha_inicio: '17/11/2026',
      fecha_fin: '18/11/2026',
      fiscal_responsable_nombre: 'Dra. María Elena Torres Mendoza',
      fiscal_responsable_cargo: 'Fiscal Provincial Penal',
      fiscales_adjuntos: 'Dr. Carlos Alberto Quispe Ramos, Dra. Lucía Fernanda Vega Paredes',
      asistentes: 'Bach. Andrea Sofía Ríos Castro (Asistente en Función Fiscal), Sr. Diego Armando Paredes León (Asistente Administrativo)',
      observaciones_personal: 'Equipo completo durante toda la jornada de 24 horas.',
      total_casos: '3',
      casos_con_detenido: '2',
      casos_sin_detenido: '1',
      total_detenidos: '3',
      levantamientos_cadaver: '0',
      casos_turnos_anteriores: '1',
      detenidos_resueltos: '3',
      detenidos_pendientes: '0',
      res_proceso_inmediato: '2 (2 procedentes)',
      res_principio_oportunidad: '1',
      delitos_mayor_incidencia: 'Conducción en estado de ebriedad, hurto agravado en grado de tentativa y receptación.',
      remitente_nombre: 'Dra. María Elena Torres Mendoza',
      remitente_cargo: 'FISCAL PROVINCIAL',
      iniciales_redactor: 'METM/asrc',
      anexo_audiencias: true,
      copias_a: 'Presidencia de la Junta de Fiscales Superiores de Lima Centro / Archivo',
      personalApoyo: [
        { nombre: 'Dr. Luis Miguel Salazar Cruz', cargo: 'Fiscal Adjunto Provincial', origen: 'Pool de Fiscales PJFS', horario: '14:00 - 22:00', observacion: 'Apoyo en diligencias preliminares y audiencias' }
      ],
      casosIngresados: [
        { n_caso: '506014505-2026-1412-0', detenidos: 'Juan Carlos Rojas Díaz (1)', agraviado: 'La Sociedad', delito: 'Conducción en estado de ebriedad', diligencias: 'Dosaje etílico, acta de intervención, declaración', resultado: 'Principio de oportunidad / Libertad' },
        { n_caso: '506014505-2026-1413-0', detenidos: 'Pedro Pablo Medina Sosa, Luis Ángel Cruz Tito (2)', agraviado: 'Tienda Comercial Metro S.A.', delito: 'Hurto agravado en grado de tentativa', diligencias: 'Inspección técnico policial, visualización de cámaras, actas', resultado: 'Requerimiento de incoación de proceso inmediato' },
        { n_caso: '506014505-2026-1414-0', detenidos: 'Sin detenido', agraviado: 'Rosaura Méndez Huamán', delito: 'Apropiación ilícita', diligencias: 'Denuncia directa y constatación', resultado: 'En investigación preliminar' }
      ],
      casosAnteriores: [
        { carpeta: '506014505-2026-1409-0', origen: '4.ª FPPFD Lima Centro (Turno 16/11)', detenidos: '1', estado_recibe: 'Detenido con plazo por vencer', actuacion: 'Se sustentó requerimiento de proceso inmediato en audiencia' }
      ],
      audiencias: [
        { carpeta: '506014505-2026-1409-0', exp_juzgado: 'Exp. 04122-2026 — 2° Juzgado de Flagrancia', tipo_audiencia: 'Incoación de Proceso Inmediato', resultado: 'Fundado', observacion: 'Se dictó comparecencia con restricciones y se remitió a juicio inmediato.' }
      ],
      levantamientos: [],
      casosDerivados: [],
      conclusiones: [
        'El turno fiscal se desarrolló con normalidad y dentro de los plazos establecidos por ley, resolviéndose la situación jurídica del 100% de los detenidos.',
        'Se mantuvo coordinación permanente con las comisarías de la jurisdicción y los juzgados de flagrancia delictiva.'
      ],
      recomendaciones: [
        'Continuar asignando apoyo del pool de fiscales en el horario vespertino de mayor carga.',
        'Mantener la coordinación operativa con la Unidad de Flagrancia para la programación célere de audiencias.'
      ]
    };
  }

  let state = getDefaultState();
  let currentStep = 0;
  let previewVisible = true;

  const $ = (sel) => document.querySelector(sel);
  const $$ = (sel) => Array.from(document.querySelectorAll(sel));

  function showToast(msg, isError = false) {
    const container = $('#toastContainer');
    if (!container) return;
    const el = document.createElement('div');
    el.className = 'toast' + (isError ? ' toast-error' : '');
    el.textContent = msg;
    container.appendChild(el);
    setTimeout(() => el.remove(), 3500);
  }

  function escapeHtml(str) {
    return String(str ?? '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  function valOrPlaceholder(v, ph = '—') {
    const s = String(v ?? '').trim();
    return s ? escapeHtml(s) : `<span class="placeholder-empty">${ph}</span>`;
  }

  function getStorageKey(acc = currentAccount) {
    return STORAGE_PREFIX + (acc ? acc.id : 'default');
  }

  function saveDraft() {
    try {
      localStorage.setItem(getStorageKey(), JSON.stringify({ savedAt: new Date().toISOString(), state }));
      const badge = $('#saveIndicator');
      if (badge) badge.textContent = 'Guardado ' + new Date().toLocaleTimeString('es-PE', { hour: '2-digit', minute: '2-digit' });
    } catch (_) {}

    if (sb && currentAccount && currentAccount.role === 'fiscalia') {
      clearTimeout(cloudSaveTimer);
      cloudSaveTimer = setTimeout(() => syncCloudRecord('borrador'), 1200);
    }
  }

  async function syncCloudRecord(status = 'borrador') {
    if (!sb || !currentAccount) return null;
    const payload = {
      user_id: currentAccount.id,
      username: currentAccount.username,
      despacho: state.nombre_despacho_emisor || currentAccount.despacho,
      numero_informe: state.numero_informe || '',
      anio: state.anio || '',
      fecha_inicio: state.fecha_inicio || '',
      fecha_fin: state.fecha_fin || '',
      total_casos: Number(state.total_casos || 0) || 0,
      total_detenidos: Number(state.total_detenidos || 0) || 0,
      status,
      state_json: state,
      updated_at: new Date().toISOString(),
      submitted_at: status === 'enviado' ? new Date().toISOString() : null
    };

    if (status === 'borrador' && currentDraftId) {
      const { data, error } = await sb
        .from('informes_turno')
        .update(payload)
        .eq('id', currentDraftId)
        .select('id')
        .single();
      if (!error && data) return data;
    }

    const { data, error } = await sb
      .from('informes_turno')
      .insert(payload)
      .select('id')
      .single();
    if (error) throw error;
    if (status === 'borrador' && data) currentDraftId = data.id;
    return data;
  }

  function loadDraft(acc = currentAccount) {
    try {
      const raw = localStorage.getItem(getStorageKey(acc));
      if (!raw) return null;
      return JSON.parse(raw);
    } catch (_) {
      return null;
    }
  }

  function updateProgress() {
    const checks = [
      Boolean(String(state.numero_informe || '').trim()),
      Boolean(String(state.fecha_inicio || '').trim()),
      Boolean(String(state.fecha_fin || '').trim()),
      Boolean(String(state.nombre_despacho_emisor || '').trim()),
      Boolean(String(state.fiscal_responsable_nombre || '').trim()),
      Boolean(String(state.delitos_mayor_incidencia || '').trim()),
      Boolean((state.conclusiones || []).some((c) => String(c || '').trim())),
      Boolean(String(state.remitente_nombre || '').trim())
    ];
    const pct = Math.round((checks.filter(Boolean).length / checks.length) * 100);
    const bar = $('#progressBarFill');
    const txt = $('#progressText');
    if (bar) bar.style.width = pct + '%';
    if (txt) txt.textContent = pct + '%';
  }

  function validateCriticalFields() {
    const missing = [];
    if (!String(state.numero_informe || '').trim()) missing.push('N° de Informe');
    if (!String(state.fecha_inicio || '').trim()) missing.push('Fecha de inicio');
    if (!String(state.fecha_fin || '').trim()) missing.push('Fecha de fin');
    if (!String(state.fiscal_responsable_nombre || '').trim()) missing.push('Fiscal responsable');
    return missing;
  }

  function syncInputsFromState() {
    $$('[data-bind]').forEach((el) => {
      const key = el.getAttribute('data-bind');
      el.value = state[key] ?? '';
    });
    $$('[data-bind-check]').forEach((el) => {
      const key = el.getAttribute('data-bind-check');
      el.checked = Boolean(state[key]);
    });
    renderDynamicTables();
    renderConclusionsAndRecs();
    renderPreview();
    updateProgress();
  }

  function renderDynamicTables() {
    renderTable('tbodyPersonalApoyo', 'personalApoyo', [
      { key: 'nombre', ph: 'Apellidos y nombres' },
      { key: 'cargo', ph: 'Cargo' },
      { key: 'origen', ph: 'Origen' },
      { key: 'horario', ph: 'Ej. 08:00-16:00' },
      { key: 'observacion', ph: 'Observaciones' }
    ]);
    renderTable('tbodyCasosIngresados', 'casosIngresados', [
      { key: 'n_caso', ph: 'Carpeta fiscal' },
      { key: 'detenidos', ph: 'Nombre(s) o Sin detenido' },
      { key: 'agraviado', ph: 'Agraviado' },
      { key: 'delito', ph: 'Delito' },
      { key: 'diligencias', ph: 'Diligencias', textarea: true },
      { key: 'resultado', ph: 'Resultado / estado', textarea: true }
    ]);
    renderTable('tbodyCasosAnteriores', 'casosAnteriores', [
      { key: 'carpeta', ph: 'Carpeta fiscal' },
      { key: 'origen', ph: 'Despacho y turno' },
      { key: 'detenidos', ph: 'Detenidos' },
      { key: 'estado_recibe', ph: 'Estado recibido' },
      { key: 'actuacion', ph: 'Actuación realizada', textarea: true }
    ]);
    renderTable('tbodyAudiencias', 'audiencias', [
      { key: 'carpeta', ph: 'Carpeta fiscal' },
      { key: 'exp_juzgado', ph: 'Exp. y juzgado' },
      { key: 'tipo_audiencia', ph: 'Tipo de audiencia' },
      { key: 'resultado', ph: 'Resultado' },
      { key: 'observacion', ph: 'Observación', textarea: true }
    ]);
    renderTable('tbodyLevantamientos', 'levantamientos', [
      { key: 'caso', ph: 'Caso / carpeta' },
      { key: 'diligencia', ph: 'Diligencia' },
      { key: 'lugar', ph: 'Lugar' },
      { key: 'fecha_hora', ph: 'Fecha y hora' },
      { key: 'observacion', ph: 'Observaciones' }
    ]);
    renderTable('tbodyCasosDerivados', 'casosDerivados', [
      { key: 'carpeta', ph: 'Carpeta fiscal' },
      { key: 'destino', ph: 'Despacho destino' },
      { key: 'motivo', ph: 'Motivo' },
      { key: 'pendiente', ph: 'Diligencias pendientes', textarea: true },
      { key: 'limite', ph: 'Fecha/hora límite' }
    ]);
  }

  function renderTable(tbodyId, arrayKey, cols) {
    const tbody = document.getElementById(tbodyId);
    if (!tbody) return;
    const rows = state[arrayKey] || [];
    if (rows.length === 0) {
      tbody.innerHTML = `<tr><td colspan="${cols.length + 2}" style="text-align:center;color:#64748b;padding:12px;">Sin registros. Haga clic en "+ Agregar" para añadir una fila.</td></tr>`;
      return;
    }
    tbody.innerHTML = rows
      .map((row, idx) => {
        const cells = cols
          .map((c) => {
            const val = escapeHtml(row[c.key] || '');
            if (c.textarea) {
              return `<td><textarea data-arr="${arrayKey}" data-idx="${idx}" data-col="${c.key}" placeholder="${c.ph}">${val}</textarea></td>`;
            }
            return `<td><input type="text" data-arr="${arrayKey}" data-idx="${idx}" data-col="${c.key}" value="${val}" placeholder="${c.ph}" /></td>`;
          })
          .join('');
        return `<tr>
          <td style="text-align:center;font-weight:700;color:#475569;">${idx + 1}</td>
          ${cells}
          <td><button type="button" class="btn btn-danger-soft btn-sm" data-del-arr="${arrayKey}" data-idx="${idx}" title="Eliminar fila">✕</button></td>
        </tr>`;
      })
      .join('');
  }

  function renderConclusionsAndRecs() {
    const renderList = (containerId, arrKey, prefix, label) => {
      const box = document.getElementById(containerId);
      if (!box) return;
      const items = state[arrKey] || [];
      box.innerHTML = items
        .map(
          (txt, idx) => `
        <div class="field" style="display:flex;flex-direction:row;gap:8px;align-items:flex-start;">
          <span style="font-weight:700;padding-top:8px;min-width:34px;color:#0a1f3d;">${prefix}.${idx + 1}</span>
          <textarea data-list="${arrKey}" data-idx="${idx}" style="flex:1;min-height:54px;" placeholder="${label} ${idx + 1}...">${escapeHtml(txt)}</textarea>
          <button type="button" class="btn btn-danger-soft btn-sm" data-del-list="${arrKey}" data-idx="${idx}" style="margin-top:4px;">✕</button>
        </div>`
        )
        .join('');
    };
    renderList('listConclusiones', 'conclusiones', '7', 'Conclusión');
    renderList('listRecomendaciones', 'recomendaciones', '8', 'Recomendación o solicitud');
  }

  function chk(bool) {
    return bool ? '☑' : '☐';
  }

  function renderPreview() {
    const el = $('#docPreview');
    if (!el) return;

    const renderRowsHtml = (arr, cols, emptyMsg) => {
      if (!arr || arr.length === 0) {
        return `<tr><td colspan="${cols.length + 1}" style="text-align:center;font-style:italic;color:#64748b;">${emptyMsg}</td></tr>`;
      }
      return arr
        .map(
          (r, i) =>
            `<tr><td style="text-align:center;">${i + 1}</td>${cols
              .map((c) => `<td>${escapeHtml(r[c] || '')}</td>`)
              .join('')}</tr>`
        )
        .join('');
    };

    const conHtml = (state.conclusiones || [])
      .map((c, i) => `<p class="doc-p"><strong>7.${i + 1}</strong> ${valOrPlaceholder(c, 'Sin especificar')}</p>`)
      .join('');
    const recHtml = (state.recomendaciones || [])
      .map((r, i) => `<p class="doc-p"><strong>8.${i + 1}</strong> ${valOrPlaceholder(r, 'Sin especificar')}</p>`)
      .join('');

    el.innerHTML = `
      <div class="doc-header">
        <img src="assets/header-mp.png" alt="Ministerio Público" />
        <div class="doc-decenio">
          "Decenio de la Igualdad de oportunidades para mujeres y hombres"<br/>
          "Año de la Esperanza y el Fortalecimiento de la Democracia"
        </div>
      </div>

      <div class="doc-date">Lima, ${valOrPlaceholder(state.fecha_informe, 'fecha')}</div>
      <div class="doc-title">INFORME N° ${valOrPlaceholder(state.numero_informe, '0000')}-${valOrPlaceholder(state.anio, '2026')}-MP-FN-${valOrPlaceholder(state.siglas_despacho, 'SIGLAS')}</div>

      <div class="doc-recipient">
        Señora Doctora:<br/>
        <strong>${escapeHtml(state.destinataria_nombre)}</strong><br/>
        ${escapeHtml(state.destinataria_cargo)}<br/>
        <u>Presente. -</u>
      </div>

      <table class="doc-subject-table">
        <tr>
          <td>Asunto</td>
          <td>: INFORME DEL TURNO FISCAL ${escapeHtml(state.tipo_turno_asunto)} COMPRENDIDO DESDE LAS ${valOrPlaceholder(state.hora_inicio, '08:00')} HORAS DEL ${valOrPlaceholder(state.fecha_inicio, 'dd/mm/aaaa')} HASTA LAS ${valOrPlaceholder(state.hora_fin, '07:59')} HORAS DEL ${valOrPlaceholder(state.fecha_fin, 'dd/mm/aaaa')}</td>
        </tr>
        <tr>
          <td>Referencia</td>
          <td>: ${escapeHtml(state.referencia)}</td>
        </tr>
      </table>

      <p class="doc-p">
        Tengo el agrado de dirigirme a usted, para saludarla cordialmente y, en atención al documento de la referencia, informar sobre las incidencias y los casos atendidos durante el turno fiscal a cargo de <strong>${valOrPlaceholder(state.nombre_despacho_emisor, 'despacho emisor')}</strong>, conforme se detalla a continuación:
      </p>

      <div class="doc-section-title">1. ANTECEDENTES</div>
      <p class="doc-p">${escapeHtml(state.antecedente_1)}</p>
      <p class="doc-p">${escapeHtml(state.antecedente_2)}</p>
      <p class="doc-p">${escapeHtml(state.antecedente_3)}</p>

      <div class="doc-section-title">2. DATOS GENERALES DEL TURNO</div>
      <table class="doc-table">
        <tr><td class="label-col">Despacho de turno</td><td>${valOrPlaceholder(state.nombre_despacho_turno)}</td></tr>
        <tr><td class="label-col">Tipo de turno</td><td>${chk(state.tipo_flagrancia)} Flagrancia delictiva &nbsp; ${chk(state.tipo_corporativa)} Fiscalía corporativa penal &nbsp; ${chk(state.tipo_superior)} Fiscalía superior &nbsp; ${chk(state.tipo_otro_check)} Otro: ${escapeHtml(state.otro_tipo_turno)}</td></tr>
        <tr><td class="label-col">Modalidad y duración</td><td>${chk(state.mod_24h)} 24 horas &nbsp; ${chk(state.mod_semanal)} Semanal &nbsp; ${chk(state.mod_otra_check)} Otra: ${escapeHtml(state.otra_modalidad)}</td></tr>
        <tr><td class="label-col">Inicio del turno</td><td>${valOrPlaceholder(state.fecha_inicio, 'dd/mm/aaaa')}, ${escapeHtml(state.hora_inicio)} horas</td></tr>
        <tr><td class="label-col">Culminación del turno</td><td>${valOrPlaceholder(state.fecha_fin, 'dd/mm/aaaa')}, ${escapeHtml(state.hora_fin)} horas</td></tr>
        <tr><td class="label-col">Rol de turno aplicable</td><td>Resolución N° 007171-2026-MP-FN-PJFSLIMA (19/10/2026), rectificada por la Resolución N° 007540-2026-MP-FN-PJFSLIMA (30/10/2026)</td></tr>
        <tr><td class="label-col">Informe dispuesto por</td><td>Oficio Circular N° 000137-2026-MP-FN-PJFSLIMA (06/11/2026)</td></tr>
        <tr><td class="label-col">Sede o lugar de atención</td><td>${valOrPlaceholder(state.sede_atencion)}</td></tr>
        <tr><td class="label-col">Fiscal responsable</td><td>${valOrPlaceholder(state.fiscal_responsable_nombre)} (${escapeHtml(state.fiscal_responsable_cargo)})</td></tr>
        <tr><td class="label-col">Fiscales adjuntos provinciales</td><td>${valOrPlaceholder(state.fiscales_adjuntos)}</td></tr>
        <tr><td class="label-col">Asistentes en función fiscal y administrativos</td><td>${valOrPlaceholder(state.asistentes)}</td></tr>
      </table>

      <div class="doc-subsection-title">2.1 Personal de apoyo asignado al turno (pool de fiscales, Presidencia u otros)</div>
      <table class="doc-table">
        <thead><tr><th>N°</th><th>Apellidos y nombres</th><th>Cargo</th><th>Origen del apoyo</th><th>Horario de apoyo</th><th>Observaciones</th></tr></thead>
        <tbody>${renderRowsHtml(state.personalApoyo, ['nombre','cargo','origen','horario','observacion'], 'Sin personal de apoyo adicional')}</tbody>
      </table>
      <p class="doc-p"><strong>Observaciones sobre la disponibilidad del personal:</strong> ${valOrPlaceholder(state.observaciones_personal)}</p>

      <div class="doc-section-title">3. RESUMEN ESTADÍSTICO DEL TURNO</div>
      <table class="doc-table">
        <thead><tr><th>Indicador</th><th style="width:110px;text-align:center;">Cantidad</th></tr></thead>
        <tbody>
          <tr><td>Total de casos fiscales recibidos</td><td style="text-align:center;">${escapeHtml(state.total_casos)}</td></tr>
          <tr><td>Casos con detenido</td><td style="text-align:center;">${escapeHtml(state.casos_con_detenido)}</td></tr>
          <tr><td>Casos sin detenido</td><td style="text-align:center;">${escapeHtml(state.casos_sin_detenido)}</td></tr>
          <tr><td>Total de detenidos</td><td style="text-align:center;">${escapeHtml(state.total_detenidos)}</td></tr>
          <tr><td>Levantamientos de cadáver</td><td style="text-align:center;">${escapeHtml(state.levantamientos_cadaver)}</td></tr>
          <tr><td>Casos recibidos de turnos anteriores</td><td style="text-align:center;">${escapeHtml(state.casos_turnos_anteriores)}</td></tr>
          <tr><td>Detenidos con situación jurídica resuelta dentro del plazo de ley</td><td style="text-align:center;">${escapeHtml(state.detenidos_resueltos)}</td></tr>
          <tr><td>Detenidos con situación jurídica pendiente</td><td style="text-align:center;">${escapeHtml(state.detenidos_pendientes)}</td></tr>
        </tbody>
      </table>

      <div class="doc-subsection-title">3.1 Resultados obtenidos</div>
      <table class="doc-table">
        <thead><tr><th>Resultado</th><th style="width:140px;text-align:center;">Cantidad</th></tr></thead>
        <tbody>
          <tr><td>Principio de oportunidad</td><td style="text-align:center;">${escapeHtml(state.res_principio_oportunidad)}</td></tr>
          <tr><td>Acuerdo reparatorio</td><td style="text-align:center;">${escapeHtml(state.res_acuerdo_reparatorio)}</td></tr>
          <tr><td>Incoación de proceso inmediato (procedente / improcedente)</td><td style="text-align:center;">${escapeHtml(state.res_proceso_inmediato)}</td></tr>
          <tr><td>Terminación anticipada</td><td style="text-align:center;">${escapeHtml(state.res_terminacion_anticipada)}</td></tr>
          <tr><td>Acusación directa o requerimiento acusatorio</td><td style="text-align:center;">${escapeHtml(state.res_acusacion)}</td></tr>
          <tr><td>Formalización de la investigación preparatoria</td><td style="text-align:center;">${escapeHtml(state.res_formalizacion)}</td></tr>
          <tr><td>Prisión preventiva solicitada u otra medida de coerción</td><td style="text-align:center;">${escapeHtml(state.res_medidas_coercion)}</td></tr>
          <tr><td>Ampliación de investigación preliminar o de diligencias</td><td style="text-align:center;">${escapeHtml(state.res_ampliacion)}</td></tr>
          <tr><td>Archivo, libertad por atipicidad u otra disposición de conclusión</td><td style="text-align:center;">${escapeHtml(state.res_archivo)}</td></tr>
          <tr><td>Derivación a otro despacho</td><td style="text-align:center;">${escapeHtml(state.res_derivacion)}</td></tr>
          <tr><td>Otros resultados: ${escapeHtml(state.res_otros_detalle)}</td><td style="text-align:center;">${escapeHtml(state.res_otros)}</td></tr>
        </tbody>
      </table>
      <p class="doc-p"><strong>Delitos de mayor incidencia durante el turno:</strong> ${valOrPlaceholder(state.delitos_mayor_incidencia)}.</p>

      <div class="doc-section-title">4. DETALLE DE CASOS</div>
      <div class="doc-subsection-title">4.1 Casos ingresados durante el turno</div>
      <table class="doc-table">
        <thead><tr><th>N°</th><th>Carpeta fiscal / caso</th><th>Detenido(s)</th><th>Agraviado</th><th>Delito</th><th>Diligencias realizadas</th><th>Resultado y estado</th></tr></thead>
        <tbody>
          ${renderRowsHtml(state.casosIngresados, ['n_caso','detenidos','agraviado','delito','diligencias','resultado'], 'Sin casos ingresados')}
          <tr><td colspan="6" style="font-weight:700;text-align:right;">Total de detenidos del turno</td><td style="font-weight:700;text-align:center;">${escapeHtml(state.total_detenidos)}</td></tr>
        </tbody>
      </table>

      <div class="doc-subsection-title">4.2 Casos recibidos de turnos anteriores</div>
      <table class="doc-table">
        <thead><tr><th>N°</th><th>Carpeta fiscal</th><th>Despacho y turno de origen</th><th>Detenidos</th><th>Estado en que se recibe</th><th>Actuación realizada</th></tr></thead>
        <tbody>${renderRowsHtml(state.casosAnteriores, ['carpeta','origen','detenidos','estado_recibe','actuacion'], 'Sin casos de turnos anteriores')}</tbody>
      </table>

      <div class="doc-subsection-title">4.3 Audiencias realizadas o programadas</div>
      <table class="doc-table">
        <thead><tr><th>N°</th><th>Carpeta fiscal</th><th>Expediente judicial y juzgado</th><th>Tipo de audiencia</th><th>Resultado</th><th>Observación o informe</th></tr></thead>
        <tbody>${renderRowsHtml(state.audiencias, ['carpeta','exp_juzgado','tipo_audiencia','resultado','observacion'], 'Sin audiencias registradas')}</tbody>
      </table>

      <div class="doc-subsection-title">4.4 Levantamientos de cadáver y diligencias urgentes sin detenido</div>
      <table class="doc-table">
        <thead><tr><th>N°</th><th>Caso</th><th>Diligencia</th><th>Lugar</th><th>Fecha y hora</th><th>Observaciones</th></tr></thead>
        <tbody>${renderRowsHtml(state.levantamientos, ['caso','diligencia','lugar','fecha_hora','observacion'], 'Sin levantamientos ni diligencias urgentes registradas')}</tbody>
      </table>

      <div class="doc-section-title">5. CASOS DERIVADOS, PENDIENTES Y DETENCIONES POR VENCER</div>
      <table class="doc-table">
        <thead><tr><th>N°</th><th>Carpeta fiscal</th><th>Despacho destino / a cargo</th><th>Motivo</th><th>Diligencias pendientes</th><th>Fecha y hora límite</th></tr></thead>
        <tbody>${renderRowsHtml(state.casosDerivados, ['carpeta','destino','motivo','pendiente','limite'], 'Sin casos derivados o detenciones por vencer')}</tbody>
      </table>

      <div class="doc-section-title">6. INCIDENCIAS Y PROBLEMÁTICA IDENTIFICADA</div>
      <p class="doc-p">• <strong>Personal y recursos del despacho:</strong> ${escapeHtml(state.inc_personal)}</p>
      <p class="doc-p">• <strong>Coordinación con la Unidad de Flagrancia y con otras fiscalías de turno:</strong> ${escapeHtml(state.inc_flagrancia_turno)}</p>
      <p class="doc-p">• <strong>Coordinación interinstitucional (PNP, Poder Judicial, Medicina Legal u otras):</strong> ${escapeHtml(state.inc_interinstitucional)}</p>
      <p class="doc-p">• <strong>Recepción de comunicaciones, actas y remisión de carpetas fiscales:</strong> ${escapeHtml(state.inc_comunicaciones_carpetas)}</p>
      <p class="doc-p">• <strong>Aspectos logísticos, de infraestructura o de sistemas:</strong> ${escapeHtml(state.inc_logistica)}</p>
      <p class="doc-p">• <strong>Otras incidencias:</strong> ${escapeHtml(state.inc_otras)}</p>

      <div class="doc-section-title">7. CONCLUSIONES</div>
      ${conHtml}

      <div class="doc-section-title">8. RECOMENDACIONES Y SOLICITUDES</div>
      ${recHtml}

      <p class="doc-p" style="margin-top:12px;">
        Es todo cuanto tengo que informar para su conocimiento y fines que se sirva determinar y, sin otro particular, hago propicia la ocasión para expresarle mi mayor consideración y estima personal.
      </p>

      <div class="doc-signature">
        <p style="margin-bottom:44px;">Atentamente,</p>
        <div class="doc-sig-line"></div>
        <strong>${valOrPlaceholder(state.remitente_nombre, 'Nombre del remitente')}</strong><br/>
        <span>${escapeHtml(state.remitente_cargo)} DE ${valOrPlaceholder(state.nombre_despacho_emisor, 'DESPACHO')}</span><br/>
        <span style="font-size:8.5pt;color:#475569;">${escapeHtml(state.iniciales_redactor)}</span>
      </div>

      <div style="margin-top:16px;font-size:9pt;">
        <strong>ANEXOS</strong><br/>
        ${chk(state.anexo_acta)} Acta de recepción de llamadas y comunicaciones del turno<br/>
        ${chk(state.anexo_audiencias)} Informes de audiencia<br/>
        ${chk(state.anexo_excel)} Cuadro de casos del turno en formato digital (Excel)<br/>
        ${chk(state.anexo_otros_check)} Otros: ${escapeHtml(state.otros_anexos)}<br/>
        <strong>cc:</strong> ${escapeHtml(state.copias_a)}
      </div>

      <div class="doc-footer">
        <span>(511) 625-5555</span>
        <span>Av. Abancay Cdra. 5 s/n Lima - Perú</span>
        <span>www.fiscalia.gob.pe</span>
      </div>
    `;
  }

  function goToStep(stepIdx) {
    currentStep = Math.max(0, Math.min(7, stepIdx));
    $$('.step-pane').forEach((p) => {
      p.classList.toggle('hidden', Number(p.dataset.step) !== currentStep);
    });
    $$('.step-btn').forEach((b) => {
      b.classList.toggle('active', Number(b.dataset.step) === currentStep);
    });
    $('#stepCounter').textContent = `Sección ${currentStep + 1} de 8`;
    $('#btnPrevStep').disabled = currentStep === 0;
    $('#btnNextStep').disabled = currentStep === 7;
  }

  function showAdminPanel() {
    $('#adminPanel').classList.remove('hidden');
    $('#workspace').classList.add('hidden');
    $('#btnSendToCoord').classList.add('hidden');
    $('#btnBackToAdmin').classList.add('hidden');
    renderAdminDashboard();
  }

  function showEditorWorkspace() {
    $('#adminPanel').classList.add('hidden');
    $('#workspace').classList.remove('hidden');
    $('#btnSendToCoord').classList.toggle('hidden', currentAccount.role === 'admin');
    $('#btnBackToAdmin').classList.toggle('hidden', currentAccount.role !== 'admin');
  }

  async function renderAdminDashboard() {
    if (!sb) return;
    const [{ data: profiles }, { data: informes }] = await Promise.all([
      sb.from('profiles').select('*').eq('role', 'fiscalia').order('fiscalia_num', { ascending: true }),
      sb.from('informes_turno').select('*').order('updated_at', { ascending: false })
    ]);

    adminFiscaliasCache = profiles || [];
    const allInformes = informes || [];
    const submissions = allInformes.filter((r) => r.status === 'enviado');
    adminInformesCache = submissions;

    let totalCasos = 0;
    let totalDetenidos = 0;
    submissions.forEach((s) => {
      totalCasos += Number(s.total_casos || 0);
      totalDetenidos += Number(s.total_detenidos || 0);
    });

    const statsEl = $('#adminStatsGrid');
    if (statsEl) {
      statsEl.innerHTML = `
        <div class="admin-stat-card"><span>Fiscalías Habilitadas</span><strong>${adminFiscaliasCache.length}</strong></div>
        <div class="admin-stat-card"><span>Informes Remitidos</span><strong>${submissions.length}</strong></div>
        <div class="admin-stat-card"><span>Total Casos Reportados</span><strong>${totalCasos}</strong></div>
        <div class="admin-stat-card"><span>Total Detenidos Reportados</span><strong>${totalDetenidos}</strong></div>
      `;
    }

    const tbodyF = $('#tbodyAdminFiscalias');
    if (tbodyF) {
      tbodyF.innerHTML = adminFiscaliasCache
        .map((f, i) => {
          const sub = submissions.find((s) => s.user_id === f.id);
          const draft = allInformes.find((s) => s.user_id === f.id && s.status === 'borrador');
          const refRec = sub || draft;
          const badge = sub
            ? '<span class="badge-ok">Remitido</span>'
            : draft
              ? '<span class="badge-pending">En borrador</span>'
              : '<span class="badge-pending">Sin iniciar</span>';
          const numInf = refRec?.numero_informe ? `N° ${escapeHtml(refRec.numero_informe)}-${escapeHtml(refRec.anio || '')}` : '—';
          const casosDet = refRec ? `${escapeHtml(refRec.total_casos ?? 0)} / ${escapeHtml(refRec.total_detenidos ?? 0)}` : '—';
          return `<tr>
            <td style="text-align:center;font-weight:700;">${f.fiscalia_num || i + 1}</td>
            <td><strong>${escapeHtml(f.despacho)}</strong></td>
            <td><code>${escapeHtml(f.username)}</code></td>
            <td>${badge}</td>
            <td>${numInf}</td>
            <td>${casosDet}</td>
            <td><button type="button" class="btn btn-outline btn-sm" data-admin-open-fiscalia="${f.id}">Abrir / Revisar</button></td>
          </tr>`;
        })
        .join('');
    }

    const tbodyS = $('#tbodyAdminSubmissions');
    if (tbodyS) {
      const q = ($('#adminSearchInput')?.value || '').trim().toLowerCase();
      const indexed = submissions.map((s, idx) => ({ s, idx })).filter(({ s }) => {
        if (!q) return true;
        const st = s.state_json || {};
        const hay = `${s.despacho} ${s.numero_informe || ''} ${s.fecha_inicio || ''} ${st.fiscal_responsable_nombre || ''}`.toLowerCase();
        return hay.includes(q);
      });
      if (!indexed.length) {
        tbodyS.innerHTML = '<tr><td colspan="6" style="text-align:center;color:#64748b;padding:14px;">No hay informes remitidos que coincidan.</td></tr>';
      } else {
        tbodyS.innerHTML = indexed
          .map(({ s, idx }) => `<tr>
            <td>${escapeHtml(new Date(s.submitted_at || s.updated_at).toLocaleString('es-PE'))}</td>
            <td>${escapeHtml(s.despacho)}</td>
            <td>N° ${escapeHtml(s.numero_informe || 'S/N')}-${escapeHtml(s.anio || '')}</td>
            <td>${escapeHtml(s.fecha_inicio || '—')} al ${escapeHtml(s.fecha_fin || '—')}</td>
            <td>${escapeHtml(s.total_casos ?? 0)} / ${escapeHtml(s.total_detenidos ?? 0)}</td>
            <td style="display:flex;gap:6px;flex-wrap:wrap;">
              <button type="button" class="btn btn-primary btn-sm" data-admin-view-sub="${idx}">Ver / Editar</button>
              <button type="button" class="btn btn-gold btn-sm" data-admin-docx-sub="${idx}">Word (.docx)</button>
              <button type="button" class="btn btn-danger-soft btn-sm" data-admin-del-sub="${idx}">✕</button>
            </td>
          </tr>`)
          .join('');
      }
    }
  }

  async function enterWorkspace(account) {
    currentAccount = account;
    currentDraftId = null;
    const loader = $('#securityLoader');
    const bar = $('#securityBarFill');
    const status = $('#securityStatus');
    loader.classList.remove('hidden');
    bar.style.width = '25%';
    status.textContent = `Autenticando cuenta: ${account.username}...`;

    let cloudDraft = null;
    if (sb && account.role === 'fiscalia') {
      const { data } = await sb
        .from('informes_turno')
        .select('*')
        .eq('user_id', account.id)
        .eq('status', 'borrador')
        .order('updated_at', { ascending: false })
        .limit(1);
      if (data && data.length) {
        cloudDraft = data[0];
        currentDraftId = cloudDraft.id;
      }
    }

    bar.style.width = '75%';
    status.textContent = account.role === 'admin' ? 'Cargando panel de Coordinación...' : 'Cargando plantilla del despacho...';

    setTimeout(() => {
      bar.style.width = '100%';
      status.textContent = 'Acceso concedido.';
    }, 200);

    setTimeout(() => {
      loader.classList.add('hidden');
      $('#loginScreen').classList.add('hidden');
      $('#appShell').classList.remove('hidden');
      $('#topbarSubtitle').textContent = `${account.despacho} (${account.username})`;

      const savedLocal = loadDraft(account);
      if (cloudDraft && cloudDraft.state_json) {
        state = { ...getDefaultState(), ...cloudDraft.state_json };
      } else if (savedLocal && savedLocal.state) {
        state = { ...getDefaultState(), ...savedLocal.state };
      } else {
        state = getDefaultState();
        state.nombre_despacho_emisor = account.despacho;
        state.nombre_despacho_turno = account.despacho;
        state.siglas_despacho = account.siglas;
      }

      if (account.role === 'admin') {
        showAdminPanel();
      } else {
        showEditorWorkspace();
        syncInputsFromState();
      }
    }, 450);
  }

  function base64ToUint8Array(b64) {
    const bin = atob(b64);
    const len = bin.length;
    const bytes = new Uint8Array(len);
    for (let i = 0; i < len; i++) bytes[i] = bin.charCodeAt(i);
    return bytes;
  }

  async function buildDocxBlobFromTemplate() {
    if (!window.JSZip || !window.MP_TEMPLATE_DOCX_B64) {
      throw new Error('Plantilla Word o JSZip no disponibles.');
    }

    const zip = await window.JSZip.loadAsync(base64ToUint8Array(window.MP_TEMPLATE_DOCX_B64));
    const xmlText = await zip.file('word/document.xml').async('string');
    const parser = new DOMParser();
    const xmlDoc = parser.parseFromString(xmlText, 'application/xml');
    const W_NS = 'http://schemas.openxmlformats.org/wordprocessingml/2006/main';

    const getTextNodes = (node) => Array.from(node.getElementsByTagNameNS(W_NS, 't'));

    const replaceInNode = (node, map) => {
      for (const t of getTextNodes(node)) {
        let txt = t.textContent;
        for (const [k, v] of Object.entries(map)) {
          if (txt.includes(k)) {
            txt = txt.split(k).join(String(v ?? ''));
          }
        }
        t.textContent = txt;
      }
    };

    const setRowValues = (tr, indexNum, valuesMap) => {
      const cells = Array.from(tr.children).filter((n) => n.localName === 'tc');
      if (cells.length > 0) {
        const firstTs = getTextNodes(cells[0]);
        if (firstTs.length > 0 && /^\d+$/.test(firstTs[0].textContent.trim())) {
          firstTs[0].textContent = String(indexNum);
        }
      }
      replaceInNode(tr, valuesMap);
    };

    const populateDynamicTable = (tbl, rowsData, mapFn, keepLastRowCount = 0) => {
      if (!tbl) return;
      const trs = Array.from(tbl.children).filter((n) => n.localName === 'tr');
      const headerRowCount = 1;
      const templateRow = trs[headerRowCount];
      if (!templateRow) return;

      const templateClone = templateRow.cloneNode(true);
      const footerRows = keepLastRowCount > 0 ? trs.slice(trs.length - keepLastRowCount) : [];
      const dataRows = trs.slice(headerRowCount, trs.length - keepLastRowCount);
      dataRows.forEach((r) => tbl.removeChild(r));

      const items = rowsData && rowsData.length ? rowsData : [null];
      const insertBeforeNode = footerRows[0] || null;

      items.forEach((item, idx) => {
        const newRow = templateClone.cloneNode(true);
        const mapped = item ? mapFn(item) : mapFn({});
        setRowValues(newRow, idx + 1, mapped);
        if (insertBeforeNode) tbl.insertBefore(newRow, insertBeforeNode);
        else tbl.appendChild(newRow);
      });
    };

    const body = xmlDoc.getElementsByTagNameNS(W_NS, 'body')[0];
    const tables = Array.from(body.children).filter((n) => n.localName === 'tbl');

    // Tabla 2.1 Personal de apoyo (index 2)
    populateDynamicTable(tables[2], state.personalApoyo, (r) => ({
      '{{nombre}}': r.nombre || '',
      '{{cargo}}': r.cargo || '',
      '{{origen}}': r.origen || '',
      '{{horario}}': r.horario || '',
      '{{observacion}}': r.observacion || ''
    }));

    // Tabla 4.1 Casos ingresados (index 5, keep last row "Total de detenidos del turno")
    populateDynamicTable(tables[5], state.casosIngresados, (r) => ({
      '{{n_caso}}': r.n_caso || '',
      '{{detenidos}}': r.detenidos || '',
      '{{agraviado}}': r.agraviado || '',
      '{{delito}}': r.delito || '',
      '{{diligencias}}': r.diligencias || '',
      '{{resultado}}': r.resultado || ''
    }), 1);

    // Tabla 4.2 Casos turnos anteriores (index 6)
    populateDynamicTable(tables[6], state.casosAnteriores, (r) => ({
      '{{carpeta}}': r.carpeta || '',
      '{{origen}}': r.origen || '',
      '{{detenidos}}': r.detenidos || '',
      '{{estado_recibe}}': r.estado_recibe || '',
      '{{actuacion}}': r.actuacion || ''
    }));

    // Tabla 4.3 Audiencias (index 7)
    populateDynamicTable(tables[7], state.audiencias, (r) => ({
      '{{carpeta}}': r.carpeta || '',
      '{{exp_juzgado}}': r.exp_juzgado || '',
      '{{tipo_audiencia}}': r.tipo_audiencia || '',
      '{{resultado}}': r.resultado || '',
      '{{observacion}}': r.observacion || ''
    }));

    // Tabla 4.4 Levantamientos (index 8)
    populateDynamicTable(tables[8], state.levantamientos, (r) => ({
      '{{caso}}': r.caso || '',
      '{{diligencia}}': r.diligencia || '',
      '{{lugar}}': r.lugar || '',
      '{{fecha_hora}}': r.fecha_hora || '',
      '{{observacion}}': r.observacion || ''
    }));

    // Tabla 5 Casos derivados (index 9)
    populateDynamicTable(tables[9], state.casosDerivados, (r) => ({
      '{{carpeta}}': r.carpeta || '',
      '{{destino}}': r.destino || '',
      '{{motivo}}': r.motivo || '',
      '{{pendiente}}': r.pendiente || '',
      '{{limite}}': r.limite || ''
    }));

    // Conclusiones y Recomendaciones dinámicas (<2 o >2 items)
    const expandListParagraph = (marker2, items, prefix) => {
      const paras = Array.from(body.children).filter((n) => n.localName === 'p');
      const p2 = paras.find((p) => getTextNodes(p).map((t) => t.textContent).join('').includes(marker2));
      if (!p2) return;
      if (items.length < 2) {
        p2.parentNode.removeChild(p2);
        return;
      }
      let anchor = p2;
      for (let i = 2; i < items.length; i++) {
        const clone = p2.cloneNode(true);
        const ts = getTextNodes(clone);
        if (ts.length > 0) {
          ts[0].textContent = `${prefix}.${i + 1}  ${items[i] || ''}`;
          for (let j = 1; j < ts.length; j++) ts[j].textContent = '';
        }
        anchor.parentNode.insertBefore(clone, anchor.nextSibling);
        anchor = clone;
      }
    };
    expandListParagraph('{{conclusion_2}}', state.conclusiones || [], '7');
    expandListParagraph('{{recomendacion_2}}', state.recomendaciones || [], '8');

    // Actualizar destinataria, referencia y antecedentes si fueron editados
    const bodyParas = Array.from(body.children).filter((n) => n.localName === 'p');
    bodyParas.forEach((p) => {
      const full = getTextNodes(p).map((t) => t.textContent).join('');
      if (full.startsWith('Mediante el Oficio Circular N° 000137-2026') && state.antecedente_1) {
        const ts = getTextNodes(p);
        if (ts.length) { ts[0].textContent = state.antecedente_1; for (let j = 1; j < ts.length; j++) ts[j].textContent = ''; }
      } else if (full.startsWith('El turno se desarrolló conforme al rol') && state.antecedente_2) {
        const ts = getTextNodes(p);
        if (ts.length) { ts[0].textContent = state.antecedente_2; for (let j = 1; j < ts.length; j++) ts[j].textContent = ''; }
      } else if (full.startsWith('Se aplicaron, además, las Resoluciones') && state.antecedente_3) {
        const ts = getTextNodes(p);
        if (ts.length) { ts[0].textContent = state.antecedente_3; for (let j = 1; j < ts.length; j++) ts[j].textContent = ''; }
      }
    });

    // Reemplazo global de todos los campos y checkboxes del modelo
    const replacements = {
      'LILLY LORENA GELACIO LLONTOP': state.destinataria_nombre || 'LILLY LORENA GELACIO LLONTOP',
      'Coordinadora Distrital de las Fiscalías Especializadas en Flagrancia Delictiva de Lima Centro': state.destinataria_cargo || 'Coordinadora Distrital de las Fiscalías Especializadas en Flagrancia Delictiva de Lima Centro',
      'OFICIO CIRCULAR N° 000137-2026-MP-FN-PJFSLIMA (06NOV2026)': state.referencia || 'OFICIO CIRCULAR N° 000137-2026-MP-FN-PJFSLIMA (06NOV2026)',
      '{{fecha_informe}}': state.fecha_informe,
      '{{numero_informe}}': state.numero_informe || '____',
      '{{anio}}': state.anio,
      '{{siglas_despacho}}': state.siglas_despacho || 'SIGLAS',
      '{{tipo_turno}}': state.tipo_turno_asunto,
      '{{hora_inicio}}': state.hora_inicio,
      '{{fecha_inicio}}': state.fecha_inicio,
      '{{hora_fin}}': state.hora_fin,
      '{{fecha_fin}}': state.fecha_fin,
      '{{nombre_despacho_emisor}}': state.nombre_despacho_emisor,
      '{{nombre_despacho_turno}}': state.nombre_despacho_turno,
      '{{otro_tipo_turno}}': state.otro_tipo_turno,
      '{{otra_modalidad}}': state.otra_modalidad,
      '{{sede_atencion}}': state.sede_atencion,
      '{{fiscal_responsable_nombre}}': state.fiscal_responsable_nombre,
      '{{fiscal_responsable_cargo}}': state.fiscal_responsable_cargo,
      '{{fiscales_adjuntos}}': state.fiscales_adjuntos,
      '{{asistentes}}': state.asistentes,
      '{{observaciones_personal}}': state.observaciones_personal,

      '{{total_casos}}': state.total_casos,
      '{{casos_con_detenido}}': state.casos_con_detenido,
      '{{casos_sin_detenido}}': state.casos_sin_detenido,
      '{{total_detenidos}}': state.total_detenidos,
      '{{levantamientos_cadaver}}': state.levantamientos_cadaver,
      '{{casos_turnos_anteriores}}': state.casos_turnos_anteriores,
      '{{detenidos_resueltos}}': state.detenidos_resueltos,
      '{{detenidos_pendientes}}': state.detenidos_pendientes,

      '{{res_principio_oportunidad}}': state.res_principio_oportunidad,
      '{{res_acuerdo_reparatorio}}': state.res_acuerdo_reparatorio,
      '{{res_proceso_inmediato}}': state.res_proceso_inmediato,
      '{{res_terminacion_anticipada}}': state.res_terminacion_anticipada,
      '{{res_acusacion}}': state.res_acusacion,
      '{{res_formalizacion}}': state.res_formalizacion,
      '{{res_medidas_coercion}}': state.res_medidas_coercion,
      '{{res_ampliacion}}': state.res_ampliacion,
      '{{res_archivo}}': state.res_archivo,
      '{{res_derivacion}}': state.res_derivacion,
      '{{res_otros_detalle}}': state.res_otros_detalle,
      '{{res_otros}}': state.res_otros,
      '{{delitos_mayor_incidencia}}': state.delitos_mayor_incidencia,

      '{{inc_personal}}': state.inc_personal,
      '{{inc_flagrancia_turno}}': state.inc_flagrancia_turno,
      '{{inc_interinstitucional}}': state.inc_interinstitucional,
      '{{inc_comunicaciones_carpetas}}': state.inc_comunicaciones_carpetas,
      '{{inc_logistica}}': state.inc_logistica,
      '{{inc_otras}}': state.inc_otras,

      '{{conclusion_1}}': (state.conclusiones && state.conclusiones[0]) || '',
      '{{conclusion_2}}': (state.conclusiones && state.conclusiones[1]) || '',
      '{{recomendacion_1}}': (state.recomendaciones && state.recomendaciones[0]) || '',
      '{{recomendacion_2}}': (state.recomendaciones && state.recomendaciones[1]) || '',

      '{{remitente_nombre}}': state.remitente_nombre,
      '{{remitente_cargo}}': state.remitente_cargo,
      '{{iniciales_redactor}}': state.iniciales_redactor,
      '{{otros_anexos}}': state.otros_anexos,
      '{{copias_a}}': state.copias_a,

      '☐ Flagrancia delictiva': `${chk(state.tipo_flagrancia)} Flagrancia delictiva`,
      '☐ Fiscalía corporativa penal': `${chk(state.tipo_corporativa)} Fiscalía corporativa penal`,
      '☐ Fiscalía superior': `${chk(state.tipo_superior)} Fiscalía superior`,
      '☐ Otro:': `${chk(state.tipo_otro_check)} Otro:`,
      '☐ 24 horas': `${chk(state.mod_24h)} 24 horas`,
      '☐ Semanal': `${chk(state.mod_semanal)} Semanal`,
      '☐ Otra:': `${chk(state.mod_otra_check)} Otra:`,
      '☐ Acta de recepción de llamadas': `${chk(state.anexo_acta)} Acta de recepción de llamadas`,
      '☐ Informes de audiencia': `${chk(state.anexo_audiencias)} Informes de audiencia`,
      '☐ Cuadro de casos del turno': `${chk(state.anexo_excel)} Cuadro de casos del turno`,
      '☐ Otros:': `${chk(state.anexo_otros_check)} Otros:`
    };

    replaceInNode(body, replacements);

    const serializer = new XMLSerializer();
    const updatedXml = serializer.serializeToString(xmlDoc);
    zip.file('word/document.xml', updatedXml);

    return zip.generateAsync({
      type: 'blob',
      mimeType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
    });
  }

  async function downloadDocx() {
    try {
      const blob = await buildDocxBlobFromTemplate();
      const a = document.createElement('a');
      a.href = URL.createObjectURL(blob);
      a.download = `Informe_Turno_Fiscal_${state.numero_informe || 'Borrador'}_${state.anio}.docx`;
      a.click();
      URL.revokeObjectURL(a.href);
      showToast('Documento Word (.docx) descargado con el formato oficial.');
    } catch (err) {
      showToast('Error al generar el Word: ' + err.message, true);
    }
  }

  // ================= EVENTOS =================
  document.addEventListener('DOMContentLoaded', async () => {
    const togglePwd = $('#btnTogglePwd');
    if (togglePwd) {
      togglePwd.addEventListener('click', () => {
        const pwd = $('#loginPassword');
        pwd.type = pwd.type === 'password' ? 'text' : 'password';
      });
    }

    async function loadProfileAndEnter(user) {
      const { data: profile, error } = await sb
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();
      if (error || !profile) {
        throw new Error('Perfil de despacho no configurado en Supabase.');
      }
      await enterWorkspace(profile);
    }

    if (sb) {
      try {
        const { data: { session } } = await sb.auth.getSession();
        if (session?.user) {
          await loadProfileAndEnter(session.user);
        }
      } catch (_) {}
    }

    $('#loginForm').addEventListener('submit', async (e) => {
      e.preventDefault();
      const rawUser = $('#loginUser').value.trim().toLowerCase();
      const pass = $('#loginPassword').value;
      const errEl = $('#loginError');

      if (!sb) {
        errEl.textContent = 'No se pudo inicializar el cliente de Supabase.';
        errEl.classList.remove('hidden');
        return;
      }

      const email = rawUser.includes('@') ? rawUser : `${rawUser}@${EMAIL_DOMAIN}`;
      const btn = $('#loginForm button[type="submit"]');
      btn.disabled = true;
      btn.textContent = 'Verificando...';

      try {
        const { data, error } = await sb.auth.signInWithPassword({ email, password: pass });
        if (error || !data?.user) {
          throw new Error('Usuario o contraseña incorrectos.');
        }
        errEl.classList.add('hidden');
        await loadProfileAndEnter(data.user);
      } catch (err) {
        errEl.textContent = err.message || 'Usuario o contraseña incorrectos.';
        errEl.classList.remove('hidden');
      } finally {
        btn.disabled = false;
        btn.textContent = 'Iniciar sesión';
      }
    });

    $('#btnSendToCoord').addEventListener('click', async () => {
      const missing = validateCriticalFields();
      saveDraft();
      try {
        await syncCloudRecord('enviado');
        if (missing.length) {
          showToast(`Enviado a Coordinación (aviso: faltó completar ${missing.join(', ')}).`);
        } else {
          showToast('Informe enviado a Coordinación de Flagrancia Delictiva de Lima Centro.');
        }
      } catch (err) {
        showToast('Error al enviar a Coordinación: ' + err.message, true);
      }
    });

    const searchInp = $('#adminSearchInput');
    if (searchInp) {
      searchInp.addEventListener('input', renderAdminDashboard);
    }

    $('#btnAdminExportCsv').addEventListener('click', () => {
      const subs = adminInformesCache || [];
      if (!subs.length) {
        showToast('No hay informes remitidos para exportar.', true);
        return;
      }
      const esc = (v) => `"${String(v ?? '').replace(/"/g, '""')}"`;
      const headers = ['Fecha Envío','Fiscalía','Informe N°','Inicio Turno','Fin Turno','Fiscal Responsable','Total Casos','Con Detenido','Sin Detenido','Total Detenidos','Delitos Mayor Incidencia'];
      const rows = subs.map((s) => {
        const st = s.state_json || {};
        return [
          new Date(s.submitted_at || s.updated_at).toLocaleString('es-PE'),
          s.despacho,
          `N° ${st.numero_informe || 'S/N'}-${st.anio || ''}`,
          `${st.fecha_inicio || ''} ${st.hora_inicio || ''}`,
          `${st.fecha_fin || ''} ${st.hora_fin || ''}`,
          st.fiscal_responsable_nombre || '',
          st.total_casos || '0',
          st.casos_con_detenido || '0',
          st.casos_sin_detenido || '0',
          st.total_detenidos || '0',
          st.delitos_mayor_incidencia || ''
        ].map(esc).join(',');
      });
      const csv = '﻿' + [headers.map(esc).join(','), ...rows].join('\r\n');
      const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
      const a = document.createElement('a');
      a.href = URL.createObjectURL(blob);
      a.download = `Consolidado_Turnos_Flagrancia_${new Date().toISOString().slice(0,10)}.csv`;
      a.click();
      URL.revokeObjectURL(a.href);
      showToast('Consolidado CSV exportado para Excel.');
    });

    $('#btnAdminOpenEditor').addEventListener('click', () => {
      showEditorWorkspace();
      syncInputsFromState();
    });

    $('#btnAdminImportJson').addEventListener('click', () => $('#jsonFileInput').click());

    document.addEventListener('click', async (e) => {
      const openFisc = e.target.closest('[data-admin-open-fiscalia]');
      if (openFisc) {
        const fId = openFisc.getAttribute('data-admin-open-fiscalia');
        const prof = adminFiscaliasCache.find((a) => a.id === fId);
        if (!prof) return;
        const { data: rows } = await sb
          .from('informes_turno')
          .select('*')
          .eq('user_id', fId)
          .order('updated_at', { ascending: false })
          .limit(1);
        if (rows && rows.length && rows[0].state_json) {
          state = { ...getDefaultState(), ...rows[0].state_json };
        } else {
          state = getDefaultState();
          state.nombre_despacho_emisor = prof.despacho;
          state.nombre_despacho_turno = prof.despacho;
          state.siglas_despacho = prof.siglas;
        }
        showEditorWorkspace();
        syncInputsFromState();
      }

      const viewSub = e.target.closest('[data-admin-view-sub]');
      if (viewSub) {
        const idx = Number(viewSub.getAttribute('data-admin-view-sub'));
        const rec = adminInformesCache[idx];
        if (rec && rec.state_json) {
          state = { ...getDefaultState(), ...rec.state_json };
          showEditorWorkspace();
          syncInputsFromState();
        }
      }

      const docxSub = e.target.closest('[data-admin-docx-sub]');
      if (docxSub) {
        const idx = Number(docxSub.getAttribute('data-admin-docx-sub'));
        const rec = adminInformesCache[idx];
        if (rec && rec.state_json) {
          const prevState = state;
          state = { ...getDefaultState(), ...rec.state_json };
          downloadDocx().finally(() => { state = prevState; });
        }
      }

      const delSub = e.target.closest('[data-admin-del-sub]');
      if (delSub) {
        const idx = Number(delSub.getAttribute('data-admin-del-sub'));
        const rec = adminInformesCache[idx];
        if (rec && confirm('¿Eliminar este informe remitido de la base de datos?')) {
          await sb.from('informes_turno').delete().eq('id', rec.id);
          renderAdminDashboard();
          showToast('Informe eliminado.');
        }
      }
    });

    // Navegación de pasos
    $$('.step-btn').forEach((btn) => {
      btn.addEventListener('click', () => goToStep(Number(btn.dataset.step)));
    });
    $('#btnPrevStep').addEventListener('click', () => goToStep(currentStep - 1));
    $('#btnNextStep').addEventListener('click', () => goToStep(currentStep + 1));

    // Bindings de campos simples
    document.addEventListener('input', (e) => {
      const t = e.target;
      if (t.hasAttribute('data-bind')) {
        const key = t.getAttribute('data-bind');
        const prevFiscal = state.fiscal_responsable_nombre;
        state[key] = t.value;
        if (key === 'fiscal_responsable_nombre' && (!state.remitente_nombre || state.remitente_nombre === prevFiscal)) {
          state.remitente_nombre = t.value;
          const remInp = $('[data-bind="remitente_nombre"]');
          if (remInp) remInp.value = t.value;
        }
        saveDraft();
        renderPreview();
        updateProgress();
      } else if (t.hasAttribute('data-arr')) {
        const arr = t.getAttribute('data-arr');
        const idx = Number(t.getAttribute('data-idx'));
        const col = t.getAttribute('data-col');
        state[arr][idx][col] = t.value;
        saveDraft();
        renderPreview();
      } else if (t.hasAttribute('data-list')) {
        const arr = t.getAttribute('data-list');
        const idx = Number(t.getAttribute('data-idx'));
        state[arr][idx] = t.value;
        saveDraft();
        renderPreview();
        updateProgress();
      }
    });

    document.addEventListener('change', (e) => {
      const t = e.target;
      if (t.hasAttribute('data-bind-check')) {
        state[t.getAttribute('data-bind-check')] = t.checked;
        saveDraft();
        renderPreview();
      }
    });

    // Botones agregar/eliminar filas
    document.addEventListener('click', (e) => {
      const addBtn = e.target.closest('[data-add-row]');
      if (addBtn) {
        const key = addBtn.getAttribute('data-add-row');
        const templates = {
          personalApoyo: { nombre: '', cargo: '', origen: '', horario: '', observacion: '' },
          casosIngresados: { n_caso: '', detenidos: '', agraviado: '', delito: '', diligencias: '', resultado: '' },
          casosAnteriores: { carpeta: '', origen: '', detenidos: '', estado_recibe: '', actuacion: '' },
          audiencias: { carpeta: '', exp_juzgado: '', tipo_audiencia: '', resultado: '', observacion: '' },
          levantamientos: { caso: '', diligencia: '', lugar: '', fecha_hora: '', observacion: '' },
          casosDerivados: { carpeta: '', destino: '', motivo: '', pendiente: '', limite: '' }
        };
        state[key].push({ ...templates[key] });
        saveDraft();
        renderDynamicTables();
        renderPreview();
      }

      const delBtn = e.target.closest('[data-del-arr]');
      if (delBtn) {
        const key = delBtn.getAttribute('data-del-arr');
        const idx = Number(delBtn.getAttribute('data-idx'));
        state[key].splice(idx, 1);
        saveDraft();
        renderDynamicTables();
        renderPreview();
      }

      const delListBtn = e.target.closest('[data-del-list]');
      if (delListBtn) {
        const key = delListBtn.getAttribute('data-del-list');
        const idx = Number(delListBtn.getAttribute('data-idx'));
        state[key].splice(idx, 1);
        saveDraft();
        renderConclusionsAndRecs();
        renderPreview();
      }
    });

    $('#btnImportCasosCsv').addEventListener('click', () => $('#csvCasosInput').click());
    $('#csvCasosInput').addEventListener('change', (e) => {
      const file = e.target.files[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = () => {
        try {
          const lines = String(reader.result || '').split(/\r?\n/).map((l) => l.trim()).filter(Boolean);
          if (!lines.length) throw new Error('Archivo vacío');
          const delim = lines[0].includes(';') ? ';' : ',';
          const parseLine = (line) => {
            const out = [];
            let cur = '';
            let inQ = false;
            for (let i = 0; i < line.length; i++) {
              const ch = line[i];
              if (ch === '"') { inQ = !inQ; }
              else if (ch === delim && !inQ) { out.push(cur.trim()); cur = ''; }
              else { cur += ch; }
            }
            out.push(cur.trim());
            return out;
          };
          const rows = lines.map(parseLine);
          const first = (rows[0][0] || '').toLowerCase();
          const startIdx = first.includes('carpeta') || first.includes('caso') || first.includes('n°') ? 1 : 0;
          const imported = rows.slice(startIdx).map((cols) => ({
            n_caso: cols[0] || '',
            detenidos: cols[1] || '',
            agraviado: cols[2] || '',
            delito: cols[3] || '',
            diligencias: cols[4] || '',
            resultado: cols[5] || ''
          })).filter((r) => r.n_caso || r.delito || r.detenidos);
          if (!imported.length) throw new Error('Sin filas válidas');
          if (state.casosIngresados.length === 1 && !state.casosIngresados[0].n_caso && !state.casosIngresados[0].delito) {
            state.casosIngresados = imported;
          } else {
            state.casosIngresados = state.casosIngresados.concat(imported);
          }
          saveDraft();
          renderDynamicTables();
          renderPreview();
          showToast(`Se importaron ${imported.length} caso(s) en la Sección 4.1.`);
        } catch (err) {
          showToast('No se pudo importar el CSV: ' + err.message, true);
        }
      };
      reader.readAsText(file, 'UTF-8');
      e.target.value = '';
    });

    $('#btnAddConclusion').addEventListener('click', () => {
      state.conclusiones.push('');
      saveDraft();
      renderConclusionsAndRecs();
      renderPreview();
    });

    $('#btnAddRecomendacion').addEventListener('click', () => {
      state.recomendaciones.push('');
      saveDraft();
      renderConclusionsAndRecs();
      renderPreview();
    });

    $('#btnRestoreAntecedentes').addEventListener('click', () => {
      Object.assign(state, OFFICIAL_ANTECEDENTES);
      saveDraft();
      syncInputsFromState();
    });

    $('#btnSinIncidencias').addEventListener('click', () => {
      ['inc_personal','inc_flagrancia_turno','inc_interinstitucional','inc_comunicaciones_carpetas','inc_logistica','inc_otras']
        .forEach((k) => { if (!String(state[k] || '').trim()) state[k] = 'Sin incidencias'; });
      saveDraft();
      syncInputsFromState();
    });

    $('#btnAutoStats').addEventListener('click', () => {
      const casos = state.casosIngresados || [];
      let conDet = 0;
      let sinDet = 0;
      casos.forEach((c) => {
        const d = String(c.detenidos || '').trim().toLowerCase();
        if (!d || d === 'sin detenido' || d === 'ninguno' || d === '0' || d === '-') sinDet++;
        else conDet++;
      });
      state.total_casos = String(casos.length);
      state.casos_con_detenido = String(conDet);
      state.casos_sin_detenido = String(sinDet);
      state.levantamientos_cadaver = String((state.levantamientos || []).length);
      state.casos_turnos_anteriores = String((state.casosAnteriores || []).length);
      saveDraft();
      syncInputsFromState();
    });

    $('#btnTogglePreview').addEventListener('click', () => {
      previewVisible = !previewVisible;
      $('#workspace').classList.toggle('preview-open', previewVisible);
      $('#previewPanel').classList.toggle('hidden', !previewVisible);
      $('#btnTogglePreview').textContent = previewVisible ? 'Ocultar Vista Previa' : 'Mostrar Vista Previa';
    });

    $('#btnFillExample').addEventListener('click', () => {
      state = getExampleState();
      if (currentAccount && currentAccount.role === 'fiscalia') {
        state.nombre_despacho_emisor = currentAccount.despacho;
        state.nombre_despacho_turno = currentAccount.despacho;
        state.siglas_despacho = currentAccount.siglas;
      }
      saveDraft();
      syncInputsFromState();
      showToast('Datos de ejemplo cargados.');
    });

    document.addEventListener('keydown', (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 's') {
        e.preventDefault();
        if (!$('#appShell').classList.contains('hidden')) {
          saveDraft();
          showToast('Borrador guardado localmente.');
        }
      }
    });

    $('#btnResetForm').addEventListener('click', () => {
      if (confirm('¿Desea limpiar todos los campos y comenzar un nuevo informe?')) {
        state = getDefaultState();
        if (currentAccount && currentAccount.role === 'fiscalia') {
          state.nombre_despacho_emisor = currentAccount.despacho;
          state.nombre_despacho_turno = currentAccount.despacho;
          state.siglas_despacho = currentAccount.siglas;
        }
        saveDraft();
        syncInputsFromState();
        showToast('Formulario limpiado.');
      }
    });

    $('#btnExportJson').addEventListener('click', () => {
      const blob = new Blob([JSON.stringify(state, null, 2)], { type: 'application/json' });
      const a = document.createElement('a');
      a.href = URL.createObjectURL(blob);
      a.download = `Informe_Turno_${state.numero_informe || 'respaldo'}.json`;
      a.click();
      URL.revokeObjectURL(a.href);
    });

    $('#btnImportJson').addEventListener('click', () => $('#jsonFileInput').click());
    $('#jsonFileInput').addEventListener('change', (e) => {
      const file = e.target.files[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = async () => {
        try {
          const imported = { ...getDefaultState(), ...JSON.parse(reader.result) };
          if (currentAccount.role === 'admin' && !$('#adminPanel').classList.contains('hidden')) {
            await sb.from('informes_turno').insert({
              user_id: currentAccount.id,
              username: 'importado',
              despacho: imported.nombre_despacho_emisor || 'Despacho importado',
              numero_informe: imported.numero_informe || '',
              anio: imported.anio || '',
              fecha_inicio: imported.fecha_inicio || '',
              fecha_fin: imported.fecha_fin || '',
              total_casos: Number(imported.total_casos || 0) || 0,
              total_detenidos: Number(imported.total_detenidos || 0) || 0,
              status: 'enviado',
              state_json: imported,
              submitted_at: new Date().toISOString()
            });
            renderAdminDashboard();
            showToast('Informe importado al panel de Coordinación.');
          } else {
            state = imported;
            saveDraft();
            syncInputsFromState();
            showToast('Borrador JSON importado.');
          }
        } catch {
          alert('El archivo JSON no es válido.');
        }
      };
      reader.readAsText(file);
      e.target.value = '';
    });

    $('#btnPrintPdf').addEventListener('click', () => {
      if (!previewVisible) {
        previewVisible = true;
        $('#workspace').classList.add('preview-open');
        $('#previewPanel').classList.remove('hidden');
      }
      window.print();
    });

    $('#btnDownloadDocx').addEventListener('click', downloadDocx);

    $('#btnBackToAdmin').addEventListener('click', () => {
      showAdminPanel();
    });

    $('#btnBackToLogin').addEventListener('click', async () => {
      if (sb) await sb.auth.signOut();
      currentAccount = null;
      currentDraftId = null;
      $('#loginPassword').value = '';
      $('#appShell').classList.add('hidden');
      $('#loginScreen').classList.remove('hidden');
    });

    goToStep(0);
  });
})();
