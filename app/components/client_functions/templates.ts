import React from "react";
import {AcademicYearTemplate, SemesterData} from "@lib/grades/types";
import {TemplateOption} from "@components/client_types/templates";

export const loadAvailableTemplates = async (disabled: boolean | undefined, setLoadingTemplates: React.Dispatch<React.SetStateAction<boolean>>, setTemplateOptions: React.Dispatch<React.SetStateAction<TemplateOption[]>>) => {
    if (disabled) return;
    setLoadingTemplates(true);
    try {
        const response = await fetch("/api/admin/year-templates");
        const data = await response.json();

        if (data.success) {
            // Convert year templates to options
            const options: TemplateOption[] = data.templates.map((template: AcademicYearTemplate) => ({
                cursus: template.cursus,
                filiere: template.filiere,
                groupe: template.groupe,
                academicYear: template.academicYear,
                hasS1: template.semesters.some((s: SemesterData) => s.semester === 1),
                hasS2: template.semesters.some((s: SemesterData) => s.semester === 2)
            }));

            setTemplateOptions(options);
        }
    } catch (error) {
        console.error("Error loading templates:", error);
    } finally {
        setLoadingTemplates(false);
    }
};