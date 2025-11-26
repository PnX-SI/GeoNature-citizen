# 🔄 Mise à jour de GeoNature-citizen

## ⚠️ Prérequis et précautions

Avant toute mise à jour, **sauvegardez impérativement** :

- 📦 Les fichiers de l’application  
- 🗃️ La base de données PostgreSQL  
  _ou_  
- 🖼️ Réalisez un **snapshot complet** du serveur

> En cas de problème, cela permet de restaurer l’état antérieur de l'application.

---

## 🛠️ Méthode 1 – Mise à jour manuelle

### 1. Sauvegarder l'instance existante

```bash
cd ~/
mv ~/gncitizen ~/gncitizen_old
```

### 2. Télécharger la nouvelle version

```bash
VERSION=X.Y.Z  # Remplacez X.Y.Z par la version cible
curl -OJL https://github.com/PnX-SI/GeoNature-citizen/archive/refs/tags/$VERSION.zip
unzip GeoNature-citizen-$VERSION.zip
mv GeoNature-citizen-$VERSION gncitizen
rm GeoNature-citizen-$VERSION.zip
```

### 3. Restaurer les fichiers de configuration et personnalisations

```bash
cp ~/gncitizen_old/config/settings.ini ~/gncitizen/config/
cp ~/gncitizen_old/config/config.toml ~/gncitizen/config/
cp ~/gncitizen_old/config/backoffice_* ~/gncitizen/config/
cp ~/gncitizen_old/config/badges_config.py ~/gncitizen/config/

cp ~/gncitizen_old/frontend/src/conf/app.config.ts ~/gncitizen/frontend/src/conf/
cp ~/gncitizen_old/frontend/src/conf/map.config.ts ~/gncitizen/frontend/src/conf/
cp -r ~/gncitizen_old/frontend/src/custom/* ~/gncitizen/frontend/src/custom/

cp -r ~/gncitizen_old/media/ ~/gncitizen/media/
```

> ✅ Ces fichiers devraient idéalement être suivis ou exclus proprement avec `.gitignore` si vous utilisez Git.

---

## 🌿 Méthode 2 – Mise à jour via Git (recommandée si dépôt cloné)

### 1. Aller dans le répertoire de l’application

```bash
cd ~/gncitizen
```

### 2. Mettre à jour le dépôt

```bash
git pull
```

> ⚙️ Les fichiers de config/perso sont gérés avec `.gitignore` et donc conservés.

---

## 📌 Étapes communes post-mise à jour

### 3. Lire les notes de version

Consultez les [notes de version](https://github.com/PnX-SI/GeoNature-citizen/releases) pour vérifier s’il y a :

- des scripts à exécuter
- des fichiers à modifier
- des migrations de base de données à effectuer

---

### 4. Lancer le script de mise à jour de l'application

```bash
cd ~/gncitizen
./install/update_app.sh
```

---

### 5. Effectuer les migrations de base de données (si nécessaire)

> ⚠️ Vérifiez la version cible de la BDD dans les notes de version pour définir le bon **Alembic stamp**.

```bash
ALEMBIC_STAMP=e8c1cd57ad16  # Remplacez par le hash correct selon la version

cd ~/gncitizen/backend
source .venv/bin/activate

flask db stamp $ALEMBIC_STAMP
flask db upgrade

deactivate
```

---

## ✅ C'est terminé !

L’application GeoNature-citizen est maintenant à jour.  
Pensez à tester rapidement l’interface et les fonctionnalités principales pour valider la mise à jour.

⚠️ Pensez à supprimer le répertoire de l'installation précédente (`gncitizen_old`) afin de libérer de l'espace disque. En particulier le répertoire `media` qui a été copié dans le répertoire de la nouvelle version.
