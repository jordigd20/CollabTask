import { Component, OnInit } from '@angular/core';

@Component({
  selector: 'app-task-slide',
  templateUrl: './task-slide.component.html',
  styleUrls: ['./task-slide.component.scss'],
})
export class TaskSlideComponent implements OnInit {

  slideOpts = {
    slidesPerView: 1.4,
    spaceBetween: 10,
    freeMode: true,
  };

  constructor() { }

  ngOnInit() {}

}
