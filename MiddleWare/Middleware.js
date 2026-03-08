require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { rateLimit } = require('express-rate-limit');
const { anonymizeText } = require('./AnonymisePII');
const { deanonymizeText } = require('./AnonymisePII');
const { InstructionOverrideCheck } = require('./InstructionOverridePass');
const { ProtectedMaterialCheck } = require('./ProtectedMaterialPass');

const app = express();

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




//Checks if the user is trying to override instructions or jailbreak the model using Azure Content Safety API
app.post('/api/CheckInstructionOverride', async(req, res) => {
    const {prompt} = req.body;
    try{
        const isJailbreak = await InstructionOverrideCheck(prompt);
        res.json({ jailbreak: isJailbreak });
    } catch (error) {
        console.error('Error checking for jailbreak:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    };
});

//Check if the model is directly outputting protected material.
app.post('/api/CheckProtectedMaterial', async(req, res) => {
    const {text} = req.body;
    try{
        const isProtected = await ProtectedMaterialCheck(text);
        res.json({isProtected: isProtected}); 
    }catch (error){
        console.error('Error checking for jailbreak:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

 app.post('/anonymize',async(req,res)=>{
     console.log("Anonymize route called");
    console.log(req.body);

    const {prompt}=req.body;
    try{
        const anonymized=await anonymizeText(prompt);
        const id = Date.now().toString();
        saveMapping(id, anonymized.mapping);
        //console.log(anonymized);
        res.json({
            id: id,
            anonymized_text: anonymized.anonymized_text
        });
    }
    catch(error){
        console.error('Error finding code source:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});
    app.post('/deanonymize',async(req,res)=>{
    const {id, prompt}=req.body;
    try{
        
       
        const mapping = getMapping(id);
        const deanonymized = await deanonymizeText(prompt,mapping);
        console.log(deanonymized);
        res.json({text: deanonymized});
    }
    catch(error){
        console.error('Error finding code source:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});
   
app.listen(process.env.PORT || 5000, () => {
    console.log(`Server is running on port ${process.env.PORT || 5000}`);
});
