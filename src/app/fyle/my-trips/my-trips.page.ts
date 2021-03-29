import { Component, OnInit, EventEmitter } from '@angular/core';
import { TripRequestsService } from 'src/app/core/services/trip-requests.service';
import { ExtendedTripRequest } from 'src/app/core/models/extended_trip_request.model';
import { Observable, Subject, noop, from, concat } from 'rxjs';
import { map, shareReplay, concatMap, switchMap, scan, finalize } from 'rxjs/operators';
import { LoaderService } from 'src/app/core/services/loader.service';
import { NetworkService } from 'src/app/core/services/network.service';
import { Router, ActivatedRoute } from '@angular/router';

@Component({
  selector: 'app-my-trips',
  templateUrl: './my-trips.page.html',
  styleUrls: ['./my-trips.page.scss'],
})
export class MyTripsPage implements OnInit {

  isConnected$: Observable<boolean>;
  myTripRequests$: Observable<ExtendedTripRequest[]>;
  count$: Observable<number>;
  isInfiniteScrollRequired$: Observable<boolean>;
  loadData$: Subject<number> = new Subject();
  currentPageNumber = 1;
  navigateBack = false;
  acc: ExtendedTripRequest[];

  constructor(
    private tripRequestsService: TripRequestsService,
    private loaderService: LoaderService,
    private networkService: NetworkService,
    private activatedRoute: ActivatedRoute,
    private router: Router
  ) { }

  ionViewWillEnter() {
    this.navigateBack = !!this.activatedRoute.snapshot.params.navigateBack;
    this.currentPageNumber = 1;

    const paginatedPipe = this.loadData$.pipe(
      concatMap(pageNumber => {
        return from(this.loaderService.showLoader()).pipe(
          switchMap(() => {
            return this.tripRequestsService.getMyTrips({
              offset: (pageNumber - 1) * 10,
              limit: 10,
              queryParams: { order: 'trp_created_at.desc,trp_id.desc' }
            });
          }),
          finalize(() => {
            return from(this.loaderService.hideLoader());
          })
        );
      }),
      shareReplay(1)
    );

    this.myTripRequests$ = paginatedPipe.pipe(
      map(res => {
        if (this.currentPageNumber === 1) {
          this.acc = [];
        }
        this.acc = this.acc.concat(res.data);
        return this.acc;
      }),
      shareReplay(1)
    );

    this.count$ = paginatedPipe.pipe(
      map(res => res.count),
      shareReplay(1)
    );

    this.isInfiniteScrollRequired$ = this.myTripRequests$.pipe(
      switchMap(myTrips => {
        return this.count$.pipe(map(count => {
          return count > myTrips.length;
        }));
      })
    );

    this.loadData$.subscribe(noop);
    this.myTripRequests$.subscribe(noop);
    this.count$.subscribe(noop);
    this.isInfiniteScrollRequired$.subscribe(noop);
    this.loadData$.next(this.currentPageNumber);

    this.setupNetworkWatcher();
  }

  ngOnInit() { }

  loadData(event) {
    this.currentPageNumber = this.currentPageNumber + 1;
    this.loadData$.next(this.currentPageNumber);
    event.target.complete();
  }

  doRefresh(event) {
    this.currentPageNumber = 1;
    this.loadData$.next(this.currentPageNumber);
    event.target.complete();
  }

  setupNetworkWatcher() {
    const networkWatcherEmitter = new EventEmitter<boolean>();
    this.networkService.connectivityWatcher(networkWatcherEmitter);
    this.isConnected$ = concat(this.networkService.isOnline(), networkWatcherEmitter.asObservable());
    this.isConnected$.subscribe((isOnline) => {
      if (!isOnline) {
        this.router.navigate(['/', 'enterprise', 'my_expenses']);
      }
    });
  }

  onTripClick(clickedTrip: ExtendedTripRequest) {
    this.router.navigate(['/', 'enterprise', 'my_view_trips', { id: clickedTrip.trp_id }]);
  }
}
