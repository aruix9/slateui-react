import React from 'react';
import { LdTable, LdTableHead, LdTableHeader, LdTableRow, LdTableBody, LdTableCell } from "@emdgroup-liquid/liquid/dist/react";

interface FilterDistributionGraphTable {
    Date: string[];
    "Total Shifts": number[];
    "Total Weekday Shifts": number[];
    "Week Days": number[];
    "Shifts per WeekDay": number[];
    "Total Saturday Shifts": number[];
    "Saturdays": number[];
    "Shifts per Saturday": number[];
    "Total Sunday Shifts": number[];
    "Sundays": number[];
    "Shifts per Sunday": number[];
    "Ad-hoc Shifts": number[];
}

interface OptimizedLdTableProps {
    filterDistributionGraphTable: FilterDistributionGraphTable;
}

const OptimizationTable: React.FC<OptimizedLdTableProps> = React.memo(({ filterDistributionGraphTable }) => {
    return (
        <LdTable className="mt-4">
            <LdTableHead>
                <LdTableRow>
                    <LdTableHeader>Date</LdTableHeader>
                    <LdTableHeader>Total Shifts</LdTableHeader>
                    <LdTableHeader>Total Weekday Shifts</LdTableHeader>
                    <LdTableHeader>Week Days</LdTableHeader>
                    <LdTableHeader>Shifts per WeekDay</LdTableHeader>
                    <LdTableHeader>Total Saturday Shifts</LdTableHeader>
                    <LdTableHeader>Saturdays</LdTableHeader>
                    <LdTableHeader>Shifts per Saturday</LdTableHeader>
                    <LdTableHeader>Total Sunday Shifts</LdTableHeader>
                    <LdTableHeader>Sundays</LdTableHeader>
                    <LdTableHeader>Shifts per Sunday</LdTableHeader>
                    <LdTableHeader>Ad-hoc Shifts</LdTableHeader>
                </LdTableRow>
            </LdTableHead>
            <LdTableBody>
                {filterDistributionGraphTable.Date.map((date, index) => (
                    <LdTableRow key={index}>
                        <LdTableCell>{date}</LdTableCell>
                        <LdTableCell>{filterDistributionGraphTable["Total Shifts"][index] || 0}</LdTableCell>
                        <LdTableCell>{filterDistributionGraphTable["Total Weekday Shifts"][index] || 0}</LdTableCell>
                        <LdTableCell>{filterDistributionGraphTable["Week Days"][index] || 0}</LdTableCell>
                        <LdTableCell>{filterDistributionGraphTable["Shifts per WeekDay"][index] || 0}</LdTableCell>
                        <LdTableCell>{filterDistributionGraphTable["Total Saturday Shifts"][index] || 0}</LdTableCell>
                        <LdTableCell>{filterDistributionGraphTable["Saturdays"][index] || 0}</LdTableCell>
                        <LdTableCell>{filterDistributionGraphTable["Shifts per Saturday"][index] || 0}</LdTableCell>
                        <LdTableCell>{filterDistributionGraphTable["Total Sunday Shifts"][index] || 0}</LdTableCell>
                        <LdTableCell>{filterDistributionGraphTable["Sundays"][index] || 0}</LdTableCell>
                        <LdTableCell>{filterDistributionGraphTable["Shifts per Sunday"][index] || 0}</LdTableCell>
                        <LdTableCell>{filterDistributionGraphTable["Ad-hoc Shifts"][index] || 0}</LdTableCell>
                    </LdTableRow>
                ))}
            </LdTableBody>
        </LdTable>
    );
});

export default OptimizationTable;
