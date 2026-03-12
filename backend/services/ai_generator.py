# Lägg in AI-logik
# Börja med en "mockad" version
# Koppla sedan in riktig OpenAI/API

"""
Syftet med denna fil är att få flödet att fungera korrekt:

- create request
- generate message
- spara message
- visa i frontend

När det funkar kan vi bytauyt innehållet i generate_gdpy_message() till riktig AI utan att ändra resten av systemet

"""

def generate_gdpr_message(
    company_name: str,
    company_email: str,
    full_name: str,
    city: str | None,
    profile_url: str | None,
    tone: str = "neutral",
    message_type: str = "initial_request",
    request_types: list[str] | None = None,
) -> dict:
    
    # Om request_types är None används en tom lista istället
    request_types = request_types or []

    # Fallback om inte city eller profile_url anges
    safe_city = city or "ej angiven"
    safe_profile_url = profile_url or "ej angiven"

    # Översätt frontendens tekniska request-typer till snygg svenska
    type_labels = {
        "delete": "radering",
        "access": "registerutdrag",
        "rectify": "rättelse",
        "restrict": "begränsning av behandling",
        "object": "invändning",
        "portability": "dataportabilitet",
    }

    # Gör om request-typerna till läsbar text
    translated_types = [type_labels.get(item, item) for item in request_types]

    # Om användaren inte valt något använder vi en rimlig standardtext
    requested_actions = (
        ", ".join(translated_types)
        if translated_types
        else "radering av personuppgifter"
    )

    # Gör listan av request_types till vanlig text (om användaren valt t.ex. ["delete", "access"] blir det "delete, access")
    requested_actions = ", ".join(request_types) if request_types else "radering av personuppgifter"
    
    # Basic ton
    if tone == "formal":
        greeting = f"Hej {company_name},"
        closing = "Med vänliga hälsningar,"
        intro = "Jag önskar härmed utöva mina rättigheter enligt dataskyddsförordningen (GDPR)."
    elif tone == "firm":
        greeting = f"Till ansvarig hos {company_name},"
        closing = "Vänligen återkom skyndsamt"
        intro = "Jag begär härmed att ni hanterar detta ärende enligt mina rättigheter enligt GDPR."
    else:
        greeting = f"Hej {company_name},"
        closing = "Med vänliga hälsningar"
        intro = "Jag vill använda mina rättigheter enligt GDPR."

    if message_type == "follow_up":
        subject = f"Påminnelse om GDPR-begäran - {full_name}"
        body = f"""
{greeting}

{intro}

Jag önskar att ni hanterar följande enligt GDPR: {requested_actions}.

Mina uppgifter:
Namn: {full_name}
Ort: {safe_city}
Profil / länk: {safe_profile_url}

Jag önskar en bekräftelse på att min tidigare begäran har mottagits och hanteras inom lagstadgad tid.

{closing},
{full_name}
""".strip()
    else:
        subject = f"GDPR-begäran - {full_name}"
        message_body = f"""
{greeting}

{intro}

Jag begär att ni hanterar följande enligt GDPR: {requested_actions}.

Mina uppgifter:
Namn: {full_name}
Ort: {safe_city}
Profil / länk: {safe_profile_url}

Jag önskar också en bekräftelse på att ni mottagit denna begäran.

{closing},
{full_name}
""".strip()

    return {
        "subject": subject,
        "message_body": message_body,
}