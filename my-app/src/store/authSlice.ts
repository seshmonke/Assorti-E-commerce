import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import type { PayloadAction } from '@reduxjs/toolkit';
import axios from 'axios';

interface User {
    id: string;
    telegramId: string;
    username?: string | null;
    firstName?: string | null;
    lastName?: string | null;
    createdAt: string;
    updatedAt: string;
}

interface AuthState {
    isAuthorized: boolean;
    isLoading: boolean;
    user: User | null;
    error: string | null;
}

const initialState: AuthState = {
    isAuthorized: false,
    isLoading: false,
    user: null,
    error: null,
};

const API_URL = import.meta.env.VITE_API_URL || '';

/**
 * Async thunk для авторизации через Telegram initData
 */
export const signIn = createAsyncThunk(
    'auth/signIn',
    async (initData: string, { rejectWithValue }) => {
        try {
            const response = await axios.post(
                `${API_URL}/api/auth/signin`,
                { initData },
                { withCredentials: true },
            );

            if (!response.data.success) {
                return rejectWithValue(response.data.error || 'Unknown error');
            }

            return response.data.data as {
                user: User;
                accessToken: string;
                refreshToken: string;
            };
        } catch (error) {
            const message = axios.isAxiosError(error)
                ? error.response?.data?.error || error.message
                : 'Unknown error';
            return rejectWithValue(message);
        }
    },
);

/**
 * Async thunk для обновления access токена
 */
export const refreshToken = createAsyncThunk(
    'auth/refreshToken',
    async (_, { rejectWithValue }) => {
        try {
            const response = await axios.post(
                `${API_URL}/api/auth/refresh`,
                {},
                { withCredentials: true },
            );

            if (!response.data.success) {
                return rejectWithValue(response.data.error || 'Unknown error');
            }

            return response.data.data as {
                accessToken: string;
            };
        } catch (error) {
            const message = axios.isAxiosError(error)
                ? error.response?.data?.error || error.message
                : 'Unknown error';
            return rejectWithValue(message);
        }
    },
);

/**
 * Async thunk для выхода из аккаунта
 */
export const logout = createAsyncThunk(
    'auth/logout',
    async (_, { rejectWithValue }) => {
        try {
            const response = await axios.post(
                `${API_URL}/api/auth/logout`,
                {},
                { withCredentials: true },
            );

            if (!response.data.success) {
                return rejectWithValue(response.data.error || 'Unknown error');
            }

            return true;
        } catch (error) {
            const message = axios.isAxiosError(error)
                ? error.response?.data?.error || error.message
                : 'Unknown error';
            return rejectWithValue(message);
        }
    },
);

export const authSlice = createSlice({
    name: 'auth',
    initialState,
    reducers: {
        clearError: (state) => {
            state.error = null;
        },
        resetAuth: () => initialState,
    },
    extraReducers: (builder) => {
        // signIn
        builder
            .addCase(signIn.pending, (state) => {
                state.isLoading = true;
                state.error = null;
            })
            .addCase(
                signIn.fulfilled,
                (
                    state,
                    action: PayloadAction<{
                        user: User;
                        accessToken: string;
                        refreshToken: string;
                    }>,
                ) => {
                    state.isLoading = false;
                    state.isAuthorized = true;
                    state.user = action.payload.user;
                    state.error = null;
                },
            )
            .addCase(signIn.rejected, (state, action) => {
                state.isLoading = false;
                state.isAuthorized = false;
                state.user = null;
                state.error = action.payload as string;
            });

        // refreshToken
        builder
            .addCase(refreshToken.pending, (state) => {
                state.isLoading = true;
            })
            .addCase(refreshToken.fulfilled, (state) => {
                state.isLoading = false;
                state.isAuthorized = true;
                state.error = null;
            })
            .addCase(refreshToken.rejected, (state, action) => {
                state.isLoading = false;
                state.isAuthorized = false;
                state.user = null;
                state.error = action.payload as string;
            });

        // logout
        builder
            .addCase(logout.pending, (state) => {
                state.isLoading = true;
            })
            .addCase(logout.fulfilled, (state) => {
                state.isLoading = false;
                state.isAuthorized = false;
                state.user = null;
                state.error = null;
            })
            .addCase(logout.rejected, (state, action) => {
                state.isLoading = false;
                state.error = action.payload as string;
            });
    },
});

export const { clearError, resetAuth } = authSlice.actions;
export const authReducer = authSlice.reducer;
