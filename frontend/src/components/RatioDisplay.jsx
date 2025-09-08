import styled from '@emotion/styled';
import { useState } from 'react';
import { ratioLearnMoreDict, industryBenchmarks, keyRatioThresholds } from '../data/DictOb.js';

// --- STYLED COMPONENTS ---

const GenBlock = styled.div`
  border: 1px solid #f0f0f0;
  border-radius: 12px;
  margin: 1.5rem 2.5rem;
  padding: 1.5rem;
  background-color: white;
  box-shadow: 0 4px 12px rgba(0,0,0,0.05);
`;

const RatioBlock = styled.div`
  display: flex;
  flex-direction: row;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 1rem;
`;

const StyledTitle = styled.h4`
  font-family: system-ui, sans-serif;
  font-weight: 600;
  font-size: 1.1rem;
  margin: 0;
  color: #1a202c;
`;

const GaugeWrapper = styled.div`
  position: relative;
  width: 100%;
  margin-top: 2.5rem; 
  margin-bottom: 2.5rem; 
`;

const ColorBar = styled.div`
  height: 16px;
  border-radius: 6px;
  background: ${props => {
    const colors = {
      critical: '#F8B4B4',
      adequate: '#FAF3B6',
      good: '#B7F0D8'
    };
    const [stop1, stop2] = props.stops;
    const [color1, color2, color3] = props.logic === 'lower' 
      ? [colors.good, colors.adequate, colors.critical]
      : [colors.critical, colors.adequate, colors.good];
    return `linear-gradient(90deg, 
      ${color1} ${stop1}%, 
      ${color2} ${stop1}% ${stop2}%, 
      ${color3} ${stop2}%
    )`;
  }};
`;

const ValueMarker = styled.div`
  position: absolute;
  top: -4px;
  bottom: -4px;
  width: 2px;
  background-color: #2D3748;
  border-radius: 2px;
  left: ${props => props.position}%; 
  transform: translateX(-50%);
  z-index: 2;
  opacity: 0.77;
`;

const ValueDisplay = styled.span`
  position: absolute;
  bottom: 100%;
  margin-bottom: 0.5rem; 
  font-weight: 600;
  font-size: 0.85rem;
  font-family: system-ui, sans-serif;
  color: #2D3748;
  left: ${props => props.position}%;
  transform: translateX(-50%);
  white-space: nowrap;
  opacity: 0.97;
`;

const LabelsWrapper = styled.div`
  position: absolute;
  top: 8px;
  transform: translateY(-50%);
  left: 0;
  right: 0;
  display: flex;
  padding: 0 5px;
`;

const ThresholdsWrapper = styled.div`
  position: absolute;
  top: 100%;
  margin-top: 4px;
  left: 0;
  right: 0;
  height: 10px;
`;

const ThresholdLabel = styled.span`
  position: absolute;
  font-size: 0.75rem;
  color: #718096;
  transform: translateX(-50%);
  left: ${props => props.position}%;
`;

const GaugeLabel = styled.span`
  font-family: system-ui, sans-serif;
  font-weight: 500;
  font-size: 0.70rem;
  opacity: 0.9;
  position: absolute;
  top: 50%;
  transform: translate(-50%, -50%);
  left: ${props => props.position}%;
  color: #4a5361ff;
  text-shadow: 0 0 2px white;
`;


const SubLabelText = styled.span`
  display: block;
  font-family: system-ui, sans-serif;
  font-size: 0.92rem;
  font-weight: 300;
  margin: 3rem 0 1rem 0;
  text-align: left;
  color: #718096;
`;

const LearnMoreBtn = styled.button`
  display: block;
  color: #15a497;
  font-family: 'Sansation', sans-serif;
  font-size: 0.85rem;
  font-style: italic;
  font-weight: bold;
  padding: 0;
  margin: 1.5rem 0 0.1rem 0;
  background: none;
  text-decoration: underline;
  border: none;
  cursor: pointer;

  &:hover,
  &:focus {
    outline: none;
    box-shadow: none;
  }
`;

const DetailsWrapper = styled.div`
  margin-top: 1rem;
  padding-top: 1rem;
  padding-right: 6rem;
  border-top: 1px solid #eee;
  font-family: system-ui, sans-serif;
  text-align: left;
  font-size: 0.8rem;
  line-height: 1.6;
  color: #333;

  strong {
    color: black;
  }
`;

const LegendWrapper = styled.div`
  display: flex;
  justify-content: flex-end;
  align-items: center;
  gap: 1rem;
  margin-top: 1rem;
`;

const LegendItem = styled.div`
  display: flex;
  align-items: center;
  gap: 0.4rem;
  font-size: 0.8rem;
  color: #718096;
`;

const LegendDot = styled.div`
  width: 10px;
  height: 10px;
  border-radius: 50%;
  background-color: ${props => props.color};
`;

// --- HELPER FUNCTIONS ---

function calculateGaugePositions(value, min, max, threshold1, threshold2) {
  const toPercent = (num) => {
    if (max === min) return 50;
    const percent = ((num - min) / (max - min)) * 100;
    return percent;
  };
  
  const markerPosition = Math.max(0, Math.min(100, toPercent(value)));
  const stop1 = toPercent(threshold1);
  const stop2 = toPercent(threshold2);
  return [markerPosition, stop1, stop2];
}

function calculateLabelPositions(stop1, stop2) {
    const firstMidpoint = stop1 / 2;
    const secondMidpoint = stop1 + (stop2 - stop1) / 2;
    const thirdMidpoint = stop2 + (100 - stop2) / 2;
    return [firstMidpoint, secondMidpoint, thirdMidpoint];
}

function formatRatioValue(value, ratioKey) {
    if (typeof value !== 'number') return value;

    const percentageRatios = ['roa', 'roe', 'roi', 'ros', 'debtToAssetsRatio'];
    
    const truncatedValue = Math.trunc(value * 100) / 100;

    if (percentageRatios.includes(ratioKey)) {
        return `${truncatedValue.toFixed(2)} (${(truncatedValue * 100).toFixed(0)}%)`;
    }
    return `${truncatedValue.toFixed(2)}x`;
}

// --- MAIN COMPONENT ---

function RatioDisplay({ title, value, ratioKey, country, industrySector }) {
    const [expandedSection, setExpandedSection] = useState(false);

    const config = keyRatioThresholds[ratioKey];
    const isNumericValue = typeof value === 'number';
    
    const benchmark = industryBenchmarks[country]?.[ratioKey]?.[industrySector] || 'N/A';
    const details = ratioLearnMoreDict[ratioKey] || {};
    const formattedValue = formatRatioValue(value, ratioKey);

    let markerPosition, stop1, stop2, labelPositions;
    let t1, t2; 
    if (isNumericValue && config) {
        const [min, max] = config.scale;
        [t1, t2] = config.thresholds;
        [markerPosition, stop1, stop2] = calculateGaugePositions(value, min, max, t1, t2);
        labelPositions = calculateLabelPositions(Math.min(stop1, stop2), Math.max(stop1, stop2));
    }
    
    const gaugeLabels = config?.logic === 'lower' 
      ? ['Good', 'Adequate', 'Critical'] 
      : ['Critical', 'Adequate', 'Good'];
      
    const thresholdLabels = config?.logic === 'lower' ? [t2, t1] : [t1, t2];

    return (
        <GenBlock>
            <RatioBlock>
                <StyledTitle>{title}</StyledTitle>
                <StyledTitle>{formattedValue}</StyledTitle>
            </RatioBlock>

            {isNumericValue && config && (
                <>
                    <GaugeWrapper>
                        <ValueDisplay position={markerPosition}>{(Math.trunc(value * 100) / 100).toFixed(2)}</ValueDisplay>

                        <ColorBar stops={[Math.min(stop1, stop2), Math.max(stop1, stop2)]} logic={config.logic} />
                        <ValueMarker position={markerPosition} />
                        
                        <LabelsWrapper>
                            <GaugeLabel position={labelPositions[0]}>{gaugeLabels[0]}</GaugeLabel>
                            <GaugeLabel position={labelPositions[1]}>{gaugeLabels[1]}</GaugeLabel>
                            <GaugeLabel position={labelPositions[2]}>{gaugeLabels[2]}</GaugeLabel>
                        </LabelsWrapper>
                        
                        <ThresholdsWrapper>
                           <ThresholdLabel position={Math.min(stop1, stop2)}>{thresholdLabels[0]}</ThresholdLabel>
                           <ThresholdLabel position={Math.max(stop1, stop2)}>{thresholdLabels[1]}</ThresholdLabel>
                        </ThresholdsWrapper>
                    </GaugeWrapper>
                </>
            )}


            <SubLabelText>
              Industry Standard: 
              <strong style={{ margin:'0', fontWeight:'500', fontSize:"0.95rem" }}>
                {typeof benchmark === 'number'
                  ? formatRatioValue(benchmark, ratioKey)
                  : benchmark
                }
              </strong>
            </SubLabelText>

            <LearnMoreBtn onClick={() => setExpandedSection(!expandedSection)}>
                {expandedSection ? 'Show Less' : 'Learn More'}
            </LearnMoreBtn>
            
            { expandedSection && (
              <DetailsWrapper>
                <p>
                  <strong>Significance:</strong> {details.significance}
                </p>
                <p>
                  <strong>Notes:</strong> {details.notes}
                </p>
              </DetailsWrapper>
            )}

            <LegendWrapper>
                <LegendItem>
                    <LegendDot color="#F8B4B4" />
                    <span>Critical</span>
                </LegendItem>
                <LegendItem>
                    <LegendDot color="#FAF3B6" />
                    <span>Adequate</span>
                </LegendItem>
                <LegendItem>
                    <LegendDot color="#B7F0D8" />
                    <span>Good</span>
                </LegendItem>
            </LegendWrapper>
        </GenBlock>
    )
}

export default RatioDisplay;
