import { Component, ElementRef, Input, OnInit, Renderer2, ViewChild } from '@angular/core';

@Component({
  selector: 'app-circle-chart',
  templateUrl: './circle-chart.component.html',
  styleUrls: ['./circle-chart.component.scss']
})
export class CircleChartComponent implements OnInit {
  @ViewChild('pieChart', { static: true }) pieChart: ElementRef<SVGElement> =
    {} as ElementRef<SVGElement>;

  @Input() pieData: number = 0;

  sectorAngle: number = 0;
  startAngle: number = 0;
  endAngle: number = 0;
  percent: number = 0;
  x1: number = 0;
  x2: number = 0;
  y1: number = 0;
  y2: number = 0;

  constructor(private renderer: Renderer2) {}

  ngOnInit() {}

  ngOnChanges() {
    console.log(this.pieData);
    this.sectorAngle = Math.ceil(360 * (this.pieData / 100));
    this.startAngle = this.endAngle;
    this.endAngle = this.startAngle + this.sectorAngle;

    // Check if the angle is over 180deg for large angle flag
    this.percent = this.endAngle - this.startAngle;

    let overHalf = 0;
    if (this.percent > 180) {
      overHalf = 1;
    }

    // Calculate the x,y coordinates for the arc
    this.x1 = 200 + 180 * Math.cos((this.startAngle * Math.PI) / 180);
    this.y1 = 200 + 180 * Math.sin((this.startAngle * Math.PI) / 180);
    this.x2 = 200 + 180 * Math.cos((this.endAngle * Math.PI) / 180);
    this.y2 = 200 + 180 * Math.sin((this.endAngle * Math.PI) / 180);

    const path = `M 200 200 L ${this.x1} ${this.y1} A 180 180 0 ${overHalf} 1 ${this.x2} ${this.y2} Z`;
    const pathEl = this.renderer.createElement('path', 'http://www.w3.org/2000/svg');
    this.renderer.setAttribute(pathEl, 'd', path);
    this.renderer.setAttribute(pathEl, 'fill', 'var(--ion-color-primary)');
    this.renderer.appendChild(this.pieChart.nativeElement, pathEl);
  }
}
