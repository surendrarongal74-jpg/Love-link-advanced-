export type NotificationType = 
  | 'message' 
  | 'voice' 
  | 'image' 
  | 'pulse' 
  | 'reaction' 
  | 'mood' 
  | 'game' 
  | 'surprise' 
  | 'diary' 
  | 'reminder' 
  | 'location' 
  | 'general';

export interface LiveNotificationItem {
  id: string;
  type: NotificationType;
  title: string;
  body: string;
  senderId?: string;
  senderName?: string;
  timestamp: number;
  link?: string;
  read: boolean;
  actionLabel?: string;
  iconType?: string;
  previewMediaUrl?: string;
}
