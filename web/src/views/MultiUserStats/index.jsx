import { useState } from 'react';
import { showError, showSuccess, calculateQuota, thousandsSeparator } from 'utils/common';
import ReactApexChart from 'react-apexcharts';

import LinearProgress from '@mui/material/LinearProgress';
import TextField from '@mui/material/TextField';
import {
    Button,
    Card,
    Box,
    Stack,
    Typography,
    Grid,
    Paper,
    useTheme,
    alpha
} from '@mui/material';
import { API } from 'utils/api';
import { Icon } from '@iconify/react';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import dayjs from 'dayjs';
import MainCard from 'ui-component/cards/MainCard';

export default function MultiUserStats() {
    const theme = useTheme();
    const [usernames, setUsernames] = useState('');
    const [startDate, setStartDate] = useState(dayjs().subtract(30, 'day'));
    const [endDate, setEndDate] = useState(dayjs());
    const [searching, setSearching] = useState(false);
    const [statistics, setStatistics] = useState([]);
    const [modelUsage, setModelUsage] = useState([]);

    const handleSearch = async () => {
        if (!usernames.trim()) {
            showError('请输入用户名');
            return;
        }

        setSearching(true);
        try {
            const res = await API.get('/api/analytics/multi_user_stats', {
                params: {
                    usernames: usernames.trim(),
                    start_time: startDate.format('YYYY-MM-DD'),
                    end_time: endDate.format('YYYY-MM-DD')
                }
            });
            const { success, message, data, model_usage } = res.data;
            if (success) {
                setStatistics(data || []);
                setModelUsage(model_usage || []);
                if (data.length === 0) {
                    showSuccess('查询成功,但没有找到数据');
                } else {
                    showSuccess(`查询成功,找到 ${data.length} 个用户的数据`);
                }
            } else {
                showError(message);
            }
        } catch (error) {
            console.error(error);
            showError('查询失败: ' + (error.response?.data?.message || error.message));
        }
        setSearching(false);
    };

    const handleExportCSV = async () => {
        if (!usernames.trim()) {
            showError('请输入用户名');
            return;
        }

        setSearching(true);
        try {
            const res = await API.get('/api/analytics/multi_user_stats/export', {
                params: {
                    usernames: usernames.trim(),
                    start_time: startDate.format('YYYY-MM-DD'),
                    end_time: endDate.format('YYYY-MM-DD')
                },
                responseType: 'blob'
            });

            const url = window.URL.createObjectURL(new Blob([res.data]));
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', `multi_user_stats_${startDate.format('YYYY-MM-DD')}_${endDate.format('YYYY-MM-DD')}.csv`);
            document.body.appendChild(link);
            link.click();
            link.remove();
            window.URL.revokeObjectURL(url);

            showSuccess('CSV导出成功');
        } catch (error) {
            console.error(error);
            showError('导出失败: ' + (error.response?.data?.message || error.message));
        }
        setSearching(false);
    };

    // 准备用户额度消耗柱状图数据
    const quotaChartData = {
        options: {
            chart: {
                type: 'bar',
                fontFamily: theme.typography.fontFamily,
                toolbar: { show: false }
            },
            plotOptions: {
                bar: {
                    horizontal: false,
                    columnWidth: '55%',
                    borderRadius: 8
                }
            },
            dataLabels: { enabled: false },
            xaxis: {
                categories: statistics.map((s) => s.username),
                labels: { style: { colors: theme.palette.text.primary } }
            },
            yaxis: {
                title: { text: '额度消耗', style: { color: theme.palette.text.primary } },
                labels: {
                    style: { colors: theme.palette.text.primary },
                    formatter: (val) => '$' + calculateQuota(val, 2)
                }
            },
            fill: {
                type: 'gradient',
                gradient: {
                    shade: 'light',
                    type: 'vertical',
                    shadeIntensity: 0.25,
                    gradientToColors: undefined,
                    inverseColors: true,
                    opacityFrom: 0.85,
                    opacityTo: 0.85,
                    stops: [50, 0, 100]
                }
            },
            colors: [theme.palette.primary.main],
            tooltip: {
                theme: theme.palette.mode,
                y: {
                    formatter: (val) => '$' + calculateQuota(val, 6)
                }
            }
        },
        series: [
            {
                name: '额度消耗',
                data: statistics.map((s) => s.quota)
            }
        ]
    };

    // 准备模型使用次数饼图数据
    const generateColors = () => {
        const baseColors = [
            theme.palette.primary.main,
            theme.palette.secondary.main,
            theme.palette.success.main,
            theme.palette.warning.main,
            theme.palette.error.main,
            theme.palette.info.main,
            '#9c27b0',
            '#00bcd4',
            '#607d8b',
            '#ff9800'
        ];
        const allColors = [];
        baseColors.forEach((color) => {
            allColors.push(color);
            allColors.push(alpha(color, 0.7));
            allColors.push(alpha(color, 0.4));
        });
        return allColors;
    };

    const modelUsageChartData = {
        options: {
            chart: {
                type: 'donut',
                fontFamily: theme.typography.fontFamily
            },
            labels: modelUsage.map((m) => `${m.username} - ${m.model_name}`),
            colors: generateColors(),
            legend: {
                position: 'bottom',
                labels: { colors: theme.palette.text.primary }
            },
            plotOptions: {
                pie: {
                    donut: {
                        size: '60%',
                        labels: {
                            show: true,
                            total: {
                                show: true,
                                label: '总调用次数',
                                color: theme.palette.text.secondary,
                                formatter: (w) => w.globals.seriesTotals.reduce((a, b) => a + b, 0).toLocaleString()
                            }
                        }
                    }
                }
            },
            tooltip: {
                theme: theme.palette.mode,
                y: { formatter: (val) => val.toLocaleString() + ' 次' }
            }
        },
        series: modelUsage.map((m) => m.request_count)
    };

    return (
        <>
            <Stack direction="row" alignItems="center" justifyContent="space-between" mb={5}>
                <Stack direction="column" spacing={1}>
                    <Typography variant="h2">多用户令牌统计</Typography>
                    <Typography variant="subtitle1" color="text.secondary">
                        Multi-User Token Statistics
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                        查询多个用户的所有令牌使用情况统计数据
                    </Typography>
                </Stack>
            </Stack>

            <Card sx={{ mb: 3, p: 3 }}>
                <Stack spacing={3}>
                    <TextField
                        fullWidth
                        label="用户名 (多个用户名用逗号分隔)"
                        placeholder="例如: user1, user2, user3"
                        value={usernames}
                        onChange={(e) => setUsernames(e.target.value)}
                        helperText="输入一个或多个用户名,用逗号分隔"
                    />

                    <LocalizationProvider dateAdapter={AdapterDayjs}>
                        <Stack direction="row" spacing={2}>
                            <DatePicker
                                label="开始日期"
                                value={startDate}
                                onChange={(newValue) => setStartDate(newValue)}
                                format="YYYY-MM-DD"
                                slotProps={{ textField: { fullWidth: true } }}
                            />
                            <DatePicker
                                label="结束日期"
                                value={endDate}
                                onChange={(newValue) => setEndDate(newValue)}
                                format="YYYY-MM-DD"
                                slotProps={{ textField: { fullWidth: true } }}
                            />
                        </Stack>
                    </LocalizationProvider>

                    <Stack direction="row" spacing={2}>
                        <Button
                            variant="contained"
                            onClick={handleSearch}
                            disabled={searching}
                            startIcon={<Icon icon="solar:magnifer-bold-duotone" width={20} />}
                        >
                            查询统计
                        </Button>
                        <Button
                            variant="outlined"
                            onClick={handleExportCSV}
                            disabled={searching || statistics.length === 0}
                            startIcon={<Icon icon="solar:download-bold-duotone" width={20} />}
                        >
                            导出CSV
                        </Button>
                    </Stack>
                </Stack>
            </Card>

            {searching && <LinearProgress sx={{ mb: 2 }} />}

            {statistics.length > 0 && (
                <>
                    {/* 用户统计卡片 */}
                    <Grid container spacing={3} sx={{ mb: 3 }}>
                        {statistics.map((stat, index) => (
                            <Grid item xs={12} sm={6} md={4} key={index}>
                                <MainCard
                                    sx={{
                                        background: `linear-gradient(135deg, ${alpha(theme.palette.primary.main, 0.1)} 0%, ${alpha(
                                            theme.palette.primary.light,
                                            0.05
                                        )} 100%)`,
                                        borderRadius: '16px'
                                    }}
                                >
                                    <Stack spacing={2}>
                                        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                                            <Typography variant="h4" sx={{ fontWeight: 600 }}>
                                                {stat.username}
                                            </Typography>
                                            <Icon icon="solar:user-bold-duotone" width={32} color={theme.palette.primary.main} />
                                        </Box>

                                        <Box>
                                            <Typography variant="body2" color="text.secondary">
                                                总请求数
                                            </Typography>
                                            <Typography variant="h5" sx={{ fontWeight: 600, color: theme.palette.primary.main }}>
                                                {thousandsSeparator(stat.request_count)}
                                            </Typography>
                                        </Box>

                                        <Box>
                                            <Typography variant="body2" color="text.secondary">
                                                额度消耗
                                            </Typography>
                                            <Typography variant="h5" sx={{ fontWeight: 600, color: theme.palette.success.main }}>
                                                ${calculateQuota(stat.quota, 6)}
                                            </Typography>
                                        </Box>

                                        <Grid container spacing={1}>
                                            <Grid item xs={6}>
                                                <Typography variant="caption" color="text.secondary">
                                                    输入Tokens
                                                </Typography>
                                                <Typography variant="body2" sx={{ fontWeight: 500 }}>
                                                    {thousandsSeparator(stat.prompt_tokens)}
                                                </Typography>
                                            </Grid>
                                            <Grid item xs={6}>
                                                <Typography variant="caption" color="text.secondary">
                                                    输出Tokens
                                                </Typography>
                                                <Typography variant="body2" sx={{ fontWeight: 500 }}>
                                                    {thousandsSeparator(stat.completion_tokens)}
                                                </Typography>
                                            </Grid>
                                        </Grid>

                                        <Box>
                                            <Typography variant="caption" color="text.secondary">
                                                请求时长
                                            </Typography>
                                            <Typography variant="body2" sx={{ fontWeight: 500 }}>
                                                {(stat.request_time / 1000).toFixed(2)}s
                                            </Typography>
                                        </Box>
                                    </Stack>
                                </MainCard>
                            </Grid>
                        ))}
                    </Grid>

                    {/* 图表区域 */}
                    <Grid container spacing={3}>
                        {/* 用户额度消耗柱状图 */}
                        <Grid item xs={12} lg={6}>
                            <MainCard sx={{ borderRadius: '16px' }}>
                                <Typography variant="h3" sx={{ mb: 2, fontWeight: 600 }}>
                                    用户额度消耗对比
                                </Typography>
                                <Paper elevation={0} sx={{ bgcolor: 'transparent', p: 2 }}>
                                    <ReactApexChart options={quotaChartData.options} series={quotaChartData.series} type="bar" height={400} />
                                </Paper>
                            </MainCard>
                        </Grid>

                        {/* 模型使用次数饼图 */}
                        <Grid item xs={12} lg={6}>
                            <MainCard sx={{ borderRadius: '16px' }}>
                                <Typography variant="h3" sx={{ mb: 2, fontWeight: 600 }}>
                                    不同用户模型调用分布
                                </Typography>
                                {modelUsage.length > 0 ? (
                                    <Paper elevation={0} sx={{ bgcolor: 'transparent', p: 2 }}>
                                        <ReactApexChart options={modelUsageChartData.options} series={modelUsageChartData.series} type="donut" height={400} />
                                    </Paper>
                                ) : (
                                    <Box
                                        sx={{
                                            height: 400,
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            bgcolor: alpha(theme.palette.primary.light, 0.05),
                                            borderRadius: '12px'
                                        }}
                                    >
                                        <Typography variant="h4" color="text.secondary">
                                            暂无数据
                                        </Typography>
                                    </Box>
                                )}
                            </MainCard>
                        </Grid>
                    </Grid>
                </>
            )}

            {!searching && statistics.length === 0 && (
                <Card sx={{ p: 6, textAlign: 'center' }}>
                    <Icon icon="solar:chart-2-bold-duotone" width={80} color={theme.palette.text.disabled} />
                    <Typography variant="h4" color="text.secondary" sx={{ mt: 2 }}>
                        请输入查询条件并点击"查询统计"按钮
                    </Typography>
                </Card>
            )}
        </>
    );
}
