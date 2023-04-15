import { Component, ElementRef, Input, OnInit, ViewChild, Renderer2 } from '@angular/core';

@Component({
  selector: 'app-efficiency-card',
  templateUrl: './efficiency-card.component.html',
  styleUrls: ['./efficiency-card.component.scss']
})
export class EfficiencyCardComponent implements OnInit {
  @ViewChild('bar', { static: true }) bar: ElementRef<SVGCircleElement> =
    {} as ElementRef<SVGCircleElement>;

  @Input() efficiency: number = 0;

  constructor(private renderer: Renderer2) {}

  ngOnInit() {}

  ngOnChanges() {
    const radius = 90;
    const circumference = 2 * Math.PI * radius;

    if (this.efficiency < 0) {
      this.efficiency = 0;
    }

    if (this.efficiency > 100) {
      this.efficiency = 100;
    }

    const offset = circumference - (this.efficiency / 100) * circumference;
    this.renderer.setStyle(this.bar.nativeElement, 'stroke-dashoffset', offset);
  }
}
