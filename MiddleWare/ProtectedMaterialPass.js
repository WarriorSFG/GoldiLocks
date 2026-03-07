export async function(output){
    if(!output) return;

    try{
        const response = await fetch(`${process.env.AZURE_CONTENT_SAFETY_ENDPOINT}/contentsafety/text:detectProtectedMaterial?api-version=2024-09-01`, {
            method: 'POST',
            headers: {
                'content-type': 'application/json',
                'Ocp-Apim-Subscription-Key': process.env.AZURE_CONTENT_SAFETY_KEY
            }
        });
    }
}