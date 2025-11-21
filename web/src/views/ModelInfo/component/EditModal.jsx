import PropTypes from 'prop-types';
import * as Yup from 'yup';
import { Formik } from 'formik';
import { useTheme, alpha } from '@mui/material/styles';
import { useState, useEffect } from 'react';
import {
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Button,
    Divider,
    FormControl,
    InputLabel,
    OutlinedInput,
    FormHelperText,
    Grid,
    Autocomplete,
    TextField,
    Chip
} from '@mui/material';

import { showSuccess, showError, trims } from 'utils/common';
import { API } from 'utils/api';
import { MODALITY_OPTIONS } from 'constants/Modality';

const validationSchema = Yup.object().shape({
    model: Yup.string().required('模型标识不能为空'),
    name: Yup.string().required('模型名称不能为空'),
    context_length: Yup.number().required('上下文长度不能为空'),
    max_tokens: Yup.number().required('最大Token不能为空')
});

const originInputs = {
    model: '',
    name: '',
    description: '',
    context_length: 128000,
    max_tokens: 4096,
    input_modalities: '["text"]',
    output_modalities: '["text"]',
    tags: '[]'
};


const EditModal = ({ open, editId, onCancel, onOk, existingModels = [] }) => {
    const theme = useTheme();
    const [inputs, setInputs] = useState(originInputs);
    const [modelOptions, setModelOptions] = useState([]);
    const [originalModel, setOriginalModel] = useState('');

    const submit = async (values, { setErrors, setStatus, setSubmitting }) => {
        setSubmitting(true);

        let res;
        values = trims(values);
        values.context_length = parseInt(values.context_length);
        values.max_tokens = parseInt(values.max_tokens);

        if (existingModels.includes(values.model) && values.model !== originalModel) {
            showError('模型标识已存在');
            setSubmitting(false);
            return;
        }

        try {
            if (editId) {
                res = await API.put(`/api/model_info/`, { ...values, id: parseInt(editId) });
            } else {
                res = await API.post(`/api/model_info/`, values);
            }
            const { success, message } = res.data;
            if (success) {
                showSuccess('保存成功');
                setSubmitting(false);
                setStatus({ success: true });
                onOk(true);
            } else {
                showError(message);
                setErrors({ submit: message });
            }
        } catch (error) {
            return;
        }
    };

    const loadModelInfo = async () => {
        try {
            let res = await API.get(`/api/model_info/${editId}`);
            const { success, message, data } = res.data;
            if (success) {
                // Ensure modalities are valid JSON strings or default to empty array string
                if (!data.input_modalities) data.input_modalities = '[]';
                if (!data.output_modalities) data.output_modalities = '[]';
                setInputs(data);
                setOriginalModel(data.model);
            } else {
                showError(message);
            }
        } catch (error) {
            return;
        }
    };

    const fetchModelList = async () => {
        try {
            const res = await API.get('/api/prices/model_list');
            const { success, data } = res.data;
            if (success) {
                setModelOptions(data);
            }
        } catch (error) {
            console.error('Failed to fetch model list:', error);
        }
    };

    useEffect(() => {
        fetchModelList();
    }, []);

    useEffect(() => {
        if (editId) {
            loadModelInfo().then();
        } else {
            setInputs(originInputs);
            setOriginalModel('');
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [editId]);

    const safeJsonParse = (jsonString) => {
        try {
            const parsed = JSON.parse(jsonString);
            return Array.isArray(parsed) ? parsed : [];
        } catch (e) {
            return [];
        }
    };

    return (
        <Dialog open={open} onClose={onCancel} fullWidth maxWidth={'md'}>
            <DialogTitle sx={{ margin: '0px', fontWeight: 700, lineHeight: '1.55556', padding: '24px', fontSize: '1.125rem' }}>
                {editId ? '编辑模型信息' : '新建模型信息'}
            </DialogTitle>
            <Divider />
            <DialogContent>
                <Formik initialValues={inputs} enableReinitialize validationSchema={validationSchema} onSubmit={submit}>
                    {({ errors, handleBlur, handleChange, handleSubmit, touched, values, isSubmitting, setFieldValue }) => (
                        <form noValidate onSubmit={handleSubmit}>
                            <Grid container spacing={2}>
                                <Grid item xs={12} sm={6}>
                                    <FormControl fullWidth error={Boolean(touched.model && errors.model)} sx={{ ...theme.typography.otherInput }}>
                                        <Autocomplete
                                            freeSolo
                                            id="model-label"
                                            options={modelOptions.filter((option) => !existingModels.includes(option) || option === values.model)}
                                            value={values.model}
                                            onChange={(e, value) => {
                                                setFieldValue('model', value);
                                                if (value && !values.name) {
                                                    setFieldValue('name', value);
                                                }
                                            }}
                                            onInputChange={(e, value) => {
                                                setFieldValue('model', value);
                                            }}
                                            renderInput={(params) => (
                                                <TextField
                                                    {...params}
                                                    label="模型标识"
                                                    error={Boolean(touched.model && errors.model)}
                                                    helperText={touched.model && errors.model}
                                                />
                                            )}
                                        />
                                    </FormControl>
                                </Grid>
                                <Grid item xs={12} sm={6}>
                                    <FormControl fullWidth error={Boolean(touched.name && errors.name)} sx={{ ...theme.typography.otherInput }}>
                                        <InputLabel htmlFor="name-label">模型名称</InputLabel>
                                        <OutlinedInput
                                            id="name-label"
                                            label="模型名称"
                                            type="text"
                                            value={values.name}
                                            name="name"
                                            onBlur={handleBlur}
                                            onChange={handleChange}
                                            inputProps={{ autoComplete: 'name' }}
                                        />
                                        {touched.name && errors.name && (
                                            <FormHelperText error id="helper-tex-name-label">
                                                {errors.name}
                                            </FormHelperText>
                                        )}
                                    </FormControl>
                                </Grid>
                                <Grid item xs={12}>
                                    <FormControl fullWidth error={Boolean(touched.description && errors.description)} sx={{ ...theme.typography.otherInput }}>
                                        <InputLabel htmlFor="description-label">描述</InputLabel>
                                        <OutlinedInput
                                            id="description-label"
                                            label="描述"
                                            type="text"
                                            value={values.description}
                                            name="description"
                                            onBlur={handleBlur}
                                            onChange={handleChange}
                                            multiline
                                            rows={3}
                                        />
                                    </FormControl>
                                </Grid>
                                <Grid item xs={12} sm={6}>
                                    <FormControl fullWidth error={Boolean(touched.context_length && errors.context_length)} sx={{ ...theme.typography.otherInput }}>
                                        <InputLabel htmlFor="context_length-label">上下文长度</InputLabel>
                                        <OutlinedInput
                                            id="context_length-label"
                                            label="上下文长度"
                                            type="number"
                                            value={values.context_length}
                                            name="context_length"
                                            onBlur={handleBlur}
                                            onChange={handleChange}
                                        />
                                        {touched.context_length && errors.context_length && (
                                            <FormHelperText error id="helper-tex-context_length-label">
                                                {errors.context_length}
                                            </FormHelperText>
                                        )}
                                    </FormControl>
                                </Grid>
                                <Grid item xs={12} sm={6}>
                                    <FormControl fullWidth error={Boolean(touched.max_tokens && errors.max_tokens)} sx={{ ...theme.typography.otherInput }}>
                                        <InputLabel htmlFor="max_tokens-label">最大Token</InputLabel>
                                        <OutlinedInput
                                            id="max_tokens-label"
                                            label="最大Token"
                                            type="number"
                                            value={values.max_tokens}
                                            name="max_tokens"
                                            onBlur={handleBlur}
                                            onChange={handleChange}
                                        />
                                        {touched.max_tokens && errors.max_tokens && (
                                            <FormHelperText error id="helper-tex-max_tokens-label">
                                                {errors.max_tokens}
                                            </FormHelperText>
                                        )}
                                    </FormControl>
                                </Grid>
                                <Grid item xs={12}>
                                    <FormControl fullWidth sx={{ ...theme.typography.otherInput }}>
                                        <Autocomplete
                                            multiple
                                            freeSolo
                                            id="input_modalities-label"
                                            options={Object.values(MODALITY_OPTIONS).map((option) => option.value)}
                                            value={safeJsonParse(values.input_modalities)}
                                            onChange={(e, value) => {
                                                setFieldValue('input_modalities', JSON.stringify(value));
                                            }}
                                            renderTags={(value, getTagProps) =>
                                                value.map((option, index) => {
                                                    const color = MODALITY_OPTIONS[option]?.color || 'default';
                                                    const { key, ...tagProps } = getTagProps({ index });
                                                    return (
                                                        <Chip
                                                            key={key}
                                                            {...tagProps}
                                                            label={MODALITY_OPTIONS[option]?.text || option}
                                                            size="small"
                                                            sx={{
                                                                borderRadius: '6px',
                                                                height: '24px',
                                                                mr: 0.5,
                                                                backgroundColor:
                                                                    color === 'default'
                                                                        ? alpha(theme.palette.grey[500], 0.16)
                                                                        : alpha(theme.palette[color].main, 0.16),
                                                                color:
                                                                    color === 'default'
                                                                        ? theme.palette.text.secondary
                                                                        : theme.palette[color].dark,
                                                                '& .MuiChip-deleteIcon': {
                                                                    color:
                                                                        color === 'default'
                                                                            ? theme.palette.text.secondary
                                                                            : theme.palette[color].dark,
                                                                    '&:hover': {
                                                                        color:
                                                                            color === 'default'
                                                                                ? theme.palette.text.primary
                                                                                : theme.palette[color].main
                                                                    }
                                                                }
                                                            }}
                                                        />
                                                    );
                                                })
                                            }
                                            renderInput={(params) => (
                                                <TextField
                                                    {...params}
                                                    label="输入模态"
                                                    placeholder="选择或输入"
                                                />
                                            )}
                                            renderOption={(props, option) => {
                                                const color = MODALITY_OPTIONS[option]?.color || 'default';
                                                const { key, ...otherProps } = props;
                                                return (
                                                    <li key={key} {...otherProps}>
                                                        <Chip
                                                            label={MODALITY_OPTIONS[option]?.text || option}
                                                            size="small"
                                                            sx={{
                                                                borderRadius: '6px',
                                                                height: '24px',
                                                                backgroundColor:
                                                                    color === 'default'
                                                                        ? alpha(theme.palette.grey[500], 0.16)
                                                                        : alpha(theme.palette[color].main, 0.16),
                                                                color:
                                                                    color === 'default'
                                                                        ? theme.palette.text.secondary
                                                                        : theme.palette[color].dark
                                                            }}
                                                        />
                                                    </li>
                                                );
                                            }}
                                        />
                                    </FormControl>
                                </Grid>
                                <Grid item xs={12}>
                                    <FormControl fullWidth sx={{ ...theme.typography.otherInput }}>
                                        <Autocomplete
                                            multiple
                                            freeSolo
                                            id="output_modalities-label"
                                            options={Object.values(MODALITY_OPTIONS).map((option) => option.value)}
                                            value={safeJsonParse(values.output_modalities)}
                                            onChange={(e, value) => {
                                                setFieldValue('output_modalities', JSON.stringify(value));
                                            }}
                                            renderTags={(value, getTagProps) =>
                                                value.map((option, index) => {
                                                    const color = MODALITY_OPTIONS[option]?.color || 'default';
                                                    const { key, ...tagProps } = getTagProps({ index });
                                                    return (
                                                        <Chip
                                                            key={key}
                                                            {...tagProps}
                                                            label={MODALITY_OPTIONS[option]?.text || option}
                                                            size="small"
                                                            sx={{
                                                                borderRadius: '6px',
                                                                height: '24px',
                                                                mr: 0.5,
                                                                backgroundColor:
                                                                    color === 'default'
                                                                        ? alpha(theme.palette.grey[500], 0.16)
                                                                        : alpha(theme.palette[color].main, 0.16),
                                                                color:
                                                                    color === 'default'
                                                                        ? theme.palette.text.secondary
                                                                        : theme.palette[color].dark,
                                                                '& .MuiChip-deleteIcon': {
                                                                    color:
                                                                        color === 'default'
                                                                            ? theme.palette.text.secondary
                                                                            : theme.palette[color].dark,
                                                                    '&:hover': {
                                                                        color:
                                                                            color === 'default'
                                                                                ? theme.palette.text.primary
                                                                                : theme.palette[color].main
                                                                    }
                                                                }
                                                            }}
                                                        />
                                                    );
                                                })
                                            }
                                            renderInput={(params) => (
                                                <TextField
                                                    {...params}
                                                    label="输出模态"
                                                    placeholder="选择或输入"
                                                />
                                            )}
                                            renderOption={(props, option) => {
                                                const color = MODALITY_OPTIONS[option]?.color || 'default';
                                                const { key, ...otherProps } = props;
                                                return (
                                                    <li key={key} {...otherProps}>
                                                        <Chip
                                                            label={MODALITY_OPTIONS[option]?.text || option}
                                                            size="small"
                                                            sx={{
                                                                borderRadius: '6px',
                                                                height: '24px',
                                                                backgroundColor:
                                                                    color === 'default'
                                                                        ? alpha(theme.palette.grey[500], 0.16)
                                                                        : alpha(theme.palette[color].main, 0.16),
                                                                color:
                                                                    color === 'default'
                                                                        ? theme.palette.text.secondary
                                                                        : theme.palette[color].dark
                                                            }}
                                                        />
                                                    </li>
                                                );
                                            }}
                                        />
                                    </FormControl>
                                </Grid>
                                <Grid item xs={12}>
                                    <FormControl fullWidth sx={{ ...theme.typography.otherInput }}>
                                        <Autocomplete
                                            multiple
                                            freeSolo
                                            id="tags-label"
                                            options={[]}
                                            value={safeJsonParse(values.tags)}
                                            onChange={(e, value) => {
                                                setFieldValue('tags', JSON.stringify(value));
                                            }}
                                            renderTags={(value, getTagProps) =>
                                                value.map((option, index) => {
                                                    const { key, ...tagProps } = getTagProps({ index });
                                                    return (
                                                        <Chip
                                                            key={key}
                                                            variant="outlined"
                                                            label={option}
                                                            {...tagProps}
                                                            sx={{
                                                                borderRadius: '4px',
                                                                height: '24px',
                                                                '& .MuiChip-deleteIcon': {
                                                                    color: theme.palette.grey[500],
                                                                    '&:hover': {
                                                                        color: theme.palette.grey[700]
                                                                    }
                                                                }
                                                            }}
                                                        />
                                                    );
                                                })
                                            }
                                            renderInput={(params) => (
                                                <TextField
                                                    {...params}
                                                    label="标签"
                                                    placeholder="输入标签,回车键确认"
                                                />
                                            )}
                                        />
                                    </FormControl>
                                </Grid>
                            </Grid>

                            <DialogActions>
                                <Button onClick={onCancel}>取消</Button>
                                <Button disableElevation disabled={isSubmitting} type="submit" variant="contained" color="primary">
                                    提交
                                </Button>
                            </DialogActions>
                        </form>
                    )}
                </Formik>
            </DialogContent>
        </Dialog>
    );
};

export default EditModal;

EditModal.propTypes = {
    open: PropTypes.bool,
    editId: PropTypes.number,
    onCancel: PropTypes.func,
    onOk: PropTypes.func,
    existingModels: PropTypes.array
};
