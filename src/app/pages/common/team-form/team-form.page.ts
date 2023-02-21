import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { TeamService } from '../../../services/team.service';
import { ToastController } from '@ionic/angular';

@Component({
  selector: 'app-team-form',
  templateUrl: './team-form.page.html',
  styleUrls: ['./team-form.page.scss']
})
export class TeamFormPage implements OnInit {
  teamForm!: FormGroup;
  headerTitle: string = 'Crear equipo nuevo';
  buttonText: string = 'Crear equipo';
  isLoading: boolean = false;
  teamId: string | null = null;

  constructor(
    private fb: FormBuilder,
    private activeRoute: ActivatedRoute,
    private teamService: TeamService,
    private toastController: ToastController
  ) {}

  get name() {
    return this.teamForm.get('name');
  }

  get allowNewMembers() {
    return this.teamForm.get('allowNewMembers');
  }

  ngOnInit() {
    this.teamForm = this.fb.group({
      name: ['', [Validators.required, Validators.minLength(3)]],
      allowNewMembers: [true, Validators.required]
    });

    this.teamId = this.activeRoute.snapshot.paramMap.get('id');

    if (this.teamId) {
      this.headerTitle = 'Editar equipo';
      this.buttonText = 'Guardar cambios';

      this.teamService.getTeam(this.teamId).subscribe((team) => {
        console.log('getTeam: ', team);
        const { name, allowNewMembers } = { ...team };

        this.teamForm.setValue({
          name,
          allowNewMembers
        });
      });
    }
  }

  async createTeam() {
    try {
      if (!this.teamForm.valid) return;

      console.log('createTeam: ', this.teamForm.value);
      const { name } = this.teamForm.value;

      this.isLoading = true;
      await this.teamService.createTeam(this.teamForm.value);
      this.isLoading = false;

      await this.showToast(`El equipo "${name}" se ha creado correctamente`);
    } catch (error) {
      console.error(error);
      this.showToast('Ha ocurrido un error al crear el equipo');
    }
  }

  async updateTeam() {
    try {
      if (!this.teamForm.valid) return;

      console.log('updateTeam: ', this.teamForm.value);
      const { name } = this.teamForm.value;

      this.isLoading = true;
      await this.teamService.updateTeamProperties(this.teamId!, this.teamForm.value);
      this.isLoading = false;

      await this.showToast(`Equipo ${name} actualizado correctamente`);
    } catch (error) {
      console.error(error);
      this.showToast('Ha ocurrido un error al actualizar el equipo');
    }
  }

  async showToast(message: string) {
    const toast = await this.toastController.create({
      message,
      duration: 2000,
      position: 'bottom'
    });

    await toast.present();
  }
}
