import React, { useRef, useEffect, useState } from "react";

function CallModal({
  friend,
  socket,
  type,
  onClose,
  isCaller,
  incomingOffer,
  callDeclined,
}) {
  const localVideoRef = useRef(null);
  const remoteVideoRef = useRef(null);
  const localAudioRef = useRef(null);
  const remoteAudioRef = useRef(null);
  const peerRef = useRef(null);
  const iceCandidateQueue = useRef([]);
  const [callAccepted, setCallAccepted] = useState(false);
  const [muted, setMuted] = useState(false);
  const [showIncomingPopup, setShowIncomingPopup] = useState(
    !isCaller && !!incomingOffer
  );

  useEffect(() => {
    let stream;

    if (isCaller) {
      (async () => {
        stream = await navigator.mediaDevices.getUserMedia({
          video: type === "video",
          audio: true,
        });
        if (type === "video") {
          if (localVideoRef.current) localVideoRef.current.srcObject = stream;
        } else {
          if (localAudioRef.current) localAudioRef.current.srcObject = stream;
        }
        peerRef.current = new RTCPeerConnection({
          iceServers: [{ urls: "stun:stun.l.google.com:19302" }],
        });
        stream
          .getTracks()
          .forEach((track) => peerRef.current.addTrack(track, stream));
        peerRef.current.onicecandidate = (event) => {
          if (event.candidate) {
            socket.emit("ice-candidate", {
              to: friend._id,
              candidate: event.candidate,
            });
          }
        };
        peerRef.current.ontrack = (event) => {
          if (type === "video") {
            if (remoteVideoRef.current)
              remoteVideoRef.current.srcObject = event.streams[0];
          } else {
            if (remoteAudioRef.current)
              remoteAudioRef.current.srcObject = event.streams[0];
          }
        };
        const offer = await peerRef.current.createOffer();
        await peerRef.current.setLocalDescription(offer);
        socket.emit("call-user", { to: friend._id, offer, type });
      })();
    }

    socket.on("call-accepted", async ({ answer }) => {
      if (peerRef.current) {
        await peerRef.current.setRemoteDescription(
          new window.RTCSessionDescription(answer)
        );
        setCallAccepted(true);
        while (iceCandidateQueue.current.length > 0) {
          const queued = iceCandidateQueue.current.shift();
          await peerRef.current.addIceCandidate(
            new window.RTCIceCandidate(queued)
          );
        }
      }
    });

    socket.on("ice-candidate", async ({ candidate }) => {
      if (peerRef.current && candidate) {
        if (
          peerRef.current.remoteDescription &&
          peerRef.current.remoteDescription.type
        ) {
          try {
            await peerRef.current.addIceCandidate(
              new window.RTCIceCandidate(candidate)
            );
          } catch (err) {
            console.error("Error adding received ice candidate", err);
          }
        } else {
          iceCandidateQueue.current.push(candidate);
        }
      }
    });

    socket.on("call-ended", () => {
      cleanup();
      onClose();
    });

    function cleanup() {
      if (peerRef.current) peerRef.current.close();
      if (stream) stream.getTracks().forEach((track) => track.stop());
    }

    return () => {
      socket.off("call-accepted");
      socket.off("ice-candidate");
      socket.off("call-ended");
      cleanup();
    };
  }, [friend, socket, type, onClose, isCaller]);

  const handleAcceptCall = async () => {
    setShowIncomingPopup(false);
    const { from, offer, incomingType } = incomingOffer;
    const stream = await navigator.mediaDevices.getUserMedia({
      video: incomingType === "video",
      audio: true,
    });
    if (incomingType === "video") {
      if (localVideoRef.current) localVideoRef.current.srcObject = stream;
    } else {
      if (localAudioRef.current) localAudioRef.current.srcObject = stream;
    }
    peerRef.current = new RTCPeerConnection({
      iceServers: [{ urls: "stun:stun.l.google.com:19302" }],
    });
    stream
      .getTracks()
      .forEach((track) => peerRef.current.addTrack(track, stream));
    peerRef.current.onicecandidate = (event) => {
      if (event.candidate) {
        socket.emit("ice-candidate", {
          to: from,
          candidate: event.candidate,
        });
      }
    };
    peerRef.current.ontrack = (event) => {
      if (incomingType === "video") {
        if (remoteVideoRef.current)
          remoteVideoRef.current.srcObject = event.streams[0];
      } else {
        if (remoteAudioRef.current)
          remoteAudioRef.current.srcObject = event.streams[0];
      }
    };
    await peerRef.current.setRemoteDescription(
      new window.RTCSessionDescription(offer)
    );
    const answer = await peerRef.current.createAnswer();
    await peerRef.current.setLocalDescription(answer);
    socket.emit("answer-call", { to: from, answer });
    setCallAccepted(true);
    while (iceCandidateQueue.current.length > 0) {
      const queued = iceCandidateQueue.current.shift();
      await peerRef.current.addIceCandidate(new window.RTCIceCandidate(queued));
    }
  };

  const handleDeclineCall = () => {
    socket.emit("call-declined", { to: incomingOffer?.from });
    setShowIncomingPopup(false);
    onClose();
  };

  const handleEndCall = () => {
    socket.emit("call-ended", { to: friend._id });
    onClose();
  };

  const handleMute = () => {
    setMuted((prev) => !prev);
    if (type === "video") {
      if (localVideoRef.current && localVideoRef.current.srcObject) {
        localVideoRef.current.srcObject.getAudioTracks().forEach((track) => {
          track.enabled = !muted;
        });
      }
    } else {
      if (localAudioRef.current && localAudioRef.current.srcObject) {
        localAudioRef.current.srcObject.getAudioTracks().forEach((track) => {
          track.enabled = !muted;
        });
      }
    }
  };

  // ✅ Helper functions for image handling
  const BASE_URL = import.meta.env.VITE_API_URL?.replace("/api", "") || "";

  const getImageUrl = (imagePath) => {
  console.log("🔍 Processing image path:", imagePath);
  
  if (!imagePath) {
    console.log("❌ No image path provided");
    return null;
  }
  
  if (imagePath.startsWith("http")) {
    console.log("✅ Full URL:", imagePath);
    return imagePath;
  }
  
  if (imagePath.startsWith("/uploads/")) {
    const finalUrl = `${BASE_URL}${imagePath}`;
    console.log("✅ Uploads path:", finalUrl);
    return finalUrl;
  }
  
  const finalUrl = `${BASE_URL}/uploads/profiles/${imagePath}`;
  console.log("✅ Filename only:", finalUrl);
  return finalUrl;
};

const getProfileImage = () => {
  console.log("🔍 Getting profile image...");
  console.log("Friend profilePic:", friend?.profilePic);
  console.log("Friend additionalPhotos:", friend?.additionalPhotos);
  
  if (friend?.profilePic) {
    const url = getImageUrl(friend.profilePic);
    console.log("✅ Profile pic URL:", url);
    if (url) return url;
  }
  
  if (friend?.additionalPhotos && friend.additionalPhotos.length > 0) {
    const url = getImageUrl(friend.additionalPhotos[0]);
    console.log("✅ Additional photo URL:", url);
    if (url) return url;
  }
  
  console.log("❌ No image found, returning null");
  return null;
};

const profileImage = getProfileImage();
console.log("🖼️ FINAL PROFILE IMAGE:", profileImage);

  const getInitials = (name) => {
    if (!name) return "?";
    return name
      .split(" ")
      .map((word) => word[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };


  // ✅ Profile Image Component with Fallback
  const ProfileAvatar = ({ size = "w-24 h-24", showStatus = false }) => (
    <div className={`relative ${size}`}>
      <div
        className={`${size} rounded-full border-4 border-amber-400 shadow-lg overflow-hidden`}
      >
        {profileImage ? (
          <img
            src={profileImage}
            alt={friend?.name}
            className="w-full h-full object-cover"
            onError={(e) => {
              e.target.style.display = "none";
              e.target.nextElementSibling.style.display = "flex";
            }}
          />
        ) : null}
        <div
          className="w-full h-full bg-gradient-to-br from-amber-400 to-orange-400 flex items-center justify-center text-white font-bold"
          style={{
            display: profileImage ? "none" : "flex",
            fontSize: size === "w-28 h-28" ? "2rem" : "1.5rem",
          }}
        >
          {getInitials(friend?.name)}
        </div>
      </div>
      {showStatus && (
        <span className="absolute bottom-2 right-2 w-6 h-6 bg-gradient-to-br from-green-400 to-emerald-500 rounded-full border-2 border-white shadow-lg"></span>
      )}
    </div>
  );

  if (showIncomingPopup) {
    return (
      <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50">
        <div className="bg-gradient-to-br from-slate-900 via-slate-800 to-amber-900/30 rounded-3xl p-8 shadow-2xl border border-amber-500/30 flex flex-col items-center min-w-[350px] max-w-xs w-full relative">
          <h2 className="text-2xl font-bold text-amber-200 mb-4">
            Incoming{" "}
            {incomingOffer?.incomingType === "video" ? "Video" : "Audio"} Call
          </h2>
          <ProfileAvatar />
          <p className="text-lg text-white mb-6 mt-4">
            {friend?.name} is calling you...
          </p>
          <div className="flex gap-6">
            <button
              onClick={handleAcceptCall}
              className="px-6 py-3 bg-gradient-to-r from-green-500 to-emerald-600 text-white rounded-xl font-semibold shadow-lg hover:scale-105 transition-all duration-200"
            >
              Accept
            </button>
            <button
              onClick={handleDeclineCall}
              className="px-6 py-3 bg-gradient-to-r from-red-500 to-red-600 text-white rounded-xl font-semibold shadow-lg hover:scale-105 transition-all duration-200"
            >
              Decline
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <>
      {callDeclined && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50">
          <div className="bg-gradient-to-br from-slate-900 via-slate-800 to-red-900/30 rounded-3xl p-8 shadow-2xl border border-red-500/30 flex flex-col items-center min-w-[350px] max-w-xs w-full relative">
            <h2 className="text-2xl font-bold text-red-200 mb-4">
              Call Declined
            </h2>
            <p className="text-lg text-white mb-6">
              {friend?.name} declined your call.
            </p>
            <button
              onClick={() => onClose()}
              className="px-6 py-3 bg-gradient-to-r from-slate-700 to-slate-900 text-white rounded-xl font-semibold shadow-lg hover:scale-105 transition-all duration-200"
            >
              Close
            </button>
          </div>
        </div>
      )}

      {!callDeclined && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50">
          <div className="bg-gradient-to-br from-slate-900 via-slate-800 to-amber-900/30 rounded-3xl p-8 shadow-2xl border border-amber-500/30 flex flex-col items-center min-w-[350px] max-w-xs w-full relative">
            {type === "audio" ? (
              <div className="flex flex-col items-center w-full">
                <ProfileAvatar size="w-28 h-28" showStatus={true} />
                <h2 className="text-2xl font-bold text-amber-200 mb-1 mt-4">
                  {friend?.name}
                </h2>
                <p className="text-slate-400 text-base mb-6">
                  {callAccepted ? "Connected" : "Calling..."}
                </p>
                <div className="flex items-center justify-center gap-8 mt-2">
                  <button
                    onClick={handleMute}
                    className={`w-14 h-14 rounded-full flex items-center justify-center bg-gradient-to-br from-slate-700 to-slate-800 border border-amber-500/30 shadow-lg hover:scale-110 transition-all duration-200 ${
                      muted ? "text-red-400" : "text-amber-300"
                    }`}
                    title={muted ? "Unmute" : "Mute"}
                  >
                    {muted ? (
                      <svg
                        className="w-7 h-7"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth="2"
                          d="M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z"
                        />
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth="2"
                          d="M17 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2"
                        />
                      </svg>
                    ) : (
                      <svg
                        className="w-7 h-7"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth="2"
                          d="M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z"
                        />
                      </svg>
                    )}
                  </button>
                  <button
                    onClick={handleEndCall}
                    className="w-14 h-14 rounded-full flex items-center justify-center bg-gradient-to-br from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white border border-red-400 shadow-lg font-bold transition-all duration-200 hover:scale-110"
                    title="End Call"
                  >
                    <svg
                      className="w-7 h-7"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="2"
                        d="M6 18L18 6M6 6l12 12"
                      />
                    </svg>
                  </button>
                </div>
                <audio ref={remoteAudioRef} autoPlay className="hidden" />
                <audio ref={localAudioRef} autoPlay muted className="hidden" />
              </div>
            ) : (
              <>
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-12 h-12 rounded-full bg-gradient-to-br from-amber-500 via-orange-500 to-red-500 flex items-center justify-center text-white font-bold text-xl shadow-lg border-2 border-amber-300/50">
                    <svg
                      className="w-7 h-7"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="2"
                        d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z"
                      />
                    </svg>
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-amber-200">
                      Video Call
                    </h2>
                    <p className="text-slate-400 text-sm">
                      {callAccepted ? "Connected" : "Calling..."}
                    </p>
                  </div>
                </div>
                <video
                  ref={remoteVideoRef}
                  autoPlay
                  className="w-64 h-40 rounded-2xl bg-black border border-slate-700 shadow-lg object-cover mb-2"
                  style={{ background: "#222" }}
                />
                <video
                  ref={localVideoRef}
                  autoPlay
                  muted
                  className="w-24 h-16 rounded-xl border border-amber-500/30 shadow-md object-cover absolute bottom-24 right-8"
                  style={{ background: "#222" }}
                />
                <button
                  onClick={handleEndCall}
                  className="mt-8 px-6 py-3 bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white rounded-xl font-semibold shadow-lg transition-all duration-200 hover:scale-105"
                >
                  End Call
                </button>
              </>
            )}
          </div>
        </div>
      )}
    </>
  );
}

export default CallModal;