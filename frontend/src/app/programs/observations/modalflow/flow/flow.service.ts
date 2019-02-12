import { Injectable } from '@angular/core'

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

  getFlowItems() {
    throw 'not implemented'
    // return [
    //   new FlowItem(SomeComponent1, Context),
    //   new FlowItem(SomeComponent2, Context),
    //   new FlowItem(SomeComponent3, Context),
    //   new FlowItem(SomeComponent4, {...Context, next: 'modal.close()'}),
    //   new FlowItem(RewardComponent, Context),
    // ]
  }

/*
map = [
    { 'input': 0, 'current_state': 0, 'transition_state': 1 },
    { 'input': 0, 'current_state': 1, 'transition_state': 0 },
]

lookup(input, state) {
  transition_state = None
  for item in map {
    if (item.current_state == state and item.input == input) {
      transition_state = item.transition_state
    }
  }
    return transition_state
}
*/
}
