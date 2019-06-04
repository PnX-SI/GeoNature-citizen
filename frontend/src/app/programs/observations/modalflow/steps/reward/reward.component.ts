import {
  Component,
  Input,
  ViewEncapsulation,
  OnInit,
  Injectable,
  AfterViewInit
} from "@angular/core";
import { HttpClient } from "@angular/common/http";
import { throwError, BehaviorSubject } from "rxjs";
import {
  tap,
  catchError,
  map,
  distinctUntilChanged,
  share,
  pluck
} from "rxjs/operators";

import { AppConfig } from "../../../../../../conf/app.config";
import { IFlowComponent } from "../../flow/flow";
import { AuthService } from "../../../../../auth/auth.service";

export interface Badge {
  img: string;
  alt: string;
}

export interface BadgeState {
  badges: Badge[];
  changes: Badge[];
  loading: boolean;
}

let _state: BadgeState = {
  badges: JSON.parse(localStorage.getItem("badges")),
  changes: [],
  loading: false
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
    // tap(c => console.debug("$changes:", c)),
    share()
  );
  loading$ = this.state$.pipe(map(state => state.loading));

  constructor(private authService: AuthService, private http: HttpClient) {
    this.username = localStorage.getItem("username");
    this.getChanges();
  }

  getChanges(): void {
    const access_token = localStorage.getItem("access_token");
    console.debug("facade initialized.");
    if (access_token) {
      this.authService.ensureAuthorized().pipe(
        tap(user => {
          if (user["features"]["id_role"]) {
            this.role_id = user["features"]["id_role"];
            this.http
              .get<Object>(
                `${AppConfig.API_ENDPOINT}/dev_rewards/${this.role_id}`
              )
              .pipe(
                pluck("badges"),
                tap((badges: Badge[]) => {
                  const changes = this.difference(badges);
                  this.updateState({
                    ..._state,
                    badges: badges,
                    changes: changes,
                    loading: false
                  });
                  localStorage.setItem("badges", JSON.stringify(badges));
                }),
                catchError(error => {
                  console.error(error);
                  window.alert(error);
                  return throwError(error);
                })
              )
              .subscribe();
          }
        }),
        catchError(error => {
          console.error(error);
          window.alert(error);
          return throwError(error);
        })
      );
    }
  }

  getId(): number {
    return this.role_id;
  }

  difference(badges: Badge[]) {
    if (badges && badges.length === 0) return /* EMPTY */;

    function badgeListComparer(otherArray) {
      return current =>
        otherArray.filter(other => other.alt == current.alt).length == 0;
    }

    const oldBadges: Badge[] = _state.badges;
    const onlyInNewState: Badge[] = badges.filter(badgeListComparer(oldBadges));

    return onlyInNewState;
  }

  private updateState(state: BadgeState) {
    this.store.next((_state = state));
  }
}

@Component({
  selector: "app-reward",
  //  *ngIf="+(reward$ | async)?.length > 0"
  template: `
    <div *ngIf="(reward$ | async) as rewards">
      <div class="modal-body new-badge" (click)="clicked('background')">
        <div><img src="assets/user.jpg" /></div>
        <h5 i18n>Félicitations !</h5>
        <h6 i18n>
          { rewards.length, plural, =1 { Vous venez d'obtenir ce badge } other {
          Vous venez d'obtenir ces badges } }
        </h6>
        <p>
          <img
            [ngbTooltip]="b.alt"
            *ngFor="let b of rewards"
            [src]="AppConfig.API_ENDPOINT + b.img"
            [alt]="b.alt"
          />
        </p>
      </div>
    </div>
  `,
  styleUrls: ["./reward.component.css"],
  encapsulation: ViewEncapsulation.None,
  providers: [BadgeFacade]
})
export class RewardComponent implements IFlowComponent, OnInit, AfterViewInit {
  readonly AppConfig = AppConfig;
  @Input() data: any;
  timeout: any;
  init = 0;
  condition$ = new BehaviorSubject<boolean>(false);
  reward$ = this.badges.changes$.pipe(
    map(reward => {
      this.init++;
      const condition = reward && !!reward.length;

      console.debug(this.init, condition, reward);
      this.condition$.next(condition);
      if (!condition && this.init > 1) {
        if (this.timeout) clearTimeout(this.timeout);
        this.timeout = setTimeout(() => this.close("NOREWARD"), 0);
      }
      return condition && this.init > 1 ? reward : null;
    })
  );

  constructor(public badges: BadgeFacade) {}

  ngOnInit(): void {
    console.debug("reward data:", this.data);
  }

  ngAfterViewInit() {
    console.debug("rewards  view init.");
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
