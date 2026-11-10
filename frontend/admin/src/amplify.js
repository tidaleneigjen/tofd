import { Amplify } from "aws-amplify";

export const COGNITO_USER_POOL_ID = import.meta.env.VITE_COGNITO_USER_POOL_ID;
export const COGNITO_APP_CLIENT_ID = import.meta.env.VITE_COGNITO_APP_CLIENT_ID;
export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

export const isConfigured = Boolean(COGNITO_USER_POOL_ID && COGNITO_APP_CLIENT_ID && API_BASE_URL);

if (isConfigured) {
  Amplify.configure({
    Auth: {
      Cognito: {
        userPoolId: COGNITO_USER_POOL_ID,
        userPoolClientId: COGNITO_APP_CLIENT_ID,
      },
    },
  });
}
