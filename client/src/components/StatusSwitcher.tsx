"use client";

import { statuses } from "@/modules/workInstanceStatus";
import { WorkInstanceFromAPI } from "@/types/types";
import dayjs from "dayjs";
import { useEffect, useState } from "react";
import Icon from "@mdi/react";
import {
    mdiCheckboxMarkedCircleOutline,
    mdiCheckboxMarkedCirclePlusOutline,
} from "@mdi/js";
import { toast } from "react-toastify";
import styles from "./statusSwitcher.module.scss";
import Select from "./select/Select";

function hasViewingToday(workInstance: WorkInstanceFromAPI) {
    return workInstance.viewings.some((viewing) =>
        dayjs(viewing).isSame(new Date(), "date")
    );
}

export default function StatusSwitcher({
    workInstance,
}: {
    workInstance: WorkInstanceFromAPI;
}) {
    const [_workInstance, setWorkInstance] = useState(workInstance);
    const [status, setStatus] = useState(_workInstance.status);
    const [viewedToday, setViewedToday] = useState(() => {
        return hasViewingToday(_workInstance);
    });

    function updateWorkInstance(workInstance: WorkInstanceFromAPI) {
        setWorkInstance((prevInstance) => {
            return { ...workInstance, work_id: prevInstance.work_id };
        });
        setStatus(workInstance.status);
        setViewedToday(hasViewingToday(workInstance));
    }

    useEffect(() => {
        if (
            status === _workInstance.status &&
            hasViewingToday(_workInstance) === viewedToday
        )
            return;

        const debounce = setTimeout(async () => {
            const updatedWorkInstance = {
                ..._workInstance,
                work_id: _workInstance.work_id._id,
                status,
                viewings: [..._workInstance.viewings],
            };

            const addedNewViewing =
                viewedToday && !hasViewingToday(_workInstance);

            if (addedNewViewing) {
                updatedWorkInstance.viewings.push(new Date());
                updatedWorkInstance.number_of_viewings++;
            }

            try {
                const response = await fetch(
                    `/api/workInstance/${_workInstance._id}`,
                    {
                        method: "PUT",
                        headers: {
                            "Content-Type": "application/json",
                        },
                        body: JSON.stringify(updatedWorkInstance),
                    }
                );
                const result = await response.json();

                if (result.acknowledged) {
                    updateWorkInstance(result.updated);
                    if (addedNewViewing) {
                        toast.success(
                            `Added completion for "${
                                _workInstance.work_id.title ?? ""
                            }"`
                        );
                    }
                } else {
                    throw new Error();
                }
            } catch (error) {
                updateWorkInstance(_workInstance);
                toast.error("Status update failed");
            }
        }, 1000);

        return () => {
            clearTimeout(debounce);
        };
    }, [status, viewedToday, _workInstance]);

    return (
        <div className={styles["status-switcher"]}>
            <div className={styles["status-switcher__select-wrapper"]}>
                <Select
                    name={"status"}
                    id={`status-${_workInstance._id}`}
                    value={status}
                    options={statuses[_workInstance.type]}
                    onChange={(value) => {
                        setStatus(value);
                    }}
                />
            </div>

            <button
                className={styles["status-switcher__view-button"]}
                disabled={viewedToday}
                onClick={() => {
                    setViewedToday(true);
                }}
                data-tooltip-id="tooltip-add-viewing"
                data-tooltip-content={viewedToday ? "" : "Complete today"}
            >
                <Icon
                    path={
                        viewedToday
                            ? mdiCheckboxMarkedCircleOutline
                            : mdiCheckboxMarkedCirclePlusOutline
                    }
                    size={1}
                />
            </button>
        </div>
    );
}
