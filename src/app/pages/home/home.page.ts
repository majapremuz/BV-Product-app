import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { IonHeader, IonToolbar, IonTitle, IonContent } from '@ionic/angular/standalone';
import { FormControl, FormGroup, ReactiveFormsModule } from '@angular/forms';
import * as CryptoJS from 'crypto-js';
import { HttpClient } from '@angular/common/http';

interface ServerResponse {
  response: string;
}

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

  errorMessage: string | null = null;

  constructor(
    private router: Router,
    private http: HttpClient
  ) {
  }


  prijava() {
    const korisnik = this.applyForm.value.korisnik;
    const lozinka = this.applyForm.value.lozinka;
  
    if (korisnik && lozinka) {
      const hashedUsername = CryptoJS.SHA1(korisnik).toString();
      const hashedPassword = CryptoJS.SHA1(lozinka).toString();
  
      this.http.post<ServerResponse>('/api/login.php', {
          username: hashedUsername,
          password: hashedPassword
      })
      .subscribe(
        (response) => {
          if (response && response.response === 'Success') {
            this.router.navigate(['/hours']);
          } else {
            this.errorMessage = 'Login failed. Please check your credentials.';
          }
        },
        (error) => {
          this.errorMessage = 'An error occurred. Please try again later.';
          console.error('Login failed', error);
        }
      )
    }
  }
  
      
    
}
