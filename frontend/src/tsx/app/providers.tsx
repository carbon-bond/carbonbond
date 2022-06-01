import React from 'react';
import { UserState } from '../global_state/user';
import { BottomPanelState } from '../global_state/bottom_panel';
import { SubscribedBoardsState } from '../global_state/subscribed_boards';
import { LocationState } from '../global_state/location';
import { AllChatState } from '../global_state/chat';
import { EditorPanelState } from '../global_state/editor_panel';
import { DraftState } from '../global_state/draft';
import { ConfigState } from '../global_state/config';
import { AliveScope } from 'react-activation';
import { NotificationState } from '../global_state/notification';

export function Providers(props: { children: JSX.Element }): JSX.Element {
	return <ConfigState.Provider>
		<AllChatState.Provider>
			<BottomPanelState.Provider>
				<UserState.Provider>
					<DraftState.Provider>
						<SubscribedBoardsState.Provider>
							<EditorPanelState.Provider>
								<LocationState.Provider>
									<NotificationState.Provider>
										<AliveScope>
											{props.children}
										</AliveScope>
									</NotificationState.Provider>
								</LocationState.Provider>
							</EditorPanelState.Provider>
						</SubscribedBoardsState.Provider>
					</DraftState.Provider>
				</UserState.Provider>
			</BottomPanelState.Provider>
		</AllChatState.Provider>
	</ConfigState.Provider>;
}