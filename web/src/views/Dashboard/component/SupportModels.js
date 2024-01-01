import { useState, useEffect } from 'react';
import SubCard from 'ui-component/cards/SubCard';
// import { gridSpacing } from 'store/constant';
import { API } from 'utils/api';
import { showError, showSuccess } from 'utils/common';
import { Typography, Accordion, AccordionSummary, AccordionDetails, Box } from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import Label from 'ui-component/Label';

import Grid from '@mui/material/Grid';


const SupportModels = () => {
  const [modelList, setModelList] = useState([]);

  const fetchModels = async () => {
    try {
      let res = await API.get(`/api/user/models`);
      if (res === undefined) {
        return;
      }
      // 对 res.data.data 里面的 owned_by 进行分组
      let modelGroup = {};
      res.data.data.forEach((model) => {
        if (modelGroup[model.owned_by] === undefined) {
          modelGroup[model.owned_by] = [];
        }
        modelGroup[model.owned_by].push(model.id);
      });
      setModelList(modelGroup);
    } catch (error) {
      showError(error.message);
    }
  };

  useEffect(() => {
    fetchModels();
  }, []);

  return (
    <Accordion key="support_models" sx={{ borderRadius: '12px' }}>
      <AccordionSummary aria-controls="support_models" expandIcon={<ExpandMoreIcon />}>
        <Typography variant="subtitle1">当前可用模型</Typography>
      </AccordionSummary>
      <AccordionDetails>
        <Grid container spacing={1}>
          {Object.entries(modelList)
            .sort((a, b) => b[1].length - a[1].length)
            .map(([title, models]) => (
              <Grid item xs={12} sm={6} key={title}>
                <SubCard title={title === 'null' ? '其他模型' : title} >
                  <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: '10px' }}>
                    {models.sort().map((model) => (
                      <Label
                        variant="outlined"
                        color="primary"
                        key={model}
                        onClick={() => {
                          navigator.clipboard.writeText(model);
                          showSuccess('复制模型名称成功！');
                        }}
                      >
                        <Typography variant="body2" sx={{ color: 'inherit' }}>{model}</Typography>
                      </Label>
                    ))}
                  </Box>
                </SubCard>
              </Grid>
            ))}
        </Grid>
      </AccordionDetails>
    </Accordion>
  );
};

export default SupportModels;
