import * as React from 'react';
import ReactModal from 'react-modal';
import { API_FETCHER, unwrap } from '../../ts/api/api';
import { toastErr } from '../utils';
import ReactCrop, { Crop } from 'react-image-crop';
import 'react-image-crop/dist/ReactCrop.css';

import style from '../../css/avatar.module.css';

function EditAvatar(props: { name: string }): JSX.Element {
	// const { user_state } = UserState.useContainer();
	const [is_editing, setIsEditing] = React.useState<boolean>(false);
	const [preview_data, setPreviewData] = React.useState<string | null>(null);
	const [image_hash, setImageHash] = React.useState<number>(0);
	const [crop, setCrop] = React.useState<Crop>({
		unit: 'px',
		x: 0,
		y: 0,
		width: 50,
		height: 50,
		aspect: 3 / 3
	});
	const [imageRef, setImageRef] = React.useState<HTMLImageElement | null>(null);

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
	function onImageLoaded(image: HTMLImageElement): boolean {
		setImageRef(image);
		setCrop({
			unit: 'px',
			x: 0,
			y: 0,
			width: Math.min(image.width, image.height),
			height: Math.min(image.width, image.height),
			aspect: 3 / 3
		});
		return false;
	};
	function getCroppedData(image_src: string): string {
		let image = new Image();
		image.src = image_src;
		const canvas = document.createElement('canvas');
		const ctx = canvas.getContext('2d');
		if (!ctx || !imageRef) {
			return '';
		}
		const scaleX = imageRef.naturalWidth / imageRef.width;
		const scaleY = imageRef.naturalHeight / imageRef.height;
		const output_width = Math.min(crop.width * scaleX, 300);
		const output_height = Math.min(crop.height * scaleY, 300);
		canvas.width = output_width;
		canvas.height = output_height;
		ctx.drawImage(image,
					  crop.x * scaleX,
					  crop.y * scaleY,
					  crop.width * scaleX,
					  crop.height * scaleY,
					  0,
					  0,
					  output_width,
					  output_height);
		return canvas.toDataURL('image/jpeg');
	}

	async function uploadAvatar(e: React.MouseEvent<HTMLButtonElement, MouseEvent>): Promise<{}> {
		e.preventDefault();
		try {
			if (preview_data != null) {
				let cropped_data = getCroppedData(preview_data);
				if (cropped_data != '') {
					unwrap(await API_FETCHER.userQuery.updateAvatar(cropped_data.split(',')[1]));
				}
			}
			setImageHash(Date.now());
			setIsEditing(false);
		} catch (err) {
			toastErr(err);
		}
		return {};
	}
	function onCropChange(crop: Crop, _percentage: Crop): void {
		setCrop(crop);
	}
	return <div className={`${style.avatar} ${style.isMine}`}>
		<ReactModal
			isOpen={is_editing}
			onRequestClose={() => setIsEditing(false)}
			shouldCloseOnOverlayClick={false}
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
						<ReactCrop
							src={preview_data}
							crop={crop}
							ruleOfThirds
							onImageLoaded={onImageLoaded}
							onChange={onCropChange}
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
			<img className={style.isMine} src={`/avatar/${props.name}?${image_hash}`} alt={`${props.name}的大頭貼`} />
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