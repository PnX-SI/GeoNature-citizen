import { Component, OnInit } from "@angular/core";
import { AuthService } from "../auth.service";
import { ActivatedRoute, Router } from "@angular/router";

@Component({
  selector: "app-confirm-email",
  templateUrl: "./confirm-email.component.html",
  styleUrls: ["./confirm-email.component.scss"]
})
export class ConfirmEmailComponent implements OnInit {
  confirmResponse: any;
  isConfirmed = false;
  confirmedMessage: string;
  constructor(
    private activeRoute: ActivatedRoute,
    private router: Router,
    private authService: AuthService
  ) {}

  ngOnInit() {
    const token = this.activeRoute.snapshot.params.token;
    this.authService.confirmEmail(token).subscribe(
      confirmResponse => {
        this.isConfirmed = true;
        this.confirmResponse = confirmResponse;
        if (this.confirmResponse.status === 200) {
          this.confirmedMessage = "Vous avez activé votre compte. Merci!";
        }
        if (this.confirmResponse.status === 208) {
          this.confirmedMessage =
            "Votre compte a été déjà activé. Veuillez vous connecter.";
        }
        setTimeout(() => {
          this.router.navigate(['home'])
        }, 3000);
      },
      error => {
        this.isConfirmed = false;
        if ((error.status = 404)) {
          this.confirmedMessage = "Le lien de confirmation n'est pas valide.";
          this.confirmResponse = error.error;
          console.log("confirm error", error);
          setTimeout(() => {
            this.router.navigate(["home"]);
          }, 3000);
        }
      }
    );
  }
}
