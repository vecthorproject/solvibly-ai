/** @jsxImportSource @emotion/react */
import { css } from '@emotion/react';
import styled from '@emotion/styled';
import InsertYourDataForm from "../components/InsertYourDataForm";

const StyledPageTitle = styled.h2`
  margin: 20px;
  color: black;
  text-align: center;
  font-size: 1.75rem;
  font-weight: 300;
  font-family: "Cascadia Mono", system-ui, sans-serif;
`;

function InsertYourData() {
    return(
        <div css={css`margin: 30px;`}>
            <StyledPageTitle>Manually Enter Your Company's Financial Data</StyledPageTitle>
            <InsertYourDataForm />
        </div>
    )
}

export default InsertYourData;