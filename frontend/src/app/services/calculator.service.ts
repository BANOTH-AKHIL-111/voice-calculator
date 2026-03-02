import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
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