import { Component, OnInit, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonicModule } from '@ionic/angular';
import { Router, NavigationEnd } from '@angular/router';
import { NavController } from '@ionic/angular';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { AuthService } from 'src/app/services/auth.service';


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

  formSubmitted: boolean = false;
  errorMessage: string | null = null;

  constructor(
    private router: Router,
    private navCtrl: NavController,
    private http: HttpClient,
    private authService: AuthService
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
      this.applyForm.patchValue({ početak: formattedDate });
    } else if (type === 'end') {
      this.selectedDateEnd = selectedDate;
      this.formattedDate2 = formattedDate;
      this.applyForm.patchValue({ kraj: formattedDate });
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
          const username = this.authService.getUsername();
          const password = this.authService.getPassword();
          console.log(formData, username, password)
    
          if (!username || !password) {
            this.errorMessage = 'Failed to retrieve credentials.';
            console.error(this.errorMessage);
            return;
          }
    
          const payload = {
            ...formData,
            username: username,
            password: password,
          };
    
          const headers = { 'Content-Type': 'application/json' };
    
          this.http.post('https://bvproduct.virtualka.prolink.hr/api/hours.php', payload, { headers })
            .subscribe({
              next: response => {
                this.formSubmitted = true;
                this.errorMessage = null;
                console.log('Obrazac uspješno poslan', response);
              },
              error: error => {
                this.formSubmitted = true;
                this.errorMessage = 'Došlo je do pogreške prilikom slanja obrasca. Pokušajte ponovno kasnije.';
                console.error('Greška kod slanja obrasca', error);
              }
            });
        } else {
          this.formSubmitted = true;
          this.errorMessage = 'Molim vas da prije slanja ispravno ispunite sva polja.';
          console.warn('Obrasac nije ispravan');
        }
      }
      
}
