import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import type { PayloadAction } from '@reduxjs/toolkit';
import axios from 'axios';
import { logger } from '../utils/logger';

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
    isInitialized: boolean;
    user: User | null;
    error: string | null;
}

const initialState: AuthState = {
    isAuthorized: false,
    isLoading: false,
    isInitialized: false,
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
        /**
         * Устанавливает isInitialized без авторизации
         * (используется когда Telegram SDK недоступен)
         */
        setInitialized: (state) => {
            console.log('[AuthSlice] setInitialized called — Telegram SDK unavailable, marking as not authorized');
            state.isInitialized = true;
            state.isAuthorized = false;
            state.isLoading = false;
        },
    },
    extraReducers: (builder) => {
        // signIn
        builder
            .addCase(signIn.pending, (state) => {
                console.log('[Auth] signIn.pending — начало авторизации');
                logger.info('[Auth] Sign in pending');
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
                    console.log('[Auth] signIn.fulfilled — авторизация успешна', {
                        userId: action.payload.user.id,
                        telegramId: action.payload.user.telegramId,
                        username: action.payload.user.username,
                        firstName: action.payload.user.firstName,
                    });
                    logger.info('[Auth] Sign in successful', {
                        userId: action.payload.user.id,
                        username: action.payload.user.username,
                    });
                    state.isLoading = false;
                    state.isInitialized = true;
                    state.isAuthorized = true;
                    state.user = action.payload.user;
                    state.error = null;
                },
            )
            .addCase(signIn.rejected, (state, action) => {
                console.error('[Auth] signIn.rejected — авторизация не удалась', {
                    error: action.payload,
                    errorType: typeof action.payload,
                });
                logger.warn('[Auth] Sign in failed', {
                    error: action.payload,
                });
                state.isLoading = false;
                state.isInitialized = true;
                state.isAuthorized = false;
                state.user = null;
                state.error = action.payload as string;
            });

        // refreshToken
        builder
            .addCase(refreshToken.pending, (state) => {
                console.log('[Auth] refreshToken.pending');
                logger.debug('[Auth] Refresh token pending');
                state.isLoading = true;
            })
            .addCase(refreshToken.fulfilled, (state) => {
                console.log('[Auth] refreshToken.fulfilled — токен обновлён');
                logger.info('[Auth] Refresh token successful');
                state.isLoading = false;
                state.isAuthorized = true;
                state.error = null;
            })
            .addCase(refreshToken.rejected, (state, action) => {
                console.error('[Auth] refreshToken.rejected — обновление токена не удалось', {
                    error: action.payload,
                });
                logger.warn('[Auth] Refresh token failed', {
                    error: action.payload,
                });
                state.isLoading = false;
                state.isAuthorized = false;
                state.user = null;
                state.error = action.payload as string;
            });

        // logout
        builder
            .addCase(logout.pending, (state) => {
                console.log('[Auth] logout.pending');
                logger.info('[Auth] Logout pending');
                state.isLoading = true;
            })
            .addCase(logout.fulfilled, (state) => {
                console.log('[Auth] logout.fulfilled — выход выполнен');
                logger.info('[Auth] Logout successful');
                state.isLoading = false;
                state.isAuthorized = false;
                state.user = null;
                state.error = null;
            })
            .addCase(logout.rejected, (state, action) => {
                console.error('[Auth] logout.rejected — ошибка выхода', {
                    error: action.payload,
                });
                logger.warn('[Auth] Logout failed', {
                    error: action.payload,
                });
                state.isLoading = false;
                state.error = action.payload as string;
            });
    },
});

export const { clearError, resetAuth, setInitialized } = authSlice.actions;
export const authReducer = authSlice.reducer;
