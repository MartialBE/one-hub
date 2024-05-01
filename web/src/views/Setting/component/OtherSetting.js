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

const OtherSetting = () => {
  let [inputs, setInputs] = useState({
    Footer: '',
    Notice: '',
    About: '',
    SystemName: '',
    Logo: '',
    HomePageContent: ''
  });
  let [loading, setLoading] = useState(false);

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
        <SubCard title="通用设置">
          <Grid container spacing={{ xs: 3, sm: 2, md: 4 }}>
            <Grid xs={12}>
              <FormControl fullWidth>
                <TextField
                  multiline
                  maxRows={15}
                  id="Notice"
                  label="公告"
                  value={inputs.Notice}
                  name="Notice"
                  onChange={handleInputChange}
                  minRows={10}
                  placeholder="在此输入新的公告内容，支持 Markdown & HTML 代码"
                />
              </FormControl>
            </Grid>
            <Grid xs={12}>
              <Button variant="contained" onClick={submitNotice}>
                保存公告
              </Button>
            </Grid>
          </Grid>
        </SubCard>
        <SubCard title="个性化设置">
          <Grid container spacing={{ xs: 3, sm: 2, md: 4 }}>
            <Grid xs={12}>
              <FormControl fullWidth>
                <InputLabel htmlFor="SystemName">系统名称</InputLabel>
                <OutlinedInput
                  id="SystemName"
                  name="SystemName"
                  value={inputs.SystemName || ''}
                  onChange={handleInputChange}
                  label="系统名称"
                  placeholder="在此输入系统名称"
                  disabled={loading}
                />
              </FormControl>
            </Grid>
            <Grid xs={12}>
              <Button variant="contained" onClick={submitSystemName}>
                设置系统名称
              </Button>
            </Grid>
            <Grid xs={12}>
              <FormControl fullWidth>
                <InputLabel htmlFor="Logo">Logo 图片地址</InputLabel>
                <OutlinedInput
                  id="Logo"
                  name="Logo"
                  value={inputs.Logo || ''}
                  onChange={handleInputChange}
                  label="Logo 图片地址"
                  placeholder="在此输入Logo 图片地址"
                  disabled={loading}
                />
              </FormControl>
            </Grid>
            <Grid xs={12}>
              <Button variant="contained" onClick={submitLogo}>
                设置 Logo
              </Button>
            </Grid>
            <Grid xs={12}>
              <FormControl fullWidth>
                <TextField
                  multiline
                  maxRows={15}
                  id="HomePageContent"
                  label="首页内容"
                  value={inputs.HomePageContent}
                  name="HomePageContent"
                  onChange={handleInputChange}
                  minRows={10}
                  placeholder="在此输入首页内容，支持 Markdown & HTML 代码，设置后首页的状态信息将不再显示。如果输入的是一个链接，则会使用该链接作为 iframe 的 src 属性，这允许你设置任意网页作为首页。"
                />
              </FormControl>
            </Grid>
            <Grid xs={12}>
              <Button variant="contained" onClick={() => submitOption('HomePageContent')}>
                保存首页内容
              </Button>
            </Grid>
            <Grid xs={12}>
              <FormControl fullWidth>
                <TextField
                  multiline
                  maxRows={15}
                  id="About"
                  label="接口"
                  value={inputs.About}
                  name="About"
                  onChange={handleInputChange}
                  minRows={10}
                  placeholder="在此输入新的接口内容，支持 Markdown & HTML 代码。如果输入的是一个链接，则会使用该链接作为 iframe 的 src 属性，这允许你设置任意网页作为接口页面。"
                />
              </FormControl>
            </Grid>
            <Grid xs={12}>
              <Button variant="contained" onClick={submitAbout}>
                保存接口
              </Button>
            </Grid>
            <Grid xs={12}>
            </Grid>
            <Grid xs={12}>
              <FormControl fullWidth>
                <TextField
                  multiline
                  maxRows={15}
                  id="Footer"
                  label="页脚"
                  value={inputs.Footer}
                  name="Footer"
                  onChange={handleInputChange}
                  minRows={10}
                  placeholder="在此输入新的页脚，留空则使用默认页脚，支持 HTML 代码"
                />
              </FormControl>
            </Grid>
            <Grid xs={12}>
              <Button variant="contained" onClick={submitFooter}>
                设置页脚
              </Button>
            </Grid>
          </Grid>
        </SubCard>
      </Stack>
    </>
  );
};

export default OtherSetting;
