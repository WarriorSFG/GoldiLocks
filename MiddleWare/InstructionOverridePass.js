async function InstructionOverrideCheck(prompt) {    
    if(prompt.length > 1000) prompt = prompt.substring(0, 1000);
    
    try {
        const response = await fetch(`${process.env.AZURE_CONTENT_SAFETY_ENDPOINT}/contentsafety/text:shieldPrompt?api-version=2024-09-01`, {
            method: 'POST',
            headers: {
                'content-type': 'application/json',
                'Ocp-Apim-Subscription-Key': process.env.AZURE_CONTENT_SAFETY_KEY
            },
            body: JSON.stringify({"userPrompt": prompt})
        });

        if(!response.ok){
            const ErrorData = await response.json();
            throw new Error(ErrorData.error?.message || 'Error from Azure Content Safety API');
        }

        const data = await response.json();
        if(data.userPromptAnalysis?.attackDetected) return true;
        return false;
    } catch (error) {
        console.error('Error checking for jailbreak:', error);
        return false; // Added this so your server doesn't hang if an error occurs
    }
} 

module.exports = {
    InstructionOverrideCheck
};