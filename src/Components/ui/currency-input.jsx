import React from 'react';
import { Input } from "@/components/ui/input";

// Simple Currency Input Wrapper
export default function CurrencyInput({ value, onChange, className, ...props }) {
    // Format to BRL for display
    const formatValue = (val) => {
        if (!val) return '';
        return new Intl.NumberFormat('pt-BR', {
            style: 'currency',
            currency: 'BRL',
            minimumFractionDigits: 2
        }).format(val);
    };

    const [cursor, setCursor] = React.useState(null);
    const ref = React.useRef(null);

    const handleChange = (e) => {
        const rawValue = e.target.value.replace(/\D/g, '');
        const floatValue = parseFloat(rawValue) / 100;
        onChange(floatValue || 0);
    };

    return (
        <Input
            {...props}
            ref={ref}
            value={value ? formatValue(value) : ''}
            onChange={handleChange}
            className={className}
            placeholder="R$ 0,00"
        />
    );
}
