import { css } from '@emotion/react';
import styled from '@emotion/styled';
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { industrySectors } from '../data/DictOb';
import EsgInput from './ESGInput.jsx';

// --- STYLED COMPONENTS ---

const StyledTitle = styled.h2`
  margin: 1.3rem 0;
  font-size: 1.6rem;
  font-family: system-ui, sans-serif;
  color: #15a497;
  text-align: center;
`;

const StyledLabel = styled.label`
  width: 280px; 
  font-size: 20px;
  font-family: system-ui, sans-serif;
  color: black;
  margin: 10px 30px 10px 0;
  text-align: left;
  flex-shrink: 0;
  display: inline-block;
  white-space: normal;
  line-height: 1.2;
  cursor: pointer;
  user-select: none;
`;

const StyledInput = styled.input`
  background-color: white;
  color: black;
  border: 1px solid #555;
  border-radius: 5px;
  padding: 10px;
  margin: 10px 0;
  width: 400px;
  box-sizing: border-box;

  &:focus {
    outline: none;
    border-color: #15a497;
  }

  &::-webkit-outer-spin-button,
  &::-webkit-inner-spin-button {
    -webkit-appearance: none;
    margin: 0;
  }
  &[type="number"] {
    -moz-appearance: textfield;
    appearance: textfield;
  }
`;

const StyledSelect = styled.select`
  background-color: white;
  color: black;
  border: 1px solid #555;
  border-radius: 5px;
  padding: 10px;
  margin: 10px 0;
  width: 400px;
  box-sizing: border-box;

  &:focus {
    outline: none;
    border-color: #007bff;
  }
`;

const StyledCheckbox = styled.input`
  width: 20px;
  height: 20px;
  border: 1px solid #555;
`;

const CheckboxWrapper = styled.div`
  display: flex;
  align-items: center;
  gap: 10px;
  width: auto;
  margin: 2rem 0 1.3rem 0;
`;

const ButtonWrapper = styled.div`
  display: flex;
  justify-content: center;
  width: 100%;
`;

const StyledButton = styled.button`
  background-color: #15a497;
  color: white;
  border: none;
  border-radius: 8px;
  padding: 15px 30px;
  font-size: 18px;
  font-weight: bold;
  cursor: pointer;
  margin-top: 30px;
  margin-bottom: 10px;
  width: 80%;
  transition: background-color 0.2s;

  &:hover {
    background-color: #118a7e;
    box-shadow: 0 4px 10px rgba(0, 0, 0, 0.15);
  }
`;

const formWrapperStyle = css`
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
  max-width: 800px;
  margin: 1.3rem auto;
`;

const formRowStyle = css`
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100%;
`;

const OptionalBadgeForm = styled.span`
  font-size: 0.99rem;
  font-weight: 400;
  font-style: italic;
  color: #718096;
  margin-left: 0.75rem;
  vertical-align: middle;
`;

const ErrorMessage = styled.div`
  color: #E53E3E;
  background-color: #FFF5F5;
  border: 1px solid ${props => props.visible ? '#E53E3E' : 'transparent'};
  border-radius: 8px;
  width: 80%;
  text-align: center;
  font-family: system-ui, sans-serif;
  font-size: 0.9rem;
  overflow: hidden;
  opacity: ${props => props.visible ? 1 : 0};
  max-height: ${props => props.visible ? '500px' : '0'};
  padding: ${props => props.visible ? '1rem' : '0 1rem'};
  margin: ${props => props.visible ? '1rem auto 0' : '0 auto'};
  transition: all 0.5s ease-in-out;
`;

// --- LABEL & TITLE DICTIONARY ---

const labels = {
  USA: {
    title_general: 'General & Market Data',
    title_incomeStatement: 'Income Statement Data',
    title_balanceSheet: 'Balance Sheet Data',
    title_cashFlow: 'Cash Flow Statement Data',
    companyName: 'Company Name',
    fiscalYear: 'Fiscal Year',
    country: 'Country of Operation',
    industrySector: 'Industry / Sector',
    selectSector: '---',
    isPubliclyListed: 'Is the company publicly listed?',
    marketCapitalization: 'Market Capitalization',
    revenue: 'Revenue',
    ebit: 'EBIT',
    netIncome: 'Net Income',
    depreciationAndAmortization: 'Depreciation & Amortization',
    interestExpense: 'Interest Expense',
    totalCurrentAssets: 'Total Current Assets',
    inventories: 'Inventories',
    totalNonCurrentAssets: 'Total Non-Current Assets',
    tangibleFixedAssets: 'Tangible Fixed Assets',
    totalCurrentLiabilities: 'Total Current Liabilities',
    totalNonCurrentLiabilities: 'Total Non-Current Liabilities',
    totalEquity: "Total Stockholders' Equity",
    retainedEarnings: 'Retained Earnings',
    operatingCashFlow: 'Operating Cash Flow',

    // --- Ohlson section ---
    title_ohlsonOscore: 'Advanced Analysis (Ohlson O-Score)',
    subtitle_ohlsonOscore: 'Also enable Ohlson O-Score analysis?',
    netIncome_t_minus_1: 'Net Income',

    // --- DSCR section ---
    title_dscr: 'Prospective Data (DSCR)',
    dscrCashFlow: 'Expected Operating Cash Flow',
    dscrDebtService: 'Debt Service Due',
    // --- extra labels for parentheses ---
    label_previousYear: '(previous year)',
    label_sixMonths: '(6 months)',

    // --- ESG section ---
    title_esg: 'Sustainability & Governance (ESG)',
  },

  Italy: {
    title_general: 'Dati Anagrafici e di Mercato',
    title_incomeStatement: 'Dati dal Conto Economico',
    title_balanceSheet: 'Dati dallo Stato Patrimoniale',
    title_cashFlow: 'Dati dal Rendiconto Finanziario',
    companyName: 'Nome Azienda',
    fiscalYear: 'Anno Fiscale',
    country: 'Paese di Operatività',
    industrySector: 'Industria / Settore',
    selectSector: '---',
    isPubliclyListed: 'L\'azienda è quotata?',
    marketCapitalization: 'Capitalizzazione di Borsa',
    revenue: 'Ricavi delle vendite',
    ebit: 'Risultato operativo (EBIT)',
    netIncome: 'Utile d\'esercizio',
    depreciationAndAmortization: 'Ammortamenti e svalutazioni',
    interestExpense: 'Oneri finanziari',
    totalCurrentAssets: 'Totale Attivo Circolante',
    inventories: 'Rimanenze',
    totalNonCurrentAssets: 'Totale Immobilizzazioni',
    tangibleFixedAssets: 'Immobilizzazioni materiali',
    totalCurrentLiabilities: 'Totale Passività Correnti',
    totalNonCurrentLiabilities: 'Totale Passività non Correnti',
    totalEquity: 'Patrimonio Netto',
    retainedEarnings: 'Utili non distribuiti / Riserve',
    operatingCashFlow: 'Flusso di cassa operativo',

    // --- Ohlson section ---
    title_ohlsonOscore: 'Analisi Avanzata (Ohlson O-Score)',
    subtitle_ohlsonOscore: 'Abilitare anche analisi Ohlson O-Score?',
    netIncome_t_minus_1: 'Utile d\'esercizio',

    // --- DSCR section ---
    title_dscr: 'Dati Previsionali (DSCR)',
    dscrCashFlow: 'Flusso di cassa operativo atteso',
    dscrDebtService: 'Servizio del debito in scadenza',
    // --- extra labels for parentheses ---
    label_previousYear: '(anno precedente)',
    label_sixMonths: '(6 mesi)',

    // --- ESG section ---
    title_esg: 'Sostenibilità e Governance (ESG)',
  }
};

// --- MAIN COMPONENT ---

function InsertYourDataForm() {
  
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    companyName: '',
    fiscalYear: new Date().getFullYear(),
    country: 'USA',
    industrySector: '',
    isPubliclyListed: false,
    marketCapitalization: '',
    revenue: '',
    ebit: '',
    netIncome: '',
    depreciationAndAmortization: '',
    interestExpense: '',
    totalCurrentAssets: '',
    inventories: '',
    totalNonCurrentAssets: '',
    tangibleFixedAssets: '',
    totalCurrentLiabilities: '',
    totalNonCurrentLiabilities: '',
    totalEquity: '',
    retainedEarnings: '',
    operatingCashFlow: '',
    dscrCashFlow: '',
    dscrDebtService: '',
    enableOhlsonAnalysis: false,
    netIncome_t_minus_1: '',
    totalAssets_t_minus_1: '',
    totalLiabilities_t_minus_1: '',
    esgRating: '',
    esgScore_E: null,
    esgScore_S: null,
    esgScore_G: null
  });

  const [formError, setFormError] = useState(null);
  const [errorVisible, setErrorVisible] = useState(false);

  useEffect(() => {
      let visibilityTimer;
      let removalTimer;
      if (formError) {
          setErrorVisible(true);
          visibilityTimer = setTimeout(() => { setErrorVisible(false); }, 4500);
          removalTimer = setTimeout(() => { setFormError(null); }, 5000);
      } return () => {
          clearTimeout(visibilityTimer);
          clearTimeout(removalTimer);
      };
  }, [formError]);

  const handleNumberInput = (e) => {
    if (["e", "E", "+", "-"].includes(e.key)) {
      e.preventDefault();
    }
    if (e.key === "ArrowUp" || e.key === "ArrowDown") {
      e.preventDefault();
    }
  };

  const handlePaste = (e) => {
    const paste = e.clipboardData.getData('text');
    if (!/^\d*\.?\d*$/.test(paste)) {
      e.preventDefault();
    }
  };

  const handleWheel = (e) => {
    e.target.blur();
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    const newValue = type === 'checkbox' ? checked : value;
    
    setFormData(prevState => {
      const newState = {
        ...prevState,
        [name]: newValue
      };

      if (name === 'country') {
        newState.industrySector = '';
      }

      return newState;
    });
  };
  
  const currentLabels = labels[formData.country];

  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: 11 }, (_, i) => currentYear - i);

  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      const response = await axios.post("http://127.0.0.1:5000/api/predict", formData, {
        headers: { "Content-Type": "application/json" }
      });      
      navigate('/results', { state: { results: response.data } });
    } catch (error) {
      console.error("Sending error:", error);
      setFormError("An error occurred while sending the data.");
      setIsLoading(false);
    }
  };

  const handleEsgChange = (esgData) => {
    setFormData(prevState => ({
      ...prevState,
      ...esgData
    }));
  };

  return (
    <form onSubmit={handleSubmit} autoComplete="off">
      <div css={formWrapperStyle}>
        
        {/* --- SECTION 1: GENERAL & MARKET DATA --- */}
        <StyledTitle>{currentLabels.title_general}</StyledTitle>

        <div css={formRowStyle}>
          <StyledLabel htmlFor="country">{currentLabels.country}</StyledLabel>
          <StyledSelect id="country" name="country" required autoComplete="off" value={formData.country} onChange={handleChange}>
            <option value="USA">United States</option>
            <option value="Italy">Italia</option>
          </StyledSelect>
        </div>

        <div css={formRowStyle}>
          <StyledLabel htmlFor="companyName">{currentLabels.companyName}</StyledLabel>
          <StyledInput type="text" id="companyName" name="companyName" required autoComplete="off" value={formData.companyName} onChange={handleChange} />
        </div>

        <div css={formRowStyle}>
          <StyledLabel htmlFor="industrySector">{currentLabels.industrySector}</StyledLabel>
          <StyledSelect id="industrySector" name="industrySector" value={formData.industrySector} onChange={handleChange}>
            <option value="">{currentLabels.selectSector}</option>
            {industrySectors[formData.country]?.map(sector => (
              <option key={sector.value} value={sector.value}>
                {sector.label}
              </option>
            ))}
          </StyledSelect>
        </div>

        <div css={formRowStyle}>
          <StyledLabel htmlFor="fiscalYear">{currentLabels.fiscalYear}</StyledLabel>
          <StyledSelect id="fiscalYear" name="fiscalYear" required value={formData.fiscalYear} onChange={handleChange}>
            {years.map(year => (
              <option key={year} value={year}>
                {year}
              </option>
            ))}
          </StyledSelect>
        </div>

        <div css={formRowStyle}>
          <StyledLabel htmlFor="isPubliclyListed">{currentLabels.isPubliclyListed}</StyledLabel>
          <CheckboxWrapper>
            <StyledCheckbox type="checkbox" id="isPubliclyListed" name="isPubliclyListed" checked={formData.isPubliclyListed} onChange={handleChange} />
          </CheckboxWrapper>
        </div>

        {formData.isPubliclyListed && (
          <div css={formRowStyle}>
            <StyledLabel htmlFor="marketCapitalization">{currentLabels.marketCapitalization}</StyledLabel>
            <StyledInput type="number" id="marketCapitalization" name="marketCapitalization" value={formData.marketCapitalization} onChange={handleChange} onKeyDown={handleNumberInput} onPaste={handlePaste} onWheel={handleWheel} />
          </div>
        )}

        {/* --- SECTION 2: INCOME STATEMENT --- */}
        <StyledTitle>{currentLabels.title_incomeStatement}</StyledTitle>
        
        <div css={formRowStyle}>
          <StyledLabel htmlFor="revenue">{currentLabels.revenue}</StyledLabel>
          <StyledInput type="number" id="revenue" name="revenue" required value={formData.revenue} onChange={handleChange} onKeyDown={handleNumberInput} onPaste={handlePaste} onWheel={handleWheel} />
        </div>
        <div css={formRowStyle}>
          <StyledLabel htmlFor="ebit">{currentLabels.ebit}</StyledLabel>
          <StyledInput type="number" id="ebit" name="ebit" required value={formData.ebit} onChange={handleChange} onKeyDown={handleNumberInput} onPaste={handlePaste} onWheel={handleWheel} />
        </div>
        <div css={formRowStyle}>
          <StyledLabel htmlFor="netIncome">{currentLabels.netIncome}</StyledLabel>
          <StyledInput type="number" id="netIncome" name="netIncome" required value={formData.netIncome} onChange={handleChange} onKeyDown={handleNumberInput} onPaste={handlePaste} onWheel={handleWheel} />
        </div>
        <div css={formRowStyle}>
          <StyledLabel htmlFor="depreciationAndAmortization">{currentLabels.depreciationAndAmortization}</StyledLabel>
          <StyledInput type="number" id="depreciationAndAmortization" required name="depreciationAndAmortization" value={formData.depreciationAndAmortization} onChange={handleChange} onKeyDown={handleNumberInput} onPaste={handlePaste} onWheel={handleWheel} />
        </div>
        <div css={formRowStyle}>
          <StyledLabel htmlFor="interestExpense">{currentLabels.interestExpense}</StyledLabel>
          <StyledInput type="number" id="interestExpense" required name="interestExpense" value={formData.interestExpense} onChange={handleChange} onKeyDown={handleNumberInput} onPaste={handlePaste} onWheel={handleWheel} />
        </div>

        {/* --- SECTION 3: BALANCE SHEET --- */}
        <StyledTitle>{currentLabels.title_balanceSheet}</StyledTitle>
        
        <div css={formRowStyle}>
          <StyledLabel htmlFor="totalCurrentAssets">{currentLabels.totalCurrentAssets}</StyledLabel>
          <StyledInput type="number" id="totalCurrentAssets" name="totalCurrentAssets" required value={formData.totalCurrentAssets} onChange={handleChange} onKeyDown={handleNumberInput} onPaste={handlePaste} onWheel={handleWheel} />
        </div>
        <div css={formRowStyle}>
          <StyledLabel htmlFor="inventories">{currentLabels.inventories}</StyledLabel>
          <StyledInput type="number" id="inventories" name="inventories" required value={formData.inventories} onChange={handleChange} onKeyDown={handleNumberInput} onPaste={handlePaste} onWheel={handleWheel} />
        </div>
        <div css={formRowStyle}>
          <StyledLabel htmlFor="totalNonCurrentAssets">{currentLabels.totalNonCurrentAssets}</StyledLabel>
          <StyledInput type="number" id="totalNonCurrentAssets" name="totalNonCurrentAssets" required value={formData.totalNonCurrentAssets} onChange={handleChange} onKeyDown={handleNumberInput} onPaste={handlePaste} onWheel={handleWheel} />
        </div>
        <div css={formRowStyle}>
          <StyledLabel htmlFor="tangibleFixedAssets">{currentLabels.tangibleFixedAssets}</StyledLabel>
          <StyledInput type="number" id="tangibleFixedAssets" name="tangibleFixedAssets" required value={formData.tangibleFixedAssets} onChange={handleChange} onKeyDown={handleNumberInput} onPaste={handlePaste} onWheel={handleWheel} />
        </div>
        <div css={formRowStyle}>
          <StyledLabel htmlFor="totalCurrentLiabilities">{currentLabels.totalCurrentLiabilities}</StyledLabel>
          <StyledInput type="number" id="totalCurrentLiabilities" name="totalCurrentLiabilities" required value={formData.totalCurrentLiabilities} onChange={handleChange} onKeyDown={handleNumberInput} onPaste={handlePaste} onWheel={handleWheel} />
        </div>
        <div css={formRowStyle}>
          <StyledLabel htmlFor="totalNonCurrentLiabilities">{currentLabels.totalNonCurrentLiabilities}</StyledLabel>
          <StyledInput type="number" id="totalNonCurrentLiabilities" name="totalNonCurrentLiabilities" required value={formData.totalNonCurrentLiabilities} onChange={handleChange} onKeyDown={handleNumberInput} onPaste={handlePaste} onWheel={handleWheel} />
        </div>
        <div css={formRowStyle}>
          <StyledLabel htmlFor="totalEquity">{currentLabels.totalEquity}</StyledLabel>
          <StyledInput type="number" id="totalEquity" name="totalEquity" required value={formData.totalEquity} onChange={handleChange} onKeyDown={handleNumberInput} onPaste={handlePaste} onWheel={handleWheel} />
        </div>
        <div css={formRowStyle}>
          <StyledLabel htmlFor="retainedEarnings">{currentLabels.retainedEarnings}</StyledLabel>
          <StyledInput type="number" id="retainedEarnings" name="retainedEarnings" required value={formData.retainedEarnings} onChange={handleChange} onKeyDown={handleNumberInput} onPaste={handlePaste} onWheel={handleWheel} />
        </div>

        {/* --- SECTION 4: CASH FLOW --- */}
        <StyledTitle>{currentLabels.title_cashFlow}</StyledTitle>

        <div css={formRowStyle}>
          <StyledLabel htmlFor="operatingCashFlow">{currentLabels.operatingCashFlow}</StyledLabel>
          <StyledInput type="number" id="operatingCashFlow" name="operatingCashFlow" required value={formData.operatingCashFlow} onChange={handleChange} onKeyDown={handleNumberInput} onPaste={handlePaste} onWheel={handleWheel} />
        </div>

        {/* --- SECTION 5: OHLSON O-SCORE (OPTIONAL) --- */}
        <div css={formRowStyle}>
          <StyledLabel htmlFor="enableOhlsonAnalysis" style={{ whiteSpace: 'nowrap', width: '340px' }}>
            {currentLabels.subtitle_ohlsonOscore}
          </StyledLabel>
          <CheckboxWrapper>
            <StyledCheckbox
              type="checkbox"
              id="enableOhlsonAnalysis"
              name="enableOhlsonAnalysis"
              checked={formData.enableOhlsonAnalysis}
              onChange={handleChange}
            />
          </CheckboxWrapper>
        </div>

        {formData.enableOhlsonAnalysis && (
          <>
            <div css={formRowStyle}>
              <StyledLabel htmlFor="netIncome_t_minus_1">
                {currentLabels.netIncome_t_minus_1} <span style={{ fontSize: '15px' }}>{currentLabels.label_previousYear}</span>
              </StyledLabel>
              <StyledInput 
                type="number" 
                id="netIncome_t_minus_1" 
                name="netIncome_t_minus_1" 
                value={formData.netIncome_t_minus_1} 
                onChange={handleChange} 
                onKeyDown={handleNumberInput} 
                onPaste={handlePaste} 
                onWheel={handleWheel} 
              />
            </div>
          </>
        )}

        {/* --- SECTION 6: DSCR (OPTIONAL) --- */}
        <StyledTitle>
          {currentLabels.title_dscr}
          <OptionalBadgeForm>*Optional</OptionalBadgeForm>
        </StyledTitle>

          <div css={formRowStyle}>
            <StyledLabel htmlFor="dscrCashFlow">
              {currentLabels.dscrCashFlow} <span style={{ fontSize: '15px' }}>{currentLabels.label_sixMonths}</span>
            </StyledLabel>
            <StyledInput 
              type="number" 
              id="dscrCashFlow" 
              name="dscrCashFlow" 
              value={formData.dscrCashFlow} 
              onChange={handleChange} 
              onKeyDown={handleNumberInput} 
              onPaste={handlePaste} 
              onWheel={handleWheel} 
            />
          </div>

          <div css={formRowStyle}>
            <StyledLabel htmlFor="dscrDebtService">
              {currentLabels.dscrDebtService} <span style={{ fontSize: '15px' }}>{currentLabels.label_sixMonths}</span>
            </StyledLabel>
            <StyledInput 
              type="number" 
              id="dscrDebtService" 
              name="dscrDebtService" 
              value={formData.dscrDebtService} 
              onChange={handleChange} 
              onKeyDown={handleNumberInput} 
              onPaste={handlePaste} 
              onWheel={handleWheel} 
            />
          </div>

          {/* --- SECTION 7: ESG (OPTIONAL) --- */}
        <StyledTitle style={{ marginBottom:'0.5rem' }}>{currentLabels.title_esg}<OptionalBadgeForm>*Optional</OptionalBadgeForm></StyledTitle>
        <EsgInput onChange={handleEsgChange} />

        {/* --- SECTION 8: SUBMIT --- */}
        <ButtonWrapper>
          <StyledButton type="submit" disabled={isLoading}>
            {isLoading ? "Calculating..." : "Calculate Risk"}
          </StyledButton>
        </ButtonWrapper>
        {formError && <ErrorMessage visible={errorVisible}>{formError}</ErrorMessage>}
      </div>
    </form>
  );
}

export default InsertYourDataForm;
