import { Injectable } from '@angular/core';
import { RouterApiService } from './router-api.service';
import { tap, switchMap, map, concatMap } from 'rxjs/operators';
import { StorageService } from './storage.service';
import { TokenService } from './token.service';
import { ApiService } from './api.service';
import { AuthResponse } from '../models/auth-response.model';
import { Observable, from, of } from 'rxjs';
import { AdvanceRequestPolicyService } from './advance-request-policy.service';
import { ApiV2Service } from './api-v2.service';
import { DuplicateDetectionService } from './duplicate-detection.service';
import { LocationService } from './location.service';
import { PolicyApiService } from './policy-api.service';
import { TransactionsOutboxService } from './transactions-outbox.service';
import { VendorService } from './vendor.service';
import { TripRequestPolicyService } from './trip-request-policy.service';
import { PushNotificationService } from './push-notification.service';
import * as moment from 'moment';
import { JwtHelperService } from './jwt-helper.service';

@Injectable({
  providedIn: 'root'
})
export class RouterAuthService {

  constructor(
    private routerApiService: RouterApiService,
    private storageService: StorageService,
    private tokenService: TokenService,
    private advanceRequestPolicyService: AdvanceRequestPolicyService,
    private apiService: ApiService,
    private apiv2Service: ApiV2Service,
    private duplicateDetectionService: DuplicateDetectionService,
    private locationService: LocationService,
    private policyApiService: PolicyApiService,
    private transactionOutboxService: TransactionsOutboxService,
    private vendorService: VendorService,
    private tripRequestPolicyService: TripRequestPolicyService,
    private pushNotificationService: PushNotificationService,
    private jwtHelperService: JwtHelperService
  ) { }

  checkEmailExists(email) {
    return this.routerApiService.post('/auth/basic/email_exists', {
      email
    });
  }

  async isLoggedIn(): Promise<boolean> {
    return !!(await this.tokenService.getAccessToken()) && !!(await this.tokenService.getRefreshToken());
  }

  async newRefreshToken(refreshToken) {
    await this.storageService.delete('user');
    await this.storageService.delete('role');
    await this.tokenService.setRefreshToken(refreshToken);
  }

  async setClusterDomain(domain) {

    this.apiService.setRoot(domain);
    this.advanceRequestPolicyService.setRoot(domain);
    this.apiv2Service.setRoot(domain);
    this.tripRequestPolicyService.setRoot(domain);
    this.duplicateDetectionService.setRoot(domain);
    this.locationService.setRoot(domain);
    this.policyApiService.setRoot(domain);
    this.transactionOutboxService.setRoot(domain);
    this.vendorService.setRoot(domain);
    this.pushNotificationService.setRoot(domain);

    await this.tokenService.setClusterDomain(domain);
  }

  async newAccessToken(accessToken) {
    await this.tokenService.setAccessToken(accessToken);
  }

  async fetchAccessToken(refreshToken): Promise<AuthResponse> {
    // this function is called from multiple places, token should be returned and not saved from here
    return await this.routerApiService.post('/auth/access_token', {
      refresh_token: refreshToken
    }).toPromise();
  }

  sendResetPassword(email: string) {
    return this.routerApiService.post('/auth/send_reset_password', {
      email
    });
  }

  async handleSignInResponse(data) {
    // if (environment.NAME === 'dev') {
    //   data.cluster_domain = environment.CLUSTER_DOMAIN;
    //   data.redirect_url = data.redirect_url.replace('https://staging.fyle.in', data.cluster_domain);
    // }
    await this.newRefreshToken(data.refresh_token);
    await this.setClusterDomain(data.cluster_domain);
    const resp = await this.fetchAccessToken(data.refresh_token);
    await this.newAccessToken(resp.access_token);
    return data;
  }

  basicSignin(email, password): Observable<AuthResponse> {
    return this.routerApiService.post('/auth/basic/signin', {
      email,
      password
    }).pipe(
      switchMap(res => {
        return from(this.handleSignInResponse(res)).pipe(
          map(() => res)
        )
      })
    );
  }

  googleSignin(accessToken): Observable<AuthResponse> {
    return this.routerApiService.post('/auth/google/signin', {
      access_token: accessToken
    }).pipe(
      switchMap(res => {
        return from(this.handleSignInResponse(res)).pipe(
          map(() => res)
        )
      })
    );
  }

  expiringSoon(accessToken: string): boolean {
    try {
      const expiryDate = moment(this.jwtHelperService.getExpirationDate(accessToken));
      const now = moment(new Date());
      const differenceSeconds = expiryDate.diff(now, 'second');
      const maxRefreshDifferenceSeconds = 2 * 60;
      return differenceSeconds < maxRefreshDifferenceSeconds;
    } catch (err) {
      return true;
    }
  }

  /**
   * This method get current accessToken from Storage, check if this token is expiring or not.
   * If the token is expiring it will get another accessToken from API and return the new accessToken
   */
  getValidAccessToken(): Observable<string> {
    return from(this.tokenService.getAccessToken()).pipe(
      concatMap(accessToken => {
        if (this.expiringSoon(accessToken)) {
          return from(this.tokenService.getRefreshToken()).pipe(
            concatMap(refreshToken => {
              return from(this.fetchAccessToken(refreshToken));
            }),
            concatMap(authResponse => {
              return from(this.newAccessToken(authResponse.access_token))
            }),
            concatMap(() => {
              return from(this.tokenService.getAccessToken())
            })
          );
        } else {
          return of(accessToken);
        }
      })
    );
  }

  checkIfFreeDomain(email: string) {
    const domainList = ['hotmail.com', 'rediffmail.com', 'yahoo.com', 'outlook.com'];
    const domain = email.split('@')[1];
    return domainList.indexOf(domain.toLowerCase()) > -1;
  }

  emailVerify(verificationCode: string) {
    return this.routerApiService.post('/auth/email_verify', {
      verification_code: verificationCode
    }).pipe(
      switchMap(res => {
        return from(this.handleSignInResponse(res)).pipe(
          map(() => res)
        );
      })
    );
  }

  resetPassword(refreshToken: string, newPassword: string) {
    return this.routerApiService.post('/auth/reset_password', {
      refresh_token: refreshToken,
      password: newPassword
    }).pipe(
      switchMap(data => this.handleSignInResponse(data))
    );
  }

  getRegions() {
    return this.routerApiService.get('/regions').pipe(
      map((data) => {
        return data.regions;
      })
    );
  }

}
