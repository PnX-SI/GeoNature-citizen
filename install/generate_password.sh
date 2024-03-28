

if [ ${backoffice_password:=MotDePasseAChanger} = MotDePasseAChanger ]; then
    backoffice_password=$(
      date +%s | sha256sum | base64 | head -c 30
      echo
    )
  fi
  echo "Backoffice password
===================
url: (${URL}/api/admin)
username: ${backoffice_username:=citizen}
password: ${backoffice_password}" >${DIR}/config/backoffice_access
  htpasswd -b -c ${DIR}/config/backoffice_htpasswd ${backoffice_username} ${backoffice_password}
