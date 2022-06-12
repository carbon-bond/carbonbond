import * as React from 'react';
import { StyleSheet } from 'react-native';

import { Text, View } from '../components/Themed';
import { RootTabScreenProps } from '../types';

import { api_trait, api_utils } from 'carbonbond-api';
const { API_FETCHER, unwrap_or } = api_utils;

async function fetchBoardList(): Promise<api_trait.Board[]> {
	return unwrap_or(await API_FETCHER.boardQuery.queryBoardList(10), []);
}

export default function TabOneScreen({ navigation }: RootTabScreenProps<'TabOne'>) {
	let [board_list, setBoardList] = React.useState<api_trait.Board[]>([]);
	React.useEffect(() => {
    fetchBoardList().then(board_list => {
			setBoardList(board_list);
		});
	}, []);

  return (
    <View style={styles.container}>
      <Text style={styles.title}>看板列表</Text>
      <View style={styles.separator} lightColor="#eee" darkColor="rgba(255,255,255,0.1)" />
      {
        board_list.map(board => {
          return <Text key={board.id}>
            {board.board_name}
          </Text>
        })
      }
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  separator: {
    marginVertical: 30,
    height: 1,
    width: '80%',
  },
});
