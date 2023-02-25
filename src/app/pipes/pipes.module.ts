import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ValuesPipe } from './values.pipe';
import { SearchTeamsPipe } from './search-teams.pipe';

@NgModule({
  declarations: [ValuesPipe, SearchTeamsPipe],
  imports: [
    CommonModule,
  ],
  exports: [ValuesPipe, SearchTeamsPipe]
})
export class PipesModule { }
