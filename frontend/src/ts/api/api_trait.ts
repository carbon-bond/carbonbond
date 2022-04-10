/*eslint-disable*/
export type BoxedErr = string
export type ValidationError = string
export type ForceLangError = string
// @ts-ignore
export type HashMap<K extends string | number, T> = { [key: K]: T };
export type Option<T> = T | null;
export type Result<T, E> = {
    'Ok': T
} | {
    'Err': E
};
export type Fetcher = (query: Object) => Promise<string>;
export type User = {     id: number; user_name: string; email: string; energy: number;     sentence: string; hater_count_public: number; hater_count_private:     number; follower_count_public: number; follower_count_private: number; hating_count_public: number; hating_count_private: number;     following_count_public: number; following_count_private: number;     introduction: string; gender: string; birth_year: number; job:     string; city: string; titles: string | null };
export type UserMini = { id: number; user_name: string; energy: number; sentence: string };
export type LawyerbcResultMini = { name: string; now_lic_no: string };
export type LawyerbcResult = {     name: string; sex: string; id_no: string; now_lic_no: string;     birthsday: number; email: string };
export type Party = {     id: number; party_name: string; board_id: number | null; board_name: string | null; energy: number; ruling: boolean; create_time:     string};
export enum BoardType { General = "General", Personal = "Personal" };
export type Board = {     id: number; board_name: string; board_type: BoardType; create_time:     string; title: string; detail: string; force: force.Force; ruling_party_id: number; popularity: number };
export type BoardName = { id: number; board_name: string };
export type NewBoard = {     board_name: string; board_type: BoardType; title: string; detail:     string; force: force.Force; ruling_party_id: number };
export type ArticlePersonalMeta = { is_favorite: boolean; is_tracking: boolean };
export type ArticleDigest = { content: string; truncated: boolean };
export type Author = 
 | { NamedAuthor: { id: number; name: string } } 
 | "MyAnonymous" 
 | "Anonymous";
export type NewArticle = {     board_id: number; category_name: string; title: string; content:     string; bonds: force.Bond []; draft_id: number | null; anonymous:     boolean };
export type ArticleMeta = {     id: number; energy: number; board_id: number; board_name: string;     board_type: BoardType; category: string; title: string; author:     Author; digest: ArticleDigest; create_time: string; fields: force.Field []; stat: ArticleStatistics; personal_meta:     ArticlePersonalMeta };
export type SignupInvitationCredit = {     id: number; event_name: string; credit: number; create_time:     string};
export type SignupInvitation = {     email: string; user_name: string | null; create_time: string; is_used: boolean };
export type ArticleStatistics = { replies: number; comments: number };
export type BondInfo = { article_meta: MiniArticleMeta; energy: number; tag: string };
export type MiniArticleMeta = {     category: string; board_name: string; board_type: BoardType; author: Author; id: number; title: string; create_time: string};
export type ArticleMetaWithBonds = { meta: ArticleMeta; bonds: BondInfo [] };
export type Article = { meta: ArticleMeta; bonds: BondInfo []; content: string };
export type Comment = {     id: number; author: Author; create_time: string; content:     string };
export type Draft = {     id: number; author_id: number; board_id: number; board_name: string; category: string | null; title: string; content: string; bonds:     string; create_time: string; edit_time: string;     anonymous: boolean };
export type BoardOverview = {     id: number; board_name: string; board_type: BoardType; title:     string; popularity: number };
export enum UserRelationKind { Follow = "Follow", Hate = "Hate", None = "None" };
export type UserRelation = {     from_user: number; to_user: number; kind: UserRelationKind;     is_public: boolean };
export enum NotificationKind {     Follow = "Follow", Hate = "Hate", ArticleReplied = "ArticleReplied",     ArticleGoodReplied = "ArticleGoodReplied", ArticleBadReplied =     "ArticleBadReplied", CommentReplied = "CommentReplied" };
export type Notification = {     id: number; kind: NotificationKind; user_id: number; read: boolean; quality: boolean | null; create_time: string; board_name:     string | null; board_type: BoardType | null; board_id: number | null;     user2_name: string | null; user2_id: number | null; article1_title:     string | null; article2_title: string | null; article1_id: number |     null; article2_id: number | null };
export type SearchField = 
 | { String: string } 
 | { Range: [number, number] };
export type Edge = {     id: number; from: number; to: number; energy: number; tag: string     | null };
export type Graph = { nodes: ArticleMeta []; edges: Edge [] };
export type Config = { min_password_length: number; max_password_length: number };
export namespace force {
export type Bond = { to: number; tag: string };
export type Category = { name: string; fields: Field [] };
export type Field = { name: string; kind: FieldKind };
export enum FieldKind { Number = "Number", OneLine = "OneLine", MultiLine = "MultiLine" };
export type Force = { categories: Category []; suggested_tags: string [] };
}
export type MessageSending = { channel_id: number; content: string };
export namespace client_trigger {
export type API = 
 | { MessageSending: MessageSending };
}
export namespace server_trigger {
export type API = 
 | { InitInfo: InitInfo } 
 | { MessageSending: MessageSending } 
 | { NewChannel: Channel };
export type InitInfo = { channels: Channel [] };
export enum Sender { Myself = "Myself", Opposite = "Opposite" };
export type Message = { id: number; sender: Sender; text: string; time: string};
export type Direct = {     channel_id: number; opposite_id: number; name: string; last_msg:     Message; read_time: string};
export type WithAnonymousAuthor = { channel_id: number; article_name: string; last_msg: Message };
export type IAmAnonymousAuthor = { channel_id: number; article_name: string; last_msg: Message };
export type Channel = 
 | { Direct: Direct } 
 | { WithAnonymousAuthor: WithAnonymousAuthor } 
 | { IAmAnonymousAuthor: IAmAnonymousAuthor };
}
export enum DataType {     DirectChannel = "DirectChannel", Category = "Category", IntField =     "IntField", StringField = "StringField", BondField = "BondField", Board =     "Board", Article = "Article", Party = "Party", User = "User", Email =     "Email", Notification = "Notification", SignupToken = "SignupToken",     ResetPasswordToken = "ResetPasswordToken" };
export type ErrorCode = 
 | "NeedLogin" 
 | "PermissionDenied" 
 | "CreditExhausted" 
 | { NotFound: [DataType, string] } 
 | "DuplicateInvitation" 
 | "DuplicateRegister" 
 | "NotAllowSelfSignup" 
 | "PasswordLength" 
 | "ParsingJson" 
 | "SearchingLawyerbcFail" 
 | { ArgumentFormatError: string } 
 | { ForceValidate: ValidationError } 
 | { ForceLangError: ForceLangError } 
 | "UnImplemented" 
 | { Other: string };
export type Error = 
 | { OperationError: { msg: string [] } } 
 | { LogicError: { msg: string []; code: ErrorCode } } 
 | { InternalError: { msg: string []; source: BoxedErr } };
export class RootQuery {
    fetchResult: Fetcher;
    chatQuery: ChatQuery
    userQuery: UserQuery
    partyQuery: PartyQuery
    articleQuery: ArticleQuery
    boardQuery: BoardQuery
    notificationQuery: NotificationQuery
    configQuery: ConfigQuery
    constructor(fetcher: Fetcher){
        this.fetchResult = fetcher
        this.chatQuery = new ChatQuery(fetcher)
        this.userQuery = new UserQuery(fetcher)
        this.partyQuery = new PartyQuery(fetcher)
        this.articleQuery = new ArticleQuery(fetcher)
        this.boardQuery = new BoardQuery(fetcher)
        this.notificationQuery = new NotificationQuery(fetcher)
        this.configQuery = new ConfigQuery(fetcher)
    }
}

export class ChatQuery {
    fetchResult: Fetcher;
    constructor(fetcher: Fetcher){
        this.fetchResult = fetcher
    }
    async createChatIfNotExist(opposite_id: number, msg: string): Promise<Result<number, Error>> {
        return JSON.parse(await this.fetchResult({ "Chat": { "CreateChatIfNotExist": { opposite_id, msg } } }));
    }
    async queryDirectChatHistory(chat_id: number, last_msg_id: number, number: number): Promise<Result<Array<server_trigger.Message>, Error>> {
        return JSON.parse(await this.fetchResult({ "Chat": { "QueryDirectChatHistory": { chat_id, last_msg_id, number } } }));
    }
    async updateReadTime(chat_id: number): Promise<Result<null, Error>> {
        return JSON.parse(await this.fetchResult({ "Chat": { "UpdateReadTime": { chat_id } } }));
    }
}

export class UserQuery {
    fetchResult: Fetcher;
    constructor(fetcher: Fetcher){
        this.fetchResult = fetcher
    }
    async queryMe(): Promise<Result<Option<User>, Error>> {
        return JSON.parse(await this.fetchResult({ "User": { "QueryMe": {  } } }));
    }
    async queryMyPartyList(): Promise<Result<Array<Party>, Error>> {
        return JSON.parse(await this.fetchResult({ "User": { "QueryMyPartyList": {  } } }));
    }
    async queryMyFavoriteArticleList(): Promise<Result<Array<ArticleMetaWithBonds>, Error>> {
        return JSON.parse(await this.fetchResult({ "User": { "QueryMyFavoriteArticleList": {  } } }));
    }
    async querySearchResultFromLawyerbc(search_text: string): Promise<Result<Array<LawyerbcResultMini>, Error>> {
        return JSON.parse(await this.fetchResult({ "User": { "QuerySearchResultFromLawyerbc": { search_text } } }));
    }
    async queryDetailResultFromLawyerbc(license_id: string): Promise<Result<LawyerbcResult, Error>> {
        return JSON.parse(await this.fetchResult({ "User": { "QueryDetailResultFromLawyerbc": { license_id } } }));
    }
    async recordSignupApply(email: string, birth_year: number, gender: string, license_id: string, is_invite: boolean): Promise<Result<null, Error>> {
        return JSON.parse(await this.fetchResult({ "User": { "RecordSignupApply": { email, birth_year, gender, license_id, is_invite } } }));
    }
    async sendSignupEmail(email: string, is_invite: boolean): Promise<Result<null, Error>> {
        return JSON.parse(await this.fetchResult({ "User": { "SendSignupEmail": { email, is_invite } } }));
    }
    async sendResetPasswordEmail(email: string): Promise<Result<null, Error>> {
        return JSON.parse(await this.fetchResult({ "User": { "SendResetPasswordEmail": { email } } }));
    }
    async signup(user_name: string, password: string, token: string): Promise<Result<User, Error>> {
        return JSON.parse(await this.fetchResult({ "User": { "Signup": { user_name, password, token } } }));
    }
    async queryEmailByToken(token: string): Promise<Result<string, Error>> {
        return JSON.parse(await this.fetchResult({ "User": { "QueryEmailByToken": { token } } }));
    }
    async queryUserNameByResetPasswordToken(token: string): Promise<Result<Option<string>, Error>> {
        return JSON.parse(await this.fetchResult({ "User": { "QueryUserNameByResetPasswordToken": { token } } }));
    }
    async resetPasswordByToken(password: string, token: string): Promise<Result<null, Error>> {
        return JSON.parse(await this.fetchResult({ "User": { "ResetPasswordByToken": { password, token } } }));
    }
    async login(user_name: string, password: string): Promise<Result<Option<User>, Error>> {
        return JSON.parse(await this.fetchResult({ "User": { "Login": { user_name, password } } }));
    }
    async logout(): Promise<Result<null, Error>> {
        return JSON.parse(await this.fetchResult({ "User": { "Logout": {  } } }));
    }
    async queryUser(name: string): Promise<Result<User, Error>> {
        return JSON.parse(await this.fetchResult({ "User": { "QueryUser": { name } } }));
    }
    async querySubcribedBoards(): Promise<Result<Array<BoardOverview>, Error>> {
        return JSON.parse(await this.fetchResult({ "User": { "QuerySubcribedBoards": {  } } }));
    }
    async subscribeBoard(board_id: number): Promise<Result<null, Error>> {
        return JSON.parse(await this.fetchResult({ "User": { "SubscribeBoard": { board_id } } }));
    }
    async unsubscribeBoard(board_id: number): Promise<Result<null, Error>> {
        return JSON.parse(await this.fetchResult({ "User": { "UnsubscribeBoard": { board_id } } }));
    }
    async favoriteArticle(article_id: number): Promise<Result<number, Error>> {
        return JSON.parse(await this.fetchResult({ "User": { "FavoriteArticle": { article_id } } }));
    }
    async unfavoriteArticle(article_id: number): Promise<Result<null, Error>> {
        return JSON.parse(await this.fetchResult({ "User": { "UnfavoriteArticle": { article_id } } }));
    }
    async trackingArticle(article_id: number): Promise<Result<number, Error>> {
        return JSON.parse(await this.fetchResult({ "User": { "TrackingArticle": { article_id } } }));
    }
    async untrackingArticle(article_id: number): Promise<Result<null, Error>> {
        return JSON.parse(await this.fetchResult({ "User": { "UntrackingArticle": { article_id } } }));
    }
    async createUserRelation(target_user: number, kind: UserRelationKind, is_public: boolean): Promise<Result<null, Error>> {
        return JSON.parse(await this.fetchResult({ "User": { "CreateUserRelation": { target_user, kind, is_public } } }));
    }
    async deleteUserRelation(target_user: number): Promise<Result<null, Error>> {
        return JSON.parse(await this.fetchResult({ "User": { "DeleteUserRelation": { target_user } } }));
    }
    async queryUserRelation(target_user: number): Promise<Result<UserRelation, Error>> {
        return JSON.parse(await this.fetchResult({ "User": { "QueryUserRelation": { target_user } } }));
    }
    async queryPublicFollowerList(user: number): Promise<Result<Array<UserMini>, Error>> {
        return JSON.parse(await this.fetchResult({ "User": { "QueryPublicFollowerList": { user } } }));
    }
    async queryPublicHaterList(user: number): Promise<Result<Array<UserMini>, Error>> {
        return JSON.parse(await this.fetchResult({ "User": { "QueryPublicHaterList": { user } } }));
    }
    async queryPublicFollowingList(user: number): Promise<Result<Array<UserMini>, Error>> {
        return JSON.parse(await this.fetchResult({ "User": { "QueryPublicFollowingList": { user } } }));
    }
    async queryPublicHatingList(user: number): Promise<Result<Array<UserMini>, Error>> {
        return JSON.parse(await this.fetchResult({ "User": { "QueryPublicHatingList": { user } } }));
    }
    async queryMyPrivateFollowingList(): Promise<Result<Array<UserMini>, Error>> {
        return JSON.parse(await this.fetchResult({ "User": { "QueryMyPrivateFollowingList": {  } } }));
    }
    async queryMyPrivateHatingList(): Promise<Result<Array<UserMini>, Error>> {
        return JSON.parse(await this.fetchResult({ "User": { "QueryMyPrivateHatingList": {  } } }));
    }
    async querySignupInvitationCreditList(): Promise<Result<Array<SignupInvitationCredit>, Error>> {
        return JSON.parse(await this.fetchResult({ "User": { "QuerySignupInvitationCreditList": {  } } }));
    }
    async querySignupInvitationList(): Promise<Result<Array<SignupInvitation>, Error>> {
        return JSON.parse(await this.fetchResult({ "User": { "QuerySignupInvitationList": {  } } }));
    }
    async updateAvatar(image: string): Promise<Result<null, Error>> {
        return JSON.parse(await this.fetchResult({ "User": { "UpdateAvatar": { image } } }));
    }
    async updateSentence(sentence: string): Promise<Result<null, Error>> {
        return JSON.parse(await this.fetchResult({ "User": { "UpdateSentence": { sentence } } }));
    }
    async updateInformation(introduction: string, job: string, city: string): Promise<Result<null, Error>> {
        return JSON.parse(await this.fetchResult({ "User": { "UpdateInformation": { introduction, job, city } } }));
    }
}

export class PartyQuery {
    fetchResult: Fetcher;
    constructor(fetcher: Fetcher){
        this.fetchResult = fetcher
    }
    async queryParty(party_name: string): Promise<Result<Party, Error>> {
        return JSON.parse(await this.fetchResult({ "Party": { "QueryParty": { party_name } } }));
    }
    async createParty(party_name: string, board_name: Option<string>): Promise<Result<number, Error>> {
        return JSON.parse(await this.fetchResult({ "Party": { "CreateParty": { party_name, board_name } } }));
    }
    async queryBoardPartyList(board_id: number): Promise<Result<Array<Party>, Error>> {
        return JSON.parse(await this.fetchResult({ "Party": { "QueryBoardPartyList": { board_id } } }));
    }
}

export class ArticleQuery {
    fetchResult: Fetcher;
    constructor(fetcher: Fetcher){
        this.fetchResult = fetcher
    }
    async queryArticleList(count: number, max_id: Option<number>, author_name: Option<string>, board_name: Option<string>): Promise<Result<Array<ArticleMetaWithBonds>, Error>> {
        return JSON.parse(await this.fetchResult({ "Article": { "QueryArticleList": { count, max_id, author_name, board_name } } }));
    }
    async queryArticle(id: number): Promise<Result<Article, Error>> {
        return JSON.parse(await this.fetchResult({ "Article": { "QueryArticle": { id } } }));
    }
    async queryArticleMeta(id: number): Promise<Result<ArticleMeta, Error>> {
        return JSON.parse(await this.fetchResult({ "Article": { "QueryArticleMeta": { id } } }));
    }
    async queryBonder(id: number, category_set: Option<Array<string>>): Promise<Result<Array<[Edge, Article]>, Error>> {
        return JSON.parse(await this.fetchResult({ "Article": { "QueryBonder": { id, category_set } } }));
    }
    async queryBonderMeta(id: number, category_set: Option<Array<string>>): Promise<Result<Array<[Edge, ArticleMeta]>, Error>> {
        return JSON.parse(await this.fetchResult({ "Article": { "QueryBonderMeta": { id, category_set } } }));
    }
    async queryCommentList(article_id: number): Promise<Result<Array<Comment>, Error>> {
        return JSON.parse(await this.fetchResult({ "Article": { "QueryCommentList": { article_id } } }));
    }
    async createComment(article_id: number, content: string): Promise<Result<number, Error>> {
        return JSON.parse(await this.fetchResult({ "Article": { "CreateComment": { article_id, content } } }));
    }
    async createArticle(new_article: NewArticle): Promise<Result<number, Error>> {
        return JSON.parse(await this.fetchResult({ "Article": { "CreateArticle": { new_article } } }));
    }
    async saveDraft(draft_id: Option<number>, board_id: number, category_name: Option<string>, title: string, content: string, bonds: string, anonymous: boolean): Promise<Result<number, Error>> {
        return JSON.parse(await this.fetchResult({ "Article": { "SaveDraft": { draft_id, board_id, category_name, title, content, bonds, anonymous } } }));
    }
    async queryDraft(): Promise<Result<Array<Draft>, Error>> {
        return JSON.parse(await this.fetchResult({ "Article": { "QueryDraft": {  } } }));
    }
    async deleteDraft(draft_id: number): Promise<Result<null, Error>> {
        return JSON.parse(await this.fetchResult({ "Article": { "DeleteDraft": { draft_id } } }));
    }
    async searchArticle(author_name: Option<string>, board_name: Option<string>, start_time: Option<string>, end_time: Option<string>, category: Option<string>, title: Option<string>, content: HashMap<string,SearchField>): Promise<Result<Array<ArticleMetaWithBonds>, Error>> {
        return JSON.parse(await this.fetchResult({ "Article": { "SearchArticle": { author_name, board_name, start_time, end_time, category, title, content } } }));
    }
    async searchPopArticle(count: number): Promise<Result<Array<ArticleMetaWithBonds>, Error>> {
        return JSON.parse(await this.fetchResult({ "Article": { "SearchPopArticle": { count } } }));
    }
    async getSubscribeArticle(count: number): Promise<Result<Array<ArticleMetaWithBonds>, Error>> {
        return JSON.parse(await this.fetchResult({ "Article": { "GetSubscribeArticle": { count } } }));
    }
    async queryGraph(article_id: number, category_set: Option<Array<string>>): Promise<Result<Graph, Error>> {
        return JSON.parse(await this.fetchResult({ "Article": { "QueryGraph": { article_id, category_set } } }));
    }
}

export class BoardQuery {
    fetchResult: Fetcher;
    constructor(fetcher: Fetcher){
        this.fetchResult = fetcher
    }
    async queryBoardList(count: number): Promise<Result<Array<Board>, Error>> {
        return JSON.parse(await this.fetchResult({ "Board": { "QueryBoardList": { count } } }));
    }
    async queryBoardNameList(): Promise<Result<Array<BoardName>, Error>> {
        return JSON.parse(await this.fetchResult({ "Board": { "QueryBoardNameList": {  } } }));
    }
    async queryBoard(name: string, style: string): Promise<Result<Board, Error>> {
        return JSON.parse(await this.fetchResult({ "Board": { "QueryBoard": { name, style } } }));
    }
    async queryBoardById(id: number): Promise<Result<Board, Error>> {
        return JSON.parse(await this.fetchResult({ "Board": { "QueryBoardById": { id } } }));
    }
    async querySubscribedUserCount(id: number): Promise<Result<number, Error>> {
        return JSON.parse(await this.fetchResult({ "Board": { "QuerySubscribedUserCount": { id } } }));
    }
    async createBoard(new_board: NewBoard): Promise<Result<number, Error>> {
        return JSON.parse(await this.fetchResult({ "Board": { "CreateBoard": { new_board } } }));
    }
    async queryHotBoards(): Promise<Result<Array<BoardOverview>, Error>> {
        return JSON.parse(await this.fetchResult({ "Board": { "QueryHotBoards": {  } } }));
    }
}

export class NotificationQuery {
    fetchResult: Fetcher;
    constructor(fetcher: Fetcher){
        this.fetchResult = fetcher
    }
    async queryNotificationByUser(all: boolean): Promise<Result<Array<Notification>, Error>> {
        return JSON.parse(await this.fetchResult({ "Notification": { "QueryNotificationByUser": { all } } }));
    }
    async readNotifications(ids: Array<number>): Promise<Result<null, Error>> {
        return JSON.parse(await this.fetchResult({ "Notification": { "ReadNotifications": { ids } } }));
    }
}

export class ConfigQuery {
    fetchResult: Fetcher;
    constructor(fetcher: Fetcher){
        this.fetchResult = fetcher
    }
    async queryConfig(): Promise<Result<Config, Error>> {
        return JSON.parse(await this.fetchResult({ "Config": { "QueryConfig": {  } } }));
    }
}

