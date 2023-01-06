import { useReducer, useEffect, useContext, createContext } from "react";
import { useNavigate } from "react-router-dom";
import axios from "utils/axiosConfig.js";

const initialState = {
  isAuthenticated: null,
  user: null,
};

const reducer = (state, action) => {
  switch (action.type) {
    case "LOGIN":
      return {
        ...state,
        isAuthenticated: true,
        user: action.payload,
      };
    case "LOGOUT":
      localStorage.clear();
      return {
        ...state,
        isAuthenticated: false,
        user: null,
      };
    case "UPDATE_USER":
      return {
        ...state,
        user: action.payload,
      };
    default:
      return state;
  }
};

const authContext = createContext();

// Provider component that wraps your app and makes auth object ...
// ... available to any child component that calls useAuth().
export function ProvideAuth({ children }) {
  const [state, dispatch] = useReducer(reducer, initialState);
  return (
    <authContext.Provider
      value={{
        state,
        dispatch,
      }}
    >
      {children}
    </authContext.Provider>
  );
}

// Hook for child components to get the auth object ...
// ... and re-render when it changes.
export const useAuth = () => {
  return useContext(authContext);
};

// Provider hook that creates auth object and handles state
export function useProvideAuth() {
  const { state, dispatch } = useAuth();
  let navigate = useNavigate();

  const signin = async (username, password) => {
    try {
      const response = await axios.post(`auth/signin`, {
        username: username,
        password: password,
      });
      localStorage.setItem("MernAppUser", JSON.stringify(response.data));
      dispatch({
        type: "LOGIN",
        payload: response.data,
      });
      return response;
    } catch (error) {
      console.log(error);
      if (error.response) {
        throw new Error(error.response.data.error);
      } else {
        throw error;
      }
    }
  };

  const signup = async (
    username,
    email,
    password,
    confirmPassword,
    profile_image
  ) => {
    try {
      await axios.post(`auth/signup`, {
        username: username,
        email: email,
        password: password,
        confirm_password: confirmPassword,
        profile_image: profile_image,
      });
      return await signin(username, password);
    } catch (error) {
      console.log(error);
      if (error.response) {
        throw new Error(error.response.data.error);
      } else {
        throw error;
      }
    }
  };

  const signout = () => {
    dispatch({
      type: "LOGOUT",
    });
    navigate("/");
  };

  const getCurrentUser = () => {
    return JSON.parse(localStorage.getItem("MernAppUser"));
  };

  const updateAuthUserAfterUpdate = (user) => {
    console.log(user);
    dispatch({
      type: "UPDATE_USER",
      payload: user,
    });
    const savedData = JSON.parse(localStorage.getItem("MernAppUser"));
    savedData.profile_image = user.profile_image;
    console.log("Saved Data:", savedData);
    localStorage.setItem("MernAppUser", JSON.stringify(savedData));
  };

  useEffect(() => {
    const savedUser = JSON.parse(localStorage.getItem("MernAppUser")) || false;
    if (savedUser) {
      dispatch({
        type: "LOGIN",
        payload: savedUser,
      });
    } else {
      dispatch({
        type: "LOGOUT",
      });
    }
  }, [dispatch]);

  // Return the user object and auth methods
  return {
    state,
    getCurrentUser,
    signin,
    signup,
    signout,
    updateAuthUserAfterUpdate,
  };
}
