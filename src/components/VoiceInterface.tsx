import { useEffect, useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { RealtimeChat } from '@/utils/RealtimeAudio';
import { VisitorTracker } from '@/utils/visitorTracking';
import { supabase } from '@/integrations/supabase/client';
import { Mic, MicOff, Loader2 } from 'lucide-react';
import { StatusIndicator } from '@/components/StatusIndicator';

interface VoiceInterfaceProps {
  businessId: string;
  onSpeakingChange?: (speaking: boolean) => void;
  onTranscript?: (text: string, role: 'user' | 'assistant') => void;
  onConversationCreated?: (conversationId: string) => void;
  onChatReady?: (sendMessage: (text: string) => Promise<void>) => void;
}

const VoiceInterface = ({ businessId, onSpeakingChange, onTranscript, onConversationCreated, onChatReady }: VoiceInterfaceProps) => {
  const { toast } = useToast();
  const [status, setStatus] = useState<'disconnected' | 'connecting' | 'connected' | 'error'>('disconnected');
  const [isSpeaking, setIsSpeaking] = useState(false);
  const chatRef = useRef<RealtimeChat | null>(null);
  const trackerRef = useRef<VisitorTracker | null>(null);
  const [transcript, setTranscript] = useState({ user: '', assistant: '' });
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [messageBuffer, setMessageBuffer] = useState<Array<{id: string, content: string, role: string}>>([]);

  // Initialize visitor tracking on mount
  useEffect(() => {
    // Validate UUID format before initializing tracker
    const isValidUUID = businessId && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(businessId);
    
    if (!isValidUUID) {
      console.error('Invalid businessId for visitor tracking:', businessId);
      return;
    }
    
    trackerRef.current = new VisitorTracker(businessId);
    trackerRef.current.startSession();
    
    return () => {
      trackerRef.current?.endSession();
    };
  }, [businessId]);

  const handleMessage = async (event: any) => {
    console.log('Event:', event.type);
    
    // Track widget interactions
    if (event.type === 'response.audio_transcript.delta') {
      setTranscript(prev => ({
        ...prev,
        assistant: prev.assistant + event.delta
      }));
    } else if (event.type === 'response.audio_transcript.done') {
      if (transcript.assistant && onTranscript) {
        onTranscript(transcript.assistant, 'assistant');
        
        // Store message for sentiment analysis
        if (conversationId) {
          const { data: msgData } = await supabase
            .from('messages')
            .insert({
              conversation_id: conversationId,
              role: 'assistant',
              content: transcript.assistant
            })
            .select()
            .single();
          
          if (msgData) {
            setMessageBuffer(prev => [...prev, msgData]);
          }
        }
      }
      setTranscript(prev => ({ ...prev, assistant: '' }));
    } else if (event.type === 'input_audio_buffer.speech_started') {
      setIsSpeaking(true);
      onSpeakingChange?.(true);
      trackerRef.current?.trackEvent('speech_started');
    } else if (event.type === 'input_audio_buffer.speech_stopped') {
      setIsSpeaking(false);
      onSpeakingChange?.(false);
    } else if (event.type === 'conversation.item.input_audio_transcription.completed') {
      if (event.transcript && onTranscript) {
        onTranscript(event.transcript, 'user');
        
        // Store user message and trigger sentiment analysis
        if (conversationId) {
          const { data: msgData } = await supabase
            .from('messages')
            .insert({
              conversation_id: conversationId,
              role: 'user',
              content: event.transcript
            })
            .select()
            .single();
          
          if (msgData) {
            setMessageBuffer(prev => [...prev, msgData]);
            
            // Analyze sentiment for user messages
            try {
              await supabase.functions.invoke('analyze-sentiment', {
                body: {
                  messageId: msgData.id,
                  content: event.transcript
                }
              });
            } catch (error) {
              console.error('Sentiment analysis error:', error);
            }
          }
        }
      }
    }
  };

  const handleStatusChange = (newStatus: string) => {
    setStatus(newStatus as any);
  };

  const startConversation = async () => {
    try {
      console.log('Starting conversation with businessId:', businessId);
      
      // Request microphone permission first
      console.log('Requesting microphone permission...');
      await navigator.mediaDevices.getUserMedia({ audio: true });
      console.log('Microphone permission granted');
      
      // Create conversation record
      console.log('Creating conversation record...');
      const { data: convData, error: convError } = await supabase
        .from('conversations')
        .insert({
          business_id: businessId,
          visitor_id: trackerRef.current?.['visitorId'] || null
        })
        .select()
        .single();
      
      if (convError) {
        console.error('Conversation creation error:', convError);
        throw convError;
      }
      
      console.log('Conversation created:', convData.id);
      setConversationId(convData.id);
      onConversationCreated?.(convData.id);
      
      // Link conversation to visitor session
      if (trackerRef.current) {
        console.log('Linking conversation to visitor session...');
        await trackerRef.current.linkConversation(convData.id);
      }
      
      trackerRef.current?.trackEvent('conversation_started', { conversationId: convData.id });
      
      const visitorId = trackerRef.current?.['visitorId'] || null;
      console.log('Initializing RealtimeChat with visitorId:', visitorId);
      chatRef.current = new RealtimeChat(businessId, handleMessage, handleStatusChange, visitorId);
      await chatRef.current.init();
      console.log('RealtimeChat initialized successfully');
      
      // Provide sendMessage function to parent
      if (onChatReady && chatRef.current) {
        onChatReady((text: string) => chatRef.current!.sendMessage(text));
      }
      
      toast({
        title: "Connected",
        description: "Voice interface is ready. Start speaking!",
      });
    } catch (error) {
      console.error('Error starting conversation - Full error:', error);
      console.error('Error message:', error instanceof Error ? error.message : 'Unknown error');
      console.error('Error stack:', error instanceof Error ? error.stack : 'No stack');
      setStatus('error');
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : 'Failed to start conversation',
        variant: "destructive",
      });
    }
  };

  const endConversation = async () => {
    chatRef.current?.disconnect();
    setStatus('disconnected');
    setIsSpeaking(false);
    onSpeakingChange?.(false);
    
    // End conversation and update memory
    if (conversationId) {
      await supabase
        .from('conversations')
        .update({ ended_at: new Date().toISOString() })
        .eq('id', conversationId);
      
      trackerRef.current?.trackEvent('conversation_ended', { conversationId });
      
      // Update conversation memory
      const visitorId = trackerRef.current?.['visitorId'];
      if (visitorId) {
        try {
          await supabase.functions.invoke('conversation-memory', {
            body: {
              action: 'update_context',
              visitorId,
              businessId,
              conversationId
            }
          });
          console.log('Conversation memory updated');
        } catch (error) {
          console.error('Error updating conversation memory:', error);
        }
        
        // Learn from this conversation
        try {
          await supabase.functions.invoke('learn-from-conversation', {
            body: {
              conversationId,
              businessId
            }
          });
          console.log('AI learned from conversation');
        } catch (error) {
          console.error('Error learning from conversation:', error);
        }
      }
      
      setConversationId(null);
    }
    
    setMessageBuffer([]);
  };

  useEffect(() => {
    return () => {
      chatRef.current?.disconnect();
    };
  }, []);

  return (
    <div className="flex flex-col items-center space-y-6 p-6">
      <div className="relative">
        <Button
          variant={status === 'connected' ? 'destructive' : 'default'}
          size="lg"
          className={`rounded-full h-24 w-24 shadow-lg transition-all duration-300 ${
            isSpeaking ? 'scale-110 shadow-2xl ring-4 ring-primary/50' : ''
          }`}
          onClick={status === 'connected' ? endConversation : startConversation}
          disabled={status === 'connecting'}
        >
          {status === 'connecting' ? (
            <Loader2 className="h-10 w-10 animate-spin" />
          ) : status === 'connected' ? (
            <MicOff className="h-10 w-10" />
          ) : (
            <Mic className="h-10 w-10" />
          )}
        </Button>
        {isSpeaking && <div className="absolute inset-0 rounded-full border-4 border-primary animate-ping opacity-75" />}
        {status === 'connected' && !isSpeaking && (
          <div className="absolute -bottom-2 -right-2 h-6 w-6 bg-emerald-500 rounded-full border-2 border-background animate-pulse" />
        )}
      </div>
      
      <div className="text-center space-y-2">
        <StatusIndicator status={status} />
        <p className="text-base font-medium">
          {status === 'disconnected' && 'Start Voice Chat'}
          {status === 'connecting' && 'Connecting...'}
          {status === 'connected' && (isSpeaking ? '🎤 Listening' : '✓ Connected')}
          {status === 'error' && 'Error'}
        </p>
      </div>
    </div>
  );
};

export default VoiceInterface;
