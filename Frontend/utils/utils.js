const BACKEND_URL = import.meta.env.VITE_BACKEND_URL;
const MIDDLEWARE_URL = import.meta.env.VITE_MIDDLEWARE_URL;

export const SendPrompt = async (prompt, useMiddleWare, onProgress) => {
  try {
    console.log(useMiddleWare);
    const response = await fetch(`${useMiddleWare? MIDDLEWARE_URL : BACKEND_URL+ '/SendPrompt' }`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ prompt , backendURL: BACKEND_URL +'/SendPrompt'}),
    });

    if (!response.ok) {
      throw new Error('Network response was not ok');
    }

    if(useMiddleWare){
      const reader = response.body.getReader();
      const decoder = new TextDecoder();

      let finalData = null;

      while(true){
        const {done, value} = await reader.read();
        if(done) break;

        const chunk = decoder.decode(value);
        const lines = chunk.split('\n').filter(line => line.trim() != '');

        for(const line of lines){
          const data = JSON.parse(line);

          if(data.finalResponse){
            finalData = {message: data.finalResponse?.restored_text, citations: data.citations?.CodeCitations};
          }else if(onProgress){
            onProgress(data);
          }
        }
      }
      return finalData;
    }


    const data = await response.json();
    return data;

  } catch (error) {
    console.error('Error sending prompt:', error);
    return { message: 'Error sending prompt' };
  }
};

export const TestConnection = async () => {
  try {
    const response = await fetch(`${BACKEND_URL}/test`, {
      method: 'GET'
    });

    if (!response.ok) {
      throw new Error('Network response was not ok');
    }

    const data = await response.json();
    return data;
  } catch (error) {
    return error.message;
  }
};

export const CleanResponse = (response) => {
    const regex = /<think>([\s\S]*?)<\/think>([\s\S]*)/g;
    const match = response.match(regex);

    if(match){
        const Obj = { thought: match[1], message: match[2] };
        return Obj;
    }
    return { thought: "", message: response };
};