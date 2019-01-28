import {
  Component,
  OnInit,
  ViewChild,
  ElementRef,
  ViewEncapsulation,
  OnDestroy
} from '@angular/core';

import { FlowItem } from '../flow/flow-item'
import { ModalFlowService } from './modalflow.service'

@Component({
  selector: 'app-modalflow',
  template:`
  <!--
  <button class="btn btn-lg btn-outline-primary"
          (click)="flowService.open(content, { size: 'lg'})">Launch modal flow</button>
  -->
  <ng-template #content>
    <app-flow [flowItems]="flowitems" (step)="step($event)"></app-flow>
  </ng-template>
  `,
  styleUrls: ['./modalflow.component.css'],
  encapsulation: ViewEncapsulation.None
})
export class ModalFlowComponent implements OnInit, OnDestroy {
  @ViewChild('content') content: ElementRef
  flowitems: FlowItem[]
  timeout: any

  constructor(
    public flowService: ModalFlowService,
  ) { }

  ngOnInit() {
    this.flowitems = this.flowService.getFlowItems()
    console.debug('flow items: ', this.flowitems)
    // this.timeout = setTimeout(() => this.flowService.open(this.content, { size: 'lg'}), 0)
  }

  ngOnDestroy(): void {
    clearTimeout(this.timeout)
  }

  step(data) {
    console.debug('modalflow step:', data)
  }
}
