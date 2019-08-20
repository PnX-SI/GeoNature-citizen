import { Component, Input, ViewChild, ViewEncapsulation } from "@angular/core";

import { IFlowComponent } from "../../flow/flow";
import { ObsFormComponent } from "../../../form/form.component";
import { ObservationFeature } from "../../../observation.model";

@Component({
  templateUrl: "./committed.component.html",
  styleUrls: ["./committed.component.css"],
  encapsulation: ViewEncapsulation.None
})
export class CommittedComponent implements IFlowComponent {
  @Input() data: any;
  @ViewChild(ObsFormComponent, {static: true}) form: ObsFormComponent;

  onNewObservation(observation: ObservationFeature) {
    if (observation) {
      this.data.obs = observation;

      const event: CustomEvent = new CustomEvent("NewObservationEvent", {
        bubbles: true,
        cancelable: true,
        detail: this.data.obs
      });
      document.dispatchEvent(event);

      this.data.next(this.data);
    }
  }

  committed() {
    this.form.onFormSubmit();
  }
}
