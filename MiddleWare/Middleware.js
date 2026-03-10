require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { rateLimit } = require('express-rate-limit');
const { anonymizeText } = require('./AnonymisePII');
const { deanonymizeText } = require('./AnonymisePII');
const { InstructionOverrideCheck } = require('./InstructionOverridePass');
const { ProtectedMaterialCheck } = require('./ProtectedMaterialPass');
const { ProtectedCodeCheck}=require('./ProtectedCodePass');
const {TaskAdherence}=require('./TaskAdherence');
const {analyzeTextHarms}=require('./analyseText');
const app=express();
const { PromptSizePass } = require('./PromptSizePass');
const { FetchResponse } = require('./FetchResponse');


// Rate limiting middleware
const limiter = rateLimit({
    windowMs: 60 * 1000,
    max: 30,
    message: { error: 'Too many requests, please try again later.' }
})
//mapping 
const mappingStore = {};

function saveMapping(id, mapping) {
    mappingStore[id] = mapping;
}

function getMapping(id) {
    return mappingStore[id];
}
app.use(limiter);
app.use(cors());
app.use(express.json());


app.post('/api/CheckPromptSize', (req,res) => {
    const {prompt} = req.body;
    try{
        const isValidSize = PromptSizePass(prompt);
        res.json({ validSize: isValidSize });
    } catch (error) {
        console.error('Error checking prompt size:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

//Checks if the user is trying to override instructions or jailbreak the model using Azure Content Safety API
app.post('/api/CheckInstructionOverride', async (req, res) => {
    const { prompt } = req.body;
    try {
        const isJailbreak = await InstructionOverrideCheck(prompt);
        res.json({ jailbreak: isJailbreak });
    } catch (error) {
        console.error('Error checking for jailbreak:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    };
});


//text analysis on 4 parameters- self harm, sexual,hate,violence
app.post('/api/textAnalysis', async (req, res) => {
    const { prompt } = req.body;
    
    // Run checks
    const harmScores = await analyzeTextHarms(prompt);

    // Security Logic: Block if it's a jailbreak OR if any category is >= 1 (Medium/High)
    const shouldBlock =  Object.values(harmScores).some(score => score >= 1);

    res.json({
        allowed: !shouldBlock,
        harms: harmScores
    });
});

//Check if the model is directly outputting protected material.
app.post('/api/CheckProtectedMaterial', async (req, res) => {
    const { text } = req.body;
    try {
        const isProtected = await ProtectedMaterialCheck(text);
        res.json({ isProtected: isProtected });
    } catch (error) {
        console.error('Error checking for jailbreak:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

//Provide links if github code found 
app.post('/api/CheckProtectedCode', async(req, res) => {
    const {code} = req.body;
    try{
        const links= await ProtectedCodeCheck(code);
        if(links){
            return links;
        }
        
    }catch (error){
        console.error('Error finding code source:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

//Anonymize PII in the prompt using Presidio and store the mapping in memory. This is a simple implementation and can be improved by using a database or cache for larger scale applications.
app.post('/api/anonymize', async (req, res) => {
    const { prompt } = req.body;
    try {
        const anonymized = await anonymizeText(prompt);
        const id = Date.now().toString();
        saveMapping(id, anonymized.mapping);
        res.json({
            id: id,
            anonymized_text: anonymized.anonymized_text
        });
    }
    catch (error) {
        console.error('Error finding code source:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

//Deanonymize the text using the mapping stored in memory. Again, this is a simple implementation and can be improved by using a database or cache for larger scale applications.
app.post('/api/deanonymize', async (req, res) => {
    const { id, prompt } = req.body;
    try {
        const mapping = getMapping(id);
        const deanonymized = await deanonymizeText(prompt, mapping);
        res.json({ text: deanonymized });
    }
    catch (error) {
        console.error('Error finding code source:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

app.post('/api/taskadherence', async (req, res) => {
    const { tools,messages } = req.body;
    try {
       
        const response = await TaskAdherence(tools,messages);
        res.json(response);
    }
    catch (error) {
        console.error('Error finding code source:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

app.post('/api/query', async (req, res) => {
    const { backendURL, prompt } = req.body;

    res.setHeader('Content-Type', 'application/x-ndjson');
    res.setHeader('Transfer-Encoding', 'chunked');

    const sendUpdate = (step, message, isError = false) => {
        res.write(JSON.stringify({ step, message, isError }) + '\n');
    }

    sendUpdate('Connection', 'MiddleWare connection established');

    const isValidSize = await PromptSizePass(prompt);
    if (!isValidSize) {
        sendUpdate('Size Check', 'Prompt size exceeds allowed limit', true);
        return res.end();
    }

    sendUpdate('Size Check', 'Prompt size was appropiate');
    try {

        const anonymizedObj = await anonymizeText(prompt);
        if (!anonymizedObj) {
            sendUpdate('Encrypt Data', 'Failed to encrypt data', true);
            return res.end();
        }

        sendUpdate('Encrypt Data', 'Encrypted all personal details');
        const text = anonymizedObj.anonymized_text;

        const isJailBreakPrompt = await InstructionOverrideCheck(text);
        if (isJailBreakPrompt) {
            sendUpdate('JailBreak Detection', 'Trying to jailbreak application', true);
            return res.end()
        }
        sendUpdate('JailBreak Detection', 'No jailbreak detected');

        const isGoodText = !Object.values(await analyzeTextHarms(text)).some(value => value >= 1);
        if (!isGoodText) {
            sendUpdate('Adverserial Use', 'Misuse of LLM detected', true);
            return res.end();
        };

        sendUpdate('Adverserial Use', 'No inappropiate usage detected');

        const BackendRes = await FetchResponse(backendURL, text);
        if (!BackendRes) {
            sendUpdate('Connection', 'Failed to connect to backend', true);
            return res.end();
        }

        sendUpdate('Connection', 'feteched data from backend');

        const resText = BackendRes.message;

        const isCopyRighted = await ProtectedMaterialCheck(resText);
        if (isCopyRighted) {
            sendUpdate('Copyright Protection', 'output contains copyrighted content', true);
            return res.end();
        }

        sendUpdate('Copyright Protection', 'no copyrighted content present');

        const Citations = await ProtectedCodeCheck(resText);

        sendUpdate('Citations', 'retrieved citations');

        const Response = await deanonymizeText(BackendRes.message, anonymizedObj.mapping);

        sendUpdate('Decrypt', 'decrypted message to restore details');
        
        res.write(JSON.stringify({ finalResponse: Response, citations: Citations }) + '\n');
        return res.end();
    }
    catch (error) {
        console.log('Pipeline error', error);
        sendUpdate('System Error', 'An internal error occurred', true);
        return res.end();
    }
});

app.listen(process.env.PORT || 5000, () => {
    console.log(`Server is running on port ${process.env.PORT || 5000}`);
});
