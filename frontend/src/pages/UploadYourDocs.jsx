import { css } from '@emotion/react';
import styled from '@emotion/styled';
import UploadYourDocsPanel from '../components/UploadYourDocsPanel';

// --- STYLED COMPONENTS ---

const StyledPageTitle = styled.h2`
  margin: 20px;
  color: black;
  text-align: center;
  font-size: 1.75rem;
  font-weight: 300;
  font-family: "Cascadia Mono", system-ui, sans-serif;
`;

// --- MAIN COMPONENT ---

function UploadYourDocs() {
    return(
        <div css={css`margin: 30px;`}>
            <StyledPageTitle>Upload Your Company's Financial Documents</StyledPageTitle>
            <UploadYourDocsPanel />
        </div>
    )
}

export default UploadYourDocs;
