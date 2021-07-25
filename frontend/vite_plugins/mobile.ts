import { Plugin, ViteDevServer } from 'vite';

function isMobile(user_agent: string): boolean {
	return /Mobile|Android|webOS|iPhone|iPad|iPod|BlackBerry|Opera Mini/i.test(user_agent);
}

const mobilePlugin = (): Plugin => ({
	name: 'mobilePlugin',
	configureServer(server: ViteDevServer) {
		server.middlewares.use('/', (req, _, next) => {
			if (isMobile(req.headers['user-agent'] ?? '')) {
				if (req.url == '/' || req.url?.startsWith('/app')) {
					req.url = '/index.mobile.html';
				}
			}
			next();
		});
	}
});

export default mobilePlugin;