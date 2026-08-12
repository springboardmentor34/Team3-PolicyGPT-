import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class EligibilityResultService {

  private result: any = null;

  // ================= SAVE COMPLETE RESULT =================

  setResult(result: any): void {
    this.result = result;
  }

  // ================= GET COMPLETE RESULT =================

  getResult(): any {
    return this.result;
  }

  // ================= CLEAR RESULT =================

  clearResult(): void {
    this.result = null;
  }
}