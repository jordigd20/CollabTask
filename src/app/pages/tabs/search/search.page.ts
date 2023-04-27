import { Component, OnInit, ViewChild } from '@angular/core';
import { StorageService } from '../../../services/storage.service';
import { AuthService } from 'src/app/services/auth.service';
import { TaskService } from 'src/app/services/task.service';
import { TeamService } from 'src/app/services/team.service';
import { BehaviorSubject, Subject, filter, switchMap, takeUntil } from 'rxjs';
import { Task } from '../../../interfaces';
import { IonInfiniteScroll, ModalController } from '@ionic/angular';
import { SearchFiltersComponent } from 'src/app/components/search-filters/search-filters.component';

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
  isSearching: boolean = false;
  userDidLeave: boolean = false;
  lastQueryLimit: number = 0;
  filters = new BehaviorSubject({
    idTeams: [] as string[],
    searchText: '',
    queryLimit: 10,
    team: 'all',
    idUserAssigned: 'all',
    tasksCompleted: 'all'
  });
  newSearch: boolean = false;
  destroyWhenLeave$ = new Subject<void>();

  constructor(
    private storageService: StorageService,
    private authService: AuthService,
    private teamService: TeamService,
    private taskService: TaskService,
    private modalController: ModalController
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

    this.teamService
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

        this.filters.next({ ...this.filters.getValue(), idTeams: this.idTeams });

        if (!this.filteredTasks) {
          this.getFilteredTasks();
        }
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
    this.filters.complete();
  }

  identify(index: number, item: any) {
    return item.id;
  }

  handleSearch(ev: any) {
    this.isSearching = true;
    this.infiniteScroll.disabled = false;
    this.newSearch = true;
    this.filters.next({
      ...this.filters.getValue(),
      searchText: ev.detail.value,
      queryLimit: 10
    });
  }

  getFilteredTasks() {
    this.filters
      .pipe(
        switchMap((filters) => {
          const { idTeams, searchText, queryLimit, team, idUserAssigned, tasksCompleted } = filters;
          return this.taskService.getTasksByText({
            idTeams,
            text: searchText.trim().toLowerCase(),
            limit: queryLimit,
            filters: {
              team,
              idUserAssigned,
              tasksCompleted
            }
          });
        }),
        takeUntil(this.destroyWhenLeave$)
      )
      .subscribe((tasks) => {
        if (!tasks) {
          return;
        }

        const { queryLimit } = this.filters.getValue();
        console.log({ queryLimit, lastQueryLimit: this.lastQueryLimit });
        console.log(tasks);

        if (queryLimit === this.lastQueryLimit && !this.newSearch) {
          console.warn('QUERY LIMIT');
          this.filteredTasksCopy = tasks;
          return;
        }

        if (tasks.length === this.filteredTasks?.length && !this.isSearching && !this.newSearch) {
          console.log('INFINITE SCROLL DISABLED');
          this.infiniteScroll.disabled = true;
        }

        this.lastQueryLimit = queryLimit;
        this.isSearching = false;
        this.newSearch = false;
        this.filteredTasks = tasks;
        this.filteredTasksCopy = tasks;
        this.infiniteScroll.complete();
      });
  }

  loadData() {
    const filtersValue = this.filters.getValue();
    this.filters.next({ ...filtersValue, queryLimit: filtersValue.queryLimit + 10 });
  }

  async handleFilters() {
    const { team, idUserAssigned, tasksCompleted } = this.filters.getValue();
    const modal = await this.modalController.create({
      component: SearchFiltersComponent,
      componentProps: {
        searchFilters: { team, idUserAssigned, tasksCompleted },
        idUser: this.idUser
      },
      initialBreakpoint: 1,
      breakpoints: [0, 1],
      cssClass: 'auto-sheet-modal'
    });

    await modal.present();

    const { data } = await modal.onWillDismiss();

    if (data) {
      const { team, idUserAssigned, tasksCompleted } = data.searchForm;
      this.infiniteScroll.disabled = false;
      this.newSearch = true;
      this.filters.next({
        ...this.filters.getValue(),
        team,
        idUserAssigned,
        tasksCompleted,
        queryLimit: 10
      });
    }
  }
}
