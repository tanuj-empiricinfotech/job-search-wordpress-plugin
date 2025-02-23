import axios from 'axios';
import { Dialog } from "primereact/dialog";
import React, { useEffect, useState } from 'react';
import { pastTense, timeAgo } from '../helper';
import "./AllCampaigns.css";

const GET_USERS_CAMPAIGN_LIST_URL = "https://api.headhuntrai.com/api/campaign-list/<user_id>/";
const GET_USERS_CAMPAIGN_LIST_URL_PROXY = `${wpAjax.site_url}/wp-json/job-search/v1/campaigns-list-proxy/<user_id>/`;
const GET_CAMPAIGN_DETAIL_URL = "https://api.headhuntrai.com/api/job-searches/<campaign_id>/allJobs/";
const GET_CAMPAIGN_DETAIL_URL_PROXY = `${wpAjax.site_url}/wp-json/job-search/v1/campaigns-detail-proxy/<campaign_id>/`;
const CHANGE_CAMPAIGN_OVERALL_OR_EMAIL_STATUS_URL = "https://api.headhuntrai.com/api/campaign/<campaign_id>/status/";
const CHANGE_CAMPAIGN_OVERALL_OR_EMAIL_STATUS_URL_PROXY = `${wpAjax.site_url}/wp-json/job-search/v1/campaign-status-proxy/<campaign_id>/`;
const DOWNLOAD_FILES_URL = "https://api.headhuntrai.com/api/download-resume/<file_id>/";
const DOWNLOAD_FILES_URL_PROXY = `${wpAjax.site_url}/wp-json/job-search/v1/download-resume-proxy/<file_id>/`;

const UPDATE_LIKE_STATUS_OF_JOB_URL = "https://api.headhuntrai.com/api/like-status/<job_id>/";
const UPDATE_LIKE_STATUS_OF_JOB_URL_PROXY = `${wpAjax.site_url}/wp-json/job-search/v1/update-job-like-proxy/<job_id>`;
const APPLY_TO_JOB_URL = "https://api.headhuntrai.com/api/apply-status/<job_id>/";
const APPLY_TO_JOB_URL_PROXY = `${wpAjax.site_url}/wp-json/job-search/v1/update-job-applied-proxy/<job_id>`;
const GENERATE_FILES_URL = "https://api.headhuntrai.com/api/generate-resume/<job_id>/";
const GENERATE_FILES_URL_PROXY = `${wpAjax.site_url}/wp-json/job-search/v1/generate-cv-proxy/<job_id>`;

const Loader = ({ generatingProgress = false }) => {
    return (
        <div className="flex flex-col items-center justify-center min-h-[94px] gap-y-2">
            <i className="pi pi-spinner text-4xl animate-spin"></i>
            {
                generatingProgress ? (
                    <span className='text-lg animate-pulse'>Generating CV, Please Wait...</span>
                ) : null
            }
        </div>
    );
}

const CampaignDetailModal = ({ detailsModalOpen, setDetailsModalOpen, campaignId }) => {
    const [modalDataLoading, setModalDataLoading] = useState(false);
    const [individualCampaignDetail, setIndividualCampaignDetail] = useState(null);

    const fetchCampaignDetails = async () => {
        const finalURL = GET_CAMPAIGN_DETAIL_URL_PROXY.replace("<campaign_id>", campaignId);
        setModalDataLoading(true);
        try {
            // Make the API request with the current params (pagination, sorting, and filters)
            const response = await axios.get(`${finalURL}?v=${new Date().getTime()}`);
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
        const [jobUpdating, setJobUpdating] = useState(false);
        const [generatingProgress, setGeneratingProgress] = useState(false);
        const [likedJobs, setLikedJobs] = useState([...(job.is_liked ? [job.id] : [])]);
        const [appliedJobs, setAppliedJobs] = useState([...(job.is_applied ? [job.id] : [])]);
        const [downloadedFiles, setDownloadedFiles] = useState({ pdf: job?.files?.[1]?.id || 0, doc: job?.files?.[0]?.id || 0 });
        const isJobLiked = likedJobs.includes(job.id);
        const isJobApplied = appliedJobs.includes(job.id);

        const updateLikeStatus = async (e, newStatus) => {
            e.preventDefault();
            e.stopPropagation();
            setJobUpdating(true);
            const finalURL = UPDATE_LIKE_STATUS_OF_JOB_URL_PROXY.replace("<job_id>", job?.id);
            try {
                const data = new FormData();
                data.append("is_liked", newStatus);
                if (newStatus) {
                    if (!likedJobs.includes(job.id)) setLikedJobs([...likedJobs, job.id]);
                } else {
                    setLikedJobs((prevData) => prevData.filter(id => id != job.id));
                }
                const response = await axios.post(finalURL, data);
                // fetchActiveCampaignDetails();
            } catch (error) {
                console.error('Error updating status:', error);
                if (newStatus) {
                    alert('Failed to like job, Please try again.');
                } else {
                    alert('Failed to unlike job, Please try again.');
                }
            } finally {
                setJobUpdating(false);
            }
        }

        const applyToJob = async (e, newStatus) => {
            e.preventDefault();
            e.stopPropagation();
            setJobUpdating(true);
            const finalURL = APPLY_TO_JOB_URL_PROXY.replace("<job_id>", job?.id);
            try {
                const data = new FormData();
                data.append("is_applied", newStatus);
                if (newStatus) {
                    if (!appliedJobs.includes(job.id)) setAppliedJobs([...appliedJobs, job.id]);
                } else {
                    setAppliedJobs((prevData) => prevData.filter(id => id != job.id));
                }
                const response = await axios.post(finalURL, data);
                // fetchActiveCampaignDetails();
            } catch (error) {
                console.error('Error applying to job:', error);
                if (newStatus) {
                    alert('Error applying to job, Please try again.');
                } else {
                    alert('Error widhdrawing application, Please try again.');
                }
            } finally {
                setJobUpdating(false);
            }
        }

        const generateFiles = async (e) => {
            e.preventDefault();
            e.stopPropagation();
            setJobUpdating(true);
            setGeneratingProgress(true);
            const finalURL = GENERATE_FILES_URL_PROXY.replace("<job_id>", job?.id);
            try {
                const response = await axios.get(`${finalURL}?v=${new Date().getTime()}`);
                setDownloadedFiles({ pdf: response.data.pdf_file_id, doc: response.data.word_file_id });
                // fetchActiveCampaignDetails();
            } catch (error) {
                console.error('Error generating files:', error?.message);
                alert('Error generating files, Please try again.');
            } finally {
                setGeneratingProgress(false);
                setJobUpdating(false);
            }
        }

        const downloadFile = (fileId) => {
            const finalURL = DOWNLOAD_FILES_URL_PROXY.replace("<file_id>", fileId);
            return finalURL;
        }

        return (
            <div
                className={`flex flex-col p-6 text-base gap-1 justify-between rounded-lg ${isJobApplied && 'grayscale'}`}
                style={{
                    boxShadow: '2px 2px 10px rgba(0, 0, 0, 0.1)',
                }}
            // onClick={(e) => {
            //     window.open(job?.detail_page_url, "_blank");
            // }}
            >
                {
                    jobUpdating ?
                        <Loader generatingProgress={generatingProgress} />
                        :
                        <>
                            <div className="">
                                <span className="capitalize text-xl text-black">{job?.job_title}</span>
                                {isJobApplied ? null : !!(job?.detail_page_url) ? <a href={job?.detail_page_url} target='_blank' className='text-xs pl-2 !underline'>View Job <i className='pi pi-external-link text-xxs' /></a> : null}
                            </div>
                            <span>
                                {job?.company}
                            </span>
                            <span className="">
                                {job?.location}
                            </span>
                            <div className="flex gap-4 mt-2 flex-wrap">
                                <span
                                    className="flex gap-2 items-center cursor-pointer"
                                    onClick={(e) => isJobApplied ? e.preventDefault() : updateLikeStatus(e, !isJobLiked)}
                                >
                                    {
                                        isJobLiked ?
                                            <>
                                                <i className="pi pi-heart-fill text-red-600"></i>
                                            </>
                                            :
                                            <>
                                                <i className="pi pi-heart text-red-600"></i>
                                            </>

                                    }
                                </span>
                                <span
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        applyToJob(e, !isJobApplied);
                                    }}
                                    className="flex gap-2 items-center cursor-pointer"
                                >
                                    {
                                        isJobApplied ? (
                                            <><i className="pi pi-check-circle text-green-600" /> Applied</>
                                        ) : (
                                            <><i className="pi pi-check text-green-600" /> Applied?</>
                                        )
                                    }
                                </span>
                            </div>

                            {/* Show Download options */}
                            <div className='grid grid-cols-1'>
                                {
                                    (!downloadedFiles.pdf && !downloadedFiles.doc) ?
                                        <>
                                            <span
                                                className="flex gap-1 items-center cursor-pointer"
                                                onClick={(e) => isJobApplied ? e.preventDefault() : generateFiles(e)}
                                            >
                                                <i className="pi pi-file-word text-blue-600"></i>Generate CV as Word
                                            </span>
                                            <span
                                                className="flex gap-1 items-center cursor-pointer"
                                                onClick={(e) => isJobApplied ? e.preventDefault() : generateFiles(e)}
                                            >
                                                <i className="pi pi-file-pdf text-red-600"></i>Generate CV as PDF
                                            </span>
                                        </>
                                        :
                                        <>
                                            <a
                                                className="flex gap-2 items-center cursor-pointer"
                                                // onClick={(e) => isJobApplied ? e.preventDefault() : downloadFile(e, downloadedFiles.doc || job?.files[0].id)}
                                                href={isJobApplied ? '#' : downloadFile(downloadedFiles.doc || job?.files[0].id)}
                                                download=""
                                            >
                                                <i className="pi pi-file-word text-blue-600"></i>Generate CV as Word <span className='p-1'><i className="pi pi-download text-blue-600 animate-pulse"></i></span>
                                            </a>
                                            <a
                                                className="flex gap-2 items-center cursor-pointer"
                                                // onClick={(e) => isJobApplied ? e.preventDefault() : downloadFile(e, downloadedFiles.pdf || job?.files[1].id)}
                                                href={isJobApplied ? '#' : downloadFile(downloadedFiles.pdf || job?.files[1].id)}
                                                download=""
                                            >
                                                <i className="pi pi-file-pdf text-red-600"></i>Generate CV as PDF <span className='p-1'><i className="pi pi-download text-blue-600 animate-pulse"></i></span>
                                            </a>
                                        </>
                                }
                            </div>

                            {/* Matched time text */}
                            <div className='text-sm !text-right'>
                                <span>Matched {timeAgo(job?.created_at)}</span>
                            </div>
                        </>
                }
            </div>
        );
    }

    const JobsCardList = ({ individualCampaignDetail }) => {

        const StickyHeader = () => {
            return (
                <div className="sticky top-0 bg-brand-primary text-white shadow-md p-2 z-[100]">
                    <div className="flex flex-col">
                        <div className="grid grid-cols-2 md:grid-cols-4 text-[13px] sm:text-base">
                            <span className="">
                                Total Jobs : {individualCampaignDetail?.total_job_count}
                            </span>
                            <span className="">
                                Total Website : {individualCampaignDetail?.total_website_count}
                            </span>
                            <span className="">
                                Liked Jobs : {individualCampaignDetail?.like_count}
                            </span>
                            <span className="">
                                Applied Jobs : {individualCampaignDetail?.apply_count}
                            </span>
                            <span className="capitalize">
                                City : {individualCampaignDetail?.campaign?.city}
                            </span>
                            <span className="">
                                Required Jobs : {individualCampaignDetail?.campaign?.keyword}
                            </span>
                        </div>
                        {/* <div className="flex gap-x-[114px] flex-wrap text-[11px] sm:text-sm">
                        </div> */}
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
        const fieldsToExclude = ['id', 'user_id', 'user_name', 'email', 'city', 'country', 'email_status', 'industry', 'keyword', 'distance', 'resume', 'created_at', 'updated_at'];
        return (
            <div className="flex flex-col mt-2">
                {/* Campaign Details */}
                <span className="text-xl underline text-brand-primary mb-4">Campaign Details</span>
                <div className="grid grid-cols-2 sm:grid-cols-3 mb-6 gap-x-4 gap-y-4">
                    <div className="flex flex-col gap-1">
                        <span className="capitalize">Status</span>
                        <span className="p-2 text-sm border-solid border-[1px] border-gray-300 rounded-lg overflow-hidden text-ellipsis">
                            {pastTense(individualCampaignDetail?.campaign?.overall_status)}
                        </span>
                    </div>
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
            header=""
            visible={detailsModalOpen}
            headerClassName='mt-8'
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

        const finalURL = CHANGE_CAMPAIGN_OVERALL_OR_EMAIL_STATUS_URL_PROXY.replace("<campaign_id>", campaignId);
        setCampaignUpdating(true);
        try {
            const response = await axios.post(finalURL, data);
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
                    Hello {globalAuthUserDetails.username}, {campaignDetailsLoading ? "Looking for your campaigns..." : (allCampaignDetails?.length > 0 ? 'Below are all your campaigns' : "You don\'t have any campaign")}
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