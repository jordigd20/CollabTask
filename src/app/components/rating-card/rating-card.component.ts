import { Component, Input, OnInit } from '@angular/core';

@Component({
  selector: 'app-rating-card',
  templateUrl: './rating-card.component.html',
  styleUrls: ['./rating-card.component.scss']
})
export class RatingCardComponent implements OnInit {
  @Input() title: string = '';
  @Input() description: string = '';
  @Input() rate: number = 0;
  @Input() reverse: boolean = false;
  @Input() last: boolean = false;

  constructor() {}

  ngOnInit() {}
}
