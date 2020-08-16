/*eslint-disable*/
export type Option<T> = T | null;
export type Result<T, E> = {
    'Ok': T
} | {
    'Err': E
};
export type User = {     id: number; user_name: string; energy: number; sentence: string;     invitation_credit: number; hated_count: number; followed_count:     number; hating_count: number; following_count: number };
export type Party = {     id: number; party_name: string; board_id: number | null; board_name: string | null; energy: number; ruling: boolean; create_time:     string};
export type Board = {     id: number; board_name: string; create_time: string; title: string; detail: string; force: string; ruling_party_id: number;     popularity: number };
export type BoardName = { id: number; board_name: string };
export type NewBoard = {     board_name: string; title: string; detail: string; force: string;     ruling_party_id: number };
export type Article = {     id: number; category: string; title: string; energy: number;     create_time: string; root_id: number; author_id: number;     author_name: string; content: string []; board_id: number;     board_name: string };
export type BoardOverview = { id: number; board_name: string; title: string; popularity: number };
export enum UserRelationKind { Follow = "Follow", Hate = "Hate", OpenlyHate = "OpenlyHate" };
export type UserRelation = { from_user: number; to_user: number; kind: UserRelationKind };
export abstract class RootQueryFetcher {
    abstract fetchResult(query: Object): Promise<string>;
    async queryMe(): Promise<Result<Option<User>, any>> {
        return JSON.parse(await this.fetchResult({ "User": { "QueryMe": {  } } }));
    }
    async queryMyPartyList(): Promise<Result<Array<Party>, any>> {
        return JSON.parse(await this.fetchResult({ "User": { "QueryMyPartyList": {  } } }));
    }
    async sendSignupEmail(email: string): Promise<Result<null, any>> {
        return JSON.parse(await this.fetchResult({ "User": { "SendSignupEmail": { email } } }));
    }
    async signup(password: string, token: string, user_name: string): Promise<Result<User, any>> {
        return JSON.parse(await this.fetchResult({ "User": { "Signup": { password, token, user_name } } }));
    }
    async login(password: string, user_name: string): Promise<Result<Option<User>, any>> {
        return JSON.parse(await this.fetchResult({ "User": { "Login": { password, user_name } } }));
    }
    async logout(): Promise<Result<null, any>> {
        return JSON.parse(await this.fetchResult({ "User": { "Logout": {  } } }));
    }
    async queryUser(name: string): Promise<Result<User, any>> {
        return JSON.parse(await this.fetchResult({ "User": { "QueryUser": { name } } }));
    }
    async querySubcribedBoards(): Promise<Result<Array<BoardOverview>, any>> {
        return JSON.parse(await this.fetchResult({ "User": { "QuerySubcribedBoards": {  } } }));
    }
    async subscribeBoard(board_id: number): Promise<Result<null, any>> {
        return JSON.parse(await this.fetchResult({ "User": { "SubscribeBoard": { board_id } } }));
    }
    async unsubscribeBoard(board_id: number): Promise<Result<null, any>> {
        return JSON.parse(await this.fetchResult({ "User": { "UnsubscribeBoard": { board_id } } }));
    }
    async createUserRelation(kind: UserRelationKind, target_user: number): Promise<Result<null, any>> {
        return JSON.parse(await this.fetchResult({ "User": { "CreateUserRelation": { kind, target_user } } }));
    }
    async queryParty(party_name: string): Promise<Result<Party, any>> {
        return JSON.parse(await this.fetchResult({ "Party": { "QueryParty": { party_name } } }));
    }
    async createParty(board_name: Option<string>, party_name: string): Promise<Result<null, any>> {
        return JSON.parse(await this.fetchResult({ "Party": { "CreateParty": { board_name, party_name } } }));
    }
    async queryArticleList(author_name: Option<string>, board_name: Option<string>, count: number): Promise<Result<Array<Article>, any>> {
        return JSON.parse(await this.fetchResult({ "Article": { "QueryArticleList": { author_name, board_name, count } } }));
    }
    async queryArticle(id: number): Promise<Result<Article, any>> {
        return JSON.parse(await this.fetchResult({ "Article": { "QueryArticle": { id } } }));
    }
    async createArticle(board_id: number, category_name: string, content: string): Promise<Result<null, any>> {
        return JSON.parse(await this.fetchResult({ "Article": { "CreateArticle": { board_id, category_name, content } } }));
    }
    async queryBoardList(count: number): Promise<Result<Array<Board>, any>> {
        return JSON.parse(await this.fetchResult({ "Board": { "QueryBoardList": { count } } }));
    }
    async queryBoardNameList(): Promise<Result<Array<BoardName>, any>> {
        return JSON.parse(await this.fetchResult({ "Board": { "QueryBoardNameList": {  } } }));
    }
    async queryBoard(name: string): Promise<Result<Board, any>> {
        return JSON.parse(await this.fetchResult({ "Board": { "QueryBoard": { name } } }));
    }
    async queryBoardById(id: number): Promise<Result<Board, any>> {
        return JSON.parse(await this.fetchResult({ "Board": { "QueryBoardById": { id } } }));
    }
    async querySubscribedUserCount(id: number): Promise<Result<number, any>> {
        return JSON.parse(await this.fetchResult({ "Board": { "QuerySubscribedUserCount": { id } } }));
    }
    async createBoard(new_board: NewBoard): Promise<Result<number, any>> {
        return JSON.parse(await this.fetchResult({ "Board": { "CreateBoard": { new_board } } }));
    }
    async queryHotBoards(): Promise<Result<Array<BoardOverview>, any>> {
        return JSON.parse(await this.fetchResult({ "Board": { "QueryHotBoards": {  } } }));
    }
}
