import { localCache } from "./localCache";

class GoalsApi {
  constructor(){
    this.goals = $state(localCache.loadGoals());
  }
  getAllGoals(){
    return this.goals;
  }
}