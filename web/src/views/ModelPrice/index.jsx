import { useState, useEffect, useCallback, useMemo } from 'react';
import { useTranslation } from 'react-i18next';

import { Card, Stack, Typography } from '@mui/material';
import {
  DataGrid,
  GridToolbarContainer,
  GridToolbarColumnsButton,
  GridToolbarFilterButton,
  GridToolbarQuickFilter,
  GridToolbarDensitySelector
} from '@mui/x-data-grid';
import { zhCN } from '@mui/x-data-grid/locales';
import { API } from 'utils/api';
import { showError } from 'utils/common';
import { ValueFormatter, priceType } from 'views/Pricing/component/util';

// ----------------------------------------------------------------------
export default function ModelPrice() {
  const { t } = useTranslation();

  const [rows, setRows] = useState([]);
  const [userModelList, setUserModelList] = useState([]);
  const [prices, setPrices] = useState({});
  const [ownedby, setOwnedby] = useState([]);

  const fetchOwnedby = useCallback(async () => {
    try {
      const res = await API.get('/api/ownedby');
      const { success, message, data } = res.data;
      if (success) {
        let ownedbyList = [];
        for (let key in data) {
          ownedbyList.push({ value: parseInt(key), label: data[key] });
        }
        setOwnedby(ownedbyList);
      } else {
        showError(message);
      }
    } catch (error) {
      console.error(error);
    }
  }, []);

  const fetchPrices = useCallback(async () => {
    try {
      const res = await API.get('/api/prices');
      const { success, message, data } = res.data;
      if (success) {
        let pricesObj = {};
        data.forEach((price) => {
          if (pricesObj[price.model] === undefined) {
            pricesObj[price.model] = price;
          }
        });
        setPrices(pricesObj);
      } else {
        showError(message);
      }
    } catch (error) {
      console.error(error);
    }
  }, []);

  const fetchUserModelList = useCallback(async () => {
    try {
      const res = await API.get('/api/user/models');
      if (res === undefined) {
        setUserModelList([]);
        return;
      }
      setUserModelList(res.data.data);
    } catch (error) {
      console.error(error);
    }
  }, []);

  useEffect(() => {
    if (userModelList.length === 0 || Object.keys(prices).length === 0 || ownedby.length === 0) {
      return;
    }

    let newRows = [];
    userModelList.forEach((model, index) => {
      const price = prices[model.id];
      // const type_label = priceType.find((pt) => pt.value === price?.type);
      // const channel_label = ownedby.find((ob) => ob.value === price?.channel_type);
      newRows.push({
        id: index + 1,
        model: model.id,
        type: price?.type,
        channel_type: price?.channel_type,
        input: price?.input !== undefined && price?.input !== null ? price.input : 30,
        output: price?.output !== undefined && price?.output !== null ? price.output : 30
      });
    });
    console.log(newRows);
    setRows(newRows);
  }, [userModelList, ownedby, prices]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        await Promise.all([fetchOwnedby(), fetchUserModelList()]);
        fetchPrices();
      } catch (error) {
        console.error(error);
      }
    };

    fetchData();
  }, [fetchOwnedby, fetchUserModelList, fetchPrices]);

  const modelRatioColumns = useMemo(
    () => [
      {
        field: 'model',
        sortable: true,
        headerName: t('modelpricePage.model'),
        minWidth: 220,
        flex: 1
      },
      {
        field: 'type',
        sortable: true,
        headerName: t('modelpricePage.type'),
        flex: 0.5,
        minWidth: 100,
        type: 'singleSelect',
        valueOptions: priceType
      },
      {
        field: 'channel_type',
        sortable: true,
        headerName: t('modelpricePage.channelType'),
        flex: 0.5,
        minWidth: 100,
        type: 'singleSelect',
        valueOptions: ownedby
      },
      {
        field: 'input',
        sortable: true,
        headerName: t('modelpricePage.inputMultiplier'),
        flex: 0.8,
        minWidth: 150,
        type: 'number',
        valueFormatter: (params) => ValueFormatter(params.value)
      },
      {
        field: 'output',
        sortable: true,
        headerName: t('modelpricePage.outputMultiplier'),
        flex: 0.8,
        minWidth: 150,
        type: 'number',
        valueFormatter: (params) => ValueFormatter(params.value)
      }
    ],
    [ownedby, t]
  );

  function EditToolbar() {
    return (
      <GridToolbarContainer>
        <GridToolbarColumnsButton />
        <GridToolbarFilterButton />
        <GridToolbarDensitySelector />
        <GridToolbarQuickFilter />
      </GridToolbarContainer>
    );
  }

  return (
    <>
      <Stack direction="row" alignItems="center" justifyContent="space-between" mb={5}>
        <Typography variant="h4">{t('modelpricePage.availableModels')}</Typography>
      </Stack>
      <Card>
        <DataGrid
          rows={rows}
          columns={modelRatioColumns}
          initialState={{ pagination: { paginationModel: { pageSize: 20 } } }}
          pageSizeOptions={[20, 30, 50, 100]}
          disableRowSelectionOnClick
          slots={{ toolbar: EditToolbar }}
          localeText={zhCN.components.MuiDataGrid.defaultProps.localeText}
        />
      </Card>
    </>
  );
}
