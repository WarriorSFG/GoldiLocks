export async function FetchResponse(BackendURL, prompt) {
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
            const errorData = await response.json();
            throw new Error(errorData.error?.message || 'Failed to fetch backend');
        }

        const data = await response.json();
        return data;
    }catch (Err){
        console.log(Err.error?.message || 'Internal Server Error');
    }
}