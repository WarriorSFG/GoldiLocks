async function FetchResponse(BackendURL, prompt) {
    try{
        const response = await fetch(BackendURL, {
            method:'POST',
            headers:{
                'content-type':'application/json'
            },
            body:JSON.stringify({
                "prompt":prompt
            })
        })

        if(!response.ok){
            const errorData = await response.json().catch(() => ({}));
            const errorMessage = errorData.error?.message || `Server Error: ${response.status}`;
            return { error: true, message: errorMessage };
        }

        const data = await response.json();
        return data;
    }catch (Err){
        console.log(Err.error?.message || 'Internal Server Error');
    }
};

module.exports = {
    FetchResponse
};