const express = require('express');
const cors = require('cors');
const app = express();
app.use(cors());
app.use(express.json());

const { InstructionOverride } = require('../MiddleWare/TextJailbreak');

// Environment variables
require('dotenv').config();

const PORT = process.env.PORT || 5000;


//Checks if the user is trying to override instructions or jailbreak the model using Azure Content Safety API
app.post('/api/CheckInstructionOverride', async(req, res) => {
    const {prompt} = req.body;
    try{
        const isJailbreak = await InstructionOverride(prompt);
        res.json({ jailbreak: isJailbreak });
    } catch (error) {
        console.error('Error checking for jailbreak:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    };
});

app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
