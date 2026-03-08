const express = require('express');
const cors = require('cors');
const ratelimit = require('express-rate-limit');

const { InstructionOverride } = require('./InstructionOverridePass');
const { ProtectedCodeCheck } = require('./ProtectedCodePass');
const { anonymizeText } = require('./AnonymizePII');
const { deanonymizeText } = require('./AnonymizePII');
// const {ProtectedMaterialCheck } = require('./ProtectedMaterialPass');
const app = express();

// Rate limiting middleware
const limiter = ratelimit({
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

require('dotenv').config();


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


//Check if the model is directly outputting protected material.
// app.post('/api/CheckProtectedMaterial', async(req, res) => {
//     const {text} = req.body;
//     try{
//         const isProtected = await ProtectedMaterialCheck(text);
//         res.json({isProtected: isProtected}); 
//     }catch (error){
//         console.error('Error checking for jailbreak:', error);
//         res.status(500).json({ error: 'Internal Server Error' });
//     }
// });


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

app.post('/anonymize',async(req,res)=>{
    const {prompt}=req.body;
    try{
        const anonymized=await anonymizeText(prompt);
        mappingStore=anonymized.mapping;
        console.log(anonymized);
    }
    catch(error){
        console.error('Error finding code source:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

app.post('/deanonymize',async(req,res)=>{
    const {response}=req.body;
    try{
        const deanonymized=await deanonymizeText(response,mappingStore);
        mappingStore={};
        console.log(deanonymized);
    }
    catch(error){
        console.error('Error finding code source:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});




app.listen(process.env.PORT || 5000, () => {
    console.log(`Server is running on port ${process.env.PORT || 5000}`);
});
