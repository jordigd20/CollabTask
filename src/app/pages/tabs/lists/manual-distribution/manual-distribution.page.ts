import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { Task, Team } from '../../../../interfaces';
import { TaskService } from '../../../../services/task.service';
import { TeamService } from '../../../../services/team.service';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-manual-distribution',
  templateUrl: './manual-distribution.page.html',
  styleUrls: ['./manual-distribution.page.scss']
})
export class ManualDistributionPage implements OnInit {
  idTeam: string | null = null;
  idTaskList: string | null = null;
  tasks: Task[] = [];
  tasksUnassigned: Task[] = [];
  team: Team | undefined;
  getTasks$: Subscription = new Subscription();

  constructor(
    private activeRoute: ActivatedRoute,
    private teamService: TeamService,
    private taskService: TaskService
  ) {}

  ngOnInit() {
    this.idTeam = this.activeRoute.snapshot.paramMap.get('idTeam');
    this.idTaskList = this.activeRoute.snapshot.paramMap.get('idTaskList');
    const tasksNotFound = this.taskService.tasks.length === 0;
    const teamsNotFound = this.teamService.teams.length === 0;

    if (tasksNotFound && teamsNotFound) {
      this.getTasksFirstTime();
      this.getTeamFirstTime();
      return;
    }

    if (tasksNotFound) {
      this.getTasksFirstTime();
      return;
    }

    if (teamsNotFound) {
      this.getTeamFirstTime();
      return;
    }

    console.log('get tasks from service');
    this.tasks = this.taskService.tasks;
    this.team = this.teamService.teams.find((team) => team.id === this.idTeam);
    this.tasksUnassigned = this.getUnassignedTasks();
  }

  getTasksFirstTime() {
    const result = this.taskService.getAllTasksByTaskList(this.idTaskList!);
    this.getTasks$ = result.subscribe((tasks) => {
      console.log('Tasks: ', tasks);
      this.tasks = tasks;
      this.tasksUnassigned = this.getUnassignedTasks();
    });
  }

  getTeamFirstTime() {
    this.teamService.getTeam(this.idTeam!).subscribe((team) => {
      console.log('Team: ', team);

      this.team = team;
    });
  }

  private getUnassignedTasks() {
    return this.tasks.filter(
      (task) => task.temporalUserAsigned.id === '' && !task.completed
    );
  }
}
