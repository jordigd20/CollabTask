import { Component, Input, OnInit } from '@angular/core';

@Component({
  selector: 'app-rating-card',
  templateUrl: './rating-card.component.html',
  styleUrls: ['./rating-card.component.scss']
})
export class RatingCardComponent implements OnInit {
  @Input() title: string = '';
  @Input() description: string = '';
  @Input() reverse: boolean = false;
  @Input() last: boolean = false;
  @Input() rate: number = 0;
  @Input() totalRatings: number = 0;
  @Input() totalStars: {
    1: number;
    2: number;
    3: number;
    4: number;
    5: number;
  } = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };

  constructor() {}

  ngOnInit() {}
}
