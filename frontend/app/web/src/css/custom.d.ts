declare module '*.module.css' {
	const classes: { [key: string]: string };
	export default classes;
}

declare module '*.png' {
	const value: string;
	export default value;
}

declare module '*.svg' {
	const value: string;
	export default value;
}

declare module '*.mp3' {
	const value: string;
	export default value;
}

declare module '*.md' {
  const attributes: Record<string, unknown>;

  import React from 'react';
  const ReactComponent: React.VFC;

  export { attributes, ReactComponent };
}