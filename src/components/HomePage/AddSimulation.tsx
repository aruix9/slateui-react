import React, { useEffect, useState, useCallback, useRef, useMemo } from 'react'
import { useForm, SubmitHandler } from 'react-hook-form'
import {
  LdTypo,
  LdInputMessage,
  LdModal,
  LdLabel,
  LdOption,
  LdInput,
  LdSelect,
  LdButton,
  LdLoading,
} from '@emdgroup-liquid/liquid/dist/react'
import axios from 'axios'
import { display_notification } from '../../global/notification'
import './home.css'

const apiUrl = process.env.REACT_APP_API_URL1

interface SimulationFormData {
  simulation_name: string
  plant: string
  simulation_description: string
  cycle_detail_key?: string
  cycle_key?: string
  by_scenario?: string
  cutoff_date?: string
  initial_date: string
  end_date: string
  simulation_id?: string
}

interface CycleKey {
  cycle_key: string
  by_scenario: string
  cutoff_date: string
}
interface AddNewSimulationProps {
  onClose: () => void // Function to close the modal
  onAddSimulation: (data: SimulationFormData) => void // Function to call when adding a simulation
  loadingProgressBar: (state: boolean) => void
}

const AddNewSimulation: React.FC<AddNewSimulationProps> = ({
  onClose,
  onAddSimulation,
  loadingProgressBar,
}) => {
  const modalRef = useRef(null) // Reference for the modal
  const [selectedCycle, setSelectedCycle] = useState<CycleKey[]>([]) // State for plant data
  const { formState, handleSubmit, register, setValue, reset, getValues } =
    useForm<SimulationFormData>({
      mode: 'onTouched',
      reValidateMode: 'onChange',
    })
  const [updateFlag, setUpdateFlag] = useState(false)
  const [plantArray, setPlantArray] = useState<string[]>([])
  const { errors, dirtyFields } = formState
  const isFormDirty = formState.submitCount > 0
  const [disabledAction, setDisabledAction] = useState(true)

  const getPlanDetails = async () => {
    try {
      const res = await axios.get(`${apiUrl}/active_site`)
      if (res.data) {
        return [
          'SITE_NANTONG',
          'SITE_RIO',
          'SITE_BARI',
          'SITE_ATUSA',
          'SITE_AUBONNE',
          'SITE_MOLLET',
        ]
      } else {
        display_notification('warn', 'No active site returned')
        return [] // Return an empty array if no data
      }
    } catch (err) {
      display_notification(
        'alert',
        'An error occurred while fetching active site data'
      )
      return [] // Return an empty array in case of an error
    }
  }

  const getPlantScenarios = useCallback(
    (SelectedPlant: string) => {
      setDisabledAction(true)
      // Check if SelectedPlant is an empty string or not
      if (!SelectedPlant) {
        display_notification(
          'warn',
          'Please select a plant before fetching scenarios.'
        )
        return // Exit the function if SelectedPlant is not valid
      }

      axios
        .get(`${apiUrl}/scenarios`)
        .then((res) => {
          if (res.data) {
            setSelectedCycle(res.data)
            if (res.data.length > 0) {
              setValue('cycle_key', res.data[0].cycle_key, {
                shouldValidate: true,
              })
              setValue('by_scenario', res.data[0].by_scenario, {
                shouldValidate: true,
              })
              setValue('cutoff_date', res.data[0].cutoff_date, {
                shouldValidate: true,
              })
            }
          } else {
            display_notification('warn', 'No simulation master data returned')
          }
        })
        .catch((err) => {
          display_notification(
            'alert',
            'An error occurred while fetching scenarios data'
          )
        })
      setDisabledAction(false)
    },
    [setValue]
  ) // Include setValue in the dependencies array

  // Set default values for INITIAL_DATE and END_DATE
  useEffect(() => {
    const fetchPlanDetails = async () => {
      const newPlants = await getPlanDetails()
      setPlantArray(newPlants)
      if (newPlants.length > 0) {
        const defaultPlant = newPlants[0] // Set the default plant value
        setValue('plant', defaultPlant)
        getPlantScenarios(defaultPlant)
      }
    }

    fetchPlanDetails()
  }, [])

  const plantChangeCallback = (e: any) => {
    setDisabledAction(true)
    const selectedValue = e
    if (Array.isArray(selectedValue) && selectedValue.length > 0) {
      setValue('plant', selectedValue[0], { shouldValidate: true })
    } else {
      setValue('plant', selectedValue, { shouldValidate: true })
    }
    getPlantScenarios(selectedValue)
  }

  const handleCycleChange = (e: any) => {
    const selectedKey = e
    // Find the matching cycle object based on the selectedKey
    const selectedCycleKey = selectedCycle.find(
      (cycle) => cycle.cycle_key === selectedKey
    )
    if (selectedCycleKey) {
      setValue('cycle_key', selectedCycleKey.cycle_key, {
        shouldValidate: true,
      })
      setValue('by_scenario', selectedCycleKey.by_scenario, {
        shouldValidate: true,
      })
      setValue('cutoff_date', selectedCycleKey.cutoff_date, {
        shouldValidate: true,
      })
      setUpdateFlag((prev) => !prev) // Toggle updateFlag
    }
  }

  const closeModalSimulation = () => {
    reset()
    onClose()
  }

  const handleFormSubmit: SubmitHandler<SimulationFormData> = async (
    simulationData: any
  ) => {
    onClose()
    loadingProgressBar(true)
    display_notification(
      'warn',
      `Creating a new simulation. Please wait and do not close or refresh the page. You will be notified once the simulation is created.`,
      20000
    )
    const initialDate = new Date(simulationData.initial_date) // Create a Date object from the selected initial date
    const endDate = new Date(simulationData.end_date) // Create a Date object from the selected end date

    // Format the dates to ISO 8601 string format
    const formattedInitialDate = initialDate.toISOString() // Format the selected initial date
    const formattedEndDate = endDate.toISOString()
    try {
      const res = await axios.post(apiUrl + '/create_simulation', {
        simulation_name: simulationData.simulation_name,
        plant: simulationData.plant,
        simulation_description: simulationData.simulation_description,
        cycle_detail_key: simulationData.cycle_key,
        initial_date: formattedInitialDate,
        end_date: formattedEndDate,
      })
      if (res.data.simulation_id) {
        const modifiedAtInSeconds = res.data.modified_at
        simulationData = {
          ...simulationData, // Spread existing properties
          simulation_id: res.data.simulation_id,
          created_at: res.data.created_at,
          created_by: res.data.created_by,
          created_by_full_name: res.data.created_by_full_name,
          modified_at: modifiedAtInSeconds * 1000,
          modified_by: res.data.modified_by,
          modified_by_full_name: res.data.modified_by_full_name,
          status: res.data.status,
          init_date: simulationData.initial_date,
        }
        onAddSimulation(simulationData)
        reset()
      } else {
        display_notification(
          'warn',
          'Simulation master did not respond to your request.'
        )
      }
    } catch (err) {
      display_notification(
        'alert',
        'Your request to add to the simulation has failed: ' + err
      )
    }
    loadingProgressBar(false)
  }

  const handleFormInvalid = React.useCallback(() => {
    display_notification('alert', 'Please fill the required information.')
  }, [])

  const tetherOptions = {
    bodyElement: modalRef.current, // Set the modal reference as the body element for the dropdown
  }

  return (
    <LdModal
      ref={modalRef} // Attach the ref to the modal
      className='ld-modal-custom'
      cancelable={false}
      open={true}
      onLdmodalclosed={onClose}
    >
      <LdTypo variant='h4' slot='header'>
        Create new Simulation
      </LdTypo>
      <form
        autoComplete='off'
        data-testid='form'
        name='simulation_add_form'
        className='custom-font'
        onSubmit={handleSubmit(handleFormSubmit, handleFormInvalid)}
      >
        <div className='flex gap-4'>
          <div className='pb-4 relative w-1/2'>
            <LdLabel size='m' className='font-sm'>
              SIMULATION NAME
            </LdLabel>
            <LdInput
              className='w-full'
              placeholder='Enter a name...'
              {...register('simulation_name', {
                required: 'Please enter simulation name.',
              })}
              onInput={(ev: React.FormEvent<HTMLLdInputElement>) => {
                const value = (ev.target as HTMLLdInputElement).value || ''
                setValue('simulation_name', value, {
                  shouldValidate: isFormDirty || dirtyFields.simulation_name,
                })
              }}
              onBlur={(ev: React.FormEvent<HTMLLdInputElement>) => {
                const value = (ev.target as HTMLLdInputElement).value || ''
                setValue('simulation_name', value, {
                  shouldValidate: true,
                  shouldDirty: true,
                })
              }}
              invalid={!!errors.simulation_name}
              disabled={disabledAction}
            />
            {errors.simulation_name && (
              <LdInputMessage className='absolute -bottom-1 left-0'>
                {errors.simulation_name.message}
              </LdInputMessage>
            )}
            {disabledAction && (
              <LdLoading className='absolute top-8 left-1/2' />
            )}
          </div>
          <div className='pb-4 relative w-1/2'>
            <LdLabel size='m'>PLANT</LdLabel>
            <select
              {...register('plant', { required: 'Please select plant.' })}
              className='w-full custom-select'
              onChange={(e) => plantChangeCallback(e.target.value)}
              disabled={disabledAction}
            >
              <option value=''>Please select a plant</option>
              {plantArray.map((plantOption) => (
                <option key={plantOption} value={plantOption}>
                  {plantOption}
                </option>
              ))}
            </select>

            {errors.plant && (
              <LdInputMessage className='absolute -bottom-1 left-0'>
                {errors.plant.message}
              </LdInputMessage>
            )}
            {disabledAction && (
              <LdLoading className='absolute top-8 left-1/2' />
            )}
          </div>
        </div>
        <div className='pb-4 relative'>
          <LdLabel size='m'>SIMULATION DESCRIPTION</LdLabel>
          <LdInput
            {...register('simulation_description', {
              maxLength: {
                value: 3000,
                message: 'Description cannot exceed 3000 characters.',
              },
            })}
            placeholder='Provide details on the purpose of the exercise.'
            multiline
            rows={3}
            className='w-full'
            max={3000} // Set the maximum length
            disabled={disabledAction}
          />
          {errors.simulation_description && (
            <LdInputMessage className='absolute -bottom-1 left-0'>
              {errors.simulation_description.message}
            </LdInputMessage>
          )}
          {disabledAction && <LdLoading className='absolute top-8 left-1/2' />}
        </div>
        <div className='pb-4 relative'>
          <LdLabel size='m'>CYCLE DETAIL KEY</LdLabel>
          <select
            className='w-full custom-select'
            {...register('cycle_key', {
              required: 'Please select cycle key.',
            })}
            onChange={(e) => handleCycleChange(e.target.value)}
            disabled={disabledAction}
            // tetherOptions={tetherOptions} // Apply tether options here
          >
            <option value=''>Please select CYCLE DETAIL KEY</option>
            {selectedCycle.map((cycle_Object) => (
              <option
                key={cycle_Object.cycle_key}
                selected={cycle_Object.cycle_key === getValues('cycle_key')}
                value={cycle_Object.cycle_key}
              >
                {cycle_Object.cycle_key}
              </option>
            ))}
          </select>
          {disabledAction && <LdLoading className='absolute top-8 left-1/2' />}
        </div>
        <div className='flex gap-4'>
          <div className='pb-4 relative w-1/2'>
            <LdLabel size='m'>BY SCENARIO</LdLabel>
            <LdInput
              disabled
              value={getValues('by_scenario') || ''}
              placeholder='CUTOFF DATE'
              type='text'
              className='w-full'
            />
            {disabledAction && (
              <LdLoading className='absolute top-8 left-1/2' />
            )}
          </div>
          <div className='pb-4 relative w-1/2'>
            <LdLabel size='m'>CUTOFF DATE</LdLabel>
            <LdInput
              disabled
              placeholder={getValues('cutoff_date') || 'CUTOFF DATE'}
              type='text'
              className='w-full'
            />
            {disabledAction && (
              <LdLoading className='absolute top-8 left-1/2' />
            )}
          </div>
        </div>
        <div className='pb-4'>
          <LdLabel size='m'>DATE RANGE</LdLabel>
          <div className='flex gap-4'>
            <div className='relative'>
              <LdInput
                disabled={disabledAction}
                {...register('initial_date', {
                  required: 'Please select an initial date.',
                })}
                type='date'
                className='w-full'
                value={new Date().toISOString().split('T')[0]}
                placeholder='INITIAL DATE'
              />
              {errors.initial_date && (
                <LdInputMessage className='absolute -bottom-1 left-0'>
                  {errors.initial_date.message}
                </LdInputMessage>
              )}
              {disabledAction && (
                <LdLoading className='absolute top-2 left-1/3' />
              )}
            </div>
            <span className='self-center'>→</span>
            <div className='relative'>
              <LdInput
                disabled={disabledAction}
                {...register('end_date', {
                  required: 'Please select an end date.',
                  validate: (value) => {
                    const endDate = new Date(value)
                    const startDate = new Date(getValues('initial_date'))
                    return (
                      endDate > startDate ||
                      'End date must be after the initial date.'
                    )
                  },
                })}
                type='date'
                className='w-full'
                value={(() => {
                  const today = new Date()
                  const threeDaysLater = new Date(today)
                  threeDaysLater.setDate(today.getDate() + 60) // Set to 60 days later
                  return threeDaysLater.toISOString().split('T')[0] // Set the value to 3 days later
                })()}
                placeholder='END DATE'
              />
              {errors.end_date && (
                <LdInputMessage className='absolute -bottom-1 left-0'>
                  {errors.end_date.message}
                </LdInputMessage>
              )}
              {disabledAction && (
                <LdLoading className='absolute top-2 left-1/3' />
              )}
            </div>
          </div>
        </div>
        <div className='flex justify-end space-x-2 p-4'>
          <LdButton
            disabled={Object.keys(errors).length > 0}
            slot='footer'
            type='submit'
            className='bg-blue-500 text-white'
          >
            Submit
          </LdButton>
          <LdButton
            slot='footer'
            onClick={() => {
              closeModalSimulation()
            }}
            mode='secondary'
            type='button'
          >
            Cancel
          </LdButton>
        </div>
      </form>
    </LdModal>
  )
}

export default AddNewSimulation
