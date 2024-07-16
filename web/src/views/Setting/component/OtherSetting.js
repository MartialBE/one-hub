import { useState, useEffect, useContext } from 'react';
import SubCard from 'ui-component/cards/SubCard';
import {
  Stack,
  FormControl,
  InputLabel,
  OutlinedInput,
  Button,
  TextField,
} from '@mui/material';
import Grid from '@mui/material/Unstable_Grid2';
import { showError, showSuccess } from 'utils/common'; //,
import { API } from 'utils/api';
import { LoadStatusContext } from 'contexts/StatusContext';
import { useTranslation } from 'react-i18next';

const OtherSetting = () => {
  const { t } = useTranslation();
  let [inputs, setInputs] = useState({
    Footer: '',
    Notice: '',
    About: '',
    SystemName: '',
    Logo: '',
    HomePageContent: ''
  });
  let [loading, setLoading] = useState(false);
  const loadStatus = useContext(LoadStatusContext);

  const getOptions = async () => {
    try {
      const res = await API.get('/api/option/');
      const { success, message, data } = res.data;
      if (success) {
        let newInputs = {};
        data.forEach((item) => {
          if (item.key in inputs) {
            newInputs[item.key] = item.value;
          }
        });
        setInputs(newInputs);
      } else {
        showError(message);
      }
    } catch (error) {
      return;
    }
  };

  useEffect(() => {
    getOptions().then();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const updateOption = async (key, value) => {
    setLoading(true);
    try {
      const res = await API.put('/api/option/', {
        key,
        value
      });
      const { success, message } = res.data;
      if (success) {
        showSuccess('保存成功');
        getOptions();
        await loadStatus();
      } else {
        showError(message);
      }
      setLoading(false);
    } catch (error) {
      return;
    }
  };

  const handleInputChange = async (event) => {
    let { name, value } = event.target;
    setInputs((inputs) => ({ ...inputs, [name]: value }));
  };

  const submitNotice = async () => {
    await updateOption('Notice', inputs.Notice);
  };

  const submitFooter = async () => {
    await updateOption('Footer', inputs.Footer);
  };

  const submitSystemName = async () => {
    await updateOption('SystemName', inputs.SystemName);
  };

  const submitLogo = async () => {
    await updateOption('Logo', inputs.Logo);
  };

  const submitAbout = async () => {
    await updateOption('About', inputs.About);
  };

  const submitOption = async (key) => {
    await updateOption(key, inputs[key]);
  };



  return (
    <>
      <Stack spacing={2}>
        <SubCard title={t('setting_index.otherSettings.generalSettings.title')}>
          <Grid container spacing={{ xs: 3, sm: 2, md: 4 }}>
            <Grid xs={12}>
              <FormControl fullWidth>
                <TextField
                  multiline
                  maxRows={15}
                  id="Notice"
                  label={t('setting_index.otherSettings.generalSettings.noticeLabel')}
                  value={inputs.Notice}
                  name="Notice"
                  onChange={handleInputChange}
                  minRows={10}
                  placeholder={t('setting_index.otherSettings.generalSettings.noticePlaceholder')}
                />
              </FormControl>
            </Grid>
            <Grid xs={12}>
              <Button variant="contained" onClick={submitNotice}>
                {t('setting_index.otherSettings.generalSettings.saveNotice')}
              </Button>
            </Grid>
          </Grid>
        </SubCard>
        <SubCard title={t('setting_index.otherSettings.customSettings.title')}>
          <Grid container spacing={{ xs: 3, sm: 2, md: 4 }}>
            <Grid xs={12}>
              <FormControl fullWidth>
                <InputLabel htmlFor="SystemName">{t('setting_index.otherSettings.customSettings.systemNameLabel')}</InputLabel>
                <OutlinedInput
                  id="SystemName"
                  name="SystemName"
                  value={inputs.SystemName || ''}
                  onChange={handleInputChange}
                  label={t('setting_index.otherSettings.customSettings.systemNameLabel')}
                  placeholder={t('setting_index.otherSettings.customSettings.systemNamePlaceholder')}
                  disabled={loading}
                />
              </FormControl>
            </Grid>
            <Grid xs={12}>
              <Button variant="contained" onClick={submitSystemName}>
                {t('setting_index.otherSettings.customSettings.setSystemName')}
              </Button>
            </Grid>
            <Grid xs={12}>
              <FormControl fullWidth>
                <InputLabel htmlFor="Logo">{t('setting_index.otherSettings.customSettings.logoLabel')}</InputLabel>
                <OutlinedInput
                  id="Logo"
                  name="Logo"
                  value={inputs.Logo || ''}
                  onChange={handleInputChange}
                  label={t('setting_index.otherSettings.customSettings.logoLabel')}
                  placeholder={t('setting_index.otherSettings.customSettings.logoPlaceholder')}
                  disabled={loading}
                />
              </FormControl>
            </Grid>
            <Grid xs={12}>
              <Button variant="contained" onClick={submitLogo}>
                {t('setting_index.otherSettings.customSettings.setLogo')}
              </Button>
            </Grid>
            <Grid xs={12}>
              <FormControl fullWidth>
                <TextField
                  multiline
                  maxRows={15}
                  id="HomePageContent"
                  label={t('setting_index.otherSettings.customSettings.homePageContentLabel')}
                  value={inputs.HomePageContent}
                  name="HomePageContent"
                  onChange={handleInputChange}
                  minRows={10}
                  placeholder={t('setting_index.otherSettings.customSettings.homePageContentPlaceholder')}
                />
              </FormControl>
            </Grid>
            <Grid xs={12}>
              <Button variant="contained" onClick={() => submitOption('HomePageContent')}>
                {t('setting_index.otherSettings.customSettings.saveHomePageContent')}
              </Button>
            </Grid>
            <Grid xs={12}>
              <FormControl fullWidth>
                <TextField
                  multiline
                  maxRows={15}
                  id="About"
                  label={t('setting_index.otherSettings.customSettings.aboutLabel')}
                  value={inputs.About}
                  name="About"
                  onChange={handleInputChange}
                  minRows={10}
                  placeholder={t('setting_index.otherSettings.customSettings.aboutPlaceholder')}
                />
              </FormControl>
            </Grid>
            <Grid xs={12}>
              <Button variant="contained" onClick={submitAbout}>
                {t('setting_index.otherSettings.customSettings.saveAbout')}
              </Button>
            </Grid>
            <Grid xs={12}>
              <FormControl fullWidth>
                <TextField
                  multiline
                  maxRows={15}
                  id="Footer"
                  label={t('setting_index.otherSettings.customSettings.footerLabel')}
                  value={inputs.Footer}
                  name="Footer"
                  onChange={handleInputChange}
                  minRows={10}
                  placeholder={t('setting_index.otherSettings.customSettings.footerPlaceholder')}
                />
              </FormControl>
            </Grid>
            <Grid xs={12}>
              <Button variant="contained" onClick={submitFooter}>
                {t('setting_index.otherSettings.customSettings.setFooter')}
              </Button>
            </Grid>
          </Grid>
        </SubCard>
      </Stack>
    </>
  );
};

export default OtherSetting;