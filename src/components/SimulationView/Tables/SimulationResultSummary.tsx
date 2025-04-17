import React, { useEffect } from 'react';

import "./summaryResultTable.css";

interface DistributionGraphTableData {
    [key: string]: {
        dates: string[];
        diff_First_Shift_per_Weekday: number[];
        diff_Second_Shift_per_Weekday: number[];
        diff_Third_Shift_per_Weekday: number[];
        diff_First_Shift_per_Saturday: number[];
        diff_First_Shift_per_Sunday: number[];
        diff_Second_Shift_per_Saturday: number[];
        diff_Second_Shift_per_Sunday: number[];
        diff_Third_Shift_per_Saturday: number[];
        diff_Third_Shift_per_Sunday: number[];
        values_act: number[];
        values_opt: number[];
        colors_act: string[];
        colors_opt: string[];
        [key: string]: any;
    };
}

interface SimulationResultProp {
    distributionGraphData: DistributionGraphTableData;
}

const SummaryTable: React.FC<SimulationResultProp> = ({ distributionGraphData }) => {

    useEffect(() => {
        createTableHeader(distributionGraphData);
        createTableRows(distributionGraphData);
    }, [distributionGraphData]);

    const createTableHeader = (data: DistributionGraphTableData) => {
        const tableHeader = document.querySelector("#summary-table thead");
        if (!tableHeader) return;

        tableHeader.innerHTML = "";
        const rowAct = document.createElement("tr");
        rowAct.style.borderBottom = "solid 3px white";

        const titleAct = document.createElement("th");
        titleAct.textContent = "Actual Shifts";
        titleAct.style.textAlign = "left";
        rowAct.appendChild(titleAct);

        const rowOpt = document.createElement("tr");
        const titleOpt = document.createElement("th");
        titleOpt.textContent = "Optimal Shifts";
        titleOpt.style.textAlign = "left";
        rowOpt.appendChild(titleOpt);

        // Use the first key in the data to create headers
        const firstKey = Object.keys(data)[0];
        if (firstKey && data[firstKey]) {
            const valuesAct = data[firstKey].values_act || [];
            const valuesOpt = data[firstKey].values_opt || [];
            const colorsAct = data[firstKey].colors_act || [];
            const colorsOpt = data[firstKey].colors_opt || [];

            for (let i = 0; i < Math.max(valuesAct.length, valuesOpt.length); i++) {
                const headerAct = document.createElement("th");
                headerAct.textContent = valuesAct[i] !== undefined ? Math.round(valuesAct[i]).toString() : ""; 
                headerAct.style.backgroundColor = colorsAct[i] || ""; 
                rowAct.appendChild(headerAct);
            
                const headerOpt = document.createElement("th");
                headerOpt.textContent = valuesOpt[i] !== undefined ? Math.round(valuesOpt[i]).toString() : "";
                headerOpt.style.backgroundColor = colorsOpt[i] || "";
                rowOpt.appendChild(headerOpt);
            }
        }

        tableHeader.appendChild(rowAct);
        tableHeader.appendChild(rowOpt);
    };

    const createTableRows = (data: DistributionGraphTableData) => {
        const tableBody = document.querySelector("#summary-table tbody");
        if (!tableBody) return; // Check if tableBody is null

        tableBody.innerHTML = "";
        const firstKey = Object.keys(data)[0];
        if (!firstKey) return; // Check if there is any data

        const lineData = data[firstKey];
        const dates = lineData.dates || [];
        const years_count: { [key: string]: number } = {}; // Define index signature

        const dates_splitted = dates.map((x: string) => x.split("-"));
        const months = dates_splitted.map((x: string[]) => parseInt(x[1])).map((x: number) => getMonthStr(x));
        const years = dates_splitted.map((x: string[]) => parseInt(x[0]));
        
        years.forEach((item: number) => {
            years_count[item] = (years_count[item] || 0) + 1;
        });

        const rowMonths = document.createElement("tr");
        const monthsSpace = document.createElement("td");
        monthsSpace.style.border = "none";
        rowMonths.append(monthsSpace);

        months.forEach((date: string) => {
            const elem = document.createElement("td");
            elem.textContent = date;
            rowMonths.appendChild(elem);
        });
        tableBody.appendChild(rowMonths);

        const rowYears = document.createElement("tr");
        const yearsSpace = document.createElement("td");
        yearsSpace.style.border = "none";
        rowYears.append(yearsSpace);

        for (const year in years_count) {
            const elem = document.createElement("td");
            elem.colSpan = years_count[year];
            elem.textContent = year;
            elem.style.borderBottom = "1px solid #ddd";
            rowYears.appendChild(elem);
        }
        tableBody.appendChild(rowYears);

        const rowDifferences = document.createElement("tr");
        const differences_data = document.createElement("td");
        differences_data.colSpan = dates.length + 1;
        differences_data.textContent = "Differences between Actual and Optimal Capacity Shifts";
        differences_data.style.borderLeft = "none";
        differences_data.style.borderRight = "none";
        differences_data.style.borderTop = "none";
        rowDifferences.appendChild(differences_data);
        tableBody.appendChild(rowDifferences);

        const color_gradient = [
            "rgba(114, 202, 155, 0.5)",
            "rgba(50, 164, 103, 0.5)",
            "rgba(35, 133, 81, 0.5)",
            "rgba(250, 153, 156, 0.5)",
            "rgba(231, 106, 110, 0.5)",
            "rgba(205, 66, 70, 0.5)",
            "rgba(172, 47, 51, 0.5)",
            "rgba(142, 41, 44, 0.5)",
            "rgba(115, 30, 33, 0.5)"
        ];

        let j = 0;
        for (let key in lineData) {
            if (key.includes("diff")) {
                const diffs_row = document.createElement("tr");
                diffs_row.style.borderTop = "1px solid #ddd";

                const title = document.createElement("td");
                title.textContent = key.replace(/_/g, " ").replace("diff ", "");
                title.style.borderLeft = "none";
                title.style.textAlign = "left";
                diffs_row.appendChild(title);

                lineData[key].forEach((diff: number) => {
                    const elem = document.createElement("td");
                    elem.textContent = Math.round(diff).toString(); // Convert to string
                    elem.style.borderRight = "none";
                    elem.style.borderLeft = "none";
                    elem.style.color = diff < 0 ? "green" : diff > 0 ? "red" : "black";
                    elem.style.backgroundColor = color_gradient[j];
                    diffs_row.appendChild(elem);
                });
                tableBody.appendChild(diffs_row);
                j += 1;
            }
        }
    };

    const getMonthStr = (month: number) => {
        return ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"][month - 1];
    };

    return (
        <div className='summary-slider-tab'>
            <table id="summary-table">
                <thead></thead>
                <tbody></tbody>
            </table>
        </div>        
    );
};

export default SummaryTable;
