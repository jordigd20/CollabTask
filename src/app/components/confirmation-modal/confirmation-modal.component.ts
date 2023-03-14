import { Component, OnInit, Input } from '@angular/core';
import { ModalController } from '@ionic/angular';

@Component({
  selector: 'app-confirmation-modal',
  templateUrl: './confirmation-modal.component.html',
  styleUrls: ['./confirmation-modal.component.scss']
})
export class ConfirmationModalComponent implements OnInit {
  @Input() title: string = '';
  @Input() message: string = '';
  @Input() confirmText: string = '';
  @Input() dangerType: boolean = false;
  @Input() mainFunction: () => void = () => {};

  isLoading: boolean = false;
  constructor(private modalController: ModalController) {}

  ngOnInit() {}

  async dismissModal() {
    await this.modalController.dismiss();
  }

  async executeAction() {
    this.isLoading = true;
    await this.mainFunction();
    this.isLoading = false;
    await this.dismissModal();
  }
}
