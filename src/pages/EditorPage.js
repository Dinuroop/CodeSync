import React, { useState, useRef, useEffect } from 'react';
import toast from 'react-hot-toast';
import ACTIONS from '../Actions';
import Client from '../components/Client';
import Editor from '../components/Editor';
import { initSocket } from '../socket';
import {
    useLocation,
    useNavigate,
    Navigate,
    useParams,
} from 'react-router-dom';

const EditorPage = () => {
    const socketRef = useRef(null);
    const codeRef = useRef(null);
    const location = useLocation();
    const { roomId } = useParams();
    const reactNavigator = useNavigate();
    const [clients, setClients] = useState([]);
    const [text,setText] = useState("");
    const [val,setVal] = useState("");

    useEffect(() => {
        const init = async () => {
            socketRef.current = await initSocket();
            // socketRef.current.on('connect_error', (err) => handleErrors(err));
            // socketRef.current.on('connect_failed', (err) => handleErrors(err));

            // function handleErrors(e) {
            //     console.log('socket error', e);
            //     toast.error('Socket connection failed, try again later.');
            //     reactNavigator('/');
            //}

            socketRef.current.emit(ACTIONS.JOIN, {
                roomId,
                username: location.state?.username,
            });

            // Listening for joined event
            socketRef.current.on(
                ACTIONS.JOINED,
                ({ clients, username, socketId }) => {
                    if (username !== location.state?.username) {
                        toast.success(`${username} joined the room.`);
                        console.log(`${username} joined`);
                    }
                    setClients(clients);
                    socketRef.current.emit(ACTIONS.SYNC_CODE, {
                        code: codeRef.current,
                        socketId,
                    });
                }
            );
    
            // Listening for disconnected
            socketRef.current.on(
                ACTIONS.DISCONNECTED,
                ({ socketId, username }) => {
                    toast.success(`${username} left the room.`);
                    setClients((prev) => {
                        return prev.filter(
                            (client) => client.socketId !== socketId
                        );
                    });
                }
            );
        };
        init();
        return () => {
            socketRef.current.disconnect();
            socketRef.current.off(ACTIONS.JOINED);
            socketRef.current.off(ACTIONS.DISCONNECTED);
        };
    }, []);

    async function copyRoomId() {
        try {
            await navigator.clipboard.writeText(roomId);
            toast.success('Room ID has been copied to your clipboard');
        } catch (err) {
            toast.error('Could not copy the Room ID');
            console.error(err);
        }
    }

    function leaveRoom(){
        reactNavigator('/');
    }

    const [something, setSomething] = useState("Hello I am Dinu");

  useEffect(()=>{
    setSomething(val);
    console.log(something);
  },[val])

        function onAdd(){
             setVal("Bro")
           console.log(val)
       }
    

    if (!location.state) {
        return <Navigate to="/"/>;
    }
    
    function downloadFile(filename, content) {
        console.log("Down file")
        const element = document.createElement('a');
        const blob = new Blob([content], { type: 'plain/text' });
        const fileUrl = URL.createObjectURL(blob);
        element.setAttribute('href', fileUrl); 
        element.setAttribute('download', filename); 
        element.style.display = 'none';
        document.body.appendChild(element);
        element.click();
        document.body.removeChild(element);
    }
    
   const handleDownload = () => {
        console.log("Download Start")
          const filename = document.getElementById('filename').value;
          const content = text
          console.log(filename)
          console.log(content)
          if (!filename){
            toast.error('Specify the filename');
          }
          if (filename && content) {
            downloadFile(filename, content);
            setTimeout(()=>toast.success('File is downloaded'),3000)
          }
      };
    
    return (
        <div className="mainWrap">
            <div className="aside">
                <div className="asideInner">
                    <div className="logo" style={{display:"flex", flexDirection:"row"}}>
                        <img style={{height:"20px",width:"20px",borderRadius:"5px",marginTop:"5px", marginRight:"6px"}}
                            className="logoImage"
                            src="/sync1.png"
                            alt="logo"
                        />
                        <h2 style={{marginTop:"0px",marginBottom:"7px"}}> Atune </h2>
                    </div>
                    <h3>Connected</h3>
                    <div className="clientsList">
                        {clients.map((client) => (
                            <Client
                                key={client.socketId}
                                username={client.username}
                            />
                        ))}
                    </div>
                </div>
                <input id ="filename" className="copyBtn"  style={{marginBottom:"10px",backgroundColor:"skyblue",color:"black",borderRadius:"10px"}} placeholder="Specify a filename..." />
                <button className="btn copyBtn" onClick={copyRoomId}>
                    Copy ROOM ID
                </button>
                <button className="btn leaveBtn" onClick={leaveRoom}>
                    Leave
                </button>
                <button className="btn leaveBtn" onClick={onAdd}>
                    ADD
                </button>
            </div>
            <div className="editorWrap">
                <Editor
                    id = 'realtimeEditor'
                    socketRef={socketRef}
                    roomId={roomId}
                    something = {something}
                    // codeRef.current = something;
                    onCodeChange={(text) => {
                        codeRef.current = text;
                        setText(text)
                        console.log(text)
                    }}
                />
                <div className="end" style={{display:"flex",flexDirection:"row"}}>
                <button id="download"  className="btn run-btn" onClick={handleDownload}>
		        Save Code
	            </button>
            </div>
            </div>
        </div>
    );
};

export default EditorPage;
