import {TrendingDown, TrendingUp} from "lucide-react";

// Component to show trend indicator with value
export function TrendIndicator({value}: { value: number }) {
    if (value === 0) return null;
    const fixedValue: string = !Number.isInteger(value) ? value.toFixed(2) : value.toString(10);
    if (value < 0) {
        return (
            <span className="inline-flex items-center gap-0.5 text-red-500 text-xs ml-1 cursor-help" title={value.toString(10)}>
                <TrendingDown className="h-3 w-3"/>
                {fixedValue}
            </span>
        );
    }

    return (
        <span className="inline-flex items-center gap-0.5 text-green-500 text-xs ml-1 cursor-help" title={value.toString(10)}>
            <TrendingUp className="h-3 w-3"/>
            +{fixedValue}
        </span>
    );
}
