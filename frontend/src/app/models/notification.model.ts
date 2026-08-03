export type NotificationType = 'policy' | 'scheme' | 'system' | 'deadline';

export interface AppNotification {
  id: string;
  title: string;
  message: string;
  type: NotificationType;
  date: string;
  read: boolean;
  link?: string;
}
