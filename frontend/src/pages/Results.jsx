import styled from '@emotion/styled';
import { useLocation } from 'react-router-dom';

import RatioDisplay from '../components/RatioDisplay';
import ModelDisplay from '../components/ModelDisplay';
import usaIcon from '../graphics/Results/usa.svg';
import italyIcon from '../graphics/Results/italy.svg';
import { industrySectors } from '../data/DictOb.js';

// --- STYLED COMPONENTS ---

const PageWrapper = styled.div`
  max-width: 900px;
  margin: 0 auto;
  padding: 2rem;
  font-family: system-ui, sans-serif;
`;

const ResultsTopSection = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1.5rem 2.5rem;
  border-bottom: 1px solid #eee;
`;

const InfoBlock = styled.div`
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 0.5rem;
`;

const RiskBlock = styled.div`
  display: flex;
  align-items: center;
`;

const StyledTitleCompany = styled.h3`
  font-weight: 700;
  font-size: 1.5rem;
  margin: 0;
  display: flex;
  align-items: center;
  gap: 0.5rem;
`;

const StyledSubtitle = styled.p`
  font-weight: 400;
  font-size: 1rem;
  color: #555;
  margin: 0.25rem 0 0 0;
`;

const RiskScoreLabel = styled.span`
  font-size: 1.2rem;
  font-family: system-ui, sans-serif;
  font-weight: 600;
  color: #333;
`;

const RiskScoreValue = styled.span`
  font-size: 1.2rem;
  font-weight: 500;
  font-family: system-ui, sans-serif;
  color: white;
  text-shadow: 
    -0.8px -0.8px 0 #718096,  
     0.8px -0.8px 0 #718096,
    -0.8px  0.8px 0 #718096,
     0.8px  0.8px 0 #718096;
  background-color: #B7F0D8; /* Verde per 'Good' - da rendere dinamico */
  padding: 5px 15px;
  border-radius: 20px;
  margin-left: 10px;
`;

const SectionTitle = styled.h2`
  font-size: 1.6rem;
  font-family: "Cascadia Mono", system-ui, sans-serif;
  color: #15a497;
  text-align: center;
  margin: 2.5rem 0 2rem 0;
`;

// --- KEY & TITLE DICTIONARY ---

const pageConfig = {
  keyRatios: [
    { key: 'currentRatio', title: 'Current Ratio' },
    { key: 'quickRatio', title: 'Quick Ratio' },
    { key: 'debtToEquityRatio', title: 'Debt-to-Equity Ratio' },
    { key: 'debtToAssetsRatio', title: 'Debt-to-Asset Ratio' },
    { key: 'interestCoverageRatio', title: 'Interest Coverage Ratio' },
    { key: 'roa', title: 'Return on Assets (ROA)' },
    { key: 'roe', title: 'Return on Equity (ROE)' },
    { key: 'roi', title: 'Return on Investment (ROI)' },
    { key: 'ros', title: 'Return on Sales (ROS)' },
    { key: 'assetTurnover', title: 'Asset Turnover' },
  ],
  financialDistressModels: [
    { key: 'altmanZScore', title: 'Altman Z-Score' },
    { key: 'springateSScore', title: 'Springate S-Score' },
    { key: 'tafflerTScore', title: 'Taffler T-Score' },
    { key: 'fulmerHFactor', title: 'Fulmer H-Factor' },
    { key: 'groverGScore', title: 'Grover G-Score' },
  ]
};

// --- HELPER FUNCTIONS ---

function getSectorShortLabel(country, sectorKey) {
  if (!sectorKey) {
    return 'N/A';
  }
  const sectors = industrySectors[country] || [];
  const sector = sectors.find(s => s.value === sectorKey);
  return sector ? sector.shortLabel : 'N/A';
}

function getRiskInfo(value, modelKey) {
    return { zone: 'Good', color: '#B7F0D8' }; // Placeholder
}

// --- MAIN COMPONENT ---

function Results() {
    const location = useLocation();
    const resultsData = location.state?.results || {};

    const companyName = resultsData.companyName ?? "N/A";
    const fiscalYear = resultsData.fiscalYear ?? "N/A";
    const country = resultsData.country ?? "USA";
    const industrySectorKey = resultsData.industrySector || null; 
    const countryKey =
      country?.toLowerCase() === 'italy' ? 'Italy' :
      country?.toLowerCase() === 'usa'   ? 'USA'   :
      country;
    const industrySectorLabel = getSectorShortLabel(countryKey, industrySectorKey);

    const { zone: riskScore, color: riskColor } = getRiskInfo(resultsData.altmanZScore, 'altmanZScore'); //Placeholder

    return(
        <PageWrapper>
            <ResultsTopSection>
                <InfoBlock>
                    <StyledTitleCompany>
                        <img
                            src={country === "USA" ? usaIcon : italyIcon}
                            alt={country}
                            style={{ width: '1.8rem', height: '1.8rem', marginTop:"0.5rem" }}
                        />
                        <span style={{ fontWeight: '400', marginRight: '0.2rem', marginLeft: '0.4rem' }}>|</span>
                        {companyName}
                    </StyledTitleCompany>
                    <StyledSubtitle>
                        {industrySectorLabel} <span style={{display: 'inline', margin: '0 0.2rem 0 0.2rem' }}>-</span> {fiscalYear}
                    </StyledSubtitle>
                </InfoBlock>
                <RiskBlock>
                    <RiskScoreLabel>
                        Risk Score: 
                        <RiskScoreValue bgColor={riskColor}>{riskScore}</RiskScoreValue>
                    </RiskScoreLabel>
                </RiskBlock>
            </ResultsTopSection>

            <SectionTitle>Key Ratios</SectionTitle>
            {pageConfig.keyRatios.map(config => (
                <RatioDisplay
                    key={config.key}
                    title={config.title}
                    value={resultsData[config.key]}
                    ratioKey={config.key}
                    country={country}
                    industrySector={industrySectorKey}
                />
            ))}

            <SectionTitle>Financial Distress Models</SectionTitle>
            {pageConfig.financialDistressModels.map(config => (
                <ModelDisplay
                    key={config.key}
                    title={config.title}
                    value={resultsData[config.key]}
                    modelKey={config.key}
                />
            ))}
        </PageWrapper>
    )
}

export default Results;
