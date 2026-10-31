// Configuration for the Italian crisis checks (Codice della crisi d'impresa, CCII).
// Thresholds live in the backend (backend/crisis.py); here only labels, help texts and groupings.

export const legalForms = [
  { value: 'societa_capitali', label: 'Società di capitali (S.r.l., S.p.A., ...)' },
  { value: 'societa_persone', label: 'Società di persone (S.n.c., S.a.s.)' },
  { value: 'impresa_individuale', label: 'Impresa individuale' },
];

export const cndcecSectors = [
  { value: 'A', label: 'Agricoltura, silvicoltura e pesca (A)' },
  { value: 'BCD', label: 'Estrazione, manifattura, produzione energia/gas (B, C, D)' },
  { value: 'E', label: 'Acqua, reti fognarie, rifiuti; trasmissione energia/gas (E, D)' },
  { value: 'F41', label: 'Costruzione di edifici (F41)' },
  { value: 'F42_43', label: 'Ingegneria civile e lavori specializzati (F42, F43)' },
  { value: 'G45_46', label: "Commercio all'ingrosso e di autoveicoli (G45, G46)" },
  { value: 'G47_I56', label: 'Commercio al dettaglio; bar e ristoranti (G47, I56)' },
  { value: 'H_I55', label: 'Trasporto e magazzinaggio; alloggio (H, I55)' },
  { value: 'JMN', label: 'Servizi alle imprese (J, M, N)' },
  { value: 'PQRS', label: 'Servizi alle persone (P, Q, R, S)' },
];

// Same mapping as backend/crisis.py. null = ambiguous, the user must choose.
export const appSectorToCndcec = {
  agriculture: 'A',
  mining: 'BCD',
  manufacturing: 'BCD',
  energy: 'BCD',
  water_waste: 'E',
  construction: null,
  trade: null,
  transport: 'H_I55',
  hospitality: null,
  info_comm: 'JMN',
  finance_insurance: null,
  real_estate: null,
  professional_scientific: 'JMN',
  administrative: 'JMN',
  public_admin: null,
  education: 'PQRS',
  health_social: 'PQRS',
  arts_entertainment: 'PQRS',
  other_services: 'PQRS',
};

// Balance-sheet items needed by the CNDCEC indices (only asked in the manual form;
// with document upload they are read from the financial statements).
export const balanceSheetExtraFields = [
  { name: 'totalDebts', label: 'Debiti totali (voce D del passivo)' },
  { name: 'taxDebts', label: 'Debiti tributari (D.12)' },
  { name: 'socialSecurityDebts', label: 'Debiti verso istituti previdenziali (D.13)' },
  { name: 'provisions', label: 'Accantonamenti (B.12 + B.13)' },
  { name: 'shareCapital', label: 'Capitale sociale (A.I)' },
];

export const signalGroups = [
  {
    title: 'Segnali art. 3, c. 4 CCII',
    fields: [
      { name: 'payrollMonthly', label: 'Monte retribuzioni mensile', source: 'LUL / cedolini' },
      { name: 'payrollOverdue30', label: 'Retribuzioni scadute da almeno 30 giorni', source: 'LUL / pagamenti' },
      { name: 'suppliersOverdue90', label: 'Debiti verso fornitori scaduti da almeno 90 giorni', source: 'Scadenzario fornitori' },
      { name: 'suppliersNotDue', label: 'Debiti verso fornitori non scaduti', source: 'Scadenzario fornitori' },
      { name: 'bankOverdue60', label: 'Esposizioni bancarie scadute o sconfinate da oltre 60 giorni', source: 'Centrale Rischi' },
      { name: 'bankTotalExposure', label: 'Totale esposizioni verso banche e intermediari', source: 'Centrale Rischi' },
    ],
  },
  {
    title: 'Creditori pubblici qualificati (art. 25-novies CCII)',
    fields: [
      { name: 'inpsOverdue90', label: 'Contributi INPS non versati da oltre 90 giorni', source: 'Cassetto previdenziale' },
      { name: 'inpsDuePrevYear', label: "Contributi INPS dovuti nell'anno precedente", source: 'Cassetto previdenziale' },
      { name: 'inailOverdue90', label: 'Premi INAIL scaduti da oltre 90 giorni', source: 'Servizi online INAIL' },
      { name: 'vatOverdue', label: 'Debito IVA scaduto e non versato (da LIPE)', source: 'Cassetto fiscale' },
      { name: 'vatTurnoverPrevYear', label: "Volume d'affari dell'anno precedente", source: 'Dichiarazione IVA' },
      { name: 'aderOverdue90', label: 'Carichi affidati ad AdER scaduti da oltre 90 giorni', source: 'Estratto di ruolo' },
    ],
  },
];

export const dscrComponentFields = {
  numerator: [
    { name: 'dscrOperatingFreeCashFlow', label: 'Flussi di cassa liberi della gestione operativa' },
    { name: 'dscrOpeningCash', label: 'Disponibilità liquide iniziali' },
    { name: 'dscrAvailableCreditLines', label: 'Linee di credito disponibili e utilizzabili' },
  ],
  denominator: [
    { name: 'dscrFinancialDebtService', label: 'Rate di debiti finanziari in scadenza (capitale + interessi)' },
    { name: 'dscrOverdueTaxSocial', label: 'Debiti fiscali e contributivi scaduti o in scadenza' },
    { name: 'dscrOverdueSuppliers', label: 'Debiti verso fornitori oltre i ritardi fisiologici' },
  ],
};

export const practicalTestFields = [
  {
    name: 'restructuringDebt',
    label: 'Debito da ristrutturare',
    help: 'Debito scaduto, riscadenziato o in moratoria, linee bancarie che non saranno rinnovate, rate a 24 mesi e investimenti previsti, al netto di dismissioni e nuovi apporti.',
  },
  {
    name: 'annualDebtServiceFlows',
    label: 'Flussi annui al servizio del debito',
    help: 'MOL prospettico normalizzato, al netto degli investimenti di mantenimento e delle imposte.',
  },
];

export const crisisFieldNames = [
  'legalForm', 'hasEmployees', 'cndcecSector', 'dscrHorizonMonths',
  ...balanceSheetExtraFields.map(f => f.name),
  ...signalGroups.flatMap(g => g.fields.map(f => f.name)),
  ...dscrComponentFields.numerator.map(f => f.name),
  ...dscrComponentFields.denominator.map(f => f.name),
  ...practicalTestFields.map(f => f.name),
];

export const emptyCrisisData = Object.fromEntries(crisisFieldNames.map(n => [n, '']));
emptyCrisisData.legalForm = 'societa_capitali';
emptyCrisisData.hasEmployees = 'true';
emptyCrisisData.dscrHorizonMonths = '6';

export const statusMeta = {
  alert: { label: 'Segnale', color: '#F8B4B4', text: '#7B1E1E' },
  warning: { label: 'Attenzione', color: '#FAF3B6', text: '#6B5B00' },
  ok: { label: 'Nessun segnale', color: '#B7F0D8', text: '#14532D' },
  not_evaluated: { label: 'Non valutato', color: '#E2E8F0', text: '#4A5568' },
};

export const overallMeta = {
  red: { color: '#F8B4B4', border: '#E53E3E' },
  yellow: { color: '#FAF3B6', border: '#D69E2E' },
  green: { color: '#B7F0D8', border: '#15a497' },
  green_partial: { color: '#DDF7EC', border: '#15a497' },
  grey: { color: '#EDF2F7', border: '#A0AEC0' },
};
