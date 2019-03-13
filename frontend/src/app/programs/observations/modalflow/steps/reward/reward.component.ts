import { Component, Input, ViewEncapsulation, OnInit } from "@angular/core";

import { IFlowComponent } from "../../flow/flow";
import { AuthService } from "src/app/auth/auth.service";

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
  timeout: any;
  rewarded: boolean = Math.random() >= 0.5;
  username: string;

  constructor(private authService: AuthService) {
    if (this.authService.authorized$.value) {
      this.username = localStorage.getItem("username");
    }
  }

  ngOnInit(): void {
    console.debug("reward init data:", this.data);
    const cond = this.username && this.rewarded;
    this.timeout = setTimeout(
      () => this.close(cond ? "timeout" : "noreward"),
      cond ? 3000 : 0
    );
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
