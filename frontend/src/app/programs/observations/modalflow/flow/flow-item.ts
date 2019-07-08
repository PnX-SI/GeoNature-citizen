import { Type } from "@angular/core";

export class FlowItem {
  constructor(public component: Type<any>, public data?: any) {}
}
