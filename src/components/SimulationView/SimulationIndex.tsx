import { useState, useEffect, useRef, useCallback } from 'react'
import { useParams } from 'react-router-dom'
import {
  LdInput,
  LdLabel,
  LdCard,
  LdButton,
  LdIcon,
  LdBadge,
  LdModal,
  LdTypo,
  LdCheckbox,
  LdNotification,
  LdSelect,
  LdOption,
  LdTable,
  LdTableRow,
  LdTableHeader,
  LdTableBody,
  LdTableCell,
  LdTableHead,
  LdTabs,
  LdTablist,
  LdTabpanellist,
  LdTabpanel,
  LdTab,
  LdLoading,
} from '@emdgroup-liquid/liquid/dist/react'
import axios from 'axios'
import './index.css'
import StatusAlert from './StatusAlert'
import CapacityInputs from './Tables/CapacityInput'
import DemandInputs from './Tables/DemandInputs'
// import SimulationResult from "./Tables/SimulationResult";
import SimulationResult from './Tables/OptimazationResult'
import { display_notification } from '../../global/notification'
import CapacitySummaryReport from './Chart/CapacitySummaryReport'
import { useNavigate } from 'react-router-dom'
const apiUrl = process.env.REACT_APP_API_URL1

interface CapacityData {
  DATE: string[]
  PLANNED_CAPACITY_HOURS: number[]
  OEE: number[]
  PRODUCTIVE_CAPACITY_HOURS: number[]
  MIN_SHIFTS: number[]
  MAX_SHIFTS: number[]
  HOURS_PER_SHIFT: number[]
}

interface OptimizationResult {
  [key: string]: {
    DATE: string[]
    OPT_CAPACITY_SHIFTS: string[]
    OPT_CAPACITY_HOURS: string[]
  }
}

interface DemandInputData {
  [key: string]: {
    IOP_BRAND: string[]
    IOP_PRODUCT: string[]
    LINES_NUMBER: string[]
    IOP_STRENGTH: string[]
    DATE: string[]
    [key: string]: any // for dynamic keys like date_HOURS
  }
}

// Define a type for the entire capacity data response
interface CapacitySimulationData {
  [key: string]: CapacityData // This allows for multiple entries keyed by a string
}

const SimulationView = () => {
  const { SimulationID } = useParams()
  const navigate = useNavigate()
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [simulationData, setSimulationData] = useState<any>({})
  const [selectedLines, setSelectedLines] = useState<string[]>([])
  const [tempSelectedLines, setTempSelectedLines] = useState<string[]>([])
  const [simulationStatus, setSimulationStatus] = useState<string | undefined>(
    undefined
  )
  const [simLines, setsimLines] = useState<string[]>([])
  const [filteredLine, setFilteredLine] = useState<string | null>(null)
  const [isEditableParameter, setIsEditableParameter] = useState(false)
  const [isEditing, setIsEditing] = useState(false)
  const modalRef = useRef<any>(null)
  const runOptimazationRef = useRef<any>(null)
  const [isrunOptLoading, setIsrunOptLoading] = useState(false)
  const [activeTab, setActiveTab] = useState(0)
  const [demandInputsData, setDemandInputsData] = useState<DemandInputData>({})
  const [demandInputLoadAggData, setDemandInputLoadAggData] =
    useState<DemandInputData>({})
  const [CapacityData, setCapacityDetails] = useState<CapacitySimulationData>(
    {}
  )
  const [optimazationResult, setOptimazationResult] =
    useState<OptimizationResult>({})
  const [ModifiedCapacityData, setModifiedCapacityData] =
    useState<CapacitySimulationData>({})
  const filterDemandInputsDataRef = useRef({})
  const [version, setVersion] = useState(0)

  const [parameterValue, setParameterValue] = useState({
    weight_avoid_delay: 5,
    weight_avoid_anticipation: 1,
    weight_avoid_variability: 1,
    weight_match_target_ratio: 1,
    target_dc_ratio: 80,
  })

  useEffect(() => {
    if (SimulationID) {
      const fetchSimulationData = async () => {
        try {
          const response = await axios.get(`${apiUrl}/simulationMasterData`)
          if (response.status === 200) {
            setSimulationData(response.data)
            getSimulationLines(response.data.plant)
            getSimulationStatus()
            getCapacityDetails(SimulationID)
            getPlanDetailsLoadAgg(SimulationID)
          } else {
            display_notification('alert', 'Failed to fetch simulation data.')
          }
        } catch (error) {
          display_notification(
            'alert',
            'An error occurred while fetching the simulation details data.'
          )
        }
      }

      fetchSimulationData() // Call the fetch function
    } else {
      display_notification('alert', 'No Simulation ID provided. Redirecting...')
      navigate('/') // Navigate to home if ID is not available
    }
  }, [SimulationID, apiUrl, navigate])

  const getSimulationLines = useCallback((PlantID: string) => {
    const data = [
      'MSA-FDF-L2-FILL',
      'MSA-FDF-L3-FILL',
      'MSA-FDF-L5-FILL',
      'MSA-FDF-L6-FILL',
      'MSA-FDF-L7-FILL',
      'MSA-FDF-L8-FILL',
      'MSA-PACK-MANUEL-AUB',
      'MSA-PACK-PL01-AUB',
      'MSA-PACK-PL02-AUB',
      'MSA-PACK-PL04-REBIDOSE',
      'MSA-PACK-PL05-PEN',
      'MSA-PACK-PL06-AUB',
      'MSA-PACK-PL08-AUB',
      'MSA-PACK-TOTSHIFT',
    ]
    setsimLines(data)
    setSelectedLines([data[0]])
  }, [])

  const getCapacityDetails = useCallback(
    (SimulationID: string) => {
      axios
        .get(`${apiUrl}/capacityDetails`)
        .then((res) => {
          if (res.data) {
            setCapacityDetails(res.data)
            setModifiedCapacityData({})
          } else {
            display_notification(
              'warn',
              'There is no capacity data available for the selected simulation.'
            )
          }
        })
        .catch((err) => {
          display_notification(
            'warn',
            'There is no capacity data available for the selected simulation.'
          )
        })
    },
    [selectedLines]
  )

  const getSimulationStatus = async () => {
    setSimulationStatus('SUCCESS')
  }

  const getPlanDetailsLoadAgg = useCallback(async (SimulationID: string) => {
    try {
      const [inputsRes, loadAggRes] = await Promise.all([
        axios.get(`${apiUrl}/planDetails`),
        axios.get(`${apiUrl}/loadAgg`),
      ])

      if (inputsRes && inputsRes.data) {
        setDemandInputsData(inputsRes.data)
      } else {
        display_notification('alert', 'Error fetching Demand Input data')
      }

      if (loadAggRes && loadAggRes.data) {
        setDemandInputLoadAggData(loadAggRes.data)
      } else {
        display_notification('alert', 'Error fetching Load Aggregation data')
      }
    } catch (err) {
      display_notification('alert', 'An error occurred while fetching data')
    }
  }, [])

  const getOptimizationResults = useCallback((SimulationID: string) => {
    axios
      .get(
        `${apiUrl}/simulation/${SimulationID}/optimizationResults?simulation_id=${SimulationID}`
      )
      .then((res) => {
        if (res.data) {
          setOptimazationResult(res.data)
        }
      })
      .catch((err) => {
        display_notification('warn', 'No Optimization Simulation Results')
      })
  }, [])

  const handleEditClick = () => {
    if (isEditing) {
      axios
        .post(`${apiUrl}/simulation/${SimulationID}/description`, {
          description: simulationData.simulation_description,
        })
        .then((response) => {
          display_notification('info', response.data[0])
        })
        .catch((error) => {
          display_notification('alert', 'Failed to update Simulation data.')
        })
    }
    setIsEditing(!isEditing)
  }

  const descriptionChange = (e: any) => {
    setSimulationData({
      ...simulationData,
      simulation_description: e.target.value,
    })
  }

  const runCapaCityOptimazation = async () => {
    display_notification(
      'info',
      `Saving actual capacity and load status before opening optimization menu...`,
      20000
    )
    setIsrunOptLoading(true)
    // const response = await validateRunCapacityOptimization()
    // if(response) {
    //     runOptimazationRef.current?.showModal();
    // }
    // else {
    //     display_notification('alert', 'Simulation optimization run did not respond to your request.');
    // }
    runOptimazationRef.current?.showModal()
    setIsrunOptLoading(false)
  }

  const saveRunCapaCityOptimazation = async () => {
    setIsrunOptLoading(true)
    display_notification(
      'warn',
      `Initializing optimization algortihm...`,
      20000
    )
    runOptimazationRef.current?.close()
    const response = await validateRunCapacityOptimization()
    if (response) {
      display_notification(
        'info',
        `Optimization algorithm execution sucessfully started`,
        20000
      )
      setTimeout(() => {
        getSimulationStatus()
      }, 15000)
    } else {
      display_notification(
        'alert',
        'Simulation optimization run did not respond to your request.'
      )
    }
    setIsrunOptLoading(false)
  }

  const validateRunCapacityOptimization = async () => {
    if (selectedLines.length > 0 && Object.keys(parameterValue).length > 0) {
      try {
        const res = await axios.post(`${apiUrl}/optimization/run`, {
          simulation_id: SimulationID,
          plant: simulationData.plant,
          lines: selectedLines,
          weight_avoid_anticipation: parameterValue.weight_avoid_anticipation,
          weight_avoid_delay: parameterValue.weight_avoid_delay,
          weight_avoid_variability: parameterValue.weight_avoid_variability,
          weight_match_target_ratio: parameterValue.weight_match_target_ratio,
          target_dc_ratio: parameterValue.target_dc_ratio,
        })
        return res.data // Return the response data
      } catch (err) {
        display_notification(
          'alert',
          'Your request to run the optimization has failed. Please try again.'
        )
        return null // Return null on error
      }
    } else {
      console.warn(
        'Please ensure that you have selected lines and parameter values are set.'
      )
      return null // Return null if validation fails
    }
  }

  const filterTablesLines = (selectedLine: string) => {
    setFilteredLine(selectedLine)
  }

  const selectedLineModal = () => {
    setTempSelectedLines(selectedLines)
    setModifiedCapacityData({})
    modalRef.current?.showModal()
  }

  const toggleLineSelection = (line: string) => {
    setTempSelectedLines((prev) => {
      const newTempSelectedLines = prev.includes(line)
        ? prev.filter((l) => l !== line)
        : [...prev, line]
      return newTempSelectedLines
    })
  }

  const submitSelectedLine = () => {
    modalRef.current?.close()
    display_notification('info', 'Saving previously selected lines edits...')
    setSelectedLines(tempSelectedLines)
    if (selectedLines.length > 0) {
      setFilteredLine(selectedLines[0])
    } else {
      setFilteredLine(null)
    }
    setTempSelectedLines([])
    setVersion((prev) => prev + 1)
  }

  const tetherOptions = {
    bodyElement: runOptimazationRef.current, // Set the modal reference as the body element for the dropdown
  }

  const handleEditParameter = () => {
    setIsEditableParameter((prev) => !prev)
  }

  const handleInputParameterChange = (key: any) => (e: any) => {
    const value = Number(e.target.value)
    setParameterValue((prev) => ({
      ...prev,
      [key]: value,
    }))
  }

  const handleTabChange = (event: any) => {
    const selectedTab = event.detail // Get the selected tab from the event
    setActiveTab(selectedTab) // Update active tab index
  }

  const switchTab = async (identifier: any) => {
    setActiveTab(identifier)
  }

  const handleCapacityModified = (modifiedData: {
    [key: string]: CapacityData
  }) => {
    setModifiedCapacityData(modifiedData)
    setVersion((prev) => prev + 1)
  }

  const handleDemandSave = () => {
    setVersion((prev) => prev + 1) // force update to refresh summary ONLY
  }

  const selectedOption =
    selectedLines.length > 0
      ? [
          {
            value: selectedLines[selectedLines.length - 1], // The value of the last selected line
            label: selectedLines[selectedLines.length - 1], // The display label of the last selected line
          },
        ]
      : [{ value: '', label: '' }]

  return (
    <div className='slate-ui-container px-4 !my-5'>
      {/*-------------------------  simulation details page start ------------------------- */}
      <LdCard className='w-full'>
        <div className='flex w-full'>
          <h1 className='text-[1.2rem] font-semibold flex-1'>
            Simulation View for {simulationData.simulation_name}
          </h1>
          <div className='flex-none'>
            {isrunOptLoading && <LdLoading />}
            <LdButton
              size='sm'
              onClick={runCapaCityOptimazation}
              disabled={isrunOptLoading}
            >
              {' '}
              <LdIcon name='energy' size='sm' /> Run Capacity Optimization
            </LdButton>
          </div>
        </div>
        <div className='w-full'>
          {simulationStatus && <StatusAlert currentStatus={simulationStatus} />}
        </div>
        <div className='grid grid-cols-4 gap-4 mb-4 w-full'>
          <div>
            <LdLabel>CYCLE_KEY</LdLabel>
            <div className='bg_grey p-2 mt-2 h-8 flex items-center rounded-[2px]'>
              {simulationData.cycle_key}
            </div>
          </div>
          <div>
            <LdLabel>DATE RANGE</LdLabel>
            <div className='bg_grey p-2 mt-2 h-8 flex items-center rounded-[2px]'>
              {simulationData.init_date} → {simulationData.end_date}
            </div>
          </div>
        </div>
        <div className='flex w-full mt-2'>
          <LdLabel className='flex-1'>SIMULATION DESCRIPTION</LdLabel>
          <div className='flex-none'>
            <LdButton
              size='sm'
              className={isEditing ? 'ld-theme-tea' : 'h-4'}
              onClick={handleEditClick}
            >
              <LdIcon name={isEditing ? 'checkmark' : 'pen'} />
              {isEditing ? 'Save' : 'Edit'}
            </LdButton>
          </div>
        </div>
        <div className='flex w-full mt-2'>
          <LdInput
            value={simulationData.simulation_description} // Use the value from simulationData
            onLdchange={(e) => descriptionChange(e)}
            disabled={!isEditing} // Disable input when not editing
            className='w-full'
            resize='vertical'
            placeholder='Tell us your story...'
            multiline
            rows={4}
            cols={100}
          />
        </div>
        <div className='flex w-full mt-4'>
          <LdLabel className='flex-1'>SELECTED LINES</LdLabel>
          <div className='flex-none'>
            <LdButton
              size='sm'
              onClick={() => selectedLineModal()}
              className='ld-theme-tea w-40'
            >
              {' '}
              <LdIcon name='settings' size='sm' /> Select Lines
            </LdButton>
          </div>
        </div>
        <div className='flex w-full mt-4'>
          <div className='w-full h-[100px] p-2 sim-line-container overflow-y-scroll hide-scrollbar'>
            {selectedLines.length === 0 ? (
              <LdTypo>No lines selected.</LdTypo>
            ) : (
              selectedLines.map((line) => (
                <LdBadge key={line} className='mr-2'>
                  {line}
                </LdBadge>
              ))
            )}
          </div>
        </div>
      </LdCard>
      {/* ----------------Simulation Modal loading here--------------------------- */}
      {/* ------------------------ Select line modal-------------------- */}
      <LdModal blurryBackdrop cancelable={true} ref={modalRef}>
        <LdTypo slot='header'>Select lines</LdTypo>
        <div className='max-h-[300px] overflow-y-scroll hide-scrollbar'>
          {simLines.map((line) => (
            <div key={line} className='flex items-center mb-2'>
              <LdCheckbox
                checked={tempSelectedLines.includes(line)}
                onLdchange={() => toggleLineSelection(line)}
              />
              <LdTypo className='ml-2'>{line}</LdTypo>
            </div>
          ))}
        </div>
        <LdButton
          slot='footer'
          size='sm'
          className='ld-theme-tea w-80'
          onClick={() => submitSelectedLine()}
        >
          <LdIcon size='sm' name='checkmark' /> Confirm selected lines
        </LdButton>
      </LdModal>
      {/* ------------------------ end Select line modal-------------------- */}

      {/* ------------------------ Optimazation run line modal-------------------- */}
      <LdModal
        className='ld-modal-run-opt'
        blurryBackdrop
        cancelable={true}
        ref={runOptimazationRef}
      >
        <LdTypo variant='label-m' slot='header'>
          Optimization Configuration
        </LdTypo>
        <LdTypo variant='label-s'>
          LINES TO OPTIMIZE <small>(Select at least one)</small>
        </LdTypo>
        <LdTypo variant='body-xs'>
          Lines you select here are the ones that the algorithm will run for. By
          default, all lines with modifications in demand or capacity are
          selected
        </LdTypo>
        <div className='grid grid-cols-[20%_80%] gap-2 mb-2 w-full mt-2'>
          <div className='max-h-[14rem] overflow-y-scroll hide-scrollbar'>
            {simLines.map((line) => (
              <div key={line} className='flex items-center mb-2'>
                <LdCheckbox
                  checked={selectedLines.includes(line)}
                  onLdchange={() => toggleLineSelection(line)}
                />
                <LdTypo variant='body-s' className='ml-2'>
                  {line}
                </LdTypo>
              </div>
            ))}
          </div>
          <div>
            <div className='grid grid-cols-3 gap-8'>
              <LdTypo variant='body-xs' className='flex'>
                <b>OPTIMIZATION INPUT SUMMARY FOR LINE</b>
              </LdTypo>
              <LdSelect
                onLdchange={(e) => filterTablesLines(e.detail[0])}
                size='sm'
                className='flex-none'
                tetherOptions={tetherOptions}
                selected={selectedOption}
              >
                {selectedLines.length === 0 ? (
                  <LdOption disabled>No matches found</LdOption>
                ) : (
                  selectedLines.map((line) => (
                    <LdOption key={line} value={line}>
                      {line}
                    </LdOption>
                  ))
                )}
              </LdSelect>
            </div>
            {/* Table start here */}
            <div className='mt-2'>
              <LdTable className='max-h-[12rem]'>
                <LdTableHead>
                  <LdTableRow>
                    <LdTableHeader>DATE</LdTableHeader>
                    <LdTableHeader>MIN SHIFTS</LdTableHeader>
                    <LdTableHeader>MAX SHIFTS</LdTableHeader>
                    <LdTableHeader>OEE (%)</LdTableHeader>
                    <LdTableHeader>HOURS PER SHIFT</LdTableHeader>
                    <LdTableHeader>TOTAL LOAD</LdTableHeader>
                  </LdTableRow>
                </LdTableHead>
                <LdTableBody style={{ textAlign: 'center' }}>
                  {Object.keys(CapacityData)
                    .filter(
                      (lineKey) =>
                        selectedLines ? lineKey === filteredLine : true // Filter based on the selected line
                    )
                    .map((lineKey) => {
                      const lineData = CapacityData[lineKey]
                      return lineData.DATE.map(
                        (date: string, index: number) => (
                          <LdTableRow key={`${lineKey}-${index}`}>
                            <LdTableCell>{date}</LdTableCell>
                            <LdTableCell>
                              {lineData.MIN_SHIFTS[index]}
                            </LdTableCell>
                            <LdTableCell>
                              {lineData.MAX_SHIFTS[index]}
                            </LdTableCell>
                            <LdTableCell>
                              {lineData.OEE[index].toFixed(2)}%
                            </LdTableCell>
                            <LdTableCell>
                              {lineData.HOURS_PER_SHIFT[index]}
                            </LdTableCell>
                            <LdTableCell>
                              {(
                                lineData.PLANNED_CAPACITY_HOURS[index] *
                                lineData.OEE[index]
                              ).toFixed(2)}
                            </LdTableCell>
                          </LdTableRow>
                        )
                      )
                    })}
                  {Object.keys(CapacityData).filter((lineKey) =>
                    filteredLine ? lineKey === filteredLine : true
                  ).length === 0 && (
                    <LdTableRow>
                      <LdTableCell colspan={6}>
                        No data available for the selected line
                      </LdTableCell>
                    </LdTableRow>
                  )}
                </LdTableBody>
              </LdTable>
            </div>
            {/* Table end here  */}
          </div>
        </div>
        <div className='flex w-full mt-1'>
          <div className='w-[80%]'>
            <LdTypo variant='body-xs'>
              <b>OPTIMIZATION ALGORITHM PARAMETERS</b>{' '}
              <small>
                (modify only if you know well the algorithm formulation)
              </small>{' '}
            </LdTypo>
          </div>
          <div className='w-[20%] flex-none'>
            {selectedLines.length > 0 && (
              <LdButton
                mode='ghost'
                size='sm'
                onClick={handleEditParameter}
                className='h-1'
              >
                <LdIcon size='sm' name='pen' /> Edit Parameters
              </LdButton>
            )}
          </div>
        </div>
        <div className='flex w-full mt-1'>
          <div className='grid grid-cols-5 gap-1 w-full'>
            <div>
              <LdTypo variant='body-xs'>Weight Avoid Delay</LdTypo>
              <LdInput
                size='sm'
                className='w-40'
                disabled={!isEditableParameter}
                type='number'
                min={0}
                value={parameterValue.weight_avoid_delay.toString()}
                onChange={handleInputParameterChange('weight_avoid_delay')}
              />
            </div>
            <div>
              <LdTypo variant='body-xs'>Weight Avoid Anticipation</LdTypo>
              <LdInput
                size='sm'
                className='w-40'
                disabled={!isEditableParameter}
                type='number'
                min={0}
                value={parameterValue.weight_avoid_anticipation.toString()}
                onChange={handleInputParameterChange(
                  'weight_avoid_anticipation'
                )}
              />
            </div>
            <div>
              <LdTypo variant='body-xs'>Weight Avoid Variability</LdTypo>
              <LdInput
                size='sm'
                className='w-40'
                disabled={!isEditableParameter}
                type='number'
                min={0}
                value={parameterValue.weight_avoid_variability.toString()}
                onChange={handleInputParameterChange(
                  'weight_avoid_variability'
                )}
              />
            </div>
            <div>
              <LdTypo variant='body-xs'>Weight Match Target D/C Ratio</LdTypo>
              <LdInput
                size='sm'
                className='w-40'
                disabled={!isEditableParameter}
                type='number'
                min={0}
                value={parameterValue.weight_match_target_ratio.toString()}
                onChange={handleInputParameterChange(
                  'weight_match_target_ratio'
                )}
              />
            </div>
            <div>
              <LdTypo variant='body-xs'>Target D/C Ratio (%)</LdTypo>
              <LdInput
                size='sm'
                className='w-40'
                disabled={!isEditableParameter}
                type='number'
                min={0}
                value={parameterValue.target_dc_ratio.toString()}
                onChange={handleInputParameterChange('target_dc_ratio')}
              />
            </div>
          </div>
        </div>
        <LdButton
          slot='footer'
          size='sm'
          className='w-full'
          onClick={saveRunCapaCityOptimazation}
        >
          <LdIcon size='sm' name='checkmark' /> Confirm and Run Optimization
        </LdButton>
      </LdModal>
      {/* ------------------------ Optimazation Select line modal-------------------- */}

      {/* ----------------Simulation Modal end---------------------------   */}
      {/*-------------------------  simulation details page end ------------------------- */}
      {/*-------------------------  Projection chart details page end ------------------------- */}
      {/*-------------------------  Projection chart details page end ------------------------- */}
      <div className='my-5'>
        <LdCard className='w-full'>
          {SimulationID &&
            selectedLines &&
            Object.keys(CapacityData).length > 0 &&
            Object.keys(demandInputsData).length > 0 &&
            simulationData &&
            simulationStatus && (
              <CapacitySummaryReport
                CapacityData={CapacityData}
                ModifiedCapacityData={ModifiedCapacityData}
                SimulationData={simulationData}
                demandInputLoadAggData={demandInputLoadAggData}
                demanInputdata={demandInputsData}
                Lines={selectedLines}
                simulationStatus={simulationStatus}
                optimazationResult={optimazationResult}
                editedInputData={filterDemandInputsDataRef.current}
                version={version}
              />
            )}
        </LdCard>
      </div>
      {/*-------------------------  simulation capacity container start ------------------------- */}
      <div className='my-5'>
        <LdCard className='w-full overflow-hidden custom-tabs'>
          <div className='flex justify-stretch w-full button-tab-group'>
            <button
              type='button'
              className={`${activeTab === 0 && 'active'} bg-light`}
              onClick={() => switchTab(0)}
            >
              Capacity Inputs
            </button>
            <button
              type='button'
              className={`${activeTab === 1 && 'active'} bg-light`}
              onClick={() => switchTab(1)}
            >
              Demand Inputs
            </button>
            <button
              type='button'
              className={`${activeTab === 2 && 'active'} bg-light`}
              onClick={() => switchTab(2)}
            >
              Simulation Result
            </button>
          </div>
          {SimulationID && Object.keys(CapacityData).length > 0 && (
            <div className={`${activeTab !== 0 ? 'hidden' : ''}`}>
              <CapacityInputs
                SimulationID={SimulationID}
                CapacityData={CapacityData}
                Lines={selectedLines}
                reloadCapacityData={getCapacityDetails}
                onCapacityModified={handleCapacityModified}
              />
            </div>
          )}
          {SimulationID &&
            simLines.length > 0 &&
            Object.keys(demandInputsData).length > 0 && (
              <div
                className={`${
                  activeTab !== 1 ? 'hidden' : 'overflow-hidden max-w-full'
                }`}
              >
                <DemandInputs
                  SimulationID={SimulationID}
                  Lines={selectedLines}
                  demandInputsData={demandInputsData}
                  demandInputLoadAggData={demandInputLoadAggData}
                  filterDemandInputsDataRef={filterDemandInputsDataRef}
                  simulationLines={simLines}
                  onDemandSave={handleDemandSave}
                  getPlanDetailsLoadAgg={getPlanDetailsLoadAgg}
                />
              </div>
            )}
          {SimulationID &&
            selectedLines &&
            simulationStatus &&
            Object.keys(CapacityData).length > 0 && (
              <div
                className={`${
                  activeTab !== 2 ? 'hidden' : 'flex w-full overflow-hidden'
                }`}
              >
                <SimulationResult
                  SimulationStatus={simulationStatus}
                  SimulationID={SimulationID}
                  Lines={selectedLines}
                />
              </div>
            )}
        </LdCard>
      </div>
      {/*-------------------------  simulation capacity container page end ------------------------- */}
      <LdNotification placement='bottom' />
    </div>
  )
}

export default SimulationView
