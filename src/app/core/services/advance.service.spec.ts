import { TestBed } from '@angular/core/testing';

import { AdvanceService } from './advance.service';

describe('AdvanceService', () => {
    let service: AdvanceService;

    beforeEach(() => {
        TestBed.configureTestingModule({});
        service = TestBed.inject(AdvanceService);
    });

    it('should be created', () => {
        expect(service).toBeTruthy();
    });
});
