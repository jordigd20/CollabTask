import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonicModule } from '@ionic/angular';
import { ListsPageRoutingModule } from './lists-routing.module';
import { ListsPage } from './lists.page';
import { PipesModule } from '../../../pipes/pipes.module';

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    IonicModule,
    ListsPageRoutingModule,
    PipesModule
  ],
  declarations: [ListsPage]
})
export class ListsPageModule {}
