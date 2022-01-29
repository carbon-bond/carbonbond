import * as React from 'react';
import ReactModal from 'react-modal';
import { API_FETCHER, unwrap } from '../../ts/api/api';
import { toastErr } from '../utils';
import Cropper from 'react-easy-crop';
import { Point, Area } from 'react-easy-crop/types';

import style from '../../css/avatar.module.css';

function EditAvatar(props: { name: string }): JSX.Element {
	// const { user_state } = UserState.useContainer();
	const [is_editing, setIsEditing] = React.useState<boolean>(false);
	const [preview_data, setPreviewData] = React.useState<string | null>(null);
	const [crop, setCrop] = React.useState<Point>({ x: 0, y: 0 });
	const [cropped_area, setCroppedArea] = React.useState<Area>({x: 0, y: 0, height: 0, width: 0});
	const [zoom, setZoom] = React.useState(1);

	const onCropComplete = React.useCallback(
		(_cropped_area: Area, cropped_area_pixels: Area) => {
			setCroppedArea(cropped_area_pixels);
		},
		[]
	);

	function chooseAvatar(e: React.ChangeEvent<HTMLInputElement>): void {
		e.preventDefault();

		if (e.target.files == null) {
			return;
		}

		let reader = new FileReader();
		let file = e.target.files[0];
		e.target.value = '';

		reader.onloadend = () => {
			setPreviewData(reader.result as string); // 因為使用 readAsDataURL ，故 result 為字串
			setIsEditing(true);
		};

		reader.readAsDataURL(file);
		return;
	}

	function CropAvatar(image_src: string, pixel_crop: Area): string {
		let image = new Image();
		image.src = image_src;
		const canvas = document.createElement('canvas');
		const ctx = canvas.getContext('2d');
		if (!ctx) {
			return '';
		}
		canvas.width = pixel_crop.width;
		canvas.height = pixel_crop.height;
		ctx.drawImage(image,
					  pixel_crop.x, pixel_crop.y, pixel_crop.width, pixel_crop.height,
					  0, 0, canvas.width, canvas.height);
		return canvas.toDataURL('image/png');
	}

	async function uploadAvatar(e: React.MouseEvent<HTMLButtonElement, MouseEvent>): Promise<{}> {
		e.preventDefault();
		try {
			if (preview_data != null) {
				let cropped_data = CropAvatar(preview_data, cropped_area);
				if (cropped_data != '') {
					unwrap(await API_FETCHER.userQuery.updateAvatar(cropped_data.split(',')[1]));
				}
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
					<div className={style.cropper}>
						<Cropper
							image={preview_data}
							crop={crop}
							zoom={zoom}
							aspect={3 / 3}
							onCropChange={setCrop}
							onCropComplete={onCropComplete}
							onZoomChange={setZoom}
						/>
					</div> :
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