import { useState, useEffect } from "react";
import { useDropzone } from "react-dropzone";
import styled from "@emotion/styled";

const Backdrop = styled.div`
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.35);
  display: ${p => (p.open ? "flex" : "none")};
  align-items: center;
  justify-content: center;
  z-index: 1000;
`;

const Modal = styled.div`
  width: 680px;
  max-width: 92vw;
  background: #fff;
  border-radius: 16px;
  box-shadow: 0 18px 50px rgba(0, 0, 0, 0.15);
  padding: 32px 28px 28px;
`;

const Title = styled.h3`
  margin: 0 0 14px;
  font-weight: 700;
  color: #0f172a;
  font-size: 1.25rem;
`;

const Subtitle = styled.p`
  margin: 0 0 22px;
  color: #475569;
  font-size: 0.93rem;
  line-height: 1.5;
`;

const Row = styled.div`
  display: flex;
  gap: 18px;
  align-items: center;
  margin: 14px 0 22px;
`;

const Label = styled.label`
  font-size: 0.95rem;
  color: #334155;
  min-width: 220px;
`;

const Input = styled.input`
  background-color: white;
  color: black;
  border: 1px solid #555;
  border-radius: 8px;
  padding: 12px 14px;
  margin: 6px 0 14px;
  width: 365px;
  box-sizing: border-box;

  &:focus {
    outline: none;
    border-color: #15a497;
    box-shadow: 0 0 0 3px rgba(21, 164, 151, 0.12);
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

const InlineLink = styled.button`
  background: none;
  border: 0;
  padding: 0;
  margin: 5px 0 6px 0;
  color: #15a497;
  text-decoration: underline;
  font-size: 0.93rem;
  cursor: pointer;

  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
    text-decoration: none;
  }

  &:focus {
    outline: none;
    box-shadow: none;
  }
`;

const DropArea = styled.div`
  border: 2px dashed ${p => (p.isActive ? "#15a497" : "#cbd5e1")};
  background: ${p => (p.isActive ? "#E6FFFA" : "#f8fafc")};
  border-radius: 14px;
  padding: 24px;
  margin: 5px 0 6px 0;
  cursor: pointer;
  transition: all 0.2s;
  text-align: center;
`;

const FilePill = styled.div`
  margin-top: 14px;
  display: inline-flex;
  align-items: center;
  gap: 10px;
  background: #ecfeff;
  border: 1px solid #a5f3fc;
  color: #064e3b;
  border-radius: 999px;
  padding: 10px 14px;
  font-size: 0.9rem;
`;

const RemoveBtn = styled.button`
  background: transparent;
  border: 0;
  color: #ef4444;
  cursor: pointer;
  font-weight: 600;
`;

const ErrorMsg = styled.div`
  color: #b91c1c;
  background: #fef2f2;
  border: 1px solid #fecaca;
  border-radius: 10px;
  padding: 10px 14px;
  font-size: 0.92rem;
  margin-top: 16px;
`;

const Footer = styled.div`
  display: flex;
  justify-content: flex-end;
  gap: 12px;
  margin-top: 28px;
`;

const Btn = styled.button`
  border: 0;
  border-radius: 10px;
  padding: 12px 18px;
  font-weight: 500;
  font-family: system-ui, sans-serif;
  cursor: pointer;
  background: ${p => (p.variant === "primary" ? "#15a497" : "#e2e8f0")};
  color: ${p => (p.variant === "primary" ? "#fff" : "#0f172a")};
  opacity: ${p => (p.disabled ? 0.6 : 1)};
  transition: all 0.15s ease;
  &:hover {
    filter: brightness(0.98);
  }
`;

export default function PopupPromptModal({
  isOpen,
  isLoading = false,
  onClose,
  onConfirm,
}) {
  const [mode, setMode] = useState("text");
  const [netIncomeTM1, setNetIncomeTM1] = useState("");
  const [previousPdfFile, setPreviousPdfFile] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!isOpen) {
      setMode("text");
      setNetIncomeTM1("");
      setPreviousPdfFile(null);
      setError("");
    }
  }, [isOpen]);

  const handleNumberInput = (e) => {
    if (["e", "E", "+", "-"].includes(e.key)) e.preventDefault();
    if (e.key === "ArrowUp" || e.key === "ArrowDown") e.preventDefault();
  };

  const handlePaste = (e) => {
    const paste = e.clipboardData.getData('text');
    if (!/^\d*\.?\d*$/.test(paste)) e.preventDefault();
  };

  const handleWheel = (e) => {
    e.target.blur();
  };

  const onDropPrev = (acceptedFiles, rejectedFiles) => {
    if (rejectedFiles?.length) {
      const code = rejectedFiles[0]?.errors?.[0]?.code;
      if (code === "file-invalid-type") setError("Only PDF files are allowed.");
      else if (code === "file-too-large") setError("File too large (max 10MB).");
      else setError("File not accepted.");
      setPreviousPdfFile(null);
      return;
    }
    setError("");
    setPreviousPdfFile(acceptedFiles[0]);
  };

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    accept: { "application/pdf": [".pdf"] },
    multiple: false,
    maxSize: 10 * 1024 * 1024,
    onDrop: onDropPrev,
    disabled: isLoading,
  });

  const handleConfirm = () => {
    setError("");
    const hasText = mode === "text" && netIncomeTM1.trim() !== "";
    const hasFile = mode === "file" && previousPdfFile;

    if (!hasText && !hasFile) {
      setError("Please type Net Income (previous year) or upload the previous-year financial statement (PDF).");
      return;
    }

    onConfirm?.({
      netIncome_t_minus_1: hasText ? netIncomeTM1.trim() : undefined,
      previousPdfFile: hasFile ? previousPdfFile : null,
    });
  };

  const handleSkip = () => {
    setError("");
    onConfirm?.({
      netIncome_t_minus_1: undefined,
      previousPdfFile: null,
    });
  };

  return (
    <Backdrop open={isOpen} aria-hidden={!isOpen}>
      <Modal role="dialog" aria-modal="true" aria-labelledby="ohlson-title">
        <Title id="ohlson-title">Also enable Ohlson O-Score analysis?</Title>
        <Subtitle>
          Provide <strong>Net Income (previous year)</strong> or upload the <strong>previous-year financial statement (PDF)</strong>.
          You can also skip this step.
        </Subtitle>

        {mode === "text" ? (
          <>
            <Row>
              <Label htmlFor="ni_tm1">Net Income (previous year)</Label>
              <Input
                id="ni_tm1"
                type="number"
                inputMode="decimal"
                placeholder="e.g., 1250000"
                value={netIncomeTM1}
                onChange={(e) => setNetIncomeTM1(e.target.value)}
                disabled={isLoading}
                onKeyDown={handleNumberInput}
                onPaste={handlePaste}
                onWheel={handleWheel}
              />
            </Row>
            <InlineLink
              type="button"
              onClick={() => { setMode("file"); setNetIncomeTM1(""); setError(""); }}
              disabled={isLoading}
              aria-label="Switch to upload PDF mode"
            >
              or upload previous-year PDF
            </InlineLink>
          </>
        ) : (
          <>
            <DropArea
              {...getRootProps()}
              isActive={isDragActive}
              aria-disabled={isLoading}
              aria-label="Upload previous-year PDF"
            >
              <input {...getInputProps()} />
              {!previousPdfFile && (
                <div>Drag a PDF here (max 10MB) or click to select</div>
              )}
              {previousPdfFile && (
                <FilePill>
                  <span>{previousPdfFile.name}</span>
                  <RemoveBtn
                    type="button"
                    onClick={(e) => { e.stopPropagation(); setPreviousPdfFile(null); }}
                    aria-label="Remove uploaded file"
                  >
                    Remove
                  </RemoveBtn>
                </FilePill>
              )}
            </DropArea>
            <InlineLink
              type="button"
              onClick={() => { setMode("text"); setPreviousPdfFile(null); setError(""); }}
              disabled={isLoading}
              aria-label="Switch to type mode"
            >
              or type Net Income (previous year)
            </InlineLink>
          </>
        )}

        {error && <ErrorMsg role="alert">{error}</ErrorMsg>}

        <Footer>
          <Btn onClick={onClose} disabled={isLoading}>Cancel</Btn>
          <Btn onClick={handleSkip} disabled={isLoading}>Skip & Analyze</Btn>
          <Btn variant="primary" onClick={handleConfirm} disabled={isLoading}>
            {isLoading ? "Processing…" : "Confirm"}
          </Btn>
        </Footer>
      </Modal>
    </Backdrop>
  );
}
