import {
  Component,
  Input,
  ViewEncapsulation,
  ViewChild,
  ElementRef
} from "@angular/core";

import { IFlowComponent } from "../../../../observations/modalflow/flow/flow";
import { SiteFormComponent } from "../../../form/form.component";

@Component({
  templateUrl: "./committed.component.html",
  styleUrls: ["./committed.component.css"],
  // encapsulation: ViewEncapsulation.None
})
export class SiteCommittedComponent implements IFlowComponent {
  @Input() data: any;
  @ViewChild(SiteFormComponent) form: SiteFormComponent;

  committed() {
    this.form.onFormSubmit();
    console.debug("committed action > data:", this.data);
    this.data.next();
  }
}
