import styled from "@emotion/styled";
import { useState } from "react";

// --- STYLED COMPONENTS ---

const colors = {
  low: "#B7F0D8",
  mid: "#FAF3B6",
  high: "#F8B4B4",
  text: "#1a202c",
  sub: "#718096",
  marker: "#2D3748",
  cardBorder: "#f0f0f0",
};

const Card = styled.div`
  border: 1px solid ${colors.cardBorder};
  border-radius: 12px;
  margin: 1.5rem 2.5rem;
  padding: 1.5rem 2rem;
  background-color: white;
  box-shadow: 0 4px 12px rgba(0,0,0,0.05);
`;

const Header = styled.div`
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: 1rem;
`;

const Title = styled.h4`
  font-family: system-ui, sans-serif;
  font-weight: 600;
  font-size: 1.1rem;
  margin: 0;
  color: ${colors.text};
`;

const BigValue = styled.span`
  font-family: system-ui, sans-serif;
  font-weight: 700;
  font-size: 1.05rem;
  color: ${colors.text};
  background: ${({ zone }) =>
    zone === "Major Risk" ? colors.high :
    zone === "Normal Risk" ? colors.mid  : colors.low};
  padding: 4px 12px;
  border-radius: 10px;
`;

const GaugeWrap = styled.div`
  position: relative;
  width: 100%;
  margin-top: 2.6rem;
  margin-bottom: 1.6rem;
`;

const ColorBar = styled.div`
  height: 16px;
  border-radius: 6px;
  background: ${({ stops }) => {
    const [s1, s2] = stops;
    return `linear-gradient(90deg,
      ${colors.low} 0% ${s1}%,
      ${colors.mid} ${s1}% ${s2}%,
      ${colors.high} ${s2}% 100%)`;
  }};
`;

const Marker = styled.div`
  position: absolute;
  top: -4px; bottom: -4px;
  width: 2px;
  background: ${colors.marker};
  border-radius: 2px;
  left: ${({ pos }) => pos}%;
  transform: translateX(-50%);
  opacity: .77;
  z-index: 2;
`;

const MarkerLabel = styled.span`
  position: absolute;
  bottom: 100%;
  margin-bottom: 0.45rem;
  left: ${({ pos }) => `${Math.max(2, Math.min(98, pos))}%`};
  transform: translateX(-50%);
  font-weight: 600;
  font-size: 0.85rem;
  color: ${colors.text};
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

const GaugeLabel = styled.span`
  position: absolute;
  top: 50%;
  transform: translate(-50%, -50%);
  left: ${({ pos }) => pos}%;
  font-family: system-ui, sans-serif;
  font-weight: 500;
  font-size: 0.70rem;
  opacity: 0.9;
  color: #4a5361ff;
  text-shadow: 0 0 2px white;
`;

const ThresholdsWrapper = styled.div`
  position: absolute;
  top: 100%;
  margin-top: 6px;
  left: 0;
  right: 0;
  height: 10px;
`;

const ThresholdLabel = styled.span`
  position: absolute;
  font-size: 0.75rem;
  color: ${colors.sub};
  transform: translateX(-50%);
  left: ${({ pos }) => pos}%;
`;

const LegendWrapper = styled.div`
  display: flex;
  justify-content: flex-end;
  align-items: center;
  gap: 1rem;
  margin-top: 1.5rem;
`;

const LegendItem = styled.div`
  display: flex;
  align-items: center;
  gap: 0.4rem;
  font-size: 0.8rem;
  color: ${colors.sub};
`;

const LegendDot = styled.div`
  width: 10px; height: 10px; border-radius: 50%;
  background-color: ${({ color }) => color};
`;

const LearnMoreBtn = styled.button`
  display: block;
  color: #15a497;
  font-family: 'Sansation', sans-serif;
  font-size: 0.85rem;
  font-style: italic;
  font-weight: bold;
  padding: 0;
  margin: 2.3rem 0 0.1rem 0;
  background: none;
  text-decoration: underline;
  border: none;
  cursor: pointer;

  outline: none;
  &:focus { outline: none; }
  &:active { outline: none; }
  &::-moz-focus-inner { border: 0; }
  -webkit-tap-highlight-color: transparent;
`;

const DetailsWrapper = styled.div`
  margin-top: 0.75rem;
  padding-top: 1rem;
  padding-right: 6rem;
  border-top: 1px solid #eee;
  font-family: system-ui, sans-serif;
  text-align: left;
  font-size: 0.8rem;
  line-height: 1.6;
  color: #333;
  strong { color: black; }
`;

// --- HELPER FUNCTIONS ---

function pct2(x){ return `${(x*100).toFixed(2)}%`; }
function zoneFromP(p, tLow, tHigh, labels){
  if (p == null || !isFinite(p)) return "N/A";
  if (p < tLow) return labels.low;
  if (p <= tHigh) return labels.mid;
  return labels.high;
}
function labelPositions(s1, s2){
  return [s1/2, s1 + (s2 - s1)/2, s2 + (100 - s2)/2];
}

export default function VecthorIndex({
  value,
  thresholds,
  center = 0.5,
  width = 0.20,
  labels = { low: "Minor Risk", mid: "Normal Risk", high: "Major Risk" },
  title = "Vecthor Index",
  learnMore = {
    significance:
      "Estimated 12-month probability (0%-100%) of financial distress predicted by the calibrated Vecthor ML model. Lower = safer; higher = riskier. The score is comparable across companies and years.",
    notes:
      "Default thresholds: Minor < 40%, Normal 40-60%, Major > 60% (override per country/sector). Model: Random Forest with isotonic calibration, trained with GroupKFold CV and robust feature engineering. Inputs are safely imputed and normalized. Typical uses: early-warning ranking, portfolio triage, watchlist triggers.",
  },
}){
  const clamp01 = (x) => Math.max(0, Math.min(1, x));
  let tLow, tHigh;
  if (Array.isArray(thresholds) && thresholds.length === 2) {
    tLow = thresholds[0]; tHigh = thresholds[1];
  } else {
    tLow  = clamp01(center - width/2);
    tHigh = clamp01(center + width/2);
  }

  const hasValue = typeof value === "number" && isFinite(value);
  const pos   = hasValue ? Math.max(0, Math.min(100, value * 100)) : 0;
  const s1    = tLow * 100, s2 = tHigh * 100;
  const stops = [s1, s2];
  const zone  = hasValue ? zoneFromP(value, tLow, tHigh, labels) : "N/A";
  const [pLow, pMid, pHigh] = labelPositions(s1, s2);
  const [expanded, setExpanded] = useState(false);

// --- MAIN FUNCTION ---

  return (
    <Card>
      <Header>
        <Title>{title}</Title>
        <BigValue zone={zone}>
          {hasValue ? `${pct2(value)} | ${zone}` : "N/A"}
        </BigValue>
      </Header>

      <GaugeWrap>
        <ColorBar stops={stops} />
        {hasValue && <Marker pos={pos} />}
        {hasValue && <MarkerLabel pos={pos}>{pct2(value)}</MarkerLabel>}
        <LabelsWrapper>
          <GaugeLabel pos={pLow}>{labels.low}</GaugeLabel>
          <GaugeLabel pos={pMid}>{labels.mid}</GaugeLabel>
          <GaugeLabel pos={pHigh}>{labels.high}</GaugeLabel>
        </LabelsWrapper>
        <ThresholdsWrapper>
          <ThresholdLabel pos={s1}>{pct2(tLow)}</ThresholdLabel>
          <ThresholdLabel pos={s2}>{pct2(tHigh)}</ThresholdLabel>
        </ThresholdsWrapper>
      </GaugeWrap>

      <LearnMoreBtn onClick={() => setExpanded(v => !v)}>
        {expanded ? "Show Less" : "Learn More"}
      </LearnMoreBtn>
      {expanded && (
        <DetailsWrapper>
          <p><strong>Significance:</strong> {learnMore.significance}</p>
          <p><strong>Notes:</strong> {learnMore.notes}</p>
        </DetailsWrapper>
      )}

      <LegendWrapper>
        <LegendItem><LegendDot color={colors.low} /> <span>{labels.low}</span></LegendItem>
        <LegendItem><LegendDot color={colors.mid} /> <span>{labels.mid}</span></LegendItem>
        <LegendItem><LegendDot color={colors.high} /> <span>{labels.high}</span></LegendItem>
      </LegendWrapper>
    </Card>
  );
}
