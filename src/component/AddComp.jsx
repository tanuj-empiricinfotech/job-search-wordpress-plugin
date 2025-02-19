import axios from 'axios';
import { CloudUpload } from 'lucide-react';
import React, { useEffect, useRef, useState } from 'react'
import Select from 'react-select';

const ADD_NEW_CAMPAIGN_URL = "https://api.headhuntrai.com/api/job-searches/";
const GET_COUNTRY_LIST_URL = "https://api.headhuntrai.com/api/country-list/";
const GET_COUNTRY_LIST_PROXY_URL = wpAjax.site_url + '/wp-json/job-search/v1/country-list-proxy';
const GET_CITY_LIST_URL = "https://api.headhuntrai.com/api/city-list/<country_id>/";
const GET_CITY_LIST_PROXY_URL = wpAjax.site_url + "/wp-json/job-search/v1/cities-list-proxy/<country_id>/";

const CustomSlider = ({ radius, setRadius }) => {
    // Handle slider value change
    const handleSliderChange = (e) => {
        setRadius(e.target.value);
    };

    return (
        <div className="relative w-full">
            <input
                type="range"
                min="0"
                max="100"
                value={radius}
                onChange={handleSliderChange}
                className="w-full !p-0 !mt-1 !h-[10px] !border-1 !border-gray-200 bg-gray-100 !rounded-2xl appearance-none cursor-pointer"
                style={{
                    background: `linear-gradient(to right, #FF6F61 ${radius}%, rgb(242,242,242) ${radius}%)`,
                }}
            />
            <div
                className="absolute top-[-34px] left-1/2 transform -translate-x-1/2 mt-8 bg-white text-black !border-2 border-solid !border-gray-300 text-xs rounded-md cursor-none custom-radius-padding"
                style={{
                    left: radius > 50 ? `calc(${radius}% -  5px)` : `calc(${radius}% + 7px)`, // Position it dynamically based on the slider value
                    pointerEvents: 'none', // Make sure it doesn't block interactions with the slider
                }}
            >
                {radius}
            </div>
        </div>
    );
};

const CustomFileInput = ({ resumeFile, setResumeFile }) => {

    // Handle file selection
    const handleFileChange = (event) => {
        const file = event.target.files[0];
        if (file) {
            setResumeFile(file); // Display selected file
        } else {
            setResumeFile(null); // Reset if no file selected
        }
    };

    return (
        <div className="flex flex-col gap-2">
            <label htmlFor="resume" className="text-lg font-medium">CV/Resume</label>

            {/* Hidden file input */}
            <input
                type="file"
                id="resume"
                accept="application/pdf"
                className="hidden"
                onChange={handleFileChange}
            />

            {/* Custom label to act as a button */}
            <label
                htmlFor="resume"
                className="flex items-center justify-start gap-2 bg-transparent text-black !border-2 !border-dashed !border-gray-300 py-3 px-4 rounded-xl cursor-pointer"
            >
                {/* Custom icon */}
                <CloudUpload color='#FF6F61' />

                {/* Displaying the file name or placeholder */}
                {
                    resumeFile ? resumeFile.name : 'No file chosen'
                }
            </label>
        </div>
    );
};

function AddComp({ globalAuthUserDetails }) {
    const [campaignSubmitting, setCampaignSubmitting] = useState(false);
    const [campaignTitle, setCampaignTitle] = useState("");
    const [industry, setIndustry] = useState("");
    const [campaignCountry, setCampaignCountry] = useState("");
    const [campaignCity, setCampaignCity] = useState("");
    const [radius, setRadius] = useState(30);
    const [resumeFile, setResumeFile] = useState(null);
    const [emailNotifications, setEmailNotifications] = useState(false);
    const [responseMessage, setResponseMessage] = useState("");

    const [countriesList, setCountriesList] = useState([]);
    const [citiesList, setCitiesList] = useState([]);

    const getCountriesList = async () => {
        try {
            const response = await axios.get(GET_COUNTRY_LIST_PROXY_URL);
            setCountriesList(response?.data);
        } catch (error) {
            console.error('Error fetching countries list:');
            console.error(error);
        }
    }

    const getCitiesList = async (countryId) => {
        const finalURL = GET_CITY_LIST_PROXY_URL.replace("<country_id>", countryId);
        try {
            const response = await axios.get(finalURL);
            setCitiesList(response?.data);
        } catch (error) {
            console.error('Error fetching cities list:');
            console.error(error);
        }
    }

    const handleCountryChange = (e) => {
        const countryDetails = e.target.value;
        if (!countryDetails) {
            setCampaignCountry("");
            setCampaignCity("");
            return;
        }
        setCampaignCountry(countryDetails);
        setCampaignCity("");
        const [id, name] = countryDetails.split(".");
        getCitiesList(id);
    }

    const handleCheckboxChange = (e) => {
        setEmailNotifications(e.target.checked);
    }

    const resetAllStates = () => {
        setCampaignTitle("");
        setIndustry("");
        setCampaignCountry("");
        setCampaignCity("");
        setRadius(30);
        setResumeFile(null);
        setEmailNotifications(false);
    }

    const handleFormSubmit = async (e) => {
        e.preventDefault();
        // Validation check
        // Industry is optional
        if (!campaignTitle || !campaignCountry || !campaignCity || !radius || !resumeFile) {
            let fields = [];
            !campaignTitle && fields.push('Required Job');
            !campaignCountry && fields.push('Country');
            !campaignCity && fields.push('City');
            !radius && fields.push('Distance');
            !resumeFile && fields.push('Resume File');
            let str = '';
            fields.forEach(field => str += `${field}, `)
            setResponseMessage(`Following fields are required:  [${str.slice(0, -2)}]`);
            // alert("All fields must be filled, including the resume file.");
            return;
        }

        const ajax = typeof wpAjax === 'string' ? JSON.parse(wpAjax) : !!wpAjax ? { ...wpAjax } : wpAjax;
        // console.log('wpAjax', ajax);

        const data = new FormData();
        data.append("city", campaignCity);
        data.append("keyword", campaignTitle);
        data.append("country", campaignCountry.split(".")[1]);
        data.append("user_id", globalAuthUserDetails?.id);
        data.append("email", globalAuthUserDetails?.email);
        data.append("resume", resumeFile);
        data.append("distance", radius);
        data.append("user_name", globalAuthUserDetails?.username);
        industry !== "" && data.append("industry", industry);
        data.append("email_status", emailNotifications);
        data.append("action", 'send_job_search_data');
        data.append('nonce', ajax?.nonce);

        try {
            setCampaignSubmitting(true);
            // const response = await axios.post(ADD_NEW_CAMPAIGN_URL, data, {
            const response = await axios.post(ajax?.url, data, {
                headers: {
                    'Content-Type': 'multipart/form-data',
                },
            });
            // console.log('Response-------------------------------------------------', response);
            // console.log('Response Status Code:', response.status);
            if (response?.status === 200 && response?.data?.id) {
                // console.log('Response Data:', response.data);
                setResponseMessage('Campaign added successfully!');
                // alert('Campaign added successfully!');
                resetAllStates();
            }
            if (response?.status === 200 && response?.data?.message) {
                // console.log('Response Data:', response.data);
                setResponseMessage(response?.data?.message);
                // alert(response?.data?.message);
            }
            // console.log('Response:', response.data);
        } catch (error) {
            console.error('Error uploading data:', error);
            console.error('Error response:', error.response);
            console.error('Error status:', error.status);
            setResponseMessage(error.response.data.message);
        } finally {
            setCampaignSubmitting(false);
        }
    }

    const handleCustomReactSelectCountryChange = (val) => {
        const countryDetails = val?.value;
        if (!countryDetails) {
            setCampaignCountry("");
            setCampaignCity("");
            return;
        }
        setCampaignCountry(countryDetails);
        setCampaignCity("");
        const [id, name] = countryDetails.split(".");
        getCitiesList(id);
    }
    const handleCustomReactSelectCityChange = (val) => {
        const cityDetails = val?.value;
        if (!cityDetails) {
            setCampaignCity("");
            return;
        }
        const city = cityDetails.split(".")[1];
        setCampaignCity(city);
    }

    const reactSelectCountryOptions = countriesList?.length > 0
        ? countriesList?.map(country => {
            return {
                value: `${country?.id}.${country?.name}`,
                label: country?.name
            }
        })
        :
        [];
    const reactSelectCityOptions = citiesList?.length > 0
        ? citiesList?.map(city => {
            return {
                value: `${city?.id}.${city?.name}`,
                label: city?.name
            }
        })
        :
        [];


    useEffect(() => {
        getCountriesList();
    }, []);

    useEffect(() => {
        setTimeout(() => setResponseMessage(""), 7000);
    }, [responseMessage])

    return (
        <form onSubmit={handleFormSubmit}>
            <style>
                {`
                * {
                    box-shadow: none !important;
                }
          select {
            font-size: 14px !important;
            font-weight: 400 !important;
          }
            label {
                    color: black !important;
            }
        `}
            </style>
            <div className='flex flex-col justify-start px-4 gap-5 my-10'>
                <div className="flex flex-col gap-[6px]">
                    <label htmlFor="campaign-title">Required Job</label>
                    <input
                        type="text"
                        id="campaign-title"
                        value={campaignTitle}
                        onChange={(e) => setCampaignTitle(e.target.value)}
                        placeholder='Enter Campaign Title'
                        className='!py-3 !px-4 !rounded-xl !border-1 !border-gray-200 !text-black !outline-none'
                    />
                </div>
                <div className="flex flex-col gap-[6px]">
                    <label htmlFor="industry">
                        Industry &nbsp;
                        <span className='text-gray-500'>
                            (optional)
                        </span>
                    </label>
                    <input
                        type="text"
                        id="industry"
                        value={industry}
                        onChange={(e) => setIndustry(e.target.value)}
                        placeholder='Enter Industry'
                        className='!py-3 !px-4 !rounded-xl !border-1 !border-gray-200 !text-black !outline-none'
                    />
                </div>
                {/* <div className="flex flex-col gap-[6px]">
                    <label htmlFor="campaign-country">Country</label>
                    <select
                        id="campaign-country"
                        className='!py-3 !px-4 !rounded-xl !border-1 !border-gray-200 !bg-transparent'
                        value={campaignCountry}
                        onChange={handleCountryChange}
                    >
                        <option value="">Choose a country</option>
                        {
                            countriesList?.length > 0 &&
                            countriesList?.map(country => (
                                <option key={country?.id} value={country?.id + "." + country?.name}>{country?.name}</option>
                            ))
                        }
                    </select>
                </div>
                {
                    campaignCountry !== "" && (
                        <div className="flex flex-col gap-[6px]">
                            <label htmlFor="campaign-city">City</label>
                            <select
                                id="campaign-city"
                                className='!py-3 !px-4 !rounded-xl !border-1 !border-gray-200 !bg-transparent'
                                value={campaignCity}
                                onChange={(e) => setCampaignCity(e.target.value)}
                            >
                                <option value="">Choose a city</option>
                                {
                                    citiesList?.length > 0 &&
                                    citiesList?.map(city => (
                                        <option key={city?.id} value={city?.id + "." + city?.name}>{city?.name}</option>
                                    ))
                                }
                            </select>
                        </div>
                    )
                } */}
                {/* ----------------------------------------------------------------- */}
                <div className="flex flex-col gap-[6px]">
                    <label htmlFor="react-select-country">Country</label>
                    <Select
                        id='react-select-country'
                        name='react-select-country'
                        isClearable
                        isSearchable
                        options={reactSelectCountryOptions}
                        onChange={handleCustomReactSelectCountryChange}
                    />
                </div>
                {
                    campaignCountry !== "" && campaignCountry !== null && (
                        <div className="flex flex-col gap-[6px]">
                            <label htmlFor="react-select-city">City</label>
                            <Select
                                id='react-select-city'
                                name='react-select-city'
                                isClearable
                                isSearchable
                                options={reactSelectCityOptions}
                                onChange={handleCustomReactSelectCityChange}
                            />
                        </div>
                    )
                }
                {/* ------------------------------------------------------------------ */}
                <div className="flex flex-col gap-1 my-2">
                    <label htmlFor="radius" className='mb-2'>Radius (in miles)</label>
                    <CustomSlider radius={radius} setRadius={setRadius} />
                </div>
                <div className="flex flex-col gap-2">
                    <CustomFileInput resumeFile={resumeFile} setResumeFile={setResumeFile} />
                </div>
                <div className="flex justify-start gap-2">
                    <input
                        type="checkbox"
                        id="optional-checkbox"
                        className='h-4 w-4'
                        checked={emailNotifications}
                        onChange={handleCheckboxChange}
                    />
                    <label htmlFor="optional-checkbox" className='!text-black !text-xs !font-medium'>Send me an email notification when a job is posted that matches my criteria.</label>
                </div>
                <div className="flex justify-start mt-4">
                    <button
                        className={`!py-3 !px-6 !text-white !bg-black/85 ${campaignSubmitting && 'cursor-not-allowed'}`}
                        type='submit'
                        disabled={campaignSubmitting}
                    >
                        {
                            campaignSubmitting ?
                                'Submitting'
                                :
                                'Submit'
                        }
                    </button>
                </div>
                {
                    responseMessage && (
                        <div className="flex justify-start mt-4">
                            <span className='!text-brand-primary !text-2xl' type='submit'>{responseMessage}</span>
                        </div>
                    )
                }
            </div>
        </form>
    )
}

export default AddComp