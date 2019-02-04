import {
  Component,
  Input,
  OnInit,
  ViewChild,
  ComponentFactoryResolver,
  Output,
  EventEmitter,
  ViewEncapsulation,
} from '@angular/core'

import { FlowDirective } from './flow.directive'
import { FlowItem } from './flow-item'
import { IFlowComponent } from './flow'

@Component({
  selector: 'app-flow',
  template: `
    <ng-template user-flow></ng-template>
  `,
  styleUrls: ['./flow.component.css'],
  encapsulation: ViewEncapsulation.None
})
export class FlowComponent implements OnInit {
  @Input() flowItems: FlowItem[]
  @Output() step = new EventEmitter()
  @ViewChild(FlowDirective) flowitem: FlowDirective
  currentFlowIndex = -1

  constructor(private componentFactoryResolver: ComponentFactoryResolver) { }

  ngOnInit(): void {
    this.loadComponent()
  }

  loadComponent() {
    this.currentFlowIndex = (this.currentFlowIndex + 1) % this.flowItems.length
    let flowItem = this.flowItems[this.currentFlowIndex]
    let componentFactory = this.componentFactoryResolver.resolveComponentFactory(flowItem.component)
    let viewContainerRef = this.flowitem.viewContainerRef
    viewContainerRef.clear()
    let componentRef = viewContainerRef.createComponent(componentFactory);
    (<IFlowComponent>componentRef.instance).data = flowItem.data

    this.step.emit(this.flowItems[this.currentFlowIndex].component.name)
    const self = this

    if ((!(<IFlowComponent>componentRef.instance).data.next)
        && (!(<IFlowComponent>componentRef.instance).data.final)) {
      (<IFlowComponent>componentRef.instance).data.next = () => {
        console.debug('loadComponent this:', self)
        this.loadComponent()}
    }
  }
}
