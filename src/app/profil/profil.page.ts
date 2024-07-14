import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonContent, IonHeader, IonTitle, IonToolbar } from '@ionic/angular/standalone';
import { Router, NavigationEnd } from '@angular/router';
import { NavController } from '@ionic/angular';
import { FormControl, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';


@Component({
  selector: 'app-profil',
  templateUrl: './profil.page.html',
  styleUrls: ['./profil.page.scss'],
  standalone: true,
  imports: [IonContent, IonHeader, IonTitle, IonToolbar, CommonModule, FormsModule, ReactiveFormsModule]
})
export class ProfilPage implements OnInit {
  activeLink: string = '';
  applyForm= new FormGroup ({
    ime: new FormControl(""),
    prezime: new FormControl(""),
    mobitel: new FormControl(""),
    email: new FormControl(""),
    adresa: new FormControl("")
  })

  constructor(
    private router: Router,
    private navCtrl: NavController,
    private http: HttpClient
  ) {
    this.router.events.subscribe((event) => {
      if (event instanceof NavigationEnd) {
        this.setActiveLink(event.urlAfterRedirects);
      }
    });
  }

  ngOnInit() {
  }

  navForm() {
    this.activeLink = 'navForm';
    this.router.navigateByUrl('/form');
  }

  navProfil() {
    this.activeLink = 'navProfil';
    this.router.navigateByUrl('/profil');
  }

  navOdjava() {
    this.activeLink = 'navOdjava';
    this.router.navigateByUrl('/home');
  }

  private setActiveLink(url: string) {
    if (url.includes('/form')) {
      this.activeLink = 'navForm';
    } else if (url.includes('/profil')) {
      this.activeLink = 'navProfil';
    } else if (url.includes('/home')) {
      this.activeLink = 'navOdjava';
    } else {
      this.activeLink = '';
    }
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
