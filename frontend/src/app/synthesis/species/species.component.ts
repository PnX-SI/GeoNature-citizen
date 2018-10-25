import { Component, OnInit } from "@angular/core";
import {ActivatedRoute} from '@angular/router';

@Component({
  selector: "app-species",
  templateUrl: "./species.component.html",
  styleUrls: ["./species.component.css"]
})
export class SpeciesComponent implements OnInit {
  title = "fiche espèce";
  specie_id : any;
  id : any;

  constructor(private route: ActivatedRoute) {
    this.route.params.subscribe(params => {
      this.specie_id = params["id"];
    });
  }

  ngOnInit() {
    console.log('PARAMS', this.specie_id);
  }
}
