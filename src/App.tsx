import React, { useEffect, useState } from 'react'
import {
  HashRouter as Router,
  Route,
  Routes,
  useLocation,
} from 'react-router-dom'
import axios from 'axios'
import './App.css'
import Navbar from './components/Header/Navbar'
import SimulationMasterTable from './components/HomePage/SimulationMasterTable'
import SimulationView from './components/SimulationView/SimulationIndex'
import ComparisonView from './components/Comparative/ComparisonView'
import { UserInfo } from './types'
import SidebarNav from './components/SidebarNav'
import Home from './components/Home'

const apiUrl = process.env.REACT_APP_API_URL1

const App: React.FC = () => {
  const location = useLocation()
  const [userinfo, setUserinfo] = useState<UserInfo | null>(null)

  useEffect(() => {
    axios
      .get(apiUrl + '/user_info')
      .then((res) => setUserinfo(res.data))
      .catch((err) => {
        console.log(err)
        alert(err)
      })
  }, [])

  return (
    <div className='appContainer'>
      <SidebarNav />
      {location.pathname !== '/' && <Navbar userInfo={userinfo} />}
      <Routes>
        <Route path='/' element={<Home />}></Route>
        <Route
          path='/simulationView/:SimulationID'
          element={<SimulationView />}
        ></Route>
        <Route
          path='/comparative/:SimulationID1/:SimulationID2/:PlantID'
          element={<ComparisonView />}
        />
      </Routes>
    </div>
  )
}

export default App
