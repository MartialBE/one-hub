import PropTypes from 'prop-types';
import Label from 'ui-component/Label';
import Tooltip from '@mui/material/Tooltip';
import { timestamp2string } from 'utils/common';
import { useTranslation } from 'react-i18next';

const ResponseTimeLabel = ({ test_time, response_time, handle_action }) => {
  const { t } = useTranslation();
  let color = 'default';
  let time = response_time / 1000;
  time = time.toFixed(2) + t('res_time.second');

  if (response_time === 0) {
    color = 'default';
  } else if (response_time <= 1000) {
    color = 'success';
  } else if (response_time <= 3000) {
    color = 'primary';
  } else if (response_time <= 5000) {
    color = 'secondary';
  } else {
    color = 'error';
  }
  let title = (
    <>
      {t('res_time.testClick')}
      <br />
      {test_time != 0 ? t('res_time.lastTime') + timestamp2string(test_time) : t('res_time.noTest')}
    </>
  );

  return (
    <Tooltip title={title} placement="top" onClick={handle_action}>
      <Label color={color}> {response_time == 0 ? t('res_time.noTest') : time} </Label>
    </Tooltip>
  );
};

ResponseTimeLabel.propTypes = {
  test_time: PropTypes.number,
  response_time: PropTypes.number,
  handle_action: PropTypes.func
};

export default ResponseTimeLabel;
