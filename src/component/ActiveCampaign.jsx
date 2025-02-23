import axios from 'axios';
import React, { useEffect, useState } from 'react'
import { timeAgo } from '../helper';

const GET_ACTIVE_CAMPAIGN_DETAILS_URL = "https://api.headhuntrai.com/api/job-searches/<user_id>/activeJobs/";
const GET_ACTIVE_CAMPAIGN_DETAIL_URL_PROXY = `${wpAjax.site_url}/wp-json/job-search/v1/active-jobs-proxy/<user_id>/`;
const UPDATE_LIKE_STATUS_OF_JOB_URL = "https://api.headhuntrai.com/api/like-status/<job_id>/";
const UPDATE_LIKE_STATUS_OF_JOB_URL_PROXY = `${wpAjax.site_url}/wp-json/job-search/v1/update-job-like-proxy/<job_id>`;
const APPLY_TO_JOB_URL = "https://api.headhuntrai.com/api/apply-status/<job_id>/";
const APPLY_TO_JOB_URL_PROXY = `${wpAjax.site_url}/wp-json/job-search/v1/update-job-applied-proxy/<job_id>`;
const GENERATE_FILES_URL = "https://api.headhuntrai.com/api/generate-resume/<job_id>/";
const GENERATE_FILES_URL_PROXY = `${wpAjax.site_url}/wp-json/job-search/v1/generate-cv-proxy/<job_id>`;
const DOWNLOAD_FILES_URL = "https://api.headhuntrai.com/api/download-resume/<file_id>/";
const DOWNLOAD_FILES_URL_PROXY = `${wpAjax.site_url}/wp-json/job-search/v1/download-resume-proxy/<file_id>/`;

const Loader = ({ generatingProgress = false }) => {
    return (
        <div className="flex flex-col items-center justify-center min-h-[172px] gap-y-2">
            <i className="pi pi-spinner-dotted text-4xl animate-spin"></i>
            {
                generatingProgress ? (
                    <span className='text-lg animate-pulse'>Generating CV, Please Wait...</span>
                ) : null
            }
        </div>
    );
}

function ActiveCampaign({ globalAuthUserDetails }) {
    const [activeCampaignDetails, setActiveCampaignDetails] = useState(null);
    const [noActiveCampaign, setNoActiveCampaign] = useState(false);
    const [activeCampaignLoading, setActiveCampaignLoading] = useState(false);

    const fetchActiveCampaignDetails = async () => {
        setActiveCampaignLoading(true);
        const finalURL = GET_ACTIVE_CAMPAIGN_DETAIL_URL_PROXY.replace("<user_id>", globalAuthUserDetails?.id);
        try {
            const response = await axios.get(`${finalURL}?v=${new Date().getTime()}`);
            const data = typeof response?.data === 'string' ? JSON.parse(response?.data) : response?.data;
            setActiveCampaignDetails(data);
        } catch (error) {
            console.error('Error fetching data:', error);
            if (error?.response?.data?.detail) {
                setNoActiveCampaign(true);
            }
        } finally {
            setActiveCampaignLoading(false);
        }
    }

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
            // e.preventDefault();
            // e.stopPropagation();
            const finalURL = DOWNLOAD_FILES_URL_PROXY.replace("<file_id>", fileId);
            // window.open(finalURL, "_blank");
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

    const JobsCardList = ({ activeCampaignDetails }) => {

        const StickyHeader = () => {
            return (
                <div className="sticky top-0 bg-brand-primary text-white shadow-md p-2 z-[100]">
                    <div className="flex flex-col">
                        <div className="grid grid-cols-2 sm:grid-cols-4 text-[13px] sm:text-base">
                            <span className="">
                                Total Jobs : {activeCampaignDetails?.last_seven_days_job_count}
                            </span>
                            <span className="">
                                Today's Matches : {activeCampaignDetails?.today_job_count_new}
                            </span>
                            <span className="">
                                Liked Jobs : {activeCampaignDetails?.like_count}
                            </span>
                            <span className="">
                                Applied Jobs : {activeCampaignDetails?.apply_count}
                            </span>
                            <span className="capitalize">
                                City : {activeCampaignDetails?.campaign?.city}
                            </span>
                            <span className="">
                                Required Jobs : {activeCampaignDetails?.campaign?.keyword}
                            </span>
                        </div>
                        {/* <div className="flex gap-x-[114px] flex-wrap text-[11px] sm:text-sm">
                        </div> */}
                    </div>
                </div>
            );
        };

        return (
            activeCampaignDetails?.jobs?.length > 0 ?
                (
                    <div className="overflow-y-auto h-screen">
                        <StickyHeader />
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 my-6 px-4">

                            {
                                activeCampaignDetails?.jobs?.map(job => (
                                    <JobCard job={job} />
                                ))
                            }
                        </div>
                    </div>
                )
                :
                <div className="flex justify-center">
                    {
                        activeCampaignDetails?.campaign?.status === "PROCESSING" ? (
                            <div className="grid grid-cols-1 justify-center items-center py-6 mt-4 text-center">
                                <span>We are still searching for jobs</span>
                                <span className='text-sm'>This can take a few minutes, please wait</span>
                                <div className='my-2'><i className="pi pi-spinner text-2xl animate-spin"></i></div>
                                <span className="!w-1/2 min-w-44 px-4 py-2 mx-auto !cursor-pointer !border !border-gray-300 !rounded-md !text-sm !font-medium !text-gray-700 hover:!bg-gray-50 focus:outline-none" onClick={fetchActiveCampaignDetails}>Refresh</span>
                            </div>
                        ) : (
                            <span className="block py-6 mt-4 text-center">No Jobs to display</span>
                        )
                    }
                </div>
        );
    }

    const FullDataComp = () => {
        return (
            <div className="flex flex-col">
                <JobsCardList activeCampaignDetails={activeCampaignDetails} />
            </div>
        );
    }

    const NoActiveCampaign = () => {
        return (
            <div className="flex justify-center items-center py-6 ">
                <span className='text-xl'>No Active Campaign found!</span>
            </div>
        );
    }

    useEffect(() => {
        fetchActiveCampaignDetails();
    }, [])

    return (
        activeCampaignLoading ?
            <Loader />
            :
            noActiveCampaign ?
                <NoActiveCampaign />
                :
                activeCampaignDetails &&
                <FullDataComp />
    )
}

export default ActiveCampaign