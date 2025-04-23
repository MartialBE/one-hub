import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { showError, calculateQuota, thousandsSeparator, printElementAsPDF } from 'utils/common';

import {
  Box,
  Container,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Grid,
  Paper,
  Divider,
  Button,
  Stack,
  useTheme,
  alpha
} from '@mui/material';
import { API } from 'utils/api';
import { useTranslation } from 'react-i18next';
import Logo from 'ui-component/Logo';
import { Icon } from '@iconify/react';

export default function InvoiceDetail() {
  const { t } = useTranslation();
  const { date } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [invoiceData, setInvoiceData] = useState(null);
  const [userData, setUserData] = useState(null);
  const theme = useTheme();

  useEffect(() => {
    const fetchInvoiceDetail = async () => {
      setLoading(true);
      try {
        const res = await API.get(`/api/user/invoice/detail`, {
          params: {
            date: date + '-01'
          }
        });
        const { success, message, data } = res.data;
        if (success) {
          setInvoiceData(data);
          // Fetch user data
          const userRes = await API.get('/api/user/self');
          if (userRes.data.success) {
            setUserData(userRes.data.data);
          }
        } else {
          showError(message);
          navigate('/panel/invoice');
        }
      } catch (error) {
        console.error(error);
        showError('Failed to fetch invoice details');
        navigate('/panel/invoice');
      }
      setLoading(false);
    };

    if (date) {
      fetchInvoiceDetail();
    } else {
      navigate('/panel/invoice');
    }
  }, [date, navigate]);

  if (loading || !invoiceData || !userData) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        <Typography variant="h4">{t('dashboard_index.loading')}</Typography>
      </Box>
    );
  }

  // Calculate totals
  const totalQuota = invoiceData.reduce((sum, item) => sum + item.quota, 0);
  const totalPromptTokens = invoiceData.reduce((sum, item) => sum + item.prompt_tokens, 0);
  const totalCompletionTokens = invoiceData.reduce((sum, item) => sum + item.completion_tokens, 0);
  const totalRequestCount = invoiceData.reduce((sum, item) => sum + item.request_count, 0);
  const totalRequestTime = invoiceData.reduce((sum, item) => sum + item.request_time, 0);

  // Handle return to invoice list
  const handleReturn = () => {
    navigate('/panel/invoice');
  };

  // Handle download invoice as PDF
  //   const handleDownload = () => {
  //     printElementAsPDF('invoice-paper', `invoice-${date}.pdf`);
  //   };

  return (
    <Container maxWidth="lg" sx={{ mt: 6, mb: 6 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
        <Typography variant="h2">{t('invoice_index.invoice')}</Typography>
        <Stack direction="row" spacing={2}>
          <Button
            variant="outlined"
            startIcon={<Icon icon="solar:arrow-left-bold-duotone" width={18} />}
            onClick={handleReturn}
            sx={{
              borderRadius: '8px',
              px: 2
            }}
          >
            {t('back')}
          </Button>
          {/*<Button*/}
          {/*  variant="contained"*/}
          {/*  startIcon={<Icon icon="solar:download-bold-duotone" width={18} />}*/}
          {/*  onClick={handleDownload}*/}
          {/*  sx={{*/}
          {/*    borderRadius: '8px',*/}
          {/*    px: 2,*/}
          {/*    boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)'*/}
          {/*  }}*/}
          {/*>*/}
          {/*  {t('invoice_index.download') || 'Download PDF'}*/}
          {/*</Button>*/}
        </Stack>
      </Box>

      <Paper
        id="invoice-paper"
        elevation={3}
        sx={{
          p: 4,
          mb: 4,
          borderRadius: '12px',
          boxShadow: '0 8px 24px rgba(0, 0, 0, 0.05)'
        }}
      >
        <Box sx={{ mb: 4, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Logo />
          <Typography
            variant="h5"
            sx={{
              color: theme.palette.text.secondary,
              fontWeight: 500
            }}
          >
            #{date.replace(/-/g, '')}-{userData.id}
          </Typography>
        </Box>

        <Divider sx={{ borderStyle: 'dashed', borderWidth: '1.5px', mb: 4 }} />

        <Grid container spacing={4} sx={{ mb: 4 }}>
          <Grid item xs={12} md={6}>
            <Typography
              variant="h4"
              gutterBottom
              sx={{
                fontWeight: 600,
                fontSize: '1.25rem',
                mb: 2
              }}
            >
              {t('invoice_index.userinfo')}
            </Typography>
            <Box>
              <Typography variant="body1" gutterBottom sx={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: theme.palette.text.secondary }}>{t('invoice_index.username')}</span>
                <span style={{ fontWeight: 500 }}>{userData.username}</span>
              </Typography>
              <Typography variant="body1" gutterBottom sx={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: theme.palette.text.secondary }}>{t('invoice_index.email')}</span>
                <span style={{ fontWeight: 500 }}>{userData.email}</span>
              </Typography>
              <Typography variant="body1" gutterBottom sx={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: theme.palette.text.secondary }}>{t('invoice_index.date')}</span>
                <span style={{ fontWeight: 500 }}>{date ? date.substring(0, 7) : ''}</span>
              </Typography>
            </Box>
          </Grid>
          <Grid item xs={12} md={6}>
            <Typography
              variant="h4"
              gutterBottom
              sx={{
                fontWeight: 600,
                fontSize: '1.25rem',
                mb: 2
              }}
            >
              {t('invoice_index.usage_statistics')}
            </Typography>
            <Box>
              <Typography variant="body1" gutterBottom sx={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: theme.palette.text.secondary }}>{t('invoice_index.promptTokens')}</span>
                <span style={{ fontWeight: 500 }}>{thousandsSeparator(totalPromptTokens)}</span>
              </Typography>
              <Typography variant="body1" gutterBottom sx={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: theme.palette.text.secondary }}>{t('invoice_index.completionTokens')}</span>
                <span style={{ fontWeight: 500 }}>{thousandsSeparator(totalCompletionTokens)}</span>
              </Typography>
              <Typography variant="body1" gutterBottom sx={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: theme.palette.text.secondary }}>{t('invoice_index.requestTime')}</span>
                <span style={{ fontWeight: 500 }}>{(totalRequestTime / 1000).toFixed(3)}s</span>
              </Typography>
              <Typography variant="body1" gutterBottom sx={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: theme.palette.text.secondary }}>{t('invoice_index.requestCount')}</span>
                <span style={{ fontWeight: 500 }}>{thousandsSeparator(totalRequestCount)}</span>
              </Typography>
            </Box>
          </Grid>
        </Grid>
        <Divider sx={{ borderStyle: 'dashed', borderWidth: '1.5px', mb: 4 }} />
        <Typography
          variant="h4"
          gutterBottom
          sx={{
            fontWeight: 600,
            fontSize: '1.25rem',
            mb: 2
          }}
        >
          {t('invoice_index.usage_details') || 'Usage Details'}
        </Typography>

        <TableContainer
          sx={{
            mb: 4,
            borderRadius: '8px',
            // overflow: 'hidden',
            border: `1px solid ${alpha(theme.palette.divider, 0.1)}`
          }}
        >
          <Table>
            <TableHead>
              <TableRow sx={{ backgroundColor: alpha(theme.palette.primary.light, 0.1) }}>
                <TableCell
                  sx={{
                    fontWeight: 600,
                    color: theme.palette.text.primary,
                    fontSize: '0.9rem'
                  }}
                >
                  {t('invoice_index.modelName')}
                </TableCell>
                <TableCell
                  align="right"
                  sx={{
                    fontWeight: 600,
                    color: theme.palette.text.primary,
                    fontSize: '0.9rem'
                  }}
                >
                  {t('invoice_index.promptTokens')}
                </TableCell>
                <TableCell
                  align="right"
                  sx={{
                    fontWeight: 600,
                    color: theme.palette.text.primary,
                    fontSize: '0.9rem'
                  }}
                >
                  {t('invoice_index.completionTokens')}
                </TableCell>
                <TableCell
                  align="right"
                  sx={{
                    fontWeight: 600,
                    color: theme.palette.text.primary,
                    fontSize: '0.9rem'
                  }}
                >
                  {t('invoice_index.requestCount')}
                </TableCell>
                <TableCell
                  align="right"
                  sx={{
                    fontWeight: 600,
                    color: theme.palette.text.primary,
                    fontSize: '0.9rem'
                  }}
                >
                  {t('invoice_index.requestTime')}
                </TableCell>
                <TableCell
                  align="right"
                  sx={{
                    fontWeight: 600,
                    color: theme.palette.text.primary,
                    fontSize: '0.9rem'
                  }}
                >
                  {t('invoice_index.amount')}
                </TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {invoiceData.map((item, index) => (
                <TableRow
                  key={index}
                  sx={{
                    '&:nth-of-type(odd)': {
                      bgcolor: alpha(theme.palette.action.hover, 0.05)
                    },
                    '&:last-child td, &:last-child th': {
                      border: 0
                    }
                  }}
                >
                  <TableCell sx={{ p: 2 }}>
                    <Typography variant="body2" color="textPrimary" sx={{ fontWeight: 500 }}>
                      {item.model_name}
                    </Typography>
                  </TableCell>
                  <TableCell align="right" sx={{ p: 2 }}>
                    {thousandsSeparator(item.prompt_tokens)}
                  </TableCell>
                  <TableCell align="right" sx={{ p: 2 }}>
                    {thousandsSeparator(item.completion_tokens)}
                  </TableCell>
                  <TableCell align="right" sx={{ p: 2 }}>
                    {thousandsSeparator(item.request_count)}
                  </TableCell>
                  <TableCell align="right" sx={{ p: 2 }}>
                    {(item.request_time / 1000).toFixed(3)}s
                  </TableCell>
                  <TableCell align="right" sx={{ p: 2 }}>
                    ${calculateQuota(item.quota, 6)}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>

        <Divider sx={{ borderStyle: 'dashed', borderWidth: '1.5px', mb: 4 }} />

        <Box
          sx={{
            display: 'flex',
            alignItems: 'baseline',
            justifyContent: 'flex-end',
            gap: 2,
            borderRadius: '8px'
          }}
        >
          <Typography variant="h5" sx={{ fontWeight: 500, color: theme.palette.text.primary }}>
            {t('invoice_index.quota')}
          </Typography>
          <Typography
            variant="h4"
            sx={{
              fontWeight: 700,
              color: theme.palette.success.dark,
              fontSize: '1.65rem'
            }}
          >
            ${calculateQuota(totalQuota, 6)}
          </Typography>
        </Box>
      </Paper>
    </Container>
  );
}
