import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'objValues'
})
export class ValuesPipe implements PipeTransform {
  transform(value: any, ...args: any[]): any {
    return Object.values(value);
  }
}
