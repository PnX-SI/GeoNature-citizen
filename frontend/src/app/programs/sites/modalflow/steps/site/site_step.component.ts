import {
  Component,
  Input,
  ViewEncapsulation,
  ViewChild,
  ElementRef
} from "@angular/core";

import { IFlowComponent } from "../../../../observations/modalflow/flow/flow";
import { SiteFormComponent } from "../../../siteform/siteform.component";
import { SiteService } from "../../../sites.service";

@Component({
  templateUrl: "./site_step.component.html",
  styleUrls: ["./site_step.component.css"],
  // encapsulation: ViewEncapsulation.None
})
export class SiteStepComponent implements IFlowComponent {
  @Input() data: any;
  @ViewChild(SiteFormComponent) form: SiteFormComponent;

  constructor(public siteService: SiteService) {}

  committed() {
    console.log("data :", this.data);
    let resp: any;
    resp = this.form.onFormSubmit();
    console.debug("committed action > data:", this.data);
    // Wait for resolution of http promise "resp"
    // to get new created site's id and pass it to next step as extra_data
    let that = this;
    resp.then( function(result) {
      let site_id = result.features[0].properties.id_site;
      that.siteService.newSiteCreated.emit(result.features[0]);
      that.data.next({ ...that.data, site_id: site_id });
    })
  }
}
