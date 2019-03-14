import {
  Component,
  ViewEncapsulation,
  Input,
  ViewChild,
  ElementRef,
  OnInit
} from "@angular/core";

import { NgbModal, NgbModalRef } from "@ng-bootstrap/ng-bootstrap";

import { IFlowComponent } from "../../flow/flow";
import { RegisterComponent } from "../../../../../auth/register/register.component";
import { LoginComponent } from "../../../../../auth/login/login.component";
import { AuthService } from "src/app/auth/auth.service";

@Component({
  templateUrl: "./onboard.component.html",
  styleUrls: ["./onboard.component.css"],
  encapsulation: ViewEncapsulation.None
})
export class OnboardComponent implements IFlowComponent, OnInit {
  RegistrationModalRef: NgbModalRef;
  LoginModalRef: NgbModalRef;
  timeout: any;
  @Input("data") data: any;
  @ViewChild("RegisterComponent") RegisterComponent: ElementRef;
  @ViewChild("LoginComponent") LoginComponent: ElementRef;

  constructor(
    private modalService: NgbModal,
    private authService: AuthService
  ) {}

  ngOnInit() {
    this.authService.authorized$.subscribe(value => {
      if (value) {
        this.timeout = setTimeout(() => this.data.next(), 0);
      }
    });
  }

  // Actions
  register() {
    console.debug("register action > data:", this.data);
    this.RegistrationModalRef = this.modalService.open(RegisterComponent, {
      centered: true
    });
    this.RegistrationModalRef.result.then(
      _ => {
        console.debug("registration resolved");

        // TODO: registered check
        this.data.next();
      },
      reason => {
        console.debug("registration dismissed:", reason);
      }
    );
  }

  login() {
    // if not logged_in then stack Login modal dialog
    console.debug("login action > data:", this.data);
    this.LoginModalRef = this.modalService.open(LoginComponent, {
      centered: true
    });
    this.LoginModalRef.result.then(
      result => {
        console.debug("login resolved:", result);

        // TODO: authenticated check
        this.data.next();
      },
      reason => {
        console.debug("login dismissed:", reason);
      }
    );
  }

  continue() {
    console.debug("continue");
    // Continue to Submission form as Anonymous|Registered user
    // TODO: authenticated, anonymous check ... deserves notification ?
    this.data.next();
  }
}
