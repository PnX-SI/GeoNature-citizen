import { Component, Input, ViewEncapsulation } from '@angular/core'

import { IFlowComponent } from '../../flow/flow'

@Component({
  templateUrl: './congrats.component.html',
  styleUrls: ['./congrats.component.css'],
  encapsulation: ViewEncapsulation.None,
})
export class CongratsComponent implements IFlowComponent {
  @Input() data: any
  timeout: any

  ngOnDestroy(): void {
    if (this.timeout) {
      clearTimeout(this.timeout)
    }
  }

  ngOnInit(): void {
    console.debug('congrats action > data:', this.data)
    this.timeout = setTimeout(() => {
        this.data.next()
      }, 2000)
  }
}
