import {
  Component,
  Input,
  ViewChild,
  ViewEncapsulation,
  OnInit
} from "@angular/core";

import { IFlowComponent } from "../../flow/flow";
import { ObsFormComponent } from "../../../form/form.component";

@Component({
  templateUrl: "./committed.component.html",
  styleUrls: ["./committed.component.css"],
  encapsulation: ViewEncapsulation.None
})
export class CommittedComponent implements IFlowComponent, OnInit {
  @Input() data: any;
  @ViewChild(ObsFormComponent) form: ObsFormComponent;

  ngOnInit() {
    console.debug("before committed action > data:", this.data);
    console.debug(
      "before committed action > supplying obs coords",
      this.data.coords
    );
    // this.form.coords = this.data.coords;
  }

  committed() {
    this.data.obs = this.form.onFormSubmit();
    console.debug("committed action > data:", this.data);
    this.data.next();
  }
}
