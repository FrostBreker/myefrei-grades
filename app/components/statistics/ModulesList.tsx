import {UE} from "@lib/grades/types";
import {Accordion, AccordionContent, AccordionItem, AccordionTrigger} from "@/components/ui/accordion";
import {Badge} from "@/components/ui/badge";
import {Button} from "@/components/ui/button";
import Link from "next/link";
import {ArrowRight} from "lucide-react";
import React from "react";

export function UEList({ues, semesterId}: { ues: UE[], semesterId: string }) {
    if (!ues || ues.length === 0) {
        return (
            <p className="text-sm text-muted-foreground">Aucun UEs trouvé pour ce groupe.</p>
        );
    }

    return (
        <Accordion type="multiple" className="space-y-2 mt-4">
            {ues.map((ue) => (
                <AccordionItem key={ue.id} value={ue.id} className="border rounded-lg">
                    <AccordionTrigger className="px-3 md:px-4 hover:no-underline cursor-pointer">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between w-full mr-2 md:mr-4 gap-2">
                            <div className="flex flex-wrap items-center gap-1 md:gap-2">
                                <Badge variant="outline" className="text-xs">{ue.code}</Badge>
                                <span className="font-medium text-xs md:text-sm">{ue.name}</span>
                            </div>
                            {/*<Button size="xs" asChild className="text-sm px-4 py-4" variant={"outline"}>*/}
                            {/*    <Link href="/statistics/ue/[ueId]?semesterId=semesterId" as={`/statistics/ue/${ue.code}?semesterId=${semesterId}`}>*/}
                            {/*        Stats*/}
                            {/*        <ArrowRight className="ml-2 h-5 w-5"/>*/}
                            {/*    </Link>*/}
                            {/*</Button>*/}
                        </div>
                    </AccordionTrigger>
                    <AccordionContent className="px-3 md:px-4 pb-4">
                        <div className="space-y-2">
                            {ue.modules.map((mod) => (
                                <div
                                    key={mod.id}
                                    className="flex flex-col sm:flex-row sm:items-center justify-between p-2 bg-muted/30 rounded text-xs md:text-sm gap-2"
                                >
                                    <div className="flex flex-wrap items-center gap-1 md:gap-2">
                                        <span className="text-muted-foreground">{mod.code}</span>
                                        <span className="truncate max-w-37.5 md:max-w-none">{mod.name}</span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </AccordionContent>
                </AccordionItem>
            ))}
        </Accordion>
    );
}