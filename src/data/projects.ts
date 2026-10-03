// 根据公开仓库介绍整理；新增项目时更新此列表，页面不依赖 GitHub API。
export interface Project {
  name: string;
  description: string;
  category: string;
  tags: string[];
  github: string;
  website?: string;
}

export const projects: Project[] = [
  {
    name: 'NexLink',
    description: '基于 ESP32-S3 的有线与无线 CMSIS-DAP 调试器，集成 USB CDC UART 桥接，通过 ESP-NOW 实现远程调试通信。',
    category: '嵌入式与硬件',
    tags: ['C', 'ESP32-S3', 'CMSIS-DAP', 'ESP-NOW'],
    github: 'https://github.com/Miraitowa-la/NexLink',
  },
  {
    name: 'STM32-HAL-Modbus-Slave',
    description: '面向 STM32 HAL 的轻量级 Modbus RTU 从机协议栈，用于嵌入式设备与工业通信开发。',
    category: '嵌入式与硬件',
    tags: ['C', 'STM32', 'Modbus RTU', 'RS485'],
    github: 'https://github.com/Miraitowa-la/STM32-HAL-Modbus-Slave',
  },
  {
    name: 'esp_spi_link',
    description: 'ESP-IDF 双板 SPI 通信组件，提供帧协议、CRC 校验、READY 通知与 PING/PONG 握手，适用于主控与协处理器通信。',
    category: '嵌入式与硬件',
    tags: ['C', 'ESP-IDF', 'SPI', 'CRC16'],
    github: 'https://github.com/Miraitowa-la/esp_spi_link',
  },
  {
    name: 'esp_st7735',
    description: '面向 ESP-IDF 的 ST7735 SPI 彩屏驱动，适配常见 0.96 寸模块，支持同一 SPI 总线挂载多块 LCD。',
    category: '嵌入式与硬件',
    tags: ['C', 'ESP-IDF', 'ST7735', 'LCD'],
    github: 'https://github.com/Miraitowa-la/esp_st7735',
  },
  {
    name: 'SenseSymphony',
    description: '将人脸、手势与动作感知转化为音乐互动，集成 ESP32 视觉识别、触摸屏主机、蓝牙和移动端应用，支持演奏、节奏游戏与录制回放。',
    category: '物联网与应用',
    tags: ['C', 'ESP32', '视觉识别', '蓝牙'],
    github: 'https://github.com/Miraitowa-la/SenseSymphony',
  },
  {
    name: 'ModbusLink',
    description: '面向 Python 开发者的 Modbus 通信库，覆盖 Modbus RTU 与 TCP，提供可扩展的协议开发能力。',
    category: '物联网与应用',
    tags: ['Python', 'Modbus RTU', 'Modbus TCP'],
    github: 'https://github.com/Miraitowa-la/ModbusLink',
    website: 'https://miraitowa-la.github.io/ModbusLink/',
  },
  {
    name: 'ThingsBoardLink',
    description: '面向 Python 的 ThingsBoard 物联网平台交互工具包，围绕遥测数据、传感器数据与 RPC 提供平台集成能力。',
    category: '物联网与应用',
    tags: ['Python', 'ThingsBoard', 'IoT', 'RPC'],
    github: 'https://github.com/Miraitowa-la/ThingsBoardLink',
  },
  {
    name: 'OneHub',
    description: '使用 Kotlin 与 Jetpack Compose 构建的 Android 应用，以卡片式界面统一管理多个云平台的物联网设备数据，支持实时监控与展示。',
    category: '物联网与应用',
    tags: ['Kotlin', 'Jetpack Compose', 'Android', 'IoT'],
    github: 'https://github.com/Miraitowa-la/OneHub',
  },
  {
    name: 'MicroPython-Lib',
    description: '面向 MicroPython 的轻量级 Modbus 协议栈，用于微控制器上的通信开发。',
    category: '物联网与应用',
    tags: ['Python', 'MicroPython', 'Modbus', 'ESP32'],
    github: 'https://github.com/Miraitowa-la/MicroPython-Lib',
  },
  {
    name: 'WireLink-Studio',
    description: '浏览器端工业设备接线图编辑器，支持手动绘制导线、创建可折叠线束、接线校验与图纸导出。',
    category: 'Web 与工具',
    tags: ['TypeScript', 'React', 'React Flow', 'SVG'],
    github: 'https://github.com/Miraitowa-la/WireLink-Studio',
    website: 'https://miraitowa-la.github.io/WireLink-Studio/',
  },
  {
    name: 'miraitowa-site',
    description: '这个个人技术网站的源代码。使用 Astro 静态生成，通过 GitHub 与 Cloudflare Workers Builds 构建和发布。',
    category: 'Web 与工具',
    tags: ['Astro', 'TypeScript', 'Cloudflare'],
    github: 'https://github.com/Miraitowa-la/miraitowa-site',
    website: 'https://miraitowa-site.caojiaqing200656.workers.dev/',
  },
  {
    name: 'WireLink-Studio-Old',
    description: 'WireLink Studio 的旧版 MVP，支持设备拖放、端子连线、接线校验和 JSON 工程保存，保留用于回顾早期实现。',
    category: '历史版本',
    tags: ['TypeScript', '接线图', 'MVP'],
    github: 'https://github.com/Miraitowa-la/WireLink-Studio-Old',
  },
];
