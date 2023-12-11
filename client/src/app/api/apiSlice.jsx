import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";
import { setCredentials, logOut } from "../../features/auth/authSlice";

const baseQuery = fetchBaseQuery({
  baseUrl: "http://localhost:3500",
  credentials: "include", // used to send back out http only secure cookie so you want the cookie to send with every query and thats what we're setting `credentials: 'include'`
  prepareHeaders: (headers, { getState }) => {
    const token = getState().auth.token;
    if (token) {
      headers.set("authorization", `Bearer ${token}`);
    }
    return headers;
  },
});

// Wrapper for baseQuery(for refreshed token)
const baseQueryWithReauth = async (args, api, extraOptions) => {
  let result = await baseQuery(args, api, extraOptions);

  if (result?.error?.originalStatus === 403) {
    console.log("sending refresh token");
    // send refresh token to get new access token
    const refreshResult = await baseQuery("/refresh", api, extraOptions);
    console.log(refreshResult);
    if (refreshResult?.data) {
      const user = api.getState().auth.user;
      // store the new token
      api.dispatch(
        setCredentials({
          ...refreshResult.data,
          user,
        })
      );
      // retry the original query with new access token
      result = await baseQuery(args, api, extraOptions);
    }
  } else {
    // 401 Unauthoraised
    api.dispatch(logOut());
  }
  return result;
};

export const apiSlice = createApi({
  baseQuery: baseQueryWithReauth,
  endpoints: (builder) => ({}),
  // builder empty cuz we are going to use extended api slices in order to specify what belongs to auth and what belongs to other features of our application
});
