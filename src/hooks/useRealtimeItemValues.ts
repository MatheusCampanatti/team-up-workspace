
import { useEffect, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface ItemValue {
  id: string;
  item_id: string;
  column_id: string;
  value: string;
  updated_at: string;
}

interface RealtimePayload {
  eventType: 'INSERT' | 'UPDATE' | 'DELETE';
  new?: ItemValue;
  old?: ItemValue;
}

interface UseRealtimeItemValuesProps {
  boardId: string;
  onItemValueChange: (payload: RealtimePayload) => void;
}

export const useRealtimeItemValues = ({ boardId, onItemValueChange }: UseRealtimeItemValuesProps) => {
  const channelRef = useRef<any>(null);

  useEffect(() => {
    if (!boardId) return;

    console.log('Setting up realtime subscription for board:', boardId);

    // Create a unique channel name for this board
    const channelName = `realtime-item-values-${boardId}`;
    
    channelRef.current = supabase
      .channel(channelName)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'item_values'
        },
        (payload) => {
          console.log('Realtime payload received:', payload);
          
          // Filter by board_id on the client side since we can't filter directly in the subscription
          // We'll need to check if the item belongs to our board
          const itemValue = payload.new || payload.old;
          if (itemValue) {
            // We'll handle the board filtering in the component since we have access to items there
            onItemValueChange({
              eventType: payload.eventType as 'INSERT' | 'UPDATE' | 'DELETE',
              new: payload.new as ItemValue,
              old: payload.old as ItemValue
            });
          }
        }
      )
      .subscribe((status) => {
        console.log('Realtime subscription status:', status);
      });

    return () => {
      console.log('Cleaning up realtime subscription');
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current);
        channelRef.current = null;
      }
    };
  }, [boardId, onItemValueChange]);

  return channelRef.current;
};
