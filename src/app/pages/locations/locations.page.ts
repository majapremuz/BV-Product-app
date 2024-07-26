import { Component, OnInit, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonicModule } from '@ionic/angular';
import { Router, NavigationEnd } from '@angular/router';
import { NavController } from '@ionic/angular';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { HttpClient } from '@angular/common/http';

@Component({
  selector: 'app-locations',
  templateUrl: './locations.page.html',
  styleUrls: ['./locations.page.scss'],
  standalone: true,
  imports: [IonicModule, CommonModule, FormsModule, ReactiveFormsModule]
})
export class LocationsPage implements OnInit {
  selectedDateStart: string = '';
  selectedDateEnd: string = '';
  formattedDate1: string = '';
  formattedDate2: string = '';
  applyForm= new FormGroup ({
    početak: new FormControl("", Validators.required),
    kraj: new FormControl("", Validators.required)
  })

  constructor(
    private router: Router,
    private navCtrl: NavController,
    private http: HttpClient
  ) {}

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

  onDateChange(event: any, type: string) {
    const selectedDate = event.detail.value;
    const date = new Date(selectedDate);
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = date.getFullYear();
    const formattedDate = `${year}-${month}-${day}`;

    if (type === 'start') {
      this.selectedDateStart = selectedDate;
      this.formattedDate1 = formattedDate;
    } else if (type === 'end') {
      this.selectedDateEnd = selectedDate;
      this.formattedDate2 = formattedDate;
    }
  }

  openPopover(event: Event, popoverId: string) {
    const popover = document.querySelector(`ion-popover[trigger="${popoverId}"]`);
    if (popover) {
      (popover as any).present({
        ev: event
      });
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
