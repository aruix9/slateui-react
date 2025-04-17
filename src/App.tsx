import React, { useEffect, useState } from "react";
import { HashRouter as Router, Route, Routes  } from 'react-router-dom';
import axios from "axios";
import "./App.css";
import Navbar from "./components/Header/Navbar";
import SimulationMasterTable from "./components/HomePage/SimulationMasterTable";
import SimulationView from "./components/SimulationView/SimulationIndex";
import ComparisonView from "./components/Comparative/ComparisonView";
import { UserInfo } from "./types";

const apiUrl = process.env.REACT_APP_API_URL1;

const App: React.FC = () => {
  const [userinfo, setUserinfo] = useState<UserInfo | null>(null);

  useEffect(() => {
    axios
      .get(apiUrl+"/user_info")
      .then((res) => setUserinfo(res.data))
      .catch((err) => {
        console.log(err);
        alert(err);
      });
  }, []);

  return (
    <Router basename="/">
    <div className="appContainer">
      <Navbar userInfo={userinfo} />
      <Routes>
          <Route path="/" element={<SimulationMasterTable/>}></Route>
          <Route path="/simulationView/:SimulationID" element={<SimulationView/>}></Route>
          <Route path="/comparative/:SimulationID1/:SimulationID2/:PlantID" element={<ComparisonView />} />
      </Routes>
    </div>
    </Router>
  );
    
};

export default App;
