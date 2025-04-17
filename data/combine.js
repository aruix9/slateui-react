import fs from 'fs'
import path from 'path'

// Get the current directory of the script
const __dirname = path.resolve()

const files = [
  'simulationMaster.json',
  'scenarios.json',
  'active_site.json',
  'scenarios.json',
  'user_info.json',
  'simulationMasterData.json',
  'capacityDetails.json',
  'planDetails.json',
  'loadAgg.json',
  'distributionTable.json',
  'distributionGraph.json',
  'compareSimulations.json',
]

const combinedData = {}

// Read each file and assign it to a key in combinedData
files.forEach((file) => {
  const filePath = path.join(__dirname, file)
  try {
    const data = JSON.parse(fs.readFileSync(filePath, 'utf8'))
    const key = path.basename(file, '.json')

    // Directly assign the data for active_site.json
    combinedData[key] = data // This will keep it as an array of strings
  } catch (error) {
    console.error(`Error reading ${filePath}:`, error.message)
  }
})

// Write combined data to a new JSON file
fs.writeFileSync('combined.json', JSON.stringify(combinedData, null, 2))
console.log('Combined JSON file created successfully!')
