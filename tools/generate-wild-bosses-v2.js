#!/usr/bin/env node
// -*- coding: utf-8 -*-
/**
 * 野外Boss立绘生成器 v2 - 增强版环境背景
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
  // 增强版提示词 - 增加野外环境细节
  const prompts = {
    radiation_beast: `超写实风格，1024x1536竖屏立绘，废土末世世界观，野外BOSS战斗场景。

【主体生物】
核战后的废墟旷野中，一头由核辐射造就的巨型变异生物正在咆哮。体型巨大，约5米高，四足行走姿态，像一头畸形的巨型野牛。全身覆盖着深灰色的变异皮肤，皮肤表面布满发光的辐射裂纹，裂纹中透出幽绿色的辐射光芒，在黑暗中像燃烧的脉络一样跳动。两只眼睛已经从正常的眼睛变异为两个燃烧着幽绿色火焰的空洞。

【野外环境互动】
背景是辐射废墟的旷野——巨大的弹坑，弹坑边缘是熔化的玻璃和扭曲的钢筋。远处是被核爆摧毁的建筑残骸，窗户空洞洞地张着，像骷髅的眼眶。地面是龟裂的黄土，被辐射污染成灰绿色，到处散落着生锈的汽车残骸、破碎的混凝土块、融化的玻璃碎片。天空中有扭曲的辐射云层，发出诡异的绿色荧光，照亮整个废墟。一轮暗淡的太阳在辐射云后挣扎。

【战斗氛围】
周围有飘浮的辐射尘埃粒子，在它的身体周围形成一层幽绿色的光晕。地面因它走动而震动，脚印深陷在辐射污染的土地中，留下发光的辐射痕迹。远处的废墟建筑在它的吼声中颤抖。沙尘被它的脚步扬起，混着辐射尘埃。

【整体色调】
整体色调为深灰和辐射绿，低饱和度的灰绿色废墟背景中，高饱和度的辐射绿裂纹光芒形成视觉焦点。氛围压迫、恐怖、有末日废土的荒凉感。强调高分辨率，电影质感，超现实写实风格，摄影师风格。背景虚化突出生物主体。`,

    toxic_lord: `超写实风格，1024x1536竖屏立绘，废土末世世界观，野外BOSS战斗场景。

【主体生物】
有毒沼泽的最深处，沼泽统治者浮出水面。体型庞大，约4米长，半水栖形态，像一头畸形的巨型鳄鱼与沼泽本身的融合体。全身覆盖着深绿色的鳞片，鳞片之间渗出腐蚀性的绿色黏液，在空气中蒸腾出有毒的蒸汽。一对暗红色的眼睛在黑暗中发出微光，瞳孔是垂直的裂缝，充满冷血动物的冷酷。

【野外环境互动】
背景是有毒沼泽的深处——墨绿色的沼泽水没过膝盖，水面漂浮着腐烂的植物残骸、死去的动物尸体、发霉的木块。远处有枯死的扭曲树木，树干上挂满了黑色的藤蔓和死亡的水草。天空被毒雾笼罩，呈现病态的黄色。地面是腐烂的植物残骸和黏稠的沼泽污泥，每走一步都会陷入半米深。水面不断冒出有毒的气泡，破裂时释放出绿色的毒气。到处散落着陷入沼泽的生物骨架——汽车残骸只露出一角，扭曲的人形物体若隐若现。

【战斗氛围】
周围有飘浮的毒雾，在它的身体周围形成朦胧的绿色光晕。沼泽水因它的存在而呈现病态的绿色，水面不断冒出有毒的气泡。毒气从水面升起，与天空的毒雾连成一片。周围的水被它的体温加热，冒着热气。

【整体色调】
整体色调为深绿和毒紫，低饱和度的墨绿色沼泽背景中，高饱和度的毒紫毒液光芒形成视觉焦点。氛围阴森、腐败、有毒物弥漫的窒息感。强调高分辨率，电影质感，超现实写实风格，摄影师风格。背景虚化突出生物主体。`,

    steel_colossus: `超写实风格，1024x1536竖屏立绘，废土末世世界观，野外BOSS战斗场景。

【主体生物】
废弃的军事要塞深处，一台古老的战争机甲正在巡视它的领地。人形机甲形态，约6米高，像一座行走的废弃工厂。全身装甲已严重锈蚀，铁锈和苔藓覆盖了大部分表面。两只红色的探照灯代替了眼睛，光芒闪烁不定，像是随时会熄灭的残烛。胸腔中央有一个暗红色的能量核心在脉动，光芒忽明忽暗，像垂死的心跳。

【野外环境互动】
背景是废弃军事要塞的废墟——倒塌的混凝土掩体，散落的沙袋，锈蚀的铁丝网。到处是废弃的军用车辆残骸——坦克的炮塔歪向一边，装甲车被炸成两半，直升机的螺旋桨斜插在废墟中。巨大的弹坑穿插其间，弹坑中有积水。扭曲的钢筋从地面伸出，生锈的武器散落一地。远处是被摧毁的军事建筑，墙体布满弹孔和爆炸痕迹。天空阴沉沉的，可能是永久的阴霾或污染的云层。

【战斗氛围】
右臂的导弹发射器残破但仍在运作，偶尔有几枚生锈的导弹发射出去。背部有断裂的能量管道，不断喷出蒸汽和火花。行走时发出刺耳的金属摩擦声。地面被它的脚步压出深深的凹痕。火花从关节处飞出，照亮锈蚀的装甲缝隙。

【整体色调】
整体色调为深灰和暗红，低饱和度的锈灰色军事废墟背景中，高饱和度的暗红能量核心光芒形成视觉焦点。氛围沉重、压抑、有战争遗留的残骸感。强调高分辨率，电影质感，超现实写实风格，摄影师风格。背景虚化突出生物主体。`,

    frost_dragon: `超写实风格，1024x1536竖屏立绘，废土末世世界观，野外BOSS战斗场景。

【主体生物】
冰封高原的最高峰，一头上古巨龙的遗骸正在重新苏醒。巨龙形态，约8米翼展，像一座冰封的雪山。全身覆盖着纯白与冰蓝相间的鳞片，鳞片呈半透明状，内部有冰晶结构在光线中闪烁。两只眼睛是深蓝色的冰晶结构，能发射冰冻射线。呼吸时喷出白色的冻气。

【野外环境互动】
背景是冰封高原的旷野——一望无际的冰雪平原，白雪覆盖着冻土，在阳光下反射出刺眼的光芒。巨大的冰柱从地面突起，像是死去的巨兽骨骼。远处的雪山连绵起伏，山顶被永久的冰雪覆盖。到处是被冻结的树木，树枝上挂满冰凌，像是水晶雕刻。地面有巨大的裂缝，冰层下的湖水呈现深蓝色。天空是纯净的冰蓝色，但远处有暴风雪在酝酿。

【战斗氛围】
周围有飘浮的冰晶雪花，在它的翅膀扇动下形成壮观的雪暴。呼吸时喷出白色的冻气，能在瞬间冻结前方的一切。地面因它的存在而结出厚厚的冰层，向四周蔓延。寒气形成可见的白雾，在阳光下闪闪发光。冰霜从它的脚步向外扩散，覆盖一切。

【整体色调】
整体色调为冰蓝和纯白，低饱和度的冰蓝色高原背景中，高饱和度的纯白冰雪和冰蓝龙眼形成视觉焦点。氛围寒冷、威严、有上古巨龙的压迫感。强调高分辨率，电影质感，超现实写实风格，摄影师风格。背景虚化突出生物主体。`,

    lava_dragon: `超写实风格，1024x1536竖屏立绘，废土末世世界观，野外BOSS战斗场景。

【主体生物】
炽热火山的最深处，熔岩池中有什么东西正在苏醒。巨龙形态，约7米长，由流动的熔岩和凝固的火山岩构成。身体核心是炽热的白金色火焰，从裂缝中透出，照亮周围的一切。两只眼睛是两团永不熄灭的金色火焰。

【野外环境互动】
背景是炽热火山的山坡——凝固的熔岩流像灰色的河流从山顶蔓延而下，表面是龟裂的灰色外壳。到处都是火山口和冒烟的裂缝，空气中弥漫着硫磺的刺鼻气味。地面是红黑色的半熔融状态，表面有蒸汽不断升起。天空中是浓重的火山灰云层，遮蔽了大半天空，火山灰像灰色的雪一样飘落。远处有熔岩瀑布从悬崖流下，发出橙红色的光芒。

【战斗氛围】
周围地面因高温而呈现红黑色，处于半熔融状态。空气中弥漫着硫磺和火焰的气息。熔岩从它的身体滴落，在地面形成新的熔岩池。热浪扭曲了周围的空气，使背景不断波动。火山灰在热气流中旋转，形成灰色的漩涡。

【整体色调】
整体色调为熔岩红和暗金，低饱和度的暗红色火山背景中，高饱和度的白金色熔岩核心光芒形成视觉焦点。氛围炽热、毁灭、有火焰之王的威严感。强调高分辨率，电影质感，超现实写实风格，摄影师风格。背景虚化突出生物主体。`,

    ancient_tree: `超写实风格，1024x1536竖屏立绘，废土末世世界观，野外BOSS战斗场景。

【主体生物】
幽暗森林的最深处，一棵活了几千年的古树展现出了它的真正形态。巨型树人形态，约10米高，由无数藤蔓、树枝和扭曲的树根构成。躯干是一棵巨大的空心古树，内部燃烧着幽绿色的鬼火。两个眼眶是两团幽幽的绿色磷火。

【野外环境互动】
背景是幽暗森林的深处——参天巨树遮蔽了天空，只有零星的光线从树冠缝隙中透入。地面覆盖着厚厚的腐殖土，苔藓和蘑菇在阴暗处生长。到处是缠绕的藤蔓，从地面、树干、树枝上垂下，像是无数的手臂。枯死的树木被藤蔓覆盖，形成诡异的人形轮廓。到处是发光的菌丝网络，在黑暗中发出幽绿色的微光。空气中飘浮着发光的孢子，像是微型的星星。

【战斗氛围】
无数藤蔓从身体各部位伸出，像触手一样蠕动，随时准备捕捉猎物。周围有飘浮的孢子，在磷火的照耀下形成绿色的星尘。根系在地面蔓延，部分根系是埋藏的尸骨——有生锈的武器、人骨的碎片、破烂的衣物。地面因它的存在而微微震动。

【整体色调】
整体色调为暗绿和幽绿，低饱和度的深绿色森林背景中，高饱和度的幽绿磷火和发光真菌形成视觉焦点。氛围诡异、恐怖、有被自然吞噬的绝望感。强调高分辨率，电影质感，超现实写实风格，摄影师风格。背景虚化突出生物主体。`,

    mirage_lord: `超写实风格，1024x1536竖屏立绘，废土末世世界观，野外BOSS战斗场景。

【主体生物】
沙漠荒原的深处，蜃景开始扭曲，一位不属于这个世界的神秘存在显现。人形虚影形态，约3米高，身体呈半透明状，由流动的金色沙尘和热浪构成。两只琥珀色的眼睛格外清晰，眼眸深邃而古老。

【野外环境互动】
背景是沙漠荒原的深处——一望无际的金色沙丘，延绵到地平线。沙丘在热浪中不断变幻形状，像流动的金色海洋。远处有几棵枯死的沙漠植物——扭曲的枯木、仙人掌的残骸。天空是炽热的蓝色，太阳高悬，强烈地照射着大地。地面温度极高，热浪扭曲了空气，使地平线不断波动。到处是被风沙掩埋的废墟残骸——半埋在沙中的建筑废墟、风化的石块、暴露的钢筋。

【战斗氛围】
身体周围有蜃景幻象环绕，显示出沙漠中不存在的美丽绿洲和幻想中的城市轮廓。地面因热浪而扭曲，空间在它周围产生折射效果。背后有若隐若现的蜃景宫殿虚影，像是来自另一个世界的投影。沙尘被热气流卷起，在它周围旋转。

【整体色调】
整体色调为金色和琥珀色，低饱和度的黄沙色沙漠背景中，高饱和度的金色蜃景幻象和琥珀色双眼形成视觉焦点。氛围虚幻、神秘、有海市蜃楼的不真实感。强调高分辨率，电影质感，超现实写实风格，摄影师风格。背景虚化突出生物主体。`,

    sea_leviathan: `超写实风格，1024x1536竖屏立绘，废土末世世界观，野外BOSS战斗场景。

【主体生物】
沉没都市的最深处，曾经的海洋霸主正在巡视它的水下王国。巨型鲨鱼形态，约12米长，深蓝色的皮肤上有电弧在其上游走。身体与沉没建筑的残骸融合。一只眼睛是沉没都市的路灯，发出幽蓝色的冷光。

【野外环境互动】
背景是沉没都市的街道——被洪水淹没的城市，汽车漂浮在水中或沉在底部，广告牌半沉半浮，扭曲的霓虹灯仍在闪烁。摩天楼的残骸从水面伸出，玻璃幕墙破碎不堪，钢筋从混凝土中伸出。街道上散落着各种生活用品——自行车、椅子、电视机、书籍——都被水浸泡得面目全非。水很浑浊，能见度很低，只有微弱的光线从水面透入。

【战斗氛围】
周围有发光的深海生物跟随——透明的水母、发光的鱼群、闪烁的乌贼。水中飘浮着各种沉没物品的残骸。它游动时，周围的水会因电弧而发出微弱的荧光。漩涡从它的游动中产生，搅动水中的沉积物。水下气泡不断上升，破碎时发出咕噜声。

【整体色调】
整体色调为深蓝和金属银，低饱和度的深蓝色沉没城市背景中，高饱和度的幽蓝冷光和银白金属形成视觉焦点。氛围压抑、深邃、有被遗忘的水下王国感。强调高分辨率，电影质感，超现实写实风格，摄影师风格。背景虚化突出生物主体。`,

    matrix_mother: `超写实风格，1024x1536竖屏立绘，废土末世世界观，野外BOSS战斗场景。

【主体生物】
机械迷宫的最核心区域，一台觉醒的超级计算机将入侵者视为需要清除的病毒。巨型立方体结构，约15米高，由无数服务器机柜堆叠而成。表面有无数闪烁的LED屏幕和指示灯，红色、绿色、蓝色的光芒在黑暗中不断闪烁。正面是一个巨大的全息投影球体，显示着不断变化的数据流。

【野外环境互动】
背景是机械迷宫的深处——巨大的服务器机房，服务器机柜排列成行延伸到黑暗中。地面是冷却液形成的浅池，反射着蓝色和绿色的指示灯。到处是电缆和管道，从天花板、墙壁、地板中伸出，杂乱无章地交织在一起。冷却风扇不断旋转，发出低沉的嗡嗡声。空气中弥漫着臭氧的气味和电子元件的热量。

【战斗氛围】
四角有重型的武器系统——导弹发射器、激光炮、电磁脉冲发射器。这些武器系统会追踪任何移动的目标。周围有无数小型无人机和机械臂环绕，准备执行核心AI下达的任何命令。立方体底部的接口不断有能量流动，照亮周围的电缆。

【整体色调】
整体色调为深蓝和暗红，低饱和度的深灰色机械背景中，高饱和度的蓝色数据流和暗红武器光芒形成视觉焦点。氛围冰冷、压迫、有AI觉醒的恐怖感。强调高分辨率，电影质感，超现实写实风格，摄影师风格。背景虚化突出生物主体。`,

    void_herald: `超写实风格，1024x1536竖屏立绘，废土末世世界观，野外BOSS战斗场景。

【主体生物】
虚空裂隙的核心，一位来自异次元的信使正在穿越维度的壁垒。人形异次元生物，约4米高，身体呈不稳定状态，由黑色和紫色的虚空能量构成。身体的边缘不断崩解和重组。两只眼睛是两个白色的虚空裂隙，散发出刺眼的白光。

【野外环境互动】
背景是虚空裂隙的地表——扭曲的空间，地表像破碎的镜子一样龟裂，裂缝中透出深紫色的虚空能量。到处是漂浮的维度碎片，像破碎的镜子碎片反射着不存在的光。空间在这里变得不稳定，有的地方被拉伸，有的地方被压缩。远处的景观是扭曲的——树木可能是倒置的，建筑可能是倾斜的，天空可能是地面的镜像。

【战斗氛围】
周围空间不断扭曲，有维度碎片飘浮在空中，像破碎的镜子碎片反射着不存在的光。地面在它脚下呈现龟裂状态，裂缝中透出深紫色的虚空能量。身体表面偶尔闪过其他维度的影像——有火焰燃烧的世界、冰冷的水下城市、生机勃勃的森林——像是被它吞噬的其他世界。维度碎片在它周围旋转，发出玻璃破碎般的声音。

【整体色调】
整体色调为暗紫和虚空黑，低饱和度的扭曲空间背景中，高饱和度的白色虚空裂隙双眼和紫色维度碎片形成视觉焦点。氛围诡异、不安、有维度崩塌的超现实感。强调高分辨率，电影质感，超现实写实风格，摄影师风格。背景虚化突出生物主体。`
  };
  
  return prompts[portraitId] || `超写实风格，1024x1536竖屏立绘，废土末世世界观，野外BOSS战斗场景。${data.name}。强调高分辨率，电影质感，超现实写实风格，摄影师风格。背景虚化突出生物主体。`;
}

async function generateBoss(portraitId, data) {
  const targetPath = path.join(WILD_BOSS_DIR, `${portraitId}.png`);
  
  // 跳过已存在的
  if (fs.existsSync(targetPath)) {
    return { skipped: true };
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
  console.log('🔮 野外Boss立绘生成器 v2 - 增强版环境背景');
  console.log('='.repeat(60) + '\n');
  
  const mapping = readJson(MAPPING_PATH);
  const wildBosses = Object.keys(mapping).filter(id => mapping[id].type === 'wildBoss');
  
  console.log(`📊 共 ${wildBosses.length} 个野外Boss\n`);
  
  let success = 0, failed = 0, skipped = 0;
  
  for (let i = 0; i < wildBosses.length; i++) {
    const portraitId = wildBosses[i];
    const data = mapping[portraitId];
    
    console.log(`\n[${i + 1}/${wildBosses.length}] ${portraitId} (${data.name})`);
    
    const result = await generateBoss(portraitId, data);
    
    if (result.skipped) {
      console.log('  ⏭️  跳过（已存在）');
      skipped++;
    } else if (result.success) {
      console.log('  ✅ 成功');
      success++;
    } else {
      console.log(`  ❌ 失败: ${result.error}`);
      failed++;
    }
    
    if (i < wildBosses.length - 1 && !result.skipped) {
      await sleep(1000);
    }
  }
  
  console.log('\n' + '='.repeat(60));
  console.log(`✅ 完成: 成功 ${success} | 失败 ${failed} | 跳过 ${skipped}`);
  console.log('='.repeat(60) + '\n');
}

main().catch(console.error);
