export interface BusinessCard {
  id: string;
  name: string;
  company: string;
  title: string;
  email: string;
  phone: string;
  address: string;
  website: string;
  notes: string;
  imageUrl: string;
  createdAt: string;
  updatedAt: string;
  status: 'pending' | 'processed' | 'failed';
}

export interface GoogleDriveFile {
  id: string;
  name: string;
  mimeType: string;
  thumbnailLink?: string;
  webViewLink: string;
  createdTime: string;
}

export interface GoogleSheetsData {
  id: string;
  name: string;
  url: string;
}

export interface User {
  id: string;
  name: string;
  email: string;
  image: string;
}

export interface Stats {
  totalCards: number;
  processedCards: number;
  pendingCards: number;
  failedCards: number;
}