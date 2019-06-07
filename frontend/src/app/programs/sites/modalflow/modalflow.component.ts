import {
  Component,
  ViewEncapsulation,
  Input
} from "@angular/core";
import { ActivatedRoute } from "@angular/router";
import { FlowItem } from "../../observations/modalflow/flow/flow-item";
import { SiteModalFlowService } from "./modalflow.service";

@Component({
  selector: "app-sitemodalflow",
  template: `
    <div class="btn-group">
      <button class="btn-big" (click)="clicked()">
        Ajouter une mare
      </button>
    </div>
  `,
  styleUrls: ["./modalflow.component.css"],
  encapsulation: ViewEncapsulation.None
})
export class SiteModalFlowComponent {
  @Input("coords") coords;
  flowitems: FlowItem[];
  timeout: any;
  program_id: any;

  constructor(public flowService: SiteModalFlowService, private route: ActivatedRoute) {
    this.route.params.subscribe(
      params => {
        this.program_id = params["id"];
      }
    );
  }

  clicked() {
    console.debug("CLICKED", this.coords);
    this.flowService.openFormModal({ program_id: this.program_id, coords: this.coords });
  }

  ngOnDestroy(): void {
    console.debug("destroyed");
  }
}
