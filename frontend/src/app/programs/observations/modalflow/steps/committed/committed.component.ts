import {
  Component,
  Input,
  Output,
  ViewChild,
  ViewEncapsulation
} from "@angular/core";

import { IFlowComponent } from "../../flow/flow";
import { ObsFormComponent } from "../../../form/form.component";

@Component({
  templateUrl: "./committed.component.html",
  styleUrls: ["./committed.component.css"],
  encapsulation: ViewEncapsulation.None
})
export class CommittedComponent implements IFlowComponent {
  @Input() data: any;
  @Output() obsData: any;
  @ViewChild(ObsFormComponent) form: ObsFormComponent;

  committed() {
    console.debug("committed action > data:", this.data);
    // this.obsData.emit(this.form.onFormSubmit());
    this.form.onFormSubmit();
    this.data.next();
  }
}
