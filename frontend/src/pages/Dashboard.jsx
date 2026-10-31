import { css } from '@emotion/react';
import { Link } from "react-router-dom";
import insertIcon from '../../src/graphics/Dashboard/Initial Menu/insert.svg';
import uploadIcon from '../../src/graphics/Dashboard/Initial Menu/upload.svg';
import searchIcon from '../../src/graphics/Dashboard/Initial Menu/search.svg';

// --- STYLED COMPONENTS ---

const iconBox = css`
  display: flex;
  flex-direction: column;
  align-items: center;
  width: clamp(10rem, 22vw, 12rem);
`;

const imageStyle = css`
  width: clamp(3.2rem, 7vw, 6.5rem);
  height: clamp(3.2rem, 7vw, 6.5rem);
  transition: transform 0.3s ease;
  cursor: pointer;
  border-radius: 50%;
  box-shadow: 0 6px 18px rgba(0, 0, 0, 0.23);
  object-fit: cover;

  &:hover {
    transform: scale(1.1);
  }
`;

const descrFeatures = css`
  margin-top: 1.05rem;
  font-family: "Cascadia Mono", system-ui, sans-serif;
  font-size: 0.9rem;
  text-align: center;
  max-width: 95%;
  min-height: 3rem;
  word-break: break-word;
  user-select: none;
`;

// --- MAIN COMPONENT ---

function Dashboard() {
  return (
    <>
    <div 
      css={css`
        margin-top: 7rem;
      `}
    >
      <div
        css={css`
          margin-top: 4rem;

          @media (max-width: 500px) {
            margin-top: 2.5rem; /* reduce top margin on very small screens */
          }
        `}
      >
        <h1
          css={css`
            font-family: 'Outfit', sans-serif;
            font-size: clamp(1.8rem, 3.5vw, 2.4rem);
            letter-spacing: 0.04em;
            word-spacing: 0.2em;
            text-align: center;
            user-select: none;
          `}
        >
          Inizia una nuova{' '}
          <span css={css`color: #15a497`}>analisi</span>
        </h1>
        <p
          css={css`
            margin: 1rem auto 0;
            max-width: 40rem;
            font-family: system-ui, sans-serif;
            font-size: 1rem;
            color: #4a5568;
            line-height: 1.5;
          `}
        >
          Analisi del rischio da bilancio e verifica dei segnali di crisi previsti dal Codice della crisi
          d&apos;impresa (CCII), con report stampabile per il professionista.
        </p>
      </div>

      <div
        css={css`
          margin-top: 3.7rem;
          display: flex;
          align-items: flex-start;
          justify-content: center;
          gap: clamp(2rem, 5vw, 4rem);
          flex-wrap: wrap;
        `}
      >
        <div css={iconBox}>
          <Link to="/insert-data" aria-label="Inserisci i dati">
            <img
              src={insertIcon}
              alt="Inserisci i dati"
              css={imageStyle}
              role="button" 
              tabIndex={0}
            />
          </Link>
          <p css={descrFeatures}>Inserisci i dati</p>
        </div>

        <div css={iconBox}>
          <Link to="/upload-docs" aria-label="Carica il bilancio">
            <img
              src={uploadIcon}
              alt="Carica il bilancio"
              css={imageStyle}
              role="button"
              tabIndex={0}
            />
          </Link>
          <p css={descrFeatures}>Carica il bilancio<br /><small>PDF o XBRL</small></p>
        </div>

        <div css={iconBox} title="In arrivo">
          <img
            src={searchIcon}
            alt="Cerca sul web (in arrivo)"
            css={[imageStyle, css`opacity: 0.45; cursor: not-allowed; &:hover { transform: none; }`]}
            aria-disabled="true"
          />
          <p css={descrFeatures}>Cerca sul web<br /><small>(in arrivo)</small></p>
        </div>
      </div>
    </div>
    </>
  );
}

export default Dashboard;
