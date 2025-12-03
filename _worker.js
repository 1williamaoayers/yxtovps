// Cloudflare Worker - 简化版优选工具
// 仅保留优选域名、优选IP、GitHub、上报和节点生成功能

// 默认配置
let customPreferredIPs = [];
let customPreferredDomains = [];
let epd = true;  // 启用优选域名
let epi = true;  // 启用优选IP
let egi = true;  // 启用GitHub优选
let eapi = true; // 启用本地上传IP (API)
let ev = true;   // 启用VLESS协议
let et = false;  // 启用Trojan协议
let vm = false;  // 启用VMess协议
let scu = 'https://url.v1.mk/sub';  // 订阅转换地址
let kvStore = null;
let kvConfig = {};
let adminUUID = ''; // 管理员UUID，用于API验证

// 默认优选域名列表
const directDomains = [
    { name: "cloudflare.182682.xyz", domain: "cloudflare.182682.xyz" },
    { domain: "freeyx.cloudflare88.eu.org" },
    { domain: "bestcf.top" },
    { domain: "cdn.2020111.xyz" },
    { domain: "cf.0sm.com" },
    { domain: "cf.090227.xyz" },
    { domain: "cf.zhetengsha.eu.org" },
    { domain: "cfip.1323123.xyz" },
    { domain: "cloudflare-ip.mofashi.ltd" },
    { domain: "cf.877771.xyz" },
    { domain: "xn--b6gac.eu.org" }
];

// 默认优选IP来源URL
const defaultIPURL = 'https://raw.githubusercontent.com/qwer-search/bestip/refs/heads/main/kejilandbestip.txt';

// UUID验证
function isValidUUID(str) {
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    return uuidRegex.test(str);
}

// 从环境变量获取配置
function getConfigValue(key, defaultValue) {
    if (kvConfig && kvConfig[key] !== undefined && kvConfig[key] !== '') {
        return kvConfig[key];
    }
    return defaultValue || '';
}

// 获取动态IP列表（支持IPv4/IPv6和运营商筛选）
async function fetchDynamicIPs(ipv4Enabled = true, ipv6Enabled = true, ispMobile = true, ispUnicom = true, ispTelecom = true) {
    const v4Url = "https://www.wetest.vip/page/cloudflare/address_v4.html";
    const v6Url = "https://www.wetest.vip/page/cloudflare/address_v6.html";
    let results = [];

    try {
        const fetchPromises = [];
        if (ipv4Enabled) {
            fetchPromises.push(fetchAndParseWetest(v4Url));
        } else {
            fetchPromises.push(Promise.resolve([]));
        }
        if (ipv6Enabled) {
            fetchPromises.push(fetchAndParseWetest(v6Url));
        } else {
            fetchPromises.push(Promise.resolve([]));
        }

        const [ipv4List, ipv6List] = await Promise.all(fetchPromises);
        results = [...ipv4List, ...ipv6List];
        
        // 按运营商筛选
        if (results.length > 0) {
            results = results.filter(item => {
                const isp = item.isp || '';
                if (isp.includes('移动') && !ispMobile) return false;
                if (isp.includes('联通') && !ispUnicom) return false;
                if (isp.includes('电信') && !ispTelecom) return false;
                return true;
            });
        }
        
        return results.length > 0 ? results : [];
    } catch (e) {
        return [];
    }
}

// 解析wetest页面
async function fetchAndParseWetest(url) {
    try {
        const response = await fetch(url, { headers: { 'User-Agent': 'Mozilla/5.0' } });
        if (!response.ok) return [];
        const html = await response.text();
        const results = [];
        const rowRegex = /<tr[\s\S]*?<\/tr>/g;
        const cellRegex = /<td data-label="线路名称">(.+?)<\/td>[\s\S]*?<td data-label="优选地址">([\d.:a-fA-F]+)<\/td>[\s\S]*?<td data-label="数据中心">(.+?)<\/td>/;

        let match;
        while ((match = rowRegex.exec(html)) !== null) {
            const rowHtml = match[0];
            const cellMatch = rowHtml.match(cellRegex);
            if (cellMatch && cellMatch[1] && cellMatch[2]) {
                const colo = cellMatch[3] ? cellMatch[3].trim().replace(/<.*?>/g, '') : '';
                results.push({
                    isp: cellMatch[1].trim().replace(/<.*?>/g, ''),
                    ip: cellMatch[2].trim(),
                    colo: colo
                });
            }
        }
        return results;
    } catch (error) {
        return [];
    }
}

// 从GitHub获取优选IP
async function fetchAndParseNewIPs(piu) {
    const url = piu || defaultIPURL;
    try {
        const response = await fetch(url);
        if (!response.ok) return [];
        const text = await response.text();
        const results = [];
        const lines = text.trim().replace(/\r/g, "").split('\n');
        const regex = /^([^:]+):(\d+)#(.*)$/;

        for (const line of lines) {
            const trimmedLine = line.trim();
            if (!trimmedLine) continue;
            const match = trimmedLine.match(regex);
            if (match) {
                results.push({
                    ip: match[1],
                    port: parseInt(match[2], 10),
                    name: match[3].trim() || match[1]
                });
            }
        }
        return results;
    } catch (error) {
        return [];
    }
}

// UTF-8 safe Base64 encoding
function utf8_to_b64(str) {
    return btoa(encodeURIComponent(str).replace(/%([0-9A-F]{2})/g,
        function toSolidBytes(match, p1) {
            return String.fromCharCode('0x' + p1);
    }));
}

// 生成VLESS链接
function generateLinksFromSource(list, user, workerDomain, disableNonTLS = false, customPath = '/') {
    const CF_HTTP_PORTS = [80, 8080, 8880, 2052, 2082, 2086, 2095];
    const CF_HTTPS_PORTS = [443, 2053, 2083, 2087, 2096, 8443];
    const defaultHttpsPorts = [443];
    const defaultHttpPorts = disableNonTLS ? [] : [80];
    const links = [];
    const wsPath = customPath || '/';
    const proto = 'vless';

    list.forEach(item => {
        let nodeNameBase = item.isp ? item.isp.replace(/\s/g, '_') : (item.name || item.domain || item.ip);
        if (item.colo && item.colo.trim()) {
            nodeNameBase = `${nodeNameBase}-${item.colo.trim()}`;
        }
        const safeIP = item.ip.includes(':') ? `[${item.ip}]` : item.ip;
        
        let portsToGenerate = [];
        
        if (item.port) {
            const port = item.port;
            if (CF_HTTPS_PORTS.includes(port)) {
                portsToGenerate.push({ port: port, tls: true });
            } else if (CF_HTTP_PORTS.includes(port)) {
                portsToGenerate.push({ port: port, tls: false });
            } else {
                portsToGenerate.push({ port: port, tls: true });
            }
        } else {
            defaultHttpsPorts.forEach(port => {
                portsToGenerate.push({ port: port, tls: true });
            });
            defaultHttpPorts.forEach(port => {
                portsToGenerate.push({ port: port, tls: false });
            });
        }

        portsToGenerate.forEach(({ port, tls }) => {
            if (tls) {
                const wsNodeName = `${nodeNameBase}-${port}-WS-TLS`;
                const wsParams = new URLSearchParams({ 
                    encryption: 'none', 
                    security: 'tls', 
                    sni: workerDomain, 
                    fp: 'chrome', 
                    type: 'ws', 
                    host: workerDomain, 
                    path: wsPath
                });
                links.push(`${proto}://${user}@${safeIP}:${port}?${wsParams.toString()}#${encodeURIComponent(wsNodeName)}`);
            } else {
                const wsNodeName = `${nodeNameBase}-${port}-WS`;
                const wsParams = new URLSearchParams({
                    encryption: 'none',
                    security: 'none',
                    type: 'ws',
                    host: workerDomain,
                    path: wsPath
                });
                links.push(`${proto}://${user}@${safeIP}:${port}?${wsParams.toString()}#${encodeURIComponent(wsNodeName)}`);
            }
        });
    });
    return links;
}

// 生成Trojan链接
async function generateTrojanLinksFromSource(list, user, workerDomain, disableNonTLS = false, customPath = '/') {
    const CF_HTTP_PORTS = [80, 8080, 8880, 2052, 2082, 2086, 2095];
    const CF_HTTPS_PORTS = [443, 2053, 2083, 2087, 2096, 8443];
    const defaultHttpsPorts = [443];
    const defaultHttpPorts = disableNonTLS ? [] : [80];
    const links = [];
    const wsPath = customPath || '/';
    const password = user;  // Trojan使用UUID作为密码

    list.forEach(item => {
        let nodeNameBase = item.isp ? item.isp.replace(/\s/g, '_') : (item.name || item.domain || item.ip);
        if (item.colo && item.colo.trim()) {
            nodeNameBase = `${nodeNameBase}-${item.colo.trim()}`;
        }
        const safeIP = item.ip.includes(':') ? `[${item.ip}]` : item.ip;
        
        let portsToGenerate = [];
        
        if (item.port) {
            const port = item.port;
            if (CF_HTTPS_PORTS.includes(port)) {
                portsToGenerate.push({ port: port, tls: true });
            } else if (CF_HTTP_PORTS.includes(port)) {
                if (!disableNonTLS) {
                    portsToGenerate.push({ port: port, tls: false });
                }
            } else {
                portsToGenerate.push({ port: port, tls: true });
            }
        } else {
            defaultHttpsPorts.forEach(port => {
                portsToGenerate.push({ port: port, tls: true });
            });
            defaultHttpPorts.forEach(port => {
                portsToGenerate.push({ port: port, tls: false });
            });
        }

        portsToGenerate.forEach(({ port, tls }) => {
            if (tls) {
                const wsNodeName = `${nodeNameBase}-${port}-Trojan-WS-TLS`;
                const wsParams = new URLSearchParams({ 
                    security: 'tls', 
                    sni: workerDomain, 
                    fp: 'chrome', 
                    type: 'ws', 
                    host: workerDomain, 
                    path: wsPath
                });
                links.push(`trojan://${password}@${safeIP}:${port}?${wsParams.toString()}#${encodeURIComponent(wsNodeName)}`);
            } else {
                const wsNodeName = `${nodeNameBase}-${port}-Trojan-WS`;
                const wsParams = new URLSearchParams({
                    security: 'none',
                    type: 'ws',
                    host: workerDomain,
                    path: wsPath
                });
                links.push(`trojan://${password}@${safeIP}:${port}?${wsParams.toString()}#${encodeURIComponent(wsNodeName)}`);
            }
        });
    });
    return links;
}

// 生成VMess链接
function generateVMessLinksFromSource(list, user, workerDomain, disableNonTLS = false, customPath = '/') {
    const CF_HTTP_PORTS = [80, 8080, 8880, 2052, 2082, 2086, 2095];
    const CF_HTTPS_PORTS = [443, 2053, 2083, 2087, 2096, 8443];
    const defaultHttpsPorts = [443];
    const defaultHttpPorts = disableNonTLS ? [] : [80];
    const links = [];
    const wsPath = customPath || '/';

    list.forEach(item => {
        let nodeNameBase = item.isp ? item.isp.replace(/\s/g, '_') : (item.name || item.domain || item.ip);
        if (item.colo && item.colo.trim()) {
            nodeNameBase = `${nodeNameBase}-${item.colo.trim()}`;
        }
        const safeIP = item.ip.includes(':') ? `[${item.ip}]` : item.ip;
        
        let portsToGenerate = [];
        
        if (item.port) {
            const port = item.port;
            if (CF_HTTPS_PORTS.includes(port)) {
                portsToGenerate.push({ port: port, tls: true });
            } else if (CF_HTTP_PORTS.includes(port)) {
                if (!disableNonTLS) {
                    portsToGenerate.push({ port: port, tls: false });
                }
            } else {
                portsToGenerate.push({ port: port, tls: true });
            }
        } else {
            defaultHttpsPorts.forEach(port => {
                portsToGenerate.push({ port: port, tls: true });
            });
            defaultHttpPorts.forEach(port => {
                portsToGenerate.push({ port: port, tls: false });
            });
        }

        portsToGenerate.forEach(({ port, tls }) => {
            const vmessConfig = {
                v: "2",
                ps: tls ? `${nodeNameBase}-${port}-VMess-WS-TLS` : `${nodeNameBase}-${port}-VMess-WS`,
                add: safeIP,
                port: port.toString(),
                id: user,
                aid: "0",
                scy: "auto",
                net: "ws",
                type: "none",
                host: workerDomain,
                path: wsPath,
                tls: tls ? "tls" : "none"
            };
            if (tls) {
                vmessConfig.sni = workerDomain;
                vmessConfig.fp = "chrome";
            }
            const vmessBase64 = utf8_to_b64(JSON.stringify(vmessConfig));
            links.push(`vmess://${vmessBase64}`);
        });
    });
    return links;
}

// 从GitHub IP生成链接（VLESS）
function generateLinksFromNewIPs(list, user, workerDomain, customPath = '/') {
    const CF_HTTP_PORTS = [80, 8080, 8880, 2052, 2082, 2086, 2095];
    const CF_HTTPS_PORTS = [443, 2053, 2083, 2087, 2096, 8443];
    const links = [];
    const wsPath = customPath || '/';
    const proto = 'vless';
    
    list.forEach(item => {
        const nodeName = item.name.replace(/\s/g, '_');
        const port = item.port;
        
        if (CF_HTTPS_PORTS.includes(port)) {
            const wsNodeName = `${nodeName}-${port}-WS-TLS`;
            const link = `${proto}://${user}@${item.ip}:${port}?encryption=none&security=tls&sni=${workerDomain}&fp=chrome&type=ws&host=${workerDomain}&path=${wsPath}#${encodeURIComponent(wsNodeName)}`;
            links.push(link);
        } else if (CF_HTTP_PORTS.includes(port)) {
            const wsNodeName = `${nodeName}-${port}-WS`;
            const link = `${proto}://${user}@${item.ip}:${port}?encryption=none&security=none&type=ws&host=${workerDomain}&path=${wsPath}#${encodeURIComponent(wsNodeName)}`;
            links.push(link);
        } else {
            const wsNodeName = `${nodeName}-${port}-WS-TLS`;
            const link = `${proto}://${user}@${item.ip}:${port}?encryption=none&security=tls&sni=${workerDomain}&fp=chrome&type=ws&host=${workerDomain}&path=${wsPath}#${encodeURIComponent(wsNodeName)}`;
            links.push(link);
        }
    });
    return links;
}

// 生成订阅内容
async function handleSubscriptionRequest(request, user, customDomain, piu, ipv4Enabled, ipv6Enabled, ispMobile, ispUnicom, ispTelecom, evEnabled, etEnabled, vmEnabled, disableNonTLS, customPath) {
    const url = new URL(request.url);
    const finalLinks = [];
    const workerDomain = url.hostname;  // workerDomain始终是请求的hostname
    const nodeDomain = customDomain || url.hostname;  // 用户输入的域名用于生成节点时的host/sni
    const target = url.searchParams.get('target') || 'base64';
    const wsPath = customPath || '/';

    async function addNodesFromList(list) {
        // 确保至少有一个协议被启用
        const hasProtocol = evEnabled || etEnabled || vmEnabled;
        const useVL = hasProtocol ? evEnabled : true;  // 如果没有选择任何协议，默认使用VLESS
        
        if (useVL) {
            finalLinks.push(...generateLinksFromSource(list, user, nodeDomain, disableNonTLS, wsPath));
        }
        if (etEnabled) {
            finalLinks.push(...await generateTrojanLinksFromSource(list, user, nodeDomain, disableNonTLS, wsPath));
        }
        if (vmEnabled) {
            finalLinks.push(...generateVMessLinksFromSource(list, user, nodeDomain, disableNonTLS, wsPath));
        }
    }

    // 原生地址
    const nativeList = [{ ip: workerDomain, isp: '原生地址' }];
    await addNodesFromList(nativeList);

    // 自定义/本地优选IP (来自API上传)
    if (eapi) {
        if (customPreferredIPs && customPreferredIPs.length > 0) {
            await addNodesFromList(customPreferredIPs);
        }
        if (customPreferredDomains && customPreferredDomains.length > 0) {
            // 转换格式以匹配 addNodesFromList
            const mappedDomains = customPreferredDomains.map(d => ({ 
                ip: d.domain, 
                port: d.port, 
                isp: d.name 
            }));
            await addNodesFromList(mappedDomains);
        }
    }

    // 优选域名
    if (epd) {
        const domainList = directDomains.map(d => ({ ip: d.domain, isp: d.name || d.domain }));
        await addNodesFromList(domainList);
    }

    // 优选IP
    if (epi) {
        try {
            const dynamicIPList = await fetchDynamicIPs(ipv4Enabled, ipv6Enabled, ispMobile, ispUnicom, ispTelecom);
            if (dynamicIPList.length > 0) {
                await addNodesFromList(dynamicIPList);
            }
        } catch (error) {
            console.error('获取动态IP失败:', error);
        }
    }

    // GitHub优选
    if (egi) {
        try {
            const newIPList = await fetchAndParseNewIPs(piu);
            if (newIPList.length > 0) {
                // 确保至少有一个协议被启用
                const hasProtocol = evEnabled || etEnabled || vmEnabled;
                const useVL = hasProtocol ? evEnabled : true;  // 如果没有选择任何协议，默认使用VLESS
                
                if (useVL) {
                    finalLinks.push(...generateLinksFromNewIPs(newIPList, user, nodeDomain, wsPath));
                }
                // GitHub IP只支持VLESS格式
            }
        } catch (error) {
            console.error('获取GitHub IP失败:', error);
        }
    }

    if (finalLinks.length === 0) {
        const errorRemark = "所有节点获取失败";
        const errorLink = `vless://00000000-0000-0000-0000-000000000000@127.0.0.1:80?encryption=none&security=none&type=ws&host=error.com&path=%2F#${encodeURIComponent(errorRemark)}`;
        finalLinks.push(errorLink);
    }

    let subscriptionContent;
    let contentType = 'text/plain; charset=utf-8';
    
    switch (target.toLowerCase()) {
        case 'clash':
        case 'clashr':
            subscriptionContent = generateClashConfig(finalLinks);
            contentType = 'text/yaml; charset=utf-8';
            break;
        case 'surge':
        case 'surge2':
        case 'surge3':
        case 'surge4':
            subscriptionContent = generateSurgeConfig(finalLinks);
            break;
        case 'quantumult':
        case 'quanx':
            subscriptionContent = generateQuantumultConfig(finalLinks);
            break;
        default:
            subscriptionContent = utf8_to_b64(finalLinks.join('\n'));
    }
    
    return new Response(subscriptionContent, {
        headers: { 
            'Content-Type': contentType,
            'Cache-Control': 'no-store, no-cache, must-revalidate, max-age=0',
        },
    });
}

// 生成Clash配置（简化版，返回YAML格式）
function generateClashConfig(links) {
    let yaml = 'port: 7890\n';
    yaml += 'socks-port: 7891\n';
    yaml += 'allow-lan: false\n';
    yaml += 'mode: rule\n';
    yaml += 'log-level: info\n\n';
    yaml += 'proxies:\n';
    
    const proxyNames = [];
    links.forEach((link, index) => {
        const name = decodeURIComponent(link.split('#')[1] || `节点${index + 1}`);
        proxyNames.push(name);
        const server = link.match(/@([^:]+):(\d+)/)?.[1] || '';
        const port = link.match(/@[^:]+:(\d+)/)?.[1] || '443';
        const uuid = link.match(/vless:\/\/([^@]+)@/)?.[1] || '';
        const tls = link.includes('security=tls');
        const path = link.match(/path=([^&#]+)/)?.[1] || '/';
        const host = link.match(/host=([^&#]+)/)?.[1] || '';
        const sni = link.match(/sni=([^&#]+)/)?.[1] || '';
        
        yaml += `  - name: ${name}\n`;
        yaml += `    type: vless\n`;
        yaml += `    server: ${server}\n`;
        yaml += `    port: ${port}\n`;
        yaml += `    uuid: ${uuid}\n`;
        yaml += `    tls: ${tls}\n`;
        yaml += `    network: ws\n`;
        yaml += `    ws-opts:\n`;
        yaml += `      path: ${path}\n`;
        yaml += `      headers:\n`;
        yaml += `        Host: ${host}\n`;
        if (sni) {
            yaml += `    servername: ${sni}\n`;
        }
    });
    
    yaml += '\nproxy-groups:\n';
    yaml += '  - name: PROXY\n';
    yaml += '    type: select\n';
    yaml += `    proxies: [${proxyNames.map(n => `'${n}'`).join(', ')}]\n`;
    yaml += '\nrules:\n';
    yaml += '  - DOMAIN-SUFFIX,local,DIRECT\n';
    yaml += '  - IP-CIDR,127.0.0.0/8,DIRECT\n';
    yaml += '  - GEOIP,CN,DIRECT\n';
    yaml += '  - MATCH,PROXY\n';
    
    return yaml;
}

// 生成Surge配置
function generateSurgeConfig(links) {
    let config = '[Proxy]\n';
    links.forEach(link => {
        const name = decodeURIComponent(link.split('#')[1] || '节点');
        config += `${name} = vless, ${link.match(/@([^:]+):(\d+)/)?.[1] || ''}, ${link.match(/@[^:]+:(\d+)/)?.[1] || '443'}, username=${link.match(/vless:\/\/([^@]+)@/)?.[1] || ''}, tls=${link.includes('security=tls')}, ws=true, ws-path=${link.match(/path=([^&#]+)/)?.[1] || '/'}, ws-headers=Host:${link.match(/host=([^&#]+)/)?.[1] || ''}\n`;
    });
    config += '\n[Proxy Group]\nPROXY = select, ' + links.map((_, i) => decodeURIComponent(links[i].split('#')[1] || `节点${i + 1}`)).join(', ') + '\n';
    return config;
}

// 生成Quantumult配置
function generateQuantumultConfig(links) {
    return utf8_to_b64(links.join('\n'));
}



// 生成现代极简风格主页
function generateHomePage(scuValue, defaultUUID = '') {
    const scu = scuValue || 'https://url.v1.mk/sub';
    return `<!DOCTYPE html>
<html lang="zh-CN">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
    <title>Cloudflare 优选订阅</title>
    <style>
        :root {
            --primary: #007aff;
            --bg: #1c1c1e;
            --card-bg: rgba(44, 44, 46, 0.8);
            --text: #f5f5f7;
            --text-sec: #98989d;
            --border: rgba(255, 255, 255, 0.1);
            --shadow: 0 4px 24px rgba(0, 0, 0, 0.2);
            --input-bg: rgba(255, 255, 255, 0.1);
            --success: #32d74b;
            --error: #ff453a;
        }

        * { margin: 0; padding: 0; box-sizing: border-box; -webkit-tap-highlight-color: transparent; font-family: -apple-system, BlinkMacSystemFont, "SF Pro Display", "Segoe UI", Roboto, sans-serif; }
        
        body {
            background: var(--bg);
            color: var(--text);
            min-height: 100vh;
            padding: 20px;
            transition: background 0.3s;
        }

        .container {
            max-width: 640px;
            margin: 0 auto;
            padding-bottom: 40px;
        }

        .header {
            text-align: center;
            padding: 40px 0;
        }

        .header h1 {
            font-size: 28px;
            font-weight: 700;
            margin-bottom: 8px;
            background: linear-gradient(135deg, #007aff, #5856d6);
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
        }

        .card {
            background: var(--card-bg);
            backdrop-filter: blur(20px);
            -webkit-backdrop-filter: blur(20px);
            border-radius: 20px;
            padding: 24px;
            margin-bottom: 20px;
            border: 1px solid var(--border);
            box-shadow: var(--shadow);
        }

        .section-title {
            font-size: 13px;
            font-weight: 600;
            color: var(--text-sec);
            text-transform: uppercase;
            letter-spacing: 1px;
            margin-bottom: 16px;
        }

        .input-group {
            margin-bottom: 16px;
        }

        .input-label {
            display: block;
            font-size: 14px;
            font-weight: 500;
            margin-bottom: 8px;
            color: var(--text);
        }

        input, textarea {
            width: 100%;
            padding: 12px 16px;
            background: var(--input-bg);
            border: none;
            border-radius: 12px;
            font-size: 16px;
            color: var(--text);
            outline: none;
            transition: 0.2s;
        }

        input:focus, textarea:focus {
            box-shadow: 0 0 0 2px var(--primary);
            background: transparent;
        }

        .row {
            display: flex;
            gap: 12px;
            margin-bottom: 16px;
        }

        .col { flex: 1; }

        .switch-row {
            display: flex;
            justify-content: space-between;
            align-items: center;
            padding: 12px 0;
            border-bottom: 1px solid var(--border);
        }
        
        .switch-row:last-child { border-bottom: none; }

        .switch {
            position: relative;
            width: 50px;
            height: 30px;
            background: var(--input-bg);
            border-radius: 15px;
            cursor: pointer;
            transition: 0.3s;
        }

        .switch.active { background: var(--success); }

        .switch::after {
            content: '';
            position: absolute;
            top: 2px;
            left: 2px;
            width: 26px;
            height: 26px;
            background: white;
            border-radius: 50%;
            transition: 0.3s cubic-bezier(0.4, 0.0, 0.2, 1);
            box-shadow: 0 2px 4px rgba(0,0,0,0.1);
        }

        .switch.active::after { transform: translateX(20px); }

        .btn {
            width: 100%;
            padding: 14px;
            background: var(--primary);
            color: white;
            border: none;
            border-radius: 12px;
            font-size: 16px;
            font-weight: 600;
            cursor: pointer;
            transition: 0.2s;
        }

        .btn:active { transform: scale(0.98); opacity: 0.9; }
        
        .btn-outline {
            background: transparent;
            border: 1px solid var(--primary);
            color: var(--primary);
        }

        .grid {
            display: grid;
            grid-template-columns: repeat(auto-fill, minmax(100px, 1fr));
            gap: 10px;
            margin-top: 16px;
        }

        .client-card {
            background: var(--input-bg);
            padding: 12px 8px;
            border-radius: 12px;
            text-align: center;
            cursor: pointer;
            transition: 0.2s;
            font-size: 13px;
            font-weight: 500;
            color: var(--primary);
        }

        .client-card:active { transform: scale(0.96); }

        .result-box {
            margin-top: 16px;
            padding: 16px;
            background: var(--input-bg);
            border-radius: 12px;
            font-size: 14px;
            word-break: break-all;
            display: none;
        }
        
        .result-box.success { border-left: 4px solid var(--success); }
        .result-box.error { border-left: 4px solid var(--error); }

        .footer {
            text-align: center;
            margin-top: 40px;
            color: var(--text-sec);
            font-size: 13px;
        }
        
        .footer a { color: var(--primary); text-decoration: none; }

        /* Toast Notification */
        .toast {
            position: fixed;
            top: 20px;
            left: 50%;
            transform: translateX(-50%) translateY(-100px);
            background: rgba(0, 0, 0, 0.8);
            color: white;
            padding: 12px 24px;
            border-radius: 24px;
            font-size: 14px;
            z-index: 1000;
            transition: 0.3s cubic-bezier(0.4, 0.0, 0.2, 1);
            backdrop-filter: blur(10px);
        }
        
        .toast.show { transform: translateX(-50%) translateY(0); }
    </style>
</head>
<body>
    <div class="toast" id="toast">Notification</div>

    <div class="container">
        <div class="header">
            <h1>Cloudflare Preferred</h1>
        </div>

        <div class="card">
            <div class="section-title">基础配置</div>
            <div class="input-group">
                <label class="input-label">Worker 域名</label>
                <input type="text" id="domain" placeholder="例如: cdn.example.com">
            </div>
            <div class="input-group">
                <label class="input-label">UUID</label>
                <input type="text" id="uuid" placeholder="xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx" value="${defaultUUID}">
            </div>
            <div class="input-group">
                <label class="input-label">自定义路径 (可选)</label>
                <input type="text" id="customPath" placeholder="/" value="/">
            </div>
            
            <div class="switch-row">
                <span>优选域名</span>
                <div class="switch active" id="switchDomain" onclick="toggleSwitch('switchDomain')"></div>
            </div>
            <div class="switch-row">
                <span>优选 IP</span>
                <div class="switch active" id="switchIP" onclick="toggleSwitch('switchIP')"></div>
            </div>
            <div class="switch-row">
                <span>GitHub 优选</span>
                <div class="switch active" id="switchGitHub" onclick="toggleSwitch('switchGitHub')"></div>
            </div>
            <div class="switch-row">
                <span>本地上传 IP</span>
                <div class="switch active" id="switchAPI" onclick="toggleSwitch('switchAPI')"></div>
            </div>
             <div class="input-group" id="githubUrlGroup" style="margin-top: 12px;">
                <input type="text" id="githubUrl" placeholder="自定义 GitHub 优选 URL (可选)">
            </div>
        </div>

        <div class="card">
            <div class="section-title">本地上传 IP (yx-tools)</div>
            <div class="row">
                <button class="btn btn-outline" onclick="fetchUploadedIPs()">刷新列表</button>
                <button class="btn btn-outline" style="border-color: var(--error); color: var(--error);" onclick="clearUploadedIPs()">清空列表</button>
            </div>
            <div style="overflow-x: auto; margin-top: 12px;">
                <table style="width: 100%; border-collapse: collapse; font-size: 13px; color: var(--text);">
                    <thead>
                        <tr style="text-align: left; border-bottom: 1px solid var(--border);">
                            <th style="padding: 8px;">IP:端口</th>
                            <th style="padding: 8px;">备注</th>
                            <th style="padding: 8px;">上传时间</th>
                        </tr>
                    </thead>
                    <tbody id="uploadedIPsTableBody">
                        <tr><td colspan="3" style="padding: 16px; text-align: center; color: var(--text-sec);">暂无数据，请点击刷新</td></tr>
                    </tbody>
                </table>
            </div>
        </div>

        <div class="card">
            <div class="section-title">协议与选项</div>
            <div class="switch-row">
                <span>VLESS</span>
                <div class="switch active" id="switchVL" onclick="toggleSwitch('switchVL')"></div>
            </div>
            <div class="switch-row">
                <span>Trojan</span>
                <div class="switch" id="switchTJ" onclick="toggleSwitch('switchTJ')"></div>
            </div>
            <div class="switch-row">
                <span>VMess</span>
                <div class="switch" id="switchVM" onclick="toggleSwitch('switchVM')"></div>
            </div>
             <div class="switch-row">
                <span>仅 TLS</span>
                <div class="switch" id="switchTLS" onclick="toggleSwitch('switchTLS')"></div>
            </div>
            
            <div class="row" style="margin-top: 12px;">
                <label style="display:flex; align-items:center; gap:8px; font-size:14px;">
                    <input type="checkbox" id="ipv4Enabled" checked style="width:auto;"> IPv4
                </label>
                <label style="display:flex; align-items:center; gap:8px; font-size:14px;">
                    <input type="checkbox" id="ipv6Enabled" checked style="width:auto;"> IPv6
                </label>
            </div>
        </div>

        <div class="card">
            <div class="section-title">一键导入客户端</div>
            <div class="grid">
                <div class="client-card" onclick="generateClientLink('clash', 'CLASH')">CLASH</div>
                <div class="client-card" onclick="generateClientLink('clash', 'STASH')">STASH</div>
                <div class="client-card" onclick="generateClientLink('surge', 'SURGE')">SURGE</div>
                <div class="client-card" onclick="generateClientLink('sing-box', 'SING-BOX')">SING-BOX</div>
                <div class="client-card" onclick="generateClientLink('loon', 'LOON')">LOON</div>
                <div class="client-card" onclick="generateClientLink('quanx', 'Quant X')">Quantumult X</div>
                <div class="client-card" onclick="generateClientLink('v2ray', 'V2RAY')">V2RAY</div>
                <div class="client-card" onclick="generateClientLink('v2ray', 'Shadowrocket')">Shadowrocket</div>
            </div>
            <div id="clientSubscriptionUrl" class="result-box"></div>
        </div>

        <div class="footer">
            <p>Powered by Cloudflare Workers</p>
            <div style="margin-top: 10px;">
                <a href="https://github.com/byJoey/cfnew" target="_blank">GitHub</a> • 
                <a href="https://www.youtube.com/@joeyblog" target="_blank">YouTube</a>
            </div>
        </div>
    </div>

    <script>
        let switches = {
            switchDomain: true,
            switchIP: true,
            switchGitHub: true,
            switchAPI: true,
            switchVL: true,
            switchTJ: false,
            switchVM: false,
            switchTLS: false
        };

        function toggleSwitch(id) {
            const switchEl = document.getElementById(id);
            switches[id] = !switches[id];
            switchEl.classList.toggle('active');
        }

        function showToast(msg) {
            const toast = document.getElementById('toast');
            toast.textContent = msg;
            toast.classList.add('show');
            setTimeout(() => toast.classList.remove('show'), 3000);
        }

        // 订阅转换地址
        const SUB_CONVERTER_URL = "${ scu }";

        function tryOpenApp(schemeUrl, fallbackCallback, timeout = 2500) {
            let appOpened = false;
            let callbackExecuted = false;
            const startTime = Date.now();
            
            const blurHandler = () => {
                if (Date.now() - startTime < 3000 && !callbackExecuted) appOpened = true;
            };
            
            window.addEventListener('blur', blurHandler);
            document.addEventListener('visibilitychange', () => {
                if (document.hidden && Date.now() - startTime < 3000 && !callbackExecuted) appOpened = true;
            });
            
            const iframe = document.createElement('iframe');
            iframe.style.display = 'none';
            iframe.src = schemeUrl;
            document.body.appendChild(iframe);
            
            setTimeout(() => {
                document.body.removeChild(iframe);
                window.removeEventListener('blur', blurHandler);
                if (!callbackExecuted) {
                    callbackExecuted = true;
                    if (!appOpened && fallbackCallback) fallbackCallback();
                }
            }, timeout);
        }

                async function fetchUploadedIPs() {
            const uuid = document.getElementById('uuid').value.trim();
            if (!uuid) return showToast('请先填写 UUID');
            
            const btn = event.target;
            const originalText = btn.textContent;
            btn.textContent = '加载中...';
            
            try {
                const response = await fetch(\`/\${uuid}/api/preferred-ips\`);
                if (!response.ok) throw new Error('获取失败');
                const data = await response.json();
                
                const tbody = document.getElementById('uploadedIPsTableBody');
                tbody.innerHTML = '';
                
                if (data.data && data.data.length > 0) {
                    data.data.sort((a, b) => {
                        return (new Date(b.addedAt || 0)) - (new Date(a.addedAt || 0));
                    });

                    data.data.forEach(item => {
                        const tr = document.createElement('tr');
                        tr.style.borderBottom = '1px solid var(--border)';
                        
                        const timeStr = item.addedAt ? new Date(item.addedAt).toLocaleString() : '-';
                        
                        tr.innerHTML = \`
                            <td style="padding: 8px; font-family: monospace;">\${item.ip}:\${item.port}</td>
                            <td style="padding: 8px;">\${item.name}</td>
                            <td style="padding: 8px; color: var(--text-sec); font-size: 12px;">\${timeStr}</td>
                        \`;
                        tbody.appendChild(tr);
                    });
                } else {
                     tbody.innerHTML = '<tr><td colspan="3" style="padding: 16px; text-align: center; color: var(--text-sec);">没有找到已上传的IP</td></tr>';
                }
                showToast(\`加载成功，共 \${data.count} 个IP\`);
            } catch (e) {
                showToast(e.message);
            } finally {
                btn.textContent = originalText;
            }
        }

        async function clearUploadedIPs() {
            if (!confirm('确定要清空所有上传的IP吗？')) return;
            
            const uuid = document.getElementById('uuid').value.trim();
            if (!uuid) return showToast('请先填写 UUID');
            
            try {
                const response = await fetch(\`/\${uuid}/api/preferred-ips\`, {
                    method: 'DELETE',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ all: true })
                });
                if (response.ok) {
                    showToast('已清空');
                    fetchUploadedIPs();
                } else {
                    showToast('清空失败');
                }
            } catch (e) {
                showToast('请求错误');
            }
        }

        function generateClientLink(clientType, clientName) {
            const domain = document.getElementById('domain').value.trim();
            const uuid = document.getElementById('uuid').value.trim();
            const customPath = document.getElementById('customPath').value.trim() || '/';
            
            if (!domain || !uuid) return showToast('请填写域名和 UUID');
            if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(uuid)) return showToast('UUID 格式错误');
            if (!switches.switchVL && !switches.switchTJ && !switches.switchVM) return showToast('请至少选择一个协议');

            const ipv4Enabled = document.getElementById('ipv4Enabled').checked;
            const ipv6Enabled = document.getElementById('ipv6Enabled').checked;
            const githubUrl = document.getElementById('githubUrl').value.trim();
            
            const currentUrl = new URL(window.location.href);
            let subscriptionUrl = \`\${currentUrl.origin}/\${uuid}/sub?domain=\${encodeURIComponent(domain)}&epd=\${switches.switchDomain?'yes':'no'}&epi=\${switches.switchIP?'yes':'no'}&egi=\${switches.switchGitHub?'yes':'no'}&eapi=\${switches.switchAPI?'yes':'no'}\`;
            
            if (githubUrl) subscriptionUrl += \`&piu=\${encodeURIComponent(githubUrl)}\`;
            if (switches.switchVL) subscriptionUrl += '&ev=yes';
            if (switches.switchTJ) subscriptionUrl += '&et=yes';
            if (switches.switchVM) subscriptionUrl += '&vm=yes';
            if (!ipv4Enabled) subscriptionUrl += '&ipv4=no';
            if (!ipv6Enabled) subscriptionUrl += '&ipv6=no';
            if (switches.switchTLS) subscriptionUrl += '&dkby=yes';
            if (customPath !== '/') subscriptionUrl += \`&path=\${encodeURIComponent(customPath)}\`;

            let finalUrl = subscriptionUrl;
            let schemeUrl = '';

            const copyToClipboard = (url, name) => {
                navigator.clipboard.writeText(url).then(() => showToast(\`\${name} 订阅链接已复制\`));
            };

            if (clientType === 'v2ray') {
                const urlElement = document.getElementById('clientSubscriptionUrl');
                urlElement.textContent = finalUrl;
                urlElement.style.display = 'block';
                
                if (clientName === 'V2RAY') {
                    copyToClipboard(finalUrl, clientName);
                } else {
                    if (clientName === 'Shadowrocket') schemeUrl = 'shadowrocket://add/' + encodeURIComponent(finalUrl);
                    else if (clientName === 'V2RAYNG') schemeUrl = 'v2rayng://install?url=' + encodeURIComponent(finalUrl);
                    else if (clientName === 'NEKORAY') schemeUrl = 'nekoray://install-config?url=' + encodeURIComponent(finalUrl);
                    
                    if (schemeUrl) tryOpenApp(schemeUrl, () => copyToClipboard(finalUrl, clientName));
                }
            } else {
                const encodedUrl = encodeURIComponent(subscriptionUrl);
                finalUrl = \`\${SUB_CONVERTER_URL}?target=\${clientType}&url=\${encodedUrl}&insert=false&emoji=true&list=false&xudp=false&udp=false&tfo=false&expand=true&scv=false&fdn=false&new_name=true\`;
                
                const urlElement = document.getElementById('clientSubscriptionUrl');
                urlElement.textContent = finalUrl;
                urlElement.style.display = 'block';

                if (clientType === 'clash') schemeUrl = \`clash://install-config?url=\${encodeURIComponent(finalUrl)}\`;
                else if (clientType === 'surge') schemeUrl = \`surge:///install-config?url=\${encodeURIComponent(finalUrl)}\`;
                else if (clientType === 'sing-box') schemeUrl = \`sing-box://install-config?url=\${encodeURIComponent(finalUrl)}\`;
                else if (clientType === 'loon') schemeUrl = \`loon://install?url=\${encodeURIComponent(finalUrl)}\`;
                else if (clientType === 'quanx') schemeUrl = \`quantumult-x://install-config?url=\${encodeURIComponent(finalUrl)}\`;

                if (schemeUrl) tryOpenApp(schemeUrl, () => copyToClipboard(finalUrl, clientName));
                else copyToClipboard(finalUrl, clientName);
            }
        }



    </script>
</body>
</html>`;
}

// 主处理函数
export default {
    async fetch(request, env, ctx) {
        // 初始化KV和配置
        await initKVStore(env);
        adminUUID = env.UUID || '';
        updateCustomPreferredFromYx();

        const url = new URL(request.url);
        const path = url.pathname;
        
        // API 路由处理 (优选IP上传)
        if (path.endsWith('/api/preferred-ips')) {
            const pathParts = path.split('/').filter(p => p);
            if (pathParts.length >= 3 && pathParts[pathParts.length - 2] === 'api') {
                const prefix = pathParts.slice(0, pathParts.length - 2).join('/');
                let authorized = false;
                if (adminUUID && prefix === adminUUID) {
                    authorized = true;
                } else if (!adminUUID && isValidUUID(prefix)) {
                    authorized = true;
                }

                if (authorized) {
                    return await handlePreferredIPsAPI(request);
                } else {
                    return new Response(JSON.stringify({ error: 'Unauthorized', message: '路径验证失败' }), { status: 403, headers: { 'Content-Type': 'application/json' } });
                }
            }
        }

        // 主页
        if (adminUUID && path === `/${adminUUID}`) {
            const scuValue = env?.scu || scu;
            return new Response(generateHomePage(scuValue, adminUUID), {
                headers: { 'Content-Type': 'text/html; charset=utf-8' }
            });
        }

        if (!adminUUID && (path === '/' || path === '')) {
            const scuValue = env?.scu || scu;
            return new Response(generateHomePage(scuValue, ''), {
                headers: { 'Content-Type': 'text/html; charset=utf-8' }
            });
        }

        if (path === '/' || path === '') {
             return new Response('Access Denied: Please use your UUID path.', { status: 403 });
        }
        

        
        // 订阅请求格式: /{UUID}/sub?domain=xxx&epd=yes&epi=yes&egi=yes
        const pathMatch = path.match(/^\/([^\/]+)\/sub$/);
        if (pathMatch) {
            const uuid = pathMatch[1];
            
            if (!isValidUUID(uuid)) {
                return new Response('无效的UUID格式', { status: 400 });
            }
            
            const domain = url.searchParams.get('domain');
            if (!domain) {
                return new Response('缺少域名参数', { status: 400 });
            }
            
            // 从URL参数获取配置
            epd = url.searchParams.get('epd') !== 'no';
            epi = url.searchParams.get('epi') !== 'no';
            egi = url.searchParams.get('egi') !== 'no';
            eapi = url.searchParams.get('eapi') !== 'no';
            const piu = url.searchParams.get('piu') || defaultIPURL;
            
            // 协议选择
            const evEnabled = url.searchParams.get('ev') === 'yes' || (url.searchParams.get('ev') === null && ev);
            const etEnabled = url.searchParams.get('et') === 'yes';
            const vmEnabled = url.searchParams.get('vm') === 'yes';
            
            // IPv4/IPv6选择
            const ipv4Enabled = url.searchParams.get('ipv4') !== 'no';
            const ipv6Enabled = url.searchParams.get('ipv6') !== 'no';
            
            // 运营商选择
            const ispMobile = url.searchParams.get('ispMobile') !== 'no';
            const ispUnicom = url.searchParams.get('ispUnicom') !== 'no';
            const ispTelecom = url.searchParams.get('ispTelecom') !== 'no';
            
            // TLS控制
            const disableNonTLS = url.searchParams.get('dkby') === 'yes';
            
            // 自定义路径
            const customPath = url.searchParams.get('path') || '/';
            
            return await handleSubscriptionRequest(request, uuid, domain, piu, ipv4Enabled, ipv6Enabled, ispMobile, ispUnicom, ispTelecom, evEnabled, etEnabled, vmEnabled, disableNonTLS, customPath);
        }
        
        return new Response('Not Found', { status: 404 });
    }
};

// KV存储相关函数
async function initKVStore(env) {
    if (env.C) {
        try {
            kvStore = env.C;
            await loadKVConfig();
        } catch (error) {
            kvStore = null;
        }
    }
}

async function loadKVConfig() {
    if (!kvStore) return;
    try {
        const configData = await kvStore.get('c');
        if (configData) {
            kvConfig = JSON.parse(configData);
        }
    } catch (error) {
        kvConfig = {};
    }
}

async function saveKVConfig() {
    if (!kvStore) return;
    try {
        await kvStore.put('c', JSON.stringify(kvConfig));
    } catch (error) {
        console.error('保存KV配置失败:', error);
    }
}

async function setConfigValue(key, value) {
    kvConfig[key] = value;
    await saveKVConfig();
}

// 优选IP处理API
async function handlePreferredIPsAPI(request) {
    if (!kvStore) {
        return new Response(JSON.stringify({
            success: false,
            error: 'KV存储未配置',
            message: '需要配置KV存储才能使用此功能'
        }), { status: 503, headers: { 'Content-Type': 'application/json' } });
    }

    try {
        if (request.method === 'GET') {
            const yxValue = getConfigValue('yx', '');
            const pi = parseYxToArray(yxValue);
            return new Response(JSON.stringify({
                success: true,
                count: pi.length,
                data: pi
            }), { headers: { 'Content-Type': 'application/json' } });

        } else if (request.method === 'POST') {
            const body = await request.json();
            const ipsToAdd = Array.isArray(body) ? body : [body];

            if (ipsToAdd.length === 0) {
                return new Response(JSON.stringify({ success: false, error: '请求数据为空' }), { status: 400 });
            }

            const yxValue = getConfigValue('yx', '');
            let pi = parseYxToArray(yxValue);
            const addedIPs = [];

            for (const item of ipsToAdd) {
                if (!item.ip) continue;
                const port = item.port || 443;
                const name = item.name || `API优选-${item.ip}:${port}`;

                if (!isValidIP(item.ip) && !isValidDomain(item.ip)) continue;

                const exists = pi.some(existItem => existItem.ip === item.ip && existItem.port === port);
                if (!exists) {
                    const newIP = { ip: item.ip, port: port, name: name, addedAt: new Date().toISOString() };
                    pi.push(newIP);
                    addedIPs.push(newIP);
                }
            }

            if (addedIPs.length > 0) {
                const newYxValue = arrayToYx(pi);
                await setConfigValue('yx', newYxValue);
                updateCustomPreferredFromYx();
            }

            return new Response(JSON.stringify({
                success: addedIPs.length > 0,
                message: `成功添加 ${addedIPs.length} 个IP`,
                added: addedIPs.length
            }), { headers: { 'Content-Type': 'application/json' } });

        } else if (request.method === 'DELETE') {
            const body = await request.json();
            if (body.all === true) {
                await setConfigValue('yx', '');
                updateCustomPreferredFromYx();
                return new Response(JSON.stringify({ success: true, message: '已清空所有优选IP' }), { headers: { 'Content-Type': 'application/json' } });
            }
            
            return new Response(JSON.stringify({ success: false, message: '仅支持全部删除' }), { status: 400 });
        }
    } catch (error) {
        return new Response(JSON.stringify({ success: false, error: error.message }), { status: 500 });
    }
}

// 辅助函数
function isValidIP(ip) {
    const ipv4Regex = /^(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/;
    const ipv6Regex = /^(?:[0-9a-fA-F]{1,4}:){7}[0-9a-fA-F]{1,4}$/;
    const ipv6ShortRegex = /^::1$|^::$|^(?:[0-9a-fA-F]{1,4}:)*::(?:[0-9a-fA-F]{1,4}:)*[0-9a-fA-F]{1,4}$/;
    return ipv4Regex.test(ip) || ipv6Regex.test(ip) || ipv6ShortRegex.test(ip);
}

function isValidDomain(domain) {
    const domainRegex = /^(?:[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?\.)+[a-zA-Z]{2,}$/;
    return domainRegex.test(domain);
}

function parseAddressAndPort(input) {
    if (input.includes('[') && input.includes(']')) {
        const match = input.match(/^\[([^\]]+)\](?::(\d+))?$/);
        if (match) return { address: match[1], port: match[2] ? parseInt(match[2], 10) : null };
    }
    const lastColonIndex = input.lastIndexOf(':');
    if (lastColonIndex > 0) {
        const address = input.substring(0, lastColonIndex);
        const portStr = input.substring(lastColonIndex + 1);
        const port = parseInt(portStr, 10);
        if (!isNaN(port) && port > 0 && port <= 65535) return { address, port };
    }
    return { address: input, port: null };
}

function parseYxToArray(yxValue) {
    if (!yxValue || !yxValue.trim()) return [];
    const items = yxValue.split(',').map(item => item.trim()).filter(item => item);
    const result = [];
    for (const item of items) {
        let nodeName = '';
        let addressPart = item;
        let addedAt = '';

        if (item.includes('|')) {
            const parts = item.split('|');
            addressPart = parts[0].trim();
            addedAt = parts[1].trim();
        }

        if (addressPart.includes('#')) {
            const parts = addressPart.split('#');
            addressPart = parts[0].trim();
            nodeName = parts[1].trim();
        }
        const { address, port } = parseAddressAndPort(addressPart);
        if (!nodeName) nodeName = address + (port ? ':' + port : '');
        result.push({ ip: address, port: port || 443, name: nodeName, addedAt: addedAt });
    }
    return result;
}

function arrayToYx(array) {
    if (!array || array.length === 0) return '';
    return array.map(item => {
        const port = item.port || 443;
        let str = `${item.ip}:${port}#${item.name}`;
        if (item.addedAt) {
            str += `|${item.addedAt}`;
        }
        return str;
    }).join(',');
}

function updateCustomPreferredFromYx() {
    const yxValue = getConfigValue('yx', '');
    if (yxValue) {
        try {
            const preferredList = parseYxToArray(yxValue);
            customPreferredIPs = [];
            customPreferredDomains = [];
            preferredList.forEach(item => {
                if (isValidIP(item.ip)) {
                    customPreferredIPs.push({ ip: item.ip, port: item.port, isp: item.name });
                } else {
                    customPreferredDomains.push({ domain: item.ip, port: item.port, name: item.name });
                }
            });
        } catch (err) {
            customPreferredIPs = [];
            customPreferredDomains = [];
        }
    } else {
        customPreferredIPs = [];
        customPreferredDomains = [];
    }
}
