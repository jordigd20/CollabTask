import { Component, Input, OnInit, Output, EventEmitter } from '@angular/core';

@Component({
  selector: 'app-toolbar-searchbar',
  templateUrl: './toolbar-searchbar.component.html',
  styleUrls: ['./toolbar-searchbar.component.scss']
})
export class ToolbarSearchbarComponent implements OnInit {
  @Input() title: string = '';
  @Input() totalItems: number = 0;
  @Input() placeholder: string = '';
  @Input() type: string = 'equipos';

  @Output() search: EventEmitter<any> = new EventEmitter();

  constructor() {}

  ngOnInit() {}

  handleSearch(event: any) {
    this.search.emit(event);
  }
}
