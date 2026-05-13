import React, { useRef, useState, useEffect } from 'react';
import {
  Box, Typography, IconButton, CircularProgress, Dialog,
  DialogTitle, DialogContent, DialogActions, Button, Alert, Menu, MenuItem,
} from '@mui/material';
import { PhotoCamera, Delete, AddAPhoto, CheckCircle, PhotoLibrary } from '@mui/icons-material';

interface Props {
  /** Image actuelle (base64 data URI ou URL) */
  value: string | null | undefined;
  /** Callback appelé avec le base64 data URI compressé */
  onChange: (base64: string | null) => void;
  /** Initiales à afficher si pas de photo */
  initials?: string;
  /** Taille du widget en pixels */
  size?: number;
  /** Désactive l'édition */
  readOnly?: boolean;
}

const ID_WIDTH  = 400;   // largeur cible "format ID"
const ID_HEIGHT = 500;   // hauteur cible "format ID" (ratio 4:5 comme une carte d'identité)
const MAX_INPUT_SIZE = 8 * 1024 * 1024; // 8 MB max en entrée

/**
 * Redimensionne et compresse une image au format ID (4:5) en JPEG ~85% qualité.
 * Retourne un data URI base64 (~50-150 KB selon l'image).
 */
const resizeToIdFormat = (file: File): Promise<string> => new Promise((resolve, reject) => {
  const reader = new FileReader();
  reader.onerror = () => reject(new Error('Lecture du fichier impossible'));
  reader.onload = e => {
    const img = new Image();
    img.onerror = () => reject(new Error('Image invalide'));
    img.onload = () => {
      // Calcul du crop pour respecter le ratio 4:5
      const targetRatio = ID_WIDTH / ID_HEIGHT;
      const sourceRatio = img.width / img.height;
      let sx = 0, sy = 0, sw = img.width, sh = img.height;
      if (sourceRatio > targetRatio) {
        // Image trop large → crop horizontal
        sw = img.height * targetRatio;
        sx = (img.width - sw) / 2;
      } else {
        // Image trop haute → crop vertical
        sh = img.width / targetRatio;
        sy = (img.height - sh) / 2;
      }

      const canvas = document.createElement('canvas');
      canvas.width  = ID_WIDTH;
      canvas.height = ID_HEIGHT;
      const ctx = canvas.getContext('2d');
      if (!ctx) return reject(new Error('Canvas 2D indisponible'));
      ctx.drawImage(img, sx, sy, sw, sh, 0, 0, ID_WIDTH, ID_HEIGHT);
      resolve(canvas.toDataURL('image/jpeg', 0.85));
    };
    img.src = e.target?.result as string;
  };
  reader.readAsDataURL(file);
});

const ProfilePhotoUpload: React.FC<Props> = ({
  value, onChange, initials = '?', size = 120, readOnly = false,
}) => {
  const galleryRef = useRef<HTMLInputElement>(null);
  const cameraRef = useRef<HTMLInputElement>(null);
  const [menuAnchor, setMenuAnchor] = useState<HTMLElement | null>(null);
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState('');
  const [preview, setPreview] = useState<string | null>(null);
  const [showPreview, setShowPreview] = useState(false);

  useEffect(() => { setPreview(null); }, [value]);

  const handleFile = async (file: File) => {
    setError('');
    if (file.size > MAX_INPUT_SIZE) {
      setError('Fichier trop volumineux (max 8 MB). Choisissez une image plus petite.');
      return;
    }
    if (!file.type.startsWith('image/')) {
      setError('Le fichier doit être une image (JPEG, PNG, etc.)');
      return;
    }
    try {
      setProcessing(true);
      const compressed = await resizeToIdFormat(file);
      setPreview(compressed);
      setShowPreview(true);
    } catch (e: any) {
      setError(e.message || 'Erreur de traitement de l\'image');
    } finally {
      setProcessing(false);
    }
  };

  const confirmPhoto = () => {
    if (preview) onChange(preview);
    setShowPreview(false);
  };

  const removePhoto = () => {
    onChange(null);
    setShowPreview(false);
    setPreview(null);
  };

  return (
    <>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
        <Box sx={{ position: 'relative', display: 'inline-block' }}>
          {/* Avatar avec ratio 4:5 (format ID) */}
          <Box sx={{
            width: size, height: size * 5/4,
            borderRadius: 2,
            overflow: 'hidden',
            border: '3px solid #fff',
            boxShadow: '0 4px 16px rgba(0,0,0,0.12)',
            bgcolor: '#0F2D52',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            position: 'relative',
          }}>
            {value ? (
              <img src={value} alt="Profil"
                style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            ) : (
              <Typography sx={{ color: '#fff', fontWeight: 800, fontSize: size * 0.35 }}>
                {initials.toUpperCase()}
              </Typography>
            )}
            {processing && (
              <Box sx={{
                position: 'absolute', inset: 0, bgcolor: 'rgba(0,0,0,0.5)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                <CircularProgress size={28} sx={{ color: '#fff' }} />
              </Box>
            )}
          </Box>

          {!readOnly && (
            <IconButton
              size="small"
              onClick={(e) => setMenuAnchor(e.currentTarget)}
              disabled={processing}
              sx={{
                position: 'absolute', bottom: -8, right: -8,
                bgcolor: '#00A896', color: '#fff',
                width: 36, height: 36,
                '&:hover': { bgcolor: '#008f80' },
                boxShadow: '0 2px 8px rgba(0,0,0,0.2)',
              }}>
              {value ? <PhotoCamera sx={{ fontSize: 18 }} /> : <AddAPhoto sx={{ fontSize: 18 }} />}
            </IconButton>
          )}

          <Menu
            anchorEl={menuAnchor}
            open={Boolean(menuAnchor)}
            onClose={() => setMenuAnchor(null)}
            anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
            transformOrigin={{ vertical: 'top', horizontal: 'right' }}>
            <MenuItem onClick={() => { setMenuAnchor(null); galleryRef.current?.click(); }}>
              <PhotoLibrary sx={{ fontSize: 18, mr: 1.5, color: '#0F2D52' }} />
              Choisir depuis la galerie
            </MenuItem>
            <MenuItem onClick={() => { setMenuAnchor(null); cameraRef.current?.click(); }}>
              <PhotoCamera sx={{ fontSize: 18, mr: 1.5, color: '#00A896' }} />
              Prendre une photo
            </MenuItem>
          </Menu>
        </Box>

        <Box>
          <Typography variant="body2" fontWeight={600} color="#0F2D52">Photo de profil</Typography>
          <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>
            Format ID (4:5)
          </Typography>
          {!readOnly && (
            <Box sx={{ display: 'flex', gap: 1, mt: 1, flexWrap: 'wrap' }}>
              <Button size="small" variant="outlined" onClick={() => galleryRef.current?.click()}
                startIcon={<PhotoLibrary />} disabled={processing}
                sx={{ borderColor: '#0F2D52', color: '#0F2D52', '&:hover': { borderColor: '#0a1d36' } }}>
                Galerie
              </Button>
              <Button size="small" variant="outlined" onClick={() => cameraRef.current?.click()}
                startIcon={<PhotoCamera />} disabled={processing}
                sx={{ borderColor: '#00A896', color: '#00A896', '&:hover': { borderColor: '#008f80' } }}>
                Caméra
              </Button>
              {value && (
                <Button size="small" color="error" onClick={removePhoto}
                  startIcon={<Delete />}>
                  Supprimer
                </Button>
              )}
            </Box>
          )}
        </Box>

        {/* Input galerie — pas de capture, ouvre l'explorateur de fichiers / galerie */}
        <input
          ref={galleryRef}
          type="file"
          accept="image/*"
          style={{ display: 'none' }}
          onChange={e => {
            const f = e.target.files?.[0];
            if (f) handleFile(f);
            e.target.value = '';
          }}
        />

        {/* Input caméra — capture="user" déclenche la caméra avant sur mobile */}
        <input
          ref={cameraRef}
          type="file"
          accept="image/*"
          capture="user"
          style={{ display: 'none' }}
          onChange={e => {
            const f = e.target.files?.[0];
            if (f) handleFile(f);
            e.target.value = '';
          }}
        />
      </Box>

      {error && (
        <Alert severity="error" sx={{ mt: 1.5, borderRadius: 2 }}>{error}</Alert>
      )}

      {/* Dialog de prévisualisation après crop */}
      <Dialog open={showPreview} onClose={() => setShowPreview(false)} maxWidth="xs" fullWidth>
        <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <CheckCircle sx={{ color: '#00A896' }} />
          Prévisualisation
        </DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'flex', justifyContent: 'center', mb: 2 }}>
            {preview && (
              <Box sx={{
                width: 240, height: 300, borderRadius: 2, overflow: 'hidden',
                border: '2px solid #00A896', boxShadow: '0 4px 16px rgba(0,0,0,0.15)',
              }}>
                <img src={preview} alt="Aperçu"
                  style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              </Box>
            )}
          </Box>
          <Alert severity="info" sx={{ fontSize: 12 }}>
            Photo recadrée automatiquement au format ID (400×500 px). Confirmez pour enregistrer.
          </Alert>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowPreview(false)}>Reprendre</Button>
          <Button variant="contained" onClick={confirmPhoto}
            sx={{ bgcolor: '#00A896', '&:hover': { bgcolor: '#008f80' } }}>
            Confirmer
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
};

export default ProfilePhotoUpload;
