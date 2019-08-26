本文件簡述前後端之 API 如何運作、同步、溝通。

## 原則
碳鍵的 API 使用 GraphQL，並嚴格遵照文件，即 `api/api.gql` 檔案。前後端使用一些技術來自動生成程式碼，務求以自動化流程而非行政手段來達成 API 的統一。

## 後端
使用 `juniper_from_schema` 這一函式庫，主要實現了防呆功能，確保後端實作的型別及名稱嚴格遵照 API 文件。然而該函式庫並無法根據資料庫結構自動生成程式碼，因此，從資料庫提取資料這一步驟仍有賴大家手寫程式。

該函式庫不需要額外的指令去運行，直接啟動伺服器就可以了。

具體實作細節詳見 `src/api` 這一模組。

## 前端
前端使用 graphql-codegen 這一自動工具，以及本專案專用的外掛(詳見 `frontend/gql-codegen-typescript-ajax.js`)，工具的執行指令如下。

```sh
cd frontend
yarn              # 安裝所有需要的工具
yarn api-codegen  # 檢查並生成 frontend/src/ts/api/gql.ts 檔案
```

生成的檔案再用 `frontend/src/ts/api/index.ts` 檔案包裝一次，就完成了所有型別與網路溝通的工作，主體程式碼不需要再寫任何 GQL 語法。

具體實作細節詳見 `frontend/src/ts/api` 模組，工具生成的 ts 檔勉強還可以用肉眼讀懂。

## 案例
以下以實際案例演示前後端 API 如何對接。

如果欲在網站中新增 `登入` 功能，首先必需在 `api/api.gql` 中宣告，並於後端程式碼中將這個功能實作出來。

```graphql
# api/api.gql
type Mutation {
    # ...其它定義...
    login(id: String! password: String!): Boolean! @juniper(ownership: "owned")
    # ...其它定義...
}
```
```rust
// src/api/mutation.rs
graphql_schema_from_file!("api/api.gql", error_type: Error, with_idents: [Mutation]);

impl MutationFields for Mutation {
    fn field_login(/* 參數 */) -> Option<bool> { /* 實作 */ }
}
```

前端要接上這個功能，必需先在 `frontend/operation` 的 `mutation.gql` 中宣告「登入」這個操作。如果是 query 則應該宣告於 `query.gql`。

``` graphql
# frontend/operation/mutation.gql
mutation Login($id: String!, $password: String!) {
	login(id: $id, password: $password)
}
```

之後在命令行執行工具，工具會檢查 `Login` 操作是否符合 `api/api.gql` 。如果檢查通過，就會生成所需的程式碼。以「登入」為例，生成的程式碼可以這樣用：

```typescript
    import { ajaxOperation } from '../ts/api';
    async function onLoginBtnClick(): Promise<boolean> {
	    let return_value: boolean = await ajaxOperation.Login({ id, password });
    }
```