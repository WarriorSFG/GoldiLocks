const PRESIDIO=process.env.PRESIDIO;
async function anonymizeText(content){
    if(!content) return;
    try{
        //detect pii
        const analyzeContent = await fetch(`${PRESIDIO}/anonymize`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
            text: content,
            language: "en"
            })
        });
        if(!analyzeContent.ok){
            throw new Error("Presidio request failed");
        }
        const data=await analyzeContent.json();
        return data;
        
    }catch(error){
        console.log("Error anonymizing PII:",error);
    }
}

async function deanonymizeText(content,mappingStore){
    if(!content) return;
    try{
        const deanonymized=await fetch(`${PRESIDIO}/deanonymize`,{
            method:"POST",
            headers:{
                "Content-Type":"application/json"
            },
            body:JSON.stringify({
            text:content,
            mapping: mappingStore,
            language:"en"
            })
        });
        if(!deanonymized.ok){
            throw new Error("Presidio request failed");
        }
        const data=await deanonymized.json();
        return data;
    }catch(error){
        console.log("Error deanonymizing PII:",error);
    }
}

export default {anonymizeText,deanonymizeText};