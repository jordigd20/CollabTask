import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';

@Component({
  selector: 'app-manual-distribution',
  templateUrl: './manual-distribution.page.html',
  styleUrls: ['./manual-distribution.page.scss'],
})
export class ManualDistributionPage implements OnInit {
  idTeam: string | null = null;
  idTaskList: string | null = null;

  constructor(private activeRoute: ActivatedRoute) { }

  ngOnInit() {
    this.idTeam = this.activeRoute.snapshot.paramMap.get('idTeam');
    this.idTaskList = this.activeRoute.snapshot.paramMap.get('idTaskList');
  }

}
