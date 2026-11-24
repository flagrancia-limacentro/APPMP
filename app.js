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

  const DELITOS_FLAGRANCIA = [
    // Contra la Seguridad Pública (Peligro Común, Armas, Drogas)
    'Conducción en estado de ebriedad o drogadicción (Art. 274 CP)',
    'Tenencia o porte ilegal de armas de fuego, municiones o explosivos (Art. 279-G CP)',
    'Microcomercialización o posesión de drogas (Art. 298 CP)',
    'Promoción o favorecimiento al tráfico ilícito de drogas (Art. 296 CP)',
    'Peligro por medio de incendio o explosión (Art. 273 CP)',
    'Fabricación, suministro o tenencia de materiales peligrosos (Art. 279 CP)',
    // Contra el Patrimonio
    'Hurto simple (Art. 185 CP)',
    'Hurto agravado (Art. 186 CP)',
    'Hurto de uso (Art. 187 CP)',
    'Robo (Art. 188 CP)',
    'Robo agravado (Art. 189 CP)',
    'Receptación (Art. 194 CP)',
    'Receptación agravada (Art. 195 CP)',
    'Apropiación ilícita común (Art. 190 CP)',
    'Estafa y otras defraudaciones (Art. 196 / 196-A CP)',
    'Extorsión (Art. 200 CP)',
    'Chantaje (Art. 201 CP)',
    'Usurpación / Usurpación agravada (Art. 202 / 204 CP)',
    'Daños simples y agravados (Art. 205 / 206 CP)',
    'Fraude informático / Suplantación de identidad (Ley 30096)',
    // Contra la Vida, el Cuerpo y la Salud / Violencia Familiar
    'Agresiones en contra de las mujeres o integrantes del grupo familiar (Art. 122-B CP)',
    'Lesiones leves (Art. 122 CP)',
    'Lesiones graves (Art. 121 CP)',
    'Lesiones por violencia contra las mujeres e integrantes del grupo familiar (Art. 121-B CP)',
    'Lesiones culposas en accidente de tránsito (Art. 124 CP)',
    'Homicidio culposo en accidente de tránsito (Art. 111 CP)',
    'Homicidio simple / calificado (Art. 106 / 108 CP)',
    'Feminicidio / Tentativa de feminicidio (Art. 108-B CP)',
    'Omisión de socorro y exposición al peligro (Art. 126 CP)',
    // Contra la Libertad / Indemnidad Sexual
    'Coacción (Art. 151 CP)',
    'Secuestro (Art. 152 CP)',
    'Acoso / Acoso sexual (Art. 151-A / 176-B CP)',
    'Chantaje sexual (Art. 176-C CP)',
    'Violación sexual (Art. 170 CP)',
    'Tocamientos, actos de connotación sexual o actos libidinosos (Art. 176 / 176-A CP)',
    'Violación de domicilio (Art. 159 CP)',
    'Trata de personas (Art. 129-A CP)',
    // Contra la Familia
    'Omisión a la asistencia familiar (Art. 149 CP)',
    'Sustracción de menor (Art. 147 CP)',
    // Contra la Administración Pública y Fe Pública
    'Violencia y resistencia a la autoridad (Art. 365 / 366 / 367 CP)',
    'Desobediencia o resistencia a la autoridad / Medidas de protección (Art. 368 CP)',
    'Fuga del lugar del accidente de tránsito (Art. 408 CP)',
    'Cohecho activo en el ámbito de la función policial (Art. 398-A CP)',
    'Cohecho activo genérico (Art. 397 CP)',
    'Usurpación de autoridad, títulos u honores (Art. 361 CP)',
    'Falsificación de documentos en general (Art. 427 CP)',
    'Falsedad ideológica (Art. 428 CP)',
    'Falsedad genérica (Art. 438 CP)',
    'Falsificación de moneda / billetes (Art. 252 CP)',
    // Contra la Tranquilidad Pública
    'Disturbios (Art. 315 CP)',
    'Marcaje o reglaje (Art. 317-A CP)',
    'Banda criminal (Art. 317-B CP)',
    'Otro'
  ];

  const MEDIDAS_COERCITIVAS = [
    'Ninguna',
    'Personal: Detención policial en flagrancia (Art. 259 CPP)',
    'Personal: Detención preliminar judicial (Art. 261 CPP)',
    'Personal: Convalidación de detención preliminar (Art. 266 CPP)',
    'Personal: Prisión preventiva (Art. 268 CPP)',
    'Personal: Prolongación de prisión preventiva (Art. 274 CPP)',
    'Personal: Comparecencia con restricciones (Art. 287 CPP)',
    'Personal: Comparecencia simple (Art. 286 CPP)',
    'Personal: Detención domiciliaria (Art. 290 CPP)',
    'Personal: Impedimento de salida del país (Art. 295 CPP)',
    'Personal: Suspensión preventiva de derechos (Art. 297 CPP)',
    'Personal: Internación preventiva (Art. 293 CPP)',
    'Personal: Vigilancia electrónica personal',
    'Real: Incautación (Art. 316 CPP)',
    'Real: Confirmatoria de incautación (Art. 316.2 CPP)',
    'Real: Embargo (Art. 302 CPP)',
    'Real: Orden de inhibición (Art. 310 CPP)',
    'Real: Desalojo preventivo y ministración provisional (Art. 311 CPP)',
    'Real: Secuestro conservativo',
    'Real: Pensión anticipada de alimentos (Art. 314 CPP)',
    'Otro'
  ];

  const RESULTADOS_CASO = [
    'Principio de oportunidad',
    'Acuerdo reparatorio',
    'Incoación de proceso inmediato',
    'Terminación anticipada',
    'Acusación directa',
    'Formalización de la investigación preparatoria',
    'Ampliación de investigación preliminar o de diligencias',
    'Archivo',
    'Derivación a otro despacho',
    'Otro'
  ];

  const TIPOS_AUDIENCIA = [
    'Audiencia Única de Incoación de Proceso Inmediato (Art. 447 CPP)',
    'Audiencia Única de Juicio Inmediato (Art. 448 CPP)',
    'Terminación anticipada (Art. 468 CPP)',
    'Prisión preventiva (Art. 271 CPP)',
    'Prolongación / cesación / revocatoria de prisión preventiva',
    'Detención preliminar / Convalidación de detención',
    'Comparecencia con restricciones / Impedimento de salida',
    'Control de identidad / Control de plazo',
    'Tutela de derechos (Art. 71.4 CPP)',
    'Confirmatoria / reexamen de incautación',
    'Principio de oportunidad / Acuerdo reparatorio',
    'Control de acusación / Etapa intermedia',
    'Juicio oral / Lectura de sentencia',
    'Otro'
  ];

  const RESULTADOS_AUDIENCIA = [
    'Fundado',
    'Fundado en parte',
    'Infundado',
    'Procedente',
    'Improcedente',
    'Inadmisible',
    'Aprobado (Acuerdo / Terminación anticipada)',
    'Desaprobado',
    'Sentencia condenatoria',
    'Sentencia absolutoria',
    'Reprogramado / Suspendido',
    'Otro'
  ];

  function newCasoRow(over = {}) {
    return {
      n_caso: '',
      detenidos: '0',
      agraviado: '1',
      // Lista libre de medidas coercitivas del caso (independiente de los
      // delitos: se pueden agregar tantas como se necesiten).
      medidas: [newMedidaRow('Ninguna')],
      // Cada caso puede contener varios delitos, cada uno con su propio
      // resultado (incoado, derivado, archivado, ampliado, etc.).
      delitos: [newDelitoRow()],
      ...over
    };
  }

  function newMedidaRow(val = '', otro = '') {
    return { valor: val, otro: otro || '' };
  }

  function newDelitoRow(over = {}) {
    return { nombre: '', otro: '', resultado: '', resultado_otro: '', ...over };
  }

  // Convierte borradores de versiones anteriores al modelo actual: delito y
  // resultado en lista por caso, y medidas en lista libre por caso.
  function normalizeCaseRow(row) {
    const base = newCasoRow();
    const merged = { ...base, ...(row || {}) };

    // --- Delitos y resultado ---
    let delitos = row && Array.isArray(row.delitos) ? row.delitos : null;
    if (!delitos || delitos.length === 0) {
      // Modelo original: un solo delito/resultado por caso.
      delitos = [newDelitoRow({
        nombre: String(row?.delito || '').trim(),
        otro: String(row?.delito_otro || '').trim(),
        resultado: String(row?.resultado || '').trim(),
        resultado_otro: String(row?.resultado_otro || '').trim()
      })];
    }
    merged.delitos = delitos.map((d) => newDelitoRow({
      nombre: d?.nombre || '',
      otro: d?.otro || '',
      resultado: d?.resultado || '',
      resultado_otro: d?.resultado_otro || ''
    }));

    // --- Medidas coercitivas (lista libre del caso) ---
    let medidas = null;
    if (row && Array.isArray(row.medidas)) {
      medidas = row.medidas.map((m) => newMedidaRow(
        String(m?.valor || '').trim() || 'Ninguna',
        String(m?.otro || '').trim()
      ));
    } else {
      medidas = [];
      // Versión anterior: una medida por delito.
      (row && Array.isArray(row.delitos) ? row.delitos : []).forEach((d) => {
        const v = String(d?.medidas || '').trim();
        const o = String(d?.medidas_otro || '').trim();
        if ((v && v !== 'Ninguna') || o) {
          if (!medidas.some((m) => m.valor === v && m.otro === o)) medidas.push(newMedidaRow(v || 'Otro', o));
        }
      });
      // Modelo original: una medida por caso.
      const medCaso = String(row?.medidas || '').trim();
      const medOtroCaso = String(row?.medidas_otro || '').trim();
      if (!medidas.length && (medCaso || medOtroCaso)) {
        medidas.push(newMedidaRow(medCaso || 'Ninguna', medOtroCaso));
      }
      if (!medidas.length) medidas.push(newMedidaRow('Ninguna'));
    }
    if (!medidas.length) medidas.push(newMedidaRow('Ninguna'));
    merged.medidas = medidas;

    delete merged.delito;
    delete merged.delito_otro;
    delete merged.medidas_otro;
    delete merged.resultado;
    delete merged.resultado_otro;
    return merged;
  }

  function normalizeState(incoming) {
    const merged = { ...getDefaultState(), ...(incoming || {}) };
    merged.casosIngresados = Array.isArray(merged.casosIngresados) && merged.casosIngresados.length
      ? merged.casosIngresados.map(normalizeCaseRow)
      : [newCasoRow()];
    return merged;
  }

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
      destinataria_nombre: 'SONIA ALBINA CHÁVEZ GIL',
      destinataria_cargo: 'Presidenta de la Junta de Fiscales Superiores del Distrito Fiscal de Lima Centro',
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
      res_ampliacion: '0',
      res_archivo: '0',
      res_derivacion: '0',
      res_otros_detalle: '',
      res_otros: '0',

      med_prision_preventiva: '0',
      med_detencion_preliminar: '0',
      med_comparecencia_restricciones: '0',
      med_comparecencia_simple: '0',
      med_impedimento_salida: '0',
      med_incautacion: '0',
      med_embargo: '0',
      med_otras: '0',
      delitos_mayor_incidencia: '',

      inc_personal: 'Sin incidencias',
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
      copias_a: 'Coordinación Distrital de las Fiscalías Especializadas en Flagrancia Delictiva de Lima Centro / Archivo',

      personalApoyo: [{ nombre: '', cargo: '', origen: '', horario: '', observacion: '' }],
      casosIngresados: [newCasoRow()],
      audiencias: [{ carpeta: '', exp_juzgado: '', tipo_audiencia: '', tipo_audiencia_otro: '', resultado: '', resultado_otro: '', observacion: '' }],
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
      detenidos_resueltos: '3',
      detenidos_pendientes: '0',
      res_proceso_inmediato: '1',
      res_principio_oportunidad: '1',
      res_ampliacion: '1',
      med_comparecencia_restricciones: '1',
      med_incautacion: '1',
      delitos_mayor_incidencia: 'Conducción en estado de ebriedad o drogadicción (1), Hurto agravado (1), Apropiación ilícita (1)',
      remitente_nombre: 'Dra. María Elena Torres Mendoza',
      remitente_cargo: 'FISCAL PROVINCIAL',
      iniciales_redactor: 'METM/asrc',
      anexo_audiencias: true,
      personalApoyo: [
        { nombre: 'Dr. Luis Miguel Salazar Cruz', cargo: 'Fiscal Adjunto Provincial', origen: 'Pool de Fiscales PJFS', horario: '14:00 - 22:00', observacion: 'Apoyo en diligencias preliminares y audiencias' }
      ],
      casosIngresados: [
        { n_caso: '506014505-2026-1412-0', detenidos: '1', agraviado: '1',
          medidas: [{ valor: 'Personal: Comparecencia simple (Art. 286 CPP)', otro: '' }],
          delitos: [{ nombre: 'Conducción en estado de ebriedad o drogadicción (Art. 274 CP)', otro: '', resultado: 'Principio de oportunidad', resultado_otro: '' }] },
        { n_caso: '506014505-2026-1413-0', detenidos: '2', agraviado: '1',
          medidas: [
            { valor: 'Personal: Comparecencia con restricciones (Art. 287 CPP)', otro: '' },
            { valor: 'Real: Incautación (Art. 316 CPP)', otro: '' }
          ],
          delitos: [
            { nombre: 'Hurto agravado (Art. 186 CP)', otro: '', resultado: 'Incoación de proceso inmediato', resultado_otro: '' },
            { nombre: 'Tenencia o porte ilegal de armas de fuego, municiones o explosivos (Art. 279-G CP)', otro: '', resultado: 'Derivación a otro despacho', resultado_otro: '' }
          ] },
        { n_caso: '506014505-2026-1414-0', detenidos: '0', agraviado: '1',
          medidas: [{ valor: 'Real: Incautación (Art. 316 CPP)', otro: '' }],
          delitos: [{ nombre: 'Apropiación ilícita común (Art. 190 CP)', otro: '', resultado: 'Ampliación de investigación preliminar o de diligencias', resultado_otro: '' }] }
      ],
      audiencias: [
        { carpeta: '506014505-2026-1413-0', exp_juzgado: 'Exp. 04122-2026 — 2° Juzgado de Flagrancia', tipo_audiencia: 'Audiencia Única de Incoación de Proceso Inmediato (Art. 447 CPP)', tipo_audiencia_otro: '', resultado: 'Fundado', resultado_otro: '', observacion: 'Se dictó comparecencia con restricciones y se remitió a juicio inmediato.' }
      ],
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

  function getDisplayVal(row, key) {
    const v = String(row?.[key] || '').trim();
    if (v === 'Otro') {
      const custom = String(row?.[key + '_otro'] || '').trim();
      return custom ? `Otro: ${custom}` : 'Otro';
    }
    return v;
  }

  // Devuelve los delitos de un caso, saneados (siempre al menos uno).
  function getDelitosRows(caso) {
    const list = Array.isArray(caso?.delitos) ? caso.delitos : [];
    if (!list.length) return [newDelitoRow()];
    return list.map((d) => ({
      nombre: String(d?.nombre || ''),
      otro: String(d?.otro || ''),
      resultado: String(d?.resultado || ''),
      resultado_otro: String(d?.resultado_otro || '')
    }));
  }

  // Devuelve las medidas coercitivas del caso (lista libre, siempre una).
  function getMedidasRows(caso) {
    const list = Array.isArray(caso?.medidas) ? caso.medidas : [];
    if (!list.length) return [newMedidaRow('Ninguna')];
    return list.map((m) => ({
      valor: String(m?.valor || ''),
      otro: String(m?.otro || '')
    }));
  }

  function getDelitoDisplay(d) {
    const nombre = String(d?.nombre || '').trim();
    if (nombre === 'Otro') {
      const custom = String(d?.otro || '').trim();
      return custom ? `Otro: ${custom}` : 'Otro';
    }
    return nombre;
  }

  function getResultadoDisplay(d) {
    const res = String(d?.resultado || '').trim();
    if (res === 'Otro') {
      const custom = String(d?.resultado_otro || '').trim();
      return custom ? `Otro: ${custom}` : 'Otro';
    }
    return res;
  }

  function getMedidaDisplay(m) {
    const med = String(m?.valor || '').trim();
    if (med === 'Otro') {
      const custom = String(m?.otro || '').trim();
      return custom ? `Otro: ${custom}` : 'Otro';
    }
    return med;
  }

  const letrasDelito = (i) => String.fromCharCode(97 + (i % 26));

  // Texto para las celdas Delito / Resultado: "a) ... <br> b) ..."
  function buildDelitosCellHtml(caso) {
    const items = getDelitosRows(caso);
    const lines = items.map((d, i) => {
      const label = items.length > 1 ? `<strong>${letrasDelito(i)})</strong> ` : '';
      const txt = getDelitoDisplay(d);
      return txt ? `${label}${escapeHtml(txt)}` : '';
    }).filter(Boolean);
    return lines.join('<br/>');
  }

  function buildResultadosCellHtml(caso) {
    const items = getDelitosRows(caso);
    const lines = items.map((d, i) => {
      const label = items.length > 1 ? `<strong>${letrasDelito(i)})</strong> ` : '';
      const txt = getResultadoDisplay(d);
      return txt ? `${label}${escapeHtml(txt)}` : '';
    }).filter(Boolean);
    return lines.join('<br/>');
  }

  // Equivalentes en texto plano, para el Word (.docx).
  function buildDelitosCellText(caso) {
    const items = getDelitosRows(caso);
    return items
      .map((d, i) => {
        const txt = getDelitoDisplay(d);
        if (!txt) return '';
        return items.length > 1 ? `${letrasDelito(i)}) ${txt}` : txt;
      })
      .filter(Boolean)
      .join('\n');
  }

  function buildResultadosCellText(caso) {
    const items = getDelitosRows(caso);
    return items
      .map((d, i) => {
        const txt = getResultadoDisplay(d);
        if (!txt) return '';
        return items.length > 1 ? `${letrasDelito(i)}) ${txt}` : txt;
      })
      .filter(Boolean)
      .join('\n');
  }

  function buildMedidasCellHtml(caso) {
    // Lista libre de medidas del caso: sin letras, cada una en su línea.
    const lines = getMedidasRows(caso)
      .map((m) => {
        const txt = getMedidaDisplay(m);
        return txt && txt !== 'Ninguna' ? escapeHtml(txt) : '';
      })
      .filter(Boolean);
    return lines.length ? lines.join('<br/>') : 'Ninguna';
  }

  function buildMedidasCellText(caso) {
    const lines = getMedidasRows(caso)
      .map((m) => {
        const txt = getMedidaDisplay(m);
        return txt && txt !== 'Ninguna' ? txt : '';
      })
      .filter(Boolean);
    return lines.length ? lines.join('\n') : 'Ninguna';
  }

  function recalculateStatsFromCases(syncDom = true) {
    const casos = state.casosIngresados || [];
    let conDet = 0;
    let sinDet = 0;
    let totalDet = 0;

    const resMap = {
      'Principio de oportunidad': 'res_principio_oportunidad',
      'Acuerdo reparatorio': 'res_acuerdo_reparatorio',
      'Incoación de proceso inmediato': 'res_proceso_inmediato',
      'Terminación anticipada': 'res_terminacion_anticipada',
      'Acusación directa': 'res_acusacion',
      'Formalización de la investigación preparatoria': 'res_formalizacion',
      'Ampliación de investigación preliminar o de diligencias': 'res_ampliacion',
      'Archivo': 'res_archivo',
      'Derivación a otro despacho': 'res_derivacion'
    };

    const resCounts = {};
    Object.values(resMap).forEach((k) => { resCounts[k] = 0; });
    let resOtros = 0;
    const resOtrosDetalles = [];

    const medCounts = {
      med_prision_preventiva: 0,
      med_detencion_preliminar: 0,
      med_comparecencia_restricciones: 0,
      med_comparecencia_simple: 0,
      med_impedimento_salida: 0,
      med_incautacion: 0,
      med_embargo: 0,
      med_otras: 0
    };

    const delitoFreq = {};

    casos.forEach((c) => {
      const detN = Math.max(0, parseInt(c.detenidos, 10) || 0);
      totalDet += detN;
      if (detN > 0) conDet++;
      else sinDet++;

      // Los resultados y los delitos se cuentan por delito: un mismo caso
      // puede tener un delito incoado y otro derivado o archivado.
      getDelitosRows(c).forEach((d) => {
        const res = String(d.resultado || '').trim();
        if (res && resMap[res]) {
          resCounts[resMap[res]]++;
        } else if (res === 'Otro') {
          resOtros++;
          const detalle = String(d.resultado_otro || '').trim();
          if (detalle) resOtrosDetalles.push(detalle);
        }

        const delName = getDelitoDisplay(d);
        if (delName) delitoFreq[delName] = (delitoFreq[delName] || 0) + 1;
      });

      // Las medidas son una lista libre por caso y se cuentan una a una.
      getMedidasRows(c).forEach((m) => {
        const med = String(m.valor || '').trim();
        const medTxt = getMedidaDisplay(m);
        if (medTxt === 'Ninguna') return;
        if (med.includes('Prisión preventiva')) medCounts.med_prision_preventiva++;
        else if (med.includes('Detención preliminar')) medCounts.med_detencion_preliminar++;
        else if (med.includes('Comparecencia con restricciones')) medCounts.med_comparecencia_restricciones++;
        else if (med.includes('Comparecencia simple')) medCounts.med_comparecencia_simple++;
        else if (med.includes('Impedimento de salida')) medCounts.med_impedimento_salida++;
        else if (med.includes('Incautación')) medCounts.med_incautacion++;
        else if (med.includes('Embargo')) medCounts.med_embargo++;
        else if (med) medCounts.med_otras++;
      });
    });

    state.total_casos = String(casos.length);
    state.casos_con_detenido = String(conDet);
    state.casos_sin_detenido = String(sinDet);
    state.total_detenidos = String(totalDet);

    Object.entries(resCounts).forEach(([k, v]) => { state[k] = String(v); });
    state.res_otros = String(resOtros);
    if (resOtrosDetalles.length) state.res_otros_detalle = resOtrosDetalles.join(', ');

    Object.entries(medCounts).forEach(([k, v]) => { state[k] = String(v); });

    const topDelitos = Object.entries(delitoFreq)
      .sort((a, b) => b[1] - a[1])
      .map(([d, n]) => `${d} (${n})`)
      .join(', ');
    if (topDelitos) state.delitos_mayor_incidencia = topDelitos;

    if (syncDom) {
      $$('[data-bind]').forEach((el) => {
        const key = el.getAttribute('data-bind');
        if (key in state) el.value = state[key] ?? '';
      });
    }
  }

  function renderDynamicTables() {
    renderTable('tbodyPersonalApoyo', 'personalApoyo', [
      { key: 'nombre', ph: 'Apellidos y nombres' },
      { key: 'cargo', ph: 'Cargo' },
      { key: 'origen', ph: 'Origen' },
      { key: 'horario', ph: 'Ej. 08:00-16:00' },
      { key: 'observacion', ph: 'Observaciones' }
    ]);
    renderCasosTable();
    renderTable('tbodyAudiencias', 'audiencias', [
      { key: 'carpeta', ph: 'Ej. 20-2026' },
      { key: 'exp_juzgado', ph: 'Exp. y juzgado' },
      { key: 'tipo_audiencia', type: 'select', options: TIPOS_AUDIENCIA, allowOther: true },
      { key: 'resultado', type: 'select', options: RESULTADOS_AUDIENCIA, allowOther: true },
      { key: 'observacion', ph: 'Observación', textarea: true }
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
            const rawVal = row[c.key] ?? '';
            const val = escapeHtml(rawVal);
            if (c.type === 'select') {
              const optsHtml = ['<option value="">-- Seleccione --</option>',
                ...c.options.map((opt) => `<option value="${escapeHtml(opt)}" ${rawVal === opt ? 'selected' : ''}>${escapeHtml(opt)}</option>`)
              ].join('');
              const otherVal = escapeHtml(row[c.key + '_otro'] || '');
              const showOther = c.allowOther && rawVal === 'Otro';
              return `<td>
                <select data-arr="${arrayKey}" data-idx="${idx}" data-col="${c.key}">${optsHtml}</select>
                ${showOther ? `<input type="text" class="dyn-other-input" data-arr="${arrayKey}" data-idx="${idx}" data-col="${c.key}_otro" value="${otherVal}" placeholder="Especifique..." />` : ''}
              </td>`;
            }
            if (c.type === 'number') {
              return `<td><input type="number" min="0" data-arr="${arrayKey}" data-idx="${idx}" data-col="${c.key}" value="${val}" placeholder="${c.ph || '0'}" /></td>`;
            }
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

  function renderCasosTable() {
    const tbody = document.getElementById('tbodyCasosIngresados');
    if (!tbody) return;
    const rows = state.casosIngresados || [];
    if (rows.length === 0) {
      tbody.innerHTML = '<tr><td colspan="8" style="text-align:center;color:#64748b;padding:12px;">Sin registros. Haga clic en "+ Agregar caso" para añadir uno.</td></tr>';
      return;
    }

    // scope: '' (campo del caso), 'di' (subfila de delito) o 'mi'
    // (subfila de la lista de medidas).
    const selectHtml = (arr, ci, sub, col, options, rawVal, otherVal, otherCol, scope = 'di') => {
      const subAttr = sub === null || sub === undefined || sub === ''
        ? ''
        : ` data-${scope}="${sub}"`;
      const opts = ['<option value="">-- Seleccione --</option>',
        ...options.map((opt) => `<option value="${escapeHtml(opt)}" ${rawVal === opt ? 'selected' : ''}>${escapeHtml(opt)}</option>`)
      ].join('');
      const other = rawVal === 'Otro'
        ? `<input type="text" class="dyn-other-input" data-arr="${arr}" data-idx="${ci}"${subAttr} data-col="${otherCol}" value="${escapeHtml(otherVal || '')}" placeholder="Especifique..." />`
        : '';
      return `<select data-arr="${arr}" data-idx="${ci}"${subAttr} data-col="${col}">${opts}</select>${other}`;
    };

    tbody.innerHTML = rows.map((row, ci) => {
      const delitos = getDelitosRows(row);
      const nDel = delitos.length;
      // Delito y Resultado forman un par con una subfila por delito,
      // alineadas por la letra a) b) c). El botón de quitar delito vive en
      // la columna Delito y la columna Resultado reserva el mismo ancho.
      const subRows = (renderFn, conBoton = false) => delitos.map((d, di) => {
        const prefijo = nDel > 1 ? `<span class="dyn-delito-letra">${letrasDelito(di)})</span>` : '';
        const boton = conBoton && nDel > 1
          ? `<button type="button" class="btn btn-danger-soft btn-sm dyn-delito-del" data-del-delito="${ci}" data-di="${di}" title="Quitar este delito">✕</button>`
          : '<span class="dyn-delito-del-espacio"></span>';
        return `<div class="dyn-delito-item">
          ${prefijo}<div class="dyn-delito-fields">${renderFn(d, di)}</div>${boton}
        </div>`;
      }).join('');

      const delitoCells = subRows((d, di) =>
        selectHtml('casosIngresados', ci, di, 'nombre', DELITOS_FLAGRANCIA, d.nombre, d.otro, 'otro'), true);
      const resultadoCells = subRows((d, di) =>
        selectHtml('casosIngresados', ci, di, 'resultado', RESULTADOS_CASO, d.resultado, d.resultado_otro, 'resultado_otro'));
      const addBtn = `<button type="button" class="btn btn-outline btn-sm dyn-add-delito" data-add-delito="${ci}">+ Agregar delito</button>`;

      // Medidas coercitivas: lista libre del caso, independiente de delitos.
      const medidas = getMedidasRows(row);
      const nMed = medidas.length;
      const medidaCells = medidas.map((m, mi) => {
        const sel = selectHtml('casosIngresados', ci, mi, 'medidas', MEDIDAS_COERCITIVAS, m.valor, m.otro, 'medidas_otro', 'mi');
        const boton = nMed > 1
          ? `<button type="button" class="btn btn-danger-soft btn-sm dyn-medida-del" data-del-medida="${ci}" data-mi="${mi}" title="Quitar esta medida">✕</button>`
          : '<span class="dyn-delito-del-espacio"></span>';
        return `<div class="dyn-medida-item"><div class="dyn-delito-fields">${sel}</div>${boton}</div>`;
      }).join('');
      const addMedidaBtn = `<button type="button" class="btn btn-outline btn-sm dyn-add-medida" data-add-medida="${ci}">+ Agregar medida</button>`;

      return `<tr>
        <td style="text-align:center;font-weight:700;color:#475569;">${ci + 1}</td>
        <td><input type="text" data-arr="casosIngresados" data-idx="${ci}" data-col="n_caso" value="${escapeHtml(row.n_caso || '')}" placeholder="Ej. 20-2026" /></td>
        <td><input type="number" min="0" data-arr="casosIngresados" data-idx="${ci}" data-col="detenidos" value="${escapeHtml(row.detenidos || '0')}" placeholder="0" /></td>
        <td><input type="number" min="0" data-arr="casosIngresados" data-idx="${ci}" data-col="agraviado" value="${escapeHtml(row.agraviado || '1')}" placeholder="1" /></td>
        <td class="dyn-medidas-cell">${medidaCells}${addMedidaBtn}</td>
        <td class="dyn-delitos-cell">${delitoCells}${addBtn}</td>
        <td class="dyn-resultado-cell">${resultadoCells}</td>
        <td><button type="button" class="btn btn-danger-soft btn-sm" data-del-arr="casosIngresados" data-idx="${ci}" title="Eliminar caso">✕</button></td>
      </tr>`;
    }).join('');
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
    renderList('listConclusiones', 'conclusiones', '6', 'Conclusión');
    renderList('listRecomendaciones', 'recomendaciones', '7', 'Recomendación o solicitud');
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
              .map((c) => `<td>${escapeHtml(getDisplayVal(r, c))}</td>`)
              .join('')}</tr>`
        )
        .join('');
    };

    const renderCasosHtml = () => {
      const arr = state.casosIngresados || [];
      if (!arr.length) {
        return '<tr><td colspan="7" style="text-align:center;font-style:italic;color:#64748b;">Sin casos ingresados</td></tr>';
      }
      return arr.map((r, i) => {
        const delitoHtml = buildDelitosCellHtml(r) || '';
        const resultadoHtml = buildResultadosCellHtml(r) || '';
        return `<tr>
          <td style="text-align:center;">${i + 1}</td>
          <td>${escapeHtml(r.n_caso || '')}</td>
          <td>${escapeHtml(r.detenidos || '0')}</td>
          <td>${escapeHtml(r.agraviado || '0')}</td>
          <td>${delitoHtml}</td>
          <td>${buildMedidasCellHtml(r)}</td>
          <td>${resultadoHtml}</td>
        </tr>`;
      }).join('');
    };

    const conHtml = (state.conclusiones || [])
      .map((c, i) => `<p class="doc-p"><strong>6.${i + 1}</strong> ${valOrPlaceholder(c, 'Sin especificar')}</p>`)
      .join('');
    const recHtml = (state.recomendaciones || [])
      .map((r, i) => `<p class="doc-p"><strong>7.${i + 1}</strong> ${valOrPlaceholder(r, 'Sin especificar')}</p>`)
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

      <div class="doc-section-title">3. DETALLE DE CASOS</div>
      <div class="doc-subsection-title">3.1 Casos ingresados durante el turno</div>
      <table class="doc-table">
        <thead><tr><th>N°</th><th>Carpeta fiscal / caso</th><th>Detenido(s) (N)</th><th>Agraviado (N)</th><th>Delito(s)</th><th>Medidas coercitivas</th><th>Resultado por delito</th></tr></thead>
        <tbody>
          ${renderCasosHtml()}
          <tr><td colspan="6" style="font-weight:700;text-align:right;">Total de detenidos del turno</td><td style="font-weight:700;text-align:center;">${escapeHtml(state.total_detenidos)}</td></tr>
        </tbody>
      </table>

      <div class="doc-subsection-title">3.2 Audiencias realizadas o programadas</div>
      <table class="doc-table">
        <thead><tr><th>N°</th><th>Carpeta fiscal</th><th>Expediente judicial y juzgado</th><th>Tipo de audiencia</th><th>Resultado</th><th>Observación o informe</th></tr></thead>
        <tbody>${renderRowsHtml(state.audiencias, ['carpeta','exp_juzgado','tipo_audiencia','resultado','observacion'], 'Sin audiencias registradas')}</tbody>
      </table>

      <div class="doc-section-title">4. RESUMEN ESTADÍSTICO DEL TURNO</div>
      <table class="doc-table">
        <thead><tr><th>Indicador</th><th style="width:110px;text-align:center;">Cantidad</th></tr></thead>
        <tbody>
          <tr><td>Total de casos fiscales recibidos</td><td style="text-align:center;">${escapeHtml(state.total_casos)}</td></tr>
          <tr><td>Casos con detenido</td><td style="text-align:center;">${escapeHtml(state.casos_con_detenido)}</td></tr>
          <tr><td>Casos sin detenido</td><td style="text-align:center;">${escapeHtml(state.casos_sin_detenido)}</td></tr>
          <tr><td>Total de detenidos</td><td style="text-align:center;">${escapeHtml(state.total_detenidos)}</td></tr>
          <tr><td>Detenidos con situación jurídica resuelta dentro del plazo de ley</td><td style="text-align:center;">${escapeHtml(state.detenidos_resueltos)}</td></tr>
          <tr><td>Detenidos con situación jurídica pendiente</td><td style="text-align:center;">${escapeHtml(state.detenidos_pendientes)}</td></tr>
        </tbody>
      </table>

      <div class="doc-subsection-title">4.1 Resultados obtenidos</div>
      <table class="doc-table">
        <thead><tr><th>Resultado</th><th style="width:140px;text-align:center;">Cantidad</th></tr></thead>
        <tbody>
          <tr><td>Principio de oportunidad</td><td style="text-align:center;">${escapeHtml(state.res_principio_oportunidad)}</td></tr>
          <tr><td>Acuerdo reparatorio</td><td style="text-align:center;">${escapeHtml(state.res_acuerdo_reparatorio)}</td></tr>
          <tr><td>Incoación de proceso inmediato</td><td style="text-align:center;">${escapeHtml(state.res_proceso_inmediato)}</td></tr>
          <tr><td>Terminación anticipada</td><td style="text-align:center;">${escapeHtml(state.res_terminacion_anticipada)}</td></tr>
          <tr><td>Acusación directa</td><td style="text-align:center;">${escapeHtml(state.res_acusacion)}</td></tr>
          <tr><td>Formalización de la investigación preparatoria</td><td style="text-align:center;">${escapeHtml(state.res_formalizacion)}</td></tr>
          <tr><td>Ampliación de investigación preliminar o de diligencias</td><td style="text-align:center;">${escapeHtml(state.res_ampliacion)}</td></tr>
          <tr><td>Archivo</td><td style="text-align:center;">${escapeHtml(state.res_archivo)}</td></tr>
          <tr><td>Derivación a otro despacho</td><td style="text-align:center;">${escapeHtml(state.res_derivacion)}</td></tr>
          <tr><td>Otros resultados: ${escapeHtml(state.res_otros_detalle)}</td><td style="text-align:center;">${escapeHtml(state.res_otros)}</td></tr>
        </tbody>
      </table>

      <div class="doc-subsection-title">4.2 Medidas personales y reales</div>
      <table class="doc-table">
        <thead><tr><th>Medida coercitiva</th><th style="width:140px;text-align:center;">Cantidad</th></tr></thead>
        <tbody>
          <tr><td>Prisión preventiva</td><td style="text-align:center;">${escapeHtml(state.med_prision_preventiva)}</td></tr>
          <tr><td>Detención preliminar judicial</td><td style="text-align:center;">${escapeHtml(state.med_detencion_preliminar)}</td></tr>
          <tr><td>Comparecencia con restricciones</td><td style="text-align:center;">${escapeHtml(state.med_comparecencia_restricciones)}</td></tr>
          <tr><td>Comparecencia simple</td><td style="text-align:center;">${escapeHtml(state.med_comparecencia_simple)}</td></tr>
          <tr><td>Impedimento de salida del país</td><td style="text-align:center;">${escapeHtml(state.med_impedimento_salida)}</td></tr>
          <tr><td>Incautación</td><td style="text-align:center;">${escapeHtml(state.med_incautacion)}</td></tr>
          <tr><td>Embargo</td><td style="text-align:center;">${escapeHtml(state.med_embargo)}</td></tr>
          <tr><td>Otras medidas (personales / reales)</td><td style="text-align:center;">${escapeHtml(state.med_otras)}</td></tr>
        </tbody>
      </table>
      <p class="doc-p"><strong>Delitos de mayor incidencia durante el turno:</strong> ${valOrPlaceholder(state.delitos_mayor_incidencia)}.</p>

      <div class="doc-section-title">5. INCIDENCIAS Y PROBLEMÁTICA IDENTIFICADA</div>
      <p class="doc-p">• <strong>Personal y recursos del despacho:</strong> ${escapeHtml(state.inc_personal)}</p>
      <p class="doc-p">• <strong>Coordinación interinstitucional (PNP, Poder Judicial, Medicina Legal u otras):</strong> ${escapeHtml(state.inc_interinstitucional)}</p>
      <p class="doc-p">• <strong>Recepción de comunicaciones, actas y remisión de carpetas fiscales:</strong> ${escapeHtml(state.inc_comunicaciones_carpetas)}</p>
      <p class="doc-p">• <strong>Aspectos logísticos, de infraestructura o de sistemas:</strong> ${escapeHtml(state.inc_logistica)}</p>
      <p class="doc-p">• <strong>Otras incidencias:</strong> ${escapeHtml(state.inc_otras)}</p>

      <div class="doc-section-title">6. CONCLUSIONES</div>
      ${conHtml}

      <div class="doc-section-title">7. RECOMENDACIONES Y SOLICITUDES</div>
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

    fitPreviewSheet();
  }

  // La hoja es A4 (794px). Si el panel es más angosto se escala con zoom en
  // lugar de reflujir el texto, para que el informe no se desnaturalice.
  function fitPreviewSheet() {
    const panel = $('#previewPanel');
    const sheet = $('#docPreview');
    if (!panel || !sheet) return;
    const disponible = panel.clientWidth - 36; // padding del panel
    const escala = disponible > 0 ? Math.min(1, disponible / 794) : 1;
    sheet.style.zoom = String(Number(escala.toFixed(3)));
  }

  let previewResizeTimer = null;
  window.addEventListener('resize', () => {
    clearTimeout(previewResizeTimer);
    previewResizeTimer = setTimeout(fitPreviewSheet, 120);
  });

  // Envía el informe a Presidencia (c.c. Coordinación). Lo usan el botón de
  // la barra superior y el botón final de la última sección.
  async function enviarAPresidencia() {
    const missing = validateCriticalFields();
    saveDraft();
    try {
      await syncCloudRecord('enviado');
      if (missing.length) {
        showToast(`Enviado a Presidencia (c.c. Coordinación) (aviso: faltó completar ${missing.join(', ')}).`);
      } else {
        showToast('Informe enviado a Presidencia de la Junta de Fiscales Superiores (c.c. Coordinación).');
      }
    } catch (err) {
      showToast('Error al enviar a Coordinación: ' + err.message, true);
    }
  }

  function goToStep(stepIdx) {
    currentStep = Math.max(0, Math.min(6, stepIdx));
    $$('.step-pane').forEach((p) => {
      p.classList.toggle('hidden', Number(p.dataset.step) !== currentStep);
    });
    $$('.step-btn').forEach((b) => {
      b.classList.toggle('active', Number(b.dataset.step) === currentStep);
    });
    $('#stepCounter').textContent = `Sección ${currentStep + 1} de 7`;
    $('#btnPrevStep').disabled = currentStep === 0;

    // En la última sección el botón de avance se convierte en el envío a
    // Presidencia con copia a Coordinación.
    const next = $('#btnNextStep');
    const esUltimo = currentStep === 6;
    const puedeEnviar = !isAdminRole();
    next.textContent = esUltimo ? 'Enviar a Presidencia (c.c. Coordinación)' : 'Siguiente sección →';
    next.classList.toggle('btn-gold', esUltimo && puedeEnviar);
    next.classList.toggle('btn-primary', !(esUltimo && puedeEnviar));
    next.disabled = esUltimo && !puedeEnviar;
    next.dataset.accion = esUltimo ? 'enviar' : 'avanzar';
  }

  function isAdminRole(acc = currentAccount) {
    return Boolean(acc && (acc.role === 'admin' || acc.role === 'presidencia'));
  }

  function showAdminPanel() {
    $('#adminPanel').classList.remove('hidden');
    $('#workspace').classList.add('hidden');
    $('#btnSendToCoord').classList.add('hidden');
    $('#btnBackToAdmin').classList.add('hidden');
    const titleEl = $('#adminPanelTitle');
    if (titleEl && currentAccount) {
      titleEl.textContent = currentAccount.role === 'presidencia'
        ? 'Panel de Presidencia — Junta de Fiscales Superiores del Distrito Fiscal de Lima Centro'
        : 'Panel de Coordinación — Fiscalías Especializadas en Flagrancia Delictiva de Lima Centro';
    }
    renderAdminDashboard();
  }

  function showEditorWorkspace() {
    $('#adminPanel').classList.add('hidden');
    $('#workspace').classList.remove('hidden');
    $('#btnSendToCoord').classList.toggle('hidden', isAdminRole());
    $('#btnBackToAdmin').classList.toggle('hidden', !isAdminRole());
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
    status.textContent = isAdminRole(account) ? 'Cargando panel de supervisión...' : 'Cargando plantilla del despacho...';

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
        state = normalizeState(cloudDraft.state_json);
      } else if (savedLocal && savedLocal.state) {
        state = normalizeState(savedLocal.state);
      } else {
        state = getDefaultState();
        state.nombre_despacho_emisor = account.despacho;
        state.nombre_despacho_turno = account.despacho;
        state.siglas_despacho = account.siglas;
      }

      if (!state.destinataria_nombre || state.destinataria_nombre.includes('LILLY')) {
        state.destinataria_nombre = 'SONIA ALBINA CHÁVEZ GIL';
        state.destinataria_cargo = 'Presidenta de la Junta de Fiscales Superiores del Distrito Fiscal de Lima Centro';
      }
      if (!state.copias_a || state.copias_a === 'Archivo') {
        state.copias_a = 'Coordinación Distrital de las Fiscalías Especializadas en Flagrancia Delictiva de Lima Centro / Archivo';
      }

      if (isAdminRole(account)) {
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

    // Inserta texto con saltos de línea reales de Word dentro de la celda,
    // clonando el run original para conservar su formato.
    const setTextWithBreaks = (tNode, value) => {
      const parts = String(value ?? '').split('\n');
      tNode.textContent = parts[0] ?? '';
      if (parts.length === 1) return;
      const doc = tNode.ownerDocument;
      const run = tNode.parentNode;
      if (!run || run.localName !== 'r') {
        tNode.textContent = parts.join(' ');
        return;
      }
      let ref = run;
      for (let i = 1; i < parts.length; i++) {
        const brRun = doc.createElementNS(W_NS, 'w:r');
        const br = doc.createElementNS(W_NS, 'w:br');
        brRun.appendChild(br);
        ref.parentNode.insertBefore(brRun, ref.nextSibling);
        ref = brRun;

        const textRun = run.cloneNode(true);
        const ts = Array.from(textRun.children).filter((n) => n.localName === 't');
        if (!ts.length) continue;
        ts[0].textContent = parts[i];
        ts[0].setAttribute('xml:space', 'preserve');
        for (let j = 1; j < ts.length; j++) ts[j].parentNode.removeChild(ts[j]);
        ref.parentNode.insertBefore(textRun, ref.nextSibling);
        ref = textRun;
      }
    };

    const replaceInNode = (node, map) => {
      for (const t of getTextNodes(node)) {
        let txt = t.textContent;
        let conSalto = false;
        for (const [k, v] of Object.entries(map)) {
          if (txt.includes(k)) {
            const reemplazo = String(v ?? '');
            if (reemplazo.includes('\n')) conSalto = true;
            txt = txt.split(k).join(reemplazo);
          }
        }
        if (conSalto) setTextWithBreaks(t, txt);
        else t.textContent = txt;
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

    // Tabla 3.1 (antes 4.1) Casos ingresados (index 5, keep last row "Total de detenidos del turno")
    if (tables[5]) {
      // La fila de encabezado es la primera <w:tr> de la tabla (children[0]
      // es <w:tblPr>), por eso se busca explícitamente.
      const headerRow = Array.from(tables[5].children).find((n) => n.localName === 'tr');
      if (headerRow) {
        replaceInNode(headerRow, {
          'Detenido(s)': 'Detenido(s) (N)',
          'Agraviado': 'Agraviado (N)',
          'Diligencias realizadas': 'Medidas coercitivas',
          'Delito': 'Delito(s)',
          'Resultado y estado actual': 'Resultado por delito'
        });
      }
    }
    populateDynamicTable(tables[5], state.casosIngresados, (r) => ({
      '{{n_caso}}': r.n_caso || '',
      '{{detenidos}}': r.detenidos || '0',
      '{{agraviado}}': r.agraviado || '0',
      '{{delito}}': buildDelitosCellText(r),
      '{{diligencias}}': buildMedidasCellText(r),
      '{{resultado}}': buildResultadosCellText(r)
    }), 1);

    // Tabla 3.2 (antes 4.3) Audiencias (index 7)
    populateDynamicTable(tables[7], state.audiencias, (r) => ({
      '{{carpeta}}': r.carpeta || '',
      '{{exp_juzgado}}': r.exp_juzgado || '',
      '{{tipo_audiencia}}': getDisplayVal(r, 'tipo_audiencia'),
      '{{resultado}}': getDisplayVal(r, 'resultado'),
      '{{observacion}}': r.observacion || ''
    }));

    // Limpiar filas eliminadas en Estadístico (tables[3]) y Resultados (tables[4])
    const removeTableRowContaining = (tbl, needle) => {
      if (!tbl) return;
      Array.from(tbl.children).filter((n) => n.localName === 'tr').forEach((tr) => {
        const txt = getTextNodes(tr).map((t) => t.textContent).join('');
        if (txt.includes(needle)) tbl.removeChild(tr);
      });
    };
    removeTableRowContaining(tables[3], 'Levantamientos de cadáver');
    removeTableRowContaining(tables[3], 'Casos recibidos de turnos anteriores');
    removeTableRowContaining(tables[4], 'Prisión preventiva solicitada');
    replaceInNode(tables[4], {
      'Incoación de proceso inmediato (procedente / improcedente)': 'Incoación de proceso inmediato',
      'Acusación directa o requerimiento acusatorio': 'Acusación directa',
      'Archivo, libertad por atipicidad u otra disposición de conclusión': 'Archivo'
    });

    // Crear tabla 4.2 Medidas personales y reales clonando tables[4]
    const medTbl = tables[4] ? tables[4].cloneNode(true) : null;
    if (medTbl) {
      const mRows = Array.from(medTbl.children).filter((n) => n.localName === 'tr');
      const hdr = mRows[0];
      const tplRow = mRows[1] ? mRows[1].cloneNode(true) : null;
      mRows.slice(1).forEach((r) => medTbl.removeChild(r));
      if (hdr) replaceInNode(hdr, { 'Resultado': 'Medida coercitiva' });
      const medItems = [
        ['Prisión preventiva', state.med_prision_preventiva],
        ['Detención preliminar judicial', state.med_detencion_preliminar],
        ['Comparecencia con restricciones', state.med_comparecencia_restricciones],
        ['Comparecencia simple', state.med_comparecencia_simple],
        ['Impedimento de salida del país', state.med_impedimento_salida],
        ['Incautación', state.med_incautacion],
        ['Embargo', state.med_embargo],
        ['Otras medidas (personales / reales)', state.med_otras]
      ];
      if (tplRow) {
        medItems.forEach(([label, val]) => {
          const r = tplRow.cloneNode(true);
          const cells = Array.from(r.children).filter((n) => n.localName === 'tc');
          if (cells[0]) { const ts = getTextNodes(cells[0]); if (ts[0]) ts[0].textContent = label; for (let j = 1; j < ts.length; j++) ts[j].textContent = ''; }
          if (cells[1]) { const ts = getTextNodes(cells[1]); if (ts[0]) ts[0].textContent = String(val ?? '0'); for (let j = 1; j < ts.length; j++) ts[j].textContent = ''; }
          medTbl.appendChild(r);
        });
      }
    }

    // Reordenar: Mover Sección 3 (Estadístico) después de Sección 4 (Detalle de Casos), y eliminar 4.2, 4.4 y 5
    const findChildPara = (needle) =>
      Array.from(body.children).find((n) => n.localName === 'p' && getTextNodes(n).map((t) => t.textContent).join('').includes(needle));

    const pResumen = findChildPara('3. RESUMEN ESTADÍSTICO DEL TURNO');
    const pResObt = findChildPara('3.1 Resultados obtenidos');
    const pDelitos = findChildPara('Delitos de mayor incidencia');
    const pDetalle = findChildPara('4. DETALLE DE CASOS');
    const pCasosIng = findChildPara('4.1 Casos ingresados durante el turno');
    const pCasosAnt = findChildPara('4.2 Casos recibidos de turnos anteriores');
    const pAudiencias = findChildPara('4.3 Audiencias realizadas o programadas');
    const pLevant = findChildPara('4.4 Levantamientos de cadáver');
    const pDerivados = findChildPara('5. CASOS DERIVADOS');
    const pIncidencias = findChildPara('6. INCIDENCIAS');
    const pIncFlagrancia = findChildPara('Coordinación con la Unidad de Flagrancia');

    // Eliminar secciones tachadas: 4.2, 4.4, 5
    [pCasosAnt, tables[6], pLevant, tables[8], pDerivados, tables[9]].forEach((node) => {
      if (node && node.parentNode === body) body.removeChild(node);
    });

    // Eliminar rubro de incidencias "Coordinación con la Unidad de Flagrancia y con otras fiscalías de turno"
    if (pIncFlagrancia && pIncFlagrancia.parentNode === body) body.removeChild(pIncFlagrancia);

    // Renumerar títulos en Word
    if (pDetalle) replaceInNode(pDetalle, { '4. DETALLE DE CASOS': '3. DETALLE DE CASOS' });
    if (pCasosIng) replaceInNode(pCasosIng, { '4.1 Casos ingresados': '3.1 Casos ingresados' });
    if (pAudiencias) replaceInNode(pAudiencias, { '4.3 Audiencias realizadas': '3.2 Audiencias realizadas' });
    if (pResumen) replaceInNode(pResumen, { '3. RESUMEN ESTADÍSTICO': '4. RESUMEN ESTADÍSTICO' });
    if (pResObt) replaceInNode(pResObt, { '3.1 Resultados obtenidos': '4.1 Resultados obtenidos' });

    // Mover bloque estadístico (4. RESUMEN...) antes de 5. INCIDENCIAS (es decir, después de 3.2 Audiencias)
    if (pIncidencias && pResumen && tables[3] && pResObt && tables[4] && pDelitos) {
      body.insertBefore(pResumen, pIncidencias);
      body.insertBefore(tables[3], pIncidencias);
      body.insertBefore(pResObt, pIncidencias);
      body.insertBefore(tables[4], pIncidencias);
      if (medTbl) {
        const pMedTitle = pResObt.cloneNode(true);
        const mts = getTextNodes(pMedTitle);
        if (mts[0]) mts[0].textContent = '4.2 Medidas personales y reales';
        for (let j = 1; j < mts.length; j++) mts[j].textContent = '';
        body.insertBefore(pMedTitle, pIncidencias);
        body.insertBefore(medTbl, pIncidencias);
      }
      body.insertBefore(pDelitos, pIncidencias);
    }

    // Renumerar 6->5 Incidencias, 7->6 Conclusiones, 8->7 Recomendaciones
    if (pIncidencias) replaceInNode(pIncidencias, { '6. INCIDENCIAS': '5. INCIDENCIAS' });
    const pConcTitle = findChildPara('7. CONCLUSIONES');
    if (pConcTitle) replaceInNode(pConcTitle, { '7. CONCLUSIONES': '6. CONCLUSIONES' });
    const pRecTitle = findChildPara('8. RECOMENDACIONES');
    if (pRecTitle) replaceInNode(pRecTitle, { '8. RECOMENDACIONES': '7. RECOMENDACIONES' });

    // Conclusiones y Recomendaciones dinámicas (<2 o >2 items)
    const expandListParagraph = (marker1, marker2, items, prefix) => {
      const paras = Array.from(body.children).filter((n) => n.localName === 'p');
      const p1 = paras.find((p) => getTextNodes(p).map((t) => t.textContent).join('').includes(marker1));
      const p2 = paras.find((p) => getTextNodes(p).map((t) => t.textContent).join('').includes(marker2));
      if (p1) replaceInNode(p1, { [`${Number(prefix) + 1}.1`]: `${prefix}.1` });
      if (!p2) return;
      if (items.length < 2) {
        p2.parentNode.removeChild(p2);
        return;
      }
      replaceInNode(p2, { [`${Number(prefix) + 1}.2`]: `${prefix}.2` });
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
    expandListParagraph('{{conclusion_1}}', '{{conclusion_2}}', state.conclusiones || [], '6');
    expandListParagraph('{{recomendacion_1}}', '{{recomendacion_2}}', state.recomendaciones || [], '7');

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
      'LILLY LORENA GELACIO LLONTOP': state.destinataria_nombre || 'SONIA ALBINA CHÁVEZ GIL',
      'Coordinadora Distrital de las Fiscalías Especializadas en Flagrancia Delictiva de Lima Centro': state.destinataria_cargo || 'Presidenta de la Junta de Fiscales Superiores del Distrito Fiscal de Lima Centro',
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
  const onReady = async () => {
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

    $('#btnSendToCoord').addEventListener('click', enviarAPresidencia);

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
          state = normalizeState(rows[0].state_json);
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
          state = normalizeState(rec.state_json);
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
          state = normalizeState(rec.state_json);
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
    $('#btnNextStep').addEventListener('click', () => {
      if ($('#btnNextStep').dataset.accion === 'enviar') {
        enviarAPresidencia();
      } else {
        goToStep(currentStep + 1);
      }
    });

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
        const di = t.hasAttribute('data-di') ? Number(t.getAttribute('data-di')) : null;
        const mi = t.hasAttribute('data-mi') ? Number(t.getAttribute('data-mi')) : null;
        const col = t.getAttribute('data-col');
        if (mi !== null) {
          state[arr][idx].medidas[mi][col === 'medidas_otro' ? 'otro' : col] = t.value;
        } else if (di !== null) {
          state[arr][idx].delitos[di][col] = t.value;
        } else {
          state[arr][idx][col] = t.value;
        }
        if (arr === 'casosIngresados') recalculateStatsFromCases(true);
        saveDraft();
        renderPreview();
        updateProgress();
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
      } else if (t.hasAttribute('data-bind') && t.tagName === 'SELECT') {
        state[t.getAttribute('data-bind')] = t.value;
        saveDraft();
        renderPreview();
        updateProgress();
      } else if (t.hasAttribute('data-arr') && t.tagName === 'SELECT') {
        const arr = t.getAttribute('data-arr');
        const idx = Number(t.getAttribute('data-idx'));
        const di = t.hasAttribute('data-di') ? Number(t.getAttribute('data-di')) : null;
        const mi = t.hasAttribute('data-mi') ? Number(t.getAttribute('data-mi')) : null;
        const col = t.getAttribute('data-col');
        let holder;
        if (mi !== null) holder = state[arr][idx].medidas[mi];
        else if (di !== null) holder = state[arr][idx].delitos[di];
        else holder = state[arr][idx];
        const campoOtro = mi !== null ? 'otro' : col + '_otro';
        const campoValor = mi !== null ? 'valor' : col;
        holder[campoValor] = t.value;
        if (t.value !== 'Otro') holder[campoOtro] = '';
        if (arr === 'casosIngresados') recalculateStatsFromCases(true);
        saveDraft();
        renderDynamicTables();
        renderPreview();
        updateProgress();
      }
    });

    // Botones agregar/eliminar filas
    document.addEventListener('click', (e) => {
      const addBtn = e.target.closest('[data-add-row]');
      if (addBtn) {
        const key = addBtn.getAttribute('data-add-row');
        const templates = {
          personalApoyo: { nombre: '', cargo: '', origen: '', horario: '', observacion: '' },
          audiencias: { carpeta: '', exp_juzgado: '', tipo_audiencia: '', tipo_audiencia_otro: '', resultado: '', resultado_otro: '', observacion: '' }
        };
        state[key].push(key === 'casosIngresados' ? newCasoRow() : { ...templates[key] });
        if (key === 'casosIngresados') recalculateStatsFromCases(true);
        saveDraft();
        renderDynamicTables();
        renderPreview();
      }

      const addDelitoBtn = e.target.closest('[data-add-delito]');
      if (addDelitoBtn) {
        const ci = Number(addDelitoBtn.getAttribute('data-add-delito'));
        if (state.casosIngresados[ci]) {
          state.casosIngresados[ci].delitos.push(newDelitoRow());
          saveDraft();
          renderDynamicTables();
          renderPreview();
        }
      }

      const delDelitoBtn = e.target.closest('[data-del-delito]');
      if (delDelitoBtn) {
        const ci = Number(delDelitoBtn.getAttribute('data-del-delito'));
        const di = Number(delDelitoBtn.getAttribute('data-di'));
        const delitos = state.casosIngresados[ci]?.delitos;
        if (delitos && delitos.length > 1) {
          delitos.splice(di, 1);
          recalculateStatsFromCases(true);
          saveDraft();
          renderDynamicTables();
          renderPreview();
        }
      }

      const addMedidaBtn = e.target.closest('[data-add-medida]');
      if (addMedidaBtn) {
        const ci = Number(addMedidaBtn.getAttribute('data-add-medida'));
        if (state.casosIngresados[ci]) {
          state.casosIngresados[ci].medidas.push(newMedidaRow('Ninguna'));
          saveDraft();
          renderDynamicTables();
          renderPreview();
        }
      }

      const delMedidaBtn = e.target.closest('[data-del-medida]');
      if (delMedidaBtn) {
        const ci = Number(delMedidaBtn.getAttribute('data-del-medida'));
        const mi = Number(delMedidaBtn.getAttribute('data-mi'));
        const medidas = state.casosIngresados[ci]?.medidas;
        if (medidas && medidas.length > 1) {
          medidas.splice(mi, 1);
          recalculateStatsFromCases(true);
          saveDraft();
          renderDynamicTables();
          renderPreview();
        }
      }

      const delBtn = e.target.closest('[data-del-arr]');
      if (delBtn) {
        const key = delBtn.getAttribute('data-del-arr');
        const idx = Number(delBtn.getAttribute('data-idx'));
        state[key].splice(idx, 1);
        if (key === 'casosIngresados') recalculateStatsFromCases(true);
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
          const imported = rows.slice(startIdx).map((cols) => {
            const delitoTxt = cols[3] || '';
            const medTxt = cols[4] || '';
            const resultTxt = cols[5] || '';
            return newCasoRow({
              n_caso: cols[0] || '',
              detenidos: String(parseInt(cols[1], 10) || 0),
              agraviado: String(parseInt(cols[2], 10) || 1),
              medidas: [newMedidaRow(
                MEDIDAS_COERCITIVAS.includes(medTxt) ? medTxt : (medTxt ? 'Otro' : 'Ninguna'),
                MEDIDAS_COERCITIVAS.includes(medTxt) ? '' : medTxt
              )],
              delitos: [newDelitoRow({
                nombre: DELITOS_FLAGRANCIA.includes(delitoTxt) ? delitoTxt : (delitoTxt ? 'Otro' : ''),
                otro: DELITOS_FLAGRANCIA.includes(delitoTxt) ? '' : delitoTxt,
                resultado: RESULTADOS_CASO.includes(resultTxt) ? resultTxt : (resultTxt ? 'Otro' : ''),
                resultado_otro: RESULTADOS_CASO.includes(resultTxt) ? '' : resultTxt
              })]
            });
          }).filter((r) => r.n_caso || r.delitos.some((d) => d.nombre || d.otro));
          if (!imported.length) throw new Error('Sin filas válidas');
          const vacia = (c) => !c.n_caso && !c.delitos.some((d) => d.nombre || d.otro);
          if (state.casosIngresados.length === 1 && vacia(state.casosIngresados[0])) {
            state.casosIngresados = imported;
          } else {
            state.casosIngresados = state.casosIngresados.concat(imported);
          }
          recalculateStatsFromCases(true);
          saveDraft();
          renderDynamicTables();
          renderPreview();
          showToast(`Se importaron ${imported.length} caso(s) en la Sección 3.1.`);
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
      ['inc_personal','inc_interinstitucional','inc_comunicaciones_carpetas','inc_logistica','inc_otras']
        .forEach((k) => { if (!String(state[k] || '').trim()) state[k] = 'Sin incidencias'; });
      saveDraft();
      syncInputsFromState();
    });

    $('#btnAutoStats').addEventListener('click', () => {
      recalculateStatsFromCases(true);
      saveDraft();
      renderPreview();
      showToast('Estadísticas y medidas recalculadas desde la Sección 3.');
    });

    $('#btnTogglePreview').addEventListener('click', () => {
      previewVisible = !previewVisible;
      $('#workspace').classList.toggle('preview-open', previewVisible);
      $('#previewPanel').classList.toggle('hidden', !previewVisible);
      $('#btnTogglePreview').textContent = previewVisible ? 'Ocultar Vista Previa' : 'Mostrar Vista Previa';
      if (previewVisible) setTimeout(fitPreviewSheet, 30);
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
          const imported = normalizeState(JSON.parse(reader.result));
          if (isAdminRole() && !$('#adminPanel').classList.contains('hidden')) {
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
  };

  // Arranca al cargar el DOM (o de inmediato si el script se cargó después).
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', onReady, { once: true });
  } else {
    onReady();
  }
})();