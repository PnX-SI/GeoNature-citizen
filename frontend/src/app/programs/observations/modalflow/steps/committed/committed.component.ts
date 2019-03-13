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
  @ViewChild(ObsFormComponent) form: ObsFormComponent;

  onNewObservation(observation: ObservationFeature) {
    this.data.obs = observation;
    console.debug("committed action > onNewObservation data:", this.data);
    this.data.next(this.data);
  }

  committed() {
    this.form.onFormSubmit();
    console.debug("committed action > data:", this.data);
    console.debug("committed action > obs:", this.form.newObservation);
  }
}
