import { useState, useRef, useEffect, useCallback } from "react";

// Styles
const theme = {
  bg: "#FAFAF8",
  surface: "#FFFFFF",
  surfaceAlt: "#F5F4F0",
  border: "#E2E0D8",
  borderFocus: "#2D2A26",
  text: "#1A1917",
  textMuted: "#8C8A82",
  textSecondary: "#5C5A54",
  accent: "#2D5F2E",
  accentHover: "#234A24",
  accentLight: "#E8F0E8",
  danger: "#C44B3F",
  dangerLight: "#FDF0EE",
  radius: "10px",
  radiusSm: "6px",
  shadow: "0 1px 3px rgba(0,0,0,0.06), 0 1px 2px rgba(0,0,0,0.04)",
  shadowMd: "0 4px 12px rgba(0,0,0,0.08)",
  font: "'DM Sans', -apple-system, sans-serif",
  fontMono: "'JetBrains Mono', 'SF Mono', monospace",
};

const styles = {
  wrapper: {
    fontFamily: theme.font,
    color: theme.text,
    maxWidth: 560,
    margin: "0 auto",
    padding: 0,
  },
  card: {
    background: theme.surface,
    border: `1px solid ${theme.border}`,
    borderRadius: theme.radius,
    padding: "28px 28px 24px",
    boxShadow: theme.shadow,
  },
  title: {
    fontSize: 20,
    fontWeight: 700,
    letterSpacing: "-0.02em",
    margin: "0 0 4px",
    color: theme.text,
  },
  subtitle: {
    fontSize: 14,
    color: theme.textMuted,
    margin: "0 0 24px",
    lineHeight: 1.5,
  },
  tabRow: {
    display: "flex",
    gap: 6,
    marginBottom: 20,
    background: theme.surfaceAlt,
    borderRadius: theme.radiusSm,
    padding: 3,
  },
  tab: (active) => ({
    flex: 1,
    padding: "9px 0",
    fontSize: 13,
    fontWeight: 600,
    fontFamily: theme.font,
    border: "none",
    borderRadius: "4px",
    cursor: "pointer",
    transition: "all 0.15s ease",
    background: active ? theme.surface : "transparent",
    color: active ? theme.text : theme.textMuted,
    boxShadow: active ? "0 1px 3px rgba(0,0,0,0.08)" : "none",
  }),
  canvasWrap: {
    position: "relative",
    border: `1.5px dashed ${theme.border}`,
    borderRadius: theme.radiusSm,
    overflow: "hidden",
    marginBottom: 12,
    background: theme.surface,
  },
  canvas: {
    display: "block",
    width: "100%",
    height: 160,
    cursor: "crosshair",
    touchAction: "none",
  },
  canvasPlaceholder: {
    position: "absolute",
    top: "50%",
    left: "50%",
    transform: "translate(-50%, -50%)",
    fontSize: 13,
    color: theme.textMuted,
    pointerEvents: "none",
    userSelect: "none",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    gap: 6,
  },
  clearBtn: {
    fontSize: 12,
    fontWeight: 600,
    fontFamily: theme.font,
    color: theme.danger,
    background: theme.dangerLight,
    border: "none",
    borderRadius: theme.radiusSm,
    padding: "6px 14px",
    cursor: "pointer",
    transition: "opacity 0.15s",
  },
  consentBox: {
    display: "flex",
    alignItems: "flex-start",
    gap: 12,
    padding: "14px 16px",
    background: theme.surfaceAlt,
    borderRadius: theme.radiusSm,
    marginBottom: 16,
    cursor: "pointer",
    userSelect: "none",
  },
  checkbox: (checked) => ({
    width: 20,
    height: 20,
    minWidth: 20,
    borderRadius: 4,
    border: `2px solid ${checked ? theme.accent : theme.border}`,
    background: checked ? theme.accent : theme.surface,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    transition: "all 0.15s ease",
    marginTop: 1,
  }),
  consentLabel: {
    fontSize: 13,
    lineHeight: 1.55,
    color: theme.textSecondary,
  },
  submitBtn: (enabled) => ({
    width: "100%",
    padding: "13px 0",
    fontSize: 15,
    fontWeight: 650,
    fontFamily: theme.font,
    border: "none",
    borderRadius: theme.radiusSm,
    cursor: enabled ? "pointer" : "not-allowed",
    background: enabled ? theme.accent : theme.border,
    color: enabled ? "#fff" : theme.textMuted,
    transition: "all 0.2s ease",
    letterSpacing: "-0.01em",
  }),
  stamp: {
    marginTop: 16,
    padding: "12px 16px",
    background: theme.accentLight,
    borderRadius: theme.radiusSm,
    fontSize: 12,
    fontFamily: theme.fontMono,
    color: theme.accent,
    lineHeight: 1.7,
  },
};

// Signature Pad (Canvas)
function SignaturePad({ onSignatureChange }) {
  const canvasRef = useRef(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [hasDrawn, setHasDrawn] = useState(false);

  const getPos = useCallback((e) => {
    const rect = canvasRef.current.getBoundingClientRect();
    const clientX = e.touches ? e.touches[0].clientX : e.clientX;
    const clientY = e.touches ? e.touches[0].clientY : e.clientY;
    const scaleX = canvasRef.current.width / rect.width;
    const scaleY = canvasRef.current.height / rect.height;
    return {
      x: (clientX - rect.left) * scaleX,
      y: (clientY - rect.top) * scaleY,
    };
  }, []);

  useEffect(() => {
    const c = canvasRef.current;
    c.width = c.offsetWidth * 2;
    c.height = c.offsetHeight * 2;
    const ctx = c.getContext("2d");
    ctx.scale(2, 2);
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    ctx.strokeStyle = theme.text;
    ctx.lineWidth = 2;
  }, []);

  const startDraw = useCallback(
    (e) => {
      e.preventDefault();
      setIsDrawing(true);
      const ctx = canvasRef.current.getContext("2d");
      const pos = getPos(e);
      ctx.beginPath();
      ctx.moveTo(pos.x / 2, pos.y / 2);
    },
    [getPos]
  );

  const draw = useCallback(
    (e) => {
      if (!isDrawing) return;
      e.preventDefault();
      const ctx = canvasRef.current.getContext("2d");
      const pos = getPos(e);
      ctx.lineTo(pos.x / 2, pos.y / 2);
      ctx.stroke();
      if (!hasDrawn) setHasDrawn(true);
    },
    [isDrawing, hasDrawn, getPos]
  );

  const endDraw = useCallback(() => {
    setIsDrawing(false);
    if (hasDrawn) {
      onSignatureChange(canvasRef.current.toDataURL("image/png"));
    }
  }, [hasDrawn, onSignatureChange]);

  const clear = useCallback(() => {
    const c = canvasRef.current;
    const ctx = c.getContext("2d");
    ctx.clearRect(0, 0, c.width, c.height);
    setHasDrawn(false);
    onSignatureChange(null);
  }, [onSignatureChange]);

  return (
    <div>
      <div style={styles.canvasWrap}>
        <canvas
          ref={canvasRef}
          style={styles.canvas}
          onMouseDown={startDraw}
          onMouseMove={draw}
          onMouseUp={endDraw}
          onMouseLeave={endDraw}
          onTouchStart={startDraw}
          onTouchMove={draw}
          onTouchEnd={endDraw}
        />
        {!hasDrawn && (
          <div style={styles.canvasPlaceholder}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke={theme.textMuted} strokeWidth="1.5">
              <path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z" />
            </svg>
            <span>Rita din signatur här</span>
          </div>
        )}
      </div>
      {hasDrawn && (
        <div style={{ textAlign: "right" }}>
          <button style={styles.clearBtn} onClick={clear}>Rensa</button>
        </div>
      )}
    </div>
  );
}

function CheckIcon() {
  return (
    <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
      <path d="M2.5 6L5 8.5L9.5 3.5" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export default function GDPRConsent({ userName = "", onComplete, onBack }) {
  const [mode, setMode] = useState("sign");
  const [signature, setSignature] = useState(null);
  const [accepted, setAccepted] = useState(false);
  const [consent, setConsent] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [timestamp, setTimestamp] = useState(null);

  const canSubmit = consent && (mode === "sign" ? signature !== null : accepted);

  const handleSubmit = () => {
    if (!canSubmit) return;
    const now = new Date().toISOString();
    setTimestamp(now);
    setSubmitted(true);
    onComplete?.({
      method: mode === "sign" ? "signature" : "consent_button",
      signatureDataUrl: mode === "sign" ? signature : null,
      timestamp: now,
      userName,
    });
  };

  if (submitted) {
    return (
      <div style={styles.wrapper}>
        <div style={styles.card}>
          <div style={{ textAlign: "center", padding: "12px 0 4px" }}>
            <div style={{
              width: 48, height: 48, borderRadius: "50%",
              background: theme.accentLight,
              display: "inline-flex", alignItems: "center", justifyContent: "center",
              marginBottom: 14,
            }}>
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke={theme.accent} strokeWidth="2.5">
                <path d="M5 12l5 5L20 7" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </div>
            <h2 style={{ ...styles.title, marginBottom: 8 }}>Fullmakt signerad</h2>
            <p style={{ ...styles.subtitle, marginBottom: 0 }}>
              Din fullmakt har registrerats. Vi skickar raderingsbegäran å dina vägnar.
            </p>
          </div>
          <div style={styles.stamp}>
            <div>Metod: {mode === "sign" ? "Handskriven signatur" : "Digitalt samtycke"}</div>
            <div>Tidsstämpel: {timestamp}</div>
            {userName && <div>Namn: {userName}</div>}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={styles.wrapper}>
      <div style={styles.card}>
        <h2 style={styles.title}>Signera fullmakt</h2>
        <p style={styles.subtitle}>
          Ge oss rätt att begära radering av dina personuppgifter enligt GDPR.
        </p>

        <div style={styles.tabRow}>
          <button style={styles.tab(mode === "sign")} onClick={() => setMode("sign")}>
            ✍️ Signatur
          </button>
          <button style={styles.tab(mode === "accept")} onClick={() => setMode("accept")}>
            ✓ Godkänn digitalt
          </button>
        </div>

        {mode === "sign" && <SignaturePad onSignatureChange={setSignature} />}

        {mode === "accept" && (
          <div
            style={{
              ...styles.canvasWrap,
              borderStyle: "solid",
              borderColor: accepted ? theme.accent : theme.border,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              height: 120,
              cursor: "pointer",
              background: accepted ? theme.accentLight : theme.surface,
              transition: "all 0.2s ease",
            }}
            onClick={() => setAccepted(!accepted)}
          >
            <div style={{ textAlign: "center" }}>
              <div style={{
                width: 44, height: 44, borderRadius: "50%",
                border: `2px solid ${accepted ? theme.accent : theme.border}`,
                background: accepted ? theme.accent : "transparent",
                display: "inline-flex", alignItems: "center", justifyContent: "center",
                marginBottom: 8, transition: "all 0.2s ease",
              }}>
                {accepted && (
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.5">
                    <path d="M5 12l5 5L20 7" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                )}
              </div>
              <div style={{ fontSize: 14, fontWeight: 600, color: accepted ? theme.accent : theme.textMuted }}>
                {accepted ? "Godkänt!" : "Tryck för att godkänna"}
              </div>
            </div>
          </div>
        )}

        <div style={{ ...styles.consentBox, marginTop: 16 }} onClick={() => setConsent(!consent)}>
          <div style={styles.checkbox(consent)}>{consent && <CheckIcon />}</div>
          <span style={styles.consentLabel}>
            Jag ger härmed <strong>Privacy Request Manager</strong> fullmakt att å mina vägnar
            begära radering av mina personuppgifter hos personuppgiftsansvariga tjänster i enlighet
            med GDPR artikel 17. Fullmakten gäller i 12 månader och kan när som helst återkallas.
          </span>
        </div>

        <button
          style={styles.submitBtn(canSubmit)}
          onClick={handleSubmit}
          disabled={!canSubmit}
          onMouseEnter={(e) => { if (canSubmit) e.target.style.background = theme.accentHover; }}
          onMouseLeave={(e) => { if (canSubmit) e.target.style.background = theme.accent; }}
        >
          Signera och fortsätt
        </button>

        {onBack && (
          <button
            style={{ ...styles.submitBtn(true), marginTop: 8, background: "transparent", color: theme.textMuted, border: `1px solid ${theme.border}` }}
            onClick={onBack}
          >
            Tillbaka
          </button>
        )}
      </div>
    </div>
  );
}
