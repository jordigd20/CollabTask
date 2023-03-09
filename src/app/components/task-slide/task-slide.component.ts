import { Component, Input, OnInit } from '@angular/core';
import { getSelectedDate } from '../../../app/helpers/common-functions';
import { Task } from '../../interfaces';
import { SwiperOptions } from 'swiper';

@Component({
  selector: 'app-task-slide',
  templateUrl: './task-slide.component.html',
  styleUrls: ['./task-slide.component.scss']
})
export class TaskSlideComponent implements OnInit {
  @Input() tasks: Task[] = [];
  @Input() withoutUsers: boolean = false;

  slideOpts: SwiperOptions = {
    slidesPerView: 1.4,
    spaceBetween: 10,
    freeMode: true
  };

  constructor() {}

  ngOnInit() {}

  getSelectedDate(date: string) {
    return getSelectedDate(date, this.tasks);
  }
}
