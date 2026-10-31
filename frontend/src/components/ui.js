// Shared building blocks for the account, archive and legal pages.
import styled from '@emotion/styled';
import { Link } from 'react-router-dom';

export const Page = styled.div`
  max-width: 900px;
  margin: 2.5rem auto 4rem;
  padding: 0 1.5rem;
  text-align: left;
  font-family: system-ui, sans-serif;
  color: #2d3748;
  line-height: 1.55;

  h2 {
    font-family: "Cascadia Mono", system-ui, sans-serif;
    color: #15a497;
    font-size: 1.6rem;
    margin: 0 0 1rem 0;
  }
  h3 { font-size: 1.1rem; color: #1a202c; margin: 2rem 0 0.6rem; }
  a { color: #15a497; }
`;

export const Card = styled.section`
  border: 1px solid #edf2f7;
  border-radius: 12px;
  padding: 1.4rem 1.6rem;
  background: white;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);
  margin-bottom: 1.2rem;

  @media (max-width: 720px) {
    padding: 1rem;
  }
`;

export const Button = styled.button`
  background-color: ${p => (p.variant === 'danger' ? '#C53030' : p.variant === 'ghost' ? 'white' : '#15a497')};
  color: ${p => (p.variant === 'ghost' ? '#15a497' : 'white')};
  border: 1px solid ${p => (p.variant === 'danger' ? '#C53030' : '#15a497')};
  border-radius: 8px;
  padding: 0.55rem 1.1rem;
  font-size: 0.9rem;
  font-weight: 600;
  cursor: pointer;

  &:hover:not(:disabled) { filter: brightness(0.95); }
  &:disabled { opacity: 0.6; cursor: not-allowed; }
`;

export const ButtonLink = styled(Link)`
  display: inline-block;
  border: 1px solid #15a497;
  color: #15a497;
  border-radius: 8px;
  padding: 0.5rem 1.1rem;
  font-size: 0.9rem;
  font-weight: 600;
  text-decoration: none;
`;

export const Field = styled.label`
  display: flex;
  flex-direction: column;
  gap: 0.3rem;
  font-size: 0.9rem;
  margin-bottom: 0.9rem;
`;

export const Input = styled.input`
  background: white;
  color: black;
  border: 1px solid #cbd5e0;
  border-radius: 6px;
  padding: 0.6rem 0.7rem;
  font-size: 0.95rem;

  &:focus { outline: none; border-color: #15a497; }
`;

export const ErrorText = styled.p`
  color: #c53030;
  background: #fff5f5;
  border: 1px solid #feb2b2;
  border-radius: 8px;
  padding: 0.6rem 0.8rem;
  font-size: 0.9rem;
`;

export const Muted = styled.p`
  color: #718096;
  font-size: 0.85rem;
  margin: 0.3rem 0;
`;

export const Table = styled.table`
  width: 100%;
  border-collapse: collapse;
  font-size: 0.88rem;

  th, td {
    padding: 0.55rem 0.5rem;
    border-bottom: 1px solid #edf2f7;
    text-align: left;
    vertical-align: middle;
  }
  th {
    font-size: 0.72rem;
    text-transform: uppercase;
    letter-spacing: 0.04em;
    color: #718096;
    font-weight: 600;
  }
  td.num, th.num { text-align: right; font-variant-numeric: tabular-nums; white-space: nowrap; }
  tr { break-inside: avoid; }
`;

export const TableWrap = styled.div`
  overflow-x: auto;
`;

export const Chip = styled.span`
  display: inline-block;
  white-space: nowrap;
  padding: 0.15rem 0.55rem;
  border-radius: 9999px;
  font-size: 0.75rem;
  font-weight: 600;
  background: ${p => p.bg || '#E2E8F0'};
  color: ${p => p.fg || '#2D3748'};
  -webkit-print-color-adjust: exact;
  print-color-adjust: exact;
`;
