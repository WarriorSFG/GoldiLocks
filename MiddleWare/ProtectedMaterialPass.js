async function ProtectedMaterialCheck(output){
    try{
        const response = await fetch(`${process.env.AZURE_CONTENT_SAFETY_ENDPOINT}/contentsafety/text:detectProtectedMaterial?api-version=2024-09-01`, {
            method: 'POST',
            headers: {
                'content-type': 'application/json',
                'Ocp-Apim-Subscription-Key': process.env.AZURE_CONTENT_SAFETY_KEY
            },
            body: JSON.stringify({"text": output})
        });

        if(!response.ok){
            const ErrData = await response.json();
            throw new Error(ErrData.error?.message || 'Error from Azure Content Safety API')
        }

        const data = await response.json();
        if(data.protectedMaterialAnalysis?.detected) return true;
        return false;
    }catch(err){
        console.error('Error checking for protected material:', err);
        return false; 
    }
};

module.exports = {
    ProtectedMaterialCheck
};