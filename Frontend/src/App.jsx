import './App.css'
import { SendPrompt, TestConnection, CleanResponse } from '../utils/utils.js'
import { useEffect, useState } from 'react';
import { Send, UserCircle } from 'lucide-react';

function App() {
  const [serverStatus, setServerStatus] = useState('Checking server status...');
  const [promptResponse, setPromptResponse] = useState('');
  const [MessageHistory, setMessageHistory] = useState([]);
  const [userInput, setUserInput] = useState('');

  const handleSendPrompt = async (prompt) => {
    try {
      setPromptResponse('Sending prompt...');
      MessageHistory.length === 0 ? setMessageHistory([{ sender: 'user', message: prompt }]) : setMessageHistory(prev => [...prev, { sender: 'user', message: prompt }]);
      setUserInput('');
      const response = await SendPrompt(prompt);
      //const response = {message: "This is a simulated response from the server."};
      const cleanedResponse = CleanResponse(response.message);
      setPromptResponse('Ready to chat!');
      if (cleanedResponse.message) {
        if (cleanedResponse.thought) {
          setMessageHistory(prev => [...prev, { sender: 'bot', thought: cleanedResponse.thought, message: cleanedResponse.message }]);
        } else {
          setMessageHistory(prev => [...prev, { sender: 'bot', thought: "", message: cleanedResponse.message }]);
        }
      }
    } catch (error) {
      console.error('Error sending prompt:', error);
    }
  };

  const handlekeydown = (e) => {
    if (e.key === 'Enter' && userInput.trim() !== '') {
      e.preventDefault();
      handleSendPrompt(userInput);
    }
  };

  const FormatResponse = (response) => {
    if (!response) return null;

    const parts = response.split(/(\*\*.*?\*\*)/g);

    return parts.map((part, index) => {
      if (part.startsWith('**') && part.endsWith('**')) {
        return <strong key={index}>{part.slice(2, -2)}</strong>;
      }
      return part;
    });
  };

  useEffect(() => {
    const checkServer = async () => {
      try {
        const response = await TestConnection();
        setServerStatus(response.message || response);
      }
      catch (error) {
        setServerStatus(error.message || 'Error connecting to server');
      }
    };

    checkServer();
  }, []);

  return (
    <>
      <div className="main-container">
        <div className='header'>
          <h1>GoldiLocks</h1>
          <p>A simple React frontend to test the capabilities of the Azure OpenAI API.</p>
        </div>
        <div className='content'>
          <div className='sidebar'>
            <h2>Chats</h2>
            <div className='chat-list'>
              <div className='chat-item active'>Chat 1</div>
              <div className='chat-item'>Chat 2</div>
              <div className='chat-item'>Chat 3</div>
            </div>
          </div>
          <div className='message-container'>
            <div className='server-stats'>
              <p>Server Status: <span className={promptResponse === 'Ready to chat!' ? 'Green' : promptResponse === 'Sending prompt...' ? 'Yellow' : 'Red'}>{serverStatus}</span></p>
              <p>Server Response: {promptResponse}</p>
            </div>
            <div className='message-box'>
              <div className="prompt-responses">
                {MessageHistory.map((entry, index) => (
                  entry.sender === 'user' ? (
                    <div className='user-m-container'>
                      <div key={index} className='user-message'>
                        <p>{entry.message}</p>
                      </div>
                      <div className='user-icon'><UserCircle size='3rem' /></div>
                    </div>
                  ) : (<div key={index} className='response-block'>
                    {entry.thought && <p className='thought'>Thought: {entry.thought}</p>}
                    <p key={index}>{FormatResponse(entry.message)}</p>
                  </div>)
                ))}
              </div>
            </div>

            <div className='input-box'>
              <input type="text" placeholder="Enter something..." value={userInput} onChange={(e) => setUserInput(e.target.value)} onKeyDown={handlekeydown} />
              <button onClick={() => handleSendPrompt(userInput)} disabled={(promptResponse !== 'Ready to chat!') || !userInput}><Send /></button>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}

export default App
