import {
  Component,
  ViewEncapsulation,
  AfterViewInit,
  ViewChild,
  ElementRef
} from "@angular/core";
import { HttpClient, HttpHeaders } from "@angular/common/http";
import { ActivatedRoute } from "@angular/router";
import { FormControl, FormGroup, Validators } from "@angular/forms";
import { Observable } from "rxjs";
import { map, tap } from "rxjs/operators";

import { NgbDate } from "@ng-bootstrap/ng-bootstrap";
import { Position, Point } from "geojson";
import * as L from "leaflet";
import { LeafletMouseEvent } from "leaflet";

import { AppConfig } from "../../../../conf/app.config";

// import { GNCBootstrap4Framework } from './framework/framework.ts';
// import { FrameworkLibraryService } from 'angular6-json-schema-form';
// constructor(frameworkLibrary: FrameworkLibraryService) { }
// frameworkLibrary.setFramework(GNCBootstrap4Framework);
import { Bootstrap4FrameworkModule } from 'angular6-json-schema-form';

declare let $: any;

// TODO: migrate to conf
export const taxonListThreshold = 10;
export const obsFormMarkerIcon = L.icon({
  iconUrl: "../../../../assets/pointer-blue2.png", // TODO: Asset path should be normalized, conf ?
  iconAnchor: [16, 42]
});
export const myMarkerTitle =
  '<i class="fa fa-eye"></i> Partagez votre observation';

@Component({
  selector: "app-site-form",
  templateUrl: "./form.component.html",
  styleUrls: ["./form.component.css"],
  encapsulation: ViewEncapsulation.None
})
export class SiteFormComponent implements AfterViewInit {
  private readonly URL = AppConfig.API_ENDPOINT;
  currentStep: number = 1;
  currentMode: string = "basic";
  partialLayout: any;
  advancedMode: boolean = false;
  jsonData: object = {};
  formOptions: any = {
    "debug": true,
    "returnEmptyFields": false,
    "addSubmit": false
  }
  jsonSchema: any = {
    "schema": {
      "title": "Mare",
      "description": "Données associées à une mare",
      "type": "object",
      "properties": {
        "environnement": {
          "title": "Environnement Immédiat",
          "description": "Quel est le type de milieu représentant le mieux (milieu dominant) l’occupation du sol sur la parcelle où se situe la mare",
          "type": "string",
          "enum": [
            "Prairie",
            "Champs cultivé",
            "Bois de feuillus",
            "Bois de résineux",
            "Friche / lande",
            "Zone humide",
            "Zone urbanisé",
            "Parc de loisirs / jardin"
          ]
        },
        "presenceCorridor": {
          "title": "Présence d’un corridor linéaire",
          "description": "Existe-t-il un corridor linéaire naturel facilitant le déplacement des espèces animales à proximité de la mare (à moins de 5 mètres) ? Ce corridor peut être aquatique (fossé, ruisseau) ou végétal (haie).",
          "type": "string",
          "enum": [
            "Fossé / ruisseau",
            "Haie",
            "Fossé / ruisseau ET haie",
            "Aucun corridor"
          ],
        },
        "corridorFonctionnel": {
          "title": "Si oui, le corridor est-il fonctionnel ?",
          "description": "La fonctionnalité du corridor pour le déplacement de la faune peut être altérée par la présence d’obstacles ou une structure défavorable : présence d’une buse sur un fossé, haie discontinue, haie sans strate arbustive…",
          "type": "string",
          "enum": [
            "Fonctionnel",
            "Altéré"
          ],
        },
        "natureFond": {
          "title": "Nature du fond",
          "description": "La bâche en caoutchouc se distingue de la bâche en plastique par son élasticité. Les bâches peuvent être recouvertes par de la sédimentation naturelle (vase), elles sont cependant généralement visibles sur les berges.",
          "type": "string",
          "enum": [
            "Naturel",
            "Béton / pierre",
            "Bâche en caoutchouc synthétique",
            "Bâche en plastique (PVC)"
          ]
        },
        "longueur": {
          "title": "Longueur",
          "description": "Vous pouvez l’estimer en comptant le nombre de pas nécessaire pour couvrir sa plus grande longueur : un pas allongé par rapport à la foulée normale représente environ 1 m.",
          "type": "integer"
        },
        "largeur": {
          "title": "Largeur",
          "description": "Vous pouvez l’estimer en comptant le nombre de pas nécessaire pour couvrir sa plus grande largeur : un pas allongé par rapport à la foulée normale représente environ 1 m.",
          "type": "integer"
        },
        "surface": {
          "title": "Surface en m²",
          "description": "Vous pouvez l’estimer en multipliant les longueurs et largeurs maximales relevées. Comme la mare n’est que rarement un rectangle parfait, la surface réelle sera inférieure au résultat trouvé.",
          "type": "integer"
        },
        "profondeurMax": {
          "title": "Profondeur maximale",
          "description": "La profondeur varie en fonction de la saison, elle n’est pas souvent facile à mesurer. Elle correspond à la hauteur entre le fond et la crête de berge. Pour l’estimer, vous pouvez utiliser un bâton planté à l’endroit le plus profond de la mare (en général au centre), s’il est accessible (mare petite et peu profonde, utilisation de bottes ou cuissardes). À défaut, cette estimation peut se faire à vue : la visibilité du fond (si l’eau est limpide), la taille de la mare ainsi que le profil et la pente observés sur les berges peuvent vous aider à réaliser cette estimation",
          "type": "string",
          "enum": [
            "≤ 50 cm",
            "Entre 51 et 100 cm",
            "Entre 101 et 150 cm",
            "> 150 cm"
          ]
        },
        "presenceEau": {
          "title": "Présence d’eau lors de la visite",
          // "description": "",
          "type": "string",
          "enum": [
            "Oui",
            "Non",
            "Eau limpide",
            "Eau trouble"
          ]
        },
        "turbiditeEau": {
          "title": "Turbidité de l’eau",
          "description": "Une eau limpide permet d’observer le fond de la mare.",
          "type": "string",
          "enum": [
            "Eau limpide",
            "Eau trouble",
          ]
        },
        "regimeHydro": {
          "title": "Régime hydrologique",
          "description": "La mare s’assèche t-elle en été ? Dans ce cas on parle de mare temporaire. Pour répondre à cette question, il faut pouvoir observer la niveau d’eau dans la mare en période de plus basses eaux (généralement août-septembre). Si vous ne savez pas, vous pouvez répondre « indéterminé ».",
          "type": "string",
          "enum": [
            "Permanent",
            "Temporaire",
            "Indéterminé"
          ]
        },
        "alimentationEau": {
          "title": "Alimentation en eau",
          "description": "Les mares sont en général alimentées par de l’eau d’origine pluviale (alimentation directe et ruissellement). Elles peuvent également être alimentées par une nappe superficielle, ou encore par captation de l’eau d’un cours d’eau ou d’un fossé. Si vous ne savez pas vous pouvez répondre « indéterminé ».",
          "type": "string",
          "enum": [
            "Eau pluviale",
            "Cours d’eau ou fossé",
            "Nappe",
            "Indéterminé"
          ]
        },
        "ouvrageRegulationHydraulique": {
          "title": "Présence d’un ouvrage de régulation hydraulique",
          "description": "Dans le cas de petits plans d’eau alimentés par un cours d’eau ou un fossé, la gestion du niveau d’eau est parfois possible grâce à l’implantation d’un ouvrage de type vanne, martelière, moine…",
          "type": "string",
          "enum": [
            "Oui",
            "Non"
          ]
        },
        "presencePoissons": {
          "title": "Présence de poissons",
          "description": "Si la présence de poissons n’est directement observée (avérée), elle peut cependant être suspectée (présence probable) : la nature et la taille du plan d’eau, la turbidité de l’eau, des traces d’activité piscicole (bouchons, flotteurs)… sont des indices de présence potentielle",
          "type": "string",
          "enum": [
            "Absence",
            "Probable",
            "Avérée"
          ]
        },
        "dechets": {
          "title": "Déchets",
          "description": "Notez si des déchets sont présents en faible quantité (quelques petits détritus de type bouteilles, ferrailles et plastiques divers …) ou en grande quantité (déchets de toute nature en quantité importante, souvent déposés dans le cadre d’un comblement de la mare).",
          "type": "string",
          "enum": [
            "Absence",
            "Faible quantité",
            "Quantité importante"
          ]
        },
        "pollution": {
          "title": "Pollution",
          "description": "Notez si des traces visibles de pollutions chimique ou organique sont observées : nappe d’hydrocarbure, bouse de vache…).",
          "type": "string",
          "enum": [
            "Absence de traces visibles",
            "Avérée"
          ]
        },
        "usages": {
          "title": "Usages (plusieurs choix possibles)",
          "description": "Les mares peuvent avoir plusieurs fonctions : agricole (abreuvement du bétail, avec aménagements ou non : clôtures, pompe à museau….), traitement de l’eau (lagunage), stockage des eaux de ruissellement (rétention), loisirs (pêche, chasse), pédagogique, écologique (protection de la biodiversité) … cochez le ou les usages observés sur la mare.",
          "type": "string",
          "enum": [
            "Abreuvoir aménagé",
            "Abreuvoir non aménagé",
            "Collecte ruissellement (rétention)",
            "Lagunage",
            "Pêche",
            "Chasse",
            "Ornemental",
            "Pédagogique",
            "Écologique",
            "Autre",
            "Abandonné",
            "Indéterminé"
          ]
        },
        "penteBerges": {
          "title": "Berges en pente douce",
          "description": "On considère qu’une berge est en pente douce lorsque le rapport  hauteur / longueur de la pente est de 1 sur 3 (33%). Quel est le pourcentage du linéaire total de berge qui comprend des pentes douces ?",
          "type": "string",
          "enum": [
            "0 %",
            ">0-50 %",
            "51-100 %"
          ]
        },
        "boisementBerges": {
          "title": "Boisement / embroussaillement des berges",
          "description": "Quel est le pourcentage du linéaire total de berge qui comprend une végétation arbustive ou arborée ?",
          "type": "string",
          "enum": [
            "0 %",
            ">0-50 %",
            "51-100 %"
          ]
        },
        "ombrage": {
          "title": "Ombrage",
          "description": "Quand le soleil est au zénith, quel est le pourcentage de la surface de la mare qui est à l’ombre du fait de la végétation (arbres, arbustes) située sur les berges ?",
          "type": "string",
          "enum": [
            "0 %",
            ">0-50 %",
            "51-100 %"
          ]
        },
        "vegetationHelophyte": {
          "title": "Végétation hélophytes",
          "description": "La végétation hélophytes est composée d’espèces qui poussent les pieds dans l’eau mais dont les feuilles se situent au dessus du niveau de l’eau (par exemple : le roseau). Quel est le pourcentage de la surface de la mare occupé par la végétation d’hélophytes ?",
          "type": "string",
          "enum": [
            "0 %",
            ">0-50 %",
            "51-100 %"
          ]
        },
        "vegetationHydrophyte": {
          "title": "Végétation hydrophytes",
          "description": "La végétation hydrophyte est composée d’espèces aquatiques dont les feuilles se situent sous ou à la surface de l’eau (par exemple : le nénuphar). Quel est le pourcentage de la surface de la mare occupé par la végétation d’hydrophytes ?",
          "type": "string",
          "enum": [
            "0 %",
            ">0-50 %",
            "51-100 %"
          ]
        },
        "eauLibre": {
          "title": "Eau libre",
          "description": "Quel est le pourcentage de la surface de la mare sans végétation ?",
          "type": "string",
          "enum": [
            "0 %",
            ">0-50 %",
            "51-100 %"
          ]
        },
        "remarques": {
          "title": "Remarques",
          "description": "",
          "type": "string"
        }
      }
    },
    // "layout": [
    //   { "key": "environnement", "mode": "basic", "step": 1 },
    //   { "key": "presenceCorridor", "mode": "advanced", "step": 1 },
    //   { "key": "corridorFonctionnel", "mode": "advanced", "step": 1 },
    //   { "key": "natureFond", "mode": "basic", "step": 2 },
    //   { "key": "longueur", "mode": "advanced", "step": 2 },
    //   { "key": "largeur", "mode": "advanced", "step": 2 },
    //   { "key": "surface", "mode": "advanced", "step": 2 },
    //   { "key": "profondeurMax", "mode": "advanced", "step": 2 },
    //   { "key": "presenceEau", "mode": "basic", "step": 3 },
    //   { "key": "turbiditeEau", "mode": "basic", "step": 3 },
    //   { "key": "regimeHydro", "mode": "advanced", "step": 3 },
    //   { "key": "alimentationEau", "mode": "advanced", "step": 3 },
    //   { "key": "ouvrageRegulationHydraulique", "mode": "advanced", "step": 3 },
    //   { "type": 'submit', "title": 'Submit', "mode": "basic", "step": 3 }
    // ]
    "steps": [
      {
        "title": "Environnement de la mare",
        "layout": [
          { "key": "environnement", "mode": "basic" },
          { "key": "presenceCorridor", "mode": "advanced" },
          { "key": "corridorFonctionnel", "mode": "advanced" },
        ]
      },
      {
        "title": "Caractéristiques physiques de la mare",
        "layout": [
          { "key": "natureFond", "mode": "basic" },
          { "key": "longueur", "mode": "advanced" },
          { "key": "largeur", "mode": "advanced" },
          { "key": "surface", "mode": "advanced" },
          { "key": "profondeurMax", "mode": "advanced" },
        ]
      },
      {
        "title": "Hydrologie de la mare",
        "layout": [
          { "key": "presenceEau", "mode": "basic" },
          { "key": "turbiditeEau", "mode": "basic" },
          { "key": "regimeHydro", "mode": "advanced" },
          { "key": "alimentationEau", "mode": "advanced" },
          { "key": "ouvrageRegulationHydraulique", "mode": "advanced" },
        ]
      },
      {
        "title": "Usages et perturbations",
        "layout": [
          { "key": "presencePoissons", "mode": "basic" },
          { "key": "dechets", "mode": "basic" },
          { "key": "pollution", "mode": "advanced" },
          { "key": "usages", "mode": "advanced" }
        ]
      },
      {
        "title": "Berges et végétation",
        "layout": [
          { "key": "penteBerges", "mode": "advanced" },
          { "key": "boisementBerges", "mode": "advanced" },
          { "key": "ombrage", "mode": "advanced" },
          { "key": "vegetationHelophyte", "mode": "advanced" },
          { "key": "vegetationHydrophyte", "mode": "advanced" },
          { "key": "eauLibre", "mode": "advanced" },
        ]
      },
      {
        "title": "Remarques",
        "layout": [
          { "key": "remarques", "type": "textarea", "notitle": true, "mode": "basic" },
          { "type": 'submit', "title": 'Submit', "mode": "basic" }
        ]
      }
    ]
  };

  constructor(private http: HttpClient, private route: ActivatedRoute) {}

  ngAfterViewInit() {
    this.updatePartialLayout();
  }

  nextStep() {
    this.currentStep += 1;
    this.updatePartialLayout();
  }
  previousStep() {
    this.currentStep -= 1;
    this.updatePartialLayout();
  }
  updatePartialLayout() {
    var that = this;
    this.partialLayout = this.jsonSchema.steps[this.currentStep-1].layout.filter(function (e) {
      return that.advancedMode || e.mode === "basic";
    });
  }
  isFirstStep() {
    return this.currentStep === 1;
  }
  isLastStep() {
    return this.currentStep === this.jsonSchema.steps.length;
  }
  yourOnChangesFn(e) {
    // console.log(e)
  }
  toogleAdvancedMode() {
    this.advancedMode = !this.advancedMode;
    this.updatePartialLayout();
  }
 }
