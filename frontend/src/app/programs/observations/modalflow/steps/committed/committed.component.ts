import {
  Component,
  Input,
  Output,
  ViewChild,
  ViewEncapsulation,
  EventEmitter
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
  @Output() newObservation: EventEmitter<string> = new EventEmitter();
  @ViewChild(ObsFormComponent) form: ObsFormComponent;

  committed() {
    console.debug("committed action > data:", this.data);
    let formValue = this.form.onFormSubmit();
    this.newObservation.emit(JSON.stringify(formValue));
    this.data.next();
  }
}
