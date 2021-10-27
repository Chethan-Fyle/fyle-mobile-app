import { Component, EventEmitter, OnInit, NgZone } from '@angular/core';
import { ActivatedRoute, Params, Router } from '@angular/router';
import { BehaviorSubject, concat, from, noop, Observable, Subject } from 'rxjs';
import { NetworkService } from 'src/app/core/services/network.service';
import { PersonalCardsService } from 'src/app/core/services/personal-cards.service';
import { HeaderState } from '../../shared/components/fy-header/header-state.enum';
import { InAppBrowser } from '@ionic-native/in-app-browser/ngx';
import { LoaderService } from 'src/app/core/services/loader.service';
import { finalize, map, shareReplay, switchMap, take, tap } from 'rxjs/operators';
import { PersonalCard } from 'src/app/core/models/personal_card.model';
import { MatSnackBar } from '@angular/material/snack-bar';
import { SnackbarPropertiesService } from '../../core/services/snackbar-properties.service';
import { ToastMessageComponent } from 'src/app/shared/components/toast-message/toast-message.component';
@Component({
  selector: 'app-personal-cards',
  templateUrl: './personal-cards.page.html',
  styleUrls: ['./personal-cards.page.scss'],
})
export class PersonalCardsPage implements OnInit {
  headerState: HeaderState = HeaderState.base;

  isConnected$: Observable<boolean>;

  linkedAccountsCount$: Observable<number>;

  linkedAccounts$: Observable<PersonalCard[]>;

  loadCardData$: BehaviorSubject<any>;

  navigateBack = false;

  isLoading = true;

  constructor(
    private personalCardsService: PersonalCardsService,
    private networkService: NetworkService,
    private router: Router,
    private activatedRoute: ActivatedRoute,
    private inAppBrowser: InAppBrowser,
    private loaderService: LoaderService,
    private zone: NgZone,
    private matSnackBar: MatSnackBar,
    private snackbarProperties: SnackbarPropertiesService
  ) {}

  ngOnInit() {
    this.setupNetworkWatcher();
  }

  ionViewWillEnter() {
    this.navigateBack = !!this.activatedRoute.snapshot.params.navigateBack;

    this.loadCardData$ = new BehaviorSubject({});
    this.linkedAccountsCount$ = this.loadCardData$.pipe(
      switchMap(() => this.personalCardsService.getLinkedAccountsCount()),
      shareReplay(1)
    );
    this.linkedAccounts$ = this.loadCardData$.pipe(
      tap(() => (this.isLoading = true)),
      switchMap(() =>
        this.personalCardsService.getLinkedAccounts().pipe(
          finalize(() => {
            this.isLoading = false;
          })
        )
      ),
      shareReplay(1)
    );
  }

  setupNetworkWatcher() {
    const networkWatcherEmitter = new EventEmitter<boolean>();
    this.networkService.connectivityWatcher(networkWatcherEmitter);
    this.isConnected$ = concat(this.networkService.isOnline(), networkWatcherEmitter.asObservable());

    this.isConnected$.subscribe((isOnline) => {
      if (!isOnline) {
        this.router.navigate(['/', 'enterprise', 'my_dashboard']);
      }
    });
  }

  linkAccount() {
    from(this.loaderService.showLoader('Redirecting you to our banking partner...', 10000))
      .pipe(
        switchMap(() => this.personalCardsService.getToken()),
        finalize(async () => {
          await this.loaderService.hideLoader();
        })
      )
      .subscribe((yodleeConfig) => {
        this.openYoodle(yodleeConfig.fast_link_url, yodleeConfig.access_token);
      });
  }

  openYoodle(url, access_token) {
    const pageContentUrl = this.personalCardsService.htmlFormUrl(url, access_token);
    const browser = this.inAppBrowser.create(pageContentUrl, '_blank', 'location=no');
    browser.on('loadstart').subscribe((event) => {
      /* As of now yodlee not supported for postmessage for cordova
         So now added callback url as https://www.fylehq.com ,
         after success yodlee will redirect to the url with success message on params,
         while start loading this url below code will parse the success message and
         close the inappborwser. this url will not visible to users.
      */
      if (event.url.substring(0, 22) === 'https://www.fylehq.com') {
        browser.close();
        this.zone.run(() => {
          const decodedData = JSON.parse(decodeURIComponent(event.url.slice(43)));
          this.postAccounts([decodedData[0].requestId]);
        });
      }
    });
  }

  postAccounts(requestIds) {
    from(this.loaderService.showLoader('Linking your card with Fyle...', 30000))
      .pipe(
        switchMap(() => this.personalCardsService.postBankAccounts(requestIds)),
        finalize(async () => {
          await this.loaderService.hideLoader();
        })
      )
      .subscribe((data) => {
        const message =
          data.length === 1 ? '1 card successfully added to Fyle!' : `${data.length} cards successfully added to Fyle!`;
        this.matSnackBar.openFromComponent(ToastMessageComponent, {
          ...this.snackbarProperties.setSnackbarProperties('success', { message }),
          panelClass: ['msb-success'],
        });
        this.loadCardData$.next({});
      });
  }

  onDeleted() {
    this.loadCardData$.next({});
  }

  onHomeClicked() {
    const queryParams: Params = { state: 'home' };
    this.router.navigate(['/', 'enterprise', 'my_dashboard'], {
      queryParams,
    });
  }

  onTaskClicked() {
    const queryParams: Params = { state: 'tasks' };
    this.router.navigate(['/', 'enterprise', 'my_dashboard'], {
      queryParams,
    });
  }

  onCameraClicked() {
    this.router.navigate([
      '/',
      'enterprise',
      'camera_overlay',
      {
        navigate_back: true,
      },
    ]);
  }
}
