import styled from '@emotion/styled';
import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router";
import { useDropzone } from 'react-dropzone';
import axios from 'axios';

import { industrySectors } from '../data/DictOb.js'; 
import uploadDocsIcon from '../graphics/UploadDocs/uploadfindocsicon.svg';
import pdfIcon from '../graphics/UploadDocs/pdficon.svg';
import sendIcon from '../graphics/UploadDocs/sendicon.svg';
import aiIcon from '../graphics/UploadDocs/aiicon.svg';

// --- STYLED COMPONENTS ---

const UploadPanelWrapper = styled.div`
  display: flex;
  flex-direction: column;
  gap: 2rem;
  max-width: 60rem;
  margin: 2.6rem auto;
  align-items: center;
  padding: 2rem;
  border-radius: 16px;
  background-color: #F0FAFA;
  border: 1px solid #E2E8F0;
  box-shadow: 0 8px 16px rgba(0,0,0,0.05);
  position: relative;
`;

const LoadingOverlay = styled.div`
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(255, 255, 255, 0.7);
  z-index: 10;
  display: flex;
  justify-content: center;
  align-items: center;
  border-radius: 16px;
  opacity: ${props => props.isLoading ? 1 : 0};
  visibility: ${props => props.isLoading ? 'visible' : 'hidden'};
  transition: all 0.3s ease-in-out;
`;

const SelectorGroup = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.5rem;
`;

const OptionsContainer = styled.div`
  display: flex;
`;

const SectionLabel = styled.h4`
  font-family: system-ui, sans-serif;
  font-weight: 500;
  font-size: 0.9rem;
  color: #4A5568;
  margin-bottom: 0.5rem;
  text-transform: uppercase;
  letter-spacing: 0.05em;
`;

const StyledRadioButton = styled.label`
  display: inline-block;
  padding: 0.6rem 1.2rem;
  margin: 0.25rem;
  border: 1px solid #d1d5db;
  border-radius: 9999px;
  cursor: pointer;
  transition: all 0.2s ease-in-out;
  font-family: system-ui, sans-serif;
  font-size: 0.9rem;
  
  input[type="radio"] {
    display: none;
  }

  background-color: ${props => props.checked ? '#15a497' : '#ffffff'};
  color: ${props => props.checked ? 'white' : '#4a5568'};
  border-color: ${props => props.checked ? '#15a497' : '#d1d5db'};
  font-weight: ${props => props.checked ? '600' : 'normal'};
`;

const StyledSelect = styled.select`
  background-color: white;
  color: black;
  border: 1px solid #d1d5db;
  border-radius: 8px;
  padding: 0.6rem 1rem;
  width: 220px;
  box-sizing: border-box;
  font-family: system-ui, sans-serif;
  font-size: 0.9rem;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;

  &:focus {
    outline: none;
    border-color: #15a497;
  }
`;

const SelectorsContainer = styled.div`
  margin: 0;
  display: flex;
  flex-direction: row;
  gap: 4rem;
  padding: 1rem 2rem;
  border-radius: 12px;
  align-items: flex-start;
`;

const UploadDocContainer = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 3rem;
  width: 100%;
  min-height: 20rem;
  border: 2px dashed ${props => props.isDragActive ? '#15a497' : '#d1d5db'};
  border-radius: 12px;
  background-color: ${props => props.isDragActive ? '#E6FFFA' : '#f8f9fb'};
  transition: all 0.2s ease-in-out;

  &:hover {
    cursor: pointer;
    border-color: #b8bcc2;
    box-shadow: 0 2px 6px rgba(0,0,0,0.08);
  }
`;

const SquareDocContainer = styled.div`
  margin: 0 auto;
  padding: 0;
  width: 9rem;
  height: 9rem;
  border: 2px dashed #b8bcc2;
  border-radius: 12px;
  display: flex;             
  justify-content: center;   
  align-items: center;       
`;

const UploadDocIcon = styled.img`
  margin: 0 auto;
  padding: 0;
  width: 6rem;
  height: 6rem;
`;

const StyledSubText = styled.p`
  color: #4a5568;
  opacity: 0.85;
  text-align: center;
  font-family: system-ui, sans-serif;
  font-size: 0.8rem;
  margin-top: 1.6rem;
  text-wrap: nowrap;
`;

const DocsIconsContainer = styled.div`
  margin: 0.6rem 0 1.2rem 0;
  display: flex;
  flex-direction: row;
  gap: 1.22rem;
`;

const StyledDocsIcon = styled.img`
  max-width: 2.45rem;
  opacity: 0.95;
`;

const StyledDocsIconAI = styled.img`
  max-width: 2.6rem;
  margin-left: -0.21rem;
  opacity: 0.95;
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
  max-height: ${props => props.visible ? '100px' : '0'};
  padding: ${props => props.visible ? '1rem' : '0 1rem'};
  margin-top: ${props => props.visible ? '1rem' : '0'};
  transition: all 0.5s ease-in-out;
`;

const LoadingFeedbackWrapper = styled.div`
  position: relative;
  z-index: 20;
  width: 100%;
  display: flex;
  flex-direction: column;
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
  margin-top: 15px;
  margin-bottom: 10px;
  width: 80%;
  transition: background-color 0.2s;

  &:hover {
    background-color: #118a7e;
  }
  
  &:disabled {
    background-color: #a0aec0;
    cursor: not-allowed;
  }
`;

const FilePreviewContainer = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.5rem;
  background-color: white;
  border: 1px solid #e2e8f0;
  border-radius: 12px;  
  padding: 2rem;
  width: 50%;
  box-shadow: 0 4px 12px rgba(0,0,0,0.05);
  transition: all 0.2s ease-in-out;
`;

const FilePreview = styled.div`
  font-family: system-ui, sans-serif;
  font-size: 0.9rem;
  color: #2D3748;
  font-weight: 500;
  text-wrap: nowrap;
  margin-bottom: 1.1rem;
`;

const FilePreviewTitle = styled.p`
  font-family: system-ui, sans-serif;
  font-weight: 400;
  font-style: italic;
  font-size: 0.71rem;
  width: 10rem;        
  margin: 0.18rem auto 0;
  text-align: center;
  white-space: nowrap;  
  overflow: hidden;  
  text-overflow: ellipsis; 
`;

const ProgressBarContainer = styled.div`
  width: 80%;
  height: 10px;
  background-color: #e2e8f0;
  border-radius: 5px;
  margin-top: 1rem;
  overflow: hidden;
`;

const ProgressBarFill = styled.div`
  height: 100%;
  width: ${props => props.progress}%;
  background-color: #15a497;
  border-radius: 5px;
  transition: width 0.4s ease-in-out;
`;

const OptionalSectionLabel = styled.h4`
  font-family: system-ui, sans-serif;
  font-weight: 500;
  font-size: 0.9rem;
  color: #4A5568;
  letter-spacing: 0.05em;
  width: 100%;
  border-top: 1px solid #e2e8f0;
  padding-top: 1.5rem;
`;

const StyledOptionalInput = styled.input`
  background-color: white;
  color: black;
  border: 1px solid #d1d5db;
  border-radius: 8px;
  padding: 0.6rem 1rem;
  width: 220px;
  box-sizing: border-box;
  font-family: system-ui, sans-serif;
  font-size: 0.9rem;
  margin: 0 0.25rem 0.5rem 0.25rem;

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
  }
`;

const OptionalBadgePanel = styled.span`
  font-size: 0.79rem;
  font-weight: 400;
  font-style: italic;
  color: #718096;
  margin-left: 0.75rem;
  vertical-align: middle;
`;

// --- DATA FOR SELECTIONS ---

const countryChoice = [{value: "usa", label: "USA"}, {value: "italy", label: "Italia"}]
const companyType = [{value: "public", label: "Public"}, {value: "private", label: "Private"}]

// --- MAIN COMPONENT ---

function UploadYourDocsPanel() {
    const navigate = useNavigate();
    
    const [selectedCountry, setSelectedCountry] = useState("usa");
    const [selectedType, setSelectedType] = useState("private");
    const [selectedSector, setSelectedSector] = useState("");

    const [dscrCashFlow, setDscrCashFlow] = useState("");
    const [dscrDebtService, setDscrDebtService] = useState("");

    const [uploadError, setUploadError] = useState(null);
    const [errorVisible, setErrorVisible] = useState(false);
    const [uploadedFile, setUploadedFile] = useState(null);
    
    const [isLoading, setIsLoading] = useState(false);
    const [uploadProgress, setUploadProgress] = useState(0);
    const [isAnalyzing, setIsAnalyzing] = useState(false);

    const intervalRef = useRef(null);

    useEffect(() => {
        setSelectedSector("");
    }, [selectedCountry]);

    useEffect(() => {
      let visibilityTimer;
      let removalTimer;
      if (uploadError) {
        setErrorVisible(true);
        visibilityTimer = setTimeout(() => {
          setErrorVisible(false);
        }, 4500);
        removalTimer = setTimeout(() => {
          setUploadError(null);
        }, 5000);
      }
      return () => {
        clearTimeout(visibilityTimer);
        clearTimeout(removalTimer);
      };
    }, [uploadError]);

    const onDrop = (acceptedFiles, rejectedFiles) => {
      if (rejectedFiles && rejectedFiles.length > 0) {
        const firstError = rejectedFiles[0].errors[0];
        if (firstError.code === 'file-too-large') {
          setUploadError(`File is too large. Maximum file size is 10MB.`);
        } else {
          setUploadError("File type not supported. Please upload a valid PDF document.");
        }
        setUploadedFile(null);
      } else {
        setUploadError(null);
        setErrorVisible(false);
        setUploadedFile(acceptedFiles[0]);
      }
    };

    const { getRootProps, getInputProps, isDragActive } = useDropzone({
      accept: {
        'application/pdf': ['.pdf']
      },
      onDrop,
      multiple: false,
      disabled: isLoading,
      maxSize: 10485760, 
    });


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

    const handleUpload = async () => {
      if (!uploadedFile || !selectedSector) {
        setUploadError("Please select the Country of Operation, choose a Company Type, and upload a PDF file to continue.");
        return;
      }

      const formData = new FormData();
      formData.append('document', uploadedFile);
      formData.append('country', selectedCountry);
      formData.append('companyType', selectedType);
      formData.append('industrySector', selectedSector);
      formData.append('dscrCashFlow', dscrCashFlow);
      formData.append('dscrDebtService', dscrDebtService);

      setIsLoading(true);
      setUploadProgress(0);
      setIsAnalyzing(false);

      try {
        const response = await axios.post("http://127.0.0.1:5000/api/upload", formData, {
          headers: {
            'Content-Type': 'multipart/form-data'
          },
          onUploadProgress: (progressEvent) => {
            const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total);
            setUploadProgress(Math.min(percentCompleted, 80));

            if (percentCompleted === 100) {
              setIsAnalyzing(true);
              intervalRef.current = setInterval(() => {
                setUploadProgress(prevProgress => {
                  if (prevProgress >= 99) {
                    clearInterval(intervalRef.current);
                    return 99;
                  }
                  return prevProgress + 1;
                });
              }, 400); 
            }
          }
        });
        
        clearInterval(intervalRef.current);
        setUploadProgress(100);
        setTimeout(() => {
            navigate('/results', { state: { results: response.data } });
        }, 500);
        
      } catch (error) {
        console.error("Uploading error:", error);
        setUploadError("An error occurred while uploading the file.");
        setIsLoading(false);
      } finally {
        clearInterval(intervalRef.current);
      }
    };
    
    const countryKey = selectedCountry === 'italy' ? 'Italy' : 'USA';

    return(
        <UploadPanelWrapper>
            <LoadingOverlay isLoading={isLoading} />
            
            <SelectorsContainer>
              <SelectorGroup>
                <SectionLabel>Country of Operation</SectionLabel>
                <OptionsContainer>
                  {countryChoice.map(option => (
                    <StyledRadioButton key={option.value} checked={selectedCountry === option.value}>
                      <input
                        type="radio"
                        id={option.value}
                        name="country"
                        value={option.value}
                        checked={selectedCountry === option.value}
                        onChange={(e) => setSelectedCountry(e.target.value)}
                        required
                        autoComplete="off"
                      />
                      {option.label}
                    </StyledRadioButton>
                  ))}
                </OptionsContainer>
              </SelectorGroup>

              <SelectorGroup>
                <SectionLabel>Company Type</SectionLabel>
                <OptionsContainer>
                  {companyType.map(option => (
                    <StyledRadioButton key={option.value} checked={selectedType === option.value}>
                      <input
                        type="radio"
                        id={option.value}
                        name="companyType"
                        value={option.value}
                        checked={selectedType === option.value}
                        onChange={(e) => setSelectedType(e.target.value)}
                        required
                        autoComplete="off"
                      />
                      {option.label}
                    </StyledRadioButton>
                  ))}
                </OptionsContainer>
              </SelectorGroup>

              <SelectorGroup>
                <SectionLabel>Industry Sector</SectionLabel>
                <StyledSelect 
                  name="industrySector" 
                  value={selectedSector} 
                  onChange={(e) => setSelectedSector(e.target.value)} 
                  autoComplete="off"
                >
                  <option value="">-- Select a Sector --</option>
                  {(industrySectors[countryKey] || []).map(sector => (
                    <option key={sector.value} value={sector.value}>
                      {sector.label}
                    </option>
                  ))}
                </StyledSelect>
              </SelectorGroup>

            </SelectorsContainer>

            <OptionalSectionLabel>PROSPECTIVE DATA (DSCR)<OptionalBadgePanel>*Optional</OptionalBadgePanel></OptionalSectionLabel>
            <div style={{ display: 'flex', gap: '2rem', alignItems: 'center' }}>
              <StyledOptionalInput 
                type="number" 
                name="dscrCashFlow" 
                placeholder="Expected Cash Flow (6m)"
                value={dscrCashFlow}
                onChange={(e) => setDscrCashFlow(e.target.value)}
                onKeyDown={handleNumberInput}
                onPaste={handlePaste}
                onWheel={handleWheel}
              />
              <StyledOptionalInput 
                type="number" 
                name="dscrDebtService" 
                placeholder="Debt Service Due (6m)"
                value={dscrDebtService}
                onChange={(e) => setDscrDebtService(e.target.value)}
                onKeyDown={handleNumberInput}
                onPaste={handlePaste}
                onWheel={handleWheel}
              />
            </div>

            <UploadDocContainer {...getRootProps()} isDragActive={isDragActive}>
              <input {...getInputProps()} />
              {uploadedFile ? (
                <FilePreviewContainer>
                  <FilePreview>Selected file:</FilePreview>
                  <StyledDocsIcon 
                    src={
                      uploadedFile &&
                      pdfIcon
                    }
                    alt="Uploaded file Icon"
                  />
                  <FilePreviewTitle>{uploadedFile.name}</FilePreviewTitle>
                </FilePreviewContainer>
              ) : (
                <>
                  <SquareDocContainer>
                    <UploadDocIcon 
                      src={uploadDocsIcon} 
                      alt="Upload file Icon" 
                      tabIndex={0}
                    />
                  </SquareDocContainer>
                  <StyledSubText>Drag and drop your file here or click to browse...</StyledSubText>
                </>
              )}
            </UploadDocContainer>
            
            {uploadError && <ErrorMessage visible={errorVisible}>{uploadError}</ErrorMessage>}
            
            <DocsIconsContainer>
              <StyledDocsIcon 
                src={pdfIcon} 
                alt="Info PDF Icon" 
              />
              <StyledDocsIcon 
                src={sendIcon} 
                alt="Info send Icon" 
              />
              <StyledDocsIconAI 
                src={aiIcon} 
                alt="Info AI Icon" 
              />
            </DocsIconsContainer>

            <LoadingFeedbackWrapper>
                {isLoading && (
                  <ProgressBarContainer>
                    <ProgressBarFill progress={uploadProgress} />
                  </ProgressBarContainer>
                )}

                <ButtonWrapper>
                  <StyledButton type='button' onClick={handleUpload} disabled={isLoading}>
                      {isLoading ? (isAnalyzing ? 'Analyzing with AI...' : `Uploading... ${uploadProgress}%`) : 'Upload & Analyze'}
                  </StyledButton>
                </ButtonWrapper>
            </LoadingFeedbackWrapper>

        </UploadPanelWrapper>
    )
}

export default UploadYourDocsPanel;
