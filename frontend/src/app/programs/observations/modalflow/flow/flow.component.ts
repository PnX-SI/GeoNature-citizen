import {
  Component,
  Input,
  OnInit,
  ViewChild,
  ComponentFactoryResolver,
  Output,
  EventEmitter,
  ViewEncapsulation
} from "@angular/core";

import { FlowDirective } from "./flow.directive";
import { FlowItem } from "./flow-item";
import { IFlowComponent } from "./flow";

@Component({
  selector: "app-flow",
  template: `
    <ng-template user-flow></ng-template>
  `,
  styleUrls: ["./flow.component.css"],
  encapsulation: ViewEncapsulation.None
})
export class FlowComponent implements OnInit {
  @Input() flowItems: FlowItem[];
  @Output() step = new EventEmitter();
  @ViewChild(FlowDirective, {static: true}) flowitem: FlowDirective;
  currentFlowIndex = -1;

  constructor(private componentFactoryResolver: ComponentFactoryResolver) {}

  ngOnInit(): void {
    this.loadComponent();
  }

  loadComponent(data?) {
    // really, cycle ?
    this.currentFlowIndex = (this.currentFlowIndex + 1) % this.flowItems.length;
    // resolve factory for current flow-item component
    let flowItem = this.flowItems[this.currentFlowIndex];
    let componentFactory = this.componentFactoryResolver.resolveComponentFactory(
      flowItem.component
    );
    // clear app-flow view
    let viewContainerRef = this.flowitem.viewContainerRef;
    viewContainerRef.clear();
    // fill app-flow view with flow-item content
    let componentRef = viewContainerRef.createComponent(componentFactory);
    // have data/state follow
    (<IFlowComponent>componentRef.instance).data = data || flowItem.data;
    // ding !
    this.step.emit(this.flowItems[this.currentFlowIndex].component.name);
    // tie current flow-item to the next until last ...
    if (
      !(<IFlowComponent>componentRef.instance).data.next &&
      !(<IFlowComponent>componentRef.instance).data.final
    ) {
      (<IFlowComponent>componentRef.instance).data.next = data => {
        this.loadComponent(data || flowItem.data);
      };
    }
  }
}
