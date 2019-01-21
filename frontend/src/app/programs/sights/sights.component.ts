import { Component, OnInit, ElementRef, ViewChild, ViewEncapsulation } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { NgbModal, ModalDismissReasons } from '@ng-bootstrap/ng-bootstrap';
import { LoginComponent } from "../../auth/login/login.component";
import { RegisterComponent } from "../../auth/register/register.component";

@Component({
  selector: 'app-sights',
  templateUrl: './sights.component.html',
  styleUrls: ['./sights.component.css'],
  encapsulation: ViewEncapsulation.None,
})
export class SightsComponent implements OnInit {
  title = 'Observations';
  survey_id: any;
  coords: any;

  @ViewChild('Onboarding') Onboarding: ElementRef
  @ViewChild('AddOneObs') ObsForm: ElementRef
  // @ViewChild('ProgramsComponent') ProgramsComponent: ElementRef
  @ViewChild('RegisterComponent') RegisterComponent: ElementRef
  constructor(
    private route: ActivatedRoute,
    private modalService: NgbModal
  ) {
    this.route.params.subscribe(params => {
      this.survey_id = params['id'];
    });
  }

  modal(content) {
    this.modalService.open(content, {})
      .result.then(
        (result) => console.log(`closed ${content} with ${result}`),
        (reason) => {
          let trigger = undefined
          switch(reason) {
            case ModalDismissReasons.BACKDROP_CLICK:
              trigger = 'BACKDROP'
              break
            case ModalDismissReasons.ESC:
              trigger = 'ESC'
              break
            default:
              trigger = reason
              break
            }

          console.log(`dismissed with ${trigger}`)
        }
      )
  }

  ngOnInit() {
    console.log('PARAMS', this.survey_id);
  }

  login() {
    // if not user_logged_in
    this.modalService.open(LoginComponent);
  }

  register() {
    this.modalService.open(RegisterComponent);
  }
}
