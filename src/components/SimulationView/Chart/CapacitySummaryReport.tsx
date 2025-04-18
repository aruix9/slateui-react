import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import {
  LdTabs,
  LdTablist,
  LdTab,
  LdLoading,
} from '@emdgroup-liquid/liquid/dist/react'
import CapacitySummaryTable from './CapacitySummaryTable'
import CapacitySummaryChart from './CapacitySummaryChart'
import RangeSlider from './RangeSlider'

interface Rows {
  PROJECTION: string[]
  LINE: string[]
  TOTALS: number[]
  [key: string]: any // Allow dynamic keys
}

interface CapacitySummaryProps {
  CapacityData: any // Adjust as per your actual data structure
  ModifiedCapacityData: any // Adjust as per your actual data structure
  SimulationData: any // Adjust as per your actual data structure
  Lines: string[]
  demandInputLoadAggData: any
  demanInputdata: any
  optimazationResult: OptimizationResult
  simulationStatus: string
  editedInputData: any
  version: any
}

const defaultSummaryTableData: Rows = {
  PROJECTION: [],
  LINE: [],
  TOTALS: [],
}

interface LoadData2 {
  [key: string]: {
    [key: string]: number // Specify that the inner keys map to numbers
  }
}

interface LoadData {
  [key: string]: {
    [key: string]: any
  }
}

interface CapacityData {
  [key: string]: { [key: string]: any }
}

interface OptimizationResult {
  [key: string]: {
    DATE: string[]
    OPT_CAPACITY_SHIFTS: string[]
    OPT_CAPACITY_HOURS: string[]
  }
}

interface RatiosData {
  [line: string]: {
    initial_hours: number[]
    new_hours: number[]
    initial_capacity: number[]
    new_capacity: number[]
  }
}

interface LoadData3 {
  [key: string]: {
    [key: string]: (string | number)[] // Assuming the values are arrays of strings or numbers
  }
}

const getAggregatedLoadData = (
  outputData: LoadData,
  originalData: LoadData,
  Lines: string[]
) => {
  const finalData: Record<string, Record<string, number>> = {}
  for (const [line, lineData] of Object.entries(outputData)) {
    // Check if the line is included in the Lines array
    if (!Lines.includes(line)) {
      continue // Skip this line if it's not included
    }

    const aggLineData: Record<string, number> = {}
    for (const key in lineData) {
      const [date, month, day, unit, original] = key.split('_')
      if (
        ['HOURS', 'QTY', 'BATCHES', 'PALLETS', 'ABSORPTION'].includes(unit) &&
        original !== 'ORIGINAL'
      ) {
        const outputLength = lineData[key].length

        // Ensure original data has the same length as output data
        for (let i = originalData[line][key].length; i < outputLength; i++) {
          originalData[line][key].push(0)
        }
        const parts = key.split('_')
        const unit_type = parts.pop()
        const dates = parts.join('_')
        const checkOrignalValue = `${dates}_ORIGINAL_${unit_type}`
        const differences: number[] = lineData[key].map(
          (x: number, idx: number) =>
            x - (originalData[line][checkOrignalValue][idx] || 0)
        )
        const added: number = differences
          .filter((x: number) => x > 0)
          .reduce((acc: number, val: number) => acc + val, 0)
        const reduced: number = differences
          .filter((x: number) => x < 0)
          .reduce((acc: number, val: number) => acc + val, 0)
        aggLineData[`${key}_ADDED`] = added
        aggLineData[`${key}_REDUCED`] = -reduced // Store reduced as negative
      }
    }
    finalData[line] = aggLineData // Store aggregated data for the line
  }
  return finalData // Return the aggregated data
}

const getFirstDayOfMonth = (dateString: string) => {
  return dateString.substring(0, 8) + '01' // Replace the day with '01'
}

const CapacitySummaryReport: React.FC<CapacitySummaryProps> = ({
  CapacityData,
  ModifiedCapacityData,
  SimulationData,
  demandInputLoadAggData,
  optimazationResult,
  demanInputdata,
  Lines,
  simulationStatus,
  editedInputData,
  version,
}) => {
  const [sliderSelectedMinDate, setSliderSelectedMinDate] = useState(
    getFirstDayOfMonth(SimulationData.init_date)
  )
  const [sliderSelectedMaxDate, setSliderSelectedMaxDate] = useState(
    getFirstDayOfMonth(SimulationData.end_date)
  )
  const [selectedValues, setSelectedValues] = useState<
    'Years' | 'Quarters' | 'Months'
  >('Months')
  const [selectedValues1, setSelectedValues1] = useState<
    'Quantity' | 'Hours' | 'Batches'
  >('Hours')
  const [summaryTableData, setSummaryTableData] = useState<Rows>(
    defaultSummaryTableData
  )
  const [chartData, setChartData] = useState<any>({})
  const [loading, setLoading] = useState(true)

  const capacityFilterDetails = useMemo(() => {
    // Determine which capacities to use based on the existence of keys in ModifiedCapacityData
    const capacities: CapacityData =
      Object.keys(ModifiedCapacityData).length > 0
        ? ModifiedCapacityData
        : CapacityData

    // Filter capacities based on Lines
    const filteredCapacities = Object.keys(capacities).reduce((obj, key) => {
      if (Lines.includes(key)) {
        obj[key] = capacities[key]
      }
      return obj
    }, {} as CapacityData)

    // If filteredCapacities is empty, return the original CapacityData
    return Object.keys(filteredCapacities).length > 0
      ? filteredCapacities
      : CapacityData
  }, [ModifiedCapacityData, CapacityData, Lines, version, selectedValues1])

  const getLoadOriginalAggregated = useMemo(() => {
    const data: LoadData3 = demanInputdata
    const finalData: Record<string, Record<string, number>> = {}
    for (const [line, lineData] of Object.entries(data)) {
      // Check if the line is included in the Lines array
      if (Lines.includes(line)) {
        const aggLineData: Record<string, number> = {}
        for (const key in lineData) {
          const [date, month, day, unit, original] = key.split('_')
          if (
            ['HOURS', 'QTY', 'BATCHES', 'PALLETS', 'ABSORPTION'].includes(unit)
          ) {
            // Ensure lineData[key] is an array before calling reduce
            const values = lineData[key] as (string | number)[] // Cast to appropriate type

            aggLineData[key] = values.reduce(
              (acc: number, val: string | number) => {
                // Handle both string and number types
                const numericValue =
                  typeof val === 'string' ? parseInt(val) : val
                return acc + (isNaN(numericValue) ? 0 : numericValue) // Sum only valid numbers
              },
              0
            )
          }
        }
        finalData[line] = aggLineData
      }
    }
    return finalData // Return the aggregated data
  }, [demanInputdata, Lines, selectedValues1])

  const getLoadOutputAggregated = useMemo(() => {
    const data: LoadData3 = editedInputData.hasOwnProperty(Lines[0])
      ? editedInputData
      : demanInputdata
    const finalData: Record<string, Record<string, number>> = {}

    for (const [line, lineData] of Object.entries(data)) {
      // Check if the line is included in the Lines array
      if (Lines.includes(line)) {
        const aggLineData: Record<string, number> = {}
        for (const key in lineData) {
          const [date, month, day, unit, original] = key.split('_')
          if (
            ['HOURS', 'QTY', 'BATCHES', 'PALLETS', 'ABSORPTION'].includes(unit)
          ) {
            // Ensure lineData[key] is an array before calling reduce
            const values = lineData[key] as (string | number)[] // Cast to appropriate type
            aggLineData[key] = values.reduce(
              (acc: number, val: string | number) => {
                // Handle both string and number types
                const numericValue =
                  typeof val === 'string' ? parseInt(val) : val
                return acc + (isNaN(numericValue) ? 0 : numericValue) // Sum only valid numbers
              },
              0
            )
          }
        }
        finalData[line] = aggLineData
      }
    }

    return finalData // Return the aggregated data
  }, [demanInputdata, Lines, editedInputData, version, selectedValues1])

  const getOptimizationResults = useMemo(() => {
    return Object.keys(optimazationResult).reduce((obj, key) => {
      if (Lines.includes(key)) {
        obj[key] = optimazationResult[key]
      }
      return obj
    }, {} as OptimizationResult)
  }, [optimazationResult, Lines, version, selectedValues1])

  const aggregatedData = () => {
    const modifiedData = editedInputData.hasOwnProperty(Lines[0])
      ? editedInputData
      : demanInputdata
    return getAggregatedLoadData(modifiedData, demanInputdata, Lines)
  }

  const getAllDates = () => {
    let start = new Date(SimulationData.init_date)
    const endDate = new Date(SimulationData.end_date)
    endDate.setUTCHours(12) // Adjust the end date to include the full day
    const dates: string[] = []

    // Ensure we start at the first day of the month
    start.setUTCDate(1)

    while (start <= endDate) {
      // Check if start is less than or equal to endDate
      const displayMonth = start.getUTCMonth() + 1 // Get the month (0-indexed)
      dates.push(
        [
          start.getUTCFullYear(), // Year
          displayMonth.toString().padStart(2, '0'), // Month, padded with zero
          '01', // Always add the first day of the month
        ].join('-')
      )

      // Move to the first day of the next month
      start.setUTCMonth(start.getUTCMonth() + 1)
    }

    return dates
  }

  const getDatesGroups = () => {
    const all_dates = getAllDates()
    const filtered_dates = all_dates.filter(
      (date) => date >= sliderSelectedMinDate && date <= sliderSelectedMaxDate
    ) // Use direct comparison

    const final_data: Record<string, string[]> = {} // Initialize final_data

    const getQuarter = (month: string): string => {
      const monthNum = parseInt(month)
      if (monthNum <= 3) {
        return 'Q1'
      } else if (monthNum <= 6) {
        return 'Q2'
      } else if (monthNum <= 9) {
        return 'Q3'
      } else {
        return 'Q4'
      }
    }

    // Check the single selected value
    if (selectedValues === 'Quarters') {
      for (const date of filtered_dates) {
        const [year, month] = date.split('-')
        const quarter = `${year}-${getQuarter(month)}`
        if (quarter in final_data) {
          final_data[quarter].push(date)
        } else {
          final_data[quarter] = [date]
        }
      }
    } else if (selectedValues === 'Years') {
      for (const date of filtered_dates) {
        const [year] = date.split('-')
        const year_str = `Year ${year}`
        if (year_str in final_data) {
          final_data[year_str].push(date)
        } else {
          final_data[year_str] = [date]
        }
      }
    } else {
      for (const date of filtered_dates) {
        final_data[date] = [date]
      }
    }

    return final_data
  }

  const getGraphData = () => {
    const loadGraphData = getLoadGraph()
    const capacityGraphData = getCapacityGraph()
    const optimalGraphData = getOptimalGraph()
    const selectedFilter = selectedValues1
    setChartData({
      selectedFilter,
      loadGraphData,
      capacityGraphData,
      optimalGraphData,
    })
  }

  const getLoadGraph = () => {
    const originals: Record<
      string,
      Record<string, number>
    > = getLoadOriginalAggregated
    const currents: Record<
      string,
      Record<string, number>
    > = getLoadOutputAggregated
    const metric: string =
      selectedValues1 === 'Hours'
        ? 'HOURS'
        : selectedValues1 === 'Quantity'
        ? 'QTY'
        : 'BATCHES'
    const labelUnit: string = selectedValues
    const dateGroups: Record<string, string[]> = getDatesGroups()

    const finalData: { values: number[]; dates: string[]; labels: string[] } = {
      values: [],
      dates: [],
      labels: [],
    }

    for (const [group, months] of Object.entries(dateGroups)) {
      let currentTotal: number = 0
      let originalTotal: number = 0

      for (const month of months) {
        for (const line in currents) {
          const newformatMonth = month.replace(/-/g, '_')
          currentTotal += currents[line]?.[`${newformatMonth}_${metric}`] ?? 0
          originalTotal += originals[line]?.[`${newformatMonth}_${metric}`] ?? 0
        }
      }

      let formattedGroup: string = group
      if (labelUnit === 'Years') {
        formattedGroup = `${group.split(' ')[1]}-01-01`
      } else if (labelUnit === 'Quarters') {
        const [year, quarter] = group.split('-')
        const quarterStartMonth: Record<string, string> = {
          Q1: '01',
          Q2: '04',
          Q3: '07',
          Q4: '10',
        }
        formattedGroup = `${year}-${quarterStartMonth[quarter]}-01`
      }
      const difference = currentTotal - originalTotal
      if (difference > 0) {
        finalData.values.push(originalTotal, difference)
        finalData.dates.push(formattedGroup, formattedGroup)
        finalData.labels.push('Load', `Extra ${labelUnit}`)
      } else if (difference < 0) {
        finalData.values.push(currentTotal, difference)
        finalData.dates.push(formattedGroup, formattedGroup)
        finalData.labels.push('Load', `Reduced ${labelUnit}`)
      } else {
        finalData.values.push(currentTotal)
        finalData.dates.push(formattedGroup)
        finalData.labels.push('Load')
      }
    }

    // Compute min/max date based on selection
    const [sliderMinYear, sliderMinMonth] = sliderSelectedMinDate.split('-')
    const [sliderMaxYear, sliderMaxMonth] = sliderSelectedMaxDate.split('-')

    let minDate: string, maxDate: string

    if (labelUnit === 'Months') {
      minDate = sliderSelectedMinDate
      maxDate = sliderSelectedMaxDate
    } else if (labelUnit === 'Quarters') {
      const adjustToQuarterStart = (month: number): string =>
        month < 4 ? '01' : month < 7 ? '04' : month < 10 ? '07' : '10'

      minDate = `${sliderMinYear}-${adjustToQuarterStart(
        parseInt(sliderMinMonth)
      )}-01`
      maxDate = `${sliderMaxYear}-${adjustToQuarterStart(
        parseInt(sliderMaxMonth)
      )}-01`
    } else {
      minDate = `${sliderMinYear}-01-01`
      maxDate = `${sliderMaxYear}-01-01`
    }

    // Filter final data based on date range
    const indexesToKeep = finalData.dates
      .map((date, idx) => (date >= minDate && date <= maxDate ? idx : -1))
      .filter((idx) => idx !== -1)
    return Object.fromEntries(
      Object.entries(finalData).map(([key, values]) => [
        key,
        (values as any[]).filter((_, idx) => indexesToKeep.includes(idx)),
      ])
    )
  }

  const getCapacityGraph = () => {
    const capacities: CapacityData = capacityFilterDetails
    const dates_groups = getDatesGroups()
    const final_data: {
      dates: string[]
      productive_capacity: number[]
      min_capacity: number[]
      max_capacity: number[]
    } = {
      dates: [],
      productive_capacity: [],
      min_capacity: [],
      max_capacity: [],
    }

    if (selectedValues1 === 'Hours') {
      for (const [group, months] of Object.entries(dates_groups)) {
        let actual_capacity = 0
        let min_capacity = 0
        let max_capacity = 0

        for (const month of months) {
          for (const line of Object.keys(capacities)) {
            const index = capacities[line]['DATE'].indexOf(month)
            if (index !== -1) {
              actual_capacity +=
                capacities[line]['PRODUCTIVE_CAPACITY_HOURS'][index]
              min_capacity += Math.round(
                capacities[line]['MIN_SHIFTS'][index] *
                  capacities[line]['HOURS_PER_SHIFT'][index] *
                  capacities[line]['OEE'][index]
              )
              max_capacity += Math.round(
                capacities[line]['MAX_SHIFTS'][index] *
                  capacities[line]['HOURS_PER_SHIFT'][index] *
                  capacities[line]['OEE'][index]
              )
            }
          }
        }

        let group_formatted: string = group
        if (selectedValues === 'Years') {
          const splitGroup = group.split(' ')
          if (splitGroup.length > 1) {
            group_formatted = `${splitGroup[1]}-01-01`
          }
        } else if (selectedValues === 'Quarters') {
          const [year, quarter] = group.split('-')
          const monthMap: Record<string, string> = {
            Q1: '01',
            Q2: '04',
            Q3: '07',
            Q4: '10',
          }
          const month = monthMap[quarter as keyof typeof monthMap] || '01'
          group_formatted = `${year}-${month}-01`
        }

        final_data.dates.push(group_formatted)
        final_data.productive_capacity.push(actual_capacity)
        final_data.min_capacity.push(min_capacity)
        final_data.max_capacity.push(max_capacity)
      }
    }
    return final_data
  }

  const getOptimalGraph = useCallback(() => {
    const capacities: CapacityData = capacityFilterDetails
    const final_data: { dates: string[]; values: number[] } = {
      dates: [],
      values: [],
    }

    const date_groups = getDatesGroups()

    if (selectedValues1 === 'Hours') {
      const data: OptimizationResult = getOptimizationResults
      const any_line_has_opt = Object.keys(data).some(
        (x) => data[x]['OPT_CAPACITY_HOURS'].length > 0
      )

      const simulation_status = simulationStatus

      if (simulation_status !== 'SUCCESS' || !any_line_has_opt) {
        return final_data
      }

      for (const [group, months] of Object.entries(date_groups)) {
        let productive_capacity = 0

        for (const month of months) {
          for (const line of Object.keys(data)) {
            const index =
              data[line]['OPT_CAPACITY_HOURS'].length === 0
                ? capacities[line]['DATE'].indexOf(month)
                : data[line]['DATE'].indexOf(month)

            productive_capacity +=
              index === -1
                ? 0
                : data[line]['OPT_CAPACITY_HOURS'].length === 0
                ? capacities[line]['PRODUCTIVE_CAPACITY_HOURS'][index]
                : data[line]['OPT_CAPACITY_HOURS'][index]
          }
        }

        let group_formatted = group

        if (selectedValues === 'Years') {
          const splitGroup = group.split(' ')
          if (splitGroup.length > 1) {
            group_formatted = `${splitGroup[1]}-01-01`
          }
        } else if (selectedValues === 'Quarters') {
          const [year, quarter] = group.split('-')
          const monthMap: Record<string, string> = {
            Q1: '01',
            Q2: '04',
            Q3: '07',
            Q4: '10',
          }
          const month = monthMap[quarter as keyof typeof monthMap] || '01'
          group_formatted = `${year}-${month}-01`
        }

        final_data.dates.push(group_formatted)
        final_data.values.push(productive_capacity)
      }
    }

    return final_data
  }, [selectedValues, selectedValues1])

  const getSummaryTableReport = () => {
    const metrics = [
      'Demand Volume (Qty)',
      'Demand Volume (Batches)',
      'Demand Volume (Pallets)',
      'Demand Load (h)',
      'Initial (h)',
      'Added (h)',
      'Removed (h)',
      'Min Capacity (h)',
      'Max Capacity (h)',
      'Current Installed Capacity (h)',
      'Suggested Capacity (h)',
      'Initial D/C Ratio',
      'Initial Absorption (€)',
      'New D/C Ratio',
      'New Absorption (€)',
    ]

    const load_data_agg = getLoadOutputAggregated
    const load_data_original_agg = getLoadOriginalAggregated
    const load_data_differences_agg = aggregatedData()
    const capacity_data = capacityFilterDetails
    const optimization_data = getOptimizationResults
    const lines = Object.keys(load_data_agg)
    const dates = getAllDates()

    const min_date_index = dates.indexOf(sliderSelectedMinDate)
    const max_date_index = dates.indexOf(sliderSelectedMaxDate)

    let rows: Rows = {
      PROJECTION: [],
      LINE: [],
      TOTALS: [],
    }

    for (let i = min_date_index; i <= max_date_index; i += 1) {
      rows[dates[i]] = []
    }

    const ratios_data: RatiosData = {}
    for (let line of lines) {
      ratios_data[line] = {
        initial_hours: [],
        new_hours: [],
        initial_capacity: [],
        new_capacity: [],
      }
    }

    for (const metric of metrics) {
      let totals = Array(dates.length).fill(0)
      for (const [line, line_data] of Object.entries(load_data_agg)) {
        let line_total = 0
        rows['PROJECTION'].push(metric)
        rows['LINE'].push(line)
        for (let i = min_date_index; i <= max_date_index; i += 1) {
          let value
          let capaDateIndex = capacity_data[line].DATE.indexOf(dates[i])
          switch (metric) {
            case 'Demand Volume (Qty)':
              value = load_data_agg[line][`${dates[i].replace(/-/g, '_')}_QTY`]
              break
            case 'Demand Volume (Batches)':
              value =
                load_data_agg[line][`${dates[i].replace(/-/g, '_')}_BATCHES`]
              break
            case 'Demand Volume (Pallets)':
              value =
                load_data_agg[line][`${dates[i].replace(/-/g, '_')}_PALLETS`]
              break
            case 'Demand Load (h)':
              value =
                load_data_agg[line][`${dates[i].replace(/-/g, '_')}_HOURS`]
              ratios_data[line]['new_hours'].push(value)
              break
            case 'Initial (h)':
              value =
                load_data_original_agg[line][
                  `${dates[i].replace(/-/g, '_')}_HOURS`
                ]
              ratios_data[line]['initial_hours'].push(value)
              break
            case 'Added (h)':
              value =
                load_data_differences_agg[line][
                  `${dates[i].replace(/-/g, '_')}_HOURS_ADDED`
                ]
              break
            case 'Removed (h)':
              value =
                load_data_differences_agg[line][
                  `${dates[i].replace(/-/g, '_')}_HOURS_REDUCED`
                ]
              break
            case 'Min Capacity (h)':
              value =
                capacity_data[line]['MIN_SHIFTS'][capaDateIndex] *
                capacity_data[line]['HOURS_PER_SHIFT'][capaDateIndex] *
                capacity_data[line]['OEE'][capaDateIndex]
              break
            case 'Max Capacity (h)':
              value =
                capacity_data[line]['MAX_SHIFTS'][capaDateIndex] *
                capacity_data[line]['HOURS_PER_SHIFT'][capaDateIndex] *
                capacity_data[line]['OEE'][capaDateIndex]
              break
            case 'Current Installed Capacity (h)':
              value =
                capacity_data[line]['PRODUCTIVE_CAPACITY_HOURS'][capaDateIndex]
              ratios_data[line]['initial_capacity'].push(value)
              break
            case 'Suggested Capacity (h)':
              value =
                optimization_data[line]?.['OPT_CAPACITY_HOURS']?.length === 0
                  ? capacity_data[line]?.['PRODUCTIVE_CAPACITY_HOURS'][
                      capaDateIndex
                    ]
                  : optimization_data[line]?.['OPT_CAPACITY_HOURS']?.[
                      capaDateIndex
                    ] || 0 // Provide a fallback if undefined
              ratios_data[line]['new_capacity'].push(value)
              break
            case 'Initial D/C Ratio':
              const initial_load =
                load_data_original_agg[line][
                  `${dates[i].replace(/-/g, '_')}_HOURS`
                ]
              const initial_capacity =
                capacity_data[line]['PRODUCTIVE_CAPACITY_HOURS'][capaDateIndex]
              rows[dates[i]].push(
                initial_capacity === 0 ? 0 : initial_load / initial_capacity
              )
              break
            case 'Initial Absorption (€)':
              value =
                load_data_original_agg[line][
                  `${dates[i].replace(/-/g, '_')}_ABSORPTION`
                ]
              break
            case 'New D/C Ratio':
              const new_load =
                load_data_agg[line][`${dates[i].replace(/-/g, '_')}_HOURS`]
              const new_capacity =
                optimization_data[line]?.['OPT_CAPACITY_HOURS']?.length === 0
                  ? capacity_data[line]['PRODUCTIVE_CAPACITY_HOURS']?.[
                      capaDateIndex
                    ]
                  : optimization_data[line]?.['OPT_CAPACITY_HOURS']?.[i] || 0

              rows[dates[i]].push(
                new_capacity === 0 ? 0 : new_load / new_capacity
              )
              break
            case 'New Absorption (€)':
              value =
                load_data_agg[line][`${dates[i].replace(/-/g, '_')}_ABSORPTION`]
              break
          }
          if (!metric.includes('Ratio')) {
            rows[dates[i]].push(value)
            totals[i] += value
            line_total += value
          }
        }
        if (metric === 'Initial D/C Ratio') {
          const line_total_initial_capacity = ratios_data[line][
            'initial_capacity'
          ].reduce((acc, val) => acc + val, 0)
          const line_total_initial_load = ratios_data[line][
            'initial_hours'
          ].reduce((acc, val) => acc + val, 0)
          rows['TOTALS'].push(
            line_total_initial_capacity === 0
              ? 0
              : line_total_initial_load / line_total_initial_capacity
          )
        } else if (metric === 'New D/C Ratio') {
          const line_total_new_capacity = ratios_data[line][
            'new_capacity'
          ].reduce((acc, val) => acc + val, 0)
          const line_total_new_load = ratios_data[line]['new_hours'].reduce(
            (acc, val) => acc + val,
            0
          )
          rows['TOTALS'].push(
            line_total_new_capacity === 0
              ? 0
              : line_total_new_load / line_total_new_capacity
          )
        } else {
          rows['TOTALS'].push(line_total)
        }
      }
      rows['PROJECTION'].push(metric)
      rows['LINE'].push('TOTAL')
      for (let i = min_date_index; i <= max_date_index; i += 1) {
        if (metric === 'Initial D/C Ratio') {
          var total_initial_hours_date = 0
          var total_initial_capacity_date = 0
          for (let line of Object.keys(ratios_data)) {
            total_initial_hours_date += ratios_data[line]['initial_hours'][i]
            total_initial_capacity_date +=
              ratios_data[line]['initial_capacity'][i]
          }
          rows[dates[i]].push(
            total_initial_capacity_date === 0
              ? 0
              : total_initial_hours_date / total_initial_capacity_date
          )
        } else if (metric === 'New D/C Ratio') {
          var total_new_hours_date = 0
          var total_new_capacity_date = 0
          for (let line of Object.keys(ratios_data)) {
            total_new_hours_date += ratios_data[line]['new_hours'][i]
            total_new_capacity_date += ratios_data[line]['new_capacity'][i]
          }
          rows[dates[i]].push(
            total_new_capacity_date === 0
              ? 0
              : total_new_hours_date / total_new_capacity_date
          )
        } else {
          rows[dates[i]].push(totals[i])
        }
      }
      if (metric === 'Initial D/C Ratio') {
        var total_initial_hours = 0
        var total_initial_capacity = 0
        for (const [line, agg] of Object.entries(ratios_data)) {
          total_initial_hours += agg['initial_hours'].reduce(
            (acc, val) => acc + val,
            0
          )
          total_initial_capacity += agg['initial_capacity'].reduce(
            (acc, val) => acc + val,
            0
          )
        }
        rows['TOTALS'].push(
          total_initial_capacity === 0
            ? 0
            : total_initial_hours / total_initial_capacity
        )
      } else if (metric === 'New D/C Ratio') {
        var total_new_hours = 0
        var total_new_capacity = 0
        for (const [line, agg] of Object.entries(ratios_data)) {
          total_new_hours += agg['new_hours'].reduce((acc, val) => acc + val, 0)
          total_new_capacity += agg['new_capacity'].reduce(
            (acc, val) => acc + val,
            0
          )
        }
        rows['TOTALS'].push(
          total_new_capacity === 0 ? 0 : total_new_hours / total_new_capacity
        )
      } else {
        rows['TOTALS'].push(totals.reduce((acc, value) => acc + value, 0))
      }
    }

    if (selectedValues !== 'Months') {
      const date_groups = getDatesGroups()
      const new_rows: any = {}

      new_rows['PROJECTION'] = rows['PROJECTION']
      new_rows['LINE'] = rows['LINE']
      new_rows['TOTALS'] = rows['TOTALS']

      const initial_dc_ratio_indexes = rows['PROJECTION']
        .map((x, idx) => (x === 'Initial D/C Ratio' ? idx : -1))
        .filter((x) => x !== -1)
      const initial_hours_indexes = rows['PROJECTION']
        .map((x, idx) => (x === 'Initial (h)' ? idx : -1))
        .filter((x) => x !== -1)
      const initial_capacity_indexes = rows['PROJECTION']
        .map((x, idx) => (x === 'Current Installed Capacity (h)' ? idx : -1))
        .filter((x) => x !== -1)

      const new_dc_ratio_indexes = rows['PROJECTION']
        .map((x, idx) => (x === 'New D/C Ratio' ? idx : -1))
        .filter((x) => x !== -1)
      const new_hours_indexes = rows['PROJECTION']
        .map((x, idx) => (x === 'Demand Load (h)' ? idx : -1))
        .filter((x) => x !== -1)
      const new_capacity_indexes = rows['PROJECTION']
        .map((x, idx) => (x === 'Suggested Capacity (h)' ? idx : -1))
        .filter((x) => x !== -1)

      for (const [group, months] of Object.entries(date_groups)) {
        new_rows[group] = Array(new_rows['PROJECTION'].length).fill(0)
        for (const month of months) {
          new_rows[group] = new_rows[group].map(
            (x: number, idx: any) => x + rows[month][idx]
          )
        }
        initial_dc_ratio_indexes.forEach((index, pos) => {
          new_rows[group][index] =
            new_rows[group][initial_capacity_indexes[pos]] === 0
              ? 0
              : new_rows[group][initial_hours_indexes[pos]] /
                new_rows[group][initial_capacity_indexes[pos]]
        })
        new_dc_ratio_indexes.forEach((index, pos) => {
          new_rows[group][index] =
            new_rows[group][new_capacity_indexes[pos]] === 0
              ? 0
              : new_rows[group][new_hours_indexes[pos]] /
                new_rows[group][new_capacity_indexes[pos]]
        })
      }
      rows = new_rows
    }

    return rows
  }

  const getsummaryTableFilter = () => {
    let rows = getSummaryTableReport()

    const selectedProjections = [
      'Demand Volume (Qty)',
      'Demand Volume (Batches)',
      'Demand Volume (Pallets)',
      'Demand Load (h)',
      'Initial (h)',
      'Added (h)',
      'Removed (h)',
      'Min Capacity (h)',
      'Max Capacity (h)',
      'Current Installed Capacity (h)',
      'Initial D/C Ratio',
      'Initial Absorption (€)',
      'New D/C Ratio',
      'New Absorption (€)',
    ]

    const selected_projections_index = rows['PROJECTION']
      .map((item, index) => (selectedProjections.includes(item) ? index : -1)) // Map each item to its index if it's in secondList
      .filter((index) => index !== -1)

    for (let key in rows) {
      rows[key] = rows[key].filter((_: unknown, index: number) =>
        selected_projections_index.includes(index)
      )
    }

    setSummaryTableData(rows)
  }

  const handleSliderChange = (value: string[]) => {
    const formatDate = (date: string) => {
      const [month, year] = date.split('/')
      return `${year}-${month}-01`
    }

    const minDate = formatDate(value[0])
    const maxDate = formatDate(value[1])

    setSliderSelectedMinDate(minDate) // Set the minimum date
    setSliderSelectedMaxDate(maxDate) // Set the maximum date
  }

  const handleTabClick1 = (value: 'Quantity' | 'Hours' | 'Batches') => {
    setSelectedValues1(value)
  }

  const handleTabClick = (value: 'Years' | 'Quarters' | 'Months') => {
    setSelectedValues(value)
  }

  useEffect(() => {
    setLoading(true)
    getsummaryTableFilter()
    getGraphData()
    setLoading(false)
  }, [
    ModifiedCapacityData,
    CapacityData,
    Lines,
    getLoadOriginalAggregated,
    getLoadOutputAggregated,
    selectedValues,
    selectedValues1,
    capacityFilterDetails,
    sliderSelectedMinDate,
    sliderSelectedMaxDate,
    editedInputData,
    version,
  ])

  useEffect(() => {}, [
    ModifiedCapacityData,
    CapacityData,
    Lines,
    editedInputData,
    version,
  ])

  const tabsRef = useRef(null)

  return (
    <div className='w-full overflow-hidden'>
      <div className='flex flex-col md:flex-row gap-10 items-center'>
        <div className='chartMetric md:w-1/2'>
          <div className='mb-4 flex justify-stretch button-tab-group btn-sm'>
            <button
              type='button'
              className={`${
                selectedValues1 === 'Quantity' && 'active'
              } bg-primary`}
              onClick={() => handleTabClick1('Quantity')}
            >
              Quantity
            </button>
            <button
              type='button'
              className={`${
                selectedValues1 === 'Hours' && 'active'
              } bg-primary`}
              onClick={() => handleTabClick1('Hours')}
            >
              Hours
            </button>
            <button
              type='button'
              className={`${
                selectedValues1 === 'Batches' && 'active'
              } bg-primary`}
              onClick={() => handleTabClick1('Batches')}
            >
              Batches
            </button>
          </div>
          <div className='flex justify-stretch button-tab-group btn-sm'>
            <button
              type='button'
              className={`${
                selectedValues === 'Months' && 'active'
              } bg-primary`}
              onClick={() => handleTabClick('Months')}
            >
              Months
            </button>
            <button
              type='button'
              className={`${
                selectedValues === 'Quarters' && 'active'
              } bg-primary`}
              onClick={() => handleTabClick('Quarters')}
            >
              Quarters
            </button>
            <button
              type='button'
              className={`${selectedValues === 'Years' && 'active'} bg-primary`}
              onClick={() => handleTabClick('Years')}
            >
              Years
            </button>
          </div>
        </div>
        <div className='md:w-1/2'>
          {SimulationData && (
            <RangeSlider
              simulationData={SimulationData}
              handleSliderChange={handleSliderChange}
            />
          )}
        </div>
      </div>
      {loading ? <LdLoading /> : <CapacitySummaryChart inputData={chartData} />}
      <div>
        {loading ? (
          <div>
            <LdLoading />
          </div>
        ) : (
          <CapacitySummaryTable inputData={summaryTableData} />
        )}
      </div>
    </div>
  )
}

export default CapacitySummaryReport
