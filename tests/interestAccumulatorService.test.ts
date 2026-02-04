import { InterestAccumulatorService } from "../src/services/interestAccumulatorService";
import { Decimal } from "decimal.js";

describe("Interest Accumulator Logic", () => {
  const testBalance = 10000.0; // $10,000

  test("calculates correct daily interest for a non-leap year (2025)", () => {
    const date = new Date("2025-06-01");
    const interest = InterestAccumulatorService.calculateDailyInterest(
      testBalance,
      date,
    );

    // Calculation: (10000 * 0.275) / 365 = 7.534246575...
    // Check for approximate equality to handle precision
    expect(interest.toFixed(4)).toBe("7.5342");
  });

  test("calculates correct daily interest for a leap year (2024)", () => {
    const date = new Date("2024-02-29");
    const interest = InterestAccumulatorService.calculateDailyInterest(
      testBalance,
      date,
    );

    // Calculation: (10000 * 0.275) / 366 = 7.513661202...
    // Check for approximate equality to handle precision
    expect(interest.toFixed(4)).toBe("7.5137");
  });

  test("proves precision: interest + original balance matches exactly", () => {
    const balance = 100.0;
    const date = new Date("2025-01-01");
    const interest = InterestAccumulatorService.calculateDailyInterest(
      balance,
      date,
    );

    const newBalance = new Decimal(balance).plus(interest);

    // (100 * 0.275) / 365 = 0.07534246575342465753
    expect(newBalance.toString()).toBe("100.07534246575342466");
  });

  test("correctly identifies Leap years", () => {
    expect(InterestAccumulatorService.isLeapYear(2000)).toBe(true); // Century leap
    expect(InterestAccumulatorService.isLeapYear(2100)).toBe(false); // Century non-leap
    expect(InterestAccumulatorService.isLeapYear(2024)).toBe(true);
    expect(InterestAccumulatorService.isLeapYear(2025)).toBe(false);
  });
});
