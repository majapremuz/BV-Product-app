import { Component, OnInit, ChangeDetectionStrategy, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonicModule } from '@ionic/angular';
import { Router, NavigationEnd } from '@angular/router';
import { filter } from 'rxjs/operators';
import { NavController } from '@ionic/angular';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { AuthService } from 'src/app/services/auth.service';
import * as moment from 'moment';


interface Location {
  id: string;
  title: string;
}

interface Types {
  id: string;
  title: string;
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
  currentPage: string = 'hours';
  currentWeek: string[] = [];
  selectedDate: string | null = null;
  hoursByDate: { [key: string]: { hours: number[], sum: number } } = {};
  applyForm= new FormGroup ({
    vrsta: new FormControl("", Validators.required),
    lokacija: new FormControl("", Validators.required),
    datum: new FormControl("", Validators.required),
    sati: new FormControl("", Validators.required)
  })

  formSubmitted: boolean = false;
  errorMessage: string | null = null;
  locations: Location[] = [];
  types: Types[] = [];


  constructor(
    private router: Router,
    private navCtrl: NavController,
    private http: HttpClient,
    private authService: AuthService,
    private cdr: ChangeDetectorRef
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
  }

  addHours() {
    const selectedDate = this.selectedDate;
    const selectedHours = parseFloat(this.applyForm.get('sati')?.value || '0');
    console.log(selectedHours)

    if (selectedDate && selectedHours) {
      const formattedDate = moment(selectedDate, 'YYYY-MM-DD').format('DD.MM.YYYY');
      
      if (!this.hoursByDate[formattedDate]) {
        this.hoursByDate[formattedDate] = { hours: [], sum: 0 };
      }
      
      this.hoursByDate[formattedDate].hours.push(selectedHours);
      this.hoursByDate[formattedDate].sum += selectedHours;
      
      this.applyForm.get('sati')?.reset();
      
      this.cdr.markForCheck();

      this.saveHoursByDate();

      this.applyForm.get('sati')?.reset();
    
    this.cdr.markForCheck();
    }
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
      this.cdr.markForCheck(); // Ensure the view is updated after loading the data
    }
  }

  private loadSelectedDate() {
    const savedDate = localStorage.getItem('selectedDate');
    if (savedDate) {
      this.selectedDate = savedDate;
      this.applyForm.patchValue({ datum: savedDate });
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
      this.http.post<Location[]>('https://bvproduct.virtualka.prolink.hr/api/locations.php', authPayload)
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
      this.http.post<Types[]>('https://bvproduct.virtualka.prolink.hr/api/type.php', authPayload)
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

    unosForme() {
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

        this.addHours();
    
        this.http.post('https://bvproduct.virtualka.prolink.hr/api/hours-add.php', payload, { headers })
          .subscribe({
            next: response => {
              this.formSubmitted = true;
              this.errorMessage = null;
              console.log('Obrazac uspješno poslan', response);
              this.cdr.detectChanges();
            },
            error: error => {
              this.formSubmitted = true;
              this.errorMessage = 'Došlo je do pogreške prilikom slanja obrasca. Pokušajte ponovno kasnije.';
              console.error('Greška kod slanja obrasca', error);
              this.cdr.detectChanges();
            }
          });
      } else {
        this.formSubmitted = true;
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
