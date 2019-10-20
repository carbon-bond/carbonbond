import * as React from 'react';
// import { UserState } from './global_state';
import { toast } from 'react-toastify';
import { matchErrAndShow, ajaxOperation } from '../ts/api';

function EditAvatar(): JSX.Element {
	// const { user_state } = UserState.useContainer();
	const [previewData, setPreviewData] = React.useState<string | null>(null);

	function chooseAvatar(e: React.ChangeEvent<HTMLInputElement>): void {
		e.preventDefault();

		if (e.target.files == null) {
			return;
		}

		let reader = new FileReader();
		let file = e.target.files[0];

		reader.onloadend = () => {
			setPreviewData(reader.result as string); // 因爲使用 readAsDataURL ，故 result 爲字串
		};

		reader.readAsDataURL(file);
		return;
	}

	async function uploadAvatar(e: React.MouseEvent<HTMLButtonElement, MouseEvent>): Promise<{}> {
		e.preventDefault();
		try {
			if (previewData != null) {
				await ajaxOperation.UpdateProfile({avatar: previewData.split(',')[1]});
			}
			toast('已更新大頭貼');
		} catch (err) {
			matchErrAndShow(err);
		}
		return {};
	}

	return <div>
		<input
			type="file"
			id="file-uploader"
			data-target="file-uploader"
			accept="image/png, image/jpeg"
			onChange={chooseAvatar}/>
		<button onClick={uploadAvatar}>上傳</button>
		{
			previewData ?
				<img src={previewData} height="144" width="144"></img> :
				<></>
		}
	</div>;
}

function EditProfilePage(): JSX.Element {
	return <div>
		<div>編輯個人資料</div>
		<EditAvatar />
	</div>;
}

export {
	EditProfilePage
};