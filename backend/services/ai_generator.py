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
    message_type: str = "initail_request",
) -> dict:
    
    # Fallback om inte city eller profile_url anges
    safe_city = city or "ej angiven"
    profile_url = profile_url or "ej angiven"


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

Detta är en uppföljning på min tidigare GDPR-begäran.BaseException

{intro}

Mina uppgifter:
Namn: {full_name}
Ort: {safe_city}
Profil / länk: {""}

Jag önskar en bekräftelse på att min tidigare begäran har mottagits och hanteras inom lagstadgad tid.

{closing},
{full_name}
""".strip()

    return {
        "subject": subject,
        "body": body,
    }


# TODO: RAD 58 VAD SKA STÅ DÄR FÖR ATT DET SKA VARA KORREKT? <- FIXA 