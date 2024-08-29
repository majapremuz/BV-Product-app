import { Component, OnInit, ChangeDetectionStrategy, ChangeDetectorRef, ViewChild, ElementRef, OnDestroy} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { IonicModule } from '@ionic/angular';
import { Router, NavigationEnd } from '@angular/router';
import { filter, tap } from 'rxjs/operators';
import { NavController } from '@ionic/angular';
import { HttpClient} from '@angular/common/http';
import { AuthService } from 'src/app/services/auth.service';
import * as moment from 'moment';
import { Observable } from 'rxjs';
import { AlertController } from '@ionic/angular';


interface Location {
  id: string;
  title: string;
}

interface Types {
  value: string;
  title: string;
}

interface Hours {
  hourId: number,
  hours: number
}

@Component({
  selector: 'app-hours',
  templateUrl: './hours.page.html',
  styleUrls: ['./hours.page.scss'],
  standalone: true,
  imports: [IonicModule, CommonModule, FormsModule, ReactiveFormsModule],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class HoursPage implements OnInit {
  @ViewChild('unos') unos!: ElementRef;
  currentPage: string = 'hours';
  currentWeek: string[] = [];
  selectedDate: string | null = null;
  hoursByDate: { [key: string]: { hours: Hours[], sum: number } } = {};
  applyForm= new FormGroup ({
    datum: new FormControl("", Validators.required),
    vrsta: new FormControl("", Validators.required),
    lokacija: new FormControl("", Validators.required),
    sati: new FormControl("", Validators.required)
  })

  formSubmitted: boolean = false;
  errorMessage: string | null = null;
  locations: Location[] = [];
  types: Types[] = [];
  hours: Hours[] = [];


  constructor(
    private router: Router,
    private navCtrl: NavController,
    private http: HttpClient,
    private authService: AuthService,
    private cdr: ChangeDetectorRef,
    private alertController: AlertController
  ) {
    this.router.events.pipe(
      filter((event): event is NavigationEnd => event instanceof NavigationEnd)
    ).subscribe((event: NavigationEnd) => {
      if (event.url.includes('hours')) {
        this.currentPage = 'hours';
      } else if (event.url.includes('profil')) {
        this.currentPage = 'profil';
      } else if (event.url.includes('home')) {
        this.currentPage = 'odjava';
      }
  
      this.cdr.detectChanges();
    });
  }

  ngOnInit() {
    if (this.authService.isAuthenticated()) {
      this.loadLocations();
      this.loadTypes();
      this.loadHours();
    } else {
      this.router.navigate(['/home']);
    }
    this.setCurrentWeek();
    this.loadSelectedDate();
    this.loadHoursByDate();
  }
  
  selectDate(datum: string) {
    const formattedDate = moment(datum, 'DD.MM.YYYY').format('YYYY-MM-DD');
    this.selectedDate = formattedDate;
    this.applyForm.patchValue({ datum: formattedDate });
    this.saveSelectedDate(formattedDate);
    this.cdr.markForCheck();
    this.scrollToForm();
  }

  isSelectedDate(day: string): boolean {
    const formattedDay = moment(day, 'DD.MM.YYYY').format('YYYY-MM-DD');
    return this.selectedDate === formattedDay;
  }

  private scrollToForm() {
    if (this.unos) {
      this.unos.nativeElement.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }

  addHours() {
    const selectedDate = this.selectedDate;
    const selectedHours = parseFloat(this.applyForm.get('sati')?.value || '0');
  
    if (selectedDate && selectedHours) {
        const formattedDate = moment(selectedDate, 'YYYY-MM-DD').format('DD.MM.YYYY');
        
        if (!this.hoursByDate[formattedDate]) {
            this.hoursByDate[formattedDate] = { hours: [], sum: 0 };
        }

        // Use the hourId from the form if applicable, or set it to -1 if adding a new entry
        const hourId = -1; // This would typically be replaced by the ID returned from the server after adding a new hour
  
        this.hoursByDate[formattedDate].hours.push({ hourId, hours: selectedHours });
        this.hoursByDate[formattedDate].sum += selectedHours;
        console.log("this.hoursByDate: ", this.hoursByDate)

        this.applyForm.get('sati')?.reset();
        this.cdr.markForCheck();
        this.saveHoursByDate();
    }
}

async deleteHour(day: string, hourId: number) {
  const formattedDate = moment(day, 'DD.MM.YYYY').format('YYYY-MM-DD');
  const hoursForDay = this.hoursByDate[formattedDate]?.hours || [];
  
  const hourIndex = hoursForDay.findIndex(hour => hour.hourId === hourId);
  if (hourIndex === -1) {
      console.error('Hour to delete not found:', hourId);
      return;
  }

  const hourToDelete = hoursForDay[hourIndex];

  const alert = await this.alertController.create({
      header: 'Potvrda brisanja',
      message: `Jeste li sigurni da želite obrisati ${hourToDelete.hours} radnih sati na ${formattedDate}?`,
      cssClass: 'my-custom-alert',
      buttons: [
          {
              text: 'Odustani',
              role: 'cancel',
          },
          {
              text: 'Obriši',
              handler: () => {
                  // Remove hour locally
                  this.hoursByDate[formattedDate].hours.splice(hourIndex, 1);
                  this.hoursByDate[formattedDate].sum -= hourToDelete.hours;

                  // Clean up empty date entries
                  if (this.hoursByDate[formattedDate].hours.length === 0) {
                      delete this.hoursByDate[formattedDate];
                  }

                  // Call the server to delete the hour using its ID
                  this.removeHourFromServer(hourId.toString())
                      .subscribe({
                          next: (response) => {
                              console.log('Successfully deleted hour from server', response);
                              this.saveHoursByDate();
                              this.cdr.detectChanges();
                          },
                          error: (error: any) => {
                              console.error('Error deleting hour from server', error);
                              // Restore the state in case of error
                              this.hoursByDate[formattedDate].hours.splice(hourIndex, 0, hourToDelete);
                              this.hoursByDate[formattedDate].sum += hourToDelete.hours;
                              this.cdr.detectChanges();
                              this.errorMessage = 'Failed to delete hour. Please try again.';
                          }
                      });
              }
          }
      ],
  });

  await alert.present();
}


private removeHourFromServer(hourId: string): Observable<void> {
  const credentials = this.authService.getHashedCredentials();
  if (!credentials) {
    this.errorMessage = 'Failed to retrieve credentials.';
    return new Observable<void>();
  }

  const authPayload = {
    username: credentials.hashedUsername,
    password: credentials.hashedPassword,
    id: hourId
  };

  console.log("authPayload: ", authPayload);

  const url = `https://bvproduct.app/api/hours-delete.php`;

  return this.http.request<void>('DELETE', url, {
    body: authPayload,
    headers: { 'Content-Type': 'application/json' },
    observe: 'body'
  }).pipe(
    tap(response => console.log('Response from server:', response))
  );
}

  
  setCurrentWeek(weekOffset = 0) {
    const startOfWeek = moment().startOf('isoWeek').add(weekOffset, 'weeks');
    this.currentWeek = Array.from({ length: 7 }).map((_, i) =>
      startOfWeek.clone().add(i, 'days').format('DD.MM.YYYY')
    );
  }

  previousWeek() {
    const currentStartDate = moment(this.currentWeek[0], 'DD.MM.YYYY');
    const previousWeekStartDate = currentStartDate.clone().subtract(1, 'weeks');
    this.setCurrentWeek(previousWeekStartDate.diff(moment().startOf('isoWeek'), 'weeks'));
  }

  nextWeek() {
    const currentStartDate = moment(this.currentWeek[0], 'DD.MM.YYYY');
    const nextWeekStartDate = currentStartDate.clone().add(1, 'weeks');
    this.setCurrentWeek(nextWeekStartDate.diff(moment().startOf('isoWeek'), 'weeks'));
  }

  private saveSelectedDate(date: string) {
    localStorage.setItem('selectedDate', date);
  }

  private saveHoursByDate() {
    localStorage.setItem('hoursByDate', JSON.stringify(this.hoursByDate));
}

  
  // Load hoursByDate from localStorage
  private loadHoursByDate() {
    const savedHours = localStorage.getItem('hoursByDate');
    if (savedHours) {
      this.hoursByDate = JSON.parse(savedHours);
      this.cdr.markForCheck();
    }
  }

  private loadSelectedDate() {
    const savedDate = localStorage.getItem('selectedDate');
    if (savedDate) {
      this.selectedDate = savedDate;
      this.applyForm.patchValue({ datum: savedDate });
    }
  }

  /*async loadHours() {
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
        this.http.post<{ id: number, date_of_work: string, hours: number }[]>('https://bvproduct.app/api/hours.php', authPayload)
            .subscribe({
                next: (response) => {
                    // Clear previous hours data
                    this.hoursByDate = {};
                    console.log("Loaded hours from server: ", response);

                    response.forEach(hour => {
                        const formattedDate = moment(hour, 'YYYY-MM-DD').format('DD.MM.YYYY');
                        console.log("Raw date_of_work: ", hour);

                        if (!this.hoursByDate[formattedDate]) {
                            this.hoursByDate[formattedDate] = { hours: [], sum: 0 };
                        }
                        
                        this.hoursByDate[formattedDate].hours.push({ hourId: hour.id, hours: hour.hours });
                        this.hoursByDate[formattedDate].sum += hour.hours;
                    });
                    
                    console.log("Loaded hoursByDate: ", this.hoursByDate);
                    this.cdr.markForCheck();
                },
                error: (error) => {
                    console.error('Error loading hours', error);
                    this.errorMessage = 'Failed to load hours. Please try again later.';
                }
            });
    } catch (error) {
        console.error('Unexpected error', error);
        this.errorMessage = 'An unexpected error occurred. Please try again later.';
    }
}*/

async loadHours() {
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

  console.log(authPayload)
  
  try {
    this.http.post<any>('https://bvproduct.app/api/hours.php', authPayload)
    .subscribe({
        next: (response) => {
            console.log("API Response:", response);

            // Further processing here
        },
        error: (error) => {
            console.error('Error loading hours', error);
            this.errorMessage = 'Failed to load hours. Please try again later.';
        }
    });
  } catch (error) {
    console.error('Unexpected error', error);
    this.errorMessage = 'An unexpected error occurred. Please try again later.';
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

  async loadTypes() {
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
      this.http.post<Types[]>('https://bvproduct.app/api/type.php', authPayload)
        .subscribe({
          next: (response) => {
            this.types = response;
            console.log(this.types);
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

  async unosForme() {
    this.formSubmitted = false; // Reset before submitting
  
    if (this.applyForm.valid) {
      const formData = this.applyForm.value;
      const credentials = this.authService.getHashedCredentials();
  
      if (!credentials) {
        this.errorMessage = 'Failed to retrieve credentials.';
        console.error(this.errorMessage);
        return;
      }
  
      const payload = {
        ...formData,
        username: credentials.hashedUsername,
        password: credentials.hashedPassword,
      };

      console.log("payload: ", payload)
  
      const headers = { 'Content-Type': 'application/json' };
  
      this.http.post('https://bvproduct.app/api/hours-add.php', payload, { headers })
        .subscribe({
          next: response => {
            this.formSubmitted = true; // Set to true after successful submission
            this.errorMessage = null;
            //this.addHours();  // Call addHours after successful submission
            console.log('Obrazac uspješno poslan', response);
            this.cdr.detectChanges();
          },
          error: error => {
            this.formSubmitted = true; // Set to true even in case of error to show the error message
            this.errorMessage = 'Došlo je do pogreške prilikom slanja obrasca. Pokušajte ponovno kasnije.';
            console.error('Greška kod slanja obrasca', error);
            this.cdr.detectChanges();
          }
        });
    } else {
      this.formSubmitted = true; // Set to true if form is invalid to show validation error
      this.errorMessage = 'Molim vas da prije slanja ispravno ispunite sva polja.';
      console.warn('Obrasac nije ispravan');
      this.cdr.detectChanges();
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

