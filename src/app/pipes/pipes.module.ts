import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SortedValuesPipe } from './values.pipe';
import { SearchTeamsPipe } from './search-teams.pipe';

@NgModule({
  declarations: [SortedValuesPipe, SearchTeamsPipe],
  imports: [
    CommonModule,
  ],
  exports: [SortedValuesPipe, SearchTeamsPipe]
})
export class PipesModule { }
