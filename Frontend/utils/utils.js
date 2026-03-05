
export const SendPrompt = async (prompt) => {
  try {
    const response = await fetch('http://localhost:5000/api/SendPrompt', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ prompt }),
    });

    if (!response.ok) {
      throw new Error('Network response was not ok');
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
    const response = await fetch('http://localhost:5000/api/test', {
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
    const regex = /<think>([\s\S]*?)<\/think>([\s\S]*)/;
    const match = response.match(regex);
    if(match){
        const Obj = { thought: match[1], message: match[2] };
        return Obj;
    }
    return { thought: "", message: response };
};