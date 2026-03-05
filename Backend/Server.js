const express = require('express');
const cors = require('cors');
const app = express();
app.use(cors());
app.use(express.json());

// Environment variables
require('dotenv').config();
const PORT = process.env.PORT || 5000;
const AZURE_ENDPOINT = process.env.AZURE_ENDPOINT;
const AZURE_KEY = process.env.AZURE_KEY;


app.get('/api/test', (req, res) => {
    res.json({ message: 'Server Online!' });
});

app.post('/api/SendPrompt', async(req, res) => {
    const { prompt } = req.body;

    try{
        const response = await fetch(AZURE_ENDPOINT, {
            method: 'POST',
            headers: {
                'content-type': 'application/json',
                'api-key': AZURE_KEY
            },
            body: JSON.stringify({
                messages: [
                    { role: "system", content: "You are a helpful assistant." },
                    { role: "user", content: prompt }
                ],
                max_tokens: 8192,
            })
        });

        if(!response.ok){
            const ErrorData = await response.json();
            throw new Error(ErrorData.error.message || 'Error from Azure API');
        }
        
        const data = await response.json();
        const Message = data.choices[0].message.content;
        return res.json({ message: Message });

    } catch (error) {
        console.error('Error sending prompt:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});


app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});


