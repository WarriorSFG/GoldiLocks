import './App.css'
import { SendPrompt, TestConnection, CleanResponse } from '../utils/utils.js'
import { useEffect, useState } from 'react';
import { Send, User2 } from 'lucide-react';

function App() {
  const [serverStatus, setServerStatus] = useState('Checking server status...');
  const [promptResponse, setPromptResponse] = useState('');
  const [MessageHistory, setMessageHistory] = useState([]);
  const [useMiddleWare, setUseMiddleWare]= useState(true);
  const [SecurityStep, setSecurityStep] = useState([]);
  const [userInput, setUserInput] = useState('');
  
  const handleSendPrompt = async (prompt) => {
    try {
      setPromptResponse('Sending prompt...');
      MessageHistory.length === 0 ? setMessageHistory([{ sender: 'user', message: prompt, isDeleted:false }]) : setMessageHistory(prev => [...prev, { sender: 'user', message: prompt, isDeleted:false}]);
      
      setUserInput('');
      setSecurityStep([]);
      const handleProgress = (updateData) =>{
        if(updateData.isError){
          console.log(`Blocked [${updateData.step}]: ${updateData.message}`);
          setSecurityStep(prev => [...prev, {message:`Blocked [${updateData.step}]: ${updateData.message}`, isError:updateData.isError, id: Date.now()}]);
          setMessageHistory(prev => {
            const newHistory = [...prev];
            newHistory[newHistory.length - 1] = {
              sender: 'user',
              message: `Content was Removed`,
              isDeleted:true
            };
            return newHistory;
          });
        }else{
          console.log(`[${updateData.step}]: ${updateData.message}`);
          setSecurityStep(prev => [...prev, {
            message: `[${updateData.step}]: ${updateData.message}`, 
            isError: updateData.isError, 
            id: Date.now() + Math.random()
          }]);
        }
      }

      const response = await SendPrompt(prompt, useMiddleWare, handleProgress);

      if(!response || response.error){
        return;
      }
      const cleanedResponse = CleanResponse(response.message);
      setPromptResponse('Ready to chat!');

      if (cleanedResponse.message) {
        if (cleanedResponse.thought) {
          setMessageHistory(prev => [...prev, { sender: 'bot', thought: cleanedResponse.thought, message: cleanedResponse.message }]);
        } else {
          setMessageHistory(prev => [...prev, { sender: 'bot', thought: "", message: cleanedResponse.message }]);
        }
      }
      
      if (response.citations) {
          console.log("Citations found:", response.citations);
      }

    } catch (error) {
      console.error('Error sending prompt:', error);
      setPromptResponse('An error occured');
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
          <div className='logo'>O</div>
          <h1>Orion</h1>
            <div className='server-stats'>
              <div className='stat'>
                <p><span className={promptResponse === 'Ready to chat!' ? 'Green' : promptResponse === 'Sending prompt...' ? 'Yellow' : 'Red'}>{serverStatus}</span></p>
              </div>
            </div>
        </div>
        <div className='content'>
          <div className='sidebar'>
            <h2>Chats</h2>
            <div className='chat-list'>
              <div className='chat-item active'>Chat 1</div>
              <div className='chat-item'>Chat 2</div>
              <div className='chat-item'>Chat 3</div>
            </div>
            <div className='chat-list'>
              <div className='security-layer'>
                <h3>GoldiLocks Security Layer</h3>
                {SecurityStep.map((entry) => (
                  <div key={entry.id} className={`security-pass Error-${entry.isError}`}>
                    {entry.message}
                  </div>
                ))}
              </div>
            </div>
            <div className='security-enable-button'>
              <button onClick={() => setUseMiddleWare(!useMiddleWare)}>{useMiddleWare ? "Turn off Security" : "Turn on Security"}</button>
            </div>
          </div>
          <div className='message-container'>
            <div className='message-box'>
              <div className="prompt-responses">
                {MessageHistory.map((entry, index) => (
                  entry.sender === 'user' ? (
                    <div className='user-m-container'>
                      <div key={index} className={`user-message isDeleted-${entry.isDeleted}`}>
                        <p>{entry.message}</p>
                      </div>
                      <div className='user-icon'><User2 size='2rem' /></div>
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
