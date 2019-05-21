import { Component, Input, ViewEncapsulation, OnInit } from "@angular/core";
import { HttpClient } from "@angular/common/http";
import { tap, catchError } from "rxjs/operators";
import { throwError } from "rxjs";

import { AppConfig } from "../../../../../../conf/app.config";
import { IFlowComponent } from "../../flow/flow";
import { AuthService } from "../../../../../auth/auth.service";

@Component({
  selector: "app-reward",
  template: `
    <div *ngIf="rewarded">
      <div class="modal-body new-badge" (click)="clicked('background')">
        <div><img src="assets/user.jpg" /></div>
        <h5 i18n="Reward|Félicitations !">Félicitation !</h5>
        <h6 i18n="Reward|Vous venez d'obtenir ce badge">
          Vous venez d'obtenir ce badge
        </h6>
        <p>{{ "Observateur confirmé" }}</p>
      </div>
    </div>
  `,
  styleUrls: ["./reward.component.css"],
  encapsulation: ViewEncapsulation.None
})
export class RewardComponent implements IFlowComponent, OnInit {
  @Input() data: any;
  username: string;
  timeout: any;
  rewarded: boolean = true; // Math.random() >= 0.5;
  badges: Object[] = JSON.parse(localStorage.getItem("badges"));

  constructor(private authService: AuthService, private http: HttpClient) {}

  ngOnInit(): void {
    // PLAN:
    const old_badges = this.badges;
    this.http
      .get<Object[]>(`${AppConfig.API_ENDPOINT}/dev_rewards`)
      .pipe(
        catchError(error => {
          window.alert(error);
          return throwError(error);
        })
      )
      .subscribe(data => {
        console.debug("old_badges:", old_badges);
        console.debug("badges data:", data["rewards"]);
        this.badges = data["badges"];
        console.debug("new badges:", this.badges);
        const difference = this.badges.filter(x => !old_badges.includes(x));
        console.debug("diff:", difference);
        this.rewarded = difference !== null;
      });

    console.debug("reward data:", this.data);

    this.authService.isLoggedIn().subscribe(value => {
      if (value) {
        this.username = localStorage.getItem("username");
        const condition = value && this.username && this.rewarded;
        this.timeout = setTimeout(
          () => this.close(condition ? "timeout" : "noreward"),
          condition ? 3000 : 0
        );
      } else {
        this.timeout = setTimeout(() => this.close("noreward"), 0);
      }
    });
  }

  close(d) {
    console.debug(`reward close: ${d}`);
    this.data.service.close(d);
  }

  clicked(d) {
    console.debug("clicked", d);
    this.close(d);
  }
}
