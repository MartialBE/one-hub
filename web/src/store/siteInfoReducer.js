import config from 'config';
import * as actionTypes from './actions';

export const initialState = {
  ...config.siteInfo,
  ownedby: []
};

const siteInfoReducer = (state = initialState, action) => {
  switch (action.type) {
    case actionTypes.SET_SITE_INFO:
      return {
        ...state,
        ...action.payload,
        isLoading: false
      };
    case actionTypes.SET_MODEL_OWNEDBY:
      return {
        ...state,
        ownedby: action.payload
      };
    default:
      return state;
  }
};

export default siteInfoReducer;
