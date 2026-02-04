import { Decimal } from "decimal.js";

// Configure Decimal for high precision (20 significant digits)
Decimal.set({ precision: 20, rounding: Decimal.ROUND_HALF_UP });

export class InterestAccumulatorService {
  private static APR = new Decimal(0.275); // 27.5% annual interest rate

  /**
   * Calculates interest for a single day
   * Formula: (Balance * AnnualRate) / DaysInYear
   */
  static calculateDailyInterest(balance: number, date: Date): Decimal {
    const decBalance = new Decimal(balance);

    const currentYear = date.getFullYear();

    const daysInCurrentYear = this.isLeapYear(currentYear) ? 366 : 365;

    const dailyRate = this.APR.dividedBy(daysInCurrentYear);

    return decBalance.times(dailyRate);
  }

  static isLeapYear(year: number): boolean {
    return (year % 4 === 0 && year % 100 !== 0) || year % 400 === 0;
  }
}
