export const getAuthToken = () => {
  try {
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    return (
      user.token ||
      user.access_token ||
      user.jwt ||
      user.accessToken ||
      localStorage.getItem('access_token') ||
      localStorage.getItem('token') ||
      null
    );
  } catch {
    return null;
  }
};
