import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { IonHeader, IonToolbar, IonTitle, IonContent } from '@ionic/angular/standalone';
import { FormControl, FormGroup, ReactiveFormsModule } from '@angular/forms';
import * as CryptoJS from 'crypto-js';
import { HttpClient } from '@angular/common/http';
import { AuthService } from 'src/app/services/auth.service';

interface ServerResponse {
  response: string;
}

@Component({
  selector: 'app-home',
  templateUrl: 'home.page.html',
  styleUrls: ['home.page.scss'],
  standalone: true,
  imports: [CommonModule, IonHeader, IonToolbar, IonTitle, IonContent, ReactiveFormsModule],
})

export class HomePage {
  applyForm= new FormGroup ({
    korisnik: new FormControl(""),
    lozinka: new FormControl("")
  })

  errorMessage: string | null = null;

  constructor(
    private router: Router,
    private http: HttpClient,
    private authService: AuthService
  ) {
  }

  async prijava() {
    const korisnik = this.applyForm.value?.korisnik || '';
    const lozinka = this.applyForm.value?.lozinka || '';

    const hashedUsername = CryptoJS.SHA1(korisnik).toString();
    const hashedPassword = CryptoJS.SHA1(lozinka).toString();
  
  
    if (this.applyForm.valid && korisnik && lozinka) {
      this.http.post<ServerResponse[]>('https://bvproduct.app/api/login.php', {
        username: hashedUsername,
        password: hashedPassword
      }).subscribe({
        next: (response) => {
          const serverResponse = response[0];
          if (serverResponse && serverResponse.response === 'Success') {
            this.authService.login(korisnik, lozinka);
            this.router.navigate(['/hours']);
          } else {
            this.errorMessage = 'Prijava neuspijela. Molim Vas da provrijerite da li su podaci ispravni.';
          }
        },
        error: (error) => {
          this.errorMessage = 'Greška kod prijave. Molim Vas da pokušate ponovno kasnije.';
          console.error('Login failed', error);
        }
      });
    } else {
      this.errorMessage = 'Molim Vas da ispunite oba polja';
    }
  }   
    
}
     
