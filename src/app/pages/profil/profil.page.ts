import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonContent, IonHeader, IonTitle, IonToolbar } from '@ionic/angular/standalone';
import { Router, NavigationEnd } from '@angular/router';
import { NavController } from '@ionic/angular';
import { FormControl, FormGroup, ReactiveFormsModule, Validators  } from '@angular/forms';
import { HttpClient } from '@angular/common/http';


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

  constructor(
    private router: Router,
    private navCtrl: NavController,
    private http: HttpClient
  ) {}

  ngOnInit() {
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

  unosProfila() {
    if (this.applyForm.valid) {
      const formData = this.applyForm.value;
      this.http.post('url', formData).subscribe(response => {
        console.log('Form successfully submitted', response);
      }, error => {
        console.error('Error submitting form', error);
      });
    } else {
      console.warn('Form is not valid');
    }
  }

}
