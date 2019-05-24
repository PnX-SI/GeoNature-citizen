import {
  Component,
  Input,
  ViewEncapsulation,
  OnInit,
  Injectable
} from "@angular/core";
import { HttpClient } from "@angular/common/http";
import { throwError, BehaviorSubject } from "rxjs";
import {
  tap,
  catchError,
  map,
  distinctUntilChanged,
  take,
  share
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
    share()
  );
  loading$ = this.state$.pipe(map(state => state.loading));

  constructor(private authService: AuthService, private http: HttpClient) {
    this.username = localStorage.getItem("username");
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
              map(_items => _items["badges"]),
              catchError(error => {
                window.alert(error);
                return throwError(error);
              })
            )
            .subscribe((badges: Badge[]) => {
              this.updateState({
                ..._state,
                badges,
                changes: this.difference(badges),
                loading: false
              });
              localStorage.setItem("badges", JSON.stringify(badges));
            });
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

    let oldBadges: Badge[];
    let onlyInOldState: Badge[];

    function badgeListComparer(otherArray) {
      return function(current) {
        return (
          otherArray.filter(function(other) {
            return other.alt == current.alt;
          }).length == 0
        );
      };
    }

    this.badges$.pipe(take(1)).subscribe(oldState => {
      oldBadges = oldState;
      onlyInOldState = oldBadges.filter(badgeListComparer(badges));
    });
    const onlyInNewState = badges.filter(badgeListComparer(oldBadges));
    return onlyInOldState.concat(onlyInNewState);
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
export class RewardComponent implements IFlowComponent, OnInit {
  readonly AppConfig = AppConfig;
  @Input() data: any;
  timeout: any;

  constructor(public badges: BadgeFacade) {}

  ngOnInit(): void {
    let counter = 0;
    this.badges.changes$.subscribe(changes => {
      console.debug("reward data:", this.data);
      console.debug("badge changes:", changes);
      // FIXME: This is consumed twice, 1st to last changes then actual changes, why ?
      // rm counter when debugged.
      counter++;
      console.debug(counter);
      const condition = changes && changes.length > 0;
      if (counter >= 2) {
        this.timeout = setTimeout(
          () => this.close(condition ? "timeout" : "noreward"),
          condition ? 5000 : 0
        );
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
