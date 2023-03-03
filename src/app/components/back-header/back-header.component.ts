import { Component, Input, OnInit, Output, EventEmitter } from '@angular/core';

@Component({
  selector: 'app-back-header',
  templateUrl: './back-header.component.html',
  styleUrls: ['./back-header.component.scss']
})
export class BackHeaderComponent implements OnInit {
  @Input() title: string = '';
  @Input() showMoreOptions: boolean = false;
  @Input() showPreferences: boolean = false;

  @Output() moreOptions: EventEmitter<any> = new EventEmitter();
  @Output() preferences: EventEmitter<any> = new EventEmitter();

  constructor() {}

  ngOnInit() {}
}
