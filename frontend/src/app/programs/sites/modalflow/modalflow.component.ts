import {
  Component,
  ViewChild,
  ElementRef,
  ViewEncapsulation
} from "@angular/core";

import { FlowItem } from "../../observations/modalflow/flow/flow-item";
import { SiteModalFlowService } from "./modalflow.service";

@Component({
  selector: "app-sitemodalflow",
  template: `
    <div class="btn-group">
      <button class="btn-big" (click)="clicked()">
        Ajouter une mare
      </button>
      <!-- <button class="btn-big">Réaliser un programme</button> -->
    </div>
    <ng-template #content>
      <app-flow [flowItems]="flowitems" (step)="step($event)"></app-flow>
    </ng-template>
  `,
  styleUrls: ["./modalflow.component.css"],
  encapsulation: ViewEncapsulation.None
})
export class SiteModalFlowComponent {
  @ViewChild("content") content: ElementRef;
  flowitems: FlowItem[];
  timeout: any;

  constructor(public flowService: SiteModalFlowService) {}

  clicked() {
    this.flowitems = this.flowService.getFlowItems();
    console.debug("flow items: ", this.flowitems);
    this.flowService.open(this.content);
  }

  ngOnDestroy(): void {
    console.debug("destroyed");
  }

  step(data) {
    console.debug("modalflow step:", data);
  }
}
