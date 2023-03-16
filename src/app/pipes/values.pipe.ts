import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'objSortedValues'
})
export class SortedValuesPipe implements PipeTransform {
  transform(value: any, ...args: any[]): any {
    return Object.values(value).sort((a: any, b: any) => a.name.localeCompare(b.name));
  }
}
