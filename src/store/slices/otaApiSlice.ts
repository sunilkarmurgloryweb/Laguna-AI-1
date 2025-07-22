import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { GetPropertiesResponse, GetWhoamiResponse, RoomTypeItem } from '../../types/otaReservationApi';

interface otaApiState {
  userInfo?: GetWhoamiResponse;
  roomTypes?: RoomTypeItem[];
  properties?: GetPropertiesResponse
}

const initialState: otaApiState = {};

const otaApiSlice = createSlice({
  name: 'otaApiSlice',
  initialState,
  reducers: {
    setUserInfo(state, action: PayloadAction<otaApiState['userInfo']>) {
      state.userInfo = action.payload;
    },
    setRoomTypes(state, action: PayloadAction<otaApiState['roomTypes']>) {
      state.roomTypes = action.payload;
    },
    setProperties(state, action: PayloadAction<otaApiState['properties']>) {
      state.properties = action.payload;
    },
  },
});

export const { setUserInfo, setRoomTypes, setProperties } = otaApiSlice.actions;
export default otaApiSlice.reducer;
