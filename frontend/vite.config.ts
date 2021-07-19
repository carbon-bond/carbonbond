import { defineConfig } from 'vite';
import reactRefresh from '@vitejs/plugin-react-refresh';

export default defineConfig({
	plugins: [reactRefresh()],
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
