import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.77.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const formData = await req.formData();
    const file = formData.get('file') as File;
    const businessId = formData.get('businessId') as string;
    const conversationId = formData.get('conversationId') as string;
    const visitorId = formData.get('visitorId') as string;

    console.log('Visitor image upload:', { businessId, conversationId, visitorId, fileName: file?.name });

    if (!file || !businessId || !visitorId) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields: file, businessId, visitorId' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Validate file type
    const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
    if (!allowedTypes.includes(file.type)) {
      return new Response(
        JSON.stringify({ error: 'Invalid file type. Only JPEG, PNG, GIF, and WebP are allowed.' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Validate file size (max 5MB)
    const maxSize = 5 * 1024 * 1024;
    if (file.size > maxSize) {
      return new Response(
        JSON.stringify({ error: 'File too large. Maximum size is 5MB.' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Create or get conversation if not provided
    let finalConversationId = conversationId;
    
    if (!finalConversationId) {
      const { data: existingConv } = await supabase
        .from('conversations')
        .select('id')
        .eq('business_id', businessId)
        .eq('visitor_id', visitorId)
        .is('ended_at', null)
        .order('started_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (existingConv) {
        finalConversationId = existingConv.id;
      } else {
        const { data: newConv, error: convError } = await supabase
          .from('conversations')
          .insert({
            business_id: businessId,
            visitor_id: visitorId,
            started_at: new Date().toISOString()
          })
          .select()
          .single();

        if (convError) throw convError;
        finalConversationId = newConv.id;
      }
    }

    // Generate unique file path
    const fileExt = file.name.split('.').pop() || 'jpg';
    const fileName = `${finalConversationId}/${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;

    // Convert file to array buffer
    const arrayBuffer = await file.arrayBuffer();
    const uint8Array = new Uint8Array(arrayBuffer);

    // Upload to storage
    const { error: uploadError } = await supabase.storage
      .from('message-attachments')
      .upload(fileName, uint8Array, {
        contentType: file.type,
        upsert: false
      });

    if (uploadError) {
      console.error('Upload error:', uploadError);
      throw uploadError;
    }

    // Get public URL
    const { data: urlData } = supabase.storage
      .from('message-attachments')
      .getPublicUrl(fileName);

    const imageUrl = urlData.publicUrl;

    // Create a message with the image
    const { data: messageData, error: messageError } = await supabase
      .from('messages')
      .insert({
        conversation_id: finalConversationId,
        role: 'user',
        content: `[Image: ${file.name}]`,
        audio_url: imageUrl // Reusing audio_url field for image URL
      })
      .select()
      .single();

    if (messageError) throw messageError;

    // Create attachment record
    const { error: attachmentError } = await supabase
      .from('message_attachments')
      .insert({
        message_id: messageData.id,
        file_name: file.name,
        file_path: fileName,
        file_size: file.size,
        mime_type: file.type
      });

    if (attachmentError) {
      console.error('Attachment record error:', attachmentError);
    }

    console.log('Image uploaded successfully:', { fileName, messageId: messageData.id });

    return new Response(
      JSON.stringify({ 
        success: true,
        imageUrl,
        messageId: messageData.id,
        conversationId: finalConversationId
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in visitor-upload-image function:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
