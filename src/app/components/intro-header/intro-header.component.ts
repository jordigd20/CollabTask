import { Component, Input, OnInit } from '@angular/core';

@Component({
  selector: 'app-intro-header',
  templateUrl: './intro-header.component.html',
  styleUrls: ['./intro-header.component.scss']
})
export class IntroHeaderComponent implements OnInit {
  @Input() title: string = '';
  @Input() titleColor: string = 'primary';
  @Input() background: string = 'white';

  constructor() {}

  ngOnInit() {}
}
