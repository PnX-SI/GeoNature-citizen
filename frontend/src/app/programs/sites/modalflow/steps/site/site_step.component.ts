import {
  Component,
  Input,
  ViewEncapsulation,
  ViewChild,
  ElementRef
} from "@angular/core";

import { IFlowComponent } from "../../../../observations/modalflow/flow/flow";
import { SiteFormComponent } from "../../../siteform/siteform.component";

@Component({
  templateUrl: "./site_step.component.html",
  styleUrls: ["./site_step.component.css"],
  // encapsulation: ViewEncapsulation.None
})
export class SiteStepComponent implements IFlowComponent {
  @Input() data: any;
  @ViewChild(SiteFormComponent) form: SiteFormComponent;

  committed() {
    this.form.onFormSubmit();
    console.debug("committed action > data:", this.data);
    this.data.next();
  }
}
