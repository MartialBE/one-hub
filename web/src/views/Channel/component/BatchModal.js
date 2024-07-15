import PropTypes from 'prop-types';
import { useState } from 'react';
import { Dialog, DialogTitle, DialogContent, DialogActions, Divider, Button, Tabs, Tab, Box } from '@mui/material';
import BatchAzureAPI from './BatchAzureAPI';
import BatchDelModel from './BatchDelModel';
import { useTranslation } from 'react-i18next';

function CustomTabPanel(props) {
  const { children, value, index, ...other } = props;

  return (
    <div role="tabpanel" hidden={value !== index} id={`setting-tabpanel-${index}`} aria-labelledby={`channel-tab-${index}`} {...other}>
      {value === index && <Box sx={{ p: 3 }}>{children}</Box>}
    </div>
  );
}

CustomTabPanel.propTypes = {
  children: PropTypes.node,
  index: PropTypes.number.isRequired,
  value: PropTypes.number.isRequired
};

function a11yProps(index) {
  return {
    id: `channel-tab-${index}`,
    'aria-controls': `channel-tabpanel-${index}`
  };
}

const BatchModal = ({ open, setOpen }) => {
  const { t } = useTranslation();
  const [value, setValue] = useState(0);
  const handleChange = (event, newValue) => {
    setValue(newValue);
  };

  return (
    <Dialog open={open} onClose={() => setOpen(!open)} fullWidth maxWidth={'md'}>
      <DialogTitle>
        <Box>
          <Tabs value={value} onChange={handleChange} aria-label="basic tabs channel">
            <Tab label={t('channel_index.AzureApiVersion')} {...a11yProps(0)} />
            <Tab label={t('channel_index.batchDelete')} {...a11yProps(1)} />
          </Tabs>
        </Box>
      </DialogTitle>
      <Divider />
      <DialogContent>
        <CustomTabPanel value={value} index={0}>
          <BatchAzureAPI />
        </CustomTabPanel>
        <CustomTabPanel value={value} index={1}>
          <BatchDelModel />
        </CustomTabPanel>
        <DialogActions>
          <Button onClick={() => setOpen(!open)}>{t('common.cancel')}</Button>
        </DialogActions>
      </DialogContent>
    </Dialog>
  );
};

export default BatchModal;

BatchModal.propTypes = {
  open: PropTypes.bool,
  setOpen: PropTypes.func
};
