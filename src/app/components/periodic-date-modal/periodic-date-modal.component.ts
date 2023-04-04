import { Component, Input, OnInit } from '@angular/core';
import { ModalController } from '@ionic/angular';

@Component({
  selector: 'app-periodic-date-modal',
  templateUrl: './periodic-date-modal.component.html',
  styleUrls: ['./periodic-date-modal.component.scss']
})
export class PeriodicDateModalComponent implements OnInit {
  @Input() previousSelectedDays: string[] = ['lunes'];

  selectedDays: string[] = ['lunes'];
  daysList: string[] = ['lunes', 'martes', 'miercoles', 'jueves', 'viernes', 'sabado', 'domingo'];
  shortDays: { [key: string]: string } = {
    lunes: 'lun',
    martes: 'mar',
    miercoles: 'mie',
    jueves: 'jue',
    viernes: 'vie',
    sabado: 'sab',
    domingo: 'dom'
  };

  constructor(private modalController: ModalController) {}

  ngOnInit() {
    this.selectedDays = [...this.previousSelectedDays];
  }

  selectDay(day: string) {
    if (this.selectedDays.includes(day)) {
      this.selectedDays = this.selectedDays.filter((d) => d !== day);
    } else {
      this.selectedDays.push(day);
    }
  }

  cancel() {
    this.modalController.dismiss({
      cancelled: true
    });
  }

  accept() {
    if (this.selectedDays.length === 0) {
      return;
    }

    this.modalController.dismiss({
      selectedDays: this.selectedDays
    });
  }
}
