import { Component, OnInit, ViewChild, ElementRef } from '@angular/core';
import { Observable, from, Subject, noop, of, combineLatest } from 'rxjs';
import { Expense } from 'src/app/core/models/expense.model';
import { CustomField } from 'src/app/core/models/custom_field.model';
import { ActivatedRoute, Router } from '@angular/router';
import { TransactionService } from 'src/app/core/services/transaction.service';
import { LoaderService } from 'src/app/core/services/loader.service';
import { OfflineService } from 'src/app/core/services/offline.service';
import { CustomInputsService } from 'src/app/core/services/custom-inputs.service';
import { PerDiemService } from 'src/app/core/services/per-diem.service';
import { PolicyService } from 'src/app/core/services/policy.service';
import { switchMap, finalize, shareReplay, map, concatMap } from 'rxjs/operators';
import { ReportService } from 'src/app/core/services/report.service';
import { PopoverController, ModalController } from '@ionic/angular';
import { StatusService } from 'src/app/core/services/status.service';
import { ViewCommentComponent } from 'src/app/shared/components/comments-history/view-comment/view-comment.component';
import { ModalPropertiesService } from 'src/app/core/services/modal-properties.service';
import { TrackingService } from '../../core/services/tracking.service';
import { FyDeleteDialogComponent } from 'src/app/shared/components/fy-delete-dialog/fy-delete-dialog.component';
import { FyPopoverComponent } from 'src/app/shared/components/fy-popover/fy-popover.component';
import { ViewExpensesService } from 'src/app/core/services/view-expenses.service';
import { getCurrencySymbol } from '@angular/common';

@Component({
  selector: 'app-view-per-diem',
  templateUrl: './view-per-diem.page.html',
  styleUrls: ['./view-per-diem.page.scss'],
})
export class ViewPerDiemPage implements OnInit {
  @ViewChild('comments') commentsContainer: ElementRef;

  extendedPerDiem$: Observable<Expense>;

  orgSettings: any;

  perDiemCustomFields$: Observable<CustomField[]>;

  perDiemRate$: Observable<any>;

  isCriticalPolicyViolated$: Observable<boolean>;

  isAmountCapped$: Observable<boolean>;

  policyViloations$: Observable<any>;

  canFlagOrUnflag$: Observable<boolean>;

  canDelete$: Observable<boolean>;

  reportId: string;

  policyDetails;

  updateFlag$ = new Subject();

  comments$: Observable<any>;

  isDeviceWidthSmall = window.innerWidth < 330;

  isExpenseFlagged: boolean;

  numEtxnsInReport: number;

  activeEtxnIndex: number;

  paymentMode: string;

  paymentModeIcon: string;

  homeCurrencySymbol: string;

  view: 'Team' | 'Individual';

  isProjectShown: boolean;

  constructor(
    private activatedRoute: ActivatedRoute,
    private transactionService: TransactionService,
    private loaderService: LoaderService,
    private offlineService: OfflineService,
    private customInputsService: CustomInputsService,
    private perDiemService: PerDiemService,
    private policyService: PolicyService,
    private reportService: ReportService,
    private router: Router,
    private popoverController: PopoverController,
    private statusService: StatusService,
    private modalController: ModalController,
    private modalProperties: ModalPropertiesService,
    private trackingService: TrackingService,
    private viewExpensesService: ViewExpensesService
  ) {}

  isNumber(val) {
    return typeof val === 'number';
  }

  goBack() {
    if (this.view === 'Team') {
      this.router.navigate(['/', 'enterprise', 'view_team_report', { id: this.reportId, navigate_back: true }]);
    } else {
      this.router.navigate(['/', 'enterprise', 'my_view_report', { id: this.reportId, navigate_back: true }]);
    }
  }

  getPolicyDetails(txId: string) {
    if (txId) {
      from(this.policyService.getPolicyViolationRules(txId))
        .pipe()
        .subscribe((details) => {
          this.policyDetails = details;
        });
    }
  }

  async openCommentsModal() {
    const etxn = await this.transactionService.getEtxn(this.activatedRoute.snapshot.params.id).toPromise();
    const modal = await this.modalController.create({
      component: ViewCommentComponent,
      componentProps: {
        objectType: 'transactions',
        objectId: etxn.tx_id,
      },
      presentingElement: await this.modalController.getTop(),
      ...this.modalProperties.getModalDefaultProperties(),
    });

    await modal.present();
    const { data } = await modal.onDidDismiss();

    if (data && data.updated) {
      this.trackingService.addComment({ view: this.view });
    } else {
      this.trackingService.viewComment({ view: this.view });
    }
  }

  ionViewWillEnter() {
    const id = this.activatedRoute.snapshot.params.id;

    this.extendedPerDiem$ = this.updateFlag$.pipe(
      switchMap(() =>
        from(this.loaderService.showLoader()).pipe(switchMap(() => this.transactionService.getExpenseV2(id)))
      ),
      finalize(() => from(this.loaderService.hideLoader())),
      shareReplay(1)
    );

    this.extendedPerDiem$.subscribe((res) => {
      this.reportId = res.tx_report_id;

      if (res.source_account_type === 'PERSONAL_ADVANCE_ACCOUNT') {
        this.paymentMode = 'Paid from Advance';
        this.paymentModeIcon = 'fy-non-reimbursable';
      } else if (res.tx_skip_reimbursement) {
        this.paymentMode = 'Paid by Company';
        this.paymentModeIcon = 'fy-non-reimbursable';
      } else {
        this.paymentMode = 'Paid by Employee';
        this.paymentModeIcon = 'fy-reimbursable';
      }
    });

    combineLatest([this.offlineService.getExpenseFieldsMap(), this.extendedPerDiem$])
      .pipe(
        map(([expenseFieldsMap, extendedPerDiem]) => {
          const isProjectMandatory = expenseFieldsMap?.project_id && expenseFieldsMap?.project_id[0]?.is_mandatory;
          this.isProjectShown =
            this.orgSettings?.projects?.enabled && (extendedPerDiem.tx_project_name || isProjectMandatory);
        })
      )
      .subscribe(noop);

    this.offlineService
      .getOrgSettings()
      .pipe(shareReplay(1))
      .subscribe((orgSettings) => {
        this.orgSettings = orgSettings;
      });

    this.perDiemCustomFields$ = this.extendedPerDiem$.pipe(
      switchMap((res) =>
        this.customInputsService.fillCustomProperties(res.tx_org_category_id, res.tx_custom_properties, true)
      ),
      map((res) =>
        res.map((customProperties) => {
          customProperties.displayValue = this.customInputsService.getCustomPropertyDisplayValue(customProperties);
          return customProperties;
        })
      )
    );

    this.perDiemRate$ = this.extendedPerDiem$.pipe(
      switchMap((res) => {
        const perDiemRateId = parseInt(res.tx_per_diem_rate_id, 10);
        return this.perDiemService.getRate(perDiemRateId);
      })
    );

    this.view = this.viewExpensesService.view;

    if (this.view === 'Team') {
      this.canFlagOrUnflag$ = this.extendedPerDiem$.pipe(
        map(
          (etxn) =>
            ['COMPLETE', 'POLICY_APPROVED', 'APPROVER_PENDING', 'APPROVED', 'PAYMENT_PENDING'].indexOf(etxn.tx_state) >
            -1
        )
      );

      this.canDelete$ = this.extendedPerDiem$.pipe(
        concatMap((etxn) =>
          this.reportService.getTeamReport(etxn.tx_report_id).pipe(map((report) => ({ report, etxn })))
        ),
        map(({ report, etxn }) => {
          if (report.rp_num_transactions === 1) {
            return false;
          }
          return ['PAYMENT_PENDING', 'PAYMENT_PROCESSING', 'PAID'].indexOf(etxn.tx_state) < 0;
        })
      );
    }

    if (id) {
      this.policyViloations$ = this.policyService.getPolicyViolationRules(id);
    } else {
      this.policyViloations$ = of(null);
    }

    this.comments$ = this.statusService.find('transactions', id);

    this.isCriticalPolicyViolated$ = this.extendedPerDiem$.pipe(
      map((res) => this.isNumber(res.tx_policy_amount) && res.tx_policy_amount < 0.0001)
    );

    this.getPolicyDetails(id);

    this.isAmountCapped$ = this.extendedPerDiem$.pipe(
      map((res) => this.isNumber(res.tx_admin_amount) || this.isNumber(res.tx_policy_amount))
    );

    this.extendedPerDiem$.subscribe((etxn) => {
      this.isExpenseFlagged = etxn.tx_manual_flag;
    });

    this.offlineService
      .getHomeCurrency()
      .pipe(
        map((homeCurrency) => {
          this.homeCurrencySymbol = getCurrencySymbol(homeCurrency, 'wide');
        })
      )
      .subscribe(noop);

    this.updateFlag$.next();
    this.activeEtxnIndex = this.viewExpensesService.activeEtxnIndex;
    this.numEtxnsInReport = this.viewExpensesService.getNumEtxns();
  }

  async removeExpenseFromReport() {
    const etxn = await this.transactionService.getEtxn(this.activatedRoute.snapshot.params.id).toPromise();

    const deletePopover = await this.popoverController.create({
      component: FyDeleteDialogComponent,
      cssClass: 'delete-dialog',
      backdropDismiss: false,
      componentProps: {
        header: 'Remove Expense',
        body: 'Are you sure you want to remove this expense from the report?',
        infoMessage: 'The report amount will be adjusted accordingly.',
        ctaText: 'Remove',
        ctaLoadingText: 'Removing',
        deleteMethod: () => this.reportService.removeTransaction(etxn.tx_report_id, etxn.tx_id),
      },
    });

    await deletePopover.present();
    const { data } = await deletePopover.onDidDismiss();

    if (data && data.status === 'success') {
      this.trackingService.expenseRemovedByApprover();
      this.router.navigate(['/', 'enterprise', 'view_team_report', { id: etxn.tx_report_id }]);
    }
  }

  async flagUnflagExpense() {
    const id = this.activatedRoute.snapshot.params.id;
    const etxn = await this.transactionService.getEtxn(id).toPromise();

    const title = this.isExpenseFlagged ? 'Unflag' : 'Flag';
    const flagUnflagModal = await this.popoverController.create({
      component: FyPopoverComponent,
      componentProps: {
        title,
        formLabel: `Reason for ${title.toLowerCase()}ing expense`,
      },
      cssClass: 'fy-dialog-popover',
    });

    await flagUnflagModal.present();
    const { data } = await flagUnflagModal.onWillDismiss();

    if (data && data.comment) {
      from(this.loaderService.showLoader('Please wait'))
        .pipe(
          switchMap(() => {
            const comment = {
              comment: data.comment,
            };
            return this.statusService.post('transactions', etxn.tx_id, comment, true);
          }),
          concatMap(() =>
            etxn.tx_manual_flag
              ? this.transactionService.manualUnflag(etxn.tx_id)
              : this.transactionService.manualFlag(etxn.tx_id)
          ),
          finalize(() => {
            this.updateFlag$.next();
            this.loaderService.hideLoader();
          })
        )
        .subscribe(noop);
    }
    this.isExpenseFlagged = etxn.tx_manual_flag;
    this.trackingService.expenseFlagUnflagClicked({ action: title });
  }

  getDisplayValue(customProperties) {
    const displayValue = this.customInputsService.getCustomPropertyDisplayValue(customProperties);
    return displayValue === '-' ? 'Not Added' : displayValue;
  }

  goToPrev() {
    this.viewExpensesService.gotoPrev();
  }

  goToNext() {
    this.viewExpensesService.goToNext();
  }

  ngOnInit() {}
}
