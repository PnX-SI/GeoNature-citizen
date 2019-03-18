import {
  Component,
  Input,
  ViewChild,
  ElementRef,
  ViewEncapsulation
} from "@angular/core";

import { FlowItem } from "./flow/flow-item";
import { ModalFlowService } from "./modalflow.service";

@Component({
  selector: "app-modalflow",
  template: `
    <div class="btn-group">
      <button class="btn-big" (click)="clicked()">
        Ajouter une observation
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
export class ModalFlowComponent {
  @Input("coords") coords;
  @ViewChild("content") content: ElementRef;
  flowitems: FlowItem[];
  timeout: any;

  constructor(public flowService: ModalFlowService) {}

  clicked() {
    console.debug("coords:", this.coords);
    this.flowitems = this.flowService.getFlowItems({ coords: this.coords });
    console.debug("flow items: ", this.flowitems);
    this.flowService.open(this.content);
  }

  ngOnDestroy(): void {
    console.debug("destroyed");
  }

  step(componentName) {
    console.debug("modalflow step:", componentName);
  }
}
