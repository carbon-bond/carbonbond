import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { resolve } from 'path';
import mobilePlugin from './vite_plugins/mobile';
import mdPlugin from 'vite-plugin-markdown';
import { Mode as mdMode } from 'vite-plugin-markdown';

export default defineConfig({
	plugins: [
		react({
			jsxRuntime: 'classic'
		}),
		mobilePlugin(),
		mdPlugin({mode: [mdMode.REACT]}),
	],
	build: {
		rollupOptions: {
			input: {
				desktop: resolve(__dirname, 'index.html'),
				mobile: resolve(__dirname, 'index.mobile.html'),
			},
			output: {
				manualChunks: {
					react_family: ['react', 'react-dom', 'react-router-dom'],
					emoji: ['emoji-mart'],
					laws: [
						'src/md/law/服務條款.md',
						'src/md/law/論壇守則.md',
						'src/md/law/品牌使用準則.md',
						'src/md/law/看板和活動政策.md'
					],
				},
			},
		},
	},
	server: {
		host: '0.0.0.0',
		proxy: {
			'/api': 'http://127.0.0.1:8080',
			'/avatar': 'http://127.0.0.1:8080',
			'/chat': {
				target: 'ws://127.0.0.1:8080',
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
