import { Injectable } from "@angular/core";

import { NgbModal, NgbModalRef } from "@ng-bootstrap/ng-bootstrap";

@Injectable({
  providedIn: "root"
})
export class ModalsTopbarService {
  modalRef: NgbModalRef;

  constructor(private modalService: NgbModal) {}

  open(content, option) {
    this.modalRef = this.modalService.open(content, option);
  }
  close() {
    if (this.modalRef) this.modalRef.close();
  }
}