import anthropic
from settings import settings

_client = anthropic.Anthropic(api_key=settings.ANTHROPIC_API_KEY)


def generate_legal_gdpr_message(
    company_name: str,
    full_name: str,
    personal_number: str,
    birth_date: str | None = None,
    address: str | None = None,
    phone: str | None = None,
    registrant_email: str | None = None,
) -> dict:
    """
    Genererar en juridiskt tung GDPR-raderingsbegäran med hänvisning till
    IMY:s rättsliga ställningstagande IMYRS 2024:1 om söktjänsters YGL/TF-undantag.
    Mallen är fast (inte AI-genererad) för att säkerställa juridisk precision.
    """
    subject = f"Begäran om radering av personuppgifter enligt GDPR art. 17 – {full_name}"

    identity_lines = [
        f"• Fullständigt namn: {full_name}",
        "• Personnummer: [PERSONNUMMER]",
    ]
    if birth_date:
        identity_lines.append(f"• Födelsedag: {birth_date}")
    if address:
        identity_lines.append(f"• Adress: {address}")
    if phone:
        identity_lines.append(f"• Telefon: {phone}")
    if registrant_email:
        identity_lines.append(f"• E-post: {registrant_email}")
    identity_text = "\n".join(identity_lines)

    message_body = f"""Hej,

Jag agerar som ombud för {full_name}, personnummer [PERSONNUMMER], med stöd av bifogad fullmakt. Denna begäran görs i enlighet med artikel 17 i EU:s dataskyddsförordning (GDPR).

Den registrerade begär att samtliga personuppgifter som rör honom/henne raderas från era system och tjänster, inklusive men inte begränsat till:
• Namn, adress och kontaktuppgifter
• Telefonnummer
• Eventuella foton eller profilbilder
• All övrig data kopplad till den registrerade

Identifiering
Följande uppgifter tillhandahålls för att verifiera den registrerades identitet:
{identity_text}

Vi anser att ovanstående uppgifter är tillräckliga för att verifiera den registrerades identitet i enlighet med GDPR artikel 12.6. Enligt artikel 12.2 får ytterligare identifiering, såsom kopia på ID-handling eller krav på BankID, endast begäras om ni har rimliga tvivel kring den registrerades identitet. Då vi tillhandahåller personnummer och övriga registeruppgifter som redan finns i ert system bör sådana tvivel inte föreligga.

Rättslig grund
Enligt GDPR artikel 12.3 ska ni bekräfta att raderingen har genomförts utan onödigt dröjsmål och senast inom en månad från mottagandet av denna begäran.

Om ni anser att det finns rättslig grund att behålla uppgifterna, ber vi er specificera exakt vilken grund enligt GDPR artikel 17.3 ni åberopar samt motivera detta skriftligen.

Gällande utgivningsbevis och YGL-undantaget
För det fall ni avser att åberopa ert utgivningsbevis som grund för att avslå denna begäran vill vi göra er uppmärksamma på följande:

Integritetsskyddsmyndigheten (IMY) har i sitt rättsliga ställningstagande IMYRS 2024:1 (publicerat 14 maj 2024) bedömt att myndigheten är behörig att inleda tillsyn mot söktjänster med utgivningsbevis med anledning av klagomål från enskilda. IMY konstaterar att den svenska regleringen som ger söktjänster med utgivningsbevis generella undantag från GDPR inte är förenlig med EU-rätten.

IMY framhåller särskilt att:
• Yttrandefrihetsintresset av att publicera personuppgifter i söktjänster inte motiverar de långtgående undantagen från GDPR:s materiella reglering, inklusive rätten till radering.
• Det måste kunna ske en avvägning mellan integritetsskydd och yttrandefrihet i varje enskilt fall, inte ett generellt undantag.
• EU-domstolens praxis har stärkt enskildas rättsställning och rätten att klaga till tillsynsmyndigheten är ett centralt rättsmedel.
• IMY har inlett tillsyn mot flera söktjänster med utgivningsbevis som inte raderar personuppgifter på begäran.

Mot denna bakgrund anser vi att utgivningsbeviset inte utgör giltig grund för att avslå denna raderingsbegäran.

Konsekvenser vid utebliven åtgärd
Om denna begäran inte besvaras inom den lagstadgade tidsfristen på en månad, eller om den avslås utan tillräcklig rättslig motivering, kommer vi att:
• Anmäla ärendet till Integritetsskyddsmyndigheten (IMY) enligt GDPR artikel 77.
• Begära avindexering av den registrerades personuppgifter från sökmotorer med stöd av rätten att bli bortglömd.

Med vänliga hälsningar,
Privacy Request Manager
på uppdrag av {full_name}

Bilagor:
• Fullmakt (elektroniskt undertecknad av den registrerade)

Referenser:
• GDPR – Europaparlamentets och rådets förordning (EU) 2016/679, artiklarna 12, 17 och 77
• IMY:s rättsliga ställningstagande IMYRS 2024:1 – Klagomål mot söktjänster med utgivningsbevis (14 maj 2024)
• Dataskyddslagen (2018:218), § 7""".strip()

    return {"subject": subject, "message_body": message_body}


def generate_gdpr_message(
    company_name: str,
    company_email: str,
    full_name: str,
    city: str | None,
    profile_url: str | None,
    birth_date: str | None = None,
    tone: str = "neutral",
    message_type: str = "initial_request",
    request_types: list[str] | None = None,
) -> dict:

    request_types = request_types or []

    tone_instructions = {
        "formal": "Skriv på ett formellt och artigt sätt.",
        "firm": "Skriv på ett bestämt och tydligt sätt. Var kortfattad och direkt.",
        "neutral": "Skriv på ett neutralt och sakligt sätt.",
    }

    type_labels = {
        "delete": "radering av personuppgifter",
        "access": "registerutdrag (tillgång till mina uppgifter)",
        "rectify": "rättelse av felaktiga uppgifter",
        "restrict": "begränsning av behandling",
        "object": "invändning mot behandling",
        "portability": "dataportabilitet",
    }

    translated_types = [type_labels.get(t, t) for t in request_types]
    requested_actions = ", ".join(translated_types) if translated_types else "radering av personuppgifter"

    optional_details = []
    if birth_date:
        optional_details.append(f"Födelsedag: {birth_date}")
    if city:
        optional_details.append(f"Ort: {city}")
    if profile_url:
        optional_details.append(f"Profil / länk: {profile_url}")
    details_text = "\n".join(optional_details) if optional_details else ""

    if message_type == "follow_up":
        message_context = "Detta är en uppföljning/påminnelse på en tidigare skickad GDPR-begäran som ännu inte besvarats."
    else:
        message_context = "Detta är en ny GDPR-begäran."

    prompt = f"""Du är en hjälpsam assistent som skriver GDPR-begäran på svenska.

{message_context}

Skriv ett mejl från {full_name} till företaget {company_name} (e-post: {company_email}).
Begäran gäller: {requested_actions}.
{f"Avsändarens uppgifter:{chr(10)}{details_text}" if details_text else ""}

Ton: {tone_instructions.get(tone, tone_instructions["neutral"])}

Mejlet ska:
- Vara på svenska
- Referera till GDPR och den registrerades rättigheter
- Be om bekräftelse på mottagandet
- Ha ett lämpligt ämnesrad (subject) och ett meddelandeinnehåll (body)

Svara ENDAST i följande format, utan extra text:
SUBJECT: <ämnesrad här>
BODY:
<meddelandetext här>"""

    response = _client.messages.create(
        model="claude-haiku-4-5-20251001",
        max_tokens=1024,
        messages=[{"role": "user", "content": prompt}],
    )

    raw = response.content[0].text.strip()

    subject = ""
    message_body = ""

    if "SUBJECT:" in raw and "BODY:" in raw:
        subject_part, body_part = raw.split("BODY:", 1)
        subject = subject_part.replace("SUBJECT:", "").strip()
        message_body = body_part.strip()
    else:
        subject = f"GDPR-begäran – {full_name}"
        message_body = raw

    return {
        "subject": subject,
        "message_body": message_body,
    }
