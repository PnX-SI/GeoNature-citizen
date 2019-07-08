import { Directive, ViewContainerRef } from "@angular/core";

@Directive({
  selector: "[user-flow]"
})
export class FlowDirective {
  constructor(public viewContainerRef: ViewContainerRef) {}
}
