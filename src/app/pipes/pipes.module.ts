import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SortedValuesPipe } from './values.pipe';
import { SearchTeamsPipe } from './search-teams.pipe';
import { ToStringPipe } from './to-string.pipe';

@NgModule({
  declarations: [SortedValuesPipe, SearchTeamsPipe, ToStringPipe],
  imports: [
    CommonModule,
  ],
  exports: [SortedValuesPipe, SearchTeamsPipe, ToStringPipe]
})
export class PipesModule { }
