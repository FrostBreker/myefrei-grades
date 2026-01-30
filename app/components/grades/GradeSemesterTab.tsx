import React from 'react';
import {TabsContent} from "@/components/ui/tabs";
import {Card, CardContent, CardHeader, CardTitle} from "@/components/ui/card";
import {Badge} from "@/components/ui/badge";
import {Button} from "@/components/ui/button";
import {BookOpen, Edit} from "lucide-react";
import {Module, UserSemester} from "@lib/grades/types";

type Props = {
    semester: UserSemester | undefined;
    semNumber: number;
    setEditingSemester: (semester: UserSemester) => void;
};

function GradeSemesterTab({semester, semNumber, setEditingSemester}: Props) {
    return (
        <TabsContent value={"s"+semNumber}>
            {semester ? (
                <Card className="hover:shadow-lg transition-shadow">
                    <CardHeader>
                        <div className="flex items-center justify-between">
                            <CardTitle className="text-lg">
                                {semester.name}
                            </CardTitle>
                            {semester.average !== null ? (
                                <Badge
                                    variant={semester.average >= 10 ? "default" : "destructive"}
                                    className="text-lg px-3 py-1"
                                >
                                    {semester.average.toFixed(2)}/20
                                </Badge>
                            ) : (
                                <Badge variant="outline" className="text-lg px-3 py-1">
                                    -/20
                                </Badge>
                            )}
                        </div>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-4">
                            {/* Stats summary */}
                            <div className="grid grid-cols-3 gap-4 text-center pb-4 border-b">
                                <div>
                                    <div className="text-2xl font-bold">{semester.ues.length}</div>
                                    <div className="text-xs text-muted-foreground">UEs</div>
                                </div>
                                <div>
                                    <div className="text-2xl font-bold">{semester.totalECTS}</div>
                                    <div className="text-xs text-muted-foreground">ECTS Total</div>
                                </div>
                                <div>
                                    <div className="text-2xl font-bold">
                                        {semester.ectsObtained !== null ? semester.ectsObtained : "-"}
                                    </div>
                                    <div className="text-xs text-muted-foreground">ECTS Obtenus</div>
                                </div>
                            </div>

                            {/* Grades overview */}
                            {semester.ues.length > 0 && (
                                <div className="space-y-3">
                                    {semester.ues.map((ue) => {
                                        const ueAvg = ue.average ?? null;
                                        return (
                                            <div key={ue.id} className="border rounded-lg p-2 md:p-3">
                                                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-2">
                                                    <div className="flex flex-wrap items-center gap-1 md:gap-2">
                                                        <Badge variant="outline" className="text-xs">{ue.code}</Badge>
                                                        <span className="font-medium text-xs md:text-sm">{ue.name}</span>
                                                        <Badge variant="secondary" className="text-xs">{ue.ects} ECTS</Badge>
                                                    </div>
                                                    {ueAvg !== null ? (
                                                        <Badge variant={ueAvg >= 10 ? "default" : "destructive"} className="self-end sm:self-auto">
                                                            {ueAvg.toFixed(2)}/20
                                                        </Badge>
                                                    ) : (
                                                        <Badge variant="outline" className="self-end sm:self-auto">-/20</Badge>
                                                    )}
                                                </div>
                                                <div className="pl-2 md:pl-4 space-y-1">
                                                    {ue.modules.map((mod: Module) => {
                                                        const modAvg = mod.average ?? null;
                                                        const gradesCount = mod.grades.filter(g => g.grade !== null).length;
                                                        const totalGrades = mod.grades.length;
                                                        return (
                                                            <div key={mod.id} className="flex flex-col sm:flex-row sm:items-center justify-between text-xs md:text-sm py-1 border-b border-dashed last:border-0 gap-1">
                                                                <div className="flex flex-wrap items-center gap-1 md:gap-2">
                                                                    <span className="text-muted-foreground">{mod.code}</span>
                                                                    <span className="truncate max-w-37.5 md:max-w-none">{mod.name}</span>
                                                                    <span className="text-xs text-muted-foreground">
                                                                                                    ({gradesCount}/{totalGrades})
                                                                                                </span>
                                                                </div>
                                                                {modAvg !== null ? (
                                                                    <span className={`font-medium ${modAvg >= 10 ? 'text-green-600' : 'text-red-600'}`}>
                                                                                                    {modAvg.toFixed(2)}
                                                                                                </span>
                                                                ) : (
                                                                    <span className="text-muted-foreground">-</span>
                                                                )}
                                                            </div>
                                                        );
                                                    })}
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            )}

                            {semester.locked && (
                                <Badge variant="outline" className="w-full justify-center">
                                    🔒 Verrouillé
                                </Badge>
                            )}
                            <Button
                                onClick={() => setEditingSemester(semester)}
                                className="w-full  cursor-pointer"
                            >
                                <Edit className="h-4 w-4 mr-2" />
                                Gérer mes notes
                            </Button>
                        </div>
                    </CardContent>
                </Card>
            ) : (
                <Card className="border-2 border-dashed">
                    <CardContent className="p-12 text-center">
                        <BookOpen className="h-16 w-16 mx-auto mb-4 text-muted-foreground" />
                        <h3 className="text-xl font-bold mb-2">📚 Semestre {semNumber} non défini</h3>
                        <p className="text-muted-foreground">
                            Le semestre {semNumber} n&apos;est pas encore disponible pour ce parcours.
                            <br />
                            Il sera automatiquement ajouté quand l&apos;administration le définira.
                        </p>
                    </CardContent>
                </Card>
            )}
        </TabsContent>
    );
}

export default GradeSemesterTab;