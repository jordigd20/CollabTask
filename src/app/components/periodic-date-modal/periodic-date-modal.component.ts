import { Component, Input, OnInit } from '@angular/core';
import { ModalController } from '@ionic/angular';

@Component({
  selector: 'app-periodic-date-modal',
  templateUrl: './periodic-date-modal.component.html',
  styleUrls: ['./periodic-date-modal.component.scss']
})
export class PeriodicDateModalComponent implements OnInit {
  @Input() previousSelectedDay: string = 'lunes';

  selectedDay: string = 'lunes';
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
    this.selectedDay = this.previousSelectedDay;
  }

  selectDay(day: string) {
    this.selectedDay = day;
  }

  cancel() {
    this.modalController.dismiss({
      canceled: true
    });
  }

  accept() {
    this.modalController.dismiss({
      selectedDay: this.selectedDay
    });
  }
}
