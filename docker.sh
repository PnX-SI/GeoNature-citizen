# Exit on error
set -e

DIR=$(pwd)

# Check settings file exists
./install/check_settings.sh

# Check if docker installed
if ! docker --version; then
  # https://docs.docker.com/engine/install/debian/
  sudo apt-get update
  sudo apt-get install \
      ca-certificates \
      curl \
      gnupg \
      lsb-release
  curl -fsSL https://download.docker.com/linux/debian/gpg | sudo gpg --dearmor -o /usr/share/keyrings/docker-archive-keyring.gpg
  echo \
    "deb [arch=$(dpkg --print-architecture) signed-by=/usr/share/keyrings/docker-archive-keyring.gpg] https://download.docker.com/linux/debian \
    $(lsb_release -cs) stable" | sudo tee /etc/apt/sources.list.d/docker.list > /dev/null
  sudo apt-get update
  sudo apt-get install docker-ce docker-ce-cli containerd.io docker-compose
  sudo groupadd docker
  sudo usermod -aG docker $USER
  newgrp docker
fi

# Check htpasswd utility is installed
if ! command -v htpasswd &> /dev/null
then
  sudo apt-get -y install apache2-utils
fi
# Source config
. config/settings.ini
# Overwrite pg_db_name variable since the dbname is the
# docker-compose service
pg_dbname=citizen-db

# Copy configurations
. ./install/copy_config.sh

# Generate password
. ./install/generate_password.sh

# Prepare directories
mkdir -p media

# Down everything
docker-compose down
# Launch everything in detached mode
docker-compose up -d
