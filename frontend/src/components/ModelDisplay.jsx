import styled from '@emotion/styled';
import { useState } from 'react';
import { modelLearnMoreDict, modelThresholds } from '../data/DictOb.js';

// --- STYLED COMPONENTS ---

const GenBlock = styled.div`
  border: 1px solid #f0f0f0;
  border-radius: 12px;
  margin: 1.5rem 2.5rem;
  padding: 1.5rem 2rem;
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

    if (props.isBinary) {
      const [color1, color2] = props.logic === 'lower' ? [colors.good, colors.critical] : [colors.critical, colors.good];
      return `linear-gradient(90deg, ${color1} ${stop1}%, ${color2} ${stop1}%)`;
    }
    
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
  
  left: ${props => {
    const min = 2;
    const max = 98;
    const safePos = Math.max(min, Math.min(max, props.position));
    return `${safePos}%`;
  }};
  
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
  font-size: ${props => 
    props.isBinary
    ? '0.75rem'
    : (props.greyZoneWidth < 5 ? '0.535rem' : '0.75rem')
  };
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

const riskZoneColors = {
  'Safe Zone': '#B7F0D8',
  'Low Risk': '#B7F0D8',
  'Non-Distress': '#B7F0D8',
  'Non-Distressed': '#B7F0D8',
  'Grey Zone': '#FAF3B6',
  'Distress Zone': '#F8B4B4',
  'High Risk': '#F8B4B4',
  'Failure Zone': '#F8B4B4',
  'Distressed': '#F8B4B4',
  'N/A': '#718096'
};

const RiskZoneValue = styled.strong`
  background-color: ${props => riskZoneColors[props.zone] || '#718096'};
  margin: 0.25rem;
  padding: 0.15rem 0.30rem;
  border: 1px solid white;
  border-radius: 8px;
  font-weight: 500;
  font-family: "Sansation", sans-serif;
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

function formatModelValue(value) {
    if (typeof value !== 'number') return value;
    return value.toFixed(4);
}

// --- MAIN COMPONENT ---

function ModelDisplay({ title, value, modelKey }) {
    const [expandedSection, setExpandedSection] = useState(false);

    const config = modelThresholds[modelKey];
    const isNumericValue = typeof value === 'number';
    const details = modelLearnMoreDict[modelKey] || {};
    const formattedValue = formatModelValue(value);
    
    const isBinary = config && config.labels[1] === '';

    let markerPosition, stop1, stop2, labelPositions, riskZone;
    let t1, t2; 
    let greyZoneWidth = 0;
    
    if (isNumericValue && config) {
        const [min, max] = config.scale;
        [t1, t2] = config.thresholds;
        [markerPosition, stop1, stop2] = calculateGaugePositions(value, min, max, t1, t2);
        
        if (!isBinary) {
            labelPositions = calculateLabelPositions(stop1, stop2);
            greyZoneWidth = stop2 - stop1;
        }

        const [label1, midLabel, label3] = config.labels;
        if (isBinary) {
          riskZone = value < t1 ? label1 : label3;
        } else {
            if (value < Math.min(t1, t2)) {
                riskZone = label1;
            } else if (value > Math.max(t1, t2)) {
                riskZone = label3;
            } else {
                riskZone = midLabel;
            }
        }
    }
    
    const gaugeLabels = config?.labels || ['N/A', 'N/A', 'N/A'];
    const thresholdLabels = config?.thresholds || [];
    
    let middleLabelContent = null;
    if (!isBinary) {
        if (greyZoneWidth > 18) { 
            middleLabelContent = { text: gaugeLabels[1], abbreviated: false };
        } else { 
            middleLabelContent = { text: 'GZ', abbreviated: true };
        }
    }

    return (
        <GenBlock>
            <RatioBlock>
                <StyledTitle>{title}</StyledTitle>
                <StyledTitle>{formattedValue}</StyledTitle>
            </RatioBlock>
            
            {isNumericValue && config && (
                <>
                    <GaugeWrapper>
                        <ValueDisplay position={markerPosition}>{value.toFixed(4)}</ValueDisplay>

                        <ColorBar stops={[stop1, stop2]} isBinary={isBinary} logic={config.logic} />
                        <ValueMarker position={markerPosition} />
                        
                        <LabelsWrapper>
                            {isBinary ? (
                                <>
                                    <GaugeLabel position={25}>{gaugeLabels[0]}</GaugeLabel>
                                    <GaugeLabel position={75}>{gaugeLabels[2]}</GaugeLabel>
                                </>
                            ) : (
                                <>
                                    <GaugeLabel position={labelPositions[0]}>{gaugeLabels[0]}</GaugeLabel>
                                    {middleLabelContent && (
                                        <GaugeLabel position={labelPositions[1]} isAbbreviated={middleLabelContent.abbreviated}>
                                            {middleLabelContent.text}
                                        </GaugeLabel>
                                    )}
                                    <GaugeLabel position={labelPositions[2]}>{gaugeLabels[2]}</GaugeLabel>
                                </>
                            )}
                        </LabelsWrapper>
                        
                        <ThresholdsWrapper>
                           <ThresholdLabel position={stop1} isBinary={isBinary} greyZoneWidth={greyZoneWidth}>{thresholdLabels[0]}</ThresholdLabel>
                           {!isBinary && <ThresholdLabel position={stop2} isBinary={isBinary} greyZoneWidth={greyZoneWidth}>{thresholdLabels[1]}</ThresholdLabel>}
                        </ThresholdsWrapper>
                    </GaugeWrapper>
                </>
            )}

            <SubLabelText>Risk Zone:
              <RiskZoneValue zone={riskZone || 'N/A'}>{riskZone || 'N/A'}</RiskZoneValue>
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
              {(() => {
                const labels = isBinary 
                  ? [gaugeLabels[0], gaugeLabels[2]]
                  : [gaugeLabels[0], gaugeLabels[1], gaugeLabels[2]];

                const colors = isBinary
                  ? (config.logic === 'lower' ? ['#B7F0D8', '#F8B4B4'] : ['#F8B4B4', '#B7F0D8'])
                  : (config.logic === 'lower' ? ['#B7F0D8', '#FAF3B6', '#F8B4B4'] : ['#F8B4B4', '#FAF3B6', '#B7F0D8']);

                return labels.map((label, i) => (
                  <LegendItem key={i}>
                    <LegendDot color={colors[i]} />
                    <span>{label}</span>
                  </LegendItem>
                ));
              })()}
            </LegendWrapper>
        </GenBlock>
    )
}

export default ModelDisplay;
