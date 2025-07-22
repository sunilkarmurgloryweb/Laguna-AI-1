import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';
import { GetAvailabilityRequest, GetAvailabilityResponse, GetCalculateStayResponse, GetOrgResponse, GetPropertiesResponse, GetPropertyDetailResponse, GetReservationRequest, GetReservationResponse, GetRoomTypesRequest, GetRoomTypesResponse, GetWhoamiResponse, PostReservationRequest, PostReservationResponse } from '../../types/otaReservationApi';

const API_KEY = 'pN0SydIgDzegjXzxlVaz5SmCFPD9qfd3kRjzgKbVUhonuDtNejCGsFw60506';

export const otaReservationApi = createApi({
    reducerPath: 'otaReservationApi',
    baseQuery: fetchBaseQuery({
        baseUrl: 'https://development-api.lagunacreek.net/ota/v1',
        prepareHeaders: (headers) => {
            headers.set('X-API-Key', API_KEY);
            headers.set('accept', 'application/json');
            return headers;
        },
    }),
    tagTypes: ['Reservation', 'Property'],
    endpoints: (builder) => ({
        // GET /getWhoami
        getWhoami: builder.query<GetWhoamiResponse, void>({
            query: () => ({
                url: '/getWhoami',
                method: 'GET',
            }),
        }),


        // GET /getOrg
        getOrg: builder.query<GetOrgResponse, void>({
            query: () => ({
                url: '/getOrg',
                method: 'GET',
            }),
        }),


        // GET /getProperties
        getProperties: builder.query<GetPropertiesResponse, void>({
            query: () => ({
                url: '/getProperties',
                method: 'GET',
            }),
        }),


        // GET /getPropertyDetail/{id}
        getPropertyDetail: builder.query<GetPropertyDetailResponse, string>({
            query: (id) => ({
                url: `/getPropertyDetail/${id}`,
                method: 'GET',
            }),
        }),


        // GET /getPropertyAmenities/{property_id}
        getPropertyAmenities: builder.query<any, string>({
            query: (propertyId) => ({
                url: `/getPropertyAmenities/${propertyId}`,
                method: 'GET',
            }),
        }),

        // GET /getAvailability
        getAvailability: builder.query<GetAvailabilityResponse, GetAvailabilityRequest>({
            query: ({ start_date, end_date, number_of_guests, property_id }) => ({
                url: `/getAvailability`,
                method: 'GET',
                params: {
                    start_date,
                    end_date,
                    number_of_guests,
                    property_id
                }
            }),
        }),


        // GET /getRoomTypes
        getRoomTypes: builder.query<GetRoomTypesResponse, GetRoomTypesRequest>({
            query: ({ property_id }) => ({
                url: `/getRoomTypes`,
                method: 'GET',
                params: { property_id }
            })
        }),


        // GET /getReservation
        getReservation: builder.query<GetReservationResponse, GetReservationRequest>({
            query: ({ reservation_id }) => ({
                url: `/getReservation`,
                method: 'GET',
                params: { reservation_id }
            })
        }),


        // POST /postReservation
        postReservation: builder.mutation<PostReservationResponse, PostReservationRequest>({
            query: (body) => ({
                url: '/postReservation',
                method: 'POST',
                body,
            }),
        }),


        // GET /getCalculateStay
        getCalculateStay: builder.query<GetCalculateStayResponse, { check_in: string; check_out: string; no_of_rooms: number; room_type_ids: number[] }>({
            query: ({ check_in, check_out, no_of_rooms, room_type_ids }) => {
                const params = new URLSearchParams();
                params.append('check_in', check_in);
                params.append('check_out', check_out);
                params.append('no_of_rooms', no_of_rooms.toString());
                room_type_ids.forEach(id => params.append('room_type_ids', id.toString()));
                return `getCalculateStay?${params.toString()}`;
            },
        }),

    }),
});

export const {
    useGetWhoamiQuery,
    useGetOrgQuery,
    useGetPropertiesQuery,
    useGetPropertyDetailQuery,
    useGetPropertyAmenitiesQuery,
    useGetAvailabilityQuery,
    useLazyGetAvailabilityQuery,
    useGetRoomTypesQuery,
    useGetReservationQuery,
    usePostReservationMutation,
    useGetCalculateStayQuery,
} = otaReservationApi;
