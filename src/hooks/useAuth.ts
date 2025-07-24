import { useEffect } from 'react';
import { useAppDispatch } from '../hooks';
import {
  useGetRoomTypesQuery,
  useGetWhoamiQuery,
  useGetPropertiesQuery
} from '../store/api/otaReservationApi';
import {
  setRoomTypes,
  setUserInfo,
  setProperties
} from '../store/slices/otaApiSlice';
import { initializeGeminiService } from '../services/geminiService';

export const useAuth = () => {
  const dispatch = useAppDispatch();

  // 1. Fetch user info (whoami)
  const {
    data: whoamiData,
    isLoading: isWhoamiLoading,
    error: whoamiError,
  } = useGetWhoamiQuery();

  // 2. Fetch property list
  const {
    data: propertiesData,
    isLoading: isPropertiesLoading,
    error: propertiesError,
  } = useGetPropertiesQuery();

  // 3. Use propertyId from whoami or fallback to first property in list (if any)
  const propertyId = 1;

  // 4. Fetch room types with propertyId (skip if no propertyId)
  const {
    data: roomTypesData = [],
    isLoading: isRoomTypesLoading,
    error: roomTypesError,
  } = useGetRoomTypesQuery({ property_id: propertyId }, { skip: !propertyId });

  // Save user info to redux when loaded
  useEffect(() => {
    if (whoamiData) {
      dispatch(setUserInfo(whoamiData));
    }
  }, [whoamiData, dispatch]);

  // Save properties list to redux when loaded
  useEffect(() => {
    if (propertiesData) {
      dispatch(setProperties(propertiesData));
    }
  }, [propertiesData, dispatch]);

  // Save room types to redux when loaded
  useEffect(() => {
    if (roomTypesData) {
      dispatch(setRoomTypes(roomTypesData));
    }
  }, [roomTypesData, dispatch]);

  useEffect(() => {
    if (roomTypesData.length) {
      initializeGeminiService({roomTypes: roomTypesData, rateCodes: [], properties: propertiesData ?? null,}, ['en', 'es']);
    }
  }, [roomTypesData]);


  return {
    isLoading: isWhoamiLoading || isPropertiesLoading || isRoomTypesLoading,
    error: whoamiError || propertiesError || roomTypesError,
    user: whoamiData,
    properties: propertiesData,
    roomTypes: roomTypesData,
  };
};
