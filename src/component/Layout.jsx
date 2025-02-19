import React, { useEffect, useMemo, useState } from 'react'
import AddComp from './AddComp';
import ActiveCampaign from './ActiveCampaign';
import { CircleUserRound, Megaphone, Plus } from 'lucide-react';
import AllCampaignsNew from './AllCampaignsNew';
import ErrorBoundary from '../ErrorBoundary';
import AppliedJobs from './AppliedJobs';
import axios from 'axios';

const BASE_URL = 'https://api.headhuntrai.com/api';
const GET_ACTIVE_CAMPAIGN_DETAILS_URL = `${BASE_URL}/job-searches/<user_id>/activeJobs/`;
const GET_ACTIVE_CAMPAIGN_DETAILS_URL_PROXY = `https://headhuntrai.com/wp-json/job-search/v1/active-jobs-proxy/<user_id>/`;
const SET_CAMPAIGNS_AS_READ = `${BASE_URL}/update-job-notification/`;

const Layout = () => {
    const globalAuthUserDetails = JSON.parse(authUser);
    const [hasActiveCampaign, setHasActiveCampaign] = useState(false);
    const [unreadCampaigns, setUnreadCampaigns] = useState([]);

    const availableTabs = [
        {
            textContent: "Add Campaign",
            value: "add",
            icon: <Plus />
        },
        {
            textContent: "All Campaigns",
            value: "all",
            icon: <Megaphone />,
        },
        {
            // textContent: "Active Campaign",
            textContent: "Matched Jobs",
            value: "active",
            icon: (
                <div className='relative'>
                    <CircleUserRound />
                    {
                        hasActiveCampaign &&
                        // <span className="!absolute !right-0 !top-0 !inline-flex !h-[6px] !w-[6px] !animate-ping !rounded-full !bg-brand-primary !opacity-100"></span>
                        <>

                            {unreadCampaigns.length > 0 ? (
                                <>
                                    <span className="notification-ping-big"></span>
                                    <span className="notification-count">{unreadCampaigns.length}</span>
                                </>
                            ) : <span className="notification-ping"></span>}
                        </>
                    }
                </div>
            ),
            onClick: handleMarkCampaignsAsRead
        },
        {
            // textContent: "Active Campaign",
            textContent: "Applied Jobs",
            value: "applied",
            icon: (<i
                className="pi pi-check-circle !text-2xl custom-text-xl"
            ></i>)
        },
    ];

    const [selectedTab, setSelectedTab] = useState(availableTabs[0].value);


    const fetchActiveCampaignDetails = async () => {
        const finalURL = GET_ACTIVE_CAMPAIGN_DETAILS_URL_PROXY.replace("<user_id>", globalAuthUserDetails?.id);
        try {
            const response = await axios.get(finalURL);
            console.log('response?.data?.campaign', response, typeof response?.data);

            if (response?.data) {
                const data = typeof response?.data === 'string' ? JSON.parse(response?.data) : response?.data;
                console.log('response?.data?.campaign parsed', data);
                setHasActiveCampaign(true);
                const hasUnreadcampaign = data?.jobs?.filter((job) => job?.is_notified === false ? job?.search : null).filter((id => id !== null)) || [];
                setUnreadCampaigns(data?.jobs);
                setUnreadCampaigns(hasUnreadcampaign);
            }
        } catch (error) {
            console.error('Error fetching data:', error?.message);
        }
    }

    async function handleMarkCampaignsAsRead() {
        try {
            if (!Array.isArray(unreadCampaigns) || unreadCampaigns.length === 0) return;
            const result = await axios.post(SET_CAMPAIGNS_AS_READ, { search: unreadCampaigns[0]?.search });
            console.log('campaigns marked as read', result);
            if (result.status === 200) setUnreadCampaigns([]);
        } catch (error) {
            console.log('Error marking campaigns as read:', error?.message);
        }
    }

    const Tabs = () => {
        return (
            <div
                className="w-full flex gap-0 justify-around !border-solid !border-b-2 !border-b-[#e8e8e8]"
            >
                {
                    availableTabs.map((tab, idx) => {
                        const tabIsSelected = selectedTab === tab.value;
                        return (
                            <div
                                key={idx}
                                className={`flex gap-3 justify-center items-center p-4 px-8 !cursor-pointer w-full text-center ${tabIsSelected ? '!border-solid !border-b-2 !border-b-brand-primary' : ''} `}
                                onClick={(e) => {
                                    setSelectedTab(tab.value);
                                    if (typeof tab?.onClick === "function") tab.onClick();
                                }}
                            >
                                {tab.icon && tab.icon}
                                <span className={`hidden sm:block ${tabIsSelected ? '!text-black' : ''}`}>
                                    {tab.textContent}
                                </span>
                            </div>
                        );
                    })
                }
            </div>
        );
    };

    function renderTabBody() {
        let comp = null;
        switch (selectedTab) {
            case "all":
                comp = <AllCampaignsNew setSelectedTab={setSelectedTab} globalAuthUserDetails={globalAuthUserDetails} />
                break;
            case "active":
                comp = <ActiveCampaign globalAuthUserDetails={globalAuthUserDetails} />
                break;
            case "applied":
                comp = <AppliedJobs globalAuthUserDetails={globalAuthUserDetails} />
                break;
            case "add":
            default:
                comp = <AddComp globalAuthUserDetails={globalAuthUserDetails} />
        }
        return comp;
    }

    useEffect(() => {
        fetchActiveCampaignDetails();
    }, []);

    return (
        <div className='w-full h-fit'>
            <Tabs />
            <ErrorBoundary>
                {

                    // selectedTab === "add" ?
                    //     <AddComp globalAuthUserDetails={globalAuthUserDetails} /> :
                    //     selectedTab === "all" ?
                    //         // <AllCampaigns globalAuthUserDetails={globalAuthUserDetails} /> :
                    //         <AllCampaignsNew setSelectedTab={setSelectedTab} globalAuthUserDetails={globalAuthUserDetails} /> :
                    //         selectedTab === "active" ?
                    //             <ActiveCampaign globalAuthUserDetails={globalAuthUserDetails} />
                    //             :
                    //             selectedTab === "applied" &&
                    //             <AppliedJobs />
                    renderTabBody()
                }
            </ErrorBoundary>
        </div>
    )
}

export default Layout