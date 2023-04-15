import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { Subject, combineLatest, from, map, of, switchMap, takeUntil } from 'rxjs';
import { TeamService } from 'src/app/services/team.service';
import { UserService } from 'src/app/services/user.service';
import { Team, User } from '../../../../interfaces';
import { StorageService } from '../../../../services/storage.service';
import { ActionSheetController, ModalController } from '@ionic/angular';
import { presentConfirmationModal } from 'src/app/helpers/common-functions';

@Component({
  selector: 'app-team-members',
  templateUrl: './team-members.page.html',
  styleUrls: ['./team-members.page.scss']
})
export class TeamMembersPage implements OnInit {
  idTeam: string | undefined;
  idUser: string = '';
  pieData: number = 0;
  team: Team | undefined;
  users: User[] | undefined;
  destroy$ = new Subject<void>();

  constructor(
    private activeRoute: ActivatedRoute,
    private storageService: StorageService,
    private teamService: TeamService,
    private userService: UserService,
    private actionSheetController: ActionSheetController,
    private modalController: ModalController,
    private router: Router
  ) {}

  ngOnInit() {
    combineLatest([
      this.activeRoute.paramMap.pipe(
        switchMap((params) => {
          if (params.get('idTeam')) {
            this.idTeam = params.get('idTeam')!;
            return this.teamService.getTeamObservable(this.idTeam);
          }

          return of();
        })
      ),
      this.activeRoute.paramMap.pipe(
        switchMap((params) => {
          if (params.get('idTeam')) {
            this.idTeam = params.get('idTeam')!;
            return from(this.storageService.get('user'));
          }

          return of();
        }),
        switchMap((user) => {
          this.idUser = user.id;
          return this.userService.getUsersByTeam(this.idTeam!);
        })
      )
    ])
      .pipe(
        takeUntil(this.destroy$),
        map(([team, users]) => ({ team, users }))
      )
      .subscribe(({ team, users }) => {
        if (!team || !team.userMembers[this.idUser!] || !users) {
          this.router.navigate(['/tabs/lists']);
          return;
        }

        this.team = team;
        this.users = users;
      });
  }

  ngOnDestroy() {
    this.destroy$.next();
  }

  identify(index: number, item: User) {
    return item.id;
  }

  async moreOptions(idUserSelected: string) {
    const removeUser = {
      text: 'Expulsar usuario del equipo',
      icon: 'person-remove-outline',
      cssClass: 'action-sheet-danger-icon',
      handler: () => {
        presentConfirmationModal({
          title: 'Expulsar usuario del equipo',
          message:
            '¿Estás seguro de que quieres expulsar a este usuario del equipo? Esta acción no se puede deshacer.',
          confirmText: 'Expulsar',
          dangerType: true,
          confirmHandler: () =>
            this.teamService.removeUserFromTeam({
              idTeam: this.idTeam!,
              idUser: idUserSelected,
              executedByAdmin: true
            }),
          modalController: this.modalController
        });
      }
    };

    const changeUserRole = {
      text:
        this.team?.userMembers[idUserSelected].role === 'admin'
          ? 'Desasignar como administrador'
          : 'Convertir en administrador',
      icon: '../../../../../assets/icons/admin.svg',
      cssClass:
        this.team?.userMembers[idUserSelected].role === 'admin'
          ? 'action-sheet-danger-icon'
          : 'action-sheet-custom-icon',
      handler: () => {
        const role = this.team?.userMembers[idUserSelected].role === 'admin' ? 'member' : 'admin';
        console.log('role', role);

        this.teamService.changeUserRole(this.idTeam!, idUserSelected, role);
      }
    };

    const buttons = [removeUser];

    if (this.team?.userMembers[this.idUser].role === 'admin') {
      buttons.unshift(changeUserRole);
    }

    const actionSheet = await this.actionSheetController.create({
      htmlAttributes: {
        'aria-label': 'Acciones de los usuarios'
      },
      buttons
    });

    await actionSheet.present();
  }

  navigateToUserProfile(idUser: string) {
    this.router.navigate(['tabs/lists/profile', this.idTeam, idUser]);
  }
}
