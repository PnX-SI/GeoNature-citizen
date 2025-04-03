import { AppConfig } from './app.config';
import { MAP_CONFIG as MapConfig } from './map.config';

export const DefaulConfig = {
    // Default MainConfig
    appName: 'GeoNature-citizen',
    API_ENDPOINT: 'http://localhost:5002/api',
    API_TAXHUB: 'http://localhost:5000/api',
    API_CITY: 'https://nominatim.openstreetmap.org/reverse',
    HCAPTCHA_SITE_KEY: null,
    FRONTEND: {
        PROD_MOD: true,
        MULTILINGUAL: false,
        DISPLAY_FOOTER: true,
        DISPLAY_TOPBAR: true,
        DISPLAY_SIDEBAR: true,
        DISPLAY_STATS: true,
        DISPLAY_BADGES: true,
        NEW_OBS_FORM_MODAL_VERSION: true,
    },
    META: {
        keywords: 'biodiversite enquetes participatif observations',
    },
    about: true,
    URL_APPLICATION: 'http://127.0.0.1:4200',
    REWARDS: true,
    termsOfUse: {
        fr: 'assets/cgu.pdf',
        en: 'assets/termsOfUse.pdf',
    },
    signup: 'optional', // never|optional|always
    email_contact: false,
    platform_intro: {
        fr: 'Bienvenue<br /> sur GeoNature Citizen',
        en: 'Welcome<br /> on GeoNature Citizen',
    },
    platform_teaser: {
        fr: 'Hae duae provinciae bello quondam piratico catervis mixtae praedonum a Servilio pro consule missae sub iugum factae sunt vectigales. et hae quidem regiones velut in prominenti terrarum lingua positae ob orbe eoo monte Amano disparantur.',
        en: 'Hae duae provinciae bello quondam piratico catervis mixtae praedonum a Servilio pro consule missae sub iugum factae sunt vectigales. et hae quidem regiones velut in prominenti terrarum lingua positae ob orbe eoo monte Amano disparantur.',
    },
    platform_participate: {
        fr: 'PARTICIPER AU PROGRAMME',
        en: 'PARTICIPATE',
    },
    programs_label: {
        fr: 'Programmes',
        en: 'Surveys',
    },
    program_label: {
        fr: 'Le programme',
        en: 'Survey',
    },
    program_share_an_observation: {
        fr: 'PARTAGER UNE OBSERVATION',
        en: 'SHARE AN OBSERVATION',
    },
    program_add_an_observation: {
        fr: 'AJOUTER UNE OBSERVATION',
        en: 'CONTRIBUTE AN OBSERVATION',
    },
    program_allow_email_contact: {
        fr: "J'accepte que mon adresse e-mail puisse être utilisée pour recontacter à propos de mon observation",
        en: 'I agree that my e-mail address can be used to recontact about my observation',
    },
    taxonDisplayImageWhenUnique: true,
    taxonSelectInputThreshold: 7,
    taxonAutocompleteInputThreshold: 30,
    taxonAutocompleteFields: [
        'nom_complet',
        'nom_vern',
        'nom_vern_eng',
        'cd_nom',
    ],
    taxonDisplaySciName: true,
    program_list_observers_names: true,
    program_list_sort: '-timestamp_create',
    details_espece_url: '<url_inpn_or_atlas>/cd_nom/', // !! gardez bien le cd_nom/ dans l'url
    registration_message: 'Vous inscrire vous permet de gérer vos observations',
    imageUpload: {
        maxHeight: 1440,
        maxWidth: 1440,
        quality: 0.9,
    },
    // Default MapConfig
    DEFAULT_PROVIDER: 'OpenStreetMapOrg',
    BASEMAPS: [
        {
            name: 'OpenStreetMapOrg',
            maxZoom: 19,
            layer: '//{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
            subdomains: 'abc',
            attribution:
                '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors, Tiles style by <a href="https://www.hotosm.org/" target="_blank">Humanitarian OpenStreetMap Team</a> hosted by <a href="https://openstreetmap.fr/" target="_blank">OpenStreetMap France</a>',
        },
    ],
    CENTER: [46.52863469527167, 2.43896484375],
    ZOOM_LEVEL: 6,
    ZOOM_LEVEL_RELEVE: 15,
    NEW_OBS_POINTER: 'assets/pointer-blue2.png',
    OBS_POINTER: 'assets/pointer-green.png',
    LOCATE_CONTROL_TITLE: {
        fr: 'Me localiser',
        en: 'Show me where i am',
    },
    VERIFY_OBSERVATIONS_ENABLED: false,
};

export const MainConfig = { ...DefaulConfig, ...AppConfig, ...MapConfig };

export default MainConfig;
