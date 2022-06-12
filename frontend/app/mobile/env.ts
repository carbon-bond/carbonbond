import Constants from 'expo-constants';
import { Platform } from 'react-native';

const server = Platform.OS == 'web' ?
	`${window.location.protocol}//${window.location.hostname}:${window.location.port}` :
	'https://devs.carbonbond.cc';

type Env = {
	server: string
};

const ENV = {
	dev: {
		server
	},
	stage: {
		server
	},
	prod: {
		server
	},
};

export const getEnvVars = (env = Constants.manifest.releaseChannel): Env => {
	// eslint-disable-next-line
	if (__DEV__) {
		return ENV.dev;
	} else if (env === 'staging') {
		return ENV.stage;
	} else if (env === 'prod') {
		return ENV.prod;
	}
	throw new Error('未知的環境');
};

