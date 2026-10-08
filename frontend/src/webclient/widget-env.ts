/*
Copyright 2024-2026 Komi AI

Licensed under the Apache License, Version 2.0 (the "License");
you may not use this file except in compliance with the License.
You may obtain a copy of the License at

    http://www.apache.org/licenses/LICENSE-2.0

Unless required by applicable law or agreed to in writing, software
distributed under the License is distributed on an "AS IS" BASIS,
WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
See the License for the specific language governing permissions and
limitations under the License.
*/

// @ts-nocheck
import { buildUploadUrl } from '../utils/avatars';

export interface InitialData {
    widgetId: string;
    agentName: string;
    customization: Record<string, any>;
    customerId: string;
    customer: Record<string, any>;
    initialToken?: string;
}

// @ts-ignore
declare global {
    // @ts-ignore
    interface Window {
        // @ts-ignore
        __INITIAL_DATA__: InitialData;
    }
}

// Helper function to get runtime configuration
function getRuntimeConfig() {
    // @ts-ignore - APP_CONFIG might not be available at build time
    return typeof window !== 'undefined' && window.APP_CONFIG ? window.APP_CONFIG : {};
}

export const widgetEnv = {
    get API_URL() {
        const config = getRuntimeConfig();
        if (config.API_URL) return config.API_URL;
        if (import.meta.env.VITE_API_URL) return import.meta.env.VITE_API_URL;
        if (typeof window !== 'undefined' && window.location) {
            if (window.location.port === '3001') {
                return `${window.location.protocol}//${window.location.hostname}:8001/api/v1`;
            }
            if (window.location.port === '5173' || window.location.port === '3000') {
                return `${window.location.protocol}//${window.location.hostname}:8000/api/v1`;
            }
            return `${window.location.origin}/api/v1`;
        }
        return 'http://localhost:8000/api/v1';
    },
    get WS_URL() {
        const config = getRuntimeConfig();
        if (config.WS_URL) return config.WS_URL;
        if (import.meta.env.VITE_WS_URL) return import.meta.env.VITE_WS_URL;
        if (typeof window !== 'undefined' && window.location) {
            const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
            if (window.location.port === '3001') {
                return `${protocol}//${window.location.hostname}:8001`;
            }
            if (window.location.port === '5173' || window.location.port === '3000') {
                return `${protocol}//${window.location.hostname}:8000`;
            }
            return `${protocol}//${window.location.host}`;
        }
        return 'ws://localhost:8000';
    }
}

/**
 * Widget-side counterpart of resolveUploadUrl (src/config/api.ts). Same rules,
 * but resolved against widgetEnv.API_URL so the widget keeps its own fallback.
 */
export function resolveWidgetUploadUrl(stored?: string | null): string {
    return buildUploadUrl(stored, widgetEnv.API_URL);
}
