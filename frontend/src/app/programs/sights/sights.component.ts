import {Component, OnInit, ElementRef, ViewChild, ViewEncapsulation} from '@angular/core';
import {ActivatedRoute} from '@angular/router';
import {NgbModal, ModalDismissReasons} from '@ng-bootstrap/ng-bootstrap';

// declare let $: any;

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

  @ViewChild('obsform') ObsForm: ElementRef
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
            case ModalDismissReasons.ESC:
              trigger = 'ESC'
              break
            case ModalDismissReasons.BACKDROP_CLICK:
              trigger = 'BACKDROP'
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

}
