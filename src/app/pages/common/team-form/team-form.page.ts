import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';

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

  constructor(private fb: FormBuilder, private activeRoute: ActivatedRoute) {}

  get name() {
    return this.teamForm.get('name');
  }

  get allowNewMembers() {
    return this.teamForm.get('allowNewMembers');
  }

  ngOnInit() {
    if (this.activeRoute.snapshot.paramMap.get('id')) {
      this.headerTitle = 'Editar equipo';
      this.buttonText = 'Guardar cambios';
    }

    this.teamForm = this.fb.group({
      name: ['', Validators.required],
      allowNewMembers: [true, Validators.required]
    });
  }

  createTeam() {
    console.log(this.teamForm.value);
  }
}
