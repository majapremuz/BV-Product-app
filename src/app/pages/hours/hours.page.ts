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
  restrictionTriggered = false;
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

  async ngOnInit() {
    if (this.authService.isAuthenticated()) {
      this.clearUserData();
      this.loadLocations();
      this.loadTypes();
      this.setCurrentWeek();
      this.loadSelectedDate();
      this.loadHoursByDate();
  
      await this.loadHours();
  
      // Show the reminder at the start, even before form submission
      this.presentDailyReminder();
    } else {
      this.router.navigate(['/home']);
    }
  }
  
    
    selectDate(datum: string) {
      const formattedDate = moment(datum, 'DD.MM.YYYY').format('YYYY-MM-DD');
      if (this.canEditDate(formattedDate)) {
        this.selectedDate = formattedDate;
        this.applyForm.patchValue({ datum: formattedDate });
        this.saveSelectedDate(formattedDate);
        this.cdr.markForCheck();
        this.scrollToForm();
      } else {
        this.presentEditRestrictionAlert();
      }

      if (!this.canEditDate(datum)) {
        this.presentEditRestrictionAlert();
        return;
      }
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

  /*addHours() {
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
}*/

addHours() {
  const selectedDate = this.selectedDate;
  const selectedHours = parseFloat(this.applyForm.get('sati')?.value || '0');

  if (selectedDate && selectedHours) {
    const formattedDate = moment(selectedDate, 'YYYY-MM-DD').format('DD.MM.YYYY');

    // Check if the date is editable first (i.e., it's not from the previous month after the 5th)
    if (!this.canEditDate(selectedDate)) {
      this.presentEditRestrictionAlert();
      return; // Stop execution if the date is not editable
    }

    // Check if hours are already added for the date before proceeding
    if (this.hoursByDate[formattedDate]) {
      this.presentEditRestrictionAlert();
      return; // Stop execution if hours are already added for the selected date
    }

    // Proceed with adding hours if no restrictions apply
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




/*async deleteHour(day: string, hourId: number) {
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
}*/

async deleteHour(day: string, hourId: number) {
  const formattedDate = moment(day, 'DD.MM.YYYY').format('DD.MM.YYYY');
  const hoursForDay = this.hoursByDate[formattedDate]?.hours || [];
  
  const hourIndex = hoursForDay.findIndex(hour => hour.id === hourId);
  if (hourIndex === -1) {
    console.error('Hour to delete not found:', hourId);
    return;
  }

  const hourToDelete = hoursForDay[hourIndex];

  // Check if the date can be edited (i.e., it's not from the previous month after the 5th)
  if (!this.canEditDate(day)) {
    this.presentEditRestrictionAlert();
    return;
  }

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
    map(() => undefined) 
  );
}

canEditDate(date: string): boolean {
  const selectedDate = moment(date, 'DD-MM-YYYY');
  const today = moment();

  // Get the start of the current month and the 5th day of the current month
  const startOfCurrentMonth = today.clone().startOf('month');
  const fifthOfCurrentMonth = startOfCurrentMonth.clone().add(5, 'days');

  // Check if the selected date is from the previous month
  const isFromPreviousMonth = selectedDate.isBefore(startOfCurrentMonth, 'month');

  // Check if today is after the 5th of the current month
  const isAfterFifth = today.isAfter(fifthOfCurrentMonth);

  // Restrict editing for previous month after the 5th
  if (isFromPreviousMonth && isAfterFifth) {
    return false; // Prevent editing for previous month after the 5th
  }

  return true; // Allow editing for current or upcoming months
}



async presentEditRestrictionAlert() {
  const alert = await this.alertController.create({
      header: 'Upozorenje',
      message: 'Ne možete mijenjati radne sate za prethodni mjesec nakon 5. dana u mjesecu. Molim vas obratite se adminu.',
      buttons: [{
          text: 'OK',
          handler: () => {
              this.restrictionTriggered = true;
          }
      }]
  });
  await alert.present();
}

async presentDailyReminder() {
  const today = moment().format('DD.MM.YYYY');
  if (!this.hoursByDate[today]) {
    const alert = await this.alertController.create({
      header: 'Podsjetnik',
      message: 'Niste unijeli radne sate za današnji dan. Molimo vas da ih unesete.',
      buttons: ['U redu']
    });
    await alert.present();
  }
}

      setCurrentWeek(weekOffset = 0) {
        const startOfWeek = moment().startOf('isoWeek').add(weekOffset, 'weeks');
        const endOfWeek = moment(startOfWeek).endOf('isoWeek');
      
        // Optimize: Only update if the week has actually changed.
        if (this.currentWeekStart !== startOfWeek.format('YYYY-MM-DD')) {
          this.currentWeekStart = startOfWeek.format('YYYY-MM-DD');
          this.currentWeekEnd = endOfWeek.format('YYYY-MM-DD');
      
          // Update currentWeek array
          this.currentWeek = Array.from({ length: 7 }).map((_, i) =>
            startOfWeek.clone().add(i, 'days').format('DD.MM.YYYY')
          );
      
          // Load hours for the new week, potentially async to prevent blocking
          this.loadHours();
        }
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

    async loadHours() {
      const credentials = this.authService.getHashedCredentials();
      //console.log('Retrieved credentials:', credentials);
    
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
    
      //console.log("authPayload: ", authPayload);
    
      try {
        const response = await this.http.post<any>('https://bvproduct.app/api/hours.php', authPayload).toPromise();
    
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
      } catch (error) {
        console.error('Error loading hours', error);
        this.errorMessage = 'Failed to load hours. Please try again later.';
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
    if (this.restrictionTriggered) {
      console.warn('Cannot submit form due to restriction.');
      this.errorMessage = null;
      this.formSubmitted = false;
      return; // Prevent form submission
  }
  
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
