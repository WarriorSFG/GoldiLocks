export async function analyzeTextHarms(text) {
    try {
        const response = await fetch(`${process.env.AZURE_CONTENT_SAFETY_ENDPOINT}/contentsafety/text:analyze?api-version=2024-09-01`, {
            method: 'POST',
            headers: {
                'content-type': 'application/json',
                'Ocp-Apim-Subscription-Key': process.env.AZURE_CONTENT_SAFETY_KEY
            },
            body: JSON.stringify({
                "text": text,
                "categories": ["Hate", "Sexual", "SelfHarm", "Violence"],
                "outputType": "FourSeverityLevels"
            })
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error?.message || 'Azure Analysis Error');
        }

        const data = await response.json();
        
        // Convert the array response into a simple object: { Hate: 0, Violence: 2, ... }
        return data.categoriesAnalysis.reduce((acc, item) => {
            acc[item.category] = item.severity;
            return acc;
        }, {});

    } catch (error) {
        console.error('Error in Text Analysis:', error.message);
        return null; 
    }
}