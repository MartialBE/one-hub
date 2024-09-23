import React, { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import {
  Box,
  Button,
  TextField,
  IconButton,
  List,
  ListItem,
  //   ListItemText,
  ListItemSecondaryAction
} from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import AddIcon from '@mui/icons-material/Add';
import { useTranslation } from 'react-i18next';

const ModelMappingInput = ({ value, onChange, disabled, error }) => {
  const { t } = useTranslation();
  const [mappings, setMappings] = useState([]);

  useEffect(() => {
    try {
      setMappings(value || [{ index: 0, key: '', value: '' }]);
    } catch (e) {
      setMappings([{ index: 0, key: '', value: '' }]);
    }
  }, [value]);

  const handleAdd = () => {
    const newIndex = mappings.length > 0 ? Math.max(...mappings.map((m) => m.index)) + 1 : 0;
    setMappings([...mappings, { index: newIndex, key: '', value: '' }]);
  };

  const handleDelete = (index) => {
    const newMappings = mappings.filter((mapping) => mapping.index !== index);
    setMappings(newMappings);
    updateParent(newMappings);
  };

  const handleChange = (index, field, newValue) => {
    const newMappings = mappings.map((mapping) => (mapping.index === index ? { ...mapping, [field]: newValue } : mapping));

    setMappings(newMappings);
    updateParent(newMappings);
  };

  const updateParent = (newMappings) => {
    onChange(newMappings);
  };

  return (
    <Box>
      <List>
        {mappings.map(({ index, key, value }) => (
          <ListItem key={index}>
            <TextField
              label={t('channel_edit.modelMappingKey')}
              value={key}
              onChange={(e) => handleChange(index, 'key', e.target.value)}
              disabled={disabled}
              error={error}
              sx={{ mr: 1 }}
            />
            <TextField
              label={t('channel_edit.modelMappingValue')}
              value={value}
              onChange={(e) => handleChange(index, 'value', e.target.value)}
              disabled={disabled}
              error={error}
              sx={{ mr: 1 }}
            />
            <ListItemSecondaryAction>
              <IconButton edge="end" aria-label="delete" onClick={() => handleDelete(index)} disabled={disabled}>
                <DeleteIcon />
              </IconButton>
            </ListItemSecondaryAction>
          </ListItem>
        ))}
      </List>
      <Button startIcon={<AddIcon />} onClick={handleAdd} disabled={disabled}>
        {t('channel_edit.addModelMapping')}
      </Button>
    </Box>
  );
};

ModelMappingInput.propTypes = {
  value: PropTypes.arrayOf(
    PropTypes.shape({
      index: PropTypes.number,
      key: PropTypes.string,
      value: PropTypes.string
    })
  ),
  onChange: PropTypes.func.isRequired,
  disabled: PropTypes.bool,
  error: PropTypes.bool
};

export default ModelMappingInput;
