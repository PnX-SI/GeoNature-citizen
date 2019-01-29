import { Component, Input, ViewEncapsulation } from '@angular/core'

import { IFlowComponent } from '../../flow/flow'

@Component({
  templateUrl: './committed.component.html',
  styleUrls: ['./committed.component.css'],
  encapsulation: ViewEncapsulation.None,
})
export class CommittedComponent implements IFlowComponent {
  @Input() data: any

  committed() {
    console.debug('committed action > data:', this.data)
    this.data.next()
  }
}
