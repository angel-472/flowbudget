import { localCache } from "./localCache";

// TODO: use syncQueue isntead of databaseApi due to architecture changes

class GoalsApi {
  constructor(){
    this.goals = $state(localCache.loadGoals());
  }
  getAllGoals(){
    return this.goals;
  }
  #persist(){
    localCache.saveGoals($state.snapshot(this.goals));
  }
}