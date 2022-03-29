import React from 'react';
import { UserState } from '../global_state/user';
import { BottomPanelState } from '../global_state/bottom_panel';
import { SubscribedBoardsState } from '../global_state/subscribed_boards';
import { LocationCacheState } from '../global_state/location_cache';
import { AllChatState } from '../global_state/chat';
import { EditorPanelState } from '../global_state/editor_panel';
import { DraftState } from '../global_state/draft';
import { ConfigState } from '../global_state/config';
import { AliveScope } from 'react-activation';

export function Providers(props: { children: JSX.Element }): JSX.Element {
	return <ConfigState.Provider>
		<AllChatState.Provider>
			<BottomPanelState.Provider>
				<UserState.Provider>
					<DraftState.Provider>
						<SubscribedBoardsState.Provider>
							<EditorPanelState.Provider>
								<LocationCacheState.Provider>
									<AliveScope>
										{props.children}
									</AliveScope>
								</LocationCacheState.Provider>
							</EditorPanelState.Provider>
						</SubscribedBoardsState.Provider>
					</DraftState.Provider>
				</UserState.Provider>
			</BottomPanelState.Provider>
		</AllChatState.Provider>
	</ConfigState.Provider>;
}