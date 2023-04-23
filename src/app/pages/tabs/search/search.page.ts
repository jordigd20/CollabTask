import { Component, OnInit, ViewChild } from '@angular/core';
import { StorageService } from '../../../services/storage.service';
import { AuthService } from 'src/app/services/auth.service';
import { TaskService } from 'src/app/services/task.service';
import { TeamService } from 'src/app/services/team.service';
import { Subject, filter, takeUntil } from 'rxjs';
import { Task } from '../../../interfaces';
import { IonInfiniteScroll } from '@ionic/angular';

@Component({
  selector: 'app-search',
  templateUrl: './search.page.html',
  styleUrls: ['./search.page.scss']
})
export class SearchPage implements OnInit {
  @ViewChild(IonInfiniteScroll) infiniteScroll: IonInfiniteScroll = {} as IonInfiniteScroll;

  idUser: string | undefined;
  idTeams: string[] = [];
  filteredTasks: Task[] | undefined;
  filteredTasksCopy: Task[] | undefined;
  searchText: string = '';
  isSearching: boolean = false;
  userDidLeave: boolean = false;
  queryLimit: number = 10;
  destroyWhenLeave$ = new Subject<void>();

  constructor(
    private storageService: StorageService,
    private authService: AuthService,
    private teamService: TeamService,
    private taskService: TaskService
  ) {}

  ngOnInit() {}

  async ionViewWillEnter() {
    this.idUser = await this.storageService.get('idUser');

    if (!this.idUser) {
      return;
    }

    if (this.userDidLeave) {
      this.getFilteredTasks();
    }

    return this.teamService
      .getAllUserTeams(this.idUser!)
      .pipe(
        filter((teams) => this.idTeams.length !== teams.length),
        takeUntil(this.authService.destroyLoggedIn$)
      )
      .subscribe((teams) => {
        if (!teams) {
          return;
        }

        console.log(teams);
        this.idTeams = [];
        for (let team of teams) {
          this.idTeams.push(team.id);
        }

        this.handleSearch({ detail: { value: '' } });
      });
  }

  ionViewWillLeave() {
    this.userDidLeave = true;
    this.filteredTasks = [];
    this.destroyWhenLeave$.next();
  }

  ngOnDestroy() {
    this.destroyWhenLeave$.next();
    this.destroyWhenLeave$.complete();
  }

  identify(index: number, item: any) {
    return item.id;
  }

  handleSearch(ev: any) {
    this.searchText = ev.detail.value;
    this.isSearching = true;
    this.getFilteredTasks();
  }

  getFilteredTasks() {
    this.taskService
      .getTasksByText(this.idTeams, this.searchText, this.queryLimit)
      .pipe(takeUntil(this.destroyWhenLeave$))
      .subscribe((tasks) => {
        if (!tasks) {
          return;
        }

        console.log(tasks);
        if (tasks.length === this.filteredTasks?.length && !this.isSearching) {
          console.log('INFINITE SCROLL DISABLED');
          this.infiniteScroll.disabled = true;
        }

        this.isSearching = false;
        this.filteredTasks = tasks;
        this.filteredTasksCopy = tasks;
        this.infiniteScroll.complete();
      });
  }

  loadData() {
    this.queryLimit += 10;
    this.getFilteredTasks();
  }
}
