import React from 'react';
import { Input } from "@/components/ui/input";

export default function AutocompleteInput({ options = [], id, value, onChange, placeholder, ...props }) {
    const listId = `${id}-list`;

    return (
        <>
            <Input
                {...props}
                id={id}
                list={listId}
                value={value}
                onChange={(e) => onChange(e.target.value)}
                placeholder={placeholder}
            />
            <datalist id={listId}>
                {options.map((opt, i) => (
                    <option key={i} value={opt} />
                ))}
            </datalist>
        </>
    );
}
