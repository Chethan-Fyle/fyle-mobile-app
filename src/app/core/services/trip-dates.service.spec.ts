import { TestBed } from '@angular/core/testing';

import { TripDatesService } from './trip-dates.service';

describe('TripDatesService', () => {
    let service: TripDatesService;

    beforeEach(() => {
        TestBed.configureTestingModule({});
        service = TestBed.inject(TripDatesService);
    });

    it('should be created', () => {
        expect(service).toBeTruthy();
    });
});
