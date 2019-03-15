import {
  Component,
  Input,
  ViewChild,
  ViewEncapsulation,
  ElementRef,
  HostListener
} from "@angular/core";

import { IFlowComponent } from "../../flow/flow";
import { ObsFormComponent } from "../../../form/form.component";
import { ObservationFeature } from "../../../observation.model";

interface NewObservationEvent extends CustomEvent {}

@Component({
  templateUrl: "./committed.component.html",
  styleUrls: ["./committed.component.css"],
  encapsulation: ViewEncapsulation.None
})
export class CommittedComponent implements IFlowComponent {
  @Input() data: any;
  @ViewChild(ObsFormComponent) form: ObsFormComponent;
  obsSubmit: ElementRef;

  onNewObservation(observation: ObservationFeature) {
    this.data.obs = observation;
    console.debug("committed action > onNewObservation data:", this.data);
    const event: CustomEvent = new CustomEvent("NewObservationEvent", {
      bubbles: true,
      cancelable: true,
      detail: observation
    });
    this.obsSubmit.nativeElement.dispatchEvent(event);
    this.data.next(this.data);
  }

  // @HostListener("NewObservationEvent", ["$event"])
  // public NewObservationEventHandler(e: CustomEvent) {
  //   const customEvent: NewObservationEvent =
  //     e instanceof NewObservationEvent ? e : <NewObservationEvent>e.detail;
  //   // ...
  // }

  committed() {
    this.form.onFormSubmit();
    console.debug("committed action > data:", this.data);
    console.debug("committed action > obs:", this.form.newObservation);
  }
}
