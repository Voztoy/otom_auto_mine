
### 1. Git clone otom_auto_mine

```shell
git clone https://github.com/Voztoy/otom_auto_mine.git
cd otom_auto_mine
npm install -g pnpm
pnpm install
```

### 2. Tạo file .env trong otom_auto_mine

```shell
PRIVATE_KEY=..................//bỏ 0x ở đầu
```
### 3. Mine tự động

- Sửa file mint.bat thành mint.txt để vào thay đổi số lượng muốn mine

```shell
set TIMES=10// thay 10 là số tx muốn mine
```
- Sửa file mint.txt thành mine.bat, rồi click đúp là chạy mint. Mỗi tx là 3 nfts



