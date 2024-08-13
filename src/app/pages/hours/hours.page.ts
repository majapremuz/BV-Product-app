import { Component, OnInit, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonicModule } from '@ionic/angular';
import { Router, NavigationEnd } from '@angular/router';
import { NavController } from '@ionic/angular';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { AuthService } from 'src/app/services/auth.service';
import * as moment from 'moment';
import { ChangeDetectorRef } from '@angular/core';


interface Location {
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
  currentWeek: string[] = [];
  selectedDate: string | null = null;
  applyForm= new FormGroup ({
    lokacija: new FormControl("", Validators.required),
    datum: new FormControl("", Validators.required),
    sati: new FormControl("", Validators.required)
  })

  formSubmitted: boolean = false;
  errorMessage: string | null = null;
  locations: Location[] = [];


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
    this.setCurrentWeek();
    this.loadSelectedDate();
  }

  selectDate(datum: string) {
    const formattedDate = moment(datum, 'DD.MM.YYYY').format('YYYY-MM-DD');
    this.selectedDate = formattedDate;
    this.applyForm.patchValue({ datum: formattedDate });
    this.saveSelectedDate(formattedDate);
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

  /*unosForme() {
    this.formSubmitted = false;
    
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
        username: username,
        password: password,
        ...formData
      };

      const headers = { 'Content-Type': 'application/json' };

      this.http.post('https://bvproduct.virtualka.prolink.hr/api/hours-add.php', payload, { headers })
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
  }*/

    unosForme() {
      this.formSubmitted = false;  // Reset before submission
    
      if (this.applyForm.valid) {
        const formData = this.applyForm.value;
        const username = this.authService.getUsername();
        const password = this.authService.getPassword();
    
        if (!username || !password) {
          this.errorMessage = 'Failed to retrieve credentials.';
          console.error(this.errorMessage);
          return;
        }
    
        const payload = {
          username: username,
          password: password,
          ...formData
        };
    
        const headers = { 'Content-Type': 'application/json' };
    
        this.http.post('https://bvproduct.virtualka.prolink.hr/api/hours-add.php', payload, { headers })
          .subscribe({
            next: response => {
              this.formSubmitted = true;
              this.errorMessage = null;
              console.log('Obrazac uspješno poslan', response);
              this.cdr.detectChanges();  // Trigger change detection
            },
            error: error => {
              this.formSubmitted = true;
              this.errorMessage = 'Došlo je do pogreške prilikom slanja obrasca. Pokušajte ponovno kasnije.';
              console.error('Greška kod slanja obrasca', error);
              this.cdr.detectChanges();  // Trigger change detection
            }
          });
      } else {
        this.formSubmitted = true;
        this.errorMessage = 'Molim vas da prije slanja ispravno ispunite sva polja.';
        console.warn('Obrasac nije ispravan');
        this.cdr.detectChanges();  // Trigger change detection
      }
    }
    
}
