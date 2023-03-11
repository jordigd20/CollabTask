import { Component, Input, OnInit } from '@angular/core';
import { Task } from '../../interfaces';
import { SwiperOptions } from 'swiper';
import { Observable } from 'rxjs';

@Component({
  selector: 'app-task-slide',
  templateUrl: './task-slide.component.html',
  styleUrls: ['./task-slide.component.scss']
})
export class TaskSlideComponent implements OnInit {
  @Input() tasks$: Observable<Task[]> | undefined;
  @Input() withoutUsers: boolean = false;
  @Input() noTasksMessage: string = 'No hay tareas para asignar';

  slideOpts: SwiperOptions = {
    slidesPerView: 1.4,
    spaceBetween: 10,
    freeMode: true
  };

  constructor() {}

  ngOnInit() {}

  getSelectedDate(task: Task) {
    const selectedDate = task.selectedDate;
    return selectedDate !== 'withoutDate' ? (task[selectedDate] as string) : '';
  }
}
