import { Component, OnInit, ChangeDetectionStrategy, ChangeDetectorRef, ViewChild, ElementRef, OnDestroy} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { IonicModule } from '@ionic/angular';
import { Router, NavigationEnd } from '@angular/router';
import { filter, tap, map } from 'rxjs/operators';
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
  id: number;
  date_of_work: string;
  hours: number;
}

@Component({
  selector: 'app-hours',
  templateUrl: './hours.page.html',
  styleUrls: ['./hours.page.scss'],
  standalone: true,
  imports: [IonicModule, CommonModule, FormsModule, ReactiveFormsModule],
  changeDetection: ChangeDetectionStrategy.Default
})
export class HoursPage implements OnInit {
  @ViewChild('unos') unos!: ElementRef;
  currentPage: string = 'hours';
  currentWeek: string[] = [];
  currentWeekOffset: number = 0;
  currentWeekStart: string = '';
  currentWeekEnd: string = '';
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
      this.clearUserData();
      this.loadLocations();
      this.loadTypes();
      this.loadHours();
      this.setCurrentWeek();
      this.loadSelectedDate();
      this.loadHoursByDate();
    } else {
      this.router.navigate(['/home']);
    }
  }
  /*
  jozo: hoursByDate_b115ac9b5f498f09908b555f22262a0fd24090c2:"{"09.09.2024":{"hours":[{"id":-1,"hours":4,"date_of_work":"2024-09-09"},{"id":-1,"hours":4.5,"date_of_work":"2024-09-09"}],"sum":8.5}}"
  test: hoursByDate_b115ac9b5f498f09908b555f22262a0fd24090c2:"{"09.09.2024":{"hours":[{"id":-1,"hours":4,"date_of_work":"2024-09-09"},{"id":-1,"hours":4.5,"date_of_work":"2024-09-09"}],"sum":8.5}}"
  */
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

        const hourId = -1;
  
        this.hoursByDate[formattedDate].hours.push({ id: hourId, hours: selectedHours, date_of_work: selectedDate });
        this.hoursByDate[formattedDate].sum += selectedHours;

        this.applyForm.get('sati')?.reset();
        this.cdr.markForCheck();
        this.saveHoursByDate();
    }
    this.cdr.detectChanges();
}

async deleteHour(day: string, hourId: number) {
  const formattedDate = moment(day, 'DD.MM.YYYY').format('DD.MM.YYYY');
  const hoursForDay = this.hoursByDate[formattedDate]?.hours || [];
  
  const hourIndex = hoursForDay.findIndex(hour => hour.id === hourId);
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
              cssClass: 'alert-button-group',
          },
          {
              text: 'Obriši',
              cssClass: 'alert-button-group',
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

  const url = `https://bvproduct.app/api/hours-delete.php`;

  // Send a POST request with the payload in the body
  return this.http.post<{ response: string }>(url, authPayload, {
    headers: { 'Content-Type': 'application/json' }
  }).pipe(
    tap(response => {
      console.log('Response from server:', response);
      if (response.response === "Failure") {
        this.errorMessage = 'Server returned failure response.';
      }
    }),
    map(() => undefined)  // Convert the result to Observable<void>
  );
}

    setCurrentWeek(weekOffset = 0) {
      const startOfWeek = moment().startOf('isoWeek').add(weekOffset, 'weeks');
      const endOfWeek = moment(startOfWeek).endOf('isoWeek');

  
      // Format dates for your application
      this.currentWeekStart = startOfWeek.format('YYYY-MM-DD');
      this.currentWeekEnd = endOfWeek.format('YYYY-MM-DD');
      console.log("end off week: ", this.currentWeekEnd)

  
      // Update currentWeek array if needed
      this.currentWeek = Array.from({ length: 7 }).map((_, i) =>
        startOfWeek.clone().add(i, 'days').format('DD.MM.YYYY')
      );
  
      // Load hours for the new week
      this.loadHours();
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

  private getStorageKey(prefix: string): string {
    const credentials = this.authService.getHashedCredentials();
    if (!credentials) {
      throw new Error('No credentials found');
    }
    return `${prefix}_${credentials.hashedUsername}_${credentials.hashedPassword}`;
  }

  private saveSelectedDate(datum: string) {
    try {
      const key = this.getStorageKey('selectedDate');
      localStorage.setItem(key, JSON.stringify(datum));
      console.log("date key: ", key)
    } catch (e) {
      console.error('Failed to save selectedDate:', e);
    }
  }

  private loadSelectedDate() {
    try {
      const key = this.getStorageKey('selectedDate');
      const savedDate = localStorage.getItem(key);
      if (savedDate) {
        this.selectedDate = JSON.parse(savedDate);
        this.applyForm.patchValue({ datum: this.selectedDate });
      }
    } catch (e) {
      console.error('Failed to load selectedDate:', e);
    }
    this.cdr.markForCheck();
  }

  private saveHoursByDate() {
    try {
      const key = this.getStorageKey('hoursByDate');
      localStorage.setItem(key, JSON.stringify(this.hoursByDate));
    } catch (e) {
      console.error('Failed to save hoursByDate:', e);
    }
  }

  
  private loadHoursByDate() {
    try {
      const key = this.getStorageKey('hoursByDate');
      const savedHours = localStorage.getItem(key);
      if (savedHours) {
        this.hoursByDate = JSON.parse(savedHours);
      }
    } catch (e) {
      console.error('Failed to load hoursByDate:', e);
    }
  }

  
  private clearUserData() {
    const credentials = this.authService.getHashedCredentials();
    if (credentials) {
      const userId = credentials.hashedUsername;
      const userPassword = credentials.hashedPassword;
      localStorage.removeItem(`hoursByDate_${userId}_${userPassword}`);
      localStorage.removeItem(`selectedDate_${userId}_${userPassword}`);
    }
    this.hoursByDate = {};
    this.cdr.detectChanges(); 
}

  

  async loadHours() {
    const credentials = this.authService.getHashedCredentials();
    console.log('Retrieved credentials:', credentials);
    
    if (!credentials) {
      this.errorMessage = 'Failed to retrieve credentials.';
      this.router.navigate(['/home']);
      return;
    }
  
    const startOfWeek = this.currentWeekStart;
    const endOfWeek = this.currentWeekEnd;
  
    const authPayload = {
      username: credentials.hashedUsername,
      password: credentials.hashedPassword,
      start: startOfWeek,
      end: endOfWeek
    };

    console.log("authPayload: ", authPayload)
  
    try {
      this.http.post<any>('https://bvproduct.app/api/hours.php', authPayload)
        .subscribe({
          next: (response) => {
  
            // Process the response to update hoursByDate
            this.hoursByDate = {};
            response.forEach((hour: Hours) => {
              const formattedDate = moment(hour.date_of_work, 'YYYY-MM-DD').format('DD.MM.YYYY');
              
              if (!this.hoursByDate[formattedDate]) {
                this.hoursByDate[formattedDate] = { hours: [], sum: 0 };
              }
  
              this.hoursByDate[formattedDate].hours.push({ id: hour.id, hours: hour.hours, date_of_work: hour.date_of_work });
              this.hoursByDate[formattedDate].sum += hour.hours;
            });
  
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
            console.log('Fetched locations:', response);
            this.locations = response;
            this.cdr.detectChanges(); 
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
    this.formSubmitted = false;
  
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
  
      const headers = { 'Content-Type': 'application/json' };
  
      this.http.post('https://bvproduct.app/api/hours-add.php', payload, { headers })
        .subscribe({
          next: response => {
            this.formSubmitted = true;
            this.errorMessage = null;
  
            // Add hours locally
            this.addHours();
  
            console.log('Obrazac uspješno poslan', response);
  
            // Reset form after successful submission
            this.applyForm.reset();
            this.cdr.markForCheck();
          },
          error: error => {
            this.formSubmitted = true;
            this.errorMessage = 'Došlo je do pogreške prilikom slanja obrasca. Pokušajte ponovno kasnije.';
            console.error('Greška kod slanja obrasca', error);
  
            // Trigger change detection in case of error
            this.cdr.markForCheck();
          }
        });
  
    } else {
      this.formSubmitted = true;
      this.errorMessage = 'Molim vas da prije slanja ispravno ispunite sva polja.';
      console.warn('Obrasac nije ispravan');
  
      // Ensure change detection is triggered when form is invalid
      this.cdr.markForCheck();
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
    this.clearUserData();
    this.authService.logout();
    this.router.navigate(['/home']);
    }
  
}

