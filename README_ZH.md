# WebRTC Matrix (中文文档)

[English Documentation](./README.md)

> 跨浏览器 WebRTC 隐私增强管理扩展。

...

## 开源协议

GPL-3.0

**WebRTC Matrix** 是一款专门用于通过精细化策略管理 WebRTC 权限的浏览器扩展。与市面上仅提供全局开关的拦截工具不同，WebRTC Matrix 提供了基于域名的黑白名单管理、全局兜底策略，并支持通过 WebDAV 协议进行多端同步，全方位保护您的 IP 隐私。

## 核心功能

- **精细化控制**: 针对特定网站开启或关闭 WebRTC，不再需要全局禁用。
- **全局兜底策略**: 为未配置规则的网站设置默认行为（例如“仅允许公网 IP”或“强制走代理”）。
- **智能拦截**: 采用 DOM 级注入技术，在页面加载初期即拦截 `RTCPeerConnection` 接口，防止通过脚本绕过。
- **云端同步**: 支持配置任意 WebDAV 服务器（如 Nextcloud）同步您的规则列表（二期功能）。
- **现代化界面**: 基于 Vue 3 构建的深色模式 UI，简洁美观。

## 安装指南

### 源码安装 (开发模式)

1.  **克隆项目**:
    ```bash
    git clone https://github.com/somnifex/webrtc-matrix.git
    cd webrtc-matrix
    ```

2.  **安装依赖**:
    ```bash
    npm install
    ```

3.  **编译扩展**:
    ```bash
    npm run build
    # 或者启动开发监听模式:
    npm run dev
    ```

4.  **加载到浏览器**:
    - **Chrome/Edge**:
        - 打开扩展管理页面 `chrome://extensions` 或 `edge://extensions`。
        - 开启右上角的 **开发者模式 (Developer Mode)**。
        - 点击 **加载已解压的扩展程序 (Load unpacked)**。
        - 选择项目目录下的 `dist` 文件夹。

## 使用说明

### 弹窗控制 (Popup)
点击浏览器工具栏的 **WebRTC Matrix 图标** 查看当前网站状态。
- **绿色**: 允许 WebRTC 连接。
- **红色**: 已拦截 WebRTC 连接。
- 点击中间的大电源按钮即可快速切换当前域名的拦截规则。

### 控制面板 (Dashboard)
右键点击扩展图标选择“选项 (Options)”，或在弹窗中点击“Dashboard”。
- **通用设置**: 配置浏览器的全局 WebRTC 策略（Level 2 防护）。
- **规则管理**: 查看、搜索、删除已保存的域名规则。
- **云同步**: 配置 WebDAV 服务器地址、账号密码，进行配置的上传与下载。

## 技术栈

- **框架**: [Vue 3](https://vuejs.org/)
- **构建工具**: [Vite](https://vitejs.dev/) + [CRXJS](https://crxjs.dev/)
- **语言**: [TypeScript](https://www.typescriptlang.org/)
- **存储**: Chrome Storage API


