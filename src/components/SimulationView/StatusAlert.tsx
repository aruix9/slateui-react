import React from 'react';
import {LdIcon} from "@emdgroup-liquid/liquid/dist/react";

interface StatusMessage {
    status: string;
    colorCode: string;
    msg: string;
}

const statusMessages: StatusMessage[] = [
    { status: "NOT_RUN", colorCode: "#FBB360", msg: "No Capacity Optimization ran for this exercise yet." },
    { status: "RUNNING", colorCode: "#8ABBFF", msg: "Capacity optimization currently running for this exercise." },
    { status: "SUCCESS", colorCode: "#72CA9B", msg: "Capacity optimization succeeded for this exercise." },
    { status: "FAIL", colorCode: "#FA999C", msg: "Capacity optimization ran but failed for this exercise. See the logs for more information." }
];

interface StatusAlertProps {
    currentStatus: string;
}

const StatusAlert: React.FC<StatusAlertProps> = ({ currentStatus }) => {
    const renderStatusMessage = (status: string) => {
        const statusInfo = statusMessages.find(item => item.status === status);

        if (statusInfo) {
            return (
                <div className="rounded-[5px] mt-2 p-1 mb-4 flex items-center h-8" style={{ backgroundColor: statusInfo.colorCode }}>
                    <LdIcon name={status === "SUCCESS" ? "checkmark" : status === "RUNNING" ? "repost" : status === "FAIL" ? "cross" : "attention"} className="mr-2" />
                    <span>{statusInfo.msg}</span>
                </div>
            );
        }

        return null; // Return null if the status is not recognized
    };

    return (
        <div>
            {renderStatusMessage(currentStatus)}
        </div>
    );
};

export default StatusAlert;
