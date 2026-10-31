import styled from '@emotion/styled';
import { useState } from 'react';
import {
  appSectorToCndcec,
  balanceSheetExtraFields,
  cndcecSectors,
  dscrComponentFields,
  legalForms,
  practicalTestFields,
  signalGroups,
} from '../data/crisisConfig.js';
import { makeNumberKeyDownHandler, makePasteHandler, preventWheelChange } from '../utils/numbers.js';

// --- STYLED COMPONENTS ---

const Wrapper = styled.div`
  width: 100%;
  max-width: 800px;
  margin: 0 auto;
  text-align: left;
  font-family: system-ui, sans-serif;
`;

const Intro = styled.p`
  font-size: 0.9rem;
  color: #4a5568;
  line-height: 1.5;
  margin: 0 0 1rem 0;
`;

const Group = styled.details`
  border: 1px solid #e2e8f0;
  border-radius: 12px;
  background: white;
  margin-bottom: 0.9rem;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.03);

  &[open] summary { border-bottom: 1px solid #edf2f7; }
`;

const Summary = styled.summary`
  cursor: pointer;
  padding: 0.9rem 1.2rem;
  font-weight: 600;
  font-size: 1rem;
  color: #1a202c;
  list-style-position: inside;

  span {
    font-weight: 400;
    font-size: 0.8rem;
    color: #718096;
    margin-left: 0.5rem;
  }
`;

const Grid = styled.div`
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 0.9rem 1.4rem;
  padding: 1rem 1.2rem 1.2rem;

  @media (max-width: 720px) {
    grid-template-columns: 1fr;
  }
`;

const Field = styled.label`
  display: flex;
  flex-direction: column;
  gap: 0.3rem;
  font-size: 0.85rem;
  color: #2d3748;
  grid-column: ${p => (p.wide ? '1 / -1' : 'auto')};

  small {
    color: #718096;
    font-size: 0.75rem;
  }
`;

const Input = styled.input`
  background-color: white;
  color: black;
  border: 1px solid #cbd5e0;
  border-radius: 6px;
  padding: 0.55rem 0.7rem;
  font-size: 0.9rem;
  width: 100%;
  box-sizing: border-box;

  &:focus { outline: none; border-color: #15a497; }
  &::-webkit-outer-spin-button,
  &::-webkit-inner-spin-button { -webkit-appearance: none; margin: 0; }
  &[type='number'] { -moz-appearance: textfield; appearance: textfield; }
`;

const Select = styled.select`
  background-color: white;
  color: black;
  border: 1px solid #cbd5e0;
  border-radius: 6px;
  padding: 0.55rem 0.7rem;
  font-size: 0.9rem;
  width: 100%;

  &:focus { outline: none; border-color: #15a497; }
`;

const Toggle = styled.div`
  display: flex;
  gap: 0.5rem;
  grid-column: 1 / -1;
  flex-wrap: wrap;
`;

const ToggleButton = styled.button`
  border-radius: 9999px;
  padding: 0.4rem 0.9rem;
  font-size: 0.8rem;
  border: 1px solid ${p => (p.active ? '#15a497' : '#cbd5e0')};
  background: ${p => (p.active ? '#15a497' : 'white')};
  color: ${p => (p.active ? 'white' : '#4a5568')};
  font-weight: ${p => (p.active ? 600 : 400)};
`;

const SubTitle = styled.div`
  grid-column: 1 / -1;
  font-size: 0.8rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.04em;
  color: #718096;
  margin-top: 0.3rem;
`;

// --- HELPERS ---

const NEGATIVE_ALLOWED = new Set(['dscrOperatingFreeCashFlow', 'annualDebtServiceFlows', 'dscrCashFlow']);

// --- MAIN COMPONENT ---

function CrisisInput({ value, onChange, industrySector, showBalanceSheetExtras = true, balanceSheetHint }) {
  const [dscrMode, setDscrMode] = useState(
    dscrComponentFields.numerator.some(f => value[f.name] !== '' && value[f.name] != null) ? 'components' : 'totals'
  );

  const setField = (name, v) => onChange(name, v);
  const handleChange = (e) => setField(e.target.name, e.target.value);

  const numberInput = (name, extra = {}) => {
    const allowNegative = NEGATIVE_ALLOWED.has(name);
    return (
      <Input
        type="number"
        step="any"
        inputMode="decimal"
        id={`ccii-${name}`}
        name={name}
        value={value[name] ?? ''}
        onChange={handleChange}
        onKeyDown={makeNumberKeyDownHandler(allowNegative)}
        onPaste={makePasteHandler(setField, allowNegative)}
        onWheel={preventWheelChange}
        placeholder="€"
        {...extra}
      />
    );
  };

  const suggestedSector = appSectorToCndcec[industrySector] ?? null;
  const sectorValue = value.cndcecSector || suggestedSector || '';

  return (
    <Wrapper>
      <Intro>
        Verifica dei segnali di crisi previsti dal Codice della crisi d&apos;impresa (D.Lgs. 14/2019). Tutti i campi sono
        facoltativi: ogni verifica viene eseguita solo con i dati disponibili e il risultato indica cosa manca per completarla.
      </Intro>

      <Group open>
        <Summary>Profilo dell&apos;impresa</Summary>
        <Grid>
          <Field htmlFor="ccii-legalForm">
            Forma giuridica
            <Select id="ccii-legalForm" name="legalForm" value={value.legalForm} onChange={handleChange}>
              {legalForms.map(f => <option key={f.value} value={f.value}>{f.label}</option>)}
            </Select>
          </Field>
          <Field htmlFor="ccii-hasEmployees">
            Lavoratori dipendenti o parasubordinati
            <Select id="ccii-hasEmployees" name="hasEmployees" value={value.hasEmployees} onChange={handleChange}>
              <option value="true">Sì</option>
              <option value="false">No</option>
            </Select>
          </Field>
          <Field htmlFor="ccii-cndcecSector" wide>
            Gruppo di settore per gli indici CNDCEC
            <Select id="ccii-cndcecSector" name="cndcecSector" value={sectorValue} onChange={handleChange}>
              <option value="">— Seleziona —</option>
              {cndcecSectors.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
            </Select>
            <small>
              {suggestedSector
                ? 'Proposto in base al settore indicato; modificalo se il codice ATECO rientra in un altro gruppo.'
                : industrySector
                  ? 'Per questo settore la corrispondenza non è automatica: scegli il gruppo in base al codice ATECO.'
                  : 'Seleziona il settore oppure scegli qui il gruppo in base al codice ATECO.'}
            </small>
          </Field>
        </Grid>
      </Group>

      {showBalanceSheetExtras && (
        <Group>
          <Summary>Voci di bilancio per gli indici CNDCEC<span>schemi artt. 2424-2425 c.c.</span></Summary>
          <Grid>
            {balanceSheetHint && <SubTitle style={{ textTransform: 'none', fontWeight: 400 }}>{balanceSheetHint}</SubTitle>}
            {balanceSheetExtraFields.map(f => (
              <Field key={f.name} htmlFor={`ccii-${f.name}`}>
                {f.label}
                {numberInput(f.name)}
              </Field>
            ))}
          </Grid>
        </Group>
      )}

      <Group>
        <Summary>DSCR prospettico<span>flussi attesi / debito in scadenza</span></Summary>
        <Grid>
          <Toggle role="group" aria-label="Orizzonte DSCR">
            {['6', '12'].map(h => (
              <ToggleButton
                key={h}
                type="button"
                active={String(value.dscrHorizonMonths) === h}
                onClick={() => setField('dscrHorizonMonths', h)}
              >
                {h} mesi
              </ToggleButton>
            ))}
            <span style={{ width: '1rem' }} />
            <ToggleButton type="button" active={dscrMode === 'totals'} onClick={() => setDscrMode('totals')}>
              Inserisci i totali
            </ToggleButton>
            <ToggleButton type="button" active={dscrMode === 'components'} onClick={() => setDscrMode('components')}>
              Calcola dalle componenti
            </ToggleButton>
          </Toggle>
          {dscrMode === 'totals' ? (
            <>
              <Field htmlFor="ccii-dscrCashFlow">
                Flussi di cassa al servizio del debito
                {numberInput('dscrCashFlow')}
              </Field>
              <Field htmlFor="ccii-dscrDebtService">
                Servizio del debito in scadenza nello stesso periodo
                {numberInput('dscrDebtService')}
              </Field>
            </>
          ) : (
            <>
              <SubTitle>Numeratore</SubTitle>
              {dscrComponentFields.numerator.map(f => (
                <Field key={f.name} htmlFor={`ccii-${f.name}`}>{f.label}{numberInput(f.name)}</Field>
              ))}
              <SubTitle>Denominatore</SubTitle>
              {dscrComponentFields.denominator.map(f => (
                <Field key={f.name} htmlFor={`ccii-${f.name}`}>{f.label}{numberInput(f.name)}</Field>
              ))}
            </>
          )}
        </Grid>
      </Group>

      {signalGroups.map(group => (
        <Group key={group.title}>
          <Summary>{group.title}</Summary>
          <Grid>
            {group.fields.map(f => (
              <Field key={f.name} htmlFor={`ccii-${f.name}`}>
                {f.label}
                {numberInput(f.name)}
                <small>Fonte: {f.source}</small>
              </Field>
            ))}
          </Grid>
        </Group>
      ))}

      <Group>
        <Summary>Test pratico di risanamento<span>facoltativo</span></Summary>
        <Grid>
          {practicalTestFields.map(f => (
            <Field key={f.name} htmlFor={`ccii-${f.name}`}>
              {f.label}
              {numberInput(f.name)}
              <small>{f.help}</small>
            </Field>
          ))}
        </Grid>
      </Group>
    </Wrapper>
  );
}

export default CrisisInput;
