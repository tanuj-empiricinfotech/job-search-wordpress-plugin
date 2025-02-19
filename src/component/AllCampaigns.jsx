import { Button } from "primereact/button";
import "./AllCampaigns.css"
import axios from 'axios';
import { Column } from 'primereact/column';
import { DataTable } from 'primereact/datatable';
import React, { useEffect, useState } from 'react'
import { CirclePause, CircleStop, Power } from "lucide-react";

const sampleCampaignData = [
    {
        id: 24,
        user_id: 135,
        user_name: "Keyur",
        email: "nirav.d@empiricinfotech.com",
        city: "toronto",
        country: "canada",
        distance: "10",
        keyword: "python developer",
        status: "PROCESSING",
        email_status: true,
        overall_status: "ACTIVE",
        resume: "/resumes/xDBC_Driver_License.pdf",
        created_at: "2025-01-24T08:55:01.776452Z",
        updated_at: "2025-01-24T08:55:01.776686Z"
    },
];

const CustomServerSideDataTable = ({ globalAuthUserDetails }) => {
    const [data, setData] = useState([]); // Stores the current page of sorted/filtered data
    const [totalRecords, setTotalRecords] = useState(0); // Stores the total number of records for  pagination
    const [loading, setLoading] = useState(true); // Manages the loading state when data is being fetched
    const [first, setFirst] = useState(0);  // Current page index (starting from 0)
    const [rows, setRows] = useState(2);  // Number of rows per page
    const [sortField, setSortField] = useState(null); // Sorting field (the column to sort by)
    const [sortOrder, setSortOrder] = useState(null); // Sorting order (1 for ascending, -1 for descending)
    const [filters, setFilters] = useState({});  // Filters to apply (e.g., column values to filter)
    const [cache, setCache] = useState({});  // Cache to store fetched data for each combination of page, sort, and filter

    const fetchData = async (page, rows, sortField, sortOrder, filters) => {
        // const cacheKey = `${page}-${rows}-${sortField}-${sortOrder}-${JSON.stringify(filters)}`;

        // // Check if data is already cached for this combination of parameters
        // if (cache[cacheKey]) {
        //     setData(cache[cacheKey].items);        // Use the cached data
        //     setTotalRecords(cache[cacheKey].total); // Use the cached total records count
        //     setLoading(false);                      // Stop loading
        //     return;
        // }

        setLoading(true);

        try {
            // const params = {
            //     page: page + 1, // Backend might expect 1-based pagination
            //     rows,
            //     sortField,
            //     sortOrder,
            //     filters,
            // };

            // Make the API request with the current params (pagination, sorting, and filters)
            // const response = await axios.get('/api-endpoint', { params });
            // console.log(globalAuthUserDetails);
            const response = await axios.get(`http://139.59.186.59/api/campaign-list/${globalAuthUserDetails.id}/`);
            const resp = response.data;
            setData(resp);

            // // Cache the result
            // setCache((prevCache) => ({
            //     ...prevCache,
            //     [cacheKey]: { items, total },
            // }));

            // Set the fetched data and total records for pagination
            // setData(items);
            // setTotalRecords(total);
        } catch (error) {
            console.error('Error fetching data:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        // Only fetch data when relevant params change
        fetchData(first, rows, sortField, sortOrder, filters);
    }, [first, rows, sortField, sortOrder, filters]);

    // Handle page change (pagination)
    const onPage = (event) => {
        setFirst(event.first); // New first record index (starting from 0)
        setRows(event.rows);   // New number of rows per page
    };

    // Handle sorting change
    const onSort = (event) => {
        setSortField(event.sortField); // New sorting field (column to sort)
        setSortOrder(event.sortOrder); // New sorting order (1 for ascending, -1 for descending)
    };

    // Handle filter change (e.g., column filters)
    const onFilter = (event) => {
        setFilters(event.filters); // Update the filters object
    };

    const changeCampaignOverallStatus = async (campaignId, action) => {
        const data = new FormData();
        data.append("over_all", action);
        try {
            const response = await axios.patch(`http://139.59.186.59/api/campaign/${campaignId}/status/`, data);
            // console.log('Response:', response.data);
            console.log('Response Status Code:', response.status);
            console.log('Response Data:', response.data);
            fetchData();
        } catch (error) {
            // console.error('Error uploading data:', error);
            console.error('Error uploading data:');
            console.error('Error response:', error.response);
            console.error('Error status:', error.status);
        }
        finally {

        }
    }

    const actionBodyTemplate = (rowData) => {
        const status = rowData.overall_status;
        return (
            <div className="flex gap-2">
                <Button
                    disabled={status === "PAUSE"}
                    rounded outlined severity="warning"
                    className={`!p-2 ${status === "PAUSE" && '!bg-gray-400'}`}
                    size="small"
                    onClick={() => {
                        if (status !== "PAUSE") {
                            // editProduct(rowData);
                            console.log('edit clicked');
                            changeCampaignOverallStatus(rowData.id, "PAUSE");
                        }
                    }}>
                    <CirclePause />
                </Button>
                <Button
                    disabled={status === "STOP"}
                    rounded outlined severity="danger"
                    className={`!p-2 ${status === "STOP" && '!bg-gray-400'}`}
                    size="small"
                    onClick={() => {
                        if (status !== "STOP") {
                            // confirmDeleteProduct(rowData);
                            changeCampaignOverallStatus(rowData.id, "STOP");
                            console.log('delete clicked');
                        }
                    }}>
                    <CircleStop />
                </Button>
                <Button
                    disabled={status === "ACTIVE"}
                    rounded outlined severity="danger"
                    className={`!p-2 ${status === "ACTIVE" && '!bg-gray-400'}`}
                    size="small"
                    onClick={() => {
                        if (status !== "ACTIVE") {
                            changeCampaignOverallStatus(rowData.id, "ACTIVE");
                            console.log('activate clicked');
                        }
                    }}>
                    <Power />
                </Button>
            </div>
        );
    };

    return (
        <div className="">
            <DataTable
                value={data}
                size="large"
                showGridlines={true}
                stripedRows={true}
                // paginator
                rows={rows}
                totalRecords={totalRecords}
                first={first}
                // onPage={onPage}
                // onSort={onSort}
                // onFilter={onFilter}
                loading={loading}
                sortField={sortField}
                sortOrder={sortOrder}
                // filters={filters}
                filterDisplay="row"
                // className="!border-2 !border-solid !rounded-lg !shadow-lg"
                headerClassName="!text-black !font-bold" // Darken header text
                paginatorClassName="bg-gray-300 rounded-md p-2 flex gap-2"
                currentPageReportClassName="!text-blue-400 !font-bold" // Customize current page report
            // currentPageReportTemplate="Showing {first} to {last} of {totalRecords} products"
            >
                <Column
                    field="id" header="ID"
                    sortable
                // filter
                >
                </Column>
                <Column
                    field="keyword" header="Keyword"
                    sortable
                // filter
                >
                </Column>
                <Column
                    field="industry" header="Industry"
                    sortable
                // filter
                >
                </Column>
                <Column
                    field="city" header="City"
                    sortable
                // filter
                >
                </Column>
                <Column
                    field="distance" header="Distance"
                    sortable
                // filter
                >
                </Column>
                <Column
                    field="email_status" header="Notifications"
                    sortable
                // filter
                >
                </Column>
                <Column
                    field="overall_status" header="Campaign Status"
                    sortable
                // filter
                >
                </Column>
                {/* <Column
                    field="resume" header="Resume"
                    sortable
                // filter
                >
                </Column> */}
                <Column
                    body={actionBodyTemplate}
                    header="Actions"
                >
                </Column>
            </DataTable>
        </div>
    );
};

function AllCampaigns({ globalAuthUserDetails }) {
    return (
        <div className="!mt-8 !px-3">
            <div className="!my-4">
                <h2 className="!text-2xl !text-brand-primary">
                    Hello {globalAuthUserDetails.username}, below are all your campaigns
                </h2>
            </div>
            <CustomServerSideDataTable globalAuthUserDetails={globalAuthUserDetails} />
        </div>
    );
}

export default AllCampaigns