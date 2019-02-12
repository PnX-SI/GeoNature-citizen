import { Injectable } from '@angular/core';

import {
  NgbModal,
  ModalDismissReasons,
  NgbModalRef,
  NgbModalOptions,
} from '@ng-bootstrap/ng-bootstrap'

import { FlowService } from './flow/flow.service'
import { FlowItem } from './flow/flow-item'
import { OnboardComponent } from './steps/onboard/onboard.component'
import { CommittedComponent } from './steps/committed/committed.component'
import { CongratsComponent } from './steps/congrats/congrats.component'
import { RewardComponent } from './steps/reward/reward.component';

export const MODAL_DEFAULTS: NgbModalOptions = {
  size: 'lg',
  centered: true
}

@Injectable({
  providedIn: 'root'
})
export class ModalFlowService extends FlowService {
  modalRef: NgbModalRef

  constructor(
    private modalService: NgbModal,
  ) {
    super()
  }

  open(content, options: NgbModalOptions = {}) {
    this.modalRef = this.modalService.open(content, {...MODAL_DEFAULTS, ...options})
    this.modalRef.result.then(
        (result) => {

          // TODO: everything !
          console.debug('closed', content, 'with', result)

        },
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
          console.info(`dismissed with ${trigger}`)
        }
      )
  }

  next_(data) {
    console.debug('next_', data)
  }

  close(data) {
    this.modalRef.close(data)
  }

  getFlowItems() {
    return [
      new FlowItem(OnboardComponent, {service: this}),
      new FlowItem(CommittedComponent, {service: this}),
      new FlowItem(CongratsComponent, {service: this, date: new Date().toLocaleDateString()}),
      new FlowItem(RewardComponent, {service: this}),
    ]
  }
}
