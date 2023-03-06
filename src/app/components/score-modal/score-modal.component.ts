import { Component, Input, OnInit } from '@angular/core';
import { ModalController } from '@ionic/angular';

@Component({
  selector: 'app-score-modal',
  templateUrl: './score-modal.component.html',
  styleUrls: ['./score-modal.component.scss']
})
export class ScoreModalComponent implements OnInit {
  @Input() previousScore: number = 10;
  selectedScore: number = 10;
  enabledScores: number[][] = [
    [1, 5, 10],
    [20, 30, 40],
    [50, 60, 70],
    [80, 90, 100]
  ];

  constructor(private modalController: ModalController) {}

  ngOnInit() {
    this.selectedScore = this.previousScore;
  }

  dismiss() {
    this.modalController.dismiss({
      selectedScore: this.selectedScore
    });
  }

  selectScore(score: number) {
    this.selectedScore = score;
    this.dismiss();
  }
}
