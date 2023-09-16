let APP_ID = "838d80f6aeb842de9a0be0e4bb918825"; // agora APP_ID

let token = null; // token initialized as null since we're not going into securing aur authenticating the site atm
let uid = String(Math.floor(Math.random() * 100000)); // random uid generator

let client;
let channel;

let queryString = window.location.search; // returns the query part of the url after '?' i.e. '?room=123'
let urlParams = new URLSearchParams(queryString); // returns an object of queryString => { room → "123" }
let roomId = urlParams.get('room'); // prints the object value of room >> i.e.123

// if there is no roomId and the device wants to goto index.html, it'll we reverted back to the lobby
if(!roomId) {
    window.location = 'lobby.html';
}

let localeStream; // its for our locale video and mic feed
let remoteStream; // its for the remote video and mic feed
let peerConnection; // stores the object of new RTCPeerConnection

const servers = {
    iceServers:[
        {
            urls:[
                "stun:stun1.l.google.com:19302",
                "stun:stun2.l.google.com:19302",
            ]
        }
    ]
}; // different stun servers

let constraints = {
    video:{
        width:{min:640, ideal:1920, max:1920},
        height:{min:480, ideal:1080, max:1080}
    }, 
    audio:true
}; // setting some constraints for the video so it loads smoothly

let init = async () => {

    client = await AgoraRTM.createInstance(APP_ID); // creating new Agora client by passing the APP_ID
    await client.login({uid, token}); // logging in the client

    channel = client.createChannel(roomId); // creating the channel for client by passing the roomId
    await channel.join(); // making the client join that created channel

    channel.on('MemberJoined', handleUserJoined); // when a 'MemberJoined' the channel calls the particular function
    channel.on('MemberLeft', handleUserLeft); // when a 'MemberLeft' the channel calls the particular function

    client.on('MessageFromPeer', handleMessageFromPeer); // when 'MessageFromPeer' the client calls the particular function

    localeStream = await navigator.mediaDevices.getUserMedia(constraints); // getting the permission for local media device
    document.getElementById('user-1').srcObject = localeStream; // setting up the local media
};

// handles the styling when a user has left
let handleUserLeft = () => {
    document.getElementById('user-2').style.display = 'none'; // removes the video of remote-peer
    document.getElementById('user-1').classList.remove('smallFrame'); // enlarges the video of local device
};

// parses the message object and calls different functions based on some params
let handleMessageFromPeer = async (message, MemberID) => {

    message = JSON.parse(message.text); // parsing the message object
    
    // if the type is an offer, we'll create an Answer
    if(message.type === 'offer') {
        createAnswer(MemberID, message.offer);
    }

    // if the type is an answer, we'll add that Answer
    if(message.type === 'answer') {
        addAnswer(message.answer);
    }

    /*
    * if the type is a candidate, we'll check if there is a peerConnection and if it's true then we'll be adding 
    * that candidate by calling the addIceCandidate() method
    */
    if(message.type === 'candidate') {
        if(peerConnection) {
            peerConnection.addIceCandidate(message.candidate);
        }
    }
};

/*
* whenever a device joins the room, consoles new user has joined along with its ID and 
* calls createOffer function by passing the memberID
*/
let handleUserJoined = async (MemberID) => {
    console.log('A new user has joined: ', MemberID);
    createOffer(MemberID);
};

// this method helps in establishing the peerConnection
let createPeerConnection = async (MemberID) => {
    peerConnection = new RTCPeerConnection(servers); // storing the RTCPeerConnection object in the variable

    remoteStream = new MediaStream(); // getting the media devices of the peer
    document.getElementById('user-2').srcObject = remoteStream; // setting up media devices of the peer
    document.getElementById('user-2').style.display = 'block'; // displaying the video of peer in fullScreen
    document.getElementById('user-1').classList.add('smallFrame'); // collapsing the video of local device

    /*
    * condition check for the local device when the page is refreshed continuosly
    * if the media for local device is already set up and the person refreshes the page, it won't ask for media permission again unless and until the device leaves and join again
    */
    if(!localeStream) {
        localeStream = await navigator.mediaDevices.getUserMedia(constraints); 
        document.getElementById('user-1').srcObject = localeStream; 
    }

    // setting up the media tracks for the localeStream
    localeStream.getTracks().forEach( (tracks) => {
        peerConnection.addTrack(tracks, localeStream);
    });

    // setting up the media tracks for the remoteStream
    peerConnection.ontrack = (event) => {
        event.streams[0].getTracks().forEach( (tracks) => {
            remoteStream.addTrack(tracks);  
        });
    };

    /*
    * if a new iceCandidate is created the client will call the sendMessageToPeer function
    * the peer will then accept the iceCandidates sent to it and send his own iceCandidates in return
    */
    peerConnection.onicecandidate = async (event) => {
        if(event.candidate){
            client.sendMessageToPeer({text:JSON.stringify({'type':'candidate', 'candidate':event.candidate})}, MemberID);
        }
    };
};

let createOffer = async (MemberID) => { 

    // calling the createPeerConnection method()
    await createPeerConnection(MemberID);

    // creating an offer
    let offer = await peerConnection.createOffer(); 
    await peerConnection.setLocalDescription(offer); // changes the local description associated with the connection

    // the client sends the offer to the peer
    client.sendMessageToPeer({text:JSON.stringify({'type':'offer', 'offer':offer})}, MemberID);
};

let createAnswer = async (MemberID, offer) => {

    // calling the createPeerConnection method()
    await createPeerConnection(MemberID);

    // sets the specified session description as the remote peer's current offer or answer
    await peerConnection.setRemoteDescription(offer);

    // creates an Answer
    let answer = await peerConnection.createAnswer();
    await peerConnection.setLocalDescription(answer); // changes the local description associated with the connection

    // peer sends the Answer back to the local Device
    client.sendMessageToPeer({text:JSON.stringify({'type':'answer', 'answer':answer})}, MemberID);
};

let addAnswer = async (answer) => {
    // if there is no remote end of the connection, sets the specified session description as the remote peer's current offer or answer
    if(!peerConnection.currentRemoteDescription) {
        peerConnection.setRemoteDescription(answer);
    }
};

// removes the device from the room 
let leaveChannel = async () => {
    await channel.leave();
    await client.logout();
};

// handles the on and off toggling of the camera button
let toggleCamera = async () => {
    let videoTrack = localeStream.getTracks().find(track => track.kind === 'video');

    if(videoTrack.enabled) {
        videoTrack.enabled = false;
        document.getElementById('camera-btn').style.backgroundColor = 'rgba(255, 80, 80, 1)';
    } else {
        videoTrack.enabled = true;
        document.getElementById('camera-btn').style.backgroundColor = 'rgba(35, 144, 255, 0.9)';
    }
};

// handles the on and off toggling of the camera button
let toggleMic = async () => {
    let audioTrack = localeStream.getTracks().find(track => track.kind === 'audio');

    if(audioTrack.enabled) {
        audioTrack.enabled = false;
        document.getElementById('mic-btn').style.backgroundColor = 'rgba(255, 80, 80, 1)';
    } else {
        audioTrack.enabled = true;
        document.getElementById('mic-btn').style.backgroundColor = 'rgba(35, 144, 255, 0.9)';
    }
};

let invite = async () => {
    let url = document.location.href;
    navigator.clipboard.writeText(url);
    window.alert(`link copied ${url}`);
};

window.addEventListener('beforeunload', leaveChannel); // if a device just closes the window without leaving the room it makes sure to remove that particular device from the call
document.getElementById('camera-btn').addEventListener('click', toggleCamera); // turn off the camera when the button is pressed
document.getElementById('mic-btn').addEventListener('click', toggleMic); // turn off the mic when the button is pressed
document.getElementById('invite-btn').addEventListener('click', invite);

init(); // this function gets called everytime the page is refreshed and is responsible for creating the client and the channel
