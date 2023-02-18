import { Component, Input, OnInit } from '@angular/core';

@Component({
  selector: 'app-back-header',
  templateUrl: './back-header.component.html',
  styleUrls: ['./back-header.component.scss']
})
export class BackHeaderComponent implements OnInit {
  @Input() title: string = '';

  constructor() {}

  ngOnInit() {}
}
