import { Component, Input, OnInit, Output, EventEmitter } from '@angular/core';
import { PersonalCard } from 'src/app/core/models/personal_card.model';
import { SwiperComponent } from 'swiper/angular';
// import Swiper core and required modules
import SwiperCore, { Pagination } from 'swiper';

// install Swiper modules
SwiperCore.use([Pagination]);
@Component({
  selector: 'app-bank-account-cards',
  templateUrl: './bank-account-cards.component.html',
  styleUrls: ['./bank-account-cards.component.scss'],
})
export class BankAccountCardsComponent implements OnInit {
  @Input() linkedAccounts: PersonalCard[];

  @Output() deleted = new EventEmitter();

  pagination = {
    renderBullet(index, className) {
      return `<span class="fyle ${className}"> </span>`;
    },
  };

  constructor() {}

  ngOnInit(): void {}

  onDeleted() {
    this.deleted.emit();
  }
}
