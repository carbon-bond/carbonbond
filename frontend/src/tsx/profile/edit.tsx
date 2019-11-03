import * as React from 'react';
import ReactModal from 'react-modal';
import '../../css/user_page.css';
// import { toast } from 'react-toastify';
import { matchErrAndShow, ajaxOperation } from '../../ts/api';

function EditAvatar(props: { name: string }): JSX.Element {
	// const { user_state } = UserState.useContainer();
	const [is_editing, setIsEditing] = React.useState<boolean>(false);
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
			setIsEditing(true);
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
			setIsEditing(false);
			location.reload();
		} catch (err) {
			matchErrAndShow(err);
		}
		return {};
	}
	return <div styleName="avatar isMine">
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
				previewData ?
					<img src={previewData} height="144" width="144"></img> :
					<div>出了些問題......</div>
			}
			<div styleName="buttonSet">
				<button onClick={uploadAvatar}>確定</button>
				<button onClick={() => setIsEditing(false)}>取消</button>
			</div>
		</ReactModal>
		<label htmlFor="fileUploader">
			<img styleName="isMine" src={`/avatar/${props.name}`} alt={`${props.name}的大頭貼`} />
			<div styleName="editPrompt">
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

type EditType = { type: 'radio',  name: string, options: string[] }
| { type: 'text', name: string };

function EditItem(props: EditType): JSX.Element {
	switch (props.type) {
		case 'radio': {
			return <div>
				{props.name}
				{
					props.options.map(option => {
						let id = `${props.name}-${option}`;
						return <div>
							<input type="radio" name={props.name} id={id} key={option} value={option} />
							<label htmlFor={id}>{option}</label>
						</div>;
					})
				}
			</div>;
		}
		case 'text': {
			return <div>
				{props.name}
				<input type="text" name={props.name} />
			</div>;
		}
	}
}

export {
	EditAvatar,
	EditItem
};