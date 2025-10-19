import { useState, useEffect } from 'react'; 
import styled from '@emotion/styled';

// --- STYLED COMPONENTS ---

const EsgWrapper = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  width: 100%;
  margin: 0;
  padding: ${props => (props.compact ? '0.25rem 0 0.25rem' : '1rem 0')};
`;

const QuestionLabel = styled.p`
  font-family: system-ui, sans-serif;
  font-size: 1.1rem;
  color: #2D3748;
  margin-bottom: 1rem;
`;

const OptionsContainer = styled.div`
  display: flex;
  gap: 1rem;
  margin-bottom: ${props => (props.compact ? '0.25rem' : '1.5rem')};
`;

const StyledRadioButton = styled.label`
  display: inline-block;
  padding: 0.6rem 1.2rem;
  border: 1px solid #d1d5db;
  border-radius: 9999px;
  cursor: pointer;
  transition: all 0.2s ease-in-out;
  font-family: system-ui, sans-serif;
  font-size: 0.9rem;
  
  input[type="radio"] {
    display: none;
  }

  background-color: ${props => (props.checked ? '#15a497' : '#ffffff')};
  color: ${props => (props.checked ? 'white' : '#4a5568')};
  border-color: ${props => (props.checked ? '#15a497' : '#d1d5db')};
  font-weight: ${props => (props.checked ? '600' : 'normal')};
`;

const InputSection = styled.div`
  width: 70%;
  margin-top: 1rem;
  padding-top: 1rem;
  border-top: 1px solid #e2e8f0;
  display: flex;
  flex-direction: column;
  align-items: center;
`;

const StyledSelect = styled.select`
  background-color: white;
  color: black;
  border: 1px solid #555;
  border-radius: 5px;
  padding: 10px;
  margin: 10px 0;
  width: 100%;
`;

const ScoreGrid = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 1.4rem;
  margin: 0 auto;
  width: 100%;
`;

const ScoreRow = styled.div`
  display: grid;
  grid-template-columns: auto auto auto;
  align-items: center;
  justify-content: center;
  column-gap: 3rem;
  width: fit-content;
`;

const ScoreLabel = styled.label`
  font-size: 1rem;
  color: #333;
  text-align: right;
  min-width: 140px;
`;

const ScoreInput = styled.input`
  width: 100px;
  text-align: center;
  accent-color: #15a497;

  &::-webkit-slider-thumb { background-color: #15a497; }
  &::-moz-range-thumb { background-color: #15a497; }

  &::-webkit-slider-runnable-track { background-color: #c7ede8; }
  &::-moz-range-track { background-color: #c7ede8; }
`;

const ratingOptions = ['AAA', 'AA', 'A', 'BBB', 'BB', 'B', 'CCC', 'CC', 'C'];

// --- COMPONENT ---

function EsgInput({ onChange }) {
  const [hasOfficialRating, setHasOfficialRating] = useState('skip');
  const [officialRating, setOfficialRating] = useState('');
  const [scores, setScores] = useState({ E: 3, S: 3, G: 3 });

  useEffect(() => {
    const payload =
      hasOfficialRating === 'yes'
        ? { esgRating: officialRating, esgScore_E: null, esgScore_S: null, esgScore_G: null }
        : hasOfficialRating === 'no'
          ? { esgRating: '', esgScore_E: scores.E, esgScore_S: scores.S, esgScore_G: scores.G }
          : { esgRating: '', esgScore_E: null, esgScore_S: null, esgScore_G: null };

    onChange(payload);
  }, [hasOfficialRating, officialRating, scores]);

  const handleScoreChange = (pillar, value) => {
    setScores(prev => ({ ...prev, [pillar]: parseInt(value, 10) }));
  };

  const isCompact = hasOfficialRating === 'skip';

  return (
    <EsgWrapper compact={isCompact}>
      <QuestionLabel>Does the company have an official ESG rating?</QuestionLabel>

      <OptionsContainer compact={isCompact}>
        <StyledRadioButton checked={hasOfficialRating === 'yes'}>
          <input
            type="radio"
            name="hasRating"
            value="yes"
            onChange={() => setHasOfficialRating('yes')}
          />
          Yes
        </StyledRadioButton>

        <StyledRadioButton checked={hasOfficialRating === 'no'}>
          <input
            type="radio"
            name="hasRating"
            value="no"
            onChange={() => setHasOfficialRating('no')}
          />
          No
        </StyledRadioButton>

        <StyledRadioButton checked={hasOfficialRating === 'skip'}>
          <input
            type="radio"
            name="hasRating"
            value="skip"
            onChange={() => setHasOfficialRating('skip')}
          />
          Skip
        </StyledRadioButton>
      </OptionsContainer>

      {hasOfficialRating === 'yes' && (
        <InputSection>
          <label style={{ fontWeight:'500', fontFamily:'system-ui, sans-serif', margin:'0 0 0.8rem 0' }}>
            OFFICIAL ESG RATING
          </label>
          <StyledSelect
            value={officialRating}
            onChange={(e) => setOfficialRating(e.target.value)}
          >
            <option value="">-- Select Rating --</option>
            {ratingOptions.map(r => (
              <option key={r} value={r}>{r}</option>
            ))}
          </StyledSelect>
        </InputSection>
      )}

      {hasOfficialRating === 'no' && (
        <InputSection>
          <p style={{
            textAlign: 'center',
            fontFamily: 'system-ui',
            fontSize: '0.9rem',
            color: '#4A5568',
            whiteSpace: 'nowrap',
            margin: '0 0 1.3rem 0'
          }}>
            Please rate the company's performance on a scale from 1 (Poor) to 5 (Excellent) for each ESG pillar.
          </p>

          <ScoreGrid>
            <ScoreRow>
              <ScoreLabel>Environmental (E)</ScoreLabel>
              <ScoreInput
                type="range" min="1" max="5"
                value={scores.E}
                onChange={(e) => handleScoreChange('E', e.target.value)}
              />
              <span>{scores.E}</span>
            </ScoreRow>

            <ScoreRow>
              <ScoreLabel>Social (S)</ScoreLabel>
              <ScoreInput
                type="range" min="1" max="5"
                value={scores.S}
                onChange={(e) => handleScoreChange('S', e.target.value)}
              />
              <span>{scores.S}</span>
            </ScoreRow>

            <ScoreRow>
              <ScoreLabel>Governance (G)</ScoreLabel>
              <ScoreInput
                type="range" min="1" max="5"
                value={scores.G}
                onChange={(e) => handleScoreChange('G', e.target.value)}
              />
              <span>{scores.G}</span>
            </ScoreRow>
          </ScoreGrid>
        </InputSection>
      )}
    </EsgWrapper>
  );
}

export default EsgInput;
