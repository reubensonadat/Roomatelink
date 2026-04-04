import { supabase } from './src/lib/supabase';

async function check() {
  const { data, error } = await supabase
    .from('messages')
    .select(`
      *,
      sender:users!messages_sender_id_fkey (id, full_name, avatar_url),
      receiver:users!messages_receiver_id_fkey (id, full_name, avatar_url)
    `)
    .limit(1);

  console.log("With specific FK:", { data, error });

  const { data: data2, error: error2 } = await supabase
    .from('messages')
    .select(`
      *,
      sender:users!sender_id (id, full_name, avatar_url),
      receiver:users!receiver_id (id, full_name, avatar_url)
    `)
    .limit(1);
    
  console.log("With column names:", { data2, error2 });
}

check();
