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

    async prijava() {
      const korisnik = this.applyForm.value.korisnik;
      const lozinka = this.applyForm.value.lozinka;
    
      if (this.applyForm.valid && korisnik && lozinka) {
        this.http.post<ServerResponse>('https://bvproduct.virtualka.prolink.hr/api/login.php', {
          username: korisnik,
          password: lozinka
        }).subscribe({
          next: (response) => {
            console.log('Server response:', response);
            if (response.response === 'Success') {
              this.router.navigate(['/hours']);
              console.log('Login successful');
            } else {
              this.errorMessage = 'Login failed. Please check your credentials.';
              console.log('Login failed:', this.errorMessage);
            }
          },
          error: (error) => {
            this.errorMessage = 'An error occurred. Please try again later.';
            console.log('Login failed:', error);
          }
        });
      }
    }
     
}
