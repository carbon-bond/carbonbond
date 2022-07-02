import * as React from 'react';
import { ScrollView, StyleSheet } from 'react-native';

import { Text } from '../components/Themed';

import { api_trait, api_utils } from 'carbonbond-api/index';
const { unwrap_or } = api_utils;
import { API_FETCHER } from '../api';
import { BoardStackScreenProps } from '../types';

async function fetchBoardList(): Promise<api_trait.Board[]> {
	return unwrap_or(await API_FETCHER.boardQuery.queryBoardList(10), []);
}

export function BoardListScreen({navigation}: BoardStackScreenProps<'BoardList'>): JSX.Element {
	let [board_list, setBoardList] = React.useState<api_trait.Board[]>([]);
	React.useEffect(() => {
		fetchBoardList().then(board_list => {
			setBoardList(board_list);
		})
		.catch(err => console.warn(err));
	}, []);

	return (
		<ScrollView style={styles.container}>
			{
				board_list.map(board => {
					return <Text
						style={styles.board_card}
						key={board.id}
						onPress={() => {
							navigation.push('ArticleList', {
								board_name: board.board_name,
							});
						}}
					>
						{board.board_name}
					</Text>;
				})
			}
		</ScrollView>
	);
}

const styles = StyleSheet.create({
	container: {
		flex: 1,
	},
	board_card: {
		borderWidth: 1,
		borderColor: '#ffffff',
		paddingHorizontal: 20,
		paddingVertical: 20,
		width: '100%',
	}
});
