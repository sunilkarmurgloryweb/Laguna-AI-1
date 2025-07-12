import React from 'react';
import {
  Box,
  Paper,
  Typography,
  Avatar,
  Chip,
  Divider,
  Card,
  CardContent
} from '@mui/material';
import { Grid } from '@mui/material';
import {
  CheckCircle,
  Hotel,
  Person,
  CreditCard,
  CalendarToday,
  ConfirmationNumber,
  Room,
  Payment,
  ExitToApp,
  Login
} from '@mui/icons-material';
import { multilingualAI } from '../services/multilingualAIService';

interface ProcessCompletionMessageProps {
  processType: 'reservation' | 'checkin' | 'checkout';
  confirmationData: {
    confirmationNumber?: string;
    roomNumber?: string;
    guestName?: string;
    checkInDate?: string;
    checkOutDate?: string;
    roomType?: string;
    totalAmount?: number;
  };
  timestamp: Date;
  language?: string;
}

const ProcessCompletionMessage: React.FC<ProcessCompletionMessageProps> = ({
  processType,
  confirmationData,
  timestamp,
  language = 'en'
}) => {
  // Get multilingual content
  const title = multilingualAI.getProcessCompletionMessage(processType, 'title', {
    confirmationNumber: confirmationData.confirmationNumber || '',
    roomNumber: confirmationData.roomNumber || ''
  }, language);
  
  const description = multilingualAI.getProcessCompletionMessage(processType, 'description', {}, language);
  const fields = multilingualAI.getProcessCompletionFields(processType, language);
  const getProcessConfig = () => {
    switch (processType) {
      case 'reservation':
        return {
          title,
          icon: <Hotel sx={{ fontSize: 32, color: 'success.main' }} />,
          color: 'success.main',
          bgColor: 'success.light',
          description
        };
      case 'checkin':
        return {
          title,
          icon: <Login sx={{ fontSize: 32, color: 'primary.main' }} />,
          color: 'primary.main',
          bgColor: 'primary.light',
          description
        };
      case 'checkout':
        return {
          title,
          icon: <ExitToApp sx={{ fontSize: 32, color: 'warning.main' }} />,
          color: 'warning.main',
          bgColor: 'warning.light',
          description
        };
      default:
        return {
          title,
          icon: <CheckCircle sx={{ fontSize: 32, color: 'success.main' }} />,
          color: 'success.main',
          bgColor: 'success.light',
          description
        };
    }
  };

  const config = getProcessConfig();

  const renderReservationDetails = () => (
    <Card sx={{ mt: 2, border: 1, borderColor: 'success.main' }}>
      <CardContent sx={{ p: 2 }}>
        <Typography variant="h6" fontWeight="bold" color="success.main" gutterBottom>
          {language === 'es' ? 'Detalles de la Reserva' :
           language === 'hi' ? 'आरक्षण विवरण' :
           language === 'fr' ? 'Détails de la Réservation' :
           language === 'de' ? 'Reservierungsdetails' :
           language === 'it' ? 'Dettagli della Prenotazione' :
           language === 'pt' ? 'Detalhes da Reserva' :
           language === 'ja' ? 'ご予約詳細' :
           language === 'ko' ? '예약 세부사항' :
           language === 'zh' ? '预订详情' :
           'Reservation Details'}
        </Typography>
        
        <Grid container spacing={2}>
          {confirmationData.confirmationNumber && (
            <Grid size={{ xs: 12 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                <ConfirmationNumber sx={{ fontSize: 20, color: 'success.main' }} />
                <Typography variant="body2" fontWeight="bold">
                  {fields.confirmationNumber}:
                </Typography>
                <Chip 
                  label={confirmationData.confirmationNumber} 
                  color="success" 
                  size="small"
                  sx={{ fontWeight: 'bold' }}
                />
              </Box>
            </Grid>
          )}
          
          {confirmationData.guestName && (
            <Grid size={{ xs: 12, sm: 6 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Person sx={{ fontSize: 16, color: 'text.secondary' }} />
                <Typography variant="body2" color="text.secondary">{fields.guestName}:</Typography>
                <Typography variant="body2" fontWeight="medium">
                  {confirmationData.guestName}
                </Typography>
              </Box>
            </Grid>
          )}
          
          {confirmationData.roomType && (
            <Grid size={{ xs: 12, sm: 6 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Hotel sx={{ fontSize: 16, color: 'text.secondary' }} />
                <Typography variant="body2" color="text.secondary">{fields.roomType}:</Typography>
                <Typography variant="body2" fontWeight="medium">
                  {confirmationData.roomType}
                </Typography>
              </Box>
            </Grid>
          )}
          
          {confirmationData.checkInDate && (
            <Grid size={{ xs: 12, sm: 6 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <CalendarToday sx={{ fontSize: 16, color: 'text.secondary' }} />
                <Typography variant="body2" color="text.secondary">{fields.checkInDate}:</Typography>
                <Typography variant="body2" fontWeight="medium">
                  {confirmationData.checkInDate}
                </Typography>
              </Box>
            </Grid>
          )}
          
          {confirmationData.checkOutDate && (
            <Grid size={{ xs: 12, sm: 6 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <CalendarToday sx={{ fontSize: 16, color: 'text.secondary' }} />
                <Typography variant="body2" color="text.secondary">{fields.checkOutDate}:</Typography>
                <Typography variant="body2" fontWeight="medium">
                  {confirmationData.checkOutDate}
                </Typography>
              </Box>
            </Grid>
          )}
          
          {confirmationData.totalAmount && (
            <Grid size={{ xs: 12 }}>
              <Divider sx={{ my: 1 }} />
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Payment sx={{ fontSize: 16, color: 'text.secondary' }} />
                  <Typography variant="body2" color="text.secondary">{fields.totalAmount}:</Typography>
                </Box>
                <Typography variant="h6" fontWeight="bold" color="success.main">
                  ${confirmationData.totalAmount}
                </Typography>
              </Box>
            </Grid>
          )}
        </Grid>
      </CardContent>
    </Card>
  );

  const renderCheckInDetails = () => (
    <Card sx={{ mt: 2, border: 1, borderColor: 'primary.main' }}>
      <CardContent sx={{ p: 2 }}>
        <Typography variant="h6" fontWeight="bold" color="primary.main" gutterBottom>
          {language === 'es' ? 'Detalles del Check-in' :
           language === 'hi' ? 'चेक-इन विवरण' :
           language === 'fr' ? 'Détails de l\'Enregistrement' :
           language === 'de' ? 'Check-in Details' :
           language === 'it' ? 'Dettagli del Check-in' :
           language === 'pt' ? 'Detalhes do Check-in' :
           language === 'ja' ? 'チェックイン詳細' :
           language === 'ko' ? '체크인 세부사항' :
           language === 'zh' ? '入住详情' :
           'Check-in Details'}
        </Typography>
        
        <Grid container spacing={2}>
          {confirmationData.roomNumber && (
            <Grid size={{ xs: 12 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                <Room sx={{ fontSize: 20, color: 'primary.main' }} />
                <Typography variant="body2" fontWeight="bold">
                  {fields.roomNumber}:
                </Typography>
                <Chip 
                  label={confirmationData.roomNumber} 
                  color="primary" 
                  size="small"
                  sx={{ fontWeight: 'bold' }}
                />
              </Box>
            </Grid>
          )}
          
          {confirmationData.guestName && (
            <Grid size={{ xs: 12, sm: 6 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Person sx={{ fontSize: 16, color: 'text.secondary' }} />
                <Typography variant="body2" color="text.secondary">{fields.guestName}:</Typography>
                <Typography variant="body2" fontWeight="medium">
                  {confirmationData.guestName}
                </Typography>
              </Box>
            </Grid>
          )}
          
          {confirmationData.roomType && (
            <Grid size={{ xs: 12, sm: 6 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Hotel sx={{ fontSize: 16, color: 'text.secondary' }} />
                <Typography variant="body2" color="text.secondary">{fields.roomType}:</Typography>
                <Typography variant="body2" fontWeight="medium">
                  {confirmationData.roomType}
                </Typography>
              </Box>
            </Grid>
          )}
          
          <Grid size={{ xs: 12 }}>
            <Box sx={{ 
              bgcolor: 'primary.light', 
              p: 2, 
              borderRadius: 1, 
              textAlign: 'center',
              mt: 1
            }}>
              <Typography variant="body2" fontWeight="bold" color="primary.contrastText">
                🗝️ {fields.keyCards}
              </Typography>
            </Box>
          </Grid>
        </Grid>
      </CardContent>
    </Card>
  );

  const renderCheckOutDetails = () => (
    <Card sx={{ mt: 2, border: 1, borderColor: 'warning.main' }}>
      <CardContent sx={{ p: 2 }}>
        <Typography variant="h6" fontWeight="bold" color="warning.main" gutterBottom>
          {language === 'es' ? 'Resumen del Check-out' :
           language === 'hi' ? 'चेक-आउट सारांश' :
           language === 'fr' ? 'Résumé du Départ' :
           language === 'de' ? 'Check-out Zusammenfassung' :
           language === 'it' ? 'Riepilogo Check-out' :
           language === 'pt' ? 'Resumo do Check-out' :
           language === 'ja' ? 'チェックアウト概要' :
           language === 'ko' ? '체크아웃 요약' :
           language === 'zh' ? '退房摘要' :
           'Check-out Summary'}
        </Typography>
        
        <Grid container spacing={2}>
          {confirmationData.guestName && (
            <Grid size={{ xs: 12, sm: 6 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Person sx={{ fontSize: 16, color: 'text.secondary' }} />
                <Typography variant="body2" color="text.secondary">{fields.guestName}:</Typography>
                <Typography variant="body2" fontWeight="medium">
                  {confirmationData.guestName}
                </Typography>
              </Box>
            </Grid>
          )}
          
          {confirmationData.roomNumber && (
            <Grid size={{ xs: 12, sm: 6 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Room sx={{ fontSize: 16, color: 'text.secondary' }} />
                <Typography variant="body2" color="text.secondary">{fields.roomNumber}:</Typography>
                <Typography variant="body2" fontWeight="medium">
                  {confirmationData.roomNumber}
                </Typography>
              </Box>
            </Grid>
          )}
          
          {confirmationData.totalAmount && (
            <Grid size={{ xs: 12 }}>
              <Divider sx={{ my: 1 }} />
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Payment sx={{ fontSize: 16, color: 'text.secondary' }} />
                  <Typography variant="body2" color="text.secondary">{fields.totalAmount}:</Typography>
                </Box>
                <Typography variant="h6" fontWeight="bold" color="warning.main">
                  ${confirmationData.totalAmount}
                </Typography>
              </Box>
            </Grid>
          )}
          
          <Grid size={{ xs: 12 }}>
            <Box sx={{ 
              bgcolor: 'warning.light', 
              p: 2, 
              borderRadius: 1, 
              textAlign: 'center',
              mt: 1
            }}>
              <Typography variant="body2" fontWeight="bold" color="warning.contrastText">
                🧾 {fields.receipt}
              </Typography>
            </Box>
          </Grid>
        </Grid>
      </CardContent>
    </Card>
  );

  return (
    <Paper
      elevation={3}
      sx={{
        p: 3,
        bgcolor: config.bgColor,
        border: 2,
        borderColor: config.color,
        borderRadius: 2,
        maxWidth: '100%'
      }}
    >
      {/* Header */}
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
        <Avatar sx={{ bgcolor: config.color, width: 48, height: 48 }}>
          {config.icon}
        </Avatar>
        <Box sx={{ flex: 1 }}>
          <Typography variant="h6" fontWeight="bold" color={config.color}>
            {config.title}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {config.description}
          </Typography>
        </Box>
        <CheckCircle sx={{ fontSize: 32, color: config.color }} />
      </Box>

      {/* Process-specific details */}
      {processType === 'reservation' && renderReservationDetails()}
      {processType === 'checkin' && renderCheckInDetails()}
      {processType === 'checkout' && renderCheckOutDetails()}

      {/* Footer */}
      <Box sx={{ mt: 2, pt: 2, borderTop: 1, borderColor: 'divider' }}>
        <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>
          {language === 'es' ? 'Completado a las' :
           language === 'hi' ? 'पूर्ण समय' :
           language === 'fr' ? 'Terminé à' :
           language === 'de' ? 'Abgeschlossen um' :
           language === 'it' ? 'Completato alle' :
           language === 'pt' ? 'Concluído às' :
           language === 'ja' ? '完了時刻' :
           language === 'ko' ? '완료 시간' :
           language === 'zh' ? '完成时间' :
           'Completed at'} {timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} {language === 'es' ? 'el' :
           language === 'hi' ? 'को' :
           language === 'fr' ? 'le' :
           language === 'de' ? 'am' :
           language === 'it' ? 'il' :
           language === 'pt' ? 'em' :
           language === 'ja' ? '' :
           language === 'ko' ? '' :
           language === 'zh' ? '' :
           'on'} {timestamp.toLocaleDateString()}
        </Typography>
        <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 0.5 }}>
          {language === 'es' ? '¿Necesita ayuda? Diga "ayuda" o contacte recepción al +1 (555) 123-4567' :
           language === 'hi' ? 'मदद चाहिए? "मदद" कहें या +1 (555) 123-4567 पर संपर्क करें' :
           language === 'fr' ? 'Besoin d\'aide? Dites "aide" ou contactez la réception au +1 (555) 123-4567' :
           language === 'de' ? 'Hilfe benötigt? Sagen Sie "Hilfe" oder kontaktieren Sie die Rezeption unter +1 (555) 123-4567' :
           language === 'it' ? 'Serve aiuto? Dite "aiuto" o contattate la reception al +1 (555) 123-4567' :
           language === 'pt' ? 'Precisa de ajuda? Diga "ajuda" ou contacte a recepção em +1 (555) 123-4567' :
           language === 'ja' ? 'ヘルプが必要ですか？「ヘルプ」と言うか、+1 (555) 123-4567 までお電話ください' :
           language === 'ko' ? '도움이 필요하신가요? "도움"이라고 말하거나 +1 (555) 123-4567로 연락하세요' :
           language === 'zh' ? '需要帮助？说"帮助"或致电前台 +1 (555) 123-4567' :
           'Need help? Say "help" or contact our front desk at +1 (555) 123-4567'}
        </Typography>
      </Box>
    </Paper>
  );
};

export default ProcessCompletionMessage;