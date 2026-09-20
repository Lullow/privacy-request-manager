import { useNavigate } from "react-router-dom";
import TopBar from "../components/TopBar";

export default function OmOssPage() {
    const navigate = useNavigate();

    return (
        <div className="page">
            <TopBar onBack={() => navigate("/")} />
            <main className="container">
                <div style={{ marginBottom: 32 }}>
                    <h1>Om oss</h1>
                    <p className="muted">
                        Vilka är vi, och varför har vi byggt det här verktyget?
                    </p>
                </div>

                <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>

                    {/* Varför det är aktuellt */}
                    <div className="card" style={{ borderLeft: "4px solid rgba(16,32,86,0.7)" }}>
                        <h2 style={{ marginBottom: 10 }}>Varför är detta aktuellt just nu?</h2>
                        <p className="muted" style={{ fontSize: "0.92rem", lineHeight: 1.7 }}>
                            Sverige har ett unikt undantag i dataskyddslagstiftningen — det s.k.{" "}
                            <strong>utgivningsbeviset</strong> — som länge tillät söktjänster som Ratsit,
                            Mrkoll och Hitta.se att publicera personuppgifter om privatpersoner med
                            begränsad möjlighet till insyn och kontroll.
                        </p>
                        <p className="muted" style={{ fontSize: "0.92rem", lineHeight: 1.7, marginTop: 10 }}>
                            IMY (Integritetsskyddsmyndigheten) har nu slagit fast att de har befogenhet
                            att granska dessa söktjänster och utreda om de uppfyller kraven i GDPR —
                            ett historiskt beslut som stärker din rätt att få dina uppgifter borttagna.
                        </p>
                        <a
                            href="https://www.imy.se/nyheter/imy-har-behorighet-att-granska-soktjanster-med-utgivningsbevis/"
                            target="_blank"
                            rel="noopener noreferrer"
                            style={{
                                display: "inline-block",
                                marginTop: 14,
                                fontSize: "0.88rem",
                                fontWeight: 600,
                                color: "rgba(16,32,86,0.85)",
                                textDecoration: "underline",
                            }}
                        >
                            Läs IMY:s beslut ↗
                        </a>
                    </div>

                    {/* Vilka är vi */}
                    <div className="card">
                        <h2 style={{ marginBottom: 10 }}>Vilka är vi?</h2>
                        <p className="muted" style={{ fontSize: "0.92rem", lineHeight: 1.7 }}>
                            Vi är två studenter inom AI-teknik och maskininlärning som tror att
                            integritetsskydd inte borde kräva juridisk expertis eller timmar av
                            manuellt arbete.
                        </p>
                        <p className="muted" style={{ fontSize: "0.92rem", lineHeight: 1.7, marginTop: 10 }}>
                            När vi märkte hur enkelt det är för vem som helst att slå upp en persons
                            adress, telefonnummer och inkomst på nätet bestämde vi oss för att göra
                            något åt det. Resultatet är Privacy Request Manager — ett verktyg som
                            automatiserar processen att begära radering av dina personuppgifter från
                            de vanligaste söktjänsterna i Sverige.
                        </p>
                    </div>

                    {/* Vår mission */}
                    <div className="card">
                        <h2 style={{ marginBottom: 10 }}>Vår ambition</h2>
                        <p className="muted" style={{ fontSize: "0.92rem", lineHeight: 1.7 }}>
                            Vi vill ge alla — oavsett teknisk bakgrund — möjligheten att ta kontroll
                            över sin digitala närvaro. Därför har vi designat verktyget efter tre
                            enkla principer:
                        </p>
                        <ul className="muted" style={{ fontSize: "0.92rem", lineHeight: 1.9, marginTop: 10, paddingLeft: 20 }}>
                            <li><strong>Enkelt att förstå</strong> — inga juridiska krångel, bara tydliga steg.</li>
                            <li><strong>Lätt att använda</strong> — hela processen tar under fem minuter.</li>
                            <li><strong>Helt gratis</strong> — vi tar aldrig betalt av dig som användare.</li>
                        </ul>
                    </div>

                    {/* Kontakt */}
                    <div className="card">
                        <h2 style={{ marginBottom: 10 }}>Kontakt</h2>
                        <p className="muted" style={{ fontSize: "0.92rem", lineHeight: 1.7 }}>
                            Har du frågor, synpunkter eller förslag på förbättringar? Vi tar gärna emot feedback.
                        </p>
                        <p className="muted" style={{ fontSize: "0.92rem", lineHeight: 1.7, marginTop: 10 }}>
                            E-post: <strong>support@avlistamig.se</strong>
                        </p>
                    </div>

                </div>
            </main>
        </div>
    );
}
