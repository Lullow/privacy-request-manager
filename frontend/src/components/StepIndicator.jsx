import { STEP_LABELS } from "../data/sites";

export default function StepIndicator({ current, onNavigate }) {
    return (
        <div style={{ marginBottom: 28 }}>
            <div style={{ display: "flex", gap: 6 }}>
                {STEP_LABELS.map((label, i) => {
                    const stepNum = i + 1;
                    const done = stepNum < current;
                    const active = stepNum === current;
                    const clickable = done;
                    return (
                        <div
                            key={label}
                            onClick={() => clickable && onNavigate(stepNum)}
                            style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 6, cursor: clickable ? "pointer" : "default" }}
                        >
                            <div style={{
                                height: 6,
                                width: "100%",
                                borderRadius: 999,
                                background: done || active ? "rgba(16, 32, 86, 0.85)" : "#e2e8f0",
                                opacity: active ? 1 : done ? 0.5 : 1,
                                transition: "all 0.3s ease",
                            }} />
                            <span style={{
                                fontSize: "0.72rem",
                                fontWeight: active ? 700 : 400,
                                color: active ? "rgba(16, 32, 86, 0.9)" : done ? "rgba(16, 32, 86, 0.6)" : "#94a3b8",
                                transition: "color 0.3s ease",
                                whiteSpace: "nowrap",
                                textDecoration: clickable ? "underline" : "none",
                            }}>
                                {label}
                            </span>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}
