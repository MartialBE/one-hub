import PropTypes from 'prop-types';
import { useState, useEffect, useMemo, useCallback } from 'react';
import {
  GridRowModes,
  DataGrid,
  GridToolbarContainer,
  GridActionsCellItem,
  GridToolbarExport,
  GridToolbarColumnsButton,
  GridToolbarFilterButton,
  GridToolbarQuickFilter,
  GridToolbarDensitySelector
} from '@mui/x-data-grid';
import { zhCN } from '@mui/x-data-grid/locales';
import { Box, Button, Dialog, DialogActions, DialogContent, DialogTitle } from '@mui/material';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/DeleteOutlined';
import SaveIcon from '@mui/icons-material/Save';
import CancelIcon from '@mui/icons-material/Close';
import { showError, showSuccess, trims } from 'utils/common';
import { API } from 'utils/api';
import { ValueFormatter, priceType } from './component/util';
import { useTranslation } from 'react-i18next';

function validation(t, row, rows) {
  if (row.model === '') {
    return t('pricing_edit.requiredModelName');
  }

  // 判断 type 是否是 等于 tokens || times
  if (row.type !== 'tokens' && row.type !== 'times') {
    return t('pricing_edit.typeCheck');
  }

  if (row.channel_type <= 0) {
    return t('pricing_edit.channelTypeErr2');
  }

  // 判断 model是否是唯一值
  if (rows.filter((r) => r.model === row.model && (row.isNew || r.id !== row.id)).length > 0) {
    return t('pricing_edit.modelNameRe');
  }

  if (row.input === '' || row.input < 0) {
    return t('pricing_edit.inputVal');
  }
  if (row.output === '' || row.output < 0) {
    return t('pricing_edit.outputVal');
  }
  return false;
}

function EditToolbar() {
  return (
    <GridToolbarContainer>
      <GridToolbarColumnsButton />
      <GridToolbarFilterButton />
      <GridToolbarDensitySelector />
      <GridToolbarExport printOptions={{ disableToolbarButton: true }} csvOptions={{ utf8WithBom: true }} />
      <GridToolbarQuickFilter />
    </GridToolbarContainer>
  );
}

EditToolbar.propTypes = {
  setRows: PropTypes.func.isRequired,
  setRowModesModel: PropTypes.func.isRequired
};

const Single = ({ ownedby, prices, reloadData }) => {
  const { t } = useTranslation();
  const [rows, setRows] = useState([]);
  const [rowModesModel, setRowModesModel] = useState({});
  const [selectedRow, setSelectedRow] = useState(null);

  const addOrUpdatePirces = useCallback(
    async (newRow, oldRow, reject, resolve) => {
      try {
        let res;
        newRow = trims(newRow);
        if (oldRow.model == '') {
          res = await API.post('/api/prices/single', newRow);
        } else {
          let modelEncode = encodeURIComponent(oldRow.model);
          res = await API.put('/api/prices/single/' + modelEncode, newRow);
        }
        const { success, message } = res.data;
        if (success) {
          showSuccess(t('pricing_edit.saveOk'));
          resolve(newRow);
          reloadData();
        } else {
          reject(new Error(message));
        }
      } catch (error) {
        reject(new Error(error));
      }
    },
    [reloadData]
  );

  const handleEditClick = useCallback(
    (id) => () => {
      setRowModesModel({ ...rowModesModel, [id]: { mode: GridRowModes.Edit } });
    },
    [rowModesModel]
  );

  const handleSaveClick = useCallback(
    (id) => () => {
      setRowModesModel({ ...rowModesModel, [id]: { mode: GridRowModes.View } });
    },
    [rowModesModel]
  );

  const handleDeleteClick = useCallback(
    (id) => () => {
      setSelectedRow(rows.find((row) => row.id === id));
    },
    [rows]
  );

  const handleClose = () => {
    setSelectedRow(null);
  };

  const handleConfirmDelete = async () => {
    // 执行删除操作
    await deletePirces(selectedRow.model);
    setSelectedRow(null);
  };

  const handleCancelClick = useCallback(
    (id) => () => {
      setRowModesModel({
        ...rowModesModel,
        [id]: { mode: GridRowModes.View, ignoreModifications: true }
      });

      const editedRow = rows.find((row) => row.id === id);
      if (editedRow.isNew) {
        setRows(rows.filter((row) => row.id !== id));
      }
    },
    [rowModesModel, rows]
  );

  const processRowUpdate = useCallback(
    (newRow, oldRows) =>
      new Promise((resolve, reject) => {
        if (
          !newRow.isNew &&
          newRow.model === oldRows.model &&
          newRow.input === oldRows.input &&
          newRow.output === oldRows.output &&
          newRow.type === oldRows.type &&
          newRow.channel_type === oldRows.channel_type
        ) {
          return resolve(oldRows);
        }
        const updatedRow = { ...newRow, isNew: false };
        const error = validation(t, updatedRow, rows);
        if (error) {
          return reject(new Error(error));
        }

        const response = addOrUpdatePirces(updatedRow, oldRows, reject, resolve);
        return response;
      }),
    [rows, addOrUpdatePirces]
  );

  const handleProcessRowUpdateError = useCallback((error) => {
    showError(error.message);
  }, []);

  const handleRowModesModelChange = (newRowModesModel) => {
    setRowModesModel(newRowModesModel);
  };

  const modelRatioColumns = useMemo(
    () => [
      {
        field: 'model',
        sortable: true,
        headerName: t('modelpricePage.model'),
        minWidth: 220,
        flex: 1,
        editable: true
      },
      {
        field: 'type',
        sortable: true,
        headerName: t('paymentGatewayPage.tableHeaders.type'),
        flex: 0.5,
        minWidth: 100,
        type: 'singleSelect',
        valueOptions: priceType,
        editable: true
      },
      {
        field: 'channel_type',
        sortable: true,
        headerName: t('modelpricePage.channelType'),
        flex: 0.5,
        minWidth: 100,
        type: 'singleSelect',
        valueOptions: ownedby,
        editable: true
      },
      {
        field: 'input',
        sortable: false,
        headerName: t('modelpricePage.inputMultiplier'),
        flex: 0.8,
        minWidth: 150,
        type: 'number',
        editable: true,
        valueFormatter: (params) => ValueFormatter(params.value)
      },
      {
        field: 'output',
        sortable: false,
        headerName: t('modelpricePage.outputMultiplier'),
        flex: 0.8,
        minWidth: 150,
        type: 'number',
        editable: true,
        valueFormatter: (params) => ValueFormatter(params.value)
      },
      {
        field: 'actions',
        type: 'actions',
        headerName: t('paymentGatewayPage.tableHeaders.action'),
        flex: 0.5,
        minWidth: 100,
        // width: 100,
        cellClassName: 'actions',
        hideable: false,
        disableExport: true,
        getActions: ({ id }) => {
          const isInEditMode = rowModesModel[id]?.mode === GridRowModes.Edit;

          if (isInEditMode) {
            return [
              <GridActionsCellItem
                icon={<SaveIcon />}
                key={'Save-' + id}
                label="Save"
                sx={{
                  color: 'primary.main'
                }}
                onClick={handleSaveClick(id)}
              />,
              <GridActionsCellItem
                icon={<CancelIcon />}
                key={'Cancel-' + id}
                label="Cancel"
                className="textPrimary"
                onClick={handleCancelClick(id)}
                color="inherit"
              />
            ];
          }

          return [
            <GridActionsCellItem
              key={'Edit-' + id}
              icon={<EditIcon />}
              label="Edit"
              className="textPrimary"
              onClick={handleEditClick(id)}
              color="inherit"
            />,
            <GridActionsCellItem
              key={'Delete-' + id}
              icon={<DeleteIcon />}
              label="Delete"
              onClick={handleDeleteClick(id)}
              color="inherit"
            />
          ];
        }
      }
    ],
    [handleCancelClick, handleDeleteClick, handleEditClick, handleSaveClick, rowModesModel, ownedby]
  );

  const deletePirces = async (modelName) => {
    try {
      let modelEncode = encodeURIComponent(modelName);
      const res = await API.delete('/api/prices/single/' + modelEncode);
      const { success, message } = res.data;
      if (success) {
        showSuccess(t('pricing_edit.saveOk'));
        await reloadData();
      } else {
        showError(message);
      }
    } catch (error) {
      console.error(error);
    }
  };

  useEffect(() => {
    let modelRatioList = [];
    let id = 0;
    for (let key in prices) {
      modelRatioList.push({ id: id++, ...prices[key] });
    }
    setRows(modelRatioList);
  }, [prices]);

  return (
    <Box
      sx={{
        width: '100%',
        '& .actions': {
          color: 'text.secondary'
        },
        '& .textPrimary': {
          color: 'text.primary'
        }
      }}
    >
      <DataGrid
        autosizeOnMount
        rows={rows}
        columns={modelRatioColumns}
        editMode="row"
        initialState={{ pagination: { paginationModel: { pageSize: 20 } } }}
        pageSizeOptions={[20, 30, 50, 100]}
        disableRowSelectionOnClick
        rowModesModel={rowModesModel}
        onRowModesModelChange={handleRowModesModelChange}
        processRowUpdate={processRowUpdate}
        onProcessRowUpdateError={handleProcessRowUpdateError}
        localeText={zhCN.components.MuiDataGrid.defaultProps.localeText}
        // onCellDoubleClick={(params, event) => {
        //   event.defaultMuiPrevented = true;
        // }}
        onRowEditStop={(params, event) => {
          if (params.reason === 'rowFocusOut') {
            event.defaultMuiPrevented = true;
          }
        }}
        slots={{
          toolbar: EditToolbar
        }}
        slotProps={{
          toolbar: { setRows, setRowModesModel }
        }}
      />

      <Dialog
        maxWidth="xs"
        // TransitionProps={{ onEntered: handleEntered }}
        open={!!selectedRow}
      >
        <DialogTitle>{t('pricing_edit.delTip')}</DialogTitle>
        <DialogContent dividers>{t('pricing_edit.delInfoTip', { name: selectedRow?.model })}</DialogContent>
        <DialogActions>
          <Button onClick={handleClose}>{t('common.cancel')}</Button>
          <Button onClick={handleConfirmDelete}>{t('common.delete')}</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default Single;

Single.propTypes = {
  prices: PropTypes.array,
  ownedby: PropTypes.array,
  reloadData: PropTypes.func
};
