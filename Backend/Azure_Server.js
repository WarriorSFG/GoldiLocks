const { app } = require('@azure/functions');

app.http('TestEndpoint', {
    methods: ['GET'],
    authLevel: 'anonymous',
    route: 'api/test',
    handler: async (request, context) => {
        return { jsonBody: { message: 'Server Online!' } };
    }
});

app.http('SendPromptEndpoint', {
    methods: ['POST'],
    authLevel: 'anonymous',
    route: 'api/SendPrompt',
    handler: async (request, context) => {
        try {
            const body = await request.json();
            const prompt = body.prompt;

            const AZURE_ENDPOINT = process.env.AZURE_ENDPOINT;
            const AZURE_KEY = process.env.AZURE_KEY;

            const response = await fetch(AZURE_ENDPOINT, {
                method: 'POST',
                headers: {
                    'content-type': 'application/json',
                    'api-key': AZURE_KEY
                },
                body: JSON.stringify({
                    messages: [
                        { role: "system", content: "You are a helpful assistant." },
                        { role: "user", content: prompt }
                    ],
                    max_tokens: 8192,
                })
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error?.message || 'Error from Azure API');
            }
            
            const data = await response.json();
            const message = data.choices[0].message.content;
            
            return { jsonBody: { message: message } };

        } catch (error) {
            context.error('Error sending prompt:', error);
            return { status: 500, jsonBody: { error: 'Internal Server Error' } };
        }
    }
});