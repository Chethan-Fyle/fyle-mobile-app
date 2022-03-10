// TODO: Very hard to fix this file without making massive changes
/* eslint-disable complexity */
import { Component, ElementRef, EventEmitter, OnInit, ViewChild } from '@angular/core';
import { from, noop, Observable, of, Subject } from 'rxjs';
import { ActivatedRoute, Router } from '@angular/router';
import {
  concatMap,
  finalize,
  map,
  reduce,
  shareReplay,
  startWith,
  switchMap,
  take,
  tap,
  toArray,
  scan,
} from 'rxjs/operators';
import { OfflineService } from 'src/app/core/services/offline.service';
import { FormArray, FormBuilder, FormGroup, ValidationErrors, Validators } from '@angular/forms';
import { MatSnackBar } from '@angular/material/snack-bar';
import { CategoriesService } from 'src/app/core/services/categories.service';
import { ProjectsService } from 'src/app/core/services/projects.service';
import * as moment from 'moment';
import { CustomInputsService } from 'src/app/core/services/custom-inputs.service';
import { CustomFieldsService } from 'src/app/core/services/custom-fields.service';
import { ActionSheetController, ModalController, NavController, PopoverController } from '@ionic/angular';
import { FileService } from 'src/app/core/services/file.service';
import { CorporateCreditCardExpenseService } from '../../core/services/corporate-credit-card-expense.service';
import { TrackingService } from '../../core/services/tracking.service';
import { FileObject } from 'src/app/core/models/file_obj.model';
import { TaxGroup } from 'src/app/core/models/tax_group.model';
import { SnackbarPropertiesService } from 'src/app/core/services/snackbar-properties.service';
import { ToastMessageComponent } from 'src/app/shared/components/toast-message/toast-message.component';
import { Expense } from 'src/app/core/models/expense.model';
import { MergeExpensesService } from 'src/app/core/services/merge-expenses.service';
import { HumanizeCurrencyPipe } from 'src/app/shared/pipes/humanize-currency.pipe';

@Component({
  selector: 'app-merge-expense',
  templateUrl: './merge-expense.page.html',
  styleUrls: ['./merge-expense.page.scss'],
})
export class MergeExpensePage implements OnInit {
  @ViewChild('duplicateInputContainer') duplicateInputContainer: ElementRef;

  @ViewChild('formContainer') formContainer: ElementRef;

  expenses: Expense[];

  mergedExpense = {};

  mergedExpenseOptions: any = {};

  fg: FormGroup;

  expenseOptions$: Observable<{ label: string; value: any }[]>;

  isMerging = false;

  selectedReceiptsId: string[] = [];

  customInputs$: Observable<any>;

  attachments$: Observable<FileObject[]>;

  taxGroups$: Observable<TaxGroup[]>;

  taxGroupsOptions$: Observable<{ label: string; value: any }[]>;

  isLoaded = false;

  projects: any;

  categories: any;

  mergedCustomProperties: any = {};

  customPropertiesLoaded: boolean;

  receiptOptions$: Observable<any[]>;

  disableFormElements: any;

  isReportedExpensePresent: boolean;

  showReceiptSelection: boolean;

  disableExpenseToKeep: boolean;

  expenseToKeepInfoText: string;

  selectedExpense: any;

  CCCTxn$: Observable<any>;

  oldCustomFields: any;

  location_1Options: any;

  location_2Options: any;

  constructor(
    private router: Router,
    private offlineService: OfflineService,
    private formBuilder: FormBuilder,
    private categoriesService: CategoriesService,
    private projectService: ProjectsService,
    private customInputsService: CustomInputsService,
    private customFieldsService: CustomFieldsService,
    private fileService: FileService,
    private navController: NavController,
    private corporateCreditCardExpenseService: CorporateCreditCardExpenseService,
    private trackingService: TrackingService,
    private matSnackBar: MatSnackBar,
    private snackbarProperties: SnackbarPropertiesService,
    private mergeExpensesService: MergeExpensesService,
    private humanizeCurrency: HumanizeCurrencyPipe
  ) {}

  ngOnInit() {
    this.expenses = this.router.getCurrentNavigation().extras.state.selectedElements;
    // console.log(JSON.stringify(this.expenses));

    //     const expenses = `
    // [{"_search_document":"'3m':13 '55':1 '55.00':2 'c1':5 'complete':4 'e/2022/02/t/833':6 'e0233':7 'engine':10,11 'inr':3 'kavya':8 'kavya.hl@fyle.in':9 'others':12","duplicates":null,"external_expense_id":null,"matched_by":null,"ou_band":null,"ou_business_unit":null,"ou_department":null,"ou_department_id":null,"ou_employee_id":"E0233","ou_id":"ouKrh6zKkazp","ou_joining_dt":null,"ou_level":null,"ou_location":null,"ou_mobile":null,"ou_org_id":"orNVthTo2Zyo","ou_org_name":"Staging Loaded","ou_rank":null,"ou_sub_department":null,"ou_title":null,"ou_user_id":"us2KhpQLpzX4","rp_approved_at":null,"rp_claim_number":null,"rp_purpose":null,"rp_reimbursed_at":null,"source_account_id":"acc0waQov9fgP","source_account_type":"PERSONAL_CORPORATE_CREDIT_CARD_ACCOUNT","tg_name":null,"tg_percentage":null,"transaction_approvals":{"oufIVELfl7I6":{"state":"APPROVAL_PENDING"}},"tx_activity_details":null,"tx_activity_policy_pending":null,"tx_admin_amount":null,"tx_amount":55,"tx_billable":true,"tx_boolean_column1":null,"tx_boolean_column10":null,"tx_boolean_column2":null,"tx_boolean_column3":null,"tx_boolean_column4":null,"tx_boolean_column5":null,"tx_boolean_column6":null,"tx_boolean_column7":null,"tx_boolean_column8":null,"tx_boolean_column9":null,"tx_bus_travel_class":null,"tx_category":null,"tx_corporate_credit_card_expense_group_id":null,"tx_cost_center_code":null,"tx_cost_center_id":null,"tx_cost_center_name":null,"tx_created_at":"2022-02-16T09:28:14.446629","tx_creator_id":"ouKrh6zKkazp","tx_currency":"INR","tx_custom_properties":[{"name":"userlist","value":[]},{"name":"hsdgja","value":null},{"name":"cfgn","value":null},{"name":"test_report","value":null},{"name":"Test","value":null},{"name":"List type number","value":null},{"name":"TCF","value":{"display":"Mariyamman Kovil St, Vagai Nagar, Ramanathapuram, Tamil Nadu 623504, India"}}],"tx_decimal_column1":null,"tx_decimal_column10":null,"tx_decimal_column2":null,"tx_decimal_column3":null,"tx_decimal_column4":null,"tx_decimal_column5":null,"tx_decimal_column6":null,"tx_decimal_column7":null,"tx_decimal_column8":null,"tx_decimal_column9":null,"tx_distance":null,"tx_distance_unit":null,"tx_expense_number":"E/2022/02/T/833","tx_external_id":null,"tx_extracted_data":null,"tx_file_ids":null,"tx_flight_journey_travel_class":null,"tx_flight_return_travel_class":null,"tx_from_dt":null,"tx_fyle_category":"Others","tx_hotel_is_breakfast_provided":null,"tx_id":"txcR56ISjq8p","tx_invoice_number":null,"tx_is_duplicate_expense":null,"tx_is_holiday_expense":null,"tx_is_split_expense":false,"tx_location_column1":null,"tx_location_column10":null,"tx_location_column2":null,"tx_location_column3":null,"tx_location_column4":null,"tx_location_column5":null,"tx_location_column6":null,"tx_location_column7":null,"tx_location_column8":{"actual":null,"city":null,"country":null,"display":"Mariyamman Kovil St, Vagai Nagar, Ramanathapuram, Tamil Nadu 623504, India","formatted_address":null,"latitude":null,"longitude":null,"state":null},"tx_location_column9":null,"tx_locations":[],"tx_mandatory_fields_present":true,"tx_manual_flag":false,"tx_mileage_calculated_amount":null,"tx_mileage_calculated_distance":null,"tx_mileage_is_round_trip":null,"tx_mileage_rate":null,"tx_mileage_vehicle_type":null,"tx_num_days":null,"tx_num_files":0,"tx_org_category":"Engine","tx_org_category_code":null,"tx_org_category_id":116090,"tx_org_user_id":"ouKrh6zKkazp","tx_orig_amount":null,"tx_orig_currency":null,"tx_payment_id":"payxEnLXYSQuE","tx_per_diem_rate_id":null,"tx_physical_bill":false,"tx_physical_bill_at":null,"tx_policy_amount":null,"tx_policy_flag":false,"tx_policy_state":null,"tx_project_code":"1397","tx_project_id":247935,"tx_project_name":"3M","tx_purpose":"C1","tx_receipt_required":false,"tx_report_id":null,"tx_reported_at":null,"tx_risk_state":null,"tx_skip_reimbursement":true,"tx_source":"MOBILE","tx_source_account_id":"acc0waQov9fgP","tx_split_group_id":"txcR56ISjq8p","tx_split_group_user_amount":55,"tx_state":"COMPLETE","tx_sub_category":"Engine","tx_tax":null,"tx_tax_amount":null,"tx_tax_group_id":null,"tx_text_array_column1":null,"tx_text_array_column10":null,"tx_text_array_column2":null,"tx_text_array_column3":null,"tx_text_array_column4":null,"tx_text_array_column5":null,"tx_text_array_column6":null,"tx_text_array_column7":null,"tx_text_array_column8":null,"tx_text_array_column9":null,"tx_text_column1":null,"tx_text_column10":null,"tx_text_column11":null,"tx_text_column12":null,"tx_text_column13":null,"tx_text_column14":null,"tx_text_column15":null,"tx_text_column2":null,"tx_text_column3":null,"tx_text_column4":null,"tx_text_column5":null,"tx_text_column6":null,"tx_text_column7":null,"tx_text_column8":null,"tx_text_column9":null,"tx_timestamp_column1":null,"tx_timestamp_column10":null,"tx_timestamp_column2":null,"tx_timestamp_column3":null,"tx_timestamp_column4":null,"tx_timestamp_column5":null,"tx_timestamp_column6":null,"tx_timestamp_column7":null,"tx_timestamp_column8":null,"tx_timestamp_column9":null,"tx_to_dt":null,"tx_train_travel_class":null,"tx_transcribed_data":null,"tx_transcription_state":null,"tx_txn_dt":"2022-02-16T01:00:00.000Z","tx_updated_at":"2022-02-16T19:08:17.090285","tx_user_amount":55,"tx_user_can_delete":true,"tx_user_reason_for_duplicate_expenses":null,"tx_user_review_needed":null,"tx_vendor":null,"tx_vendor_id":null,"tx_verification_state":null,"us_email":"kavya.hl@fyle.in","us_full_name":"kavya","isDraft":false,"isPolicyViolated":false,"isCriticalPolicyViolated":false,"vendorDetails":null},{"_search_document":"'3m':13 '44':1 '44.00':2 'c1':5 'complete':4 'e/2022/02/t/832':6 'e0233':7 'engine':10,11 'inr':3 'kavya':8 'kavya.hl@fyle.in':9 'others':12","duplicates":null,"external_expense_id":null,"matched_by":null,"ou_band":null,"ou_business_unit":null,"ou_department":null,"ou_department_id":null,"ou_employee_id":"E0233","ou_id":"ouKrh6zKkazp","ou_joining_dt":null,"ou_level":null,"ou_location":null,"ou_mobile":null,"ou_org_id":"orNVthTo2Zyo","ou_org_name":"Staging Loaded","ou_rank":null,"ou_sub_department":null,"ou_title":null,"ou_user_id":"us2KhpQLpzX4","rp_approved_at":null,"rp_claim_number":null,"rp_purpose":null,"rp_reimbursed_at":null,"source_account_id":"acc0waQov9fgP","source_account_type":"PERSONAL_CORPORATE_CREDIT_CARD_ACCOUNT","tg_name":null,"tg_percentage":null,"transaction_approvals":{"oufIVELfl7I6":{"state":"APPROVAL_PENDING"}},"tx_activity_details":null,"tx_activity_policy_pending":null,"tx_admin_amount":null,"tx_amount":44,"tx_billable":true,"tx_boolean_column1":null,"tx_boolean_column10":null,"tx_boolean_column2":null,"tx_boolean_column3":null,"tx_boolean_column4":null,"tx_boolean_column5":null,"tx_boolean_column6":null,"tx_boolean_column7":null,"tx_boolean_column8":null,"tx_boolean_column9":null,"tx_bus_travel_class":null,"tx_category":null,"tx_corporate_credit_card_expense_group_id":null,"tx_cost_center_code":null,"tx_cost_center_id":null,"tx_cost_center_name":null,"tx_created_at":"2022-02-16T09:27:45.538403","tx_creator_id":"ouKrh6zKkazp","tx_currency":"INR","tx_custom_properties":[{"name":"userlist","value":[]},{"name":"hsdgja","value":null},{"name":"cfgn","value":null},{"name":"test_report","value":null},{"name":"Test","value":null},{"name":"List type number","value":null},{"name":"TCF","value":{"city":"Ramanathapuram","country":"India","display":"19/13, Mariyamman Kovil St, Vagai Nagar, Ramanathapuram, Tamil Nadu 623504, India","formatted_address":"19/13, Mariyamman Kovil St, Vagai Nagar, Ramanathapuram, Tamil Nadu 623504, India","latitude":9.3725305,"longitude":78.84564089999999,"state":"Tamil Nadu"}}],"tx_decimal_column1":null,"tx_decimal_column10":null,"tx_decimal_column2":null,"tx_decimal_column3":null,"tx_decimal_column4":null,"tx_decimal_column5":null,"tx_decimal_column6":null,"tx_decimal_column7":null,"tx_decimal_column8":null,"tx_decimal_column9":null,"tx_distance":null,"tx_distance_unit":null,"tx_expense_number":"E/2022/02/T/832","tx_external_id":null,"tx_extracted_data":null,"tx_file_ids":null,"tx_flight_journey_travel_class":null,"tx_flight_return_travel_class":null,"tx_from_dt":null,"tx_fyle_category":"Food","tx_hotel_is_breakfast_provided":null,"tx_id":"txRTO8q49TzO","tx_invoice_number":null,"tx_is_duplicate_expense":null,"tx_is_holiday_expense":null,"tx_is_split_expense":false,"tx_location_column1":null,"tx_location_column10":null,"tx_location_column2":null,"tx_location_column3":null,"tx_location_column4":null,"tx_location_column5":null,"tx_location_column6":null,"tx_location_column7":null,"tx_location_column8":{"actual":null,"city":"Ramanathapuram","country":"India","display":"19/13, Mariyamman Kovil St, Vagai Nagar, Ramanathapuram, Tamil Nadu 623504, India","formatted_address":"19/13, Mariyamman Kovil St, Vagai Nagar, Ramanathapuram, Tamil Nadu 623504, India","latitude":9.3725305,"longitude":78.84564089999999,"state":"Tamil Nadu"},"tx_location_column9":null,"tx_locations":[],"tx_mandatory_fields_present":true,"tx_manual_flag":false,"tx_mileage_calculated_amount":null,"tx_mileage_calculated_distance":null,"tx_mileage_is_round_trip":null,"tx_mileage_rate":null,"tx_mileage_vehicle_type":null,"tx_num_days":null,"tx_num_files":0,"tx_org_category":"Food","tx_org_category_code":null,"tx_org_category_id":16566,"tx_org_user_id":"ouKrh6zKkazp","tx_orig_amount":null,"tx_orig_currency":null,"tx_payment_id":"pay6yp25bRdrd","tx_per_diem_rate_id":null,"tx_physical_bill":false,"tx_physical_bill_at":null,"tx_policy_amount":null,"tx_policy_flag":true,"tx_policy_state":null,"tx_project_code":"1397","tx_project_id":247935,"tx_project_name":"3M","tx_purpose":"C1","tx_receipt_required":true,"tx_report_id":null,"tx_reported_at":null,"tx_risk_state":null,"tx_skip_reimbursement":true,"tx_source":"MOBILE","tx_source_account_id":"acc0waQov9fgP","tx_split_group_id":"txRTO8q49TzO","tx_split_group_user_amount":44,"tx_state":"COMPLETE","tx_sub_category":"Food","tx_tax":null,"tx_tax_amount":null,"tx_tax_group_id":null,"tx_text_array_column1":null,"tx_text_array_column10":null,"tx_text_array_column2":null,"tx_text_array_column3":null,"tx_text_array_column4":null,"tx_text_array_column5":null,"tx_text_array_column6":null,"tx_text_array_column7":null,"tx_text_array_column8":null,"tx_text_array_column9":null,"tx_text_column1":null,"tx_text_column10":null,"tx_text_column11":null,"tx_text_column12":null,"tx_text_column13":null,"tx_text_column14":null,"tx_text_column15":null,"tx_text_column2":null,"tx_text_column3":null,"tx_text_column4":null,"tx_text_column5":null,"tx_text_column6":null,"tx_text_column7":null,"tx_text_column8":null,"tx_text_column9":null,"tx_timestamp_column1":null,"tx_timestamp_column10":null,"tx_timestamp_column2":null,"tx_timestamp_column3":null,"tx_timestamp_column4":null,"tx_timestamp_column5":null,"tx_timestamp_column6":null,"tx_timestamp_column7":null,"tx_timestamp_column8":null,"tx_timestamp_column9":null,"tx_to_dt":null,"tx_train_travel_class":null,"tx_transcribed_data":null,"tx_transcription_state":null,"tx_txn_dt":"2022-02-16T01:00:00.000Z","tx_updated_at":"2022-02-16T18:46:04.656493","tx_user_amount":44,"tx_user_can_delete":true,"tx_user_reason_for_duplicate_expenses":null,"tx_user_review_needed":null,"tx_vendor":null,"tx_vendor_id":null,"tx_verification_state":null,"us_email":"kavya.hl@fyle.in","us_full_name":"kavya","isDraft":false,"isPolicyViolated":true,"isCriticalPolicyViolated":false,"vendorDetails":null}]
    //             `;
    // this.expenses = JSON.parse(expenses);
    // console.log(JSON.stringify(this.expenses));
    // console.log(this.expenses);
  }

  ionViewWillEnter() {
    this.fg = this.formBuilder.group({
      target_txn_id: [, Validators.required],
      currencyObj: [],
      paymentMode: [, Validators.required],
      amount: [],
      project: [],
      category: [],
      dateOfSpend: [],
      vendor: [],
      purpose: [],
      report: [],
      tax_group: [],
      tax_amount: [],
      location_1: [],
      location_2: [],
      from_dt: [],
      to_dt: [],
      flight_journey_travel_class: [],
      flight_return_travel_class: [],
      train_travel_class: [],
      bus_travel_class: [],
      distance: [],
      distance_unit: [],
      custom_inputs: new FormArray([]),
      add_to_new_report: [],
      duplicate_detection_reason: [],
      billable: [],
      costCenter: [],
      hotel_is_breakfast_provided: [],
      receipt_ids: [],
    });

    this.generateCustomInputOptions();
    this.setupCustomFields();
    this.generateLocationOptions();

    // from(Object.keys(this.expenses[0])).subscribe((item) => {
    //   this.mergedExpense[item] = [];
    //   from(this.expenses)
    //     .pipe(
    //       map((expense) => {
    //         if (expense[item]) {
    //           this.mergedExpense[item].push(expense[item]);
    //         }
    //       })
    //     )
    //     .subscribe(noop);
    // });

    from(Object.keys(this.expenses[0])).subscribe((item) => {
      this.mergedExpenseOptions[item] = {};
      this.mergedExpenseOptions[item].options = [];
      from(this.expenses)
        .pipe(
          map((expense) => {
            if (expense[item] !== undefined && expense[item] !== null) {
              let label = String(expense[item]);
              if (item === 'tx_amount') {
                label = parseFloat(expense[item]).toFixed(2);
              }
              this.mergedExpenseOptions[item].options.push({
                label,
                value: expense[item],
              });
            }
          })
        )
        .subscribe(noop);

      let valueArr = this.mergedExpenseOptions[item].options.map((item) => item.value);
      if (item === 'tx_txn_dt') {
        valueArr = this.mergedExpenseOptions[item].options.map((item) => new Date(item.value.toDateString()).getTime());
      }

      const isDuplicate = valueArr.some((item, idx) => valueArr.indexOf(item) !== idx);
      this.mergedExpenseOptions[item].isSame = isDuplicate;

      if (item === 'source_account_type' && isDuplicate) {
        this.fg.patchValue({
          paymentMode: this.mergedExpenseOptions[item].options[0].value,
        });
      }

      if (item === 'tx_currency' && isDuplicate) {
        this.fg.patchValue({
          currencyObj: this.mergedExpenseOptions[item].options[0].value,
        });
      }

      if (item === 'tx_txn_dt' && isDuplicate) {
        this.fg.patchValue({
          dateOfSpend: this.mergedExpenseOptions[item].options[0].value,
        });
      }

      if (item === 'tx_amount' && isDuplicate) {
        this.fg.patchValue({
          amount: this.mergedExpenseOptions[item].options[0].value,
        });
      }

      if (item === 'tx_billable' && isDuplicate) {
        this.fg.patchValue({
          billable: this.mergedExpenseOptions[item].options[0].value,
        });
      }

      if (item === 'tx_vendor' && isDuplicate) {
        this.fg.patchValue({
          vendor: this.mergedExpenseOptions[item].options[0].value,
        });
      }

      if (item === 'tx_cost_center_name' && isDuplicate) {
        this.fg.patchValue({
          costCenter: this.mergedExpenseOptions[item].options[0].value,
        });
      }

      if (item === 'tx_purpose' && isDuplicate) {
        this.fg.patchValue({
          purpose: this.mergedExpenseOptions[item].options[0].value,
        });
      }

      if (item === 'tx_tax_group_id' && isDuplicate) {
        this.fg.patchValue({
          tax_group: this.mergedExpenseOptions[item].options[0].value,
        });
      }

      if (item === 'tx_tax_amount' && isDuplicate) {
        this.fg.patchValue({
          tax_amount: this.mergedExpenseOptions[item].options[0].value,
        });
      }
    });

    this.expenseOptions$ = from(this.expenses).pipe(
      map((expense) => {
        let vendorOrCategory = '';
        if (expense.tx_vendor) {
          vendorOrCategory = expense.tx_vendor;
        }
        if (expense.tx_org_category) {
          vendorOrCategory = expense.tx_org_category;
        }
        let projectName = '';
        if (expense.tx_project_name) {
          projectName = `- ${expense.tx_project_name}`;
        }

        let date = '';
        if (expense.tx_txn_dt) {
          date = moment(expense.tx_txn_dt).format('MMM DD');
        }
        let amount = this.humanizeCurrency.transform(expense.tx_amount, expense.tx_currency, 2);
        if (!date) {
          amount = '';
        }
        return {
          label: `${date} ${amount} ${vendorOrCategory} ${projectName}`,
          value: expense.tx_id,
        };
      }),
      scan((acc, curr) => {
        acc.push(curr);
        return acc;
      }, []),
      shareReplay(1)
    );

    this.receiptOptions$ = from(this.expenses).pipe(
      map((expense, i) => ({
        label: `Receipt From Expense ${i + 1} `,
        value: expense.tx_id,
      })),
      scan((acc, curr) => {
        acc.push(curr);
        return acc;
      }, []),
      shareReplay(1)
    );

    this.projectService.getAllActive().subscribe((reso) => {
      this.projects = reso;
      this.mergedExpenseOptions.tx_project_id.options = this.mergedExpenseOptions.tx_project_id.options.map(
        (option) => {
          option.label = this.projects[this.projects.map((project) => project.id).indexOf(option.value)].name;
          return option;
        }
      );
      if (this.mergedExpenseOptions.tx_project_id.options[0].value) {
        this.fg.patchValue({
          project: this.mergedExpenseOptions.tx_project_id.options[0].value,
        });
      }
    });

    const allCategories$ = this.offlineService.getAllEnabledCategories();

    allCategories$.pipe(map((catogories) => this.categoriesService.filterRequired(catogories))).subscribe((res) => {
      this.categories = res;
      this.mergedExpenseOptions.tx_org_category_id.options = this.mergedExpenseOptions.tx_org_category_id.options
        .map((option) => {
          option.label =
            this.categories[this.categories.map((category) => category.id).indexOf(option.value)]?.displayName;
          if (!option.label) {
            option.label = 'Unspecified';
          }
          return option;
        })
        .filter((item) => item.label !== 'Unspecified');

      if (this.mergedExpenseOptions.tx_org_category_id.options[0]) {
        setTimeout(() => {
          this.fg.patchValue({
            category: this.mergedExpenseOptions.tx_org_category_id.options[0].value,
          });
        }, 600);
      }
    });

    this.taxGroups$ = this.offlineService.getEnabledTaxGroups().pipe(shareReplay(1));
    this.taxGroupsOptions$ = this.taxGroups$.pipe(
      map((taxGroupsOptions) => taxGroupsOptions.map((tg) => ({ label: tg.name, value: tg })))
    );

    this.taxGroups$.subscribe((taxGroups) => {
      this.mergedExpenseOptions.tx_tax_group_id.options = this.mergedExpenseOptions.tx_tax_group_id.options.map(
        (option) => {
          option.label = taxGroups[taxGroups.map((taxGroup) => taxGroup.id).indexOf(option.value)]?.name;
          return option;
        }
      );
    });

    this.loadAttchments();
    this.fg.controls.target_txn_id.valueChanges.subscribe((expenseId) => {
      const selectedIndex = this.expenses.map((e) => e.tx_id).indexOf(expenseId);
      this.onExpenseChanged(selectedIndex);
    });

    const expensesInfo = this.setDefaultExpenseToKeep(this.expenses);
    const isAllAdvanceExpenses = this.isAllAdvanceExpenses(this.expenses);
    this.setInitialExpenseToKeepDetails(expensesInfo, isAllAdvanceExpenses);
    this.onPaymentModeChange();
    this.isLoaded = true;
  }

  loadAttchments() {
    this.attachments$ = this.fg.controls.receipt_ids.valueChanges.pipe(
      startWith({}),
      switchMap((etxn) =>
        this.fileService.findByTransactionId(etxn).pipe(
          switchMap((fileObjs) => from(fileObjs)),
          concatMap((fileObj: any) =>
            this.fileService.downloadUrl(fileObj.id).pipe(
              map((downloadUrl) => {
                fileObj.url = downloadUrl;
                const details = this.getReceiptDetails(fileObj);
                fileObj.type = details.type;
                fileObj.thumbnail = details.thumbnail;
                return fileObj;
              })
            )
          ),
          reduce((acc, curr) => acc.concat(curr), [])
        )
      ),
      tap((receipts) => {
        this.selectedReceiptsId = receipts.map((receipt) => receipt.id);
      })
    );
  }

  mergeExpense() {
    const selectedExpense = this.fg.value.target_txn_id;
    this.fg.markAllAsTouched();
    if (!this.fg.valid) {
      return;
    }
    this.isMerging = true;
    const source_txn_ids = [];
    from(this.expenses)
      .pipe(
        map((expense) => {
          source_txn_ids.push(expense.tx_id);
        })
      )
      .subscribe(noop);
    const index = source_txn_ids.findIndex((id) => id === selectedExpense);
    source_txn_ids.splice(index, 1);
    this.generate()
      .pipe(
        take(1),
        switchMap((resForm) =>
          this.mergeExpensesService.mergeExpenses(source_txn_ids, selectedExpense, resForm).pipe(
            finalize(() => {
              this.isMerging = false;
              this.showMergedSuccessToast();
              this.navController.back();
            })
          )
        )
      )
      .subscribe(noop);
  }

  showMergedSuccessToast() {
    const toastMessageData = {
      message: 'Expenses merged Successfully',
    };
    this.matSnackBar
      .openFromComponent(ToastMessageComponent, {
        ...this.snackbarProperties.setSnackbarProperties('success', toastMessageData),
        panelClass: ['msb-success-with-camera-icon'],
      })
      .onAction()
      .subscribe(noop);
  }

  generate() {
    const customInputs$ = this.getCustomFields();
    const result = this.expenses.find((obj) => obj.source_account_type === this.fg.value.paymentMode);
    const CCCGroupIds = this.expenses.map(
      (expense) =>
        expense.tx_corporate_credit_card_expense_group_id && expense.tx_corporate_credit_card_expense_group_id
    );
    let locations;
    if (this.fg.value.location_1 && this.fg.value.location_2) {
      locations = [this.fg.value.location_1, this.fg.value.location_2];
    } else if (this.fg.value.location_1) {
      locations = [this.fg.value.location_1];
    }
    return customInputs$.pipe(
      take(1),
      switchMap(async (customProperties) => ({
        source_account_id: result && result.tx_source_account_id,
        billable: this.fg.value.billable,
        currency: this.fg.value.currencyObj,
        amount: this.fg.value.amount,
        project_id: this.fg.value.project,
        tax_amount: this.fg.value.tax_amount,
        tax_group_id: this.fg.value.tax_group && this.fg.value.tax_group.id,
        org_category_id: this.fg.value.category && this.fg.value.category,
        fyle_category: this.fg.value.category && this.fg.value.category.category,
        policy_amount: null,
        vendor: this.fg.value.vendor,
        purpose: this.fg.value.purpose,
        txn_dt: this.fg.value.dateOfSpend,
        receipt_ids: this.selectedReceiptsId,
        custom_properties: customProperties,
        ccce_group_id: CCCGroupIds && CCCGroupIds[0],
        from_dt: this.fg.value.from_dt,
        to_dt: this.fg.value.to_dt,
        flight_journey_travel_class: this.fg.value.flight_journey_travel_class,
        flight_return_travel_class: this.fg.value.flight_return_travel_class,
        train_travel_class: this.fg.value.train_travel_class,
        bus_travel_class: this.fg.value.bus_travel_class,
        distance: this.fg.value.distance,
        distance_unit: this.fg.value.distance_unit,
        locations: locations || [],
      }))
    );
  }

  setupCustomFields() {
    this.customInputs$ = this.fg.controls.category.valueChanges.pipe(
      startWith({}),
      switchMap(() =>
        this.offlineService.getCustomInputs().pipe(
          switchMap((fields) => {
            const formValue = this.fg.value;
            const customFields = this.customFieldsService.standardizeCustomFields(
              formValue.custom_inputs || [],
              this.customInputsService.filterByCategory(fields, this.fg.value.category)
            );

            const customFieldsFormArray = this.fg.controls.custom_inputs as FormArray;
            customFieldsFormArray.clear();
            for (const customField of customFields) {
              customFieldsFormArray.push(
                this.formBuilder.group({
                  name: [customField.name],
                  value: [customField.value],
                })
              );
            }
            customFieldsFormArray.updateValueAndValidity();
            return customFields.map((customField, i) => ({ ...customField, control: customFieldsFormArray.at(i) }));
          }),
          toArray()
        )
      ),
      tap((res) => {
        if (!this.isMerging) {
          this.patchValues(res);
        }
      })
    );
  }

  patchValues(customInputs) {
    const customInputValues = customInputs.map((customInput) => {
      if (
        this.mergedCustomProperties[customInput.name] &&
        this.mergedCustomProperties[customInput.name] &&
        this.mergedCustomProperties[customInput.name].isSame &&
        this.mergedCustomProperties[customInput.name].options.length > 0
      ) {
        return {
          name: customInput.name,
          value: this.mergedCustomProperties[customInput.name].options[0].value || null,
        };
      } else {
        return {
          name: customInput.name,
          value: null,
        };
      }
    });
    this.fg.controls.custom_inputs.patchValue(customInputValues);
  }

  onPaymentModeChange() {
    this.CCCTxn$ = this.fg.controls.paymentMode.valueChanges.pipe(
      startWith({}),
      switchMap(() =>
        this.offlineService.getCustomInputs().pipe(
          switchMap(() => {
            const CCCGroupIds = this.expenses.map(
              (expense) =>
                expense.tx_corporate_credit_card_expense_group_id && expense.tx_corporate_credit_card_expense_group_id
            );

            if (CCCGroupIds && CCCGroupIds.length > 0) {
              const queryParams = {
                group_id: ['in.(' + CCCGroupIds + ')'],
              };
              const params: any = {};
              params.queryParams = queryParams;
              params.offset = 0;
              params.limit = 1;
              return this.corporateCreditCardExpenseService.getv2CardTransactions(params).pipe(map((res) => res.data));
            } else {
              return of([]);
            }
          })
        )
      )
    );
  }

  formatDateOptions(options) {
    return options.map((option) => {
      option.label = moment(option.label).format('MMM DD, YYYY');
      return option;
    });
  }

  formatPaymentModeOptions(options) {
    return options.map((option) => {
      if (option.value === 'PERSONAL_CORPORATE_CREDIT_CARD_ACCOUNT') {
        option.label = 'Paid via Corporate Card';
      } else if (option.value === 'PERSONAL_ACCOUNT') {
        option.label = 'Paid by Me';
      } else if (option.value === 'PERSONAL_ADVANCE_ACCOUNT') {
        option.label = 'Paid from Advance';
      }
      return option;
    });
  }

  formatBillableOptions(options) {
    return options.map((option) => {
      if (option.value === true) {
        option.label = 'Yes';
      } else {
        option.label = 'No';
      }
      return option;
    });
  }

  formatReceiptOptions(options) {
    if (!options) {
      return;
    }
    return options.filter((el, i) => this.expenses[i].tx_file_ids !== null);
  }

  formatProjectOptions(options) {
    if (!options || !this.projects) {
      return;
    }
    const aa = options.map((option) => {
      option.label = this.projects[this.projects.map((project) => project.id).indexOf(option.value)].name;
      return option;
    });

    return options;
  }

  formatCategoryOptions(options) {
    if (!options || !this.categories) {
      return;
    }
    const aa = options.map((option) => {
      option.label = this.categories[this.categories.map((category) => category.id).indexOf(option.value)]?.displayName;
      if (!option.label) {
        option.label = 'Unspecified';
      }
      return option;
    });
    return aa;
  }

  getCategoryName(val) {
    if (!val) {
      return;
    }
    const label = this.categories[this.categories.map((category) => category.id).indexOf(val)]?.displayName;

    return label;
  }

  getReceiptDetails(file) {
    const ext = this.getReceiptExtension(file.name);
    const res = {
      type: 'unknown',
      thumbnail: 'img/fy-receipt.svg',
    };

    if (ext && ['pdf'].indexOf(ext) > -1) {
      res.type = 'pdf';
      res.thumbnail = 'img/fy-pdf.svg';
    } else if (ext && ['png', 'jpg', 'jpeg', 'gif'].indexOf(ext) > -1) {
      res.type = 'image';
      res.thumbnail = file.url;
    }

    return res;
  }

  getReceiptExtension(name) {
    let res = null;

    if (name) {
      const filename = name.toLowerCase();
      const idx = filename.lastIndexOf('.');

      if (idx > -1) {
        res = filename.substring(idx + 1, filename.length);
      }
    }

    return res;
  }

  generateCustomInputOptions() {
    let customProperties = this.expenses.map((expense) => {
      if (expense.tx_custom_properties !== null && expense.tx_custom_properties.length > 0) {
        return expense.tx_custom_properties;
      }
    });

    customProperties = customProperties.filter(function (element) {
      return element !== undefined;
    });

    let mergedCustomProperties = [].concat.apply([], customProperties);

    mergedCustomProperties = mergedCustomProperties.map((res) => {
      if (res.value && res.value instanceof Array) {
        res.options = [
          {
            label: res.value.toString(),
            value: res.value,
          },
        ];
        if (res.value.length === 0) {
          res.options = [];
        }
      } else {
        if (!res.value || res.value !== '') {
          res.options = [];
        } else {
          res.options = [
            {
              label: res.value,
              value: res.value,
            },
          ];
        }
      }
      return res;
    });

    const output = [];

    mergedCustomProperties.forEach(function (item) {
      const existing = output.filter(function (v) {
        return v.name === item.name;
      });

      if (existing.length) {
        const existingIndex = output.indexOf(existing[0]);

        if (typeof output[existingIndex].value === 'string' || typeof output[existingIndex].value === 'number') {
          output[existingIndex].options.push({ label: item.value.toString(), value: item.value });
        } else {
          output[existingIndex].options = output[existingIndex].options.concat(item.options);
        }
      } else {
        if ((item.value && typeof item.value === 'string') || typeof item.value === 'number') {
          item.options.push({ label: item.value.toString(), value: item.value });
        }
      }
    });

    const finalOut = output.map((res) => {
      let options;
      if (res.options) {
        options = res.options.filter((el) => el != null);
        options = res.options.filter((el) => el !== '');

        const valueArr = options.map(function (item) {
          return item.label;
        });

        const isDuplicate = valueArr.some((item, idx) => valueArr.indexOf(item) !== idx);

        res.isSame = isDuplicate;
        res.options = options;
      } else {
        res.options = [];
      }
      return res;
    });

    finalOut.map((res) => {
      this.mergedCustomProperties[res.name] = res;
    });

    this.customPropertiesLoaded = true;
  }

  onExpenseChanged(selectedIndex) {
    from(Object.keys(this.expenses[selectedIndex])).subscribe((item) => {
      const valueArr = this.mergedExpenseOptions[item].options.map((item) => item.value);
      const isDuplicate = valueArr.some((item, idx) => valueArr.indexOf(item) !== idx);
      if (
        this.mergedExpenseOptions[item].options[selectedIndex] &&
        this.mergedExpenseOptions[item].options[selectedIndex].value &&
        !isDuplicate
      ) {
        if (this.expenses[selectedIndex].tx_file_ids !== null) {
          this.fg.patchValue({
            receipt_ids: this.expenses[selectedIndex].tx_split_group_id,
          });
        }

        if (item === 'source_account_type' && !this.fg.controls.paymentMode.touched) {
          this.fg.patchValue({
            paymentMode: this.mergedExpenseOptions[item].options[selectedIndex].value,
          });
        }

        if (item === 'tx_currency' && !this.fg.controls.currencyObj.touched) {
          this.fg.patchValue({
            currencyObj: this.mergedExpenseOptions[item].options[selectedIndex].value,
          });
        }

        if (item === 'tx_txn_dt' && !this.fg.controls.dateOfSpend.touched) {
          this.fg.patchValue({
            dateOfSpend: this.mergedExpenseOptions[item].options[selectedIndex].value,
          });
        }

        if (item === 'tx_amount' && !this.fg.controls.amount.touched) {
          this.fg.patchValue({
            amount: this.mergedExpenseOptions[item].options[selectedIndex].value,
          });
        }

        if (item === 'tx_billable' && !this.fg.controls.billable.touched) {
          this.fg.patchValue({
            billable: this.mergedExpenseOptions[item].options[selectedIndex].value,
          });
        }

        if (item === 'tx_project_id' && !this.fg.controls.project.touched) {
          this.fg.patchValue({
            project: this.mergedExpenseOptions[item].options[selectedIndex].value,
          });
        }

        if (item === 'tx_vendor' && !this.fg.controls.vendor.touched) {
          this.fg.patchValue({
            vendor: this.mergedExpenseOptions[item].options[selectedIndex].value,
          });
        }
        if (item === 'tx_org_category_id' && !this.fg.controls.category.touched) {
          this.fg.patchValue({
            category: this.mergedExpenseOptions[item].options[selectedIndex].value,
          });
        }

        if (item === 'tx_cost_center_name' && !this.fg.controls.costCenter.touched) {
          this.fg.patchValue({
            costCenter: this.mergedExpenseOptions[item].options[selectedIndex].value,
          });
        }

        if (item === 'tx_purpose' && !this.fg.controls.purpose.touched) {
          this.fg.patchValue({
            purpose: this.mergedExpenseOptions[item].options[selectedIndex].value,
          });
        }

        if (item === 'tx_tax_group_id' && !this.fg.controls.purpose.touched) {
          this.fg.patchValue({
            tax_group: this.mergedExpenseOptions[item].options[selectedIndex].value,
          });
        }

        if (item === 'tx_tax_amount' && !this.fg.controls.purpose.touched) {
          this.fg.patchValue({
            tax_amount: this.mergedExpenseOptions[item].options[selectedIndex].value,
          });
        }
      }
    });
  }

  checkIfAdvanceExpensePresent(expenses) {
    return expenses.filter(function (expense) {
      return expense.source_account_type && expense.source_account_type === 'PERSONAL_ADVANCE_ACCOUNT';
    });
  }

  setDefaultExpenseToKeep(expenses) {
    const advanceExpenses = this.checkIfAdvanceExpensePresent(expenses);
    const reportedAndAboveExpenses = expenses.filter(function (expense) {
      return (
        ['APPROVER_PENDING', 'APPROVED', 'PAYMENT_PENDING', 'PAYMENT_PROCESSING', 'PAID'].indexOf(expense.tx_state) > -1
      );
    });
    const expensesInfo: any = {
      isReportedAndAbove: reportedAndAboveExpenses && reportedAndAboveExpenses.length > 0,
      isAdvancePresent: advanceExpenses && advanceExpenses.length > 0,
    };
    if (reportedAndAboveExpenses && reportedAndAboveExpenses.length > 0) {
      expensesInfo.defaultExpenses = reportedAndAboveExpenses;
    } else if (advanceExpenses && advanceExpenses.length > 0) {
      expensesInfo.defaultExpenses = advanceExpenses;
    } else {
      expensesInfo.defaultExpenses = null;
    }
    return expensesInfo;
  }

  setAdvanceOrApprovedAndAbove(expensesInfo) {
    const isApprovedAndAbove = this.isApprovedAndAbove(this.expenses);
    this.disableFormElements = (isApprovedAndAbove && isApprovedAndAbove.length > 0) || expensesInfo.isAdvancePresent;
  }

  isReportedOrAbove(expensesInfo) {
    return expensesInfo.defaultExpenses && expensesInfo.defaultExpenses.length === 1 && expensesInfo.isReportedAndAbove;
  }

  isMoreThanOneAdvancePresent(expensesInfo, isAllAdvanceExpenses) {
    return (
      expensesInfo.defaultExpenses &&
      expensesInfo.defaultExpenses.length > 1 &&
      isAllAdvanceExpenses &&
      expensesInfo.isAdvancePresent
    );
  }

  isAdvancePresent(expensesInfo) {
    return expensesInfo.defaultExpenses && expensesInfo.defaultExpenses.length === 1 && expensesInfo.isAdvancePresent;
  }

  isApprovedAndAbove(expenses) {
    const approvedAndAboveExpenses = expenses.filter(function (expense) {
      return ['APPROVED', 'PAYMENT_PENDING', 'PAYMENT_PROCESSING', 'PAID'].indexOf(expense.tx_state) > -1;
    });
    return approvedAndAboveExpenses;
  }

  isReportedPresent(expenses) {
    const reportedExpense = expenses.filter(function (expense) {
      return expense.tx_state === 'APPROVER_PENDING';
    });
    return reportedExpense;
  }

  setIsReported(expensesInfo) {
    const isReported = this.isReportedPresent(this.expenses);
    this.isReportedExpensePresent = isReported && isReported.length > 0;
    if (this.isReportedExpensePresent && expensesInfo.isAdvancePresent) {
      this.disableFormElements = true;
      this.showReceiptSelection = true;
    }
  }

  setInitialExpenseToKeepDetails(expensesInfo, isAllAdvanceExpenses) {
    if (expensesInfo.defaultExpenses) {
      if (this.isReportedOrAbove(expensesInfo)) {
        this.setIsReported(expensesInfo);
        this.disableExpenseToKeep = true;
        this.expenseToKeepInfoText = 'You are required to keep the expense that has already been submitted.';
        this.fg.patchValue({
          target_txn_id: expensesInfo.defaultExpenses[0].tx_split_group_id,
        });
      } else if (this.isMoreThanOneAdvancePresent(expensesInfo, isAllAdvanceExpenses)) {
        this.selectedExpense = null;
        this.showReceiptSelection = true;
        this.expenseToKeepInfoText =
          'You cannot make changes to an expense paid from ‘advance’. Edit each expense separately if you wish to make any changes.';
      } else if (this.isAdvancePresent(expensesInfo)) {
        this.fg.patchValue({
          target_txn_id: expensesInfo.defaultExpenses[0].tx_split_group_id,
        });
        this.disableExpenseToKeep = true;
        this.expenseToKeepInfoText =
          'You are required to keep the expense paid from ‘advance’. Edit each expense separately if you wish to make any changes.';
      }
      this.setAdvanceOrApprovedAndAbove(expensesInfo);
    }
  }

  isAllAdvanceExpenses(expenses) {
    return expenses.every(function (expense) {
      return expense.source_account_type && expense.source_account_type === 'PERSONAL_ADVANCE_ACCOUNT';
    });
  }

  getCustomFields() {
    return this.customInputs$.pipe(
      take(1),
      map((customInputs) =>
        customInputs.map((customInput, i) => ({
          id: customInput.id,
          name: customInput.name,
          value: this.fg.value.custom_inputs[i].value,
        }))
      )
    );
  }

  generateLocationOptions() {
    this.location_1Options = this.expenses
      .map((expense) => ({
        label: expense.tx_locations[0]?.formatted_address,
        value: expense.tx_locations[0],
      }))
      .filter((res) => res.value);

    this.location_2Options = this.expenses
      .map((expense) => ({
        label: expense.tx_locations[1]?.formatted_address,
        value: expense.tx_locations[1],
      }))
      .filter((res) => res.value);
  }
}