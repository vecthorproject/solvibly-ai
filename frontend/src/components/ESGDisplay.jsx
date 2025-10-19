import styled from '@emotion/styled';
import { useMemo } from 'react';

// --- STYLED COMPONENTS ---

const GenBlock = styled.div`
  border: 1px solid #f0f0f0;
  border-radius: 12px;
  margin: 1.5rem 2.5rem;
  padding: 1.5rem 2rem;
  background-color: white;
  box-shadow: 0 4px 12px rgba(0,0,0,0.05);
`;

const Row = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
`;

const Title = styled.h4`
  font-family: system-ui, sans-serif;
  font-weight: 600;
  font-size: 1.1rem;
  margin: 0 0 0.75rem 0;
  color: #1a202c;
`;

const RatingPill = styled.span`
  display: inline-block;
  font-family: system-ui, sans-serif;
  font-weight: 600;
  font-size: 0.95rem;
  color: #1a202c;
  background: #e6fffa;
  border: 1px solid #b2f5ea;
  border-radius: 9999px;
  padding: 0.25rem 0.75rem;
  margin: 0.25rem 0 0.75rem 0;
`;

const GaugeWrapper = styled.div`
  position: relative;
  width: 100%;
  margin: 1.5rem 0 2.25rem 0;
`;

const ColorBar = styled.div`
  height: 16px;
  border-radius: 6px;
  background: ${({ stops, logic }) => {
    const colors = { critical: '#F8B4B4', adequate: '#FAF3B6', good: '#B7F0D8' };
    const [s1, s2] = stops;
    const [c1, c2, c3] = logic === 'lower'
      ? [colors.good, colors.adequate, colors.critical]
      : [colors.critical, colors.adequate, colors.good];
    return `linear-gradient(90deg, ${c1} ${s1}%, ${c2} ${s1}% ${s2}%, ${c3} ${s2}%)`;
  }};
`;

const Marker = styled.div`
  position: absolute;
  top: -4px;
  bottom: -4px;
  width: 2px;
  background-color: #2D3748;
  border-radius: 2px;
  left: ${({ position }) => position}%;
  transform: translateX(-50%);
  z-index: 2;
  opacity: 0.77;
`;

const ValueBubble = styled.span`
  position: absolute;
  bottom: 100%;
  margin-bottom: 0.5rem;
  font-weight: 600;
  font-size: 0.85rem;
  font-family: system-ui, sans-serif;
  color: #2D3748;
  left: ${({ position }) => {
    const min = 2, max = 98;
    const safe = Math.max(min, Math.min(max, position));
    return `${safe}%`;
  }};
  transform: translateX(-50%);
  white-space: nowrap;
  opacity: 0.97;
`;

const Labels = styled.div`
  position: absolute;
  top: 8px;
  transform: translateY(-50%);
  left: 0; right: 0;
  display: flex;
  padding: 0 5px;
`;

const GaugeLabel = styled.span`
  font-family: system-ui, sans-serif;
  font-weight: 500;
  font-size: 0.70rem;
  opacity: 0.9;
  position: absolute;
  top: 50%;
  transform: translate(-50%, -50%);
  left: ${({ position }) => position}%;
  color: #4a5361ff;
  text-shadow: 0 0 2px white;
`;

const Thresholds = styled.div`
  position: absolute;
  top: 100%;
  margin-top: 4px;
  left: 0; right: 0; height: 10px;
`;
const ThresholdLabel = styled.span`
  position: absolute;
  font-size: 0.75rem;
  color: #718096;
  transform: translateX(-50%);
  left: ${({ position }) => position}%;
`;

const Sub = styled.span`
  display: block;
  font-family: system-ui, sans-serif;
  font-size: 0.92rem;
  font-weight: 300;
  margin: 0.5rem 0 0.75rem 0;
  text-align: left;
  color: #718096;
`;

const Legend = styled.div`
  display: flex;
  justify-content: flex-end;
  align-items: center;
  gap: 1rem;
  margin-top: 0.5rem;
`;
const LegendItem = styled.div`
  display: flex;
  align-items: center;
  gap: 0.4rem;
  font-size: 0.8rem;
  color: #718096;
`;
const Dot = styled.div`
  width: 10px; height: 10px; border-radius: 50%;
  background-color: ${({ color }) => color};
`;

const ZoneChip = styled.strong`
  background-color: ${({ zone }) =>
    zone === 'Good' ? '#B7F0D8'
    : zone === 'Adequate' ? '#FAF3B6'
    : zone === 'Critical' ? '#F8B4B4'
    : '#E2E8F0'};
  margin: 0.25rem;
  padding: 0.15rem 0.30rem;
  border: 1px solid white;
  border-radius: 8px;
  font-weight: 500;
  font-family: "Sansation", sans-serif;
`;

// --- HELPER FUNCTIONS ---

const isNum = v => typeof v === 'number' && Number.isFinite(v);
const clamp01 = (x, min, max) => (max === min ? 0.5 : (x - min) / (max - min));

function gaugePositions(value, min, max, t1, t2) {
  const pos = Math.max(0, Math.min(100, clamp01(value, min, max)*100));
  const s1  = clamp01(t1,   min, max) * 100;
  const s2  = clamp01(t2,   min, max) * 100;
  return [pos, Math.min(s1, s2), Math.max(s1, s2)];
}

function triLabels(stop1, stop2) {
  return [stop1/2, stop1+(stop2-stop1)/2, stop2+(100-stop2)/2];
}

function classify(v, logic, [t1, t2]) {
  if (!isNum(v)) return 'N/A';
  const lo = Math.min(t1, t2), hi = Math.max(t1, t2);
  if (logic === 'higher') {
    if (v < lo) return 'Critical';
    if (v > hi) return 'Good';
    return 'Adequate';
  }
  if (v > hi) return 'Critical';
  if (v < lo) return 'Good';
  return 'Adequate';
}

// --- SMALL MINI-GAUGE FOR E,S,G ---

function MiniGauge({ label, value, scale=[1,5], thresholds=[3,4], logic='higher' }) {
  const has = isNum(value);
  const [pos, s1, s2] = useMemo(
    () => gaugePositions(has ? value : 0, scale[0], scale[1], thresholds[0], thresholds[1]),
    [value, scale, thresholds]
  );
  const [l1, l2, l3] = useMemo(() => triLabels(s1, s2), [s1, s2]);
  const zone = has ? classify(value, logic, thresholds) : 'N/A';

  return (
    <div style={{ marginTop: '1.25rem' }}>
      <Row>
        <Title>{label}</Title>
        <Title>{has ? String(value) : 'N/A'}</Title>
      </Row>
      <GaugeWrapper>
        {has && (
          <ValueBubble position={pos}>
            {String(Number(value).toFixed(2))}
          </ValueBubble>
        )}
        <ColorBar stops={[s1, s2]} logic={logic} />
        {has && <Marker position={pos} />}
        <Labels>
          <GaugeLabel position={l1}>Critical</GaugeLabel>
          <GaugeLabel position={l2}>Adequate</GaugeLabel>
          <GaugeLabel position={l3}>Good</GaugeLabel>
        </Labels>
        <Thresholds>
          <ThresholdLabel position={s1}>{thresholds[0]}</ThresholdLabel>
          <ThresholdLabel position={s2}>{thresholds[1]}</ThresholdLabel>
        </Thresholds>
      </GaugeWrapper>
      <Sub>Risk Zone: <ZoneChip zone={zone}>{zone}</ZoneChip></Sub>
    </div>
  );
}

// --- MAIN FUNCTION ---

export default function EsgDisplay({
  source,           // 'rating' | 'sliders'
  rating,           // 'AAA' | ...
  scoreE, scoreS, scoreG, // 1–5
  overall           // 0–100
}) {
  const logic = 'higher';
  const overallCfg = { scale: [0,100], thresholds: [50,70] }; // <50 crit, 50–70 adequate, >70 good
  const [pos, s1, s2] = useMemo(
    () => gaugePositions(isNum(overall) ? overall : 0, overallCfg.scale[0], overallCfg.scale[1], ...overallCfg.thresholds),
    [overall]
  );
  const [l1, l2, l3] = useMemo(() => triLabels(s1, s2), [s1, s2]);
  const overallZone = useMemo(
    () => (isNum(overall) ? classify(overall, logic, overallCfg.thresholds) : 'N/A'),
    [overall]
  );

  return (
    <GenBlock>
      {source === 'rating' && rating && (
        <>
          <Title>Official ESG Rating</Title>
          <RatingPill>{rating}</RatingPill>
        </>
      )}

      <Title style={{ marginTop: '0.25rem' }}>ESG Overall</Title>
      <GaugeWrapper>
        {isNum(overall) && (
          <ValueBubble position={pos}>{String(Math.round(Number(overall)))}</ValueBubble>
        )}
        <ColorBar stops={[s1, s2]} logic={logic} />
        {isNum(overall) && <Marker position={pos} />}
        <Labels>
          <GaugeLabel position={l1}>Critical</GaugeLabel>
          <GaugeLabel position={l2}>Adequate</GaugeLabel>
          <GaugeLabel position={l3}>Good</GaugeLabel>
        </Labels>
        <Thresholds>
          <ThresholdLabel position={s1}>{overallCfg.thresholds[0]}</ThresholdLabel>
          <ThresholdLabel position={s2}>{overallCfg.thresholds[1]}</ThresholdLabel>
        </Thresholds>
      </GaugeWrapper>

      <Sub>Risk Zone: <ZoneChip zone={overallZone}>{overallZone}</ZoneChip></Sub>

      {source === 'sliders' && (
        <>
          <MiniGauge label="Environmental (1–5)" value={scoreE} />
          <MiniGauge label="Social (1–5)"        value={scoreS} />
          <MiniGauge label="Governance (1–5)"    value={scoreG} />
        </>
      )}

      <Legend>
        <LegendItem><Dot color="#F8B4B4" /><span>Critical</span></LegendItem>
        <LegendItem><Dot color="#FAF3B6" /><span>Adequate</span></LegendItem>
        <LegendItem><Dot color="#B7F0D8" /><span>Good</span></LegendItem>
      </Legend>
    </GenBlock>
  );
}
