import { Plugin, ViteDevServer } from 'vite';

function isMobile(user_agent: string): boolean {
	if (/iPad/i.test(user_agent)) {
		return false;
	} else {
		return /Mobile/i.test(user_agent);
	}
}

const mobilePlugin = (): Plugin => ({
	name: 'mobilePlugin',
	configureServer(server: ViteDevServer) {
		server.middlewares.use('/', (req, _, next) => {
			if (isMobile(req.headers['user-agent'] ?? '')) {
				if (req.url == '/' || req.url?.startsWith('/app')) {
					req.url = '/index.mobile.html';
				}
			} else {
				if (req.url == '/' || req.url?.startsWith('/app')) {
					req.url = '/index.html';
				}
			}
			next();
		});
	}
});

export default mobilePlugin;