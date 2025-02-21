import axios from 'axios';
import React, { useEffect, useState } from 'react'
import { timeAgo } from '../helper';

const GET_ACTIVE_CAMPAIGN_APPLIED_JOB_DETAILS_URL = "https://api.headhuntrai.com/api/job-searches/<campaign_id>/appliedJobs/";
const GET_ACTIVE_CAMPAIGN_APPLIED_JOB_DETAILS_URL_PROXY = `${wpAjax.site_url}/wp-json/job-search/v1/applied-jobs-proxy/<campaign_id>`;
const GET_ACTIVE_CAMPAIGN_DETAIL_URL = "https://api.headhuntrai.com/api/job-searches/<user_id>/activeJobs/";
const GET_ACTIVE_CAMPAIGN_DETAIL_URL_PROXY = `${wpAjax.site_url}/wp-json/job-search/v1/active-jobs-proxy/<user_id>/`;
const UPDATE_LIKE_STATUS_OF_JOB_URL = "https://api.headhuntrai.com/api/like-status/<job_id>/";
const APPLY_TO_JOB_URL = "https://api.headhuntrai.com/api/apply-status/<job_id>/";
const GENERATE_FILES_URL = "https://api.headhuntrai.com/api/generate-resume/<job_id>/";
const DOWNLOAD_FILES_URL = "https://api.headhuntrai.com/api/download-resume/<file_id>/";

const Loader = () => {
    return (
        <div className="flex items-center justify-center min-h-[194px] w-full">
            <i className="pi pi-spinner-dotted text-4xl animate-spin"></i>
        </div>
    );
}

function AppliedJobs({ globalAuthUserDetails }) {
    const [allDetails, setAllDetails] = useState(null);
    const [allDetailsLoading, setAllDetailsLoading] = useState(false);

    const fetchActiveCampaignAppliedJobDetails = async (campaignId) => {
        const finalURL = GET_ACTIVE_CAMPAIGN_APPLIED_JOB_DETAILS_URL_PROXY.replace("<campaign_id>", campaignId);
        try {
            const response = await axios.get(`${finalURL}?v=${new Date().getTime()}`);
            setAllDetails(response?.data);
        } catch (error) {
            console.error('Error fetching data:', error);
            setNoActiveCampaign(true);
            // if (error?.response?.data?.detail) {
            // }
        }
    }

    const fetchActiveCampaignDetails = async () => {
        setAllDetailsLoading(true);
        const finalURL = GET_ACTIVE_CAMPAIGN_DETAIL_URL_PROXY.replace("<user_id>", globalAuthUserDetails?.id);
        try {
            const response = await axios.get(`${finalURL}?v=${new Date().getTime()}`);
            const data = typeof response?.data === 'string' ? JSON.parse(response?.data) : response?.data;
            if (data?.campaign?.id) await fetchActiveCampaignAppliedJobDetails(data?.campaign?.id);
        } catch (error) {
            console.error('Error fetching data:', error?.message);
        } finally {
            setAllDetailsLoading(false);
        }
    }

    const JobCard = ({ job }) => {
        const [jobUpdating, setJobUpdating] = useState(false);
        const [appliedJobs, setAppliedJobs] = useState([...(job.is_applied ? [job.id] : [])]);
        const isJobApplied = job.is_applied || appliedJobs.includes(job.id);

        const updateLikeStatus = async (e, newStatus) => {
            e.preventDefault();
            e.stopPropagation();
            setJobUpdating(true);
            const finalURL = UPDATE_LIKE_STATUS_OF_JOB_URL.replace("<job_id>", job?.id);
            try {
                const data = new FormData();
                data.append("is_liked", newStatus);
                const response = await axios.post(finalURL, data);
                fetchActiveCampaignDetails();
            } catch (error) {
                console.error('Error updating status:', error);
            } finally {
                setJobUpdating(false);
            }
        }

        const applyToJob = async (e, newStatus) => {
            e.preventDefault();
            e.stopPropagation();
            setJobUpdating(true);
            const finalURL = APPLY_TO_JOB_URL.replace("<job_id>", job?.id);
            try {
                const data = new FormData();
                data.append("is_applied", newStatus);
                const response = await axios.post(finalURL, data);
                // fetchActiveCampaignDetails();
                if (newStatus) {
                    if (!appliedJobs.includes(job.id)) setAppliedJobs([...appliedJobs, job.id]);
                } else {
                    setAppliedJobs(appliedJobs.filter(id => id != job.id));
                }
            } catch (error) {
                console.error('Error applying to job:', error);
            } finally {
                setJobUpdating(false);
            }
        }

        const generateFiles = async (e) => {
            e.preventDefault();
            e.stopPropagation();
            setJobUpdating(true);
            const finalURL = GENERATE_FILES_URL.replace("<job_id>", job?.id);
            try {
                const response = await axios.get(finalURL);
                fetchActiveCampaignDetails();
            } catch (error) {
                console.error('Error generating files:', error);
            } finally {
                setJobUpdating(false);
            }
        }

        const downloadFile = async (e, fileId) => {
            e.preventDefault();
            e.stopPropagation();
            const finalURL = DOWNLOAD_FILES_URL.replace("<file_id>", fileId);
            window.open(finalURL, "_blank");
        }

        return (
            <div
                className="flex flex-col p-6 text-base gap-1 justify-between rounded-lg grayscale"
                style={{
                    boxShadow: '2px 2px 10px rgba(0, 0, 0, 0.1)',
                }}
            // onClick={(e) => {
            //     window.open(job?.detail_page_url, "_blank");
            // }}
            >
                {
                    jobUpdating ?
                        <Loader />
                        :
                        <>
                            <div className="">
                                <span className="capitalize text-xl text-black">{job?.job_title}</span>
                                <a href={'#'} className='text-xs pl-2 !underline'>View Job</a>
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
                                // onClick={(e) => updateLikeStatus(e, !isJobLiked)}
                                >
                                    {
                                        job?.is_liked ?
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
                                    job?.files?.length === 0 ?
                                        <>
                                            <span
                                                className="flex gap-1 items-center cursor-pointer"
                                                onClick={(e) => job?.is_applied ? e.preventDefault() : generateFiles(e)}
                                            >
                                                <i className="pi pi-file-word text-blue-600"></i>Generate CV as Word
                                            </span>
                                            <span
                                                className="flex gap-1 items-center cursor-pointer"
                                                onClick={(e) => job?.is_applied ? e.preventDefault() : generateFiles(e)}
                                            >
                                                <i className="pi pi-file-pdf text-red-600"></i>Generate CV as PDF
                                            </span>
                                        </>
                                        :
                                        <>
                                            <span
                                                className="flex gap-2 items-center cursor-pointer"
                                                onClick={(e) => job?.is_applied ? e.preventDefault() : downloadFile(e, job?.files[0].id)}
                                            >
                                                <i className="pi pi-file-word text-blue-600"></i>Download CV as Word
                                            </span>
                                            <span
                                                className="flex gap-2 items-center cursor-pointer"
                                                onClick={(e) => job?.is_applied ? e.preventDefault() : downloadFile(e, job?.files[1].id)}
                                            >
                                                <i className="pi pi-file-pdf text-red-600"></i>Download CV as PDF
                                            </span>
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
                        <div className="grid grid-cols-3 text-[13px] sm:text-base">
                            <span className="">
                                Total Jobs : {activeCampaignDetails?.total_job_count}
                            </span>
                            <span className="">
                                Liked Jobs : {activeCampaignDetails?.like_count}
                            </span>
                            <span className="">
                                Applied Jobs : {activeCampaignDetails?.jobs?.length}
                            </span>
                        </div>
                        <div className="flex gap-2 flex-wrap text-[11px] sm:text-sm">
                            <span className="capitalize">
                                City : {activeCampaignDetails?.campaign?.city}
                            </span>
                            <span className="">
                                Required Jobs : {activeCampaignDetails?.campaign?.keyword}
                            </span>
                        </div>
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
                    <span className="block py-6 mt-4 text-center">No Applied Jobs to display</span>
                </div>
        );
    }


    useEffect(() => {
        fetchActiveCampaignDetails();
    }, [])

    return (
        <div className='flex flex-col'>
            {
                allDetailsLoading ?
                    <Loader />
                    :
                    allDetails &&
                    <JobsCardList activeCampaignDetails={allDetails} />
            }
        </div>
    )
}

export default AppliedJobs