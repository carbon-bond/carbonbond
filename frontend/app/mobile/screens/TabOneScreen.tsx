import * as React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

import { BoardStackParamList } from '../types';
import { BoardListScreen } from './BoardListScreen';
import { ArticleListScreen } from './ArticleListScreen';
import { ArticleDetailScreen } from './ArticleDetailScreen';

const BoardStack = createNativeStackNavigator<BoardStackParamList>();

export default function TabOneScreen(): JSX.Element {
	return (
		<BoardStack.Navigator initialRouteName="BoardList">
			<BoardStack.Screen name="BoardList" component={BoardListScreen} />
			<BoardStack.Screen name="ArticleList" component={ArticleListScreen} />
			<BoardStack.Screen name="ArticleDetail" component={ArticleDetailScreen} />
		</BoardStack.Navigator>
	);
}
