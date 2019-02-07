import {
  Component,
  Input,
  ViewEncapsulation,
  OnInit,
  OnDestroy,
  AfterViewChecked,
  ChangeDetectorRef,
  ViewRef,
} from '@angular/core'

import { IFlowComponent } from '../../flow/flow'

@Component({
  selector: 'app-reward',
  template: `
    <div *ngIf='rewarded'>
      <div  class="modal-body new-badge" (click)="clicked('background')">
        <div>
          <img src="../../assets/user.jpg">
        </div>
        <h5>Félicitation !</h5>
        <h6>Vous venez d'obtenir ce badge</h6>
        <p>Observateur confirmé</p>
      </div>
      <!-- <div class="modal-footer">
        <button type="button" class="btn btn-outline-dark"
                (click)="close('closing')">Close</button>
      </div> -->
    </div>
  `,
  styleUrls: ['./reward.component.css'],
  encapsulation: ViewEncapsulation.None,
})
export class RewardComponent implements IFlowComponent, OnInit, OnDestroy, AfterViewChecked {
  @Input() data: any
  // interval: any
  timeout: any
  rewarded: boolean = Math.random() >= 0.5
  username: string

  constructor(private ref: ChangeDetectorRef) {
    this.ref.detach()
  }

  ngOnDestroy(): void {
    if (!(this.ref as ViewRef).destroyed) {
      this.ref.detectChanges()
      if (this.timeout) {
        clearTimeout(this.timeout)
      }
    }
  }

  ngOnInit(): void {
    console.debug('reward init data:', this.data)
    if (localStorage.getItem("username")) {
      this.username = localStorage.getItem("username").replace(/\"/g, "")
      this.ref.detach()
    } else {
      this.close('ANONYMOUS_SOURCE')
    }
  }

  ngAfterViewChecked() {
    if (!(this.ref as ViewRef).destroyed) {
      this.ref.detectChanges()
      this.timeout = setTimeout(() => this.close((this.rewarded)?'timeout':'noreward'), (this.rewarded)?3000:0)
    }
  }

  close(d) {
    console.debug(`reward close: ${d}`)
    this.data.service.close(d)
  }

  clicked(d) {
    console.debug('clicked', d)
    this.close(d)
  }
}
