import { Injectable } from "@angular/core";
import { Observable, BehaviorSubject } from "rxjs";

import {
  NgbModal,
  ModalDismissReasons,
  NgbModalRef,
  NgbModalOptions
} from "@ng-bootstrap/ng-bootstrap";

import { FlowService } from "./flow/flow.service";
import { FlowItem } from "./flow/flow-item";
import { OnboardComponent } from "./steps/onboard/onboard.component";
import { CommittedComponent } from "./steps/committed/committed.component";
import { CongratsComponent } from "./steps/congrats/congrats.component";
import { RewardComponent } from "./steps/reward/reward.component";

export const MODAL_DEFAULTS: NgbModalOptions = {
  size: "lg",
  centered: true
};

@Injectable({
  providedIn: "root"
})
export class ModalFlowService extends FlowService {
  modalRef: NgbModalRef;
  private modalCloseStatus: BehaviorSubject<string> = new BehaviorSubject(null);

  constructor(private modalService: NgbModal) {
    super();
  }

  open(content, options: NgbModalOptions = {}) {
    this.modalRef = this.modalService.open(content, {
      size: "lg",
      windowClass: 'obs-modal',
      centered: true
    });
    this.modalRef.result.then(
      result => {
        console.debug("closed with", !!result);
      },
      reason => {
        let trigger = undefined;
        switch (reason) {
          case ModalDismissReasons.BACKDROP_CLICK:
            trigger = "BACKDROP";
            break;
          case ModalDismissReasons.ESC:
            trigger = "ESC";
            break;
          default:
            trigger = reason;
            break;
        }
      }
    );
  }

  close(data) {
    this.modalRef.close(data);
  }
  closeModal() {
    if (this.modalRef) this.modalRef.close();
  }

  getFlowItems(initialState) {
    return [
      new FlowItem(OnboardComponent, { ...initialState, service: this }),
      new FlowItem(CommittedComponent, { ...initialState, service: this }),
      new FlowItem(CongratsComponent, { ...initialState, service: this }),
      new FlowItem(RewardComponent, { ...initialState, service: this })
    ];
  }

  getModalCloseSatus(): Observable<string> {
    return this.modalCloseStatus.asObservable();
  }

  setModalCloseSatus(type: "updateObs" | "newObs" | null) {
    this.modalCloseStatus.next(type);
  }
}
