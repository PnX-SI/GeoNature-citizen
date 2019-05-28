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
  take,
  share,
  pluck,
  filter
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
    tap(c => console.debug(c)),
    filter((b: Badge[]) => !!b && !!b.length),
    distinctUntilChanged(),
    share()
  );
  loading$ = this.state$.pipe(map(state => state.loading));

  constructor(private authService: AuthService, private http: HttpClient) {
    this.username = localStorage.getItem("username");
    this.initialize();
  }

  initialize(): void {
    const access_token = localStorage.getItem("access_token");
    if (access_token) {
      this.authService.ensureAuthorized(access_token).then(user => {
        if (user["features"]["id_role"]) {
          this.role_id = user["features"]["id_role"];
          this.http
            .get<Object>(
              `${AppConfig.API_ENDPOINT}/dev_rewards/${this.role_id}`
            )
            .pipe(
              pluck("badges"),
              catchError(error => {
                window.alert(error);
                return throwError(error);
              }),
              tap((badges: Badge[]) => {
                const changes = this.difference(badges);
                this.updateState({
                  ..._state,
                  badges: badges,
                  changes: changes,
                  loading: false
                });
                localStorage.setItem("badges", JSON.stringify(badges));
              })
            )
            .subscribe();
        }
      }),
        error => window.alert(error);
    }
  }

  getId(): number {
    return this.role_id;
  }

  difference(badges: Badge[]) {
    if (badges && badges.length === 0) return;

    let oldBadges: Badge[] = [];
    let onlyInOldState: Badge[] = [];

    function badgeListComparer(otherArray) {
      return current =>
        otherArray.filter(other => other.alt == current.alt).length == 0;
    }

    this.badges$
      .pipe(
        take(1),
        tap(oldState => {
          oldBadges = oldState;
          onlyInOldState = oldBadges.filter(badgeListComparer(badges));
        })
      )
      .subscribe();
    const onlyInNewState = badges.filter(badgeListComparer(oldBadges));
    // return onlyInOldState.concat(onlyInNewState);
    return onlyInNewState;
  }

  private updateState(state: BadgeState) {
    this.store.next((_state = state));
  }
}

@Component({
  selector: "app-reward",
  template: `
    <div>
      <div class="modal-body new-badge" (click)="clicked('background')">
        <div><img src="assets/user.jpg" /></div>
        <h5 i18n>Félicitation !</h5>
        <h6 i18n>
          { +(badges.changes$ | async)?.length, plural, =1 { Vous venez
          d'obtenir ce badge } other { Vous venez d'obtenir ces badges } }
        </h6>
        <p>
          <img
            [ngbTooltip]="b.alt"
            *ngFor="let b of (badges.changes$ | async)"
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

  constructor(public badges: BadgeFacade) {}

  ngOnInit(): void {
    console.debug("reward data:", this.data);
    this.timeout = setTimeout(() => this.close("NOREWARD"), 5000);
    this.badges.changes$
      .pipe(
        tap(changes => {
          console.debug("badge changes:", changes);
        })
        // map(changes => {
        //   return (
        //     !!changes && !!changes.length && !!Object.keys(changes[0]).length
        //   );
        // })
      )
      .subscribe(rewarded => {
        console.debug("badge changes:", rewarded);
        clearTimeout(this.timeout);
        this.timeout = setTimeout(
          () => this.close(rewarded ? "REWARDED" : "NOREWARD"),
          rewarded ? 5000 : 0
        );
      });
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
