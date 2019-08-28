import { Component, OnInit, ViewEncapsulation } from "@angular/core";
import { ActivatedRoute } from "@angular/router";

import { TaxhubService, Taxon } from "../../api/taxhub.service";

@Component({
  selector: "app-species",
  templateUrl: "./species.component.html",
  styleUrls: ["./species.component.css"],
  encapsulation: ViewEncapsulation.None
})
export class SpeciesComponent implements OnInit {
  title = "fiche espèce";
  specie_id: any;
  taxon: Taxon;

  constructor(private route: ActivatedRoute, public taxhub: TaxhubService) {
    this.route.params.subscribe(params => {
      this.specie_id = params["id"];
    });
  }

  ngOnInit() {
    this.taxhub.getTaxon(this.specie_id).subscribe(taxon => {
      this.taxon = taxon;
      console.debug("TAXON", taxon);
    });
  }
}
