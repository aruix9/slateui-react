import React, { useCallback, useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import axios from 'axios'
import { display_notification } from '../../global/notification'

import ComparisonFilter from './ComparisonFilter'
import { LdProgress, LdLoading } from '@emdgroup-liquid/liquid/dist/react'

import './Comparison.css'

const apiUrl = process.env.REACT_APP_API_URL

interface Result {
  LINE: string[]
  DATE: string[]
  HOURS: number[]
  QTY: number[]
  BATCHES: number[]
  PALLETS: number[]
  ABSORPTION: number[]
}

interface BaselineCapacity {
  simulation_id: string
  line: string
  date: string
  capacity_hours: number
  capacity_shifts: number | null // Allow null for capacity_shifts
}

const results: any = {
  simulation_id: [],
  LINE: [],
  DATE: [],
  HOURS_PER_SHIFT: [],
  MAX_SHIFTS: [],
  MIN_SHIFTS: [],
  OEE: [],
  PLANNED_CAPACITY_HOURS: [],
  PRODUCTIVE_CAPACITY_HOURS: [],
}

interface BaselineEntry {
  simulation_id: string
  line: string
  date: string
  capacity_hours: number
  capacity_shifts: number | null // Allow null for capacity_shifts
}

const FilterByObjectsKeyWithLines = (
  data: Record<string, any>,
  baseline_load: any[],
  simulation_id: string
): Result => {
  const result: any = {
    simulation_id: [],
    LINE: [],
    DATE: [],
    HOURS: [],
    QTY: [],
    BATCHES: [],
    PALLETS: [],
    ABSORPTION: [],
  }

  const lines = Object.keys(data)

  lines.forEach((line) => {
    if (data[line]) {
      const repeatCount = data[line].DATE ? data[line].DATE.length : 0

      for (let i = 0; i < repeatCount; i++) {
        result.LINE.push(line)
        result.simulation_id.push(simulation_id)
      }

      Object.keys(result).forEach((key) => {
        if (data[line][key]) {
          result[key] = result[key].concat(data[line][key]) // Combine data for each key
        }
      })
    }
  })

  baseline_load.forEach((base) => {
    if (lines.includes(base.line) && base.simulation_id === simulation_id) {
      result.LINE.push(base.line)
      result.simulation_id.push(base.simulation_id)
      result.DATE.push(base.date)
      result.HOURS.push(base.hours)
      result.QTY.push(base.qty)
      result.BATCHES.push(base.batches)
      result.PALLETS.push(base.pallets)
      result.ABSORPTION.push(base.absorption)
    }
  })

  return result
}

const combineResults = (result1: any, result2: any): Result => {
  const combinedResult: any = {
    simulation_id: result1.simulation_id.concat(result2.simulation_id),
    line: result1.LINE.concat(result2.LINE),
    date: result1.DATE.concat(result2.DATE),
    hours: result1.HOURS.concat(result2.HOURS),
    qty: result1.QTY.concat(result2.QTY),
    batches: result1.BATCHES.concat(result2.BATCHES),
    pallets: result1.PALLETS.concat(result2.PALLETS),
    absorption: result1.ABSORPTION.concat(result2.ABSORPTION),
  }

  return combinedResult
}

const baseLineCapacityCombine = (
  result1: BaselineCapacity[],
  simulationId1: string,
  result2: BaselineCapacity[],
  simulationId2: string
): BaselineCapacity[] => {
  // Update the simulation_id for each result in both arrays
  const updatedResult1 = result1.map((item) => ({
    ...item,
    simulation_id: simulationId1,
  }))
  const updatedResult2 = result2.map((item) => ({
    ...item,
    simulation_id: simulationId2,
  }))

  // Combine the updated results
  return [...updatedResult1, ...updatedResult2]
}

const exercisesCapacityCombine = (result1: any, result2: any): any => {
  const combinedResult: any = {
    simulation_id: result1.simulation_id.concat(result2.simulation_id),
    LINE: result1.LINE.concat(result2.LINE),
    DATE: result1.DATE.concat(result2.DATE),
    HOURS_PER_SHIFT: result1.HOURS_PER_SHIFT.concat(result2.HOURS_PER_SHIFT),
    MAX_SHIFTS: result1.MAX_SHIFTS.concat(result2.MAX_SHIFTS),
    MIN_SHIFTS: result1.MIN_SHIFTS.concat(result2.MIN_SHIFTS),
    OEE: result1.OEE.concat(result2.OEE),
    PLANNED_CAPACITY_HOURS: result1.PLANNED_CAPACITY_HOURS.concat(
      result2.PLANNED_CAPACITY_HOURS
    ),
    PRODUCTIVE_CAPACITY_HOURS: result1.PRODUCTIVE_CAPACITY_HOURS.concat(
      result2.PRODUCTIVE_CAPACITY_HOURS
    ),
  }

  return combinedResult
}

const f_parse_capacity_data = (
  data: Record<string, any>,
  simulation_id: string
) => {
  const results: any = {
    simulation_id: [],
    LINE: [],
    DATE: [],
    HOURS_PER_SHIFT: [],
    MAX_SHIFTS: [],
    MIN_SHIFTS: [],
    OEE: [],
    PLANNED_CAPACITY_HOURS: [],
    PRODUCTIVE_CAPACITY_HOURS: [],
  }

  const lines = Object.keys(data)

  lines.forEach((line) => {
    if (data[line]) {
      const repeatCount = data[line].DATE ? data[line].DATE.length : 0

      for (let i = 0; i < repeatCount; i++) {
        results.LINE.push(line)
        results.simulation_id.push(simulation_id)
      }

      Object.keys(results).forEach((key) => {
        if (data[line][key]) {
          results[key] = results[key].concat(data[line][key])
        }
      })
    }
  })

  return results
}

const q_get_optimization_results = (
  data: Record<string, any>,
  simulation_id: string
) => {
  const results: any = {
    simulation_id: [],
    LINE: [],
    DATE: [],
    OPT_CAPACITY_SHIFTS: [],
    OPT_CAPACITY_HOURS: [],
  }
  const dataLines = Object.keys(data)

  dataLines.forEach((line) => {
    if (data[line]) {
      const repeatCount = data[line].DATE ? data[line].DATE.length : 0

      for (let i = 0; i < repeatCount; i++) {
        results.LINE.push(line)
        results.simulation_id.push(simulation_id)
      }

      Object.keys(results).forEach((key) => {
        if (data[line][key]) {
          results[key] = results[key].concat(data[line][key])
        }
      })
    }
  })

  return results
}

const optimizationCapacityCombine = (
  result1: { [key: string]: any[] },
  result2: { [key: string]: any[] }
): { [key: string]: any[] } => {
  const combinedResults: { [key: string]: any[] } = {}

  // Get all unique keys from both results
  const keys = new Set([...Object.keys(result1), ...Object.keys(result2)])

  // Iterate over each key and combine the arrays
  keys.forEach((key) => {
    combinedResults[key] = [
      ...(Array.isArray(result1[key]) ? result1[key] : []),
      ...(Array.isArray(result2[key]) ? result2[key] : []),
    ]
  })

  return combinedResults
}

function getFinalCapacityData(capacity_data_all: any, baseline_capacity: any) {
  if (!capacity_data_all) {
    capacity_data_all = {
      simulation_id: [],
      line: [],
      date: [],
      capacity_hours: [],
      capacity_shifts: [],
    }
  }

  const baselineCapacityArray = baseline_capacity

  baseline_capacity.forEach((baselineEntry: BaselineEntry) => {
    const simulationId = baselineEntry.simulation_id
    const line = baselineEntry.line
    const date = baselineEntry.date
    const capacityHours = baselineEntry.capacity_hours
    const capacityShifts = baselineEntry.capacity_shifts

    // Check if the key exists in capacity_data_all
    const existingIndex = capacity_data_all.simulation_id.findIndex(
      (id: any, idx: any) =>
        id === simulationId &&
        capacity_data_all.line[idx] === line &&
        capacity_data_all.date[idx] === date
    )

    if (existingIndex !== -1) {
      // If it exists, update the existing entry
      capacity_data_all.capacity_hours[existingIndex] += capacityHours // or any other logic you want to apply
      capacity_data_all.capacity_shifts[existingIndex] += capacityShifts // or any other logic you want to apply
    } else {
      // If it doesn't exist, push the new values
      capacity_data_all.simulation_id.push(simulationId)
      capacity_data_all.line.push(line)
      capacity_data_all.date.push(date)
      capacity_data_all.capacity_hours.push(capacityHours)
      capacity_data_all.capacity_shifts.push(capacityShifts)
    }
  })

  return capacity_data_all
}

const ComparisonView: React.FC = () => {
  const { SimulationID1, SimulationID2, PlantID } = useParams<{
    SimulationID1: string
    SimulationID2: string
    PlantID: string
  }>()
  const [comparativeData, setComparativeData] = useState<any>([])
  const [isLoadingProgress, setIsLoadingProgress] = useState(true)

  const getCompareSimulationData = useCallback(async () => {
    try {
      const res = await axios.get(`${apiUrl}/comparison`)
      if (res.data) {
        return res.data
      } else {
        display_notification('warn', 'Simulation you request no data found.')
        return {} // Return an empty object or appropriate default
      }
    } catch (err) {
      display_notification(
        'alert',
        'We are unable to process your request due to a server failure.'
      )
      return {} // Return an empty object or appropriate default
    }
  }, [SimulationID1, SimulationID2])

  useEffect(() => {
    const fetchData = async () => {
      setIsLoadingProgress(true)
      const comparesionResult = await getCompareSimulationData()
      const getCompareResult = filterComparativeDataLines(comparesionResult)
      setComparativeData(getCompareResult)
      setIsLoadingProgress(false)
    }
    fetchData()
  }, [SimulationID1, SimulationID2, PlantID])

  const filterComparativeDataLines = useCallback(
    (comparativeData: any) => {
      const compareSimulationData = Object.keys(comparativeData)

      if (compareSimulationData.length > 0) {
        const simulationID1Data1 = comparativeData[compareSimulationData[0]]
        const simulationID1Data2 = comparativeData[compareSimulationData[1]]

        const load1 = FilterByObjectsKeyWithLines(
          simulationID1Data1.load,
          simulationID1Data1.baseline_load,
          compareSimulationData[0]
        )
        const load2 = FilterByObjectsKeyWithLines(
          simulationID1Data2.load,
          simulationID1Data2.baseline_load,
          compareSimulationData[1]
        )
        const load_data_all = combineResults(load1, load2)

        const baseline_capacity_sim1: any = simulationID1Data1.baseline_capacity
        const baseline_capacity_sim2: any = simulationID1Data2.baseline_capacity
        const baseline_capacity: any = baseLineCapacityCombine(
          baseline_capacity_sim1,
          compareSimulationData[0],
          baseline_capacity_sim2,
          compareSimulationData[1]
        )

        const exercises_capacity_sim1 = f_parse_capacity_data(
          simulationID1Data1.capacity,
          compareSimulationData[0]
        )
        const exercises_capacity_sim2 = f_parse_capacity_data(
          simulationID1Data2.capacity,
          compareSimulationData[1]
        )

        const exercises_capacity = exercisesCapacityCombine(
          exercises_capacity_sim1,
          exercises_capacity_sim2
        )

        exercises_capacity['capacity_hours'] =
          exercises_capacity['PRODUCTIVE_CAPACITY_HOURS']
        exercises_capacity['capacity_shifts'] = exercises_capacity[
          'PRODUCTIVE_CAPACITY_HOURS'
        ].map(
          (value: number, idx: number) =>
            value /
            (exercises_capacity['OEE'][idx] *
              exercises_capacity['HOURS_PER_SHIFT'][idx])
        )

        const optimization_results_sim1 = q_get_optimization_results(
          simulationID1Data1.optimization,
          compareSimulationData[0]
        )
        const optimization_results_sim2 = q_get_optimization_results(
          simulationID1Data2.optimization,
          compareSimulationData[1]
        )

        const optimization_results = optimizationCapacityCombine(
          optimization_results_sim1,
          optimization_results_sim2
        )

        optimization_results['capacity_hours'] = optimization_results[
          'OPT_CAPACITY_SHIFTS'
        ].map((value: number, idx: number) => {
          // Get the filtered OEE values
          const filteredOEE = exercises_capacity['OEE'].filter(
            (x: number, i: number) =>
              exercises_capacity['simulation_id'][i] ===
                optimization_results['simulation_id'][idx] &&
              exercises_capacity['LINE'][i] ===
                optimization_results['LINE'][idx] &&
              exercises_capacity['DATE'][i] ===
                optimization_results['DATE'][idx]
          )

          // Get the filtered hours per shift
          const filteredHoursPerShift = exercises_capacity[
            'HOURS_PER_SHIFT'
          ].filter(
            (x: number, i: number) =>
              exercises_capacity['simulation_id'][i] ===
                optimization_results['simulation_id'][idx] &&
              exercises_capacity['LINE'][i] ===
                optimization_results['LINE'][idx] &&
              exercises_capacity['DATE'][i] ===
                optimization_results['DATE'][idx]
          )

          // Debugging: Log the filtered results
          // console.log(`Index: ${idx}, OEE: ${filteredOEE}, Hours per Shift: ${filteredHoursPerShift}`);

          // Check if filtered arrays have values before accessing
          if (filteredOEE.length === 0 || filteredHoursPerShift.length === 0) {
            // console.warn(`No matching OEE or hours per shift for index ${idx}`);
            return 0 // Return a default value or handle as needed
          }

          // Assuming you want to multiply the first element of each filtered array
          const capacityHour = Math.round(
            value * filteredOEE[0] * filteredHoursPerShift[0]
          )
          return capacityHour
        })

        const optimized_simulations = Array.from(
          new Set(optimization_results['simulation_id'])
        )
        const optimized_lines: Record<string, string[]> = {}

        optimized_simulations.forEach((value: any) => {
          optimized_lines[value] = Array.from(
            new Set(
              optimization_results['LINE'].filter(
                (_: any, idx: any) =>
                  optimization_results['simulation_id'][idx] === value
              )
            )
          )
        })

        var capacity_data_all: any = {}
        for (const key of [
          'simulation_id',
          'line',
          'date',
          'capacity_shifts',
          'capacity_hours',
        ]) {
          capacity_data_all[key] = []
        }
        for (const key of Object.keys(exercises_capacity)) {
          if (['simulation_id'].includes(key)) {
            capacity_data_all[key] = exercises_capacity[key]
          } else if (['LINE', 'DATE'].includes(key)) {
            const updatedKey = key.toLowerCase()
            capacity_data_all[updatedKey] = exercises_capacity[key]
          } else if (['capacity_shifts', 'capacity_hours'].includes(key)) {
            exercises_capacity[key].forEach((value: any, idx: any) => {
              let simulation_id = exercises_capacity['simulation_id'][idx]
              let line = exercises_capacity['LINE'][idx]
              if (
                optimized_simulations.includes(simulation_id) &&
                optimized_lines[simulation_id].includes(line)
              ) {
                const index = optimization_results['DATE']
                  .filter(
                    (_: any, i: any) =>
                      optimization_results['simulation_id'][i] ===
                        exercises_capacity['simulation_id'][idx] &&
                      optimization_results['LINE'][i] ===
                        exercises_capacity['LINE'][idx]
                  )
                  .indexOf(exercises_capacity['DATE'][idx])
                if (
                  index !== -1 &&
                  optimization_results[key] &&
                  optimization_results[key][index] !== undefined
                ) {
                  capacity_data_all[key][idx] = Math.round(
                    optimization_results[key][index]
                  )
                } else {
                  capacity_data_all[key][idx] = Math.round(
                    exercises_capacity[key][idx]
                  )
                }
              } else {
                capacity_data_all[key][idx] = Math.round(
                  exercises_capacity[key][idx]
                )
              }
            })
          }
        }

        const capacity = getFinalCapacityData(
          capacity_data_all,
          baseline_capacity
        )

        const results = {
          data: {
            load: load_data_all,
            capacity: capacity,
          },
          comparision_simulation_ids: comparativeData.comparison,
        }

        return results
      }
    },
    [SimulationID1, SimulationID2, PlantID]
  )

  return (
    <div>
      {isLoadingProgress ? (
        <div>
          <LdProgress
            className='w-full'
            pending
            ariaValuemax={100}
            aria-valuetext='indeterminate'
          />
          <div className='flex items-center mt-4'>
            {' '}
            {/* Added margin-top for spacing */}
            <LdLoading />
            <span className='ml-2'>
              Please wait while the simulation results are being prepared...
            </span>
          </div>
        </div>
      ) : comparativeData && Object.keys(comparativeData).length > 0 ? (
        <ComparisonFilter results={comparativeData} />
      ) : (
        <div className='flex items-center mt-4'>
          <span className='ml-2'>
            {' '}
            No data available for selected Simulations
          </span>
        </div>
      )}
    </div>
  )
}

export default ComparisonView
