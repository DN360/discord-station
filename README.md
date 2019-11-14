# Discord-station

音楽ファイルをアップロード、[discordのbot](https://github.com/DN360/Rhythm-Bot)で再生できるようにするアプリケーションです。

# 導入、起動方法

1. このリポジトリを`git clone`するか`zip`でダウンロード
1. `npm install`で必須パッケージをインストール
1. `npm -g i yarn`でyarnをインストール
1. `databases`ディレクトリを作成、`databases/music_station.sqlite`ファイル(空ファイル)を作成する
1. `yarn sequelize db:migrate`でデータベースファイルの初期化を行う
1. `yarn sequelize db:seed:all`でデータベースの初期値を設定
1. `npm run dev`コマンドで開発モードの起動
1. `npm run build`で本番ビルド
1. `npm run start`で本番モードのサーバーが起動
1. `yarn sequelize db:migrate --env production`で本番データベースファイルの初期化を行う
1. `yarn sequelize db:seed:all --env production`で本番データベースの初期値を設定
1. `localhost:3000`でサーバーにアクセス

# botの導入、起動方法

botは[https://github.com/Malexion/Rhythm-Bot](https://github.com/Malexion/Rhythm-Bot)からforkしたものにDiscord-station用のコマンドを追加したものです

1. [discordのbot](https://github.com/DN360/Rhythm-Bot)を`git clone`か`zip`でダウンロード
2. Rhythm-botのREADME.mdに従って必須パッケージをインストール
3. `bot-config-sample.json`を`bot-config.json`としてコピー
3. Discordの開発者用サイトでトークンを取得、設定ファイルに設定する
4. 自身のチャンネルにbotをインストール
5. Discord-stationのsqlite3データベースファイル()を`sqlite3`で開く(インストールは`npm -g i sqlite3`でできる)
6. `select uuid from users where statis = "admin" limit 1`で出てくる`uuid`をコピー
7. `bot-config.json`に貼り付ける
8. `Rhythm-bot`を立ち上げる
9. 接続されるとbotがonlineになるので`.help`でコマンドを確認する
10. 以降は`.help`コマンド通りにbotを用いる
