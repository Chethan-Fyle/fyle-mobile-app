import { Component, OnInit } from '@angular/core';
import { ModalController } from '@ionic/angular';

@Component({
  selector: 'app-share-report',
  templateUrl: './share-report.component.html',
  styleUrls: ['./share-report.component.scss'],
})
export class ShareReportComponent implements OnInit {
  email = '';

  constructor(private modalController: ModalController) {}

  async cancel() {
    await this.modalController.dismiss();
  }

  shareReport(emailInput) {
    if (!(emailInput.value.trim().length > 0) || emailInput.invalid) {
      return;
    }

    if (emailInput.valid) {
      this.modalController.dismiss({
        email: this.email,
      });
    } else {
      emailInput.control.markAllAsTouched();
    }
  }

  ngOnInit() {}
}
