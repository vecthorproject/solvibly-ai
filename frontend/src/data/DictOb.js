// This file centralizes all static data objects for the application.

// --- DATA OBJECT FOR INDUSTRY SECTORS ---

export const industrySectors = {
  USA: [
    { value: 'agriculture', label: 'Agriculture, Forestry and Fishing', shortLabel: 'Agriculture & Fishing' },
    { value: 'mining', label: 'Mining and Quarrying', shortLabel: 'Mining' },
    { value: 'manufacturing', label: 'Manufacturing', shortLabel: 'Manufacturing' },
    { value: 'energy', label: 'Electricity, Gas, Steam and Air Conditioning Supply', shortLabel: 'Energy & Utilities' },
    { value: 'water_waste', label: 'Water Supply; Sewerage, Waste Management', shortLabel: 'Water & Waste Mgmt.' },
    { value: 'construction', label: 'Construction', shortLabel: 'Construction' },
    { value: 'trade', label: 'Wholesale and Retail Trade', shortLabel: 'Wholesale & Retail' },
    { value: 'transport', label: 'Transportation and Logistics', shortLabel: 'Transport & Logistics' },
    { value: 'hospitality', label: 'Accommodation and Food Service Activities', shortLabel: 'Hospitality' },
    { value: 'info_comm', label: 'Information and Communication', shortLabel: 'Info & Communication' },
    { value: 'finance_insurance', label: 'Financial and Insurance Activities', shortLabel: 'Finance & Insurance' },
    { value: 'real_estate', label: 'Real Estate Activities', shortLabel: 'Real Estate' },
    { value: 'professional_scientific', label: 'Professional, Scientific and Technical Activities', shortLabel: 'Professional Services' },
    { value: 'administrative', label: 'Administrative and Support Service Activities', shortLabel: 'Admin & Support' },
    { value: 'public_admin', label: 'Public Administration and Defence', shortLabel: 'Public Administration' },
    { value: 'education', label: 'Education', shortLabel: 'Education' },
    { value: 'health_social', label: 'Human Health and Social Work Activities', shortLabel: 'Health & Social Work' },
    { value: 'arts_entertainment', label: 'Arts, Entertainment and Recreation', shortLabel: 'Arts & Entertainment' },
    { value: 'other_services', label: 'Other Service Activities', shortLabel: 'Other Services' },
  ],
  Italy: [
    { value: 'agriculture', label: 'Agricoltura, Silvicoltura e Pesca', shortLabel: 'Agricoltura e Pesca' },
    { value: 'mining', label: 'Estrazione di Minerali', shortLabel: 'Estrattivo' },
    { value: 'manufacturing', label: 'Attività Manifatturiere', shortLabel: 'Manifatturiero' },
    { value: 'energy', label: 'Fornitura di Energia Elettrica, Gas, Vapore', shortLabel: 'Energia e Utilities' },
    { value: 'water_waste', label: 'Fornitura Acqua e Gestione Rifiuti', shortLabel: 'Acqua e Rifiuti' },
    { value: 'construction', label: 'Costruzioni', shortLabel: 'Costruzioni' },
    { value: 'trade', label: 'Commercio all\'Ingrosso e al Dettaglio', shortLabel: 'Commercio' },
    { value: 'transport', label: 'Trasporto e Logistica', shortLabel: 'Trasporti e Logistica' },
    { value: 'hospitality', label: 'Servizi di Alloggio e Ristorazione', shortLabel: 'Turismo e Ristorazione' },
    { value: 'info_comm', label: 'Servizi di Informazione e Comunicazione', shortLabel: 'Informazione e TLC' },
    { value: 'finance_insurance', label: 'Attività Finanziarie e Assicurative', shortLabel: 'Finanza e Assicurazioni' },
    { value: 'real_estate', label: 'Attività Immobiliari', shortLabel: 'Immobiliare' },
    { value: 'professional_scientific', label: 'Attività Professionali, Scientifiche e Tecniche', shortLabel: 'Servizi Professionali' },
    { value: 'administrative', label: 'Attività Amministrative e di Supporto', shortLabel: 'Servizi di Supporto' },
    { value: 'public_admin', label: 'Amministrazione Pubblica e Difesa', shortLabel: 'Pubblica Amministrazione' },
    { value: 'education', label: 'Istruzione', shortLabel: 'Istruzione' },
    { value: 'health_social', label: 'Sanità e Assistenza Sociale', shortLabel: 'Sanità' },
    { value: 'arts_entertainment', label: 'Attività Artistiche, Intrattenimento e Divertimento', shortLabel: 'Arte e Intrattenimento' },
    { value: 'other_services', label: 'Altre Attività di Servizi', shortLabel: 'Altri Servizi' },
  ]
};

// --- DATA OBJECT FOR LEARN MORE ---

export const ratioLearnMoreDict = {
  currentRatio: {
    significance: `Misura la capacità di coprire le passività a breve (in scadenza entro l'anno) con l'attivo a breve. È l'indicatore principale di liquidità.`,
    notes: `Un valore superiore a 1 è in genere considerato sano, ma il livello ideale cambia molto da settore a settore. Un valore molto alto può indicare un uso poco efficiente delle risorse.`
  },
  quickRatio: {
    significance: `Come l'indice di liquidità corrente, ma esclude le rimanenze dall'attivo a breve: è una misura più prudente della liquidità.`,
    notes: `Un valore superiore a 1 indica che l'impresa può far fronte alle passività a breve senza dover vendere il magazzino.`
  },
  debtToEquityRatio: {
    significance: `Indica quanta parte dei finanziamenti arriva da terzi rispetto ai mezzi propri: è la misura principale della leva finanziaria.`,
    notes: `Un valore alto indica un rischio maggiore, perché l'impresa dipende molto dal debito. Sotto 1 è spesso considerato prudente, ma dipende dal settore.`
  },
  debtToAssetsRatio: {
    significance: `Misura la percentuale dell'attivo finanziata con capitale di terzi.`,
    notes: `Sotto il 50% è in genere meno rischioso: la maggior parte dell'attivo è finanziata con mezzi propri.`
  },
  interestCoverageRatio: {
    significance: `Misura quante volte il risultato operativo (EBIT) copre gli oneri finanziari dell'esercizio.`,
    notes: `Sotto 1,5 la copertura è considerata debole; più è alto, maggiore è la capacità di sostenere il costo del debito.`
  },
  roa: {
    significance: `La redditività dell'attivo (ROA) indica quanto utile netto l'impresa genera rispetto al totale dell'attivo.`,
    notes: `Più è alto meglio è; oltre il 5% è spesso considerato un buon valore.`
  },
  roe: {
    significance: `La redditività del capitale proprio (ROE) misura il rendimento dei mezzi propri investiti dai soci.`,
    notes: `È l'indicatore di redditività più seguito dai soci; oltre il 15% è spesso considerato buono. Con patrimonio netto molto basso o negativo perde significato.`
  },
  roi: {
    significance: `La redditività del capitale investito (ROI) misura il risultato operativo (EBIT) rispetto al totale dell'attivo.`,
    notes: `Un ROI superiore al costo medio del capitale indica che l'impresa crea valore.`
  },
  ros: {
    significance: `La redditività delle vendite (ROS) misura quanta parte dei ricavi diventa risultato operativo (EBIT).`,
    notes: `Indica l'efficienza della gestione caratteristica: più è alto, meglio è.`
  },
  assetTurnover: {
    significance: `Misura quante volte l'attivo si "trasforma" in ricavi nell'anno: è un indicatore di efficienza nell'uso delle risorse.`,
    notes: `In genere più è alto meglio è, ma dipende molto dal settore (alto nel commercio, basso nelle attività ad alta intensità di capitale).`
  }
};

export const normativeLearnMoreDict = {
  dscr: {
    significance: `Il DSCR (Debt Service Coverage Ratio) è l'indicatore prospettico usato per verificare la sostenibilità dei debiti secondo il Codice della crisi (art. 3 CCII: almeno i dodici mesi successivi; CNDCEC: orizzonte di sei mesi). Confronta i flussi di cassa attesi nel periodo con il debito in scadenza nello stesso periodo.`,
    notes: `Un valore inferiore a 1 è un segnale di allarme: i flussi attesi non bastano a pagare il debito in scadenza. Un valore pari a 1 indica una copertura appena sufficiente.`
  },
};

export const modelLearnMoreDict = {
  altmanZScore: {
    significance: `Il primo modello statistico di previsione del fallimento, sviluppato da Edward Altman nel 1968. Combina cinque indici di bilancio in un unico punteggio e classifica l'impresa in zone di rischio.`,
    notes: `Solvibly usa la variante adatta all'impresa: lo Z-Score originale per le manifatturiere quotate (soglie 1,81 / 2,99), lo Z'-Score per le manifatturiere non quotate (1,23 / 2,90) e lo Z''-Score per le imprese non manifatturiere, quotate o no (1,10 / 2,60). Ogni variante è confrontata con le proprie soglie. Le zone (dissesto, grigia, sicura) indicano il rischio di crisi nei due anni successivi.`
  },
  springateSScore: {
    significance: `Modello canadese a quattro indici basato sull'analisi discriminante. Nel campione originale ha classificato correttamente il 92,5% delle imprese.`,
    notes: `Un punteggio inferiore alla soglia di 0,862 indica un'elevata probabilità di insolvenza. È un'alternativa semplice al modello di Altman.`
  },
  tafflerTScore: {
    significance: `Modello sviluppato nel Regno Unito, simile a quello di Altman, che combina quattro indici su redditività, capitale circolante, rischio finanziario e liquidità.`,
    notes: `Solvibly usa la formulazione del 1983 (z = 3,20 + 12,18·x1 + 2,50·x2 − 10,68·x3 + 0,029·x4, dove x4 è il "no-credit interval"). La soglia è 0: un punteggio negativo indica un profilo simile a quello delle imprese fallite, uno positivo un profilo solvibile. Le zone 0,2 / 0,3 che a volte si trovano citate appartengono a una versione semplificata diversa.`
  },
  fulmerHFactor: {
    significance: `Modello costruito selezionando nove indici da un insieme di 40, per prevedere l'insolvenza con un anno di anticipo.`,
    notes: `Un valore negativo (< 0) indica un'elevata probabilità di insolvenza, un valore positivo stabilità finanziaria.`
  },
  groverGScore: {
    significance: `Modello più recente e semplice, con soli tre indici, che nei test ha mostrato un'accuratezza elevata, spesso superiore ai modelli più vecchi.`,
    notes: `Valori inferiori a −0,02 indicano dissesto, superiori a 0,01 una situazione sicura.`
  },
  zmijewskiXScore: {
    significance: `Sviluppato da Mark Zmijewski nel 1984 con un modello probit, stima la probabilità di dissesto finanziario.`,
    notes: `Usa tre indici: ROA, indebitamento e liquidità corrente. Un punteggio più alto indica una probabilità di dissesto più alta; sopra 0 la probabilità supera il 50%.`
  },
  ohlsonOScore: {
    significance: `Sviluppato da James Ohlson nel 1980 con un modello logit, stima la probabilità di fallimento combinando dimensione, indebitamento, liquidità, redditività e andamento degli utili.`,
    notes: `Usa nove variabili, tra cui l'utile dei due ultimi esercizi. Punteggi sotto −1,32 indicano rischio basso, tra −1,32 e 0,5 rischio moderato, sopra 0,5 rischio alto.`
  }
};

// --- INDUSTRY STANDARD BENCHMARKS (USA & ITALY) ---

export const industryBenchmarks = {
  USA: {
    currentRatio: { // Format as 1.6x
      agriculture: 1.6, mining: 1.5, manufacturing: 1.9, energy: 1.1, water_waste: 1.2, construction: 1.5, trade: 1.4, transport: 1.2, hospitality: 0.9, info_comm: 1.8, finance_insurance: 1.0, real_estate: 1.0, professional_scientific: 2.0, administrative: 1.3, public_admin: 'N/A', education: 1.9, health_social: 1.7, arts_entertainment: 1.1, other_services: 1.3,
    },
    quickRatio: { // Format as 0.8x
      agriculture: 0.8, mining: 0.9, manufacturing: 1.1, energy: 0.8, water_waste: 0.9, construction: 1.2, trade: 0.5, transport: 1.0, hospitality: 0.7, info_comm: 1.7, finance_insurance: 1.0, real_estate: 0.5, professional_scientific: 1.9, administrative: 1.2, public_admin: 'N/A', education: 1.8, health_social: 1.5, arts_entertainment: 0.9, other_services: 1.2,
    },
    debtToEquityRatio: { // Format as 0.8x
      agriculture: 0.8, mining: 0.9, manufacturing: 1.1, energy: 1.2, water_waste: 1.5, construction: 1.0, trade: 1.2, transport: 1.4, hospitality: 1.6, info_comm: 0.7, finance_insurance: 9.0, real_estate: 2.5, professional_scientific: 0.8, administrative: 1.1, public_admin: 'N/A', education: 0.6, health_social: 0.9, arts_entertainment: 1.3, other_services: 1.0,
    },
    debtToAssetsRatio: { // Format as 45%
      agriculture: 0.45, mining: 0.48, manufacturing: 0.52, energy: 0.55, water_waste: 0.6, construction: 0.5, trade: 0.55, transport: 0.58, hospitality: 0.62, info_comm: 0.4, finance_insurance: 0.9, real_estate: 0.7, professional_scientific: 0.45, administrative: 0.53, public_admin: 'N/A', education: 0.38, health_social: 0.48, arts_entertainment: 0.57, other_services: 0.5,
    },
    interestCoverageRatio: { // Format as 5.5x
      agriculture: 5.5, mining: 6.0, manufacturing: 8.0, energy: 3.5, water_waste: 3.0, construction: 5.0, trade: 4.5, transport: 4.0, hospitality: 2.5, info_comm: 15.0, finance_insurance: 2.5, real_estate: 2.0, professional_scientific: 18.0, administrative: 6.0, public_admin: 'N/A', education: 20.0, health_social: 10.0, arts_entertainment: 3.0, other_services: 7.0,
    },
    roa: { // Format as 4%
      agriculture: 0.04, mining: 0.03, manufacturing: 0.07, energy: 0.03, water_waste: 0.02, construction: 0.05, trade: 0.06, transport: 0.04, hospitality: 0.04, info_comm: 0.08, finance_insurance: 0.01, real_estate: 0.03, professional_scientific: 0.10, administrative: 0.05, public_admin: 'N/A', education: 0.06, health_social: 0.05, arts_entertainment: 0.04, other_services: 0.06,
    },
    roe: { // Format as 8%
      agriculture: 0.08, mining: 0.07, manufacturing: 0.15, energy: 0.08, water_waste: 0.05, construction: 0.12, trade: 0.14, transport: 0.10, hospitality: 0.09, info_comm: 0.18, finance_insurance: 0.11, real_estate: 0.06, professional_scientific: 0.20, administrative: 0.11, public_admin: 'N/A', education: 0.10, health_social: 0.11, arts_entertainment: 0.09, other_services: 0.12,
    },
    roi: { // Format as 6%
      agriculture: 0.06, mining: 0.05, manufacturing: 0.10, energy: 0.04, water_waste: 0.03, construction: 0.08, trade: 0.12, transport: 0.06, hospitality: 0.07, info_comm: 0.15, finance_insurance: 0.02, real_estate: 0.04, professional_scientific: 0.18, administrative: 0.09, public_admin: 'N/A', education: 0.08, health_social: 0.08, arts_entertainment: 0.06, other_services: 0.09,
    },
    ros: { // Format as 8%
      agriculture: 0.08, mining: 0.12, manufacturing: 0.09, energy: 0.15, water_waste: 0.10, construction: 0.06, trade: 0.04, transport: 0.07, hospitality: 0.06, info_comm: 0.20, finance_insurance: 0.25, real_estate: 0.18, professional_scientific: 0.12, administrative: 0.05, public_admin: 'N/A', education: 0.07, health_social: 0.06, arts_entertainment: 0.05, other_services: 0.08,
    },
    assetTurnover: { // Format as 0.6x
      agriculture: 0.6, mining: 0.4, manufacturing: 1.2, energy: 0.3, water_waste: 0.3, construction: 1.5, trade: 2.5, transport: 0.8, hospitality: 0.9, info_comm: 0.7, finance_insurance: 0.05, real_estate: 0.2, professional_scientific: 1.1, administrative: 1.3, public_admin: 'N/A', education: 0.8, health_social: 1.0, arts_entertainment: 0.9, other_services: 1.1,
    }
  },
  Italy: {
    currentRatio: { // Format as 1.5x
      agriculture: 1.5, mining: 1.4, manufacturing: 1.7, energy: 1.0, water_waste: 1.1, construction: 1.4, trade: 1.3, transport: 1.1, hospitality: 0.8, info_comm: 1.6, finance_insurance: 1.0, real_estate: 0.9, professional_scientific: 1.8, administrative: 1.2, public_admin: 'N/A', education: 1.8, health_social: 1.6, arts_entertainment: 1.0, other_services: 1.2,
    },
    quickRatio: { // Format as 0.7x
      agriculture: 0.7, mining: 0.8, manufacturing: 1.0, energy: 0.7, water_waste: 0.8, construction: 1.1, trade: 0.4, transport: 0.9, hospitality: 0.6, info_comm: 1.5, finance_insurance: 1.0, real_estate: 0.4, professional_scientific: 1.7, administrative: 1.1, public_admin: 'N/A', education: 1.7, health_social: 1.4, arts_entertainment: 0.8, other_services: 1.1,
    },
    debtToEquityRatio: { // Format as 1.2x
      agriculture: 1.2, mining: 1.3, manufacturing: 1.6, energy: 1.8, water_waste: 2.0, construction: 1.5, trade: 1.7, transport: 1.9, hospitality: 2.1, info_comm: 1.1, finance_insurance: 12.0, real_estate: 3.0, professional_scientific: 1.2, administrative: 1.5, public_admin: 'N/A', education: 1.0, health_social: 1.3, arts_entertainment: 1.8, other_services: 1.4,
    },
    debtToAssetsRatio: { // Format as 55%
      agriculture: 0.55, mining: 0.56, manufacturing: 0.62, energy: 0.64, water_waste: 0.67, construction: 0.6, trade: 0.63, transport: 0.65, hospitality: 0.68, info_comm: 0.52, finance_insurance: 0.92, real_estate: 0.75, professional_scientific: 0.55, administrative: 0.6, public_admin: 'N/A', education: 0.5, health_social: 0.56, arts_entertainment: 0.64, other_services: 0.58,
    },
    interestCoverageRatio: { // Format as 4.5x
      agriculture: 4.5, mining: 5.0, manufacturing: 6.0, energy: 2.5, water_waste: 2.0, construction: 4.0, trade: 3.5, transport: 3.0, hospitality: 2.0, info_comm: 12.0, finance_insurance: 2.0, real_estate: 1.8, professional_scientific: 15.0, administrative: 5.0, public_admin: 'N/A', education: 18.0, health_social: 8.0, arts_entertainment: 2.5, other_services: 6.0,
    },
    roa: { // Format as 3%
      agriculture: 0.03, mining: 0.02, manufacturing: 0.05, energy: 0.02, water_waste: 0.01, construction: 0.04, trade: 0.04, transport: 0.03, hospitality: 0.03, info_comm: 0.06, finance_insurance: 0.008, real_estate: 0.02, professional_scientific: 0.08, administrative: 0.04, public_admin: 'N/A', education: 0.05, health_social: 0.04, arts_entertainment: 0.03, other_services: 0.05,
    },
    roe: { // Format as 6%
      agriculture: 0.06, mining: 0.05, manufacturing: 0.12, energy: 0.06, water_waste: 0.04, construction: 0.10, trade: 0.11, transport: 0.08, hospitality: 0.07, info_comm: 0.15, finance_insurance: 0.10, real_estate: 0.05, professional_scientific: 0.16, administrative: 0.09, public_admin: 'N/A', education: 0.08, health_social: 0.09, arts_entertainment: 0.07, other_services: 0.10,
    },
    roi: { // Format as 5%
      agriculture: 0.05, mining: 0.04, manufacturing: 0.08, energy: 0.03, water_waste: 0.02, construction: 0.06, trade: 0.09, transport: 0.05, hospitality: 0.05, info_comm: 0.12, finance_insurance: 0.015, real_estate: 0.03, professional_scientific: 0.15, administrative: 0.07, public_admin: 'N/A', education: 0.07, health_social: 0.06, arts_entertainment: 0.05, other_services: 0.07,
    },
    ros: { // Format as 7%
      agriculture: 0.07, mining: 0.10, manufacturing: 0.07, energy: 0.12, water_waste: 0.08, construction: 0.05, trade: 0.03, transport: 0.06, hospitality: 0.05, info_comm: 0.15, finance_insurance: 0.20, real_estate: 0.15, professional_scientific: 0.10, administrative: 0.04, public_admin: 'N/A', education: 0.06, health_social: 0.05, arts_entertainment: 0.04, other_services: 0.06,
    },
    assetTurnover: { // Format as 0.5x
      agriculture: 0.5, mining: 0.3, manufacturing: 1.0, energy: 0.2, water_waste: 0.2, construction: 1.2, trade: 2.0, transport: 0.7, hospitality: 0.7, info_comm: 0.6, finance_insurance: 0.05, real_estate: 0.1, professional_scientific: 0.9, administrative: 1.1, public_admin: 'N/A', education: 0.7, health_social: 0.8, arts_entertainment: 0.8, other_services: 0.9,
    }
  }
};

// --- THRESHOLDS FOR KEY RATIOS ---

export const keyRatioThresholds = {
  currentRatio: {
    thresholds: [1.0, 2.0],
    scale: [0, 3],
    midpoint: 1.5,
    logic: 'higher'
  },
  quickRatio: {
    thresholds: [0.8, 1.2],
    scale: [0, 2],
    midpoint: 1.0,
    logic: 'higher'
  },
  debtToEquityRatio: {
    thresholds: [2.0, 1.0],
    scale: [0, 3],
    midpoint: 1.5,
    logic: 'lower'
  },
  debtToAssetsRatio: {
    thresholds: [0.6, 0.4],
    scale: [0, 1],
    midpoint: 0.5,
    logic: 'lower'
  },
  interestCoverageRatio: {
    thresholds: [1.5, 5.0],
    scale: [0, 10],
    midpoint: 3.25,
    logic: 'higher'
  },
  roa: {
    thresholds: [0.02, 0.05], 
    scale: [-0.05, 0.10],   
    midpoint: 0.035,        
    logic: 'higher'
  },
  roe: {
    thresholds: [0.05, 0.15], 
    scale: [-0.10, 0.30],   
    midpoint: 0.10,         
    logic: 'higher'
  },
  roi: {
    thresholds: [0.05, 0.10], 
    scale: [0, 0.20],       
    midpoint: 0.075,       
    logic: 'higher'
  },
  ros: {
    thresholds: [0.05, 0.15], 
    scale: [0, 0.30],       
    midpoint: 0.10,
    logic: 'higher'
  },
  assetTurnover: {
    thresholds: [0.5, 1.5],
    scale: [0, 3],
    midpoint: 1.0,
    logic: 'higher'
  }
};

// --- THRESHOLDS FOR DSCR ---

export const normativeThresholds = {
  dscr: {
    thresholds: [1.0, 1.0],
    scale: [0, 2],
    logic: 'higher',
    labels: ['Zona di crisi', '', 'Zona sicura'] 
  }
};

// --- THRESHOLDS FOR FINANCIAL DISTRESS MODELS ---

export const modelThresholds = {
  altmanZScore: {
    thresholds: [1.81, 2.99],
    scale: [0, 5],
    labels: ['Zona di dissesto', 'Zona grigia', 'Zona sicura'],
    logic: 'higher'
  },
  springateSScore: {
    thresholds: [0.862, 0.862], // cut-off 0.862
    scale: [0, 2],
    labels: ['Zona di dissesto', '', 'Zona sicura'], // binary
    logic: 'higher'
  },
  tafflerTScore: {
    thresholds: [0, 0], // cut-off 0 (Taffler 1983 model with constant 3.20)
    scale: [-5, 10],
    labels: ['Rischio alto', '', 'Rischio basso'], // binary
    logic: 'higher'
  },
  fulmerHFactor: {
    thresholds: [0, 0], // cut-off 0
    scale: [-5, 5],
    labels: ['Zona di insolvenza', '', 'Zona sicura'], // binary
    logic: 'higher'
  },
  groverGScore: {
    thresholds: [-0.02, 0.01],
    scale: [-0.5, 0.5],
    labels: ['Zona di dissesto', 'Zona grigia', 'Zona sicura'],
    logic: 'higher'
  },
  zmijewskiXScore: {
    thresholds: [0, 0], // cut-off 0
    scale: [-5, 5],
    labels: ['Non in dissesto', '', 'In dissesto'], // binary
    logic: 'lower'
  },
    ohlsonOScore: {
    thresholds: [-1.32, 0.5],
    scale: [-5, 3],
    labels: ['Rischio basso', 'Rischio moderato', 'Rischio alto'],
    logic: 'lower'
  }
};
