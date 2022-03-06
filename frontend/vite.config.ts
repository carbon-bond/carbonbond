import { defineConfig } from 'vite';
import reactRefresh from '@vitejs/plugin-react-refresh';
import { resolve } from 'path';
import mobilePlugin from './vite_plugins/mobile';
import mdPlugin from 'vite-plugin-markdown';
import { Mode as mdMode } from 'vite-plugin-markdown';

export default defineConfig({
	plugins: [reactRefresh(), mobilePlugin(), mdPlugin({mode: [mdMode.REACT]})],
	build: {
		rollupOptions: {
			input: {
				desktop: resolve(__dirname, 'index.html'),
				mobile: resolve(__dirname, 'index.mobile.html'),
			},
			output: {
				manualChunks: {
					react_family: ['react', 'react-dom', 'react-router', 'react-router-dom'],
					emoji: ['emoji-mart'],
					laws: ['src/md/law/服務條款.md', 'src/md/law/論壇守則.md'],
				},
			},
		},
	},
	server: {
		host: '0.0.0.0',
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
