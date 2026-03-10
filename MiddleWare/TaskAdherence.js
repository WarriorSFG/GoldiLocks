const dotenv = require('dotenv');
dotenv.config();

const AZURE_CONTENT_SAFETY_ENDPOINT = process.env.AZURE_CONTENT_SAFETY_ENDPOINT;
async function TaskAdherence(tools,messages){
    try{
        const response=await fetch(`${AZURE_CONTENT_SAFETY_ENDPOINT}/contentsafety/image:analyze?api-version=2025-09-15-preview`,{
            method:'POST',
            headers:{
                'Content-Type': 'application/json',
                'Ocp-Apim-Subscription-Key': process.env.AZURE_CONTENT_SAFETY_KEY
            },
            body:JSON.stringify({
                tools:tools,
                messages:messages
            })

        });
          if (!response.ok) {
             const errorBody = await response.text();
                throw new Error(`Azure Task Adherence API error: ${response.status}`);
            }

            const data = await response.json();
            return data;
            }catch(error){
                console.error("Error implementing task adherence:",error);
                return { error: error.message }; 
        }

};

module.exports = {
    TaskAdherence
};