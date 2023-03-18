import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SortedValuesPipe } from './values.pipe';
import { SearchTeamsPipe } from './search-teams.pipe';
import { ToStringPipe } from './to-string.pipe';
import { FloorPipe } from './floor.pipe';

@NgModule({
  declarations: [SortedValuesPipe, SearchTeamsPipe, ToStringPipe, FloorPipe],
  imports: [
    CommonModule,
  ],
  exports: [SortedValuesPipe, SearchTeamsPipe, ToStringPipe, FloorPipe]
})
export class PipesModule { }
