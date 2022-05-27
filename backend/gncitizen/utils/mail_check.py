from flask import current_app
from itsdangerous import URLSafeTimedSerializer
import smtplib
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText



def send_user_email(
    subject: str, to: str, plain_message: str = None, html_message: str = None
):
    msg = MIMEMultipart("alternative")
    msg["Subject"] = subject
    msg["From"] = current_app.config["MAIL"]["MAIL_AUTH_LOGIN"]
    msg["To"] = to
    plain_msg = MIMEText(
        html_message,
        "plain",
    )
    msg.attach(plain_msg)

    if plain_message:
        plain_msg = MIMEText(
            plain_message,
            "html",
        )
        msg.attach(plain_msg)

    if html_message:
        html_msg = MIMEText(
            html_message,
            "html",
        )
        msg.attach(html_msg)

    try:
        if current_app.config["MAIL"]["MAIL_USE_SSL"]:
            server = smtplib.SMTP_SSL(
                current_app.config["MAIL"]["MAIL_HOST"],
                int(current_app.config["MAIL"]["MAIL_PORT"]),
            )
        else:
            server = smtplib.SMTP(
                current_app.config["MAIL"]["MAIL_HOST"],
                int(current_app.config["MAIL"]["MAIL_PORT"]),
            )

        server.ehlo()
        if current_app.config["MAIL"]["MAIL_STARTTLS"]:
            server.starttls()
        server.login(
            str(current_app.config["MAIL"]["MAIL_AUTH_LOGIN"]),
            str(current_app.config["MAIL"]["MAIL_AUTH_PASSWD"]),
        )
        server.sendmail(
            current_app.config["MAIL"]["MAIL_AUTH_LOGIN"],
            to,
            msg.as_string(),
        )
        server.quit()

    except Exception as e:
        current_app.logger.warning("send email failled. %s", str(e))
        return {"message": """ send email failled: "{}".""".format(str(e))}

def confirm_user_email(newuser):

    token = generate_confirmation_token(newuser.email)
    msg = MIMEMultipart("alternative")
    msg["Subject"] = current_app.config["CONFIRM_EMAIL"]["SUBJECT"]
    msg["From"] = current_app.config["CONFIRM_EMAIL"]["FROM"]
    msg["To"] = newuser.email

    # Check URL_APPLICATION:
    url_application = current_app.config["URL_APPLICATION"]
    if url_application[-1] == "/":
        url_application = url_application
    else:
        url_application = url_application + "/"
    print("url_application", url_application)
    activate_url = url_application + "confirmEmail/" + token
    # Record the MIME  text/html.
    msg_body = MIMEText(
        current_app.config["CONFIRM_EMAIL"]["HTML_TEMPLATE"].format(
            activate_url=activate_url
        ),
        "html",
    )

    msg.attach(msg_body)

    try:
        if current_app.config["MAIL"]["MAIL_USE_SSL"]:
            server = smtplib.SMTP_SSL(
                current_app.config["MAIL"]["MAIL_HOST"],
                int(current_app.config["MAIL"]["MAIL_PORT"]),
            )
        else:
            server = smtplib.SMTP(
                current_app.config["MAIL"]["MAIL_HOST"],
                int(current_app.config["MAIL"]["MAIL_PORT"]),
            )

        server.ehlo()
        if current_app.config["MAIL"]["MAIL_STARTTLS"]:
            server.starttls()
        server.login(
            str(current_app.config["MAIL"]["MAIL_AUTH_LOGIN"]),
            str(current_app.config["MAIL"]["MAIL_AUTH_PASSWD"]),
        )
        server.sendmail(
            current_app.config["CONFIRM_EMAIL"]["FROM"], newuser.email, msg.as_string()
        )
        server.quit()

    except Exception as e:
        current_app.logger.warning("send confirm_email failled. %s", str(e))
        return {"message": """ send confirm_email failled: "{}".""".format(str(e))}


def generate_confirmation_token(email):
    serializer = URLSafeTimedSerializer(current_app.config["SECRET_KEY"])
    return serializer.dumps(email, salt=current_app.config["CONFIRM_MAIL_SALT"])


def confirm_token(token):
    serializer = URLSafeTimedSerializer(current_app.config["SECRET_KEY"])
    try:
        email = serializer.loads(token, salt=current_app.config["CONFIRM_MAIL_SALT"],)
    except:
        raise Exception("error token")
    return email
