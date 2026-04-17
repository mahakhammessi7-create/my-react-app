import API from '../services/api';

// Action Types
export const GET_NATIONAL_STATS_REQUEST = 'GET_NATIONAL_STATS_REQUEST';
export const GET_NATIONAL_STATS_SUCCESS = 'GET_NATIONAL_STATS_SUCCESS';
export const GET_NATIONAL_STATS_FAILURE = 'GET_NATIONAL_STATS_FAILURE';

// Action Creator
export const getNationalStats = () => async (dispatch) => {
  try {
    dispatch({ type: GET_NATIONAL_STATS_REQUEST });
    
    const response = await API.get('/admin/national-stats');
    
    dispatch({
      type: GET_NATIONAL_STATS_SUCCESS,
      payload: response.data,
    });
  } catch (error) {
    dispatch({
      type: GET_NATIONAL_STATS_FAILURE,
      payload: error.response?.data?.message || error.message || 'Failed to fetch stats',
    });
  }
};