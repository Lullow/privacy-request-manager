import { useNavigate } from "react-router-dom";
import TopBar from "../components/TopBar";

const SECTIONS = [
    {
        number: "1",
        title: "Om tjänsten",
        content: `Privacy Request Manager är en digital tjänst som hjälper användare att skapa, organisera och skicka GDPR-begäranden till företag, webbplatser och andra mottagare.

Tjänsten kan användas för att skapa begäranden om radering, tillgång, rättelse, begränsning, invändning eller dataportabilitet. Tjänsten är kostnadsfri.`,
    },
    {
        number: "2",
        title: "Vem som får använda tjänsten",
        content: `Du får bara använda tjänsten om:

• Du lämnar korrekta uppgifter
• Du använder tjänsten för dig själv eller med giltig behörighet för den person du företräder
• Du inte använder tjänsten för bedrägliga, olagliga eller otillbörliga syften`,
    },
    {
        number: "3",
        title: "Konto och säkerhet",
        content: `Om du skapar ett konto ansvarar du för att skydda dina inloggningsuppgifter och för aktivitet som sker via ditt konto.

Kontakta oss omedelbart om du misstänker obehörig användning.`,
    },
    {
        number: "4",
        title: "Dina uppgifter och instruktioner",
        content: `Du ansvarar för att de uppgifter du lämnar till oss är riktiga, relevanta och uppdaterade.

Du ansvarar också för att de mottagare du väljer är relevanta för din begäran och att eventuella länkar du lämnar avser rätt person.`,
    },
    {
        number: "5",
        title: "Fullmakt och agerande för din räkning",
        content: `När tjänsten erbjuder möjlighet att skicka en begäran på dina vägnar krävs att du lämnar en uttrycklig instruktion eller fullmakt.

Genom att godkänna fullmakten bekräftar du att du ger Privacy Request Manager rätt att, inom ramen för tjänsten, formulera och skicka begäranden till de mottagare du valt.

Fullmakten gäller endast för de åtgärder och mottagare som framgår i tjänsten.`,
    },
    {
        number: "6",
        title: "Ingen garanti för visst utfall",
        content: `Vi tillhandahåller ett verktyg för att hjälpa dig utöva dina rättigheter, men vi kan inte garantera:

• Att en mottagare godkänner eller verkställer din begäran
• Att en mottagare svarar inom viss tid
• Att innehåll tas bort från internet helt eller permanent
• Att sökmotorer, katalogtjänster eller tredje parter agerar på visst sätt`,
    },
    {
        number: "7",
        title: "Automatiskt genererat innehåll",
        content: `Tjänsten kan erbjuda automatiskt genererade textförslag och mallar baserade på AI. Sådant innehåll tillhandahålls som stöd och kan behöva granskas eller justeras innan det används.

Du ansvarar för att kontrollera att innehållet stämmer med din situation innan det skickas.`,
    },
    {
        number: "8",
        title: "Tillgänglighet och ändringar",
        content: `Vi strävar efter att tjänsten ska fungera stabilt, men garanterar inte att den alltid är fri från fel, avbrott eller säkerhetsbrister.

Vi får uppdatera, ändra eller tillfälligt stänga delar av tjänsten.`,
    },
    {
        number: "9",
        title: "Begränsning av ansvar",
        content: `I den utsträckning som lagen tillåter ansvarar vi inte för indirekta skador, uteblivna svar från mottagare, borttagning som inte genomförs eller andra följder som ligger utanför vår rimliga kontroll.

Detta gäller dock inte ansvar som enligt tvingande lag inte får begränsas.`,
    },
    {
        number: "10",
        title: "Personuppgifter",
        content: `Vår behandling av personuppgifter beskrivs i vår integritetspolicy.`,
        link: { label: "Läs integritetspolicyn", href: "/integritetspolicy" },
    },
    {
        number: "11",
        title: "Kontakt",
        content: `Om du har frågor om tjänsten eller dessa villkor, kontakta oss på:

[KONTAKT@EXEMPEL.SE]`,
    },
    {
        number: "12",
        title: "Tillämplig lag",
        content: `Dessa villkor ska tolkas enligt svensk rätt.`,
    },
];

export default function VillkorPage() {
    const navigate = useNavigate();

    return (
        <div className="page">
            <TopBar onBack={() => navigate("/")} />
            <main className="container">
                <div style={{ marginBottom: 32 }}>
                    <h1>Användarvillkor</h1>
                    <p className="muted">
                        Senast uppdaterade: 25 mars 2026. Genom att använda Privacy Request Manager
                        godkänner du dessa villkor.
                    </p>
                </div>

                <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                    {SECTIONS.map((s) => (
                        <div className="card" key={s.number}>
                            <h2 style={{ marginBottom: 10 }}>
                                {s.number}. {s.title}
                            </h2>
                            <p className="muted" style={{ fontSize: "0.92rem", lineHeight: 1.7, whiteSpace: "pre-line" }}>
                                {s.content}
                            </p>
                            {s.link && (
                                <a
                                    href={s.link.href}
                                    style={{
                                        display: "inline-block",
                                        marginTop: 10,
                                        fontSize: "0.88rem",
                                        fontWeight: 600,
                                        color: "rgba(16,32,86,0.85)",
                                        textDecoration: "underline",
                                    }}
                                >
                                    {s.link.label}
                                </a>
                            )}
                        </div>
                    ))}
                </div>
            </main>
        </div>
    );
}
