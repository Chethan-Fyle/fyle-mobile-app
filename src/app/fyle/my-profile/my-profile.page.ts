import { Component, OnInit } from '@angular/core';
import { forkJoin, from, noop, Observable, throwError, of } from 'rxjs';
import { concatMap, finalize, map, shareReplay, switchMap, take, catchError, tap } from 'rxjs/operators';
import { ModalController } from '@ionic/angular';
import { AuthService } from 'src/app/core/services/auth.service';
import { CurrencyService } from 'src/app/core/services/currency.service';
import { OfflineService } from 'src/app/core/services/offline.service';
import { OrgUserSettingsService } from 'src/app/core/services/org-user-settings.service';
import { UserEventService } from 'src/app/core/services/user-event.service';
import { StorageService } from 'src/app/core/services/storage.service';
import { DeviceService } from 'src/app/core/services/device.service';
import { LoaderService } from 'src/app/core/services/loader.service';
import { ExtendedOrgUser } from 'src/app/core/models/extended-org-user.model';
import { globalCacheBusterNotifier } from 'ts-cacheable';
import { SelectCurrencyComponent } from './select-currency/select-currency.component';
import { TokenService } from 'src/app/core/services/token.service';
import { TrackingService } from '../../core/services/tracking.service';
import { environment } from 'src/environments/environment';

type EventData = {
  key: 'instaFyle' | 'bulkFyle' | 'defaultCurrency' | 'formAutofill';
  isEnabled: boolean;
};

@Component({
  selector: 'app-my-profile',
  templateUrl: './my-profile.page.html',
  styleUrls: ['./my-profile.page.scss'],
})
export class MyProfilePage implements OnInit {
  orgUserSettings: any;

  // expenses: any;

  // toggleUsageDetailsTab: boolean;

  // oneClickActionOptions: any[];

  // oneClickActionSelectedModuleId: string;

  orgSettings: any;

  currencies$: Observable<any>;

  preferredCurrency$: Observable<any>;

  eou$: Observable<ExtendedOrgUser>;

  // myETxnc$: Observable<{
  //   total: any;
  //   mobile: number;
  //   extension: number;
  //   outlook: number;
  //   email: number;
  //   web: number;
  // }>;

  // isApiCallInProgress = false;

  org$: Observable<any>;

  clusterDomain: string;

  // saveProfileLoading = false;

  ROUTER_API_ENDPOINT: string;

  settingsMap = {
    instaFyle: 'insta_fyle_settings',
    bulkFyle: 'bulk_fyle_settings',
    defaultCurrency: 'currency_settings',
    formAutofill: 'expense_form_autofills',
  };

  constructor(
    private authService: AuthService,
    private offlineService: OfflineService,
    private currencyService: CurrencyService,
    private orgUserSettingsService: OrgUserSettingsService,
    private modalController: ModalController,
    private userEventService: UserEventService,
    private storageService: StorageService,
    private deviceService: DeviceService,
    private loaderService: LoaderService,
    private tokenService: TokenService,
    private trackingService: TrackingService
  ) {}

  signOut() {
    try {
      forkJoin({
        device: this.deviceService.getDeviceInfo(),
        eou: from(this.authService.getEou()),
      })
        .pipe(
          switchMap(({ device, eou }) =>
            this.authService.logout({
              device_id: device.uuid,
              user_id: eou.us.id,
            })
          ),
          finalize(() => {
            this.storageService.clearAll();
            globalCacheBusterNotifier.next();
            this.userEventService.logout();
          })
        )
        .subscribe(noop);
    } catch (e) {
      this.storageService.clearAll();
      globalCacheBusterNotifier.next();
    }
  }

  // toggleUsageDetails() {
  //   this.toggleUsageDetailsTab = !this.toggleUsageDetailsTab;
  // }

  // saveUserProfile(eou) {
  //   this.saveProfileLoading = true;

  //   forkJoin({
  //     userSettings: this.orgUserService.postUser(eou.us),
  //     orgUserSettings: this.orgUserService.postOrgUser(eou.ou),
  //   })
  //     .pipe(
  //       concatMap(() =>
  //         this.authService.refreshEou().pipe(
  //           tap(() => this.trackingService.activated()),
  //           map(() => {
  //             const message = 'Profile saved successfully';
  //             this.matSnackBar.openFromComponent(ToastMessageComponent, {
  //               ...this.snackbarProperties.setSnackbarProperties('success', { message }),
  //               panelClass: ['msb-success'],
  //             });
  //             this.trackingService.showToastMessage({ ToastContent: message });
  //           })
  //         )
  //       ),
  //       finalize(() => {
  //         this.saveProfileLoading = false;
  //       })
  //     )
  //     .subscribe(noop);
  // }

  toggleSetting(eventData: EventData) {
    const settingName = this.settingsMap[eventData.key];
    this.orgUserSettings[settingName].enabled = eventData.isEnabled;

    // Currency change logic to be added
    // Event trackers to be added

    return this.orgUserSettingsService.post(this.orgUserSettings).subscribe(noop);
  }

  // setMyExpensesCountBySource(statsRes: StatsOneDResponse) {
  //   const totalCount = statsRes.getStatsTotalCount();

  //   return {
  //     total: totalCount,
  //     mobile: statsRes.getStatsCountBySource('MOBILE'),
  //     extension: statsRes.getStatsCountBySource('GMAIL'),
  //     outlook: statsRes.getStatsCountBySource('OUTLOOK'),
  //     email: statsRes.getStatsCountBySource('EMAIL'),
  //     web: statsRes.getStatsCountBySource('WEBAPP'),
  //   };
  // }

  toggleCurrencySettings() {
    from(this.loaderService.showLoader())
      .pipe(
        switchMap(() => this.orgUserSettingsService.post(this.orgUserSettings)),
        finalize(() => from(this.loaderService.hideLoader()))
      )
      .subscribe(() => {
        this.getPreferredCurrency();
      });
  }

  onSelectCurrency(currency) {
    this.orgUserSettings.currency_settings.preferred_currency = currency.shortCode || null;
    this.toggleCurrencySettings();
  }

  async openCurrenySelectionModal() {
    const modal = await this.modalController.create({
      component: SelectCurrencyComponent,
    });

    await modal.present();

    const { data } = await modal.onWillDismiss();

    if (data) {
      this.onSelectCurrency(data.currency);
    }
  }

  // toggleAutoExtraction() {
  //   return this.orgUserSettingsService
  //     .post(this.orgUserSettings)
  //     .pipe(
  //       map((res) => {
  //         if (this.orgUserSettings.insta_fyle_settings.enabled) {
  //           this.trackingService.onEnableInstaFyle({ persona: 'Enterprise' });
  //         } else {
  //           this.trackingService.onDisableInstaFyle({ persona: 'Enterprise' });
  //         }
  //       })
  //     )
  //     .subscribe(noop);
  // }

  // toggleBulkMode() {
  //   return this.orgUserSettingsService
  //     .post(this.orgUserSettings)
  //     .pipe(
  //       map((res) => {
  //         if (this.orgUserSettings.bulk_fyle_settings.enabled) {
  //           this.trackingService.onEnableBulkFyle({ persona: 'Enterprise' });
  //         } else {
  //           this.trackingService.onDisableBulkFyle({ persona: 'Enterprise' });
  //         }
  //       })
  //     )
  //     .subscribe(noop);
  // }

  // toggleAutofillSettings() {
  //   return this.orgUserSettingsService.post(this.orgUserSettings).subscribe(noop);
  // }

  // toggleSmsSettings() {
  //   return this.orgUserSettingsService
  //     .post(this.orgUserSettings)
  //     .pipe(
  //       map((res) => {
  //         // Todo: Tracking service and disable toogle button
  //       })
  //     )
  //     .subscribe(noop);
  // }

  // toggleOneClickActionMode() {
  //   this.orgUserSettings.one_click_action_settings.module = null;
  //   this.oneClickActionSelectedModuleId = '';
  //   return this.orgUserSettingsService.post(this.orgUserSettings).subscribe(noop);
  // }

  ionViewWillEnter() {
    this.reset();
    from(this.tokenService.getClusterDomain()).subscribe((clusterDomain) => {
      this.clusterDomain = clusterDomain;
    });

    this.ROUTER_API_ENDPOINT = environment.ROUTER_API_ENDPOINT;
  }

  reset() {
    this.eou$ = from(this.authService.getEou());
    const orgUserSettings$ = this.offlineService.getOrgUserSettings().pipe(shareReplay(1));

    // this.myETxnc$ = this.transactionService
    //   .getTransactionStats('count(tx_id)', {
    //     scalar: false,
    //     dimension_1_1: 'tx_source',
    //   })
    //   .pipe(map((statsRes) => this.setMyExpensesCountBySource(new StatsOneDResponse(statsRes[0]))));

    this.org$ = this.offlineService.getCurrentOrg();

    this.getPreferredCurrency();

    const orgSettings$ = this.offlineService.getOrgSettings();
    this.currencies$ = this.currencyService.getAllCurrenciesInList();

    from(this.loaderService.showLoader())
      .pipe(
        switchMap(() =>
          forkJoin({
            eou: this.eou$,
            orgUserSettings: orgUserSettings$,
            orgSettings: orgSettings$,
          })
        ),
        finalize(() => from(this.loaderService.hideLoader()))
      )
      .subscribe(async (res) => {
        this.orgUserSettings = res.orgUserSettings;
        this.orgSettings = res.orgSettings;
      });
  }

  getPreferredCurrency() {
    this.preferredCurrency$ = this.offlineService.getOrgUserSettings().pipe(
      switchMap((orgUserSettings) =>
        this.currencyService.getAllCurrenciesInList().pipe(
          map((currencies) =>
            currencies.find((currency) => currency.id === orgUserSettings.currency_settings.preferred_currency)
          ),
          map(
            (preferedCurrencySettings) =>
              preferedCurrencySettings && preferedCurrencySettings.id + ' - ' + preferedCurrencySettings.value
          )
        )
      )
    );
  }

  // openWebAppLink(location) {
  //   let link;

  //   if (location === 'app') {
  //     link = this.ROUTER_API_ENDPOINT;
  //   } else if (location === 'sms') {
  //     link = 'https://www.fylehq.com/help/en/articles/3524059-create-expense-via-sms';
  //   }

  //   Browser.open({ toolbarColor: '#f36', url: link });
  // }

  ngOnInit() {}
}
