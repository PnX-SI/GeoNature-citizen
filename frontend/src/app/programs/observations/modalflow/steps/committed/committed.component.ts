import { Component, Input, ViewChild, ViewEncapsulation } from "@angular/core";

import { IFlowComponent } from "../../flow/flow";
import { ObsFormComponent } from "../../../form/form.component";

@Component({
  templateUrl: "./committed.component.html",
  styleUrls: ["./committed.component.css"],
  encapsulation: ViewEncapsulation.None
})
export class CommittedComponent implements IFlowComponent {
  @Input() data: any;
  @ViewChild(ObsFormComponent) form: ObsFormComponent;

  committed() {
    console.debug("committed action > data:", this.data);
    this.data.obs = this.form.onFormSubmit();
    this.data.next();
  }
}
