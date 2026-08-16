import React from "react";
import { Link } from "react-router-dom";
import { useModulePermission } from "../../hooks/useModulePermission";

interface MasterDataWarningProps {
    message: string;
    routePath: string;
    moduleKey: string;
    linkLabel?: string;
}

// Warns that a company has no records for a required master data type, linking to its settings page only if the user may open it.
const MasterDataWarning: React.FC<MasterDataWarningProps> = ({
    message,
    routePath,
    moduleKey,
    linkLabel = "Set it up",
}) => {
    const canManage = useModulePermission(moduleKey);

    return (
        <div style={warningBox}>
            {message}
            {canManage && (
                <>
                    {" "}
                    <Link to={routePath} target="_blank" rel="noopener noreferrer" style={warningLink}>
                        {linkLabel}
                    </Link>
                </>
            )}
        </div>
    );
};

const warningBox = {
    margin: "0 0 16px",
    padding: "10px 12px",
    borderRadius: "8px",
    background: "#fef3c7",
    border: "1px solid #fcd34d",
    color: "#92400e",
    fontSize: "13px",
    lineHeight: 1.5,
};

const warningLink = {
    color: "#92400e",
    fontWeight: 600,
    textDecoration: "underline",
};

export default MasterDataWarning;
