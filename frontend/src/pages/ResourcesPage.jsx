import { useNavigate } from "react-router-dom";
import TopBar from "../components/TopBar";

const RESOURCES = [
    {
        title: "Rätten att bli raderad",
        description:
            "Om ett företag inte längre behöver dina personuppgifter, eller om du återkallar ditt samtycke, har du i många fall rätt att kräva att de raderas. Det kallas ibland \"rätten att bli bortglömd\" och regleras i GDPR artikel 17.",
        url: "https://www.imy.se/privatperson/dataskydd/dina-rattigheter/radering/",
    },
    {
        title: "Rätten till registerutdrag",
        description:
            "Du har alltid rätt att få veta vilka personuppgifter ett företag eller en myndighet har om dig, varför de behandlas och hur länge de sparas. Svaret ska komma inom en månad och är gratis.",
        url: "https://www.imy.se/privatperson/dataskydd/dina-rattigheter/ta-del-av-dina-personuppgifter/",
    },
    {
        title: "Rätten att invända",
        description:
            "Du kan invända mot att dina uppgifter används för t.ex. direktmarknadsföring eller profilering. Företaget måste då sluta behandla uppgifterna — utan undantag när det gäller marknadsföring.",
        url: "https://www.imy.se/privatperson/dataskydd/dina-rattigheter/att-gora-invandningar/",
    },
    {
        title: "Rätten till rättelse",
        description:
            "Har ett företag felaktiga eller ofullständiga uppgifter om dig? Då har du rätt att begära att de korrigeras. Företaget är skyldigt att rätta till dem utan onödigt dröjsmål.",
        url: "https://www.imy.se/privatperson/dataskydd/dina-rattigheter/rattelse/",
    },
    {
        title: "Rätten till dataportabilitet",
        description:
            "Du kan begära att få ut dina uppgifter i ett maskinläsbart format och flytta dem till en annan tjänst. Gäller uppgifter du själv lämnat och som behandlas automatiserat med ditt samtycke.",
        url: "https://www.imy.se/globalassets/dokument/riktlinjer-om-ratten-till-dataportabilitet.pdf",
    },
    {
        title: "Anmäl ett dataskyddsbrott till IMY",
        description:
            "Om du anser att ett företag bryter mot GDPR kan du anmäla det till IMY, som är tillsynsmyndighet i Sverige. IMY kan inleda granskning och i allvarliga fall utfärda böter.",
        url: "https://www.imy.se/privatperson/utfora-arenden/lamna-ett-klagomal/",
    },
    {
        title: "Söktjänster och personuppgifter",
        description:
            "IMY har granskat söktjänster som Ratsit, Mrkoll och liknande och slagit fast att de inte utan vidare kan neka en raderingsbegäran. Läs IMY:s nyhet om det stärkta skyddet.",
        url: "https://www.imy.se/nyheter/ja-till-starkare-skydd-for-personuppgifter-som-publiceras-i-soktjanster/",
    },
    {
        title: "Utgivningsbevis — vad gäller?",
        description:
            "Många söktjänster hävdar att de är skyddade av utgivningsbevis och därmed undantagna från GDPR. IMY guidar dig om vad det faktiskt innebär och när det inte gäller som skäl att neka radering.",
        url: "https://www.imy.se/privatperson/dataskydd/vi-guidar-dig/utgivningsbevis/",
    },
];

export default function ResourcesPage() {
    const navigate = useNavigate();

    return (
        <div className="page">
            <TopBar onBack={() => navigate("/")} />
            <main className="container">
                <div style={{ marginBottom: 32 }}>
                    <h1>Dina rättigheter enligt GDPR</h1>
                    <p className="muted">
                        Här hittar du enkel information om vad GDPR faktiskt ger dig för rättigheter —
                        och direktlänkar till IMY om du vill läsa mer.
                    </p>
                </div>

                <div className="card" style={{ marginBottom: 32, borderLeft: "4px solid rgba(16, 32, 86, 0.6)" }}>
                    <h2 style={{ marginBottom: 8 }}>Vad är IMY?</h2>
                    <p className="muted" style={{ fontSize: "0.92rem", lineHeight: 1.6, marginBottom: 12 }}>
                        IMY — Integritetsskyddsmyndigheten — är Sveriges tillsynsmyndighet för dataskydd.
                        De ansvarar för att GDPR följs i Sverige och kan granska företag, utfärda böter
                        och ta emot klagomål från privatpersoner.
                    </p>
                    <p className="muted" style={{ fontSize: "0.92rem", lineHeight: 1.6 }}>
                        Om ett företag inte svarar på din begäran eller nekar den utan giltig grund
                        kan du anmäla det till IMY — det är gratis och du behöver inget juridiskt ombud.
                    </p>
                </div>

                <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                    {RESOURCES.map((r) => (
                        <div className="card" key={r.title}>
                            <h2 style={{ marginBottom: 8 }}>{r.title}</h2>
                            <p className="muted" style={{ fontSize: "0.92rem", lineHeight: 1.6, marginBottom: 16 }}>
                                {r.description}
                            </p>
                            <a href={r.url} target="_blank" rel="noopener noreferrer">
                                <button className="btn btn-secondary" type="button">
                                    Läs mer på IMY ↗
                                </button>
                            </a>
                        </div>
                    ))}
                </div>
            </main>
        </div>
    );
}
