import { Component, Input, ViewEncapsulation, Injectable } from "@angular/core";
import { HttpClient } from "@angular/common/http";
import { throwError, BehaviorSubject, Observable } from "rxjs";
import {
  tap,
  catchError,
  map,
  distinctUntilChanged,
  share,
  pluck,
  filter,
  find
} from "rxjs/operators";

import { AppConfig } from "../../../../../../conf/app.config";
import { IFlowComponent } from "../../flow/flow";
import { AuthService } from "../../../../../auth/auth.service";
import { ModalFlowService } from "../../modalflow.service";

export interface Badge {
  img: string;
  alt: string;
}

export interface BadgeState {
  badges: any[];
  changes: Badge[];
  loading: boolean;
}

let _state: BadgeState = {
  badges: [],
  changes: [],
  loading: true
};

@Injectable()
export class BadgeFacade {
  private store = new BehaviorSubject<BadgeState>(_state);
  private state$ = this.store.asObservable();
  role_id = 0;
  username = "undefined";

  badges$ = this.state$.pipe(
    map(state => state.badges),
    distinctUntilChanged(),
    share()
  );
  changes$ = this.state$.pipe(
    map(state => state.changes),
    distinctUntilChanged(),
    share()
  );
  loading$ = this.state$.pipe(map(state => state.loading));

  constructor(private authService: AuthService, private http: HttpClient) {
    this.username = localStorage.getItem("username");
    this.getChanges();
  }

  getChanges(): void {
    _state = {
      badges: JSON.parse(localStorage.getItem("badges")) || [],
      changes: [],
      loading: true
    };
    const access_token = localStorage.getItem("access_token");
    
    if (
      access_token && AppConfig["REWARDS"]
    ) {
      this.authService.ensureAuthorized().subscribe(
        user => {
          if (user["features"]["id_role"]) {
            this.role_id = user["features"]["id_role"];
            this.http
            .get<any[]>(`${AppConfig.API_ENDPOINT}/rewards/${this.role_id}`)
            .subscribe(
              rewards => {
                const changes = this.difference(rewards);
                this.updateState({
                  ..._state,
                  badges: rewards,
                  changes: changes,
                  loading: false
                });
                //localStorage.setItem("badges", JSON.stringify(rewards));
              },
              err => {
                throwError(err);
              }
            );
          }
        },
        error => {
          console.error(error);
          //window.alert(error);
          return throwError(error);
        },
        null
      );
    }
  }

  getId(): number {
    return this.role_id;
  }

  difference(badges: any[]): any[] {
    const oldBadges: any[] = _state.badges;
 
    if (!oldBadges || (oldBadges.length === 0 && badges && !!badges.length)) {
      return badges;
    }

    if (!badges || (badges && badges.length === 0)) {
      return [];
    }

    let onlyInNewState: any[] =[];
    badges.forEach( badge => {
      if (!oldBadges.find(oldbadge => oldbadge.id == badge.id))
      onlyInNewState.push(badge)  
    });
    return onlyInNewState;
  }

  private updateState(state: BadgeState) {
    this.store.next((_state = state));
  }
}

@Component({
  selector: "app-reward",
  template: `
    <div *ngIf="(reward$ | async) as rewards">
    <button type="button" class="close" aria-label="Close" (click)="closeModal()">
    <span aria-hidden="true">&times;</span>
</button>
      <div class="modal-body new-badge" (click)="clicked('background')">
        <h5 i18n>Félicitations !</h5>
        <h6 i18n>
          { +rewards?.length, plural, =1 { Vous venez d&apos;obtenir ce badge }
          other { Vous venez d&apos;obtenir ces badges } }
        </h6>
        <p>
          <img
            [ngbTooltip]="b.type + b.name"
            *ngFor="let b of rewards"
            [src]="AppConfig.API_ENDPOINT + b.url"
            [alt]="b.name"
          />
        </p>
      </div>
    </div>
  `,
  styleUrls: ["./reward.component.css"],
  encapsulation: ViewEncapsulation.None,
  providers: [BadgeFacade]
})
export class RewardComponent implements IFlowComponent {
  readonly AppConfig = AppConfig;
  private _timeout: any;
  private _init = 0;
  @Input() data: any;
  reward$: Observable<any[]>;

  constructor(public badges: BadgeFacade,
    private modalFlowService :ModalFlowService) {
    if (
      !badges.username || !AppConfig["REWARDS"]
    ) {
      if (this._timeout) clearTimeout(this._timeout);
      this._timeout = setTimeout(() => this.close("REWARDS_DISABLED"), 0);
    } else {
      this.reward$ = this.badges.changes$.pipe(
        tap(reward => {
          this._init++;

          const condition = !!reward && !!reward.length;

          if (!condition && this._init > 1) {
            if (this._timeout) clearTimeout(this._timeout);
            this._timeout = setTimeout(() => 
            {this.close("NOREWARD")}, 0);
          }
        }),
        filter(reward => reward && !!reward.length && this._init > 1)
      );
    }
  }

  close(d) {
    this.data.service.close(d);
  }

  clicked(d) {
    this.close(d);
  }
  closeModal(){
    this.modalFlowService.closeModal()
  }
}
