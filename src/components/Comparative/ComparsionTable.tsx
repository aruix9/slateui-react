import React, { useEffect, useRef } from 'react'

// import "./Comparison.css";
interface ComparisonTableProps {
  inputData: Record<string, any> // Adjust the type based on your actual input data structure
}

const ComparisonTable: React.FC<ComparisonTableProps> = ({ inputData }) => {
  const tableRef = useRef<HTMLTableElement | null>(null)

  const createTableHeader = (inputData: Record<string, any>) => {
    const tableHeader = tableRef.current?.querySelector('thead')
    if (tableHeader) {
      tableHeader.innerHTML = ''
      const row = document.createElement('tr')
      for (const key in inputData) {
        if (key !== 'by_scenarios') {
          const header = document.createElement('th')
          header.textContent = key
          if (key === 'PROJECTION' || key === 'EXERCISE' || key === 'TOTALS') {
            header.className = 'sticky'
            header.style.backgroundColor = '#8F99A8'
          }
          row.appendChild(header)
        }
      }
      tableHeader.appendChild(row)
    }
  }

  const createTableRows = (inputData: Record<string, any>) => {
    const tableBody = tableRef.current?.querySelector('tbody')
    if (tableBody) {
      tableBody.innerHTML = ''
      const metrics = inputData.PROJECTION
      const exercises_count = inputData.EXERCISE.filter(
        (value: any, index: any, self: any) => self.indexOf(value) === index
      ).length

      inputData.PROJECTION.forEach((projection: string, index: number) => {
        const row = document.createElement('tr')

        // Only create a cell for `PROJECTION` the first time a unique value appears
        const cell = document.createElement('td')
        cell.className = 'sticky'
        if (index !== 0) cell.style.borderTop = 'none'
        cell.style.borderRight = '0.5px solid #ddd'
        cell.style.textAlign = 'left'
        if (index % exercises_count === 0) {
          if (index !== 0) {
            cell.style.borderTop = '3px solid #ddd'
          }
          cell.textContent = projection
        }
        row.appendChild(cell) // Add the merged cell

        // Add cells for the other columns (EXERCISE, VALUE)
        const keys = Object.keys(inputData).filter(
          (x) => x !== 'PROJECTION' && x !== 'by_scenarios'
        )
        keys.forEach((key) => {
          const cell = document.createElement('td')
          if (key !== 'EXERCISE') {
            if (metrics[index] !== 'D/C RATIO') {
              cell.textContent = parseInt(inputData[key][index]).toLocaleString(
                'en-us'
              )
            } else {
              cell.textContent = `${parseInt(
                inputData[key][index]
              ).toLocaleString('en-us')} %`
            }
          } else {
            cell.textContent = inputData[key][index]
          }
          if (index % exercises_count === 0 && index !== 0) {
            cell.style.borderTop = '3px solid #ddd'
          }
          if (key === 'EXERCISE') {
            cell.className = 'sticky'
            cell.style.textAlign = 'left'
          }
          if (key === 'TOTALS') {
            cell.className = 'sticky'
          }
          // Adjust background color based on conditions
          if (
            inputData['by_scenarios']
              .map((x: any) => x.replace(/ /g, '_'))
              .includes(inputData['EXERCISE'][index])
          ) {
            cell.style.backgroundColor = ['EXERCISE', 'TOTALS'].includes(key)
              ? '#D3D8DE'
              : '#DCE0E5'
          }
          if (metrics[index] === 'D/C RATIO' && key !== 'EXERCISE') {
            const value = inputData[key][index]
            cell.style.backgroundColor =
              value < 70
                ? 'rgba(251, 179, 96, 1)'
                : value < 90
                ? 'rgba(114, 202, 155, 1)'
                : 'rgba(250, 153, 156, 1)'
          }
          row.appendChild(cell)
        })

        // Append the completed row to the table body
        tableBody.appendChild(row)
      })
    }
  }

  const adjustSticky = () => {
    const table = tableRef.current
    if (table) {
      const rows = Array.from(table.rows) // Convert NodeList to Array for easier manipulation

      // Find all sticky columns in the first row (assuming headers are in the first row)
      rows.forEach((row) => {
        const stickyColumns = row.querySelectorAll('th.sticky, td.sticky')

        // Calculate left positions for each sticky column
        let leftPositions: number[] = []
        let cumulativeOffset = 0

        stickyColumns.forEach((cell, index) => {
          let maxWidth = 0

          // Iterate through each row to find the maximum width of the current column
          rows.forEach((row) => {
            const currentCell = row.cells[index]
            const cellWidth = currentCell.getBoundingClientRect().width
            maxWidth = Math.max(maxWidth, cellWidth)
          })

          // Store the cumulative offset for the current sticky column
          leftPositions.push(cumulativeOffset)
          cumulativeOffset += maxWidth
        })

        // Apply the left positions to each sticky column
        stickyColumns.forEach((cell, index) => {
          const stickyCell = cell as HTMLElement // Cast to HTMLElement
          stickyCell.style.left = leftPositions[index] + 'px'
          stickyCell.classList.add('sticky-adjust')
        })
      })
    }
  }

  useEffect(() => {
    createTableHeader(inputData)
    createTableRows(inputData)
    adjustSticky()
  }, [inputData]) // Re-run when inputData changes

  return (
    <table ref={tableRef} id='comparsion-summary-table'>
      <thead></thead>
      <tbody></tbody>
    </table>
  )
}

export default ComparisonTable
