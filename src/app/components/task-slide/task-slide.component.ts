import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { Task } from '../../interfaces';
import { SwiperOptions } from 'swiper';

@Component({
  selector: 'app-task-slide',
  templateUrl: './task-slide.component.html',
  styleUrls: ['./task-slide.component.scss']
})
export class TaskSlideComponent implements OnInit {
  @Input() tasks: Task[] = [];
  @Input() idUser: string = '';
  @Input() withoutUsers: boolean = false;
  @Input() distributionMode: 'preferences' | 'manual' | 'none' = 'none';
  @Input() tradeMode: boolean = false;
  @Input() showMoreOptions: boolean = true;
  @Input() noTasksMessage: string = 'No hay tareas para asignar';
  @Input() idSelectedTask: string = '';

  @Output() idSelectedTaskToTrade: EventEmitter<string> = new EventEmitter();

  slideOpts: SwiperOptions = {
    slidesPerView: 1.4,
    spaceBetween: 10,
    freeMode: true
  };

  constructor() {}

  ngOnInit() {}

  identify(index: number, item: Task) {
    return item.id;
  }

  onIdTaskSelected(idTask: string) {
    this.idSelectedTask = idTask;
    this.idSelectedTaskToTrade.emit(idTask);
  }
}
