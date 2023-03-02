import { Component, OnInit, Input } from '@angular/core';

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
  @Input() dismissModal: () => void = () => {};
  @Input() mainFunction: () => void = () => {};

  isLoading: boolean = false;
  constructor() {}

  ngOnInit() {}

  async executeAction() {
    this.isLoading = true;
    await this.mainFunction();
    this.isLoading = false;
  }
}
