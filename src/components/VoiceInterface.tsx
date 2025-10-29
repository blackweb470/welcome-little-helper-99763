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
      // Request microphone permission first
      await navigator.mediaDevices.getUserMedia({ audio: true });
      
      // Create conversation record
      const { data: convData, error: convError } = await supabase
        .from('conversations')
        .insert({
          business_id: businessId,
          visitor_id: trackerRef.current?.['visitorId'] || null
        })
        .select()
        .single();
      
      if (convError) throw convError;
      
      setConversationId(convData.id);
      onConversationCreated?.(convData.id);
      
      // Link conversation to visitor session
      if (trackerRef.current) {
        await trackerRef.current.linkConversation(convData.id);
      }
      
      trackerRef.current?.trackEvent('conversation_started', { conversationId: convData.id });
      
      const visitorId = trackerRef.current?.['visitorId'] || null;
      chatRef.current = new RealtimeChat(businessId, handleMessage, handleStatusChange, visitorId);
      await chatRef.current.init();
      
      // Provide sendMessage function to parent
      if (onChatReady && chatRef.current) {
        onChatReady((text: string) => chatRef.current!.sendMessage(text));
      }
      
      toast({
        title: "Connected",
        description: "Voice interface is ready. Start speaking!",
      });
    } catch (error) {
      console.error('Error starting conversation:', error);
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
    <div className="flex flex-col items-center gap-4">
      <StatusIndicator businessId={businessId} />
      
      {status === 'disconnected' && (
        <Button 
          onClick={startConversation}
          size="lg"
          className="rounded-full w-16 h-16 p-0"
        >
          <Mic className="w-6 h-6" />
        </Button>
      )}
      
      {status === 'connecting' && (
        <Button 
          disabled
          size="lg"
          className="rounded-full w-16 h-16 p-0"
        >
          <Loader2 className="w-6 h-6 animate-spin" />
        </Button>
      )}
      
      {status === 'connected' && (
        <Button 
          onClick={endConversation}
          size="lg"
          variant={isSpeaking ? "default" : "secondary"}
          className="rounded-full w-16 h-16 p-0"
        >
          <MicOff className="w-6 h-6" />
        </Button>
      )}

      {status === 'error' && (
        <Button 
          onClick={startConversation}
          size="lg"
          variant="destructive"
          className="rounded-full w-16 h-16 p-0"
        >
          <Mic className="w-6 h-6" />
        </Button>
      )}

      <p className="text-sm text-muted-foreground">
        {status === 'disconnected' && 'Click to start'}
        {status === 'connecting' && 'Connecting...'}
        {status === 'connected' && (isSpeaking ? 'Listening...' : 'Ready')}
        {status === 'error' && 'Error - Try again'}
      </p>
    </div>
  );
};

export default VoiceInterface;
