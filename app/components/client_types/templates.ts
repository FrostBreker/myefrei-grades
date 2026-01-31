export interface TemplateOption {
    cursus: string;
    filiere: string;
    groupe: string;
    academicYear: string;
    hasS1: boolean;
    hasS2: boolean;
    branches?: string[]; // Ajouté pour la gestion des branches
}
