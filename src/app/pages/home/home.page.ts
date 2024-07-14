import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { IonHeader, IonToolbar, IonTitle, IonContent } from '@ionic/angular/standalone';
import { FormControl, FormGroup, ReactiveFormsModule } from '@angular/forms';

@Component({
  selector: 'app-home',
  templateUrl: 'home.page.html',
  styleUrls: ['home.page.scss'],
  standalone: true,
  imports: [IonHeader, IonToolbar, IonTitle, IonContent, ReactiveFormsModule],
})
export class HomePage {
  applyForm= new FormGroup ({
    korisnik: new FormControl(""),
    lozinka: new FormControl("")
  })
  constructor(private router: Router) {
  }

  prijava() {
    const korisnik = this.applyForm.value.korisnik ?? "";
    const lozinka = this.applyForm.value.lozinka ?? "";

    if (korisnik && lozinka) {
      this.router.navigate(['/form']);
    } else {
      console.log('Please enter both username and password');
    }
  }
}

