import { Component, OnInit, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonicModule } from '@ionic/angular';
import { Router, NavigationEnd } from '@angular/router';
import { NavController } from '@ionic/angular';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { ChangeDetectorRef } from '@angular/core';
import { AuthService } from 'src/app/services/auth.service';

interface Location {
  id: string;
  title: string;
}


@Component({
  selector: 'app-locations',
  templateUrl: './locations.page.html',
  styleUrls: ['./locations.page.scss'],
  standalone: true,
  imports: [IonicModule, CommonModule, FormsModule, ReactiveFormsModule]
})
export class LocationsPage implements OnInit {
  currentPage: string = 'locations';
  selectedDateStart: string = '';
  selectedDateEnd: string = '';
  formattedDate1: string = '';
  formattedDate2: string = '';
  applyForm= new FormGroup ({
    startday: new FormControl("", Validators.required),
    endday: new FormControl("", Validators.required),
    location: new FormControl("", Validators.required)
  })

  locations: Location[] = [];
  formSubmitted: boolean = false;
  errorMessage: string | null = null;
  responseData: any = null;

  getKeys(obj: any): string[] {
    return Object.keys(obj);
  }

  isNumericKey(key: string): boolean {
    return !isNaN(Number(key));
  }

  constructor(
    private router: Router,
    private navCtrl: NavController,
    private http: HttpClient,
    private authService: AuthService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit() {
    if (this.authService.isAuthenticated()) {
      this.loadLocations();
    } else {
      this.router.navigate(['/home']);
    }
  }

  async loadLocations() {
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
      this.http.post<Location[]>('https://bvproduct.app/api/locations.php', authPayload)
        .subscribe({
          next: (response) => {
            this.locations = response;
            console.log(this.locations);
            this.cdr.markForCheck();
          },
          error: (error) => {
            console.error('Error loading locations', error);
            this.errorMessage = 'Failed to load locations. Please try again later.';
          }
        });
    } catch (error) {
      console.error('Unexpected error', error);
      this.errorMessage = 'An unexpected error occurred. Please try again later.';
    }
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

    if (type === 'startday') {
      this.selectedDateStart = selectedDate;
      this.formattedDate1 = formattedDate;
      this.applyForm.patchValue({ startday: formattedDate });
    } else if (type === 'endday') {
      this.selectedDateEnd = selectedDate;
      this.formattedDate2 = formattedDate;
      this.applyForm.patchValue({ endday: formattedDate });
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

  unosForme() {
    if (this.applyForm.valid) {
        const formData = this.applyForm.value;
        const credentials = this.authService.getHashedCredentials();

        if (!credentials) {
            this.errorMessage = 'Failed to retrieve credentials.';
            console.error(this.errorMessage);
            return;
        }

        const payload = {
            username: credentials.hashedUsername,
            password: credentials.hashedPassword,
            startday: formData.startday,
            endday: formData.endday,
            location: formData.location
        };

        console.log("payload: ", payload);

        const headers = { 'Content-Type': 'application/json' };

        this.http.post('https://bvproduct.app/api/locationsusers.php', payload, { headers })
            .subscribe({
                next: (response: any) => {
                    this.formSubmitted = true;
                    this.errorMessage = null;
                    this.responseData = response; // Assume response is an array of objects
                    console.log('Data successfully fetched', response);

                    // Add a log to see the structure of the response
                    console.log('Backend Response:', response);
                },
                error: error => {
                    this.formSubmitted = true;
                    this.errorMessage = 'There was an error fetching the data. Please try again later.';
                    console.error('Error fetching data', error);
                }
            });
    } else {
        this.formSubmitted = true;
        this.errorMessage = 'Please fill out all required fields before submitting.';
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
