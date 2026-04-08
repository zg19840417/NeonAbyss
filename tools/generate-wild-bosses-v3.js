#!/usr/bin/env node
// -*- coding: utf-8 -*-
/**
 * 野外Boss立绘生成器 v3 - 近景特写 + 背景虚化
 */

const http = require('http');
const fs = require('fs');
const path = require('path');

const COMFYUI_HOST = '127.0.0.1';
const COMFYUI_PORT = 8188;
const WORKFLOW_PATH = path.join(__dirname, '..', 'image_z_image_turbo.json');
const MAPPING_PATH = path.join(__dirname, 'mutant_portrait_mapping.json');
const WILD_BOSS_DIR = path.join(__dirname, '..', 'assets', 'images', 'characters', 'wild_boss');
const COMFYUI_OUTPUT = 'D:\\ComfyUI\\ComfyUI-aki-v2\\ComfyUI\\output';

const WIDTH = 1024;
const HEIGHT = 1536;

function readJson(filePath) {
  return JSON.parse(fs.readFileSync(filePath, 'utf-8'));
}

function apiRequest(method, endpoint, data = null) {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: COMFYUI_HOST,
      port: COMFYUI_PORT,
      path: endpoint,
      method: method,
      headers: { 'Content-Type': 'application/json' }
    };
    const req = http.request(options, (res) => {
      let body = '';
      res.on('data', chunk => body += chunk);
      res.on('end', () => {
        try { resolve(JSON.parse(body)); }
        catch (e) { resolve(body); }
      });
    });
    req.on('error', reject);
    if (data) req.write(JSON.stringify(data));
    req.end();
  });
}

async function submitPrompt(prompt) {
  const res = await apiRequest('POST', '/prompt', { prompt });
  if (!res.prompt_id) throw new Error('提交失败');
  return res.prompt_id;
}

async function waitForCompletion(promptId, timeout = 300000) {
  const start = Date.now();
  while (Date.now() - start < timeout) {
    const history = await apiRequest('GET', `/history/${promptId}`);
    if (history[promptId]) {
      if (history[promptId].status && history[promptId].status.exec_error) {
        throw new Error('执行错误');
      }
      return history[promptId];
    }
    await sleep(2000);
  }
  throw new Error('超时');
}

function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

function getImages(history) {
  const images = [];
  for (const nodeId in history.outputs) {
    const output = history.outputs[nodeId];
    if (output.images) {
      output.images.forEach(img => images.push(img));
    }
  }
  return images;
}

function copyImage(image, targetPath) {
  const src = path.join(COMFYUI_OUTPUT, image.subfolder || '', image.filename);
  if (fs.existsSync(src)) {
    fs.copyFileSync(src, targetPath);
    return true;
  }
  return false;
}

function getPrompt(portraitId, data) {
  // v3版本 - 近景特写 + 背景虚化
  const prompts = {
    radiation_beast: `超写实风格，1024x1536竖屏立绘，废土末世世界观，近距离BOSS特写浅景深。

【主体特写】
核战后的废墟旷野中，一头由核辐射造就的巨型变异生物面部特写。体型巨大，约5米高，四足行走姿态，像一头畸形的巨型野牛。全身覆盖着深灰色的变异皮肤，皮肤表面布满发光的辐射裂纹，裂纹中透出幽绿色的辐射光芒，在黑暗中像燃烧的脉络一样跳动。两只眼睛已经从正常的眼睛变异为两个燃烧着幽绿色火焰的空洞，火焰在眼眶中跳动，散发出诡异的光芒，占据画面的焦点。皮肤上的辐射结晶簇发出微弱的荧光，照亮周围的空间。

【近景细节】
从这个距离可以看到皮肤上辐射裂纹的每一处细节——像是熔岩流经灰烬留下的痕迹，裂纹中有幽绿色的液体在缓慢流动。巨大的獠牙从血盆大口中伸出，表面有辐射腐蚀的坑洞。鼻孔不断喷出带有辐射尘埃的白色雾气。周围有飘浮的辐射尘埃粒子，在它的身体周围形成一层幽绿色的光晕。

【背景环境】
背景是辐射废墟的旷野——巨大的弹坑，被核爆摧毁的建筑残骸，飘浮的辐射尘埃。天空中有扭曲的辐射云层，发出诡异的绿色荧光。所有背景元素都处于极度的虚化中，只能看到模糊的轮廓和隐约的色彩，作为主体的陪衬。

【景深与构图】
超浅景深，背景虚化到几乎只剩色块。Boss主体占据画面的80%以上空间，是绝对的视觉焦点。焦点在Boss的眼睛和面部核心特征上。整体色调为深灰和辐射绿，背景虚化为暗绿色和灰色的模糊色块。氛围压迫、恐怖。强调高分辨率，电影质感，超现实写实风格，摄影师风格。`,

    toxic_lord: `超写实风格，1024x1536竖屏立绘，废土末世世界观，近距离BOSS特写浅景深。

【主体特写】
有毒沼泽的最深处，沼泽统治者浮出水面，面部特写。体型庞大，约4米长，半水栖形态，像一头畸形的巨型鳄鱼。全身覆盖着深绿色的鳞片，鳞片之间渗出腐蚀性的绿色黏液，在空气中蒸腾出有毒的蒸汽。一对暗红色的眼睛在黑暗中发出微光，瞳孔是垂直的裂缝，充满冷血动物的冷酷，占据画面的焦点。巨大的口部能完全张开，露出满口倒刺状的毒牙，毒牙呈深紫色，不断滴落腐蚀性唾液。

【近景细节】
从这个距离可以看到鳞片上每一道腐蚀的痕迹，绿色的黏液从鳞片缝隙中渗出，在空气中蒸腾出诡异的蒸汽。眼睛中的瞳孔像一条垂直的裂缝，深邃而冷酷。毒牙上有螺旋形的凹槽，唾液从凹槽中滴落，在空中拉出丝线。毒气腺体在背部不断释放出绿色的毒雾。

【背景环境】
背景是有毒沼泽的深处——墨绿色的沼泽水，漂浮的腐烂植物残骸，枯死的扭曲树木。天空中被毒雾笼罩，呈现病态的黄色。所有背景元素都处于极度的虚化中，只能看到模糊的绿色和紫色色块。

【景深与构图】
超浅景深，背景虚化到几乎只剩色块。Boss主体占据画面的80%以上空间，是绝对的视觉焦点。焦点在Boss的眼睛和毒牙上。整体色调为深绿和毒紫，背景虚化为墨绿色和暗紫色的模糊色块。氛围阴森、腐败。强调高分辨率，电影质感，超现实写实风格，摄影师风格。`,

    steel_colossus: `超写实风格，1024x1536竖屏立绘，废土末世世界观，近距离BOSS特写浅景深。

【主体特写】
废弃的军事要塞深处，一台古老的战争机甲近距离特写。人形机甲形态，约6米高，像一座行走的废弃工厂。全身装甲已严重锈蚀，铁锈和苔藓覆盖了大部分表面，但仍在缓慢地行走和战斗。头部是残破的驾驶舱，面罩玻璃已经碎裂。两只红色的探照灯代替了眼睛，光芒闪烁不定，像是随时会熄灭的残烛，占据画面的焦点。

【近景细节】
从这个距离可以看到装甲上每一处锈蚀的细节——像是金属腐烂后留下的空洞和不规则的纹理。胸腔中央的暗红色能量核心近距离可见，光芒忽明忽暗，像垂死的心跳。断裂的能量管道不断喷出蒸汽和火花，火花在空气中跳跃。关节处的机械结构暴露在外，不断摩擦和运转。

【背景环境】
背景是废弃军事要塞的废墟——倒塌的混凝土掩体，锈蚀的铁丝网，废弃的军用车辆残骸。天空中是永久的阴霾或污染的云层。所有背景元素都处于极度的虚化中，只能看到模糊的灰色和暗红色块。

【景深与构图】
超浅景深，背景虚化到几乎只剩色块。Boss主体占据画面的80%以上空间，是绝对的视觉焦点。焦点在Boss的能量核心和探照灯眼睛上。整体色调为深灰和暗红，背景虚化为锈灰色和暗红色的模糊色块。氛围沉重、压抑。强调高分辨率，电影质感，超现实写实风格，摄影师风格。`,

    frost_dragon: `超写实风格，1024x1536竖屏立绘，废土末世世界观，近距离BOSS特写浅景深。

【主体特写】
冰封高原的最高峰，一头上古巨龙的遗骸近距离面部特写。巨龙形态，约8米翼展。全身覆盖着纯白与冰蓝相间的鳞片，鳞片呈半透明状，内部有冰晶结构在光线中闪烁。龙头狭长而威严，冰蓝色的鳞片覆盖着头部每个角落。两只眼睛是深蓝色的冰晶结构，能发射冰冻射线，眼眶周围有白色的霜花堆积，占据画面的焦点。

【近景细节】
从这个距离可以看到每一片鳞片的冰晶结构——像是无数钻石镶嵌在龙脸上，在光线下折射出七彩的光芒。鼻孔喷出的白色冻气清晰可见，在空气中形成冰晶。巨大的龙角由凝固的冰晶构成，顶端的冷气形成可见的白色雾气。鳞片边缘的冰霜清晰可见。

【背景环境】
背景是冰封高原的旷野——一望无际的冰雪平原，巨大的冰柱从地面突起，远处的雪山连绵起伏。天空中是纯净的冰蓝色，远处有暴风雪在酝酿。所有背景元素都处于极度的虚化中，只能看到模糊的白色和冰蓝色块。

【景深与构图】
超浅景深，背景虚化到几乎只剩色块。Boss主体占据画面的80%以上空间，是绝对的视觉焦点。焦点在Boss的冰晶眼睛和龙角上。整体色调为冰蓝和纯白，背景虚化为白色和浅蓝色的模糊色块。氛围寒冷、威严。强调高分辨率，电影质感，超现实写实风格，摄影师风格。`,

    lava_dragon: `超写实风格，1024x1536竖屏立绘，废土末世世界观，近距离BOSS特写浅景深。

【主体特写】
炽热火山的最深处，熔岩古龙近距离面部特写。巨龙形态，约7米长，由流动的熔岩和凝固的火山岩构成。身体核心是炽热的白金色火焰，从裂缝中透出，照亮周围的一切。龙头由凝固的火山岩构成，但岩浆不断从眼眶、嘴部和裂缝中涌出。两只眼睛是两团永不熄灭的金色火焰，在黑暗中燃烧得格外明亮，占据画面的焦点。

【近景细节】
从这个距离可以看到熔岩在龙脸上流动的每一处细节——凝固的外壳下是流动的炽热岩浆，裂缝中透出的光芒照亮周围的一切。口中喷出的热浪扭曲了空气。金色火焰在眼眶中燃烧，瞳孔是炽热的白色。鳞片状的岩浆外壳不断崩裂和重组，露出下面更炽热的岩浆层。

【背景环境】
背景是炽热火山的山坡——凝固的熔岩流，火山口冒出的烟雾，沸腾的岩浆池。天空中是浓重的火山灰云层。所有背景元素都处于极度的虚化中，只能看到模糊的红色和橙色色块，热浪扭曲了一切。

【景深与构图】
超浅景深，背景虚化到几乎只剩色块，热浪使一切背景都在轻微波动。Boss主体占据画面的80%以上空间，是绝对的视觉焦点。焦点在Boss的金色火焰眼睛上。整体色调为熔岩红和暗金，背景虚化为火红色和橙色的模糊色块。氛围炽热、毁灭。强调高分辨率，电影质感，超现实写实风格，摄影师风格。`,

    ancient_tree: `超写实风格，1024x1536竖屏立绘，废土末世世界观，近距离BOSS特写浅景深。

【主体特写】
幽暗森林的最深处，一棵活了几千年的古树近距离面部特写。巨型树人形态，约10米高，由无数藤蔓、树枝和扭曲的树根构成。躯干是一棵巨大的空心古树，内部燃烧着幽绿色的鬼火。面部由扭曲的树枝形成，似笑非笑的表情永远定格在脸上。两个眼眶是两团幽幽的绿色磷火，在黑暗中跳动，散发出令人不安的光芒，占据画面的焦点。

【近景细节】
从这个距离可以看到树皮上每一处裂纹和纹理——像是被岁月刻下的皱纹，也像是被吞噬生物留下的痕迹。眼眶中的磷火清晰可见，火焰中似乎有无数被吞噬灵魂的幻影。藤蔓从身体各部位伸出，像触手一样蠕动。树洞中透出的幽绿光芒照亮了周围的空间。苔藓和发光真菌覆盖了部分表面。

【背景环境】
背景是幽暗森林的深处——参天巨树遮蔽了天空，只有零星的光线从树冠缝隙中透入。到处是缠绕的藤蔓，发光的菌丝网络在黑暗中闪烁。空气中飘浮着发光的孢子，像是微型的星星。所有背景元素都处于极度的虚化中，只能看到模糊的深绿色块。

【景深与构图】
超浅景深，背景虚化到几乎只剩色块。Boss主体占据画面的80%以上空间，是绝对的视觉焦点。焦点在Boss的磷火眼眶上。整体色调为暗绿和幽绿，背景虚化为深绿色的模糊色块。氛围诡异、恐怖。强调高分辨率，电影质感，超现实写实风格，摄影师风格。`,

    mirage_lord: `超写实风格，1024x1536竖屏立绘，废土末世世界观，近距离BOSS特写浅景深。

【主体特写】
沙漠荒原的深处，蜃景幻主近距离特写。人形虚影形态，约3米高，身体呈半透明状，由流动的金色沙尘和热浪构成。身体轮廓不断波动和扭曲，像是由无数沙粒组成的幻影。面部模糊，只有轮廓隐约可见，但两只琥珀色的眼睛格外清晰，眼眸深邃而古老，占据画面的焦点。

【近景细节】
从这个距离可以看到金色沙尘在身体表面流动的每一处细节——像是河流在石头上刻下痕迹。琥珀色的眼睛深邃而古老，瞳孔中似乎有整个沙漠的倒影。长发由流动的沙粒组成，在热浪中形成美丽的弧线。身体周围有蜃景幻象环绕，显示出若隐若现的幻影。

【背景环境】
背景是沙漠荒原的深处——一望无际的金色沙丘，延绵到地平线。远处有几棵枯死的沙漠植物。天空中是炽热的蓝色，太阳高悬。热浪扭曲了一切空间。所有背景元素都处于极度的虚化中，只能看到模糊的金黄色块。

【景深与构图】
超浅景深，背景虚化到几乎只剩色块，热浪使一切都在轻微波动。Boss主体占据画面的80%以上空间，是绝对的视觉焦点。焦点在Boss的琥珀色眼睛上。整体色调为金色和琥珀色，背景虚化为金黄色的模糊色块。氛围虚幻、神秘。强调高分辨率，电影质感，超现实写实风格，摄影师风格。`,

    sea_leviathan: `超写实风格，1024x1536竖屏立绘，废土末世世界观，近距离BOSS特写浅景深。

【主体特写】
沉没都市的最深处，海皇利维坦近距离特写。巨型鲨鱼形态，约12米长，深蓝色的皮肤上有电弧在其上游走。头部呈流线型但布满建筑残骸。一只眼睛是沉没都市的路灯，发出幽蓝色的冷光；另一只眼睛已经破损，但仍有微弱的能量从中透出，占据画面的焦点。

【近景细节】
从这个距离可以看到皮肤上每一处建筑残骸融合的细节——破碎的玻璃幕墙、扭曲的钢筋、生锈的管道。电弧在皮肤上游走，发出微弱的蓝光，照亮周围的水域。口部巨大，满是生锈的金属碎片般的牙齿。鳞片边缘的金属覆盖像是生锈的盔甲。周围有发光的深海生物跟随——透明的水母在电弧的光芒中闪烁。

【背景环境】
背景是沉没都市的街道——被洪水淹没的城市，漂浮的汽车残骸，扭曲的霓虹灯。摩天楼的残骸从水面伸出。天空中透下微弱的光线。一切都在深蓝色的水中显得模糊不清。所有背景元素都处于极度的虚化中，只能看到模糊的深蓝色块。

【景深与构图】
超浅景深，背景虚化到几乎只剩色块。Boss主体占据画面的80%以上空间，是绝对的视觉焦点。焦点在Boss的电弧眼睛上。整体色调为深蓝和金属银，背景虚化为深蓝色的模糊色块。氛围压抑、深邃。强调高分辨率，电影质感，超现实写实风格，摄影师风格。`,

    matrix_mother: `超写实风格，1024x1536竖屏立绘，废土末世世界观，近距离BOSS特写浅景深。

【主体特写】
机械迷宫的最核心区域，超级计算机近距离特写。巨型立方体结构，约15米高，由无数服务器机柜堆叠而成。表面有无数闪烁的LED屏幕和指示灯，红色、绿色、蓝色的光芒在黑暗中不断闪烁。正面是一个巨大的全息投影球体，显示着不断变化的数据流、代码和界面元素，占据画面的焦点。

【近景细节】
从这个距离可以看到每一个LED指示灯的状态——红色、绿色、黄色不断闪烁和跳动。全息投影球体中的数据流清晰可见，像是瀑布一样倾泻而下。服务器机柜之间的缝隙中有冷却液在流动，发出蓝色的微光。四角的传感器阵列发出红色扫描光，不断追踪周围的空间。

【背景环境】
背景是机械迷宫的深处——巨大的服务器机房，排列成行的机柜延伸到黑暗中。地面是冷却液形成的浅池，反射着指示灯的光芒。到处是电缆和管道，从各个方向伸出。冷却风扇不断旋转，发出蓝色的冷光。所有背景元素都处于极度的虚化中，只能看到模糊的蓝色和灰色块。

【景深与构图】
超浅景深，背景虚化到几乎只剩色块。Boss主体占据画面的80%以上空间，是绝对的视觉焦点。焦点在Boss的全息投影球体上。整体色调为深蓝和暗红，背景虚化为深蓝色和灰色的模糊色块。氛围冰冷、压迫。强调高分辨率，电影质感，超现实写实风格，摄影师风格。`,

    void_herald: `超写实风格，1024x1536竖屏立绘，废土末世世界观，近距离BOSS特写浅景深。

【主体特写】
虚空裂隙的核心，维度撕裂者近距离面部特写。人形异次元生物，约4米高，身体呈不稳定状态，由黑色和紫色的虚空能量构成。身体的边缘不断崩解和重组。面部是一张不断变化的脸，时而狰狞，时而空洞，时而扭曲成不可能的几何形状。两只眼睛是两个白色的虚空裂隙，散发出刺眼的白光，占据画面的焦点。

【近景细节】
从这个距离可以看到虚空能量在身体表面流动的每一处细节——像是黑色的水流不断冲刷着物质的边缘，身体不断在虚与实之间切换。眼睛中的白色裂隙深邃而空洞，裂隙中似乎连接着另一个维度的空间。身体表面偶尔闪过其他维度的影像——火焰燃烧的世界、冰冷的水下城市、生机勃勃的森林——像是被它吞噬的其他世界的碎片。

【背景环境】
背景是虚空裂隙的地表——扭曲的空间，地表像破碎的镜子一样龟裂。到处是漂浮的维度碎片，像破碎的镜子碎片反射着不存在的光。空间在这里变得不稳定。远处的景观是扭曲的。一切都在维度崩塌的混乱中。所有背景元素都处于极度的虚化中，只能看到模糊的紫色和黑色块。

【景深与构图】
超浅景深，背景虚化到几乎只剩色块，空间的不稳定使一切都在轻微扭曲。Boss主体占据画面的80%以上空间，是绝对的视觉焦点。焦点在Boss的虚空双眼上。整体色调为暗紫和虚空黑，背景虚化为紫色和黑色的模糊色块。氛围诡异、不安。强调高分辨率，电影质感，超现实写实风格，摄影师风格。`
  };
  
  return prompts[portraitId] || `超写实风格，1024x1536竖屏立绘，废土末世世界观，近距离BOSS特写浅景深。${data.name}。Boss主体占据画面80%以上空间，背景极度虚化。强调高分辨率，电影质感，超现实写实风格，摄影师风格。`;
}

async function generateBoss(portraitId, data) {
  const targetPath = path.join(WILD_BOSS_DIR, `${portraitId}.png`);
  
  // 删除已存在的旧版本
  if (fs.existsSync(targetPath)) {
    fs.unlinkSync(targetPath);
    console.log('  🗑️  删除旧版本，准备重新生成...');
  }
  
  try {
    const workflow = readJson(WORKFLOW_PATH);
    const newWorkflow = {};
    
    for (const [key, node] of Object.entries(workflow)) {
      newWorkflow[key] = {
        class_type: node.class_type,
        inputs: { ...node.inputs }
      };
      const inputs = newWorkflow[key].inputs;
      
      if (key === '57:27' && inputs.text !== undefined) {
        inputs.text = getPrompt(portraitId, data);
      }
      
      if (key === '9' && inputs.filename_prefix !== undefined) {
        inputs.filename_prefix = portraitId;
      }
      
      if (key === '57:13') {
        if (inputs.width !== undefined) inputs.width = WIDTH;
        if (inputs.height !== undefined) inputs.height = HEIGHT;
      }
    }
    
    console.log(`  ⏳ 提交任务...`);
    const promptId = await submitPrompt(newWorkflow);
    console.log(`  ⏳ 等待生成...`);
    const history = await waitForCompletion(promptId);
    const images = getImages(history);
    
    if (images.length > 0) {
      if (copyImage(images[0], targetPath)) {
        return { success: true };
      }
    }
    
    return { success: false, error: '无输出图片' };
  } catch (e) {
    return { success: false, error: e.message };
  }
}

async function main() {
  console.log('\n' + '='.repeat(60));
  console.log('🔮 野外Boss立绘生成器 v3 - 近景特写 + 背景虚化');
  console.log('='.repeat(60) + '\n');
  
  const mapping = readJson(MAPPING_PATH);
  const wildBosses = Object.keys(mapping).filter(id => mapping[id].type === 'wildBoss');
  
  console.log(`📊 共 ${wildBosses.length} 个野外Boss\n`);
  
  let success = 0, failed = 0;
  
  for (let i = 0; i < wildBosses.length; i++) {
    const portraitId = wildBosses[i];
    const data = mapping[portraitId];
    
    console.log(`\n[${i + 1}/${wildBosses.length}] ${portraitId} (${data.name})`);
    
    const result = await generateBoss(portraitId, data);
    
    if (result.success) {
      console.log('  ✅ 成功');
      success++;
    } else {
      console.log(`  ❌ 失败: ${result.error}`);
      failed++;
    }
    
    if (i < wildBosses.length - 1) {
      await sleep(1000);
    }
  }
  
  console.log('\n' + '='.repeat(60));
  console.log(`✅ 完成: 成功 ${success} | 失败 ${failed}`);
  console.log('='.repeat(60) + '\n');
}

main().catch(console.error);
