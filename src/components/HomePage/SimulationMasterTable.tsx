import React, { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import axios from 'axios'
import {
  LdNotification,
  LdButton,
  LdCard,
  LdIcon,
  LdLoading,
  LdProgress,
  LdTable,
  LdTableBody,
  LdTableCell,
  LdTableHead,
  LdTableHeader,
  LdTableRow,
  LdModal,
  LdTypo,
  LdTableToolbar,
  LdTableCaption,
} from '@emdgroup-liquid/liquid/dist/react'
import './SimulationMasterTable.css'
import { display_notification } from '../../global/notification'
import AddNewSimulation from './AddSimulation'
import { on } from 'events'

const apiUrl = process.env.REACT_APP_API_URL1

const simulationMasterRid =
  'ri.phonograph2.main.table.a0f7ae81-fa7c-4d4d-88e4-51e7387dc8a8'

const SimulationMasterTable: React.FC = () => {
  const navigate = useNavigate()
  const [elements, setElements] = useState<any[]>([])
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [selectedRows, setSelectedRows] = useState<string[]>([])
  const [confirmDeleteOpen, setConfirmDeleteOpen] = useState<boolean>(false)
  const [isLoadingProgress, setIsLoadingProgress] = useState(false)
  const isOpenSimulationDisabled = selectedRows.length !== 1
  const isCompareSimulationsDisabled = selectedRows.length !== 2

  const getAllSimulation = useCallback(() => {
    loadingProgressBar(true)
    axios
      .get(`${apiUrl}/simulationMaster`)
      .then((res) => {
        if (res.data) {
          setElements(res.data)
          setIsLoadingProgress(false)
          //display_notification('info','Succesfully loaded simulations master data');
        } else {
          display_notification('warn', 'No simulation master data returned')
        }
      })
      .catch((err) => {
        display_notification(
          'alert',
          'An error ocurred while fetching simulations data'
        )
      })
  }, [simulationMasterRid])

  useEffect(() => {
    getAllSimulation()
  }, [getAllSimulation])

  const handleOpenSimulationView = () => {
    if (selectedRows && selectedRows.length === 1) {
      navigate(`simulationView/${selectedRows[0]}/`)
    }
  }

  const handleOpenCompareSimulationView = () => {
    if (selectedRows && selectedRows.length === 2) {
      const selectedSimulations = elements.filter((simulation) =>
        selectedRows.includes(simulation.simulation_id)
      )

      const selectedSimulation1 = selectedSimulations[0]
      const selectedSimulation2 = selectedSimulations[1]

      const allSuccess =
        selectedSimulation1.status === 'SUCCESS' &&
        selectedSimulation2.status === 'SUCCESS'
      const samePlant = selectedSimulation1.plant === selectedSimulation2.plant

      if (allSuccess && samePlant) {
        const newUrl = `comparative/${selectedRows.join('/')}/${
          selectedSimulation1.plant
        }`
        navigate(newUrl)
      } else {
        display_notification(
          'alert',
          "Please select simulations that have a status of 'SUCCESS' and belong to the same PLANT."
        )
      }
    } else {
      display_notification(
        'warn',
        'Please select two simulations for comparison.'
      )
    }
  }

  const deleteSimulation = (simulationId: string) => {
    setSelectedRows([]) // Making selectRows empty for disable the buttons
    loadingProgressBar(true)
    if (simulationId) {
      axios({
        method: 'delete',
        url: `${apiUrl}/simulations/${simulationId}`,
      })
        .then((response) => {
          if (response.status === 200) {
            loadingProgressBar(false)
            setElements((prevElements) =>
              prevElements.filter((x) => x.simulation_id !== simulationId)
            )
            display_notification('info', 'Succesfully deleted simulation')
          }
        })
        .catch((error) => {
          display_notification(
            'alert',
            'Please try agin we are unable to delete the simulation'
          )
        })
    }
  }

  const onSelect = (
    e: CustomEvent<{ rowIndex: number; selected: boolean }>
  ) => {
    const { rowIndex, selected } = e.detail
    const selectedId = elements[rowIndex].simulation_id
    setSelectedRows((prevSelected) => {
      if (selected) {
        return [...prevSelected, selectedId]
      } else {
        return prevSelected.filter((x) => x !== selectedId)
      }
    })
  }

  const openModal = () => {
    setIsModalOpen(true)
  }

  const closeModal = () => {
    setIsModalOpen(false)
  }

  const loadingProgressBar = (state: boolean) => {
    setIsLoadingProgress(state)
  }

  const handleAddSimulation = (NewSimulation: any) => {
    loadingProgressBar(false)
    setElements((prevElements) => [NewSimulation, ...prevElements])
    // navigate(`simulationView/${NewSimulation.simulation_id}/`);
    display_notification(
      'info',
      `A new simulation has been added to the list: <b>${NewSimulation.simulation_name}</b>`
    )
  }

  return (
    <div className='appContainer'>
      {isLoadingProgress && (
        <LdProgress
          className='w-full'
          pending
          ariaValuemax={100}
          aria-valuetext='indeterminate'
        />
      )}
      <div className='slate-ui-container px-4 simulationMasterTable'>
        <div className='py-4 justify-end flex gap-3'>
          <LdButton
            onClick={handleOpenCompareSimulationView}
            disabled={isCompareSimulationsDisabled}
            size='sm'
            mode='highlight'
          >
            <LdIcon name='dashboard' size='sm' /> Compare Simulations
          </LdButton>
          <LdButton
            onClick={handleOpenSimulationView}
            disabled={isOpenSimulationDisabled}
            size='sm'
          >
            <LdIcon name='external-export' size='sm' /> Open Simulation
          </LdButton>
          <LdButton
            onClick={() => setConfirmDeleteOpen(true)}
            disabled={isOpenSimulationDisabled}
            size='sm'
            mode='danger'
          >
            <LdIcon name='bin' size='sm' /> Delete Simulation
          </LdButton>

          <button
            onClick={openModal}
            className='ld-button ld-button--success ld-button--ghost ld-button--sm'
          >
            <LdIcon name='add' size='sm' /> New Simulation
          </button>
        </div>
        <div className='simulationMasterTableContainer overflow-x-auto mb-16'>
          <LdTable style={{ maxHeight: '28.6rem' }}>
            <LdTableHead>
              <LdTableRow>
                <LdTableHeader className='text-xs'></LdTableHeader>
                <LdTableHeader className='text-xs'>PLANT</LdTableHeader>
                <LdTableHeader className='text-xs'>NAME</LdTableHeader>
                <LdTableHeader className='text-xs'>CYCLE KEY</LdTableHeader>
                <LdTableHeader className='text-xs'>SCENARIO</LdTableHeader>
                <LdTableHeader className='text-xs'>INITIAL DATE</LdTableHeader>
                <LdTableHeader className='text-xs'>END DATE</LdTableHeader>
                <LdTableHeader className='text-xs'>CREATED BY</LdTableHeader>
                <LdTableHeader className='text-xs'>MODIFIED BY</LdTableHeader>
                <LdTableHeader className='text-xs'>MODIFIED AT</LdTableHeader>
                <LdTableHeader className='text-xs'>OPT.STATUS</LdTableHeader>
              </LdTableRow>
            </LdTableHead>
            <LdTableBody>
              {elements.length > 0 ? (
                elements.map((element, index) => (
                  <LdTableRow
                    selectable
                    key={element.simulation_id}
                    onLdTableSelect={onSelect}
                    style={{ '--ld-table-selection-wrapper-gradient': 'none' }}
                  >
                    <LdTableCell className='font-medium text-sm leading-4'>
                      {element.plant}
                    </LdTableCell>
                    <LdTableCell className='font-medium text-sm leading-4 word-break w-[150px]'>
                      {element.simulation_name}
                    </LdTableCell>
                    <LdTableCell className='font-medium text-sm leading-4'>
                      {element.cycle_key}
                    </LdTableCell>
                    <LdTableCell className='font-medium text-sm leading-4 word-break'>
                      {element.by_scenario}
                    </LdTableCell>
                    <LdTableCell className='font-medium text-sm leading-4'>
                      {element.init_date}
                    </LdTableCell>
                    <LdTableCell className='font-medium text-sm leading-4'>
                      {element.end_date}
                    </LdTableCell>
                    <LdTableCell className='font-medium text-sm leading-4'>
                      {element.created_by_full_name}
                    </LdTableCell>
                    <LdTableCell className='font-medium text-sm leading-4'>
                      {element.modified_by_full_name}
                    </LdTableCell>
                    <LdTableCell className='font-medium text-sm leading-4'>
                      {new Date(element.modified_at).toLocaleString('en-us')}
                    </LdTableCell>
                    <LdTableCell className='font-medium text-sm leading-4'>
                      {element.status}
                    </LdTableCell>
                  </LdTableRow>
                ))
              ) : (
                <LdTableRow>
                  <LdTableCell colspan={11} style={{ textAlign: 'center' }}>
                    <LdLoading />
                  </LdTableCell>
                </LdTableRow>
              )}
            </LdTableBody>
          </LdTable>
        </div>
      </div>

      {/* ---------- Delete Simulation Alert Box ------------------------- */}
      <LdModal
        cancelable={false}
        open={confirmDeleteOpen}
        onLdmodalclosed={() => setConfirmDeleteOpen(false)}
      >
        <LdTypo variant='h4' slot='header'>
          {' '}
          Confirmation Alert{' '}
        </LdTypo>
        <LdTypo style={{ textAlign: 'center' }}>
          {' '}
          Are you sure you want to delete the confirmed simulation?
        </LdTypo>
        <LdButton
          slot='footer'
          mode='danger'
          onClick={() => setConfirmDeleteOpen(false)}
        >
          {' '}
          Cancel{' '}
        </LdButton>
        <LdButton
          slot='footer'
          onClick={() => {
            deleteSimulation(selectedRows[0])
            setConfirmDeleteOpen(false)
          }}
        >
          Confirm
        </LdButton>
      </LdModal>
      {/* ---------- Delete Simulation Alert Box End here ------------------------- */}

      {/* ---------- Add new Simulation Code here ------------------------- */}
      {isModalOpen && (
        <AddNewSimulation
          onClose={closeModal}
          onAddSimulation={handleAddSimulation} // Pass the function as a prop
          loadingProgressBar={loadingProgressBar}
        />
      )}
      <LdNotification placement='bottom' />
    </div>
  )
}

export default SimulationMasterTable
