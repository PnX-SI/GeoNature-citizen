FROM debian:buster-slim


## install dependencies
RUN apt-get update && \
    apt-get upgrade -y && \
    apt-get install -y sudo vim nano locales unzip && \
    localedef -i fr_FR -c -f UTF-8 -A /usr/share/locale/locale.alias fr_FR.UTF-8 && \
    apt-get clean

## set envs
ENV LANG fr_FR.utf8
ENV TERM xterm

RUN adduser --uid 1001 --gecos ""  --disabled-password appuser
RUN usermod -aG sudo appuser 
RUN echo "appuser ALL=(ALL) NOPASSWD:ALL" >> /etc/sudoers

COPY . /home/appuser/citizen
RUN chown -R appuser:appuser /home/appuser

USER appuser

WORKDIR /home/appuser/citizen

VOLUME /var/lib/postgresql
VOLUME /etc/postgresql
VOLUME /etc/apache2
VOLUME /etc/supervisor

EXPOSE 80
EXPOSE 5432
