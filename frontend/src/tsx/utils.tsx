import * as React from 'react';

type InputEvent = React.ChangeEvent<HTMLInputElement>;

// 以返回的 value, onChange 綁定 input 的值
function useInputValue(initialValue: string = ''): {
		input_props: {
			value: string,
			onChange: (e: InputEvent) => void
		},
		setValue: React.Dispatch<React.SetStateAction<string>>,
	} {
	const [value, setValue] = React.useState<string>(initialValue);
	return {
		input_props: {
			value: value,
			onChange: (event: InputEvent) => setValue(event.target.value)
		},
		setValue: setValue,
	};
}

export {
	useInputValue
};