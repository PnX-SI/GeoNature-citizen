import { Injectable } from "@angular/core";

/*
import { FlowItem } from './flow-item'
import { SomeComponent1 } from '../some/components/comp.component';


const Context = {
  name: 'Meh',
  date: new Date().toLocaleDateString(),
}
*/

@Injectable()
export class FlowService {
  getFlowItems(_initialState: any) {
    throw "not implemented";
    // return [
    //   new FlowItem(SomeComponent1, Context),
    //   new FlowItem(SomeComponent2, Context),
    //   new FlowItem(SomeComponent3, Context),
    //   new FlowItem(SomeComponent4, {...Context, next: 'modal.close()'}),
    //   new FlowItem(RewardComponent, Context),
    // ]
  }

  /*
  fsm
  */
}
