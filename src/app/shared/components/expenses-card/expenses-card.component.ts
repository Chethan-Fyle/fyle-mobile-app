import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { noop, Observable } from 'rxjs';
import { Expense } from 'src/app/core/models/expense.model';
import { ExpenseField } from 'src/app/core/models/v1/expense-field.model';
import { ExpenseFieldsMap } from 'src/app/core/models/v1/expense-fields-map.model';
import { ExpenseFieldsService } from 'src/app/core/services/expense-fields.service';
import { TransactionService } from 'src/app/core/services/transaction.service';
import {getCurrencySymbol} from '@angular/common';
import { OfflineService } from 'src/app/core/services/offline.service';
import { map } from 'rxjs/operators';

@Component({
  selector: 'app-expenses-card',
  templateUrl: './expenses-card.component.html',
  styleUrls: ['./expenses-card.component.scss'],
})
export class ExpensesCardComponent implements OnInit {

  @Input() expense: Expense;
  @Input() previousExpenseTxnDate;
  @Input() previousExpenseCreatedAt;
  @Input() isSelectionModeEnabled: boolean;
  @Input() selectedElements: Expense[];
  @Input() isProjectMandatory: boolean;

  @Output() goToTransaction: EventEmitter<Expense> = new EventEmitter();
  @Output() onHomeClicked: EventEmitter<Expense> = new EventEmitter();
  @Output() cardClickedForSelection: EventEmitter<Expense> = new EventEmitter();

  expenseFields$: Observable<Partial<ExpenseFieldsMap>>;
  receipt: any;
  showDt = true;
  isPolicyViolated: boolean;
  isCriticalPolicyViolated: boolean;
  homeCurrency: string;
  homeCurrencySymbol = '';
  foreignCurrencySymbol = '';
  paymentModeIcon: string;
  isScanInProgress: boolean;

  constructor(
    private transactionService: TransactionService,
    private expenseFieldsService: ExpenseFieldsService,
    private offlineService: OfflineService
  ) { }


  onGoToTransaction() {
    if (!this.isSelectionModeEnabled) {
      this.goToTransaction.emit(this.expense);
    } else {
      // need to put restriction to add draft and critical policy violation 
      // can't put here, beacuse we allow to delete multiple expense in page now
        this.cardClickedForSelection.emit(this.expense);
    }
  }

  

  get isSelected() {
    return this.selectedElements.some(txn => this.expense.tx_id === txn.tx_id);
  }

  getReceipt() {
    if (this.expense.tx_fyle_category && this.expense.tx_fyle_category.toLowerCase() === 'mileage') {
      this.receipt = 'assets/svg/fy-mileage.svg';
    } else if (this.expense.tx_fyle_category && this.expense.tx_fyle_category.toLowerCase() === 'per diem') {
      this.receipt = 'assets/svg/fy-calendar.svg';
    } else {
      // Todo: Get thumbnail of image in V2
      this.receipt = 'assets/svg/fy-expense.svg';
    }
  }

  ngOnInit() {
    this.expense.isDraft = this.expense.tx_state && this.expense.tx_state.toLowerCase() === 'draft';
    this.expense.isPolicyViolated = (this.expense.tx_manual_flag || this.expense.tx_policy_flag);
    this.expense.isCriticalPolicyViolated = (typeof this.expense.tx_policy_amount === 'number' && this.expense.tx_policy_amount < 0.0001);
    this.expense.vendorDetails = this.transactionService.getVendorDetails(this.expense);
    this.expenseFields$ = this.offlineService.getExpenseFieldsMap();

    this.offlineService.getHomeCurrency().pipe(
      map((homeCurrency) => {
        this.homeCurrency = homeCurrency;
        this.homeCurrencySymbol = getCurrencySymbol(homeCurrency, 'wide');
        this.foreignCurrencySymbol = getCurrencySymbol(this.expense.tx_orig_currency, 'wide');
      })
    ).subscribe(noop);
    this.homeCurrencySymbol = getCurrencySymbol(this.expense.tx_currency, 'wide');

    if (this.previousExpenseTxnDate || this.previousExpenseCreatedAt) {
      const currentDate = (this.expense && (new Date(this.expense.tx_txn_dt || this.expense.tx_created_at)).toDateString());
      const previousDate = new Date(this.previousExpenseTxnDate || this.previousExpenseCreatedAt).toDateString();
      this.showDt = currentDate !== previousDate;
    }

    this.getReceipt();

    this.isScanInProgress = this.getScanningReceiptCard(this.expense);

    if (this.expense.source_account_type === "PERSONAL_CORPORATE_CREDIT_CARD_ACCOUNT") {
        if (this.expense.tx_corporate_credit_card_expense_group_id) {
          this.paymentModeIcon = 'fy-matched';
        } else {
          this.paymentModeIcon = 'fy-unmatched';
        }
    } else {
      if (!this.expense.tx_skip_reimbursement) {
        this.paymentModeIcon = 'fy-reimbursable';
      } else {
        this.paymentModeIcon = 'fy-non-reimbursable';
      }
    }

  }

  getScanningReceiptCard(expense: Expense): boolean {
    if (expense.tx_fyle_category && (expense.tx_fyle_category.toLowerCase() === 'mileage' || expense.tx_fyle_category.toLowerCase() === 'per diem')) {
      return false;
    } else {
      if (!expense.tx_currency && !expense.tx_amount) {
        if (!expense.tx_extracted_data && !expense.tx_transcribed_data) {
          return true;
        }
      }
    }
    return false;
  }

}
