/*eslint-disable*/
export type MentionInComment = {     article_id: number; comment_id: number; author_id: number;     comment_content: string };
export type API = 
 | { MentionedInComment: MentionInComment };
