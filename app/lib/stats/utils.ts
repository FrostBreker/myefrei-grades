// Get Array of average
import {UserSemesterDB} from "@lib/grades/types";

export function getAveragesArray(usersSemester: UserSemesterDB[]): number[] {
    return usersSemester
        .filter(sem => sem.average !== null && sem.average !== undefined)
        .map(sem => sem.average as number);
}

// Calculate average of an array of numbers
export function calculateAverage(numbers: number[]): number {
    const total = numbers.reduce((sum, num) => sum + num, 0);
    return total / numbers.length;
}

// Calculate median of an array of numbers
export function calculateMedian(numbers: number[]): number {
    const sorted = [...numbers].sort((a, b) => a - b);
    const mid = Math.floor(sorted.length / 2);

    if (sorted.length % 2 === 0) {
        return (sorted[mid - 1] + sorted[mid]) / 2;
    } else {
        return sorted[mid];
    }
}
