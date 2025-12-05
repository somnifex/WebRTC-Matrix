import{S as n}from"./storage-BhOQnXRe.js";import{m as a}from"./match-DBrPD0DG.js";const c=`
(function() {
  const blockWebRTC = () => {
    console.log('[WebRTC Matrix] WebRTC blocked by policy.');
    
    // Nullify RTCPeerConnection
    const targets = ['RTCPeerConnection', 'webkitRTCPeerConnection', 'mozRTCPeerConnection'];
    targets.forEach(target => {
      if (window[target]) {
        try {
          window[target] = function() {
            console.warn('[WebRTC Matrix] blocked creation of ' + target);
            throw new Error('WebRTC is blocked by WebRTC Matrix extension.');
          };
          window[target].prototype = {};
        } catch (e) {
          console.error('[WebRTC Matrix] Failed to block ' + target, e);
        }
      }
    });

    // Block getUserMedia
    if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
       navigator.mediaDevices.getUserMedia = async function() {
          console.warn('[WebRTC Matrix] blocked getUserMedia');
          return Promise.reject(new Error('WebRTC/Camera access blocked by WebRTC Matrix extension.'));
       };
    }
    
    // Legacy getUserMedia
    if (navigator.getUserMedia) {
       navigator.getUserMedia = function(c, s, e) {
          if (e) e(new Error('WebRTC blocked'));
       };
    }
  };

  blockWebRTC();
})();
`;async function s(){const e=window.location.hostname,r=await n.getRules(),i=await n.getSettings(),o=a(e,r);let t=!1;o?t=o==="block":t=i.defaultRule==="block",t&&l()}function l(){const e=document.createElement("script");e.textContent=c,(document.head||document.documentElement).appendChild(e),e.remove()}s();
