export type WebSocketMessage = {
  type: 'MONITOR_UPDATE' | 'STATUS_CHANGE';
  data: any;
};

export interface ConnectionData {
  id: string;
  status: string;
}

export interface Monitor {
  id: string;
  status: string;
  // Add other relevant fields as needed
}