import { useNavigate } from "react-router-dom";
import TopBar from "../components/TopBar";

const SECTIONS = [
    {
        title: "Vad samlar vi in?",
        content: `När du använder Privacy Request Manager samlar vi in följande uppgifter:

• Namn och ort — anges av dig i wizarden för att generera sökningar och begäranden.
• E-postadress — används vid inloggning och kontohantering.
• Begäranhistorik — de GDPR-begäranden du skapat sparas kopplade till ditt konto så att du kan följa upp dem.

Vi samlar inte in personnummer eller andra juridiska uppgifter du anger i wizarden — dessa används enbart för att generera ett brev och skickas aldrig till våra servrar i sparad form.`,
    },
    {
        title: "Varför behandlar vi dina uppgifter?",
        content: `Vi behandlar dina uppgifter för att:

• Tillhandahålla tjänsten — generera GDPR-begäranden och låta dig följa upp dem.
• Hantera ditt konto — inloggning och autentisering.
• Förbättra tjänsten — aggregerad, anonym användningsstatistik.

Den rättsliga grunden är avtal (att du använder tjänsten) och i förekommande fall berättigat intresse.`,
    },
    {
        title: "AI-generering av mejl",
        content: `När du väljer "Enkel begäran" skickas ditt namn, vald ton och typ av begäran till Anthropic (Claude) för att generera ett mejlutkast. Ingen annan personuppgift skickas.

Anthropic behandlar dessa uppgifter enligt sin egen integritetspolicy och används inte för att träna modeller på dina data. Läs mer på anthropic.com.`,
    },
    {
        title: "Hur länge sparar vi dina uppgifter?",
        content: `• Kontouppgifter sparas så länge ditt konto är aktivt.
• Begäranhistorik sparas tills du själv raderar ärendet eller ditt konto.
• Om du inte loggar in på 24 månader kan kontot komma att raderas efter avisering.`,
    },
    {
        title: "Delar vi dina uppgifter med tredje part?",
        content: `Vi delar uppgifter med följande leverantörer:

• Amazon Web Services (AWS) — hosting och datalagring. Servrar är placerade inom EU/EES.
• Anthropic — AI-generering av mejltext (se avsnittet ovan).

Vi säljer aldrig dina uppgifter och delar dem inte med annonsörer.`,
    },
    {
        title: "Dina rättigheter",
        content: `Eftersom vi hanterar personuppgifter om dig har du enligt GDPR rätt att:

• Begära registerutdrag — få veta vad vi har sparat om dig.
• Begära radering — ta bort ditt konto och all kopplad data.
• Begära rättelse — korrigera felaktiga uppgifter.
• Invända mot behandling — i de fall vi grundar behandlingen på berättigat intresse.

Kontakta oss på adressen nedan för att utöva dina rättigheter. Vi svarar inom 30 dagar.`,
    },
    {
        title: "Kontakt",
        content: `Har du frågor om hur vi hanterar dina personuppgifter, eller vill utöva dina rättigheter?

E-post: [KONTAKT@EXEMPEL.SE]

Du har även rätt att lämna klagomål till IMY (Integritetsskyddsmyndigheten) om du anser att vi behandlar dina uppgifter felaktigt: imy.se`,
    },
];

export default function IntegritetspolicyPage() {
    const navigate = useNavigate();

    return (
        <div className="page">
            <TopBar onBack={() => navigate("/")} />
            <main className="container">
                <div style={{ marginBottom: 32 }}>
                    <h1>Integritetspolicy</h1>
                    <p className="muted">
                        Senast uppdaterad: mars 2026. Här förklarar vi på vanlig svenska hur vi hanterar
                        dina personuppgifter när du använder Privacy Request Manager.
                    </p>
                </div>

                <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                    {SECTIONS.map((s) => (
                        <div className="card" key={s.title}>
                            <h2 style={{ marginBottom: 10 }}>{s.title}</h2>
                            <p className="muted" style={{ fontSize: "0.92rem", lineHeight: 1.7, whiteSpace: "pre-line" }}>
                                {s.content}
                            </p>
                        </div>
                    ))}
                </div>
            </main>
        </div>
    );
}
