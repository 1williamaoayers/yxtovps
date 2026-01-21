# 馃殌 Cloudflare 浼橀€?IP 宸ュ叿 (Web 绠＄悊闈㈡澘鐗?

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Docker](https://img.shields.io/badge/Docker-Ready-blue.svg)](https://www.docker.com/)
[![GitHub Actions](https://github.com/1williamaoayers/yxtovps/workflows/Build%20and%20Publish%20Docker%20Image/badge.svg)](https://github.com/1williamaoayers/yxtovps/actions)
[![Multi-Arch](https://img.shields.io/badge/arch-amd64%20%7C%20arm64-blue)](https://github.com/1williamaoayers/yxtovps/pkgs/container/yxtovps)

涓€涓熀浜?Docker 鐨?Cloudflare CDN 鑺傜偣浼橀€夊伐鍏凤紝甯︽湁鐜颁唬鍖栫殑 Web 绠＄悊鐣岄潰锛屾敮鎸佽嚜鍔ㄦ祴閫熴€佸畾鏃朵换鍔″拰澶?Worker 鑺傜偣涓婁紶銆?
**馃幆 鏀寔澶氭灦鏋勶細AMD64 (x86_64) 鍜?ARM64 (aarch64)**

**馃嚚馃嚦 鍥藉唴鐢ㄦ埛**: 鏌ョ湅 [鍥藉唴鐢ㄦ埛蹇€熷紑濮嬫寚鍗梋(CHINA_QUICKSTART.md) 浣跨敤鍗椾含澶у闀滃儚婧愬姞閫熶笅杞?
## 鉁?鏍稿績鐗规€?
### 馃帹 Web 鍙鍖栫鐞?- **鐜颁唬鍖栨搷浣滅晫闈?*锛氬熀浜?Bootstrap 5 鐨勫搷搴斿紡璁捐
- **瀹炴椂鏃ュ織娴?*锛? 绉掑埛鏂伴棿闅旓紝鑷姩婊氬姩鍒版渶鏂板唴瀹?- **杩愯鐘舵€佺洃鎺?*锛氬疄鏃舵樉绀烘祴閫熻繘搴﹀拰浠诲姟鐘舵€?- **鍙傛暟鍙鍖栭厤缃?*锛氭棤闇€鎵嬪姩缂栬緫閰嶇疆鏂囦欢

### 鈿?寮哄ぇ鐨勬祴閫熷紩鎿?- **澶氱嚎绋嬪苟鍙戞祴閫?*锛氭敮鎸?200-500 骞跺彂锛堝彲閰嶇疆锛?- **IPv4/IPv6 鍙屾爤**锛氭敮鎸?IPv6 缃戠粶鐜
- **鏅鸿兘绛涢€?*锛氬熀浜庨€熷害鍜屽欢杩熺殑鍙岄噸杩囨护
- **绮惧噯娴嬮€?*锛氳皟鐢?CloudflareST 浜岃繘鍒惰繘琛岄珮鎬ц兘娴嬮€?
### 馃攧 鑷姩鍖栬繍缁?- **瀹氭椂浠诲姟**锛氭敮鎸?Cron 琛ㄨ揪寮忥紝鑷姩鍖栨墽琛屾祴閫?- **澶?Worker 涓婁紶**锛氭祴閫熺粨鏋滆嚜鍔ㄦ帹閫佸埌澶氫釜 Worker 鑺傜偣
- **鎸佷箙鍖栧瓨鍌?*锛氭祴閫熺粨鏋滃拰鏃ュ織姘镐箙淇濆瓨

### 馃寪 澶氭灦鏋勬敮鎸?- **AMD64 (x86_64)**锛氭爣鍑?PC銆佹湇鍔″櫒
- **ARM64 (aarch64)**锛氭爲鑾撴淳 3/4/5銆丄RM 鏈嶅姟鍣ㄧ瓑璁惧
- **鑷姩璇嗗埆**锛欴ocker 鑷姩鎷夊彇閫傞厤褰撳墠璁惧鏋舵瀯鐨勯暅鍍?
**娉ㄦ剰**锛欰RM32 (armv7l) 璁惧锛堝鐜╁浜戯級鏆備笉鏀寔锛屽洜涓轰笂娓?CloudflareST 椤圭洰鏈彁渚?ARM32 浜岃繘鍒舵枃浠躲€傚闇€鏀寔锛岃浣跨敤 ARM64 绯荤粺鎴栬仈绯讳笂娓搁」鐩€?
## 馃摝 蹇€熷紑濮?
### 鍓嶇疆瑕佹眰
- Docker锛堝畨瑁?Docker Desktop 鎴?Docker Engine锛?- 鑷冲皯 512MB 鍙敤鍐呭瓨锛圓RM 璁惧锛? 2GB锛坸86 璁惧锛?- 绋冲畾鐨勭綉缁滆繛鎺?
### 閮ㄧ讲鏂瑰紡

#### 鈿?鏂瑰紡涓€锛欴ocker Run 涓€閿儴缃诧紙鏈€绠€鍗曪級

**閫傚悎锛氭兂瑕佹渶蹇€熷害浣撻獙鐨勭敤鎴凤紝涓€鏉″懡浠ゆ悶瀹氾紒鏀寔鎵€鏈夋灦鏋勶紒**

```bash
# 鍥介檯鐢ㄦ埛锛圓MD64 鍜?ARM64 閮介€傜敤锛?docker run -d \
  --name cloudflare-speedtest \
  --restart unless-stopped \
  -p 2028:2028 \
  -v $(pwd)/data:/app/data \
  -e TZ=Asia/Shanghai \
  ghcr.io/1williamaoayers/yxtovps:latest

# 鍥藉唴鐢ㄦ埛锛堜娇鐢ㄥ崡浜ぇ瀛﹂暅鍍忔簮锛岄€熷害鏇村揩锛?docker run -d \
  --name cloudflare-speedtest \
  --restart unless-stopped \
  -p 2028:2028 \
  -v $(pwd)/data:/app/data \
  -e TZ=Asia/Shanghai \
  ghcr.nju.edu.cn/1williamaoayers/yxtovps:latest

# Windows PowerShell 鐢ㄦ埛浣跨敤锛堝浗闄咃級:
docker run -d --name cloudflare-speedtest --restart unless-stopped -p 2028:2028 -v ${PWD}/data:/app/data -e TZ=Asia/Shanghai ghcr.io/1williamaoayers/yxtovps:latest

# Windows PowerShell 鐢ㄦ埛浣跨敤锛堝浗鍐呴暅鍍忥級:
docker run -d --name cloudflare-speedtest --restart unless-stopped -p 2028:2028 -v ${PWD}/data:/app/data -e TZ=Asia/Shanghai ghcr.nju.edu.cn/1williamaoayers/yxtovps:latest
```

鐒跺悗娴忚鍣ㄦ墦寮€锛?*http://localhost:2028** 馃帀

**璇存槑**锛?- `-p 2028:2028`锛氭槧灏勭鍙ｏ紝鍙敼涓哄叾浠栫鍙ｅ `-p 8080:2028`
- `-v $(pwd)/data:/app/data`锛氫繚瀛樻祴閫熺粨鏋滃埌褰撳墠鐩綍鐨?data 鏂囦欢澶?- `--restart unless-stopped`锛氬紑鏈鸿嚜鍔ㄥ惎鍔?- Docker 浼氳嚜鍔ㄨ瘑鍒澶囨灦鏋勫苟鎷夊彇瀵瑰簲闀滃儚
- **鍥藉唴鐢ㄦ埛鎺ㄨ崘浣跨敤 `ghcr.nju.edu.cn` 闀滃儚婧愶紝涓嬭浇閫熷害鏇村揩**

---

#### 馃幃 ARM64 璁惧閮ㄧ讲鎸囧崡锛堟爲鑾撴淳绛夛級

**ARM64 璁惧锛堝鏍戣帗娲?3/4/5锛変竴閿儴缃诧細**

```bash
# 1. SSH 鐧诲綍鍒拌澶?ssh pi@璁惧IP

# 2. 鍒涘缓宸ヤ綔鐩綍
mkdir -p ~/cloudflare-speedtest
cd ~/cloudflare-speedtest

# 3. 涓€閿儴缃诧紙鍥藉唴鐢ㄦ埛鎺ㄨ崘浣跨敤鍗椾含澶у闀滃儚婧愶級
docker run -d \
  --name cloudflare-speedtest \
  --restart unless-stopped \
  -p 2028:2028 \
  -v $(pwd)/data:/app/data \
  -e TZ=Asia/Shanghai \
  ghcr.nju.edu.cn/1williamaoayers/yxtovps:latest

# 鍥介檯鐢ㄦ埛浣跨敤瀹樻柟婧?# ghcr.io/1williamaoayers/yxtovps:latest

# 4. 鏌ョ湅杩愯鐘舵€?docker ps | grep cloudflare-speedtest

# 5. 鏌ョ湅鏃ュ織
docker logs -f cloudflare-speedtest
```

**璁块棶 Web 鐣岄潰**锛?- 鍦ㄦ祻瑙堝櫒涓墦寮€锛歚http://璁惧IP:2028`
- 渚嬪锛歚http://192.168.1.100:2028`

**ARM64 璁惧鎺ㄨ崘閰嶇疆**锛?- 娴嬭瘯鏁伴噺锛?0-100锛堟牴鎹澶囨€ц兘璋冩暣锛?- 绾跨▼鏁帮細200-300锛堟牴鎹綉缁滄儏鍐佃皟鏁达級
- 寤惰繜闃堝€硷細300ms
- 閫熷害涓嬮檺锛? MB/s

---

#### 馃殌 鏂瑰紡浜岋細Docker Compose 閮ㄧ讲锛堟帹鑽愮粰闀挎湡浣跨敤锛?
濡傛灉 GitHub Actions 宸叉瀯寤洪暅鍍忥紝鍙互鐩存帴鎷夊彇锛?
```bash
# 1. 鍒涘缓宸ヤ綔鐩綍
mkdir cloudflare-speedtest && cd cloudflare-speedtest

# 2. 涓嬭浇 docker-compose.yml
curl -O https://raw.githubusercontent.com/1williamaoayers/yxtovps/main/yx-tools/docker-compose.yml

# 3. 鍒涘缓鏁版嵁鐩綍
mkdir data

# 4. 鍚姩鏈嶅姟
docker-compose up -d

# 5. 璁块棶绠＄悊闈㈡澘
# 娴忚鍣ㄦ墦寮€: http://localhost:2028
```

**浼樼偣**锛氶厤缃枃浠剁鐞嗭紝鏂逛究淇敼绔彛绛夊弬鏁?
---

#### 馃洜锔?鏂瑰紡涓夛細鏈湴鏋勫缓锛堝紑鍙戣€呮帹鑽愶級

閫傚悎闇€瑕佷慨鏀逛唬鐮佹垨鑷畾涔夊姛鑳界殑鍦烘櫙锛?
```bash
# 1. 鍏嬮殕椤圭洰
git clone https://github.com/1williamaoayers/yxtovps.git
cd yxtovps/yx-tools

# 2. 鏋勫缓骞跺惎鍔ㄦ湇鍔?docker-compose up -d --build

# 3. 璁块棶绠＄悊闈㈡澘
# 娴忚鍣ㄦ墦寮€: http://localhost:2028
```

**浼樼偣**锛?- 鍙互鑷敱淇敼浠ｇ爜
- 鐢变簬浣跨敤浜?volume 鎸傝浇锛屼慨鏀瑰悗閲嶅惎瀹瑰櫒鍗冲彲鐢熸晥锛堟棤闇€閲嶆柊鏋勫缓锛?- 閫傚悎寮€鍙戝拰璋冭瘯

---

### 鍋滄鍜岀鐞嗗鍣?
```bash
# 鏌ョ湅瀹瑰櫒鐘舵€?docker ps | grep cloudflare-speedtest

# 鏌ョ湅鏃ュ織
docker logs -f cloudflare-speedtest

# 鍋滄瀹瑰櫒
docker stop cloudflare-speedtest

# 閲嶅惎瀹瑰櫒
docker restart cloudflare-speedtest

# 鍒犻櫎瀹瑰櫒锛堟暟鎹繚鐣欏湪 data 鐩綍锛?docker rm -f cloudflare-speedtest

# 鏌ョ湅闀滃儚鏋舵瀯淇℃伅
docker image inspect ghcr.io/1williamaoayers/yxtovps:latest | grep Architecture
```


## 馃幃 浣跨敤鎸囧崡

### 1锔忊儯 閰嶇疆 Worker 鑺傜偣锛堝彲閫夛級
鍦?Web 鐣岄潰鐨?**"Worker 璁㈤槄/绠＄悊 URL"** 涓矘璐翠綘鐨?Worker 璁㈤槄閾炬帴锛?```
https://example.com/uuid-key-1
https://example2.com/uuid-key-2
```
- 姣忚涓€涓?URL
- 娴嬮€熺粨鏋滃皢鑷姩涓婁紶鍒拌繖浜涜妭鐐?- 濡傛灉涓嶉渶瑕佷笂浼狅紝鐣欑┖鍗冲彲

### 2锔忊儯 璋冩暣娴嬮€熷弬鏁?| 鍙傛暟 | 璇存槑 | 鎺ㄨ崘鍊?|
|------|------|--------|
| **涓嬭浇閫熷害涓嬮檺** | 浣庝簬姝ら€熷害鐨?IP 灏嗚杩囨护 | 5 MB/s |
| **娴嬭瘯鏁伴噺** | 鎬诲叡娴嬮€熷灏戜釜 IP | 20锛堣矾鐢卞櫒锛? 100锛堟湇鍔″櫒锛墊
| **寤惰繜闃堝€?* | 鍙繚鐣欏欢杩熶綆浜庢鍊肩殑 IP | 300 ms |
| **涓婁紶鏁伴噺** | 鍙栧墠 N 涓渶蹇殑 IP 涓婁紶 | 20 |
| **绾跨▼鏁?* | 骞跺彂娴嬮€熺嚎绋嬫暟 | 200锛堣矾鐢卞櫒锛? 500锛堟湇鍔″櫒锛墊
| **IPv6** | 鏄惁娴嬭瘯 IPv6 鍦板潃 | 鏍规嵁缃戠粶鐜鍐冲畾 |

### 3锔忊儯 杩愯娴嬮€?- **鎵嬪姩瑙﹀彂**锛氱偣鍑?"鈻?绔嬪嵆杩愯娴嬮€? 鎸夐挳
- **鑷姩杩愯**锛氳缃?Cron 琛ㄨ揪寮忥紙榛樿姣忓ぉ鍑屾櫒 4 鐐癸級

### 4锔忊儯 鏌ョ湅缁撴灉
- **浼橀€夌粨鏋滆〃鏍?*锛氭樉绀烘渶浼樼殑 IP銆侀€熷害銆佸欢杩熷拰鍦板尯
- **瀹炴椂鏃ュ織**锛氭煡鐪嬫祴閫熻繃绋嬬殑璇︾粏杈撳嚭
- **CSV 瀵煎嚭**锛氱粨鏋滀繚瀛樺湪 `data/result.csv`

## 馃搨 鐩綍缁撴瀯

```
yx-tools/
鈹溾攢鈹€ app/
鈹?  鈹溾攢鈹€ app.py              # Flask 鍚庣鏈嶅姟
鈹?  鈹斺攢鈹€ templates/
鈹?      鈹斺攢鈹€ index.html      # Web 绠＄悊鐣岄潰
鈹溾攢鈹€ data/                   # 鎸佷箙鍖栨暟鎹洰褰?鈹?  鈹溾攢鈹€ result.csv          # 鏈€鏂版祴閫熺粨鏋?鈹?  鈹溾攢鈹€ app.log             # 搴旂敤鏃ュ織
鈹?  鈹溾攢鈹€ status.json         # 杩愯鐘舵€?鈹?  鈹斺攢鈹€ web_config.json     # Web 閰嶇疆鏂囦欢
鈹溾攢鈹€ cloudflare_speedtest.py # 鏍稿績娴嬮€熻剼鏈?鈹溾攢鈹€ requirements.txt        # Python 渚濊禆
鈹溾攢鈹€ Dockerfile              # Docker 闀滃儚鏋勫缓鏂囦欢
鈹溾攢鈹€ docker-compose.yml      # Docker Compose 閰嶇疆
鈹斺攢鈹€ README.md               # 鏈枃妗?```

## 馃敡 楂樼骇閰嶇疆

### 淇敼榛樿绔彛
缂栬緫 `docker-compose.yml`锛?```yaml
ports:
  - "2028:2028"  # 鏀逛负浣犳兂瑕佺殑绔彛
```

### 鎸佷箙鍖栨暟鎹?鎵€鏈夐噸瑕佹暟鎹瓨鍌ㄥ湪 `./data` 鐩綍锛屾槧灏勫埌瀹瑰櫒鐨?`/app/data`锛?- `result.csv`锛氭祴閫熺粨鏋?- `app.log`锛氳缁嗘棩蹇?- `web_config.json`锛歐eb 閰嶇疆
- `status.json`锛氳繍琛岀姸鎬?
### Cron 琛ㄨ揪寮忕ず渚?| 琛ㄨ揪寮?| 璇存槑 |
|--------|------|
| `0 4 * * *` | 姣忓ぉ鍑屾櫒 4 鐐?|
| `0 */6 * * *` | 姣?6 灏忔椂涓€娆?|
| `0 2 * * 0` | 姣忓懆鏃ュ噷鏅?2 鐐?|
| `*/30 * * * *` | 姣?30 鍒嗛挓涓€娆?|

### 鎵嬪姩杩愯 CLI 鑴氭湰锛堜笉浣跨敤 Web锛?```bash
docker exec -it cloudflare-speedtest python cloudflare_speedtest.py \
  --worker-urls "https://example.com/uuid" \
  --speed 5 \
  --count 20 \
  --delay 300
```

## 馃悰 鏁呴殰鎺掗櫎

### 1. 瀹瑰櫒鏃犳硶鍚姩
```bash
# 鏌ョ湅鏃ュ織
docker-compose logs -f

# 閲嶆柊鏋勫缓
docker-compose down
docker-compose up -d --build
```

### 2. Web 鐣岄潰鏃犳硶璁块棶
- 妫€鏌ョ鍙ｆ槸鍚﹁鍗犵敤锛歚netstat -ano | findstr 2028` (Windows) 鎴?`netstat -tuln | grep 2028` (Linux)
- 妫€鏌ラ槻鐏鏄惁鏀捐 2028 绔彛
- 纭瀹瑰櫒姝ｅ湪杩愯锛歚docker ps`
- 妫€鏌ュ鍣ㄥ仴搴风姸鎬侊細`docker inspect cloudflare-speedtest | grep Health`

### 3. 娴嬮€熺粨鏋滀负绌?- 妫€鏌ョ綉缁滆繛鎺ユ槸鍚︽甯?- 闄嶄綆 `绾跨▼鏁癭 鍜?`娴嬭瘯鏁伴噺`
- 璋冮珮 `寤惰繜闃堝€糮 鍜岄檷浣?`閫熷害涓嬮檺`

### 4. Worker 涓婁紶澶辫触
- 妫€鏌?Worker URL 鏍煎紡鏄惁姝ｇ‘锛堟瘡琛屼竴涓畬鏁?URL锛?- 鏌ョ湅鏃ュ織涓殑鍏蜂綋鎶ラ敊淇℃伅
- 纭 Worker 绔偣鍙互璁块棶

### 5. ARM 璁惧鐗瑰畾闂

#### 鏋舵瀯涓嶅尮閰嶉敊璇?**閿欒淇℃伅**锛歚exec /usr/local/bin/python: exec format error`

**鍘熷洜**锛氭媺鍙栦簡閿欒鏋舵瀯鐨勯暅鍍?
**瑙ｅ喅鏂规**锛?```bash
# 1. 鍒犻櫎鐜版湁瀹瑰櫒鍜岄暅鍍?docker rm -f cloudflare-speedtest
docker rmi ghcr.io/1williamaoayers/yxtovps:latest

# 2. 楠岃瘉璁惧鏋舵瀯
uname -m  # ARM64 搴旇鏄剧ず aarch64

# 3. 鎵嬪姩鎸囧畾骞冲彴鎷夊彇锛堜粎 ARM64 鏀寔锛?docker pull --platform linux/arm64 ghcr.io/1williamaoayers/yxtovps:latest

# 4. 閲嶆柊杩愯瀹瑰櫒
docker run -d --name cloudflare-speedtest --restart unless-stopped -p 2028:2028 -v $(pwd)/data:/app/data -e TZ=Asia/Shanghai ghcr.io/1williamaoayers/yxtovps:latest
```

**娉ㄦ剰**锛氬鏋滀綘鐨勮澶囨槸 ARM32 (armv7l)锛屼緥濡傜帺瀹簯锛屾湰椤圭洰鏆備笉鏀寔锛屽洜涓轰笂娓?CloudflareST 椤圭洰鏈彁渚?ARM32 浜岃繘鍒舵枃浠躲€?
#### ARM64 璁惧鍐呭瓨涓嶈冻
**鐥囩姸**锛氬鍣ㄩ绻侀噸鍚垨娴嬮€熷け璐?
**瑙ｅ喅鏂规**锛?- 闄嶄綆娴嬭瘯鏁伴噺鍒?30-50
- 闄嶄綆绾跨▼鏁板埌 150-200
- 鍏抽棴鍏朵粬涓嶅繀瑕佺殑瀹瑰櫒鎴栨湇鍔?- 妫€鏌ュ唴瀛樹娇鐢細`free -h`

#### 鏁版嵁鍗锋潈闄愰棶棰?**閿欒淇℃伅**锛歚PermissionError: [Errno 13] Permission denied`

**瑙ｅ喅鏂规**锛?```bash
# 淇敼鏁版嵁鐩綍鏉冮檺
chmod -R 777 ./data

# 鎴栬€呬娇鐢?root 鐢ㄦ埛杩愯瀹瑰櫒
docker run -d --user root --name cloudflare-speedtest ...
```

### 6. 楠岃瘉澶氭灦鏋勬敮鎸?
妫€鏌ラ暅鍍忔槸鍚﹀寘鍚涓灦鏋勶細
```bash
# 鏌ョ湅闀滃儚娓呭崟
docker manifest inspect ghcr.io/1williamaoayers/yxtovps:latest

# 搴旇鐪嬪埌绫讳技杈撳嚭锛?# "architecture": "amd64"
# "architecture": "arm"
# "variant": "v7"
```

鏌ョ湅褰撳墠杩愯鐨勫鍣ㄦ灦鏋勶細
```bash
docker inspect cloudflare-speedtest | grep Architecture
```

## 馃搳 鎶€鏈爤

- **鍚庣**锛歅ython 3.9 + Flask
- **鍓嶇**锛欱ootstrap 5 + Vanilla JavaScript
- **瀹氭椂浠诲姟**锛欰PScheduler
- **娴嬮€熷紩鎿?*锛欳loudflareST (Go 浜岃繘鍒?
- **瀹瑰櫒鍖?*锛欴ocker + Docker Compose

## 馃 璐＄尞鎸囧崡

娆㈣繋鎻愪氦 Issue 鍜?Pull Request锛?
### 寮€鍙戠幆澧冩惌寤?```bash
# 鍏嬮殕浠撳簱
git clone https://github.com/yourusername/yxtovps.git
cd yxtovps/yx-tools

# 鏈湴杩愯锛堥渶瑕?Python 3.9+锛?pip install -r requirements.txt
python app/app.py
```

## 馃搫 璁稿彲璇?
MIT License - 鑷敱浣跨敤鍜屼慨鏀?
## 猸?鑷磋阿

- [CloudflareSpeedTest](https://github.com/XIU2/CloudflareSpeedTest) - 鏍稿績娴嬮€熷紩鎿?- Bootstrap 鍥㈤槦 - 浼樼鐨?UI 妗嗘灦

---

**馃挕 鎻愮ず**锛氶娆¤繍琛屽缓璁娇鐢ㄨ緝灏忕殑 `娴嬭瘯鏁伴噺` 鍜?`绾跨▼鏁癭 杩涜娴嬭瘯锛岀‘璁ゆ甯稿悗鍐嶈皟鏁村弬鏁般€?
**馃敆 鐩稿叧閾炬帴**锛?- [Issue 鍙嶉](https://github.com/yourusername/yxtovps/issues)
- [鏇存柊鏃ュ織](https://github.com/yourusername/yxtovps/releases)

**鏈€鍚庢洿鏂?*: 2026-01-20
