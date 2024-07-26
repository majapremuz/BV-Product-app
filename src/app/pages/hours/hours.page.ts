import { Component, OnInit, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonicModule } from '@ionic/angular';
import { Router, NavigationEnd } from '@angular/router';
import { NavController } from '@ionic/angular';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import * as moment from 'moment';

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

  constructor(
    private router: Router,
    private navCtrl: NavController,
    private http: HttpClient
  ) {}

  ngOnInit() {
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
