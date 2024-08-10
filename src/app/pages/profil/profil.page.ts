import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonContent, IonHeader, IonTitle, IonToolbar } from '@ionic/angular/standalone';
import { Router } from '@angular/router';
import { NavController } from '@ionic/angular';
import { FormControl, FormGroup, ReactiveFormsModule, Validators  } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { AuthService } from 'src/app/services/auth.service';

interface UserProfile {
  response: string;
  name: string;
  surname: string;
  phone: string;
  email: string;
  address: string;
  clothes_size: string;
  footwear_size: string;
}


@Component({
  selector: 'app-profil',
  templateUrl: './profil.page.html',
  styleUrls: ['./profil.page.scss'],
  standalone: true,
  imports: [IonContent, IonHeader, IonTitle, IonToolbar, CommonModule, FormsModule, ReactiveFormsModule]
})
export class ProfilPage implements OnInit {
  applyForm= new FormGroup ({
    ime: new FormControl("", Validators.required),
    prezime: new FormControl("", Validators.required),
    mobitel: new FormControl("", Validators.required),
    email: new FormControl("", Validators.required),
    adresa: new FormControl("", Validators.required),
    odjeća: new FormControl("", Validators.required),
    obuća: new FormControl("", Validators.required)
  })

  errorMessage: string | null = null;

  constructor(
    private router: Router,
    private navCtrl: NavController,
    private http: HttpClient,
    private authService: AuthService
  ) {}

  ngOnInit() {
    if (this.authService.isAuthenticated()) {
      this.fetchUserData();
    } else {
      this.router.navigate(['/home']);
    }
  }

async fetchUserData() {
  const credentials = this.authService.getHashedCredentials();
  
  if (!credentials) {
    this.errorMessage = 'Failed to retrieve credentials.';
    this.router.navigate(['/home']);
    return;
  }

  const authPayload = {
    username: credentials.hashedUsername,
    password: credentials.hashedPassword
  };

  try {
    const data = await this.http.post<UserProfile[]>('http://bvproduct.virtualka.prolink.hr/api/profil.php', authPayload).toPromise();

    if (data && Array.isArray(data) && data.length > 0 && data[0].response === 'Success') {
      console.log(data)
      this.applyForm.patchValue({
        ime: data[0].name,
        prezime: data[0].surname,
        mobitel: data[0].phone,
        email: data[0].email,
        adresa: data[0].address,
        odjeća: data[0].clothes_size,
        obuća: data[0].footwear_size
      });
    } else {
      this.errorMessage = 'Failed to fetch user data. API returned an unexpected response.';
      console.error('Failed to fetch user data', data);
    }
  } catch (error) {
    this.errorMessage = 'An error occurred while fetching user data. Please try again later.';
    console.error('Error fetching user data', error);
  }
}


  unosProfila() {
    if (this.applyForm.valid) {
      const formData = this.applyForm.value;
      this.http.post('https://bvproduct.virtualka.prolink.hr/api/update-profile.php', formData).subscribe(response => {
        console.log('Form successfully submitted', response);
      }, error => {
        console.error('Error submitting form', error);
      });
    } else {
      console.warn('Form is not valid');
    }
  }
  
  

  navHours() {
    this.router.navigateByUrl('/hours');
  }

  navLokacija() {
    this.router.navigateByUrl('/locations');
  }

  navProfil() {
    this.router.navigateByUrl('/profil');
  }

  navOdjava() {
    this.router.navigateByUrl('/home');
  }

}
