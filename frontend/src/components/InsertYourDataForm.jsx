import { css } from '@emotion/react';
import styled from '@emotion/styled';
import { useState } from "react";
import { useNavigate } from "react-router";
import axios from "axios";

// --- STYLED COMPONENTS ---

const StyledTitle = styled.h2`
  margin: 20px 0;
  font-size: 1.6rem;
  font-family: system-ui, sans-serif;
  color: #15a497;
  text-align: center; // Center titles as well
`;

const StyledLabel = styled.label`
  width: 280px; 
  font-size: 20px;
  font-family: system-ui, sans-serif;
  color: black;
  margin: 10px 30px 10px 0;
  text-align: left; // Align text back to the left
  flex-shrink: 0;
  display: inline-block;
  white-space: nowrap;
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
    border-color: #007bff;
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
  width: 400px;
  display: flex;
  align-items: center;
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
  }
`;

const formWrapperStyle = css`
  display: flex;
  flex-direction: column;
  gap: 1.5rem; /* Increased gap for more vertical space */
  max-width: 800px;
  margin: 0 auto;
`;

const formRowStyle = css`
  display: flex;
  align-items: center;
  justify-content: center; // This centers the label + input group
  width: 100%;
`;

// --- DATA FOR DROPDOWNS ---

const industrySectors = {
  USA: [
    { value: 'agriculture', label: 'Agriculture, Forestry and Fishing' },
    { value: 'mining', label: 'Mining and Quarrying' },
    { value: 'manufacturing', label: 'Manufacturing' },
    { value: 'energy', label: 'Electricity, Gas, Steam and Air Conditioning Supply' },
    { value: 'water_waste', label: 'Water Supply; Sewerage, Waste Management' },
    { value: 'construction', label: 'Construction' },
    { value: 'trade', label: 'Wholesale and Retail Trade' },
    { value: 'transport', label: 'Transportation and Logistics' },
    { value: 'hospitality', label: 'Accommodation and Food Service Activities' },
    { value: 'info_comm', label: 'Information and Communication' },
    { value: 'finance_insurance', label: 'Financial and Insurance Activities' },
    { value: 'real_estate', label: 'Real Estate Activities' },
    { value: 'professional_scientific', label: 'Professional, Scientific and Technical Activities' },
    { value: 'administrative', label: 'Administrative and Support Service Activities' },
    { value: 'public_admin', label: 'Public Administration and Defence' },
    { value: 'education', label: 'Education' },
    { value: 'health_social', label: 'Human Health and Social Work Activities' },
    { value: 'arts_entertainment', label: 'Arts, Entertainment and Recreation' },
    { value: 'other_services', label: 'Other Service Activities' },
  ],
  Italy: [
    { value: 'agriculture', label: 'Agricoltura, Silvicoltura e Pesca' },
    { value: 'mining', label: 'Estrazione di Minerali' },
    { value: 'manufacturing', label: 'Attività Manifatturiere' },
    { value: 'energy', label: 'Fornitura di Energia Elettrica, Gas, Vapore' },
    { value: 'water_waste', label: 'Fornitura Acqua e Gestione Rifiuti' },
    { value: 'construction', label: 'Costruzioni' },
    { value: 'trade', label: 'Commercio all\'Ingrosso e al Dettaglio' },
    { value: 'transport', label: 'Trasporto e Logistica' },
    { value: 'hospitality', label: 'Servizi di Alloggio e Ristorazione' },
    { value: 'info_comm', label: 'Servizi di Informazione e Comunicazione' },
    { value: 'finance_insurance', label: 'Attività Finanziarie e Assicurative' },
    { value: 'real_estate', label: 'Attività Immobiliari' },
    { value: 'professional_scientific', label: 'Attività Professionali, Scientifiche e Tecniche' },
    { value: 'administrative', label: 'Attività Amministrative e di Supporto' },
    { value: 'public_admin', label: 'Amministrazione Pubblica e Difesa' },
    { value: 'education', label: 'Istruzione' },
    { value: 'health_social', label: 'Sanità e Assistenza Sociale' },
    { value: 'arts_entertainment', label: 'Attività Artistiche, Intrattenimento e Divertimento' },
    { value: 'other_services', label: 'Altre Attività di Servizi' },
  ]
};

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
  }
};

// --- REACT COMPONENT ---

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
  });

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    const newValue = type === 'checkbox' ? checked : value;
    
    setFormData(prevState => {
      const newState = {
        ...prevState,
        [name]: newValue
      };

      // If the country is changed, reset the industry sector
      if (name === 'country') {
        newState.industrySector = '';
      }

      return newState;
    });
  };
  
  const currentLabels = labels[formData.country];

  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: 11 }, (_, i) => currentYear - i);

  const handleSubmit = async (e) => {
  e.preventDefault(); // No reloading
  try {
    const response = await axios.post("http://127.0.0.1:5000/api/predict", formData, {
      headers: { "Content-Type": "application/json" }
    });
    navigate('/results', { state: { results: response.data } });
  } catch (error) {
    console.error("Sending error:", error);
  }
};

  return (
    <form onSubmit={handleSubmit} autoComplete="off">
      <div css={formWrapperStyle}>
        
        {/* --- SECTION 1: GENERAL & MARKET DATA --- */}
        <StyledTitle>{currentLabels.title_general}</StyledTitle>

        <div css={formRowStyle}>
          <StyledLabel htmlFor="country">{currentLabels.country}</StyledLabel>
          <StyledSelect id="country" name="country" autoComplete="off" value={formData.country} onChange={handleChange}>
            <option value="USA">United States</option>
            <option value="Italy">Italia</option>
          </StyledSelect>
        </div>

        <div css={formRowStyle}>
          <StyledLabel htmlFor="companyName">{currentLabels.companyName}</StyledLabel>
          <StyledInput type="text" id="companyName" name="companyName" autoComplete="off" value={formData.companyName} onChange={handleChange} />
        </div>

        <div css={formRowStyle}>
          <StyledLabel htmlFor="industrySector">{currentLabels.industrySector}</StyledLabel>
          <StyledSelect id="industrySector" name="industrySector" value={formData.industrySector} onChange={handleChange}>
            <option value="">{currentLabels.selectSector}</option>
            {industrySectors[formData.country].map(sector => (
              <option key={sector.value} value={sector.value}>
                {sector.label}
              </option>
            ))}
          </StyledSelect>
        </div>

        <div css={formRowStyle}>
          <StyledLabel htmlFor="fiscalYear">{currentLabels.fiscalYear}</StyledLabel>
          <StyledSelect id="fiscalYear" name="fiscalYear" value={formData.fiscalYear} onChange={handleChange}>
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
            <StyledInput type="number" id="marketCapitalization" name="marketCapitalization" value={formData.marketCapitalization} onChange={handleChange} />
          </div>
        )}

        {/* --- SECTION 2: INCOME STATEMENT --- */}
        <StyledTitle>{currentLabels.title_incomeStatement}</StyledTitle>
        
        <div css={formRowStyle}>
          <StyledLabel htmlFor="revenue">{currentLabels.revenue}</StyledLabel>
          <StyledInput type="number" id="revenue" name="revenue" value={formData.revenue} onChange={handleChange} />
        </div>
        <div css={formRowStyle}>
          <StyledLabel htmlFor="ebit">{currentLabels.ebit}</StyledLabel>
          <StyledInput type="number" id="ebit" name="ebit" value={formData.ebit} onChange={handleChange} />
        </div>
        <div css={formRowStyle}>
          <StyledLabel htmlFor="netIncome">{currentLabels.netIncome}</StyledLabel>
          <StyledInput type="number" id="netIncome" name="netIncome" value={formData.netIncome} onChange={handleChange} />
        </div>
        <div css={formRowStyle}>
          <StyledLabel htmlFor="depreciationAndAmortization">{currentLabels.depreciationAndAmortization}</StyledLabel>
          <StyledInput type="number" id="depreciationAndAmortization" name="depreciationAndAmortization" value={formData.depreciationAndAmortization} onChange={handleChange} />
        </div>
        <div css={formRowStyle}>
          <StyledLabel htmlFor="interestExpense">{currentLabels.interestExpense}</StyledLabel>
          <StyledInput type="number" id="interestExpense" name="interestExpense" value={formData.interestExpense} onChange={handleChange} />
        </div>

        {/* --- SECTION 3: BALANCE SHEET --- */}
        <StyledTitle>{currentLabels.title_balanceSheet}</StyledTitle>
        
        <div css={formRowStyle}>
          <StyledLabel htmlFor="totalCurrentAssets">{currentLabels.totalCurrentAssets}</StyledLabel>
          <StyledInput type="number" id="totalCurrentAssets" name="totalCurrentAssets" value={formData.totalCurrentAssets} onChange={handleChange} />
        </div>
        <div css={formRowStyle}>
          <StyledLabel htmlFor="inventories">{currentLabels.inventories}</StyledLabel>
          <StyledInput type="number" id="inventories" name="inventories" value={formData.inventories} onChange={handleChange} />
        </div>
        <div css={formRowStyle}>
          <StyledLabel htmlFor="totalNonCurrentAssets">{currentLabels.totalNonCurrentAssets}</StyledLabel>
          <StyledInput type="number" id="totalNonCurrentAssets" name="totalNonCurrentAssets" value={formData.totalNonCurrentAssets} onChange={handleChange} />
        </div>
        <div css={formRowStyle}>
          <StyledLabel htmlFor="tangibleFixedAssets">{currentLabels.tangibleFixedAssets}</StyledLabel>
          <StyledInput type="number" id="tangibleFixedAssets" name="tangibleFixedAssets" value={formData.tangibleFixedAssets} onChange={handleChange} />
        </div>
        <div css={formRowStyle}>
          <StyledLabel htmlFor="totalCurrentLiabilities">{currentLabels.totalCurrentLiabilities}</StyledLabel>
          <StyledInput type="number" id="totalCurrentLiabilities" name="totalCurrentLiabilities" value={formData.totalCurrentLiabilities} onChange={handleChange} />
        </div>
        <div css={formRowStyle}>
          <StyledLabel htmlFor="totalNonCurrentLiabilities">{currentLabels.totalNonCurrentLiabilities}</StyledLabel>
          <StyledInput type="number" id="totalNonCurrentLiabilities" name="totalNonCurrentLiabilities" value={formData.totalNonCurrentLiabilities} onChange={handleChange} />
        </div>
        <div css={formRowStyle}>
          <StyledLabel htmlFor="totalEquity">{currentLabels.totalEquity}</StyledLabel>
          <StyledInput type="number" id="totalEquity" name="totalEquity" value={formData.totalEquity} onChange={handleChange} />
        </div>
        <div css={formRowStyle}>
          <StyledLabel htmlFor="retainedEarnings">{currentLabels.retainedEarnings}</StyledLabel>
          <StyledInput type="number" id="retainedEarnings" name="retainedEarnings" value={formData.retainedEarnings} onChange={handleChange} />
        </div>

        {/* --- SECTION 4: CASH FLOW --- */}
        <StyledTitle>{currentLabels.title_cashFlow}</StyledTitle>

        <div css={formRowStyle}>
          <StyledLabel htmlFor="operatingCashFlow">{currentLabels.operatingCashFlow}</StyledLabel>
          <StyledInput type="number" id="operatingCashFlow" name="operatingCashFlow" value={formData.operatingCashFlow} onChange={handleChange} />
        </div>

        {/* --- SUBMIT BUTTON --- */}
        <ButtonWrapper>
          <StyledButton type="submit">
            Calculate Risk {/* "Calculate ..." to change? */}
          </StyledButton>
        </ButtonWrapper>
      </div>
    </form>
  );
}

export default InsertYourDataForm;