import logging
import os
import smtplib
from email.message import EmailMessage

logger = logging.getLogger(__name__)


def send_email(
    recipient: str,
    subject: str,
    message: str,
) -> bool:
    """
    Sends an email when SMTP is configured.

    If SMTP is not configured, the email is logged instead.
    This allows local development/testing without exposing
    personal email credentials.
    """

    smtp_host = os.getenv("SMTP_HOST")
    smtp_port = int(os.getenv("SMTP_PORT", "587"))
    smtp_username = os.getenv("SMTP_USERNAME")
    smtp_password = os.getenv("SMTP_PASSWORD")
    smtp_from = os.getenv("SMTP_FROM", smtp_username)

    # Development/test mode: no SMTP credentials configured.
    if not smtp_host or not smtp_username or not smtp_password:
        logger.info(
            "EMAIL NOTIFICATION (test mode) | To: %s | Subject: %s | Message: %s",
            recipient,
            subject,
            message,
        )
        return True

    email = EmailMessage()
    email["From"] = smtp_from
    email["To"] = recipient
    email["Subject"] = subject
    email.set_content(message)

    try:
        with smtplib.SMTP(smtp_host, smtp_port) as server:
            server.starttls()
            server.login(smtp_username, smtp_password)
            server.send_message(email)

        logger.info("Email notification sent to %s", recipient)
        return True

    except Exception:
        logger.exception("Failed to send email notification to %s", recipient)
        return False