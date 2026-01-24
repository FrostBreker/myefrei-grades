import { GradeEntry, Module, UE, CalculMoyenne } from "./types";

/**
 * Calculate average for a list of grade entries
 */
export function calculateGradeEntriesAverage(grades: GradeEntry[]): number | null {
    let totalPoints = 0;
    let totalCoefficients = 0;

    for (const gradeEntry of grades) {
        if (gradeEntry.grade !== null) {
            // Normalize to /20 if needed
            const normalizedGrade = (gradeEntry.grade / gradeEntry.maxGrade) * 20;
            totalPoints += normalizedGrade * gradeEntry.coefficient;
            totalCoefficients += gradeEntry.coefficient;
        }
    }

    if (totalCoefficients === 0) return null;

    return Math.round((totalPoints / totalCoefficients) * 100) / 100;
}

/**
 * Calculate average for a module (based on its grade entries)
 */
export function calculateModuleAverage(module: Module): number | null {
    return calculateGradeEntriesAverage(module.grades);
}

/**
 * Calculate average for a UE (based on its modules)
 */
export function calculateUEAverage(ue: UE): number | null {
    let totalPoints = 0;
    let totalCoefficients = 0;

    for (const mod of ue.modules) {
        const moduleAvg = calculateModuleAverage(mod);
        if (moduleAvg !== null) {
            totalPoints += moduleAvg * mod.coefficient;
            totalCoefficients += mod.coefficient;
        }
    }

    if (totalCoefficients === 0) return null;

    return Math.round((totalPoints / totalCoefficients) * 100) / 100;
}

/**
 * Calculate semester average (based on UEs)
 */
export function calculateSemesterAverage(ues: UE[]): CalculMoyenne {
    let totalPoints = 0;
    let totalCoefficients = 0;
    let totalECTS = 0;
    let missingGrades = 0;

    for (const ue of ues) {
        const ueAvg = calculateUEAverage(ue);
        if (ueAvg !== null) {
            totalPoints += ueAvg * ue.coefficient;
            totalCoefficients += ue.coefficient;
            totalECTS += ue.ects;
        } else {
            // Count missing grades
            for (const mod of ue.modules) {
                missingGrades += mod.grades.filter(g => g.grade === null).length;
            }
        }
    }

    const average = totalCoefficients > 0
        ? Math.round((totalPoints / totalCoefficients) * 100) / 100
        : null;

    return {
        average,
        totalCoefficients,
        totalECTS,
        missingGrades
    };
}

/**
 * Calculate ECTS obtained for a semester
 * Returns total ECTS if average >= 10, 0 otherwise
 */
export function calculateECTSObtained(ues: UE[]): number {
    const { average } = calculateSemesterAverage(ues);

    if (average === null) return 0;

    if (average >= 10) {
        // Semester validated, all ECTS obtained
        return ues.reduce((sum, ue) => sum + ue.ects, 0);
    }

    // Alternative: validate UE by UE
    let ectsObtained = 0;
    for (const ue of ues) {
        const ueAvg = calculateUEAverage(ue);
        if (ueAvg !== null && ueAvg >= 10) {
            ectsObtained += ue.ects;
        }
    }

    return ectsObtained;
}

/**
 * Check if all grades are entered
 */
export function isSemesterComplete(ues: UE[]): boolean {
    for (const ue of ues) {
        for (const moduleItem of ue.modules) {
            if (moduleItem.grades.some(g => g.grade === null)) {
                return false;
            }
        }
    }
    return true;
}

/**
 * Count validated UEs (>= 10/20)
 */
export function countValidatedUEs(ues: UE[]): number {
    return ues.filter(ue => {
        const avg = calculateUEAverage(ue);
        return avg !== null && avg >= 10;
    }).length;
}

/**
 * Determine if semester is validated (average >= 10/20)
 */
export function isSemesterValidated(ues: UE[]): boolean {
    const { average } = calculateSemesterAverage(ues);
    return average !== null && average >= 10;
}

/**
 * Generate unique code for a semester
 */
export function generateSemesterCode(
    cursus: string,
    filiere: string,
    groupe: string,
    semester: number
): string {
    return `S${semester}_${cursus}_${filiere}_${groupe}`.toUpperCase();
}

/**
 * Format readable semester name
 */
export function formatSemesterName(
    cursus: string,
    filiere: string,
    groupe: string,
    semester: number
): string {
    return `Semestre ${semester} - ${cursus} ${filiere} ${groupe}`;
}

/**
 * Get current academic year
 */
export function getCurrentAcademicYear(): string {
    const now = new Date();
    const year = now.getFullYear();
    const month = now.getMonth() + 1;

    // Academic year starts in September
    if (month >= 9) {
        return `${year}-${year + 1}`;
    } else {
        return `${year - 1}-${year}`;
    }
}

/**
 * Get label for grade type
 */
export function getGradeTypeLabel(type: string): string {
    const labels: Record<string, string> = {
        TP: "Travaux Pratiques",
        TD: "Travaux Dirigés",
        PRJ: "Projet",
        DE: "Devoir à la Maison",
        CC: "Contrôle Continu",
        CO: "Contrôle",
        CE: "Contrôle Final",
        TOEIC: "TOEIC",
        AUTRE: "Autre"
    };
    return labels[type] || type;
}

