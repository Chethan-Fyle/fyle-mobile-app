import { Injectable } from '@angular/core';
import { Observable, of } from 'rxjs';
import { OrgCategory } from '../models/org-category.model';
import { RecentlyUsed } from '../models/recently_used.model';
import { ApiService } from './api.service';

@Injectable({
  providedIn: 'root'
})
export class RecentlyUsedItemsService {

  constructor(
    private apiService: ApiService
  ) { }

  getRecentlyUsed():Observable<RecentlyUsed> {
    return this.apiService.get('/recently_used');
  }

  getRecentCategories(filteredCategories: { label: string, value: OrgCategory, selected?: boolean }[], recentValues: RecentlyUsed): Observable<{ label: string, value: OrgCategory, selected?: boolean }[]> {
    if (filteredCategories && filteredCategories.length > 0 && recentValues.recent_org_category_ids && recentValues.recent_org_category_ids.length > 0) {
      var categoriesMap = {};
      filteredCategories.forEach(category => {
        categoriesMap[category.value.id] = category;
      })
      return of(recentValues.recent_org_category_ids.map(id => categoriesMap[id]).filter(id => id));
    } else {
      return of(null);
    }
  }
}