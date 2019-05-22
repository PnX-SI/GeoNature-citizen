import {
  Component,
  Input,
  ViewEncapsulation,
  OnInit,
  Injectable
} from "@angular/core";
import { HttpClient } from "@angular/common/http";
import { throwError, Subject, BehaviorSubject } from "rxjs";
import { tap, catchError, map, distinctUntilChanged } from "rxjs/operators";

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
  badges: [],
  changes: [],
  loading: false
};

@Injectable()
export class BadgeFacade {
  private store = new BehaviorSubject<BadgeState>(_state);
  private state$ = this.store.asObservable();

  badges$ = this.state$.pipe(
    map(state => state.badges),
    distinctUntilChanged()
  );
  changes$ = this.state$.pipe(
    map(state => state.changes),
    distinctUntilChanged()
  );
  loading$ = this.state$.pipe(map(state => state.loading));

  constructor(private http: HttpClient) {
    this.http
      .get<Object>(`${AppConfig.API_ENDPOINT}/dev_rewards`)
      .pipe(
        tap(_items => _items["badges"]),
        catchError(error => {
          window.alert(error);
          return throwError(error);
        })
      )
      .subscribe((badges: Badge[]) =>
        this.updateState({
          ..._state,
          badges,
          changes: this.diff(badges),
          loading: false
        })
      );
  }

  diff(badges: Badge[]) {
    function badgeListComparer(otherArray) {
      return function(current) {
        return (
          otherArray.filter(function(other) {
            return other.img == current.img && other.alt == current.alt;
          }).length == 0
        );
      };
    }
    let oldBadges: Badge[];
    let onlyInOldState: Badge[];
    this.badges$.subscribe(oldBadges => {
      oldBadges = oldBadges;
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
    <div *ngIf="rewarded">
      <div class="modal-body new-badge" (click)="clicked('background')">
        <div><img src="assets/user.jpg" /></div>
        <h5 i18n="Reward|Félicitations !">Félicitation !</h5>
        <h6 i18n="Reward|Vous venez d'obtenir ce badge">
          { +(rewards$ | async)?.length, plural, =1 { Vous venez d'obtenir ce
          badge } other { Vous venez d'obtenir ces badges } }
        </h6>
        <p>
          <img
            [ngbTooltip]="b.alt"
            *ngFor="let b of (rewards$ | async)"
            [src]="AppConfig.API_ENDPOINT + b.img"
            [alt]="b.alt"
          />
        </p>
      </div>
    </div>
  `,
  styleUrls: ["./reward.component.css"],
  encapsulation: ViewEncapsulation.None
})
export class RewardComponent implements IFlowComponent, OnInit {
  readonly AppConfig = AppConfig;
  @Input() data: any;
  username: string;
  timeout: any;
  rewarded: boolean = true; // Math.random() >= 0.5;
  oldState: Badge[] = [];
  newState: Badge[] = [];
  rewards$: Subject<Badge[]> = new Subject<Badge[]>();

  constructor(
    private authService: AuthService,
    private http: HttpClient,
    public badges: BadgeFacade
  ) {}

  ngOnInit(): void {
    this.oldState = JSON.parse(localStorage.getItem("badges"));

    this.fetchCurrentState().subscribe(data => {
      console.debug("oldState:", this.oldState);
      console.debug("badges data:", data["rewards"]);
      console.debug("new badges:", data["badges"]);

      this.getRewards();
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

  badgeListComparer(otherArray) {
    return function(current) {
      return (
        otherArray.filter(function(other) {
          return other.img == current.img && other.alt == current.alt;
        }).length == 0
      );
    };
  }

  fetchCurrentState() {
    return this.http.get<Object>(`${AppConfig.API_ENDPOINT}/dev_rewards`).pipe(
      tap(data => {
        this.newState = data["badges"];
        localStorage.setItem("badges", JSON.stringify(this.newState));
      }),
      catchError(error => {
        window.alert(error);
        return throwError(error);
      })
    );
  }

  getRewards() {
    if (this.oldState) {
      const onlyInOldState = this.oldState.filter(
        this.badgeListComparer(this.newState)
      );
      const onlyInNewState = this.newState.filter(
        this.badgeListComparer(this.oldState)
      );

      const difference = onlyInOldState.concat(onlyInNewState);
      console.debug(
        "reward difference:",
        difference,
        onlyInOldState,
        onlyInNewState
      );
      this.rewarded = difference.length > 0;
      this.rewards$.next(difference);
    } else {
      this.oldState = this.newState;
      this.rewards$.next(this.newState);
    }
  }
}
