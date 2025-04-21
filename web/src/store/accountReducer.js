import * as actionTypes from './actions';

export const initialState = {
  user: undefined,
  userGroup: []
};

const accountReducer = (state = initialState, action) => {
  switch (action.type) {
    case actionTypes.LOGIN:
      return {
        ...state,
        user: action.payload
      };
    case actionTypes.LOGOUT:
      return {
        ...state,
        user: undefined
      };
    case actionTypes.SET_USER_GROUP:
      return {
        ...state,
        userGroup: action.payload
      };
    default:
      return state;
  }
};

export default accountReducer;
