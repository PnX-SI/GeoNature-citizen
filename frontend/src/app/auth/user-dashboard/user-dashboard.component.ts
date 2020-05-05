import { Component, OnInit } from "@angular/core";
import { Router } from "@angular/router";
import { throwError, forkJoin } from "rxjs";
import { tap, catchError } from "rxjs/operators";
import { NgbModal, NgbModalRef } from "@ng-bootstrap/ng-bootstrap";
import { AppConfig } from "../../../conf/app.config";
import { AuthService } from "./../auth.service";
import { UseService } from "./user.service.service";
import { saveAs } from "file-saver";
import * as _ from "lodash";
import { Point } from "leaflet";
import { FormBuilder, FormGroup, Validators } from "@angular/forms";
import { CustomFormValidator } from "./customFormValidator";
import { ModalFlowService } from "../../programs/observations/modalflow/modalflow.service";

@Component({
  selector: "app-user-dashboard",
  templateUrl: "./user-dashboard.component.html",
  styleUrls: ["./user-dashboard.component.css"]
})
export class UserDashboardComponent implements OnInit {
  public appConfig = AppConfig;
  modalRef: NgbModalRef;
  modalRefDel: NgbModalRef;
  username: string = "not defined";
  role_id: number;
  isLoggedIn: boolean = false;
  stats: any;
  personalInfo: any = {};
  badges: any;
  main_badges: any = [];
  programs_badges: any = [];
  recognition_badges: any = [];
  observations: any;
  rows: any = [];
  obsToExport: any = [];
  userForm: FormGroup;
  currentUser: any;
  userAvatar: string | ArrayBuffer;
  extentionFile: any;
  newAvatar: string | ArrayBuffer;
  idObsToDelete: number;

  constructor(
    private auth: AuthService,
    private userService: UseService,
    private router: Router,
    private modalService: NgbModal,
    private flowService: ModalFlowService,
    private formBuilder: FormBuilder
  ) {}

  ngOnInit(): void {
    const access_token = localStorage.getItem("access_token");
    if (access_token) {
      this.auth
        .ensureAuthorized()
        .pipe(
          tap(user => {
            if (user && user["features"] && user["features"]["id_role"]) {
              this.isLoggedIn = true;
              this.username = user["features"]["username"];
              this.stats = user["features"]["stats"];
              this.role_id = user["features"]["id_role"];
              if (user["features"]["avatar"])
                this.userAvatar =
                  this.appConfig.API_ENDPOINT +
                  "/media/" +
                  user["features"]["avatar"];
              // FIXME: source backend conf
              this.getData();
              this.flowService.getModalCloseSatus().subscribe(status => {
                if (status === "updateObs") this.getData();
              });
            }
          }),
          catchError(err => throwError(err))
        )
        .subscribe(user => {
          this.currentUser = user;
        });
    }
  }

  getData() {
    let data = [];
    this.rows = [];
    this.obsToExport = [];
    this.observations = null;
    this.badges = null;
    this.main_badges = [];
    this.programs_badges = [];
    this.recognition_badges = [];
    let badgeCategories = this.userService.getBadgeCategories(this.role_id);
    let userObservations = this.userService.getObservationsByUserId(
      this.role_id
    );
    if (AppConfig["REWARDS"]) {
      data.push(badgeCategories);
    }
    data.push(userObservations);

    forkJoin(data).subscribe((data: any) => {
      if (data.length > 1) {
        this.badges = data[0];
        localStorage.setItem("badges", JSON.stringify(this.badges));
        this.badges.forEach(badge => {
          if (badge.type == "all_attendance" || badge.type == "seniority")
            this.main_badges.push(badge);
          if (badge.type == "program_attendance")
            this.programs_badges.push(badge);
          if (badge.type == "recognition") this.recognition_badges.push(badge);
        });
        this.observations = data[1].features;
        this.observations.forEach(obs => {
          let coords: Point = new Point(
            obs.geometry.coordinates[0],
            obs.geometry.coordinates[1]
          );
          this.rowData(obs, coords);
          this.obsExport(obs);
        });
      } else {
        this.observations = data[0].features;
        this.observations.forEach(obs => {
          let coords: Point = new Point(
            obs.geometry.coordinates[0],
            obs.geometry.coordinates[1]
          );
          this.rowData(obs, coords);
          this.obsExport(obs);
        });
      }
    });
  }

  rowData(obs, coords) {
    this.rows.push({
      media_url:
        obs.properties.images && !!obs.properties.images.length
          ? AppConfig.API_ENDPOINT + "/media/" + obs.properties.images[0]
          : obs.properties.image
          ? obs.properties.image
          : obs.properties.medias && !!obs.properties.medias.length
          ? AppConfig.API_TAXHUB +
            "/tmedias/thumbnail/" +
            obs.properties.medias[0].id_media +
            "?h=80&v=80"
          : "assets/default_image.png",
      taxref: obs.properties.taxref,
      date: obs.properties.date,
      municipality: obs.properties.municipality.name,
      program_id: obs.properties.id_program,
      program: obs.properties.program_title,
      count: obs.properties.count,
      comment: obs.properties.comment,
      id_observation: obs.properties.id_observation,
      taxon: {
        media: obs.properties.media,
        taxref: obs.properties.taxref
      },
      coords: coords
    });
  }

  obsExport(obs) {
    this.obsToExport.push({
      "id_observation": obs.properties.id_observation,
      "date": obs.properties.date,
      "programme": obs.properties.program_title,
      "denombrement": obs.properties.count,
      "commentaire": obs.properties.comment,
      "commune": obs.properties.municipality.name,
      "cd_nom": obs.properties.taxref.cd_nom,
      "espece": obs.properties.taxref.nom_vern,
      "nom complet": obs.properties.taxref.nom_complet,
      "coordonnee_x": obs.geometry.coordinates[0],
      "coordonnee_y": obs.geometry.coordinates[1]
    });
  }

  onDeletePersonalData() {
    const access_token = localStorage.getItem("access_token");
    this.auth
      .selfDeleteAccount(access_token)
      .then(data => {
        localStorage.clear();
        let getBackHome = confirm(
          data.hasOwnProperty("message")
            ? `${data.message}\nRevenir à l'accueil ?`
            : data
        );
        if (getBackHome) {
          this.router.navigate(["/home"]);
        }
      })
      .catch(err => console.log("err", err));
  }

  onExportPersonalData() {
    this.userService.getPersonalInfo().subscribe(data => {
      let blob = new Blob([JSON.stringify(data)], {
        type: "text/plain;charset=utf-8"
      });
      saveAs(blob, "mydata.txt");
      //alert(JSON.stringify(data));
      // TODO: data format: csv, geojson ? Link observations and associated medias ?
    });
  }

  onExportObservations() {
    let csv_str = this.userService.ConvertToCSV(this.obsToExport, [
      "id_observation",
      "espece",
      "cd_nom",
      "nom complet",
      "date",
      "programme",
      "denombrement",
      "commentaire",
      "commune",
      "coordonnee_x",
      "coordonnee_y"
    ]);
    let blob = new Blob([csv_str], { type: "text/csv" });
    saveAs(blob, "mydata.csv");
  }

  onEditInfos(content): void {
    this.userService.getPersonalInfo().subscribe(data => {
      this.personalInfo = data;
      this.intiForm();
      this.modalRef = this.modalService.open(content, {
        size: "lg",
        windowClass: "add-obs-modal",
        centered: true
      });
    });
  }

  onUpdatePersonalData(userForm) {
    userForm = _.omitBy(userForm, _.isNil);
    delete userForm.username;
    if (this.newAvatar && this.extentionFile) {
      userForm.avatar = this.userAvatar;
      userForm.extention = this.extentionFile;
    }
    this.userService.updatePersonalData(userForm).subscribe((user: any) => {
      localStorage.setItem("userAvatar", user.features.avatar);
      this.modalRef.close();
    });
  }

  onUploadAvatar($event) {
    if ($event) {
      if ($event.target.files && $event.target.files[0]) {
        let reader = new FileReader();
        let file = $event.target.files[0];
        reader.readAsDataURL(file);
        reader.onload = () => {
          this.userAvatar = reader.result;
          this.newAvatar = reader.result;
          this.extentionFile = $event.target.files[0].type.split("/").pop();
        };
      }
    }
  }

  intiForm() {
    this.userForm = this.formBuilder.group(
      {
        username: [
          { value: this.personalInfo.features.username, disabled: true }
        ],
        email: [
          this.personalInfo.features.email,
          [
            Validators.required,
            Validators.pattern(
              "^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$"
            )
          ]
        ],
        name: [this.personalInfo.features.name, Validators.required],
        surname: [this.personalInfo.features.surname, Validators.required],
        newPassword: [null],
        confirmPassword: [null]
      },
      {
        validator: CustomFormValidator.MatchPassword
      }
    );
  }

  openDeleteModal(deleteModal: any, idObs: number) {
    this.idObsToDelete = idObs;
    this.modalRefDel = this.modalService.open(deleteModal, {
      windowClass: "delete-modal",
      centered: true
    });
  }

  onCancelDelete() {
    this.modalRefDel.close();
  }

  onDeleteObs() {
    this.userService.deleteObsservation(this.idObsToDelete).subscribe(() => {
      this.modalRefDel.close();
      this.getData();
      this.idObsToDelete = null;
    });
  }

  ngOnDestroy(): void {
    if (this.modalRef) this.modalRef.close();
    if (this.modalRefDel) this.modalRefDel.close();
    this.flowService.setModalCloseSatus(null);
  }
}
