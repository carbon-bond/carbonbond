import { defineConfig } from 'vite';
import reactRefresh from '@vitejs/plugin-react-refresh';
import { resolve } from 'path';
import mobilePlugin from './vite_plugins/mobile';

export default defineConfig({
	plugins: [reactRefresh(), mobilePlugin()],
	build: {
		rollupOptions: {
			input: {
				desktop: resolve(__dirname, 'index.html'),
				mobile: resolve(__dirname, 'index.mobile.html'),
			},
			output: {
				manualChunks: {
					react_family: ['react', 'react-dom', 'react-router', 'react-router-dom'],
					immer: ['immer', 'immutable'],
					emoji: ['emoji-mart']
				},
			},
		},
	},
	server: {
		proxy: {
			'/api': 'http://localhost:8080',
			'/avatar': 'http://localhost:8080',
			'/chat': {
				target: 'ws://localhost:8080',
				ws: true,
			},
		}
	},
	css: {
		modules: {
			scopeBehaviour: 'local'
		}
	}
});
