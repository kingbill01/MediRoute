import api from './api';

export interface ChatMessage {
  id: string;
  userId: string;
  role: 'user' | 'assistant';
  content: string;
  createdAt: string;
}

class ChatbotService {
  async getHistory(): Promise<ChatMessage[]> {
    const res = await api.get('/chatbot/history');
    return res.data.data;
  }

  async sendMessage(content: string): Promise<ChatMessage> {
    const res = await api.post('/chatbot/message', { content });
    return res.data.data.message;
  }

  async clearHistory(): Promise<void> {
    await api.delete('/chatbot/history');
  }
}

export default new ChatbotService();
