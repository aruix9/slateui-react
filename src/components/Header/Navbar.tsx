import React from "react";
import {
  LdHeader,
  LdTypo,
} from "@emdgroup-liquid/liquid/dist/react";
import { UserInfo } from "../../types";
import { useNavigate } from "react-router-dom";


const Navbar: React.FC<{ userInfo: UserInfo | null }> = ({ userInfo }) => {
  const navigate = useNavigate();
  return (
    <LdHeader className="navbarHeader slate-ui-header-container">
      <LdTypo onClick={() => navigate('/')} variant="h4" style={{ cursor: 'pointer' }}>
        Capacity Simulation App
      </LdTypo>
      {userInfo && (
        <LdTypo variant="h6" slot="end">
          {userInfo.email}
        </LdTypo>
      )}
      
    </LdHeader>
  );
};

export default Navbar;
