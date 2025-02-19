const express = require('express');
const mongoose = require('mongoose');
const YourModel = require('./models/YourModel'); // Replace with your actual MongoDB model
const app = express();

// Middleware to parse query parameters
app.use(express.json());

app.get('/your-api-endpoint', async (req, res) => {
    try {
        const { page, rows, sortField, sortOrder, filters } = req.query;

        // Parsing and handling pagination parameters
        const skip = (parseInt(page) - 1) * parseInt(rows);  // Calculate the number of records to skip
        const limit = parseInt(rows);                        // Limit the number of records per page

        // Building the query object for filters
        const query = {};

        if (filters && filters.name) {
            query.name = { $regex: filters.name, $options: 'i' }; // Case-insensitive search for 'name' filter
        }
        if (filters && filters.email) {
            query.email = { $regex: filters.email, $options: 'i' }; // Case-insensitive search for 'email' filter
        }

        // Fetch the total number of documents matching the query
        const totalItems = await YourModel.countDocuments(query);

        // Fetch the filtered and paginated documents from MongoDB
        const data = await YourModel.find(query)
            .skip(skip)             // Skip records based on pagination
            .limit(limit)           // Limit the number of records per page
            .sort({ [sortField]: sortOrder === '1' ? 1 : -1 });  // Sorting (1 for ascending, -1 for descending)

        // Respond with the data and the total count of records
        res.json({
            items: data,
            total: totalItems
        });
    } catch (error) {
        console.error('Error occurred while fetching data:', error);
        res.status(500).send('Internal Server Error');
    }
});

// Connect to MongoDB and start the Express server
mongoose.connect('mongodb://localhost:27017/yourdb', { useNewUrlParser: true, useUnifiedTopology: true })
    .then(() => {
        console.log('Connected to MongoDB');
        app.listen(3001, () => {
            console.log('Server is running on port 3001');
        });
    })
    .catch(err => {
        console.error('Error connecting to MongoDB', err);
    });
