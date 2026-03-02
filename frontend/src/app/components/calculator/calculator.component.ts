import { Component, ChangeDetectorRef, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { CalculatorService } from '../../services/calculator.service';

declare var webkitSpeechRecognition: any;

@Component({
  selector: 'app-calculator',
  standalone: true,
  imports: [FormsModule, CommonModule],
  templateUrl: './calculator.component.html',
  styleUrls: ['./calculator.component.scss']
})
export class CalculatorComponent implements OnInit {

  expression: string = '';
  result: number | null = null;
  error: string = '';
  loading: boolean = false;
  listening: boolean = false;

  history: { expression: string, result: number }[] = [];
  darkMode: boolean = false;
  angleMode: 'DEG' | 'RAD' = 'DEG';

  recognition: any;
  lastCalculatedExpression: string = '';

  constructor(
    private calculatorService: CalculatorService,
    private cdr: ChangeDetectorRef
  ) {
    this.initializeSpeechRecognition();
  }

  /* ================= INIT ================= */

  ngOnInit() {
    const savedHistory = localStorage.getItem('calcHistory');
    if (savedHistory) {
      this.history = JSON.parse(savedHistory);
    }

    const savedTheme = localStorage.getItem('darkMode');
    if (savedTheme) {
      this.darkMode = savedTheme === 'true';
    }
  }

  /* ================= SPEECH ================= */

  initializeSpeechRecognition() {

    if (!('webkitSpeechRecognition' in window)) return;

    this.recognition = new webkitSpeechRecognition();
    this.recognition.continuous = true;
    this.recognition.interimResults = false;
    this.recognition.lang = 'en-US';

    this.recognition.onresult = (event: any) => {

      const resultIndex = event.resultIndex;
      if (!event.results[resultIndex].isFinal) return;

      let speechText = event.results[resultIndex][0].transcript
        .trim()
        .toLowerCase();

      if (!speechText) return;
      if (speechText.includes('the result is')) return;

      const converted = this.convertSpeechToExpression(speechText);

      if (!converted || converted.length < 2) return;
      if (converted === this.lastCalculatedExpression) return;

      this.expression = converted;
      this.calculate();
    };

    this.recognition.onend = () => {
      if (this.listening) {
        try { this.recognition.start(); } catch {}
      }
    };
  }

  startListening() {
    if (!this.recognition) return;

    this.listening = !this.listening;

    if (this.listening) {
      this.recognition.start();
    } else {
      this.recognition.stop();
    }
  }

  speak(text: string) {

    if (!('speechSynthesis' in window)) return;

    speechSynthesis.cancel(); // prevent stacking

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = 'en-US';
    utterance.rate = 1;

    speechSynthesis.speak(utterance);
  }

  /* ================= MODES ================= */

  toggleDarkMode() {
    this.darkMode = !this.darkMode;
    localStorage.setItem('darkMode', this.darkMode.toString());
  }

  toggleAngleMode() {
    this.angleMode = this.angleMode === 'DEG' ? 'RAD' : 'DEG';
  }

  insert(value: string) {
    this.expression += value;
  }

  /* ================= SPEECH → EXPRESSION ================= */

  convertSpeechToExpression(text: string): string {

    let expr = text.toLowerCase().trim();
    expr = this.convertWordNumbers(expr);
    expr = expr.replace(/\.$/, '');

    expr = expr.replace(/\bpi\b/g, 'pi');
    expr = expr.replace(/\be\b/g, 'e');

    expr = expr.replace(/(\d+)\s*power\s*(\d+)/g, '$1^$2');
    expr = expr.replace(/(\d+)\s*percent\s*of\s*(\d+)/g, '($1/100)*$2');
    expr = expr.replace(/(\d+)%/g, '($1/100)');
    expr = expr.replace(/\bof\b/g, '*');

    expr = expr.replace(/sin\s*\(?([-]?\d+(\.\d+)?)\)?/g, (_, num) =>
      this.angleMode === 'DEG'
        ? `sin((${num}*pi)/180)`
        : `sin(${num})`
    );

    expr = expr.replace(/cos\s*\(?([-]?\d+(\.\d+)?)\)?/g, (_, num) =>
      this.angleMode === 'DEG'
        ? `cos((${num}*pi)/180)`
        : `cos(${num})`
    );

    expr = expr.replace(/tan\s*\(?([-]?\d+(\.\d+)?)\)?/g, (_, num) =>
      this.angleMode === 'DEG'
        ? `tan((${num}*pi)/180)`
        : `tan(${num})`
    );

    expr = expr.replace(/natural log\s*(\d+)/g, 'ln($1)');
    expr = expr.replace(/log\s*(\d+)/g, 'log($1)');

    expr = expr.replace(/square root of (\d+)/g, 'sqrt($1)');
    expr = expr.replace(/sqrt (\d+)/g, 'sqrt($1)');

    expr = expr.replace(/plus/g, '+');
    expr = expr.replace(/minus/g, '-');
    expr = expr.replace(/into|multiply by/g, '*');
    expr = expr.replace(/divide by/g, '/');

    return expr.trim();
  }

  convertWordNumbers(text: string): string {

    const map: any = {
      zero: "0", one: "1", two: "2", three: "3", four: "4",
      five: "5", six: "6", seven: "7", eight: "8", nine: "9",
      ten: "10", eleven: "11", twelve: "12", thirteen: "13",
      fourteen: "14", fifteen: "15", sixteen: "16",
      seventeen: "17", eighteen: "18", nineteen: "19",
      twenty: "20", thirty: "30", forty: "40",
      fifty: "50", sixty: "60", seventy: "70",
      eighty: "80", ninety: "90"
    };

    Object.keys(map).forEach(word => {
      const regex = new RegExp(`\\b${word}\\b`, "g");
      text = text.replace(regex, map[word]);
    });

    return text;
  }

  /* ================= CALCULATE ================= */

  calculate() {

  if (!this.expression.trim()) return;

  let processedExpr = this.expression;

  // 🔥 Apply DEG conversion ONLY if in DEG mode
  if (this.angleMode === 'DEG') {

    processedExpr = processedExpr.replace(
      /sin\(([^)]+)\)/g,
      'sin(($1*pi)/180)'
    );

    processedExpr = processedExpr.replace(
      /cos\(([^)]+)\)/g,
      'cos(($1*pi)/180)'
    );

    processedExpr = processedExpr.replace(
      /tan\(([^)]+)\)/g,
      'tan(($1*pi)/180)'
    );
  }

  this.loading = true;
  this.result = null;
  this.error = '';

  this.calculatorService.calculate(processedExpr).subscribe({

    next: (res: any) => {

      this.loading = false;

      if (!res.success) {
        this.error = res.message;
        this.cdr.detectChanges();
        return;
      }

      this.result = res.result;

      this.history.unshift({
        expression: this.expression,
        result: res.result
      });

      localStorage.setItem('calcHistory', JSON.stringify(this.history));

      this.error = '';

      this.cdr.detectChanges();

      this.speak(`The result is ${res.result}`);
    },

    error: () => {
      this.loading = false;
      this.error = 'Server error';
      this.cdr.detectChanges();
    }
  });
}

  clearHistory() {
    this.history = [];
    localStorage.removeItem('calcHistory');
  }
}