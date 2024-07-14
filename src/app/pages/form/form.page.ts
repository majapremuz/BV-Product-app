import { Component, OnInit, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonicModule } from '@ionic/angular';
import { Router, NavigationEnd } from '@angular/router';
import { NavController } from '@ionic/angular';
import { FormControl, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';

@Component({
  selector: 'app-form',
  templateUrl: './form.page.html',
  styleUrls: ['./form.page.scss'],
  standalone: true,
  imports: [IonicModule, CommonModule, FormsModule, ReactiveFormsModule],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class FormPage implements OnInit {
  selectedDate: string = '';
  formattedDate: string = '';
  activeLink: string = '';
  applyForm= new FormGroup ({
    lokacija: new FormControl(""),
    datum: new FormControl(""),
    početakSat: new FormControl(""),
    početakMinute: new FormControl(""),
    krajSat: new FormControl(""),
    krajMinute: new FormControl(""),
    komentar: new FormControl("")
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

  highlightedDates = [
    {
      date: '2023-01-05',
      textColor: '#800080',
      backgroundColor: '#ffc0cb',
    },
    {
      date: '2023-01-10',
      textColor: '#09721b',
      backgroundColor: '#c8e5d0',
    },
    {
      date: '2023-01-20',
      textColor: 'var(--ion-color-secondary-contrast)',
      backgroundColor: 'var(--ion-color-secondary)',
    },
    {
      date: '2023-01-23',
      textColor: 'rgb(68, 10, 184)',
      backgroundColor: 'rgb(211, 200, 229)',
    },
  ];

  onDateChange(event: any) {
    this.selectedDate = event.detail.value;
    const date = new Date(this.selectedDate);
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = date.getFullYear();
    this.formattedDate = `${day}-${month}-${year}`;
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

  unosForme() {
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
