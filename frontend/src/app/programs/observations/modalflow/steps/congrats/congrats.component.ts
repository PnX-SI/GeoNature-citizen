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
  username: any
  obs: any

  ngOnDestroy(): void {
    if (this.timeout) {
      clearTimeout(this.timeout)
    }
  }

  ngOnInit(): void {
    if (localStorage.getItem("username")) {
      this.username = localStorage.getItem("username").replace(/\"/g, "");
      console.debug('username:', this.username)
    }
    console.debug('congrats action > data:', this.data)
    this.timeout = setTimeout(() => {
        this.data.obs = this.obs
        this.data.next()
      }, 2000)
  }
}
