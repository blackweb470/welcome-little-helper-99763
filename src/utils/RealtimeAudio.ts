import { supabase } from "@/integrations/supabase/client";

interface ConversationMemory {
  summary?: string;
  key_facts?: string[];
  user_preferences?: any;
}

export class AudioRecorder {
  private stream: MediaStream | null = null;
  private audioContext: AudioContext | null = null;
  private processor: ScriptProcessorNode | null = null;
  private source: MediaStreamAudioSourceNode | null = null;

  constructor(private onAudioData: (audioData: Float32Array) => void) {}

  async start() {
    try {
      this.stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          sampleRate: 24000,
          channelCount: 1,
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true
        }
      });
      
      this.audioContext = new AudioContext({
        sampleRate: 24000,
      });
      
      this.source = this.audioContext.createMediaStreamSource(this.stream);
      this.processor = this.audioContext.createScriptProcessor(4096, 1, 1);
      
      this.processor.onaudioprocess = (e) => {
        const inputData = e.inputBuffer.getChannelData(0);
        this.onAudioData(new Float32Array(inputData));
      };
      
      this.source.connect(this.processor);
      this.processor.connect(this.audioContext.destination);
    } catch (error) {
      console.error('Error accessing microphone:', error);
      throw error;
    }
  }

  stop() {
    if (this.source) {
      this.source.disconnect();
      this.source = null;
    }
    if (this.processor) {
      this.processor.disconnect();
      this.processor = null;
    }
    if (this.stream) {
      this.stream.getTracks().forEach(track => track.stop());
      this.stream = null;
    }
    if (this.audioContext) {
      this.audioContext.close();
      this.audioContext = null;
    }
  }
}

export class RealtimeChat {
  private pc: RTCPeerConnection | null = null;
  private dc: RTCDataChannel | null = null;
  private audioEl: HTMLAudioElement;
  private recorder: AudioRecorder | null = null;
  private messageBuffer: { role: string; content: string }[] = [];
  private conversationMemory: ConversationMemory | null = null;
  private visitorId: string | null = null;

  constructor(
    private businessId: string,
    private onMessage: (message: any) => void,
    private onStatusChange: (status: string) => void,
    visitorId?: string | null
  ) {
    this.audioEl = document.createElement("audio");
    this.audioEl.autoplay = true;
    this.visitorId = visitorId || null;
  }

  async init() {
    try {
      this.onStatusChange('connecting');
      console.log('RealtimeChat.init() called with businessId:', this.businessId);
      
      // Retrieve conversation memory if visitor is returning
      if (this.visitorId && this.businessId) {
        try {
          console.log('Retrieving conversation memory for visitor:', this.visitorId);
          const { data: memoryData } = await supabase.functions.invoke('conversation-memory', {
            body: {
              action: 'retrieve_context',
              visitorId: this.visitorId,
              businessId: this.businessId
            }
          });
          
          this.conversationMemory = memoryData?.context || null;
          console.log('Retrieved conversation memory:', this.conversationMemory);
        } catch (error) {
          console.error('Error retrieving memory:', error);
        }
      }
      
      // Get ephemeral token from our Supabase Edge Function
      console.log('Invoking realtime-session edge function...');
      const { data, error } = await supabase.functions.invoke("realtime-session", {
        body: { 
          businessId: this.businessId,
          memory: this.conversationMemory,
          visitorId: this.visitorId || undefined
        }
      });

      if (error) {
        console.error("Error from realtime-session edge function:", error);
        console.error("Error details:", JSON.stringify(error, null, 2));
        throw new Error(`Failed to create realtime session: ${error.message || JSON.stringify(error)}`);
      }
      
      if (!data?.client_secret?.value) {
        throw new Error("Failed to get ephemeral token");
      }

      console.log("Got ephemeral token, setting up WebRTC");
      const EPHEMERAL_KEY = data.client_secret.value;

      // Create peer connection
      this.pc = new RTCPeerConnection();

      // Set up remote audio
      this.pc.ontrack = e => {
        console.log("Received remote audio track");
        this.audioEl.srcObject = e.streams[0];
      };

      // Add local audio track
      const ms = await navigator.mediaDevices.getUserMedia({ audio: true });
      this.pc.addTrack(ms.getTracks()[0]);

      // Set up data channel
      this.dc = this.pc.createDataChannel("oai-events");
      this.dc.addEventListener("message", (e) => {
        const event = JSON.parse(e.data);
        console.log("Received event:", event.type);
        this.onMessage(event);
        
        // Collect messages for sentiment analysis
        if (event.type === 'conversation.item.created' && event.item?.role === 'user') {
          const content = event.item.content?.[0]?.text || event.item.content?.[0]?.transcript;
          if (content) {
            this.messageBuffer.push({ role: 'user', content });
          }
        } else if (event.type === 'response.done' && event.response?.output?.[0]?.content) {
          const content = event.response.output[0].content?.[0]?.text;
          if (content) {
            this.messageBuffer.push({ role: 'assistant', content });
          }
        }
      });

      this.dc.addEventListener("open", () => {
        console.log("Data channel opened");
        this.onStatusChange('connected');
      });

      this.dc.addEventListener("close", () => {
        console.log("Data channel closed");
        this.onStatusChange('disconnected');
      });

      // Create and set local description
      const offer = await this.pc.createOffer();
      await this.pc.setLocalDescription(offer);

      // Connect to OpenAI's Realtime API
      const baseUrl = "https://api.openai.com/v1/realtime";
      const model = "gpt-4o-realtime-preview-2024-12-17";
      const sdpResponse = await fetch(`${baseUrl}?model=${model}`, {
        method: "POST",
        body: offer.sdp,
        headers: {
          Authorization: `Bearer ${EPHEMERAL_KEY}`,
          "Content-Type": "application/sdp"
        },
      });

      if (!sdpResponse.ok) {
        throw new Error("Failed to connect to OpenAI");
      }

      const answer = {
        type: "answer" as RTCSdpType,
        sdp: await sdpResponse.text(),
      };
      
      await this.pc.setRemoteDescription(answer);
      console.log("WebRTC connection established");

      // Start recording
      this.recorder = new AudioRecorder((audioData) => {
        if (this.dc?.readyState === 'open') {
          this.dc.send(JSON.stringify({
            type: 'input_audio_buffer.append',
            audio: this.encodeAudioData(audioData)
          }));
        }
      });
      await this.recorder.start();

    } catch (error) {
      console.error("Error initializing chat:", error);
      this.onStatusChange('error');
      throw error;
    }
  }

  private encodeAudioData(float32Array: Float32Array): string {
    const int16Array = new Int16Array(float32Array.length);
    for (let i = 0; i < float32Array.length; i++) {
      const s = Math.max(-1, Math.min(1, float32Array[i]));
      int16Array[i] = s < 0 ? s * 0x8000 : s * 0x7FFF;
    }
    
    const uint8Array = new Uint8Array(int16Array.buffer);
    let binary = '';
    const chunkSize = 0x8000;
    
    for (let i = 0; i < uint8Array.length; i += chunkSize) {
      const chunk = uint8Array.subarray(i, Math.min(i + chunkSize, uint8Array.length));
      binary += String.fromCharCode.apply(null, Array.from(chunk));
    }
    
    return btoa(binary);
  }

  async sendMessage(text: string) {
    if (!this.dc || this.dc.readyState !== 'open') {
      throw new Error('Data channel not ready');
    }

    const event = {
      type: 'conversation.item.create',
      item: {
        type: 'message',
        role: 'user',
        content: [
          {
            type: 'input_text',
            text
          }
        ]
      }
    };

    this.dc.send(JSON.stringify(event));
    this.dc.send(JSON.stringify({type: 'response.create'}));
  }

  disconnect() {
    console.log("Disconnecting...");
    this.recorder?.stop();
    this.dc?.close();
    this.pc?.close();
    this.onStatusChange('disconnected');
  }
}
