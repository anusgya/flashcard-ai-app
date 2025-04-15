import useSWR from 'swr';
import { fetcher } from './fetchWithAuth';

// Get the currently authenticated user
export default function useMe() {
  const { data, error, isLoading, mutate } = useSWR('/api/auth/me', fetcher, {
    revalidateOnFocus: false,
    revalidateIfStale: true,
    dedupingInterval: 60000,
  });

  return {
    user: data,
    isLoading,
    isError: error,
    mutate,
  };
}


// Function to update user profile
// export async function updateUserProfile(userData: {
//   name?: string;
//   email?: string;
//   bio?: string;
//   // Add other fields as needed
// }) {
//   return fetchWithAuth('/api/auth/me', {
//     method: 'PATCH',
//     body: JSON.stringify(userData),
//   });
// }

// // Function to change password
// export async function changePassword(passwordData: {
//   current_password: string;
//   new_password: string;
// }) {
//   return fetchWithAuth('/api/auth/password', {
//     method: 'POST',
//     body: JSON.stringify(passwordData),
//   });
// }