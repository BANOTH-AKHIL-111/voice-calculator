import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class CalculatorService {

  private apiUrl = 'https://voice-calculator-zd4j.onrender.com/api/calculate';

  constructor(private http: HttpClient) {}

  calculate(expression: string): Observable<any> {
    return this.http.post(this.apiUrl, { expression });
  }
}