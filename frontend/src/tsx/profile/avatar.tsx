import * as React from 'react';
import ReactModal from 'react-modal';
import { API_FETCHER, unwrap } from '../../ts/api/api';
import { toastErr } from '../utils';

import style from '../../css/avatar.module.css';

// TODO: 可剪裁非正方形的圖片
function EditAvatar(props: { name: string }): JSX.Element {
	// const { user_state } = UserState.useContainer();
	const [is_editing, setIsEditing] = React.useState<boolean>(false);
	const [preview_data, setPreviewData] = React.useState<string | null>(null);

	function chooseAvatar(e: React.ChangeEvent<HTMLInputElement>): void {
		e.preventDefault();

		if (e.target.files == null) {
			return;
		}

		let reader = new FileReader();
		let file = e.target.files[0];
		e.target.value = '';

		reader.onloadend = () => {
			setPreviewData(reader.result as string); // 因爲使用 readAsDataURL ，故 result 爲字串
			setIsEditing(true);
		};

		reader.readAsDataURL(file);
		return;
	}

	async function uploadAvatar(e: React.MouseEvent<HTMLButtonElement, MouseEvent>): Promise<{}> {
		e.preventDefault();
		try {
			if (preview_data != null) {
				unwrap(await API_FETCHER.updateAvatar(preview_data.split(',')[1]));
			}
			setIsEditing(false);
			location.reload();
		} catch (err) {
			toastErr(err);
		}
		return {};
	}
	return <div className={`${style.avatar} ${style.isMine}`}>
		<ReactModal
			isOpen={is_editing}
			onRequestClose={() => setIsEditing(false)}
			style={{
				overlay: { zIndex: 200 },
				content: {
					position: 'absolute',
					top: '50%',
					left: '50%',
					transform: 'translate(-50%, -50%)',
					right: 'none',
					bottom: 'none',
				}
			}} >
			{
				preview_data ?
					<img src={preview_data} height="144" width="144"></img> :
					<div>出了些問題......</div>
			}
			<div className={style.buttonSet}>
				<button onClick={uploadAvatar}>確定</button>
				<button onClick={() => setIsEditing(false)}>取消</button>
			</div>
		</ReactModal>
		<label htmlFor="fileUploader">
			<img className={style.isMine} src={`/avatar/${props.name}`} alt={`${props.name}的大頭貼`} />
			<div className={style.editPrompt}>
				換頭貼
			</div>
		</label>
		<input
			type="file"
			id="fileUploader"
			data-target="fileUploader"
			accept="image/png, image/jpeg"
			onChange={chooseAvatar} />
	</div>;
}

function Avatar(props: { is_me: boolean, name: string }): JSX.Element {
	if (props.is_me) {
		return <EditAvatar name={props.name} />;
	} else {
		return <div className={style.avatar}>
			<img src={`/avatar/${props.name}`} alt={`${props.name}的大頭貼`} />
		</div>;
	}
}

export {
	Avatar
};