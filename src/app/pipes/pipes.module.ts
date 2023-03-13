import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ValuesPipe } from './values.pipe';
import { SearchTeamsPipe } from './search-teams.pipe';
import { ToStringPipe } from './to-string.pipe';

@NgModule({
  declarations: [ValuesPipe, SearchTeamsPipe, ToStringPipe],
  imports: [
    CommonModule,
  ],
  exports: [ValuesPipe, SearchTeamsPipe, ToStringPipe]
})
export class PipesModule { }
