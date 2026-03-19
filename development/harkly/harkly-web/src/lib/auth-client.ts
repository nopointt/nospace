import { createAuthClient } from "better-auth/solid";

export const authClient = createAuthClient({
  baseURL: "/api/auth",
});

export const { useSession, signIn, signOut } = authClient;

export const signUp = {
  email: (data: { email: string; password: string; name: string }) =>
    authClient.signUp.email(data),
};
