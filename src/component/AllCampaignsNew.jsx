import axios from 'axios';
import { Dialog } from "primereact/dialog";
import React, { useEffect, useState } from 'react';
import "./AllCampaigns.css";

const GET_USERS_CAMPAIGN_LIST_URL = "https://api.headhuntrai.com/api/campaign-list/<user_id>/";
const GET_USERS_CAMPAIGN_LIST_URL_PROXY = `${wpAjax.site_url}/wp-json/job-search/v1/campaigns-list-proxy/<user_id>/`;
const GET_CAMPAIGN_DETAIL_URL = "https://api.headhuntrai.com/api/job-searches/<campaign_id>/allJobs/";
const CHANGE_CAMPAIGN_OVERALL_OR_EMAIL_STATUS_URL = "https://api.headhuntrai.com/api/campaign/<campaign_id>/status/";

const Loader = () => {
    return (
        <div className="flex items-center justify-center min-h-[94px]">
            <i className="pi pi-spinner text-4xl animate-spin"></i>
        </div>
    );
}

const CampaignDetailModal = ({ detailsModalOpen, setDetailsModalOpen, campaignId }) => {
    const [modalDataLoading, setModalDataLoading] = useState(false);
    const [individualCampaignDetail, setIndividualCampaignDetail] = useState(null);

    const fetchCampaignDetails = async () => {
        const finalURL = GET_CAMPAIGN_DETAIL_URL.replace("<campaign_id>", campaignId);
        setModalDataLoading(true);
        try {
            // Make the API request with the current params (pagination, sorting, and filters)
            const response = await axios.get(finalURL);
            setIndividualCampaignDetail(response?.data);
        } catch (error) {
            console.error('Error fetching data:', error);
        } finally {
            setModalDataLoading(false);
        }
    }

    useEffect(() => {
        fetchCampaignDetails();
        return () => {
            setDetailsModalOpen(false);
            setIndividualCampaignDetail(null);
        };
    }, []);

    const JobCard = ({ job }) => {
        return (
            <div
                className="flex flex-col p-6 text-base gap-[6px] rounded-lg cursor-pointer"
                style={{
                    boxShadow: '2px 2px 10px rgba(0, 0, 0, 0.1)',
                }}
                onClick={(e) => {
                    // handleModalOpen(campaign?.id);
                }}
            >
                <div className="">
                    <span className="capitalize text-2xl text-black">{job?.job_title}</span>
                </div>
                <span>
                    {job?.company}
                </span>
                <span className="">
                    {job?.location}
                </span>
                <div className="flex gap-4 mt-2">
                    <span className="flex gap-2 items-center">
                        {
                            job?.is_liked ?
                                <>
                                    <i className="pi pi-heart-fill text-red-600"></i> Unlike
                                </>
                                :
                                <>
                                    <i className="pi pi-heart text-red-600"></i> Like
                                </>

                        }
                    </span>
                    <span className="flex gap-2 items-center">
                        {
                            job?.is_applied ?
                                <>
                                    <i className="pi pi-verified text-green-600"></i> Applied
                                </>
                                :
                                <>
                                    <i className="pi pi-check text-green-600"></i> Apply
                                </>

                        }
                    </span>
                    {
                        job?.files?.length === 0 ?
                            <>
                                <span className="flex gap-2 items-center">
                                    <i className="pi pi-file-plus"></i> Generate
                                </span>
                            </>
                            :
                            <>
                                <span className="flex gap-2 items-center">
                                    <i className="pi pi-file-pdf text-red-600"></i> PDF
                                </span>
                                <span className="flex gap-2 items-center">
                                    <i className="pi pi-file-word text-blue-600"></i> Word
                                </span>
                            </>
                    }
                </div>
            </div>
        );
    }

    const JobsCardList = ({ individualCampaignDetail }) => {

        const StickyHeader = () => {
            return (
                <div className="sticky top-0 bg-brand-primary text-white shadow-md p-4 z-[100]">
                    <div className="flex justify-between ">
                        <span className="">
                            Total Jobs : {individualCampaignDetail?.today_job_count + individualCampaignDetail?.previous_job_count}
                        </span>
                        <span className="">
                            Today's Matches : {individualCampaignDetail?.today_job_count}
                        </span>
                        <span className="">
                            Total Jobs : {individualCampaignDetail?.today_job_count + individualCampaignDetail?.previous_job_count}
                        </span>
                        <span className="">
                            Total Jobs : {individualCampaignDetail?.today_job_count + individualCampaignDetail?.previous_job_count}
                        </span>
                    </div>
                </div>
            );
        };

        return (
            individualCampaignDetail?.jobs?.length > 0 ?
                (
                    <div className="overflow-y-auto h-screen">
                        <StickyHeader />
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 my-6">

                            {
                                individualCampaignDetail?.jobs?.map(job => (
                                    <JobCard job={job} />
                                ))
                            }
                        </div>
                    </div>
                )
                :
                <div className="flex justify-center">
                    <span className="">No Jobs to display</span>
                </div>
        );
    }

    const FullDataComp = () => {
        const fieldsToExclude = ['id', 'user_id', 'resume', 'created_at', 'updated_at'];
        return (
            <div className="flex flex-col mt-6">
                {/* Overview Cards */}
                <div className="grid grid-cols-1 sm:grid-cols-2 mt-6 mb-10 m gap-4 px-2">
                    <div className="flex flex-col w-full gap-1 rounded-lg px-3 py-2 custom-shadow">
                        <span>{individualCampaignDetail?.total_website_count}</span>
                        <span>Website Count</span>
                    </div>
                    <div className="flex flex-col w-full gap-1 rounded-lg px-3 py-2 custom-shadow">
                        <span>{individualCampaignDetail?.total_job_count}</span>
                        <span>Job Count</span>
                    </div>
                </div>
                <hr />
                {/* Campaign Details */}
                <span className="text-xl underline text-brand-primary mb-4">Campaign Details</span>
                <div className="grid grid-cols-2 sm:grid-cols-3 mb-6 gap-x-4 gap-y-4">
                    {
                        Object.keys(individualCampaignDetail?.campaign).length > 0
                        &&
                        Object.keys(individualCampaignDetail?.campaign).map((key) => {
                            if (fieldsToExclude.includes(key)) return;
                            const val = individualCampaignDetail?.campaign[key];
                            return (
                                <div className="flex flex-col gap-1">
                                    <span className="capitalize">{key.split("_").join(" ")}</span>
                                    <span className="p-2 text-sm border-solid border-[1px] border-gray-300 rounded-lg overflow-hidden text-ellipsis">
                                        {
                                            val === null ?
                                                <span>&nbsp;</span>
                                                :
                                                val === false ?
                                                    <span>Off</span>
                                                    :
                                                    val === true ?
                                                        <span>On</span>
                                                        :
                                                        val
                                        }
                                    </span>
                                </div>
                            );
                        })
                    }
                </div>
                <hr />
                {/* Jobs Details */}
                <span className="text-xl underline text-brand-primary">Jobs Details</span>
                <JobsCardList individualCampaignDetail={individualCampaignDetail} />
            </div>
        );
    }

    return (
        <Dialog
            maximized
            header="Details"
            visible={detailsModalOpen}
            style={{ backgroundColor: "white", color: "black" }}
            onHide={() => { if (!detailsModalOpen) return; setDetailsModalOpen(false); }} className="p-2"
        >
            {/* <p>abcd</p> */}
            {
                modalDataLoading ?
                    <Loader />
                    :
                    individualCampaignDetail &&
                    <FullDataComp />
            }
        </Dialog>
    );
}


const CampaignCard = ({ campaign, handleModalOpen, setSelectedTab, fetchAllCampaigns }) => {
    const [campaignUpdating, setCampaignUpdating] = useState(false);
    const [actionState, setActionState] = useState({
        overallStatus: campaign?.overall_status,
        isPause: campaign?.overall_status === "PAUSE",
        isStop: campaign?.overall_status === "STOP",
        isActive: campaign?.overall_status === "ACTIVE",
        notification: campaign?.email_status,
    });

    const handleActionClick = async (e, campaignId, actionValue, campaignOverallStatus) => {
        e.preventDefault();
        e.stopPropagation();
        const statusChangeActions = ["PAUSE", "STOP", "ACTIVE"];

        if (actionValue === campaignOverallStatus) return;

        const data = new FormData();

        if (statusChangeActions.includes(actionValue)) {
            data.append("over_all", actionValue);
        } else {
            data.append("email_notification", actionValue);
        }

        function updateActionStates() {
            if (statusChangeActions.includes(actionValue)) {
                setActionState({
                    ...actionState,
                    overallStatus: actionValue,
                    isPause: actionValue === "PAUSE",
                    isStop: actionValue === "STOP",
                    isActive: actionValue === "ACTIVE",
                });
            } else {
                setActionState({
                    ...actionState,
                    overallStatus: actionValue,
                    notification: actionValue === "True"
                });
            }
        }

        const finalURL = CHANGE_CAMPAIGN_OVERALL_OR_EMAIL_STATUS_URL.replace("<campaign_id>", campaignId);
        setCampaignUpdating(true);
        try {
            const response = await axios.patch(finalURL, data);
            setCampaignUpdating(false);
            // fetchAllCampaigns();
            updateActionStates();
            // setResponseMessage('Campaign added successfully!');
        } catch (error) {
            console.error('Error updating data:', error?.message);
            console.error(error);
            alert(`${error?.message || "Unknown error occurred"}`);
            // setResponseMessage(error.response.data.message);
            setCampaignUpdating(false);
        }
    }

    return (
        <div
            className="flex flex-col justify-between p-4 text-base gap-3 rounded-lg cursor-pointer"
            style={{
                boxShadow: '2px 2px 10px rgba(0, 0, 0, 0.1)',
            }}
            onClick={(e) => {
                if (actionState.isActive) {
                    // redirect to Active Campaign Tab
                    setSelectedTab("active");
                } else if (actionState.isStop || actionState.isPause) {
                    handleModalOpen(campaign?.id);
                }
            }}
        >
            {
                campaignUpdating ?
                    <Loader />
                    :
                    <>
                        <div className="">
                            <span className="capitalize text-2xl text-black">{campaign?.keyword}</span>
                        </div>
                        {
                            campaign?.industry &&
                            <span>
                                {campaign?.industry}
                            </span>
                        }
                        <span className="capitalize">
                            {campaign?.city}
                            {/* - {campaign?.distance} */}
                        </span>
                        <div className="flex gap-6 text-lg flex-wrap">
                            <span
                                className={`flex gap-2 items-center ${actionState.isPause && 'cursor-not-allowed'}`}
                                onClick={(e) => handleActionClick(e, campaign?.id, "PAUSE", actionState.overallStatus)}
                            >
                                <i className={`pi pi-pause-circle ${actionState.isPause ? 'text-brand-primary' : 'text-gray-500'}`}></i> Pause
                            </span>
                            <span
                                className={`flex gap-2 items-center ${actionState.isStop && 'cursor-not-allowed'}`}
                                onClick={(e) => handleActionClick(e, campaign?.id, "STOP", actionState.overallStatus)}
                            >
                                <i className={`pi pi-stop-circle ${actionState.isStop ? 'text-brand-primary' : 'text-gray-500'}`}></i> Stop
                            </span>
                            <span
                                className={`flex gap-2 items-center ${actionState.isActive && 'cursor-not-allowed'}`}
                                onClick={(e) => handleActionClick(e, campaign?.id, "ACTIVE", actionState.overallStatus)}
                            >
                                <i className={`pi pi-power-off ${actionState.isActive ? 'text-brand-primary' : 'text-gray-500'}`}></i> Activate
                            </span>
                            <span
                                className="flex gap-2 items-center"
                                onClick={(e) => handleActionClick(e, campaign?.id, actionState.notification ? "False" : "True")}
                            >
                                {
                                    actionState.notification ?
                                        <>
                                            <i className="pi pi-bell text-brand-primary"></i> ON
                                        </>
                                        :
                                        <>
                                            <i className="pi pi-bell-slash text-gray-500"></i> OFF
                                        </>
                                }
                            </span>
                        </div>
                        {/* <div className="flex gap-4 mt-2">
                <span className="flex gap-2 items-center">
                    <i className="pi pi-heart-fill text-red-600"></i> Like
                </span>
                <span className="flex gap-2 items-center">
                    <i className="pi pi-check text-green-600"></i> Apply
                </span>
                <span className="flex gap-2 items-center">
                    <i className="pi pi-file-pdf text-red-600"></i> PDF
                </span>
                <span className="flex gap-2 items-center">
                    <i className="pi pi-file-word text-blue-600"></i> Word
                </span>
            </div> */}
                        {/* <div className="flex gap-4 mt-2">
                <span className="flex gap-2 items-center">
                    <i className="pi pi-heart"></i>
                </span>
                <span className="flex gap-2 items-center">
                    <i className="pi pi-check "></i>
                </span>
                <span className="flex gap-2 items-center">
                    <i className="pi pi-file-pdf "></i>
                </span>
                <span className="flex gap-2 items-center">
                    <i className="pi pi-file-word "></i>
                </span>
            </div> */}
                    </>
            }
        </div>

    );
}

const CampaignCardList = ({ allCampaignDetails, handleModalOpen, setSelectedTab, fetchAllCampaigns }) => {
    return (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 my-6">
            {
                allCampaignDetails.length > 0 &&
                allCampaignDetails?.map((campaign) => (
                    <CampaignCard fetchAllCampaigns={fetchAllCampaigns} setSelectedTab={setSelectedTab} handleModalOpen={handleModalOpen} campaign={campaign} />
                ))
            }
        </div>
    );
}


function AllCampaignsNew({ globalAuthUserDetails, setSelectedTab }) {
    const [allCampaignDetails, setAllCampaignDetails] = useState([]);
    const [campaignDetailsLoading, setCampaignDetailsLoading] = useState(false);
    const [detailsModalOpen, setDetailsModalOpen] = useState(false);
    const [openedModalCampaignId, setOpenedModalCampaignId] = useState("");

    const fetchAllCampaigns = async () => {
        setCampaignDetailsLoading(true);
        const finalURL = GET_USERS_CAMPAIGN_LIST_URL_PROXY.replace("<user_id>", globalAuthUserDetails?.id);
        try {
            const response = await axios.get(`${finalURL}?v=${new Date().getTime()}`);
            setAllCampaignDetails(response?.data);
        } catch (error) {
            console.error('Error fetching data:', error);
        } finally {
            setCampaignDetailsLoading(false);
        }
    }

    const handleModalOpen = (campaignId) => {
        setDetailsModalOpen(true);
        setOpenedModalCampaignId(campaignId);
    }

    useEffect(() => {
        fetchAllCampaigns();
    }, []);


    return (
        <div className="!mt-8 !px-3">
            <div className="!my-4">
                <h2 className="!text-2xl !text-brand-primary">
                    Hello {globalAuthUserDetails.username}, {allCampaignDetails?.length > 0 ? 'Below are all your campaigns' : "You don\'t have any campaign"}
                </h2>
                {
                    campaignDetailsLoading ?
                        <Loader />
                        :
                        <CampaignCardList fetchAllCampaigns={fetchAllCampaigns} setSelectedTab={setSelectedTab} handleModalOpen={handleModalOpen} allCampaignDetails={allCampaignDetails} />
                }
                {
                    detailsModalOpen &&
                    <CampaignDetailModal campaignId={openedModalCampaignId} detailsModalOpen={detailsModalOpen} setDetailsModalOpen={setDetailsModalOpen} />
                }
            </div>
        </div>
    );
}

export default AllCampaignsNew