import logging
import os

logger = logging.getLogger(__name__)


def send_sms(
    recipient: str,
    message: str,
) -> bool:
    """
    Sends an SMS when an SMS provider is configured.

    If no provider credentials are configured, the SMS is logged
    in test mode so the feature can be tested without a real SMS
    account or phone number.
    """

    sms_provider = os.getenv("SMS_PROVIDER")
    sms_api_key = os.getenv("SMS_API_KEY")
    sms_from = os.getenv("SMS_FROM")

    # Development/test mode.
    if not sms_provider or not sms_api_key or not sms_from:
        logger.info(
            "SMS NOTIFICATION (test mode) | To: %s | Message: %s",
            recipient,
            message,
        )
        return True

    # Provider integration can be added here when deployment
    # credentials are configured.
    logger.info(
        "SMS provider configured, but no provider implementation "
        "has been selected yet."
    )
    return False