import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  Box, Typography, TextField, IconButton, Paper, Avatar,
  CircularProgress, Button, Chip, Divider, Tooltip,
} from '@mui/material';
import {
  Send, SmartToy, Person, DeleteOutline, Warning,
  LocalHospital, MedicalServices,
} from '@mui/icons-material';
import chatbotService, { ChatMessage } from '../../../services/chatbotService';
import { toast } from 'react-toastify';

// ── Suggestions rapides ───────────────────────────────────────────────────────
const QUICK_SUGGESTIONS = [
  'J\'ai de la fièvre depuis 2 jours',
  'Comment prévenir le paludisme ?',
  'Mon enfant a des diarrhées',
  'Conseils pour une bonne nutrition',
  'Symptômes du diabète',
  'Quand consulter un médecin en urgence ?',
];

const fmtTime = (d: string) =>
  new Date(d).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });

// ── Bulle de message ──────────────────────────────────────────────────────────
const MessageBubble: React.FC<{ msg: ChatMessage }> = ({ msg }) => {
  const isUser = msg.role === 'user';
  return (
    <Box sx={{ display: 'flex', justifyContent: isUser ? 'flex-end' : 'flex-start', mb: 1.5, gap: 1, alignItems: 'flex-end' }}>
      {!isUser && (
        <Avatar sx={{ bgcolor: '#00A896', width: 32, height: 32, flexShrink: 0 }}>
          <SmartToy sx={{ fontSize: 18 }} />
        </Avatar>
      )}
      <Box sx={{ maxWidth: '75%' }}>
        <Paper sx={{
          px: 2, py: 1.5, borderRadius: isUser ? '18px 18px 4px 18px' : '18px 18px 18px 4px',
          bgcolor: isUser ? '#0F2D52' : '#fff',
          boxShadow: 'none', border: isUser ? 'none' : '1px solid #e8eaed',
        }}>
          <Typography variant="body2" sx={{
            color: isUser ? '#fff' : '#1a1a1a', lineHeight: 1.6, whiteSpace: 'pre-wrap',
            '& strong': { fontWeight: 700 },
          }}>
            {msg.content.replace(/\*\*(.*?)\*\*/g, (_, t) => t)}
          </Typography>
        </Paper>
        <Typography variant="caption" color="text.secondary" sx={{ px: 0.5, display: 'block', textAlign: isUser ? 'right' : 'left', mt: 0.3 }}>
          {fmtTime(msg.createdAt)}
        </Typography>
      </Box>
      {isUser && (
        <Avatar sx={{ bgcolor: '#0F2D52', width: 32, height: 32, flexShrink: 0 }}>
          <Person sx={{ fontSize: 18 }} />
        </Avatar>
      )}
    </Box>
  );
};

// ── Indicateur de frappe ──────────────────────────────────────────────────────
const TypingIndicator: React.FC = () => (
  <Box sx={{ display: 'flex', alignItems: 'flex-end', gap: 1, mb: 1.5 }}>
    <Avatar sx={{ bgcolor: '#00A896', width: 32, height: 32 }}><SmartToy sx={{ fontSize: 18 }} /></Avatar>
    <Paper sx={{ px: 2, py: 1.5, borderRadius: '18px 18px 18px 4px', border: '1px solid #e8eaed', boxShadow: 'none' }}>
      <Box sx={{ display: 'flex', gap: 0.5, alignItems: 'center' }}>
        {[0, 1, 2].map(i => (
          <Box key={i} sx={{
            width: 7, height: 7, borderRadius: '50%', bgcolor: '#00A896',
            animation: 'bounce 1.2s infinite', animationDelay: `${i * 0.2}s`,
            '@keyframes bounce': { '0%,80%,100%': { transform: 'scale(0)' }, '40%': { transform: 'scale(1)' } },
          }} />
        ))}
      </Box>
    </Paper>
  </Box>
);

// ── Composant principal ───────────────────────────────────────────────────────
const AIChatTab: React.FC = () => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const scrollToBottom = () => bottomRef.current?.scrollIntoView({ behavior: 'smooth' });

  const loadHistory = useCallback(async () => {
    try {
      const data = await chatbotService.getHistory();
      setMessages(data);
    } catch { /* silently fail */ }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { loadHistory(); }, [loadHistory]);
  useEffect(() => { scrollToBottom(); }, [messages, sending]);

  const send = async (text?: string) => {
    const content = (text ?? input).trim();
    if (!content || sending) return;
    setInput('');

    const tempUser: ChatMessage = {
      id: `tmp-${Date.now()}`, userId: '', role: 'user',
      content, createdAt: new Date().toISOString(),
    };
    setMessages(prev => [...prev, tempUser]);
    setSending(true);

    try {
      const reply = await chatbotService.sendMessage(content);
      setMessages(prev => [...prev.slice(0, -1), tempUser, reply]);
    } catch {
      setMessages(prev => prev.slice(0, -1));
      toast.error('Impossible d\'envoyer le message');
    } finally {
      setSending(false);
      inputRef.current?.focus();
    }
  };

  const clearHistory = async () => {
    try {
      await chatbotService.clearHistory();
      setMessages([]);
    } catch { toast.error('Impossible d\'effacer l\'historique'); }
  };

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', height: 'calc(100vh - 160px)', minHeight: 500 }}>
      {/* Header */}
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
          <Avatar sx={{ bgcolor: '#00A896', width: 44, height: 44 }}><SmartToy /></Avatar>
          <Box>
            <Typography variant="h6" fontWeight={700} color="#0F2D52">MediBot — Assistant Santé IA</Typography>
            <Typography variant="caption" color="text.secondary">Conseils de santé 24h/24 • Basé sur Claude AI</Typography>
          </Box>
          <Chip label="En ligne" size="small" sx={{ bgcolor: '#e8f5e9', color: '#2e7d32', fontWeight: 600, ml: 1 }} />
        </Box>
        {messages.length > 0 && (
          <Tooltip title="Effacer l'historique">
            <IconButton onClick={clearHistory} size="small" sx={{ color: '#999' }}><DeleteOutline /></IconButton>
          </Tooltip>
        )}
      </Box>

      {/* Disclaimer */}
      <Paper sx={{ p: 1.5, mb: 2, bgcolor: '#fff8e1', border: '1px solid #ffe082', borderRadius: 2, display: 'flex', gap: 1, alignItems: 'center' }}>
        <Warning sx={{ color: '#f57c00', fontSize: 18, flexShrink: 0 }} />
        <Typography variant="caption" color="#795548">
          MediBot donne des conseils généraux uniquement. Il ne remplace pas un avis médical. En cas d'urgence, appelez le 15 ou utilisez le formulaire d'urgence MediRoute.
        </Typography>
      </Paper>

      {/* Zone messages */}
      <Paper sx={{ flex: 1, overflow: 'hidden', borderRadius: 3, border: '1px solid #e8eaed', display: 'flex', flexDirection: 'column' }}>
        <Box sx={{ flex: 1, overflowY: 'auto', p: 2.5 }}>
          {loading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}><CircularProgress sx={{ color: '#00A896' }} /></Box>
          ) : messages.length === 0 ? (
            <Box sx={{ textAlign: 'center', py: 4 }}>
              <MedicalServices sx={{ fontSize: 56, color: '#00A896', mb: 2 }} />
              <Typography variant="h6" fontWeight={700} color="#0F2D52" mb={0.5}>Bonjour ! Je suis MediBot</Typography>
              <Typography variant="body2" color="text.secondary" mb={3}>
                Posez-moi vos questions de santé. Je suis là pour vous conseiller et vous orienter.
              </Typography>
              <Typography variant="caption" color="text.secondary" mb={2} display="block">Suggestions rapides :</Typography>
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, justifyContent: 'center' }}>
                {QUICK_SUGGESTIONS.map(s => (
                  <Chip key={s} label={s} clickable onClick={() => send(s)} size="small"
                    sx={{ bgcolor: '#e8f5e9', color: '#0F2D52', '&:hover': { bgcolor: '#c8e6c9' } }} />
                ))}
              </Box>
            </Box>
          ) : (
            <>
              {messages.map(m => <MessageBubble key={m.id} msg={m} />)}
              {sending && <TypingIndicator />}
            </>
          )}
          <div ref={bottomRef} />
        </Box>

        <Divider />

        {/* Suggestions rapides (quand historique non vide) */}
        {messages.length > 0 && !sending && (
          <Box sx={{ px: 2, py: 1, display: 'flex', gap: 1, overflowX: 'auto', '&::-webkit-scrollbar': { display: 'none' } }}>
            {QUICK_SUGGESTIONS.slice(0, 4).map(s => (
              <Chip key={s} label={s} clickable onClick={() => send(s)} size="small" variant="outlined"
                sx={{ flexShrink: 0, fontSize: 11, borderColor: '#00A896', color: '#00A896' }} />
            ))}
          </Box>
        )}

        {/* Zone de saisie */}
        <Box sx={{ p: 2, display: 'flex', gap: 1, alignItems: 'flex-end', bgcolor: '#fafafa' }}>
          <TextField
            inputRef={inputRef}
            fullWidth multiline maxRows={4}
            placeholder="Décrivez vos symptômes ou posez une question de santé..."
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send(); } }}
            size="small"
            disabled={sending}
            sx={{
              '& .MuiOutlinedInput-root': {
                borderRadius: 3, bgcolor: '#fff',
                '&.Mui-focused fieldset': { borderColor: '#00A896' },
              },
            }}
          />
          <IconButton
            onClick={() => send()} disabled={!input.trim() || sending}
            sx={{ bgcolor: '#00A896', color: '#fff', borderRadius: 2, p: 1.2,
              '&:hover': { bgcolor: '#008f80' }, '&.Mui-disabled': { bgcolor: '#e0e0e0', color: '#fff' } }}>
            {sending ? <CircularProgress size={20} color="inherit" /> : <Send />}
          </IconButton>
        </Box>
      </Paper>

      {/* Bouton urgence */}
      <Box sx={{ mt: 1.5, display: 'flex', justifyContent: 'center' }}>
        <Button startIcon={<LocalHospital />} variant="outlined" size="small" color="error"
          onClick={() => window.location.href = '/emergency'}
          sx={{ borderRadius: 2, fontSize: 12 }}>
          Accéder au formulaire d'urgence
        </Button>
      </Box>
    </Box>
  );
};

export default AIChatTab;
