export async function ProtectedCodeCheck(code){
    if(!code) return;

    console.log(code);
    try{
        const response = await fetch(`${process.env.AZURE_CONTENT_SAFETY_ENDPOINT}/contentsafety/text:detectProtectedMaterialForCode?api-version=2024-09-15-preview`, {
            method: 'POST',
            headers: {
                'content-type': 'application/json',
                'Ocp-Apim-Subscription-Key': process.env.AZURE_CONTENT_SAFETY_KEY
            },
            body: JSON.stringify({"code":code})
        });

        if(!response.ok){
            const ErrData = await response.json();
            console.error(ErrData.error?.message || 'Error from Azure Content Saftey API')
        }

        const data=await response.json();
        console.log("Protected code sources:",data);
        return data;
    }
    catch(error){
        console.error("Error detecting protected code:",error);
    }
}