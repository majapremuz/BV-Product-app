import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class DarkModeService {

  private darkModeEnabled = false;

  constructor() {
    const savedTheme = localStorage.getItem('darkMode');
    this.darkModeEnabled = savedTheme === 'true';
    this.applyDarkMode();
  }

  toggleDarkMode() {
    this.darkModeEnabled = !this.darkModeEnabled;
    this.applyDarkMode();
    localStorage.setItem('darkMode', this.darkModeEnabled.toString());
  }

  isDarkModeEnabled(): boolean {
    return this.darkModeEnabled;
  }

  private applyDarkMode() {
    if (this.darkModeEnabled) {
      document.body.classList.add('dark');
    } else {
      document.body.classList.remove('dark');
    }
  }
}
