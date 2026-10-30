import styled from '@emotion/styled';

// --- STYLED COMPONENTS ---

const Page = styled.div`
  max-width: 720px;
  margin: 4rem auto;
  padding: 0 1.5rem;
  font-family: system-ui, sans-serif;
  color: #2d3748;
  line-height: 1.6;

  h2 { font-family: "Cascadia Mono", system-ui, sans-serif; color: #15a497; font-size: 1.6rem; }
`;

// --- MAIN COMPONENT ---

function Pricing() {
  return (
    <Page>
      <h2>Piani</h2>
      <p>
        Solvibly AI è in fase di accesso anticipato per studi professionali e organi di controllo.
        I piani saranno pubblicati a breve.
      </p>
    </Page>
  );
}

export default Pricing;
