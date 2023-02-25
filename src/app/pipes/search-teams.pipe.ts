import { Pipe, PipeTransform } from '@angular/core';
import { Team } from '../interfaces';

@Pipe({
  name: 'searchTeams'
})
export class SearchTeamsPipe implements PipeTransform {
  transform(teamsList: Team[], searchText: string): Team[] {
    if (!teamsList) {
      return [];
    }

    if (!searchText) {
      return teamsList;
    }

    searchText = searchText.toLocaleLowerCase();

    return teamsList.filter((team) => {
      const teamResult = team.name.toLowerCase().includes(searchText);

      if (!teamResult) {
        for (const taskList of Object.values(team.taskLists)) {
          const taskListResult = taskList.name.toLowerCase().includes(searchText);

          if (taskListResult) {
            return true;
          }
        }
      }

      return teamResult;
    });
  }
}
