import { useAuth0 } from '@auth0/auth0-react';
import { useState, useEffect } from 'react';

export const useUserMetadata = () => {
  const { user, isAuthenticated, getAccessTokenSilently } = useAuth0();
  const [userMetadata, setUserMetadata] = useState(null);

  useEffect(() => {
    const getUserMetadata = async () => {
      try {
        const domain = process.env.REACT_APP_AUTH0_DOMAIN;
        if (!domain) {
          throw new Error('Auth0 domain is not set');
        }

        const accessToken = await getAccessTokenSilently({
          audience: `https://${domain}/api/v2/`,
          scope: "read:current_user",
        });

        const userDetailsByIdUrl = `https://${domain}/api/v2/users/${user.sub}`;

        const metadataResponse = await fetch(userDetailsByIdUrl, {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        });

        const { user_metadata } = await metadataResponse.json();

        setUserMetadata(user_metadata);
      } catch (e) {
        console.error('Error fetching user metadata:', e);
      }
    };

    if (isAuthenticated) {
      getUserMetadata();
    }
  }, [getAccessTokenSilently, user?.sub, isAuthenticated]);

  const updateUserMetadata = async (newMetadata) => {
    try {
      const domain = process.env.REACT_APP_AUTH0_DOMAIN;
      if (!domain) {
        throw new Error('Auth0 domain is not set');
      }

      const accessToken = await getAccessTokenSilently({
        audience: `https://${domain}/api/v2/`,
        scope: "update:current_user_metadata",
      });

      const userDetailsByIdUrl = `https://${domain}/api/v2/users/${user.sub}`;

      const metadataResponse = await fetch(userDetailsByIdUrl, {
        method: 'PATCH',
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ user_metadata: newMetadata }),
      });

      if (metadataResponse.ok) {
        setUserMetadata(newMetadata);
      } else {
        throw new Error('Failed to update user metadata');
      }
    } catch (e) {
      console.error('Error updating user metadata:', e);
    }
  };

  return { userMetadata, updateUserMetadata };
};
