import { Component, EventEmitter, OnInit, ViewChild } from '@angular/core';
import { IonTabs } from '@ionic/angular';

@Component({
  selector: 'app-tabs',
  templateUrl: './tabs.page.html',
  styleUrls: ['./tabs.page.scss']
})
export class TabsPage implements OnInit {
  currentTab: string = 'home';

  constructor() {}

  ngOnInit() {}

  setCurrentTab({ tab }: { tab: string }) {
    this.currentTab = tab;
  }
}
