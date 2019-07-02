import { Injectable } from "@angular/core";
import { HttpErrorResponse } from "@angular/common/http";
import { ToastrService } from "ngx-toastr";

@Injectable()
export class ErrorHandler {
  constructor(
    private toastr: ToastrService,
  ) {}

  public handleError(error: Error | HttpErrorResponse) {
    // notification system, once elected, goes here
    let errorMessage = "";
    if (
      error instanceof HttpErrorResponse &&
      error.error instanceof ErrorEvent
    ) {
      if (!navigator.onLine) {
        // Handle offline error .. to test
        errorMessage = `OffLineError: No connectivity.`;
      } else if (error.status !== 0) {
        // client-side or network
        errorMessage = `${error.status} - ${error.error.message}`;
      } else {
        errorMessage = JSON.stringify(error);
      }
    } else {
      errorMessage = JSON.stringify(error);
    }
    let msg = "Une erreur est survenue lors de la récupération des données sur le serveur.";
    this.toastr.error(msg, "", { positionClass: "toast-top-right" });
  }
}
