const axios = require("axios");
const PRESIDIO=process.env.PRESIDIO;
console.log("Presidio URL:", PRESIDIO);
async function anonymizeText(text) {
 try{
        const response = await axios.post(`${PRESIDIO}/anonymize`,
            {
              text: text
            }
    );
    return response.data;
    } catch(error){
        console.error("Presidio error:", error.message);
        throw error;
    }
   }

async function deanonymizeText(text, mapping) {
 try{
        const response = await axios.post(`${PRESIDIO}/deanonymize`,
            {
              text: text,
              mapping: mapping
            }
    );
    return response.data;
    } catch(error){
        console.error("Presidio error:", error.message);
        throw error;
    }
   }

   module.exports = {
    anonymizeText,
    deanonymizeText
   };

// export async function AnonymizePII(content){
//     if(!content) return;
//     try{
//         //detect pii
//         const analyzeContent = await fetch(`${PRESIDIO}/anonymize`, {
//             method: "POST",
//             headers: {
//                 "Content-Type": "application/json"
//             },
//             body: JSON.stringify({
//             text: content,
//             language: "en"
//             })
//         });
//         if(!response.ok){
//             throw new Error("Presidio request failed");
//         }
//         const data=await response.json();
//         return data;
        
//     }catch(error){
//         console.log("Error anonymizing PII:",error);
//     }
// }