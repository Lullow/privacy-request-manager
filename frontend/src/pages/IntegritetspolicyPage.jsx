import { useNavigate } from "react-router-dom";
import TopBar from "../components/TopBar";

const SECTIONS = [
    {
        number: "1",
        title: "Om denna policy",
        content: `Den här integritetspolicyn beskriver hur Privacy Request Manager behandlar personuppgifter när du använder tjänsten för att skapa, hantera och skicka GDPR-begäranden till utvalda företag, webbplatser och andra mottagare.

Vi vill att det ska vara tydligt vilka uppgifter vi samlar in, varför vi gör det, hur länge vi sparar dem och vilka rättigheter du har.`,
    },
    {
        number: "2",
        title: "Personuppgiftsansvarig",
        content: `Personuppgiftsansvarig för behandlingen är:

[Företagsnamn / projektets juridiska namn]
Organisationsnummer: [org.nr]
E-post: [KONTAKT@EXEMPEL.SE]
Adress: [postadress]`,
    },
    {
        number: "3",
        title: "Vilka personuppgifter vi behandlar",
        content: `Vi kan behandla följande kategorier av personuppgifter:

• Namn och ort — anges av dig för att generera sökningar och begäranden
• E-postadress — används vid inloggning och kontohantering
• Födelsedag — anges frivilligt för att underlätta identifiering i begäranden
• Profilänkar eller sökresultatlänkar som rör dig
• Begäranhistorik — de GDPR-begäranden du skapat, sparade kopplade till ditt konto
• Konto- och inloggningsuppgifter om du registrerar ett konto
• Tekniska uppgifter såsom loggar och information om hur tjänsten används

Personnummer: Om du väljer "Juridisk begäran" kan du ange ditt personnummer. Detta lagras aldrig i vår databas. Det används enbart för att generera brevtexten och ersätts med en platshållare i vår lagrade version.`,
    },
    {
        number: "4",
        title: "Varför vi behandlar dina uppgifter",
        content: `Vi behandlar personuppgifter för att:

• Skapa och administrera ditt konto
• Låta dig skapa, spara och hantera GDPR-begäranden
• Generera texter och underlag utifrån dina val
• Skicka begäranden på dina vägnar när du har gett oss fullmakt
• Kommunicera med dig om ditt ärende
• Förbättra säkerheten och förebygga missbruk
• Uppfylla rättsliga skyldigheter
• Dokumentera samtycken och fullmakter där det behövs`,
    },
    {
        number: "5",
        title: "Rättslig grund för behandlingen",
        content: `Vi behandlar i första hand dina personuppgifter eftersom behandlingen är nödvändig för att fullgöra avtalet med dig — det vill säga för att du ska kunna använda tjänsten och skicka begäranden.

I vissa fall behandlar vi uppgifter för att uppfylla rättsliga skyldigheter.

Vi kan också behandla uppgifter med stöd av berättigat intresse, exempelvis för säkerhet, loggning och felsökning, efter en bedömning att vårt intresse väger tyngre än intrånget i din integritet.`,
    },
    {
        number: "6",
        title: "Varifrån uppgifterna kommer",
        content: `Vi får normalt uppgifterna direkt från dig när du:

• Registrerar dig
• Fyller i formulär i tjänsten
• Laddar upp eller klistrar in länkar och uppgifter
• Kontaktar oss`,
    },
    {
        number: "7",
        title: "Hur länge vi sparar uppgifterna",
        content: `Vi sparar dina personuppgifter bara så länge de behövs för de ändamål som anges i denna policy:

• Kontouppgifter sparas så länge ditt konto är aktivt
• Begäranhistorik sparas tills du själv raderar ärendet eller ditt konto
• Om du inte loggar in på 24 månader kan kontot komma att raderas efter avisering
• Loggar och säkerhetsrelaterade uppgifter sparas under 90 dagar, eller längre om det krävs för att utreda missbruk eller incidenter`,
    },
    {
        number: "8",
        title: "Mottagare av personuppgifter",
        content: `Vi kan dela uppgifter med följande parter:

• Mottagare du valt att rikta din begäran till (de företag och sajter du väljer i tjänsten)
• Anthropic — när du väljer "Enkel begäran" skickas ditt namn, vald ton, typ av begäran och eventuell födelsedag till Anthropic:s API för att generera mejltext. Inga andra personuppgifter skickas. Anthropic behandlar dessa uppgifter enligt sin egen integritetspolicy och använder dem inte för att träna modeller. Läs mer på anthropic.com.
• Amazon Web Services (AWS) — hosting och datalagring. Servrar är placerade inom EU/EES.
• Myndigheter, om vi är skyldiga att göra det enligt lag

Vi säljer aldrig dina uppgifter och delar dem inte med annonsörer.`,
    },
    {
        number: "9",
        title: "Överföring utanför EU/EES",
        content: `Anthropic är ett amerikanskt bolag. När du använder AI-generering av mejltext kan data därför överföras utanför EU/EES. Anthropic omfattas av EU-US Data Privacy Framework och har lämpliga skyddsåtgärder på plats.

Vår hosting via AWS sker inom EU/EES.

Information om specifika skyddsåtgärder lämnas på begäran.`,
    },
    {
        number: "10",
        title: "Säkerhet",
        content: `Vi använder lämpliga tekniska och organisatoriska säkerhetsåtgärder för att skydda personuppgifter mot obehörig åtkomst, förlust, ändring och otillåten spridning.

Lösenord lagras aldrig i klartext. Personnummer lagras aldrig alls.`,
    },
    {
        number: "11",
        title: "Dina rättigheter",
        content: `Du har enligt dataskyddsreglerna rätt att:

• Begära tillgång till dina personuppgifter (registerutdrag)
• Begära rättelse av felaktiga uppgifter
• Begära radering av ditt konto och all kopplad data
• Begära begränsning av behandling
• Invända mot behandling grundad på berättigat intresse
• Begära dataportabilitet när det är tillämpligt
• Lämna klagomål till Integritetsskyddsmyndigheten (IMY) på imy.se

Kontakta oss på [KONTAKT@EXEMPEL.SE] för att utöva dina rättigheter. Vi svarar inom 30 dagar.`,
    },
    {
        number: "12",
        title: "Cookies och liknande teknik",
        content: `Tjänsten använder sessionbaserad lagring (sessionStorage) lokalt i din webbläsare för att spara dina svar medan du fyller i formuläret. Denna data lämnar aldrig din enhet och raderas när du stänger fliken.

Om vi i framtiden använder cookies informerar vi om detta separat.`,
    },
    {
        number: "13",
        title: "Ändringar i policyn",
        content: `Vi kan uppdatera denna integritetspolicy. Den senaste versionen finns alltid på denna sida. Datumet för senaste uppdatering anges överst.`,
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
                        Senast uppdaterad: 25 mars 2026. Här beskriver vi hur Privacy Request Manager
                        behandlar dina personuppgifter när du använder tjänsten.
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
                        </div>
                    ))}
                </div>
            </main>
        </div>
    );
}
