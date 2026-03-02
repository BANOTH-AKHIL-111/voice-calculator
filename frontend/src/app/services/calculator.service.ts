import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class CalculatorService {

  private apiUrl = 'http://localhost:5000/api/calculate';

  constructor(private http: HttpClient) {}

  calculate(expression: string): Observable<any> {
    return this.http.post(this.apiUrl, { expression });
  }
}