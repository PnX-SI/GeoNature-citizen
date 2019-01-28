import {
  Component,
  OnInit,
  ViewChild,
  ElementRef,
  ViewEncapsulation,
} from '@angular/core';

import { FlowItem } from './flow/flow-item'
import { ModalFlowService } from './modalflow.service'

@Component({
  selector: 'app-modalflow',
  template:`
  <div class="btn-group">
    <button class="btn-big" (click)="flowService.open(content)">Ajouter une observation</button>
    <button class="btn-big">Test micro</button>
  </div>
  <ng-template #content>
    <app-flow [flowItems]="flowitems" (step)="step($event)"></app-flow>
  </ng-template>
  `,
  styleUrls: ['./modalflow.component.css'],
  encapsulation: ViewEncapsulation.None
})
export class ModalFlowComponent implements OnInit {
  @ViewChild('content') content: ElementRef
  flowitems: FlowItem[]
  timeout: any

  constructor(
    public flowService: ModalFlowService,
  ) { }

  ngOnInit() {
    this.flowitems = this.flowService.getFlowItems()
    console.debug('flow items: ', this.flowitems)
  }

  step(data) {
    console.debug('modalflow step:', data)
  }
}
