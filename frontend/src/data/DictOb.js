// This file centralizes all static data objects for the application.

// --- DATA OBJECT FOR LEARN MORE ---
export const ratioLearnMoreDict = {
  currentRatio: {
    significance: `Measures a company's ability to cover its short-term obligations (due within one year) with its short-term assets. It's a key indicator of liquidity.`,
    notes: `A value above 1.0 is generally considered healthy. However, the ideal ratio can vary significantly by industry. A very high ratio might suggest inefficient use of assets.`
  },
  quickRatio: {
    significance: `Similar to the Current Ratio, but excludes inventory from current assets. It provides a more conservative measure of liquidity.`,
    notes: `A value above 1.0 is strong, indicating the company can meet its short-term obligations without selling any inventory.`
  },
  debtToEquityRatio: {
    significance: `Indicates the proportion of a company's financing that comes from debt versus equity. It's a key measure of financial leverage.`,
    notes: `A high ratio indicates higher risk, as the company relies heavily on debt. A ratio below 1.0 is often considered safe, but this varies greatly by industry.`
  },
  debtToAssetsRatio: {
    significance: `Measures the percentage of a company's assets that are financed through debt.`,
    notes: `A ratio below 0.5 (or 50%) is generally considered less risky, as it means the majority of assets are financed by equity.`
  },
  interestCoverageRatio: {
    significance: `Measures how many times a company can cover its current interest payments with its available earnings (EBIT).`,
    notes: `A ratio above 1.5 is typically considered the minimum acceptable level. Higher is better, as it indicates a better ability to handle debt payments.`
  },
  roa: {
    significance: `Return on Assets (ROA) indicates how profitable a company is in relation to its total assets. It measures management's efficiency at using assets to generate earnings.`,
    notes: `A higher ROA is better. A value above 5% is often considered good.`
  },
  roe: {
    significance: `Return on Equity (ROE) measures the rate of return on the ownership interest (shareholders' equity) of the common stockholders.`,
    notes: `It's a key measure of profitability for investors. A value above 15% is often considered good.`
  },
  roi: {
    significance: `Return on Investment (ROI) measures the efficiency of the total capital invested (debt + equity) in generating operating profit (EBIT).`,
    notes: `It provides a broad view of the company's ability to generate profit from its capital base. A value above the company's cost of capital indicates value creation.`
  },
  ros: {
    significance: `Return on Sales (ROS) is a measure of how efficiently a company turns sales into profits (EBIT).`,
    notes: `It indicates the company's operational efficiency. A higher percentage is better.`
  },
  assetTurnover: {
    significance: `Measures the efficiency of a company's use of its assets in generating sales revenue.`,
    notes: `A higher ratio is generally better, but it is highly industry-dependent.`
  }
};

export const modelLearnMoreDict = {
  altmanZScore: {
    significance: `The pioneering statistical model for predicting corporate bankruptcy, developed by Edward Altman in 1968. It combines five key financial ratios into a single score to classify a company's financial health into distinct zones.`,
    notes: `The model has three main variants: the original Z-Score for public manufacturing firms, the Z'-Score for private companies, and the Z''-Score for non-manufacturing firms. The zones (Distress, Grey, Safe) indicate the probability of financial distress within two years.`
  },
  springateSScore: {
    significance: `A four-ratio model developed in Canada that uses discriminant analysis to predict corporate failure. It was noted for its very high accuracy (92.5%) on its initial test sample.`,
    notes: `The model calculates a single score where a value below the cut-off of 0.862 indicates a high probability of bankruptcy. It's a straightforward and powerful alternative to the Altman model.`
  },
  tafflerTScore: {
    significance: `A UK-based solvency model, similar in structure to Altman's, used to predict corporate failure. It combines four key ratios related to profitability, working capital, financial risk, and liquidity.`,
    notes: `The score is interpreted through specific zones: a score below 0.2 indicates a high risk of failure, while a score above 0.3 suggests a low risk. The area in between is a "grey zone" requiring further analysis.`
  },
  fulmerHFactor: {
    significance: `A complex model developed from a large set of 40 financial ratios to predict bankruptcy one year in advance. It is noted for its statistical rigor and high accuracy in initial tests.`,
    notes: `The model's interpretation is straightforward: a negative H-Factor score (< 0) indicates a high probability of failure (Failure Zone), while a positive score suggests financial stability (Safe Zone).`
  },
  groverGScore: {
    significance: `A more recent and simpler model that uses only three financial ratios to predict bankruptcy. Despite its simplicity, it has shown very high predictive accuracy, often outperforming older models.`,
    notes: `The model provides a score where values below -0.02 are classified as financially distressed. It's a powerful example of a parsimonious model that achieves high performance with fewer variables.`
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
    midpoint: 10,
    logic: 'higher'
  },
  assetTurnover: {
    thresholds: [0.5, 1.5],
    scale: [0, 3],
    midpoint: 1.0,
    logic: 'higher'
  }
};

// --- THRESHOLDS FOR FINANCIAL DISTRESS MODELS ---
export const modelThresholds = {
  altmanZScore: {
    thresholds: [1.81, 2.99],
    scale: [0, 5],
    labels: ['Distress Zone', 'Grey Zone', 'Safe Zone'],
    logic: 'higher'
  },
  springateSScore: {
    thresholds: [0.862, 0.862], // cut-off 0.862
    scale: [0, 2],
    labels: ['Distress Zone', '', 'Safe Zone'], // binary
    logic: 'higher'
  },
  tafflerTScore: {
    thresholds: [0.2, 0.3],
    scale: [-0.5, 1],
    labels: ['High Risk', 'Grey Zone', 'Low Risk'],
    logic: 'higher'
  },
  fulmerHFactor: {
    thresholds: [0, 0], // cut-off 0
    scale: [-5, 5],
    labels: ['Failure Zone', '', 'Safe Zone'], // binary
    logic: 'higher'
  },
  groverGScore: {
    thresholds: [-0.02, 0.01],
    scale: [-0.5, 0.5],
    labels: ['Distress Zone', 'Grey Zone', 'Safe Zone'],
    logic: 'higher'
  }
};
