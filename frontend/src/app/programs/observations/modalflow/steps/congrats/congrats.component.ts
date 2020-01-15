import { Component, Input, ViewEncapsulation } from "@angular/core";
import { ModalFlowService } from "../../modalflow.service";
import { IFlowComponent } from "../../flow/flow";
import { AppConfig } from "../../../../../../conf/app.config";

@Component({
  templateUrl: "./congrats.component.html",
  styleUrls: ["./congrats.component.css"],
  encapsulation: ViewEncapsulation.None
})
export class CongratsComponent implements IFlowComponent {
  @Input() data: any;
  timeout: any;
  username: string;
  obs: any;
  AppConfig = AppConfig;

  constructor(private modalFlowService : ModalFlowService){
    

  }
  ngOnDestroy(): void {
    if (this.timeout) {
      clearTimeout(this.timeout);
    }
  }

  ngOnInit(): void {
    this.username = localStorage.getItem("username");
    this.obs = this.data.obs.properties;
   this.timeout = setTimeout(() => {
      this.data.next(this.data);
    }, 2000);
  }


  closeModal(){
    this.modalFlowService.closeModal()
  } 
}
