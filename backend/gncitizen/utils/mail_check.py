
from flask import current_app
from itsdangerous import URLSafeTimedSerializer
import smtplib
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText


def confirm_user_email(newuser):

    token = generate_confirmation_token(newuser.email)
    msg = MIMEMultipart("alternative")
    msg["Subject"] = current_app.config["CONFIRM_EMAIL"]["SUBJECT"]
    msg["From"] = current_app.config["CONFIRM_EMAIL"]["FROM"]
    msg["To"] = newuser.email

    # Record the MIME  text/html.
    msg_body = MIMEText(
        current_app.config["CONFIRM_EMAIL"]["HTML_TEMPLATE"].format(
            activate_url=current_app.config["URL_APPLICATION"] +
            "confirmEmail/"+token
        ),
        "html")

    msg.attach(msg_body)

    try:
        with smtplib.SMTP_SSL(
            current_app.config["MAIL"]["MAIL_HOST"],
            int(current_app.config["MAIL"]["MAIL_PORT"]),
        ) as server:
            server.ehlo()
            if current_app.config["MAIL"]["MAIL_STARTTLS"]:
                server.starttls()
            server.login(
                str(current_app.config["MAIL"]["MAIL_AUTH_LOGIN"]),
                str(current_app.config["MAIL"]["MAIL_AUTH_PASSWD"]),
            )
            server.sendmail(
                current_app.config["CONFIRM_EMAIL"]["FROM"], newuser.email, msg.as_string(
                )
            )
            server.quit()

    except Exception as e:
        current_app.logger.warning(
            "send confirm_email failled. %s", str(e)
        )
        return (
            {
                "message": """ send confirm_email failled: "{}".""".format(
                    str(e)
                )
            }
        )


def generate_confirmation_token(email):
    serializer = URLSafeTimedSerializer(current_app.config['SECRET_KEY'])
    return serializer.dumps(email, salt=current_app.config['CONFIRM_MAIL_SALT'])


def confirm_token(token):
    serializer = URLSafeTimedSerializer(current_app.config['SECRET_KEY'])
    try:
        email = serializer.loads(
            token,
            salt=current_app.config['CONFIRM_MAIL_SALT'],
        )
    except:
        raise Exception('error token')
    return email
