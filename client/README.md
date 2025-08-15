### フロントエンド開発ガイド

このプロジェクトのフロントエンドは、TypeScript を使用したシングルページアプリケーション (SPA) として構築されています。

#### 1. コンポーネントの使い方

すべてのUI要素は `client/components` ディレクトリに配置されたコンポーネントとして扱われます。

-   **基本構造**: 各コンポーネントは `client/components/component.ts` に定義されている `Component` クラスを継承します。
    ```typescript
    export abstract class Component {
        abstract render(props: unknown): string;
        addEventListeners(): void {}
    }
    ```
-   **レンダリング**: `render()` メソッドは、コンポーネントのHTML構造を文字列として返します。
-   **イベントリスナー**: `addEventListeners()` メソッドは、コンポーネントがDOMにレンダリングされた後に、そのコンポーネント内の要素にイベントリスナーをアタッチするために使用されます。
-   **共通コンポーネント**: `client/components` ディレクトリ直下には、アプリケーション全体で再利用される共通のUIコンポーネント（例: ボタン、入力フィールド、タイトルなど）が配置されます。

#### 2. ルーティングの設定

ルーティングは `client/router.ts` で管理されています。

-   **ルート定義**: `router.ts` 内の `routes` 配列に、パスとそれに対応するコンポーネントを定義します。
    ```typescript
    import { Navigation } from "./components";
    import { Register } from "./features/auth";
    import { Home } from "./features/home";

    export const router = async () => {
        const container = document.querySelector<HTMLElement>("#app")!;
        const routes = [
            {
                path: "/",
                component: new Navigation(new Home()),
            },
            {
                path: "/auth/register",
                component: new Navigation(new Register()),
            },
        ];
        // ...
    };
    ```
-   **ナビゲーション**: `navigateTo(path: string)` 関数を使用して、プログラム的にルートを切り替えることができます。
-   **リンク**: HTML内で `data-link` 属性を持つ `<a>` タグを使用すると、クライアントサイドルーティングが自動的に適用されます。

#### 3. Feature ベースのディレクトリ構成

`client/features` ディレクトリは、特定の機能（例: 認証、ホーム）に関連するコンポーネントやロジックをまとめるために使用されます。これにより、コードの整理と保守性が向上します。

-   例: `client/features/auth` には認証機能に関連するコンポーネント（`Register` など）が、`client/features/home` にはホーム画面に関連するコンポーネントが配置されています。

#### 4. 共通スキーマ (`shared` ディレクトリ)

`shared` ディレクトリには、フロントエンドとバックエンドで共通して使用される型定義やバリデーションスキーマが格納されています。

-   例: `shared/api/auth.ts` には、認証APIのリクエスト/レスポンスの型や、フォームのバリデーションに使用するZodスキーマが定義されています。これにより、フロントエンドとバックエンド間のデータ整合性が保たれます。

#### 5. Zod を使ったフォームバリデーション

フォームの入力値のバリデーションには [Zod](https://zod.dev/) ライブラリを使用しています。

-   **スキーマ定義**: `shared` ディレクトリに定義されたZodスキーマ（例: `registerUserFormSchema`）をインポートして使用します。
-   **バリデーション実行**: フォームデータは `schema.safeParse(data)` メソッドを使ってバリデーションされます。
-   **エラーハンドリング**: バリデーションエラーが発生した場合、`input.error` オブジェクトを通じて詳細なエラー情報にアクセスできます。`client/components/form/error.ts` にある `annotateZodErrors` 関数は、これらのエラーをUIに表示するために使用されます。
