import { css } from '@emotion/react';
import styled from '@emotion/styled';
import { useState, useEffect } from "react";
import { useDropzone } from 'react-dropzone';
import axios from 'axios';
import uploadDocsIcon from '../graphics/UploadDocs/uploadfindocsicon.svg';
import pdfIcon from '../graphics/UploadDocs/pdficon.svg';
import xlsIcon from '../graphics/UploadDocs/xlsicon.svg';
import csvIcon from '../graphics/UploadDocs/csvicon.svg';
import docIcon from '../graphics/UploadDocs/docicon.svg';

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

const SelectorsContainer = styled.div`
  margin: 0;
  display: flex;
  flex-direction: row;
  gap: 8rem;
  padding: 1rem 2rem;
  border-radius: 12px;
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
  gap: 1.2rem;
`;

const StyledDocsIcon = styled.img`
  width: 2.5rem;
  opacity: 1;
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

const iconMap = {
  pdf:  pdfIcon,
  xls:  xlsIcon,
  xlsx: xlsIcon,
  csv:  csvIcon,
  doc:  docIcon,
  docx: docIcon
};

// --- DATA FOR RADIOS ---

const countryChoice = [{value: "usa", label: "USA"}, {value: "italy", label: "Italia"}]
const companyType = [{value: "public", label: "Public"}, {value: "private", label: "Private"}]

// --- MAIN COMPONENT ---

function UploadYourDocsPanel() {
    const [selectedCountry, setSelectedCountry] = useState("usa")
    const [selectedType, setSelectedType] = useState("private")
    
    const [uploadError, setUploadError] = useState(null);
    const [errorVisible, setErrorVisible] = useState(false);

    const [uploadedFile, setUploadedFile] = useState(null);

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
        setUploadError("File type not supported. Please upload one of the accepted formats.");
        setUploadedFile(null);
      } else {
        setUploadError(null);
        setErrorVisible(false);
        setUploadedFile(acceptedFiles[0]);
      }
    };

    const { getRootProps, getInputProps, isDragActive } = useDropzone({
      accept: {
        'application/pdf': ['.pdf'],
        'application/vnd.ms-excel': ['.xls'],
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx'],
        'text/csv': ['.csv'],
        'application/msword': ['.doc'],
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx']
      },
      onDrop,
      multiple: false 
    });

    const handleUpload = async () => {
      if (!uploadedFile) {
        setUploadError("Please select a file to upload.");
        return;
      }

      const formData = new FormData();
      formData.append('document', uploadedFile);
      formData.append('country', selectedCountry);
      formData.append('companyType', selectedType);

      try {
        // Loading bar logic here...
        const response = await axios.post("http://127.0.0.1:5000/api/upload", formData, {
          headers: {
            'Content-Type': 'multipart/form-data'
          }
        });

        console.log("Server response:", response.data);
        // Go to results logic here...
        
      } catch (error) {
        console.error("Errore durante l'invio:", error);
        setUploadError("An error occurred while uploading the file.");
      }
    };

    return(
        <UploadPanelWrapper>
            
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
                      />
                      {option.label}
                    </StyledRadioButton>
                  ))}
                </OptionsContainer>
              </SelectorGroup>
            </SelectorsContainer>

            <UploadDocContainer {...getRootProps()} isDragActive={isDragActive}>
              <input {...getInputProps()} />
              {uploadedFile ? ( 
                <>
                <FilePreviewContainer>
                  <FilePreview>Selected file:</FilePreview>
                  <StyledDocsIcon 
                    src={
                      uploadedFile &&
                      iconMap[uploadedFile.name.split('.').pop().toLowerCase()]
                      ? iconMap[uploadedFile.name.split('.').pop().toLowerCase()]
                      : null
                    }
                    alt="Uploaded file Icon"
                  />
                  <FilePreviewTitle>{uploadedFile.name}</FilePreviewTitle>
                </FilePreviewContainer>
                </>
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
                alt="PDF Icon" 
              />
              <StyledDocsIcon 
                src={xlsIcon} 
                alt="XLS Icon" 
              />
              <StyledDocsIcon 
                src={csvIcon} 
                alt="CSV Icon" 
              />
              <StyledDocsIcon 
                src={docIcon} 
                alt="DOC Icon" 
              />
            </DocsIconsContainer>

            <ButtonWrapper>
              <StyledButton type='button' onClick={handleUpload}>
                  Upload & Analyze
              </StyledButton>
            </ButtonWrapper>

        </UploadPanelWrapper>
    )
}

export default UploadYourDocsPanel;
