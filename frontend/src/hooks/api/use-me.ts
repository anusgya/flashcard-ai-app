import useSWR from "swr";
import { fetchWithAuth } from "./fetchWithAuth";

// Get the currently authenticated user
export default function useMe() {
  const { data, error, isLoading, mutate } = useSWR(
    "/api/users/me",
    fetchWithAuth,
    {
      revalidateOnFocus: false,
      revalidateIfStale: true,
      dedupingInterval: 60000,
    }
  );

  return {
    user: data,
    isLoading,
    isError: error,
    mutate,
  };
}

// Function to update user profile
export async function updateUserProfile(userData: {
  username?: string;
  email?: string;
  password?: string;
  settings?: any;
  avatar?: string;
}) {
  return fetchWithAuth("/api/users/me", {
    method: "PUT",
    body: JSON.stringify(userData),
  });
}

// Function to update just the avatar
export async function updateUserAvatar(avatarPath: string) {
  return updateUserProfile({ avatar: avatarPath });
}

// Function to change password
export async function changePassword(passwordData: { password: string }) {
  return updateUserProfile({ password: passwordData.password });
}
