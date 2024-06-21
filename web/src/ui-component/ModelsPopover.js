import PropTypes from 'prop-types';
import { styled } from '@mui/material/styles';
import { useState } from 'react';
// import { forwardRef } from 'react';
// import { useTheme } from '@mui/material/styles';
import { copy } from 'utils/common';
import { Popover, Stack } from '@mui/material';
import Label from 'ui-component/Label';

export default function ModelsPopover({ model }) {
  const modelList = model.split(',');
  const [openModel, setOpenModel] = useState(null);
  const handleOpenModel = (event) => {
    setOpenModel(event.currentTarget);
  };

  const handleCloseModel = () => {
    setOpenModel(null);
  };

  return (
    <>
      <Label onClick={handleOpenModel} color="primary">
        查看全部模型
      </Label>
      <StyledModel
        open={!!openModel}
        anchorEl={openModel}
        onClose={handleCloseModel}
        anchorOrigin={{ vertical: 'top', horizontal: 'left' }}
        transformOrigin={{ vertical: 'top', horizontal: 'right' }}
      >
        <Stack direction="column" justifyContent="center" alignItems="flex-start" spacing={1} margin={1}>
          {modelList.map((modelName, index) => {
            return (
              <Label
                variant="outlined"
                color="primary"
                onClick={() => {
                  copy(model, '模型名称');
                }}
                key={index}
              >
                {modelName}
              </Label>
            );
          })}
        </Stack>
      </StyledModel>
    </>
  );
}

ModelsPopover.propTypes = {
  model: PropTypes.string,
  text: PropTypes.string
};

const StyledModel = styled(Popover)(({ theme }) => {
  return {
    padding: theme.spacing(10, 10),
    minWidth: 140
  };
});
