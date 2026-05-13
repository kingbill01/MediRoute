import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  Box, Paper, IconButton, Typography, TextField, Avatar,
  CircularProgress, Chip, Divider, Tooltip, Zoom, Fade,
} from '@mui/material';
import {
  SmartToy, Close, Send, Minimize, DeleteOutline,
  ExpandLess,
} from '@mui/icons-material';
import chatbotService, { ChatMessage } from '../services/chatbotService';

const QUICK = [
  'J\'ai de la fièvre',
  'Prévenir le paludisme',
  'Mon enfant est malade',
  'Quand aller aux urgences ?',
];

const Bubble: React.FC<{ msg: ChatMessage }> = ({ msg }) => {
  const isUser = msg.role === 'user';
  return (
    <Box sx={{ display: 'flex', justifyContent: isUser ? 'flex-end' : 'flex-start', mb: 1, gap: 0.8, alignItems: 'flex-end' }}>
      {!isUser && (
        <Avatar sx={{ bgcolor: '#00A896', width: 26, height: 26, flexShrink: 0 }}>
          <SmartToy sx={{ fontSize: 14 }} />
        </Avatar>
      )}
      <Box sx={{ maxWidth: '80%' }}>
        <Paper elevation={0} sx={{
          px: 1.5, py: 1, borderRadius: isUser ? '14px 14px 3px 14px' : '14px 14px 14px 3px',
          bgcolor: isUser ? '#0F2D52' : '#f1f3f4',
        }}>
          <Typography variant="caption" sx={{ color: isUser ? '#fff' : '#1a1a1a', lineHeight: 1.5, display: 'block', fontSize: 12.5 }}>
            {msg.content.replace(/\*\*(.*?)\*\*/g, (_, t) => t)}
          </Typography>
        </Paper>
        <Typography variant="caption" sx={{ fontSize: 9, color: '#bbb', px: 0.5, display: 'block', textAlign: isUser ? 'right' : 'left' }}>
          {new Date(msg.createdAt).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
        </Typography>
      </Box>
    </Box>
  );
};

const TypingDots: React.FC = () => (
  <Box sx={{ display: 'flex', alignItems: 'flex-end', gap: 0.8, mb: 1 }}>
    <Avatar sx={{ bgcolor: '#00A896', width: 26, height: 26 }}><SmartToy sx={{ fontSize: 14 }} /></Avatar>
    <Paper elevation={0} sx={{ px: 1.5, py: 1, borderRadius: '14px 14px 14px 3px', bgcolor: '#f1f3f4' }}>
      <Box sx={{ display: 'flex', gap: 0.4 }}>
        {[0, 1, 2].map(i => (
          <Box key={i} sx={{
            width: 5, height: 5, borderRadius: '50%', bgcolor: '#00A896',
            animation: 'bounce 1.2s infinite', animationDelay: `${i * 0.2}s`,
            '@keyframes bounce': { '0%,80%,100%': { transform: 'scale(0)' }, '40%': { transform: 'scale(1)' } },
          }} />
        ))}
      </Box>
    </Paper>
  </Box>
);

const ChatbotWidget: React.FC = () => {
  const [open, setOpen] = useState(false);
  const [minimized, setMinimized] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const [unread, setUnread] = useState(0);
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const loadedRef = useRef(false);

  const scrollDown = () => setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: 'smooth' }), 60);

  const loadHistory = useCallback(async () => {
    if (loadedRef.current) return;
    loadedRef.current = true;
    setLoading(true);
    try { const data = await chatbotService.getHistory(); setMessages(data); }
    catch { /* silently */ }
    finally { setLoading(false); }
  }, []);

  useEffect(() => {
    if (open) { loadHistory(); scrollDown(); if (unread > 0) setUnread(0); }
  }, [open, loadHistory, unread]);

  useEffect(() => { if (open && !minimized) scrollDown(); }, [messages, sending, open, minimized]);

  const send = async (text?: string) => {
    const content = (text ?? input).trim();
    if (!content || sending) return;
    setInput('');
    const temp: ChatMessage = { id: `tmp-${Date.now()}`, userId: '', role: 'user', content, createdAt: new Date().toISOString() };
    setMessages(p => [...p, temp]);
    setSending(true);
    scrollDown();
    try {
      const reply = await chatbotService.sendMessage(content);
      setMessages(p => [...p.slice(0, -1), temp, reply]);
      if (!open || minimized) setUnread(u => u + 1);
    } catch {
      setMessages(p => p.slice(0, -1));
    } finally {
      setSending(false);
      inputRef.current?.focus();
    }
  };

  const toggle = () => {
    if (!open) { setOpen(true); setMinimized(false); setUnread(0); }
    else if (!minimized) setMinimized(true);
    else { setMinimized(false); setUnread(0); }
  };

  const closeWidget = (e: React.MouseEvent) => { e.stopPropagation(); setOpen(false); setMinimized(false); };

  return (
    <Box sx={{
      position: 'fixed',
      bottom: { xs: 12, sm: 24 },
      right: { xs: 12, sm: 24 },
      zIndex: 1300, display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 1,
    }}>

      {/* ── Fenêtre de chat ─────────────────────────────────────────────── */}
      <Zoom in={open} unmountOnExit>
        <Paper sx={{
          width: { xs: 'calc(100vw - 24px)', sm: 340 },
          maxWidth: 380,
          borderRadius: 3, overflow: 'hidden', boxShadow: '0 8px 32px rgba(0,0,0,0.18)',
          border: '1px solid #e8eaed',
          transformOrigin: 'bottom right',
        }}>
          {/* Header */}
          <Box sx={{ bgcolor: '#0F2D52', px: 2, py: 1.2, display: 'flex', alignItems: 'center', gap: 1 }}>
            <Avatar sx={{ bgcolor: '#00A896', width: 32, height: 32 }}><SmartToy sx={{ fontSize: 17 }} /></Avatar>
            <Box sx={{ flex: 1 }}>
              <Typography sx={{ color: '#fff', fontWeight: 700, fontSize: 13, lineHeight: 1.2 }}>MediBot</Typography>
              <Typography sx={{ color: '#00A896', fontSize: 10 }}>● Assistant santé IA</Typography>
            </Box>
            <Tooltip title="Réduire">
              <IconButton size="small" onClick={() => setMinimized(true)} sx={{ color: 'rgba(255,255,255,0.6)', '&:hover': { color: '#fff' } }}>
                <Minimize sx={{ fontSize: 16 }} />
              </IconButton>
            </Tooltip>
            <Tooltip title="Fermer">
              <IconButton size="small" onClick={closeWidget} sx={{ color: 'rgba(255,255,255,0.6)', '&:hover': { color: '#fff' } }}>
                <Close sx={{ fontSize: 16 }} />
              </IconButton>
            </Tooltip>
          </Box>

          {/* Body — masqué si minimisé */}
          <Fade in={!minimized} unmountOnExit>
            <Box>
              {/* Disclaimer */}
              <Box sx={{ px: 2, py: 0.8, bgcolor: '#fff8e1', display: 'flex', gap: 0.8, alignItems: 'flex-start' }}>
                <Typography sx={{ fontSize: 10, color: '#795548', lineHeight: 1.4 }}>
                  ⚠️ Conseils généraux uniquement. En urgence : formulaire urgence MediRoute.
                </Typography>
              </Box>

              {/* Messages */}
              <Box sx={{ height: 320, overflowY: 'auto', px: 1.5, py: 1.5, bgcolor: '#fff' }}>
                {loading ? (
                  <Box sx={{ display: 'flex', justifyContent: 'center', pt: 4 }}><CircularProgress size={24} sx={{ color: '#00A896' }} /></Box>
                ) : messages.length === 0 ? (
                  <Box sx={{ textAlign: 'center', pt: 3 }}>
                    <SmartToy sx={{ fontSize: 40, color: '#00A896', mb: 1 }} />
                    <Typography variant="body2" fontWeight={700} color="#0F2D52" mb={0.5} fontSize={13}>Bonjour ! Je suis MediBot</Typography>
                    <Typography variant="caption" color="text.secondary" mb={2} display="block">Posez-moi vos questions de santé</Typography>
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.8, mt: 1 }}>
                      {QUICK.map(s => (
                        <Chip key={s} label={s} clickable onClick={() => send(s)} size="small"
                          sx={{ bgcolor: '#e8f5e9', color: '#0F2D52', fontSize: 11, '&:hover': { bgcolor: '#c8e6c9' } }} />
                      ))}
                    </Box>
                  </Box>
                ) : (
                  <>
                    {messages.map(m => <Bubble key={m.id} msg={m} />)}
                    {sending && <TypingDots />}
                  </>
                )}
                <div ref={bottomRef} />
              </Box>

              {/* Suggestions rapides (si messages non vides) */}
              {messages.length > 0 && !sending && (
                <>
                  <Divider />
                  <Box sx={{ px: 1.5, py: 0.8, display: 'flex', gap: 0.6, overflowX: 'auto', '&::-webkit-scrollbar': { display: 'none' } }}>
                    {QUICK.slice(0, 3).map(s => (
                      <Chip key={s} label={s} clickable onClick={() => send(s)} size="small" variant="outlined"
                        sx={{ flexShrink: 0, fontSize: 10, borderColor: '#00A896', color: '#00A896' }} />
                    ))}
                    <Chip key="urgence" label="🏥 Urgence" clickable onClick={() => window.location.href = '/emergency'} size="small" variant="outlined"
                      sx={{ flexShrink: 0, fontSize: 10, borderColor: '#E63946', color: '#E63946' }} />
                  </Box>
                </>
              )}

              <Divider />

              {/* Zone de saisie */}
              <Box sx={{ p: 1.2, display: 'flex', gap: 1, alignItems: 'flex-end', bgcolor: '#fafafa' }}>
                <TextField
                  inputRef={inputRef}
                  fullWidth multiline maxRows={3} size="small"
                  placeholder="Votre question..."
                  value={input}
                  onChange={e => setInput(e.target.value)}
                  onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send(); } }}
                  disabled={sending}
                  sx={{
                    '& .MuiOutlinedInput-root': {
                      borderRadius: 2.5, fontSize: 13, bgcolor: '#fff',
                      '&.Mui-focused fieldset': { borderColor: '#00A896' },
                    },
                  }}
                />
                <IconButton
                  onClick={() => send()}
                  disabled={!input.trim() || sending}
                  size="small"
                  sx={{
                    bgcolor: '#00A896', color: '#fff', borderRadius: 2, p: 0.9, flexShrink: 0,
                    '&:hover': { bgcolor: '#008f80' },
                    '&.Mui-disabled': { bgcolor: '#e0e0e0', color: '#fff' },
                  }}>
                  {sending ? <CircularProgress size={16} color="inherit" /> : <Send sx={{ fontSize: 17 }} />}
                </IconButton>
              </Box>

              {/* Effacer */}
              {messages.length > 0 && (
                <Box sx={{ px: 1.5, pb: 1, display: 'flex', justifyContent: 'flex-end' }}>
                  <Typography
                    variant="caption" color="text.secondary" sx={{ cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 0.3, '&:hover': { color: '#E63946' }, fontSize: 10 }}
                    onClick={async () => { await chatbotService.clearHistory(); setMessages([]); loadedRef.current = false; }}>
                    <DeleteOutline sx={{ fontSize: 12 }} /> Effacer la conversation
                  </Typography>
                </Box>
              )}
            </Box>
          </Fade>

          {/* Barre réduite (minimisé) */}
          {minimized && (
            <Box sx={{ px: 2, py: 1, bgcolor: '#fff', display: 'flex', alignItems: 'center', gap: 1, cursor: 'pointer' }}
              onClick={() => { setMinimized(false); setUnread(0); }}>
              <Typography variant="caption" color="text.secondary" sx={{ flex: 1, fontSize: 11 }}>
                Cliquez pour rouvrir MediBot
              </Typography>
              <ExpandLess sx={{ color: '#00A896', fontSize: 18 }} />
            </Box>
          )}
        </Paper>
      </Zoom>

      {/* ── Bouton flottant ──────────────────────────────────────────────── */}
      <Tooltip title={open ? 'Réduire MediBot' : 'Ouvrir MediBot — Assistant santé IA'} placement="left">
        <Box sx={{ position: 'relative' }} onClick={toggle}>
          <Box sx={{
            width: 56, height: 56, borderRadius: '50%', bgcolor: '#00A896',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            cursor: 'pointer', boxShadow: '0 4px 16px rgba(0,168,150,0.45)',
            transition: 'all .2s', '&:hover': { bgcolor: '#008f80', transform: 'scale(1.08)', boxShadow: '0 6px 20px rgba(0,168,150,0.55)' },
          }}>
            {open && !minimized
              ? <Close sx={{ color: '#fff', fontSize: 24 }} />
              : <SmartToy sx={{ color: '#fff', fontSize: 26 }} />
            }
          </Box>
          {/* Badge non-lus */}
          {unread > 0 && (
            <Box sx={{
              position: 'absolute', top: 0, right: 0, width: 18, height: 18,
              borderRadius: '50%', bgcolor: '#E63946', border: '2px solid #fff',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <Typography sx={{ color: '#fff', fontSize: 9, fontWeight: 700 }}>{unread}</Typography>
            </Box>
          )}
        </Box>
      </Tooltip>
    </Box>
  );
};

export default ChatbotWidget;
