let tokenTimeout;

const decodeToken = (token) => {
  try {
    return JSON.parse(atob(token.split(".")[1]));
  } catch {
    return null;
  }
};

export const scheduleTokenRemoval = (token) => {
  console.log("hello1");
  if (!token) return;
  console.log("hello2");
  if (tokenTimeout) clearTimeout(tokenTimeout);
  console.log("hello3");

  const payload = decodeToken(token);
  if (!payload?.exp) {
    console.error("Invalid token payload");
    localStorage.removeItem("token");
    return;
  }

  const delay = payload.exp * 1000 - Date.now();
  console.log(delay, payload.exp, Date.now());

  if (delay <= 0) {
    localStorage.removeItem("token");
    return;
  }

  tokenTimeout = setTimeout(() => {
    localStorage.removeItem("token");
  }, delay);
};

export const getToken = () => localStorage.getItem("token");
export const removeToken = () => localStorage.removeItem("token");
export const isTokenExpired = (token) => {
  if (!token) return true;
  const payload = decodeToken(token);
  return !payload || Date.now() >= payload.exp * 1000;
};
