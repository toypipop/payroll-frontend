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
        <div className="mb-4 rounded-lg border border-warning-line bg-warning-soft px-3 py-2.5 text-[13px] leading-normal text-warning-text">
            {message}
            {canManage && (
                <>
                    {" "}
                    <Link
                        to={routePath}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="font-semibold text-warning-text underline"
                    >
                        {linkLabel}
                    </Link>
                </>
            )}
        </div>
    );
};

export default MasterDataWarning;
