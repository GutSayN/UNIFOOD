// tegistro
const API_URL = "https://auth-microservice-aw85.onrender.com/api/auth";

export const registerUser = async (data) => {
  try {
    const response = await fetch(`${API_URL}/register`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        accept: "*/*",
      },
      body: JSON.stringify(data),
    });

    const result = await response.json();
    return result;
  } catch (error) {
    console.error("Error en el registro:", error);
    throw error;
  }
};
// login
export const loginUser = async (data) => {
  try {
    const response = await fetch(`${API_URL}/login`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        accept: "*/*",
      },
      body: JSON.stringify(data),
    });

    return await response.json();
  } catch (error) {
    console.error("Error en el login:", error);
    throw error;
  }
};