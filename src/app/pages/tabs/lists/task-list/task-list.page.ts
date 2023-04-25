import { Component, OnInit, ViewChild } from '@angular/core';
import { ActionSheetController, IonInfiniteScroll, ModalController } from '@ionic/angular';
import { Router, ActivatedRoute } from '@angular/router';
import { TaskService } from '../../../../services/task.service';
import { Task } from '../../../../interfaces';
import { BehaviorSubject, Subject, switchMap, takeUntil } from 'rxjs';
import { StorageService } from '../../../../services/storage.service';
import { TeamService } from '../../../../services/team.service';
import { Team } from '../../../../interfaces/models/team.interface';
import { TradeFormComponent } from 'src/app/components/trade-form/trade-form.component';
import { presentConfirmationModal } from 'src/app/helpers/common-functions';
import { TaskListFiltersComponent } from 'src/app/components/task-list-filters/task-list-filters.component';

@Component({
  selector: 'app-task-list',
  templateUrl: './task-list.page.html',
  styleUrls: ['./task-list.page.scss']
})
export class TaskListPage implements OnInit {
  @ViewChild(IonInfiniteScroll) infiniteScroll: IonInfiniteScroll = {} as IonInfiniteScroll;

  idTeam: string | undefined;
  idTaskList: string | undefined;
  idUser: string = '';
  team: Team | undefined;
  tasks: Task[] = [];
  tasksCopy: Task[] = [];
  title: string = '...';
  isSearching: boolean = false;
  newSearch: boolean = false;
  userDidLeave: boolean = false;
  lastQueryLimit: number = 0;
  filters = new BehaviorSubject({
    searchText: '',
    tasksCompleted: 'all',
    idUserAssigned: 'all',
    queryLimit: 10
  });
  destroy$ = new Subject<void>();
  destroyWhenLeave$ = new Subject<void>();

  constructor(
    private actionSheetController: ActionSheetController,
    private activeRoute: ActivatedRoute,
    private router: Router,
    private storageService: StorageService,
    private teamService: TeamService,
    private taskService: TaskService,
    private modalController: ModalController
  ) {}

  async ngOnInit() {
    this.idTeam = this.activeRoute.snapshot.params['idTeam'];
    this.idTaskList = this.activeRoute.snapshot.params['idTaskList'];
    this.idUser = await this.storageService.get('idUser');

    if (!this.idTeam || !this.idTaskList || !this.idUser) {
      return;
    }

    this.teamService
      .getTeamObservable(this.idTeam)
      .pipe(takeUntil(this.destroy$))
      .subscribe((team) => {
        if (!team || !team.taskLists[this.idTaskList!] || !team.userMembers[this.idUser]) {
          this.router.navigate(['tabs/lists']);
          return;
        }

        this.team = team;
        this.title = team.taskLists[this.idTaskList!].name;
      });

    this.getFilteredTasks();
  }

  ionViewWillEnter() {
    if (this.userDidLeave) {
      this.userDidLeave = false;
      this.getFilteredTasks();
    }
  }

  ionViewWillLeave() {
    this.userDidLeave = true;
    this.tasksCopy = [];
    this.destroyWhenLeave$.next();
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
    this.destroyWhenLeave$.next();
    this.destroyWhenLeave$.complete();
  }

  identify(index: number, item: Task) {
    return index;
  }

  getFilteredTasks() {
    this.filters
      .pipe(
        switchMap((filters) => {
          const { searchText, tasksCompleted, idUserAssigned, queryLimit } = filters;

          return this.taskService.getAssignedTasks({
            idTaskList: this.idTaskList!,
            text: searchText,
            limit: queryLimit,
            filters: {
              idUserAssigned,
              tasksCompleted
            }
          });
        }),
        takeUntil(this.destroyWhenLeave$)
      )
      .subscribe((tasks) => {
        if (!tasks) {
          this.router.navigate(['tabs/lists']);
          return;
        }

        const { queryLimit } = this.filters.getValue();
        console.log({ queryLimit, lastQueryLimit: this.lastQueryLimit });
        if (queryLimit === this.lastQueryLimit && !this.newSearch) {
          console.warn('QUERY LIMIT');
          this.tasks = tasks;
          return;
        }

        if (tasks.length === this.tasksCopy.length && !this.isSearching && !this.newSearch) {
          console.log('INFINITE SCROLL DISABLED');
          this.infiniteScroll.disabled = true;
        }

        console.log(tasks);
        this.lastQueryLimit = queryLimit;
        this.tasks = tasks;
        this.tasksCopy = tasks;
        this.isSearching = false;
        this.newSearch = false;
        this.infiniteScroll.complete();
      });
  }

  loadData() {
    const filtersValue = this.filters.getValue();
    this.filters.next({ ...filtersValue, queryLimit: filtersValue.queryLimit + 10 });
  }

  async handlePreferences() {
    const { idUserAssigned, tasksCompleted } = this.filters.getValue();
    console.log(this.filters.getValue());
    const modal = await this.modalController.create({
      component: TaskListFiltersComponent,
      componentProps: {
        taskListFilters: {
          idUserAssigned,
          tasksCompleted
        },
        team: this.team
      },
      initialBreakpoint: 1,
      breakpoints: [0, 1],
      cssClass: 'auto-sheet-modal'
    });

    await modal.present();

    const { data } = await modal.onWillDismiss();

    if (data) {
      console.log(data.taskListFilters);
      const { idUserAssigned, tasksCompleted } = data.taskListFilters;
      this.infiniteScroll.disabled = false;
      this.newSearch = true;
      this.filters.next({
        ...this.filters.getValue(),
        idUserAssigned,
        tasksCompleted,
        queryLimit: 10
      });
    }
  }

  handleMoreOptions() {
    this.presentTaskListActionSheet(this.idTeam!, this.idTaskList!);
  }

  handleSearch(event: any) {
    this.isSearching = true;
    this.infiniteScroll.disabled = false;
    this.newSearch = true;
    this.filters.next({
      ...this.filters.getValue(),
      searchText: event.detail.value,
      queryLimit: 10
    });
  }

  async presentTaskListActionSheet(idTeam: string, idTaskList: string) {
    const actionSheet = await this.actionSheetController.create({
      htmlAttributes: {
        'aria-label': 'Acciones de la lista de tareas'
      },
      buttons: [
        {
          text: 'Valoraciones de la lista',
          icon: 'star-outline',
          cssClass: 'action-sheet-tasklist-icon',
          handler: () => {
            this.router.navigate([`/tabs/lists/ratings/${idTeam}/${idTaskList}`]);
          }
        },
        {
          text: 'Crear un intercambio de tareas',
          icon: 'swap-horizontal-outline',
          cssClass: 'action-sheet-custom-icon',
          handler: async () => {
            const modal = await this.modalController.create({
              component: TradeFormComponent,
              componentProps: {
                idTeam,
                idTaskList
              },
              initialBreakpoint: 1,
              breakpoints: [0, 1],
              cssClass: 'auto-sheet-modal'
            });

            modal.present();
          }
        },
        {
          text: 'Editar lista de tareas',
          icon: 'create-outline',
          cssClass: 'action-sheet-tasklist-icon',
          handler: () => {
            this.router.navigate([`/tabs/lists/edit-task-list/${idTeam}/${idTaskList}`]);
          }
        },
        {
          text: 'Eliminar lista de tareas',
          icon: 'trash-outline',
          cssClass: 'action-sheet-danger-icon',
          handler: async () => {
            await presentConfirmationModal({
              title: 'Eliminar lista de tareas',
              message:
                '¿Estás seguro de que quieres eliminar esta lista de tareas? Perderás las tareas y los puntos acumulados.',
              confirmText: 'Eliminar',
              dangerType: true,
              confirmHandler: () => this.deleteTaskList(idTeam, idTaskList),
              modalController: this.modalController
            });
          }
        }
      ]
    });

    actionSheet.present();
  }

  async deleteTaskList(idTeam: string, idTaskList: string) {
    await this.teamService.deleteTaskList(idTeam, idTaskList, this.idUser);
  }
}
