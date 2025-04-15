import PropTypes from 'prop-types';
import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Divider,
  Button,
  TextField,
  Grid,
  FormControl,
  Alert,
  Stack,
  Typography
} from '@mui/material';
import { useTranslation } from 'react-i18next';
import { API } from 'utils/api';
import { showError, showSuccess } from 'utils/common';
import LoadingButton from '@mui/lab/LoadingButton';
import Label from 'ui-component/Label';

export const CheckUpdates = ({ open, onCancel, onOk, row }) => {
  const { t } = useTranslation();
  const [url, setUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [updateLoading, setUpdateLoading] = useState(false);
  const [newPricing, setNewPricing] = useState([]);
  const [addModel, setAddModel] = useState([]);
  const [diffModel, setDiffModel] = useState([]);

  useEffect(() => {
    const fetchUpdateUrl = async () => {
      try {
        const res = await API.get('/api/prices/updateService');
        if (res.data?.data) {
          setUrl(res.data.data);
        }
      } catch (err) {
        console.error(err);
        setUrl('https://raw.githubusercontent.com/MartialBE/one-api/prices/prices.json');
      }
    };
    fetchUpdateUrl();
  }, []);

  const handleCheckUpdates = async () => {
    setLoading(true);
    try {
      const res = await API.get(url);
      let responseData = Array.isArray(res?.data) ? res.data : res?.data?.data ?? [];
      // 检测是否是一个列表
      if (!Array.isArray(responseData)) {
        showError(t('CheckUpdatesTable.dataFormatIncorrect'));
      } else {
        setNewPricing(responseData);
      }
    } catch (err) {
      showError(err.message);
      console.error(err);
    }
    setLoading(false);
  };

  const syncPricing = async (updateMode) => {
    setUpdateLoading(true);
    if (!newPricing.length) {
      showError(t('CheckUpdatesTable.pleaseFetchData'));
      setUpdateLoading(false);
      return;
    }

    if (updateMode === 'add' && !addModel.length) {
      showError(t('CheckUpdatesTable.noNewModels'));
      setUpdateLoading(false);
      return;
    }
    try {
      const res = await API.post('/api/prices/sync?updateMode=' + updateMode, newPricing);
      const { success, message } = res.data;
      if (success) {
        showSuccess(t('CheckUpdatesTable.operationCompleted'));
        onOk(true);
      } else {
        showError(message);
      }
    } catch (err) {
      console.error(err);
    }
    setUpdateLoading(false);
  };

  useEffect(() => {
    const newModels = newPricing.filter((np) => !row.some((r) => r.model === np.model));

    const changeModel = row.filter((r) =>
      newPricing.some((np) => np.model === r.model && (np.input !== r.input || np.output !== r.output))
    );

    if (newModels.length > 0) {
      const newModelsList = newModels.map((model) => model.model);
      setAddModel(newModelsList);
    } else {
      setAddModel('');
    }

    if (changeModel.length > 0) {
      const changeModelList = changeModel.map((model) => {
        const newModel = newPricing.find((np) => np.model === model.model);
        let changes = '';
        if (model.input !== newModel.input) {
          changes += `${t('CheckUpdatesTable.inputMultiplierChanged')} ${model.input} ${t('CheckUpdatesTable.to')} ${newModel.input},`;
        }
        if (model.output !== newModel.output) {
          changes += `${t('CheckUpdatesTable.outputMultiplierChanged')} ${model.output} ${t('CheckUpdatesTable.to')} ${newModel.output}`;
        }
        return `${model.model}:${changes}`;
      });
      setDiffModel(changeModelList);
    } else {
      setDiffModel('');
    }
  }, [row, newPricing, t]);

  return (
    <Dialog open={open} onClose={onCancel} fullWidth maxWidth={'md'}>
      <DialogTitle sx={{ margin: '0px', fontWeight: 700, lineHeight: '1.55556', padding: '24px', fontSize: '1.125rem' }}>
        {t('CheckUpdatesTable.checkUpdates')}
      </DialogTitle>
      <Divider />
      <DialogContent>
        <Grid container justifyContent="center" alignItems="center" spacing={2}>
          <Grid item xs={12} md={9}>
            <FormControl fullWidth component="fieldset">
              <TextField label={t('CheckUpdatesTable.url')} variant="outlined" value={url} onChange={(e) => setUrl(e.target.value)} />
            </FormControl>
          </Grid>
          <Grid item xs={12} md={3}>
            <LoadingButton variant="contained" color="primary" onClick={handleCheckUpdates} loading={loading}>
              {t('CheckUpdatesTable.fetchData')}
            </LoadingButton>
          </Grid>
          {newPricing.length > 0 && (
            <Grid item xs={12}>
              <Alert severity="info" marginBottom={1}>
                {t('CheckUpdatesTable.priceServerTotal') + ': ' + newPricing.length} <br />
                {t('CheckUpdatesTable.newModels') + ': ' + addModel.length} <br />
                {t('CheckUpdatesTable.priceChangeModels') + ': ' + diffModel.length}
              </Alert>
              {!addModel.length && !diffModel.length && (
                <>
                  <br />
                  <Alert severity="success">{t('CheckUpdatesTable.noUpdates')}</Alert>
                </>
              )}
              <br />
              {addModel.length > 0 && (
                <Alert severity="warning">
                  {t('CheckUpdatesTable.newModels')}：
                  <Stack direction="row" spacing={1} flexWrap="wrap">
                    {addModel.map((model) => (
                      <Label color="info" key={model} variant="outlined">
                        {model}
                      </Label>
                    ))}
                  </Stack>
                </Alert>
              )}

              {diffModel.length > 0 && (
                <Alert severity="warning">
                  {t('CheckUpdatesTable.priceChangeModels')}：
                  {diffModel.map((model) => (
                    <Typography variant="button" display="block" gutterBottom key={model}>
                      {model}
                    </Typography>
                  ))}
                </Alert>
              )}
              <Alert severity="warning">
                {t('CheckUpdatesTable.note')}:{t('CheckUpdatesTable.overwriteOrAddOnly')}
              </Alert>
              <Stack direction="row" justifyContent="center" spacing={1} flexWrap="wrap" marginTop={2}>
                {/* 只新增 */}
                <LoadingButton
                  variant="contained"
                  color="primary"
                  onClick={() => {
                    syncPricing('add');
                  }}
                  loading={updateLoading}
                >
                  {t('CheckUpdatesTable.updateModeAdd')}
                </LoadingButton>
                <LoadingButton
                  variant="contained"
                  color="primary"
                  onClick={() => {
                    syncPricing('update');
                  }}
                  loading={updateLoading}
                >
                  {t('CheckUpdatesTable.updateModeUpdate')}
                </LoadingButton>
                <LoadingButton
                  variant="contained"
                  color="primary"
                  onClick={() => {
                    syncPricing('overwrite');
                  }}
                  loading={updateLoading}
                >
                  {t('CheckUpdatesTable.updateModeOverwrite')}
                </LoadingButton>
              </Stack>
            </Grid>
          )}
        </Grid>
      </DialogContent>
      <DialogActions>
        <Button onClick={onCancel} color="primary">
          {t('CheckUpdatesTable.cancel')}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

CheckUpdates.propTypes = {
  open: PropTypes.bool,
  row: PropTypes.array,
  onCancel: PropTypes.func,
  onOk: PropTypes.func
};
